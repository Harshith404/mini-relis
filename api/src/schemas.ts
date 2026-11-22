import { z } from 'zod'

const currentYear = new Date().getFullYear()
const maxYear = currentYear + 1

export const createPaperSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty'),
  abstract: z.string().trim().min(1, 'Abstract cannot be empty'),
  venue: z.string().trim().min(1, 'Venue cannot be empty'),
  authors: z.string().trim().min(1, 'Authors cannot be empty'),
  year: z.coerce
    .number()
    .int('Year must be an integer')
    .min(1900, 'Year must be 1900 or later')
    .max(maxYear, `Year cannot be beyond ${maxYear}`),
})

export const updateDecisionSchema = z.object({
  status: z.enum(['INCLUDED', 'EXCLUDED'], {
    message: 'Status must be either INCLUDED or EXCLUDED',
  }),
  decisionReason: z.string().trim().min(1, 'Decision reason cannot be empty'),
})

export const reviewSettingsSchema = z.object({
  topic: z.string().trim().min(3, 'Review topic cannot be empty'),
  inclusionCriteria: z.string().trim().min(1, 'Inclusion criteria cannot be empty'),
  exclusionCriteria: z.string().trim().min(1, 'Exclusion criteria cannot be empty'),
})
