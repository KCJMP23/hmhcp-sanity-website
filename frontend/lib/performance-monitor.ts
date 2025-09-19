// Simple performance monitor for CMS functionality
// This supports the full CMS system deployment

import { logger } from '@/lib/logger'

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  tags?: Record<string, string>
}

export interface PerformanceThreshold {
  name: string
  warning: number
  critical: number
  unit: string
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private thresholds: PerformanceThreshold[] = []
  private isEnabled = true

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    if (!this.isEnabled) return

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags
    }

    this.metrics.push(metric)
    this.checkThresholds(metric)
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    logger.debug('Performance metric recorded', { name, value, unit })
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.find(t => t.name === metric.name)
    if (!threshold) return

    if (metric.value >= threshold.critical) {
      logger.error('Performance threshold exceeded (CRITICAL)', { 
        metric: metric.name, 
        value: metric.value, 
        threshold: threshold.critical,
        unit: metric.unit 
      })
    } else if (metric.value >= threshold.warning) {
      logger.warn('Performance threshold exceeded (WARNING)', { 
        metric: metric.name, 
        value: metric.value, 
        threshold: threshold.warning,
        unit: metric.unit 
      })
    }
  }

  addThreshold(threshold: PerformanceThreshold): void {
    this.thresholds.push(threshold)
  }

  getMetrics(name?: string, timeRange?: { start: number; end: number }): PerformanceMetric[] {
    let filtered = this.metrics

    if (name) {
      filtered = filtered.filter(m => m.name === name)
    }

    if (timeRange) {
      filtered = filtered.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end)
    }

    return filtered
  }

  getAverage(name: string, timeRange?: { start: number; end: number }): number {
    const metrics = this.getMetrics(name, timeRange)
    if (metrics.length === 0) return 0

    const sum = metrics.reduce((acc, m) => acc + m.value, 0)
    return sum / metrics.length
  }

  getMax(name: string, timeRange?: { start: number; end: number }): number {
    const metrics = this.getMetrics(name, timeRange)
    if (metrics.length === 0) return 0

    return Math.max(...metrics.map(m => m.value))
  }

  getMin(name: string, timeRange?: { start: number; end: number }): number {
    const metrics = this.getMetrics(name, timeRange)
    if (metrics.length === 0) return 0

    return Math.min(...metrics.map(m => m.value))
  }

  clearMetrics(): void {
    this.metrics = []
    logger.info('Performance metrics cleared')
  }

  enable(): void {
    this.isEnabled = true
    logger.info('Performance monitoring enabled')
  }

  disable(): void {
    this.isEnabled = false
    logger.info('Performance monitoring disabled')
  }

  isMonitoringEnabled(): boolean {
    return this.isEnabled
  }
}

// Export default instance
export const performanceMonitor = PerformanceMonitor.getInstance()

export default PerformanceMonitor