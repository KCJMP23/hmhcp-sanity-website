/**
 * Services Integration Layer
 * Handles integration between different services and external APIs
 */

import { logger } from '@/lib/logger'
import { cacheManager, CacheNamespace } from '@/lib/cache/redis-cache-manager'

export interface ServiceHealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  lastChecked: Date
  error?: string
}

export interface IntegrationMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageLatency: number
  uptime: number
}

export class ServicesIntegrationManager {
  private services: Map<string, ServiceHealthCheck> = new Map()
  private metrics: Map<string, IntegrationMetrics> = new Map()
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeServices()
    this.startHealthChecks()
  }

  /**
   * Initialize default services
   */
  private initializeServices(): void {
    const defaultServices = [
      'supabase',
      'redis',
      'email',
      'analytics',
      'cdn'
    ]

    defaultServices.forEach(service => {
      this.services.set(service, {
        service,
        status: 'healthy',
        latency: 0,
        lastChecked: new Date()
      })

      this.metrics.set(service, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        uptime: 100
      })
    })
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks()
    }, 30000) // Every 30 seconds
  }

  /**
   * Perform health checks on all services
   */
  async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.services.keys()).map(async (serviceName) => {
      try {
        await this.checkServiceHealth(serviceName)
      } catch (error) {
        logger.error(`Health check failed for ${serviceName}:`, error)
      }
    })

    await Promise.allSettled(promises)
  }

  /**
   * Check health of a specific service
   */
  async checkServiceHealth(serviceName: string): Promise<ServiceHealthCheck> {
    const startTime = Date.now()
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'
    let error: string | undefined

    try {
      // Simulate service health check based on service type
      switch (serviceName) {
        case 'supabase':
          await this.checkSupabaseHealth()
          break
        case 'redis':
          await this.checkRedisHealth()
          break
        case 'email':
          await this.checkEmailHealth()
          break
        case 'analytics':
          await this.checkAnalyticsHealth()
          break
        case 'cdn':
          await this.checkCDNHealth()
          break
        default:
          throw new Error(`Unknown service: ${serviceName}`)
      }
    } catch (err) {
      status = 'down'
      error = err instanceof Error ? err.message : 'Health check failed'
    }

    const latency = Date.now() - startTime
    
    // Determine status based on latency
    if (latency > 5000) {
      status = 'degraded'
    } else if (latency > 10000) {
      status = 'down'
    }

    const healthCheck: ServiceHealthCheck = {
      service: serviceName,
      status,
      latency,
      lastChecked: new Date(),
      error
    }

    this.services.set(serviceName, healthCheck)
    this.updateMetrics(serviceName, status === 'healthy', latency)

    return healthCheck
  }

  /**
   * Get all service health statuses
   */
  getServiceHealthStatuses(): ServiceHealthCheck[] {
    return Array.from(this.services.values())
  }

  /**
   * Get service metrics
   */
  getServiceMetrics(serviceName?: string): IntegrationMetrics | Map<string, IntegrationMetrics> {
    if (serviceName) {
      return this.metrics.get(serviceName) || {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        uptime: 0
      }
    }
    return new Map(this.metrics)
  }

  /**
   * Test service integration
   */
  async testServiceIntegration(serviceName: string): Promise<{
    success: boolean
    latency: number
    error?: string
  }> {
    const startTime = Date.now()

    try {
      await this.checkServiceHealth(serviceName)
      const service = this.services.get(serviceName)
      
      return {
        success: service?.status === 'healthy',
        latency: Date.now() - startTime,
        error: service?.error
      }
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Integration test failed'
      }
    }
  }

  /**
   * Update service metrics
   */
  private updateMetrics(serviceName: string, success: boolean, latency: number): void {
    const current = this.metrics.get(serviceName) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      uptime: 100
    }

    const updated: IntegrationMetrics = {
      totalRequests: current.totalRequests + 1,
      successfulRequests: success ? current.successfulRequests + 1 : current.successfulRequests,
      failedRequests: success ? current.failedRequests : current.failedRequests + 1,
      averageLatency: ((current.averageLatency * current.totalRequests) + latency) / (current.totalRequests + 1),
      uptime: success ? Math.min(current.uptime + 0.1, 100) : Math.max(current.uptime - 1, 0)
    }

    this.metrics.set(serviceName, updated)
  }

  // Individual service health check methods
  private async checkSupabaseHealth(): Promise<void> {
    // Simulate Supabase health check
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
  }

  private async checkRedisHealth(): Promise<void> {
    try {
      await cacheManager.get('health-check', { namespace: CacheNamespace.SYSTEM })
    } catch (error) {
      throw new Error('Redis connection failed')
    }
  }

  private async checkEmailHealth(): Promise<void> {
    // Simulate email service health check
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200))
  }

  private async checkAnalyticsHealth(): Promise<void> {
    // Simulate analytics service health check
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150))
  }

  private async checkCDNHealth(): Promise<void> {
    // Simulate CDN health check
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    this.services.clear()
    this.metrics.clear()
  }
}

// Export singleton instance
export const servicesIntegration = new ServicesIntegrationManager()