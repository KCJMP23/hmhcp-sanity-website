/**
 * Secure Key Management System for Admin Operations Encryption
 * 
 * Implements comprehensive key lifecycle management with PBKDF2 key derivation,
 * automatic rotation, secure storage, and HIPAA compliance.
 * 
 * HIPAA Technical Safeguards Requirements:
 * - Access Control (45 CFR §164.312(a))
 * - Assigned Security Responsibility (45 CFR §164.308(a)(2))
 * - Information System Activity Review (45 CFR §164.308(a)(1)(ii)(D))
 * 
 * Story 1.6 Task 7: Data Encryption for Admin Operations
 */

import * as crypto from 'crypto'
import { createClient } from '@/lib/dal/supabase'
import { logger } from '@/lib/logger'
import { auditLogger } from '../audit-logging'
import {
  EncryptionKey,
  KeyStatus,
  EncryptionPurpose,
  KeyMetadata,
  KeyRotationPolicy,
  KeyManagementOperation,
  KeyOperation,
  OperationStatus,
  KeyOperationApproval,
  KeyAuditEntry,
  KeyDerivationConfig,
  EncryptionError,
  EncryptionErrorCode,
  DEFAULT_ENCRYPTION_CONFIG
} from './types'

/**
 * Secure Key Management Service
 * Handles encryption key lifecycle, rotation, and access control
 */
export class SecureKeyManager {
  private readonly keyCache = new Map<string, { key: EncryptionKey; timestamp: number }>()
  private readonly derivedKeyCache = new Map<string, { key: Buffer; timestamp: number }>()
  private readonly operationQueue: KeyManagementOperation[] = []
  
  constructor(
    private readonly masterSeed: Buffer,
    private readonly adminUserId: string
  ) {
    if (!masterSeed || masterSeed.length < 32) {
      throw new Error('Master seed must be at least 32 bytes')
    }
    
    // Start background key rotation check
    this.startKeyRotationScheduler()
  }

  /**
   * Create a new encryption key
   */
  async createEncryptionKey(
    purpose: EncryptionPurpose,
    metadata: Partial<KeyMetadata> = {},
    approvedBy?: string
  ): Promise<{ success: boolean; key?: EncryptionKey; error?: string }> {
    try {
      const supabase = createClient()
      
      // Generate new key
      const keyData = crypto.randomBytes(32) // 256 bits
      const keyId = crypto.randomUUID()
      
      // Create key metadata
      const keyMetadata: KeyMetadata = {
        createdBy: this.adminUserId,
        rotationPolicy: {
          automatic: true,
          intervalDays: DEFAULT_ENCRYPTION_CONFIG.keyRotationDays,
          gracePeriodDays: 30,
          notificationThresholdDays: 7,
          requireManualApproval: purpose === EncryptionPurpose.PATIENT_DATA
        },
        complianceFrameworks: ['HIPAA', 'HITECH'],
        accessRestrictions: this.createDefaultAccessRestrictions(purpose),
        usageTracking: true,
        ...metadata
      }
      
      // Create encryption key object
      const encryptionKey: EncryptionKey = {
        id: keyId,
        version: 1,
        keyData,
        algorithm: DEFAULT_ENCRYPTION_CONFIG.algorithm,
        purpose,
        createdAt: new Date().toISOString(),
        expiresAt: this.calculateExpirationDate(keyMetadata.rotationPolicy.intervalDays),
        status: KeyStatus.ACTIVE,
        metadata: keyMetadata
      }
      
      // Store key in secure storage
      const storedKey = await this.storeEncryptionKey(encryptionKey)
      if (!storedKey.success) {
        throw new Error(storedKey.error || 'Failed to store encryption key')
      }
      
      // Create management operation record
      const operation: KeyManagementOperation = {
        id: crypto.randomUUID(),
        operation: KeyOperation.CREATE,
        keyId,
        operatedBy: this.adminUserId,
        timestamp: new Date().toISOString(),
        reason: `Created new ${purpose} encryption key`,
        status: OperationStatus.COMPLETED,
        approvals: approvedBy ? [{
          approvedBy,
          approvedAt: new Date().toISOString(),
          comments: 'Key creation approved'
        }] : [],
        auditTrail: [{
          timestamp: new Date().toISOString(),
          action: 'KEY_CREATED',
          performedBy: this.adminUserId,
          details: {
            keyId,
            purpose,
            algorithm: encryptionKey.algorithm
          }
        }]
      }
      
      await this.recordKeyOperation(operation)
      
      // Audit log the key creation
      await auditLogger.logEvent({
        event_type: 'system_admin:encryption_key_created' as any,
        severity: 'info',
        user_id: this.adminUserId,
        session_id: null,
        resource_type: 'encryption_key',
        resource_id: keyId,
        action_performed: 'create_encryption_key',
        client_ip: '127.0.0.1',
        user_agent: 'KeyManagement-System',
        request_id: crypto.randomUUID(),
        compliance_frameworks: ['hipaa', 'hitech'],
        sensitive_data_involved: true,
        status: 'success',
        new_values: {
          key_id: keyId,
          purpose,
          algorithm: encryptionKey.algorithm,
          version: encryptionKey.version
        }
      })
      
      logger.info('Encryption key created successfully', {
        keyId,
        purpose,
        createdBy: this.adminUserId
      })
      
      return { success: true, key: encryptionKey }
      
    } catch (error) {
      logger.error('Failed to create encryption key', { error, purpose })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Key creation failed'
      }
    }
  }

  /**
   * Retrieve an encryption key by ID
   */
  async getEncryptionKey(keyId: string): Promise<{ success: boolean; key?: EncryptionKey; error?: string }> {
    try {
      // Check cache first
      const cached = this.keyCache.get(keyId)
      if (cached && (Date.now() - cached.timestamp) < 60000) { // 1 minute cache
        return { success: true, key: cached.key }
      }
      
      // Retrieve from secure storage
      const key = await this.retrieveEncryptionKey(keyId)
      if (!key) {
        throw new EncryptionError('Encryption key not found', EncryptionErrorCode.KEY_NOT_FOUND)
      }
      
      // Validate key status
      if (key.status === KeyStatus.REVOKED) {
        throw new EncryptionError('Encryption key has been revoked', EncryptionErrorCode.KEY_REVOKED)
      }
      
      if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
        throw new EncryptionError('Encryption key has expired', EncryptionErrorCode.KEY_EXPIRED)
      }
      
      // Cache the key
      this.keyCache.set(keyId, {
        key,
        timestamp: Date.now()
      })
      
      return { success: true, key }
      
    } catch (error) {
      logger.error('Failed to retrieve encryption key', { error, keyId })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Key retrieval failed'
      }
    }
  }

  /**
   * Rotate an encryption key
   */
  async rotateEncryptionKey(
    keyId: string,
    reason: string = 'Scheduled rotation',
    approvedBy?: string
  ): Promise<{ success: boolean; newKey?: EncryptionKey; oldKey?: EncryptionKey; error?: string }> {
    try {
      // Get current key
      const currentKeyResult = await this.getEncryptionKey(keyId)
      if (!currentKeyResult.success || !currentKeyResult.key) {
        throw new Error(currentKeyResult.error || 'Current key not found')
      }
      
      const currentKey = currentKeyResult.key
      
      // Check if manual approval is required
      if (currentKey.metadata.rotationPolicy.requireManualApproval && !approvedBy) {
        return {
          success: false,
          error: 'Key rotation requires manual approval for this key type'
        }
      }
      
      // Mark current key as rotating
      currentKey.status = KeyStatus.ROTATING
      await this.updateKeyStatus(currentKey.id, KeyStatus.ROTATING)
      
      // Create new key with incremented version
      const newKeyResult = await this.createEncryptionKey(
        currentKey.purpose,
        {
          ...currentKey.metadata,
          createdBy: this.adminUserId
        },
        approvedBy
      )
      
      if (!newKeyResult.success || !newKeyResult.key) {
        // Rollback current key status
        await this.updateKeyStatus(currentKey.id, KeyStatus.ACTIVE)
        throw new Error(newKeyResult.error || 'Failed to create new key')
      }
      
      const newKey = newKeyResult.key
      newKey.version = currentKey.version + 1
      
      // Update new key version in storage
      await this.updateKeyVersion(newKey.id, newKey.version)
      
      // Mark current key as deprecated after grace period
      setTimeout(async () => {
        await this.updateKeyStatus(currentKey.id, KeyStatus.DEPRECATED)
      }, currentKey.metadata.rotationPolicy.gracePeriodDays * 24 * 60 * 60 * 1000)
      
      // Record rotation operation
      const operation: KeyManagementOperation = {
        id: crypto.randomUUID(),
        operation: KeyOperation.ROTATE,
        keyId: currentKey.id,
        operatedBy: this.adminUserId,
        timestamp: new Date().toISOString(),
        reason,
        status: OperationStatus.COMPLETED,
        approvals: approvedBy ? [{
          approvedBy,
          approvedAt: new Date().toISOString(),
          comments: 'Key rotation approved'
        }] : [],
        auditTrail: [
          {
            timestamp: new Date().toISOString(),
            action: 'KEY_ROTATION_STARTED',
            performedBy: this.adminUserId,
            details: {
              oldKeyId: currentKey.id,
              newKeyId: newKey.id,
              reason
            }
          },
          {
            timestamp: new Date().toISOString(),
            action: 'KEY_ROTATION_COMPLETED',
            performedBy: this.adminUserId,
            details: {
              oldKeyVersion: currentKey.version,
              newKeyVersion: newKey.version
            }
          }
        ]
      }
      
      await this.recordKeyOperation(operation)
      
      // Audit log the key rotation
      await auditLogger.logEvent({
        event_type: 'system_admin:encryption_key_rotated' as any,
        severity: 'info',
        user_id: this.adminUserId,
        session_id: null,
        resource_type: 'encryption_key',
        resource_id: currentKey.id,
        action_performed: 'rotate_encryption_key',
        client_ip: '127.0.0.1',
        user_agent: 'KeyManagement-System',
        request_id: crypto.randomUUID(),
        compliance_frameworks: ['hipaa', 'hitech'],
        sensitive_data_involved: true,
        status: 'success',
        old_values: {
          key_id: currentKey.id,
          version: currentKey.version,
          status: KeyStatus.ACTIVE
        },
        new_values: {
          key_id: newKey.id,
          version: newKey.version,
          status: KeyStatus.ACTIVE
        }
      })
      
      // Clear caches
      this.keyCache.delete(keyId)
      this.derivedKeyCache.clear()
      
      logger.info('Encryption key rotated successfully', {
        oldKeyId: currentKey.id,
        newKeyId: newKey.id,
        purpose: currentKey.purpose,
        reason
      })
      
      return {
        success: true,
        newKey,
        oldKey: currentKey
      }
      
    } catch (error) {
      logger.error('Failed to rotate encryption key', { error, keyId, reason })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Key rotation failed'
      }
    }
  }

  /**
   * Derive a purpose-specific key from master key
   */
  async deriveKey(config: KeyDerivationConfig): Promise<{ success: boolean; derivedKey?: Buffer; error?: string }> {
    try {
      const cacheKey = `${config.baseKeyId}:${config.derivationPurpose}:${config.derivationInfo.toString('hex')}`
      
      // Check cache first
      const cached = this.derivedKeyCache.get(cacheKey)
      if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minute cache
        return { success: true, derivedKey: cached.key }
      }
      
      // Get base key
      const baseKeyResult = await this.getEncryptionKey(config.baseKeyId)
      if (!baseKeyResult.success || !baseKeyResult.key) {
        throw new Error(baseKeyResult.error || 'Base key not found')
      }
      
      const baseKey = baseKeyResult.key
      
      // Create salt from derivation info
      const salt = crypto.createHash('sha256').update(config.derivationInfo).digest()
      
      // Derive key using PBKDF2
      const derivedKey = crypto.pbkdf2Sync(
        baseKey.keyData,
        salt,
        config.iterations || DEFAULT_ENCRYPTION_CONFIG.iterations,
        config.outputLength || 32,
        'sha512'
      )
      
      // Cache the derived key
      this.derivedKeyCache.set(cacheKey, {
        key: derivedKey,
        timestamp: Date.now()
      })
      
      return { success: true, derivedKey }
      
    } catch (error) {
      logger.error('Failed to derive key', { error, purpose: config.derivationPurpose })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Key derivation failed'
      }
    }
  }

  /**
   * Revoke an encryption key
   */
  async revokeEncryptionKey(
    keyId: string,
    reason: string,
    approvedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update key status
      const updateResult = await this.updateKeyStatus(keyId, KeyStatus.REVOKED)
      if (!updateResult) {
        throw new Error('Failed to update key status to revoked')
      }
      
      // Record revocation operation
      const operation: KeyManagementOperation = {
        id: crypto.randomUUID(),
        operation: KeyOperation.REVOKE,
        keyId,
        operatedBy: this.adminUserId,
        timestamp: new Date().toISOString(),
        reason,
        status: OperationStatus.COMPLETED,
        approvals: [{
          approvedBy,
          approvedAt: new Date().toISOString(),
          comments: 'Key revocation approved'
        }],
        auditTrail: [{
          timestamp: new Date().toISOString(),
          action: 'KEY_REVOKED',
          performedBy: this.adminUserId,
          details: {
            keyId,
            reason,
            approvedBy
          }
        }]
      }
      
      await this.recordKeyOperation(operation)
      
      // Audit log the key revocation
      await auditLogger.logEvent({
        event_type: 'system_admin:encryption_key_revoked' as any,
        severity: 'warning',
        user_id: this.adminUserId,
        session_id: null,
        resource_type: 'encryption_key',
        resource_id: keyId,
        action_performed: 'revoke_encryption_key',
        client_ip: '127.0.0.1',
        user_agent: 'KeyManagement-System',
        request_id: crypto.randomUUID(),
        compliance_frameworks: ['hipaa', 'hitech'],
        sensitive_data_involved: true,
        status: 'success',
        new_values: {
          key_id: keyId,
          status: KeyStatus.REVOKED,
          reason,
          approved_by: approvedBy
        }
      })
      
      // Clear from caches
      this.keyCache.delete(keyId)
      this.derivedKeyCache.clear()
      
      logger.warn('Encryption key revoked', {
        keyId,
        reason,
        approvedBy,
        revokedBy: this.adminUserId
      })
      
      return { success: true }
      
    } catch (error) {
      logger.error('Failed to revoke encryption key', { error, keyId, reason })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Key revocation failed'
      }
    }
  }

  /**
   * List encryption keys with filtering
   */
  async listEncryptionKeys(filters: {
    purpose?: EncryptionPurpose
    status?: KeyStatus
    limit?: number
    offset?: number
  } = {}): Promise<{ success: boolean; keys?: EncryptionKey[]; total?: number; error?: string }> {
    try {
      const supabase = createClient()
      
      let query = supabase
        .from('encryption_keys')
        .select('*', { count: 'exact' })
      
      if (filters.purpose) {
        query = query.eq('purpose', filters.purpose)
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      query = query
        .order('created_at', { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1)
      
      const { data, error, count } = await query
      
      if (error) {
        throw error
      }
      
      // Decrypt and deserialize key data (without exposing actual key material)
      const keys: EncryptionKey[] = (data || []).map(row => ({
        id: row.id,
        version: row.version,
        keyData: Buffer.alloc(0), // Don't expose actual key data in listings
        algorithm: row.algorithm,
        purpose: row.purpose,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        status: row.status,
        metadata: JSON.parse(row.metadata || '{}')
      }))
      
      return {
        success: true,
        keys,
        total: count || 0
      }
      
    } catch (error) {
      logger.error('Failed to list encryption keys', { error, filters })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Key listing failed'
      }
    }
  }

  /**
   * Get key health status
   */
  async getKeyHealthStatus(): Promise<{
    success: boolean
    status?: {
      totalKeys: number
      activeKeys: number
      expiringSoon: number
      expired: number
      revoked: number
      rotationNeeded: number
      healthScore: number
    }
    error?: string
  }> {
    try {
      const { keys } = await this.listEncryptionKeys({ limit: 1000 })
      if (!keys) {
        throw new Error('Failed to retrieve keys for health check')
      }
      
      const now = new Date()
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const totalKeys = keys.length
      const activeKeys = keys.filter(k => k.status === KeyStatus.ACTIVE).length
      const expiringSoon = keys.filter(k => 
        k.status === KeyStatus.ACTIVE && 
        k.expiresAt && 
        new Date(k.expiresAt) <= oneWeekFromNow
      ).length
      const expired = keys.filter(k => 
        k.expiresAt && 
        new Date(k.expiresAt) < now
      ).length
      const revoked = keys.filter(k => k.status === KeyStatus.REVOKED).length
      const rotationNeeded = keys.filter(k => 
        k.status === KeyStatus.ACTIVE && 
        this.needsRotation(k)
      ).length
      
      // Calculate health score (0-100)
      let healthScore = 100
      if (expired > 0) healthScore -= expired * 20
      if (expiringSoon > 0) healthScore -= expiringSoon * 10
      if (rotationNeeded > 0) healthScore -= rotationNeeded * 5
      
      healthScore = Math.max(0, Math.min(100, healthScore))
      
      return {
        success: true,
        status: {
          totalKeys,
          activeKeys,
          expiringSoon,
          expired,
          revoked,
          rotationNeeded,
          healthScore
        }
      }
      
    } catch (error) {
      logger.error('Failed to get key health status', { error })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      }
    }
  }

  /**
   * Clear sensitive data from memory
   */
  clearSensitiveData(): void {
    this.keyCache.clear()
    this.derivedKeyCache.clear()
    logger.info('Key management sensitive data cleared from memory')
  }

  // Private helper methods

  private async storeEncryptionKey(key: EncryptionKey): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      
      // Encrypt the key data before storage
      const encryptedKeyData = this.encryptKeyForStorage(key.keyData)
      
      const { error } = await supabase
        .from('encryption_keys')
        .insert({
          id: key.id,
          version: key.version,
          key_data: encryptedKeyData,
          algorithm: key.algorithm,
          purpose: key.purpose,
          created_at: key.createdAt,
          expires_at: key.expiresAt,
          status: key.status,
          metadata: JSON.stringify(key.metadata)
        })
      
      if (error) {
        throw error
      }
      
      return { success: true }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Key storage failed'
      }
    }
  }

  private async retrieveEncryptionKey(keyId: string): Promise<EncryptionKey | null> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('encryption_keys')
        .select('*')
        .eq('id', keyId)
        .single()
      
      if (error || !data) {
        return null
      }
      
      // Decrypt the key data
      const decryptedKeyData = this.decryptKeyFromStorage(data.key_data)
      
      return {
        id: data.id,
        version: data.version,
        keyData: decryptedKeyData,
        algorithm: data.algorithm,
        purpose: data.purpose,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        status: data.status,
        metadata: JSON.parse(data.metadata || '{}')
      }
      
    } catch (error) {
      logger.error('Failed to retrieve encryption key from storage', { error, keyId })
      return null
    }
  }

  private async updateKeyStatus(keyId: string, status: KeyStatus): Promise<boolean> {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('encryption_keys')
        .update({ status })
        .eq('id', keyId)
      
      return !error
      
    } catch (error) {
      logger.error('Failed to update key status', { error, keyId, status })
      return false
    }
  }

  private async updateKeyVersion(keyId: string, version: number): Promise<boolean> {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('encryption_keys')
        .update({ version })
        .eq('id', keyId)
      
      return !error
      
    } catch (error) {
      logger.error('Failed to update key version', { error, keyId, version })
      return false
    }
  }

  private async recordKeyOperation(operation: KeyManagementOperation): Promise<void> {
    try {
      const supabase = createClient()
      
      await supabase
        .from('key_management_operations')
        .insert({
          id: operation.id,
          operation: operation.operation,
          key_id: operation.keyId,
          operated_by: operation.operatedBy,
          timestamp: operation.timestamp,
          reason: operation.reason,
          status: operation.status,
          approvals: JSON.stringify(operation.approvals),
          audit_trail: JSON.stringify(operation.auditTrail)
        })
        
    } catch (error) {
      logger.error('Failed to record key operation', { error, operation: operation.operation })
    }
  }

  private encryptKeyForStorage(keyData: Buffer): string {
    // Use master seed to encrypt individual keys for storage
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher('aes-256-gcm', this.masterSeed)
    
    let encrypted = cipher.update(keyData, null, 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    })
  }

  private decryptKeyFromStorage(encryptedData: string): Buffer {
    try {
      const { encrypted, iv, tag } = JSON.parse(encryptedData)
      
      const decipher = crypto.createDecipher('aes-256-gcm', this.masterSeed)
      decipher.setAuthTag(Buffer.from(tag, 'hex'))
      
      let decrypted = decipher.update(encrypted, 'hex')
      decrypted = Buffer.concat([decrypted, decipher.final()])
      
      return decrypted
      
    } catch (error) {
      throw new EncryptionError('Failed to decrypt key from storage', EncryptionErrorCode.DECRYPTION_FAILED)
    }
  }

  private createDefaultAccessRestrictions(purpose: EncryptionPurpose) {
    const restrictions = [
      {
        userRole: 'admin',
        permission: 'read' as const,
      },
      {
        userRole: 'security_officer',
        permission: 'read' as const,
      }
    ]
    
    if (purpose === EncryptionPurpose.PATIENT_DATA) {
      restrictions.push({
        userRole: 'compliance_officer',
        permission: 'read' as const,
      })
    }
    
    return restrictions
  }

  private calculateExpirationDate(days: number): string {
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + days)
    return expirationDate.toISOString()
  }

  private needsRotation(key: EncryptionKey): boolean {
    if (!key.expiresAt) return false
    
    const now = new Date()
    const expiration = new Date(key.expiresAt)
    const notificationThreshold = key.metadata.rotationPolicy.notificationThresholdDays * 24 * 60 * 60 * 1000
    
    return (expiration.getTime() - now.getTime()) <= notificationThreshold
  }

  private startKeyRotationScheduler(): void {
    // Check for keys needing rotation every hour
    setInterval(async () => {
      try {
        const { keys } = await this.listEncryptionKeys({ status: KeyStatus.ACTIVE, limit: 100 })
        if (!keys) return
        
        for (const key of keys) {
          if (key.metadata.rotationPolicy.automatic && this.needsRotation(key)) {
            logger.info('Automatic key rotation needed', { keyId: key.id })
            
            if (!key.metadata.rotationPolicy.requireManualApproval) {
              await this.rotateEncryptionKey(
                key.id,
                'Automatic scheduled rotation'
              )
            }
          }
        }
      } catch (error) {
        logger.error('Key rotation scheduler error', { error })
      }
    }, 60 * 60 * 1000) // 1 hour
  }
}

/**
 * Factory function to create secure key manager
 */
export function createKeyManager(adminUserId: string): SecureKeyManager {
  const masterSeed = process.env.ENCRYPTION_MASTER_SEED
  if (!masterSeed) {
    throw new Error('Encryption master seed not configured')
  }
  
  try {
    const seedBuffer = Buffer.from(masterSeed, 'hex')
    return new SecureKeyManager(seedBuffer, adminUserId)
  } catch (error) {
    throw new Error('Invalid master seed format - must be hexadecimal')
  }
}