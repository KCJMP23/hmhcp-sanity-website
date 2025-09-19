export interface SEOMetaData {
  // Basic SEO
  title: string
  description: string
  keywords: string[]
  slug: string
  canonicalUrl?: string
  robots: {
    index: boolean
    follow: boolean
    archive: boolean
    snippet: boolean
  }
  
  // Open Graph (Facebook)
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType: string
  ogUrl?: string
  ogSiteName?: string
  
  // Twitter Cards
  twitterCard: 'summary' | 'summary_large_image' | 'app' | 'player'
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  twitterSite?: string
  twitterCreator?: string
  
  // Technical
  structuredData?: any
  customMeta: Array<{ name: string; content: string; property?: string }>
}

export interface SEOMetaTagsProps {
  data: Partial<SEOMetaData>
  onChange: (data: Partial<SEOMetaData>) => void
  previewUrl?: string
  className?: string
}

export interface SEOHooksReturn {
  activeTab: string
  setActiveTab: (tab: string) => void
  showPreview: boolean
  setShowPreview: (show: boolean) => void
  copiedField: string | null
  setCopiedField: (field: string | null) => void
  keywordInput: string
  setKeywordInput: (input: string) => void
  updateField: (field: string, value: any) => void
  updateNestedField: (parent: string, field: string, value: any) => void
  addKeyword: () => void
  removeKeyword: (index: number) => void
  addCustomMeta: () => void
  updateCustomMeta: (index: number, field: string, value: string) => void
  removeCustomMeta: (index: number) => void
  copyToClipboard: (text: string, field: string) => Promise<void>
  generateMetaTags: () => string
}

// SEO Analyzer Types
export interface SEOAnalysisResult {
  score: number
  issues: SEOIssue[]
  recommendations: SEORecommendation[]
  metrics: SEOMetrics
}

export interface SEOIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  category: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  fixable: boolean
}

export interface SEORecommendation {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  effort: 'easy' | 'medium' | 'hard'
  impact: 'high' | 'medium' | 'low'
  issue?: string
  suggestion?: string
  category?: string
  autoFixable?: boolean
}

export interface SEOMetrics {
  titleLength: number
  descriptionLength: number
  headingStructure: {
    h1Count: number
    h2Count: number
    h3Count: number
  }
  imageCount: number
  imagesWithAlt: number
  linkCount: number
  internalLinks: number
  externalLinks: number
  wordCount: number
  readabilityScore: number
}

export interface SEOContent {
  title?: string
  description?: string
  content?: string
  slug?: string
  tags?: string[]
  category?: string
}

export interface SEOAnalyzerProps {
  content: SEOContent
  onUpdate?: (updates: any) => void
  className?: string
}

export type TabType = 'overview' | 'issues' | 'recommendations' | 'metrics'