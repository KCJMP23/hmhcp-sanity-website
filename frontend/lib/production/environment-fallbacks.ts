/**
 * Production Environment Fallbacks
 * 
 * Provides fallback configurations and graceful degradation
 * when external services are unavailable during builds or runtime.
 */

import { logger } from '@/lib/logger'
import { isBuildTime, shouldInitializeServices } from './build-runtime-separator'

/**
 * Redis fallback configuration
 */
export const redisConnectionFallback = {
  // Don't attempt Redis connection during build
  shouldConnect: () => shouldInitializeServices() && !!process.env.REDIS_URL,
  
  // Fallback to memory cache during build
  fallbackCache: new Map<string, { value: any, expires: number }>(),
  
  // Get from fallback cache
  async get(key: string) {
    if (isBuildTime()) {
      const cached = this.fallbackCache.get(key)
      if (cached && cached.expires > Date.now()) {
        return cached.value
      }
      return null
    }
    return null
  },
  
  // Set in fallback cache
  async set(key: string, value: any, ttlSeconds: number = 300) {
    if (isBuildTime()) {
      this.fallbackCache.set(key, {
        value,
        expires: Date.now() + (ttlSeconds * 1000)
      })
      return true
    }
    return false
  },
  
  // Clear expired entries
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.fallbackCache.entries()) {
      if (entry.expires <= now) {
        this.fallbackCache.delete(key)
      }
    }
  }
}

/**
 * Database connection fallback
 */
export const databaseConnectionFallback = {
  // Mock data for build-time
  mockData: {
    navigation: [],
    pages: [],
    posts: [],
    settings: {}
  },
  
  // Check if database should be connected
  shouldConnect: () => {
    return shouldInitializeServices() && 
           !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
           !!process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  
  // Get fallback data during build
  getFallbackData(table: string) {
    if (isBuildTime()) {
      logger.info(`Using fallback data for table: ${table}`)
      return this.mockData[table as keyof typeof this.mockData] || []
    }
    return null
  }
}

/**
 * External service availability checker
 */
export const serviceAvailability = {
  redis: false,
  database: false,
  email: false,
  analytics: false,
  
  async checkServices() {
    if (isBuildTime()) {
      logger.info('Skipping service availability check during build')
      return this
    }
    
    // Check Redis
    this.redis = redisConnectionFallback.shouldConnect()
    
    // Check Database  
    this.database = databaseConnectionFallback.shouldConnect()
    
    // Check Email service
    this.email = !!process.env.SENDGRID_API_KEY
    
    // Check Analytics
    this.analytics = !!process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
    
    logger.info('Service availability check completed', {
      redis: this.redis,
      database: this.database,
      email: this.email,
      analytics: this.analytics
    })
    
    return this
  }
}

/**
 * Environment variable validation with fallbacks
 */
export const environmentValidation = {
  required: {
    production: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'SESSION_SECRET',
      'CSRF_TOKEN_SECRET',
      'ENCRYPTION_KEY_COMPONENT_1',
      'ENCRYPTION_KEY_COMPONENT_2',
      'ENCRYPTION_KEY_SALT'
    ],
    development: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]
  },
  
  optional: {
    production: [
      'REDIS_URL',
      'SENDGRID_API_KEY',
      'SENTRY_DSN',
      'NEXT_PUBLIC_GA4_MEASUREMENT_ID'
    ]
  },
  
  validate(environment: 'production' | 'development' = 'production') {
    const missing: string[] = []
    const warnings: string[] = []
    
    // Check required variables
    const requiredVars = this.required[environment] || []
    for (const envVar of requiredVars) {
      if (!process.env[envVar]) {
        missing.push(envVar)
      }
    }
    
    // Check optional but recommended variables
    const optionalVars = this.optional[environment] || []
    for (const envVar of optionalVars) {
      if (!process.env[envVar]) {
        warnings.push(`Optional: ${envVar}`)
      }
    }
    
    return {
      valid: missing.length === 0,
      missing,
      warnings,
      environment
    }
  }
}

/**
 * Production readiness checks
 */
export const productionReadiness = {
  async check() {
    const results = {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      checks: {
        environmentVariables: environmentValidation.validate('production'),
        serviceAvailability: await serviceAvailability.checkServices(),
        buildConfiguration: this.checkBuildConfig(),
        securityConfiguration: this.checkSecurityConfig()
      },
      overall: true
    }
    
    // Determine overall readiness
    results.overall = results.checks.environmentVariables.valid &&
                     results.checks.buildConfiguration.valid &&
                     results.checks.securityConfiguration.valid
    
    if (!results.overall) {
      logger.error('Production readiness check failed', results)
    } else {
      logger.info('Production readiness check passed', results)
    }
    
    return results
  },
  
  checkBuildConfig() {
    const issues: string[] = []
    
    // Check Node.js version
    const nodeVersion = process.version
    const majorVersion = parseInt(nodeVersion.slice(1))
    if (majorVersion < 18) {
      issues.push(`Node.js version ${nodeVersion} is too old. Minimum required: 18.x`)
    }
    
    // Check build environment
    if (process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV === 'production') {
      issues.push('NODE_ENV should be set to production in production environment')
    }
    
    return {
      valid: issues.length === 0,
      issues,
      nodeVersion,
      buildEnv: process.env.NODE_ENV
    }
  },
  
  checkSecurityConfig() {
    const issues: string[] = []
    
    // Check HTTPS configuration
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    if (baseUrl && !baseUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
      issues.push('Base URL must use HTTPS in production')
    }
    
    // Check secret lengths
    const secrets = [
      'JWT_SECRET',
      'SESSION_SECRET', 
      'CSRF_TOKEN_SECRET',
      'ENCRYPTION_KEY_COMPONENT_1',
      'ENCRYPTION_KEY_COMPONENT_2'
    ]
    
    for (const secret of secrets) {
      const value = process.env[secret]
      if (value && value.length < 32) {
        issues.push(`${secret} should be at least 32 characters for production security`)
      }
    }
    
    // Check encryption configuration
    if (!process.env.ENCRYPTION_KEY_COMPONENT_1 || !process.env.ENCRYPTION_KEY_COMPONENT_2) {
      issues.push('Encryption key components are required for HIPAA compliance')
    }
    
    return {
      valid: issues.length === 0,
      issues,
      httpsEnabled: baseUrl?.startsWith('https://'),
      encryptionEnabled: !!(process.env.ENCRYPTION_KEY_COMPONENT_1 && process.env.ENCRYPTION_KEY_COMPONENT_2)
    }
  }
}

/**
 * Graceful service initialization
 */
export const serviceInitializer = {
  async initializeWithFallbacks() {
    if (isBuildTime()) {
      logger.info('Skipping service initialization during build phase')
      return {
        redis: false,
        database: false,
        monitoring: false
      }
    }
    
    const results = {
      redis: false,
      database: false,
      monitoring: false
    }
    
    // Initialize Redis with fallback
    try {
      if (redisConnectionFallback.shouldConnect()) {
        // Redis initialization is handled in the Redis service itself
        results.redis = true
        logger.info('Redis service initialization queued')
      }
    } catch (error) {
      logger.error('Redis initialization failed, using fallbacks', error)
    }
    
    // Initialize Database
    try {
      if (databaseConnectionFallback.shouldConnect()) {
        results.database = true
        logger.info('Database service ready')
      }
    } catch (error) {
      logger.error('Database initialization failed', error)
    }
    
    // Initialize Monitoring
    try {
      if (process.env.SENTRY_DSN) {
        results.monitoring = true
        logger.info('Monitoring service ready')
      }
    } catch (error) {
      logger.error('Monitoring initialization failed', error)
    }
    
    return results
  }
}

// Cleanup fallback caches periodically
if (!isBuildTime()) {
  setInterval(() => {
    redisConnectionFallback.cleanup()
  }, 5 * 60 * 1000) // Every 5 minutes
}