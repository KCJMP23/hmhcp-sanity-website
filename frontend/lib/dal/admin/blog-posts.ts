/**
 * Blog Posts Data Access Layer (DAL)
 * Healthcare blog content management with medical accuracy validation
 * Provides type-safe database operations for blog posts with author relationships
 */

import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { InjectableBaseDAL, DALUtils } from './base-injectable'
import { logger } from '@/lib/logger'
import {
  BlogPost,
  BlogPostCreate,
  BlogPostUpdate,
  BlogPostCreateSchema,
  BlogPostUpdateSchema,
  DataClassification,
  ContentStatus,
  QueryResult,
  PaginatedResult,
  QueryOptions,
  DataAccessContext
} from './types'
import {
  sanitizeInput,
  validateHealthcareContent,
  extractMedicalTerminology,
  validateMedicalAccuracy,
  calculateReadingTime,
  executeOptimizedQuery,
  TABLE_NAMES
} from './utils'

/**
 * Blog Posts Data Access Layer
 * Manages blog content with medical accuracy validation, author relationships,
 * and healthcare compliance features
 */
export class BlogPostsDAL extends InjectableBaseDAL<BlogPost, BlogPostCreate, BlogPostUpdate> {
  private dataClassification: DataClassification

  constructor(client: SupabaseClient, utils?: DALUtils) {
    super(
      client,
      TABLE_NAMES.BLOG_POSTS,
      ['title', 'excerpt', 'content', 'tags'], // searchable columns
      true, // requires audit
      utils
    )
    this.dataClassification = DataClassification.INTERNAL
  }

  // ================================
  // Schema Methods
  // ================================

  protected getCreateSchema(): z.ZodSchema<BlogPostCreate> {
    return BlogPostCreateSchema
  }

  protected getUpdateSchema(): z.ZodSchema<BlogPostUpdate> {
    return BlogPostUpdateSchema
  }

  /**
   * Get utils (handles async loading if needed)
   */
  private async getUtils() {
    // Import utils dynamically to avoid circular dependencies
    const utils = await import('./utils')
    return utils
  }

  // ================================
  // Data Transformation
  // ================================

  protected transformForSave(data: BlogPostCreate | BlogPostUpdate, context?: DataAccessContext): Record<string, any> {
    const transformed = {
      ...data,
      content: this.sanitizeContent(data.content || ''),
      tags: data.tags || [],
      category_ids: data.category_ids || [],
      view_count: 0, // Initialize for new posts
      meta_keywords: data.meta_keywords || [],
      seo_config: data.seo_config || {}
    }

    // Auto-calculate reading time if content is provided
    if (data.content && !data.read_time_minutes) {
      transformed.read_time_minutes = calculateReadingTime(data.content)
    }

    // Validate medical accuracy if healthcare content is detected
    if (this.containsHealthcareContent(transformed.content)) {
      this.validateMedicalContent(transformed)
    }

    return transformed
  }

  protected transformFromDatabase(data: Record<string, any>): BlogPost {
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      featured_image: data.featured_image,
      author_id: data.author_id,
      category_ids: data.category_ids || [],
      tags: data.tags || [],
      status: data.status as ContentStatus,
      view_count: data.view_count || 0,
      read_time_minutes: data.read_time_minutes,
      meta_description: data.meta_description,
      meta_keywords: data.meta_keywords || [],
      seo_config: data.seo_config || {},
      published_at: data.published_at,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  // ================================
  // Healthcare-Specific Methods
  // ================================

  /**
   * Sanitizes blog content for healthcare compliance
   */
  private sanitizeContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return ''
    }

    // Remove potential PHI patterns
    let sanitized = content

    // Pattern for potential SSN
    sanitized = sanitized.replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, '[REDACTED]')
    
    // Pattern for potential phone numbers in medical context
    sanitized = sanitized.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[CONTACT]')
    
    // Pattern for potential DOB
    sanitized = sanitized.replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, '[DATE]')

    // Remove specific patient identifiers if mentioned
    sanitized = sanitized.replace(/\bpatient\s+id\s*:?\s*\w+/gi, 'patient [ID]')

    return sanitized
  }

  /**
   * Validates medical content accuracy
   */
  private validateMedicalContent(data: any): void {
    try {
      const medicalTerms = extractMedicalTerminology(data)
      
      if (medicalTerms.length > 0) {
        const validation = validateMedicalAccuracy(medicalTerms)
        
        if (!validation.isValid) {
          logger.warn('Medical accuracy validation failed', {
            terms: medicalTerms,
            issues: validation.issues,
            postSlug: data.slug,
            postId: data.id
          })
          
          throw new Error(`Medical accuracy validation failed: ${validation.issues.join(', ')}`)
        }
      }
    } catch (error) {
      logger.error('Medical content validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        postSlug: data.slug,
        postId: data.id
      })
      // Don't throw - log warning and continue
    }
  }

  /**
   * Checks if content contains healthcare-related information
   */
  private containsHealthcareContent(content: string): boolean {
    if (!content) return false

    const healthcareKeywords = [
      'medical', 'healthcare', 'patient', 'treatment', 'diagnosis',
      'medication', 'doctor', 'nurse', 'hospital', 'clinic',
      'therapy', 'surgical', 'pharmaceutical', 'clinical',
      'symptoms', 'disease', 'condition', 'procedure'
    ]

    const lowerContent = content.toLowerCase()
    return healthcareKeywords.some(keyword => lowerContent.includes(keyword))
  }

  // ================================
  // Specialized Query Methods
  // ================================

  /**
   * Gets blog post by slug with view count increment
   */
  public async getBySlug(slug: string, incrementViews: boolean = false): Promise<QueryResult<BlogPost>> {
    try {
      this.validateAccess('read')

      const result = await this.client
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .eq('status', ContentStatus.PUBLISHED)
        .single()

      if (result.error) {
        logger.warn('Blog post not found by slug', { slug, error: result.error.message })
        return { data: null, error: 'Blog post not found' }
      }

      const post = this.transformFromDatabase(result.data)

      // Increment view count if requested
      if (incrementViews) {
        await this.incrementViewCount(post.id)
        post.view_count += 1
      }

      // Log access for audit
      if (this.requiresAudit && this.context) {
        await this.logAuditAction('VIEW' as any, post.id, { slug, incrementViews })
      }

      return { data: post, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get by slug failed', { slug, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets published blog posts with pagination and filtering
   */
  public async getPublishedPosts(options: QueryOptions = {}): Promise<PaginatedResult<BlogPost>> {
    const modifiedOptions = {
      ...options,
      filters: {
        ...options.filters,
        status: ContentStatus.PUBLISHED
      }
    }

    return await this.getMany(modifiedOptions)
  }

  /**
   * Gets posts by author with pagination
   */
  public async getPostsByAuthor(authorId: string, options: QueryOptions = {}): Promise<PaginatedResult<BlogPost>> {
    const modifiedOptions = {
      ...options,
      filters: {
        ...options.filters,
        author_id: authorId,
        status: ContentStatus.PUBLISHED
      }
    }

    return await this.getMany(modifiedOptions)
  }

  /**
   * Gets posts by category with pagination (optimized to prevent N+1)
   */
  public async getPostsByCategory(categoryId: string, options: QueryOptions = {}): Promise<PaginatedResult<BlogPost>> {
    try {
      this.validateAccess('read')
      const utils = await this.getUtils()

      // Use optimized query with array contains
      return await executeOptimizedQuery(
        'blog_posts_by_category',
        async () => {
          // Build query with proper array contains syntax
          const { from, to, page, limit } = utils.buildPaginationParams(options)
          
          let query = this.client
            .from(this.tableName)
            .select('*, author:author_id(id,name,email,avatar_url)', {
              count: options.includeCount !== false ? 'exact' : undefined
            })
            .contains('category_ids', [categoryId])
            .eq('status', ContentStatus.PUBLISHED)

          // Apply additional filters if provided
          query = utils.applyQueryConditions(query, options, this.searchableFields)
          
          // Apply pagination
          query = query.range(from, to)

          return await query
        },
        { 
          metadata: { categoryId, page: options.page, limit: options.limit },
          enableMonitoring: true 
        }
      ).then(result => {
        if (result.error) {
          logger.error('Get posts by category failed', { categoryId, error: result.error })
          return {
            data: [],
            total: 0,
            page: options.page || 1,
            limit: options.limit || 20,
            hasNext: false,
            hasPrev: false
          }
        }

        const posts = (result.data || []).map(item => this.transformFromDatabase(item))
        const total = result.count || posts.length
        const { from, to, page, limit } = utils.buildPaginationParams(options)

        return {
          data: posts,
          total,
          page,
          limit,
          hasNext: from + posts.length < total,
          hasPrev: page > 1
        }
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get posts by category failed', { categoryId, error: errorMessage })
      return {
        data: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 20,
        hasNext: false,
        hasPrev: false
      }
    }
  }

  /**
   * Gets featured blog posts
   */
  public async getFeaturedPosts(limit: number = 5): Promise<QueryResult<BlogPost[]>> {
    try {
      this.validateAccess('read')

      // For featured posts, we'll use posts with high view counts or recent posts
      const result = await this.client
        .from(this.tableName)
        .select('*')
        .eq('status', ContentStatus.PUBLISHED)
        .order('view_count', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limit)

      if (result.error) {
        logger.error('Failed to get featured posts', { error: result.error.message })
        return { data: null, error: result.error.message }
      }

      const posts = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: posts, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get featured posts failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Search posts by content and tags
   */
  public async searchPosts(query: string, options: QueryOptions = {}): Promise<PaginatedResult<BlogPost>> {
    const searchOptions = {
      ...options,
      search: query,
      filters: {
        ...options.filters,
        status: ContentStatus.PUBLISHED
      }
    }

    return await this.getMany(searchOptions)
  }

  /**
   * Publishes a blog post (status change with validation)
   */
  public async publishPost(id: string): Promise<QueryResult<BlogPost>> {
    try {
      this.validateAccess('write')

      // Get current post to validate before publishing
      const currentPost = await this.getById(id)
      if (!currentPost.data) {
        return { data: null, error: 'Blog post not found' }
      }

      // Validate post content before publishing
      if (this.containsHealthcareContent(currentPost.data.content)) {
        this.validateMedicalContent(currentPost.data)
      }

      // Ensure required fields are present
      if (!currentPost.data.title || !currentPost.data.content) {
        return { data: null, error: 'Title and content are required for publishing' }
      }

      // Update status to published
      return await this.update(id, {
        status: ContentStatus.PUBLISHED,
        published_at: new Date().toISOString()
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Blog post publish failed', { id, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Increments view count for a blog post
   */
  public async incrementViewCount(id: string): Promise<QueryResult<boolean>> {
    try {
      const result = await this.client
        .rpc('increment_view_count', { post_id: id })

      if (result.error) {
        // Fallback to manual increment if RPC doesn't exist
        const currentPost = await this.getById(id)
        if (currentPost.data) {
          await this.client
            .from(this.tableName)
            .update({ view_count: (currentPost.data.view_count || 0) + 1 })
            .eq('id', id)
        }
      }

      return { data: true, error: null }

    } catch (error) {
      logger.error('View count increment failed', { id, error })
      return { data: false, error: 'Failed to increment view count' }
    }
  }

  /**
   * Validates slug uniqueness
   */
  public async validateSlugUniqueness(slug: string, excludeId?: string): Promise<QueryResult<boolean>> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('id')
        .eq('slug', slug)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const result = await query.single()

      // If no data found, slug is unique
      const isUnique = !result.data

      return { data: isUnique, error: null }

    } catch (error) {
      logger.error('Slug validation failed', { slug, error })
      return { data: null, error: 'Failed to validate slug uniqueness' }
    }
  }

  /**
   * Gets related posts based on tags and categories (optimized with preloading)
   */
  public async getRelatedPosts(postId: string, limit: number = 5): Promise<QueryResult<BlogPost[]>> {
    try {
      this.validateAccess('read')
      const utils = await this.getUtils()

      return await executeOptimizedQuery(
        'blog_posts_related',
        async () => {
          // Get the current post to find related posts
          const currentPost = await this.getById(postId)
          if (!currentPost.data) {
            return { data: [], error: null }
          }

          const currentCategories = currentPost.data.category_ids
          const currentTags = currentPost.data.tags

          // Use a single optimized query with OR conditions for related content
          const relatedQuery = this.client
            .from(this.tableName)
            .select('*, author:author_id(id,name,email,avatar_url)')
            .neq('id', postId)
            .eq('status', ContentStatus.PUBLISHED)

          // Build complex query for related content
          const conditions: string[] = []
          
          // Find posts with overlapping categories
          if (currentCategories.length > 0) {
            currentCategories.forEach(categoryId => {
              conditions.push(`category_ids.cs.{${categoryId}}`)
            })
          }

          // Find posts with overlapping tags
          if (currentTags.length > 0) {
            currentTags.forEach(tag => {
              conditions.push(`tags.cs.{${tag}}`)
            })
          }

          let finalQuery = relatedQuery
          if (conditions.length > 0) {
            finalQuery = relatedQuery.or(conditions.join(','))
          }

          // Get more results than needed for better scoring
          const result = await finalQuery
            .order('view_count', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit * 3)

          if (result.error) {
            throw new Error(result.error.message)
          }

          const allPosts = (result.data || []).map(item => this.transformFromDatabase(item))
          
          // Score posts based on shared tags and categories with more sophisticated algorithm
          const scoredPosts = allPosts.map(post => {
            let score = 0
            
            // Score by shared categories (higher weight for exact matches)
            const sharedCategories = post.category_ids.filter(id => 
              currentCategories.includes(id)
            )
            score += sharedCategories.length * 5

            // Score by shared tags
            const sharedTags = post.tags.filter(tag => 
              currentTags.includes(tag)
            )
            score += sharedTags.length * 3

            // Boost score for recent posts
            const daysSincePublished = currentPost.data?.published_at 
              ? Math.floor((Date.now() - new Date(currentPost.data.published_at).getTime()) / (1000 * 60 * 60 * 24))
              : 0
            if (daysSincePublished <= 30) {
              score += 2
            }

            // Boost popular posts slightly
            if (post.view_count > 100) {
              score += 1
            }

            return { post, score }
          })

          // Sort by score and take the top posts
          const relatedPosts = scoredPosts
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.post)

          return { data: relatedPosts, error: null }
        },
        { 
          metadata: { postId, limit },
          enableMonitoring: true 
        }
      )

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get related posts failed', { postId, error: errorMessage })
      return { data: [], error: errorMessage }
    }
  }
}

export default BlogPostsDAL