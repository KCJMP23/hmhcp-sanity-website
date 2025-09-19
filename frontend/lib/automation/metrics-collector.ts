/**
 * Metrics Collector for Automation Infrastructure
 * Story 1.1: Admin Foundation & Core Automation Infrastructure
 * 
 * Collects and tracks performance metrics for monitoring
 * 
 * @module MetricsCollector
 */

import { EventEmitter } from 'events'
import { TaskType, TaskStatus } from '@/types/admin'

export interface TaskMetrics {
  taskType: TaskType
  duration: number
  status: TaskStatus
  timestamp: Date
  queueWaitTime?: number
  processingTime?: number
  retryCount?: number
}

export interface QueueMetrics {
  queueName: string
  waitingJobs: number
  activeJobs: number
  completedJobs: number
  failedJobs: number
  avgProcessingTime: number
  throughput: number // jobs per minute
}

export interface SystemMetrics {
  memoryUsage: NodeJS.MemoryUsage
  uptime: number
  activeTasks: number
  taskMetrics: TaskMetrics[]
  queueMetrics: QueueMetrics[]
}

/**
 * Collects and aggregates metrics for the automation infrastructure
 */
export class MetricsCollector extends EventEmitter {
  private static instance: MetricsCollector
  private taskMetrics: TaskMetrics[] = []
  private startTime: Date
  private readonly maxMetricsHistory = 1000

  private constructor() {
    super()
    this.startTime = new Date()
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }

  /**
   * Record task execution metrics
   */
  public recordTaskMetrics(metrics: TaskMetrics): void {
    this.taskMetrics.push(metrics)
    
    // Trim history if too large
    if (this.taskMetrics.length > this.maxMetricsHistory) {
      this.taskMetrics = this.taskMetrics.slice(-this.maxMetricsHistory)
    }

    // Emit metric event for real-time monitoring
    this.emit('task:metric', metrics)
  }

  /**
   * Get task performance statistics
   */
  public getTaskStatistics(taskType?: TaskType): {
    totalTasks: number
    successRate: number
    avgDuration: number
    p95Duration: number
    p99Duration: number
  } {
    const relevantMetrics = taskType 
      ? this.taskMetrics.filter(m => m.taskType === taskType)
      : this.taskMetrics

    if (relevantMetrics.length === 0) {
      return {
        totalTasks: 0,
        successRate: 0,
        avgDuration: 0,
        p95Duration: 0,
        p99Duration: 0
      }
    }

    const successfulTasks = relevantMetrics.filter(
      m => m.status === TaskStatus.COMPLETED
    )
    
    const durations = relevantMetrics
      .map(m => m.duration)
      .sort((a, b) => a - b)

    return {
      totalTasks: relevantMetrics.length,
      successRate: (successfulTasks.length / relevantMetrics.length) * 100,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      p99Duration: durations[Math.floor(durations.length * 0.99)] || 0
    }
  }

  /**
   * Calculate throughput (tasks per minute)
   */
  public getThroughput(windowMinutes: number = 5): number {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)
    const recentTasks = this.taskMetrics.filter(
      m => m.timestamp > windowStart
    )
    
    return (recentTasks.length / windowMinutes) || 0
  }

  /**
   * Get system-wide metrics
   */
  public getSystemMetrics(): SystemMetrics {
    const queueTypes = Object.values(TaskType)
    const queueMetrics: QueueMetrics[] = []

    for (const queueType of queueTypes) {
      const metrics = this.taskMetrics.filter(m => m.taskType === queueType)
      const stats = this.getTaskStatistics(queueType)
      
      queueMetrics.push({
        queueName: queueType,
        waitingJobs: 0, // Would need queue integration
        activeJobs: 0,  // Would need queue integration
        completedJobs: metrics.filter(m => m.status === TaskStatus.COMPLETED).length,
        failedJobs: metrics.filter(m => m.status === TaskStatus.FAILED).length,
        avgProcessingTime: stats.avgDuration,
        throughput: this.getThroughput(5)
      })
    }

    return {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      activeTasks: this.taskMetrics.filter(
        m => m.status === TaskStatus.RUNNING
      ).length,
      taskMetrics: this.taskMetrics.slice(-100), // Last 100 tasks
      queueMetrics
    }
  }

  /**
   * Export metrics for monitoring systems
   */
  public exportPrometheusMetrics(): string {
    const stats = this.getSystemMetrics()
    const lines: string[] = []

    // Task metrics
    lines.push('# HELP task_total Total number of tasks processed')
    lines.push('# TYPE task_total counter')
    lines.push(`task_total ${this.taskMetrics.length}`)

    // Success rate
    const overallStats = this.getTaskStatistics()
    lines.push('# HELP task_success_rate Task success rate percentage')
    lines.push('# TYPE task_success_rate gauge')
    lines.push(`task_success_rate ${overallStats.successRate}`)

    // Duration metrics
    lines.push('# HELP task_duration_seconds Task execution duration in seconds')
    lines.push('# TYPE task_duration_seconds summary')
    lines.push(`task_duration_seconds{quantile="0.5"} ${overallStats.avgDuration / 1000}`)
    lines.push(`task_duration_seconds{quantile="0.95"} ${overallStats.p95Duration / 1000}`)
    lines.push(`task_duration_seconds{quantile="0.99"} ${overallStats.p99Duration / 1000}`)

    // Memory metrics
    lines.push('# HELP nodejs_heap_size_used_bytes Process heap size')
    lines.push('# TYPE nodejs_heap_size_used_bytes gauge')
    lines.push(`nodejs_heap_size_used_bytes ${stats.memoryUsage.heapUsed}`)

    // Throughput
    lines.push('# HELP task_throughput_per_minute Tasks processed per minute')
    lines.push('# TYPE task_throughput_per_minute gauge')
    lines.push(`task_throughput_per_minute ${this.getThroughput(1)}`)

    return lines.join('\n')
  }

  /**
   * Clear metrics history
   */
  public clearMetrics(): void {
    this.taskMetrics = []
    this.emit('metrics:cleared')
  }

  /**
   * Get health status
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, boolean>
    message: string
  } {
    const stats = this.getTaskStatistics()
    const throughput = this.getThroughput(5)
    
    const checks = {
      successRate: stats.successRate > 90,
      responseTime: stats.p95Duration < 5000,
      throughput: throughput > 0,
      memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024 // 500MB
    }

    const failedChecks = Object.values(checks).filter(c => !c).length
    
    return {
      status: failedChecks === 0 ? 'healthy' : failedChecks === 1 ? 'degraded' : 'unhealthy',
      checks,
      message: failedChecks === 0 
        ? 'All systems operational'
        : `${failedChecks} health check(s) failing`
    }
  }
}

// Export singleton instance
export const metricsCollector = MetricsCollector.getInstance()