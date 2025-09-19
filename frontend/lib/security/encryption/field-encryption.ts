/**
 * Field-Level Encryption Utilities for Admin Operations
 * 
 * Implements comprehensive field-level encryption for sensitive admin data
 * with AES-256-GCM encryption and PBKDF2 key derivation.
 * 
 * HIPAA Technical Safeguards Requirements:
 * - Data integrity controls (45 CFR §164.312(c)(1))
 * - Encryption and decryption (45 CFR §164.312(a)(2)(iv))
 * - Person or Entity Authentication (45 CFR §164.312(d))
 * 
 * Story 1.6 Task 7: Data Encryption for Admin Operations
 */

import * as crypto from 'crypto'
import { logger } from '@/lib/logger'
import {
  EncryptedFieldData,
  FieldEncryptionConfig,
  FieldEncryptionResult,
  FieldDecryptionResult,
  EncryptionPurpose,
  EncryptionError as IEncryptionError,
  EncryptionErrorCode,
  DEFAULT_ENCRYPTION_CONFIG,
  SearchableEncryption,
  EncryptedSearchQuery
} from './types'

// Custom error class implementing the EncryptionError interface
class EncryptionError extends Error implements IEncryptionError {
  code: EncryptionErrorCode
  details?: Record<string, any>
  keyVersion?: number
  timestamp: string
  recoverable: boolean

  constructor(
    message: string, 
    code: EncryptionErrorCode = EncryptionErrorCode.ENCRYPTION_FAILED,
    details?: Record<string, any>,
    keyVersion?: number,
    recoverable: boolean = false
  ) {
    super(message)
    this.name = 'EncryptionError'
    this.code = code
    this.details = details
    this.keyVersion = keyVersion
    this.timestamp = new Date().toISOString()
    this.recoverable = recoverable
  }
}

/**
 * Field-Level Encryption Service
 * Provides secure encryption/decryption for individual database fields
 */
export class FieldLevelEncryption {
  private readonly config = DEFAULT_ENCRYPTION_CONFIG
  private readonly keyCache = new Map<string, { key: Buffer; timestamp: number }>()
  private readonly performanceMetrics = {
    encryptionCount: 0,
    decryptionCount: 0,
    totalEncryptionTime: 0,
    totalDecryptionTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  }

  constructor(
    private readonly masterKey: Buffer,
    private readonly keyVersion: number = 1
  ) {
    if (!masterKey || masterKey.length < 32) {
      throw new Error('Master key must be at least 32 bytes')
    }
  }

  /**
   * Encrypt a field value with comprehensive metadata
   */
  async encryptField(
    value: string,
    config: FieldEncryptionConfig
  ): Promise<FieldEncryptionResult> {
    const startTime = Date.now()
    
    try {
      // Validate input
      if (!value || typeof value !== 'string') {
        throw new EncryptionError('Invalid field value for encryption')
      }

      // Generate cryptographic components
      const salt = crypto.randomBytes(this.config.saltLength)
      const iv = crypto.randomBytes(this.config.ivLength)
      
      // Derive field-specific key
      const fieldKey = await this.deriveFieldKey(config, salt)
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.config.algorithm, fieldKey, iv)
      cipher.setAAD(this.createAAD(config, salt))
      
      // Encrypt data
      let encrypted = cipher.update(value, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      // Get authentication tag
      const tag = cipher.getAuthTag()
      
      // Create encrypted field data
      const encryptedData: EncryptedFieldData = {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        salt: salt.toString('hex'),
        algorithm: this.config.algorithm,
        timestamp: new Date().toISOString(),
        keyVersion: this.keyVersion
      }
      
      // Generate search hash if required
      let searchHash: string | undefined
      if (config.searchable) {
        searchHash = this.generateSearchHash(value, salt)
      }
      
      // Update metrics
      this.performanceMetrics.encryptionCount++
      this.performanceMetrics.totalEncryptionTime += Date.now() - startTime
      
      return {
        success: true,
        encryptedData,
        searchHash,
        keyVersion: this.keyVersion
      }
      
    } catch (error) {
      logger.error('Field encryption failed', { 
        error, 
        field: config.fieldName,
        table: config.tableName 
      })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed',
        keyVersion: this.keyVersion
      }
    }
  }

  /**
   * Decrypt a field value with integrity verification
   */
  async decryptField(
    encryptedData: EncryptedFieldData,
    config: FieldEncryptionConfig
  ): Promise<FieldDecryptionResult> {
    const startTime = Date.now()
    
    try {
      // Validate input
      if (!encryptedData || !encryptedData.encrypted) {
        throw new EncryptionError('Invalid encrypted data for decryption')
      }

      // Convert hex strings back to buffers
      const iv = Buffer.from(encryptedData.iv, 'hex')
      const tag = Buffer.from(encryptedData.tag, 'hex')
      const salt = Buffer.from(encryptedData.salt, 'hex')
      
      // Derive field-specific key
      const fieldKey = await this.deriveFieldKey(config, salt)
      
      // Create decipher
      const decipher = crypto.createDecipheriv(encryptedData.algorithm, fieldKey, iv)
      decipher.setAuthTag(tag)
      decipher.setAAD(this.createAAD(config, salt))
      
      // Decrypt data
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      // Update metrics
      this.performanceMetrics.decryptionCount++
      this.performanceMetrics.totalDecryptionTime += Date.now() - startTime
      
      return {
        success: true,
        decryptedData: decrypted,
        keyVersion: encryptedData.keyVersion || this.keyVersion,
        verified: true
      }
      
    } catch (error) {
      logger.error('Field decryption failed', { 
        error, 
        field: config.fieldName,
        table: config.tableName,
        keyVersion: encryptedData.keyVersion
      })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed',
        keyVersion: encryptedData.keyVersion || this.keyVersion,
        verified: false
      }
    }
  }

  /**
   * Encrypt multiple fields in a record
   */
  async encryptRecord(
    record: Record<string, any>,
    fieldConfigs: FieldEncryptionConfig[]
  ): Promise<{ success: boolean; encryptedRecord?: Record<string, any>; errors?: string[] }> {
    const encryptedRecord = { ...record }
    const errors: string[] = []
    
    for (const config of fieldConfigs) {
      const fieldValue = record[config.fieldName]
      
      if (fieldValue != null && fieldValue !== '') {
        const result = await this.encryptField(String(fieldValue), config)
        
        if (result.success && result.encryptedData) {
          encryptedRecord[config.fieldName] = result.encryptedData
          
          // Add search hash if field is searchable
          if (result.searchHash) {
            encryptedRecord[`${config.fieldName}_search_hash`] = result.searchHash
          }
        } else {
          errors.push(`Failed to encrypt field ${config.fieldName}: ${result.error}`)
          
          if (config.mandatory) {
            return {
              success: false,
              errors: [`Mandatory field encryption failed: ${config.fieldName}`]
            }
          }
        }
      } else if (config.mandatory) {
        errors.push(`Mandatory field ${config.fieldName} is empty`)
      }
    }
    
    return {
      success: errors.length === 0,
      encryptedRecord: errors.length === 0 ? encryptedRecord : undefined,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Decrypt multiple fields in a record
   */
  async decryptRecord(
    encryptedRecord: Record<string, any>,
    fieldConfigs: FieldEncryptionConfig[]
  ): Promise<{ success: boolean; decryptedRecord?: Record<string, any>; errors?: string[] }> {
    const decryptedRecord = { ...encryptedRecord }
    const errors: string[] = []
    
    for (const config of fieldConfigs) {
      const encryptedValue = encryptedRecord[config.fieldName]
      
      if (encryptedValue && typeof encryptedValue === 'object' && encryptedValue.encrypted) {
        const result = await this.decryptField(encryptedValue as EncryptedFieldData, config)
        
        if (result.success && result.decryptedData !== undefined) {
          decryptedRecord[config.fieldName] = result.decryptedData
          
          // Remove search hash field from decrypted record
          delete decryptedRecord[`${config.fieldName}_search_hash`]
        } else {
          errors.push(`Failed to decrypt field ${config.fieldName}: ${result.error}`)
          
          if (config.mandatory) {
            return {
              success: false,
              errors: [`Mandatory field decryption failed: ${config.fieldName}`]
            }
          }
        }
      }
    }
    
    return {
      success: errors.length === 0,
      decryptedRecord: errors.length === 0 ? decryptedRecord : undefined,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Generate search-compatible hash for encrypted fields
   */
  generateSearchHash(value: string, salt: Buffer): string {
    const hmac = crypto.createHmac('sha256', salt)
    hmac.update(value.toLowerCase().trim()) // Normalize for consistent searching
    return hmac.digest('hex')
  }

  /**
   * Create encrypted search query
   */
  createSearchQuery(
    searchTerm: string,
    config: FieldEncryptionConfig
  ): EncryptedSearchQuery {
    const salt = crypto.randomBytes(this.config.saltLength)
    const hashedQuery = this.generateSearchHash(searchTerm, salt)
    
    return {
      field: config.fieldName,
      searchTerm,
      searchType: 'exact',
      hashedQuery,
      salt: salt.toString('hex')
    }
  }

  /**
   * Validate field encryption configuration
   */
  validateFieldConfig(config: FieldEncryptionConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!config.tableName || config.tableName.trim() === '') {
      errors.push('Table name is required')
    }
    
    if (!config.fieldName || config.fieldName.trim() === '') {
      errors.push('Field name is required')
    }
    
    if (!Object.values(EncryptionPurpose).includes(config.encryptionPurpose)) {
      errors.push('Invalid encryption purpose')
    }
    
    if (config.searchable && config.encryptionPurpose === EncryptionPurpose.PATIENT_DATA) {
      errors.push('Patient data fields cannot be configured as searchable for compliance reasons')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get encryption performance metrics
   */
  getPerformanceMetrics() {
    const avgEncryptionTime = this.performanceMetrics.encryptionCount > 0 
      ? this.performanceMetrics.totalEncryptionTime / this.performanceMetrics.encryptionCount 
      : 0
      
    const avgDecryptionTime = this.performanceMetrics.decryptionCount > 0
      ? this.performanceMetrics.totalDecryptionTime / this.performanceMetrics.decryptionCount
      : 0
      
    const cacheHitRate = (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) > 0
      ? this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses)
      : 0
    
    return {
      encryptionCount: this.performanceMetrics.encryptionCount,
      decryptionCount: this.performanceMetrics.decryptionCount,
      avgEncryptionTime,
      avgDecryptionTime,
      cacheHitRate,
      totalOperations: this.performanceMetrics.encryptionCount + this.performanceMetrics.decryptionCount
    }
  }

  /**
   * Clear sensitive data from memory
   */
  clearSensitiveData(): void {
    this.keyCache.clear()
    
    // Reset performance metrics
    Object.keys(this.performanceMetrics).forEach(key => {
      (this.performanceMetrics as any)[key] = 0
    })
    
    logger.info('Sensitive encryption data cleared from memory')
  }

  /**
   * Derive field-specific encryption key
   */
  private async deriveFieldKey(config: FieldEncryptionConfig, salt: Buffer): Promise<Buffer> {
    const cacheKey = `${config.tableName}:${config.fieldName}:${salt.toString('hex')}`
    
    // Check cache first
    const cached = this.keyCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minute cache
      this.performanceMetrics.cacheHits++
      return cached.key
    }
    
    this.performanceMetrics.cacheMisses++
    
    // Create field-specific derivation info
    const derivationInfo = Buffer.concat([
      Buffer.from(config.tableName, 'utf8'),
      Buffer.from(':', 'utf8'),
      Buffer.from(config.fieldName, 'utf8'),
      Buffer.from(':', 'utf8'),
      Buffer.from(config.encryptionPurpose, 'utf8')
    ])
    
    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(
      this.masterKey,
      Buffer.concat([salt, derivationInfo]),
      this.config.iterations,
      32, // 256 bits for AES-256
      'sha512'
    )
    
    // Cache the derived key
    this.keyCache.set(cacheKey, {
      key: derivedKey,
      timestamp: Date.now()
    })
    
    // Clean up old cache entries periodically
    if (this.keyCache.size > 1000) {
      this.cleanupKeyCache()
    }
    
    return derivedKey
  }

  /**
   * Create Additional Authenticated Data (AAD) for GCM mode
   */
  private createAAD(config: FieldEncryptionConfig, salt: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from(config.tableName, 'utf8'),
      Buffer.from(config.fieldName, 'utf8'),
      Buffer.from(String(this.keyVersion), 'utf8'),
      salt
    ])
  }

  /**
   * Clean up expired key cache entries
   */
  private cleanupKeyCache(): void {
    const now = Date.now()
    const expired: string[] = []
    
    this.keyCache.forEach((value, key) => {
      if (now - value.timestamp > 300000) { // 5 minutes
        expired.push(key)
      }
    })
    
    expired.forEach(key => this.keyCache.delete(key))
    
    logger.debug(`Cleaned up ${expired.length} expired key cache entries`)
  }
}

/**
 * Utility functions for field encryption
 */
export class FieldEncryptionUtils {
  /**
   * Create standard field configurations for common admin data types
   */
  static createStandardConfigs(tableName: string): FieldEncryptionConfig[] {
    return [
      {
        tableName,
        fieldName: 'email',
        encryptionPurpose: EncryptionPurpose.ADMIN_DATA,
        mandatory: false,
        searchable: true,
        auditRequired: true
      },
      {
        tableName,
        fieldName: 'phone',
        encryptionPurpose: EncryptionPurpose.ADMIN_DATA,
        mandatory: false,
        searchable: true,
        auditRequired: true
      },
      {
        tableName,
        fieldName: 'notes',
        encryptionPurpose: EncryptionPurpose.ADMIN_DATA,
        mandatory: false,
        searchable: false,
        auditRequired: true
      },
      {
        tableName,
        fieldName: 'api_key',
        encryptionPurpose: EncryptionPurpose.SYSTEM_CONFIG,
        mandatory: true,
        searchable: false,
        auditRequired: true
      },
      {
        tableName,
        fieldName: 'access_token',
        encryptionPurpose: EncryptionPurpose.SYSTEM_CONFIG,
        mandatory: true,
        searchable: false,
        auditRequired: true
      }
    ]
  }

  /**
   * Check if a value appears to be encrypted
   */
  static isEncryptedValue(value: any): value is EncryptedFieldData {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof value.encrypted === 'string' &&
      typeof value.iv === 'string' &&
      typeof value.tag === 'string' &&
      typeof value.salt === 'string' &&
      typeof value.algorithm === 'string'
    )
  }

  /**
   * Estimate storage size impact of encryption
   */
  static estimateStorageImpact(originalSize: number): {
    encryptedSize: number
    overhead: number
    overheadPercentage: number
  } {
    // Base64 encoding increases size by ~33%
    // Plus metadata (IV, tag, salt, algorithm, timestamp, keyVersion)
    const metadataSize = 200 // Estimated metadata size in bytes
    const base64Overhead = Math.ceil(originalSize * 1.33)
    const encryptedSize = base64Overhead + metadataSize
    const overhead = encryptedSize - originalSize
    
    return {
      encryptedSize,
      overhead,
      overheadPercentage: (overhead / originalSize) * 100
    }
  }

  /**
   * Generate secure field configuration
   */
  static generateSecureConfig(
    tableName: string,
    fieldName: string,
    purpose: EncryptionPurpose,
    options: {
      mandatory?: boolean
      searchable?: boolean
      auditRequired?: boolean
    } = {}
  ): FieldEncryptionConfig {
    return {
      tableName: tableName.trim(),
      fieldName: fieldName.trim(),
      encryptionPurpose: purpose,
      mandatory: options.mandatory ?? false,
      searchable: options.searchable ?? false,
      auditRequired: options.auditRequired ?? true
    }
  }
}

/**
 * Factory function to create field encryption instance
 */
export function createFieldEncryption(masterKey?: string): FieldLevelEncryption {
  if (!masterKey) {
    masterKey = process.env.ADMIN_ENCRYPTION_MASTER_KEY
  }
  
  if (!masterKey) {
    throw new Error('Admin encryption master key not configured')
  }
  
  try {
    const keyBuffer = Buffer.from(masterKey, 'hex')
    return new FieldLevelEncryption(keyBuffer)
  } catch (error) {
    throw new Error('Invalid master key format - must be hexadecimal')
  }
}

// Export singleton instance for convenience
let fieldEncryptionInstance: FieldLevelEncryption | null = null

export function getFieldEncryption(): FieldLevelEncryption {
  if (!fieldEncryptionInstance) {
    fieldEncryptionInstance = createFieldEncryption()
  }
  return fieldEncryptionInstance
}