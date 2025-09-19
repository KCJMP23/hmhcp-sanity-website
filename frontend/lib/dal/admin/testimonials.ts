/**
 * Testimonials Data Access Layer (DAL)
 * Client testimonial management with service and platform relationships
 * Provides type-safe database operations for testimonial content
 */

import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { InjectableBaseDAL, DALUtils } from './base-injectable'
import { logger } from '@/lib/logger'
import {
  Testimonial,
  TestimonialCreate,
  TestimonialUpdate,
  TestimonialCreateSchema,
  TestimonialUpdateSchema,
  DataClassification,
  ContentStatus,
  QueryResult,
  PaginatedResult,
  QueryOptions,
  DataAccessContext
} from './types'
import {
  sanitizeInput,
  validateClientInformation,
  sanitizeClientData,
  validateTestimonialContent,
  TABLE_NAMES
} from './utils'

/**
 * Testimonials Data Access Layer
 * Manages client testimonials with privacy protection and relationship management
 */
export class TestimonialsDAL extends InjectableBaseDAL<Testimonial, TestimonialCreate, TestimonialUpdate> {
  private dataClassification = DataClassification.CONFIDENTIAL // Client data is confidential

  constructor(client: SupabaseClient, utils?: DALUtils) {
    super(
      client,
      TABLE_NAMES.TESTIMONIALS,
      ['client_name', 'content', 'client_company'], // searchable columns
      true, // requires audit
      utils
    )
  }

  // ================================
  // Schema Methods
  // ================================

  protected getCreateSchema(): z.ZodSchema<TestimonialCreate> {
    return TestimonialCreateSchema
  }

  protected getUpdateSchema(): z.ZodSchema<TestimonialUpdate> {
    return TestimonialUpdateSchema
  }

  // ================================
  // Data Transformation
  // ================================

  protected transformForSave(data: TestimonialCreate | TestimonialUpdate, context?: DataAccessContext): Record<string, any> {
    const transformed = {
      ...data,
      client_name: this.sanitizeClientName(data.client_name || ''),
      client_company: this.sanitizeClientCompany(data.client_company),
      content: this.sanitizeTestimonialContent(data.content || ''),
      display_order: data.display_order || 0,
      is_featured: data.is_featured || false,
      rating: this.validateRating(data.rating),
      service_ids: data.service_ids || [],
      platform_ids: data.platform_ids || []
    }

    // Validate testimonial content for compliance
    this.validateTestimonialCompliance(transformed)

    return transformed
  }

  protected transformFromDatabase(data: Record<string, any>): Testimonial {
    return {
      id: data.id,
      client_name: data.client_name,
      client_title: data.client_title,
      client_company: data.client_company,
      content: data.content,
      rating: data.rating,
      avatar_url: data.avatar_url,
      is_featured: data.is_featured || false,
      display_order: data.display_order || 0,
      status: data.status as ContentStatus,
      service_ids: data.service_ids || [],
      platform_ids: data.platform_ids || [],
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  // ================================
  // Healthcare-Specific Methods
  // ================================

  /**
   * Sanitizes client name for privacy protection
   */
  private sanitizeClientName(name: string): string {
    if (!name || typeof name !== 'string') {
      return ''
    }

    // Trim and basic sanitization
    let sanitized = name.trim()

    // Remove potential sensitive information or suspicious patterns
    sanitized = sanitized.replace(/\b(doctor|dr|patient|mr|mrs|ms)\.\s*/gi, '')
    
    // Limit name length for privacy
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 97) + '...'
    }

    return sanitized
  }

  /**
   * Sanitizes client company information
   */
  private sanitizeClientCompany(company?: string): string | undefined {
    if (!company || typeof company !== 'string') {
      return undefined
    }

    let sanitized = company.trim()

    // Remove potential sensitive business information
    sanitized = sanitized.replace(/\b(private|confidential|internal)\b/gi, '')
    
    // Limit company name length
    if (sanitized.length > 150) {
      sanitized = sanitized.substring(0, 147) + '...'
    }

    return sanitized || undefined
  }

  /**
   * Sanitizes testimonial content for compliance
   */
  private sanitizeTestimonialContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return ''
    }

    let sanitized = content.trim()

    // Remove potential PHI or sensitive medical information
    sanitized = sanitized.replace(/\b(ssn|social security|patient id|medical record)\s*:?\s*\S+/gi, '[REDACTED]')
    
    // Remove specific medical details that could be identifying
    sanitized = sanitized.replace(/\b(diagnosed with|suffering from|treatment for)\s+[^.!?]+/gi, '$1 [CONDITION]')
    
    // Remove specific dates that could be identifying
    sanitized = sanitized.replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, '[DATE]')
    
    // Remove phone numbers and specific contact information
    sanitized = sanitized.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE]')

    return sanitized
  }

  /**
   * Validates rating value
   */
  private validateRating(rating?: number): number | undefined {
    if (rating === undefined || rating === null) {
      return undefined
    }

    // Ensure rating is within valid range
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      logger.warn('Invalid rating value', { rating })
      return undefined
    }

    return rating
  }

  /**
   * Validates testimonial content for healthcare compliance
   */
  private validateTestimonialCompliance(data: any): void {
    try {
      const content = `${data.content || ''} ${data.client_name || ''} ${data.client_company || ''}`.toLowerCase()

      // Check for potential PHI indicators
      const phiIndicators = [
        'patient', 'medical record', 'diagnosis', 'prescription',
        'ssn', 'social security', 'birthdate', 'dob'
      ]

      const foundIndicators = phiIndicators.filter(indicator => content.includes(indicator))
      
      if (foundIndicators.length > 0) {
        logger.warn('Potential PHI detected in testimonial', {
          clientName: data.client_name?.substring(0, 10) + '...',
          indicators: foundIndicators
        })
      }

      // Check for medical claims that might need disclaimers
      const medicalClaims = [
        'cure', 'treat', 'diagnose', 'prevent', 'medical advice'
      ]

      const foundClaims = medicalClaims.filter(claim => content.includes(claim))
      
      if (foundClaims.length > 0) {
        logger.warn('Medical claims detected in testimonial', {
          clientName: data.client_name?.substring(0, 10) + '...',
          claims: foundClaims
        })
      }

    } catch (error) {
      logger.error('Testimonial compliance validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clientName: data.client_name?.substring(0, 10) + '...'
      })
      // Don't throw - log warning and continue
    }
  }

  // ================================
  // Specialized Query Methods
  // ================================

  /**
   * Gets published testimonials ordered by display order
   */
  public async getPublishedTestimonials(limit?: number): Promise<QueryResult<Testimonial[]>> {
    try {
      this.validateAccess('read')

      let query = this.client
        .from(this.tableName)
        .select('*')
        .eq('status', ContentStatus.PUBLISHED)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const result = await query

      if (result.error) {
        logger.error('Failed to get published testimonials', { error: result.error.message })
        return { data: null, error: result.error.message }
      }

      const testimonials = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: testimonials, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get published testimonials failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets featured testimonials
   */
  public async getFeaturedTestimonials(limit: number = 6): Promise<QueryResult<Testimonial[]>> {
    try {
      this.validateAccess('read')

      const result = await this.client
        .from(this.tableName)
        .select('*')
        .eq('status', ContentStatus.PUBLISHED)
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .order('rating', { ascending: false })
        .limit(limit)

      if (result.error) {
        logger.error('Failed to get featured testimonials', { error: result.error.message })
        return { data: null, error: result.error.message }
      }

      const testimonials = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: testimonials, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get featured testimonials failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets testimonials by service
   */
  public async getTestimonialsByService(serviceId: string, options: QueryOptions = {}): Promise<PaginatedResult<Testimonial>> {
    try {
      this.validateAccess('read')

      // Note: This is a simplified approach since Supabase client doesn't have
      // native array contains query. In production, you'd use a stored procedure
      const allTestimonials = await this.getPublishedTestimonials(1000) // Get all published testimonials

      if (!allTestimonials.data) {
        return {
          data: [],
          total: 0,
          page: options.page || 1,
          limit: options.limit || 20,
          hasNext: false,
          hasPrev: false
        }
      }

      const filteredTestimonials = allTestimonials.data.filter(testimonial => 
        testimonial.service_ids && testimonial.service_ids.includes(serviceId)
      )

      // Apply pagination to filtered results
      const page = options.page || 1
      const limit = options.limit || 20
      const startIndex = (page - 1) * limit
      const paginatedTestimonials = filteredTestimonials.slice(startIndex, startIndex + limit)

      return {
        data: paginatedTestimonials,
        total: filteredTestimonials.length,
        page,
        limit,
        hasNext: startIndex + limit < filteredTestimonials.length,
        hasPrev: page > 1
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get testimonials by service failed', { serviceId, error: errorMessage })
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
   * Gets testimonials by platform
   */
  public async getTestimonialsByPlatform(platformId: string, options: QueryOptions = {}): Promise<PaginatedResult<Testimonial>> {
    try {
      this.validateAccess('read')

      const allTestimonials = await this.getPublishedTestimonials(1000) // Get all published testimonials

      if (!allTestimonials.data) {
        return {
          data: [],
          total: 0,
          page: options.page || 1,
          limit: options.limit || 20,
          hasNext: false,
          hasPrev: false
        }
      }

      const filteredTestimonials = allTestimonials.data.filter(testimonial => 
        testimonial.platform_ids && testimonial.platform_ids.includes(platformId)
      )

      // Apply pagination to filtered results
      const page = options.page || 1
      const limit = options.limit || 20
      const startIndex = (page - 1) * limit
      const paginatedTestimonials = filteredTestimonials.slice(startIndex, startIndex + limit)

      return {
        data: paginatedTestimonials,
        total: filteredTestimonials.length,
        page,
        limit,
        hasNext: startIndex + limit < filteredTestimonials.length,
        hasPrev: page > 1
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get testimonials by platform failed', { platformId, error: errorMessage })
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
   * Gets testimonials by rating
   */
  public async getTestimonialsByRating(rating: number, options: QueryOptions = {}): Promise<PaginatedResult<Testimonial>> {
    const modifiedOptions = {
      ...options,
      filters: {
        ...options.filters,
        rating,
        status: ContentStatus.PUBLISHED
      }
    }

    return await this.getMany(modifiedOptions)
  }

  /**
   * Updates display order for testimonials (batch operation)
   */
  public async updateDisplayOrder(orderUpdates: { id: string; display_order: number }[]): Promise<QueryResult<boolean>> {
    try {
      this.validateAccess('write')

      if (orderUpdates.length === 0) {
        return { data: true, error: null }
      }

      // Validate all IDs exist
      for (const update of orderUpdates) {
        const testimonial = await this.getById(update.id)
        if (!testimonial.data) {
          return { data: null, error: `Testimonial not found: ${update.id}` }
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

      logger.info('Testimonial display order updated successfully', {
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
   * Toggles featured status for a testimonial
   */
  public async toggleFeatured(id: string): Promise<QueryResult<Testimonial>> {
    try {
      this.validateAccess('write')

      const currentTestimonial = await this.getById(id)
      if (!currentTestimonial.data) {
        return { data: null, error: 'Testimonial not found' }
      }

      return await this.update(id, {
        is_featured: !currentTestimonial.data.is_featured
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Toggle featured failed', { id, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets testimonial statistics
   */
  public async getTestimonialStats(): Promise<QueryResult<{
    totalTestimonials: number
    publishedTestimonials: number
    featuredTestimonials: number
    averageRating: number
    ratingDistribution: { rating: number; count: number }[]
    topServices: { serviceId: string; count: number }[]
    topPlatforms: { platformId: string; count: number }[]
  }>> {
    try {
      this.validateAccess('read')

      const allTestimonials = await this.getMany({ limit: 1000 })
      
      if (!allTestimonials.data) {
        return { data: null, error: 'Failed to fetch testimonial statistics' }
      }

      const publishedTestimonials = allTestimonials.data.filter(testimonial => 
        testimonial.status === ContentStatus.PUBLISHED
      )

      const featuredTestimonials = publishedTestimonials.filter(testimonial => 
        testimonial.is_featured
      )

      // Calculate average rating
      const testimonialsWithRating = publishedTestimonials.filter(t => t.rating)
      const averageRating = testimonialsWithRating.length > 0 
        ? testimonialsWithRating.reduce((sum, t) => sum + (t.rating || 0), 0) / testimonialsWithRating.length
        : 0

      // Rating distribution
      const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      testimonialsWithRating.forEach(testimonial => {
        if (testimonial.rating) {
          ratingCounts[testimonial.rating] = (ratingCounts[testimonial.rating] || 0) + 1
        }
      })

      const ratingDistribution = Object.entries(ratingCounts)
        .map(([rating, count]) => ({ rating: parseInt(rating), count }))

      // Count service mentions
      const serviceCounts: Record<string, number> = {}
      publishedTestimonials.forEach(testimonial => {
        testimonial.service_ids?.forEach(serviceId => {
          serviceCounts[serviceId] = (serviceCounts[serviceId] || 0) + 1
        })
      })

      const topServices = Object.entries(serviceCounts)
        .map(([serviceId, count]) => ({ serviceId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Count platform mentions
      const platformCounts: Record<string, number> = {}
      publishedTestimonials.forEach(testimonial => {
        testimonial.platform_ids?.forEach(platformId => {
          platformCounts[platformId] = (platformCounts[platformId] || 0) + 1
        })
      })

      const topPlatforms = Object.entries(platformCounts)
        .map(([platformId, count]) => ({ platformId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      const stats = {
        totalTestimonials: allTestimonials.data.length,
        publishedTestimonials: publishedTestimonials.length,
        featuredTestimonials: featuredTestimonials.length,
        averageRating: Math.round(averageRating * 100) / 100,
        ratingDistribution,
        topServices,
        topPlatforms
      }

      return { data: stats, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get testimonial stats failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Search testimonials by content or client information
   */
  public async searchTestimonials(query: string, options: QueryOptions = {}): Promise<PaginatedResult<Testimonial>> {
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
   * Publishes a testimonial with validation
   */
  public async publishTestimonial(id: string): Promise<QueryResult<Testimonial>> {
    try {
      this.validateAccess('write')

      // Get current testimonial to validate before publishing
      const currentTestimonial = await this.getById(id)
      if (!currentTestimonial.data) {
        return { data: null, error: 'Testimonial not found' }
      }

      // Validate required fields
      if (!currentTestimonial.data.client_name || !currentTestimonial.data.content) {
        return { data: null, error: 'Client name and content are required for publishing' }
      }

      // Additional compliance validation before publishing
      this.validateTestimonialCompliance(currentTestimonial.data)

      // Update status to published
      return await this.update(id, {
        status: ContentStatus.PUBLISHED
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Testimonial publish failed', { id, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Archives a testimonial (soft delete for compliance)
   */
  public async archiveTestimonial(id: string): Promise<QueryResult<Testimonial>> {
    try {
      this.validateAccess('write')

      return await this.update(id, {
        status: ContentStatus.ARCHIVED
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Testimonial archive failed', { id, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets random testimonials for display variety
   */
  public async getRandomTestimonials(limit: number = 5): Promise<QueryResult<Testimonial[]>> {
    try {
      this.validateAccess('read')

      // Get published testimonials and shuffle them
      const published = await this.getPublishedTestimonials(100) // Get more to shuffle from
      
      if (!published.data || published.data.length === 0) {
        return { data: [], error: null }
      }

      // Simple shuffle algorithm
      const shuffled = [...published.data]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

      const randomTestimonials = shuffled.slice(0, limit)
      return { data: randomTestimonials, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get random testimonials failed', { limit, error: errorMessage })
      return { data: [], error: errorMessage }
    }
  }
}

export default TestimonialsDAL