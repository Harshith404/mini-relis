import { z } from 'zod'

export const aiResponseSchema = z.object({
  suggestion: z.enum(['INCLUDE', 'EXCLUDE']),
  reason: z.string().trim().min(1, 'Reason cannot be empty'),
})

export type AiResult = z.infer<typeof aiResponseSchema>

export function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/)
  return match ? match[0] : text
}

export function parseAiResponse(text: string): AiResult | null {
  try {
    const jsonStr = extractJson(text)
    const parsed = JSON.parse(jsonStr)
    const result = aiResponseSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function isTemporaryError(err: unknown): boolean {
  if (!err) return false
  const anyErr = err as Record<string, any>
  const status = anyErr.status || anyErr.statusCode || anyErr.code
  if (status === 429 || status === 503) return true

  const msg = String(anyErr.message || err).toUpperCase()
  return (
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('QUOTA') ||
    msg.includes('RATE LIMIT')
  )
}
