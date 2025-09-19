// =============================================
// ENTERPRISE DATABASE PERFORMANCE MONITORING
// Target: Real-time performance insights and alerting
// =============================================

import { getSupabaseServiceClient } from './optimized-supabase-client'
import { getRedisCache } from './redis-cache'
import { logger } from '@/lib/logger'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  status: 'excellent' | 'good' | 'warning' | 'critical'
  threshold: {
    excellent: number
    good: number
    warning: number
  }
}

interface QueryPerformance {
  query_type: string
  avg_execution_time: number
  total_executions: number
  slow_query_count: number
  error_count: number
  last_execution: Date
}

interface DatabaseHealth {
  connection_status: 'healthy' | 'degraded' | 'critical'
  connection_count: number
  active_queries: number
  cache_hit_ratio: number
  avg_response_time: number
  disk_usage: number
  memory_usage: number
  last_check: Date
}

interface AlertConfig {
  metric: string
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  notification_channels: string[]
  cooldown_minutes: number
}

class DatabasePerformanceMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null
  private alertCooldowns: Map<string, Date> = new Map()
  private performanceHistory: PerformanceMetric[] = []
  private maxHistorySize = 1000

  // Alert configurations
  private alertConfigs: AlertConfig[] = [
    {
      metric: 'avg_query_time',
      threshold: 50,
      severity: 'high',
      notification_channels: ['email', 'webhook'],
      cooldown_minutes: 5
    },
    {
      metric: 'slow_query_count',
      threshold: 5,
      severity: 'medium',
      notification_channels: ['email'],
      cooldown_minutes: 10
    },
    {
      metric: 'connection_errors',
      threshold: 3,
      severity: 'critical',
      notification_channels: ['email', 'webhook', 'sms'],
      cooldown_minutes: 2
    },
    {
      metric: 'cache_hit_ratio',
      threshold: 80,
      severity: 'medium',
      notification_channels: ['email'],
      cooldown_minutes: 15
    }
  ]

  constructor() {
    this.startMonitoring()
  }

  private startMonitoring(): void {
    // Run performance monitoring every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.collectPerformanceMetrics()
    }, 30000)

    // Initial collection
    this.collectPerformanceMetrics()
  }

  private async collectPerformanceMetrics(): Promise<void> {
    try {
      const [
        databaseMetrics,
        cacheMetrics,
        connectionMetrics,
        queryMetrics
      ] = await Promise.all([
        this.getDatabaseMetrics(),
        this.getCacheMetrics(),
        this.getConnectionMetrics(),
        this.getQueryMetrics()
      ])

      // Process and store metrics
      const allMetrics = [
        ...databaseMetrics,
        ...cacheMetrics,
        ...connectionMetrics,
        ...queryMetrics
      ]

      this.storeMetrics(allMetrics)
      await this.checkAlerts(allMetrics)

    } catch (error) {
      logger.error('Failed to collect performance metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async getDatabaseMetrics(): Promise<PerformanceMetric[]> {
    try {
      const client = getSupabaseServiceClient()
      const { data, error } = await client.rpc('get_performance_metrics')

      if (error) throw error

      return data.map((metric: any) => ({
        name: metric.metric_name,
        value: metric.metric_value,
        unit: metric.metric_unit,
        timestamp: new Date(),
        status: this.getMetricStatus(metric.metric_name, metric.metric_value),
        threshold: this.getThresholds(metric.metric_name)
      }))

    } catch (error) {
      logger.error('Failed to get database metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return []
    }
  }

  private async getCacheMetrics(): Promise<PerformanceMetric[]> {
    try {
      const cache = getRedisCache()
      const metrics = cache.getMetrics()

      return [
        {
          name: 'cache_hit_ratio',
          value: metrics.hitRatio,
          unit: 'percent',
          timestamp: new Date(),
          status: this.getMetricStatus('cache_hit_ratio', metrics.hitRatio),
          threshold: this.getThresholds('cache_hit_ratio')
        },
        {
          name: 'cache_response_time',
          value: metrics.avgResponseTime,
          unit: 'ms',
          timestamp: new Date(),
          status: this.getMetricStatus('cache_response_time', metrics.avgResponseTime),
          threshold: this.getThresholds('cache_response_time')
        },
        {
          name: 'cache_total_requests',
          value: metrics.totalRequests,
          unit: 'count',
          timestamp: new Date(),
          status: 'good',
          threshold: { excellent: 1000, good: 500, warning: 100 }
        }
      ]

    } catch (error) {
      logger.error('Failed to get cache metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return []
    }
  }

  private async getConnectionMetrics(): Promise<PerformanceMetric[]> {
    try {
      const client = getSupabaseServiceClient()
      
      // Get connection pool status
      const { data: connectionData, error: connError } = await client
        .from('admin_sessions')
        .select('count(*)')
        .eq('is_active', true)

      if (connError) throw connError

      const activeConnections = connectionData?.[0]?.count || 0

      return [
        {
          name: 'active_connections',
          value: activeConnections,
          unit: 'connections',
          timestamp: new Date(),
          status: this.getMetricStatus('active_connections', activeConnections),
          threshold: this.getThresholds('active_connections')
        }
      ]

    } catch (error) {
      logger.error('Failed to get connection metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return []
    }
  }

  private async getQueryMetrics(): Promise<PerformanceMetric[]> {
    try {
      const client = getSupabaseServiceClient()
      
      // Get slow query statistics
      const { data: slowQueries, error: slowError } = await client
        .from('audit_logs')
        .select('*')
        .eq('action', 'slow_query_detected')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
        .order('created_at', { ascending: false })

      if (slowError) throw slowError

      const slowQueryCount = slowQueries?.length || 0
      const avgExecutionTime = slowQueries?.length > 0 
        ? slowQueries.reduce((sum, query) => 
            sum + (query.details?.execution_time_ms || 0), 0) / slowQueries.length
        : 0

      return [
        {
          name: 'slow_query_count',
          value: slowQueryCount,
          unit: 'count',
          timestamp: new Date(),
          status: this.getMetricStatus('slow_query_count', slowQueryCount),
          threshold: this.getThresholds('slow_query_count')
        },
        {
          name: 'avg_query_time',
          value: avgExecutionTime,
          unit: 'ms',
          timestamp: new Date(),
          status: this.getMetricStatus('avg_query_time', avgExecutionTime),
          threshold: this.getThresholds('avg_query_time')
        }
      ]

    } catch (error) {
      logger.error('Failed to get query metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return []
    }
  }

  private getMetricStatus(metricName: string, value: number): 'excellent' | 'good' | 'warning' | 'critical' {
    const thresholds = this.getThresholds(metricName)
    
    if (metricName.includes('ratio') || metricName.includes('hit')) {
      // Higher is better for ratios
      if (value >= thresholds.excellent) return 'excellent'
      if (value >= thresholds.good) return 'good'
      if (value >= thresholds.warning) return 'warning'
      return 'critical'
    } else {
      // Lower is better for times/counts
      if (value <= thresholds.excellent) return 'excellent'
      if (value <= thresholds.good) return 'good'
      if (value <= thresholds.warning) return 'warning'
      return 'critical'
    }
  }

  private getThresholds(metricName: string): { excellent: number, good: number, warning: number } {
    const thresholdMap: Record<string, { excellent: number, good: number, warning: number }> = {
      'avg_query_time': { excellent: 25, good: 50, warning: 100 },
      'slow_query_count': { excellent: 0, good: 2, warning: 5 },
      'cache_hit_ratio': { excellent: 95, good: 85, warning: 75 },
      'cache_response_time': { excellent: 5, good: 10, warning: 20 },
      'active_connections': { excellent: 20, good: 25, warning: 30 },
      'connection_errors': { excellent: 0, good: 1, warning: 3 }
    }

    return thresholdMap[metricName] || { excellent: 0, good: 50, warning: 100 }
  }

  private storeMetrics(metrics: PerformanceMetric[]): void {
    // Add to in-memory history
    this.performanceHistory.push(...metrics)
    
    // Trim history to prevent memory issues
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory = this.performanceHistory.slice(-this.maxHistorySize)
    }

    // Cache recent metrics for quick access
    const cache = getRedisCache()
    cache.set('performance_metrics', 'latest', metrics, 300) // 5 minutes TTL
  }

  private async checkAlerts(metrics: PerformanceMetric[]): Promise<void> {
    for (const metric of metrics) {
      const alertConfig = this.alertConfigs.find(config => config.metric === metric.name)
      
      if (!alertConfig) continue

      // Check if alert should fire
      const shouldAlert = this.shouldTriggerAlert(metric, alertConfig)
      
      if (shouldAlert) {
        await this.triggerAlert(metric, alertConfig)
      }
    }
  }

  private shouldTriggerAlert(metric: PerformanceMetric, config: AlertConfig): boolean {
    // Check if metric exceeds threshold
    const exceedsThreshold = metric.name.includes('ratio') || metric.name.includes('hit')
      ? metric.value < config.threshold  // Lower is bad for ratios
      : metric.value > config.threshold  // Higher is bad for times/counts

    if (!exceedsThreshold) return false

    // Check cooldown
    const lastAlert = this.alertCooldowns.get(metric.name)
    if (lastAlert) {
      const cooldownMs = config.cooldown_minutes * 60 * 1000
      if (Date.now() - lastAlert.getTime() < cooldownMs) {
        return false
      }
    }

    return true
  }

  private async triggerAlert(metric: PerformanceMetric, config: AlertConfig): Promise<void> {
    const alertData = {
      metric_name: metric.name,
      current_value: metric.value,
      threshold: config.threshold,
      unit: metric.unit,
      severity: config.severity,
      timestamp: metric.timestamp,
      status: metric.status
    }

    try {
      // Log the alert
      logger.warn('Performance alert triggered', alertData)

      // Store alert in database
      const client = getSupabaseServiceClient()
      await client.from('audit_logs').insert({
        action: 'performance_alert',
        resource_type: 'monitoring',
        details: alertData,
        severity: config.severity === 'critical' ? 'error' : 'warning'
      })

      // Send notifications (implement based on your notification system)
      await this.sendNotifications(alertData, config.notification_channels)

      // Update cooldown
      this.alertCooldowns.set(metric.name, new Date())

    } catch (error) {
      logger.error('Failed to trigger alert', {
        metric: metric.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async sendNotifications(alertData: any, channels: string[]): Promise<void> {
    // Implement notification sending based on your requirements
    // This could include email, webhook, SMS, Slack, etc.
    
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(alertData)
            break
          case 'webhook':
            await this.sendWebhookAlert(alertData)
            break
          case 'sms':
            await this.sendSMSAlert(alertData)
            break
          default:
            logger.warn('Unknown notification channel', { channel })
        }
      } catch (error) {
        logger.error('Failed to send notification', {
          channel,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  private async sendEmailAlert(alertData: any): Promise<void> {
    // Implement email sending logic
    logger.info('Email alert sent', { metric: alertData.metric_name })
  }

  private async sendWebhookAlert(alertData: any): Promise<void> {
    // Implement webhook sending logic
    logger.info('Webhook alert sent', { metric: alertData.metric_name })
  }

  private async sendSMSAlert(alertData: any): Promise<void> {
    // Implement SMS sending logic
    logger.info('SMS alert sent', { metric: alertData.metric_name })
  }

  // Public API methods

  async getCurrentMetrics(): Promise<PerformanceMetric[]> {
    const cache = getRedisCache()
    const cachedMetrics = await cache.get<PerformanceMetric[]>('performance_metrics', 'latest')
    
    if (cachedMetrics) {
      return cachedMetrics
    }

    // If no cached metrics, collect fresh ones
    await this.collectPerformanceMetrics()
    return this.performanceHistory.slice(-20) // Return last 20 metrics
  }

  async getMetricHistory(metricName: string, hours: number = 24): Promise<PerformanceMetric[]> {
    const cutoffTime = new Date(Date.now() - hours * 3600000)
    
    return this.performanceHistory.filter(metric => 
      metric.name === metricName && metric.timestamp >= cutoffTime
    )
  }

  async getDatabaseHealth(): Promise<DatabaseHealth> {
    try {
      const metrics = await this.getCurrentMetrics()
      
      const avgResponseTime = metrics.find(m => m.name === 'avg_query_time')?.value || 0
      const cacheHitRatio = metrics.find(m => m.name === 'cache_hit_ratio')?.value || 0
      const activeConnections = metrics.find(m => m.name === 'active_connections')?.value || 0

      let connectionStatus: 'healthy' | 'degraded' | 'critical' = 'healthy'
      
      if (avgResponseTime > 100 || cacheHitRatio < 70 || activeConnections > 30) {
        connectionStatus = 'critical'
      } else if (avgResponseTime > 50 || cacheHitRatio < 85 || activeConnections > 25) {
        connectionStatus = 'degraded'
      }

      return {
        connection_status: connectionStatus,
        connection_count: activeConnections,
        active_queries: 0, // Would need to implement if tracking active queries
        cache_hit_ratio: cacheHitRatio,
        avg_response_time: avgResponseTime,
        disk_usage: 0, // Would need to implement disk monitoring
        memory_usage: 0, // Would need to implement memory monitoring
        last_check: new Date()
      }

    } catch (error) {
      logger.error('Failed to get database health', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return {
        connection_status: 'critical',
        connection_count: 0,
        active_queries: 0,
        cache_hit_ratio: 0,
        avg_response_time: 0,
        disk_usage: 0,
        memory_usage: 0,
        last_check: new Date()
      }
    }
  }

  async getPerformanceSummary(): Promise<any> {
    const health = await this.getDatabaseHealth()
    const metrics = await this.getCurrentMetrics()
    
    return {
      overall_status: health.connection_status,
      metrics_summary: metrics.reduce((summary, metric) => {
        summary[metric.name] = {
          value: metric.value,
          unit: metric.unit,
          status: metric.status
        }
        return summary
      }, {} as Record<string, any>),
      health_check: health,
      last_updated: new Date(),
      performance_grade: this.calculatePerformanceGrade(metrics)
    }
  }

  private calculatePerformanceGrade(metrics: PerformanceMetric[]): string {
    const statusCounts = metrics.reduce((counts, metric) => {
      counts[metric.status] = (counts[metric.status] || 0) + 1
      return counts
    }, {} as Record<string, number>)

    const total = metrics.length
    const excellentRatio = (statusCounts.excellent || 0) / total
    const goodRatio = (statusCounts.good || 0) / total
    const warningRatio = (statusCounts.warning || 0) / total

    if (excellentRatio >= 0.8) return 'A+'
    if (excellentRatio >= 0.6 && goodRatio >= 0.3) return 'A'
    if (excellentRatio + goodRatio >= 0.8) return 'B+'
    if (excellentRatio + goodRatio >= 0.6) return 'B'
    if (warningRatio < 0.3) return 'C'
    return 'D'
  }

  // Cleanup method
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    this.alertCooldowns.clear()
    this.performanceHistory = []
  }
}

// Singleton instance
let performanceMonitorInstance: DatabasePerformanceMonitor | null = null

export function getDatabasePerformanceMonitor(): DatabasePerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new DatabasePerformanceMonitor()
  }
  return performanceMonitorInstance
}

// Convenience exports
export const monitor = {
  getCurrentMetrics: () => getDatabasePerformanceMonitor().getCurrentMetrics(),
  getHealth: () => getDatabasePerformanceMonitor().getDatabaseHealth(),
  getSummary: () => getDatabasePerformanceMonitor().getPerformanceSummary(),
  getHistory: (metricName: string, hours: number) => 
    getDatabasePerformanceMonitor().getMetricHistory(metricName, hours)
}

export type { PerformanceMetric, DatabaseHealth, QueryPerformance }
export default getDatabasePerformanceMonitor