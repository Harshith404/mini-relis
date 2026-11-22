import { describe, it, expect } from 'vitest'
import { parseAiResponse, extractJson } from '../aiParser.js'

describe('parseAiResponse (LLM JSON Parser)', () => {
  it('correctly parses valid raw JSON with INCLUDE', () => {
    const input = '{"suggestion": "INCLUDE", "reason": "Empirical study on developer velocity."}'
    const result = parseAiResponse(input)
    expect(result).toEqual({
      suggestion: 'INCLUDE',
      reason: 'Empirical study on developer velocity.',
    })
  })

  it('correctly parses valid raw JSON with EXCLUDE', () => {
    const input = '{"suggestion": "EXCLUDE", "reason": "Off-topic medical domain."}'
    const result = parseAiResponse(input)
    expect(result).toEqual({
      suggestion: 'EXCLUDE',
      reason: 'Off-topic medical domain.',
    })
  })

  it('extracts and parses JSON wrapped in markdown code blocks or conversational text', () => {
    const input = `Here is my evaluation of the paper:
\`\`\`json
{
  "suggestion": "INCLUDE",
  "reason": "Directly evaluates developer productivity with LLMs."
}
\`\`\`
Let me know if you need more details!`

    const result = parseAiResponse(input)
    expect(result).toEqual({
      suggestion: 'INCLUDE',
      reason: 'Directly evaluates developer productivity with LLMs.',
    })
  })

  it('returns null when the suggestion has wrong enum values', () => {
    const input = '{"suggestion": "MAYBE", "reason": "Borderline relevance."}'
    const result = parseAiResponse(input)
    expect(result).toBeNull()
  })

  it('returns null when JSON is malformed or invalid syntax', () => {
    const input = '{"suggestion": "INCLUDE", reason: missing quotes}'
    const result = parseAiResponse(input)
    expect(result).toBeNull()
  })

  it('returns null when reason is blank', () => {
    const input = '{"suggestion": "INCLUDE", "reason": "   "}'
    const result = parseAiResponse(input)
    expect(result).toBeNull()
  })
})
