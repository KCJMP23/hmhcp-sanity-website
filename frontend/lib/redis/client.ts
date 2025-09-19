/**
 * Redis Client Configuration
 * Provides a robust Redis connection with error handling and fallback
 */

import { Redis } from 'ioredis'

// Redis client singleton
let redisClient: Redis | null = null
let isRedisAvailable = false

// Connection configuration
const REDIS_OPTIONS = {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    if (times > 3) {
      console.warn('[Redis] Max retries reached, falling back to memory cache')
      return null // Stop retrying
    }
    const delay = Math.min(times * 50, 500)
    return delay
  },
  connectTimeout: 3000, // 3 seconds to connect
  commandTimeout: 1000, // 1 second for commands
  enableReadyCheck: true,
  lazyConnect: true,
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY'
    if (err.message.includes(targetError)) {
      return true // Reconnect on READONLY errors
    }
    return false
  }
}

/**
 * Initialize Redis client with proper error handling
 */
export function initializeRedis(): Redis | null {
  if (redisClient) {
    return redisClient
  }

  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    console.info('[Redis] No REDIS_URL configured, using memory cache')
    return null
  }

  try {
    redisClient = new Redis(redisUrl, REDIS_OPTIONS)

    // Set up event handlers
    redisClient.on('connect', () => {
      console.info('[Redis] Connected successfully')
      isRedisAvailable = true
    })

    redisClient.on('ready', () => {
      console.info('[Redis] Ready to accept commands')
      isRedisAvailable = true
    })

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message)
      isRedisAvailable = false
    })

    redisClient.on('close', () => {
      console.warn('[Redis] Connection closed')
      isRedisAvailable = false
    })

    redisClient.on('reconnecting', (delay: number) => {
      console.info(`[Redis] Reconnecting in ${delay}ms`)
    })

    redisClient.on('end', () => {
      console.warn('[Redis] Connection ended')
      isRedisAvailable = false
      redisClient = null
    })

    // Attempt to connect
    redisClient.connect().catch((err) => {
      console.error('[Redis] Failed to connect:', err.message)
      isRedisAvailable = false
      redisClient = null
    })

    return redisClient
  } catch (error) {
    console.error('[Redis] Failed to initialize:', error)
    redisClient = null
    isRedisAvailable = false
    return null
  }
}

/**
 * Get Redis client or null if not available
 */
export function getRedisClient(): Redis | null {
  if (!redisClient) {
    return initializeRedis()
  }
  return isRedisAvailable ? redisClient : null
}

/**
 * Check if Redis is available
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient !== null
}

/**
 * Safe Redis operation wrapper with fallback
 */
export async function safeRedisOperation<T>(
  operation: (client: Redis) => Promise<T>,
  fallback: T
): Promise<T> {
  const client = getRedisClient()
  
  if (!client || !isRedisAvailable) {
    return fallback
  }

  try {
    // Set operation timeout
    const timeoutPromise = new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Redis operation timeout')), 1000)
    )
    
    const operationPromise = operation(client)
    
    return await Promise.race([operationPromise, timeoutPromise])
  } catch (error) {
    console.warn('[Redis] Operation failed:', error instanceof Error ? error.message : 'Unknown error')
    return fallback
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit()
      redisClient = null
      isRedisAvailable = false
      console.info('[Redis] Connection closed gracefully')
    } catch (error) {
      console.error('[Redis] Error closing connection:', error)
    }
  }
}

// Initialize Redis on module load (lazy)
if (process.env.NODE_ENV !== 'test') {
  initializeRedis()
}