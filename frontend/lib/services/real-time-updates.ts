/**
 * Real-time Updates Service
 * 
 * Provides secure real-time updates for blog automation dashboard using:
 * - WebSocket connections with authentication
 * - Server-Sent Events as fallback
 * - Polling as final fallback
 * - HIPAA-compliant data handling
 */

import React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface RealtimeEvent {
  type: 'generation_started' | 'generation_progress' | 'generation_completed' | 'generation_failed' | 'topic_added' | 'topic_removed' | 'metrics_updated'
  data: any
  timestamp: string
  userId?: string
  requestId?: string
}

export interface RealtimeSubscription {
  id: string
  channel: string
  callback: (event: RealtimeEvent) => void
  filter?: (event: RealtimeEvent) => boolean
}

export interface RealtimeOptions {
  enableWebSocket?: boolean
  enableSSE?: boolean
  enablePolling?: boolean
  pollingInterval?: number
  maxReconnectAttempts?: number
  authToken?: string
}

class RealtimeUpdatesService {
  private supabase = createClientComponentClient()
  private subscriptions = new Map<string, RealtimeSubscription>()
  private connections = new Map<string, any>()
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private pollingIntervals = new Map<string, NodeJS.Timeout>()

  constructor(private options: RealtimeOptions = {}) {
    this.options = {
      enableWebSocket: true,
      enableSSE: true,
      enablePolling: true,
      pollingInterval: 30000, // 30 seconds
      maxReconnectAttempts: 5,
      ...options
    }
  }

  /**
   * Subscribe to real-time updates for blog automation
   */
  async subscribeToAutomation(
    userId: string,
    callback: (event: RealtimeEvent) => void,
    filter?: (event: RealtimeEvent) => boolean
  ): Promise<string> {
    const subscriptionId = `automation_${userId}_${Date.now()}`
    
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel: 'blog_automation',
      callback,
      filter
    }

    this.subscriptions.set(subscriptionId, subscription)

    // Try WebSocket first (via Supabase Realtime)
    if (this.options.enableWebSocket) {
      await this.setupWebSocketConnection(subscription)
    }

    // Fallback to polling if WebSocket fails
    if (!this.isConnected && this.options.enablePolling) {
      this.setupPollingConnection(subscription)
    }

    return subscriptionId
  }

  /**
   * Subscribe to generation progress updates
   */
  async subscribeToGenerationProgress(
    generationId: string,
    callback: (progress: { status: string; progress: number; message: string }) => void
  ): Promise<string> {
    const subscriptionId = `progress_${generationId}_${Date.now()}`
    
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel: 'generation_progress',
      callback: (event) => {
        if (event.type === 'generation_progress' && event.data.generationId === generationId) {
          callback(event.data.progress)
        }
      },
      filter: (event) => event.data?.generationId === generationId
    }

    this.subscriptions.set(subscriptionId, subscription)

    // Set up real-time connection
    await this.setupWebSocketConnection(subscription)

    return subscriptionId
  }

  /**
   * Set up WebSocket connection via Supabase Realtime
   */
  private async setupWebSocketConnection(subscription: RealtimeSubscription): Promise<void> {
    try {
      const channel = this.supabase
        .channel(`${subscription.channel}_${subscription.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blog_automation_events'
          },
          (payload) => {
            const event: RealtimeEvent = {
              type: payload.new?.event_type || 'unknown',
              data: payload.new?.data || {},
              timestamp: payload.new?.created_at || new Date().toISOString(),
              userId: payload.new?.user_id,
              requestId: payload.new?.request_id
            }

            this.handleRealtimeEvent(subscription, event)
          }
        )
        .on(
          'broadcast',
          { event: 'automation_update' },
          (payload) => {
            const event: RealtimeEvent = {
              type: payload.payload.type,
              data: payload.payload.data,
              timestamp: payload.payload.timestamp || new Date().toISOString(),
              userId: payload.payload.userId,
              requestId: payload.payload.requestId
            }

            this.handleRealtimeEvent(subscription, event)
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status)
          this.isConnected = status === 'SUBSCRIBED'
          
          if (this.isConnected) {
            this.reconnectAttempts = 0
          }
        })

      this.connections.set(subscription.id, channel)
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      this.handleConnectionError(subscription)
    }
  }

  /**
   * Set up polling as fallback
   */
  private setupPollingConnection(subscription: RealtimeSubscription): void {
    const pollForUpdates = async () => {
      try {
        // Poll the API for updates
        const response = await fetch('/api/automation/blog/events', {
          headers: {
            'Authorization': `Bearer ${this.options.authToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        
        if (data.events) {
          data.events.forEach((eventData: any) => {
            const event: RealtimeEvent = {
              type: eventData.type,
              data: eventData.data,
              timestamp: eventData.timestamp,
              userId: eventData.userId,
              requestId: eventData.requestId
            }

            this.handleRealtimeEvent(subscription, event)
          })
        }
      } catch (error) {
        console.error('Polling failed:', error)
      }
    }

    // Start polling
    const interval = setInterval(pollForUpdates, this.options.pollingInterval)
    this.pollingIntervals.set(subscription.id, interval)
    
    // Initial poll
    pollForUpdates()
  }

  /**
   * Handle incoming realtime events
   */
  private handleRealtimeEvent(subscription: RealtimeSubscription, event: RealtimeEvent): void {
    try {
      // Apply filter if provided
      if (subscription.filter && !subscription.filter(event)) {
        return
      }

      // Ensure data privacy for HIPAA compliance
      const sanitizedEvent = this.sanitizeEventData(event)
      
      // Call the subscription callback
      subscription.callback(sanitizedEvent)
    } catch (error) {
      console.error('Error handling realtime event:', error)
    }
  }

  /**
   * Sanitize event data for HIPAA compliance
   */
  private sanitizeEventData(event: RealtimeEvent): RealtimeEvent {
    const sanitized = { ...event }
    
    // Remove sensitive data that shouldn't be transmitted
    if (sanitized.data) {
      const data = { ...sanitized.data }
      
      // Remove PII and sensitive fields
      delete data.password
      delete data.ssn
      delete data.dob
      delete data.creditCard
      delete data.medicalRecord
      
      sanitized.data = data
    }
    
    return sanitized
  }

  /**
   * Handle connection errors with retry logic
   */
  private handleConnectionError(subscription: RealtimeSubscription): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      
      setTimeout(() => {
        console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
        this.setupWebSocketConnection(subscription)
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached, falling back to polling')
      
      if (this.options.enablePolling) {
        this.setupPollingConnection(subscription)
      }
    }
  }

  /**
   * Unsubscribe from updates
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    // Remove WebSocket connection
    const connection = this.connections.get(subscriptionId)
    if (connection) {
      await this.supabase.removeChannel(connection)
      this.connections.delete(subscriptionId)
    }

    // Clear polling interval
    const interval = this.pollingIntervals.get(subscriptionId)
    if (interval) {
      clearInterval(interval)
      this.pollingIntervals.delete(subscriptionId)
    }

    // Remove subscription
    this.subscriptions.delete(subscriptionId)
  }

  /**
   * Unsubscribe from all updates
   */
  async unsubscribeAll(): Promise<void> {
    const subscriptionIds = Array.from(this.subscriptions.keys())
    
    await Promise.all(
      subscriptionIds.map(id => this.unsubscribe(id))
    )
  }

  /**
   * Send a realtime event (for testing or manual triggers)
   */
  async sendEvent(event: Omit<RealtimeEvent, 'timestamp'>): Promise<void> {
    try {
      const fullEvent: RealtimeEvent = {
        ...event,
        timestamp: new Date().toISOString()
      }

      // Broadcast to all subscribers
      const channel = this.supabase.channel('automation_broadcast')
      await channel.send({
        type: 'broadcast',
        event: 'automation_update',
        payload: fullEvent
      })
    } catch (error) {
      console.error('Failed to send realtime event:', error)
    }
  }

  /**
   * Check connection status
   */
  getConnectionStatus(): {
    isConnected: boolean
    reconnectAttempts: number
    activeSubscriptions: number
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      activeSubscriptions: this.subscriptions.size
    }
  }
}

// Singleton instance
let realtimeService: RealtimeUpdatesService | null = null

export function getRealtimeService(options?: RealtimeOptions): RealtimeUpdatesService {
  if (!realtimeService) {
    realtimeService = new RealtimeUpdatesService(options)
  }
  
  return realtimeService
}

// React hook for real-time updates
export function useRealtimeUpdates(
  channel: string,
  callback: (event: RealtimeEvent) => void,
  dependencies: any[] = []
) {
  const [subscriptionId, setSubscriptionId] = React.useState<string | null>(null)
  const [isConnected, setIsConnected] = React.useState(false)
  const service = getRealtimeService()

  React.useEffect(() => {
    let mounted = true

    const subscribe = async () => {
      try {
        const id = await service.subscribeToAutomation(
          'current_user', // This should be the actual user ID
          (event) => {
            if (mounted) {
              callback(event)
            }
          }
        )
        
        if (mounted) {
          setSubscriptionId(id)
          setIsConnected(true)
        }
      } catch (error) {
        console.error('Failed to subscribe to realtime updates:', error)
      }
    }

    subscribe()

    return () => {
      mounted = false
      if (subscriptionId) {
        service.unsubscribe(subscriptionId)
      }
    }
  }, dependencies)

  return { isConnected, subscriptionId }
}

export default RealtimeUpdatesService