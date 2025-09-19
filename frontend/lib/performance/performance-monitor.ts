/**
 * Performance Monitoring System
 * Tracks application performance metrics and provides insights
 */

import { logger } from '@/lib/logger'
import { cacheManager, CacheNamespace } from '@/lib/cache/redis-cache-manager'

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  category: 'response_time' | 'throughput' | 'error_rate' | 'resource_usage' | 'user_experience'
  metadata?: Record<string, any>
}

export interface PerformanceThreshold {
  metric: string
  warning: number
  critical: number
  unit: string
}

export interface PerformanceReport {
  timeframe: string
  metrics: PerformanceMetric[]
  averages: Record<string, number>
  thresholdViolations: Array<{
    metric: string
    value: number
    threshold: number
    severity: 'warning' | 'critical'
  }>
  recommendations: string[]
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private thresholds: Map<string, PerformanceThreshold> = new Map()
  private monitoringInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeThresholds()
    this.startMonitoring()
  }

  /**
   * Initialize default performance thresholds
   */
  private initializeThresholds(): void {
    const defaultThresholds: PerformanceThreshold[] = [
      { metric: 'page_load_time', warning: 3000, critical: 5000, unit: 'ms' },
      { metric: 'api_response_time', warning: 500, critical: 1000, unit: 'ms' },
      { metric: 'database_query_time', warning: 100, critical: 500, unit: 'ms' },
      { metric: 'memory_usage', warning: 80, critical: 95, unit: '%' },
      { metric: 'cpu_usage', warning: 70, critical: 90, unit: '%' },
      { metric: 'error_rate', warning: 1, critical: 5, unit: '%' },
      { metric: 'cache_hit_rate', warning: 80, critical: 60, unit: '%' }
    ]

    defaultThresholds.forEach(threshold => {
      this.thresholds.set(threshold.metric, threshold)
    })
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.collectSystemMetrics()
    }, 60000) // Every minute
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    category: PerformanceMetric['category'] = 'response_time',
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      category,
      metadata
    }

    const existing = this.metrics.get(name) || []
    existing.push(metric)

    // Keep only last 1000 metrics per type
    if (existing.length > 1000) {
      existing.splice(0, existing.length - 1000)
    }

    this.metrics.set(name, existing)

    // Check thresholds
    this.checkThresholds(metric)
  }

  /**
   * Get metrics for a specific name or all metrics
   */
  getMetrics(name?: string, timeframe?: { start: Date; end: Date }): PerformanceMetric[] {
    let metrics: PerformanceMetric[] = []

    if (name) {
      metrics = this.metrics.get(name) || []
    } else {
      for (const metricArray of this.metrics.values()) {
        metrics.push(...metricArray)
      }
    }

    if (timeframe) {
      metrics = metrics.filter(m => 
        m.timestamp >= timeframe.start && m.timestamp <= timeframe.end
      )
    }

    return metrics
  }

  /**
   * Calculate average for a metric
   */
  getAverage(metricName: string, timeframe?: { start: Date; end: Date }): number {
    const metrics = this.getMetrics(metricName, timeframe)
    if (metrics.length === 0) return 0

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0)
    return sum / metrics.length
  }

  /**
   * Get percentile for a metric
   */
  getPercentile(metricName: string, percentile: number, timeframe?: { start: Date; end: Date }): number {
    const metrics = this.getMetrics(metricName, timeframe)
    if (metrics.length === 0) return 0

    const values = metrics.map(m => m.value).sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * values.length) - 1
    return values[Math.max(0, index)]
  }

  /**
   * Generate performance report
   */
  generateReport(timeframe: { start: Date; end: Date }): PerformanceReport {
    const metrics = this.getMetrics(undefined, timeframe)
    const metricNames = Array.from(this.metrics.keys())

    const averages: Record<string, number> = {}
    metricNames.forEach(name => {
      averages[name] = this.getAverage(name, timeframe)
    })

    const thresholdViolations = this.findThresholdViolations(timeframe)
    const recommendations = this.generateRecommendations(averages, thresholdViolations)

    return {
      timeframe: `${timeframe.start.toISOString()} - ${timeframe.end.toISOString()}`,
      metrics,
      averages,
      thresholdViolations,
      recommendations
    }
  }

  /**
   * Record page load time
   */
  recordPageLoadTime(page: string, loadTime: number): void {
    this.recordMetric(
      'page_load_time',
      loadTime,
      'ms',
      'user_experience',
      { page }
    )
  }

  /**
   * Record API response time
   */
  recordAPIResponseTime(endpoint: string, responseTime: number): void {
    this.recordMetric(
      'api_response_time',
      responseTime,
      'ms',
      'response_time',
      { endpoint }
    )
  }

  /**
   * Record database query time
   */
  recordDatabaseQueryTime(query: string, queryTime: number): void {
    this.recordMetric(
      'database_query_time',
      queryTime,
      'ms',
      'response_time',
      { query: query.substring(0, 100) } // Truncate for privacy
    )
  }

  /**
   * Record error rate
   */
  recordErrorRate(rate: number): void {
    this.recordMetric('error_rate', rate, '%', 'error_rate')
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      // Memory usage
      const memUsage = process.memoryUsage()
      const memTotal = memUsage.heapTotal
      const memUsed = memUsage.heapUsed
      const memPercentage = (memUsed / memTotal) * 100

      this.recordMetric('memory_usage', memPercentage, '%', 'resource_usage')

      // CPU usage would require additional modules in a real implementation
      // For now, simulate with random values within reasonable bounds
      const cpuUsage = Math.random() * 30 + 20 // 20-50% range
      this.recordMetric('cpu_usage', cpuUsage, '%', 'resource_usage')

      // Cache hit rate (if available)
      const cacheStats = await this.getCacheStats()
      if (cacheStats) {
        const hitRate = (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
        this.recordMetric('cache_hit_rate', hitRate, '%', 'throughput')
      }

    } catch (error) {
      logger.error('Failed to collect system metrics:', error)
    }
  }

  /**
   * Get cache statistics
   */
  private async getCacheStats(): Promise<{ hits: number; misses: number } | null> {
    try {
      // This would typically come from your cache implementation
      // For now, return simulated data
      return {
        hits: Math.floor(Math.random() * 1000) + 800,
        misses: Math.floor(Math.random() * 200) + 50
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Check if metric violates thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.name)
    if (!threshold) return

    if (metric.value >= threshold.critical) {
      logger.error(`Critical performance threshold exceeded for ${metric.name}`, {
        value: metric.value,
        threshold: threshold.critical,
        unit: metric.unit
      })
    } else if (metric.value >= threshold.warning) {
      logger.warn(`Performance warning threshold exceeded for ${metric.name}`, {
        value: metric.value,
        threshold: threshold.warning,
        unit: metric.unit
      })
    }
  }

  /**
   * Find threshold violations in timeframe
   */
  private findThresholdViolations(timeframe: { start: Date; end: Date }): Array<{
    metric: string
    value: number
    threshold: number
    severity: 'warning' | 'critical'
  }> {
    const violations: Array<{
      metric: string
      value: number
      threshold: number
      severity: 'warning' | 'critical'
    }> = []

    for (const [metricName, threshold] of this.thresholds) {
      const metrics = this.getMetrics(metricName, timeframe)
      
      for (const metric of metrics) {
        if (metric.value >= threshold.critical) {
          violations.push({
            metric: metricName,
            value: metric.value,
            threshold: threshold.critical,
            severity: 'critical'
          })
        } else if (metric.value >= threshold.warning) {
          violations.push({
            metric: metricName,
            value: metric.value,
            threshold: threshold.warning,
            severity: 'warning'
          })
        }
      }
    }

    return violations
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    averages: Record<string, number>,
    violations: Array<{ metric: string; severity: 'warning' | 'critical' }>
  ): string[] {
    const recommendations: string[] = []

    // Page load time recommendations
    if (averages.page_load_time > 3000) {
      recommendations.push('Consider optimizing images and enabling compression to improve page load times')
    }

    // API response time recommendations
    if (averages.api_response_time > 500) {
      recommendations.push('API response times are high - consider caching, database optimization, or CDN usage')
    }

    // Database query time recommendations
    if (averages.database_query_time > 100) {
      recommendations.push('Database queries are slow - review indexes and query optimization')
    }

    // Memory usage recommendations
    if (averages.memory_usage > 80) {
      recommendations.push('High memory usage detected - consider implementing memory optimization strategies')
    }

    // Error rate recommendations
    if (averages.error_rate > 1) {
      recommendations.push('Error rate is elevated - investigate and fix recurring errors')
    }

    // Cache hit rate recommendations
    if (averages.cache_hit_rate < 80) {
      recommendations.push('Cache hit rate is low - review caching strategy and TTL settings')
    }

    return recommendations
  }

  /**
   * Clean up old metrics
   */
  cleanup(olderThan: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)): void {
    for (const [name, metrics] of this.metrics) {
      const filtered = metrics.filter(m => m.timestamp > olderThan)
      this.metrics.set(name, filtered)
    }
  }

  /**
   * Stop monitoring and cleanup
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.metrics.clear()
    this.thresholds.clear()
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()