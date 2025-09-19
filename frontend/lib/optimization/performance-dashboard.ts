/**
 * Performance Monitoring Dashboard
 * 
 * Real-time performance metrics and monitoring for marketing website
 */

import { cacheManager } from '../cache/redis-cache-manager'
import { logger } from '../logger'

export interface PerformanceMetrics {
  timestamp: number
  url: string
  metrics: {
    // Core Web Vitals
    lcp: number | null      // Largest Contentful Paint
    fid: number | null      // First Input Delay  
    cls: number | null      // Cumulative Layout Shift
    fcp: number | null      // First Contentful Paint
    ttfb: number | null     // Time to First Byte
    
    // Additional metrics
    tti: number | null      // Time to Interactive
    tbt: number | null      // Total Blocking Time
    inp: number | null      // Interaction to Next Paint
    
    // Resource metrics
    domContentLoaded: number
    loadComplete: number
    resourceCount: number
    resourceSize: number
    
    // Cache metrics
    cacheHitRatio: number
    cacheResponseTime: number
    
    // Memory metrics
    memoryUsed: number
    memoryLimit: number
  }
  
  // Device info
  device: {
    type: 'mobile' | 'tablet' | 'desktop'
    viewport: { width: number; height: number }
    connection: string
    userAgent: string
  }
}

export interface PerformanceBudget {
  lcp: number
  fid: number
  cls: number
  fcp: number
  ttfb: number
  bundleSize: number
  imageSize: number
  cacheHitRatio: number
}

/**
 * Default performance budgets for marketing site
 */
export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  lcp: 2000,          // 2 seconds
  fid: 100,           // 100ms
  cls: 0.1,           // 0.1
  fcp: 1500,          // 1.5 seconds
  ttfb: 500,          // 500ms
  bundleSize: 300000, // 300KB
  imageSize: 100000,  // 100KB per image
  cacheHitRatio: 85   // 85%
}

/**
 * Performance monitoring dashboard
 */
export class PerformanceDashboard {
  private static instance: PerformanceDashboard
  private metrics: PerformanceMetrics[] = []
  private budget: PerformanceBudget
  private alertThresholds: Map<string, number> = new Map()

  private constructor(budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET) {
    this.budget = budget
    this.setupAlertThresholds()
  }

  public static getInstance(): PerformanceDashboard {
    if (!PerformanceDashboard.instance) {
      PerformanceDashboard.instance = new PerformanceDashboard()
    }
    return PerformanceDashboard.instance
  }

  /**
   * Setup alert thresholds
   */
  private setupAlertThresholds(): void {
    // Set thresholds at 90% of budget
    this.alertThresholds.set('lcp', this.budget.lcp * 0.9)
    this.alertThresholds.set('fid', this.budget.fid * 0.9)
    this.alertThresholds.set('cls', this.budget.cls * 0.9)
    this.alertThresholds.set('fcp', this.budget.fcp * 0.9)
    this.alertThresholds.set('ttfb', this.budget.ttfb * 0.9)
  }

  /**
   * Collect performance metrics
   */
  public async collectMetrics(data: Partial<PerformanceMetrics>): Promise<void> {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      url: data.url || window?.location?.href || '',
      metrics: {
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: null,
        tti: null,
        tbt: null,
        inp: null,
        domContentLoaded: 0,
        loadComplete: 0,
        resourceCount: 0,
        resourceSize: 0,
        cacheHitRatio: 0,
        cacheResponseTime: 0,
        memoryUsed: 0,
        memoryLimit: 0,
        ...data.metrics
      },
      device: data.device || {
        type: 'desktop',
        viewport: { width: 1920, height: 1080 },
        connection: 'unknown',
        userAgent: ''
      }
    }

    // Add cache metrics
    const cacheMetrics = cacheManager.getMetrics()
    metrics.metrics.cacheHitRatio = cacheManager.getHitRatio()
    metrics.metrics.cacheResponseTime = cacheMetrics.avgResponseTime

    // Store metrics
    this.metrics.push(metrics)
    
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Check for budget violations
    this.checkBudgetViolations(metrics)

    // Store in database for long-term analysis
    await this.persistMetrics(metrics)
  }

  /**
   * Check for budget violations
   */
  private checkBudgetViolations(metrics: PerformanceMetrics): void {
    const violations: string[] = []

    // Check Core Web Vitals
    if (metrics.metrics.lcp && metrics.metrics.lcp > this.budget.lcp) {
      violations.push(`LCP: ${metrics.metrics.lcp}ms exceeds budget of ${this.budget.lcp}ms`)
    }

    if (metrics.metrics.fid && metrics.metrics.fid > this.budget.fid) {
      violations.push(`FID: ${metrics.metrics.fid}ms exceeds budget of ${this.budget.fid}ms`)
    }

    if (metrics.metrics.cls && metrics.metrics.cls > this.budget.cls) {
      violations.push(`CLS: ${metrics.metrics.cls} exceeds budget of ${this.budget.cls}`)
    }

    if (metrics.metrics.fcp && metrics.metrics.fcp > this.budget.fcp) {
      violations.push(`FCP: ${metrics.metrics.fcp}ms exceeds budget of ${this.budget.fcp}ms`)
    }

    if (metrics.metrics.ttfb && metrics.metrics.ttfb > this.budget.ttfb) {
      violations.push(`TTFB: ${metrics.metrics.ttfb}ms exceeds budget of ${this.budget.ttfb}ms`)
    }

    // Check cache hit ratio
    if (metrics.metrics.cacheHitRatio < this.budget.cacheHitRatio) {
      violations.push(`Cache hit ratio: ${metrics.metrics.cacheHitRatio}% below target of ${this.budget.cacheHitRatio}%`)
    }

    // Log violations
    if (violations.length > 0) {
      logger.warn('Performance budget violations', {
        url: metrics.url,
        violations,
        device: metrics.device.type
      })

      // Send alerts for critical violations
      this.sendPerformanceAlert(metrics, violations)
    }
  }

  /**
   * Send performance alert
   */
  private async sendPerformanceAlert(
    metrics: PerformanceMetrics,
    violations: string[]
  ): Promise<void> {
    // In production, this would send to monitoring service
    try {
      await fetch('/api/monitoring/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance',
          severity: this.calculateSeverity(violations),
          url: metrics.url,
          violations,
          metrics: metrics.metrics,
          timestamp: metrics.timestamp
        })
      })
    } catch (error) {
      logger.error('Failed to send performance alert', { error })
    }
  }

  /**
   * Calculate alert severity
   */
  private calculateSeverity(violations: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (violations.length >= 4) return 'critical'
    if (violations.length >= 3) return 'high'
    if (violations.length >= 2) return 'medium'
    return 'low'
  }

  /**
   * Persist metrics to database
   */
  private async persistMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      // Store in Redis with TTL
      await cacheManager.set(
        `perf:${metrics.timestamp}:${metrics.url}`,
        metrics,
        {
          namespace: 'performance' as any,
          ttl: 86400 * 7 // Keep for 7 days
        }
      )

      // Also send to analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      })
    } catch (error) {
      logger.error('Failed to persist performance metrics', { error })
    }
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(timeRange?: { start: number; end: number }): {
    avgMetrics: Partial<PerformanceMetrics['metrics']>
    p50: Partial<PerformanceMetrics['metrics']>
    p75: Partial<PerformanceMetrics['metrics']>
    p95: Partial<PerformanceMetrics['metrics']>
    violations: number
    totalSamples: number
  } {
    let filteredMetrics = this.metrics

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }

    if (filteredMetrics.length === 0) {
      return {
        avgMetrics: {},
        p50: {},
        p75: {},
        p95: {},
        violations: 0,
        totalSamples: 0
      }
    }

    // Calculate averages and percentiles
    const lcpValues = filteredMetrics
      .map(m => m.metrics.lcp)
      .filter(v => v !== null) as number[]
    
    const fidValues = filteredMetrics
      .map(m => m.metrics.fid)
      .filter(v => v !== null) as number[]
    
    const clsValues = filteredMetrics
      .map(m => m.metrics.cls)
      .filter(v => v !== null) as number[]

    return {
      avgMetrics: {
        lcp: this.average(lcpValues),
        fid: this.average(fidValues),
        cls: this.average(clsValues),
        cacheHitRatio: this.average(filteredMetrics.map(m => m.metrics.cacheHitRatio))
      },
      p50: {
        lcp: this.percentile(lcpValues, 0.5),
        fid: this.percentile(fidValues, 0.5),
        cls: this.percentile(clsValues, 0.5)
      },
      p75: {
        lcp: this.percentile(lcpValues, 0.75),
        fid: this.percentile(fidValues, 0.75),
        cls: this.percentile(clsValues, 0.75)
      },
      p95: {
        lcp: this.percentile(lcpValues, 0.95),
        fid: this.percentile(fidValues, 0.95),
        cls: this.percentile(clsValues, 0.95)
      },
      violations: this.countViolations(filteredMetrics),
      totalSamples: filteredMetrics.length
    }
  }

  /**
   * Get real-time metrics
   */
  public getRealTimeMetrics(): {
    current: PerformanceMetrics | null
    trend: 'improving' | 'degrading' | 'stable'
    alerts: string[]
  } {
    const current = this.metrics[this.metrics.length - 1] || null
    
    if (!current) {
      return { current: null, trend: 'stable', alerts: [] }
    }

    // Calculate trend based on last 10 samples
    const recentMetrics = this.metrics.slice(-10)
    const trend = this.calculateTrend(recentMetrics)

    // Get active alerts
    const alerts = this.getActiveAlerts(current)

    return { current, trend, alerts }
  }

  /**
   * Calculate performance trend
   */
  private calculateTrend(
    metrics: PerformanceMetrics[]
  ): 'improving' | 'degrading' | 'stable' {
    if (metrics.length < 2) return 'stable'

    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2))
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2))

    const firstAvg = this.average(firstHalf.map(m => m.metrics.lcp || 0))
    const secondAvg = this.average(secondHalf.map(m => m.metrics.lcp || 0))

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    if (change > 10) return 'degrading'
    if (change < -10) return 'improving'
    return 'stable'
  }

  /**
   * Get active alerts
   */
  private getActiveAlerts(metrics: PerformanceMetrics): string[] {
    const alerts: string[] = []

    Object.entries(this.alertThresholds).forEach(([metric, threshold]) => {
      const value = (metrics.metrics as any)[metric]
      if (value && value > threshold) {
        alerts.push(`${metric.toUpperCase()} approaching budget limit`)
      }
    })

    return alerts
  }

  /**
   * Count budget violations
   */
  private countViolations(metrics: PerformanceMetrics[]): number {
    return metrics.reduce((count, m) => {
      let violations = 0
      
      if (m.metrics.lcp && m.metrics.lcp > this.budget.lcp) violations++
      if (m.metrics.fid && m.metrics.fid > this.budget.fid) violations++
      if (m.metrics.cls && m.metrics.cls > this.budget.cls) violations++
      if (m.metrics.fcp && m.metrics.fcp > this.budget.fcp) violations++
      if (m.metrics.ttfb && m.metrics.ttfb > this.budget.ttfb) violations++
      
      return count + violations
    }, 0)
  }

  /**
   * Calculate average
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, v) => sum + v, 0) / values.length
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0
    
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * p) - 1
    
    return sorted[Math.max(0, index)]
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'timestamp',
        'url',
        'lcp',
        'fid',
        'cls',
        'fcp',
        'ttfb',
        'cacheHitRatio',
        'device'
      ].join(',')

      const rows = this.metrics.map(m => [
        m.timestamp,
        m.url,
        m.metrics.lcp || '',
        m.metrics.fid || '',
        m.metrics.cls || '',
        m.metrics.fcp || '',
        m.metrics.ttfb || '',
        m.metrics.cacheHitRatio,
        m.device.type
      ].join(','))

      return [headers, ...rows].join('\n')
    }

    return JSON.stringify(this.metrics, null, 2)
  }
}

// Export singleton instance
export const performanceDashboard = PerformanceDashboard.getInstance()