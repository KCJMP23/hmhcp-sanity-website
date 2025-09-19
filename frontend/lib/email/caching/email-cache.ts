// Email Caching Strategy
// Created: 2025-01-27
// Purpose: Implement caching strategy for frequently accessed email data

import { Redis } from 'ioredis'

interface CacheConfig {
  redis: {
    host: string
    port: number
    password?: string
    db?: number
  }
  defaultTTL: number
  maxRetries: number
}

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

export class EmailCacheManager {
  private redis: Redis
  private config: CacheConfig
  private isConnected: boolean = false

  constructor(config: CacheConfig) {
    this.config = config
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: config.maxRetries,
      lazyConnect: true
    })

    this.redis.on('connect', () => {
      this.isConnected = true
      console.log('Email cache connected to Redis')
    })

    this.redis.on('error', (error) => {
      console.error('Email cache Redis error:', error)
      this.isConnected = false
    })
  }

  // Template caching
  async getTemplate(templateId: string): Promise<any | null> {
    if (!this.isConnected) return null
    
    try {
      const cached = await this.redis.get(`template:${templateId}`)
      if (!cached) return null
      
      const item: CacheItem<any> = JSON.parse(cached)
      
      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        await this.redis.del(`template:${templateId}`)
        return null
      }
      
      return item.data
    } catch (error) {
      console.error('Error getting template from cache:', error)
      return null
    }
  }

  async setTemplate(templateId: string, template: any, ttl?: number): Promise<void> {
    if (!this.isConnected) return
    
    try {
      const item: CacheItem<any> = {
        data: template,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL
      }
      
      await this.redis.setex(
        `template:${templateId}`,
        item.ttl / 1000,
        JSON.stringify(item)
      )
    } catch (error) {
      console.error('Error setting template in cache:', error)
    }
  }

  async invalidateTemplate(templateId: string): Promise<void> {
    if (!this.isConnected) return
    
    try {
      await this.redis.del(`template:${templateId}`)
    } catch (error) {
      console.error('Error invalidating template cache:', error)
    }
  }

  // Contact caching
  async getContact(contactId: string): Promise<any | null> {
    if (!this.isConnected) return null
    
    try {
      const cached = await this.redis.get(`contact:${contactId}`)
      if (!cached) return null
      
      const item: CacheItem<any> = JSON.parse(cached)
      
      if (Date.now() - item.timestamp > item.ttl) {
        await this.redis.del(`contact:${contactId}`)
        return null
      }
      
      return item.data
    } catch (error) {
      console.error('Error getting contact from cache:', error)
      return null
    }
  }

  async setContact(contactId: string, contact: any, ttl?: number): Promise<void> {
    if (!this.isConnected) return
    
    try {
      const item: CacheItem<any> = {
        data: contact,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL
      }
      
      await this.redis.setex(
        `contact:${contactId}`,
        item.ttl / 1000,
        JSON.stringify(item)
      )
    } catch (error) {
      console.error('Error setting contact in cache:', error)
    }
  }

  // Segment caching
  async getSegment(segmentId: string): Promise<any | null> {
    if (!this.isConnected) return null
    
    try {
      const cached = await this.redis.get(`segment:${segmentId}`)
      if (!cached) return null
      
      const item: CacheItem<any> = JSON.parse(cached)
      
      if (Date.now() - item.timestamp > item.ttl) {
        await this.redis.del(`segment:${segmentId}`)
        return null
      }
      
      return item.data
    } catch (error) {
      console.error('Error getting segment from cache:', error)
      return null
    }
  }

  async setSegment(segmentId: string, segment: any, ttl?: number): Promise<void> {
    if (!this.isConnected) return
    
    try {
      const item: CacheItem<any> = {
        data: segment,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL
      }
      
      await this.redis.setex(
        `segment:${segmentId}`,
        item.ttl / 1000,
        JSON.stringify(item)
      )
    } catch (error) {
      console.error('Error setting segment in cache:', error)
    }
  }

  // Campaign caching
  async getCampaign(campaignId: string): Promise<any | null> {
    if (!this.isConnected) return null
    
    try {
      const cached = await this.redis.get(`campaign:${campaignId}`)
      if (!cached) return null
      
      const item: CacheItem<any> = JSON.parse(cached)
      
      if (Date.now() - item.timestamp > item.ttl) {
        await this.redis.del(`campaign:${campaignId}`)
        return null
      }
      
      return item.data
    } catch (error) {
      console.error('Error getting campaign from cache:', error)
      return null
    }
  }

  async setCampaign(campaignId: string, campaign: any, ttl?: number): Promise<void> {
    if (!this.isConnected) return
    
    try {
      const item: CacheItem<any> = {
        data: campaign,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL
      }
      
      await this.redis.setex(
        `campaign:${campaignId}`,
        item.ttl / 1000,
        JSON.stringify(item)
      )
    } catch (error) {
      console.error('Error setting campaign in cache:', error)
    }
  }

  // Analytics caching
  async getAnalytics(key: string): Promise<any | null> {
    if (!this.isConnected) return null
    
    try {
      const cached = await this.redis.get(`analytics:${key}`)
      if (!cached) return null
      
      const item: CacheItem<any> = JSON.parse(cached)
      
      if (Date.now() - item.timestamp > item.ttl) {
        await this.redis.del(`analytics:${key}`)
        return null
      }
      
      return item.data
    } catch (error) {
      console.error('Error getting analytics from cache:', error)
      return null
    }
  }

  async setAnalytics(key: string, data: any, ttl?: number): Promise<void> {
    if (!this.isConnected) return
    
    try {
      const item: CacheItem<any> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL
      }
      
      await this.redis.setex(
        `analytics:${key}`,
        item.ttl / 1000,
        JSON.stringify(item)
      )
    } catch (error) {
      console.error('Error setting analytics in cache:', error)
    }
  }

  // Cache warming
  async warmCache(templates: any[], contacts: any[], segments: any[]): Promise<void> {
    if (!this.isConnected) return
    
    try {
      const pipeline = this.redis.pipeline()
      
      // Warm template cache
      templates.forEach(template => {
        const item: CacheItem<any> = {
          data: template,
          timestamp: Date.now(),
          ttl: this.config.defaultTTL
        }
        pipeline.setex(
          `template:${template.id}`,
          item.ttl / 1000,
          JSON.stringify(item)
        )
      })
      
      // Warm contact cache
      contacts.forEach(contact => {
        const item: CacheItem<any> = {
          data: contact,
          timestamp: Date.now(),
          ttl: this.config.defaultTTL
        }
        pipeline.setex(
          `contact:${contact.id}`,
          item.ttl / 1000,
          JSON.stringify(item)
        )
      })
      
      // Warm segment cache
      segments.forEach(segment => {
        const item: CacheItem<any> = {
          data: segment,
          timestamp: Date.now(),
          ttl: this.config.defaultTTL
        }
        pipeline.setex(
          `segment:${segment.id}`,
          item.ttl / 1000,
          JSON.stringify(item)
        )
      })
      
      await pipeline.exec()
    } catch (error) {
      console.error('Error warming cache:', error)
    }
  }

  // Cache invalidation
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isConnected) return
    
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Error invalidating cache pattern:', error)
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; connected: boolean }> {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', connected: false }
      }
      
      await this.redis.ping()
      return { status: 'healthy', connected: true }
    } catch (error) {
      return { status: 'error', connected: false }
    }
  }

  // Close connection
  async close(): Promise<void> {
    await this.redis.quit()
  }
}

// Cache configuration
export const emailCacheConfig: CacheConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0')
  },
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  maxRetries: 3
}

// Singleton instance
export const emailCache = new EmailCacheManager(emailCacheConfig)
