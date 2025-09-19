/**
 * Advanced Search System - TypeScript Type Definitions
 * Comprehensive type-safe search architecture with healthcare-specific features
 */

// ============================================================================
// BRANDED TYPES AND UTILITIES
// ============================================================================

/**
 * Branded type for search identifiers to prevent confusion between different ID types
 */
export type SearchId = string & { readonly __brand: 'SearchId' }
export type RelevanceScore = number & { readonly __brand: 'RelevanceScore' }
export type SearchRank = number & { readonly __brand: 'SearchRank' }

/**
 * Template literal types for search operators
 */
export type SearchOperator = 'AND' | 'OR' | 'NOT' | 'NEAR' | 'PHRASE'
export type WildcardPattern = `${string}*` | `*${string}` | `*${string}*`
export type QuotedPhrase = `"${string}"`
export type FieldQuery = `${string}:${string}`

/**
 * Advanced search query patterns using template literals
 */
export type SearchQueryPattern = 
  | string
  | QuotedPhrase
  | WildcardPattern
  | FieldQuery
  | `${SearchOperator} ${string}`

// ============================================================================
// CONTENT TYPE DEFINITIONS
// ============================================================================

/**
 * Searchable content types with discriminated union for type safety
 */
export type SearchableContentType = 
  | 'posts'
  | 'pages' 
  | 'users'
  | 'media'
  | 'categories'
  | 'tags'
  | 'comments'
  | 'clinical_trials'
  | 'publications'
  | 'quality_studies'
  | 'platforms'
  | 'patient_education'
  | 'healthcare_reports'
  | 'research_data'
  | 'settings'

/**
 * Healthcare-specific content types
 */
export type HealthcareContentType = Extract<SearchableContentType, 
  | 'clinical_trials' 
  | 'publications' 
  | 'quality_studies'
  | 'patient_education'
  | 'healthcare_reports'
  | 'research_data'
>

/**
 * Base searchable content interface with generic constraints
 */
export interface SearchableContent<T extends SearchableContentType = SearchableContentType> {
  readonly id: SearchId
  readonly type: T
  readonly title: string
  readonly content?: string
  readonly excerpt?: string
  readonly status: 'draft' | 'published' | 'archived' | 'private'
  readonly authorId?: string
  readonly authorName?: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly publishedAt?: string
  readonly tags?: readonly string[]
  readonly categories?: readonly string[]
  readonly metadata?: SearchContentMetadata[T]
}

/**
 * Content-specific metadata using mapped types
 */
export type SearchContentMetadata = {
  posts: {
    wordCount?: number
    readingTime?: number
    featured?: boolean
    seoScore?: number
  }
  pages: {
    template?: string
    isHomepage?: boolean
    parentPageId?: string
    menuOrder?: number
  }
  users: {
    role: string
    lastLogin?: string
    postCount?: number
    isActive: boolean
  }
  media: {
    fileSize: number
    mimeType: string
    dimensions?: { width: number; height: number }
    altText?: string
  }
  clinical_trials: {
    phase: 'I' | 'II' | 'III' | 'IV'
    status: 'recruiting' | 'active' | 'completed' | 'terminated'
    participantCount?: number
    primaryOutcome?: string
    studyType?: string
    sponsor?: string
  }
  publications: {
    impactFactor?: number
    citationCount?: number
    journalName?: string
    doi?: string
    publicationType: 'research' | 'review' | 'case_study' | 'editorial'
  }
  quality_studies: {
    outcomeType: 'mortality' | 'morbidity' | 'quality_of_life' | 'cost_effectiveness'
    studyDesign: 'rct' | 'cohort' | 'case_control' | 'cross_sectional'
    evidenceLevel: 'A' | 'B' | 'C' | 'D'
    sampleSize?: number
  }
  patient_education: {
    readingLevel: 'elementary' | 'middle' | 'high_school' | 'college'
    medicalSpecialty?: string
    targetAudience: 'patient' | 'caregiver' | 'provider'
    languages?: readonly string[]
  }
  platforms: {
    category: 'edc' | 'analytics' | 'patient_portal' | 'telemedicine'
    version?: string
    lastDeployment?: string
    userCount?: number
  }
  healthcare_reports: {
    reportType: 'quality' | 'safety' | 'financial' | 'operational'
    timeframe: 'monthly' | 'quarterly' | 'annual'
    department?: string
    confidentiality: 'public' | 'internal' | 'confidential'
  }
  research_data: {
    dataType: 'clinical' | 'genomic' | 'imaging' | 'survey'
    anonymized: boolean
    hipaaCompliant: boolean
    studyId?: string
  }
  categories: {
    parentId?: string
    itemCount?: number
    description?: string
  }
  tags: {
    usageCount?: number
    color?: string
  }
  comments: {
    approved: boolean
    spam: boolean
    parentCommentId?: string
  }
  settings: {
    settingType: 'general' | 'security' | 'performance' | 'integration'
    scope: 'global' | 'user' | 'content'
  }
}

// ============================================================================
// SEARCH QUERY INTERFACES
// ============================================================================

/**
 * Advanced search query builder with type-safe operations
 */
export interface SearchQuery<T extends SearchableContentType = SearchableContentType> {
  readonly query: SearchQueryPattern
  readonly contentTypes: readonly T[]
  readonly filters: SearchFilters<T>
  readonly sort: SearchSort<T>
  readonly pagination: SearchPagination
  readonly options: SearchOptions
  readonly facets?: readonly SearchFacet<T>[]
  readonly boost?: SearchBoost<T>
}

/**
 * Dynamic search filters using discriminated unions
 */
export type SearchFilters<T extends SearchableContentType> = {
  readonly status?: readonly SearchableContent['status'][]
  readonly dateRange?: {
    readonly field: 'createdAt' | 'updatedAt' | 'publishedAt'
    readonly from?: string
    readonly to?: string
  }
  readonly author?: readonly string[]
  readonly tags?: readonly string[]
  readonly categories?: readonly string[]
} & SearchContentFilters<T>

/**
 * Content-specific filters using conditional types
 */
export type SearchContentFilters<T extends SearchableContentType> = T extends 'clinical_trials'
  ? {
      readonly phase?: readonly SearchContentMetadata['clinical_trials']['phase'][]
      readonly trialStatus?: readonly SearchContentMetadata['clinical_trials']['status'][]
      readonly participantRange?: { min?: number; max?: number }
    }
  : T extends 'publications'
  ? {
      readonly impactFactorRange?: { min?: number; max?: number }
      readonly publicationType?: readonly SearchContentMetadata['publications']['publicationType'][]
      readonly journalName?: readonly string[]
    }
  : T extends 'quality_studies'
  ? {
      readonly outcomeType?: readonly SearchContentMetadata['quality_studies']['outcomeType'][]
      readonly studyDesign?: readonly SearchContentMetadata['quality_studies']['studyDesign'][]
      readonly evidenceLevel?: readonly SearchContentMetadata['quality_studies']['evidenceLevel'][]
    }
  : T extends 'patient_education'
  ? {
      readonly readingLevel?: readonly SearchContentMetadata['patient_education']['readingLevel'][]
      readonly targetAudience?: readonly SearchContentMetadata['patient_education']['targetAudience'][]
      readonly medicalSpecialty?: readonly string[]
    }
  : T extends 'users'
  ? {
      readonly roles?: readonly string[]
      readonly isActive?: boolean
      readonly lastLoginRange?: { from?: string; to?: string }
    }
  : T extends 'media'
  ? {
      readonly mimeTypes?: readonly string[]
      readonly fileSizeRange?: { min?: number; max?: number }
      readonly hasDimensions?: boolean
    }
  : {}

/**
 * Search sorting with type-safe field validation
 */
export interface SearchSort<T extends SearchableContentType> {
  readonly field: SearchSortField<T>
  readonly direction: 'asc' | 'desc'
  readonly secondary?: {
    readonly field: SearchSortField<T>
    readonly direction: 'asc' | 'desc'
  }
}

/**
 * Dynamic sort fields based on content type
 */
export type SearchSortField<T extends SearchableContentType> = 
  | 'relevance'
  | 'createdAt'
  | 'updatedAt'
  | 'publishedAt'
  | 'title'
  | (T extends 'publications' ? 'impactFactor' | 'citationCount' : never)
  | (T extends 'clinical_trials' ? 'participantCount' | 'phase' : never)
  | (T extends 'users' ? 'lastLogin' | 'postCount' : never)
  | (T extends 'media' ? 'fileSize' : never)

/**
 * Search pagination with performance constraints
 */
export interface SearchPagination {
  readonly page: number
  readonly limit: number // Max 100 for performance
  readonly offset?: number
  readonly cursor?: string // For cursor-based pagination
}

/**
 * Advanced search options with performance and feature flags
 */
export interface SearchOptions {
  readonly fuzzy: boolean
  readonly typoTolerance: 0 | 1 | 2 // Maximum edit distance
  readonly highlight: boolean
  readonly highlightFields?: readonly string[]
  readonly snippetLength?: number
  readonly includeMetadata: boolean
  readonly caseSensitive: boolean
  readonly wholeWord: boolean
  readonly regex: boolean
  readonly synonyms: boolean
  readonly stemming: boolean
  readonly stopWords: boolean
  readonly cache: boolean
  readonly cacheTimeout?: number // in seconds
  readonly explain: boolean // Return relevance explanation
  readonly minScore?: RelevanceScore
}

// ============================================================================
// SEARCH RESULTS AND RESPONSES
// ============================================================================

/**
 * Comprehensive search result with rich metadata
 */
export interface SearchResult<T extends SearchableContentType = SearchableContentType> {
  readonly item: SearchableContent<T>
  readonly score: RelevanceScore
  readonly rank: SearchRank
  readonly highlights?: SearchHighlight[]
  readonly snippet?: string
  readonly explanation?: SearchExplanation
  readonly matchedFields: readonly string[]
  readonly distance?: number // For fuzzy matches
}

/**
 * Search highlighting information
 */
export interface SearchHighlight {
  readonly field: string
  readonly fragments: readonly {
    readonly text: string
    readonly isHighlighted: boolean
  }[]
  readonly matchCount: number
}

/**
 * Search relevance explanation for debugging and optimization
 */
export interface SearchExplanation {
  readonly score: RelevanceScore
  readonly description: string
  readonly details: readonly {
    readonly field: string
    readonly boost: number
    readonly termFrequency: number
    readonly inverseDocumentFrequency: number
    readonly fieldNorm: number
  }[]
}

/**
 * Complete search response with metadata and analytics
 */
export interface SearchResponse<T extends SearchableContentType = SearchableContentType> {
  readonly results: readonly SearchResult<T>[]
  readonly totalCount: number
  readonly totalPages: number
  readonly currentPage: number
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
  readonly facets?: SearchFacetResults<T>
  readonly suggestions?: readonly SearchSuggestion[]
  readonly queryTime: number // in milliseconds
  readonly searchId: SearchId
  readonly query: SearchQuery<T>
  readonly aggregations?: SearchAggregations<T>
  readonly spellCheck?: SearchSpellCheck
}

// ============================================================================
// FACETED SEARCH
// ============================================================================

/**
 * Search facet configuration for advanced filtering
 */
export interface SearchFacet<T extends SearchableContentType> {
  readonly name: string
  readonly field: keyof SearchableContent<T> | keyof SearchContentMetadata[T]
  readonly type: 'terms' | 'range' | 'date_range' | 'nested'
  readonly size?: number
  readonly minCount?: number
  readonly sort?: 'count' | 'term' | 'relevance'
  readonly ranges?: readonly { from?: number; to?: number; label: string }[]
}

/**
 * Facet results with counts and nested values
 */
export type SearchFacetResults<T extends SearchableContentType> = Record<string, {
  readonly buckets: readonly {
    readonly key: string | number
    readonly count: number
    readonly selected: boolean
  }[]
  readonly total: number
  readonly missing?: number
}>

// ============================================================================
// SEARCH SUGGESTIONS AND AUTOCOMPLETE
// ============================================================================

/**
 * Search suggestion for autocomplete
 */
export interface SearchSuggestion {
  readonly text: string
  readonly type: 'term' | 'phrase' | 'completion'
  readonly score: RelevanceScore
  readonly category?: SearchableContentType
  readonly count?: number // How many results this would return
}

/**
 * Spell check suggestions
 */
export interface SearchSpellCheck {
  readonly suggestions: readonly {
    readonly term: string
    readonly corrections: readonly {
      readonly text: string
      readonly frequency: number
      readonly score: number
    }[]
  }[]
  readonly collations?: readonly {
    readonly query: string
    readonly hits: number
  }[]
}

// ============================================================================
// SEARCH BOOST AND RELEVANCE
// ============================================================================

/**
 * Search boost configuration for relevance tuning
 */
export interface SearchBoost<T extends SearchableContentType> {
  readonly fields: Record<string, number>
  readonly contentType?: Record<T, number>
  readonly recency?: {
    readonly field: 'createdAt' | 'updatedAt' | 'publishedAt'
    readonly scale: string // e.g., '7d', '30d'
    readonly decay: number
  }
  readonly popularity?: {
    readonly field: string
    readonly modifier: 'log' | 'sqrt' | 'linear'
  }
  readonly custom?: Record<string, number>
}

// ============================================================================
// SEARCH ANALYTICS AND MONITORING
// ============================================================================

/**
 * Search analytics event for tracking and optimization
 */
export interface SearchAnalyticsEvent {
  readonly eventId: string
  readonly searchId: SearchId
  readonly userId?: string
  readonly sessionId: string
  readonly timestamp: string
  readonly eventType: 'search' | 'click' | 'conversion' | 'abandon'
  readonly query: string
  readonly resultCount: number
  readonly queryTime: number
  readonly position?: number // For click events
  readonly contentId?: SearchId // For click/conversion events
  readonly contentType?: SearchableContentType
}

/**
 * Search performance metrics
 */
export interface SearchMetrics {
  readonly totalSearches: number
  readonly avgQueryTime: number
  readonly avgResultCount: number
  readonly clickThroughRate: number
  readonly abandonmentRate: number
  readonly topQueries: readonly { query: string; count: number }[]
  readonly topContent: readonly { id: SearchId; clicks: number }[]
  readonly performanceByType: Record<SearchableContentType, {
    readonly searchCount: number
    readonly avgQueryTime: number
    readonly clickThroughRate: number
  }>
}

// ============================================================================
// SAVED SEARCHES AND PRESETS
// ============================================================================

/**
 * Saved search configuration
 */
export interface SavedSearch<T extends SearchableContentType = SearchableContentType> {
  readonly id: SearchId
  readonly name: string
  readonly description?: string
  readonly query: SearchQuery<T>
  readonly isPublic: boolean
  readonly createdBy: string
  readonly createdAt: string
  readonly lastUsed?: string
  readonly useCount: number
  readonly tags?: readonly string[]
  readonly notifications?: {
    readonly enabled: boolean
    readonly frequency: 'daily' | 'weekly' | 'monthly'
    readonly threshold?: number // Notify when results change by X%
  }
}

/**
 * Search preset for common search patterns
 */
export interface SearchPreset<T extends SearchableContentType = SearchableContentType> {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly icon?: string
  readonly category: 'content' | 'healthcare' | 'users' | 'system'
  readonly queryTemplate: Omit<SearchQuery<T>, 'query'>
  readonly placeholders?: Record<string, {
    readonly type: 'text' | 'select' | 'date' | 'number'
    readonly label: string
    readonly options?: readonly string[]
    readonly required: boolean
  }>
}

// ============================================================================
// SEARCH ENGINE CONFIGURATION
// ============================================================================

/**
 * Search engine configuration with performance tuning
 */
export interface SearchEngineConfig {
  readonly indexName: string
  readonly shards: number
  readonly replicas: number
  readonly refreshInterval: string
  readonly maxResultWindow: number
  readonly highlighting: {
    readonly fragmentSize: number
    readonly numberOfFragments: number
    readonly requireFieldMatch: boolean
  }
  readonly analysis: {
    readonly analyzer: string
    readonly tokenizer: string
    readonly filters: readonly string[]
  }
  readonly similarity: 'BM25' | 'DFR' | 'IB' | 'LMDirichlet'
  readonly cache: {
    readonly enabled: boolean
    readonly size: string
    readonly ttl: string
  }
}

// ============================================================================
// SEARCH AGGREGATIONS
// ============================================================================

/**
 * Search aggregations for analytics and insights
 */
export type SearchAggregations<T extends SearchableContentType> = {
  readonly contentType: Record<T, number>
  readonly status: Record<SearchableContent['status'], number>
  readonly timeRange: {
    readonly day: readonly { date: string; count: number }[]
    readonly week: readonly { date: string; count: number }[]
    readonly month: readonly { date: string; count: number }[]
  }
  readonly authors: readonly { name: string; count: number }[]
  readonly tags: readonly { name: string; count: number }[]
  readonly categories: readonly { name: string; count: number }[]
} & (T extends HealthcareContentType ? {
  readonly healthcare: {
    readonly phases?: Record<string, number>
    readonly outcomes?: Record<string, number>
    readonly specialties?: Record<string, number>
    readonly evidenceLevels?: Record<string, number>
  }
} : {})

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Search-specific error types with detailed context
 */
export class SearchError extends Error {
  constructor(
    message: string,
    public readonly code: SearchErrorCode,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'SearchError'
  }
}

export type SearchErrorCode = 
  | 'INVALID_QUERY'
  | 'INDEX_NOT_FOUND'
  | 'TIMEOUT'
  | 'TOO_MANY_CLAUSES'
  | 'INVALID_FACET'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'RATE_LIMITED'
  | 'INDEX_UNAVAILABLE'
  | 'MALFORMED_RESPONSE'
  | 'HEALTHCARE_COMPLIANCE_ERROR'

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract specific content types from union
 */
export type FilterContentTypes<T extends SearchableContentType, U> = T extends U ? T : never

/**
 * Get metadata type for specific content type
 */
export type GetMetadata<T extends SearchableContentType> = SearchContentMetadata[T]

/**
 * Check if content type has specific metadata field
 */
export type HasMetadataField<T extends SearchableContentType, F extends string> = 
  F extends keyof SearchContentMetadata[T] ? true : false

/**
 * Search result transformer function type
 */
export type SearchResultTransformer<T extends SearchableContentType, R> = 
  (result: SearchResult<T>) => R

/**
 * Search middleware function type
 */
export type SearchMiddleware<T extends SearchableContentType> = 
  (query: SearchQuery<T>, next: () => Promise<SearchResponse<T>>) => Promise<SearchResponse<T>>

/**
 * Healthcare compliance validator type
 */
export type HealthcareComplianceValidator<T extends HealthcareContentType> = 
  (content: SearchableContent<T>) => Promise<boolean>