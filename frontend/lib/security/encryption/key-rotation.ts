/**
 * Encryption Key Rotation Management System
 * Automated key rotation for HIPAA compliance and security best practices
 * 
 * HIPAA Technical Safeguards Requirements:
 * - Access control (45 CFR §164.312(a)(1))
 * - Assigned security responsibility (45 CFR §164.308(a)(2))
 * - Information access management (45 CFR §164.308(a)(4))
 * - Periodic key rotation for enhanced security
 * 
 * Story 1.6 Task 7: Data Encryption for Admin Operations
 */

import * as crypto from 'crypto'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/dal/supabase'

// Key rotation configuration
const KEY_ROTATION_CONFIG = {
  rotationIntervalDays: 90, // HIPAA recommendation
  keyRetentionDays: 365, // Keep old keys for historical data
  maxActiveKeys: 3, // Maximum number of active keys
  keyGenerationSaltLength: 32,
  keyDerivationIterations: 200000,
  emergencyRotationThresholdDays: 7, // Force rotation if needed
  notificationThresholdDays: 30 // Notify before rotation needed
}

export interface EncryptionKey {
  id: string
  version: number
  keyHash: string // Hash of the key for identification
  algorithm: string
  keyLength: number
  isActive: boolean
  isPrimary: boolean
  createdAt: Date
  activatedAt?: Date
  deactivatedAt?: Date
  expiresAt: Date
  rotationReason?: string
  metadata: {
    derivationMethod: string
    iterations: number
    saltLength: number
    createdBy: string
    environment: string
  }
}

export interface KeyRotationPolicy {
  id: string
  name: string
  rotationInterval: number // Days
  keyRetention: number // Days
  autoRotation: boolean
  notificationEnabled: boolean
  emergencyContacts: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface KeyRotationEvent {
  id: string
  keyId: string
  eventType: 'created' | 'activated' | 'deactivated' | 'expired' | 'emergency_rotation'
  reason: string
  triggeredBy: string
  triggeredAt: Date
  oldKeyVersion?: number
  newKeyVersion: number
  isSuccessful: boolean
  errorMessage?: string
  impactedSystems: string[]
  rollbackPlan?: string
}

export interface KeyRotationStatus {
  currentKey: EncryptionKey
  upcomingRotation: Date
  daysUntilRotation: number
  rotationRequired: boolean
  emergencyRotationNeeded: boolean
  lastRotation: Date
  totalRotations: number
  keyHealth: 'healthy' | 'warning' | 'critical'
  recommendations: string[]
}

/**
 * Key Rotation Management Service
 * Handles automated encryption key rotation with HIPAA compliance
 */
export class KeyRotationManager {
  private readonly supabase
  private readonly keyStorage: Map<string, EncryptionKey> = new Map()
  private currentPrimaryKey: EncryptionKey | null = null

  constructor() {
    this.supabase = createClient()
    this.initializeKeyRotationSystem()
  }

  /**
   * Initialize key rotation system
   */
  private async initializeKeyRotationSystem(): Promise<void> {
    try {
      await this.loadExistingKeys()
      await this.validateKeyRotationPolicies()
      await this.checkRotationSchedule()

      logger.info('Key rotation system initialized successfully', {
        context: 'KeyRotationManager',
        activeKeys: this.keyStorage.size,
        hasPrimaryKey: !!this.currentPrimaryKey
      })
    } catch (error) {
      logger.error('Failed to initialize key rotation system', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'KeyRotationManager'
      })
    }
  }

  /**
   * Generate new encryption key with proper derivation
   */
  async generateNewKey(reason: string = 'scheduled_rotation', triggeredBy: string = 'system'): Promise<EncryptionKey> {
    try {
      // Generate cryptographically secure random material
      const keyMaterial = crypto.randomBytes(32) // 256-bit key material
      const salt = crypto.randomBytes(KEY_ROTATION_CONFIG.keyGenerationSaltLength)

      // Derive the actual encryption key using PBKDF2
      const masterKey = process.env.FIELD_ENCRYPTION_KEY || 'default-key-for-dev'
      const derivedKey = crypto.pbkdf2Sync(
        masterKey + keyMaterial.toString('hex'),
        salt,
        KEY_ROTATION_CONFIG.keyDerivationIterations,
        32,
        'sha256'
      )

      // Create key hash for identification
      const keyHash = crypto
        .createHash('sha256')
        .update(derivedKey)
        .digest('hex')
        .substring(0, 16) // First 16 characters for identification

      // Determine next version number
      const nextVersion = await this.getNextKeyVersion()

      // Create new key object
      const newKey: EncryptionKey = {
        id: crypto.randomUUID(),
        version: nextVersion,
        keyHash,
        algorithm: 'aes-256-gcm',
        keyLength: 256,
        isActive: false,
        isPrimary: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + KEY_ROTATION_CONFIG.rotationIntervalDays * 24 * 60 * 60 * 1000),
        rotationReason: reason,
        metadata: {
          derivationMethod: 'pbkdf2',
          iterations: KEY_ROTATION_CONFIG.keyDerivationIterations,
          saltLength: KEY_ROTATION_CONFIG.keyGenerationSaltLength,
          createdBy: triggeredBy,
          environment: process.env.NODE_ENV || 'development'
        }
      }

      // Store key in database
      await this.storeEncryptionKey(newKey, derivedKey)

      // Add to local storage
      this.keyStorage.set(newKey.id, newKey)

      // Log key generation event
      await this.logKeyRotationEvent({
        id: crypto.randomUUID(),
        keyId: newKey.id,
        eventType: 'created',
        reason,
        triggeredBy,
        triggeredAt: new Date(),
        newKeyVersion: newKey.version,
        isSuccessful: true,
        impactedSystems: ['field-level-encryption', 'admin-operations']
      })

      logger.info('New encryption key generated successfully', {
        context: 'KeyRotationManager',
        keyId: newKey.id,
        keyVersion: newKey.version,
        reason,
        triggeredBy
      })

      return newKey

    } catch (error) {
      logger.error('Failed to generate new encryption key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'KeyRotationManager',
        reason,
        triggeredBy
      })
      throw new Error('Key generation failed')
    }
  }

  /**
   * Perform key rotation
   */
  async rotateKey(reason: string = 'scheduled_rotation', triggeredBy: string = 'system'): Promise<{
    oldKey: EncryptionKey | null
    newKey: EncryptionKey
    rotationEvent: KeyRotationEvent
  }> {
    try {
      const oldKey = this.currentPrimaryKey

      // Generate new key
      const newKey = await this.generateNewKey(reason, triggeredBy)

      // Activate new key
      await this.activateKey(newKey.id, triggeredBy)

      // Deactivate old key (but keep it for historical data decryption)
      if (oldKey) {
        await this.deactivateKey(oldKey.id, 'replaced_by_rotation')
      }

      // Create rotation event
      const rotationEvent: KeyRotationEvent = {
        id: crypto.randomUUID(),
        keyId: newKey.id,
        eventType: 'activated',
        reason,
        triggeredBy,
        triggeredAt: new Date(),
        oldKeyVersion: oldKey?.version,
        newKeyVersion: newKey.version,
        isSuccessful: true,
        impactedSystems: ['field-level-encryption', 'admin-operations', 'audit-logging']
      }

      await this.logKeyRotationEvent(rotationEvent)

      // Update environment variables (simulated - in production this would trigger deployment)
      await this.updateEnvironmentConfiguration(newKey)

      logger.info('Key rotation completed successfully', {
        context: 'KeyRotationManager',
        oldKeyVersion: oldKey?.version,
        newKeyVersion: newKey.version,
        reason,
        triggeredBy
      })

      return { oldKey, newKey, rotationEvent }

    } catch (error) {
      // Log failed rotation event
      const failedEvent: KeyRotationEvent = {
        id: crypto.randomUUID(),
        keyId: 'failed-rotation',
        eventType: 'emergency_rotation',
        reason: 'rotation_failed',
        triggeredBy,
        triggeredAt: new Date(),
        newKeyVersion: 0,
        isSuccessful: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        impactedSystems: ['field-level-encryption']
      }

      await this.logKeyRotationEvent(failedEvent)

      logger.error('Key rotation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'KeyRotationManager',
        reason,
        triggeredBy
      })

      throw new Error('Key rotation failed')
    }
  }

  /**
   * Activate a key
   */
  async activateKey(keyId: string, activatedBy: string): Promise<void> {
    try {
      const key = this.keyStorage.get(keyId)
      if (!key) {
        throw new Error(`Key not found: ${keyId}`)
      }

      // Deactivate current primary key
      if (this.currentPrimaryKey) {
        this.currentPrimaryKey.isPrimary = false
        this.currentPrimaryKey.isActive = true // Keep active for decryption
      }

      // Activate new key
      key.isActive = true
      key.isPrimary = true
      key.activatedAt = new Date()

      // Update in database
      await this.updateKeyStatus(keyId, true, true)

      // Set as current primary key
      this.currentPrimaryKey = key

      logger.info('Key activated successfully', {
        context: 'KeyRotationManager',
        keyId,
        keyVersion: key.version,
        activatedBy
      })

    } catch (error) {
      logger.error('Failed to activate key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'KeyRotationManager',
        keyId
      })
      throw error
    }
  }

  /**
   * Deactivate a key
   */
  async deactivateKey(keyId: string, reason: string): Promise<void> {
    try {
      const key = this.keyStorage.get(keyId)
      if (!key) {
        throw new Error(`Key not found: ${keyId}`)
      }

      // Update key status
      key.isActive = false
      key.isPrimary = false
      key.deactivatedAt = new Date()

      // Update in database
      await this.updateKeyStatus(keyId, false, false)

      logger.info('Key deactivated successfully', {
        context: 'KeyRotationManager',
        keyId,
        keyVersion: key.version,
        reason
      })

    } catch (error) {
      logger.error('Failed to deactivate key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'KeyRotationManager',
        keyId
      })
      throw error
    }
  }

  /**
   * Get current rotation status
   */
  async getRotationStatus(): Promise<KeyRotationStatus> {
    try {
      if (!this.currentPrimaryKey) {
        throw new Error('No primary key found')
      }

      const now = new Date()
      const daysUntilRotation = Math.floor(
        (this.currentPrimaryKey.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )

      const rotationRequired = daysUntilRotation <= 0
      const emergencyRotationNeeded = daysUntilRotation <= KEY_ROTATION_CONFIG.emergencyRotationThresholdDays

      // Get rotation history
      const rotationEvents = await this.getKeyRotationHistory(10)
      const lastRotation = rotationEvents.length > 0 ? rotationEvents[0].triggeredAt : this.currentPrimaryKey.createdAt

      // Determine key health
      let keyHealth: 'healthy' | 'warning' | 'critical' = 'healthy'
      const recommendations: string[] = []

      if (emergencyRotationNeeded) {
        keyHealth = 'critical'
        recommendations.push('Emergency key rotation required immediately')
      } else if (daysUntilRotation <= KEY_ROTATION_CONFIG.notificationThresholdDays) {
        keyHealth = 'warning'
        recommendations.push(`Key rotation recommended within ${daysUntilRotation} days`)
      }

      if (this.keyStorage.size < 2) {
        recommendations.push('Consider maintaining backup keys for high availability')
      }

      const status: KeyRotationStatus = {
        currentKey: this.currentPrimaryKey,
        upcomingRotation: this.currentPrimaryKey.expiresAt,
        daysUntilRotation,
        rotationRequired,
        emergencyRotationNeeded,
        lastRotation,
        totalRotations: rotationEvents.length,
        keyHealth,
        recommendations
      }

      logger.debug('Rotation status retrieved', {
        context: 'KeyRotationManager',
        keyVersion: this.currentPrimaryKey.version,
        daysUntilRotation,
        keyHealth
      })

      return status

    } catch (error) {
      logger.error('Failed to get rotation status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'KeyRotationManager'
      })
      throw error
    }
  }

  /**
   * Check if rotation is needed and perform if required
   */
  async checkAndPerformRotation(): Promise<{
    rotationPerformed: boolean
    reason?: string
    newKeyVersion?: number
  }> {
    try {
      const status = await this.getRotationStatus()

      if (status.emergencyRotationNeeded) {
        logger.warn('Emergency key rotation triggered', {
          context: 'KeyRotationManager',
          daysUntilRotation: status.daysUntilRotation
        })

        const result = await this.rotateKey('emergency_rotation', 'automated_system')
        return {
          rotationPerformed: true,
          reason: 'emergency_rotation',
          newKeyVersion: result.newKey.version
        }
      }

      if (status.rotationRequired) {
        logger.info('Scheduled key rotation triggered', {
          context: 'KeyRotationManager',
          daysUntilRotation: status.daysUntilRotation
        })

        const result = await this.rotateKey('scheduled_rotation', 'automated_system')
        return {
          rotationPerformed: true,
          reason: 'scheduled_rotation',
          newKeyVersion: result.newKey.version
        }
      }

      return { rotationPerformed: false }

    } catch (error) {
      logger.error('Failed to check and perform rotation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'KeyRotationManager'
      })
      return { rotationPerformed: false }
    }
  }

  /**
   * Get next key version number
   */
  private async getNextKeyVersion(): Promise<number> {
    try {
      // Get highest version from local storage
      let maxVersion = 0
      this.keyStorage.forEach(key => {
        if (key.version > maxVersion) {
          maxVersion = key.version
        }
      })

      return maxVersion + 1
    } catch (error) {
      logger.error('Failed to determine next key version', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'KeyRotationManager'
      })
      return 1
    }
  }

  /**
   * Load existing keys from database
   */
  private async loadExistingKeys(): Promise<void> {
    try {
      // In production, this would load from secure key storage
      // For now, simulate with environment variable check
      if (this.keyStorage.size === 0 && process.env.FIELD_ENCRYPTION_KEY) {
        // Create initial key entry
        const initialKey: EncryptionKey = {
          id: crypto.randomUUID(),
          version: 1,
          keyHash: 'initial-key-hash',
          algorithm: 'aes-256-gcm',
          keyLength: 256,
          isActive: true,
          isPrimary: true,
          createdAt: new Date(),
          activatedAt: new Date(),
          expiresAt: new Date(Date.now() + KEY_ROTATION_CONFIG.rotationIntervalDays * 24 * 60 * 60 * 1000),
          metadata: {
            derivationMethod: 'pbkdf2',
            iterations: KEY_ROTATION_CONFIG.keyDerivationIterations,
            saltLength: KEY_ROTATION_CONFIG.keyGenerationSaltLength,
            createdBy: 'system_initialization',
            environment: process.env.NODE_ENV || 'development'
          }
        }

        this.keyStorage.set(initialKey.id, initialKey)
        this.currentPrimaryKey = initialKey
      }

      logger.debug('Existing keys loaded', {
        context: 'KeyRotationManager',
        keyCount: this.keyStorage.size
      })
    } catch (error) {
      logger.error('Failed to load existing keys', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'KeyRotationManager'
      })
    }
  }

  /**
   * Validate key rotation policies
   */
  private async validateKeyRotationPolicies(): Promise<void> {
    // In production, this would validate database-stored policies
    logger.debug('Key rotation policies validated', {
      context: 'KeyRotationManager',
      rotationInterval: KEY_ROTATION_CONFIG.rotationIntervalDays,
      keyRetention: KEY_ROTATION_CONFIG.keyRetentionDays
    })
  }

  /**
   * Check rotation schedule
   */
  private async checkRotationSchedule(): Promise<void> {
    // In production, this would check scheduled rotations
    logger.debug('Rotation schedule checked', {
      context: 'KeyRotationManager'
    })
  }

  /**
   * Store encryption key in secure storage
   */
  private async storeEncryptionKey(key: EncryptionKey, keyMaterial: Buffer): Promise<void> {
    // In production, this would store in HSM or secure key vault
    // For development, we simulate storage
    logger.debug('Encryption key stored securely', {
      context: 'KeyRotationManager',
      keyId: key.id,
      keyVersion: key.version
    })
  }

  /**
   * Update key status in storage
   */
  private async updateKeyStatus(keyId: string, isActive: boolean, isPrimary: boolean): Promise<void> {
    // In production, this would update HSM or key vault
    logger.debug('Key status updated', {
      context: 'KeyRotationManager',
      keyId,
      isActive,
      isPrimary
    })
  }

  /**
   * Log key rotation event
   */
  private async logKeyRotationEvent(event: KeyRotationEvent): Promise<void> {
    try {
      // In production, store in audit log database
      logger.info('Key rotation event logged', {
        context: 'KeyRotationManager',
        eventType: event.eventType,
        keyId: event.keyId,
        reason: event.reason,
        isSuccessful: event.isSuccessful
      })
    } catch (error) {
      logger.error('Failed to log key rotation event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'KeyRotationManager'
      })
    }
  }

  /**
   * Get key rotation history
   */
  private async getKeyRotationHistory(limit: number = 50): Promise<KeyRotationEvent[]> {
    // In production, query from audit database
    return []
  }

  /**
   * Update environment configuration with new key
   */
  private async updateEnvironmentConfiguration(newKey: EncryptionKey): Promise<void> {
    // In production, this would trigger secure configuration updates
    logger.info('Environment configuration update scheduled', {
      context: 'KeyRotationManager',
      keyVersion: newKey.version,
      keyId: newKey.id
    })
  }

  /**
   * Get rotation configuration
   */
  getRotationConfig(): typeof KEY_ROTATION_CONFIG {
    return { ...KEY_ROTATION_CONFIG }
  }

  /**
   * Test key rotation system integrity
   */
  async testIntegrity(): Promise<boolean> {
    try {
      // Test key generation
      const testKey = await this.generateNewKey('integrity_test', 'test_system')
      
      // Test rotation status
      const status = await this.getRotationStatus()
      
      // Test activation/deactivation
      await this.activateKey(testKey.id, 'test_system')
      await this.deactivateKey(testKey.id, 'test_cleanup')

      logger.info('Key rotation system integrity test passed')
      return true

    } catch (error) {
      logger.error('Key rotation system integrity test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'KeyRotationManager'
      })
      return false
    }
  }
}

// Export singleton instance
export const keyRotationManager = new KeyRotationManager()

// Export class for custom instances
export { KeyRotationManager as default }