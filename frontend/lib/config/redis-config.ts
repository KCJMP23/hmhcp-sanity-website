/**
 * Redis Configuration Module
 * 
 * Environment-specific Redis configurations for development, staging, and production
 * Supports various Redis providers (local, Redis Cloud, AWS ElastiCache, Azure Cache)
 */

import { RedisOptions, ClusterNode } from 'ioredis'

export interface RedisEnvironmentConfig {
  name: string
  url?: string
  host?: string
  port?: number
  password?: string
  db?: number
  tls?: boolean
  cluster?: boolean
  clusterNodes?: ClusterNode[]
  sentinel?: {
    sentinels: Array<{ host: string; port: number }>
    name: string
  }
  options: RedisOptions
  monitoring?: {
    enabled: boolean
    sampleRate: number
    slowLogThreshold: number
  }
}

/**
 * Development configuration (local Redis)
 */
const developmentConfig: RedisEnvironmentConfig = {
  name: 'development',
  host: 'localhost',
  port: 6379,
  db: 0,
  options: {
    retryStrategy: (times: number) => {
      if (times > 3) return null
      return Math.min(times * 1000, 3000)
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY'
      if (err.message.includes(targetError)) {
        return true
      }
      return false
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    connectTimeout: 5000,
    commandTimeout: 5000,
    keepAlive: 30000,
    lazyConnect: false,
    showFriendlyErrorStack: true
  },
  monitoring: {
    enabled: true,
    sampleRate: 1.0, // Sample all operations in dev
    slowLogThreshold: 10 // Log operations slower than 10ms
  }
}

/**
 * Staging configuration
 */
const stagingConfig: RedisEnvironmentConfig = {
  name: 'staging',
  url: process.env.REDIS_URL_STAGING,
  tls: true,
  options: {
    retryStrategy: (times: number) => {
      if (times > 5) return null
      return Math.min(times * 500, 5000)
    },
    reconnectOnError: (err) => {
      const targetErrors = ['READONLY', 'ECONNRESET']
      if (targetErrors.some(e => err.message.includes(e))) {
        return true
      }
      return false
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    keepAlive: 60000,
    lazyConnect: false,
    showFriendlyErrorStack: false,
    tls: {
      rejectUnauthorized: true
    }
  },
  monitoring: {
    enabled: true,
    sampleRate: 0.1, // Sample 10% of operations
    slowLogThreshold: 50
  }
}

/**
 * Production configuration with high availability
 */
const productionConfig: RedisEnvironmentConfig = {
  name: 'production',
  url: process.env.REDIS_URL,
  tls: true,
  cluster: process.env.REDIS_CLUSTER === 'true',
  clusterNodes: process.env.REDIS_CLUSTER_NODES ? 
    JSON.parse(process.env.REDIS_CLUSTER_NODES) : undefined,
  options: {
    retryStrategy: (times: number) => {
      // More aggressive retry in production
      if (times > 10) {
        // Log critical error after 10 retries
        console.error('Redis connection failed after 10 retries')
        return null
      }
      return Math.min(times * 200, 3000)
    },
    reconnectOnError: (err) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT']
      if (targetErrors.some(e => err.message.includes(e))) {
        return true
      }
      return false
    },
    maxRetriesPerRequest: 5,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    connectTimeout: 15000,
    commandTimeout: 10000,
    keepAlive: 120000,
    lazyConnect: false,
    showFriendlyErrorStack: false,
    // Production TLS settings
    tls: {
      rejectUnauthorized: true,
      ca: process.env.REDIS_TLS_CA,
      cert: process.env.REDIS_TLS_CERT,
      key: process.env.REDIS_TLS_KEY
    },
    // Connection pool settings
    connectionName: `hmhcp-${process.env.INSTANCE_ID || 'prod'}`,
    // Read preference for replica sets
    readOnly: false,
    // Performance optimizations
    enableAutoPipelining: true,
    autoPipeliningIgnoredCommands: ['info', 'ping', 'auth']
  },
  monitoring: {
    enabled: true,
    sampleRate: 0.01, // Sample 1% of operations
    slowLogThreshold: 100
  }
}

/**
 * AWS ElastiCache specific configuration
 */
const elastiCacheConfig: RedisEnvironmentConfig = {
  name: 'elasticache',
  cluster: true,
  clusterNodes: process.env.ELASTICACHE_NODES ? 
    JSON.parse(process.env.ELASTICACHE_NODES) : [],
  options: {
    ...productionConfig.options,
    tls: {
      rejectUnauthorized: true
    },
    password: process.env.ELASTICACHE_AUTH_TOKEN
  },
  monitoring: {
    enabled: true,
    sampleRate: 0.05,
    slowLogThreshold: 75
  }
}

/**
 * Redis Sentinel configuration for high availability
 */
const sentinelConfig: RedisEnvironmentConfig = {
  name: 'sentinel',
  sentinel: {
    sentinels: process.env.REDIS_SENTINELS ? 
      JSON.parse(process.env.REDIS_SENTINELS) : [
        { host: 'localhost', port: 26379 },
        { host: 'localhost', port: 26380 },
        { host: 'localhost', port: 26381 }
      ],
    name: process.env.REDIS_SENTINEL_NAME || 'mymaster'
  },
  password: process.env.REDIS_PASSWORD,
  options: {
    ...productionConfig.options,
    sentinelPassword: process.env.REDIS_SENTINEL_PASSWORD,
    sentinelRetryStrategy: (times: number) => {
      if (times > 10) return null
      return Math.min(times * 100, 2000)
    },
    preferredSlaves: [
      { ip: 'slave1', port: '6380' },
      { ip: 'slave2', port: '6381' }
    ]
  },
  monitoring: {
    enabled: true,
    sampleRate: 0.05,
    slowLogThreshold: 75
  }
}

/**
 * Get configuration based on environment
 */
export function getRedisConfig(): RedisEnvironmentConfig {
  const env = (process.env.NODE_ENV as string) || 'development'
  const redisProvider = process.env.REDIS_PROVIDER

  // Check for specific Redis provider
  if (redisProvider) {
    switch (redisProvider.toLowerCase()) {
      case 'elasticache':
        return elastiCacheConfig
      case 'sentinel':
        return sentinelConfig
      case 'cluster':
        return {
          ...productionConfig,
          cluster: true
        }
      default:
        break
    }
  }

  // Default environment-based configuration
  switch (env) {
    case 'production':
      return productionConfig
    case 'staging':
      return stagingConfig
    case 'development':
    case 'test':
    default:
      return developmentConfig
  }
}

/**
 * Validate Redis configuration
 */
export function validateRedisConfig(config: RedisEnvironmentConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check for connection details
  if (!config.url && !config.host && !config.sentinel && !config.clusterNodes) {
    errors.push('No connection details provided (url, host, sentinel, or clusterNodes)')
  }

  // Validate cluster configuration
  if (config.cluster && (!config.clusterNodes || config.clusterNodes.length === 0)) {
    errors.push('Cluster mode enabled but no cluster nodes provided')
  }

  // Validate sentinel configuration
  if (config.sentinel) {
    if (!config.sentinel.sentinels || config.sentinel.sentinels.length === 0) {
      errors.push('Sentinel configuration missing sentinels array')
    }
    if (!config.sentinel.name) {
      errors.push('Sentinel configuration missing master name')
    }
  }

  // Validate TLS configuration
  if (config.tls && config.options.tls) {
    if (typeof config.options.tls === 'object' && !config.options.tls.rejectUnauthorized) {
      errors.push('TLS enabled but certificate validation disabled (security risk)')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get Redis connection string for monitoring/logging (with password masked)
 */
export function getRedisConnectionString(config: RedisEnvironmentConfig): string {
  if (config.url) {
    // Mask password in URL
    return config.url.replace(/:([^@]+)@/, ':****@')
  }

  if (config.sentinel) {
    return `sentinel://${config.sentinel.name}`
  }

  if (config.cluster) {
    return `cluster://${config.clusterNodes?.length || 0} nodes`
  }

  const host = config.host || 'localhost'
  const port = config.port || 6379
  const db = config.db || 0
  
  return `redis://${host}:${port}/${db}`
}

/**
 * Get recommended cache TTL based on environment
 */
export function getRecommendedTTL(dataType: string): number {
  const env = process.env.NODE_ENV || 'development'
  
  const ttlMap: Record<string, Record<string, number>> = {
    development: {
      session: 3600,      // 1 hour
      content: 60,        // 1 minute
      api: 30,           // 30 seconds
      static: 300        // 5 minutes
    },
    staging: {
      session: 7200,      // 2 hours
      content: 300,       // 5 minutes
      api: 60,           // 1 minute
      static: 1800       // 30 minutes
    },
    production: {
      session: 86400,     // 24 hours
      content: 3600,      // 1 hour
      api: 300,          // 5 minutes
      static: 86400      // 24 hours
    }
  }

  const envTTL = ttlMap[env] || ttlMap.development
  return envTTL[dataType] || 300 // Default 5 minutes
}

/**
 * Export all configurations for testing/debugging
 */
export const configs = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig,
  elasticache: elastiCacheConfig,
  sentinel: sentinelConfig
}

export default getRedisConfig()