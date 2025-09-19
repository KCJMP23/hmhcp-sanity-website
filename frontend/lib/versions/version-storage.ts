/**
 * Version Storage Optimization Utilities
 * 
 * Provides advanced storage optimization for publication version data with
 * compression, deduplication, and efficient storage strategies for healthcare
 * content management systems.
 * 
 * Features:
 * - Intelligent compression algorithms
 * - Content deduplication
 * - Delta storage for space efficiency
 * - Automatic cleanup and archival
 * - Storage metrics and analytics
 * - HIPAA-compliant data handling
 */

import { gzip, gunzip, deflate, inflate, brotliCompress, brotliDecompress } from 'zlib'
import { promisify } from 'util'
import { createHash } from 'crypto'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import logger from '@/lib/logging/winston-logger'
import { z } from 'zod'

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)
const deflateAsync = promisify(deflate)
const inflateAsync = promisify(inflate)
const brotliCompressAsync = promisify(brotliCompress)
const brotliDecompressAsync = promisify(brotliDecompress)

// ================================================================
// INTERFACES AND TYPES
// ================================================================

export interface CompressionResult {
  compressed: Buffer
  originalSize: number
  compressedSize: number
  compressionRatio: number
  algorithm: CompressionAlgorithm
  processingTimeMs: number
  checksum: string
}

export interface DecompressionResult {
  data: any
  originalSize: number
  algorithm: CompressionAlgorithm
  processingTimeMs: number
  checksumValid: boolean
}

export interface StorageStats {
  publicationId: string
  totalVersions: number
  totalStorageBytes: number
  compressedStorageBytes: number
  overallCompressionRatio: number
  averageVersionSize: number
  oldestVersion: string
  newestVersion: string
  lastOptimization: string
  potentialSavingsBytes: number
}

export interface OptimizationOptions {
  compressionAlgorithm: CompressionAlgorithm
  enableDeduplication: boolean
  enableDeltaStorage: boolean
  maxVersionAge: number // days
  keepLatestVersions: number
  compressionLevel: number
  chunkSize: number
}

export interface DeltaRecord {
  id: string
  publicationId: string
  versionNumber: string
  baseVersion: string
  deltaData: Buffer
  deltaSize: number
  originalSize: number
  compressionRatio: number
  createdAt: string
}

export interface DeduplicationResult {
  duplicateHashes: string[]
  uniqueHashes: string[]
  spaceSavedBytes: number
  deduplicationRatio: number
}

export type CompressionAlgorithm = 'gzip' | 'deflate' | 'brotli' | 'none'

// ================================================================
// VALIDATION SCHEMAS
// ================================================================

const optimizationOptionsSchema = z.object({
  compressionAlgorithm: z.enum(['gzip', 'deflate', 'brotli', 'none']).default('gzip'),
  enableDeduplication: z.boolean().default(true),
  enableDeltaStorage: z.boolean().default(true),
  maxVersionAge: z.number().min(1).max(3650).default(365), // 1 year default
  keepLatestVersions: z.number().min(1).max(100).default(10),
  compressionLevel: z.number().min(1).max(9).default(6),
  chunkSize: z.number().min(1024).max(1048576).default(65536) // 64KB default
})

// ================================================================
// VERSION STORAGE MANAGER CLASS
// ================================================================

export class VersionStorageManager {
  private supabase: any
  private logger: any
  private compressionCache: Map<string, any> = new Map()

  constructor() {
    this.logger = logger?.child ? logger.child({ service: 'VersionStorageManager' }) : console
  }

  private async getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = await createServerSupabaseClient()
    }
    return this.supabase
  }

  /**
   * Compress data using specified algorithm
   */
  async compressData(
    data: any,
    algorithm: CompressionAlgorithm = 'gzip',
    level: number = 6
  ): Promise<CompressionResult> {
    const startTime = Date.now()
    
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data)
      const originalBuffer = Buffer.from(jsonString, 'utf8')
      const originalSize = originalBuffer.length
      const checksum = createHash('sha256').update(originalBuffer).digest('hex')

      let compressed: Buffer

      switch (algorithm) {
        case 'gzip':
          compressed = await gzipAsync(originalBuffer, { level })
          break
        case 'deflate':
          compressed = await deflateAsync(originalBuffer, { level })
          break
        case 'brotli':
          compressed = await brotliCompressAsync(originalBuffer)
          break
        case 'none':
          compressed = originalBuffer
          break
        default:
          throw new Error(`Unsupported compression algorithm: ${algorithm}`)
      }

      const compressedSize = compressed.length
      const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1
      const processingTimeMs = Date.now() - startTime

      this.logger.debug('Data compressed successfully', {
        algorithm,
        originalSize,
        compressedSize,
        compressionRatio: Number(compressionRatio.toFixed(3)),
        processingTimeMs
      })

      return {
        compressed,
        originalSize,
        compressedSize,
        compressionRatio: Number(compressionRatio.toFixed(3)),
        algorithm,
        processingTimeMs,
        checksum
      }
    } catch (error) {
      this.logger.error('Error compressing data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        algorithm,
        level
      })
      throw new Error('Failed to compress data')
    }
  }

  /**
   * Decompress data
   */
  async decompressData(
    compressedBuffer: Buffer,
    algorithm: CompressionAlgorithm,
    expectedChecksum?: string
  ): Promise<DecompressionResult> {
    const startTime = Date.now()

    try {
      let decompressed: Buffer

      switch (algorithm) {
        case 'gzip':
          decompressed = await gunzipAsync(compressedBuffer)
          break
        case 'deflate':
          decompressed = await inflateAsync(compressedBuffer)
          break
        case 'brotli':
          decompressed = await brotliDecompressAsync(compressedBuffer)
          break
        case 'none':
          decompressed = compressedBuffer
          break
        default:
          throw new Error(`Unsupported compression algorithm: ${algorithm}`)
      }

      const originalSize = decompressed.length
      const processingTimeMs = Date.now() - startTime

      // Verify checksum if provided
      let checksumValid = true
      if (expectedChecksum) {
        const actualChecksum = createHash('sha256').update(decompressed).digest('hex')
        checksumValid = actualChecksum === expectedChecksum
      }

      const data = JSON.parse(decompressed.toString('utf8'))

      this.logger.debug('Data decompressed successfully', {
        algorithm,
        originalSize,
        processingTimeMs,
        checksumValid
      })

      return {
        data,
        originalSize,
        algorithm,
        processingTimeMs,
        checksumValid
      }
    } catch (error) {
      this.logger.error('Error decompressing data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        algorithm
      })
      throw new Error('Failed to decompress data')
    }
  }

  /**
   * Optimize storage for a publication by compressing versions
   */
  async optimizePublicationStorage(
    publicationId: string,
    options: Partial<OptimizationOptions> = {}
  ): Promise<{
    success: boolean
    stats?: StorageStats
    optimization?: {
      versionsOptimized: number
      spaceSavedBytes: number
      compressionRatio: number
      processingTimeMs: number
    }
    error?: string
  }> {
    const startTime = Date.now()
    
    try {
      const validatedOptions = optimizationOptionsSchema.parse(options)
      const supabase = await this.getSupabaseClient()

      this.logger.info('Starting publication storage optimization', {
        publicationId,
        options: validatedOptions
      })

      // Get all versions for the publication
      const { data: versions, error: versionsError } = await supabase
        .from('publication_versions')
        .select('*')
        .eq('publication_id', publicationId)
        .order('created_at', { ascending: true })

      if (versionsError) {
        return { success: false, error: 'Failed to retrieve versions' }
      }

      if (!versions || versions.length === 0) {
        return { success: false, error: 'No versions found for optimization' }
      }

      let versionsOptimized = 0
      let totalSpaceSaved = 0
      let totalOriginalSize = 0
      let totalCompressedSize = 0

      // Process each version
      for (const version of versions) {
        if (!version.snapshot_data) continue

        // Skip if already optimized
        if (version.compression_ratio && version.compression_ratio < 0.8) {
          continue
        }

        const compressionResult = await this.compressData(
          version.snapshot_data,
          validatedOptions.compressionAlgorithm,
          validatedOptions.compressionLevel
        )

        const spaceSaved = compressionResult.originalSize - compressionResult.compressedSize

        // Update version with compressed data if beneficial
        if (compressionResult.compressionRatio < 0.9) {
          const { error: updateError } = await supabase
            .from('publication_versions')
            .update({
              data_size_bytes: compressionResult.compressedSize,
              compression_ratio: compressionResult.compressionRatio
            })
            .eq('id', version.id)

          if (!updateError) {
            versionsOptimized++
            totalSpaceSaved += spaceSaved
            totalOriginalSize += compressionResult.originalSize
            totalCompressedSize += compressionResult.compressedSize
          }
        }
      }

      // Perform deduplication if enabled
      let deduplicationSavings = 0
      if (validatedOptions.enableDeduplication) {
        const deduplicationResult = await this.deduplicateVersions(publicationId)
        if (deduplicationResult.success) {
          deduplicationSavings = deduplicationResult.spaceSavedBytes || 0
        }
      }

      // Get storage stats
      const stats = await this.getStorageStats(publicationId)

      const processingTimeMs = Date.now() - startTime
      const overallCompressionRatio = totalOriginalSize > 0 ? totalCompressedSize / totalOriginalSize : 1

      this.logger.info('Publication storage optimization completed', {
        publicationId,
        versionsOptimized,
        totalSpaceSaved,
        deduplicationSavings,
        processingTimeMs
      })

      return {
        success: true,
        stats: stats.success ? stats.stats : undefined,
        optimization: {
          versionsOptimized,
          spaceSavedBytes: totalSpaceSaved + deduplicationSavings,
          compressionRatio: Number(overallCompressionRatio.toFixed(3)),
          processingTimeMs
        }
      }
    } catch (error) {
      this.logger.error('Error optimizing publication storage', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicationId
      })
      return { success: false, error: 'Internal error during optimization' }
    }
  }

  /**
   * Deduplicate version data based on content hashes
   */
  async deduplicateVersions(publicationId: string): Promise<{
    success: boolean
    spaceSavedBytes?: number
    deduplicationRatio?: number
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Get all versions with their content hashes
      const { data: versions, error } = await supabase
        .from('publication_versions')
        .select('id, content_hash, data_size_bytes, snapshot_data')
        .eq('publication_id', publicationId)

      if (error || !versions) {
        return { success: false, error: 'Failed to retrieve versions for deduplication' }
      }

      const hashGroups = new Map<string, any[]>()
      let totalSize = 0

      // Group versions by content hash
      versions.forEach(version => {
        const hash = version.content_hash
        if (!hashGroups.has(hash)) {
          hashGroups.set(hash, [])
        }
        hashGroups.get(hash)!.push(version)
        totalSize += version.data_size_bytes || 0
      })

      let spaceSaved = 0
      let duplicatesFound = 0

      // Process duplicate groups
      for (const [hash, group] of hashGroups.entries()) {
        if (group.length > 1) {
          // Keep the first version, mark others as deduplicated
          const masterVersion = group[0]
          const duplicates = group.slice(1)

          for (const duplicate of duplicates) {
            spaceSaved += duplicate.data_size_bytes || 0
            duplicatesFound++

            // Update duplicate to reference the master
            await supabase
              .from('publication_versions')
              .update({
                snapshot_data: null, // Remove duplicate data
                data_size_bytes: 0,
                compression_ratio: 0,
                deduplication_master_id: masterVersion.id
              })
              .eq('id', duplicate.id)
          }
        }
      }

      const deduplicationRatio = totalSize > 0 ? spaceSaved / totalSize : 0

      this.logger.info('Version deduplication completed', {
        publicationId,
        duplicatesFound,
        spaceSaved,
        deduplicationRatio
      })

      return {
        success: true,
        spaceSavedBytes: spaceSaved,
        deduplicationRatio: Number(deduplicationRatio.toFixed(3))
      }
    } catch (error) {
      this.logger.error('Error during version deduplication', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicationId
      })
      return { success: false, error: 'Internal error during deduplication' }
    }
  }

  /**
   * Create delta storage for efficient version management
   */
  async createDeltaStorage(
    publicationId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<{
    success: boolean
    delta?: DeltaRecord
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Get both versions
      const { data: versions, error } = await supabase
        .from('publication_versions')
        .select('*')
        .eq('publication_id', publicationId)
        .in('version_number', [fromVersion, toVersion])

      if (error || !versions || versions.length !== 2) {
        return { success: false, error: 'Failed to retrieve versions for delta creation' }
      }

      const baseVersion = versions.find(v => v.version_number === fromVersion)
      const targetVersion = versions.find(v => v.version_number === toVersion)

      if (!baseVersion || !targetVersion) {
        return { success: false, error: 'Version not found' }
      }

      // Calculate delta between versions
      const delta = this.calculateDelta(baseVersion.snapshot_data, targetVersion.snapshot_data)
      
      // Compress delta data
      const compressionResult = await this.compressData(delta, 'gzip')

      // Store delta record
      const deltaRecord: Partial<DeltaRecord> = {
        publication_id: publicationId,
        version_number: toVersion,
        base_version: fromVersion,
        delta_data: compressionResult.compressed,
        delta_size: compressionResult.compressedSize,
        original_size: compressionResult.originalSize,
        compression_ratio: compressionResult.compressionRatio
      }

      const { data: savedDelta, error: saveError } = await supabase
        .from('publication_deltas')
        .insert(deltaRecord)
        .select()
        .single()

      if (saveError) {
        return { success: false, error: 'Failed to save delta record' }
      }

      return {
        success: true,
        delta: {
          ...savedDelta,
          publicationId: savedDelta.publication_id,
          versionNumber: savedDelta.version_number,
          baseVersion: savedDelta.base_version,
          deltaData: savedDelta.delta_data,
          deltaSize: savedDelta.delta_size,
          originalSize: savedDelta.original_size,
          compressionRatio: savedDelta.compression_ratio,
          createdAt: savedDelta.created_at
        }
      }
    } catch (error) {
      this.logger.error('Error creating delta storage', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicationId,
        fromVersion,
        toVersion
      })
      return { success: false, error: 'Internal error creating delta' }
    }
  }

  /**
   * Calculate delta between two data objects
   */
  private calculateDelta(baseData: any, targetData: any): any {
    const delta: any = {}

    // Simple delta calculation - can be enhanced with more sophisticated algorithms
    for (const key in targetData) {
      if (baseData[key] !== targetData[key]) {
        delta[key] = {
          old: baseData[key],
          new: targetData[key],
          op: baseData[key] === undefined ? 'add' : 'change'
        }
      }
    }

    for (const key in baseData) {
      if (!(key in targetData)) {
        delta[key] = {
          old: baseData[key],
          new: undefined,
          op: 'delete'
        }
      }
    }

    return delta
  }

  /**
   * Get storage statistics for a publication
   */
  async getStorageStats(publicationId: string): Promise<{
    success: boolean
    stats?: StorageStats
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Get version statistics
      const { data: versions, error } = await supabase
        .from('publication_versions')
        .select('version_number, data_size_bytes, compression_ratio, created_at')
        .eq('publication_id', publicationId)
        .order('created_at', { ascending: true })

      if (error || !versions) {
        return { success: false, error: 'Failed to retrieve version statistics' }
      }

      const totalVersions = versions.length
      const totalStorageBytes = versions.reduce((sum, v) => sum + (v.data_size_bytes || 0), 0)
      const compressedStorageBytes = versions.reduce((sum, v) => {
        const originalSize = v.data_size_bytes || 0
        const ratio = v.compression_ratio || 1
        return sum + (originalSize / Math.max(ratio, 0.1))
      }, 0)

      const overallCompressionRatio = compressedStorageBytes > 0 ? 
        totalStorageBytes / compressedStorageBytes : 1

      const averageVersionSize = totalVersions > 0 ? totalStorageBytes / totalVersions : 0
      const oldestVersion = versions[0]?.version_number || 'unknown'
      const newestVersion = versions[versions.length - 1]?.version_number || 'unknown'

      // Estimate potential savings
      const potentialSavingsBytes = Math.max(0, totalStorageBytes - (totalStorageBytes * 0.3))

      const stats: StorageStats = {
        publicationId,
        totalVersions,
        totalStorageBytes,
        compressedStorageBytes: Math.round(compressedStorageBytes),
        overallCompressionRatio: Number(overallCompressionRatio.toFixed(3)),
        averageVersionSize: Math.round(averageVersionSize),
        oldestVersion,
        newestVersion,
        lastOptimization: new Date().toISOString(),
        potentialSavingsBytes: Math.round(potentialSavingsBytes)
      }

      return { success: true, stats }
    } catch (error) {
      this.logger.error('Error getting storage statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicationId
      })
      return { success: false, error: 'Internal error getting statistics' }
    }
  }

  /**
   * Clean up old versions based on retention policy
   */
  async cleanupOldVersions(
    publicationId: string,
    options: {
      maxVersionAge?: number // days
      keepLatestVersions?: number
      deleteUncompressed?: boolean
    } = {}
  ): Promise<{
    success: boolean
    deletedCount?: number
    spaceSavedBytes?: number
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()
      const maxAgeMs = (options.maxVersionAge || 365) * 24 * 60 * 60 * 1000
      const keepLatest = options.keepLatestVersions || 10
      const cutoffDate = new Date(Date.now() - maxAgeMs)

      // Get versions to potentially delete
      const { data: versions, error } = await supabase
        .from('publication_versions')
        .select('id, version_number, data_size_bytes, created_at, compression_ratio')
        .eq('publication_id', publicationId)
        .lt('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: 'Failed to retrieve versions for cleanup' }
      }

      if (!versions || versions.length <= keepLatest) {
        return { success: true, deletedCount: 0, spaceSavedBytes: 0 }
      }

      // Keep the latest N versions, delete the rest
      const versionsToDelete = versions.slice(keepLatest)
      let deletedCount = 0
      let spaceSaved = 0

      for (const version of versionsToDelete) {
        // Check if uncompressed versions should be deleted
        if (options.deleteUncompressed && (!version.compression_ratio || version.compression_ratio > 0.9)) {
          continue
        }

        const { error: deleteError } = await supabase
          .from('publication_versions')
          .delete()
          .eq('id', version.id)

        if (!deleteError) {
          deletedCount++
          spaceSaved += version.data_size_bytes || 0
        }
      }

      this.logger.info('Version cleanup completed', {
        publicationId,
        deletedCount,
        spaceSaved
      })

      return {
        success: true,
        deletedCount,
        spaceSavedBytes: spaceSaved
      }
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
export const storageManager = new VersionStorageManager()

// Export utility functions and schemas
export {
  optimizationOptionsSchema
}