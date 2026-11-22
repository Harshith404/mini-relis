import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { prisma } from './db.js'
import { createPaperSchema, updateDecisionSchema, reviewSettingsSchema } from './schemas.js'
import { boss, QUEUE_NAME, startWorker } from './queue.js'

const app = new Hono()

// Enable CORS
app.use('*', cors())

// Default Review Settings
const DEFAULT_SETTINGS = {
  id: 'default',
  topic: 'Do AI coding assistants help developers work faster or write better code?',
  inclusionCriteria: 'Empirical studies, experiments, or surveys measuring developer productivity, code quality, or development speed using AI coding assistants.',
  exclusionCriteria: 'Non-software engineering domains, papers without empirical developer evaluations, or general AI papers unrelated to code generation tools.',
}

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// GET /settings - Fetch current review settings (or creates default)
app.get('/settings', async (c) => {
  let settings = await prisma.reviewSettings.findUnique({ where: { id: 'default' } })
  if (!settings) {
    settings = await prisma.reviewSettings.create({
      data: DEFAULT_SETTINGS,
    })
  }
  return c.json(settings)
})

// PUT /settings - Update review topic and criteria
app.put('/settings', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const result = reviewSettingsSchema.safeParse(body)

  if (!result.success) {
    return c.json(
      {
        error: 'Validation failed',
        details: result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      },
      400
    )
  }

  const updated = await prisma.reviewSettings.upsert({
    where: { id: 'default' },
    update: result.data,
    create: { id: 'default', ...result.data },
  })

  return c.json(updated)
})

// GET /papers - List all papers with optional limit & offset pagination
app.get('/papers', async (c) => {
  const limitParam = c.req.query('limit')
  const offsetParam = c.req.query('offset')

  const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : undefined
  const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : undefined

  const [papers, total] = await Promise.all([
    prisma.paper.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.paper.count(),
  ])

  return c.json({ papers, total, limit, offset })
})

// POST /papers - Create a new paper
app.post('/papers', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const result = createPaperSchema.safeParse(body)

  if (!result.success) {
    return c.json(
      {
        error: 'Validation failed',
        details: result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      },
      400
    )
  }

  const paper = await prisma.paper.create({
    data: result.data,
  })
  return c.json(paper, 201)
})

// PATCH /papers/:id/decision - Set human decision (INCLUDED or EXCLUDED) with reason
app.patch('/papers/:id/decision', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const result = updateDecisionSchema.safeParse(body)

  if (!result.success) {
    return c.json(
      {
        error: 'Validation failed',
        details: result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      },
      400
    )
  }

  const existing = await prisma.paper.findUnique({ where: { id } })
  if (!existing) {
    return c.json({ error: `Paper with id "${id}" not found` }, 404)
  }

  const updated = await prisma.paper.update({
    where: { id },
    data: {
      status: result.data.status,
      decisionReason: result.data.decisionReason,
    },
  })

  return c.json(updated)
})

// POST /papers/:id/ai-suggest - Queue / re-run AI suggestion background job
app.post('/papers/:id/ai-suggest', async (c) => {
  const id = c.req.param('id')

  const paper = await prisma.paper.findUnique({ where: { id } })
  if (!paper) {
    return c.json({ error: `Paper with id "${id}" not found` }, 404)
  }

  // Clear previous AI suggestion and mark as QUEUED
  await prisma.paper.update({
    where: { id },
    data: {
      aiSuggestion: 'QUEUED',
      aiReason: 'AI suggestion is processing in background queue...',
      aiError: null,
      aiModel: null,
    },
  })

  // Enqueue background job in pg-boss with exponential backoff
  await boss.send(
    QUEUE_NAME,
    { paperId: id },
    {
      retryLimit: 3,
      retryDelay: 15,
      retryBackoff: true,
    }
  )

  return c.json({ message: 'AI suggestion queued', paperId: id }, 202)
})

// POST /papers/re-run-ai - Clear and re-queue AI suggestions for all pending papers
app.post('/papers/re-run-ai', async (c) => {
  const pending = await prisma.paper.findMany({
    where: { status: 'PENDING' },
  })

  for (const paper of pending) {
    await prisma.paper.update({
      where: { id: paper.id },
      data: {
        aiSuggestion: 'QUEUED',
        aiReason: 'AI suggestion is processing in background queue...',
        aiError: null,
        aiModel: null,
      },
    })
    await boss.send(
      QUEUE_NAME,
      { paperId: paper.id },
      {
        retryLimit: 3,
        retryDelay: 15,
        retryBackoff: true,
      }
    )
  }

  return c.json({ count: pending.length, message: `Re-queued AI screening for ${pending.length} pending papers` })
})

const port = Number(process.env.PORT) || 3000
console.log(`Server is running on http://localhost:${port}`)

// Start pg-boss background worker
startWorker().catch((err) => {
  console.error('[Queue] Failed to initialize worker:', err)
})

serve({
  fetch: app.fetch,
  port,
})
