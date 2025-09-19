import { Redis } from '@upstash/redis'
import { createHash } from 'crypto'

// Initialize Redis client for deduplication
const redis = process.env.REDIS_URL
  ? new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN || ''
    })
  : null

// In-memory fallback for local development
class InMemoryDeduplicator {
  private processed: Map<string, number> = new Map()
  private readonly ttl: number = 3600000 // 1 hour in ms

  async isDuplicate(key: string): Promise<boolean> {
    const now = Date.now()
    const processedAt = this.processed.get(key)
    
    if (processedAt && (now - processedAt) < this.ttl) {
      return true
    }
    
    // Clean up expired entries
    for (const [k, timestamp] of this.processed.entries()) {
      if (now - timestamp > this.ttl) {
        this.processed.delete(k)
      }
    }
    
    return false
  }

  async markProcessed(key: string): Promise<void> {
    this.processed.set(key, Date.now())
  }
}

const inMemoryDeduplicator = new InMemoryDeduplicator()

/**
 * Generate deduplication key from request
 */
export function generateDedupeKey(
  requestId?: string,
  payload?: any,
  apiKeyId?: string
): string {
  if (requestId) {
    return `webhook:${requestId}`
  }
  
  // Generate deterministic key from payload
  const payloadHash = createHash('md5')
    .update(JSON.stringify(payload || {}))
    .digest('hex')
  
  return `webhook:${apiKeyId || 'unknown'}:${payloadHash}`
}

/**
 * Check if webhook request is duplicate
 */
export async function isDuplicateRequest(
  key: string,
  ttlSeconds: number = 3600
): Promise<boolean> {
  try {
    if (redis) {
      const exists = await redis.get(key)
      return exists !== null
    }
  } catch (error) {
    console.warn('[Deduplication] Redis error, falling back to in-memory:', error)
  }
  
  return inMemoryDeduplicator.isDuplicate(key)
}

/**
 * Mark webhook request as processed
 */
export async function markRequestProcessed(
  key: string,
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    if (redis) {
      await redis.set(key, '1', { ex: ttlSeconds })
      return
    }
  } catch (error) {
    console.warn('[Deduplication] Redis error, falling back to in-memory:', error)
  }
  
  await inMemoryDeduplicator.markProcessed(key)
}

/**
 * Validate webhook timestamp to prevent replay attacks
 */
export function isTimestampValid(
  timestamp: string | number,
  toleranceSeconds: number = 300 // 5 minutes
): boolean {
  const webhookTime = typeof timestamp === 'string' 
    ? new Date(timestamp).getTime() 
    : timestamp
  
  const now = Date.now()
  const diff = Math.abs(now - webhookTime)
  
  return diff <= toleranceSeconds * 1000
}