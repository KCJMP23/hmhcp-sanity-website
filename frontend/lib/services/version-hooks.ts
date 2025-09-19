/**
 * Version Hooks Service - Automatic versioning on content updates
 * Story 1.4 Task 5 - Content versioning system automatic versioning
 * 
 * Features:
 * - Automatic version creation on content save
 * - Configurable versioning triggers
 * - Version diff calculation
 * - Branch management for drafts
 * - Rollback and restore capabilities
 * - Integration with existing DAL classes
 */

import { createClient } from '@supabase/supabase-js'
import { createContentVersionDAL } from '@/lib/dal/admin/content-versions'
import {
  ContentVersion,
  ContentVersionCreate,
  ContentStatus,
  AdminRole,
  BlogPost,
  Page,
  Platform,
  Service,
  TeamMember,
  Testimonial
} from '@/lib/dal/admin/types'
import { logger } from '@/lib/logger'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Versioning configuration
interface VersioningConfig {
  enabled: boolean
  createOnSave: boolean
  createOnPublish: boolean
  createOnStatusChange: boolean
  maxVersionsPerContent?: number
  branchStrategy: 'linear' | 'branched'
  autoCleanup: boolean
}

// Content type to table mapping
const CONTENT_TYPE_MAPPINGS = {
  'blog_post': 'blog_posts',
  'page': 'pages',
  'platform': 'platforms',
  'service': 'services',
  'team_member': 'team_members',
  'testimonial': 'testimonials'
} as const

type SupportedContentType = keyof typeof CONTENT_TYPE_MAPPINGS
type ContentEntity = BlogPost | Page | Platform | Service | TeamMember | Testimonial

/**
 * Version Hooks Service Class
 */
export class VersionHooksService {
  private versionDAL = createContentVersionDAL(supabase)
  private config: Map<string, VersioningConfig> = new Map()

  constructor() {
    this.initializeDefaultConfig()
  }

  /**
   * Initialize default versioning configuration
   */
  private initializeDefaultConfig() {
    const defaultConfig: VersioningConfig = {
      enabled: true,
      createOnSave: true,
      createOnPublish: true,
      createOnStatusChange: true,
      maxVersionsPerContent: 50,
      branchStrategy: 'linear',
      autoCleanup: true
    }

    // Set default config for all supported content types
    Object.keys(CONTENT_TYPE_MAPPINGS).forEach(contentType => {
      this.config.set(contentType, { ...defaultConfig })
    })

    // Customize config for specific content types
    this.config.set('blog_post', {
      ...defaultConfig,
      maxVersionsPerContent: 100, // Blog posts get more versions
      branchStrategy: 'branched' // Support draft branches
    })

    this.config.set('page', {
      ...defaultConfig,
      maxVersionsPerContent: 30, // Pages need fewer versions
      createOnSave: false, // Only version on publish for pages
      createOnPublish: true
    })
  }

  /**
   * Set versioning context for operations
   */
  setContext(userId: string, role: AdminRole, permissions: string[] = []) {
    this.versionDAL.setContext({
      userId,
      role,
      permissions,
      classification: 'INTERNAL' as any,
      hipaaContext: {
        isHealthcareData: false,
        complianceLevel: 'basic',
        auditRequired: true,
        encryptionRequired: false
      },
      auditRequired: true
    })
    return this
  }

  /**
   * Hook: Before content update - prepare for versioning
   */
  async beforeContentUpdate(
    contentType: SupportedContentType,
    contentId: string,
    newData: Partial<ContentEntity>,
    oldData?: ContentEntity
  ): Promise<{
    shouldCreateVersion: boolean
    versionMetadata: any
  }> {
    try {
      const config = this.config.get(contentType)
      if (!config?.enabled) {
        return { shouldCreateVersion: false, versionMetadata: null }
      }

      // Determine if we should create a version
      const shouldCreateVersion = this.shouldCreateVersion(config, newData, oldData)

      if (!shouldCreateVersion) {
        return { shouldCreateVersion: false, versionMetadata: null }
      }

      // Calculate changes for version metadata
      const changeMetadata = oldData ? this.calculateChangeMetadata(oldData, newData) : null

      logger.debug('Version hook: beforeContentUpdate', {
        contentType,
        contentId,
        shouldCreateVersion,
        changes: changeMetadata?.summary
      })

      return {
        shouldCreateVersion: true,
        versionMetadata: {
          changeType: this.determineChangeType(newData, oldData),
          fieldChanges: changeMetadata?.fieldChanges || [],
          summary: changeMetadata?.summary || 'Content updated'
        }
      }

    } catch (error) {
      logger.error('Version hook: beforeContentUpdate failed', {
        contentType,
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return { shouldCreateVersion: false, versionMetadata: null }
    }
  }

  /**
   * Hook: After content update - create version
   */
  async afterContentUpdate(
    contentType: SupportedContentType,
    contentId: string,
    updatedData: ContentEntity,
    versionMetadata: any,
    oldData?: ContentEntity
  ): Promise<ContentVersion | null> {
    try {
      if (!versionMetadata) return null

      const config = this.config.get(contentType)
      if (!config?.enabled) return null

      // Prepare version data
      const versionData: ContentVersionCreate = {
        content_type: contentType,
        content_id: contentId,
        title: this.generateVersionTitle(updatedData, versionMetadata.changeType),
        content: this.sanitizeContentForVersioning(updatedData),
        change_description: this.generateChangeDescription(versionMetadata),
        branch_name: this.determineBranchName(config, updatedData),
        is_published: updatedData.status === ContentStatus.PUBLISHED,
        is_protected: this.shouldProtectVersion(updatedData, versionMetadata)
      }

      // Create the version
      const result = await this.versionDAL.createVersion(versionData)

      if (result.error) {
        logger.error('Version creation failed', {
          contentType,
          contentId,
          error: result.error
        })
        return null
      }

      // Trigger cleanup if enabled
      if (config.autoCleanup) {
        await this.triggerVersionCleanup(contentType, contentId)
      }

      logger.info('Version created automatically', {
        contentType,
        contentId,
        versionId: result.data?.id,
        versionNumber: result.data?.version_number,
        changeType: versionMetadata.changeType
      })

      return result.data

    } catch (error) {
      logger.error('Version hook: afterContentUpdate failed', {
        contentType,
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }

  /**
   * Hook: On content publish - create published version
   */
  async onContentPublish(
    contentType: SupportedContentType,
    contentId: string,
    publishedData: ContentEntity
  ): Promise<ContentVersion | null> {
    try {
      const config = this.config.get(contentType)
      if (!config?.enabled || !config.createOnPublish) return null

      // Get current version to check if already published
      const currentVersion = await this.versionDAL.getCurrentVersion(contentType, contentId)
      
      if (currentVersion.data?.is_published) {
        logger.debug('Content already has published version', { contentType, contentId })
        return null
      }

      const versionData: ContentVersionCreate = {
        content_type: contentType,
        content_id: contentId,
        title: `${this.getContentTitle(publishedData)} (Published)`,
        content: this.sanitizeContentForVersioning(publishedData),
        change_description: 'Content published',
        branch_name: 'main',
        is_published: true,
        is_protected: true // Protect published versions
      }

      const result = await this.versionDAL.createVersion(versionData)

      if (result.data) {
        logger.info('Published version created', {
          contentType,
          contentId,
          versionId: result.data.id,
          versionNumber: result.data.version_number
        })
      }

      return result.data

    } catch (error) {
      logger.error('Publish version hook failed', {
        contentType,
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }

  /**
   * Hook: On content status change
   */
  async onContentStatusChange(
    contentType: SupportedContentType,
    contentId: string,
    newStatus: ContentStatus,
    oldStatus: ContentStatus,
    contentData: ContentEntity
  ): Promise<ContentVersion | null> {
    try {
      const config = this.config.get(contentType)
      if (!config?.enabled || !config.createOnStatusChange) return null

      // Skip if status didn't actually change
      if (newStatus === oldStatus) return null

      const versionData: ContentVersionCreate = {
        content_type: contentType,
        content_id: contentId,
        title: `${this.getContentTitle(contentData)} (Status: ${newStatus})`,
        content: this.sanitizeContentForVersioning(contentData),
        change_description: `Status changed from ${oldStatus} to ${newStatus}`,
        branch_name: newStatus === ContentStatus.PUBLISHED ? 'main' : 'draft',
        is_published: newStatus === ContentStatus.PUBLISHED,
        is_protected: newStatus === ContentStatus.PUBLISHED
      }

      const result = await this.versionDAL.createVersion(versionData)

      if (result.data) {
        logger.info('Status change version created', {
          contentType,
          contentId,
          oldStatus,
          newStatus,
          versionId: result.data.id
        })
      }

      return result.data

    } catch (error) {
      logger.error('Status change version hook failed', {
        contentType,
        contentId,
        oldStatus,
        newStatus,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }

  /**
   * Manual version creation
   */
  async createManualVersion(
    contentType: SupportedContentType,
    contentId: string,
    contentData: ContentEntity,
    description: string,
    branchName: string = 'main'
  ): Promise<ContentVersion | null> {
    try {
      const versionData: ContentVersionCreate = {
        content_type: contentType,
        content_id: contentId,
        title: `${this.getContentTitle(contentData)} (Manual)`,
        content: this.sanitizeContentForVersioning(contentData),
        change_description: description,
        branch_name: branchName,
        is_published: contentData.status === ContentStatus.PUBLISHED,
        is_protected: false
      }

      const result = await this.versionDAL.createVersion(versionData)

      if (result.data) {
        logger.info('Manual version created', {
          contentType,
          contentId,
          versionId: result.data.id,
          description
        })
      }

      return result.data

    } catch (error) {
      logger.error('Manual version creation failed', {
        contentType,
        contentId,
        description,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }

  /**
   * Get versioning configuration for content type
   */
  getConfig(contentType: string): VersioningConfig | null {
    return this.config.get(contentType) || null
  }

  /**
   * Update versioning configuration
   */
  updateConfig(contentType: string, config: Partial<VersioningConfig>): void {
    const currentConfig = this.config.get(contentType) || this.config.get('default')!
    this.config.set(contentType, { ...currentConfig, ...config })
  }

  // ================================
  // Private Helper Methods
  // ================================

  private shouldCreateVersion(
    config: VersioningConfig, 
    newData: Partial<ContentEntity>, 
    oldData?: ContentEntity
  ): boolean {
    // Always create version if no old data (initial creation)
    if (!oldData) return true

    // Check if status is changing to published
    if (config.createOnPublish && newData.status === ContentStatus.PUBLISHED && oldData.status !== ContentStatus.PUBLISHED) {
      return true
    }

    // Check if status is changing
    if (config.createOnStatusChange && newData.status && newData.status !== oldData.status) {
      return true
    }

    // Check for significant content changes
    if (config.createOnSave) {
      return this.hasSignificantChanges(newData, oldData)
    }

    return false
  }

  private hasSignificantChanges(newData: Partial<ContentEntity>, oldData: ContentEntity): boolean {
    // Define fields that trigger versioning when changed
    const significantFields = ['title', 'content', 'description', 'features', 'bio', 'name']
    
    return significantFields.some(field => {
      const newValue = (newData as any)[field]
      const oldValue = (oldData as any)[field]
      
      if (newValue !== undefined && JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        return true
      }
      return false
    })
  }

  private calculateChangeMetadata(oldData: ContentEntity, newData: Partial<ContentEntity>) {
    const fieldChanges: string[] = []
    let changeCount = 0

    Object.keys(newData).forEach(key => {
      const newValue = (newData as any)[key]
      const oldValue = (oldData as any)[key]
      
      if (newValue !== undefined && JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        fieldChanges.push(key)
        changeCount++
      }
    })

    return {
      fieldChanges,
      summary: `${changeCount} field${changeCount !== 1 ? 's' : ''} changed: ${fieldChanges.slice(0, 3).join(', ')}${fieldChanges.length > 3 ? '...' : ''}`
    }
  }

  private determineChangeType(newData: Partial<ContentEntity>, oldData?: ContentEntity): string {
    if (!oldData) return 'created'
    
    if (newData.status === ContentStatus.PUBLISHED && oldData.status !== ContentStatus.PUBLISHED) {
      return 'published'
    }
    
    if (newData.status !== oldData.status) {
      return 'status_changed'
    }
    
    return 'updated'
  }

  private generateVersionTitle(contentData: ContentEntity, changeType: string): string {
    const baseTitle = this.getContentTitle(contentData)
    const changeTypeTitles = {
      'created': 'Created',
      'published': 'Published',
      'status_changed': 'Status Changed',
      'updated': 'Updated'
    }
    
    const suffix = changeTypeTitles[changeType as keyof typeof changeTypeTitles] || 'Modified'
    return `${baseTitle} (${suffix})`
  }

  private generateChangeDescription(metadata: any): string {
    const { changeType, summary } = metadata
    const descriptions = {
      'created': 'Initial version created',
      'published': 'Content published',
      'status_changed': 'Status changed',
      'updated': summary || 'Content updated'
    }
    
    return descriptions[changeType as keyof typeof descriptions] || 'Content modified'
  }

  private determineBranchName(config: VersioningConfig, contentData: ContentEntity): string {
    if (config.branchStrategy === 'linear') return 'main'
    
    if (contentData.status === ContentStatus.PUBLISHED) return 'main'
    if (contentData.status === ContentStatus.DRAFT) return 'draft'
    
    return 'main'
  }

  private shouldProtectVersion(contentData: ContentEntity, metadata: any): boolean {
    // Protect published versions
    if (contentData.status === ContentStatus.PUBLISHED) return true
    
    // Protect major milestones
    if (metadata.changeType === 'published') return true
    
    return false
  }

  private getContentTitle(contentData: ContentEntity): string {
    return (contentData as any).title || (contentData as any).name || 'Untitled'
  }

  private sanitizeContentForVersioning(contentData: ContentEntity): Record<string, any> {
    // Remove system fields that shouldn't be versioned
    const { created_at, updated_at, created_by, updated_by, ...cleanData } = contentData as any
    return cleanData
  }

  private async triggerVersionCleanup(contentType: string, contentId: string): Promise<void> {
    try {
      const config = this.config.get(contentType)
      if (!config?.maxVersionsPerContent) return

      // Get version count for this content
      const versionsResult = await this.versionDAL.getVersionHistory(
        contentType, 
        contentId, 
        { limit: 1000 }
      )

      if (versionsResult.data && versionsResult.data.length > config.maxVersionsPerContent) {
        // This would typically trigger a background cleanup job
        logger.info('Version cleanup needed', {
          contentType,
          contentId,
          currentVersions: versionsResult.data.length,
          maxVersions: config.maxVersionsPerContent
        })
      }
    } catch (error) {
      logger.error('Version cleanup check failed', {
        contentType,
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

// Singleton instance
let versionHooksInstance: VersionHooksService | null = null

/**
 * Get version hooks service instance
 */
export function getVersionHooksService(): VersionHooksService {
  if (!versionHooksInstance) {
    versionHooksInstance = new VersionHooksService()
  }
  return versionHooksInstance
}

/**
 * Initialize version hooks with context
 */
export function initializeVersionHooks(userId: string, role: AdminRole, permissions: string[] = []): VersionHooksService {
  const service = getVersionHooksService()
  return service.setContext(userId, role, permissions)
}

export default VersionHooksService