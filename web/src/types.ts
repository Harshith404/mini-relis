export type PaperStatus = 'PENDING' | 'INCLUDED' | 'EXCLUDED'

export interface Paper {
  id: string
  title: string
  abstract: string
  venue: string
  authors: string
  year: number
  status: PaperStatus
  decisionReason: string | null
  aiSuggestion: string | null
  aiReason: string | null
  aiModel: string | null
  createdAt: string
}

export interface ReviewSettings {
  id: string
  topic: string
  inclusionCriteria: string
  exclusionCriteria: string
  updatedAt?: string
}

export interface ApiResponse {
  papers: Paper[]
  total: number
  limit?: number
  offset?: number
}
