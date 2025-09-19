// SEO Management Components
export { SEOAnalyzer } from './SEOAnalyzer'
export { SEOMetaTags } from './SEOMetaTags'
export { SEODashboard } from './SEODashboard'

// Types
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
  impact: string
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