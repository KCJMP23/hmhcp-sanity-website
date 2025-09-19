/**
 * WebSocket Message Replay System
 * 
 * Implements message persistence and replay for missed messages during disconnection
 * Ensures no critical updates are lost during network interruptions
 */

import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'

export interface ReplayableMessage {
  id: string
  channel: string
  type: string
  payload: any
  timestamp: Date
  userId?: string
  correlationId?: string
  ttl?: number // Time to live in seconds
  priority: 'low' | 'normal' | 'high' | 'critical'
  delivered: boolean
  deliveredAt?: Date
  attempts: number
  maxAttempts: number
}

export interface MessageStore {
  userId: string
  messages: ReplayableMessage[]
  lastSeen: Date
  missedMessageCount: number
  oldestUndelivered?: Date
}

export interface ReplayConfiguration {
  enabled: boolean
  maxMessagesPerUser: number
  defaultTTL: number // seconds
  maxRetryAttempts: number
  retryInterval: number // milliseconds
  persistToDatabase: boolean
  cleanupInterval: number // milliseconds
  priorityOrder: boolean
}

export class WebSocketMessageReplay {
  private configuration: ReplayConfiguration
  private messageStores: Map<string, MessageStore> = new Map()
  private messageQueue: Map<string, ReplayableMessage[]> = new Map()
  private deliveryTimers: Map<string, NodeJS.Timeout> = new Map()
  private cleanupTimer: NodeJS.Timeout | null = null
  private supabase: any = null
  private messageCounter: number = 0

  constructor(config: Partial<ReplayConfiguration> = {}) {
    this.configuration = {
      enabled: config.enabled !== false,
      maxMessagesPerUser: config.maxMessagesPerUser || 1000,
      defaultTTL: config.defaultTTL || 3600, // 1 hour default
      maxRetryAttempts: config.maxRetryAttempts || 3,
      retryInterval: config.retryInterval || 5000, // 5 seconds
      persistToDatabase: config.persistToDatabase || false,
      cleanupInterval: config.cleanupInterval || 60000, // 1 minute
      priorityOrder: config.priorityOrder !== false
    }

    if (this.configuration.persistToDatabase) {
      this.initializeDatabase()
    }

    this.startCleanupProcess()
  }

  /**
   * Initialize database connection for persistent storage
   */
  private async initializeDatabase(): Promise<void> {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !supabaseKey) {
        logger.warn('Supabase credentials not found, message persistence disabled')
        this.configuration.persistToDatabase = false
        return
      }

      this.supabase = createClient(supabaseUrl, supabaseKey)
      
      // Create table if it doesn't exist
      await this.createMessageReplayTable()
      
      logger.info('Message replay database initialized')
    } catch (error) {
      logger.error('Failed to initialize message replay database', { error })
      this.configuration.persistToDatabase = false
    }
  }

  /**
   * Create message replay table in database
   */
  private async createMessageReplayTable(): Promise<void> {
    if (!this.supabase) return

    const { error } = await this.supabase.rpc('create_message_replay_table', {
      table_sql: `
        CREATE TABLE IF NOT EXISTS websocket_message_replay (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message_id VARCHAR(255) UNIQUE NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          channel VARCHAR(255) NOT NULL,
          type VARCHAR(100) NOT NULL,
          payload JSONB NOT NULL,
          priority VARCHAR(20) NOT NULL DEFAULT 'normal',
          delivered BOOLEAN DEFAULT FALSE,
          delivered_at TIMESTAMPTZ,
          attempts INTEGER DEFAULT 0,
          max_attempts INTEGER DEFAULT 3,
          ttl INTEGER DEFAULT 3600,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL,
          INDEX idx_user_delivered (user_id, delivered),
          INDEX idx_expires (expires_at),
          INDEX idx_priority (priority, created_at)
        );
      `
    })

    if (error) {
      logger.error('Failed to create message replay table', { error })
    }
  }

  /**
   * Store a message for replay
   */
  async storeMessage(
    userId: string,
    message: Omit<ReplayableMessage, 'id' | 'delivered' | 'attempts' | 'maxAttempts'>
  ): Promise<string> {
    if (!this.configuration.enabled) {
      return ''
    }

    const messageId = this.generateMessageId()
    const replayableMessage: ReplayableMessage = {
      ...message,
      id: messageId,
      delivered: false,
      attempts: 0,
      maxAttempts: this.configuration.maxRetryAttempts,
      timestamp: message.timestamp || new Date(),
      ttl: message.ttl || this.configuration.defaultTTL
    }

    // Store in memory
    this.addToMemoryStore(userId, replayableMessage)

    // Store in database if configured
    if (this.configuration.persistToDatabase) {
      await this.persistMessage(userId, replayableMessage)
    }

    // Add to delivery queue if user is offline
    if (!this.isUserOnline(userId)) {
      this.addToDeliveryQueue(userId, replayableMessage)
    }

    logger.debug('Message stored for replay', { 
      messageId,
      userId,
      channel: message.channel,
      type: message.type 
    })

    return messageId
  }

  /**
   * Add message to memory store
   */
  private addToMemoryStore(userId: string, message: ReplayableMessage): void {
    if (!this.messageStores.has(userId)) {
      this.messageStores.set(userId, {
        userId,
        messages: [],
        lastSeen: new Date(),
        missedMessageCount: 0
      })
    }

    const store = this.messageStores.get(userId)!
    
    // Add message
    store.messages.push(message)
    
    // Update missed count if user is offline
    if (!this.isUserOnline(userId)) {
      store.missedMessageCount++
      if (!store.oldestUndelivered) {
        store.oldestUndelivered = message.timestamp
      }
    }

    // Enforce max messages limit
    if (store.messages.length > this.configuration.maxMessagesPerUser) {
      // Remove oldest delivered messages first
      const delivered = store.messages.filter(m => m.delivered)
      const undelivered = store.messages.filter(m => !m.delivered)
      
      if (delivered.length > 0) {
        const toRemove = store.messages.length - this.configuration.maxMessagesPerUser
        store.messages = [
          ...delivered.slice(toRemove),
          ...undelivered
        ]
      } else {
        // If all are undelivered, remove oldest
        store.messages = store.messages.slice(-this.configuration.maxMessagesPerUser)
      }
    }
  }

  /**
   * Persist message to database
   */
  private async persistMessage(userId: string, message: ReplayableMessage): Promise<void> {
    if (!this.supabase) return

    try {
      const expiresAt = new Date(message.timestamp.getTime() + (message.ttl! * 1000))
      
      const { error } = await this.supabase
        .from('websocket_message_replay')
        .insert({
          message_id: message.id,
          user_id: userId,
          channel: message.channel,
          type: message.type,
          payload: message.payload,
          priority: message.priority,
          delivered: message.delivered,
          attempts: message.attempts,
          max_attempts: message.maxAttempts,
          ttl: message.ttl,
          expires_at: expiresAt
        })

      if (error) {
        logger.error('Failed to persist message', { error, messageId: message.id })
      }
    } catch (error) {
      logger.error('Error persisting message', { error, messageId: message.id })
    }
  }

  /**
   * Get missed messages for a user
   */
  async getMissedMessages(userId: string, since?: Date): Promise<ReplayableMessage[]> {
    const messages: ReplayableMessage[] = []

    // Get from memory store
    const store = this.messageStores.get(userId)
    if (store) {
      const cutoffTime = since || store.lastSeen
      messages.push(
        ...store.messages.filter(m => 
          !m.delivered && 
          m.timestamp > cutoffTime &&
          !this.isMessageExpired(m)
        )
      )
    }

    // Get from database if configured
    if (this.configuration.persistToDatabase && this.supabase) {
      const dbMessages = await this.getMessagesFromDatabase(userId, since)
      
      // Merge with memory messages, avoiding duplicates
      const messageIds = new Set(messages.map(m => m.id))
      dbMessages.forEach(m => {
        if (!messageIds.has(m.id)) {
          messages.push(m)
        }
      })
    }

    // Sort by priority and timestamp if configured
    if (this.configuration.priorityOrder) {
      messages.sort((a, b) => {
        const priorityWeight = { critical: 4, high: 3, normal: 2, low: 1 }
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        return a.timestamp.getTime() - b.timestamp.getTime()
      })
    } else {
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    }

    logger.info('Retrieved missed messages', { 
      userId,
      count: messages.length,
      since: since?.toISOString() 
    })

    return messages
  }

  /**
   * Get messages from database
   */
  private async getMessagesFromDatabase(userId: string, since?: Date): Promise<ReplayableMessage[]> {
    if (!this.supabase) return []

    try {
      const query = this.supabase
        .from('websocket_message_replay')
        .select('*')
        .eq('user_id', userId)
        .eq('delivered', false)
        .gt('expires_at', new Date().toISOString())

      if (since) {
        query.gt('created_at', since.toISOString())
      }

      const { data, error } = await query
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(this.configuration.maxMessagesPerUser)

      if (error) {
        logger.error('Failed to get messages from database', { error })
        return []
      }

      return data.map((row: any) => ({
        id: row.message_id,
        channel: row.channel,
        type: row.type,
        payload: row.payload,
        timestamp: new Date(row.created_at),
        priority: row.priority,
        delivered: row.delivered,
        deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
        attempts: row.attempts,
        maxAttempts: row.max_attempts,
        ttl: row.ttl
      }))
    } catch (error) {
      logger.error('Error getting messages from database', { error })
      return []
    }
  }

  /**
   * Mark message as delivered
   */
  async markAsDelivered(messageId: string, userId: string): Promise<void> {
    // Update memory store
    const store = this.messageStores.get(userId)
    if (store) {
      const message = store.messages.find(m => m.id === messageId)
      if (message) {
        message.delivered = true
        message.deliveredAt = new Date()
        store.missedMessageCount = Math.max(0, store.missedMessageCount - 1)
      }
    }

    // Update database
    if (this.configuration.persistToDatabase && this.supabase) {
      await this.updateMessageInDatabase(messageId, { 
        delivered: true, 
        delivered_at: new Date() 
      })
    }

    // Remove from delivery queue
    this.removeFromDeliveryQueue(userId, messageId)

    logger.debug('Message marked as delivered', { messageId, userId })
  }

  /**
   * Mark multiple messages as delivered
   */
  async markMultipleAsDelivered(messageIds: string[], userId: string): Promise<void> {
    await Promise.all(messageIds.map(id => this.markAsDelivered(id, userId)))
  }

  /**
   * Update user online status
   */
  updateUserStatus(userId: string, online: boolean): void {
    if (!this.messageStores.has(userId)) {
      this.messageStores.set(userId, {
        userId,
        messages: [],
        lastSeen: new Date(),
        missedMessageCount: 0
      })
    }

    const store = this.messageStores.get(userId)!
    store.lastSeen = new Date()

    if (online) {
      // User came online, trigger replay
      this.triggerReplay(userId)
    } else {
      // User went offline, reset oldest undelivered
      store.oldestUndelivered = undefined
    }
  }

  /**
   * Trigger message replay for a user
   */
  private async triggerReplay(userId: string): Promise<void> {
    const messages = await this.getMissedMessages(userId)
    
    if (messages.length === 0) {
      logger.debug('No messages to replay', { userId })
      return
    }

    logger.info('Triggering message replay', { 
      userId,
      messageCount: messages.length 
    })

    // Add messages to delivery queue
    messages.forEach(message => {
      this.addToDeliveryQueue(userId, message)
    })

    // Start delivery process
    this.processDeliveryQueue(userId)
  }

  /**
   * Add message to delivery queue
   */
  private addToDeliveryQueue(userId: string, message: ReplayableMessage): void {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, [])
    }

    const queue = this.messageQueue.get(userId)!
    
    // Check if message already in queue
    if (!queue.find(m => m.id === message.id)) {
      queue.push(message)
    }
  }

  /**
   * Remove message from delivery queue
   */
  private removeFromDeliveryQueue(userId: string, messageId: string): void {
    const queue = this.messageQueue.get(userId)
    if (!queue) return

    const index = queue.findIndex(m => m.id === messageId)
    if (index > -1) {
      queue.splice(index, 1)
    }

    if (queue.length === 0) {
      this.messageQueue.delete(userId)
      
      // Clear delivery timer
      const timer = this.deliveryTimers.get(userId)
      if (timer) {
        clearTimeout(timer)
        this.deliveryTimers.delete(userId)
      }
    }
  }

  /**
   * Process delivery queue for a user
   */
  private processDeliveryQueue(userId: string): void {
    const queue = this.messageQueue.get(userId)
    if (!queue || queue.length === 0) return

    // Clear existing timer
    const existingTimer = this.deliveryTimers.get(userId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Process next message
    const message = queue[0]
    
    // Attempt delivery (this should be connected to actual WebSocket send)
    this.attemptDelivery(userId, message)

    // Schedule retry if needed
    if (message.attempts < message.maxAttempts) {
      const timer = setTimeout(() => {
        this.processDeliveryQueue(userId)
      }, this.configuration.retryInterval)
      
      this.deliveryTimers.set(userId, timer)
    } else {
      // Max attempts reached, remove from queue
      this.removeFromDeliveryQueue(userId, message.id)
      logger.warn('Message delivery failed after max attempts', { 
        messageId: message.id,
        userId 
      })
      
      // Process next message in queue
      this.processDeliveryQueue(userId)
    }
  }

  /**
   * Attempt to deliver a message
   */
  private attemptDelivery(userId: string, message: ReplayableMessage): void {
    message.attempts++
    
    // This should be connected to actual WebSocket send mechanism
    // For now, we'll emit an event that can be handled by the WebSocket manager
    
    logger.debug('Attempting message delivery', { 
      messageId: message.id,
      userId,
      attempt: message.attempts 
    })

    // Emit delivery event (to be handled by WebSocket manager)
    this.emit('replayMessage', { userId, message })
  }

  /**
   * Check if user is online
   */
  private isUserOnline(userId: string): boolean {
    // This should be connected to actual WebSocket connection status
    // For now, we'll use a simple time-based check
    const store = this.messageStores.get(userId)
    if (!store) return false

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return store.lastSeen > fiveMinutesAgo
  }

  /**
   * Check if message is expired
   */
  private isMessageExpired(message: ReplayableMessage): boolean {
    if (!message.ttl) return false
    
    const expiryTime = new Date(message.timestamp.getTime() + (message.ttl * 1000))
    return expiryTime < new Date()
  }

  /**
   * Update message in database
   */
  private async updateMessageInDatabase(messageId: string, updates: any): Promise<void> {
    if (!this.supabase) return

    try {
      const { error } = await this.supabase
        .from('websocket_message_replay')
        .update(updates)
        .eq('message_id', messageId)

      if (error) {
        logger.error('Failed to update message in database', { error, messageId })
      }
    } catch (error) {
      logger.error('Error updating message in database', { error, messageId })
    }
  }

  /**
   * Start cleanup process
   */
  private startCleanupProcess(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredMessages()
    }, this.configuration.cleanupInterval)
  }

  /**
   * Clean up expired messages
   */
  private async cleanupExpiredMessages(): Promise<void> {
    const now = new Date()

    // Clean memory stores
    this.messageStores.forEach((store, userId) => {
      const beforeCount = store.messages.length
      store.messages = store.messages.filter(m => !this.isMessageExpired(m))
      const removed = beforeCount - store.messages.length
      
      if (removed > 0) {
        logger.debug('Cleaned up expired messages', { userId, removed })
      }
    })

    // Clean database
    if (this.configuration.persistToDatabase && this.supabase) {
      try {
        const { error, count } = await this.supabase
          .from('websocket_message_replay')
          .delete()
          .lt('expires_at', now.toISOString())

        if (error) {
          logger.error('Failed to clean up database messages', { error })
        } else if (count > 0) {
          logger.info('Cleaned up expired database messages', { count })
        }
      } catch (error) {
        logger.error('Error cleaning up database messages', { error })
      }
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${++this.messageCounter}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Event emitter functionality (simplified)
   */
  private eventHandlers: Map<string, Function[]> = new Map()

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        logger.error('Event handler error', { event, error })
      }
    })
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Get replay statistics
   */
  getStatistics() {
    const stats = {
      totalUsers: this.messageStores.size,
      totalMessages: 0,
      totalUndelivered: 0,
      totalQueued: 0,
      oldestUndelivered: null as Date | null,
      userStats: [] as any[]
    }

    this.messageStores.forEach((store, userId) => {
      const undelivered = store.messages.filter(m => !m.delivered).length
      stats.totalMessages += store.messages.length
      stats.totalUndelivered += undelivered
      
      if (store.oldestUndelivered && (!stats.oldestUndelivered || store.oldestUndelivered < stats.oldestUndelivered)) {
        stats.oldestUndelivered = store.oldestUndelivered
      }

      stats.userStats.push({
        userId,
        totalMessages: store.messages.length,
        undelivered,
        missedCount: store.missedMessageCount,
        lastSeen: store.lastSeen
      })
    })

    this.messageQueue.forEach(queue => {
      stats.totalQueued += queue.length
    })

    return stats
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Clear timers
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    this.deliveryTimers.forEach(timer => clearTimeout(timer))
    this.deliveryTimers.clear()

    // Clear data
    this.messageStores.clear()
    this.messageQueue.clear()
    this.eventHandlers.clear()

    logger.info('Message replay system destroyed')
  }
}

// Export singleton for easy use
export const messageReplay = new WebSocketMessageReplay()

// Export utility functions
export function storeReplayableMessage(
  userId: string,
  message: Omit<ReplayableMessage, 'id' | 'delivered' | 'attempts' | 'maxAttempts'>
): Promise<string> {
  return messageReplay.storeMessage(userId, message)
}

export function getMissedMessages(userId: string, since?: Date): Promise<ReplayableMessage[]> {
  return messageReplay.getMissedMessages(userId, since)
}

export function markMessageDelivered(messageId: string, userId: string): Promise<void> {
  return messageReplay.markAsDelivered(messageId, userId)
}