/**
 * Secure Environment Configuration
 * Validates and manages environment variables with security best practices
 */

import { logger } from '@/lib/logger'

interface EnvironmentConfig {
  // Database
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey: string
  
  // Redis Session Store
  redisUrl?: string
  redisPassword?: string
  redisDatabase?: number
  
  // Encryption
  encryptionKeyComponent1?: string
  encryptionKeyComponent2?: string
  encryptionKeySalt?: string
  encryptionKeyVersion?: number
  encryptionKeyRotationDate?: Date
  
  // Mock/Test Configuration (Development Only)
  mockAdminEmail?: string
  mockAdminPasswordHash?: string
  mockAdminRole?: string
  
  // Security Settings
  enforceSessionIP?: boolean
  csrfTokenSecret?: string
  jwtSecret?: string
  
  // Application
  nodeEnv: string
  isProduction: boolean
  isDevelopment: boolean
  baseUrl: string
}

class SecureEnvironmentConfig {
  private config: EnvironmentConfig | null = null
  private validated: boolean = false

  /**
   * Initialize and validate environment configuration
   */
  initialize(): EnvironmentConfig {
    if (this.config && this.validated) {
      return this.config
    }

    const nodeEnv = process.env.NODE_ENV || 'development'
    const isProduction = nodeEnv === 'production'
    const isDevelopment = nodeEnv === 'development'

    // Validate required environment variables
    const errors: string[] = []

    // Required in all environments
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl) errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
    if (!supabaseAnonKey) errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')

    // Required in production
    if (isProduction) {
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const encryptionKeyComponent1 = process.env.ENCRYPTION_KEY_COMPONENT_1
      const encryptionKeyComponent2 = process.env.ENCRYPTION_KEY_COMPONENT_2
      const encryptionKeySalt = process.env.ENCRYPTION_KEY_SALT
      const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL
      
      if (!supabaseServiceKey) errors.push('SUPABASE_SERVICE_ROLE_KEY is required in production')
      if (!encryptionKeyComponent1) errors.push('ENCRYPTION_KEY_COMPONENT_1 is required in production')
      if (!encryptionKeyComponent2) errors.push('ENCRYPTION_KEY_COMPONENT_2 is required in production')
      if (!encryptionKeySalt) errors.push('ENCRYPTION_KEY_SALT is required in production')
      if (!redisUrl) errors.push('REDIS_URL or REDIS_TLS_URL is required in production')
      
      // Validate URL formats
      if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
        errors.push('NEXT_PUBLIC_SUPABASE_URL must use HTTPS in production')
      }
      
      if (redisUrl && !redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
        errors.push('Invalid REDIS_URL format')
      }
    }

    // Log errors and throw in production
    if (errors.length > 0) {
      errors.forEach(error => logger.error('Environment validation error:', { error }))
      
      if (isProduction) {
        throw new Error(`Environment validation failed: ${errors.join(', ')}`)
      } else {
        logger.warn('Running with incomplete environment configuration (development mode)')
      }
    }

    // Build configuration object
    this.config = {
      // Database
      supabaseUrl: supabaseUrl || '',
      supabaseAnonKey: supabaseAnonKey || '',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      
      // Redis Session Store
      redisUrl: process.env.REDIS_URL || process.env.REDIS_TLS_URL,
      redisPassword: process.env.REDIS_PASSWORD,
      redisDatabase: process.env.REDIS_DATABASE ? parseInt(process.env.REDIS_DATABASE, 10) : 0,
      
      // Encryption
      encryptionKeyComponent1: process.env.ENCRYPTION_KEY_COMPONENT_1,
      encryptionKeyComponent2: process.env.ENCRYPTION_KEY_COMPONENT_2,
      encryptionKeySalt: process.env.ENCRYPTION_KEY_SALT,
      encryptionKeyVersion: process.env.ENCRYPTION_KEY_VERSION 
        ? parseInt(process.env.ENCRYPTION_KEY_VERSION, 10) 
        : 1,
      encryptionKeyRotationDate: process.env.ENCRYPTION_KEY_ROTATION_DATE
        ? new Date(process.env.ENCRYPTION_KEY_ROTATION_DATE)
        : undefined,
      
      // Mock/Test Configuration
      mockAdminEmail: isDevelopment ? process.env.MOCK_ADMIN_EMAIL : undefined,
      mockAdminPasswordHash: isDevelopment ? process.env.MOCK_ADMIN_PASSWORD_HASH : undefined,
      mockAdminRole: isDevelopment ? process.env.MOCK_ADMIN_ROLE : undefined,
      
      // Security Settings
      enforceSessionIP: process.env.ENFORCE_SESSION_IP === 'true',
      csrfTokenSecret: process.env.CSRF_TOKEN_SECRET,
      jwtSecret: process.env.JWT_SECRET,
      
      // Application
      nodeEnv,
      isProduction,
      isDevelopment,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 
               (isProduction ? 'https://hm-hcp.com' : 'http://localhost:3000')
    }

    this.validated = true
    
    // Log configuration status (without sensitive values)
    logger.info('Environment configuration initialized', {
      nodeEnv,
      isProduction,
      hasDatabaseConfig: !!supabaseUrl && !!supabaseAnonKey,
      hasRedisConfig: !!this.config.redisUrl,
      hasEncryptionConfig: !!this.config.encryptionKeyComponent1,
      baseUrl: this.config.baseUrl
    })

    return this.config
  }

  /**
   * Get configuration (initializes if needed)
   */
  get(): EnvironmentConfig {
    if (!this.config || !this.validated) {
      return this.initialize()
    }
    return this.config
  }

  /**
   * Check if a specific configuration key exists
   */
  has(key: keyof EnvironmentConfig): boolean {
    const config = this.get()
    return config[key] !== undefined && config[key] !== ''
  }

  /**
   * Get a specific configuration value
   */
  getValue<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    const config = this.get()
    return config[key]
  }

  /**
   * Validate configuration for specific features
   */
  validateFeature(feature: 'encryption' | 'redis' | 'mock'): boolean {
    const config = this.get()

    switch (feature) {
      case 'encryption':
        if (config.isProduction) {
          return !!(
            config.encryptionKeyComponent1 &&
            config.encryptionKeyComponent2 &&
            config.encryptionKeySalt
          )
        }
        return true // Allow development without full encryption config

      case 'redis':
        return !!config.redisUrl

      case 'mock':
        return !config.isProduction && !!(
          config.mockAdminEmail &&
          config.mockAdminPasswordHash
        )

      default:
        return false
    }
  }

  /**
   * Get safe configuration for client-side use (no sensitive values)
   */
  getPublicConfig(): Partial<EnvironmentConfig> {
    const config = this.get()
    
    return {
      nodeEnv: config.nodeEnv,
      isProduction: config.isProduction,
      isDevelopment: config.isDevelopment,
      baseUrl: config.baseUrl,
      supabaseUrl: config.supabaseUrl,
      // Never expose keys or sensitive configuration
    }
  }

  /**
   * Validate all security-critical configurations
   */
  validateSecurity(): { valid: boolean; warnings: string[] } {
    const config = this.get()
    const warnings: string[] = []

    // Check encryption configuration
    if (!this.validateFeature('encryption')) {
      if (config.isProduction) {
        warnings.push('Encryption not properly configured')
      } else {
        warnings.push('Using development encryption configuration')
      }
    }

    // Check session store
    if (!this.validateFeature('redis')) {
      if (config.isProduction) {
        warnings.push('Redis not configured - sessions will not persist')
      } else {
        warnings.push('Using in-memory session storage (development)')
      }
    }

    // Check CSRF protection
    if (!config.csrfTokenSecret && config.isProduction) {
      warnings.push('CSRF token secret not configured')
    }

    // Check JWT configuration
    if (!config.jwtSecret && config.isProduction) {
      warnings.push('JWT secret not configured')
    }

    // Check base URL
    if (config.isProduction && !config.baseUrl.startsWith('https://')) {
      warnings.push('Base URL should use HTTPS in production')
    }

    return {
      valid: warnings.length === 0 || !config.isProduction,
      warnings
    }
  }
}

// Export singleton instance
export const secureEnv = new SecureEnvironmentConfig()

// Export types
export type { EnvironmentConfig }

// Helper functions for common checks
export const isProduction = () => secureEnv.getValue('isProduction')
export const isDevelopment = () => secureEnv.getValue('isDevelopment')
export const getBaseUrl = () => secureEnv.getValue('baseUrl')
export const hasRedis = () => secureEnv.validateFeature('redis')
export const hasEncryption = () => secureEnv.validateFeature('encryption')