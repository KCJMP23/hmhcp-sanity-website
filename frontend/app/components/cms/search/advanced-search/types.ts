export interface SearchFilters {
  query: string
  contentType: string[]
  status: string[]
  author: string[]
  dateRange: {
    from: Date | null
    to: Date | null
  }
  tags: string[]
  category: string[]
  hasMedia: boolean | null
  wordCount: {
    min: number | null
    max: number | null
  }
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface SearchResult {
  id: string
  title: string
  excerpt: string
  contentType: string
  status: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
  tags: string[]
  category?: string
  wordCount: number
  hasMedia: boolean
  mediaCount: number
  url?: string
  score: number // relevance score
}

export interface AdvancedSearchProps {
  className?: string
  onResultSelect?: (result: SearchResult) => void
}

export const CONTENT_TYPES = [
  { value: 'page', label: 'Pages' },
  { value: 'blog_post', label: 'Blog Posts' },
  { value: 'media', label: 'Media' },
  { value: 'template', label: 'Templates' }
]

export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Under Review' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
]

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'updated_at', label: 'Modified Date' },
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'word_count', label: 'Word Count' }
]

export const defaultFilters: SearchFilters = {
  query: '',
  contentType: [],
  status: [],
  author: [],
  dateRange: {
    from: null,
    to: null
  },
  tags: [],
  category: [],
  hasMedia: null,
  wordCount: {
    min: null,
    max: null
  },
  sortBy: 'relevance',
  sortOrder: 'desc'
}