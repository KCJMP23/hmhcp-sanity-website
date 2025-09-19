/**
 * Performance Monitoring System
 * Real-time performance tracking and optimization
 */

import { NextRequest, NextResponse } from 'next/server'

export interface PerformanceMetrics {
  timestamp: number
  url: string
  method: string
  responseTime: number
  memoryUsage: NodeJS.MemoryUsage
  cpuUsage: NodeJS.CpuUsage
  userAgent: string
  ip: string
  statusCode: number
  contentLength?: number
  cacheHit?: boolean
}

export interface WebVitals {
  name: string
  value: number
  delta: number
  id: string
  navigationType: string
  url: string
  timestamp: number
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private webVitals: WebVitals[] = []
  private maxMetrics = 1000 // Keep last 1000 metrics
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  /**
   * Record API performance metrics
   */
  recordAPIMetrics(
    request: NextRequest,
    response: NextResponse,
    startTime: number
  ): void {
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    const metric: PerformanceMetrics = {
      timestamp: endTime,
      url: request.nextUrl.pathname,
      method: request.method,
      responseTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: this.getClientIP(request),
      statusCode: response.status,
      contentLength: parseInt(response.headers.get('content-length') || '0'),
      cacheHit: response.headers.get('x-cache') === 'HIT'
    }
    
    this.metrics.push(metric)
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
    
    // Log slow requests
    if (responseTime > 5000) {
      console.warn(`Slow API request: ${request.method} ${request.nextUrl.pathname} took ${responseTime}ms`)
    }
  }
  
  /**
   * Record Web Vitals from client
   */
  recordWebVitals(vitals: WebVitals): void {
    this.webVitals.push(vitals)
    
    // Keep only recent vitals
    if (this.webVitals.length > this.maxMetrics) {
      this.webVitals = this.webVitals.slice(-this.maxMetrics)
    }
    
    // Log poor performance
    if (vitals.name === 'LCP' && vitals.value > 4000) {
      console.warn(`Poor LCP: ${vitals.value}ms for ${vitals.url}`)
    }
    
    if (vitals.name === 'FID' && vitals.value > 300) {
      console.warn(`Poor FID: ${vitals.value}ms for ${vitals.url}`)
    }
  }
  
  /**
   * Get performance statistics
   */
  getStats(): {
    apiMetrics: {
      averageResponseTime: number
      p95ResponseTime: number
      p99ResponseTime: number
      totalRequests: number
      errorRate: number
      cacheHitRate: number
    }
    webVitals: {
      averageLCP: number
      averageFID: number
      averageCLS: number
      averageFCP: number
    }
  } {
    const recentMetrics = this.metrics.slice(-100) // Last 100 requests
    const recentVitals = this.webVitals.slice(-100) // Last 100 vitals
    
    const responseTimes = recentMetrics.map(m => m.responseTime).sort((a, b) => a - b)
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length
    
    const lcpValues = recentVitals.filter(v => v.name === 'LCP').map(v => v.value)
    const fidValues = recentVitals.filter(v => v.name === 'FID').map(v => v.value)
    const clsValues = recentVitals.filter(v => v.name === 'CLS').map(v => v.value)
    const fcpValues = recentVitals.filter(v => v.name === 'FCP').map(v => v.value)
    
    return {
      apiMetrics: {
        averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
        p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
        p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
        totalRequests: recentMetrics.length,
        errorRate: (errorCount / recentMetrics.length) * 100 || 0,
        cacheHitRate: (cacheHits / recentMetrics.length) * 100 || 0
      },
      webVitals: {
        averageLCP: lcpValues.reduce((a, b) => a + b, 0) / lcpValues.length || 0,
        averageFID: fidValues.reduce((a, b) => a + b, 0) / fidValues.length || 0,
        averageCLS: clsValues.reduce((a, b) => a + b, 0) / clsValues.length || 0,
        averageFCP: fcpValues.reduce((a, b) => a + b, 0) / fcpValues.length || 0
      }
    }
  }
  
  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    return 'unknown'
  }
  
  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000)
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
    this.webVitals = this.webVitals.filter(v => v.timestamp > cutoff)
  }
}

/**
 * Performance monitoring middleware
 */
export function withPerformanceMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function(req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    const monitor = PerformanceMonitor.getInstance()
    
    try {
      const response = await handler(req)
      monitor.recordAPIMetrics(req, response, startTime)
      return response
    } catch (error) {
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
      monitor.recordAPIMetrics(req, errorResponse, startTime)
      throw error
    }
  }
}

/**
 * Web Vitals API endpoint handler
 */
export async function handleWebVitals(request: NextRequest): Promise<NextResponse> {
  try {
    const vitals = await request.json()
    const monitor = PerformanceMonitor.getInstance()
    monitor.recordWebVitals(vitals)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid Web Vitals data' },
      { status: 400 }
    )
  }
}

/**
 * Performance stats API endpoint handler
 */
export async function handlePerformanceStats(): Promise<NextResponse> {
  const monitor = PerformanceMonitor.getInstance()
  const stats = monitor.getStats()
  
  return NextResponse.json(stats)
}

export default PerformanceMonitor
