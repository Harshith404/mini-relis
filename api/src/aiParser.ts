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
