import 'dotenv/config'
import { PgBoss } from 'pg-boss'
import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { prisma } from './db.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required for pg-boss')
}

export const boss = new PgBoss(connectionString)

boss.on('error', (err) => {
  console.error('[Queue Error]', err)
})

export const QUEUE_NAME = 'ai-screening'
const MODEL_NAME = 'gemini-2.5-flash'

const aiResponseSchema = z.object({
  suggestion: z.enum(['INCLUDE', 'EXCLUDE']),
  reason: z.string().trim().min(1, 'Reason cannot be empty'),
})

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/)
  return match ? match[0] : text
}

export async function startWorker() {
  await boss.start()
  await boss.createQueue(QUEUE_NAME)

  await boss.work<{ paperId: string }>(QUEUE_NAME, async (jobs) => {
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
        console.error('[Queue] GEMINI_API_KEY not configured in .env')
        await prisma.paper.update({
          where: { id: paperId },
          data: {
            aiSuggestion: 'FAILED',
            aiReason: 'GEMINI_API_KEY is not configured in .env',
            aiModel: MODEL_NAME,
          },
        })
        throw new Error('GEMINI_API_KEY missing')
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

      let validResult: z.infer<typeof aiResponseSchema> | null = null
      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts && !validResult) {
        attempts++
        try {
          const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          })

          const text = response.text || ''
          const jsonStr = extractJson(text)
          const parsed = JSON.parse(jsonStr)
          const result = aiResponseSchema.safeParse(parsed)

          if (result.success) {
            validResult = result.data
          } else {
            console.warn(`[Queue] Attempt ${attempts} invalid JSON structure:`, result.error.issues)
          }
        } catch (err: any) {
          console.warn(`[Queue] Attempt ${attempts} failed:`, err?.message || err)
        }
      }

      if (!validResult) {
        await prisma.paper.update({
          where: { id: paperId },
          data: {
            aiSuggestion: 'FAILED',
            aiReason: 'AI response failed schema validation or rate limit after retries.',
            aiModel: MODEL_NAME,
          },
        })
        throw new Error(`AI screening failed validation after ${maxAttempts} attempts`)
      }

      await prisma.paper.update({
        where: { id: paperId },
        data: {
          aiSuggestion: validResult.suggestion,
          aiReason: validResult.reason,
          aiModel: MODEL_NAME,
        },
      })

      console.log(`[Queue] Saved AI suggestion for paper ${paperId}: ${validResult.suggestion}`)
    }
  })
}
