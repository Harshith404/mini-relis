import 'dotenv/config'
import { PgBoss } from 'pg-boss'
import { GoogleGenAI } from '@google/genai'
import { prisma } from './db.js'
import { parseAiResponse, isTemporaryError, type AiResult } from './aiParser.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required for pg-boss')
}

export const boss = new PgBoss(connectionString)

boss.on('error', (err) => {
  console.error('[Queue Error]', err)
})

export const QUEUE_NAME = 'ai-screening'
const MODEL_NAME = 'gemini-3.5-flash'
const RATE_LIMIT_DELAY_MS = 12000 // 12 seconds (~5 requests per minute for Gemini free tier)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function startWorker() {
  await boss.start()
  
  // Configure queue with exponential backoff retries:
  // Initial retry delay 15 seconds, doubled with exponential backoff on subsequent retries
  await boss.createQueue(QUEUE_NAME, {
    retryLimit: 3,
    retryDelay: 15,
    retryBackoff: true,
  })

  // Process strictly one AI job at a time (batchSize: 1)
  await boss.work<{ paperId: string }>(QUEUE_NAME, { batchSize: 1 }, async (jobs) => {
    for (const job of jobs) {
      const { paperId } = job.data

      const paper = await prisma.paper.findUnique({ where: { id: paperId } })
      if (!paper) {
        console.warn(`[Queue] Paper ${paperId} not found`)
        continue
      }

      // Fetch review topic and criteria (or fallback to defaults)
      const settings = await prisma.reviewSettings.findFirst()
      const topic = settings?.topic || 'Do AI coding assistants help developers work faster or write better code?'
      const inclusion = settings?.inclusionCriteria || 'Empirical studies, experiments, or surveys measuring developer productivity, code quality, or development speed using AI coding assistants.'
      const exclusion = settings?.exclusionCriteria || 'Non-software engineering domains, papers without empirical developer evaluations, or general AI papers unrelated to code generation tools.'

      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        const errorMsg = 'GEMINI_API_KEY is not configured in .env'
        console.error(`[Queue] ${errorMsg}`)
        await prisma.paper.update({
          where: { id: paperId },
          data: {
            aiSuggestion: 'FAILED',
            aiError: errorMsg,
            aiReason: null,
            aiModel: MODEL_NAME,
          },
        })
        return
      }

      const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' })

      const prompt = `You are an academic researcher screening papers for a Systematic Literature Review.

REVIEW TOPIC:
"${topic}"

INCLUSION CRITERIA:
${inclusion}

EXCLUSION CRITERIA:
${exclusion}

PAPER TO SCREEN:
Title: ${paper.title}
Abstract: ${paper.abstract}
Venue: ${paper.venue} (${paper.year})
Authors: ${paper.authors}

INSTRUCTIONS:
1. Carefully compare this paper against the Review Topic and Inclusion/Exclusion Criteria.
2. If the paper does NOT directly address the review topic, or meets any exclusion criteria, you MUST answer EXCLUDE with a concise reason.
3. Suggest INCLUDE ONLY if the paper clearly fits the review topic and meets the inclusion criteria.
4. Keep the reason concise (1-2 sentences).

Return ONLY a JSON object with this exact shape:
{"suggestion": "INCLUDE", "reason": "concise explanation"}
or
{"suggestion": "EXCLUDE", "reason": "concise explanation"}`

      try {
        let validResult: AiResult | null = null
        let parseAttempts = 0
        const maxParseAttempts = 2 // Parse errors: retry once ("bad answer, retry once")
        let lastRawText = ''

        while (parseAttempts < maxParseAttempts && !validResult) {
          parseAttempts++
          
          const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          })

          lastRawText = response.text || ''
          validResult = parseAiResponse(lastRawText)

          if (!validResult && parseAttempts < maxParseAttempts) {
            console.warn(`[Queue] Attempt ${parseAttempts} returned invalid JSON; retrying once...`)
            await sleep(2000)
          }
        }

        // If JSON remained invalid after retry, mark as failed permanently with aiError
        if (!validResult) {
          const parseErrorMsg = `AI returned invalid or unparseable answer after retry. Raw response snippet: "${lastRawText.trim().slice(0, 120)}"`
          console.warn(`[Queue] Paper ${paperId}: ${parseErrorMsg}`)
          await prisma.paper.update({
            where: { id: paperId },
            data: {
              aiSuggestion: 'FAILED',
              aiError: parseErrorMsg,
              aiReason: null,
              aiModel: MODEL_NAME,
            },
          })
          // Rate-limit throttle before allowing next job
          await sleep(RATE_LIMIT_DELAY_MS)
          return
        }

        // Successful screening
        await prisma.paper.update({
          where: { id: paperId },
          data: {
            aiSuggestion: validResult.suggestion,
            aiReason: validResult.reason,
            aiError: null,
            aiModel: MODEL_NAME,
          },
        })

        console.log(`[Queue] Saved AI suggestion for paper ${paperId}: ${validResult.suggestion}`)
      } catch (err: any) {
        const errMsg = String(err?.message || err)

        if (isTemporaryError(err)) {
          // 429 (Rate Limit) or 503 (Service Unavailable): treat as temporary, retry later
          const retryCount = job.retryCount || 0
          if (retryCount < 3) {
            console.warn(`[Queue] Temporary API error (429/503) on paper ${paperId} (retry ${retryCount + 1}/3). Retrying with backoff...`)
            await prisma.paper.update({
              where: { id: paperId },
              data: {
                aiError: `Temporary rate limit or service delay (429/503). Retrying with exponential backoff (attempt ${retryCount + 1}/3)...`,
              },
            })
            // Enforce rate-limit sleep so we don't trigger further 429s immediately
            await sleep(RATE_LIMIT_DELAY_MS)
            // Rethrow so pg-boss reschedules the job with exponential backoff
            throw err
          } else {
            // Retries exhausted
            console.error(`[Queue] 429/503 error persisted after ${retryCount} retries on paper ${paperId}`)
            await prisma.paper.update({
              where: { id: paperId },
              data: {
                aiSuggestion: 'FAILED',
                aiError: `Rate limit or service unavailable (429/503) persisted after 3 retries: ${errMsg.slice(0, 150)}`,
                aiReason: null,
                aiModel: MODEL_NAME,
              },
            })
            await sleep(RATE_LIMIT_DELAY_MS)
            return
          }
        } else {
          // Other unexpected error: fail permanently and record reason
          console.error(`[Queue] Non-retryable error on paper ${paperId}:`, errMsg)
          await prisma.paper.update({
            where: { id: paperId },
            data: {
              aiSuggestion: 'FAILED',
              aiError: `Unexpected screening failure: ${errMsg.slice(0, 150)}`,
              aiReason: null,
              aiModel: MODEL_NAME,
            },
          })
          await sleep(RATE_LIMIT_DELAY_MS)
          return
        }
      }

      // Respect Gemini free tier limit: wait ~12s between jobs
      await sleep(RATE_LIMIT_DELAY_MS)
    }
  })
}
