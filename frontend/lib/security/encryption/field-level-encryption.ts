/**
 * Field-Level Encryption for Admin Operations
 * HIPAA-compliant encryption for sensitive healthcare data (PII/PHI)
 * 
 * HIPAA Technical Safeguards Requirements:
 * - Data integrity controls (45 CFR §164.312(c)(1))
 * - Transmission security (45 CFR §164.312(e))
 * - Encryption at rest for sensitive data
 * - Field-level encryption for PII/PHI
 * 
 * Story 1.6 Task 7: Data Encryption for Admin Operations
 */

import * as crypto from 'crypto'
import { logger } from '@/lib/logger'

// Encryption configuration constants
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // GCM recommended IV length (96 bits)
const SALT_LENGTH = 32 // 256 bits
const TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits
const ITERATIONS = 200000 // PBKDF2 iterations (OWASP recommended)

// Sensitive field patterns for auto-detection
const SENSITIVE_FIELD_PATTERNS = [
  /ssn|social.security/i,
  /email/i,
  /phone|tel/i,
  /address|street|city|zip|postal/i,
  /dob|birth|birthday/i,
  /name|first.name|last.name/i,
  /mrn|medical.record/i,
  /diagnosis|condition/i,
  /medication|prescription/i,
  /insurance|policy/i
]

export interface EncryptedFieldResult {
  encrypted: string
  iv: string
  tag: string
  salt: string
  metadata: {
    algorithm: string
    keyVersion: number
    timestamp: number
    fieldType?: string
    encryptionStrength: 'strong' | 'standard'
  }
}

export interface DecryptedFieldResult {
  plaintext: string
  metadata: {
    algorithm: string
    keyVersion: number
    timestamp: number
    fieldType?: string
  }
}

export interface FieldEncryptionOptions {
  fieldType?: 'pii' | 'phi' | 'sensitive' | 'standard'
  keyVersion?: number
  additionalData?: string
  compressionEnabled?: boolean
  encryptionStrength?: 'strong' | 'standard'
}

export interface BulkEncryptionRequest {
  data: Record<string, any>
  sensitiveFields?: string[]
  autoDetect?: boolean
  options?: FieldEncryptionOptions
}

export interface BulkEncryptionResult {
  encryptedData: Record<string, any>
  encryptionMap: Map<string, EncryptedFieldResult>
  statistics: {
    totalFields: number
    encryptedFields: number
    skippedFields: number
    processingTime: number
  }
}

/**
 * Field-Level Encryption Service
 * Provides transparent encryption for sensitive admin data fields
 */
export class FieldLevelEncryption {
  private readonly masterKey: Buffer
  private readonly keyVersion: number = 1
  private readonly encryptionEnabled: boolean

  constructor() {
    this.encryptionEnabled = this.initializeEncryption()
    this.masterKey = this.deriveMasterKey()
  }

  /**
   * Initialize encryption system
   */
  private initializeEncryption(): boolean {
    const encryptionKey = process.env.FIELD_ENCRYPTION_KEY
    const encryptionSalt = process.env.FIELD_ENCRYPTION_SALT

    if (!encryptionKey || !encryptionSalt) {
      logger.warn('Field-level encryption not configured - encryption disabled', {
        context: 'FieldLevelEncryption',
        hasKey: !!encryptionKey,
        hasSalt: !!encryptionSalt
      })
      return false
    }

    return true
  }

  /**
   * Derive master key using PBKDF2
   */
  private deriveMasterKey(): Buffer {
    if (!this.encryptionEnabled) {
      return Buffer.alloc(KEY_LENGTH) // Dummy key for disabled encryption
    }

    try {
      const password = process.env.FIELD_ENCRYPTION_KEY!
      const salt = Buffer.from(process.env.FIELD_ENCRYPTION_SALT!, 'hex')

      return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256')
    } catch (error) {
      logger.error('Failed to derive master key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'FieldLevelEncryption'
      })
      throw new Error('Encryption initialization failed')
    }
  }

  /**
   * Check if encryption is properly configured
   */
  isEncryptionEnabled(): boolean {
    return this.encryptionEnabled
  }

  /**
   * Encrypt a single field value
   */
  encryptField(
    plaintext: string | number | boolean,
    options: FieldEncryptionOptions = {}
  ): EncryptedFieldResult | string {
    if (!this.encryptionEnabled) {
      logger.debug('Encryption disabled - returning plaintext', {
        context: 'FieldLevelEncryption'
      })
      return String(plaintext)
    }

    try {
      const plaintextStr = String(plaintext)
      const {
        fieldType = 'standard',
        keyVersion = this.keyVersion,
        additionalData,
        encryptionStrength = 'strong'
      } = options

      // Generate random IV and salt
      const iv = crypto.randomBytes(IV_LENGTH)
      const salt = crypto.randomBytes(SALT_LENGTH)

      // Derive field-specific key
      const fieldKey = this.deriveFieldKey(salt, fieldType, keyVersion)

      // Create cipher with GCM mode
      const cipher = crypto.createCipher(ALGORITHM, fieldKey, iv)

      // Set additional authenticated data if provided
      if (additionalData) {
        cipher.setAAD(Buffer.from(additionalData, 'utf8'))
      }

      // Encrypt the data
      let encrypted = cipher.update(plaintextStr, 'utf8', 'base64')
      encrypted += cipher.final('base64')

      // Get the authentication tag
      const tag = cipher.getAuthTag()

      const result: EncryptedFieldResult = {
        encrypted,
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        salt: salt.toString('base64'),
        metadata: {
          algorithm: ALGORITHM,
          keyVersion,
          timestamp: Date.now(),
          fieldType,
          encryptionStrength
        }
      }

      logger.debug('Field encrypted successfully', {
        context: 'FieldLevelEncryption',
        fieldType,
        keyVersion,
        encryptionStrength
      })

      return result

    } catch (error) {
      logger.error('Field encryption failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'FieldLevelEncryption'
      })
      throw new Error('Field encryption failed')
    }
  }

  /**
   * Decrypt a single field value
   */
  decryptField(encryptedResult: EncryptedFieldResult | string): DecryptedFieldResult | string {
    if (!this.encryptionEnabled) {
      return String(encryptedResult)
    }

    // Handle plaintext fallback
    if (typeof encryptedResult === 'string') {
      logger.debug('Received plaintext field - returning as-is', {
        context: 'FieldLevelEncryption'
      })
      return encryptedResult
    }

    try {
      const {
        encrypted,
        iv,
        tag,
        salt,
        metadata
      } = encryptedResult

      // Reconstruct encryption parameters
      const ivBuffer = Buffer.from(iv, 'base64')
      const tagBuffer = Buffer.from(tag, 'base64')
      const saltBuffer = Buffer.from(salt, 'base64')

      // Derive field-specific key
      const fieldKey = this.deriveFieldKey(
        saltBuffer,
        metadata.fieldType || 'standard',
        metadata.keyVersion
      )

      // Create decipher
      const decipher = crypto.createDecipher(metadata.algorithm, fieldKey, ivBuffer)
      decipher.setAuthTag(tagBuffer)

      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'base64', 'utf8')
      decrypted += decipher.final('utf8')

      logger.debug('Field decrypted successfully', {
        context: 'FieldLevelEncryption',
        fieldType: metadata.fieldType,
        keyVersion: metadata.keyVersion
      })

      return {
        plaintext: decrypted,
        metadata: {
          algorithm: metadata.algorithm,
          keyVersion: metadata.keyVersion,
          timestamp: metadata.timestamp,
          fieldType: metadata.fieldType
        }
      }

    } catch (error) {
      logger.error('Field decryption failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'FieldLevelEncryption'
      })
      throw new Error('Field decryption failed')
    }
  }

  /**
   * Encrypt multiple fields in bulk
   */
  encryptBulk(request: BulkEncryptionRequest): BulkEncryptionResult {
    const startTime = Date.now()
    const {
      data,
      sensitiveFields = [],
      autoDetect = true,
      options = {}
    } = request

    const encryptedData: Record<string, any> = {}
    const encryptionMap = new Map<string, EncryptedFieldResult>()
    let encryptedFields = 0
    let skippedFields = 0

    // Determine which fields to encrypt
    const fieldsToEncrypt = new Set(sensitiveFields)

    if (autoDetect) {
      Object.keys(data).forEach(key => {
        if (this.isSensitiveField(key)) {
          fieldsToEncrypt.add(key)
        }
      })
    }

    // Process each field
    Object.entries(data).forEach(([key, value]) => {
      if (fieldsToEncrypt.has(key) && value != null) {
        try {
          const fieldOptions = {
            ...options,
            fieldType: this.detectFieldType(key) as any
          }

          const encrypted = this.encryptField(value, fieldOptions)

          if (typeof encrypted === 'object') {
            encryptedData[key] = encrypted
            encryptionMap.set(key, encrypted)
            encryptedFields++
          } else {
            encryptedData[key] = encrypted
            skippedFields++
          }
        } catch (error) {
          logger.warn('Failed to encrypt field, storing plaintext', {
            field: key,
            error: error instanceof Error ? error.message : 'Unknown error',
            context: 'FieldLevelEncryption'
          })
          encryptedData[key] = value
          skippedFields++
        }
      } else {
        encryptedData[key] = value
        skippedFields++
      }
    })

    const processingTime = Date.now() - startTime

    logger.info('Bulk encryption completed', {
      context: 'FieldLevelEncryption',
      totalFields: Object.keys(data).length,
      encryptedFields,
      skippedFields,
      processingTime
    })

    return {
      encryptedData,
      encryptionMap,
      statistics: {
        totalFields: Object.keys(data).length,
        encryptedFields,
        skippedFields,
        processingTime
      }
    }
  }

  /**
   * Decrypt multiple fields in bulk
   */
  decryptBulk(encryptedData: Record<string, any>): Record<string, any> {
    const decryptedData: Record<string, any> = {}

    Object.entries(encryptedData).forEach(([key, value]) => {
      try {
        if (this.isEncryptedField(value)) {
          const decrypted = this.decryptField(value)
          decryptedData[key] = typeof decrypted === 'object' ? decrypted.plaintext : decrypted
        } else {
          decryptedData[key] = value
        }
      } catch (error) {
        logger.warn('Failed to decrypt field, using encrypted value', {
          field: key,
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'FieldLevelEncryption'
        })
        decryptedData[key] = value
      }
    })

    return decryptedData
  }

  /**
   * Derive field-specific encryption key
   */
  private deriveFieldKey(salt: Buffer, fieldType: string, keyVersion: number): Buffer {
    const info = `${fieldType}:${keyVersion}`
    const infoBuffer = Buffer.from(info, 'utf8')

    // Use HKDF for key derivation
    return crypto.hkdfSync('sha256', this.masterKey, salt, infoBuffer, KEY_LENGTH)
  }

  /**
   * Check if a field name suggests sensitive data
   */
  private isSensitiveField(fieldName: string): boolean {
    return SENSITIVE_FIELD_PATTERNS.some(pattern => pattern.test(fieldName))
  }

  /**
   * Detect field type based on field name
   */
  private detectFieldType(fieldName: string): string {
    const name = fieldName.toLowerCase()

    if (name.includes('ssn') || name.includes('social')) return 'pii'
    if (name.includes('medical') || name.includes('diagnosis') || name.includes('medication')) return 'phi'
    if (name.includes('email') || name.includes('phone') || name.includes('address')) return 'pii'
    if (name.includes('name') || name.includes('dob') || name.includes('birth')) return 'pii'

    return 'sensitive'
  }

  /**
   * Check if a value is an encrypted field result
   */
  private isEncryptedField(value: any): value is EncryptedFieldResult {
    return (
      typeof value === 'object' &&
      value !== null &&
      'encrypted' in value &&
      'iv' in value &&
      'tag' in value &&
      'salt' in value &&
      'metadata' in value
    )
  }

  /**
   * Validate encryption configuration
   */
  validateConfiguration(): {
    isValid: boolean
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []

    if (!this.encryptionEnabled) {
      issues.push('Field-level encryption is not configured')
      recommendations.push('Set FIELD_ENCRYPTION_KEY and FIELD_ENCRYPTION_SALT environment variables')
    }

    if (process.env.NODE_ENV === 'production') {
      if (!process.env.FIELD_ENCRYPTION_KEY || process.env.FIELD_ENCRYPTION_KEY.length < 32) {
        issues.push('Encryption key is too short for production use')
        recommendations.push('Use a minimum 256-bit encryption key')
      }

      if (!process.env.FIELD_ENCRYPTION_SALT || process.env.FIELD_ENCRYPTION_SALT.length < 32) {
        issues.push('Encryption salt is too short for production use')
        recommendations.push('Use a minimum 256-bit encryption salt')
      }
    }

    const isValid = issues.length === 0

    logger.info('Encryption configuration validated', {
      context: 'FieldLevelEncryption',
      isValid,
      issueCount: issues.length,
      recommendationCount: recommendations.length
    })

    return { isValid, issues, recommendations }
  }

  /**
   * Get encryption statistics
   */
  getEncryptionStats(): {
    isEnabled: boolean
    keyVersion: number
    algorithm: string
    keyLength: number
    iterationCount: number
    lastValidated: Date
  } {
    return {
      isEnabled: this.encryptionEnabled,
      keyVersion: this.keyVersion,
      algorithm: ALGORITHM,
      keyLength: KEY_LENGTH,
      iterationCount: ITERATIONS,
      lastValidated: new Date()
    }
  }

  /**
   * Test encryption system integrity
   */
  async testIntegrity(): Promise<boolean> {
    if (!this.encryptionEnabled) {
      logger.warn('Cannot test integrity - encryption disabled')
      return false
    }

    try {
      const testData = 'Test field encryption integrity check'
      const encrypted = this.encryptField(testData, { fieldType: 'pii' })

      if (typeof encrypted === 'string') {
        throw new Error('Encryption returned plaintext')
      }

      const decrypted = this.decryptField(encrypted)
      const plaintextResult = typeof decrypted === 'object' ? decrypted.plaintext : decrypted

      if (plaintextResult !== testData) {
        throw new Error('Decryption integrity check failed')
      }

      // Test bulk encryption
      const bulkData = {
        email: 'test@example.com',
        ssn: '123-45-6789',
        name: 'Test User',
        description: 'Non-sensitive field'
      }

      const bulkResult = this.encryptBulk({ 
        data: bulkData, 
        autoDetect: true 
      })

      const bulkDecrypted = this.decryptBulk(bulkResult.encryptedData)

      if (bulkDecrypted.email !== bulkData.email ||
          bulkDecrypted.ssn !== bulkData.ssn ||
          bulkDecrypted.name !== bulkData.name) {
        throw new Error('Bulk encryption integrity check failed')
      }

      logger.info('Field-level encryption integrity test passed')
      return true

    } catch (error) {
      logger.error('Field-level encryption integrity test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'FieldLevelEncryption'
      })
      return false
    }
  }
}

// Export singleton instance
export const fieldLevelEncryption = new FieldLevelEncryption()

// Export class for custom instances
export { FieldLevelEncryption as default }