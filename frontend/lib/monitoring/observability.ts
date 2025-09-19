/**
 * Comprehensive Observability System
 * 
 * Implements:
 * - Prometheus metrics collection
 * - Grafana dashboard integration
 * - Slack/Discord notifications
 * - Performance monitoring
 * - Error tracking and alerting
 */

export interface MetricValue {
  value: number
  timestamp: number
  labels: Record<string, string>
}

export interface Alert {
  id: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  source: string
  timestamp: Date
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  threshold?: number
  alertOn?: 'above' | 'below'
}

export class PrometheusMetrics {
  private metrics: Map<string, MetricValue[]> = new Map()
  private counters: Map<string, number> = new Map()
  private histograms: Map<string, number[]> = new Map()

  // Counter metrics
  incrementCounter(name: string, labels: Record<string, string> = {}) {
    const key = this.getMetricKey(name, labels)
    const current = this.counters.get(key) || 0
    this.counters.set(key, current + 1)
  }

  // Gauge metrics
  setGauge(name: string, value: number, labels: Record<string, string> = {}) {
    const key = this.getMetricKey(name, labels)
    const metric: MetricValue = {
      value,
      timestamp: Date.now(),
      labels
    }
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    this.metrics.get(key)!.push(metric)
    
    // Keep only last 100 values per metric
    const values = this.metrics.get(key)!
    if (values.length > 100) {
      values.splice(0, values.length - 100)
    }
  }

  // Histogram metrics
  observeHistogram(name: string, value: number, labels: Record<string, string> = {}) {
    const key = this.getMetricKey(name, labels)
    if (!this.histograms.has(key)) {
      this.histograms.set(key, [])
    }
    this.histograms.get(key)!.push(value)
    
    // Keep only last 1000 values per histogram
    const values = this.histograms.get(key)!
    if (values.length > 1000) {
      values.splice(0, values.length - 1000)
    }
  }

  // Get metrics in Prometheus format
  getPrometheusFormat(): string {
    let output = ''
    
    // Counters
    for (const [key, value] of this.counters.entries()) {
      const [name, labels] = this.parseMetricKey(key)
      const labelStr = this.formatLabels(labels)
      output += `${name}${labelStr} ${value}\n`
    }
    
    // Gauges
    for (const [key, values] of this.metrics.entries()) {
      if (values.length > 0) {
        const [name, labels] = this.parseMetricKey(key)
        const latest = values[values.length - 1]
        const labelStr = this.formatLabels(labels)
        output += `${name}${labelStr} ${latest.value}\n`
      }
    }
    
    // Histograms
    for (const [key, values] of this.histograms.entries()) {
      if (values.length > 0) {
        const [name, labels] = this.parseMetricKey(key)
        const labelStr = this.formatLabels(labels)
        
        // Calculate quantiles
        const sorted = [...values].sort((a, b) => a - b)
        const p50 = sorted[Math.floor(sorted.length * 0.5)]
        const p95 = sorted[Math.floor(sorted.length * 0.95)]
        const p99 = sorted[Math.floor(sorted.length * 0.99)]
        
        output += `${name}_p50${labelStr} ${p50}\n`
        output += `${name}_p95${labelStr} ${p95}\n`
        output += `${name}_p99${labelStr} ${p99}\n`
        output += `${name}_count${labelStr} ${values.length}\n`
        output += `${name}_sum${labelStr} ${values.reduce((a, b) => a + b, 0)}\n`
      }
    }
    
    return output
  }

  private getMetricKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',')
    return `${name}:${labelStr}`
  }

  private parseMetricKey(key: string): [string, Record<string, string>] {
    const colonIndex = key.indexOf(':')
    if (colonIndex === -1) return [key, {}]
    
    const name = key.substring(0, colonIndex)
    const labelStr = key.substring(colonIndex + 1)
    const labels: Record<string, string> = {}
    
    if (labelStr) {
      labelStr.split(',').forEach(pair => {
        const [k, v] = pair.split('=')
        if (k && v) labels[k] = v
      })
    }
    
    return [name, labels]
  }

  private formatLabels(labels: Record<string, string>): string {
    if (Object.keys(labels).length === 0) return ''
    
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',')
    
    return `{${labelStr}}`
  }
}

export class AlertManager {
  private alerts: Map<string, Alert> = new Map()
  private webhooks: Map<string, string> = new Map()

  constructor() {
    this.initializeWebhooks()
  }

  private initializeWebhooks() {
    if (process.env.SLACK_WEBHOOK_URL) {
      this.webhooks.set('slack', process.env.SLACK_WEBHOOK_URL)
    }
    if (process.env.DISCORD_WEBHOOK_URL) {
      this.webhooks.set('discord', process.env.DISCORD_WEBHOOK_URL)
    }
  }

  createAlert(severity: Alert['severity'], title: string, message: string, source: string): string {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const alert: Alert = {
      id: alertId,
      severity,
      title,
      message,
      source,
      timestamp: new Date(),
      acknowledged: false
    }

    this.alerts.set(alertId, alert)
    
    // Send notifications for critical and error alerts
    if (severity === 'critical' || severity === 'error') {
      this.sendNotifications(alert)
    }

    return alertId
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.acknowledged = true
      alert.acknowledgedBy = acknowledgedBy
      alert.acknowledgedAt = new Date()
      return true
    }
    return false
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.acknowledged)
  }

  getAlertsBySeverity(severity: Alert['severity']): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.severity === severity)
  }

  private async sendNotifications(alert: Alert): Promise<void> {
    const promises: Promise<void>[] = []

    // Send to Slack
    if (this.webhooks.has('slack')) {
      promises.push(this.sendSlackNotification(alert))
    }

    // Send to Discord
    if (this.webhooks.has('discord')) {
      promises.push(this.sendDiscordNotification(alert))
    }

    await Promise.allSettled(promises)
  }

  private async sendSlackNotification(alert: Alert): Promise<void> {
    try {
      const webhookUrl = this.webhooks.get('slack')!
      const color = this.getSeverityColor(alert.severity)
      
      const payload = {
        attachments: [{
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Source',
              value: alert.source,
              short: true
            },
            {
              title: 'Time',
              value: alert.timestamp.toISOString(),
              short: true
            }
          ],
          footer: 'HMHCP Website Monitoring'
        }]
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Slack notification failed:', error)
    }
  }

  private async sendDiscordNotification(alert: Alert): Promise<void> {
    try {
      const webhookUrl = this.webhooks.get('discord')!
      const color = this.getDiscordColor(alert.severity)
      
      const payload = {
        embeds: [{
          title: alert.title,
          description: alert.message,
          color,
          fields: [
            {
              name: 'Severity',
              value: alert.severity.toUpperCase(),
              inline: true
            },
            {
              name: 'Source',
              value: alert.source,
              inline: true
            },
            {
              name: 'Time',
              value: alert.timestamp.toISOString(),
              inline: true
            }
          ],
          footer: {
            text: 'HMHCP Website Monitoring'
          },
          timestamp: alert.timestamp.toISOString()
        }]
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Discord notification failed:', error)
    }
  }

  private getSeverityColor(severity: Alert['severity']): string {
    switch (severity) {
      case 'info': return '#36a64f'
      case 'warning': return '#ffa500'
      case 'error': return '#ff0000'
      case 'critical': return '#8b0000'
      default: return '#808080'
    }
  }

  private getDiscordColor(severity: Alert['severity']): number {
    switch (severity) {
      case 'info': return 0x36a64f
      case 'warning': return 0xffa500
      case 'error': return 0xff0000
      case 'critical': return 0x8b0000
      default: return 0x808080
    }
  }
}

export class PerformanceMonitor {
  private metrics: PrometheusMetrics
  private alertManager: AlertManager
  private performanceThresholds: Map<string, PerformanceMetric> = new Map()

  constructor() {
    this.metrics = new PrometheusMetrics()
    this.alertManager = new AlertManager()
    this.initializeThresholds()
  }

  private initializeThresholds() {
    // API response time thresholds
    this.performanceThresholds.set('api_response_time', {
      name: 'api_response_time',
      value: 0,
      unit: 'ms',
      threshold: 1000,
      alertOn: 'above'
    })

    // Database query time thresholds
    this.performanceThresholds.set('db_query_time', {
      name: 'db_query_time',
      value: 0,
      unit: 'ms',
      threshold: 500,
      alertOn: 'above'
    })

    // Memory usage thresholds
    this.performanceThresholds.set('memory_usage', {
      name: 'memory_usage',
      value: 0,
      unit: 'MB',
      threshold: 512,
      alertOn: 'above'
    })

    // Error rate thresholds
    this.performanceThresholds.set('error_rate', {
      name: 'error_rate',
      value: 0,
      unit: '%',
      threshold: 5,
      alertOn: 'above'
    })
  }

  // Monitor API performance
  monitorAPI(operation: string, duration: number, success: boolean) {
    const labels = { operation, success: success.toString() }
    
    this.metrics.setGauge('api_duration_ms', duration, labels)
    this.metrics.incrementCounter('api_requests_total', labels)
    
    if (!success) {
      this.metrics.incrementCounter('api_errors_total', labels)
    }

    // Check thresholds
    const threshold = this.performanceThresholds.get('api_response_time')
    if (threshold && duration > (threshold.threshold || 0)) {
      this.alertManager.createAlert(
        'warning',
        'API Response Time High',
        `API operation "${operation}" took ${duration}ms (threshold: ${threshold.threshold}ms)`,
        'performance_monitor'
      )
    }
  }

  // Monitor database performance
  monitorDatabase(operation: string, duration: number, success: boolean) {
    const labels = { operation, success: success.toString() }
    
    this.metrics.setGauge('db_duration_ms', duration, labels)
    this.metrics.incrementCounter('db_queries_total', labels)
    
    if (!success) {
      this.metrics.incrementCounter('db_errors_total', labels)
    }

    // Check thresholds
    const threshold = this.performanceThresholds.get('db_query_time')
    if (threshold && duration > (threshold.threshold || 0)) {
      this.alertManager.createAlert(
        'warning',
        'Database Query Time High',
        `Database operation "${operation}" took ${duration}ms (threshold: ${threshold.threshold}ms)`,
        'performance_monitor'
      )
    }
  }

  // Monitor system resources
  monitorSystemResources() {
    const memUsage = process.memoryUsage()
    const memoryMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    
    this.metrics.setGauge('memory_usage_mb', memoryMB, { type: 'heap_used' })
    this.metrics.setGauge('memory_usage_mb', Math.round(memUsage.heapTotal / 1024 / 1024), { type: 'heap_total' })
    this.metrics.setGauge('memory_usage_mb', Math.round(memUsage.rss / 1024 / 1024), { type: 'rss' })

    // Check memory threshold
    const threshold = this.performanceThresholds.get('memory_usage')
    if (threshold && memoryMB > (threshold.threshold || 0)) {
      this.alertManager.createAlert(
        'warning',
        'Memory Usage High',
        `Memory usage is ${memoryMB}MB (threshold: ${threshold.threshold}MB)`,
        'performance_monitor'
      )
    }

    // Monitor CPU usage (simplified)
    const startUsage = process.cpuUsage()
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage)
      const cpuPercent = (endUsage.user + endUsage.system) / 1000000 // Convert to seconds
      this.metrics.setGauge('cpu_usage_percent', cpuPercent, {})
    }, 1000)
  }

  // Monitor error rates
  monitorErrorRate(component: string, errorCount: number, totalCount: number) {
    const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0
    const labels = { component }
    
    this.metrics.setGauge('error_rate_percent', errorRate, labels)
    this.metrics.incrementCounter('errors_total', labels)

    // Check error rate threshold
    const threshold = this.performanceThresholds.get('error_rate')
    if (threshold && errorRate > (threshold.threshold || 0)) {
      this.alertManager.createAlert(
        'error',
        'Error Rate High',
        `Error rate for ${component} is ${errorRate.toFixed(2)}% (threshold: ${threshold.threshold}%)`,
        'performance_monitor'
      )
    }
  }

  // Get metrics for Grafana
  getMetricsForGrafana(): any {
    return {
      prometheus: this.metrics.getPrometheusFormat(),
      alerts: this.alertManager.getActiveAlerts(),
      performance: Array.from(this.performanceThresholds.values())
    }
  }

  // Get alert manager
  getAlertManager(): AlertManager {
    return this.alertManager
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Start system monitoring
setInterval(() => {
  performanceMonitor.monitorSystemResources()
}, 30000) // Every 30 seconds
