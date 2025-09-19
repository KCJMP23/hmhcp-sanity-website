/**
 * Core Search Engine for Healthcare Publications
 * Implements PostgreSQL full-text search with healthcare-specific optimizations
 * Story 3.7c Task 3: Full-Text Search Implementation
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logSearchQuery } from './search-analytics'
import { processQuery, normalizeQuery } from './query-processor'
import { rankResults, calculateRelevanceScore } from './result-ranker'
import { getCachedResults, setCachedResults } from '@/lib/cache/redis-cache'
import logger from '@/lib/logging/winston-logger'

export interface SearchOptions {
  query: string
  limit?: number
  offset?: number
  filters?: SearchFilters
  sortBy?: SortOption
  sortOrder?: 'asc' | 'desc'
  searchType?: SearchType
  includeHighlights?: boolean
  userId?: string
  userAgent?: string
  ipAddress?: string
  sessionId?: string
}

export interface SearchFilters {
  publicationType?: string[]
  year?: { from?: number; to?: number }
  authors?: string[]
  journal?: string[]
  categories?: string[]
  keywords?: string[]
  hasAbstract?: boolean
  hasPdf?: boolean
  isOpenAccess?: boolean
  minCitations?: number
  maxCitations?: number
  status?: 'published' | 'draft' | 'archived'
}

export interface SearchResult {
  id: string
  title: string
  abstract?: string
  authors: any[]
  journal?: string
  year?: number
  publicationType: string
  categories: string[]
  keywords: string[]
  doi?: string
  pmid?: string
  pdfUrl?: string
  citationCount: number
  viewCount: number
  downloadCount: number
  isOpenAccess: boolean
  relevanceScore: number
  highlights?: SearchHighlights
  publishedDate?: string
  createdAt: string
  updatedAt: string
}

export interface SearchHighlights {
  title?: string[]
  abstract?: string[]
  authors?: string[]
  keywords?: string[]
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  page: number
  limit: number
  totalPages: number
  executionTimeMs: number
  query: {
    original: string
    normalized: string
    processed: string
  }
  facets?: SearchFacets
  suggestions?: string[]
}

export interface SearchFacets {
  publicationTypes: { value: string; count: number }[]
  years: { value: number; count: number }[]
  authors: { value: string; count: number }[]
  journals: { value: string; count: number }[]
  categories: { value: string; count: number }[]
  keywords: { value: string; count: number }[]
}

export type SearchType = 'full_text' | 'faceted' | 'similar' | 'autocomplete' | 'advanced'
export type SortOption = 'relevance' | 'date' | 'citations' | 'title' | 'author'

export class SearchEngine {
  private supabase: any
  private searchCache = new Map<string, { results: any; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.supabase = null
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createServerSupabaseClient()
    }
    return this.supabase
  }

  /**
   * Main search method with full-text search capabilities
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now()
    
    try {
      // Validate and process query
      if (!options.query || options.query.trim().length === 0) {
        throw new Error('Search query is required')
      }

      // Set defaults
      const searchOptions = {
        limit: Math.min(options.limit || 10, 100),
        offset: options.offset || 0,
        sortBy: options.sortBy || 'relevance',
        sortOrder: options.sortOrder || 'desc',
        searchType: options.searchType || 'full_text',
        includeHighlights: options.includeHighlights !== false,
        ...options
      }

      // Process query
      const processedQuery = await processQuery(options.query)
      const normalizedQuery = normalizeQuery(options.query)

      // Check cache first
      const cacheKey = this.generateCacheKey(searchOptions)
      const cachedResults = await this.getCachedSearch(cacheKey)
      if (cachedResults) {
        logger.info('Search cache hit', { query: options.query, cacheKey })
        return cachedResults
      }

      // Perform database search
      const supabase = await this.getSupabase()
      const results = await this.performSearch(supabase, processedQuery, searchOptions)
      
      // Calculate execution time
      const executionTimeMs = Date.now() - startTime

      // Build response
      const response: SearchResponse = {
        results: results.data || [],
        total: results.total || 0,
        page: Math.floor(searchOptions.offset / searchOptions.limit) + 1,
        limit: searchOptions.limit,
        totalPages: Math.ceil((results.total || 0) / searchOptions.limit),
        executionTimeMs,
        query: {
          original: options.query,
          normalized: normalizedQuery,
          processed: processedQuery.query
        },
        facets: results.facets,
        suggestions: results.suggestions
      }

      // Cache results
      await this.setCachedSearch(cacheKey, response)

      // Log search query for analytics
      await logSearchQuery({
        query: options.query,
        normalizedQuery,
        resultsCount: response.total,
        executionTimeMs,
        searchType: searchOptions.searchType,
        userId: options.userId,
        userAgent: options.userAgent,
        ipAddress: options.ipAddress,
        filters: options.filters || {},
        sessionId: options.sessionId
      })

      logger.info('Search completed successfully', {
        query: options.query,
        resultsCount: response.total,
        executionTimeMs
      })

      return response
    } catch (error) {
      const executionTimeMs = Date.now() - startTime
      logger.error('Search failed', {
        query: options.query,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs
      })

      // Log failed search for analytics
      await logSearchQuery({
        query: options.query,
        normalizedQuery: normalizeQuery(options.query),
        resultsCount: 0,
        executionTimeMs,
        searchType: options.searchType || 'full_text',
        userId: options.userId,
        userAgent: options.userAgent,
        ipAddress: options.ipAddress,
        filters: options.filters || {},
        sessionId: options.sessionId
      }).catch(() => {}) // Don't fail the main request if logging fails

      throw error
    }
  }

  /**
   * Perform the actual database search with PostgreSQL full-text search
   */
  private async performSearch(supabase: any, processedQuery: any, options: SearchOptions) {
    // Build the base query
    let query = supabase
      .from('publications')
      .select(`
        id, title, abstract, authors, journal, year, publication_type,
        categories, keywords, doi, pmid, pdf_url, citation_count,
        view_count, download_count, is_open_access, search_rank,
        publication_date, created_at, updated_at,
        ts_rank_cd(search_vector, to_tsquery('healthcare_english', $1), 32) as relevance_score
      `, { count: 'exact' })

    // Apply full-text search
    if (processedQuery.hasTextQuery) {
      query = query
        .textSearch('search_vector', processedQuery.query, {
          config: 'healthcare_english',
          type: 'websearch'
        })
    }

    // Apply filters
    query = this.applyFilters(query, options.filters)

    // Apply sorting
    query = this.applySorting(query, options.sortBy!, options.sortOrder!)

    // Apply pagination
    query = query.range(options.offset!, options.offset! + options.limit! - 1)

    // Execute query
    const { data, error, count } = await query

    if (error) {
      logger.error('Database search error', { error: error.message })
      throw new Error(`Search failed: ${error.message}`)
    }

    // Process results with highlights if requested
    let processedResults = data || []
    if (options.includeHighlights && processedQuery.hasTextQuery) {
      processedResults = await this.addHighlights(supabase, processedResults, processedQuery.query)
    }

    // Get facets if this is a faceted search
    let facets: SearchFacets | undefined
    if (options.searchType === 'faceted') {
      facets = await this.generateFacets(supabase, options.filters)
    }

    return {
      data: processedResults,
      total: count,
      facets,
      suggestions: await this.generateSuggestions(processedQuery.originalQuery)
    }
  }

  /**
   * Apply search filters to the query
   */
  private applyFilters(query: any, filters?: SearchFilters) {
    if (!filters) return query

    // Status filter
    if (filters.status) {
      query = query.eq('status', filters.status)
    } else {
      query = query.eq('status', 'published') // Default to published only
    }

    // Publication type filter
    if (filters.publicationType && filters.publicationType.length > 0) {
      query = query.in('publication_type', filters.publicationType)
    }

    // Year range filter
    if (filters.year) {
      if (filters.year.from) {
        query = query.gte('year', filters.year.from)
      }
      if (filters.year.to) {
        query = query.lte('year', filters.year.to)
      }
    }

    // Author filter
    if (filters.authors && filters.authors.length > 0) {
      // Search in authors JSONB array
      const authorConditions = filters.authors.map(author => 
        `authors @> '[{"name": "${author}"}]'`
      ).join(' OR ')
      query = query.or(authorConditions)
    }

    // Journal filter
    if (filters.journal && filters.journal.length > 0) {
      query = query.in('journal', filters.journal)
    }

    // Categories filter
    if (filters.categories && filters.categories.length > 0) {
      query = query.overlaps('categories', filters.categories)
    }

    // Keywords filter
    if (filters.keywords && filters.keywords.length > 0) {
      query = query.overlaps('keywords', filters.keywords)
    }

    // Abstract availability filter
    if (filters.hasAbstract !== undefined) {
      if (filters.hasAbstract) {
        query = query.not('abstract', 'is', null).neq('abstract', '')
      } else {
        query = query.or('abstract.is.null,abstract.eq.')
      }
    }

    // PDF availability filter
    if (filters.hasPdf !== undefined) {
      if (filters.hasPdf) {
        query = query.not('pdf_url', 'is', null).neq('pdf_url', '')
      } else {
        query = query.or('pdf_url.is.null,pdf_url.eq.')
      }
    }

    // Open access filter
    if (filters.isOpenAccess !== undefined) {
      query = query.eq('is_open_access', filters.isOpenAccess)
    }

    // Citation count filters
    if (filters.minCitations !== undefined) {
      query = query.gte('citation_count', filters.minCitations)
    }
    if (filters.maxCitations !== undefined) {
      query = query.lte('citation_count', filters.maxCitations)
    }

    return query
  }

  /**
   * Apply sorting to the query
   */
  private applySorting(query: any, sortBy: SortOption, sortOrder: 'asc' | 'desc') {
    const ascending = sortOrder === 'asc'

    switch (sortBy) {
      case 'relevance':
        return query.order('relevance_score', { ascending: false })
                   .order('search_rank', { ascending: false })
                   .order('citation_count', { ascending: false })
      case 'date':
        return query.order('publication_date', { ascending })
                   .order('created_at', { ascending })
      case 'citations':
        return query.order('citation_count', { ascending })
      case 'title':
        return query.order('title', { ascending })
      case 'author':
        return query.order('authors', { ascending })
      default:
        return query.order('relevance_score', { ascending: false })
    }
  }

  /**
   * Add search result highlights
   */
  private async addHighlights(supabase: any, results: any[], queryText: string): Promise<any[]> {
    return results.map(result => {
      const highlights: SearchHighlights = {}

      // Generate highlights using PostgreSQL's ts_headline function
      // This would typically be done in a separate query for performance
      if (result.title) {
        highlights.title = this.generateHighlight(result.title, queryText)
      }
      if (result.abstract) {
        highlights.abstract = this.generateHighlight(result.abstract, queryText)
      }
      if (result.authors) {
        const authorsText = result.authors.map((a: any) => a.name).join(' ')
        highlights.authors = this.generateHighlight(authorsText, queryText)
      }
      if (result.keywords) {
        highlights.keywords = this.generateHighlight(result.keywords.join(' '), queryText)
      }

      return {
        ...result,
        highlights
      }
    })
  }

  /**
   * Generate search result highlights (simplified version)
   */
  private generateHighlight(text: string, query: string): string[] {
    if (!text || !query) return []
    
    const queryTerms = query.toLowerCase().split(/\s+/)
    const words = text.split(/\s+/)
    const highlights: string[] = []
    
    // Find sentences containing query terms
    const sentences = text.split(/[.!?]+/)
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase()
      if (queryTerms.some(term => lowerSentence.includes(term))) {
        // Highlight matching terms
        let highlighted = sentence
        for (const term of queryTerms) {
          const regex = new RegExp(`\\b${term}\\b`, 'gi')
          highlighted = highlighted.replace(regex, `<mark>$&</mark>`)
        }
        highlights.push(highlighted.trim())
        
        if (highlights.length >= 3) break // Limit to 3 highlights per field
      }
    }
    
    return highlights
  }

  /**
   * Generate search facets for faceted search
   */
  private async generateFacets(supabase: any, filters?: SearchFilters): Promise<SearchFacets> {
    const facetQueries = [
      // Publication types
      supabase
        .from('publications')
        .select('publication_type, count(*)')
        .eq('status', 'published')
        .group('publication_type')
        .order('count', { ascending: false })
        .limit(20),

      // Years
      supabase
        .from('publications')
        .select('year, count(*)')
        .eq('status', 'published')
        .not('year', 'is', null)
        .group('year')
        .order('year', { ascending: false })
        .limit(20),

      // Top journals
      supabase
        .from('publications')
        .select('journal, count(*)')
        .eq('status', 'published')
        .not('journal', 'is', null)
        .group('journal')
        .order('count', { ascending: false })
        .limit(20)
    ]

    const [typeResults, yearResults, journalResults] = await Promise.all(facetQueries)

    return {
      publicationTypes: (typeResults.data || []).map((item: any) => ({
        value: item.publication_type,
        count: item.count
      })),
      years: (yearResults.data || []).map((item: any) => ({
        value: item.year,
        count: item.count
      })),
      authors: [], // Would need more complex query for authors
      journals: (journalResults.data || []).map((item: any) => ({
        value: item.journal,
        count: item.count
      })),
      categories: [], // Would need array aggregation
      keywords: [] // Would need array aggregation
    }
  }

  /**
   * Generate search suggestions
   */
  private async generateSuggestions(query: string): Promise<string[]> {
    const supabase = await this.getSupabase()
    
    const { data } = await supabase
      .rpc('get_search_suggestions', {
        input_text: query.toLowerCase(),
        limit_results: 5
      })

    return (data || []).map((item: any) => item.suggestion)
  }

  /**
   * Find similar publications using vector similarity
   */
  async findSimilar(publicationId: string, limit: number = 10): Promise<SearchResult[]> {
    const supabase = await this.getSupabase()

    // First get the source publication's search vector
    const { data: sourcePublication, error: sourceError } = await supabase
      .from('publications')
      .select('search_vector, title')
      .eq('id', publicationId)
      .eq('status', 'published')
      .single()

    if (sourceError || !sourcePublication) {
      throw new Error('Source publication not found')
    }

    // Find similar publications using vector similarity
    // This is a simplified approach - in production you might use more sophisticated similarity measures
    const { data, error } = await supabase
      .from('publications')
      .select(`
        id, title, abstract, authors, journal, year, publication_type,
        categories, keywords, doi, pmid, pdf_url, citation_count,
        view_count, download_count, is_open_access, search_rank,
        publication_date, created_at, updated_at
      `)
      .eq('status', 'published')
      .neq('id', publicationId)
      .order('search_rank', { ascending: false })
      .limit(limit * 3) // Get more results to filter

    if (error) {
      throw new Error(`Failed to find similar publications: ${error.message}`)
    }

    // Filter and rank results based on similarity
    // This is a placeholder - would use more sophisticated similarity in production
    return (data || []).slice(0, limit).map(pub => ({
      ...pub,
      relevanceScore: Math.random() * 0.5 + 0.3 // Placeholder similarity score
    }))
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (!query || query.length < 2) return []

    const supabase = await this.getSupabase()
    
    const { data } = await supabase
      .rpc('get_search_suggestions', {
        input_text: query.toLowerCase(),
        limit_results: limit
      })

    return (data || []).map((item: any) => item.suggestion)
  }

  /**
   * Cache management
   */
  private generateCacheKey(options: SearchOptions): string {
    const keyData = {
      query: options.query,
      filters: options.filters,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      limit: options.limit,
      offset: options.offset
    }
    return `search:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`
  }

  private async getCachedSearch(cacheKey: string): Promise<SearchResponse | null> {
    try {
      const cached = this.searchCache.get(cacheKey)
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        return cached.results
      }
      return null
    } catch (error) {
      logger.warn('Failed to get cached search results', { error })
      return null
    }
  }

  private async setCachedSearch(cacheKey: string, results: SearchResponse): Promise<void> {
    try {
      this.searchCache.set(cacheKey, {
        results,
        timestamp: Date.now()
      })
      
      // Clean up old cache entries
      if (this.searchCache.size > 1000) {
        const cutoffTime = Date.now() - this.CACHE_TTL
        for (const [key, value] of this.searchCache.entries()) {
          if (value.timestamp < cutoffTime) {
            this.searchCache.delete(key)
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to cache search results', { error })
    }
  }
}

// Export singleton instance
export const searchEngine = new SearchEngine()

// Export search function for direct use
export async function search(options: SearchOptions): Promise<SearchResponse> {
  return searchEngine.search(options)
}

export async function findSimilar(publicationId: string, limit?: number): Promise<SearchResult[]> {
  return searchEngine.findSimilar(publicationId, limit)
}

export async function getAutocompleteSuggestions(query: string, limit?: number): Promise<string[]> {
  return searchEngine.getAutocompleteSuggestions(query, limit)
}