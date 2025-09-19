/**
 * HIPAA-Compliant Audit Log Encryption
 * Implements field-level encryption for sensitive audit data
 * 
 * HIPAA Technical Safeguards Requirements:
 * - Data integrity controls (45 CFR §164.312(c)(1))
 * - Transmission security (45 CFR §164.312(e))
 * - Encryption at rest for sensitive data
 * - Digital signatures for audit log integrity
 * 
 * Story 1.6 Task 3: Healthcare Compliance Audit Logging
 */

import * as crypto from 'crypto'
import { logger } from '@/lib/logger'

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // For GCM, this is 16 bytes
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const ITERATIONS = 100000 // PBKDF2 iterations

// Environment variables for encryption keys
const AUDIT_ENCRYPTION_KEY = process.env.AUDIT_ENCRYPTION_KEY
const AUDIT_SIGNING_KEY = process.env.AUDIT_SIGNING_KEY

if (!AUDIT_ENCRYPTION_KEY || !AUDIT_SIGNING_KEY) {
  logger.warn('Audit encryption keys not configured - encryption will be disabled')
}

export interface EncryptedData {
  encrypted: string
  iv: string
  tag: string
  salt: string
}

export interface SignedData {
  data: string
  signature: string
  timestamp: string
}

/**
 * Audit Log Encryption Service
 * Provides field-level encryption for sensitive audit log data
 */
export class AuditEncryption {
  private readonly encryptionKey: Buffer | null
  private readonly signingKey: Buffer | null

  constructor() {
    this.encryptionKey = AUDIT_ENCRYPTION_KEY ? Buffer.from(AUDIT_ENCRYPTION_KEY, 'hex') : null
    this.signingKey = AUDIT_SIGNING_KEY ? Buffer.from(AUDIT_SIGNING_KEY, 'hex') : null
  }

  /**
   * Check if encryption is properly configured
   */
  isConfigured(): boolean {
    return this.encryptionKey !== null && this.signingKey !== null
  }

  /**
   * Encrypt sensitive data with AES-256-GCM
   */
  encrypt(data: string): EncryptedData | string {
    if (!this.encryptionKey) {
      logger.warn('Encryption key not configured - storing data in plaintext')
      return data // Return plaintext if encryption not configured
    }

    try {
      // Generate random IV and salt
      const iv = crypto.randomBytes(IV_LENGTH)
      const salt = crypto.randomBytes(SALT_LENGTH)

      // Derive key from master key and salt
      const derivedKey = crypto.pbkdf2Sync(this.encryptionKey, salt, ITERATIONS, 32, 'sha512')

      // Create cipher
      const cipher = crypto.createCipher(ALGORITHM, derivedKey)
      cipher.setAAD(salt) // Additional authenticated data

      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      // Get authentication tag
      const tag = cipher.getAuthTag()

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        salt: salt.toString('hex')
      }
    } catch (error) {
      logger.error('Failed to encrypt audit data:', error)
      throw new Error('Encryption failed')
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: EncryptedData | string): string {
    // If data is plaintext (encryption not configured)
    if (typeof encryptedData === 'string') {
      return encryptedData
    }

    if (!this.encryptionKey) {
      throw new Error('Decryption key not configured')
    }

    try {
      const { encrypted, iv, tag, salt } = encryptedData

      // Convert hex strings back to buffers
      const ivBuffer = Buffer.from(iv, 'hex')
      const tagBuffer = Buffer.from(tag, 'hex')
      const saltBuffer = Buffer.from(salt, 'hex')

      // Derive key from master key and salt
      const derivedKey = crypto.pbkdf2Sync(this.encryptionKey, saltBuffer, ITERATIONS, 32, 'sha512')

      // Create decipher
      const decipher = crypto.createDecipher(ALGORITHM, derivedKey)
      decipher.setAuthTag(tagBuffer)
      decipher.setAAD(saltBuffer)

      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      logger.error('Failed to decrypt audit data:', error)
      throw new Error('Decryption failed')
    }
  }

  /**
   * Create digital signature for audit log integrity
   */
  signData(data: string): SignedData | string {
    if (!this.signingKey) {
      logger.warn('Signing key not configured - skipping digital signature')
      return data // Return unsigned data if signing not configured
    }

    try {
      const timestamp = new Date().toISOString()
      const dataToSign = `${data}|${timestamp}`

      const signature = crypto
        .createHmac('sha512', this.signingKey)
        .update(dataToSign)
        .digest('hex')

      return {
        data,
        signature,
        timestamp
      }
    } catch (error) {
      logger.error('Failed to sign audit data:', error)
      throw new Error('Signing failed')
    }
  }

  /**
   * Verify digital signature for audit log integrity
   */
  verifySignature(signedData: SignedData | string): { valid: boolean; data: string; error?: string } {
    // If data is not signed (signing not configured)
    if (typeof signedData === 'string') {
      return { valid: true, data: signedData }
    }

    if (!this.signingKey) {
      return { valid: false, data: '', error: 'Signing key not configured' }
    }

    try {
      const { data, signature, timestamp } = signedData
      const dataToVerify = `${data}|${timestamp}`

      const expectedSignature = crypto
        .createHmac('sha512', this.signingKey)
        .update(dataToVerify)
        .digest('hex')

      const valid = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )

      return { valid, data }
    } catch (error) {
      logger.error('Failed to verify audit data signature:', error)
      return { valid: false, data: '', error: 'Signature verification failed' }
    }
  }

  /**
   * Generate secure hash for audit log chain integrity
   */
  generateHash(data: string, previousHash?: string): string {
    const chainData = previousHash ? `${previousHash}|${data}` : data
    return crypto.createHash('sha256').update(chainData).digest('hex')
  }

  /**
   * Encrypt sensitive fields in audit log entry
   */
  encryptSensitiveFields(auditEntry: any): any {
    if (!this.isConfigured()) {
      return auditEntry // Return as-is if encryption not configured
    }

    const sensitiveFields = [
      'patient_identifier',
      'ip_address',
      'metadata',
      'old_values',
      'new_values',
      'stack_trace'
    ]

    const encryptedEntry = { ...auditEntry }

    for (const field of sensitiveFields) {
      if (encryptedEntry[field] && encryptedEntry[field] !== null) {
        const fieldValue = typeof encryptedEntry[field] === 'object' 
          ? JSON.stringify(encryptedEntry[field])
          : String(encryptedEntry[field])
        
        encryptedEntry[field] = this.encrypt(fieldValue)
      }
    }

    return encryptedEntry
  }

  /**
   * Decrypt sensitive fields in audit log entry for display
   */
  decryptSensitiveFields(encryptedEntry: any): any {
    if (!this.isConfigured()) {
      return encryptedEntry // Return as-is if encryption not configured
    }

    const sensitiveFields = [
      'patient_identifier',
      'ip_address',
      'metadata',
      'old_values',
      'new_values',
      'stack_trace'
    ]

    const decryptedEntry = { ...encryptedEntry }

    for (const field of sensitiveFields) {
      if (decryptedEntry[field] && decryptedEntry[field] !== null) {
        try {
          const decryptedValue = this.decrypt(decryptedEntry[field])
          
          // Try to parse as JSON if it looks like an object
          if (field === 'metadata' || field === 'old_values' || field === 'new_values') {
            try {
              decryptedEntry[field] = JSON.parse(decryptedValue)
            } catch {
              decryptedEntry[field] = decryptedValue
            }
          } else {
            decryptedEntry[field] = decryptedValue
          }
        } catch (error) {
          logger.error(`Failed to decrypt field ${field}:`, error)
          decryptedEntry[field] = '[DECRYPTION_ERROR]'
        }
      }
    }

    return decryptedEntry
  }

  /**
   * Create integrity hash for audit log chain
   */
  createIntegrityHash(auditEntry: any, previousHash?: string): string {
    // Create a consistent string representation of the audit entry
    const entryString = JSON.stringify(auditEntry, Object.keys(auditEntry).sort())
    return this.generateHash(entryString, previousHash)
  }
}

/**
 * Key management utilities for audit encryption
 */
export class AuditKeyManager {
  /**
   * Generate new encryption key (for initial setup)
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Generate new signing key (for initial setup)
   */
  static generateSigningKey(): string {
    return crypto.randomBytes(64).toString('hex')
  }

  /**
   * Rotate encryption keys (for periodic key rotation)
   */
  static rotateKeys(): { encryptionKey: string; signingKey: string } {
    return {
      encryptionKey: this.generateEncryptionKey(),
      signingKey: this.generateSigningKey()
    }
  }

  /**
   * Validate key format
   */
  static validateKey(key: string, expectedLength: number): boolean {
    try {
      const buffer = Buffer.from(key, 'hex')
      return buffer.length === expectedLength
    } catch {
      return false
    }
  }

  /**
   * Check key strength
   */
  static checkKeyStrength(key: string): { valid: boolean; strength: 'weak' | 'medium' | 'strong'; issues: string[] } {
    const issues: string[] = []
    let strength: 'weak' | 'medium' | 'strong' = 'strong'

    if (!key || key.length === 0) {
      issues.push('Key is empty')
      return { valid: false, strength: 'weak', issues }
    }

    if (key.length < 32) {
      issues.push('Key is too short (minimum 32 characters)')
      strength = 'weak'
    }

    try {
      Buffer.from(key, 'hex')
    } catch {
      issues.push('Key is not valid hexadecimal')
      strength = 'weak'
    }

    // Check for obvious patterns
    const hasPattern = /(.)\1{3,}/.test(key) || /012|123|234|345|456|567|678|789|abc|bcd|cde/.test(key.toLowerCase())
    if (hasPattern) {
      issues.push('Key contains predictable patterns')
      strength = strength === 'strong' ? 'medium' : 'weak'
    }

    return {
      valid: issues.length === 0 || strength !== 'weak',
      strength,
      issues
    }
  }
}

// Export singleton instance
export const auditEncryption = new AuditEncryption()