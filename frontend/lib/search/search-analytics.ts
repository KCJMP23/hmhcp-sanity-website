/**
 * Search Analytics for Healthcare Publications
 * Handles search query logging, analytics, and insights
 * Story 3.7c Task 3: Full-Text Search Implementation
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import logger from '@/lib/logging/winston-logger'
import { getCachedResults, setCachedResults } from '@/lib/cache/redis-cache'

export interface SearchLogEntry {
  query: string
  normalizedQuery: string
  resultsCount: number
  executionTimeMs: number
  searchType: SearchType
  userId?: string
  userAgent?: string
  ipAddress?: string
  filters: Record<string, any>
  sessionId?: string
  timestamp: Date
  resultClicked?: boolean
  clickedResultId?: string
}

export interface SearchAnalytics {
  totalSearches: number
  uniqueQueries: number
  averageExecutionTime: number
  topQueries: QueryStats[]
  searchTrends: TrendData[]
  performanceMetrics: PerformanceMetrics
  userBehavior: UserBehaviorStats
  popularFilters: FilterStats[]
  failedSearches: FailedSearchStats
}

export interface QueryStats {
  query: string
  count: number
  averageResultCount: number
  averageExecutionTime: number
  clickThroughRate: number
  lastUsed: Date
  trend: 'rising' | 'falling' | 'stable'
}

export interface TrendData {
  date: string
  totalSearches: number
  uniqueQueries: number
  averageExecutionTime: number
  topQuery: string
}

export interface PerformanceMetrics {
  averageExecutionTime: number
  p50ExecutionTime: number
  p90ExecutionTime: number
  p95ExecutionTime: number
  slowQueries: SlowQueryStats[]
  fastestQueries: QueryStats[]
}

export interface UserBehaviorStats {
  totalUsers: number
  averageSearchesPerUser: number
  sessionDuration: number
  bounceRate: number
  repeatSearchRate: number
  refinementRate: number
}

export interface FilterStats {
  filterType: string
  filterValue: string
  usage: number
  averageResultImprovement: number
}

export interface FailedSearchStats {
  totalFailed: number
  zeroResultQueries: QueryStats[]
  errorQueries: QueryStats[]
  suggestedImprovements: string[]
}

export interface SlowQueryStats {
  query: string
  averageExecutionTime: number
  occurrences: number
  suggestedOptimization: string
}

export type SearchType = 'full_text' | 'faceted' | 'similar' | 'autocomplete' | 'advanced'

export class SearchAnalyticsManager {
  private supabase: any
  private analyticsCache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 15 * 60 * 1000 // 15 minutes

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
   * Log a search query for analytics
   */
  async logSearchQuery(entry: SearchLogEntry): Promise<string | null> {
    try {
      const supabase = await this.getSupabase()
      
      // Generate query hash for deduplication
      const queryHash = this.generateQueryHash(entry.normalizedQuery, entry.filters)
      
      // Insert search log entry
      const { data, error } = await supabase
        .from('search_statistics')
        .insert({
          query: entry.query,
          query_hash: queryHash,
          normalized_query: entry.normalizedQuery,
          results_count: entry.resultsCount,
          execution_time_ms: entry.executionTimeMs,
          search_type: entry.searchType,
          user_id: entry.userId,
          user_agent: entry.userAgent,
          ip_address: entry.ipAddress,
          filters: entry.filters,
          session_id: entry.sessionId,
          result_clicked: entry.resultClicked || false,
          clicked_result_id: entry.clickedResultId,
          created_at: entry.timestamp.toISOString()
        })
        .select('id')
        .single()

      if (error) {
        logger.error('Failed to log search query', { error: error.message })
        return null
      }

      // Update search suggestions
      await this.updateSearchSuggestions(entry.query, entry.normalizedQuery)

      // Clear analytics cache to ensure fresh data
      this.clearAnalyticsCache()

      return data?.id || null
    } catch (error) {
      logger.error('Error logging search query', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        query: entry.query
      })
      return null
    }
  }

  /**
   * Log when a user clicks on a search result
   */
  async logResultClick(searchId: string, resultId: string, clickPosition: number): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      
      // Update the search statistics entry
      const { error } = await supabase
        .from('search_statistics')
        .update({
          result_clicked: true,
          clicked_result_id: resultId,
          click_position: clickPosition,
          updated_at: new Date().toISOString()
        })
        .eq('id', searchId)

      if (error) {
        logger.error('Failed to log result click', { error: error.message, searchId, resultId })
      }

      // Update click tracking for the publication
      await this.updatePublicationMetrics(resultId, 'view')
    } catch (error) {
      logger.error('Error logging result click', {
        error: error instanceof Error ? error.message : 'Unknown error',
        searchId,
        resultId
      })
    }
  }

  /**
   * Get comprehensive search analytics
   */
  async getSearchAnalytics(
    dateFrom?: Date, 
    dateTo?: Date, 
    userId?: string
  ): Promise<SearchAnalytics> {
    const cacheKey = `analytics:${dateFrom?.toISOString() || 'all'}:${dateTo?.toISOString() || 'all'}:${userId || 'all'}`
    
    // Check cache first
    const cached = this.analyticsCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data
    }

    try {
      const supabase = await this.getSupabase()
      
      // Build date filter
      let dateFilter = ''
      if (dateFrom && dateTo) {
        dateFilter = ` AND created_at BETWEEN '${dateFrom.toISOString()}' AND '${dateTo.toISOString()}'`
      }
      
      // Build user filter
      let userFilter = ''
      if (userId) {
        userFilter = ` AND user_id = '${userId}'`
      }

      // Get basic statistics
      const basicStats = await this.getBasicStatistics(supabase, dateFilter, userFilter)
      
      // Get top queries
      const topQueries = await this.getTopQueries(supabase, dateFilter, userFilter)
      
      // Get search trends
      const searchTrends = await this.getSearchTrends(supabase, dateFilter, userFilter)
      
      // Get performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(supabase, dateFilter, userFilter)
      
      // Get user behavior stats
      const userBehavior = await this.getUserBehaviorStats(supabase, dateFilter, userFilter)
      
      // Get popular filters
      const popularFilters = await this.getPopularFilters(supabase, dateFilter, userFilter)
      
      // Get failed search stats
      const failedSearches = await this.getFailedSearchStats(supabase, dateFilter, userFilter)

      const analytics: SearchAnalytics = {
        totalSearches: basicStats.total,
        uniqueQueries: basicStats.unique,
        averageExecutionTime: basicStats.avgExecutionTime,
        topQueries,
        searchTrends,
        performanceMetrics,
        userBehavior,
        popularFilters,
        failedSearches
      }

      // Cache the results
      this.analyticsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      })

      return analytics
    } catch (error) {
      logger.error('Failed to get search analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dateFrom,
        dateTo,
        userId
      })
      throw error
    }
  }

  /**
   * Get basic search statistics
   */
  private async getBasicStatistics(
    supabase: any, 
    dateFilter: string, 
    userFilter: string
  ): Promise<{ total: number; unique: number; avgExecutionTime: number }> {
    const { data, error } = await supabase.rpc('get_search_basic_stats', {
      date_filter: dateFilter,
      user_filter: userFilter
    })

    if (error) {
      logger.error('Failed to get basic statistics', { error: error.message })
      return { total: 0, unique: 0, avgExecutionTime: 0 }
    }

    return {
      total: data?.[0]?.total_searches || 0,
      unique: data?.[0]?.unique_queries || 0,
      avgExecutionTime: data?.[0]?.avg_execution_time || 0
    }
  }

  /**
   * Get top search queries with statistics
   */
  private async getTopQueries(
    supabase: any, 
    dateFilter: string, 
    userFilter: string
  ): Promise<QueryStats[]> {
    const { data, error } = await supabase
      .from('search_statistics')
      .select(`
        normalized_query,
        count(),
        avg(results_count) as avg_results,
        avg(execution_time_ms) as avg_execution_time,
        avg(case when result_clicked then 1.0 else 0.0 end) as click_through_rate,
        max(created_at) as last_used
      `)
      .eq('1', '1') // Always true condition to allow dynamic filters
      .gte('created_at', dateFilter ? dateFilter.split("'")[1] : '1970-01-01')
      .lte('created_at', dateFilter ? dateFilter.split("'")[3] : '2099-12-31')
      .group('normalized_query')
      .order('count', { ascending: false })
      .limit(20)

    if (error) {
      logger.error('Failed to get top queries', { error: error.message })
      return []
    }

    return (data || []).map((item: any) => ({
      query: item.normalized_query,
      count: item.count,
      averageResultCount: Math.round(item.avg_results || 0),
      averageExecutionTime: Math.round(item.avg_execution_time || 0),
      clickThroughRate: Math.round((item.click_through_rate || 0) * 100) / 100,
      lastUsed: new Date(item.last_used),
      trend: 'stable' as const // Would need historical data to determine actual trend
    }))
  }

  /**
   * Get search trends over time
   */
  private async getSearchTrends(
    supabase: any, 
    dateFilter: string, 
    userFilter: string
  ): Promise<TrendData[]> {
    const { data, error } = await supabase
      .from('search_statistics')
      .select(`
        created_at::date as date,
        count() as total_searches,
        count(distinct normalized_query) as unique_queries,
        avg(execution_time_ms) as avg_execution_time
      `)
      .gte('created_at', dateFilter ? dateFilter.split("'")[1] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .group('created_at::date')
      .order('date')

    if (error) {
      logger.error('Failed to get search trends', { error: error.message })
      return []
    }

    // Get top query for each date
    const trendsWithTopQueries = await Promise.all(
      (data || []).map(async (trend: any) => {
        const { data: topQueryData } = await supabase
          .from('search_statistics')
          .select('normalized_query, count()')
          .eq('created_at::date', trend.date)
          .group('normalized_query')
          .order('count', { ascending: false })
          .limit(1)
          .single()

        return {
          date: trend.date,
          totalSearches: trend.total_searches,
          uniqueQueries: trend.unique_queries,
          averageExecutionTime: Math.round(trend.avg_execution_time || 0),
          topQuery: topQueryData?.normalized_query || 'N/A'
        }
      })
    )

    return trendsWithTopQueries
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(
    supabase: any, 
    dateFilter: string, 
    userFilter: string
  ): Promise<PerformanceMetrics> {
    // Get execution time percentiles
    const { data: percentileData, error: percentileError } = await supabase.rpc(
      'get_execution_time_percentiles',
      { date_filter: dateFilter, user_filter: userFilter }
    )

    if (percentileError) {
      logger.error('Failed to get performance percentiles', { error: percentileError.message })
    }

    const percentiles = percentileData?.[0] || {}

    // Get slow queries
    const { data: slowQueries } = await supabase
      .from('search_statistics')
      .select('normalized_query, avg(execution_time_ms) as avg_time, count()')
      .gte('execution_time_ms', 1000) // Queries taking more than 1 second
      .group('normalized_query')
      .order('avg_time', { ascending: false })
      .limit(10)

    // Get fastest queries
    const { data: fastQueries } = await supabase
      .from('search_statistics')
      .select('normalized_query, avg(execution_time_ms) as avg_time, count()')
      .lt('execution_time_ms', 100) // Queries taking less than 100ms
      .group('normalized_query')
      .order('count', { ascending: false })
      .limit(10)

    return {
      averageExecutionTime: percentiles.avg_time || 0,
      p50ExecutionTime: percentiles.p50 || 0,
      p90ExecutionTime: percentiles.p90 || 0,
      p95ExecutionTime: percentiles.p95 || 0,
      slowQueries: (slowQueries || []).map((q: any) => ({
        query: q.normalized_query,
        averageExecutionTime: Math.round(q.avg_time),
        occurrences: q.count,
        suggestedOptimization: this.getSuggestedOptimization(q.normalized_query)
      })),
      fastestQueries: (fastQueries || []).map((q: any) => ({
        query: q.normalized_query,
        count: q.count,
        averageResultCount: 0,
        averageExecutionTime: Math.round(q.avg_time),
        clickThroughRate: 0,
        lastUsed: new Date(),
        trend: 'stable' as const
      }))
    }
  }

  /**
   * Get user behavior statistics
   */
  private async getUserBehaviorStats(
    supabase: any, 
    dateFilter: string, 
    userFilter: string
  ): Promise<UserBehaviorStats> {
    // This would require more complex queries and session tracking
    // For now, return placeholder data
    return {
      totalUsers: 0,
      averageSearchesPerUser: 0,
      sessionDuration: 0,
      bounceRate: 0,
      repeatSearchRate: 0,
      refinementRate: 0
    }
  }

  /**
   * Get popular filters
   */
  private async getPopularFilters(
    supabase: any, 
    dateFilter: string, 
    userFilter: string
  ): Promise<FilterStats[]> {
    // This would require analyzing the filters JSONB column
    // For now, return placeholder data
    return []
  }

  /**
   * Get failed search statistics
   */
  private async getFailedSearchStats(
    supabase: any, 
    dateFilter: string, 
    userFilter: string
  ): Promise<FailedSearchStats> {
    // Get zero result queries
    const { data: zeroResultQueries } = await supabase
      .from('search_statistics')
      .select('normalized_query, count(), avg(execution_time_ms) as avg_time')
      .eq('results_count', 0)
      .group('normalized_query')
      .order('count', { ascending: false })
      .limit(10)

    const totalFailed = (zeroResultQueries || []).reduce((sum: number, q: any) => sum + q.count, 0)

    return {
      totalFailed,
      zeroResultQueries: (zeroResultQueries || []).map((q: any) => ({
        query: q.normalized_query,
        count: q.count,
        averageResultCount: 0,
        averageExecutionTime: Math.round(q.avg_time || 0),
        clickThroughRate: 0,
        lastUsed: new Date(),
        trend: 'stable' as const
      })),
      errorQueries: [],
      suggestedImprovements: [
        'Consider expanding medical terminology dictionary',
        'Add more synonyms for common medical terms',
        'Implement fuzzy matching for typos',
        'Create guided search suggestions'
      ]
    }
  }

  /**
   * Update search suggestions based on query patterns
   */
  private async updateSearchSuggestions(query: string, normalizedQuery: string): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      
      // Insert or update search suggestion
      await supabase
        .from('search_suggestions')
        .upsert({
          suggestion: query,
          suggestion_normalized: normalizedQuery,
          frequency: 1,
          last_used_at: new Date().toISOString(),
          category: this.categorizeQuery(query)
        }, {
          onConflict: 'suggestion',
          ignoreDuplicates: false
        })

      // Update frequency if it already exists
      await supabase.rpc('increment_suggestion_frequency', {
        suggestion_text: query
      })
    } catch (error) {
      logger.error('Failed to update search suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query
      })
    }
  }

  /**
   * Update publication metrics (views, downloads)
   */
  private async updatePublicationMetrics(publicationId: string, metricType: 'view' | 'download'): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      
      const column = metricType === 'view' ? 'view_count' : 'download_count'
      
      await supabase.rpc('increment_publication_metric', {
        pub_id: publicationId,
        metric_type: column
      })
    } catch (error) {
      logger.error('Failed to update publication metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicationId,
        metricType
      })
    }
  }

  /**
   * Generate query hash for caching and deduplication
   */
  private generateQueryHash(query: string, filters: Record<string, any>): string {
    const queryData = {
      query: query.toLowerCase().trim(),
      filters: JSON.stringify(filters, Object.keys(filters).sort())
    }
    return Buffer.from(JSON.stringify(queryData)).toString('base64')
  }

  /**
   * Categorize a query based on its content
   */
  private categorizeQuery(query: string): string {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('ai') || lowerQuery.includes('artificial intelligence') || lowerQuery.includes('machine learning')) {
      return 'ai_technology'
    }
    
    if (lowerQuery.includes('cancer') || lowerQuery.includes('tumor') || lowerQuery.includes('oncology')) {
      return 'oncology'
    }
    
    if (lowerQuery.includes('heart') || lowerQuery.includes('cardiac') || lowerQuery.includes('cardiovascular')) {
      return 'cardiology'
    }
    
    if (lowerQuery.includes('brain') || lowerQuery.includes('neuro') || lowerQuery.includes('alzheimer')) {
      return 'neurology'
    }
    
    if (lowerQuery.includes('diabetes') || lowerQuery.includes('insulin') || lowerQuery.includes('blood sugar')) {
      return 'endocrinology'
    }
    
    return 'general_medical'
  }

  /**
   * Get suggested optimization for slow queries
   */
  private getSuggestedOptimization(query: string): string {
    if (query.length > 50) {
      return 'Consider using more specific terms instead of long phrases'
    }
    
    if (query.split(' ').length > 5) {
      return 'Try using fewer, more specific keywords'
    }
    
    if (query.includes('*') || query.includes('?')) {
      return 'Wildcard searches can be slow - consider exact terms when possible'
    }
    
    return 'Consider adding filters to narrow down the search scope'
  }

  /**
   * Clear analytics cache
   */
  private clearAnalyticsCache(): void {
    this.analyticsCache.clear()
  }

  /**
   * Get trending search terms
   */
  async getTrendingSearches(limit: number = 10): Promise<QueryStats[]> {
    try {
      const supabase = await this.getSupabase()
      
      // Get searches from the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      const { data, error } = await supabase
        .from('search_statistics')
        .select('normalized_query, count(), avg(results_count) as avg_results')
        .gte('created_at', sevenDaysAgo.toISOString())
        .group('normalized_query')
        .order('count', { ascending: false })
        .limit(limit)

      if (error) {
        logger.error('Failed to get trending searches', { error: error.message })
        return []
      }

      return (data || []).map((item: any) => ({
        query: item.normalized_query,
        count: item.count,
        averageResultCount: Math.round(item.avg_results || 0),
        averageExecutionTime: 0,
        clickThroughRate: 0,
        lastUsed: new Date(),
        trend: 'rising' as const
      }))
    } catch (error) {
      logger.error('Error getting trending searches', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return []
    }
  }
}

// Export singleton instance and convenience functions
export const searchAnalytics = new SearchAnalyticsManager()

export async function logSearchQuery(entry: SearchLogEntry): Promise<string | null> {
  return searchAnalytics.logSearchQuery(entry)
}

export async function logResultClick(searchId: string, resultId: string, clickPosition: number): Promise<void> {
  return searchAnalytics.logResultClick(searchId, resultId, clickPosition)
}

export async function getSearchAnalytics(
  dateFrom?: Date, 
  dateTo?: Date, 
  userId?: string
): Promise<SearchAnalytics> {
  return searchAnalytics.getSearchAnalytics(dateFrom, dateTo, userId)
}

export async function getTrendingSearches(limit?: number): Promise<QueryStats[]> {
  return searchAnalytics.getTrendingSearches(limit)
}