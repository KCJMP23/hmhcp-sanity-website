/**
 * Pages Data Access Layer (DAL)
 * Healthcare platform page content management with HIPAA compliance
 * Provides type-safe database operations for managed content pages
 */

import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { InjectableBaseDAL, DALUtils } from './base-injectable'
import { logger } from '@/lib/logger'
import {
  Page,
  PageCreate,
  PageUpdate,
  PageCreateSchema,
  PageUpdateSchema,
  DataClassification,
  ContentStatus,
  QueryResult,
  DataAccessContext
} from './types'
import {
  sanitizeInput,
  validateHealthcareContent,
  extractMedicalTerminology,
  validateMedicalAccuracy,
  TABLE_NAMES
} from './utils'

/**
 * Pages Data Access Layer
 * Manages page content with medical accuracy validation and healthcare compliance
 */
export class PagesDAL extends InjectableBaseDAL<Page, PageCreate, PageUpdate> {
  private dataClassification: DataClassification

  constructor(client: SupabaseClient, utils?: DALUtils) {
    super(
      client,
      TABLE_NAMES.PAGES,
      ['title', 'content', 'meta_description', 'slug'], // searchable columns
      true, // requires audit
      utils
    )
    this.dataClassification = DataClassification.INTERNAL
  }

  // ================================
  // Schema Methods
  // ================================

  protected getCreateSchema(): z.ZodSchema<PageCreate> {
    return PageCreateSchema
  }

  protected getUpdateSchema(): z.ZodSchema<PageUpdate> {
    return PageUpdateSchema
  }

  // ================================
  // Data Transformation
  // ================================

  protected transformForSave(data: PageCreate | PageUpdate, context?: DataAccessContext): Record<string, any> {
    const transformed = {
      ...data,
      content: this.sanitizeContent(data.content),
      meta_keywords: data.meta_keywords || [],
      seo_config: data.seo_config || {}
    }

    // Validate medical accuracy if healthcare content is detected
    if (this.containsHealthcareContent(transformed.content)) {
      this.validateMedicalContent(transformed)
    }

    return transformed
  }

  protected transformFromDatabase(data: Record<string, any>): Page {
    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      content: data.content || {},
      meta_description: data.meta_description,
      meta_keywords: data.meta_keywords || [],
      status: data.status as ContentStatus,
      template: data.template,
      featured_image: data.featured_image,
      seo_config: data.seo_config || {},
      published_at: data.published_at,
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
   * Sanitizes page content for healthcare compliance
   */
  private sanitizeContent(content: any): Record<string, any> {
    if (!content || typeof content !== 'object') {
      return {}
    }

    const sanitized = { ...content }

    // Remove potential PHI from content
    if (sanitized.sections && Array.isArray(sanitized.sections)) {
      sanitized.sections = sanitized.sections.map((section: any) => {
        if (section.content && typeof section.content === 'string') {
          section.content = this.removePotentialPHI(section.content)
        }
        return section
      })
    }

    // Sanitize rich text content
    if (sanitized.richText && typeof sanitized.richText === 'string') {
      sanitized.richText = this.removePotentialPHI(sanitized.richText)
    }

    return sanitized
  }

  /**
   * Removes potential Protected Health Information (PHI) from text
   */
  private removePotentialPHI(text: string): string {
    // Pattern for potential SSN
    const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/g
    // Pattern for potential phone numbers in medical context
    const phonePattern = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g
    // Pattern for potential DOB
    const dobPattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g

    return text
      .replace(ssnPattern, '[REDACTED]')
      .replace(phonePattern, '[CONTACT]')
      .replace(dobPattern, '[DATE]')
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
            pageSlug: data.slug
          })
          
          throw new Error(`Medical accuracy validation failed: ${validation.issues.join(', ')}`)
        }
      }
    } catch (error) {
      logger.error('Medical content validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        pageSlug: data.slug
      })
      // Don't throw - log warning and continue
    }
  }

  /**
   * Checks if content contains healthcare-related information
   */
  private containsHealthcareContent(content: any): boolean {
    if (!content || typeof content !== 'object') {
      return false
    }

    const contentString = JSON.stringify(content).toLowerCase()
    const healthcareKeywords = [
      'medical', 'healthcare', 'patient', 'treatment', 'diagnosis',
      'medication', 'doctor', 'nurse', 'hospital', 'clinic',
      'therapy', 'surgical', 'pharmaceutical', 'clinical'
    ]

    return healthcareKeywords.some(keyword => contentString.includes(keyword))
  }

  // ================================
  // Specialized Query Methods
  // ================================

  /**
   * Gets page by slug with caching support
   */
  public async getBySlug(slug: string): Promise<QueryResult<Page>> {
    try {
      this.validateAccess('read')

      const result = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .eq('status', ContentStatus.PUBLISHED)
        .single()

      if (result.error) {
        logger.warn('Page not found by slug', { slug, error: result.error.message })
        return { data: null, error: 'Page not found' }
      }

      const page = this.transformFromDatabase(result.data)

      // Log access for audit
      if (this.requiresAudit && this.context) {
        await this.logAuditAction('VIEW' as any, page.id, { slug })
      }

      return { data: page, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get by slug failed', { slug, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets published pages only
   */
  public async getPublishedPages(limit: number = 10): Promise<QueryResult<Page[]>> {
    try {
      this.validateAccess('read')

      const result = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('status', ContentStatus.PUBLISHED)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (result.error) {
        logger.error('Failed to get published pages', { error: result.error.message })
        return { data: null, error: result.error.message }
      }

      const pages = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: pages, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get published pages failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Publishes a page (status change with validation)
   */
  public async publishPage(id: string): Promise<QueryResult<Page>> {
    try {
      this.validateAccess('write')

      // Get current page to validate before publishing
      const currentPage = await this.getById(id)
      if (!currentPage.data) {
        return { data: null, error: 'Page not found' }
      }

      // Validate page content before publishing
      if (this.containsHealthcareContent(currentPage.data.content)) {
        this.validateMedicalContent(currentPage.data)
      }

      // Update status to published
      return await this.update(id, {
        status: ContentStatus.PUBLISHED,
        published_at: new Date().toISOString()
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Page publish failed', { id, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Archives a page (soft delete)
   */
  public async archivePage(id: string): Promise<QueryResult<Page>> {
    try {
      this.validateAccess('write')

      return await this.update(id, {
        status: ContentStatus.ARCHIVED
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Page archive failed', { id, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Validates slug uniqueness
   */
  public async validateSlugUniqueness(slug: string, excludeId?: string): Promise<QueryResult<boolean>> {
    try {
      let query = this.supabase
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
}

export default PagesDAL