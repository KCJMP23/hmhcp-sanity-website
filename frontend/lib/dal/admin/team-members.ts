/**
 * Team Members Data Access Layer (DAL)
 * Healthcare team member management with professional credentials validation
 * Provides type-safe database operations for healthcare team profiles
 */

import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { InjectableBaseDAL, DALUtils } from './base-injectable'
import { logger } from '@/lib/logger'
import {
  TeamMember,
  TeamMemberCreate,
  TeamMemberUpdate,
  TeamMemberCreateSchema,
  TeamMemberUpdateSchema,
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
  validateProfessionalCredentials,
  sanitizeContactInformation,
  executeOptimizedQuery,
  TABLE_NAMES
} from './utils'

/**
 * Team Members Data Access Layer
 * Manages healthcare team member profiles with credential validation
 * and professional compliance features
 */
export class TeamMembersDAL extends InjectableBaseDAL<TeamMember, TeamMemberCreate, TeamMemberUpdate> {
  private dataClassification = DataClassification.CONFIDENTIAL // Team member data is confidential

  constructor(client: SupabaseClient, utils?: DALUtils) {
    super(
      client,
      TABLE_NAMES.TEAM_MEMBERS,
      ['name', 'title', 'bio', 'expertise'], // searchable columns
      true, // requires audit
      utils
    )
  }

  // ================================
  // Schema Methods
  // ================================

  protected getCreateSchema(): z.ZodSchema<TeamMemberCreate> {
    return TeamMemberCreateSchema
  }

  protected getUpdateSchema(): z.ZodSchema<TeamMemberUpdate> {
    return TeamMemberUpdateSchema
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

  protected transformForSave(data: TeamMemberCreate | TeamMemberUpdate, context?: DataAccessContext): Record<string, any> {
    const transformed = {
      ...data,
      expertise: data.expertise || [],
      bio: this.sanitizeBio(data.bio || ''),
      email: this.sanitizeEmail(data.email),
      display_order: data.display_order || 0,
      is_featured: data.is_featured || false
    }

    // Validate professional credentials mentioned in bio or title
    if (transformed.bio || transformed.title) {
      this.validateProfessionalInfo(transformed)
    }

    return transformed
  }

  protected transformFromDatabase(data: Record<string, any>): TeamMember {
    return {
      id: data.id,
      name: data.name,
      title: data.title,
      bio: data.bio,
      avatar_url: data.avatar_url,
      email: data.email,
      linkedin_url: data.linkedin_url,
      twitter_url: data.twitter_url,
      expertise: data.expertise || [],
      is_featured: data.is_featured || false,
      display_order: data.display_order || 0,
      status: data.status as ContentStatus,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  // ================================
  // Healthcare-Specific Methods
  // ================================

  /**
   * Sanitizes bio content for healthcare compliance
   */
  private sanitizeBio(bio: string): string {
    if (!bio || typeof bio !== 'string') {
      return ''
    }

    // Remove potential personally identifiable information
    let sanitized = bio

    // Remove specific license numbers or sensitive credentials
    sanitized = sanitized.replace(/\b(license|cert|certification)\s*#?\s*\w+/gi, '$1 [NUMBER]')
    
    // Remove specific hospital/clinic affiliations that might be sensitive
    sanitized = sanitized.replace(/\b(formerly|previously)\s+at\s+[^.!?]+[.!?]/gi, '$1 at [INSTITUTION].')

    return sanitized.trim()
  }

  /**
   * Sanitizes email information
   */
  private sanitizeEmail(email?: string): string | undefined {
    if (!email) return undefined

    // Basic email validation and sanitization
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      logger.warn('Invalid email format detected', { email: email.substring(0, 5) + '...' })
      return undefined
    }

    return email.toLowerCase().trim()
  }

  /**
   * Validates professional credentials and titles
   */
  private validateProfessionalInfo(data: any): void {
    try {
      // Check for common medical credentials
      const commonCredentials = [
        'MD', 'DO', 'RN', 'LPN', 'PA', 'NP', 'PharmD', 'DPT', 'OTR',
        'LCSW', 'PhD', 'PsyD', 'MSN', 'BSN', 'CNA', 'EMT', 'Paramedic'
      ]

      const titleAndBio = `${data.title || ''} ${data.bio || ''}`.toLowerCase()
      const mentionedCredentials = commonCredentials.filter(cred => 
        titleAndBio.includes(cred.toLowerCase())
      )

      if (mentionedCredentials.length > 0) {
        logger.info('Professional credentials detected', {
          credentials: mentionedCredentials,
          memberName: data.name
        })

        // In a real implementation, you might validate these credentials
        // against professional licensing databases
        const validation = validateProfessionalCredentials(mentionedCredentials)
        
        if (!validation.isValid) {
          logger.warn('Professional credential validation failed', {
            credentials: mentionedCredentials,
            issues: validation.issues,
            memberName: data.name
          })
        }
      }

    } catch (error) {
      logger.error('Professional info validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        memberName: data.name
      })
      // Don't throw - log warning and continue
    }
  }

  // ================================
  // Specialized Query Methods
  // ================================

  /**
   * Gets active team members ordered by display order
   */
  public async getActiveMembers(limit?: number): Promise<QueryResult<TeamMember[]>> {
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
        logger.error('Failed to get active team members', { error: result.error.message })
        return { data: null, error: result.error.message }
      }

      const members = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: members, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get active members failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets featured team members
   */
  public async getFeaturedMembers(limit: number = 6): Promise<QueryResult<TeamMember[]>> {
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
        logger.error('Failed to get featured members', { error: result.error.message })
        return { data: null, error: result.error.message }
      }

      const members = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: members, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get featured members failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets team members by expertise area (optimized with array contains)
   */
  public async getMembersByExpertise(expertise: string, options: QueryOptions = {}): Promise<PaginatedResult<TeamMember>> {
    try {
      this.validateAccess('read')
      const utils = await this.getUtils()

      return await executeOptimizedQuery(
        'team_members_by_expertise',
        async () => {
          const { from, to, page, limit } = utils.buildPaginationParams(options)
          
          // Use array contains with ilike for partial matching
          let query = this.client
            .from(this.tableName)
            .select('*, platforms:platform_ids(id,name,slug)', {
              count: options.includeCount !== false ? 'exact' : undefined
            })
            .eq('status', ContentStatus.PUBLISHED)

          // Build expertise search conditions
          const expertiseConditions: string[] = []
          const expertiseTerms = expertise.toLowerCase().split(/\s+/)
          
          expertiseTerms.forEach(term => {
            // Use array element text search for expertise
            expertiseConditions.push(`expertise.cs.{${term}}`)
          })
          
          if (expertiseConditions.length > 0) {
            query = query.or(expertiseConditions.join(','))
          }

          // Apply additional filters
          query = utils.applyQueryConditions(query, options, this.searchableFields)
          
          // Apply ordering and pagination
          query = query
            .order('is_featured', { ascending: false })
            .order('display_order', { ascending: true })
            .order('name', { ascending: true })
            .range(from, to)

          return await query
        },
        { 
          metadata: { expertise, page: options.page, limit: options.limit },
          enableMonitoring: true 
        }
      ).then(result => {
        if (result.error) {
          logger.error('Get members by expertise failed', { expertise, error: result.error })
          return {
            data: [],
            total: 0,
            page: options.page || 1,
            limit: options.limit || 20,
            hasNext: false,
            hasPrev: false
          }
        }

        const members = (result.data || []).map(item => this.transformFromDatabase(item))
        const total = result.count || members.length
        const { from, to, page, limit } = utils.buildPaginationParams(options)

        return {
          data: members,
          total,
          page,
          limit,
          hasNext: from + members.length < total,
          hasPrev: page > 1
        }
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get members by expertise failed', { expertise, error: errorMessage })
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
   * Updates display order for team members (optimized batch operation)
   */
  public async updateDisplayOrder(orderUpdates: { id: string; display_order: number }[]): Promise<QueryResult<boolean>> {
    try {
      this.validateAccess('write')
      const utils = await this.getUtils()

      if (orderUpdates.length === 0) {
        return { data: true, error: null }
      }

      return await executeOptimizedQuery(
        'team_members_batch_update_order',
        async () => {
          // First, validate all IDs exist in a single query
          const ids = orderUpdates.map(update => update.id)
          const existingMembers = await this.client
            .from(this.tableName)
            .select('id')
            .in('id', ids)

          if (existingMembers.error) {
            throw new Error(`Failed to validate team member IDs: ${existingMembers.error.message}`)
          }

          const foundIds = new Set((existingMembers.data || []).map(m => m.id))
          const missingIds = ids.filter(id => !foundIds.has(id))
          
          if (missingIds.length > 0) {
            throw new Error(`Team members not found: ${missingIds.join(', ')}`)
          }

          // Execute all updates using upsert for better performance
          const updates = orderUpdates.map(update => ({
            id: update.id,
            display_order: update.display_order,
            updated_at: new Date().toISOString(),
            updated_by: this.context?.userId
          }))

          const { error } = await this.client
            .from(this.tableName)
            .upsert(updates, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })

          if (error) {
            throw new Error(`Batch update failed: ${error.message}`)
          }

          return { data: true, error: null }
        },
        { 
          metadata: { updateCount: orderUpdates.length },
          enableMonitoring: true 
        }
      ).then(result => {
        if (result.error) {
          logger.error('Update display order failed', { 
            updates: orderUpdates.length, 
            error: result.error 
          })
          return { data: null, error: result.error instanceof Error ? result.error.message : 'Update failed' }
        }

        logger.info('Display order updated successfully', {
          updates: orderUpdates.length,
          userId: this.context?.userId,
          queryTime: result.queryTime
        })

        return { data: true, error: null }
      })

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
   * Toggles featured status for a team member
   */
  public async toggleFeatured(id: string): Promise<QueryResult<TeamMember>> {
    try {
      this.validateAccess('write')

      const currentMember = await this.getById(id)
      if (!currentMember.data) {
        return { data: null, error: 'Team member not found' }
      }

      return await this.update(id, {
        is_featured: !currentMember.data.is_featured
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Toggle featured failed', { id, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets team statistics
   */
  public async getTeamStats(): Promise<QueryResult<{
    totalMembers: number
    activeMembers: number
    featuredMembers: number
    expertiseAreas: string[]
  }>> {
    try {
      this.validateAccess('read')

      const allMembers = await this.getMany({ limit: 1000 })
      
      if (!allMembers.data) {
        return { data: null, error: 'Failed to fetch team statistics' }
      }

      const activeMembers = allMembers.data.filter(member => 
        member.status === ContentStatus.PUBLISHED
      )

      const featuredMembers = activeMembers.filter(member => 
        member.is_featured
      )

      // Extract all unique expertise areas
      const allExpertise = activeMembers.flatMap(member => member.expertise)
      const uniqueExpertise = [...new Set(allExpertise)].sort()

      const stats = {
        totalMembers: allMembers.data.length,
        activeMembers: activeMembers.length,
        featuredMembers: featuredMembers.length,
        expertiseAreas: uniqueExpertise
      }

      return { data: stats, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get team stats failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Search team members by name, title, or expertise
   */
  public async searchMembers(query: string, options: QueryOptions = {}): Promise<PaginatedResult<TeamMember>> {
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
   * Validates required professional information completeness
   */
  public async validateProfessionalCompleteness(id: string): Promise<QueryResult<{
    isComplete: boolean
    missingFields: string[]
    warnings: string[]
  }>> {
    try {
      const member = await this.getById(id)
      if (!member.data) {
        return { data: null, error: 'Team member not found' }
      }

      const missingFields: string[] = []
      const warnings: string[] = []

      // Check required fields
      if (!member.data.name) missingFields.push('name')
      if (!member.data.title) missingFields.push('title')
      if (!member.data.bio) missingFields.push('bio')
      if (!member.data.expertise.length) missingFields.push('expertise')

      // Check recommended fields
      if (!member.data.avatar_url) warnings.push('avatar_url is recommended')
      if (!member.data.email) warnings.push('email is recommended for contact')

      // Check bio length
      if (member.data.bio && member.data.bio.length < 100) {
        warnings.push('bio should be at least 100 characters for better SEO')
      }

      const result = {
        isComplete: missingFields.length === 0,
        missingFields,
        warnings
      }

      return { data: result, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Validate professional completeness failed', { id, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }
}

export default TeamMembersDAL