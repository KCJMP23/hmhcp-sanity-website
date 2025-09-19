// SEO Manager Types and Constants

export interface SEOAnalysis {
  id: string
  content_id: string
  page_url: string
  meta_title: string
  meta_description: string
  meta_keywords: string[]
  og_title: string
  og_description: string
  og_image: string
  og_type: string
  twitter_card: string
  twitter_title: string
  twitter_description: string
  twitter_image: string
  canonical_url: string
  robots_meta: string
  schema_markup: any
  title_length: number
  description_length: number
  keywords_count: number
  h1_count: number
  h2_count: number
  internal_links: number
  external_links: number
  images_without_alt: number
  readability_score: number
  seo_score: number
  performance_score: number
  recommendations: string[]
  issues: string[]
  last_analyzed: string
  created_at: string
  updated_at: string
  content?: {
    title: string
    type: string
    status: string
  }
}

export interface SEOFormData {
  content_id: string
  meta_title: string
  meta_description: string
  meta_keywords: string[]
  og_title: string
  og_description: string
  og_image: string
  og_type: string
  twitter_card: string
  twitter_title: string
  twitter_description: string
  twitter_image: string
  canonical_url: string
  robots_meta: string
  schema_markup: any
}

export interface SEOFilters {
  search: string
  score_range: string
  content_type: string
}

export interface SEOPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const SEO_SCORE_RANGES = {
  excellent: { min: 90, color: 'bg-green-100 text-green-800', label: 'Excellent' },
  good: { min: 70, color: 'bg-blue-100 text-blue-800', label: 'Good' },
  fair: { min: 50, color: 'bg-yellow-100 text-yellow-800', label: 'Fair' },
  poor: { min: 0, color: 'bg-red-100 text-red-800', label: 'Poor' }
}

export const OG_TYPES = [
  { value: 'website', label: 'Website' },
  { value: 'article', label: 'Article' },
  { value: 'profile', label: 'Profile' },
  { value: 'video', label: 'Video' },
  { value: 'music', label: 'Music' }
]

export const TWITTER_CARD_TYPES = [
  { value: 'summary', label: 'Summary' },
  { value: 'summary_large_image', label: 'Summary Large Image' },
  { value: 'app', label: 'App' },
  { value: 'player', label: 'Player' }
]

export const ROBOTS_OPTIONS = [
  { value: 'index,follow', label: 'Index, Follow' },
  { value: 'noindex,follow', label: 'No Index, Follow' },
  { value: 'index,nofollow', label: 'Index, No Follow' },
  { value: 'noindex,nofollow', label: 'No Index, No Follow' }
]