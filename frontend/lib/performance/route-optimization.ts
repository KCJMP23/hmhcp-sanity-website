/**
 * Route optimization utilities for performance monitoring
 */

export interface BundleAnalysis {
  totalSize: number
  chunkSizes: Record<string, number>
  recommendations: string[]
}

export interface PerformanceBudget {
  maxBundleSize: number
  maxChunkSize: number
  maxRouteLoadTime: number
  maxImageSize: number
}

const DEFAULT_BUDGET: PerformanceBudget = {
  maxBundleSize: 500 * 1024, // 500KB
  maxChunkSize: 100 * 1024,  // 100KB
  maxRouteLoadTime: 3000,    // 3 seconds
  maxImageSize: 200 * 1024   // 200KB
}

class RoutePreloadManager {
  private preloadedRoutes = new Set<string>()
  private prefetchedRoutes = new Set<string>()

  preloadRoute(path: string): void {
    if (this.preloadedRoutes.has(path) || typeof window === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'script'
    link.href = `/_next/static/chunks/pages${path}.js`
    document.head.appendChild(link)
    
    this.preloadedRoutes.add(path)
  }

  prefetchRoute(path: string): void {
    if (this.prefetchedRoutes.has(path) || typeof window === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = `/_next/static/chunks/pages${path}.js`
    document.head.appendChild(link)
    
    this.prefetchedRoutes.add(path)
  }

  getPreloadedRoutes(): string[] {
    return Array.from(this.preloadedRoutes)
  }

  clearPreloads(): void {
    this.preloadedRoutes.clear()
    this.prefetchedRoutes.clear()
  }

  getStats(): { preloadedCount: number; prefetchedCount: number; preloadedRoutes: string[] } {
    return {
      preloadedCount: this.preloadedRoutes.size,
      prefetchedCount: this.prefetchedRoutes.size,
      preloadedRoutes: Array.from(this.preloadedRoutes)
    }
  }
}

export const routePreloadManager = new RoutePreloadManager()

export function analyzeBundleSize(): BundleAnalysis {
  if (typeof window === 'undefined') {
    return {
      totalSize: 0,
      chunkSizes: {},
      recommendations: ['Bundle analysis only available in browser']
    }
  }

  // Simulate bundle analysis (in real implementation, this would parse webpack stats)
  const mockChunkSizes = {
    'main': 150 * 1024,
    'vendor': 200 * 1024,
    'commons': 80 * 1024,
    'runtime': 10 * 1024
  }

  const totalSize = Object.values(mockChunkSizes).reduce((sum, size) => sum + size, 0)
  const recommendations: string[] = []

  if (totalSize > DEFAULT_BUDGET.maxBundleSize) {
    recommendations.push('Total bundle size exceeds budget')
  }

  Object.entries(mockChunkSizes).forEach(([chunk, size]) => {
    if (size > DEFAULT_BUDGET.maxChunkSize) {
      recommendations.push(`Chunk '${chunk}' exceeds size budget`)
    }
  })

  if (recommendations.length === 0) {
    recommendations.push('Bundle size within acceptable limits')
  }

  return {
    totalSize,
    chunkSizes: mockChunkSizes,
    recommendations
  }
}

export function checkPerformanceBudget(budget: Partial<PerformanceBudget> = {}): {
  passed: boolean
  violations: string[]
  metrics: Record<string, any>
} {
  const fullBudget = { ...DEFAULT_BUDGET, ...budget }
  const violations: string[] = []
  const metrics: Record<string, any> = {}

  if (typeof window === 'undefined') {
    return { passed: true, violations: [], metrics: {} }
  }

  // Check bundle size
  const bundleAnalysis = analyzeBundleSize()
  metrics.bundleSize = bundleAnalysis.totalSize

  if (bundleAnalysis.totalSize > fullBudget.maxBundleSize) {
    violations.push(`Bundle size (${bundleAnalysis.totalSize} bytes) exceeds budget (${fullBudget.maxBundleSize} bytes)`)
  }

  // Check load time using modern Performance API
  const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  if (navigationEntries.length > 0) {
    const navigation = navigationEntries[0]
    const loadTime = navigation.loadEventEnd - navigation.startTime
    metrics.loadTime = loadTime

    if (loadTime > fullBudget.maxRouteLoadTime) {
      violations.push(`Load time (${loadTime}ms) exceeds budget (${fullBudget.maxRouteLoadTime}ms)`)
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    metrics
  }
}