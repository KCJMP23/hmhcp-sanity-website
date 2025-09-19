/**
 * Performance Monitoring Utilities
 * Tracks API response times and provides optimization insights
 */

export interface PerformanceMetric {
  endpoint: string
  method: string
  responseTime: number
  cacheStatus: 'HIT' | 'MISS'
  timestamp: number
  status: number
  error?: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly MAX_METRICS = 1000 // Keep last 1000 requests
  private readonly SLOW_THRESHOLD = 200 // ms

  /**
   * Record a performance metric
   */
  record(metric: PerformanceMetric) {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    })

    // Keep only the last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }

    // Log slow requests in development
    if (process.env.NODE_ENV === 'development' && metric.responseTime > this.SLOW_THRESHOLD) {
      console.warn(`⚡ Slow API Response: ${metric.endpoint} took ${metric.responseTime}ms`)
    }
  }

  /**
   * Get performance statistics for an endpoint
   */
  getStats(endpoint?: string): {
    totalRequests: number
    averageResponseTime: number
    cacheHitRate: number
    slowRequests: number
    errorRate: number
  } {
    const relevantMetrics = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics

    if (relevantMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        slowRequests: 0,
        errorRate: 0
      }
    }

    const totalRequests = relevantMetrics.length
    const averageResponseTime = relevantMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
    const cacheHits = relevantMetrics.filter(m => m.cacheStatus === 'HIT').length
    const slowRequests = relevantMetrics.filter(m => m.responseTime > this.SLOW_THRESHOLD).length
    const errors = relevantMetrics.filter(m => m.status >= 400 || m.error).length

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      cacheHitRate: Math.round((cacheHits / totalRequests) * 100),
      slowRequests,
      errorRate: Math.round((errors / totalRequests) * 100)
    }
  }

  /**
   * Get recent performance trends
   */
  getRecentTrends(minutes: number = 10) {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff)
    
    return {
      recentRequests: recentMetrics.length,
      ...this.getStats(),
      timeframe: `${minutes} minutes`
    }
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = []
  }

  /**
   * Export metrics for analysis
   */
  export() {
    return [...this.metrics]
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Higher-order function to wrap API routes with performance monitoring
 */
export function withPerformanceMonitoring(
  handler: (req: any, res: any) => Promise<Response>,
  endpoint: string
) {
  return async (req: any, res: any): Promise<Response> => {
    const startTime = Date.now()
    let response: Response
    let error: string | undefined

    try {
      response = await handler(req, res)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      const responseTime = Date.now() - startTime
      const cacheStatus = response?.headers.get('X-Cache') as 'HIT' | 'MISS' || 'MISS'
      
      performanceMonitor.record({
        endpoint,
        method: req.method,
        responseTime,
        cacheStatus,
        timestamp: Date.now(),
        status: response?.status || 500,
        error
      })
    }

    return response
  }
}

/**
 * Database health check utility
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  responseTime: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    // Import here to avoid circular dependencies
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    
    // Simple health check query
    const { error } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1)
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      console.error('Database health check failed:', error)
      return {
        healthy: false,
        responseTime,
        error: error.message
      }
    }
    
    return {
      healthy: true,
      responseTime
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error('Database health check failed:', errorMessage)
    return {
      healthy: false,
      responseTime,
      error: errorMessage
    }
  }
}

/**
 * API performance optimization recommendations
 */
export function getOptimizationRecommendations(): {
  priority: 'high' | 'medium' | 'low'
  recommendation: string
  impact: string
}[] {
  const stats = performanceMonitor.getStats()
  const recommendations: {
    priority: 'high' | 'medium' | 'low'
    recommendation: string
    impact: string
  }[] = []

  if (stats.averageResponseTime > 500) {
    recommendations.push({
      priority: 'high',
      recommendation: 'API responses are taking over 500ms on average. Consider implementing database query optimization and connection pooling.',
      impact: 'Reduce response time by 60-80%'
    })
  }

  if (stats.cacheHitRate < 70) {
    recommendations.push({
      priority: 'high',
      recommendation: 'Cache hit rate is below 70%. Review caching strategies and TTL values.',
      impact: 'Improve cache hit rate to 85%+'
    })
  }

  if (stats.slowRequests > stats.totalRequests * 0.1) {
    recommendations.push({
      priority: 'medium',
      recommendation: 'More than 10% of requests are slow (>200ms). Optimize database queries and add indexes.',
      impact: 'Reduce slow request percentage by 50%'
    })
  }

  if (stats.errorRate > 5) {
    recommendations.push({
      priority: 'high',
      recommendation: 'Error rate is above 5%. Investigate and fix failing API endpoints.',
      impact: 'Improve application stability'
    })
  }

  return recommendations
}