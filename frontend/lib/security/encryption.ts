/**
 * Standard Encryption and Data Protection
 * Secure encryption for sensitive application data
 */

// Dynamic imports for Edge Runtime compatibility
let crypto: any
let bcrypt: any

// Initialize crypto modules based on environment
if (typeof window === 'undefined') {
  try {
    crypto = require('crypto')
    bcrypt = require('bcryptjs')
  } catch (e) {
    // Edge Runtime fallbacks will be used
    console.warn('Native crypto modules not available, using fallbacks')
  }
}
import { logger } from '@/lib/logger'

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 16,  // 128 bits
  tagLength: 16, // 128 bits
  saltLength: 32, // 256 bits
  iterations: 100000, // PBKDF2 iterations
  bcryptRounds: 12 // bcrypt salt rounds
}

export interface EncryptionResult {
  encrypted: string
  iv: string
  tag: string
  salt?: string
}

export interface EncryptionOptions {
  useRandomKey?: boolean
  includeMetadata?: boolean
  compressionLevel?: number
}

export interface KeyDerivationOptions {
  salt?: Buffer
  iterations?: number
  keyLength?: number
}

class StandardEncryption {
  private masterKey: Buffer | null = null
  private keyRotationVersion: number = 1
  private initialized: boolean = false
  private keyExpirationTime: number = 90 * 24 * 60 * 60 * 1000 // 90 days
  private lastKeyRotation: Date | null = null

  constructor() {
    // Don't initialize master key in constructor to avoid build-time errors
  }

  /**
   * Initialize master key from environment with proper key derivation
   */
  private initializeMasterKey(): void {
    if (this.initialized) {
      return
    }

    // Skip initialization in Edge Runtime
    if (!crypto || typeof process === 'undefined') {
      console.warn('Skipping encryption initialization in Edge Runtime')
      this.initialized = true
      return
    }

    try {
      // In production, require multiple key components for defense in depth
      const keyComponent1 = process.env.ENCRYPTION_KEY_COMPONENT_1
      const keyComponent2 = process.env.ENCRYPTION_KEY_COMPONENT_2
      const keySalt = process.env.ENCRYPTION_KEY_SALT
      
      if (process.env.NODE_ENV === 'production') {
        if (!keyComponent1 || !keyComponent2 || !keySalt) {
          throw new Error('All encryption key components must be set in production')
        }
        
        // Derive master key from components using PBKDF2
        const combinedKey = keyComponent1 + keyComponent2
        this.masterKey = crypto.pbkdf2Sync(
          combinedKey,
          keySalt,
          ENCRYPTION_CONFIG.iterations,
          ENCRYPTION_CONFIG.keyLength,
          'sha256'
        )
        
        // Track key rotation metadata
        const keyRotationDate = process.env.ENCRYPTION_KEY_ROTATION_DATE
        if (keyRotationDate) {
          this.lastKeyRotation = new Date(keyRotationDate)
          this.keyRotationVersion = parseInt(process.env.ENCRYPTION_KEY_VERSION || '1', 10)
        }
        
        // Check if key rotation is needed
        if (this.isKeyRotationNeeded()) {
          logger.warn('Encryption key rotation is recommended', {
            lastRotation: this.lastKeyRotation,
            daysSinceRotation: this.getDaysSinceRotation()
          })
        }
      } else {
        // Development mode - use simpler key generation
        const devKey = process.env.ENCRYPTION_MASTER_KEY || 'dev-key-do-not-use-in-production'
        const salt = Buffer.from('dev-salt', 'utf8')
        
        this.masterKey = crypto.pbkdf2Sync(
          devKey,
          salt,
          1000, // Fewer iterations for dev
          ENCRYPTION_CONFIG.keyLength,
          'sha256'
        )
        
        logger.info('Using development encryption key')
      }
      
      this.initialized = true
    } catch (error) {
      logger.error('Failed to initialize master key:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }

  /**
   * Check if key rotation is needed
   */
  private isKeyRotationNeeded(): boolean {
    if (!this.lastKeyRotation) {
      return true
    }
    
    const daysSinceRotation = this.getDaysSinceRotation()
    return daysSinceRotation > 90 // Rotate every 90 days
  }

  /**
   * Get days since last key rotation
   */
  private getDaysSinceRotation(): number {
    if (!this.lastKeyRotation) {
      return Infinity
    }
    
    const msPerDay = 24 * 60 * 60 * 1000
    const msSinceRotation = Date.now() - this.lastKeyRotation.getTime()
    return Math.floor(msSinceRotation / msPerDay)
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  encrypt(data: string | Buffer, options: EncryptionOptions = {}): EncryptionResult {
    try {
      // Initialize master key if not already done
      this.initializeMasterKey()
      
      if (!this.masterKey) {
        throw new Error('Master key not initialized')
      }

      // Convert string to buffer
      const plaintext = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8')

      // Generate random IV
      const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength)
      
      // Use master key or derive new key
      let encryptionKey: Buffer
      let salt: Buffer | undefined

      if (options.useRandomKey) {
        // Derive a unique key using PBKDF2
        salt = crypto.randomBytes(ENCRYPTION_CONFIG.saltLength)
        encryptionKey = crypto.pbkdf2Sync(
          this.masterKey,
          salt,
          ENCRYPTION_CONFIG.iterations,
          ENCRYPTION_CONFIG.keyLength,
          'sha256'
        )
      } else {
        encryptionKey = this.masterKey
      }

      // Create cipher
      const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.algorithm, encryptionKey, iv) as any
      cipher.setAAD(iv) // Use IV as additional authenticated data

      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(plaintext),
        cipher.final()
      ])

      // Get authentication tag
      const tag = cipher.getAuthTag()

      // Create result
      const result: EncryptionResult = {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64')
      }

      if (salt) {
        result.salt = salt.toString('base64')
      }

      // Add metadata if requested
      if (options.includeMetadata) {
        const metadata = {
          algorithm: ENCRYPTION_CONFIG.algorithm,
          keyLength: ENCRYPTION_CONFIG.keyLength,
          timestamp: Date.now(),
          version: '1.0'
        }

        // Encode metadata as JSON and prepend to encrypted data
        const metadataBuffer = Buffer.from(JSON.stringify(metadata), 'utf8')
        const metadataLength = Buffer.alloc(4)
        metadataLength.writeUInt32BE(metadataBuffer.length, 0)
        
        const combinedData = Buffer.concat([metadataLength, metadataBuffer, encrypted])
        result.encrypted = combinedData.toString('base64')
      }

      return result

    } catch (error) {
      logger.error('Encryption failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt data encrypted with encrypt()
   */
  decrypt(encryptionResult: EncryptionResult): string {
    try {
      // Initialize master key if not already done
      this.initializeMasterKey()
      
      if (!this.masterKey) {
        throw new Error('Master key not initialized')
      }

      // Parse components
      let encrypted = Buffer.from(encryptionResult.encrypted, 'base64')
      const iv = Buffer.from(encryptionResult.iv, 'base64')
      const tag = Buffer.from(encryptionResult.tag, 'base64')

      // Handle metadata if present
      let metadata: any = null
      if (encrypted.length > 1000000) { // Arbitrary size check for metadata
        try {
          // Try to extract metadata
          const metadataLength = encrypted.readUInt32BE(0)
          if (metadataLength < 1000) { // Reasonable metadata size
            const metadataBuffer = encrypted.slice(4, 4 + metadataLength)
            metadata = JSON.parse(metadataBuffer.toString('utf8'))
            encrypted = encrypted.slice(4 + metadataLength)
          }
        } catch {
          // No metadata present, continue with original encrypted data
        }
      }

      // Determine decryption key
      let decryptionKey: Buffer
      if (encryptionResult.salt) {
        // Derive key using provided salt
        const salt = Buffer.from(encryptionResult.salt, 'base64')
        decryptionKey = crypto.pbkdf2Sync(
          this.masterKey,
          salt,
          ENCRYPTION_CONFIG.iterations,
          ENCRYPTION_CONFIG.keyLength,
          'sha256'
        )
      } else {
        decryptionKey = this.masterKey
      }

      // Create decipher
      const decipher = crypto.createDecipheriv(ENCRYPTION_CONFIG.algorithm, decryptionKey, iv) as any
      decipher.setAAD(iv)
      decipher.setAuthTag(tag)

      // Decrypt data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ])

      return decrypted.toString('utf8')

    } catch (error) {
      logger.error('Decryption failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    try {
      // Validate password
      if (typeof password !== 'string' || password.length === 0) {
        throw new Error('Password must be a non-empty string')
      }

      if (password.length > 72) {
        throw new Error('Password too long (max 72 characters for bcrypt)')
      }

      // Edge Runtime fallback
      if (!bcrypt) {
        throw new Error('Password hashing not available in Edge Runtime')
      }

      return await bcrypt.hash(password, ENCRYPTION_CONFIG.bcryptRounds)
    } catch (error) {
      logger.error('Password hashing failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw new Error('Failed to hash password')
    }
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      if (typeof password !== 'string' || typeof hash !== 'string') {
        return false
      }

      // Edge Runtime fallback
      if (!bcrypt) {
        logger.warn('Password verification not available in Edge Runtime')
        return false
      }

      return await bcrypt.compare(password, hash)
    } catch (error) {
      logger.error('Password verification failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      return false
    }
  }

  /**
   * Generate cryptographically secure random string
   */
  generateSecureToken(length: number = 32): string {
    try {
      if (crypto && crypto.randomBytes) {
        return crypto.randomBytes(length).toString('hex')
      }
      
      // Edge Runtime fallback
      const array = new Uint8Array(length)
      if (typeof globalThis !== 'undefined' && globalThis.crypto) {
        globalThis.crypto.getRandomValues(array)
      } else {
        // Fallback to Math.random (not cryptographically secure)
        for (let i = 0; i < length; i++) {
          array[i] = Math.floor(Math.random() * 256)
        }
      }
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      logger.error('Token generation failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw new Error('Failed to generate secure token')
    }
  }

  /**
   * Generate secure random UUID
   */
  generateSecureUUID(): string {
    try {
      // Try Web Crypto API first (available in Edge Runtime)
      if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.randomUUID) {
        return globalThis.crypto.randomUUID()
      }
      
      // Try Node.js crypto
      if (crypto && crypto.randomUUID) {
        return crypto.randomUUID()
      }
      
      // Fallback UUID generation
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    } catch (error) {
      logger.error('UUID generation failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      // Fallback UUID generation
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }
  }

  /**
   * Derive key from password using PBKDF2
   */
  deriveKey(password: string, options: KeyDerivationOptions = {}): Buffer {
    try {
      const salt = options.salt || crypto.randomBytes(ENCRYPTION_CONFIG.saltLength)
      const iterations = options.iterations || ENCRYPTION_CONFIG.iterations
      const keyLength = options.keyLength || ENCRYPTION_CONFIG.keyLength

      return crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256')
    } catch (error) {
      logger.error('Key derivation failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw new Error('Failed to derive key')
    }
  }

  /**
   * Create HMAC signature for data integrity
   */
  createHMAC(data: string | Buffer, key?: Buffer): string {
    try {
      // Initialize master key if not already done
      this.initializeMasterKey()
      
      const hmacKey = key || this.masterKey
      if (!hmacKey) {
        throw new Error('HMAC key not available')
      }

      const hmac = crypto.createHmac('sha256', hmacKey)
      hmac.update(data)
      return hmac.digest('hex')
    } catch (error) {
      logger.error('HMAC creation failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw new Error('Failed to create HMAC')
    }
  }

  /**
   * Verify HMAC signature
   */
  verifyHMAC(data: string | Buffer, signature: string, key?: Buffer): boolean {
    try {
      const expectedSignature = this.createHMAC(data, key)
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    } catch (error) {
      logger.error('HMAC verification failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      return false
    }
  }


  /**
   * Secure data wiping (overwrite memory)
   */
  secureWipe(buffer: Buffer): void {
    try {
      if (Buffer.isBuffer(buffer)) {
        // Overwrite with random data multiple times
        for (let i = 0; i < 3; i++) {
          crypto.randomFillSync(buffer)
        }
        // Final overwrite with zeros
        buffer.fill(0)
      }
    } catch (error) {
      logger.error('Secure wipe failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  /**
   * Generate encryption key pair for asymmetric encryption
   */
  generateKeyPair(): { publicKey: string; privateKey: string } {
    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      })

      return { publicKey, privateKey }
    } catch (error) {
      logger.error('Key pair generation failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw new Error('Failed to generate key pair')
    }
  }

  /**
   * Encrypt data using RSA public key
   */
  encryptAsymmetric(data: string, publicKey: string): string {
    try {
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(data, 'utf8')
      )

      return encrypted.toString('base64')
    } catch (error) {
      logger.error('Asymmetric encryption failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw new Error('Failed to encrypt data with RSA')
    }
  }

  /**
   * Decrypt data using RSA private key
   */
  decryptAsymmetric(encryptedData: string, privateKey: string): string {
    try {
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(encryptedData, 'base64')
      )

      return decrypted.toString('utf8')
    } catch (error) {
      logger.error('Asymmetric decryption failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw new Error('Failed to decrypt data with RSA')
    }
  }

  /**
   * Get encryption configuration
   */
  getConfig(): typeof ENCRYPTION_CONFIG {
    return { ...ENCRYPTION_CONFIG }
  }

  /**
   * Test encryption system integrity
   */
  async testIntegrity(): Promise<boolean> {
    try {
      const testData = 'Standard encryption test data'

      // Test symmetric encryption
      const encrypted = this.encrypt(testData)
      const decrypted = this.decrypt(encrypted)
      
      if (decrypted !== testData) {
        throw new Error('Symmetric encryption test failed')
      }

      // Test password hashing
      const password = 'TestPassword123!'
      const hash = await this.hashPassword(password)
      const verified = await this.verifyPassword(password, hash)
      
      if (!verified) {
        throw new Error('Password hashing test failed')
      }

      // Test HMAC
      const hmac = this.createHMAC(testData)
      const hmacVerified = this.verifyHMAC(testData, hmac)
      
      if (!hmacVerified) {
        throw new Error('HMAC test failed')
      }

      logger.info('Encryption system integrity test passed')
      return true

    } catch (error) {
      logger.error('Encryption system integrity test failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      return false
    }
  }
}

// Export singleton instance
export const encryption = new StandardEncryption()

// Export class for custom instances
export { StandardEncryption }

// Types are already exported as interfaces above