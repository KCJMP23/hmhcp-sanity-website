/**
 * Redis-based Session Store for Production
 * Provides persistent, distributed session storage with automatic expiration
 */

import { createClient, RedisClientType } from 'redis'
// Dynamic crypto import for Edge Runtime compatibility
let crypto: any
if (typeof window === 'undefined') {
  try {
    crypto = require('crypto')
  } catch (e) {
    crypto = null
  }
}
import { logger } from '@/lib/logging/client-safe-logger'

// Session configuration
const SESSION_PREFIX = 'session:'
const SESSION_DURATION = 7 * 24 * 60 * 60 // 7 days in seconds
const SESSION_REFRESH_THRESHOLD = 60 * 60 // 1 hour in seconds

export interface SessionData {
  userId: string
  email: string
  role: string
  createdAt: number
  lastAccessed: number
  expiresAt: number
  ipAddress?: string
  userAgent?: string
  data?: Record<string, any>
}

export interface SessionStore {
  create(data: Omit<SessionData, 'createdAt' | 'lastAccessed' | 'expiresAt'>): Promise<string>
  get(sessionId: string): Promise<SessionData | null>
  update(sessionId: string, data: Partial<SessionData>): Promise<boolean>
  destroy(sessionId: string): Promise<boolean>
  refresh(sessionId: string): Promise<boolean>
  exists(sessionId: string): Promise<boolean>
  getUserSessions(userId: string): Promise<string[]>
  destroyUserSessions(userId: string): Promise<number>
}

/**
 * Redis implementation of SessionStore
 */
class RedisSessionStore implements SessionStore {
  private client: RedisClientType | null = null
  private isConnected: boolean = false

  constructor() {
    this.initializeClient()
  }

  /**
   * Initialize Redis client with connection management
   */
  private async initializeClient(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL
      
      if (!redisUrl) {
        logger.warn('Redis URL not configured, sessions will not persist')
        return
      }

      this.client = createClient({
        url: redisUrl,
        socket: redisUrl.startsWith('rediss://') ? {
          tls: true,
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        } : undefined,
        password: process.env.REDIS_PASSWORD,
        database: parseInt(process.env.REDIS_DATABASE || '0', 10)
      }) as RedisClientType

      // Set up event handlers
      this.client.on('error', (err) => {
        logger.error('Redis client error:', { error: err.message })
        this.isConnected = false
      })

      this.client.on('connect', () => {
        logger.info('Redis client connected')
        this.isConnected = true
      })

      this.client.on('ready', () => {
        logger.info('Redis client ready')
        this.isConnected = true
      })

      // Connect to Redis
      await this.client.connect()
    } catch (error) {
      logger.error('Failed to initialize Redis client:', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      this.isConnected = false
    }
  }

  /**
   * Ensure Redis client is connected
   */
  private async ensureConnected(): Promise<boolean> {
    if (!this.client) {
      return false
    }

    if (!this.isConnected) {
      try {
        await this.client.ping()
        this.isConnected = true
      } catch {
        this.isConnected = false
        // Try to reconnect
        try {
          await this.client.connect()
          this.isConnected = true
        } catch (error) {
          logger.error('Failed to reconnect to Redis:', { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }
    }

    return this.isConnected
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Create new session
   */
  async create(data: Omit<SessionData, 'createdAt' | 'lastAccessed' | 'expiresAt'>): Promise<string> {
    if (!await this.ensureConnected() || !this.client) {
      throw new Error('Redis not available')
    }

    const sessionId = this.generateSessionId()
    const now = Date.now()
    const expiresAt = now + (SESSION_DURATION * 1000)

    const sessionData: SessionData = {
      ...data,
      createdAt: now,
      lastAccessed: now,
      expiresAt
    }

    const key = `${SESSION_PREFIX}${sessionId}`
    
    try {
      // Store session data
      await this.client.setEx(
        key,
        SESSION_DURATION,
        JSON.stringify(sessionData)
      )

      // Add to user's session index
      if (data.userId) {
        const userKey = `user_sessions:${data.userId}`
        await this.client.sAdd(userKey, sessionId)
        await this.client.expire(userKey, SESSION_DURATION)
      }

      logger.info('Session created', {
        sessionId: sessionId.substring(0, 8),
        userId: data.userId
      })

      return sessionId
    } catch (error) {
      logger.error('Failed to create session:', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      throw new Error('Failed to create session')
    }
  }

  /**
   * Get session data
   */
  async get(sessionId: string): Promise<SessionData | null> {
    if (!await this.ensureConnected() || !this.client) {
      return null
    }

    const key = `${SESSION_PREFIX}${sessionId}`
    
    try {
      const data = await this.client.get(key)
      
      if (!data) {
        return null
      }

      const sessionData = JSON.parse(data) as SessionData
      const now = Date.now()

      // Check if session expired
      if (sessionData.expiresAt < now) {
        await this.destroy(sessionId)
        return null
      }

      // Update last accessed time
      sessionData.lastAccessed = now
      await this.update(sessionId, { lastAccessed: now })

      // Check if refresh needed
      if (sessionData.expiresAt - now < (SESSION_REFRESH_THRESHOLD * 1000)) {
        await this.refresh(sessionId)
      }

      return sessionData
    } catch (error) {
      logger.error('Failed to get session:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: sessionId.substring(0, 8)
      })
      return null
    }
  }

  /**
   * Update session data
   */
  async update(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    if (!await this.ensureConnected() || !this.client) {
      return false
    }

    const key = `${SESSION_PREFIX}${sessionId}`
    
    try {
      const existing = await this.client.get(key)
      
      if (!existing) {
        return false
      }

      const sessionData = JSON.parse(existing) as SessionData
      const updated = { ...sessionData, ...updates }
      
      const ttl = await this.client.ttl(key)
      
      if (ttl > 0) {
        await this.client.setEx(
          key,
          ttl,
          JSON.stringify(updated)
        )
        return true
      }

      return false
    } catch (error) {
      logger.error('Failed to update session:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: sessionId.substring(0, 8)
      })
      return false
    }
  }

  /**
   * Destroy session
   */
  async destroy(sessionId: string): Promise<boolean> {
    if (!await this.ensureConnected() || !this.client) {
      return false
    }

    const key = `${SESSION_PREFIX}${sessionId}`
    
    try {
      // Get session data to find user ID
      const data = await this.client.get(key)
      
      if (data) {
        const sessionData = JSON.parse(data) as SessionData
        
        // Remove from user's session index
        if (sessionData.userId) {
          const userKey = `user_sessions:${sessionData.userId}`
          await this.client.sRem(userKey, sessionId)
        }
      }

      // Delete session
      const deleted = await this.client.del(key)
      
      logger.info('Session destroyed', {
        sessionId: sessionId.substring(0, 8),
        success: deleted > 0
      })

      return deleted > 0
    } catch (error) {
      logger.error('Failed to destroy session:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: sessionId.substring(0, 8)
      })
      return false
    }
  }

  /**
   * Refresh session expiration
   */
  async refresh(sessionId: string): Promise<boolean> {
    if (!await this.ensureConnected() || !this.client) {
      return false
    }

    const key = `${SESSION_PREFIX}${sessionId}`
    
    try {
      const data = await this.client.get(key)
      
      if (!data) {
        return false
      }

      const sessionData = JSON.parse(data) as SessionData
      const now = Date.now()
      
      sessionData.expiresAt = now + (SESSION_DURATION * 1000)
      
      await this.client.setEx(
        key,
        SESSION_DURATION,
        JSON.stringify(sessionData)
      )

      logger.info('Session refreshed', {
        sessionId: sessionId.substring(0, 8)
      })

      return true
    } catch (error) {
      logger.error('Failed to refresh session:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: sessionId.substring(0, 8)
      })
      return false
    }
  }

  /**
   * Check if session exists
   */
  async exists(sessionId: string): Promise<boolean> {
    if (!await this.ensureConnected() || !this.client) {
      return false
    }

    const key = `${SESSION_PREFIX}${sessionId}`
    
    try {
      return await this.client.exists(key) > 0
    } catch (error) {
      logger.error('Failed to check session existence:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: sessionId.substring(0, 8)
      })
      return false
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<string[]> {
    if (!await this.ensureConnected() || !this.client) {
      return []
    }

    const userKey = `user_sessions:${userId}`
    
    try {
      const sessionIds = await this.client.sMembers(userKey)
      
      // Filter out expired sessions
      const validSessions: string[] = []
      
      for (const sessionId of sessionIds) {
        if (await this.exists(sessionId)) {
          validSessions.push(sessionId)
        } else {
          // Clean up stale reference
          await this.client.sRem(userKey, sessionId)
        }
      }

      return validSessions
    } catch (error) {
      logger.error('Failed to get user sessions:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      })
      return []
    }
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyUserSessions(userId: string): Promise<number> {
    if (!await this.ensureConnected() || !this.client) {
      return 0
    }

    try {
      const sessionIds = await this.getUserSessions(userId)
      let destroyed = 0

      for (const sessionId of sessionIds) {
        if (await this.destroy(sessionId)) {
          destroyed++
        }
      }

      // Clean up user session index
      const userKey = `user_sessions:${userId}`
      await this.client.del(userKey)

      logger.info('User sessions destroyed', {
        userId,
        count: destroyed
      })

      return destroyed
    } catch (error) {
      logger.error('Failed to destroy user sessions:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      })
      return 0
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit()
      this.isConnected = false
      logger.info('Redis client connection closed')
    }
  }
}

/**
 * Fallback in-memory session store for development
 */
class InMemorySessionStore implements SessionStore {
  private sessions = new Map<string, SessionData>()
  private userSessions = new Map<string, Set<string>>()

  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  async create(data: Omit<SessionData, 'createdAt' | 'lastAccessed' | 'expiresAt'>): Promise<string> {
    const sessionId = this.generateSessionId()
    const now = Date.now()
    const expiresAt = now + (SESSION_DURATION * 1000)

    const sessionData: SessionData = {
      ...data,
      createdAt: now,
      lastAccessed: now,
      expiresAt
    }

    this.sessions.set(sessionId, sessionData)

    // Add to user's session index
    if (data.userId) {
      if (!this.userSessions.has(data.userId)) {
        this.userSessions.set(data.userId, new Set())
      }
      this.userSessions.get(data.userId)!.add(sessionId)
    }

    logger.info('In-memory session created', {
      sessionId: sessionId.substring(0, 8),
      userId: data.userId
    })

    return sessionId
  }

  async get(sessionId: string): Promise<SessionData | null> {
    const sessionData = this.sessions.get(sessionId)
    
    if (!sessionData) {
      return null
    }

    const now = Date.now()

    // Check if session expired
    if (sessionData.expiresAt < now) {
      await this.destroy(sessionId)
      return null
    }

    // Update last accessed time
    sessionData.lastAccessed = now

    return sessionData
  }

  async update(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    const existing = this.sessions.get(sessionId)
    
    if (!existing) {
      return false
    }

    this.sessions.set(sessionId, { ...existing, ...updates })
    return true
  }

  async destroy(sessionId: string): Promise<boolean> {
    const sessionData = this.sessions.get(sessionId)
    
    if (sessionData?.userId) {
      const userSessions = this.userSessions.get(sessionData.userId)
      userSessions?.delete(sessionId)
    }

    return this.sessions.delete(sessionId)
  }

  async refresh(sessionId: string): Promise<boolean> {
    const sessionData = this.sessions.get(sessionId)
    
    if (!sessionData) {
      return false
    }

    const now = Date.now()
    sessionData.expiresAt = now + (SESSION_DURATION * 1000)
    
    return true
  }

  async exists(sessionId: string): Promise<boolean> {
    return this.sessions.has(sessionId)
  }

  async getUserSessions(userId: string): Promise<string[]> {
    const sessions = this.userSessions.get(userId)
    return sessions ? Array.from(sessions) : []
  }

  async destroyUserSessions(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId)
    let destroyed = 0

    for (const sessionId of sessions) {
      if (await this.destroy(sessionId)) {
        destroyed++
      }
    }

    this.userSessions.delete(userId)
    return destroyed
  }
}

// Export appropriate session store based on environment
export const sessionStore: SessionStore = 
  process.env.REDIS_URL || process.env.REDIS_TLS_URL
    ? new RedisSessionStore()
    : new InMemorySessionStore()

// Export types
export { RedisSessionStore, InMemorySessionStore }