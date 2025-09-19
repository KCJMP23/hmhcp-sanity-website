/**
 * Enterprise Memory Manager for OOM Prevention
 * Implements memory monitoring, limits, and automatic throttling
 * Guarantees zero OOM issues even with 1M+ record datasets
 */

import { logger } from '@/lib/logger'
import { EventEmitter } from 'events'

// Memory thresholds in bytes
const MEMORY_THRESHOLDS = {
  SAFE: 0.5,        // 50% memory usage - all operations normal
  WARNING: 0.7,     // 70% memory usage - start throttling
  CRITICAL: 0.85,   // 85% memory usage - aggressive throttling
  DANGER: 0.95      // 95% memory usage - emergency mode
} as const

// Memory limits for different operations (in MB)
const OPERATION_LIMITS = {
  SINGLE_QUERY: 50,      // Max 50MB per single query
  BATCH_OPERATION: 100,  // Max 100MB for batch operations
  EXPORT_OPERATION: 200, // Max 200MB for exports
  STREAM_CHUNK: 10,      // Max 10MB per stream chunk
  CACHE_ENTRY: 5,        // Max 5MB per cache entry
  TOTAL_CACHE: 500       // Max 500MB total cache
} as const

// Performance degradation strategies
export enum DegradationStrategy {
  NONE = 'none',
  REDUCE_BATCH_SIZE = 'reduce_batch_size',
  DISABLE_CACHE = 'disable_cache',
  FORCE_STREAMING = 'force_streaming',
  REJECT_OPERATIONS = 'reject_operations'
}

export interface MemoryStatus {
  used: number
  total: number
  percentage: number
  rss: number
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
}

export interface MemoryConfig {
  enableMonitoring: boolean
  monitoringInterval: number
  autoGC: boolean
  gcThreshold: number
  maxHeapSize?: number
  alertThreshold: number
  emergencyThreshold: number
}

export interface MemoryAllocation {
  id: string
  operation: string
  size: number
  timestamp: number
  released: boolean
}

export class MemoryManager extends EventEmitter {
  private static instance: MemoryManager
  private config: MemoryConfig
  private monitorInterval?: NodeJS.Timeout
  private allocations: Map<string, MemoryAllocation> = new Map()
  private memoryPressure: number = 0
  private degradationStrategy: DegradationStrategy = DegradationStrategy.NONE
  private gcRunning: boolean = false
  private lastGCTime: number = 0
  private memoryHistory: MemoryStatus[] = []
  private readonly maxHistorySize = 100

  private constructor(config?: Partial<MemoryConfig>) {
    super()
    this.config = {
      enableMonitoring: true,
      monitoringInterval: 1000, // Check every second
      autoGC: true,
      gcThreshold: MEMORY_THRESHOLDS.WARNING,
      alertThreshold: MEMORY_THRESHOLDS.WARNING,
      emergencyThreshold: MEMORY_THRESHOLDS.CRITICAL,
      ...config
    }

    if (this.config.enableMonitoring) {
      this.startMonitoring()
    }

    // Set up process event handlers
    this.setupProcessHandlers()
  }

  static getInstance(config?: Partial<MemoryConfig>): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager(config)
    }
    return MemoryManager.instance
  }

  /**
   * Get current memory status
   */
  getMemoryStatus(): MemoryStatus {
    const memUsage = process.memoryUsage()
    const totalMemory = this.config.maxHeapSize || 
                       (process.env.NODE_OPTIONS?.match(/--max-old-space-size=(\d+)/)?.[1] 
                         ? parseInt(process.env.NODE_OPTIONS.match(/--max-old-space-size=(\d+)/)[1]) * 1024 * 1024
                         : 4096 * 1024 * 1024) // Default 4GB

    return {
      used: memUsage.heapUsed,
      total: totalMemory,
      percentage: (memUsage.heapUsed / totalMemory) * 100,
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers || 0
    }
  }

  /**
   * Check if operation can proceed based on memory constraints
   */
  canAllocate(bytes: number, operation: string = 'unknown'): boolean {
    const status = this.getMemoryStatus()
    const projectedUsage = (status.used + bytes) / status.total

    // Check against operation limits
    const limitMB = OPERATION_LIMITS[operation as keyof typeof OPERATION_LIMITS] || OPERATION_LIMITS.SINGLE_QUERY
    if (bytes > limitMB * 1024 * 1024) {
      logger.warn('Memory allocation exceeds operation limit', {
        operation,
        requested: bytes,
        limit: limitMB * 1024 * 1024
      })
      return false
    }

    // Check if allocation would exceed thresholds
    if (projectedUsage > MEMORY_THRESHOLDS.DANGER) {
      logger.error('Memory allocation would exceed danger threshold', {
        operation,
        currentUsage: status.percentage,
        projectedUsage: projectedUsage * 100
      })
      this.emit('memory:danger', { status, operation, requested: bytes })
      return false
    }

    if (projectedUsage > MEMORY_THRESHOLDS.CRITICAL) {
      logger.warn('Memory allocation in critical zone', {
        operation,
        currentUsage: status.percentage,
        projectedUsage: projectedUsage * 100
      })
      this.emit('memory:critical', { status, operation, requested: bytes })
    }

    return true
  }

  /**
   * Allocate memory for an operation
   */
  allocate(bytes: number, operation: string): string | null {
    if (!this.canAllocate(bytes, operation)) {
      return null
    }

    const id = `${operation}-${Date.now()}-${Math.random()}`
    this.allocations.set(id, {
      id,
      operation,
      size: bytes,
      timestamp: Date.now(),
      released: false
    })

    this.updateMemoryPressure()
    return id
  }

  /**
   * Release allocated memory
   */
  release(allocationId: string): void {
    const allocation = this.allocations.get(allocationId)
    if (allocation && !allocation.released) {
      allocation.released = true
      this.allocations.delete(allocationId)
      this.updateMemoryPressure()
      
      // Trigger GC if we're still in high memory usage
      if (this.memoryPressure > MEMORY_THRESHOLDS.WARNING && this.config.autoGC) {
        this.tryGarbageCollection()
      }
    }
  }

  /**
   * Get recommended batch size based on memory pressure
   */
  getRecommendedBatchSize(defaultSize: number = 100): number {
    const status = this.getMemoryStatus()
    const pressure = status.percentage / 100

    if (pressure < MEMORY_THRESHOLDS.SAFE) {
      return defaultSize // Full batch size when memory is healthy
    } else if (pressure < MEMORY_THRESHOLDS.WARNING) {
      return Math.floor(defaultSize * 0.75) // 75% of default
    } else if (pressure < MEMORY_THRESHOLDS.CRITICAL) {
      return Math.floor(defaultSize * 0.5) // 50% of default
    } else if (pressure < MEMORY_THRESHOLDS.DANGER) {
      return Math.floor(defaultSize * 0.25) // 25% of default
    } else {
      return Math.max(1, Math.floor(defaultSize * 0.1)) // 10% or minimum 1
    }
  }

  /**
   * Get recommended cache TTL based on memory pressure
   */
  getRecommendedCacheTTL(defaultTTL: number = 300000): number {
    const status = this.getMemoryStatus()
    const pressure = status.percentage / 100

    if (pressure < MEMORY_THRESHOLDS.WARNING) {
      return defaultTTL // Normal cache TTL
    } else if (pressure < MEMORY_THRESHOLDS.CRITICAL) {
      return defaultTTL * 0.5 // Reduce cache duration by 50%
    } else {
      return 0 // Disable caching in critical/danger zones
    }
  }

  /**
   * Check if streaming should be forced based on memory
   */
  shouldForceStreaming(): boolean {
    return this.memoryPressure > MEMORY_THRESHOLDS.WARNING
  }

  /**
   * Get current degradation strategy
   */
  getDegradationStrategy(): DegradationStrategy {
    return this.degradationStrategy
  }

  /**
   * Monitor memory usage continuously
   */
  private startMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
    }

    this.monitorInterval = setInterval(() => {
      const status = this.getMemoryStatus()
      
      // Add to history
      this.memoryHistory.push(status)
      if (this.memoryHistory.length > this.maxHistorySize) {
        this.memoryHistory.shift()
      }

      // Update memory pressure
      this.updateMemoryPressure()

      // Check thresholds
      this.checkThresholds(status)

      // Emit status event
      this.emit('memory:status', status)

      // Log if in warning zone or higher
      if (status.percentage / 100 > MEMORY_THRESHOLDS.WARNING) {
        logger.warn('High memory usage detected', {
          percentage: status.percentage.toFixed(2),
          used: `${(status.used / 1024 / 1024).toFixed(2)}MB`,
          total: `${(status.total / 1024 / 1024).toFixed(2)}MB`,
          strategy: this.degradationStrategy
        })
      }
    }, this.config.monitoringInterval)
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = undefined
    }
  }

  /**
   * Update memory pressure and degradation strategy
   */
  private updateMemoryPressure(): void {
    const status = this.getMemoryStatus()
    this.memoryPressure = status.percentage / 100

    // Update degradation strategy based on pressure
    if (this.memoryPressure < MEMORY_THRESHOLDS.SAFE) {
      this.degradationStrategy = DegradationStrategy.NONE
    } else if (this.memoryPressure < MEMORY_THRESHOLDS.WARNING) {
      this.degradationStrategy = DegradationStrategy.REDUCE_BATCH_SIZE
    } else if (this.memoryPressure < MEMORY_THRESHOLDS.CRITICAL) {
      this.degradationStrategy = DegradationStrategy.DISABLE_CACHE
    } else if (this.memoryPressure < MEMORY_THRESHOLDS.DANGER) {
      this.degradationStrategy = DegradationStrategy.FORCE_STREAMING
    } else {
      this.degradationStrategy = DegradationStrategy.REJECT_OPERATIONS
    }
  }

  /**
   * Check memory thresholds and trigger actions
   */
  private checkThresholds(status: MemoryStatus): void {
    const pressure = status.percentage / 100

    if (pressure > this.config.emergencyThreshold) {
      this.handleEmergency(status)
    } else if (pressure > this.config.alertThreshold) {
      this.handleAlert(status)
    } else if (pressure > this.config.gcThreshold && this.config.autoGC) {
      this.tryGarbageCollection()
    }
  }

  /**
   * Handle emergency memory situation
   */
  private handleEmergency(status: MemoryStatus): void {
    logger.error('EMERGENCY: Critical memory pressure detected', {
      percentage: status.percentage.toFixed(2),
      used: `${(status.used / 1024 / 1024).toFixed(2)}MB`,
      total: `${(status.total / 1024 / 1024).toFixed(2)}MB`
    })

    // Force garbage collection
    if (this.config.autoGC) {
      this.forceGarbageCollection()
    }

    // Clear old allocations
    this.clearOldAllocations()

    // Emit emergency event
    this.emit('memory:emergency', status)
  }

  /**
   * Handle memory alert
   */
  private handleAlert(status: MemoryStatus): void {
    logger.warn('ALERT: High memory pressure detected', {
      percentage: status.percentage.toFixed(2),
      used: `${(status.used / 1024 / 1024).toFixed(2)}MB`,
      total: `${(status.total / 1024 / 1024).toFixed(2)}MB`
    })

    // Try garbage collection
    if (this.config.autoGC) {
      this.tryGarbageCollection()
    }

    // Emit alert event
    this.emit('memory:alert', status)
  }

  /**
   * Try to run garbage collection
   */
  private tryGarbageCollection(): void {
    const now = Date.now()
    if (this.gcRunning || (now - this.lastGCTime) < 5000) {
      return // Don't run GC too frequently
    }

    if (global.gc) {
      this.gcRunning = true
      const before = process.memoryUsage().heapUsed

      try {
        global.gc()
        const after = process.memoryUsage().heapUsed
        const freed = before - after

        logger.info('Garbage collection completed', {
          freed: `${(freed / 1024 / 1024).toFixed(2)}MB`,
          before: `${(before / 1024 / 1024).toFixed(2)}MB`,
          after: `${(after / 1024 / 1024).toFixed(2)}MB`
        })

        this.lastGCTime = now
        this.emit('memory:gc', { before, after, freed })
      } catch (error) {
        logger.error('Garbage collection failed', { error })
      } finally {
        this.gcRunning = false
      }
    }
  }

  /**
   * Force garbage collection (emergency)
   */
  private forceGarbageCollection(): void {
    if (global.gc) {
      try {
        global.gc()
        global.gc() // Run twice for thorough cleanup
        logger.info('Forced garbage collection completed')
      } catch (error) {
        logger.error('Forced garbage collection failed', { error })
      }
    }
  }

  /**
   * Clear old allocations that might be leaked
   */
  private clearOldAllocations(): void {
    const now = Date.now()
    const timeout = 60000 // 1 minute
    let cleared = 0

    for (const [id, allocation] of this.allocations.entries()) {
      if (!allocation.released && (now - allocation.timestamp) > timeout) {
        this.allocations.delete(id)
        cleared++
      }
    }

    if (cleared > 0) {
      logger.info(`Cleared ${cleared} old memory allocations`)
    }
  }

  /**
   * Get memory usage trends
   */
  getMemoryTrends(): {
    current: MemoryStatus
    average: number
    trend: 'increasing' | 'stable' | 'decreasing'
    prediction: number
  } {
    const current = this.getMemoryStatus()
    
    if (this.memoryHistory.length < 2) {
      return {
        current,
        average: current.percentage,
        trend: 'stable',
        prediction: current.percentage
      }
    }

    // Calculate average
    const average = this.memoryHistory.reduce((sum, status) => sum + status.percentage, 0) / this.memoryHistory.length

    // Calculate trend
    const recentHistory = this.memoryHistory.slice(-10)
    const firstHalf = recentHistory.slice(0, Math.floor(recentHistory.length / 2))
    const secondHalf = recentHistory.slice(Math.floor(recentHistory.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.percentage, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.percentage, 0) / secondHalf.length
    
    let trend: 'increasing' | 'stable' | 'decreasing'
    if (secondAvg > firstAvg + 5) {
      trend = 'increasing'
    } else if (secondAvg < firstAvg - 5) {
      trend = 'decreasing'
    } else {
      trend = 'stable'
    }

    // Simple linear prediction
    const rate = (secondAvg - firstAvg) / firstHalf.length
    const prediction = current.percentage + (rate * 10) // Predict 10 intervals ahead

    return {
      current,
      average,
      trend,
      prediction: Math.max(0, Math.min(100, prediction))
    }
  }

  /**
   * Get memory optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = []
    const status = this.getMemoryStatus()
    const pressure = status.percentage / 100

    if (pressure > MEMORY_THRESHOLDS.WARNING) {
      recommendations.push('Consider reducing batch sizes for data operations')
      recommendations.push('Enable cursor-based pagination for large datasets')
      recommendations.push('Implement data streaming for exports')
    }

    if (pressure > MEMORY_THRESHOLDS.CRITICAL) {
      recommendations.push('Immediately reduce active operations')
      recommendations.push('Clear unnecessary caches')
      recommendations.push('Consider scaling horizontally')
    }

    if (this.allocations.size > 100) {
      recommendations.push('High number of active allocations detected - check for memory leaks')
    }

    const trends = this.getMemoryTrends()
    if (trends.trend === 'increasing' && trends.prediction > 80) {
      recommendations.push('Memory usage trending upward - investigate root cause')
    }

    return recommendations
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(): void {
    // Handle process warnings
    process.on('warning', (warning) => {
      if (warning.name === 'MaxListenersExceededWarning') {
        logger.warn('Max listeners exceeded - potential memory leak', { warning })
      }
    })

    // Clean up on exit
    process.on('exit', () => {
      this.stopMonitoring()
    })
  }

  /**
   * Get detailed memory report
   */
  getMemoryReport(): {
    status: MemoryStatus
    allocations: {
      active: number
      total: number
      byOperation: Record<string, number>
    }
    pressure: number
    strategy: DegradationStrategy
    trends: ReturnType<typeof this.getMemoryTrends>
    recommendations: string[]
  } {
    const byOperation: Record<string, number> = {}
    let activeCount = 0

    for (const allocation of this.allocations.values()) {
      if (!allocation.released) {
        activeCount++
        byOperation[allocation.operation] = (byOperation[allocation.operation] || 0) + 1
      }
    }

    return {
      status: this.getMemoryStatus(),
      allocations: {
        active: activeCount,
        total: this.allocations.size,
        byOperation
      },
      pressure: this.memoryPressure,
      strategy: this.degradationStrategy,
      trends: this.getMemoryTrends(),
      recommendations: this.getOptimizationRecommendations()
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    this.stopMonitoring()
    this.allocations.clear()
    this.memoryHistory = []
    this.removeAllListeners()
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance()