/**
 * Encrypted Backup and Recovery System for Admin Operations
 * 
 * Implements comprehensive encrypted backup and recovery procedures
 * with integrity verification, compliance retention, and secure restoration.
 * 
 * HIPAA Technical Safeguards Requirements:
 * - Data Backup Plan (45 CFR §164.308(a)(7)(ii)(A))
 * - Disaster Recovery Plan (45 CFR §164.308(a)(7)(ii)(B))
 * - Data Integrity (45 CFR §164.312(c)(1))
 * - Transmission Security (45 CFR §164.312(e))
 * 
 * Story 1.6 Task 7: Data Encryption for Admin Operations
 */

import * as crypto from 'crypto'
import * as zlib from 'zlib'
import { promisify } from 'util'
import { createClient } from '@/lib/dal/supabase'
import { logger } from '@/lib/logger'
import { auditLogger } from '../audit-logging'
import {
  EncryptedBackup,
  BackupType,
  BackupMetadata,
  BackupRetentionPolicy,
  BackupRecoveryRequest,
  RecoveryType,
  EncryptedFieldData,
  EncryptionPurpose,
  OperationStatus,
  DEFAULT_ENCRYPTION_CONFIG
} from './types'
import { SecureKeyManager } from './key-management'

const compress = promisify(zlib.deflate)
const decompress = promisify(zlib.inflate)

/**
 * Encrypted Backup and Recovery Service
 * Handles secure backup creation, storage, and recovery operations
 */
export class EncryptedBackupRecovery {
  private readonly compressionLevel = 6
  
  constructor(
    private readonly keyManager: SecureKeyManager,
    private readonly adminUserId: string
  ) {}

  /**
   * Create encrypted backup with compression and integrity protection
   */
  async createBackup(
    backupType: BackupType,
    sourceData: any,
    metadata: Partial<BackupMetadata> = {},
    retentionPolicy?: BackupRetentionPolicy
  ): Promise<{ success: boolean; backup?: EncryptedBackup; error?: string }> {
    try {
      const backupId = crypto.randomUUID()
      const timestamp = new Date().toISOString()
      
      // Serialize source data
      const serializedData = JSON.stringify(sourceData)
      const originalSize = Buffer.byteLength(serializedData, 'utf8')
      
      // Compress data before encryption for efficiency
      const compressedData = await compress(Buffer.from(serializedData, 'utf8'))
      const compressionRatio = compressedData.length / originalSize
      
      logger.info('Data compression completed', {
        backupId,
        originalSize,
        compressedSize: compressedData.length,
        compressionRatio: compressionRatio.toFixed(3)
      })
      
      // Get or create backup encryption key
      const backupKey = await this.getBackupEncryptionKey(backupType)
      if (!backupKey.success || !backupKey.key) {
        throw new Error(backupKey.error || 'Failed to get backup encryption key')
      }
      
      // Encrypt compressed data
      const encryptedData = await this.encryptBackupData(
        compressedData.toString('base64'),
        backupKey.key!.keyData
      )
      
      // Generate integrity hash
      const integrityHash = this.generateIntegrityHash(compressedData, metadata)
      
      // Create backup metadata
      const backupMetadata: BackupMetadata = {
        version: '1.0',
        size: compressedData.length,
        compressionRatio,
        sourceSystem: process.env.NODE_ENV || 'development',
        createdBy: this.adminUserId,
        complianceRequirements: ['HIPAA', 'HITECH'],
        retentionPolicy: retentionPolicy || this.getDefaultRetentionPolicy(backupType),
        recoveryProcedure: this.getRecoveryProcedure(backupType),
        ...metadata
      }
      
      // Calculate expiration date
      const expiresAt = this.calculateBackupExpiration(backupMetadata.retentionPolicy)
      
      // Create encrypted backup object
      const encryptedBackup: EncryptedBackup = {
        id: backupId,
        backupType,
        sourceData: 'ENCRYPTED', // Don't store actual data in metadata
        encryptedData,
        backupMetadata,
        integrityHash,
        createdAt: timestamp,
        expiresAt
      }
      
      // Store backup securely
      const storeResult = await this.storeEncryptedBackup(encryptedBackup)
      if (!storeResult.success) {
        throw new Error(storeResult.error || 'Failed to store encrypted backup')
      }
      
      // Audit log the backup creation
      await auditLogger.logEvent({
        event_type: 'system_admin:encrypted_backup_created' as any,
        severity: 'info',
        user_id: this.adminUserId,
        session_id: null,
        resource_type: 'encrypted_backup',
        resource_id: backupId,
        action_performed: 'create_encrypted_backup',
        client_ip: '127.0.0.1',
        user_agent: 'BackupRecovery-System',
        request_id: crypto.randomUUID(),
        compliance_frameworks: ['hipaa', 'hitech'],
        sensitive_data_involved: true,
        status: 'success',
        new_values: {
          backup_id: backupId,
          backup_type: backupType,
          size: compressedData.length,
          compression_ratio: compressionRatio,
          retention_days: backupMetadata.retentionPolicy.retentionDays
        }
      })
      
      logger.info('Encrypted backup created successfully', {
        backupId,
        backupType,
        size: compressedData.length,
        compressionRatio: compressionRatio.toFixed(3),
        expiresAt
      })
      
      return { success: true, backup: encryptedBackup }
      
    } catch (error) {
      logger.error('Failed to create encrypted backup', { 
        error, 
        backupType,
        adminUserId: this.adminUserId
      })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup creation failed'
      }
    }
  }

  /**
   * Recover data from encrypted backup
   */
  async recoverFromBackup(
    recoveryRequest: BackupRecoveryRequest
  ): Promise<{ success: boolean; recoveredData?: any; error?: string }> {
    try {
      // Retrieve encrypted backup
      const backup = await this.getEncryptedBackup(recoveryRequest.backupId)
      if (!backup.success || !backup.backup) {
        throw new Error(backup.error || 'Backup not found')
      }
      
      const encryptedBackup = backup.backup!
      
      // Verify backup integrity before recovery
      const integrityCheck = await this.verifyBackupIntegrity(encryptedBackup)
      if (!integrityCheck.success) {
        throw new Error(integrityCheck.error || 'Backup integrity verification failed')
      }
      
      // Check if backup has expired (unless it's verification only)
      if (recoveryRequest.recoveryType !== RecoveryType.VERIFICATION_ONLY) {
        const now = new Date()
        const expiresAt = new Date(encryptedBackup.expiresAt || '9999-12-31')
        
        if (now > expiresAt && !encryptedBackup.backupMetadata.retentionPolicy.complianceHold) {
          throw new Error('Backup has expired and cannot be recovered')
        }
      }
      
      // Get backup decryption key
      const backupKey = await this.getBackupEncryptionKey(encryptedBackup.backupType)
      if (!backupKey.success || !backupKey.key) {
        throw new Error(backupKey.error || 'Failed to get backup decryption key')
      }
      
      // Decrypt backup data
      const decryptedData = await this.decryptBackupData(
        encryptedBackup.encryptedData,
        backupKey.key!.keyData
      )
      
      // Decompress data
      const compressedBuffer = Buffer.from(decryptedData, 'base64')
      const decompressedBuffer = await decompress(compressedBuffer)
      const recoveredDataString = decompressedBuffer.toString('utf8')
      
      // Parse recovered data
      const recoveredData = JSON.parse(recoveredDataString)
      
      // Handle different recovery types
      let finalRecoveredData = recoveredData
      
      if (recoveryRequest.recoveryType === RecoveryType.SELECTIVE_RESTORE) {
        // Apply selective recovery logic based on targetLocation or other criteria
        finalRecoveredData = this.applySelectiveRecovery(recoveredData, recoveryRequest)
      }
      
      // Audit log the recovery
      await auditLogger.logEvent({
        event_type: 'system_admin:encrypted_backup_recovered' as any,
        severity: 'warning', // Recovery is significant security event
        user_id: this.adminUserId,
        session_id: null,
        resource_type: 'encrypted_backup',
        resource_id: recoveryRequest.backupId,
        action_performed: 'recover_from_backup',
        client_ip: '127.0.0.1',
        user_agent: 'BackupRecovery-System',
        request_id: crypto.randomUUID(),
        compliance_frameworks: ['hipaa', 'hitech'],
        sensitive_data_involved: true,
        status: 'success',
        new_values: {
          backup_id: recoveryRequest.backupId,
          recovery_type: recoveryRequest.recoveryType,
          requested_by: recoveryRequest.requestedBy,
          approved_by: recoveryRequest.approvedBy,
          reason: recoveryRequest.reason,
          verify_integrity: recoveryRequest.verifyIntegrity
        }
      })
      
      logger.warn('Encrypted backup recovery completed', {
        backupId: recoveryRequest.backupId,
        recoveryType: recoveryRequest.recoveryType,
        requestedBy: recoveryRequest.requestedBy,
        approvedBy: recoveryRequest.approvedBy,
        targetLocation: recoveryRequest.targetLocation
      })
      
      return {
        success: true,
        recoveredData: recoveryRequest.recoveryType === RecoveryType.VERIFICATION_ONLY 
          ? { verified: true, backupInfo: encryptedBackup.backupMetadata }
          : finalRecoveredData
      }
      
    } catch (error) {
      logger.error('Failed to recover from encrypted backup', { 
        error, 
        backupId: recoveryRequest.backupId,
        recoveryType: recoveryRequest.recoveryType
      })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Recovery failed'
      }
    }
  }

  /**
   * List available backups with filtering
   */
  async listBackups(filters: {
    backupType?: BackupType
    dateRange?: { start: string; end: string }
    limit?: number
    offset?: number
    includeExpired?: boolean
  } = {}): Promise<{ success: boolean; backups?: EncryptedBackup[]; total?: number; error?: string }> {
    try {
      const supabase = createClient()
      
      let query = supabase
        .from('encrypted_backups')
        .select('*', { count: 'exact' })
      
      if (filters.backupType) {
        query = query.eq('backup_type', filters.backupType)
      }
      
      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end)
      }
      
      if (!filters.includeExpired) {
        query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      }
      
      query = query
        .order('created_at', { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1)
      
      const { data, error, count } = await query
      
      if (error) {
        throw error
      }
      
      // Convert database records to EncryptedBackup objects (without actual encrypted data)
      const backups: EncryptedBackup[] = (data || []).map(row => ({
        id: row.id,
        backupType: row.backup_type,
        sourceData: 'ENCRYPTED', // Don't expose encrypted data in listings
        encryptedData: { encrypted: '[ENCRYPTED]' } as EncryptedFieldData,
        backupMetadata: JSON.parse(row.backup_metadata || '{}'),
        integrityHash: row.integrity_hash,
        createdAt: row.created_at,
        expiresAt: row.expires_at
      }))
      
      return {
        success: true,
        backups,
        total: count || 0
      }
      
    } catch (error) {
      logger.error('Failed to list encrypted backups', { error, filters })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup listing failed'
      }
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackupIntegrity(backup: EncryptedBackup): Promise<{ success: boolean; error?: string }> {
    try {
      // Get backup decryption key
      const backupKey = await this.getBackupEncryptionKey(backup.backupType)
      if (!backupKey.success || !backupKey.key) {
        throw new Error(backupKey.error || 'Failed to get backup decryption key')
      }
      
      // Decrypt and decompress to verify integrity
      const decryptedData = await this.decryptBackupData(
        backup.encryptedData,
        backupKey.key!.keyData
      )
      
      const compressedBuffer = Buffer.from(decryptedData, 'base64')
      const decompressedBuffer = await decompress(compressedBuffer)
      
      // Recalculate integrity hash and compare
      const calculatedHash = this.generateIntegrityHash(compressedBuffer, backup.backupMetadata)
      
      if (calculatedHash !== backup.integrityHash) {
        throw new Error('Backup integrity hash mismatch - data may be corrupted')
      }
      
      // Verify data can be parsed
      const parsedData = JSON.parse(decompressedBuffer.toString('utf8'))
      if (!parsedData) {
        throw new Error('Backup data is not valid JSON')
      }
      
      logger.info('Backup integrity verification successful', {
        backupId: backup.id,
        backupType: backup.backupType
      })
      
      return { success: true }
      
    } catch (error) {
      logger.error('Backup integrity verification failed', {
        error,
        backupId: backup.id,
        backupType: backup.backupType
      })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Integrity verification failed'
      }
    }
  }

  /**
   * Delete expired backups based on retention policies
   */
  async cleanupExpiredBackups(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const now = new Date()
      let deletedCount = 0
      
      // Get expired backups
      const expiredBackups = await this.listBackups({
        dateRange: { start: '2000-01-01', end: now.toISOString() },
        includeExpired: true,
        limit: 1000
      })
      
      if (!expiredBackups.success || !expiredBackups.backups) {
        throw new Error(expiredBackups.error || 'Failed to get expired backups')
      }
      
      for (const backup of expiredBackups.backups) {
        const expiresAt = backup.expiresAt ? new Date(backup.expiresAt) : null
        const isExpired = expiresAt && expiresAt < now
        const canDelete = isExpired && 
                         !backup.backupMetadata.retentionPolicy.complianceHold &&
                         !backup.backupMetadata.retentionPolicy.legalHold
        
        if (canDelete) {
          const deleteResult = await this.deleteBackup(backup.id)
          if (deleteResult.success) {
            deletedCount++
          }
        }
      }
      
      if (deletedCount > 0) {
        // Audit log the cleanup
        await auditLogger.logEvent({
          event_type: 'system_admin:backup_cleanup_completed' as any,
          severity: 'info',
          user_id: 'system',
          session_id: null,
          resource_type: 'encrypted_backup',
          resource_id: null,
          action_performed: 'cleanup_expired_backups',
          client_ip: '127.0.0.1',
          user_agent: 'BackupRecovery-System',
          request_id: crypto.randomUUID(),
          compliance_frameworks: ['hipaa', 'hitech'],
          sensitive_data_involved: true,
          status: 'success',
          new_values: {
            deleted_count: deletedCount,
            cleanup_date: now.toISOString()
          }
        })
        
        logger.info('Expired backup cleanup completed', {
          deletedCount,
          cleanupDate: now.toISOString()
        })
      }
      
      return { success: true, deletedCount }
      
    } catch (error) {
      logger.error('Failed to cleanup expired backups', { error })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cleanup failed'
      }
    }
  }

  // Private helper methods

  private async getBackupEncryptionKey(backupType: BackupType) {
    // Each backup type gets its own encryption key for isolation
    const keyPurpose = this.getKeyPurposeForBackupType(backupType)
    
    // Try to get existing key, create if not found
    const keyList = await this.keyManager.listEncryptionKeys({
      purpose: keyPurpose,
      limit: 1
    })
    
    if (keyList.success && keyList.keys && keyList.keys.length > 0) {
      return this.keyManager.getEncryptionKey(keyList.keys[0].id)
    }
    
    // Create new key for this backup type
    return this.keyManager.createEncryptionKey(keyPurpose)
  }

  private async encryptBackupData(data: string, key: Buffer): Promise<EncryptedFieldData> {
    const iv = crypto.randomBytes(DEFAULT_ENCRYPTION_CONFIG.ivLength)
    const salt = crypto.randomBytes(DEFAULT_ENCRYPTION_CONFIG.saltLength)
    
    const cipher = crypto.createCipher(DEFAULT_ENCRYPTION_CONFIG.algorithm, key)
    cipher.setAAD(salt)
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex'),
      algorithm: DEFAULT_ENCRYPTION_CONFIG.algorithm,
      timestamp: new Date().toISOString(),
      keyVersion: 1
    }
  }

  private async decryptBackupData(encryptedData: EncryptedFieldData, key: Buffer): Promise<string> {
    const iv = Buffer.from(encryptedData.iv, 'hex')
    const tag = Buffer.from(encryptedData.tag, 'hex')
    const salt = Buffer.from(encryptedData.salt, 'hex')
    
    const decipher = crypto.createDecipher(encryptedData.algorithm, key)
    decipher.setAuthTag(tag)
    decipher.setAAD(salt)
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  private generateIntegrityHash(data: Buffer, metadata: Partial<BackupMetadata>): string {
    const metadataString = JSON.stringify(metadata, Object.keys(metadata).sort())
    const combined = Buffer.concat([data, Buffer.from(metadataString, 'utf8')])
    return crypto.createHash('sha512').update(combined).digest('hex')
  }

  private async storeEncryptedBackup(backup: EncryptedBackup): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('encrypted_backups')
        .insert({
          id: backup.id,
          backup_type: backup.backupType,
          encrypted_data: JSON.stringify(backup.encryptedData),
          backup_metadata: JSON.stringify(backup.backupMetadata),
          integrity_hash: backup.integrityHash,
          created_at: backup.createdAt,
          expires_at: backup.expiresAt
        })
      
      if (error) {
        throw error
      }
      
      return { success: true }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup storage failed'
      }
    }
  }

  private async getEncryptedBackup(backupId: string): Promise<{ success: boolean; backup?: EncryptedBackup; error?: string }> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('encrypted_backups')
        .select('*')
        .eq('id', backupId)
        .single()
      
      if (error || !data) {
        return { success: false, error: 'Backup not found' }
      }
      
      const backup: EncryptedBackup = {
        id: data.id,
        backupType: data.backup_type,
        sourceData: 'ENCRYPTED',
        encryptedData: JSON.parse(data.encrypted_data),
        backupMetadata: JSON.parse(data.backup_metadata),
        integrityHash: data.integrity_hash,
        createdAt: data.created_at,
        expiresAt: data.expires_at
      }
      
      return { success: true, backup }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup retrieval failed'
      }
    }
  }

  private async deleteBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('encrypted_backups')
        .delete()
        .eq('id', backupId)
      
      if (error) {
        throw error
      }
      
      return { success: true }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup deletion failed'
      }
    }
  }

  private getKeyPurposeForBackupType(backupType: BackupType): EncryptionPurpose {
    switch (backupType) {
      case BackupType.AUDIT_LOGS:
        return EncryptionPurpose.AUDIT_LOG
      case BackupType.USER_DATA:
        return EncryptionPurpose.PATIENT_DATA
      case BackupType.ADMIN_CONFIG:
        return EncryptionPurpose.SYSTEM_CONFIG
      default:
        return EncryptionPurpose.BACKUP
    }
  }

  private getDefaultRetentionPolicy(backupType: BackupType): BackupRetentionPolicy {
    switch (backupType) {
      case BackupType.AUDIT_LOGS:
        return {
          retentionDays: 2555, // 7 years for HIPAA
          archiveAfterDays: 365,
          permanentDeletion: false,
          complianceHold: true,
          legalHold: false
        }
      case BackupType.USER_DATA:
        return {
          retentionDays: 2555, // 7 years for HIPAA
          archiveAfterDays: 730,
          permanentDeletion: false,
          complianceHold: true,
          legalHold: false
        }
      case BackupType.ADMIN_CONFIG:
        return {
          retentionDays: 1095, // 3 years
          archiveAfterDays: 365,
          permanentDeletion: true,
          complianceHold: false,
          legalHold: false
        }
      default:
        return {
          retentionDays: 90,
          archiveAfterDays: 30,
          permanentDeletion: true,
          complianceHold: false,
          legalHold: false
        }
    }
  }

  private getRecoveryProcedure(backupType: BackupType): string {
    const procedures = {
      [BackupType.FULL_SYSTEM]: 'Full system restoration requires administrator approval and system downtime.',
      [BackupType.AUDIT_LOGS]: 'Audit log recovery requires compliance officer approval and forensic verification.',
      [BackupType.USER_DATA]: 'User data recovery requires patient consent verification and privacy officer approval.',
      [BackupType.ADMIN_CONFIG]: 'Admin configuration recovery requires security officer approval.',
      [BackupType.ENCRYPTION_KEYS]: 'Key recovery requires multi-party approval and HSM verification.',
      [BackupType.INCREMENTAL]: 'Incremental recovery can be applied directly to existing system state.'
    }
    
    return procedures[backupType] || 'Standard recovery procedure applies.'
  }

  private calculateBackupExpiration(retentionPolicy: BackupRetentionPolicy): string | undefined {
    if (!retentionPolicy.retentionDays) {
      return undefined
    }
    
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + retentionPolicy.retentionDays)
    return expirationDate.toISOString()
  }

  private applySelectiveRecovery(data: any, request: BackupRecoveryRequest): any {
    // Implement selective recovery logic based on targetLocation
    // This is a placeholder - actual implementation would depend on data structure
    
    if (!request.targetLocation || request.targetLocation === 'full') {
      return data
    }
    
    // Parse target location (e.g., "table.field" or "section.subsection")
    const pathParts = request.targetLocation.split('.')
    let result = data
    
    for (const part of pathParts) {
      if (result && typeof result === 'object' && part in result) {
        result = result[part]
      } else {
        logger.warn('Selective recovery path not found', {
          targetLocation: request.targetLocation,
          currentPath: pathParts.slice(0, pathParts.indexOf(part) + 1).join('.')
        })
        return null
      }
    }
    
    return result
  }
}

/**
 * Factory function to create backup recovery service
 */
export function createBackupRecovery(
  keyManager: SecureKeyManager,
  adminUserId: string
): EncryptedBackupRecovery {
  return new EncryptedBackupRecovery(keyManager, adminUserId)
}