/**
 * HMHCP Blog Automation Database Service
 * High-performance database operations with error handling, caching, and monitoring
 */

import { createServerClient } from '@/lib/supabase-server'
import { BlogTopic, GeneratedBlogPost, AutomationMetrics, BlogPost } from '@/lib/automation/blog-automation-system'
import { Database } from '@/types/supabase'
import logger from '@/lib/logging/winston-logger'
import crypto from 'crypto'

// Type definitions for database operations
export interface BlogPostInsert {
  title: string
  slug: string
  content: string
  excerpt: string
  status: 'draft' | 'published' | 'archived' | 'scheduled'
  author_id: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  word_count: number
  read_time_minutes: number
  featured_image_url?: string
  category: string
  tags: string[]
  target_keywords: string[]
  ai_generated: boolean
  ai_model?: string
  generation_timestamp?: string
  table_of_contents?: any[]
  key_takeaways?: string[]
  references?: any[]
  social_media_content?: any
  published_at?: string
  scheduled_at?: string
}

export interface BlogTopicInsert {
  title: string
  description?: string
  category: string
  instructions?: string
  tone: string
  target_keywords: string[]
  priority: number
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled'
  scheduled_for?: string
  created_by: string
  min_word_count?: number
  max_word_count?: number
  required_sections?: string[]
  quality_threshold?: number
}

export interface DatabaseMetrics {
  connectionPool: {
    active: number
    idle: number
    waiting: number
  }
  queryPerformance: {
    averageResponseTime: number
    slowQueries: number
    totalQueries: number
  }
  cacheHitRate: number
  errorRate: number
  lastUpdated: Date
}

export interface QueryResult<T> {
  data: T | null
  error: string | null
  performance: {
    queryTime: number
    cacheHit: boolean
    rowsAffected?: number
  }
}

/**
 * High-performance database service for blog automation
 */
export class AutomationDatabaseService {
  private supabase: ReturnType<typeof createServerClient>
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private metrics: DatabaseMetrics = {
    connectionPool: { active: 0, idle: 0, waiting: 0 },
    queryPerformance: { averageResponseTime: 0, slowQueries: 0, totalQueries: 0 },
    cacheHitRate: 0,
    errorRate: 0,
    lastUpdated: new Date()
  }

  constructor() {
    this.supabase = createServerClient()
  }

  // =============================================
  // BLOG POSTS OPERATIONS
  // =============================================

  /**
   * Create a new blog post with comprehensive validation and error handling
   */
  async createBlogPost(postData: BlogPostInsert): Promise<QueryResult<{ id: string }>> {
    const startTime = Date.now()
    
    try {
      // Validate required fields
      const validation = this.validateBlogPostData(postData)
      if (!validation.valid) {
        return {
          data: null,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          performance: { queryTime: Date.now() - startTime, cacheHit: false }
        }
      }

      // Check for duplicate slug
      const { data: existingPost } = await this.supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', postData.slug)
        .single()

      if (existingPost) {
        return {
          data: null,
          error: `Slug already exists: ${postData.slug}`,
          performance: { queryTime: Date.now() - startTime, cacheHit: false }
        }
      }

      // Insert blog post with transaction safety
      const { data, error } = await this.supabase
        .from('blog_posts')
        .insert([{
          ...postData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('id')
        .single()

      if (error) {
        logger.error('Failed to create blog post', { error: error.message, postData })
        return {
          data: null,
          error: `Database error: ${error.message}`,
          performance: { queryTime: Date.now() - startTime, cacheHit: false }
        }
      }

      // Update metrics
      this.updateQueryMetrics(Date.now() - startTime, false)

      // Log audit trail
      await this.logAuditEvent('CREATE', 'blog_posts', data.id, {
        title: postData.title,
        ai_generated: postData.ai_generated
      })

      logger.info('Blog post created successfully', { 
        postId: data.id, 
        title: postData.title,
        queryTime: Date.now() - startTime 
      })

      return {
        data: { id: data.id },
        error: null,
        performance: { queryTime: Date.now() - startTime, cacheHit: false, rowsAffected: 1 }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Unexpected error creating blog post', { error: errorMessage, postData })
      
      return {
        data: null,
        error: `Unexpected error: ${errorMessage}`,
        performance: { queryTime: Date.now() - startTime, cacheHit: false }
      }
    }
  }

  /**
   * Get published blog posts with caching and performance optimization
   */
  async getPublishedBlogPosts(
    limit = 10, 
    offset = 0, 
    category?: string,
    useCache = true
  ): Promise<QueryResult<BlogPost[]>> {
    const startTime = Date.now()
    const cacheKey = `published_posts_${limit}_${offset}_${category || 'all'}`

    // Check cache first
    if (useCache) {
      const cached = this.getCachedResult(cacheKey)
      if (cached) {
        this.updateQueryMetrics(Date.now() - startTime, true)
        return {
          data: cached,
          error: null,
          performance: { queryTime: Date.now() - startTime, cacheHit: true }
        }
      }
    }

    try {
      let query = this.supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          category,
          tags,
          published_at,
          read_time_minutes,
          featured_image_url,
          views_count,
          engagement_score,
          author_id,
          admin_users!blog_posts_author_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) {
        logger.error('Failed to fetch published blog posts', { error: error.message, limit, offset, category })
        return {
          data: null,
          error: `Database error: ${error.message}`,
          performance: { queryTime: Date.now() - startTime, cacheHit: false }
        }
      }

      // Transform data to expected format
      const transformedData = data?.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        category: post.category || '',
        tags: post.tags || [],
        publishedAt: post.published_at || '',
        readTime: post.read_time_minutes || 0,
        featuredImage: post.featured_image_url || '',
        views: post.views_count || 0,
        engagement: post.engagement_score || 0,
        author: post.admin_users ? {
          name: `${post.admin_users.first_name} ${post.admin_users.last_name}`,
          email: post.admin_users.email
        } : { name: 'Unknown', email: '' }
      })) || []

      // Cache the result
      if (useCache) {
        this.setCachedResult(cacheKey, transformedData, 300000) // 5 minutes cache
      }

      this.updateQueryMetrics(Date.now() - startTime, false)

      return {
        data: transformedData,
        error: null,
        performance: { queryTime: Date.now() - startTime, cacheHit: false, rowsAffected: data?.length }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Unexpected error fetching published blog posts', { error: errorMessage })
      
      return {
        data: null,
        error: `Unexpected error: ${errorMessage}`,
        performance: { queryTime: Date.now() - startTime, cacheHit: false }
      }
    }
  }

  /**
   * Get blog post by slug with caching
   */
  async getBlogPostBySlug(slug: string, useCache = true): Promise<QueryResult<BlogPost | null>> {
    const startTime = Date.now()
    const cacheKey = `blog_post_slug_${slug}`

    // Check cache
    if (useCache) {
      const cached = this.getCachedResult(cacheKey)
      if (cached) {
        this.updateQueryMetrics(Date.now() - startTime, true)
        return {
          data: cached,
          error: null,
          performance: { queryTime: Date.now() - startTime, cacheHit: true }
        }
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('blog_posts')
        .select(`
          *,
          admin_users!blog_posts_author_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return {
            data: null,
            error: null,
            performance: { queryTime: Date.now() - startTime, cacheHit: false }
          }
        }
        
        logger.error('Failed to fetch blog post by slug', { error: error.message, slug })
        return {
          data: null,
          error: `Database error: ${error.message}`,
          performance: { queryTime: Date.now() - startTime, cacheHit: false }
        }
      }

      // Transform to expected format
      const transformedPost = {
        id: data.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt || '',
        category: data.category || '',
        tags: data.tags || [],
        publishedAt: data.published_at || '',
        readTime: data.read_time_minutes || 0,
        featuredImage: data.featured_image_url || '',
        views: data.views_count || 0,
        engagement: data.engagement_score || 0,
        seoTitle: data.seo_title || data.title,
        seoDescription: data.seo_description || data.excerpt,
        keywords: data.seo_keywords || [],
        tableOfContents: data.table_of_contents || [],
        keyTakeaways: data.key_takeaways || [],
        references: data.references || [],
        author: data.admin_users ? {
          name: `${data.admin_users.first_name} ${data.admin_users.last_name}`,
          email: data.admin_users.email
        } : { name: 'Unknown', email: '' }
      }

      // Cache the result
      if (useCache) {
        this.setCachedResult(cacheKey, transformedPost, 600000) // 10 minutes cache
      }

      // Increment view count asynchronously
      this.incrementViewCount(data.id).catch(error => 
        logger.warn('Failed to increment view count', { error: error.message, postId: data.id })
      )

      this.updateQueryMetrics(Date.now() - startTime, false)

      return {
        data: transformedPost,
        error: null,
        performance: { queryTime: Date.now() - startTime, cacheHit: false, rowsAffected: 1 }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Unexpected error fetching blog post by slug', { error: errorMessage, slug })
      
      return {
        data: null,
        error: `Unexpected error: ${errorMessage}`,
        performance: { queryTime: Date.now() - startTime, cacheHit: false }
      }
    }
  }

  // =============================================
  // BLOG TOPICS OPERATIONS
  // =============================================

  /**
   * Create a new blog topic for automation
   */
  async createBlogTopic(topicData: BlogTopicInsert): Promise<QueryResult<{ id: string }>> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await this.supabase
        .from('blog_topics')
        .insert([{
          ...topicData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('id')
        .single()

      if (error) {
        logger.error('Failed to create blog topic', { error: error.message, topicData })
        return {
          data: null,
          error: `Database error: ${error.message}`,
          performance: { queryTime: Date.now() - startTime, cacheHit: false }
        }
      }

      await this.logAuditEvent('CREATE', 'blog_topics', data.id, {
        title: topicData.title,
        category: topicData.category
      })

      this.updateQueryMetrics(Date.now() - startTime, false)

      return {
        data: { id: data.id },
        error: null,
        performance: { queryTime: Date.now() - startTime, cacheHit: false, rowsAffected: 1 }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Unexpected error creating blog topic', { error: errorMessage, topicData })
      
      return {
        data: null,
        error: `Unexpected error: ${errorMessage}`,
        performance: { queryTime: Date.now() - startTime, cacheHit: false }
      }
    }
  }

  /**
   * Get pending blog topics for automation
   */
  async getPendingBlogTopics(limit = 10): Promise<QueryResult<BlogTopic[]>> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await this.supabase
        .from('blog_topics')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .order('scheduled_for', { ascending: true })
        .limit(limit)

      if (error) {
        logger.error('Failed to fetch pending blog topics', { error: error.message })
        return {
          data: null,
          error: `Database error: ${error.message}`,
          performance: { queryTime: Date.now() - startTime, cacheHit: false }
        }
      }

      const transformedTopics = data?.map(topic => ({
        id: topic.id,
        title: topic.title,
        instructions: topic.instructions,
        status: topic.status as 'pending' | 'generating' | 'completed' | 'failed',
        tone: topic.tone,
        outline: topic.content_outline,
        priority: topic.priority,
        category: topic.category,
        targetKeywords: topic.target_keywords || [],
        scheduledFor: topic.scheduled_for ? new Date(topic.scheduled_for) : undefined
      })) || []

      this.updateQueryMetrics(Date.now() - startTime, false)

      return {
        data: transformedTopics,
        error: null,
        performance: { queryTime: Date.now() - startTime, cacheHit: false, rowsAffected: data?.length }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Unexpected error fetching pending blog topics', { error: errorMessage })
      
      return {
        data: null,
        error: `Unexpected error: ${errorMessage}`,
        performance: { queryTime: Date.now() - startTime, cacheHit: false }
      }
    }
  }

  /**
   * Update blog topic status
   */
  async updateBlogTopicStatus(
    topicId: string, 
    status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled',
    generatedPostId?: string,
    failureReason?: string
  ): Promise<QueryResult<{ success: boolean }>> {
    const startTime = Date.now()
    
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (generatedPostId) {
        updateData.generated_post_id = generatedPostId
      }

      if (failureReason) {
        updateData.failure_reason = failureReason
      }

      if (status === 'generating') {
        updateData.generation_attempts = this.supabase.rpc('increment_generation_attempts', { topic_id: topicId })
        updateData.last_attempt_at = new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('blog_topics')
        .update(updateData)
        .eq('id', topicId)

      if (error) {
        logger.error('Failed to update blog topic status', { error: error.message, topicId, status })
        return {
          data: null,
          error: `Database error: ${error.message}`,
          performance: { queryTime: Date.now() - startTime, cacheHit: false }
        }
      }

      await this.logAuditEvent('UPDATE', 'blog_topics', topicId, {
        status,
        generatedPostId,
        failureReason
      })

      this.updateQueryMetrics(Date.now() - startTime, false)

      return {
        data: { success: true },
        error: null,
        performance: { queryTime: Date.now() - startTime, cacheHit: false, rowsAffected: 1 }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Unexpected error updating blog topic status', { error: errorMessage, topicId, status })
      
      return {
        data: null,
        error: `Unexpected error: ${errorMessage}`,
        performance: { queryTime: Date.now() - startTime, cacheHit: false }
      }
    }
  }

  // =============================================
  // CONTENT GENERATION LOGGING
  // =============================================

  /**
   * Log content generation attempt
   */
  async logContentGeneration(
    topicId: string,
    postId: string,
    generationType: 'outline' | 'content' | 'seo' | 'images' | 'social' | 'complete',
    inputPrompt: string,
    generatedContent?: string,
    success = true,
    metadata: any = {}
  ): Promise<QueryResult<{ id: string }>> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await this.supabase
        .from('content_generation_logs')
        .insert([{
          id: crypto.randomUUID(),
          topic_id: topicId,
          post_id: postId,
          generation_type: generationType,
          input_prompt: inputPrompt,
          generated_content: generatedContent,
          success,
          output_metadata: metadata,
          tokens_input: metadata.tokensInput || 0,
          tokens_output: metadata.tokensOutput || 0,
          generation_time_ms: metadata.generationTime || 0,
          cost_cents: metadata.costCents || 0,
          quality_score: metadata.qualityScore,
          confidence_score: metadata.confidenceScore,
          ai_model: metadata.aiModel,
          error_type: metadata.errorType,
          error_message: metadata.errorMessage,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }])
        .select('id')
        .single()

      if (error) {
        logger.error('Failed to log content generation', { error: error.message })
        return {
          data: null,
          error: `Database error: ${error.message}`,
          performance: { queryTime: Date.now() - startTime, cacheHit: false }
        }
      }

      this.updateQueryMetrics(Date.now() - startTime, false)

      return {
        data: { id: data.id },
        error: null,
        performance: { queryTime: Date.now() - startTime, cacheHit: false, rowsAffected: 1 }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Unexpected error logging content generation', { error: errorMessage })
      
      return {
        data: null,
        error: `Unexpected error: ${errorMessage}`,
        performance: { queryTime: Date.now() - startTime, cacheHit: false }
      }
    }
  }

  // =============================================
  // ANALYTICS AND METRICS
  // =============================================

  /**
   * Get automation metrics
   */
  async getAutomationMetrics(): Promise<QueryResult<AutomationMetrics>> {
    const startTime = Date.now()
    
    try {
      // Get posts generated count
      const { data: postsData } = await this.supabase
        .from('blog_posts')
        .select('id')
        .eq('ai_generated', true)

      // Get success rate from generation logs
      const { data: logsData } = await this.supabase
        .from('content_generation_logs')
        .select('success')
        .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      // Get pending topics count
      const { data: topicsData } = await this.supabase
        .from('blog_topics')
        .select('id')
        .eq('status', 'pending')

      // Calculate metrics
      const postsGenerated = postsData?.length || 0
      const totalAttempts = logsData?.length || 0
      const successfulAttempts = logsData?.filter(log => log.success).length || 0
      const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 100
      const queueLength = topicsData?.length || 0

      // Get last run time from logs
      const { data: lastRunData } = await this.supabase
        .from('content_generation_logs')
        .select('completed_at')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      const metrics: AutomationMetrics = {
        postsGenerated,
        successRate,
        averageGenerationTime: 0, // TODO: Calculate from logs
        lastRunTime: lastRunData?.completed_at ? new Date(lastRunData.completed_at) : new Date(),
        nextScheduledRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
        errors: [], // TODO: Get recent errors
        queueLength
      }

      this.updateQueryMetrics(Date.now() - startTime, false)

      return {
        data: metrics,
        error: null,
        performance: { queryTime: Date.now() - startTime, cacheHit: false }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Unexpected error getting automation metrics', { error: errorMessage })
      
      return {
        data: null,
        error: `Unexpected error: ${errorMessage}`,
        performance: { queryTime: Date.now() - startTime, cacheHit: false }
      }
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Validate blog post data
   */
  private validateBlogPostData(postData: BlogPostInsert): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!postData.title || postData.title.trim().length === 0) {
      errors.push('Title is required')
    }

    if (!postData.content || postData.content.trim().length === 0) {
      errors.push('Content is required')
    }

    if (!postData.slug || postData.slug.trim().length === 0) {
      errors.push('Slug is required')
    }

    if (!postData.author_id) {
      errors.push('Author ID is required')
    }

    if (postData.word_count < 0) {
      errors.push('Word count cannot be negative')
    }

    if (postData.read_time_minutes < 0) {
      errors.push('Read time cannot be negative')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Increment view count for blog post
   */
  private async incrementViewCount(postId: string): Promise<void> {
    try {
      await this.supabase.rpc('increment_blog_post_views', { post_id: postId })
    } catch (error) {
      logger.warn('Failed to increment view count', { error, postId })
    }
  }

  /**
   * Log audit event for HIPAA compliance
   */
  private async logAuditEvent(
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: any
  ): Promise<void> {
    try {
      await this.supabase
        .from('hipaa_audit_log')
        .insert([{
          action_type: action,
          resource_type: resourceType,
          resource_id: resourceId,
          phi_accessed: false, // Blog posts are generally public
          new_values: metadata,
          ip_address: '127.0.0.1', // Server-side operation
          business_justification: 'Blog automation system operation',
          record_hash: crypto.createHash('sha256').update(resourceId).digest('hex')
        }])
    } catch (error) {
      logger.warn('Failed to log audit event', { error, action, resourceType, resourceId })
    }
  }

  /**
   * Cache management
   */
  private getCachedResult(key: string): any | null {
    const cached = this.queryCache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    
    if (cached) {
      this.queryCache.delete(key)
    }
    
    return null
  }

  private setCachedResult(key: string, data: any, ttl: number): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })

    // Clean up old cache entries
    if (this.queryCache.size > 1000) {
      const oldEntries = Array.from(this.queryCache.entries())
        .filter(([, value]) => Date.now() - value.timestamp > value.ttl)
      
      oldEntries.forEach(([key]) => this.queryCache.delete(key))
    }
  }

  /**
   * Update query performance metrics
   */
  private updateQueryMetrics(queryTime: number, cacheHit: boolean): void {
    this.metrics.queryPerformance.totalQueries++
    
    if (cacheHit) {
      this.metrics.cacheHitRate = 
        (this.metrics.cacheHitRate * (this.metrics.queryPerformance.totalQueries - 1) + 1) / 
        this.metrics.queryPerformance.totalQueries
    } else {
      this.metrics.queryPerformance.averageResponseTime = 
        (this.metrics.queryPerformance.averageResponseTime * (this.metrics.queryPerformance.totalQueries - 1) + queryTime) / 
        this.metrics.queryPerformance.totalQueries

      if (queryTime > 1000) { // Slow query threshold: 1 second
        this.metrics.queryPerformance.slowQueries++
      }
    }

    this.metrics.lastUpdated = new Date()
  }

  /**
   * Get database performance metrics
   */
  getDatabaseMetrics(): DatabaseMetrics {
    return { ...this.metrics }
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear()
    logger.info('Database query cache cleared')
  }

  /**
   * Health check for database connectivity
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now()
    
    try {
      const { error } = await this.supabase
        .from('blog_posts')
        .select('id')
        .limit(1)

      const latency = Date.now() - startTime

      if (error) {
        return {
          healthy: false,
          latency,
          error: error.message
        }
      }

      return {
        healthy: true,
        latency
      }

    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const automationDb = new AutomationDatabaseService()
export default automationDb