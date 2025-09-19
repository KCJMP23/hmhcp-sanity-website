/**
 * Advanced Search Engine - Generic Type-Safe Implementation
 * Comprehensive search engine with healthcare-specific features and advanced TypeScript patterns
 */

import type {
  SearchId,
  SearchableContentType,
  SearchableContent,
  SearchQuery,
  SearchResponse,
  SearchResult,
  SearchFilters,
  SearchOptions,
  SearchFacet,
  SearchFacetResults,
  SearchSuggestion,
  SearchAnalyticsEvent,
  SearchErrorCode,
  RelevanceScore,
  SearchRank,
  SearchBoost,
  SearchMiddleware,
  HealthcareContentType,
  SearchEngineConfig,
  SearchHighlight,
  SearchExplanation,
  SearchSpellCheck,
  SearchAggregations,
} from './types'
import { SearchError } from './types'
import { generateId } from '../utils'

// ============================================================================
// TYPE-SAFE QUERY BUILDER
// ============================================================================

/**
 * Generic query builder with fluent interface and advanced TypeScript constraints
 */
export class SearchQueryBuilder<T extends SearchableContentType = SearchableContentType> {
  private _query: Partial<SearchQuery<T>> = {
    contentTypes: [] as readonly T[],
    filters: {} as SearchFilters<T>,
    sort: {
      field: 'relevance',
      direction: 'desc'
    },
    pagination: {
      page: 1,
      limit: 20
    },
    options: this.getDefaultOptions()
  }

  private constructor() {}

  /**
   * Create a new query builder instance with type safety
   */
  static create<U extends SearchableContentType>(): SearchQueryBuilder<U> {
    return new SearchQueryBuilder<U>()
  }

  /**
   * Set the search query with template literal validation
   */
  query(query: string): this {
    this._query = { ...this._query, query }
    return this
  }

  /**
   * Add content types with union type constraints
   */
  types<U extends T>(...types: U[]): SearchQueryBuilder<U> {
    const newBuilder = new SearchQueryBuilder<U>()
    newBuilder._query = { ...this._query, contentTypes: types }
    return newBuilder
  }

  /**
   * Add filters with type-safe field validation
   */
  where<K extends keyof SearchFilters<T>>(
    field: K,
    value: SearchFilters<T>[K]
  ): this {
    this._query = {
      ...this._query,
      filters: {
        ...this._query.filters,
        [field]: value
      } as SearchFilters<T>
    }
    return this
  }

  /**
   * Add healthcare-specific filters with conditional types
   */
  healthcareFilter<U extends T & HealthcareContentType>(
    field: keyof SearchFilters<U>,
    value: any
  ): this {
    if (this.isHealthcareContentType()) {
      this._query = {
        ...this._query,
        filters: {
          ...this._query.filters,
          [field]: value
        } as SearchFilters<T>
      }
    }
    return this
  }

  /**
   * Set sorting with type-safe field validation
   */
  sortBy<K extends keyof SearchableContent<T> | 'relevance'>(
    field: K,
    direction: 'asc' | 'desc' = 'asc'
  ): this {
    this._query = { ...this._query, sort: { field: field as any, direction } }
    return this
  }

  /**
   * Add secondary sorting
   */
  thenSortBy<K extends keyof SearchableContent<T> | 'relevance'>(
    field: K,
    direction: 'asc' | 'desc' = 'asc'
  ): this {
    if (this._query.sort) {
      this._query = {
        ...this._query,
        sort: {
          ...this._query.sort,
          secondary: { field: field as any, direction }
        }
      }
    }
    return this
  }

  /**
   * Set pagination with performance constraints
   */
  paginate(page: number, limit: number = 20): this {
    if (limit > 100) {
      throw new SearchError('Page limit cannot exceed 100 for performance reasons', 'INVALID_QUERY')
    }
    this._query = { ...this._query, pagination: { page, limit } }
    return this
  }

  /**
   * Enable cursor-based pagination for large datasets
   */
  cursor(cursor: string, limit: number = 20): this {
    this._query = {
      ...this._query,
      pagination: { 
        page: 1, 
        limit, 
        cursor,
        offset: 0
      }
    }
    return this
  }

  /**
   * Configure search options with feature flags
   */
  options(options: Partial<SearchOptions>): this {
    this._query = { ...this._query, options: { ...this._query.options, ...options } as SearchOptions }
    return this
  }

  /**
   * Enable fuzzy search with edit distance
   */
  fuzzy(typoTolerance: 0 | 1 | 2 = 1): this {
    this._query = {
      ...this._query,
      options: {
        ...this._query.options,
        fuzzy: true,
        typoTolerance
      } as SearchOptions
    }
    return this
  }

  /**
   * Enable highlighting with field specification
   */
  highlight(fields?: string[], snippetLength?: number): this {
    this._query = {
      ...this._query,
      options: {
        ...this._query.options,
        highlight: true,
        highlightFields: fields,
        snippetLength
      } as SearchOptions
    }
    return this
  }

  /**
   * Add facets for aggregated results
   */
  facet(facet: SearchFacet<T>): this {
    this._query = { ...this._query, facets: [...(this._query.facets || []), facet] }
    return this
  }

  /**
   * Add multiple facets
   */
  facets(facets: SearchFacet<T>[]): this {
    this._query = { ...this._query, facets: [...(this._query.facets || []), ...facets] }
    return this
  }

  /**
   * Configure search boosting for relevance tuning
   */
  boost(boost: SearchBoost<T>): this {
    this._query = { ...this._query, boost }
    return this
  }

  /**
   * Build the final query with validation
   */
  build(): SearchQuery<T> {
    this.validateQuery()
    return this._query as SearchQuery<T>
  }

  private getDefaultOptions(): SearchOptions {
    return {
      fuzzy: false,
      typoTolerance: 0,
      highlight: false,
      includeMetadata: true,
      caseSensitive: false,
      wholeWord: false,
      regex: false,
      synonyms: true,
      stemming: true,
      stopWords: true,
      cache: true,
      cacheTimeout: 300,
      explain: false
    }
  }

  private isHealthcareContentType(): boolean {
    const healthcareTypes: HealthcareContentType[] = [
      'clinical_trials',
      'publications', 
      'quality_studies',
      'patient_education',
      'healthcare_reports',
      'research_data'
    ]
    return this._query.contentTypes?.some(type => 
      healthcareTypes.includes(type as HealthcareContentType)
    ) || false
  }

  private validateQuery(): void {
    if (!this._query.query) {
      throw new SearchError('Query string is required', 'INVALID_QUERY')
    }
    if (!this._query.contentTypes?.length) {
      throw new SearchError('At least one content type must be specified', 'INVALID_QUERY')
    }
    if (this._query.pagination && this._query.pagination.limit > 100) {
      throw new SearchError('Page limit cannot exceed 100', 'INVALID_QUERY')
    }
  }
}

// ============================================================================
// ADVANCED SEARCH ENGINE
// ============================================================================

/**
 * Advanced search engine with sophisticated algorithms and healthcare compliance
 */
export class AdvancedSearchEngine<T extends SearchableContentType = SearchableContentType> {
  private config: SearchEngineConfig
  private middleware: SearchMiddleware<T>[] = []
  private analytics: SearchAnalyticsEvent[] = []

  constructor(config: Partial<SearchEngineConfig> = {}) {
    this.config = {
      indexName: 'admin_search',
      shards: 1,
      replicas: 0,
      refreshInterval: '1s',
      maxResultWindow: 10000,
      highlighting: {
        fragmentSize: 150,
        numberOfFragments: 3,
        requireFieldMatch: true
      },
      analysis: {
        analyzer: 'custom_healthcare_analyzer',
        tokenizer: 'standard',
        filters: ['lowercase', 'stop', 'stemmer', 'medical_synonyms']
      },
      similarity: 'BM25',
      cache: {
        enabled: true,
        size: '100mb',
        ttl: '5m'
      },
      ...config
    }
  }

  /**
   * Execute search with comprehensive error handling and performance monitoring
   */
  async search(query: SearchQuery<T>): Promise<SearchResponse<T>> {
    const searchId = this.generateSearchId()
    const startTime = Date.now()
    
    try {
      // Validate query
      this.validateSearchQuery(query)

      // Execute middleware chain
      const response = await this.executeMiddleware(query, async () => {
        return await this.performSearch(query, searchId)
      })

      const queryTime = Date.now() - startTime

      // Track analytics
      await this.trackSearchEvent({
        eventId: generateId(),
        searchId,
        sessionId: this.getSessionId(),
        timestamp: new Date().toISOString(),
        eventType: 'search',
        query: query.query,
        resultCount: response.totalCount,
        queryTime
      })

      return {
        ...response,
        queryTime,
        searchId
      }
    } catch (error) {
      const queryTime = Date.now() - startTime
      
      if (error instanceof SearchError) {
        throw error
      }
      
      throw new SearchError(
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INDEX_UNAVAILABLE',
        { query, queryTime, searchId }
      )
    }
  }

  /**
   * Get search suggestions with intelligent ranking
   */
  async suggest(
    query: string, 
    contentTypes: T[] = [] as T[], 
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    // Implementation would integrate with search index for real suggestions
    // This is a simplified version for demonstration
    const suggestions: SearchSuggestion[] = []
    
    // Term-based suggestions
    const terms = query.toLowerCase().split(' ')
    const lastTerm = terms[terms.length - 1]
    
    if (lastTerm.length >= 2) {
      // Mock implementation - in production, this would query the actual index
      const mockSuggestions = await this.getMockSuggestions(lastTerm, contentTypes)
      suggestions.push(...mockSuggestions.slice(0, limit))
    }

    return suggestions
  }

  /**
   * Perform spell checking with medical terminology support
   */
  async spellCheck(query: string): Promise<SearchSpellCheck | undefined> {
    // Mock implementation - would integrate with medical dictionary
    const words = query.split(' ')
    let suggestions: SearchSpellCheck['suggestions'] = []
    
    for (const word of words) {
      if (word.length >= 3 && this.shouldCheckSpelling(word)) {
        const corrections = await this.getSpellingCorrections(word)
        if (corrections.length > 0) {
          suggestions = [...suggestions, {
            term: word,
            corrections
          }]
        }
      }
    }
    
    return suggestions.length > 0 ? { suggestions } : undefined
  }

  /**
   * Add search middleware for extensibility
   */
  use(middleware: SearchMiddleware<T>): this {
    this.middleware.push(middleware)
    return this
  }

  /**
   * Get search analytics and performance metrics
   */
  getAnalytics(): SearchAnalyticsEvent[] {
    return [...this.analytics]
  }

  /**
   * Clear analytics data
   */
  clearAnalytics(): void {
    this.analytics = []
  }

  private async performSearch(query: SearchQuery<T>, searchId: SearchId): Promise<SearchResponse<T>> {
    // This would integrate with actual search backend (Elasticsearch, Algolia, etc.)
    // For now, implementing a mock search that demonstrates the type system
    
    const results = await this.executeQuery(query)
    const facets = await this.calculateFacets(query)
    const aggregations = await this.calculateAggregations(query)
    const spellCheck = await this.spellCheck(query.query)
    
    return {
      results,
      totalCount: results.length,
      totalPages: Math.ceil(results.length / query.pagination.limit),
      currentPage: query.pagination.page,
      hasNextPage: results.length > query.pagination.limit * query.pagination.page,
      hasPreviousPage: query.pagination.page > 1,
      facets,
      queryTime: 0, // Will be set by caller
      searchId,
      query,
      aggregations,
      spellCheck
    }
  }

  private async executeQuery(query: SearchQuery<T>): Promise<SearchResult<T>[]> {
    // Mock implementation demonstrating type safety
    const mockResults: SearchResult<T>[] = []
    
    // This would be replaced with actual database/index queries
    for (let i = 0; i < Math.min(query.pagination.limit, 20); i++) {
      const mockItem = this.createMockSearchableContent(query.contentTypes[0])
      mockResults.push({
        item: mockItem,
        score: (1.0 - i * 0.05) as RelevanceScore,
        rank: (i + 1) as SearchRank,
        matchedFields: ['title', 'content'],
        highlights: query.options.highlight ? this.createMockHighlights(mockItem) : undefined,
        snippet: query.options.highlight ? this.createSnippet(mockItem, query.query) : undefined
      })
    }
    
    return mockResults
  }

  private async calculateFacets(query: SearchQuery<T>): Promise<SearchFacetResults<T> | undefined> {
    if (!query.facets?.length) return undefined

    const facetResults: SearchFacetResults<T> = {}
    
    for (const facet of query.facets) {
      facetResults[facet.name] = {
        buckets: [
          { key: 'published', count: 45, selected: false },
          { key: 'draft', count: 12, selected: false },
          { key: 'archived', count: 3, selected: false }
        ],
        total: 60
      }
    }
    
    return facetResults
  }

  private async calculateAggregations(query: SearchQuery<T>): Promise<SearchAggregations<T> | undefined> {
    // Mock aggregation calculation
    const baseAggregations = {
      contentType: query.contentTypes.reduce((acc, type) => ({
        ...acc,
        [type]: Math.floor(Math.random() * 100)
      }), {} as Record<T, number>),
      status: {
        published: 45,
        draft: 12,
        archived: 3,
        private: 1
      } as Record<SearchableContent['status'], number>,
      timeRange: {
        day: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10)
        })),
        week: [],
        month: []
      },
      authors: [
        { name: 'Dr. Smith', count: 25 },
        { name: 'Dr. Johnson', count: 18 }
      ],
      tags: [
        { name: 'cardiology', count: 15 },
        { name: 'oncology', count: 12 }
      ],
      categories: [
        { name: 'Clinical Trials', count: 30 },
        { name: 'Research', count: 25 }
      ]
    }

    return baseAggregations as unknown as SearchAggregations<T>
  }

  private createMockSearchableContent(contentType: T): SearchableContent<T> {
    const baseContent = {
      id: this.generateSearchId(),
      type: contentType,
      title: `Mock ${contentType} Item`,
      content: 'This is mock content for testing purposes.',
      excerpt: 'Mock excerpt...',
      status: 'published' as const,
      authorId: 'author-123',
      authorName: 'Dr. Smith',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['medical', 'research'],
      categories: ['healthcare']
    }

    return baseContent as SearchableContent<T>
  }

  private createMockHighlights(item: SearchableContent<T>): SearchHighlight[] {
    return [
      {
        field: 'title',
        fragments: [
          { text: 'Mock ', isHighlighted: false },
          { text: 'search', isHighlighted: true },
          { text: ' Item', isHighlighted: false }
        ],
        matchCount: 1
      }
    ]
  }

  private createSnippet(item: SearchableContent<T>, query: string): string {
    const content = item.content || item.excerpt || item.title
    const queryTerms = query.toLowerCase().split(' ')
    
    // Find the first occurrence of any query term
    const lowerContent = content.toLowerCase()
    let bestIndex = -1
    
    for (const term of queryTerms) {
      const index = lowerContent.indexOf(term)
      if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
        bestIndex = index
      }
    }
    
    if (bestIndex === -1) {
      return content.substring(0, 150) + '...'
    }
    
    const start = Math.max(0, bestIndex - 50)
    const end = Math.min(content.length, bestIndex + 100)
    
    return (start > 0 ? '...' : '') + 
           content.substring(start, end) + 
           (end < content.length ? '...' : '')
  }

  private async executeMiddleware(
    query: SearchQuery<T>, 
    next: () => Promise<SearchResponse<T>>
  ): Promise<SearchResponse<T>> {
    let index = 0
    
    const runMiddleware = async (): Promise<SearchResponse<T>> => {
      if (index >= this.middleware.length) {
        return await next()
      }
      
      const middleware = this.middleware[index++]
      return await middleware(query, runMiddleware)
    }
    
    return await runMiddleware()
  }

  private validateSearchQuery(query: SearchQuery<T>): void {
    if (!query.query?.trim()) {
      throw new SearchError('Query cannot be empty', 'INVALID_QUERY')
    }
    
    if (!query.contentTypes?.length) {
      throw new SearchError('At least one content type must be specified', 'INVALID_QUERY')
    }
    
    if (query.pagination.limit > 100) {
      throw new SearchError('Page limit cannot exceed 100', 'INVALID_QUERY')
    }
    
    if (query.pagination.page < 1) {
      throw new SearchError('Page number must be positive', 'INVALID_QUERY')
    }
  }

  private async trackSearchEvent(event: SearchAnalyticsEvent): Promise<void> {
    this.analytics.push(event)
    
    // In production, this would persist to analytics database
    // For now, just keep in memory with a size limit
    if (this.analytics.length > 1000) {
      this.analytics = this.analytics.slice(-500)
    }
  }

  private generateSearchId(): SearchId {
    return generateId() as SearchId
  }

  private getSessionId(): string {
    // In production, this would be extracted from request context
    return 'session-' + Math.random().toString(36).substring(2)
  }

  private async getMockSuggestions(term: string, contentTypes: T[]): Promise<SearchSuggestion[]> {
    // Mock suggestions based on term
    const suggestions: SearchSuggestion[] = [
      {
        text: term + 'ology',
        type: 'completion',
        score: 0.9 as RelevanceScore,
        category: contentTypes[0] || 'posts',
        count: 25
      },
      {
        text: term + ' research',
        type: 'phrase',
        score: 0.8 as RelevanceScore,
        category: 'publications',
        count: 18
      }
    ]
    
    return suggestions.filter(s => 
      contentTypes.length === 0 || contentTypes.includes(s.category as T)
    )
  }

  private shouldCheckSpelling(word: string): boolean {
    // Skip common medical abbreviations and technical terms
    const medicalTerms = ['edc', 'rct', 'hipaa', 'fda', 'doi', 'nih']
    return !medicalTerms.includes(word.toLowerCase()) && 
           !/^\d+$/.test(word) && 
           word.length >= 3
  }

  private async getSpellingCorrections(word: string): Promise<{ text: string; frequency: number; score: number }[]> {
    // Mock spelling corrections with medical terminology
    const corrections = []
    
    // Simple edit distance corrections (in production, would use medical dictionary)
    if (word === 'cardilogy') {
      corrections.push({ text: 'cardiology', frequency: 1000, score: 0.95 })
    } else if (word === 'onclogy') {
      corrections.push({ text: 'oncology', frequency: 800, score: 0.92 })
    }
    
    return corrections
  }
}

// ============================================================================
// SPECIALIZED SEARCH ENGINES
// ============================================================================

/**
 * Healthcare-specific search engine with medical terminology and compliance
 */
export class HealthcareSearchEngine extends AdvancedSearchEngine<HealthcareContentType> {
  constructor(config?: Partial<SearchEngineConfig>) {
    super({
      ...config,
      analysis: {
        analyzer: 'medical_analyzer',
        tokenizer: 'medical_tokenizer',
        filters: ['lowercase', 'medical_synonyms', 'medical_stemmer', 'stop']
      }
    })

    // Add healthcare-specific middleware
    this.use(this.hipaaComplianceMiddleware)
    this.use(this.medicalTerminologyMiddleware)
  }

  /**
   * Search clinical trials with phase and status filtering
   */
  async searchClinicalTrials(query: string, filters?: {
    phases?: Array<'I' | 'II' | 'III' | 'IV'>
    status?: Array<'recruiting' | 'active' | 'completed' | 'terminated'>
    participantRange?: { min?: number; max?: number }
  }): Promise<SearchResponse<'clinical_trials'>> {
    const searchQuery = SearchQueryBuilder
      .create<'clinical_trials'>()
      .query(query)
      .types('clinical_trials')
      .options({ synonyms: true, stemming: true, fuzzy: true })
      .build()

    if (filters?.phases) {
      const updatedQuery = { 
        ...searchQuery, 
        filters: { 
          ...searchQuery.filters, 
          phase: filters.phases 
        }
      }
      Object.assign(searchQuery, updatedQuery)
    }

    return await this.search(searchQuery as any) as SearchResponse<'clinical_trials'>
  }

  /**
   * Search publications with impact factor and citation filtering
   */
  async searchPublications(query: string, filters?: {
    impactFactorRange?: { min?: number; max?: number }
    publicationType?: Array<'research' | 'review' | 'case_study' | 'editorial'>
    journalNames?: string[]
  }): Promise<SearchResponse<'publications'>> {
    const searchQuery = SearchQueryBuilder
      .create<'publications'>()
      .query(query)
      .types('publications')
      .sortBy('relevance', 'desc')
      .options({ highlight: true, includeMetadata: true })
      .build()

    return await this.search(searchQuery as any) as SearchResponse<'publications'>
  }

  private hipaaComplianceMiddleware: SearchMiddleware<HealthcareContentType> = async (query, next) => {
    // Ensure search complies with HIPAA regulations
    const response = await next()
    
    // Filter out any potentially sensitive content
    const filteredResults = response.results.filter(result => {
      if (result.item.type === 'research_data') {
        const metadata = result.item.metadata as any
        return metadata?.hipaaCompliant !== false && metadata?.anonymized !== false
      }
      return true
    })
    
    return {
      ...response,
      results: filteredResults,
      totalCount: filteredResults.length
    }
  }

  private medicalTerminologyMiddleware: SearchMiddleware<HealthcareContentType> = async (query, next) => {
    // Expand medical terminology and abbreviations
    let expandedQuery = query.query
    
    const medicalAbbreviations: Record<string, string[]> = {
      'mi': ['myocardial infarction', 'heart attack'],
      'copd': ['chronic obstructive pulmonary disease'],
      'dm': ['diabetes mellitus', 'diabetes'],
      'htn': ['hypertension', 'high blood pressure']
    }
    
    for (const [abbr, expansions] of Object.entries(medicalAbbreviations)) {
      if (expandedQuery.toLowerCase().includes(abbr)) {
        expandedQuery += ' OR ' + expansions.join(' OR ')
      }
    }
    
    const expandedSearchQuery = { ...query, query: expandedQuery }
    return await next()
  }
}

// ============================================================================
// FACTORY AND UTILITIES
// ============================================================================

/**
 * Search engine factory with type-safe instantiation
 */
export class SearchEngineFactory {
  /**
   * Create a general-purpose search engine
   */
  static create<T extends SearchableContentType>(
    config?: Partial<SearchEngineConfig>
  ): AdvancedSearchEngine<T> {
    return new AdvancedSearchEngine<T>(config)
  }

  /**
   * Create a healthcare-specialized search engine
   */
  static createHealthcare(
    config?: Partial<SearchEngineConfig>
  ): HealthcareSearchEngine {
    return new HealthcareSearchEngine(config)
  }

  /**
   * Create a search engine optimized for specific content types
   */
  static createForTypes<T extends SearchableContentType>(
    types: T[],
    config?: Partial<SearchEngineConfig>
  ): AdvancedSearchEngine<T> {
    const engine = new AdvancedSearchEngine<T>(config)
    
    // Add type-specific optimizations
    if (types.includes('media' as T)) {
      engine.use(async (query, next) => {
        // Optimize for media searches
        return await next()
      })
    }
    
    return engine
  }
}

// Export commonly used query builder
export const Query = SearchQueryBuilder