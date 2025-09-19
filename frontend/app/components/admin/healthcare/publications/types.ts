// Types for Research Publications
export interface ResearchPublication {
  id: string
  content_id: string
  title: string
  abstract: string
  authors: string[]
  publication_type: 'journal_article' | 'conference_paper' | 'book_chapter' | 'white_paper' | 'case_study'
  journal_name?: string
  volume?: string
  issue?: string
  pages?: string
  doi?: string
  pmid?: string
  publication_date: string
  status: 'published' | 'in_press' | 'under_review' | 'draft'
  impact_factor?: number
  citation_count: number
  keywords: string[]
  research_area: string
  funding_source?: string
  corresponding_author: string
  affiliated_institutions: string[]
  peer_reviewed: boolean
  open_access: boolean
  pdf_url?: string
  supplementary_materials?: any
  created_at: string
  updated_at: string
}

export interface PublicationFormData {
  title: string
  abstract: string
  authors: string[]
  publication_type: string
  journal_name: string
  volume: string
  issue: string
  pages: string
  doi: string
  pmid: string
  publication_date: Date | null
  status: string
  impact_factor: number
  keywords: string[]
  research_area: string
  funding_source: string
  corresponding_author: string
  affiliated_institutions: string[]
  peer_reviewed: boolean
  open_access: boolean
  pdf_url: string
}

export interface PublicationStats {
  total: number
  published: number
  inPress: number
  underReview: number
  totalCitations: number
  averageImpact: number
}

export const PUBLICATION_TYPES = [
  { value: 'journal_article', label: 'Journal Article' },
  { value: 'conference_paper', label: 'Conference Paper' },
  { value: 'book_chapter', label: 'Book Chapter' },
  { value: 'white_paper', label: 'White Paper' },
  { value: 'case_study', label: 'Case Study' }
] as const

export const PUBLICATION_STATUS = [
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-800' },
  { value: 'in_press', label: 'In Press', color: 'bg-blue-100 text-blue-800' },
  { value: 'under_review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' }
] as const

export const RESEARCH_AREAS = [
  'Clinical Research',
  'Health Technology',
  'Quality Improvement',
  'Patient Safety',
  'Healthcare Analytics',
  'Public Health',
  'Digital Health',
  'Healthcare Policy',
  'Medical Education',
  'Healthcare Innovation'
] as const