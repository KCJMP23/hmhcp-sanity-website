/**
 * Real-time Security Monitoring Service
 * WebSocket-based live security status updates
 * 
 * Story 1.6 Task 6: Security Dashboard Implementation
 */

import { EventEmitter } from 'events'

// Types
export interface SecurityRealtimeEvent {
  id: string
  type: 'threat_detected' | 'login_attempt' | 'suspicious_activity' | 'system_alert' | 'compliance_change'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
  userId?: string
  ipAddress?: string
  metadata?: Record<string, any>
}

export interface SecurityMetricsUpdate {
  timestamp: string
  metrics: {
    overall_security_score?: number
    active_threats?: number
    blocked_attempts_24h?: number
    active_sessions?: number
    mfa_adoption_rate?: number
  }
  changes: {
    metric: string
    previousValue: number
    currentValue: number
    changePercent: number
  }[]
}

export interface SystemHealthUpdate {
  timestamp: string
  services: {
    database: 'healthy' | 'warning' | 'critical'
    auth_service: 'healthy' | 'warning' | 'critical'
    monitoring: 'healthy' | 'warning' | 'critical'
    encryption: 'healthy' | 'warning' | 'critical'
    backup: 'healthy' | 'warning' | 'critical'
  }
  alerts: string[]
}

export interface MonitoringConfig {
  wsUrl?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  enableAutoReconnect?: boolean
}

/**
 * Real-time Security Monitoring Service
 */
export class SecurityRealtimeMonitor extends EventEmitter {
  private ws: WebSocket | null = null
  private config: Required<MonitoringConfig>
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isConnected = false
  private messageQueue: any[] = []
  private lastMetrics: SecurityMetricsUpdate | null = null
  private lastHealth: SystemHealthUpdate | null = null

  constructor(config: MonitoringConfig = {}) {
    super()
    
    this.config = {
      wsUrl: config.wsUrl || this.getWebSocketUrl(),
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      enableAutoReconnect: config.enableAutoReconnect !== false
    }
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(): string {
    if (typeof window === 'undefined') {
      return 'ws://localhost:3002/security/realtime'
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/api/security/realtime`
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    try {
      this.ws = new WebSocket(this.config.wsUrl)
      this.setupEventHandlers()
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.emit('error', error)
      this.scheduleReconnect()
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('WebSocket connected to security monitoring service')
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connected')
      
      // Send authentication token if available
      this.authenticate()
      
      // Start heartbeat
      this.startHeartbeat()
      
      // Process queued messages
      this.processMessageQueue()
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
        this.emit('error', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', error)
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      this.isConnected = false
      this.emit('disconnected', { code: event.code, reason: event.reason })
      
      this.stopHeartbeat()
      
      if (this.config.enableAutoReconnect && !event.wasClean) {
        this.scheduleReconnect()
      }
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    switch (data.type) {
      case 'security_event':
        this.handleSecurityEvent(data.payload)
        break
        
      case 'metrics_update':
        this.handleMetricsUpdate(data.payload)
        break
        
      case 'health_update':
        this.handleHealthUpdate(data.payload)
        break
        
      case 'threat_alert':
        this.handleThreatAlert(data.payload)
        break
        
      case 'compliance_alert':
        this.handleComplianceAlert(data.payload)
        break
        
      case 'heartbeat':
        // Server heartbeat acknowledgment
        break
        
      case 'auth_success':
        console.log('Authentication successful')
        this.emit('authenticated')
        break
        
      case 'auth_failure':
        console.error('Authentication failed:', data.payload)
        this.emit('auth_failed', data.payload)
        this.disconnect()
        break
        
      default:
        console.warn('Unknown message type:', data.type)
    }
  }

  /**
   * Handle security event
   */
  private handleSecurityEvent(event: SecurityRealtimeEvent): void {
    this.emit('security_event', event)
    
    // Emit specific event types
    switch (event.type) {
      case 'threat_detected':
        this.emit('threat_detected', event)
        break
      case 'login_attempt':
        this.emit('login_attempt', event)
        break
      case 'suspicious_activity':
        this.emit('suspicious_activity', event)
        break
      case 'system_alert':
        this.emit('system_alert', event)
        break
      case 'compliance_change':
        this.emit('compliance_change', event)
        break
    }
    
    // Store high-severity events
    if (event.severity === 'critical' || event.severity === 'high') {
      this.emit('high_severity_event', event)
    }
  }

  /**
   * Handle metrics update
   */
  private handleMetricsUpdate(update: SecurityMetricsUpdate): void {
    // Calculate changes if we have previous metrics
    if (this.lastMetrics) {
      const changes: SecurityMetricsUpdate['changes'] = []
      
      Object.entries(update.metrics).forEach(([key, value]) => {
        const previousValue = (this.lastMetrics?.metrics as any)[key]
        if (previousValue !== undefined && previousValue !== value) {
          const changePercent = previousValue === 0 
            ? 100 
            : ((value! - previousValue) / previousValue) * 100
          
          changes.push({
            metric: key,
            previousValue,
            currentValue: value!,
            changePercent
          })
        }
      })
      
      update.changes = changes
    }
    
    this.lastMetrics = update
    this.emit('metrics_update', update)
  }

  /**
   * Handle system health update
   */
  private handleHealthUpdate(update: SystemHealthUpdate): void {
    // Check for critical changes
    if (this.lastHealth) {
      const criticalChanges: string[] = []
      
      Object.entries(update.services).forEach(([service, status]) => {
        const previousStatus = (this.lastHealth?.services as any)[service]
        if (previousStatus && previousStatus !== status) {
          if (status === 'critical') {
            criticalChanges.push(`${service} is now critical`)
          } else if (previousStatus === 'critical' && status === 'healthy') {
            criticalChanges.push(`${service} recovered`)
          }
        }
      })
      
      if (criticalChanges.length > 0) {
        this.emit('critical_health_change', {
          changes: criticalChanges,
          update
        })
      }
    }
    
    this.lastHealth = update
    this.emit('health_update', update)
  }

  /**
   * Handle threat alert
   */
  private handleThreatAlert(alert: any): void {
    this.emit('threat_alert', alert)
    
    // Auto-escalate critical threats
    if (alert.severity === 'critical' && alert.auto_escalate) {
      this.emit('threat_escalation', alert)
    }
  }

  /**
   * Handle compliance alert
   */
  private handleComplianceAlert(alert: any): void {
    this.emit('compliance_alert', alert)
  }

  /**
   * Authenticate WebSocket connection
   */
  private authenticate(): void {
    // Get auth token from session storage or cookie
    const token = this.getAuthToken()
    
    if (token) {
      this.send({
        type: 'authenticate',
        payload: { token }
      })
    }
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    
    // Try session storage first
    const sessionToken = sessionStorage.getItem('security_ws_token')
    if (sessionToken) return sessionToken
    
    // Try to get from cookie
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'security_token') {
        return decodeURIComponent(value)
      }
    }
    
    return null
  }

  /**
   * Send message to WebSocket server
   */
  public send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      // Queue message if not connected
      this.messageQueue.push(data)
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()
      this.ws.send(JSON.stringify(message))
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'heartbeat', timestamp: new Date().toISOString() })
      }
    }, this.config.heartbeatInterval)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.emit('max_reconnect_attempts')
      return
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    
    this.reconnectAttempts++
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    )
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  /**
   * Subscribe to specific event types
   */
  public subscribe(eventTypes: string[]): void {
    this.send({
      type: 'subscribe',
      payload: { events: eventTypes }
    })
  }

  /**
   * Unsubscribe from specific event types
   */
  public unsubscribe(eventTypes: string[]): void {
    this.send({
      type: 'unsubscribe',
      payload: { events: eventTypes }
    })
  }

  /**
   * Request immediate metrics update
   */
  public requestMetricsUpdate(): void {
    this.send({
      type: 'request_metrics',
      payload: { immediate: true }
    })
  }

  /**
   * Request system health check
   */
  public requestHealthCheck(): void {
    this.send({
      type: 'request_health',
      payload: { detailed: true }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.config.enableAutoReconnect = false
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.stopHeartbeat()
    
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnect')
      }
      this.ws = null
    }
    
    this.isConnected = false
    this.messageQueue = []
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): {
    connected: boolean
    reconnectAttempts: number
    lastMetrics: SecurityMetricsUpdate | null
    lastHealth: SystemHealthUpdate | null
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      lastMetrics: this.lastMetrics,
      lastHealth: this.lastHealth
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.disconnect()
    this.removeAllListeners()
  }
}

// Export singleton instance
let monitorInstance: SecurityRealtimeMonitor | null = null

export function getSecurityMonitor(config?: MonitoringConfig): SecurityRealtimeMonitor {
  if (!monitorInstance) {
    monitorInstance = new SecurityRealtimeMonitor(config)
  }
  return monitorInstance
}

export function destroySecurityMonitor(): void {
  if (monitorInstance) {
    monitorInstance.destroy()
    monitorInstance = null
  }
}