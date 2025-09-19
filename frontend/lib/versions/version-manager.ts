/**
 * Publication Version Manager
 * 
 * Core version management logic for healthcare publications with HIPAA-compliant
 * tracking, audit logging, and comprehensive version control capabilities.
 * 
 * Features:
 * - Semantic versioning (major.minor.patch)
 * - Version snapshots with compression
 * - Change tracking and diff generation
 * - Rollback capabilities
 * - HIPAA-compliant audit logging
 * - Performance optimization
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { createHash } from 'crypto'
import { gzip, gunzip } from 'zlib'
import { promisify } from 'util'
import logger from '@/lib/logging/winston-logger'

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)

// ================================================================
// INTERFACES AND TYPES
// ================================================================

export interface PublicationVersion {
  id: string
  publicationId: string
  versionNumber: string
  versionType: 'major' | 'minor' | 'patch' | 'editorial'
  snapshotData: any
  createdBy: string
  createdAt: string
  changeSummary?: string
  changeReason?: string
  contentHash: string
  approvedBy?: string
  approvedAt?: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  dataSizeBytes?: number
  compressionRatio?: number
}

export interface PublicationChange {
  id: string
  publicationId: string
  versionFrom?: string
  versionTo: string
  fieldName: string
  changeType: 'create' | 'update' | 'delete' | 'reorder'
  oldValue?: any
  newValue?: any
  changedBy: string
  changedAt: string
  changeCategory?: string
  impactLevel: 'critical' | 'major' | 'minor' | 'trivial'
  diffData?: any
  characterDelta?: number
  isValidated?: boolean
  validationNotes?: string
}

export interface PublicationSnapshot {
  id: string
  publicationId: string
  snapshotType: 'auto' | 'manual' | 'rollback' | 'backup' | 'milestone'
  compressedData?: Buffer
  uncompressedSize?: number
  compressionRatio?: number
  createdBy: string
  createdAt: string
  snapshotName?: string
  description?: string
  versionAtSnapshot?: string
  tags?: string[]
  checksum: string
  isVerified?: boolean
  verificationDate?: string
  expiresAt?: string
  isProtected?: boolean
}

export interface VersionStats {
  id: string
  publicationId: string
  versionNumber: string
  totalCharacters: number
  totalWords: number
  totalParagraphs: number
  charactersAdded: number
  charactersRemoved: number
  wordsAdded: number
  wordsRemoved: number
  contributorsCount: number
  totalChanges: number
  majorChanges: number
  minorChanges: number
  readabilityScore?: number
  complexityScore?: number
  processingTimeMs?: number
  storageSizeBytes?: number
  calculatedAt: string
  updatedAt: string
}

// ================================================================
// VALIDATION SCHEMAS
// ================================================================

export const createVersionSchema = z.object({
  publicationId: z.string().uuid('Invalid publication ID'),
  versionType: z.enum(['major', 'minor', 'patch', 'editorial']).default('minor'),
  changeSummary: z.string().max(500).optional(),
  changeReason: z.string().max(1000).optional(),
  revisionNotes: z.string().max(2000).optional(),
  createSnapshot: z.boolean().default(true),
  approvalRequired: z.boolean().default(false)
})

export const compareVersionsSchema = z.object({
  publicationId: z.string().uuid('Invalid publication ID'),
  versionFrom: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format'),
  versionTo: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format'),
  includeContent: z.boolean().default(true),
  includeMetadata: z.boolean().default(true),
  diffFormat: z.enum(['unified', 'split', 'json-patch']).default('unified')
})

export const rollbackVersionSchema = z.object({
  publicationId: z.string().uuid('Invalid publication ID'),
  targetVersion: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format'),
  reason: z.string().min(10, 'Rollback reason is required').max(1000),
  createBackup: z.boolean().default(true),
  preserveMetadata: z.boolean().default(true)
})

// ================================================================
// VERSION MANAGER CLASS
// ================================================================

export class PublicationVersionManager {
  private supabase: any
  private logger: any
  
  constructor() {
    this.logger = logger?.child ? logger.child({ service: 'PublicationVersionManager' }) : console
  }

  private async getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = await createServerSupabaseClient()
    }
    return this.supabase
  }

  /**
   * Generate content hash for data integrity
   */
  private generateContentHash(data: any): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data, Object.keys(data).sort())
    return createHash('sha256').update(content, 'utf8').digest('hex')
  }

  /**
   * Increment version number based on type
   */
  private incrementVersion(currentVersion: string, versionType: string): string {
    const parts = currentVersion.split('.').map(Number)
    const [major, minor, patch] = parts

    switch (versionType) {
      case 'major':
        return `${major + 1}.0.0`
      case 'minor':
        return `${major}.${minor + 1}.0`
      case 'patch':
      case 'editorial':
        return `${major}.${minor}.${patch + 1}`
      default:
        throw new Error(`Invalid version type: ${versionType}`)
    }
  }

  /**
   * Compress data for efficient storage
   */
  private async compressData(data: any): Promise<{ 
    compressed: Buffer, 
    originalSize: number, 
    compressionRatio: number 
  }> {
    const jsonString = JSON.stringify(data)
    const originalSize = Buffer.byteLength(jsonString, 'utf8')
    const compressed = await gzipAsync(Buffer.from(jsonString, 'utf8'))
    const compressionRatio = Number((compressed.length / originalSize).toFixed(2))
    
    return { compressed, originalSize, compressionRatio }
  }

  /**
   * Decompress data
   */
  private async decompressData(compressedData: Buffer): Promise<any> {
    const decompressed = await gunzipAsync(compressedData)
    return JSON.parse(decompressed.toString('utf8'))
  }

  /**
   * Get the current version of a publication
   */
  async getCurrentVersion(publicationId: string): Promise<string> {
    const supabase = await this.getSupabaseClient()
    
    const { data, error } = await supabase
      .from('publications')
      .select('version_number')
      .eq('id', publicationId)
      .single()

    if (error || !data) {
      throw new Error(`Failed to get current version: ${error?.message || 'Publication not found'}`)
    }

    return data.version_number || '1.0.0'
  }

  /**
   * Create a new version of a publication
   */
  async createVersion(params: z.infer<typeof createVersionSchema>, userId: string): Promise<{
    success: boolean
    version?: PublicationVersion
    error?: string
  }> {
    const startTime = Date.now()
    
    try {
      const validatedParams = createVersionSchema.parse(params)
      const supabase = await this.getSupabaseClient()

      this.logger.info('Creating new publication version', {
        publicationId: validatedParams.publicationId,
        versionType: validatedParams.versionType,
        userId
      })

      // Get current publication data
      const { data: currentPub, error: pubError } = await supabase
        .from('publications')
        .select('*')
        .eq('id', validatedParams.publicationId)
        .single()

      if (pubError || !currentPub) {
        return { success: false, error: 'Publication not found' }
      }

      // Get current version and increment it
      const currentVersion = currentPub.version_number || '1.0.0'
      const newVersion = this.incrementVersion(currentVersion, validatedParams.versionType)

      // Check if version already exists
      const { data: existingVersion } = await supabase
        .from('publication_versions')
        .select('id')
        .eq('publication_id', validatedParams.publicationId)
        .eq('version_number', newVersion)
        .single()

      if (existingVersion) {
        return { success: false, error: `Version ${newVersion} already exists` }
      }

      // Create snapshot data
      const snapshotData = {
        title: currentPub.title,
        abstract: currentPub.abstract,
        authors: currentPub.authors,
        publication_date: currentPub.publication_date,
        status: currentPub.status,
        metadata: currentPub.metadata,
        created_at: currentPub.created_at,
        updated_at: currentPub.updated_at
      }

      const contentHash = this.generateContentHash(snapshotData)
      const dataSizeBytes = Buffer.byteLength(JSON.stringify(snapshotData), 'utf8')

      // Create version record
      const { data: versionData, error: versionError } = await supabase
        .from('publication_versions')
        .insert({
          publication_id: validatedParams.publicationId,
          version_number: newVersion,
          version_type: validatedParams.versionType,
          snapshot_data: snapshotData,
          created_by: userId,
          change_summary: validatedParams.changeSummary,
          change_reason: validatedParams.changeReason,
          content_hash: contentHash,
          data_size_bytes: dataSizeBytes,
          approval_status: validatedParams.approvalRequired ? 'pending' : 'approved',
          approved_by: validatedParams.approvalRequired ? null : userId,
          approved_at: validatedParams.approvalRequired ? null : new Date().toISOString()
        })
        .select()
        .single()

      if (versionError) {
        this.logger.error('Failed to create version record', {
          error: versionError,
          publicationId: validatedParams.publicationId
        })
        return { success: false, error: 'Failed to create version record' }
      }

      // Update publication with new version number
      const { error: updateError } = await supabase
        .from('publications')
        .update({
          version_number: newVersion,
          version_type: validatedParams.versionType,
          change_summary: validatedParams.changeSummary,
          change_reason: validatedParams.changeReason,
          content_hash: contentHash,
          revision_notes: validatedParams.revisionNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', validatedParams.publicationId)

      if (updateError) {
        this.logger.error('Failed to update publication version', {
          error: updateError,
          publicationId: validatedParams.publicationId
        })
        return { success: false, error: 'Failed to update publication version' }
      }

      // Create snapshot if requested
      if (validatedParams.createSnapshot) {
        await this.createSnapshot({
          publicationId: validatedParams.publicationId,
          snapshotType: 'auto',
          description: `Automatic snapshot for version ${newVersion}`,
          versionAtSnapshot: newVersion
        }, userId)
      }

      const processingTime = Date.now() - startTime

      this.logger.info('Successfully created publication version', {
        publicationId: validatedParams.publicationId,
        newVersion,
        userId,
        processingTimeMs: processingTime
      })

      return {
        success: true,
        version: {
          ...versionData,
          publicationId: versionData.publication_id,
          versionNumber: versionData.version_number,
          versionType: versionData.version_type,
          snapshotData: versionData.snapshot_data,
          createdBy: versionData.created_by,
          createdAt: versionData.created_at,
          changeSummary: versionData.change_summary,
          changeReason: versionData.change_reason,
          contentHash: versionData.content_hash,
          approvedBy: versionData.approved_by,
          approvedAt: versionData.approved_at,
          approvalStatus: versionData.approval_status,
          dataSizeBytes: versionData.data_size_bytes,
          compressionRatio: versionData.compression_ratio
        }
      }
    } catch (error) {
      this.logger.error('Error creating publication version', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        publicationId: params.publicationId,
        userId
      })
      return { success: false, error: 'Internal error creating version' }
    }
  }

  /**
   * Get all versions for a publication
   */
  async getVersions(publicationId: string, options: {
    limit?: number
    offset?: number
    includeSnapshots?: boolean
    approvalStatus?: string
  } = {}): Promise<{
    success: boolean
    versions?: PublicationVersion[]
    total?: number
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()
      
      let query = supabase
        .from('publication_versions')
        .select(`
          *,
          profiles:created_by(id, email, first_name, last_name),
          approver:approved_by(id, email, first_name, last_name)
        `, { count: 'exact' })
        .eq('publication_id', publicationId)
        .order('created_at', { ascending: false })

      if (options.approvalStatus) {
        query = query.eq('approval_status', options.approvalStatus)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        this.logger.error('Failed to get publication versions', {
          error: error.message,
          publicationId
        })
        return { success: false, error: 'Failed to retrieve versions' }
      }

      const versions = data?.map((version: any) => ({
        id: version.id,
        publicationId: version.publication_id,
        versionNumber: version.version_number,
        versionType: version.version_type,
        snapshotData: options.includeSnapshots ? version.snapshot_data : undefined,
        createdBy: version.created_by,
        createdAt: version.created_at,
        changeSummary: version.change_summary,
        changeReason: version.change_reason,
        contentHash: version.content_hash,
        approvedBy: version.approved_by,
        approvedAt: version.approved_at,
        approvalStatus: version.approval_status,
        dataSizeBytes: version.data_size_bytes,
        compressionRatio: version.compression_ratio,
        creator: version.profiles ? {
          id: version.profiles.id,
          name: `${version.profiles.first_name || ''} ${version.profiles.last_name || ''}`.trim() || version.profiles.email,
          email: version.profiles.email
        } : null,
        approver: version.approver ? {
          id: version.approver.id,
          name: `${version.approver.first_name || ''} ${version.approver.last_name || ''}`.trim() || version.approver.email,
          email: version.approver.email
        } : null
      })) || []

      return {
        success: true,
        versions,
        total: count || 0
      }
    } catch (error) {
      this.logger.error('Error getting publication versions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicationId
      })
      return { success: false, error: 'Internal error retrieving versions' }
    }
  }

  /**
   * Get a specific version
   */
  async getVersion(publicationId: string, versionNumber: string): Promise<{
    success: boolean
    version?: PublicationVersion
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data, error } = await supabase
        .from('publication_versions')
        .select(`
          *,
          profiles:created_by(id, email, first_name, last_name),
          approver:approved_by(id, email, first_name, last_name)
        `)
        .eq('publication_id', publicationId)
        .eq('version_number', versionNumber)
        .single()

      if (error || !data) {
        return { success: false, error: 'Version not found' }
      }

      const version: PublicationVersion = {
        id: data.id,
        publicationId: data.publication_id,
        versionNumber: data.version_number,
        versionType: data.version_type,
        snapshotData: data.snapshot_data,
        createdBy: data.created_by,
        createdAt: data.created_at,
        changeSummary: data.change_summary,
        changeReason: data.change_reason,
        contentHash: data.content_hash,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at,
        approvalStatus: data.approval_status,
        dataSizeBytes: data.data_size_bytes,
        compressionRatio: data.compression_ratio
      }

      return { success: true, version }
    } catch (error) {
      this.logger.error('Error getting publication version', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicationId,
        versionNumber
      })
      return { success: false, error: 'Internal error retrieving version' }
    }
  }

  /**
   * Create a snapshot
   */
  async createSnapshot(params: {
    publicationId: string
    snapshotType: 'auto' | 'manual' | 'rollback' | 'backup' | 'milestone'
    description?: string
    versionAtSnapshot?: string
    tags?: string[]
    expiresAt?: string
    isProtected?: boolean
  }, userId: string): Promise<{
    success: boolean
    snapshot?: PublicationSnapshot
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Get current publication data
      const { data: currentPub, error: pubError } = await supabase
        .from('publications')
        .select('*')
        .eq('id', params.publicationId)
        .single()

      if (pubError || !currentPub) {
        return { success: false, error: 'Publication not found' }
      }

      // Prepare snapshot data
      const snapshotData = {
        title: currentPub.title,
        abstract: currentPub.abstract,
        authors: currentPub.authors,
        publication_date: currentPub.publication_date,
        status: currentPub.status,
        metadata: currentPub.metadata,
        version_number: currentPub.version_number,
        created_at: currentPub.created_at,
        updated_at: currentPub.updated_at
      }

      // Compress the data
      const { compressed, originalSize, compressionRatio } = await this.compressData(snapshotData)
      const checksum = this.generateContentHash(snapshotData)

      // Create snapshot record
      const { data: snapshotRecord, error: snapshotError } = await supabase
        .from('publication_snapshots')
        .insert({
          publication_id: params.publicationId,
          snapshot_type: params.snapshotType,
          compressed_data: compressed,
          uncompressed_size: originalSize,
          compression_ratio: compressionRatio,
          created_by: userId,
          description: params.description,
          version_at_snapshot: params.versionAtSnapshot || currentPub.version_number,
          tags: params.tags ? JSON.stringify(params.tags) : null,
          checksum,
          expires_at: params.expiresAt,
          is_protected: params.isProtected || false
        })
        .select()
        .single()

      if (snapshotError) {
        this.logger.error('Failed to create snapshot', {
          error: snapshotError,
          publicationId: params.publicationId
        })
        return { success: false, error: 'Failed to create snapshot' }
      }

      return {
        success: true,
        snapshot: {
          id: snapshotRecord.id,
          publicationId: snapshotRecord.publication_id,
          snapshotType: snapshotRecord.snapshot_type,
          compressedData: compressed,
          uncompressedSize: snapshotRecord.uncompressed_size,
          compressionRatio: snapshotRecord.compression_ratio,
          createdBy: snapshotRecord.created_by,
          createdAt: snapshotRecord.created_at,
          description: snapshotRecord.description,
          versionAtSnapshot: snapshotRecord.version_at_snapshot,
          tags: snapshotRecord.tags ? JSON.parse(snapshotRecord.tags) : undefined,
          checksum: snapshotRecord.checksum,
          isVerified: snapshotRecord.is_verified,
          verificationDate: snapshotRecord.verification_date,
          expiresAt: snapshotRecord.expires_at,
          isProtected: snapshotRecord.is_protected
        }
      }
    } catch (error) {
      this.logger.error('Error creating snapshot', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicationId: params.publicationId,
        userId
      })
      return { success: false, error: 'Internal error creating snapshot' }
    }
  }

  /**
   * Delete old versions based on retention policy
   */
  async cleanupOldVersions(publicationId: string, options: {
    keepLatest?: number
    maxAgeMonths?: number
    preserveProtected?: boolean
  } = {}): Promise<{
    success: boolean
    deletedCount?: number
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()
      const keepLatest = options.keepLatest || 10
      const maxAgeMonths = options.maxAgeMonths || 12
      const cutoffDate = new Date()
      cutoffDate.setMonth(cutoffDate.getMonth() - maxAgeMonths)

      let deleteQuery = supabase
        .from('publication_versions')
        .delete()
        .eq('publication_id', publicationId)
        .lt('created_at', cutoffDate.toISOString())

      if (options.preserveProtected) {
        deleteQuery = deleteQuery.neq('approval_status', 'approved')
      }

      // Get versions to keep (latest N versions)
      const { data: versionsToKeep } = await supabase
        .from('publication_versions')
        .select('id')
        .eq('publication_id', publicationId)
        .order('created_at', { ascending: false })
        .limit(keepLatest)

      if (versionsToKeep && versionsToKeep.length > 0) {
        const idsToKeep = versionsToKeep.map(v => v.id)
        deleteQuery = deleteQuery.not('id', 'in', `(${idsToKeep.join(',')})`)
      }

      const { error, count } = await deleteQuery

      if (error) {
        this.logger.error('Failed to cleanup old versions', {
          error: error.message,
          publicationId
        })
        return { success: false, error: 'Failed to cleanup old versions' }
      }

      this.logger.info('Successfully cleaned up old versions', {
        publicationId,
        deletedCount: count || 0
      })

      return { success: true, deletedCount: count || 0 }
    } catch (error) {
      this.logger.error('Error cleaning up old versions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicationId
      })
      return { success: false, error: 'Internal error during cleanup' }
    }
  }
}

// Export singleton instance
export const versionManager = new PublicationVersionManager()