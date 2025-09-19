/**
 * Platforms Data Access Layer (DAL)
 * Healthcare platform technology management with feature validation
 * Provides type-safe database operations for platform showcase content
 */

import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { InjectableBaseDAL, DALUtils } from './base-injectable'
import { logger } from '@/lib/logger'
import {
  Platform,
  PlatformCreate,
  PlatformUpdate,
  PlatformCreateSchema,
  PlatformUpdateSchema,
  DataClassification,
  ContentStatus,
  QueryResult,
  PaginatedResult,
  QueryOptions,
  DataAccessContext
} from './types'
import {
  sanitizeInput,
  validateTechnicalContent,
  validateUrlSafety,
  sanitizeTechnicalDescription,
  TABLE_NAMES
} from './utils'

/**
 * Platforms Data Access Layer
 * Manages healthcare technology platform content with technical validation
 * and compliance features
 */
export class PlatformsDAL extends InjectableBaseDAL<Platform, PlatformCreate, PlatformUpdate> {
  private dataClassification = DataClassification.INTERNAL

  constructor(client: SupabaseClient, utils?: DALUtils) {
    super(
      client,
      TABLE_NAMES.PLATFORMS,
      ['name', 'description', 'detailed_description', 'features', 'technologies'], // searchable columns
      true, // requires audit
      utils
    )
  }

  // ================================
  // Schema Methods
  // ================================

  protected getCreateSchema(): z.ZodSchema<PlatformCreate> {
    return PlatformCreateSchema
  }

  protected getUpdateSchema(): z.ZodSchema<PlatformUpdate> {
    return PlatformUpdateSchema
  }

  // ================================
  // Data Transformation
  // ================================

  protected transformForSave(data: PlatformCreate | PlatformUpdate, context?: DataAccessContext): Record<string, any> {
    const transformed = {
      ...data,
      features: data.features || [],
      technologies: data.technologies || [],
      gallery_images: data.gallery_images || [],
      display_order: data.display_order || 0,
      is_featured: data.is_featured || false,
      description: this.sanitizeDescription(data.description || ''),
      detailed_description: this.sanitizeDescription(data.detailed_description || '')
    }

    // Validate URLs if provided
    if (transformed.demo_url) {
      this.validateDemoUrl(transformed.demo_url)
    }
    if (transformed.documentation_url) {
      this.validateDocumentationUrl(transformed.documentation_url)
    }

    // Validate technical content
    this.validateTechnicalContent(transformed)

    return transformed
  }

  protected transformFromDatabase(data: Record<string, any>): Platform {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      detailed_description: data.detailed_description,
      features: data.features || [],
      technologies: data.technologies || [],
      status: data.status as ContentStatus,
      featured_image: data.featured_image,
      gallery_images: data.gallery_images || [],
      demo_url: data.demo_url,
      documentation_url: data.documentation_url,
      display_order: data.display_order || 0,
      is_featured: data.is_featured || false,
      created_by: data.created_by,
      updated_by: data.updated_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  // ================================
  // Healthcare-Specific Methods
  // ================================

  /**
   * Sanitizes platform descriptions for healthcare compliance
   */
  private sanitizeDescription(description: string): string {
    if (!description || typeof description !== 'string') {
      return ''
    }

    // Remove any potential sensitive technical details that could be security risks
    let sanitized = description

    // Remove specific IP addresses or internal URLs
    sanitized = sanitized.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP ADDRESS]')
    
    // Remove specific database connection strings or keys
    sanitized = sanitized.replace(/\b(password|key|secret|token)\s*[=:]\s*\S+/gi, '$1=[REDACTED]')
    
    // Remove specific server names or internal hostnames
    sanitized = sanitized.replace(/\b(server|host)\s*[=:]\s*\S+/gi, '$1=[SERVER]')

    return sanitized.trim()
  }

  /**
   * Validates demo URL safety and accessibility
   */
  private validateDemoUrl(url: string): void {
    try {
      if (!validateUrlSafety(url)) {
        logger.warn('Demo URL safety validation failed', { url: url.substring(0, 50) + '...' })
        throw new Error('Demo URL failed safety validation')
      }

      // Check if URL is accessible (in production, you might want to do an actual HTTP check)
      const parsedUrl = new URL(url)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Demo URL must use HTTP or HTTPS protocol')
      }

    } catch (error) {
      logger.error('Demo URL validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: url.substring(0, 50) + '...'
      })
      throw new Error('Invalid demo URL provided')
    }
  }

  /**
   * Validates documentation URL safety and accessibility
   */
  private validateDocumentationUrl(url: string): void {
    try {
      if (!validateUrlSafety(url)) {
        logger.warn('Documentation URL safety validation failed', { url: url.substring(0, 50) + '...' })
        throw new Error('Documentation URL failed safety validation')
      }

      const parsedUrl = new URL(url)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Documentation URL must use HTTP or HTTPS protocol')
      }

    } catch (error) {
      logger.error('Documentation URL validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: url.substring(0, 50) + '...'
      })
      throw new Error('Invalid documentation URL provided')
    }
  }

  /**
   * Validates technical content accuracy
   */
  private validateTechnicalContent(data: any): void {
    try {
      // Validate technology stack mentions
      if (data.technologies && Array.isArray(data.technologies)) {
        const invalidTechnologies = data.technologies.filter((tech: string) => {
          // Basic validation for technology names
          return !tech || typeof tech !== 'string' || tech.length < 2
        })

        if (invalidTechnologies.length > 0) {
          logger.warn('Invalid technology entries detected', {
            invalidTechnologies,
            platformName: data.name
          })
        }
      }

      // Validate feature descriptions
      if (data.features && Array.isArray(data.features)) {
        const invalidFeatures = data.features.filter((feature: string) => {
          return !feature || typeof feature !== 'string' || feature.length < 10
        })

        if (invalidFeatures.length > 0) {
          logger.warn('Invalid or incomplete feature descriptions detected', {
            invalidFeatures: invalidFeatures.length,
            platformName: data.name
          })
        }
      }

    } catch (error) {
      logger.error('Technical content validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platformName: data.name
      })
      // Don't throw - log warning and continue
    }
  }

  // ================================
  // Specialized Query Methods
  // ================================

  /**
   * Gets platform by slug
   */
  public async getBySlug(slug: string): Promise<QueryResult<Platform>> {
    try {
      this.validateAccess('read')

      const result = await this.client
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .eq('status', ContentStatus.PUBLISHED)
        .single()

      if (result.error) {
        logger.warn('Platform not found by slug', { slug, error: result.error.message })
        return { data: null, error: 'Platform not found' }
      }

      const platform = this.transformFromDatabase(result.data)

      // Log access for audit
      if (this.requiresAudit && this.context) {
        await this.logAuditAction('VIEW' as any, platform.id, { slug })
      }

      return { data: platform, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get by slug failed', { slug, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets published platforms ordered by display order
   */
  public async getPublishedPlatforms(limit?: number): Promise<QueryResult<Platform[]>> {
    try {
      this.validateAccess('read')

      let query = this.client
        .from(this.tableName)
        .select('*')
        .eq('status', ContentStatus.PUBLISHED)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (limit) {
        query = query.limit(limit)
      }

      const result = await query

      if (result.error) {
        logger.error('Failed to get published platforms', { error: result.error.message })
        return { data: null, error: result.error.message }
      }

      const platforms = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: platforms, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get published platforms failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets featured platforms
   */
  public async getFeaturedPlatforms(limit: number = 6): Promise<QueryResult<Platform[]>> {
    try {
      this.validateAccess('read')

      const result = await this.client
        .from(this.tableName)
        .select('*')
        .eq('status', ContentStatus.PUBLISHED)
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })
        .limit(limit)

      if (result.error) {
        logger.error('Failed to get featured platforms', { error: result.error.message })
        return { data: null, error: result.error.message }
      }

      const platforms = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: platforms, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get featured platforms failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets platforms by technology stack
   */
  public async getPlatformsByTechnology(technology: string, options: QueryOptions = {}): Promise<PaginatedResult<Platform>> {
    try {
      this.validateAccess('read')

      // Note: This is a simplified approach since Supabase client doesn't have
      // native array contains query. In production, you'd use a stored procedure
      const allPlatforms = await this.getPublishedPlatforms(1000) // Get all published platforms

      if (!allPlatforms.data) {
        return {
          data: [],
          total: 0,
          page: options.page || 1,
          limit: options.limit || 20,
          hasNext: false,
          hasPrev: false
        }
      }

      const filteredPlatforms = allPlatforms.data.filter(platform => 
        platform.technologies.some(tech => 
          tech.toLowerCase().includes(technology.toLowerCase())
        )
      )

      // Apply pagination to filtered results
      const page = options.page || 1
      const limit = options.limit || 20
      const startIndex = (page - 1) * limit
      const paginatedPlatforms = filteredPlatforms.slice(startIndex, startIndex + limit)

      return {
        data: paginatedPlatforms,
        total: filteredPlatforms.length,
        page,
        limit,
        hasNext: startIndex + limit < filteredPlatforms.length,
        hasPrev: page > 1
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get platforms by technology failed', { technology, error: errorMessage })
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
   * Updates display order for platforms (batch operation)
   */
  public async updateDisplayOrder(orderUpdates: { id: string; display_order: number }[]): Promise<QueryResult<boolean>> {
    try {
      this.validateAccess('write')

      if (orderUpdates.length === 0) {
        return { data: true, error: null }
      }

      // Validate all IDs exist
      for (const update of orderUpdates) {
        const platform = await this.getById(update.id)
        if (!platform.data) {
          return { data: null, error: `Platform not found: ${update.id}` }
        }
      }

      // Execute updates in transaction-like manner
      const updatePromises = orderUpdates.map(update =>
        this.update(update.id, { display_order: update.display_order })
      )

      const results = await Promise.all(updatePromises)
      
      // Check if any update failed
      const failedUpdate = results.find(result => result.error)
      if (failedUpdate) {
        return { data: null, error: failedUpdate.error }
      }

      logger.info('Platform display order updated successfully', {
        updates: orderUpdates.length,
        userId: this.context?.userId
      })

      return { data: true, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Update display order failed', { 
        updates: orderUpdates.length, 
        error: errorMessage 
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Toggles featured status for a platform
   */
  public async toggleFeatured(id: string): Promise<QueryResult<Platform>> {
    try {
      this.validateAccess('write')

      const currentPlatform = await this.getById(id)
      if (!currentPlatform.data) {
        return { data: null, error: 'Platform not found' }
      }

      return await this.update(id, {
        is_featured: !currentPlatform.data.is_featured
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Toggle featured failed', { id, error: errorMessage })
      return { data: null, error: errorMessage }
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
   * Gets platform statistics
   */
  public async getPlatformStats(): Promise<QueryResult<{
    totalPlatforms: number
    publishedPlatforms: number
    featuredPlatforms: number
    topTechnologies: { technology: string; count: number }[]
  }>> {
    try {
      this.validateAccess('read')

      const allPlatforms = await this.getMany({ limit: 1000 })
      
      if (!allPlatforms.data) {
        return { data: null, error: 'Failed to fetch platform statistics' }
      }

      const publishedPlatforms = allPlatforms.data.filter(platform => 
        platform.status === ContentStatus.PUBLISHED
      )

      const featuredPlatforms = publishedPlatforms.filter(platform => 
        platform.is_featured
      )

      // Count technology usage
      const technologyCounts: Record<string, number> = {}
      publishedPlatforms.forEach(platform => {
        platform.technologies.forEach(tech => {
          technologyCounts[tech] = (technologyCounts[tech] || 0) + 1
        })
      })

      const topTechnologies = Object.entries(technologyCounts)
        .map(([technology, count]) => ({ technology, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Top 10 technologies

      const stats = {
        totalPlatforms: allPlatforms.data.length,
        publishedPlatforms: publishedPlatforms.length,
        featuredPlatforms: featuredPlatforms.length,
        topTechnologies
      }

      return { data: stats, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get platform stats failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Search platforms by name, description, features, or technologies
   */
  public async searchPlatforms(query: string, options: QueryOptions = {}): Promise<PaginatedResult<Platform>> {
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
   * Publishes a platform with validation
   */
  public async publishPlatform(id: string): Promise<QueryResult<Platform>> {
    try {
      this.validateAccess('write')

      // Get current platform to validate before publishing
      const currentPlatform = await this.getById(id)
      if (!currentPlatform.data) {
        return { data: null, error: 'Platform not found' }
      }

      // Validate required fields
      if (!currentPlatform.data.name || !currentPlatform.data.description) {
        return { data: null, error: 'Name and description are required for publishing' }
      }

      if (currentPlatform.data.features.length === 0) {
        return { data: null, error: 'At least one feature is required for publishing' }
      }

      // Update status to published
      return await this.update(id, {
        status: ContentStatus.PUBLISHED
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Platform publish failed', { id, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }
}

export default PlatformsDAL