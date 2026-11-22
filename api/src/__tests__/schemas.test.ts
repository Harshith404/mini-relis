import { describe, it, expect } from 'vitest'
import { createPaperSchema, updateDecisionSchema } from '../schemas.js'

describe('createPaperSchema', () => {
  it('validates a correct paper object', () => {
    const input = {
      title: 'Measuring Copilot Productivity in Practice',
      abstract: 'An empirical investigation into software engineering velocity.',
      venue: 'ICSE',
      authors: 'Jane Doe, John Smith',
      year: 2024,
    }
    const result = createPaperSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('rejects a paper when title is empty or missing', () => {
    const input = {
      title: '   ',
      abstract: 'An empirical investigation.',
      venue: 'ICSE',
      authors: 'Jane Doe',
      year: 2024,
    }
    const result = createPaperSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title cannot be empty')
    }
  })

  it('rejects a year before 1900', () => {
    const input = {
      title: 'Early Computing',
      abstract: 'Ancient computing concepts.',
      venue: 'HistComp',
      authors: 'Ada Lovelace',
      year: 1843,
    }
    const result = createPaperSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Year must be 1900 or later')
    }
  })

  it('rejects a year far in the future', () => {
    const nextYear = new Date().getFullYear() + 1
    const input = {
      title: 'Future Computing',
      abstract: 'Far future prediction.',
      venue: 'Futurism',
      authors: 'Time Traveler',
      year: nextYear + 5,
    }
    const result = createPaperSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Year cannot be beyond')
    }
  })
})

describe('updateDecisionSchema', () => {
  it('validates a proper INCLUDED decision with reason', () => {
    const input = {
      status: 'INCLUDED',
      decisionReason: 'Strong empirical study on AI coding tools.',
    }
    const result = updateDecisionSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('validates a proper EXCLUDED decision with reason', () => {
    const input = {
      status: 'EXCLUDED',
      decisionReason: 'Medical imaging domain, not software engineering.',
    }
    const result = updateDecisionSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('rejects an invalid status enum value', () => {
    const input = {
      status: 'MAYBE',
      decisionReason: 'Unclear.',
    }
    const result = updateDecisionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects empty decision reasons', () => {
    const input = {
      status: 'INCLUDED',
      decisionReason: '   ',
    }
    const result = updateDecisionSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Decision reason cannot be empty')
    }
  })
})
