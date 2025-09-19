/**
 * Comprehensive Alert and Notification System
 * Monitors system health and sends notifications when thresholds are exceeded
 */

import { logger } from '@/lib/logger'

export interface AlertConfig {
  id: string
  name: string
  description: string
  metric: string
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals'
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  cooldown_minutes: number
  notification_channels: Array<'email' | 'slack' | 'webhook' | 'sms'>
}

export interface AlertIncident {
  id: string
  alert_config_id: string
  metric_value: number
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'resolved' | 'suppressed'
  triggered_at: Date
  resolved_at?: Date
  message: string
  details?: Record<string, any>
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms'
  config: Record<string, any>
  enabled: boolean
}

class AlertManager {
  private alerts: Map<string, AlertConfig> = new Map()
  private activeIncidents: Map<string, AlertIncident> = new Map()
  private notificationChannels: Map<string, NotificationChannel> = new Map()
  private lastNotification: Map<string, Date> = new Map()

  constructor() {
    this.initializeDefaultAlerts()
    this.setupNotificationChannels()
  }

  private initializeDefaultAlerts() {
    const defaultAlerts: AlertConfig[] = [
      {
        id: 'high_response_time',
        name: 'High Response Time',
        description: 'API response time exceeds acceptable threshold',
        metric: 'response_time',
        condition: 'greater_than',
        threshold: 1000, // 1 second
        severity: 'high',
        enabled: true,
        cooldown_minutes: 5,
        notification_channels: ['email', 'slack']
      },
      {
        id: 'low_uptime',
        name: 'Low Uptime',
        description: 'System uptime falls below threshold',
        metric: 'uptime_percentage',
        condition: 'less_than',
        threshold: 99.5,
        severity: 'critical',
        enabled: true,
        cooldown_minutes: 1,
        notification_channels: ['email', 'slack', 'sms']
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds acceptable threshold',
        metric: 'error_rate',
        condition: 'greater_than',
        threshold: 5.0, // 5%
        severity: 'high',
        enabled: true,
        cooldown_minutes: 5,
        notification_channels: ['email', 'slack']
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds safe threshold',
        metric: 'memory_usage',
        condition: 'greater_than',
        threshold: 85, // 85%
        severity: 'medium',
        enabled: true,
        cooldown_minutes: 10,
        notification_channels: ['email', 'slack']
      },
      {
        id: 'database_connection_failure',
        name: 'Database Connection Failure',
        description: 'Database connectivity is lost',
        metric: 'database_healthy',
        condition: 'equals',
        threshold: 0, // false
        severity: 'critical',
        enabled: true,
        cooldown_minutes: 1,
        notification_channels: ['email', 'slack', 'sms']
      },
      {
        id: 'poor_core_web_vitals',
        name: 'Poor Core Web Vitals',
        description: 'LCP exceeds good threshold',
        metric: 'lcp',
        condition: 'greater_than',
        threshold: 2500, // 2.5 seconds
        severity: 'medium',
        enabled: true,
        cooldown_minutes: 15,
        notification_channels: ['email']
      },
      {
        id: 'high_cls',
        name: 'High Cumulative Layout Shift',
        description: 'CLS exceeds good threshold',
        metric: 'cls',
        condition: 'greater_than',
        threshold: 0.1,
        severity: 'medium',
        enabled: true,
        cooldown_minutes: 30,
        notification_channels: ['email']
      },
      {
        id: 'security_threat_detected',
        name: 'Security Threat Detected',
        description: 'Suspicious activity or security threat detected',
        metric: 'security_threats',
        condition: 'greater_than',
        threshold: 0,
        severity: 'critical',
        enabled: true,
        cooldown_minutes: 0, // Immediate notification
        notification_channels: ['email', 'slack', 'sms']
      }
    ]

    defaultAlerts.forEach(alert => {
      this.alerts.set(alert.id, alert)
    })
  }

  private setupNotificationChannels() {
    // Email notification channel
    this.notificationChannels.set('email', {
      type: 'email',
      config: {
        smtp_host: process.env.SMTP_HOST || 'localhost',
        smtp_port: parseInt(process.env.SMTP_PORT || '587'),
        smtp_user: process.env.SMTP_USER || '',
        smtp_password: process.env.SMTP_PASSWORD || '',
        from_email: process.env.ALERT_FROM_EMAIL || 'alerts@hmhealthcare.com',
        to_emails: process.env.ALERT_TO_EMAILS?.split(',') || ['admin@hmhealthcare.com']
      },
      enabled: !!process.env.SMTP_HOST
    })

    // Slack notification channel
    this.notificationChannels.set('slack', {
      type: 'slack',
      config: {
        webhook_url: process.env.SLACK_WEBHOOK_URL || '',
        channel: process.env.SLACK_ALERT_CHANNEL || '#alerts',
        username: 'HMHCP Monitor',
        icon_emoji: ':warning:'
      },
      enabled: !!process.env.SLACK_WEBHOOK_URL
    })

    // Webhook notification channel
    this.notificationChannels.set('webhook', {
      type: 'webhook',
      config: {
        url: process.env.ALERT_WEBHOOK_URL || '',
        secret: process.env.ALERT_WEBHOOK_SECRET || '',
        timeout: 5000
      },
      enabled: !!process.env.ALERT_WEBHOOK_URL
    })

    // SMS notification channel (Twilio)
    this.notificationChannels.set('sms', {
      type: 'sms',
      config: {
        account_sid: process.env.TWILIO_ACCOUNT_SID || '',
        auth_token: process.env.TWILIO_AUTH_TOKEN || '',
        from_number: process.env.TWILIO_FROM_NUMBER || '',
        to_numbers: process.env.ALERT_SMS_NUMBERS?.split(',') || []
      },
      enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
    })
  }

  /**
   * Check metrics against configured alerts
   */
  async checkAlerts(metrics: Record<string, any>) {
    const alertsToTrigger: AlertConfig[] = []

    for (const [alertId, alert] of this.alerts) {
      if (!alert.enabled) continue

      const metricValue = metrics[alert.metric]
      if (metricValue === undefined || metricValue === null) continue

      const shouldTrigger = this.evaluateCondition(
        metricValue,
        alert.condition,
        alert.threshold
      )

      if (shouldTrigger) {
        // Check cooldown period
        const lastNotified = this.lastNotification.get(alertId)
        const cooldownMs = alert.cooldown_minutes * 60 * 1000
        
        if (!lastNotified || (Date.now() - lastNotified.getTime()) > cooldownMs) {
          alertsToTrigger.push(alert)
          
          // Create or update incident
          const incident = this.createIncident(alert, metricValue, metrics)
          this.activeIncidents.set(incident.id, incident)
          
          // Record notification time
          this.lastNotification.set(alertId, new Date())
        }
      } else {
        // Check if we need to resolve any active incidents
        const activeIncident = Array.from(this.activeIncidents.values())
          .find(incident => incident.alert_config_id === alertId && incident.status === 'active')
        
        if (activeIncident) {
          activeIncident.status = 'resolved'
          activeIncident.resolved_at = new Date()
          
          // Send resolution notification
          await this.sendResolutionNotification(alert, activeIncident)
        }
      }
    }

    // Send notifications for triggered alerts
    for (const alert of alertsToTrigger) {
      await this.sendAlertNotifications(alert, metrics)
    }

    return {
      triggered_alerts: alertsToTrigger.length,
      active_incidents: Array.from(this.activeIncidents.values())
        .filter(incident => incident.status === 'active').length
    }
  }

  private evaluateCondition(value: any, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'greater_than':
        return Number(value) > threshold
      case 'less_than':
        return Number(value) < threshold
      case 'equals':
        return Number(value) === threshold
      case 'not_equals':
        return Number(value) !== threshold
      default:
        return false
    }
  }

  private createIncident(
    alert: AlertConfig,
    metricValue: any,
    allMetrics: Record<string, any>
  ): AlertIncident {
    const incident: AlertIncident = {
      id: `incident_${alert.id}_${Date.now()}`,
      alert_config_id: alert.id,
      metric_value: Number(metricValue),
      threshold: alert.threshold,
      severity: alert.severity,
      status: 'active',
      triggered_at: new Date(),
      message: `${alert.name}: ${alert.metric} is ${metricValue} (threshold: ${alert.threshold})`,
      details: allMetrics
    }

    return incident
  }

  private async sendAlertNotifications(alert: AlertConfig, metrics: Record<string, any>) {
    const promises: Promise<void>[] = []

    for (const channelType of alert.notification_channels) {
      const channel = this.notificationChannels.get(channelType)
      if (channel?.enabled) {
        promises.push(this.sendNotification(channel, alert, metrics))
      }
    }

    try {
      await Promise.allSettled(promises)
      logger.info(`Alert notifications sent for: ${alert.name}`)
    } catch (error) {
      logger.error(`Failed to send alert notifications for ${alert.name}:`, { error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  private async sendNotification(
    channel: NotificationChannel,
    alert: AlertConfig,
    metrics: Record<string, any>
  ) {
    const metricValue = metrics[alert.metric]
    const message = this.formatAlertMessage(alert, metricValue)

    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(channel, alert, message)
          break
        case 'slack':
          await this.sendSlackNotification(channel, alert, message)
          break
        case 'webhook':
          await this.sendWebhookNotification(channel, alert, message, metrics)
          break
        case 'sms':
          await this.sendSMSNotification(channel, alert, message)
          break
      }
    } catch (error) {
      logger.error(`Failed to send ${channel.type} notification:`, { error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  private formatAlertMessage(alert: AlertConfig, metricValue: any): string {
    const severityIcon = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨'
    }[alert.severity]

    return `${severityIcon} ALERT: ${alert.name}

${alert.description}

Current Value: ${metricValue}
Threshold: ${alert.threshold}
Severity: ${alert.severity.toUpperCase()}

Time: ${new Date().toLocaleString()}
System: HMHCP Healthcare Platform`
  }

  private async sendEmailNotification(
    channel: NotificationChannel,
    alert: AlertConfig,
    message: string
  ) {
    // In a real implementation, you would use nodemailer or similar
    logger.info(`Email notification (${channel.config.to_emails}): ${message}`)
  }

  private async sendSlackNotification(
    channel: NotificationChannel,
    alert: AlertConfig,
    message: string
  ) {
    if (!channel.config.webhook_url) return

    const payload = {
      channel: channel.config.channel,
      username: channel.config.username,
      icon_emoji: channel.config.icon_emoji,
      text: message,
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          fields: [
            {
              title: 'Alert',
              value: alert.name,
              short: true
            },
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            }
          ],
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    }

    try {
      const response = await fetch(channel.config.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`)
      }
    } catch (error) {
      logger.error('Failed to send Slack notification:', { error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  private async sendWebhookNotification(
    channel: NotificationChannel,
    alert: AlertConfig,
    message: string,
    metrics: Record<string, any>
  ) {
    if (!channel.config.url) return

    const payload = {
      alert: {
        id: alert.id,
        name: alert.name,
        severity: alert.severity,
        message
      },
      metrics,
      timestamp: new Date().toISOString()
    }

    try {
      const response = await fetch(channel.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(channel.config.secret && {
            'X-Alert-Secret': channel.config.secret
          })
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(channel.config.timeout || 5000)
      })

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.statusText}`)
      }
    } catch (error) {
      logger.error('Failed to send webhook notification:', { error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  private async sendSMSNotification(
    channel: NotificationChannel,
    alert: AlertConfig,
    message: string
  ) {
    // In a real implementation, you would use Twilio SDK
    logger.info(`SMS notification (${channel.config.to_numbers}): ${message.substring(0, 160)}`)
  }

  private async sendResolutionNotification(alert: AlertConfig, incident: AlertIncident) {
    const message = `✅ RESOLVED: ${alert.name}

The alert condition has been resolved.

Duration: ${this.formatDuration(incident.triggered_at, incident.resolved_at || new Date())}
Resolution Time: ${new Date().toLocaleString()}
System: HMHCP Healthcare Platform`

    // Send to configured channels
    for (const channelType of alert.notification_channels) {
      const channel = this.notificationChannels.get(channelType)
      if (channel?.enabled) {
        try {
          switch (channel.type) {
            case 'slack':
              await this.sendSlackResolution(channel, alert, message)
              break
            case 'email':
              await this.sendEmailNotification(channel, alert, message)
              break
          }
        } catch (error) {
          logger.error(`Failed to send resolution notification:`, { error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }
    }
  }

  private async sendSlackResolution(
    channel: NotificationChannel,
    alert: AlertConfig,
    message: string
  ) {
    if (!channel.config.webhook_url) return

    const payload = {
      channel: channel.config.channel,
      username: channel.config.username,
      icon_emoji: ':white_check_mark:',
      text: message,
      attachments: [
        {
          color: 'good',
          fields: [
            {
              title: 'Status',
              value: 'RESOLVED',
              short: true
            },
            {
              title: 'Alert',
              value: alert.name,
              short: true
            }
          ]
        }
      ]
    }

    await fetch(channel.config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger'
      case 'high': return 'warning'
      case 'medium': return '#ff9500'
      case 'low': return 'good'
      default: return '#808080'
    }
  }

  private formatDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffSeconds = Math.floor((diffMs % 60000) / 1000)
    
    if (diffMinutes > 0) {
      return `${diffMinutes}m ${diffSeconds}s`
    }
    return `${diffSeconds}s`
  }

  /**
   * Get active incidents
   */
  getActiveIncidents(): AlertIncident[] {
    return Array.from(this.activeIncidents.values())
      .filter(incident => incident.status === 'active')
      .sort((a, b) => b.triggered_at.getTime() - a.triggered_at.getTime())
  }

  /**
   * Get alert configuration
   */
  getAlertConfig(alertId: string): AlertConfig | undefined {
    return this.alerts.get(alertId)
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(alertId: string, updates: Partial<AlertConfig>) {
    const existing = this.alerts.get(alertId)
    if (existing) {
      this.alerts.set(alertId, { ...existing, ...updates })
    }
  }

  /**
   * Suppress an alert for a specified duration
   */
  suppressAlert(alertId: string, durationMinutes: number) {
    const suppressUntil = new Date(Date.now() + (durationMinutes * 60 * 1000))
    this.lastNotification.set(alertId, suppressUntil)
    
    logger.info(`Alert ${alertId} suppressed until ${suppressUntil.toLocaleString()}`)
  }
}

// Export singleton instance
export const alertManager = new AlertManager()

// Export types
export { AlertManager }