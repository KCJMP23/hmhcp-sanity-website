/**
 * Services Data Access Layer (DAL)
 * Healthcare services management with pricing and category relationships
 * Provides type-safe database operations for service offerings
 */

import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { InjectableBaseDAL, DALUtils } from './base-injectable'
import { logger } from '@/lib/logger'
import {
  Service,
  ServiceCreate,
  ServiceUpdate,
  ServiceCreateSchema,
  ServiceUpdateSchema,
  DataClassification,
  ContentStatus,
  QueryResult,
  PaginatedResult,
  QueryOptions,
  DataAccessContext
} from './types'
import {
  sanitizeInput,
  validatePricingModel,
  validateServiceCompliance,
  sanitizeServiceDescription,
  TABLE_NAMES
} from './utils'

/**
 * Services Data Access Layer
 * Manages healthcare service offerings with pricing validation
 * and category relationships
 */
export class ServicesDAL extends InjectableBaseDAL<Service, ServiceCreate, ServiceUpdate> {
  private dataClassification = DataClassification.INTERNAL

  constructor(client: SupabaseClient, utils?: DALUtils) {
    super(
      client,
      TABLE_NAMES.SERVICES,
      ['name', 'description', 'detailed_description', 'features'], // searchable columns
      true, // requires audit
      utils
    )
  }

  // ================================
  // Schema Methods
  // ================================

  protected getCreateSchema(): z.ZodSchema<ServiceCreate> {
    return ServiceCreateSchema
  }

  protected getUpdateSchema(): z.ZodSchema<ServiceUpdate> {
    return ServiceUpdateSchema
  }

  // ================================
  // Data Transformation
  // ================================

  protected transformForSave(data: ServiceCreate | ServiceUpdate, context?: DataAccessContext): Record<string, any> {
    const transformed = {
      ...data,
      features: data.features || [],
      display_order: data.display_order || 0,
      is_featured: data.is_featured || false,
      description: this.sanitizeDescription(data.description || ''),
      detailed_description: this.sanitizeDescription(data.detailed_description || ''),
      pricing_model: data.pricing_model ? this.validatePricing(data.pricing_model) : undefined
    }

    // Validate service compliance
    this.validateServiceContent(transformed)

    return transformed
  }

  protected transformFromDatabase(data: Record<string, any>): Service {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      detailed_description: data.detailed_description,
      icon: data.icon,
      features: data.features || [],
      pricing_model: data.pricing_model,
      status: data.status as ContentStatus,
      category_id: data.category_id,
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
   * Sanitizes service descriptions for healthcare compliance
   */
  private sanitizeDescription(description: string): string {
    if (!description || typeof description !== 'string') {
      return ''
    }

    // Remove any potential sensitive pricing details or contractual information
    let sanitized = description

    // Remove specific pricing amounts that might be outdated
    sanitized = sanitized.replace(/\$[\d,]+(\.\d{2})?/g, '[PRICING]')
    
    // Remove specific contract terms or legal language that might be sensitive
    sanitized = sanitized.replace(/\b(contract|agreement|terms)\s+[^.!?]+[.!?]/gi, '$1 details available upon request.')

    // Remove potential client names or specific institutional references
    sanitized = sanitized.replace(/\b(client|customer|hospital|clinic)\s+[A-Z][a-zA-Z\s]+\b/g, '$1 [NAME]')

    return sanitized.trim()
  }

  /**
   * Validates pricing model format and compliance
   */
  private validatePricing(pricingModel: string): string {
    try {
      // Basic validation for common pricing models
      const validModels = [
        'subscription', 'per-user', 'per-patient', 'tiered',
        'usage-based', 'enterprise', 'custom', 'free-trial',
        'one-time', 'consultation', 'hourly', 'project-based'
      ]

      const lowerModel = pricingModel.toLowerCase()
      const isValidModel = validModels.some(model => lowerModel.includes(model))

      if (!isValidModel) {
        logger.warn('Unrecognized pricing model', { pricingModel })
      }

      // Remove any specific pricing details for security
      let sanitizedModel = pricingModel.replace(/\$[\d,]+(\.\d{2})?/g, '[AMOUNT]')
      
      return sanitizedModel.trim()

    } catch (error) {
      logger.error('Pricing validation error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        pricingModel 
      })
      return pricingModel
    }
  }

  /**
   * Validates service content for healthcare compliance
   */
  private validateServiceContent(data: any): void {
    try {
      // Check for potential healthcare compliance issues
      const content = `${data.description || ''} ${data.detailed_description || ''}`.toLowerCase()

      // Flag potential medical claims that need FDA approval
      const medicalClaims = [
        'diagnose', 'cure', 'treatment', 'prevent', 'disease',
        'medical advice', 'prescribe', 'medication'
      ]

      const foundClaims = medicalClaims.filter(claim => content.includes(claim))
      
      if (foundClaims.length > 0) {
        logger.warn('Potential medical claims detected in service content', {
          serviceName: data.name,
          claims: foundClaims
        })
      }

      // Check for HIPAA-related service mentions
      if (content.includes('hipaa') || content.includes('phi') || content.includes('protected health')) {
        logger.info('HIPAA-related service detected', {
          serviceName: data.name,
          auditRequired: true
        })
      }

    } catch (error) {
      logger.error('Service content validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        serviceName: data.name
      })
      // Don't throw - log warning and continue
    }
  }

  // ================================
  // Specialized Query Methods
  // ================================

  /**
   * Gets service by slug
   */
  public async getBySlug(slug: string): Promise<QueryResult<Service>> {
    try {
      this.validateAccess('read')

      const result = await this.client
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .eq('status', ContentStatus.PUBLISHED)
        .single()

      if (result.error) {
        logger.warn('Service not found by slug', { slug, error: result.error.message })
        return { data: null, error: 'Service not found' }
      }

      const service = this.transformFromDatabase(result.data)

      // Log access for audit
      if (this.requiresAudit && this.context) {
        await this.logAuditAction('VIEW' as any, service.id, { slug })
      }

      return { data: service, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get by slug failed', { slug, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets published services ordered by display order
   */
  public async getPublishedServices(limit?: number): Promise<QueryResult<Service[]>> {
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
        logger.error('Failed to get published services', { error: result.error.message })
        return { data: null, error: result.error.message }
      }

      const services = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: services, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get published services failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets featured services
   */
  public async getFeaturedServices(limit: number = 6): Promise<QueryResult<Service[]>> {
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
        logger.error('Failed to get featured services', { error: result.error.message })
        return { data: null, error: result.error.message }
      }

      const services = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: services, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get featured services failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets services by category
   */
  public async getServicesByCategory(categoryId: string, options: QueryOptions = {}): Promise<PaginatedResult<Service>> {
    const modifiedOptions = {
      ...options,
      filters: {
        ...options.filters,
        category_id: categoryId,
        status: ContentStatus.PUBLISHED
      }
    }

    return await this.getMany(modifiedOptions)
  }

  /**
   * Gets services by pricing model
   */
  public async getServicesByPricingModel(pricingModel: string, options: QueryOptions = {}): Promise<PaginatedResult<Service>> {
    try {
      this.validateAccess('read')

      const allServices = await this.getPublishedServices(1000) // Get all published services

      if (!allServices.data) {
        return {
          data: [],
          total: 0,
          page: options.page || 1,
          limit: options.limit || 20,
          hasNext: false,
          hasPrev: false
        }
      }

      const filteredServices = allServices.data.filter(service => 
        service.pricing_model && 
        service.pricing_model.toLowerCase().includes(pricingModel.toLowerCase())
      )

      // Apply pagination to filtered results
      const page = options.page || 1
      const limit = options.limit || 20
      const startIndex = (page - 1) * limit
      const paginatedServices = filteredServices.slice(startIndex, startIndex + limit)

      return {
        data: paginatedServices,
        total: filteredServices.length,
        page,
        limit,
        hasNext: startIndex + limit < filteredServices.length,
        hasPrev: page > 1
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get services by pricing model failed', { pricingModel, error: errorMessage })
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
   * Updates display order for services (batch operation)
   */
  public async updateDisplayOrder(orderUpdates: { id: string; display_order: number }[]): Promise<QueryResult<boolean>> {
    try {
      this.validateAccess('write')

      if (orderUpdates.length === 0) {
        return { data: true, error: null }
      }

      // Validate all IDs exist
      for (const update of orderUpdates) {
        const service = await this.getById(update.id)
        if (!service.data) {
          return { data: null, error: `Service not found: ${update.id}` }
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

      logger.info('Service display order updated successfully', {
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
   * Toggles featured status for a service
   */
  public async toggleFeatured(id: string): Promise<QueryResult<Service>> {
    try {
      this.validateAccess('write')

      const currentService = await this.getById(id)
      if (!currentService.data) {
        return { data: null, error: 'Service not found' }
      }

      return await this.update(id, {
        is_featured: !currentService.data.is_featured
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
   * Gets service statistics
   */
  public async getServiceStats(): Promise<QueryResult<{
    totalServices: number
    publishedServices: number
    featuredServices: number
    servicesByCategory: { categoryId: string; count: number }[]
    pricingModels: { model: string; count: number }[]
  }>> {
    try {
      this.validateAccess('read')

      const allServices = await this.getMany({ limit: 1000 })
      
      if (!allServices.data) {
        return { data: null, error: 'Failed to fetch service statistics' }
      }

      const publishedServices = allServices.data.filter(service => 
        service.status === ContentStatus.PUBLISHED
      )

      const featuredServices = publishedServices.filter(service => 
        service.is_featured
      )

      // Count services by category
      const categoryCounts: Record<string, number> = {}
      publishedServices.forEach(service => {
        if (service.category_id) {
          categoryCounts[service.category_id] = (categoryCounts[service.category_id] || 0) + 1
        }
      })

      const servicesByCategory = Object.entries(categoryCounts)
        .map(([categoryId, count]) => ({ categoryId, count }))
        .sort((a, b) => b.count - a.count)

      // Count pricing models
      const pricingCounts: Record<string, number> = {}
      publishedServices.forEach(service => {
        if (service.pricing_model) {
          pricingCounts[service.pricing_model] = (pricingCounts[service.pricing_model] || 0) + 1
        }
      })

      const pricingModels = Object.entries(pricingCounts)
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => b.count - a.count)

      const stats = {
        totalServices: allServices.data.length,
        publishedServices: publishedServices.length,
        featuredServices: featuredServices.length,
        servicesByCategory,
        pricingModels
      }

      return { data: stats, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get service stats failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Search services by name, description, or features
   */
  public async searchServices(query: string, options: QueryOptions = {}): Promise<PaginatedResult<Service>> {
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
   * Publishes a service with validation
   */
  public async publishService(id: string): Promise<QueryResult<Service>> {
    try {
      this.validateAccess('write')

      // Get current service to validate before publishing
      const currentService = await this.getById(id)
      if (!currentService.data) {
        return { data: null, error: 'Service not found' }
      }

      // Validate required fields
      if (!currentService.data.name || !currentService.data.description) {
        return { data: null, error: 'Name and description are required for publishing' }
      }

      if (currentService.data.features.length === 0) {
        return { data: null, error: 'At least one feature is required for publishing' }
      }

      // Update status to published
      return await this.update(id, {
        status: ContentStatus.PUBLISHED
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Service publish failed', { id, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets related services based on category and features
   */
  public async getRelatedServices(serviceId: string, limit: number = 5): Promise<QueryResult<Service[]>> {
    try {
      this.validateAccess('read')

      // Get the current service to find related services
      const currentService = await this.getById(serviceId)
      if (!currentService.data) {
        return { data: [], error: null }
      }

      // Get services in the same category
      let relatedServices: Service[] = []
      
      if (currentService.data.category_id) {
        const categoryServices = await this.getServicesByCategory(currentService.data.category_id, { limit: limit + 1 })
        relatedServices = categoryServices.data.filter(service => service.id !== serviceId)
      }

      // If not enough related services, get featured services
      if (relatedServices.length < limit) {
        const featuredServices = await this.getFeaturedServices(limit)
        const additionalServices = featuredServices.data?.filter(service => 
          service.id !== serviceId && !relatedServices.find(rs => rs.id === service.id)
        ) || []
        
        relatedServices = [...relatedServices, ...additionalServices].slice(0, limit)
      }

      return { data: relatedServices, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get related services failed', { serviceId, error: errorMessage })
      return { data: [], error: errorMessage }
    }
  }
}

export default ServicesDAL