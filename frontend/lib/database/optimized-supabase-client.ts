// =============================================
// ENTERPRISE SUPABASE CLIENT OPTIMIZATION
// Target: Sub-10ms connection time, 99.9% uptime
// =============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// Connection pool configuration for enterprise performance
const OPTIMAL_POOL_CONFIG = {
  db: {
    pool: {
      min: 10,           // Minimum connections
      max: 30,           // Maximum connections for enterprise load
      acquireTimeoutMillis: 10000,    // 10s timeout for acquiring connection
      createTimeoutMillis: 10000,     // 10s timeout for creating connection
      destroyTimeoutMillis: 5000,     // 5s timeout for destroying connection
      idleTimeoutMillis: 600000,      // 10 minutes idle timeout
      reapIntervalMillis: 60000,      // 1 minute reap interval
      createRetryIntervalMillis: 100, // 100ms retry interval
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'hmhcp-enterprise',
      'x-connection-pool': 'optimized'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 100,  // Increased for enterprise
    }
  }
}

// Environment configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Performance monitoring
interface ConnectionMetrics {
  totalConnections: number
  activeConnections: number
  avgConnectionTime: number
  connectionErrors: number
  lastHealthCheck: Date
}

class OptimizedSupabaseClient {
  private client: SupabaseClient
  private serviceClient: SupabaseClient
  private connectionPool: Map<string, SupabaseClient> = new Map()
  private metrics: ConnectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    avgConnectionTime: 0,
    connectionErrors: 0,
    lastHealthCheck: new Date()
  }
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.client = this.createOptimizedClient(supabaseAnonKey)
    this.serviceClient = this.createOptimizedClient(supabaseServiceKey, true)
    this.initializeHealthChecks()
  }

  private createOptimizedClient(key: string, isService = false): SupabaseClient {
    const startTime = performance.now()
    
    try {
      const client = createClient(supabaseUrl, key, {
        ...OPTIMAL_POOL_CONFIG,
        auth: {
          ...OPTIMAL_POOL_CONFIG.auth,
          persistSession: !isService,
          autoRefreshToken: !isService
        }
      })

      const connectionTime = performance.now() - startTime
      this.updateConnectionMetrics(connectionTime, true)

      // Add connection retry logic with exponential backoff
      this.addRetryLogic(client)

      return client
    } catch (error) {
      this.updateConnectionMetrics(0, false)
      logger.error('Failed to create optimized Supabase client', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        isService 
      })
      throw error
    }
  }

  private addRetryLogic(client: SupabaseClient): void {
    const originalRequest = client.rest.request
    
    client.rest.request = async (request: any, retryCount = 0): Promise<any> => {
      const maxRetries = 3
      const baseDelay = 100
      
      try {
        return await originalRequest.call(client.rest, request)
      } catch (error) {
        if (retryCount < maxRetries && this.isRetryableError(error)) {
          const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 100
          
          logger.warn(`Database request failed, retrying in ${delay}ms`, {
            retryCount: retryCount + 1,
            maxRetries,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          
          await new Promise(resolve => setTimeout(resolve, delay))
          return client.rest.request(request, retryCount + 1)
        }
        
        this.updateConnectionMetrics(0, false)
        throw error
      }
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'connection refused',
      'timeout',
      'network error',
      'temporary failure',
      'service unavailable'
    ]
    
    const errorMessage = error?.message?.toLowerCase() || ''
    return retryableErrors.some(retryable => errorMessage.includes(retryable))
  }

  private updateConnectionMetrics(connectionTime: number, success: boolean): void {
    this.metrics.totalConnections++
    
    if (success) {
      this.metrics.activeConnections++
      this.metrics.avgConnectionTime = (
        (this.metrics.avgConnectionTime * (this.metrics.totalConnections - 1) + connectionTime) / 
        this.metrics.totalConnections
      )
    } else {
      this.metrics.connectionErrors++
    }
  }

  private initializeHealthChecks(): void {
    // Run health checks every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck()
    }, 30000)

    // Initial health check
    this.performHealthCheck()
  }

  private async performHealthCheck(): Promise<void> {
    const startTime = performance.now()
    
    try {
      // Simple query to test connection health
      const { data, error } = await this.serviceClient
        .from('admin_users')
        .select('id')
        .limit(1)
        .single()

      const responseTime = performance.now() - startTime
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error
      }

      this.metrics.lastHealthCheck = new Date()
      
      // Log performance metrics
      if (responseTime > 100) {
        logger.warn('Database health check slow', {
          responseTime: `${responseTime.toFixed(2)}ms`,
          target: '<50ms'
        })
      }

      // Update connection pool if needed
      if (responseTime > 200) {
        await this.refreshConnectionPool()
      }

    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: this.getMetrics()
      })
      
      // Attempt to recreate connections on repeated failures
      await this.refreshConnectionPool()
    }
  }

  private async refreshConnectionPool(): Promise<void> {
    try {
      logger.info('Refreshing database connection pool')
      
      // Create new optimized clients
      const newClient = this.createOptimizedClient(supabaseAnonKey)
      const newServiceClient = this.createOptimizedClient(supabaseServiceKey, true)
      
      // Replace old clients
      this.client = newClient
      this.serviceClient = newServiceClient
      
      logger.info('Database connection pool refreshed successfully')
    } catch (error) {
      logger.error('Failed to refresh connection pool', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Public client for authenticated operations
  getClient(): SupabaseClient {
    return this.client
  }

  // Service client for admin operations
  getServiceClient(): SupabaseClient {
    return this.serviceClient
  }

  // Get connection metrics for monitoring
  getMetrics(): ConnectionMetrics {
    return { ...this.metrics }
  }

  // Optimized query wrapper with performance monitoring
  async performQuery<T>(
    queryBuilder: any,
    queryType: string = 'unknown'
  ): Promise<{ data: T | null, error: any, executionTime: number }> {
    const startTime = performance.now()
    
    try {
      const result = await queryBuilder
      const executionTime = performance.now() - startTime
      
      // Log slow queries
      if (executionTime > 50) {
        await this.logSlowQuery(queryType, executionTime, queryBuilder.toString())
      }
      
      return {
        ...result,
        executionTime
      }
    } catch (error) {
      const executionTime = performance.now() - startTime
      
      logger.error('Database query failed', {
        queryType,
        executionTime: `${executionTime.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return {
        data: null,
        error,
        executionTime
      }
    }
  }

  private async logSlowQuery(queryType: string, executionTime: number, query: string): Promise<void> {
    try {
      await this.serviceClient.rpc('log_slow_query', {
        query_text: query,
        execution_time_ms: executionTime,
        query_type: queryType
      })
    } catch (error) {
      // Don't let slow query logging interfere with main operation
      logger.error('Failed to log slow query', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    
    this.connectionPool.clear()
  }
}

// Singleton instance for optimal performance
let optimizedSupabaseInstance: OptimizedSupabaseClient | null = null

export function getOptimizedSupabaseClient(): OptimizedSupabaseClient {
  if (!optimizedSupabaseInstance) {
    optimizedSupabaseInstance = new OptimizedSupabaseClient()
  }
  return optimizedSupabaseInstance
}

// Convenience exports
export function getSupabaseClient(): SupabaseClient {
  return getOptimizedSupabaseClient().getClient()
}

export function getSupabaseServiceClient(): SupabaseClient {
  return getOptimizedSupabaseClient().getServiceClient()
}

export function getSupabaseMetrics(): ConnectionMetrics {
  return getOptimizedSupabaseClient().getMetrics()
}

export async function performOptimizedQuery<T>(
  queryBuilder: any,
  queryType: string = 'unknown'
): Promise<{ data: T | null, error: any, executionTime: number }> {
  return getOptimizedSupabaseClient().performQuery<T>(queryBuilder, queryType)
}

// Performance monitoring utilities
export async function getPerformanceReport(): Promise<any> {
  const client = getSupabaseServiceClient()
  const metrics = getSupabaseMetrics()
  
  try {
    const { data: dbMetrics } = await client.rpc('get_performance_metrics')
    
    return {
      connection_metrics: metrics,
      database_metrics: dbMetrics,
      performance_summary: {
        avg_connection_time: `${metrics.avgConnectionTime.toFixed(2)}ms`,
        active_connections: metrics.activeConnections,
        connection_success_rate: `${((metrics.totalConnections - metrics.connectionErrors) / metrics.totalConnections * 100).toFixed(2)}%`,
        last_health_check: metrics.lastHealthCheck,
        status: metrics.avgConnectionTime < 10 ? 'excellent' : metrics.avgConnectionTime < 50 ? 'good' : 'needs_optimization'
      }
    }
  } catch (error) {
    logger.error('Failed to get performance report', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return { error: 'Failed to generate performance report' }
  }
}

export default getOptimizedSupabaseClient