/**
 * Memory optimization utilities for performance monitoring
 */

export interface PerformanceStats {
  memory: {
    used: number
    total: number
    percentage: number
  }
  timing: {
    navigation: number
    domComplete: number
    loadComplete: number
  }
  metrics: {
    fps: number
    paint: number
    layout: number
  }
  connections: {
    active: number
    total: number
    type: string
  }
}

export function getPerformanceStats(): PerformanceStats {
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return {
      memory: { used: 0, total: 0, percentage: 0 },
      timing: { navigation: 0, domComplete: 0, loadComplete: 0 },
      metrics: { fps: 0, paint: 0, layout: 0 },
      connections: { active: 0, total: 0, type: 'unknown' }
    }
  }

  const memory = (performance as any).memory || { usedJSHeapSize: 0, totalJSHeapSize: 0 }
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  const connection = (navigator as any).connection || {}
  
  return {
    memory: {
      used: memory.usedJSHeapSize || 0,
      total: memory.totalJSHeapSize || 0,
      percentage: memory.totalJSHeapSize ? 
        Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100) : 0
    },
    timing: {
      navigation: navigation?.loadEventEnd - navigation?.startTime || 0,
      domComplete: navigation?.domComplete - navigation?.startTime || 0,
      loadComplete: navigation?.loadEventEnd - navigation?.startTime || 0
    },
    metrics: {
      fps: 60, // Placeholder - would need frame counting for real FPS
      paint: navigation?.responseStart - navigation?.startTime || 0,
      layout: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0
    },
    connections: {
      active: 1, // Placeholder - current connection
      total: 1,  // Placeholder - total connections
      type: connection.effectiveType || connection.type || 'unknown'
    }
  }
}

export function optimizeMemoryUsage(): void {
  if (typeof window === 'undefined') return

  // Clear any lingering timeouts/intervals
  // Note: In a real implementation, you'd track timeouts/intervals to clear them
  // This is a placeholder for timeout cleanup

  // Suggest garbage collection if available
  if ((window as any).gc) {
    (window as any).gc()
  }
}

export function monitorMemoryLeaks(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return

  let lastMemoryUsage = 0
  
  setInterval(() => {
    const stats = getPerformanceStats()
    const currentUsage = stats.memory.used
    
    if (currentUsage > lastMemoryUsage * 1.5) {
      console.warn('Potential memory leak detected:', {
        previous: lastMemoryUsage,
        current: currentUsage,
        increase: currentUsage - lastMemoryUsage
      })
    }
    
    lastMemoryUsage = currentUsage
  }, 10000) // Check every 10 seconds
}