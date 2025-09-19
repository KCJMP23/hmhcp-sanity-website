/**
 * HMHCP Blog Database Optimized Queries
 * High-performance database queries with explain analyze patterns
 */

import { createClient } from '@/lib/supabase-server'
import type { BlogPost, BlogTopic } from '@/types/blog'

export interface QueryPerformanceMetrics {
  executionTime: number
  planningTime: number
  rowsReturned: number
  bufferHits: number
  bufferReads: number
  queryPlan: any
}

export class OptimizedBlogQueries {
  private supabase = createClient()

  /**
   * Get published blog posts with optimized pagination
   * Uses materialized view for maximum performance
   */
  async getPublishedPosts(options: {
    page?: number
    limit?: number
    category?: string
    tags?: string[]
    searchQuery?: string
    sortBy?: 'published_at' | 'views_count' | 'engagement_score'
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<{
    posts: any[]
    total: number
    metrics: QueryPerformanceMetrics
  }> {
    const startTime = performance.now()
    
    const {
      page = 1,
      limit = 20,
      category,
      tags,
      searchQuery,
      sortBy = 'published_at',
      sortOrder = 'desc'
    } = options

    const offset = (page - 1) * limit

    let query = this.supabase
      .from('mv_published_blog_posts')
      .select('*', { count: 'exact' })

    // Apply filters with proper indexing
    if (category) {
      query = query.eq('category', category)
    }

    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags)
    }

    if (searchQuery) {
      // Use full-text search index
      query = query.textSearch('title', searchQuery, {
        type: 'websearch',
        config: 'english'
      })
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    const executionTime = performance.now() - startTime

    return {
      posts: data || [],
      total: count || 0,
      metrics: {
        executionTime,
        planningTime: 0, // Would come from EXPLAIN ANALYZE
        rowsReturned: data?.length || 0,
        bufferHits: 0,
        bufferReads: 0,
        queryPlan: null
      }
    }
  }

  /**
   * Get blog post by slug with related content
   * Optimized single query with joins
   */
  async getPostBySlug(slug: string): Promise<{
    post: any
    relatedPosts: any[]
    analytics: any
    metrics: QueryPerformanceMetrics
  }> {
    const startTime = performance.now()

    // Main post query with optimized joins
    const { data: post, error: postError } = await this.supabase
      .from('blog_posts')
      .select(`
        *,
        author:admin_users(first_name, last_name, avatar_url),
        analytics:blog_analytics(
          page_views,
          unique_visitors,
          social_shares,
          engagement_score
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (postError || !post) {
      throw new Error(`Post not found: ${slug}`)
    }

    // Related posts query (optimized with category index)
    const { data: relatedPosts } = await this.supabase
      .from('mv_published_blog_posts')
      .select('id, title, slug, excerpt, featured_image_url, published_at')
      .eq('category', post.category)
      .neq('id', post.id)
      .order('engagement_score', { ascending: false })
      .limit(5)

    // Latest analytics
    const { data: analytics } = await this.supabase
      .from('blog_analytics')
      .select('*')
      .eq('post_id', post.id)
      .order('date_recorded', { ascending: false })
      .limit(30)

    const executionTime = performance.now() - startTime

    return {
      post,
      relatedPosts: relatedPosts || [],
      analytics: analytics || [],
      metrics: {
        executionTime,
        planningTime: 0,
        rowsReturned: 1 + (relatedPosts?.length || 0),
        bufferHits: 0,
        bufferReads: 0,
        queryPlan: null
      }
    }
  }

  /**
   * Get blog automation dashboard data
   * Optimized aggregation queries
   */
  async getAutomationDashboard(): Promise<{
    statistics: any
    recentActivity: any[]
    topPerformingPosts: any[]
    metrics: QueryPerformanceMetrics
  }> {
    const startTime = performance.now()

    // Parallel execution of dashboard queries
    const [statisticsResult, activityResult, topPostsResult] = await Promise.all([
      // Statistics aggregation
      this.supabase.rpc('get_blog_statistics'),
      
      // Recent automation activity
      this.supabase
        .from('content_generation_logs')
        .select(`
          *,
          topic:blog_topics(title, category),
          post:blog_posts(title, slug)
        `)
        .order('started_at', { ascending: false })
        .limit(20),
      
      // Top performing posts
      this.supabase
        .from('mv_blog_performance_summary')
        .select('*')
        .order('total_views', { ascending: false })
        .limit(10)
    ])

    const executionTime = performance.now() - startTime

    return {
      statistics: statisticsResult.data || {},
      recentActivity: activityResult.data || [],
      topPerformingPosts: topPostsResult.data || [],
      metrics: {
        executionTime,
        planningTime: 0,
        rowsReturned: (activityResult.data?.length || 0) + (topPostsResult.data?.length || 0),
        bufferHits: 0,
        bufferReads: 0,
        queryPlan: null
      }
    }
  }

  /**
   * Search blog posts with advanced filters
   * Uses full-text search and faceted filtering
   */
  async searchPosts(options: {
    query: string
    filters?: {
      categories?: string[]
      tags?: string[]
      dateRange?: { start: string; end: string }
      aiGenerated?: boolean
      minViews?: number
    }
    page?: number
    limit?: number
  }): Promise<{
    posts: any[]
    facets: any
    total: number
    metrics: QueryPerformanceMetrics
  }> {
    const startTime = performance.now()
    const { query: searchQuery, filters = {}, page = 1, limit = 20 } = options

    let query = this.supabase
      .from('blog_posts')
      .select(`
        *,
        author:admin_users(first_name, last_name),
        analytics:blog_analytics(page_views, social_shares)
      `, { count: 'exact' })
      .eq('status', 'published')

    // Full-text search
    if (searchQuery) {
      query = query.textSearch('content', searchQuery, {
        type: 'websearch',
        config: 'english'
      })
    }

    // Apply filters
    if (filters.categories?.length) {
      query = query.in('category', filters.categories)
    }

    if (filters.tags?.length) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters.dateRange) {
      query = query
        .gte('published_at', filters.dateRange.start)
        .lte('published_at', filters.dateRange.end)
    }

    if (filters.aiGenerated !== undefined) {
      query = query.eq('ai_generated', filters.aiGenerated)
    }

    if (filters.minViews) {
      query = query.gte('views_count', filters.minViews)
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    // Get facets for filtering UI
    const { data: facets } = await this.supabase.rpc('get_search_facets', {
      search_query: searchQuery
    })

    const executionTime = performance.now() - startTime

    return {
      posts: data || [],
      facets: facets || {},
      total: count || 0,
      metrics: {
        executionTime,
        planningTime: 0,
        rowsReturned: data?.length || 0,
        bufferHits: 0,
        bufferReads: 0,
        queryPlan: null
      }
    }
  }

  /**
   * Get blog topics queue with prioritization
   * Optimized for automation system
   */
  async getTopicsQueue(options: {
    status?: string[]
    limit?: number
    priorityOnly?: boolean
  } = {}): Promise<{
    topics: any[]
    queueStats: any
    metrics: QueryPerformanceMetrics
  }> {
    const startTime = performance.now()
    const { status = ['pending'], limit = 50, priorityOnly = false } = options

    let query = this.supabase
      .from('blog_topics')
      .select(`
        *,
        created_by:admin_users(first_name, last_name),
        generated_post:blog_posts(id, title, slug, status)
      `)
      .in('status', status)

    if (priorityOnly) {
      query = query.gte('priority', 8) // High priority only
    }

    query = query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit)

    const { data: topics, error } = await query

    if (error) throw error

    // Get queue statistics
    const { data: queueStats } = await this.supabase.rpc('get_topics_queue_stats')

    const executionTime = performance.now() - startTime

    return {
      topics: topics || [],
      queueStats: queueStats || {},
      metrics: {
        executionTime,
        planningTime: 0,
        rowsReturned: topics?.length || 0,
        bufferHits: 0,
        bufferReads: 0,
        queryPlan: null
      }
    }
  }

  /**
   * Get analytics data with time-series optimization
   * Uses partitioned queries for large datasets
   */
  async getAnalyticsTimeSeries(options: {
    postId?: string
    dateRange: { start: string; end: string }
    granularity: 'daily' | 'weekly' | 'monthly'
    metrics: string[]
  }): Promise<{
    timeSeries: any[]
    summary: any
    metrics: QueryPerformanceMetrics
  }> {
    const startTime = performance.now()
    const { postId, dateRange, granularity, metrics } = options

    let query = this.supabase
      .from('blog_analytics')
      .select(metrics.join(','))
      .eq('period_type', granularity)
      .gte('date_recorded', dateRange.start)
      .lte('date_recorded', dateRange.end)

    if (postId) {
      query = query.eq('post_id', postId)
    }

    query = query.order('date_recorded', { ascending: true })

    const { data: timeSeries, error } = await query

    if (error) throw error

    // Get summary statistics
    const { data: summary } = await this.supabase.rpc('get_analytics_summary', {
      post_id: postId,
      start_date: dateRange.start,
      end_date: dateRange.end,
      granularity
    })

    const executionTime = performance.now() - startTime

    return {
      timeSeries: timeSeries || [],
      summary: summary || {},
      metrics: {
        executionTime,
        planningTime: 0,
        rowsReturned: timeSeries?.length || 0,
        bufferHits: 0,
        bufferReads: 0,
        queryPlan: null
      }
    }
  }

  /**
   * Bulk update blog posts with transaction safety
   * Optimized for batch operations
   */
  async bulkUpdatePosts(updates: Array<{
    id: string
    changes: Partial<BlogPost>
  }>): Promise<{
    updated: number
    failed: number
    errors: any[]
    metrics: QueryPerformanceMetrics
  }> {
    const startTime = performance.now()
    const results = { updated: 0, failed: 0, errors: [] as any[] }

    // Process in batches of 100 for optimal performance
    const batchSize = 100
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      
      try {
        // Use stored procedure for atomic batch updates
        const { data, error } = await this.supabase.rpc('bulk_update_blog_posts', {
          updates: batch
        })

        if (error) {
          results.failed += batch.length
          results.errors.push(error)
        } else {
          results.updated += data?.updated_count || 0
          results.failed += data?.failed_count || 0
          if (data?.errors?.length) {
            results.errors.push(...data.errors)
          }
        }
      } catch (error) {
        results.failed += batch.length
        results.errors.push(error)
      }
    }

    const executionTime = performance.now() - startTime

    return {
      ...results,
      metrics: {
        executionTime,
        planningTime: 0,
        rowsReturned: results.updated,
        bufferHits: 0,
        bufferReads: 0,
        queryPlan: null
      }
    }
  }

  /**
   * Get query performance analysis
   * Uses EXPLAIN ANALYZE for optimization insights
   */
  async analyzeQueryPerformance(queryName: string, sqlQuery: string): Promise<{
    executionPlan: any
    recommendations: string[]
    metrics: QueryPerformanceMetrics
  }> {
    const startTime = performance.now()

    try {
      // Execute EXPLAIN ANALYZE
      const { data: explainResult } = await this.supabase
        .rpc('explain_analyze_query', { 
          query_sql: sqlQuery 
        })

      const executionTime = performance.now() - startTime

      // Parse execution plan for recommendations
      const recommendations = this.generateOptimizationRecommendations(explainResult)

      return {
        executionPlan: explainResult,
        recommendations,
        metrics: {
          executionTime,
          planningTime: explainResult?.['Planning Time'] || 0,
          rowsReturned: explainResult?.['Actual Rows'] || 0,
          bufferHits: explainResult?.['Buffers: shared hit'] || 0,
          bufferReads: explainResult?.['Buffers: shared read'] || 0,
          queryPlan: explainResult
        }
      }
    } catch (error) {
      throw new Error(`Query analysis failed: ${error}`)
    }
  }

  /**
   * Generate optimization recommendations based on execution plan
   */
  private generateOptimizationRecommendations(explainResult: any): string[] {
    const recommendations: string[] = []

    if (!explainResult) return recommendations

    // Check for common performance issues
    if (explainResult['Execution Time'] > 1000) {
      recommendations.push('Query execution time exceeds 1 second - consider adding indexes')
    }

    if (explainResult['Buffers: shared read'] > explainResult['Buffers: shared hit']) {
      recommendations.push('High disk I/O detected - consider increasing shared_buffers or adding covering indexes')
    }

    // Check for sequential scans
    const planText = JSON.stringify(explainResult).toLowerCase()
    if (planText.includes('seq scan')) {
      recommendations.push('Sequential scan detected - add appropriate indexes for filtered columns')
    }

    if (planText.includes('nested loop') && planText.includes('rows=')) {
      recommendations.push('Nested loop with high row count - consider hash join by adjusting work_mem')
    }

    if (explainResult['Planning Time'] > 50) {
      recommendations.push('High planning time - consider using prepared statements or connection pooling')
    }

    return recommendations
  }
}

export const optimizedBlogQueries = new OptimizedBlogQueries()