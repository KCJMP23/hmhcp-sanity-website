// Email Monitoring and Alerting
// Created: 2025-01-27
// Purpose: Implement real-time monitoring and alerting for email operations

import { EventEmitter } from 'events'

interface MonitoringMetrics {
  timestamp: Date
  campaignId?: string
  type: 'send' | 'delivery' | 'open' | 'click' | 'bounce' | 'complaint' | 'unsubscribe'
  status: 'success' | 'warning' | 'error'
  message: string
  metadata: Record<string, any>
}

interface AlertRule {
  id: string
  name: string
  condition: (metrics: MonitoringMetrics[]) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  cooldown: number // minutes
  lastTriggered?: Date
}

interface MonitoringConfig {
  metricsRetentionDays: number
  alertCooldownMinutes: number
  maxMetricsPerMinute: number
  enableRealTimeAlerts: boolean
}

export class EmailMonitoringService extends EventEmitter {
  private metrics: MonitoringMetrics[] = []
  private alertRules: Map<string, AlertRule> = new Map()
  private config: MonitoringConfig
  private isMonitoring: boolean = false
  private metricsBuffer: MonitoringMetrics[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor(config: MonitoringConfig) {
    super()
    this.config = config
    this.setupDefaultAlertRules()
    this.startMonitoring()
  }

  // Record a metric
  recordMetric(metric: Omit<MonitoringMetrics, 'timestamp'>): void {
    const fullMetric: MonitoringMetrics = {
      ...metric,
      timestamp: new Date()
    }

    this.metricsBuffer.push(fullMetric)
    this.metrics.push(fullMetric)

    // Emit real-time event
    this.emit('metric', fullMetric)

    // Check alert rules
    if (this.config.enableRealTimeAlerts) {
      this.checkAlertRules()
    }

    // Cleanup old metrics
    this.cleanupOldMetrics()
  }

  // Record campaign send
  recordCampaignSend(campaignId: string, recipientCount: number, status: 'success' | 'error'): void {
    this.recordMetric({
      campaignId,
      type: 'send',
      status,
      message: `Campaign sent to ${recipientCount} recipients`,
      metadata: { recipientCount }
    })
  }

  // Record delivery event
  recordDelivery(campaignId: string, email: string, status: 'delivered' | 'bounced' | 'failed'): void {
    this.recordMetric({
      campaignId,
      type: 'delivery',
      status: status === 'delivered' ? 'success' : 'error',
      message: `Email ${status} for ${email}`,
      metadata: { email, deliveryStatus: status }
    })
  }

  // Record open event
  recordOpen(campaignId: string, email: string, userAgent?: string): void {
    this.recordMetric({
      campaignId,
      type: 'open',
      status: 'success',
      message: `Email opened by ${email}`,
      metadata: { email, userAgent }
    })
  }

  // Record click event
  recordClick(campaignId: string, email: string, link: string): void {
    this.recordMetric({
      campaignId,
      type: 'click',
      status: 'success',
      message: `Link clicked by ${email}`,
      metadata: { email, link }
    })
  }

  // Record bounce event
  recordBounce(campaignId: string, email: string, bounceType: 'hard' | 'soft', reason: string): void {
    this.recordMetric({
      campaignId,
      type: 'bounce',
      status: 'error',
      message: `${bounceType} bounce for ${email}: ${reason}`,
      metadata: { email, bounceType, reason }
    })
  }

  // Record complaint event
  recordComplaint(campaignId: string, email: string, reason: string): void {
    this.recordMetric({
      campaignId,
      type: 'complaint',
      status: 'error',
      message: `Spam complaint from ${email}: ${reason}`,
      metadata: { email, reason }
    })
  }

  // Record unsubscribe event
  recordUnsubscribe(campaignId: string, email: string, reason?: string): void {
    this.recordMetric({
      campaignId,
      type: 'unsubscribe',
      status: 'warning',
      message: `Unsubscribe from ${email}${reason ? `: ${reason}` : ''}`,
      metadata: { email, reason }
    })
  }

  // Get metrics for a time range
  getMetrics(
    startDate: Date,
    endDate: Date,
    filters?: {
      campaignId?: string
      type?: MonitoringMetrics['type']
      status?: MonitoringMetrics['status']
    }
  ): MonitoringMetrics[] {
    let filtered = this.metrics.filter(m => 
      m.timestamp >= startDate && m.timestamp <= endDate
    )

    if (filters) {
      if (filters.campaignId) {
        filtered = filtered.filter(m => m.campaignId === filters.campaignId)
      }
      if (filters.type) {
        filtered = filtered.filter(m => m.type === filters.type)
      }
      if (filters.status) {
        filtered = filtered.filter(m => m.status === filters.status)
      }
    }

    return filtered
  }

  // Get campaign performance metrics
  getCampaignMetrics(campaignId: string, startDate: Date, endDate: Date): {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    complained: number
    unsubscribed: number
    openRate: number
    clickRate: number
    bounceRate: number
    complaintRate: number
    unsubscribeRate: number
  } {
    const metrics = this.getMetrics(startDate, endDate, { campaignId })
    
    const sent = metrics.filter(m => m.type === 'send' && m.status === 'success').length
    const delivered = metrics.filter(m => m.type === 'delivery' && m.status === 'success').length
    const opened = metrics.filter(m => m.type === 'open').length
    const clicked = metrics.filter(m => m.type === 'click').length
    const bounced = metrics.filter(m => m.type === 'bounce').length
    const complained = metrics.filter(m => m.type === 'complaint').length
    const unsubscribed = metrics.filter(m => m.type === 'unsubscribe').length

    return {
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
      unsubscribed,
      openRate: sent > 0 ? (opened / sent) * 100 : 0,
      clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
      bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
      complaintRate: sent > 0 ? (complained / sent) * 100 : 0,
      unsubscribeRate: sent > 0 ? (unsubscribed / sent) * 100 : 0
    }
  }

  // Add alert rule
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule)
  }

  // Remove alert rule
  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId)
  }

  // Check alert rules
  private checkAlertRules(): void {
    const recentMetrics = this.getRecentMetrics(5) // Last 5 minutes

    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue

      // Check cooldown
      if (rule.lastTriggered) {
        const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldown * 60 * 1000)
        if (new Date() < cooldownEnd) continue
      }

      // Check condition
      if (rule.condition(recentMetrics)) {
        this.triggerAlert(rule)
        rule.lastTriggered = new Date()
      }
    }
  }

  // Trigger alert
  private triggerAlert(rule: AlertRule): void {
    this.emit('alert', {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      timestamp: new Date(),
      message: `Alert triggered: ${rule.name}`
    })
  }

  // Get recent metrics
  private getRecentMetrics(minutes: number): MonitoringMetrics[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    return this.metrics.filter(m => m.timestamp >= cutoff)
  }

  // Setup default alert rules
  private setupDefaultAlertRules(): void {
    // High bounce rate alert
    this.addAlertRule({
      id: 'high_bounce_rate',
      name: 'High Bounce Rate',
      condition: (metrics) => {
        const recent = this.getRecentMetrics(10)
        const bounces = recent.filter(m => m.type === 'bounce').length
        const sends = recent.filter(m => m.type === 'send' && m.status === 'success').length
        return sends > 0 && (bounces / sends) > 0.05 // 5% bounce rate
      },
      severity: 'high',
      enabled: true,
      cooldown: 30
    })

    // High complaint rate alert
    this.addAlertRule({
      id: 'high_complaint_rate',
      name: 'High Complaint Rate',
      condition: (metrics) => {
        const recent = this.getRecentMetrics(10)
        const complaints = recent.filter(m => m.type === 'complaint').length
        const sends = recent.filter(m => m.type === 'send' && m.status === 'success').length
        return sends > 0 && (complaints / sends) > 0.01 // 1% complaint rate
      },
      severity: 'critical',
      enabled: true,
      cooldown: 15
    })

    // Low open rate alert
    this.addAlertRule({
      id: 'low_open_rate',
      name: 'Low Open Rate',
      condition: (metrics) => {
        const recent = this.getRecentMetrics(60)
        const opens = recent.filter(m => m.type === 'open').length
        const sends = recent.filter(m => m.type === 'send' && m.status === 'success').length
        return sends > 10 && (opens / sends) < 0.1 // 10% open rate
      },
      severity: 'medium',
      enabled: true,
      cooldown: 60
    })

    // Send failure alert
    this.addAlertRule({
      id: 'send_failures',
      name: 'Send Failures',
      condition: (metrics) => {
        const recent = this.getRecentMetrics(5)
        const failures = recent.filter(m => m.type === 'send' && m.status === 'error').length
        return failures > 5
      },
      severity: 'high',
      enabled: true,
      cooldown: 15
    })
  }

  // Start monitoring
  private startMonitoring(): void {
    this.isMonitoring = true
    
    // Flush metrics buffer every minute
    this.flushInterval = setInterval(() => {
      this.flushMetrics()
    }, 60000)
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.isMonitoring = false
    
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }

  // Flush metrics buffer
  private flushMetrics(): void {
    if (this.metricsBuffer.length > 0) {
      // This would typically send metrics to a monitoring service
      console.log(`Flushing ${this.metricsBuffer.length} metrics`)
      this.metricsBuffer = []
    }
  }

  // Cleanup old metrics
  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - this.config.metricsRetentionDays * 24 * 60 * 60 * 1000)
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff)
  }

  // Get monitoring health
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    metrics: {
      totalMetrics: number
      recentMetrics: number
      activeAlerts: number
      isMonitoring: boolean
    }
  } {
    const recent = this.getRecentMetrics(5)
    const activeAlerts = Array.from(this.alertRules.values()).filter(rule => 
      rule.enabled && rule.lastTriggered && 
      new Date().getTime() - rule.lastTriggered.getTime() < rule.cooldown * 60 * 1000
    ).length

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (!this.isMonitoring) {
      status = 'unhealthy'
    } else if (activeAlerts > 0) {
      status = 'degraded'
    }

    return {
      status,
      metrics: {
        totalMetrics: this.metrics.length,
        recentMetrics: recent.length,
        activeAlerts,
        isMonitoring: this.isMonitoring
      }
    }
  }
}

// Default configuration
export const defaultMonitoringConfig: MonitoringConfig = {
  metricsRetentionDays: 30,
  alertCooldownMinutes: 15,
  maxMetricsPerMinute: 1000,
  enableRealTimeAlerts: true
}

// Singleton instance
export const emailMonitoring = new EmailMonitoringService(defaultMonitoringConfig)
