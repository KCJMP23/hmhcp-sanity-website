/**
 * Infrastructure Monitoring & Failover System
 * Real-time monitoring with automatic failover capabilities
 */

import { logger } from '@/lib/logger'
import { auditLogger, AuditEventType, AuditOutcome, AuditAction } from '@/lib/security/audit-logging'

export interface MonitoringConfig {
  healthCheckInterval: number // milliseconds
  failoverThreshold: number // consecutive failures before failover
  recoveryThreshold: number // consecutive successes before recovery
  timeout: number // request timeout in milliseconds
  enableAutoFailover: boolean
  enableAutoRecovery: boolean
  notificationChannels: string[]
}

export interface ServiceEndpoint {
  id: string
  name: string
  url: string
  type: 'primary' | 'secondary' | 'backup'
  priority: number
  healthCheck: {
    path: string
    expectedStatus: number
    expectedResponse?: string
    timeout?: number
  }
}

export interface HealthStatus {
  service: string
  endpoint: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  responseTime: number
  lastCheck: Date
  consecutiveFailures: number
  consecutiveSuccesses: number
  uptime: number // percentage
  errors: string[]
}

export interface FailoverEvent {
  id: string
  timestamp: Date
  fromEndpoint: string
  toEndpoint: string
  reason: string
  automatic: boolean
  duration?: number
  status: 'initiated' | 'completed' | 'failed' | 'reverted'
}

interface AlertConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms'
  endpoint: string
  threshold: 'warning' | 'critical' | 'emergency'
  enabled: boolean
}

const DEFAULT_CONFIG: MonitoringConfig = {
  healthCheckInterval: 30000, // 30 seconds
  failoverThreshold: 3, // 3 consecutive failures
  recoveryThreshold: 5, // 5 consecutive successes
  timeout: 10000, // 10 seconds
  enableAutoFailover: true,
  enableAutoRecovery: false, // Manual recovery for safety
  notificationChannels: ['email', 'slack']
}

class InfrastructureMonitor {
  private config: MonitoringConfig
  private services: Map<string, ServiceEndpoint[]> = new Map()
  private healthStatuses: Map<string, HealthStatus> = new Map()
  private failoverHistory: Map<string, FailoverEvent> = new Map()
  private activeEndpoints: Map<string, string> = new Map() // service -> active endpoint
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()
  private alertChannels: AlertConfig[] = []

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeAlertChannels()
  }

  /**
   * Register service endpoints for monitoring
   */
  registerService(serviceName: string, endpoints: ServiceEndpoint[]): void {
    if (endpoints.length === 0) {
      throw new Error('At least one endpoint required for service')
    }

    // Sort by priority (lower number = higher priority)
    const sortedEndpoints = endpoints.sort((a, b) => a.priority - b.priority)
    this.services.set(serviceName, sortedEndpoints)

    // Set primary endpoint as active
    const primaryEndpoint = sortedEndpoints.find(ep => ep.type === 'primary') || sortedEndpoints[0]
    this.activeEndpoints.set(serviceName, primaryEndpoint.id)

    // Initialize health status for all endpoints
    sortedEndpoints.forEach(endpoint => {
      this.healthStatuses.set(endpoint.id, {
        service: serviceName,
        endpoint: endpoint.id,
        status: 'unknown',
        responseTime: 0,
        lastCheck: new Date(),
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        uptime: 100,
        errors: []
      })
    })

    logger.info(`Registered service ${serviceName} with ${endpoints.length} endpoints`)
  }

  /**
   * Start monitoring all registered services
   */
  startMonitoring(): void {
    for (const [serviceName, endpoints] of this.services.entries()) {
      this.startServiceMonitoring(serviceName, endpoints)
    }

    auditLogger.logSystemEvent({
      eventType: AuditEventType.SYSTEM_STARTUP,
      resource: 'infrastructure_monitor',
      action: AuditAction.MONITOR,
      outcome: AuditOutcome.SUCCESS,
      details: { 
        services: Array.from(this.services.keys()),
        config: this.config
      }
    })

    logger.info('Infrastructure monitoring started for all services')
  }

  /**
   * Stop monitoring all services
   */
  stopMonitoring(): void {
    for (const [serviceName, interval] of this.monitoringIntervals.entries()) {
      clearInterval(interval)
      this.monitoringIntervals.delete(serviceName)
    }

    logger.info('Infrastructure monitoring stopped')
  }

  /**
   * Perform manual failover
   */
  async performManualFailover(
    serviceName: string, 
    targetEndpointId: string,
    reason: string
  ): Promise<FailoverEvent> {
    const startTime = Date.now()
    const failoverId = `failover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const serviceEndpoints = this.services.get(serviceName)
      if (!serviceEndpoints) {
        throw new Error(`Service ${serviceName} not found`)
      }

      const currentEndpointId = this.activeEndpoints.get(serviceName)
      const targetEndpoint = serviceEndpoints.find(ep => ep.id === targetEndpointId)

      if (!targetEndpoint) {
        throw new Error(`Target endpoint ${targetEndpointId} not found`)
      }

      if (currentEndpointId === targetEndpointId) {
        throw new Error('Target endpoint is already active')
      }

      logger.info(`Initiating manual failover for ${serviceName}`, {
        from: currentEndpointId,
        to: targetEndpointId,
        reason
      })

      const failoverEvent: FailoverEvent = {
        id: failoverId,
        timestamp: new Date(),
        fromEndpoint: currentEndpointId || 'unknown',
        toEndpoint: targetEndpointId,
        reason,
        automatic: false,
        status: 'initiated'
      }

      // Verify target endpoint health
      const targetHealth = await this.performHealthCheck(targetEndpoint)
      if (targetHealth.status === 'unhealthy') {
        throw new Error(`Target endpoint ${targetEndpointId} is unhealthy`)
      }

      // Perform failover
      this.activeEndpoints.set(serviceName, targetEndpointId)
      
      failoverEvent.status = 'completed'
      failoverEvent.duration = Date.now() - startTime

      this.failoverHistory.set(failoverId, failoverEvent)

      // Send notifications
      await this.sendFailoverNotification(failoverEvent, serviceName)

      // Log audit event
      auditLogger.logSystemEvent({
        eventType: AuditEventType.CONFIGURATION_CHANGE,
        resource: `service_${serviceName}`,
        action: AuditAction.UPDATE,
        outcome: AuditOutcome.SUCCESS,
        details: {
          failoverId,
          fromEndpoint: currentEndpointId,
          toEndpoint: targetEndpointId,
          reason,
          duration: failoverEvent.duration
        }
      })

      logger.info(`Manual failover completed for ${serviceName}`, {
        failoverId,
        duration: failoverEvent.duration
      })

      return failoverEvent

    } catch (error) {
      const failoverEvent: FailoverEvent = {
        id: failoverId,
        timestamp: new Date(),
        fromEndpoint: this.activeEndpoints.get(serviceName) || 'unknown',
        toEndpoint: targetEndpointId,
        reason: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        automatic: false,
        duration: Date.now() - startTime,
        status: 'failed'
      }

      this.failoverHistory.set(failoverId, failoverEvent)

      logger.error(`Manual failover failed for ${serviceName}:`, { error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }

  /**
   * Get current system health status
   */
  getSystemHealth(): {
    services: Record<string, {
      activeEndpoint: string
      status: 'healthy' | 'degraded' | 'unhealthy'
      endpoints: HealthStatus[]
    }>
    overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    lastUpdate: Date
  } {
    const services: Record<string, any> = {}
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    for (const [serviceName, endpoints] of this.services.entries()) {
      const activeEndpointId = this.activeEndpoints.get(serviceName)
      const endpointStatuses = endpoints.map(ep => this.healthStatuses.get(ep.id)!).filter(Boolean)
      
      const activeEndpointStatus = endpointStatuses.find(status => status.endpoint === activeEndpointId)
      const serviceStatus = activeEndpointStatus?.status || 'unknown'

      services[serviceName] = {
        activeEndpoint: activeEndpointId,
        status: serviceStatus,
        endpoints: endpointStatuses
      }

      // Update overall status
      if (serviceStatus === 'unhealthy') {
        overallStatus = 'unhealthy'
      } else if (serviceStatus === 'degraded' && overallStatus === 'healthy') {
        overallStatus = 'degraded'
      }
    }

    return {
      services,
      overallStatus,
      lastUpdate: new Date()
    }
  }

  /**
   * Get failover history
   */
  getFailoverHistory(serviceName?: string): FailoverEvent[] {
    let events = Array.from(this.failoverHistory.values())
    
    if (serviceName) {
      const serviceEndpoints = this.services.get(serviceName)
      if (serviceEndpoints) {
        const endpointIds = serviceEndpoints.map(ep => ep.id)
        events = events.filter(event => 
          endpointIds.includes(event.fromEndpoint) || endpointIds.includes(event.toEndpoint)
        )
      }
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Test failover capabilities
   */
  async testFailover(serviceName: string): Promise<{ success: boolean; details: any }> {
    try {
      const serviceEndpoints = this.services.get(serviceName)
      if (!serviceEndpoints || serviceEndpoints.length < 2) {
        throw new Error('Service needs at least 2 endpoints for failover testing')
      }

      const currentEndpointId = this.activeEndpoints.get(serviceName)!
      const backupEndpoint = serviceEndpoints.find(ep => ep.id !== currentEndpointId && ep.type !== 'primary')

      if (!backupEndpoint) {
        throw new Error('No backup endpoint available for testing')
      }

      logger.info(`Testing failover for ${serviceName}`)

      // Perform test failover
      const failoverEvent = await this.performManualFailover(
        serviceName,
        backupEndpoint.id,
        'Failover capability test'
      )

      // Wait a moment to verify the failover
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Verify backup endpoint is working
      const backupHealth = await this.performHealthCheck(backupEndpoint)
      const testSuccess = backupHealth.status === 'healthy'

      // Revert to original endpoint
      await this.performManualFailover(
        serviceName,
        currentEndpointId,
        'Reverting after failover test'
      )

      return {
        success: testSuccess,
        details: {
          originalEndpoint: currentEndpointId,
          testEndpoint: backupEndpoint.id,
          failoverDuration: failoverEvent.duration,
          backupEndpointHealth: backupHealth
        }
      }

    } catch (error) {
      return {
        success: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  // Private methods

  private startServiceMonitoring(serviceName: string, endpoints: ServiceEndpoint[]): void {
    const interval = setInterval(async () => {
      for (const endpoint of endpoints) {
        try {
          const health = await this.performHealthCheck(endpoint)
          this.updateHealthStatus(endpoint.id, health)

          // Check for failover conditions
          if (this.config.enableAutoFailover) {
            await this.checkFailoverConditions(serviceName, endpoint, health)
          }

        } catch (error) {
          logger.error(`Health check failed for ${endpoint.id}:`, { error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }
    }, this.config.healthCheckInterval)

    this.monitoringIntervals.set(serviceName, interval)
  }

  private async performHealthCheck(endpoint: ServiceEndpoint): Promise<HealthStatus> {
    const startTime = Date.now()
    const currentStatus = this.healthStatuses.get(endpoint.id)!

    try {
      const healthCheckUrl = `${endpoint.url}${endpoint.healthCheck.path}`
      const timeout = endpoint.healthCheck.timeout || this.config.timeout

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(healthCheckUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'InfrastructureMonitor/1.0'
        }
      })

      clearTimeout(timeoutId)

      const responseTime = Date.now() - startTime
      const isHealthy = response.status === endpoint.healthCheck.expectedStatus

      // Check response content if specified
      if (isHealthy && endpoint.healthCheck.expectedResponse) {
        const responseText = await response.text()
        if (!responseText.includes(endpoint.healthCheck.expectedResponse)) {
          throw new Error(`Unexpected response content: ${responseText}`)
        }
      }

      const status: HealthStatus = {
        ...currentStatus,
        status: isHealthy ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: isHealthy ? 0 : currentStatus.consecutiveFailures + 1,
        consecutiveSuccesses: isHealthy ? currentStatus.consecutiveSuccesses + 1 : 0,
        errors: isHealthy ? [] : [`HTTP ${response.status}: ${response.statusText}`]
      }

      // Calculate uptime
      const totalChecks = status.consecutiveFailures + status.consecutiveSuccesses
      if (totalChecks > 0) {
        status.uptime = (status.consecutiveSuccesses / totalChecks) * 100
      }

      return status

    } catch (error) {
      const responseTime = Date.now() - startTime
      
      return {
        ...currentStatus,
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: currentStatus.consecutiveFailures + 1,
        consecutiveSuccesses: 0,
        errors: [error instanceof Error ? error.message : 'Health check failed']
      }
    }
  }

  private updateHealthStatus(endpointId: string, health: HealthStatus): void {
    this.healthStatuses.set(endpointId, health)

    // Log status changes
    const previousStatus = this.healthStatuses.get(endpointId)
    if (previousStatus && previousStatus.status !== health.status) {
      logger.info(`Endpoint ${endpointId} status changed`, {
        from: previousStatus.status,
        to: health.status,
        responseTime: health.responseTime
      })

      // Send alerts for critical status changes
      if (health.status === 'unhealthy') {
        this.sendHealthAlert(endpointId, health, 'critical')
      } else if (health.status === 'degraded') {
        this.sendHealthAlert(endpointId, health, 'warning')
      }
    }
  }

  private async checkFailoverConditions(
    serviceName: string, 
    endpoint: ServiceEndpoint, 
    health: HealthStatus
  ): Promise<void> {
    const activeEndpointId = this.activeEndpoints.get(serviceName)
    
    // Only check failover for active endpoint
    if (endpoint.id !== activeEndpointId) {
      return
    }

    // Check if failover threshold reached
    if (health.consecutiveFailures >= this.config.failoverThreshold) {
      await this.performAutomaticFailover(serviceName, endpoint, health)
    }
  }

  private async performAutomaticFailover(
    serviceName: string,
    failedEndpoint: ServiceEndpoint,
    health: HealthStatus
  ): Promise<void> {
    try {
      const serviceEndpoints = this.services.get(serviceName)!
      
      // Find next available endpoint
      const availableEndpoints = serviceEndpoints.filter(ep => {
        if (ep.id === failedEndpoint.id) return false
        const epHealth = this.healthStatuses.get(ep.id)
        return epHealth && epHealth.status === 'healthy'
      }).sort((a, b) => a.priority - b.priority)

      if (availableEndpoints.length === 0) {
        logger.error(`No healthy endpoints available for automatic failover of ${serviceName}`)
        return
      }

      const targetEndpoint = availableEndpoints[0]
      
      await this.performManualFailover(
        serviceName,
        targetEndpoint.id,
        `Automatic failover due to ${health.consecutiveFailures} consecutive failures`
      )

    } catch (error) {
      logger.error(`Automatic failover failed for ${serviceName}:`, { error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  private async sendFailoverNotification(event: FailoverEvent, serviceName: string): Promise<void> {
    const message = `Failover executed for ${serviceName}: ${event.fromEndpoint} → ${event.toEndpoint}. Reason: ${event.reason}`
    
    // Send to configured notification channels
    for (const channel of this.config.notificationChannels) {
      try {
        await this.sendNotification(channel, 'Failover Alert', message, 'critical')
      } catch (error) {
        logger.error(`Failed to send failover notification via ${channel}:`, { error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }
  }

  private async sendHealthAlert(endpointId: string, health: HealthStatus, severity: 'warning' | 'critical'): Promise<void> {
    const message = `Endpoint ${endpointId} is ${health.status}. Response time: ${health.responseTime}ms. Errors: ${health.errors.join(', ')}`
    
    for (const channel of this.config.notificationChannels) {
      try {
        await this.sendNotification(channel, 'Health Alert', message, severity)
      } catch (error) {
        logger.error(`Failed to send health alert via ${channel}:`, { error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }
  }

  private async sendNotification(
    channel: string, 
    title: string, 
    message: string, 
    severity: 'warning' | 'critical' | 'emergency'
  ): Promise<void> {
    // Implementation would integrate with actual notification services
    logger.info(`[${channel.toUpperCase()}] ${title}: ${message}`)
  }

  private initializeAlertChannels(): void {
    this.alertChannels = [
      {
        type: 'email',
        endpoint: process.env.ALERT_EMAIL || 'admin@hmhcp.com',
        threshold: 'warning',
        enabled: true
      },
      {
        type: 'slack',
        endpoint: process.env.SLACK_WEBHOOK_URL || '',
        threshold: 'critical',
        enabled: !!process.env.SLACK_WEBHOOK_URL
      }
    ]
  }
}

// Export singleton instance
export const infrastructureMonitor = new InfrastructureMonitor()

// Export types and class
export { InfrastructureMonitor }