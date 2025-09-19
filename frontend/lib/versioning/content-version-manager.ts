/**
 * Content Versioning System
 * 
 * This module provides comprehensive content versioning capabilities including:
 * - Version tracking and history
 * - Rollback functionality
 * - Change comparison
 * - Version branching and merging
 * - Audit trail for content modifications
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface ContentVersion {
  id: string
  contentId: string
  contentType: 'blog_post' | 'page' | 'managed_content' | 'media'
  versionNumber: number
  title: string
  contentData: any // JSONB data containing the actual content
  metadata: Record<string, any>
  authorId: string
  authorName: string
  changeDescription: string
  changeType: 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'rollback'
  tags: string[]
  isPublished: boolean
  isDraft: boolean
  parentVersionId?: string
  branchName?: string
  createdAt: Date
  publishedAt?: Date
}

export interface VersionComparison {
  added: string[]
  removed: string[]
  modified: string[]
  unchanged: string[]
  diff: Array<{
    type: 'add' | 'remove' | 'modify'
    field: string
    oldValue?: any
    newValue?: any
  }>
}

export interface VersionBranch {
  id: string
  name: string
  description: string
  baseVersionId: string
  currentVersionId: string
  authorId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RollbackResult {
  success: boolean
  newVersionId: string
  rollbackVersionId: string
  changes: VersionComparison
  message: string
}

/**
 * Content Version Manager Class
 */
export class ContentVersionManager {
  private supabase: any

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase() {
    this.supabase = await createServerSupabaseClient()
  }

  /**
   * Create a new version of content
   */
  async createVersion(
    contentId: string,
    contentType: string,
    title: string,
    content: any,
    metadata: Record<string, any>,
    authorId: string,
    authorName: string,
    changeDescription: string,
    changeType: string,
    tags: string[] = [],
    parentVersionId?: string,
    branchName?: string
  ): Promise<ContentVersion> {
    try {
      // Get the next version number for this content
      const nextVersion = await this.getNextVersionNumber(contentId, contentType)

      // Prepare content data based on content type
      let contentData: any
      if (contentType === 'blog_post') {
        // For blog posts, content is a string, wrap it in JSON
        contentData = { content: content }
      } else if (contentType === 'managed_content' || contentType === 'page') {
        // For managed content, content is already JSONB
        contentData = content
      } else {
        // For other types, wrap in generic structure
        contentData = { data: content }
      }

      // Create the version record
      const { data: version, error } = await this.supabase
        .from('content_versions')
        .insert({
          content_id: contentId,
          content_type: contentType,
          version_number: nextVersion,
          title,
          content_data: contentData,
          metadata,
          author_id: authorId,
          author_name: authorName,
          change_description: changeDescription,
          change_type: changeType,
          tags,
          is_published: false,
          is_draft: true,
          parent_version_id: parentVersionId,
          branch_name: branchName,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Update the content table with the new version reference
      await this.updateContentVersionReference(contentId, contentType, version.id)

      return this.mapVersionFromDatabase(version)

    } catch (error) {
      console.error('Error creating version:', error)
      throw new Error('Failed to create content version')
    }
  }

  /**
   * Get the next version number for content
   */
  private async getNextVersionNumber(contentId: string, contentType: string): Promise<number> {
    const { data: versions, error } = await this.supabase
      .from('content_versions')
      .select('version_number')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .order('version_number', { ascending: false })
      .limit(1)

    if (error) throw error

    if (!versions || versions.length === 0) {
      return 1
    }

    return versions[0].version_number + 1
  }

  /**
   * Update content table with version reference
   */
  private async updateContentVersionReference(contentId: string, contentType: string, versionId: string): Promise<void> {
    try {
      let tableName: string
      let idField: string

      switch (contentType) {
        case 'blog_post':
          tableName = 'blog_posts'
          idField = 'id'
          break
        case 'managed_content':
          tableName = 'managed_content'
          idField = 'id'
          break
        case 'page':
          tableName = 'managed_content'
          idField = 'id'
          break
        case 'media':
          tableName = 'media_library'
          idField = 'id'
          break
        default:
          throw new Error(`Unsupported content type: ${contentType}`)
      }

      await this.supabase
        .from(tableName)
        .update({ 
          current_version_id: versionId,
          updated_at: new Date().toISOString()
        })
        .eq(idField, contentId)

    } catch (error) {
      console.error('Error updating content version reference:', error)
    }
  }

  /**
   * Get version history for content
   */
  async getVersionHistory(
    contentId: string,
    contentType: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ContentVersion[]> {
    try {
      const { data: versions, error } = await this.supabase
        .from('content_versions')
        .select('*')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .order('version_number', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return (versions || []).map((version: any) => this.mapVersionFromDatabase(version))

    } catch (error) {
      console.error('Error getting version history:', error)
      return []
    }
  }

  /**
   * Get a specific version by ID
   */
  async getVersion(versionId: string): Promise<ContentVersion | null> {
    try {
      const { data: version, error } = await this.supabase
        .from('content_versions')
        .select('*')
        .eq('id', versionId)
        .single()

      if (error) throw error

      return this.mapVersionFromDatabase(version)

    } catch (error) {
      console.error('Error getting version:', error)
      return null
    }
  }

  /**
   * Get the current published version of content
   */
  async getCurrentPublishedVersion(contentId: string, contentType: string): Promise<ContentVersion | null> {
    try {
      const { data: version, error } = await this.supabase
        .from('content_versions')
        .select('*')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .eq('is_published', true)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error

      return this.mapVersionFromDatabase(version)

    } catch (error) {
      console.error('Error getting current published version:', error)
      return null
    }
  }

  /**
   * Publish a specific version
   */
  async publishVersion(versionId: string, authorId: string): Promise<boolean> {
    try {
      // Unpublish all other versions of the same content
      const version = await this.getVersion(versionId)
      if (!version) return false

      await this.supabase
        .from('content_versions')
        .update({ 
          is_published: false,
          updated_at: new Date().toISOString()
        })
        .eq('content_id', version.contentId)
        .eq('content_type', version.contentType)

      // Publish the specified version
      const { error } = await this.supabase
        .from('content_versions')
        .update({ 
          is_published: true,
          is_draft: false,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', versionId)

      if (error) throw error

      // Update the content table
      await this.updateContentVersionReference(version.contentId, version.contentType, versionId)

      return true

    } catch (error) {
      console.error('Error publishing version:', error)
      return false
    }
  }

  /**
   * Unpublish a version
   */
  async unpublishVersion(versionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('content_versions')
        .update({ 
          is_published: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', versionId)

      if (error) throw error

      return true

    } catch (error) {
      console.error('Error unpublishing version:', error)
      return false
    }
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(
    contentId: string,
    contentType: string,
    targetVersionId: string,
    authorId: string,
    authorName: string,
    rollbackReason: string
  ): Promise<RollbackResult> {
    try {
      const targetVersion = await this.getVersion(targetVersionId)
      if (!targetVersion) {
        return {
          success: false,
          newVersionId: '',
          rollbackVersionId: targetVersionId,
          changes: { added: [], removed: [], modified: [], unchanged: [], diff: [] },
          message: 'Target version not found'
        }
      }

      // Get current version for comparison
      const currentVersion = await this.getCurrentPublishedVersion(contentId, contentType)
      
      // Extract the actual content from contentData based on type
      let contentToRestore: any
      if (contentType === 'blog_post') {
        contentToRestore = targetVersion.contentData.content // Extract string from JSON
      } else {
        contentToRestore = targetVersion.contentData // Use JSONB directly
      }

      // Create a new version based on the target version
      const newVersion = await this.createVersion(
        contentId,
        contentType,
        targetVersion.title,
        contentToRestore,
        targetVersion.metadata,
        authorId,
        authorName,
        `Rollback to version ${targetVersion.versionNumber}: ${rollbackReason}`,
        'rollback',
        targetVersion.tags,
        targetVersionId,
        'rollback'
      )

      // Publish the new version
      await this.publishVersion(newVersion.id, authorId)

      // Generate change comparison
      const changes = currentVersion 
        ? await this.compareVersions(currentVersion.id, targetVersionId)
        : { added: [], removed: [], modified: [], unchanged: [], diff: [] }

      return {
        success: true,
        newVersionId: newVersion.id,
        rollbackVersionId: targetVersionId,
        changes,
        message: `Successfully rolled back to version ${targetVersion.versionNumber}`
      }

    } catch (error) {
      console.error('Error rolling back version:', error)
      return {
        success: false,
        newVersionId: '',
        rollbackVersionId: targetVersionId,
        changes: { added: [], removed: [], modified: [], unchanged: [], diff: [] },
        message: `Rollback failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(version1Id: string, version2Id: string): Promise<VersionComparison> {
    try {
      const version1 = await this.getVersion(version1Id)
      const version2 = await this.getVersion(version2Id)

      if (!version1 || !version2) {
        throw new Error('One or both versions not found')
      }

      const comparison: VersionComparison = {
        added: [],
        removed: [],
        modified: [],
        unchanged: [],
        diff: []
      }

      // Compare basic fields
      const fieldsToCompare = ['title', 'contentData', 'metadata', 'tags']
      
      fieldsToCompare.forEach(field => {
        const value1 = version1[field as keyof ContentVersion]
        const value2 = version2[field as keyof ContentVersion]

        if (JSON.stringify(value1) !== JSON.stringify(value2)) {
          comparison.modified.push(field)
          comparison.diff.push({
            type: 'modify',
            field,
            oldValue: value1,
            newValue: value2
          })
        } else {
          comparison.unchanged.push(field)
        }
      })

      return comparison

    } catch (error) {
      console.error('Error comparing versions:', error)
      return { added: [], removed: [], modified: [], unchanged: [], diff: [] }
    }
  }

  /**
   * Create a new branch from a version
   */
  async createBranch(
    name: string,
    description: string,
    baseVersionId: string,
    authorId: string
  ): Promise<VersionBranch | null> {
    try {
      const { data: branch, error } = await this.supabase
        .from('version_branches')
        .insert({
          name,
          description,
          base_version_id: baseVersionId,
          current_version_id: baseVersionId,
          author_id: authorId,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: branch.id,
        name: branch.name,
        description: branch.description,
        baseVersionId: branch.base_version_id,
        currentVersionId: branch.current_version_id,
        authorId: branch.author_id,
        isActive: branch.is_active,
        createdAt: new Date(branch.created_at),
        updatedAt: new Date(branch.updated_at)
      }

    } catch (error) {
      console.error('Error creating branch:', error)
      return null
    }
  }

  /**
   * Get all branches for content
   */
  async getBranches(contentId: string): Promise<VersionBranch[]> {
    try {
      const { data: branches, error } = await this.supabase
        .from('version_branches')
        .select('*')
        .eq('content_id', contentId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (branches || []).map((branch: any) => ({
        id: branch.id,
        name: branch.name,
        description: branch.description,
        baseVersionId: branch.base_version_id,
        currentVersionId: branch.current_version_id,
        authorId: branch.author_id,
        isActive: branch.is_active,
        createdAt: new Date(branch.created_at),
        updatedAt: new Date(branch.updated_at)
      }))

    } catch (error) {
      console.error('Error getting branches:', error)
      return []
    }
  }

  /**
   * Merge a branch into the main version
   */
  async mergeBranch(
    branchId: string,
    authorId: string,
    authorName: string,
    mergeDescription: string
  ): Promise<boolean> {
    try {
      const branch = await this.getBranch(branchId)
      if (!branch) return false

      // Get the branch's current version
      const branchVersion = await this.getVersion(branch.currentVersionId)
      if (!branchVersion) return false

      // Extract the actual content from contentData based on type
      let contentToMerge: any
      if (branchVersion.contentType === 'blog_post') {
        contentToMerge = branchVersion.contentData.content // Extract string from JSON
      } else {
        contentToMerge = branchVersion.contentData // Use JSONB directly
      }

      // Create a new version from the branch
      await this.createVersion(
        branchVersion.contentId,
        branchVersion.contentType,
        branchVersion.title,
        contentToMerge,
        branchVersion.metadata,
        authorId,
        authorName,
        `Merge from branch '${branch.name}': ${mergeDescription}`,
        'update',
        branchVersion.tags,
        branchVersion.id,
        'merge'
      )

      // Deactivate the branch
      await this.supabase
        .from('version_branches')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', branchId)

      return true

    } catch (error) {
      console.error('Error merging branch:', error)
      return false
    }
  }

  /**
   * Get a branch by ID
   */
  private async getBranch(branchId: string): Promise<VersionBranch | null> {
    try {
      const { data: branch, error } = await this.supabase
        .from('version_branches')
        .select('*')
        .eq('id', branchId)
        .single()

      if (error) throw error

      return {
        id: branch.id,
        name: branch.name,
        description: branch.description,
        baseVersionId: branch.base_version_id,
        currentVersionId: branch.current_version_id,
        authorId: branch.author_id,
        isActive: branch.is_active,
        createdAt: new Date(branch.created_at),
        updatedAt: new Date(branch.updated_at)
      }

    } catch (error) {
      console.error('Error getting branch:', error)
      return null
    }
  }

  /**
   * Delete a version (soft delete)
   */
  async deleteVersion(versionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('content_versions')
        .update({ 
          is_draft: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', versionId)

      if (error) throw error

      return true

    } catch (error) {
      console.error('Error deleting version:', error)
      return false
    }
  }

  /**
   * Get version statistics
   */
  async getVersionStats(contentId: string, contentType: string): Promise<{
    totalVersions: number
    publishedVersions: number
    draftVersions: number
    lastModified: Date | null
    averageVersionsPerDay: number
  }> {
    try {
      const { data: versions, error } = await this.supabase
        .from('content_versions')
        .select('created_at, is_published, is_draft')
        .eq('content_id', contentId)
        .eq('content_type', contentType)

      if (error) throw error

      const totalVersions = versions?.length || 0
      const publishedVersions = versions?.filter((v: any) => v.is_published).length || 0
      const draftVersions = versions?.filter((v: any) => v.is_draft).length || 0

      const lastModified = versions && versions.length > 0
        ? new Date(Math.max(...versions.map((v: any) => new Date(v.created_at).getTime())))
        : null

      // Calculate average versions per day
      let averageVersionsPerDay = 0
      if (versions && versions.length > 1) {
        const firstVersion = new Date(Math.min(...versions.map((v: any) => new Date(v.created_at).getTime())))
        const lastVersion = new Date(Math.max(...versions.map((v: any) => new Date(v.created_at).getTime())))
        const daysDiff = (lastVersion.getTime() - firstVersion.getTime()) / (1000 * 60 * 60 * 24)
        averageVersionsPerDay = daysDiff > 0 ? totalVersions / daysDiff : 0
      }

      return {
        totalVersions,
        publishedVersions,
        draftVersions,
        lastModified,
        averageVersionsPerDay: Math.round(averageVersionsPerDay * 100) / 100
      }

    } catch (error) {
      console.error('Error getting version stats:', error)
      return {
        totalVersions: 0,
        publishedVersions: 0,
        draftVersions: 0,
        lastModified: null,
        averageVersionsPerDay: 0
      }
    }
  }

  /**
   * Map database record to ContentVersion interface
   */
  private mapVersionFromDatabase(dbVersion: any): ContentVersion {
    return {
      id: dbVersion.id,
      contentId: dbVersion.content_id,
      contentType: dbVersion.content_type,
      versionNumber: dbVersion.version_number,
      title: dbVersion.title,
      contentData: dbVersion.content_data || {},
      metadata: dbVersion.metadata || {},
      authorId: dbVersion.author_id,
      authorName: dbVersion.author_name,
      changeDescription: dbVersion.change_description,
      changeType: dbVersion.change_type,
      tags: dbVersion.tags || [],
      isPublished: dbVersion.is_published,
      isDraft: dbVersion.is_draft,
      parentVersionId: dbVersion.parent_version_id,
      branchName: dbVersion.branch_name,
      createdAt: new Date(dbVersion.created_at),
      publishedAt: dbVersion.published_at ? new Date(dbVersion.published_at) : undefined
    }
  }
}

// Export singleton instance
export const contentVersionManager = new ContentVersionManager()
