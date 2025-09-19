/**
 * Content Versioning Data Access Layer
 * Comprehensive content versioning system with diff algorithms, rollback support,
 * and retention policies for healthcare platform admin system
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { BaseDAL } from './base'
import { logger } from '@/lib/logger'
import {
  ContentVersion,
  ContentVersionCreate,
  ContentVersionUpdate,
  ContentVersionCreateSchema,
  ContentVersionUpdateSchema,
  VersionComparison,
  VersionComparisonCreate,
  VersionComparisonCreateSchema,
  VersionAnnotation,
  VersionAnnotationCreate,
  VersionAnnotationUpdate,
  VersionAnnotationCreateSchema,
  VersionAnnotationUpdateSchema,
  VersionRollback,
  VersionRollbackCreate,
  VersionRollbackCreateSchema,
  VersionRetentionPolicy,
  VersionRetentionPolicyCreate,
  VersionRetentionPolicyUpdate,
  VersionRetentionPolicyCreateSchema,
  VersionRetentionPolicyUpdateSchema,
  VersionDiff,
  DiffItem,
  DiffType,
  VersionListOptions,
  QueryResult,
  PaginatedResult,
  DataClassification,
  AuditAction
} from './types'
import { 
  buildPaginationParams, 
  applyQueryConditions,
  sanitizeInput,
  validateWithHealthcareContext,
  retryDatabaseOperation,
  handleDatabaseError,
  sanitizeHealthcareDataForLogging
} from './utils'

/**
 * Content Versioning DAL - Manages content versions with comprehensive diff and rollback support
 */
export class ContentVersionDAL extends BaseDAL<ContentVersion, ContentVersionCreate, ContentVersionUpdate> {
  constructor(client: SupabaseClient) {
    super(
      client,
      'content_versions',
      ['title', 'change_description', 'branch_name'], // searchable columns
      true, // requires audit
      DataClassification.INTERNAL
    )
  }

  protected getCreateSchema(): z.ZodSchema<ContentVersionCreate> {
    return ContentVersionCreateSchema
  }

  protected getUpdateSchema(): z.ZodSchema<ContentVersionUpdate> {
    return ContentVersionUpdateSchema
  }

  protected transformForSave(data: ContentVersionCreate | ContentVersionUpdate, context?: any): Record<string, any> {
    return {
      ...data,
      updated_at: new Date().toISOString()
    }
  }

  protected transformFromDatabase(data: Record<string, any>): ContentVersion {
    return {
      id: data.id,
      content_type: data.content_type,
      content_id: data.content_id,
      version_number: data.version_number,
      title: data.title,
      content: data.content,
      change_description: data.change_description,
      change_summary: data.change_summary,
      diff_data: data.diff_data,
      is_current: data.is_current,
      is_published: data.is_published,
      is_draft: data.is_draft,
      branch_name: data.branch_name,
      parent_version_id: data.parent_version_id,
      merged_from_version_id: data.merged_from_version_id,
      created_by: data.created_by,
      created_at: data.created_at,
      published_at: data.published_at,
      retention_expires_at: data.retention_expires_at,
      is_protected: data.is_protected
    }
  }

  // ================================
  // Version Management
  // ================================

  /**
   * Create a new version of content with automatic version numbering
   */
  public async createVersion(data: ContentVersionCreate): Promise<QueryResult<ContentVersion>> {
    try {
      this.validateAccess('write', data)

      // Get next version number
      const nextVersionResult = await this.client
        .from('content_versions')
        .select('version_number')
        .eq('content_type', data.content_type)
        .eq('content_id', data.content_id)
        .order('version_number', { ascending: false })
        .limit(1)

      const nextVersion = (nextVersionResult.data?.[0]?.version_number || 0) + 1

      // Calculate diff from previous version if exists
      let diffData = null
      if (nextVersion > 1) {
        const previousVersionResult = await this.getCurrentVersion(data.content_type, data.content_id)
        if (previousVersionResult.data) {
          const diff = this.calculateDiff(previousVersionResult.data.content, data.content)
          diffData = diff
        }
      }

      // Create version with auto-generated fields
      const versionData = {
        ...data,
        version_number: nextVersion,
        diff_data: diffData,
        is_current: true,
        created_by: this.context?.userId || 'system',
        published_at: data.is_published ? new Date().toISOString() : null
      }

      // Mark previous versions as not current
      await this.client
        .from('content_versions')
        .update({ is_current: false })
        .eq('content_type', data.content_type)
        .eq('content_id', data.content_id)

      // Create the new version
      const result = await retryDatabaseOperation(async () => {
        return await this.client
          .from('content_versions')
          .insert(versionData)
          .select()
          .single()
      })

      if (result.error) {
        const error = handleDatabaseError(result.error, 'Creating content version')
        logger.error('Version creation failed', {
          contentType: data.content_type,
          contentId: data.content_id,
          error: error.message
        })
        return { data: null, error: error.message }
      }

      const createdVersion = this.transformFromDatabase(result.data)

      // Log audit trail
      if (this.requiresAudit && this.context) {
        await this.logAuditAction(
          AuditAction.CREATE,
          result.data.id,
          {
            versionCreated: {
              contentType: data.content_type,
              contentId: data.content_id,
              versionNumber: nextVersion,
              changeDescription: data.change_description
            }
          }
        )
      }

      logger.info('Version created successfully', {
        contentType: data.content_type,
        contentId: data.content_id,
        versionNumber: nextVersion,
        userId: this.context?.userId
      })

      return { data: createdVersion, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Create version operation failed', {
        contentType: data.content_type,
        contentId: data.content_id,
        error: errorMessage
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Get current version of content
   */
  public async getCurrentVersion(contentType: string, contentId: string): Promise<QueryResult<ContentVersion>> {
    try {
      this.validateAccess('read')

      const result = await this.client
        .from('content_versions')
        .select('*')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('is_current', true)
        .single()

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      return { data: this.transformFromDatabase(result.data), error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Get version history for content
   */
  public async getVersionHistory(
    contentType: string, 
    contentId: string,
    options: VersionListOptions = {}
  ): Promise<PaginatedResult<ContentVersion>> {
    try {
      this.validateAccess('read')

      const { from, to, page, limit } = buildPaginationParams(options)

      let query = this.client
        .from('content_versions')
        .select('*', { count: 'exact' })
        .eq('content_type', contentType)
        .eq('content_id', contentId)

      // Apply filters
      if (options.branchName) {
        query = query.eq('branch_name', options.branchName)
      }
      if (options.isPublished !== undefined) {
        query = query.eq('is_published', options.isPublished)
      }
      if (options.isDraft !== undefined) {
        query = query.eq('is_draft', options.isDraft)
      }
      if (!options.includeProtected) {
        query = query.eq('is_protected', false)
      }

      // Apply sorting and pagination
      query = query
        .order('version_number', { ascending: false })
        .range(from, to)

      const result = await query

      if (result.error) {
        logger.error('Get version history failed', {
          contentType,
          contentId,
          error: result.error.message
        })
        return {
          data: [],
          total: 0,
          page,
          limit,
          hasNext: false,
          hasPrev: false
        }
      }

      const versions = (result.data || []).map(item => this.transformFromDatabase(item))
      const total = result.count || 0

      return {
        data: versions,
        total,
        page,
        limit,
        hasNext: to < total - 1,
        hasPrev: page > 1
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get version history operation failed', {
        contentType,
        contentId,
        error: errorMessage
      })
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

  // ================================
  // Version Comparison and Diff
  // ================================

  /**
   * Compare two versions and generate diff
   */
  public async compareVersions(
    fromVersionId: string,
    toVersionId: string
  ): Promise<QueryResult<VersionDiff>> {
    try {
      this.validateAccess('read')

      // Check for cached comparison first
      const cachedResult = await this.getCachedComparison(fromVersionId, toVersionId)
      if (cachedResult.data) {
        return { data: cachedResult.data.diff_result as VersionDiff, error: null }
      }

      // Get both versions
      const [fromVersion, toVersion] = await Promise.all([
        this.getById(fromVersionId),
        this.getById(toVersionId)
      ])

      if (fromVersion.error || toVersion.error) {
        return { data: null, error: 'Failed to retrieve versions for comparison' }
      }

      if (!fromVersion.data || !toVersion.data) {
        return { data: null, error: 'One or both versions not found' }
      }

      // Calculate diff
      const diff = this.calculateDetailedDiff(
        fromVersion.data.content,
        toVersion.data.content,
        {
          fromVersion: fromVersion.data.version_number,
          toVersion: toVersion.data.version_number,
          contentType: fromVersion.data.content_type,
          comparedAt: new Date().toISOString(),
          comparedBy: this.context?.userId || 'system'
        }
      )

      // Cache the comparison result
      await this.cacheComparison({
        content_type: fromVersion.data.content_type,
        content_id: fromVersion.data.content_id,
        from_version_id: fromVersionId,
        to_version_id: toVersionId,
        diff_result: diff,
        diff_stats: diff.summary,
        created_by: this.context?.userId || 'system'
      })

      return { data: diff, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Compare versions operation failed', {
        fromVersionId,
        toVersionId,
        error: errorMessage
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Calculate basic diff between two content objects
   */
  private calculateDiff(oldContent: Record<string, any>, newContent: Record<string, any>): Record<string, any> {
    const changes: DiffItem[] = []
    const allKeys = new Set([...Object.keys(oldContent), ...Object.keys(newContent)])

    for (const key of allKeys) {
      const oldValue = oldContent[key]
      const newValue = newContent[key]

      if (oldValue === undefined && newValue !== undefined) {
        changes.push({
          type: DiffType.ADDED,
          path: key,
          newValue,
          description: `Added ${key}`
        })
      } else if (oldValue !== undefined && newValue === undefined) {
        changes.push({
          type: DiffType.REMOVED,
          path: key,
          oldValue,
          description: `Removed ${key}`
        })
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          type: DiffType.MODIFIED,
          path: key,
          oldValue,
          newValue,
          description: `Modified ${key}`
        })
      }
    }

    return {
      totalChanges: changes.length,
      changes,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Calculate detailed diff with comprehensive analysis
   */
  private calculateDetailedDiff(
    oldContent: Record<string, any>,
    newContent: Record<string, any>,
    metadata: any
  ): VersionDiff {
    const changes: DiffItem[] = []
    let additions = 0
    let modifications = 0
    let deletions = 0

    const processObject = (old: any, newObj: any, path: string = '') => {
      if (typeof old === 'object' && typeof newObj === 'object' && old !== null && newObj !== null) {
        const allKeys = new Set([...Object.keys(old), ...Object.keys(newObj)])
        
        for (const key of allKeys) {
          const currentPath = path ? `${path}.${key}` : key
          const oldValue = old[key]
          const newValue = newObj[key]

          if (oldValue === undefined && newValue !== undefined) {
            changes.push({
              type: DiffType.ADDED,
              path: currentPath,
              newValue,
              description: `Added field: ${currentPath}`
            })
            additions++
          } else if (oldValue !== undefined && newValue === undefined) {
            changes.push({
              type: DiffType.REMOVED,
              path: currentPath,
              oldValue,
              description: `Removed field: ${currentPath}`
            })
            deletions++
          } else if (typeof oldValue === 'object' && typeof newValue === 'object') {
            processObject(oldValue, newValue, currentPath)
          } else if (oldValue !== newValue) {
            changes.push({
              type: DiffType.MODIFIED,
              path: currentPath,
              oldValue,
              newValue,
              description: `Modified field: ${currentPath}`
            })
            modifications++
          }
        }
      } else if (old !== newObj) {
        changes.push({
          type: DiffType.MODIFIED,
          path,
          oldValue: old,
          newValue: newObj,
          description: `Modified: ${path || 'root'}`
        })
        modifications++
      }
    }

    processObject(oldContent, newContent)

    return {
      summary: {
        totalChanges: changes.length,
        additions,
        modifications,
        deletions,
        moved: 0 // TODO: Implement move detection
      },
      changes,
      metadata
    }
  }

  /**
   * Get cached comparison result
   */
  private async getCachedComparison(fromVersionId: string, toVersionId: string): Promise<QueryResult<VersionComparison>> {
    try {
      const result = await this.client
        .from('version_comparisons')
        .select('*')
        .eq('from_version_id', fromVersionId)
        .eq('to_version_id', toVersionId)
        .single()

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      return { data: result.data as VersionComparison, error: null }

    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Cache comparison result
   */
  private async cacheComparison(data: VersionComparisonCreate & { diff_result: any, diff_stats: any, created_by: string }): Promise<void> {
    try {
      await this.client
        .from('version_comparisons')
        .insert(data)
    } catch (error) {
      logger.warn('Failed to cache comparison result', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // ================================
  // Version Rollback
  // ================================

  /**
   * Rollback content to a specific version
   */
  public async rollbackToVersion(
    contentType: string,
    contentId: string,
    targetVersionId: string,
    reason?: string,
    confirmed: boolean = false
  ): Promise<QueryResult<ContentVersion>> {
    try {
      this.validateAccess('write')

      if (!confirmed) {
        return { data: null, error: 'Rollback confirmation required' }
      }

      // Get current and target versions
      const [currentVersion, targetVersion] = await Promise.all([
        this.getCurrentVersion(contentType, contentId),
        this.getById(targetVersionId)
      ])

      if (currentVersion.error || targetVersion.error) {
        return { data: null, error: 'Failed to retrieve versions for rollback' }
      }

      if (!currentVersion.data || !targetVersion.data) {
        return { data: null, error: 'Current or target version not found' }
      }

      // Create rollback record
      const rollbackData: VersionRollbackCreate = {
        content_type: contentType,
        content_id: contentId,
        to_version_id: targetVersionId,
        reason: reason || 'Content rollback',
        confirmation_required: false
      }

      const rollbackResult = await this.client
        .from('version_rollbacks')
        .insert({
          ...rollbackData,
          from_version_id: currentVersion.data.id,
          executed_by: this.context?.userId || 'system',
          confirmed_at: new Date().toISOString(),
          rollback_data: {
            fromVersion: currentVersion.data.version_number,
            toVersion: targetVersion.data.version_number,
            rolledBackContent: currentVersion.data.content
          }
        })
        .select()
        .single()

      if (rollbackResult.error) {
        return { data: null, error: 'Failed to create rollback record' }
      }

      // Create new version based on target version content
      const newVersionData: ContentVersionCreate = {
        content_type: contentType,
        content_id: contentId,
        title: `${targetVersion.data.title} (Rollback)`,
        content: targetVersion.data.content,
        change_description: `Rolled back to version ${targetVersion.data.version_number}${reason ? `: ${reason}` : ''}`,
        branch_name: targetVersion.data.branch_name,
        is_published: false, // Rollback creates draft by default
        is_protected: false
      }

      const newVersion = await this.createVersion(newVersionData)

      if (newVersion.error) {
        return { data: null, error: 'Failed to create rollback version' }
      }

      // Log audit trail
      if (this.requiresAudit && this.context) {
        await this.logAuditAction(
          AuditAction.UPDATE,
          contentId,
          {
            rollback: {
              fromVersion: currentVersion.data.version_number,
              toVersion: targetVersion.data.version_number,
              reason,
              rollbackId: rollbackResult.data.id
            }
          }
        )
      }

      logger.info('Content rolled back successfully', {
        contentType,
        contentId,
        fromVersion: currentVersion.data.version_number,
        toVersion: targetVersion.data.version_number,
        userId: this.context?.userId
      })

      return newVersion

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Rollback operation failed', {
        contentType,
        contentId,
        targetVersionId,
        error: errorMessage
      })
      return { data: null, error: errorMessage }
    }
  }

  // ================================
  // Version Annotations
  // ================================

  /**
   * Add annotation to a version
   */
  public async addAnnotation(data: VersionAnnotationCreate): Promise<QueryResult<VersionAnnotation>> {
    try {
      this.validateAccess('write', data)

      const validation = validateWithHealthcareContext(
        VersionAnnotationCreateSchema,
        data,
        { isHealthcareData: false, complianceLevel: 'basic', auditRequired: false, encryptionRequired: false }
      )

      if (!validation.success) {
        return {
          data: null,
          error: `Validation failed: ${validation.errors.join(', ')}`
        }
      }

      const annotationData = {
        ...validation.data,
        created_by: this.context?.userId || 'system',
        thread_depth: data.parent_annotation_id ? 1 : 0 // TODO: Calculate actual thread depth
      }

      const result = await this.client
        .from('version_annotations')
        .insert(annotationData)
        .select()
        .single()

      if (result.error) {
        const error = handleDatabaseError(result.error, 'Creating version annotation')
        return { data: null, error: error.message }
      }

      return { data: result.data as VersionAnnotation, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Get annotations for a version
   */
  public async getVersionAnnotations(versionId: string): Promise<QueryResult<VersionAnnotation[]>> {
    try {
      this.validateAccess('read')

      const result = await this.client
        .from('version_annotations')
        .select('*')
        .eq('version_id', versionId)
        .order('created_at', { ascending: true })

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      return { data: result.data as VersionAnnotation[], error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { data: null, error: errorMessage }
    }
  }

  // ================================
  // Retention and Cleanup
  // ================================

  /**
   * Run cleanup based on retention policies
   */
  public async runRetentionCleanup(): Promise<QueryResult<{ deletedCount: number }>> {
    try {
      this.validateAccess('write')

      const result = await this.client.rpc('cleanup_old_versions')

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      const deletedCount = result.data || 0

      logger.info('Version retention cleanup completed', {
        deletedCount,
        userId: this.context?.userId
      })

      return { data: { deletedCount }, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Retention cleanup failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Get retention policy for content type
   */
  public async getRetentionPolicy(contentType: string): Promise<QueryResult<VersionRetentionPolicy>> {
    try {
      this.validateAccess('read')

      const result = await this.client
        .from('version_retention_policies')
        .select('*')
        .eq('content_type', contentType)
        .eq('is_active', true)
        .single()

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      return { data: result.data as VersionRetentionPolicy, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { data: null, error: errorMessage }
    }
  }
}

/**
 * Factory function to create ContentVersionDAL instance
 */
export function createContentVersionDAL(client: SupabaseClient): ContentVersionDAL {
  return new ContentVersionDAL(client)
}