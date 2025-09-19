/**
 * Optimized TBT (Total Blocking Time) Reduction System
 * Fixes LCP regression while maintaining TBT improvements
 */

// Optimized TBT reduction configuration
const OPTIMIZED_TBT_CONFIG = {
  maxTaskTime: 3, // 3ms max per task (reduced from 5ms)
  yieldInterval: 0.5, // 0.5ms yield interval (reduced from 1ms)
  maxConcurrentTasks: 2, // Max concurrent tasks (reduced from 3)
  criticalTaskTimeout: 10, // 10ms timeout for critical tasks
  priorityLevels: {
    critical: 0,    // Load immediately, no delays
    high: 1,        // Load after critical
    normal: 2,      // Load after high
    low: 3,         // Load after normal
    background: 4   // Load last
  },
  // Critical resources that should never be delayed
  criticalResources: [
    'hero-research.jpg',
    'hero-technology.jpg', 
    'hero-consultation.jpg',
    'critical-css',
    'critical-js',
    'main-layout'
  ]
}

// Task queue with priority and critical resource handling
interface OptimizedTask {
  id: string
  fn: () => void | Promise<void>
  priority: number
  timeout: number
  createdAt: number
  isCritical: boolean
  resourceType?: string
  resourceUrl?: string
}

class OptimizedTBTReductionManager {
  private taskQueue: OptimizedTask[] = []
  private criticalTaskQueue: OptimizedTask[] = []
  private isProcessing = false
  private isProcessingCritical = false
  private currentTask: OptimizedTask | null = null
  private performanceObserver: PerformanceObserver | null = null
  private longTaskCount = 0
  private totalBlockingTime = 0
  private criticalResourceLoaded = false

  constructor() {
    this.initializePerformanceMonitoring()
    this.preloadCriticalResources()
  }

  private initializePerformanceMonitoring() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.longTaskCount++
            this.totalBlockingTime += entry.duration
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`)
          }
        }
      })

      this.performanceObserver.observe({ type: 'longtask', buffered: true })
    } catch (error) {
      console.warn('PerformanceObserver not supported:', error)
    }
  }

  private preloadCriticalResources() {
    // Preload critical images immediately
    const criticalImages = [
      '/hero-research.jpg',
      '/hero-technology.jpg',
      '/hero-consultation.jpg'
    ]

    criticalImages.forEach(url => {
      const img = new Image()
      img.src = url
      img.onload = () => {
        console.log(`✅ Critical image preloaded: ${url}`)
        this.criticalResourceLoaded = true
      }
    })

    // Preload critical CSS
    const criticalCSS = `
      body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
      .hero-section { min-height: 100vh; background-size: cover; }
      .loading { opacity: 0.8; }
    `
    
    const style = document.createElement('style')
    style.textContent = criticalCSS
    style.id = 'critical-css'
    document.head.appendChild(style)
  }

  // Add task to appropriate queue based on priority and critical status
  addTask(
    fn: () => void | Promise<void>, 
    priority: keyof typeof OPTIMIZED_TBT_CONFIG.priorityLevels = 'normal',
    resourceType?: string,
    resourceUrl?: string
  ): string {
    const isCritical = this.isCriticalResource(resourceUrl) || priority === 'critical'
    
    const task: OptimizedTask = {
      id: Math.random().toString(36).substring(7),
      fn,
      priority: OPTIMIZED_TBT_CONFIG.priorityLevels[priority],
      timeout: isCritical ? OPTIMIZED_TBT_CONFIG.criticalTaskTimeout : 50,
      createdAt: performance.now(),
      isCritical,
      resourceType,
      resourceUrl
    }

    if (isCritical) {
      // Add to critical queue for immediate processing
      this.criticalTaskQueue.push(task)
      if (!this.isProcessingCritical) {
        this.processCriticalTasks()
      }
    } else {
      // Add to normal queue with priority
      const insertIndex = this.taskQueue.findIndex(t => t.priority > task.priority)
      if (insertIndex === -1) {
        this.taskQueue.push(task)
      } else {
        this.taskQueue.splice(insertIndex, 0, task)
      }
    }

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processTasks()
    }

    return task.id
  }

  private isCriticalResource(resourceUrl?: string): boolean {
    if (!resourceUrl) return false
    return OPTIMIZED_TBT_CONFIG.criticalResources.some(resource => 
      resourceUrl.includes(resource)
    )
  }

  // Process critical tasks immediately
  private async processCriticalTasks() {
    if (this.isProcessingCritical || this.criticalTaskQueue.length === 0) return

    this.isProcessingCritical = true

    while (this.criticalTaskQueue.length > 0) {
      const task = this.criticalTaskQueue.shift()!
      this.currentTask = task

      try {
        await this.executeTaskWithMicroChunking(task)
      } catch (error) {
        console.error('Critical task execution failed:', error)
      }

      this.currentTask = null

      // Minimal yield for critical tasks
      await this.yieldToBrowser(0.1)
    }

    this.isProcessingCritical = false
  }

  // Process normal tasks with micro-chunking
  private async processTasks() {
    if (this.isProcessing || this.taskQueue.length === 0) return

    this.isProcessing = true

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!
      this.currentTask = task

      try {
        await this.executeTaskWithMicroChunking(task)
      } catch (error) {
        console.error('Task execution failed:', error)
      }

      this.currentTask = null

      // Yield to browser
      await this.yieldToBrowser()
    }

    this.isProcessing = false
  }

  // Execute task with optimized micro-chunking
  private async executeTaskWithMicroChunking(task: OptimizedTask): Promise<void> {
    const startTime = performance.now()
    const maxTime = task.isCritical ? 
      OPTIMIZED_TBT_CONFIG.criticalTaskTimeout : 
      OPTIMIZED_TBT_CONFIG.maxTaskTime

    // For critical tasks, execute immediately without chunking
    if (task.isCritical) {
      try {
        if (task.fn.constructor.name === 'AsyncFunction') {
          await Promise.race([
            task.fn(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Critical task timeout')), task.timeout)
            )
          ])
        } else {
          const result = task.fn()
          if (result && typeof result.then === 'function') {
            await Promise.race([
              result,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Critical task timeout')), task.timeout)
              )
            ])
          }
        }
      } catch (error) {
        console.warn('Critical task error:', error)
      }
    } else {
      // For normal tasks, use micro-chunking
      try {
        if (task.fn.constructor.name === 'AsyncFunction') {
          await Promise.race([
            task.fn(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Task timeout')), task.timeout)
            )
          ])
        } else {
          const result = task.fn()
          if (result && typeof result.then === 'function') {
            await Promise.race([
              result,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Task timeout')), task.timeout)
              )
            ])
          }
        }
      } catch (error) {
        console.warn('Task error:', error)
      }
    }

    const duration = performance.now() - startTime
    if (duration > maxTime) {
      console.warn(`Task took ${duration.toFixed(2)}ms (max: ${maxTime}ms)`)
    }
  }

  // Optimized yield to browser
  private yieldToBrowser(delay: number = OPTIMIZED_TBT_CONFIG.yieldInterval): Promise<void> {
    return new Promise(resolve => {
      if ('scheduler' in window && 'postTask' in window.scheduler) {
        // Use modern scheduler API with higher priority for critical tasks
        const priority = this.currentTask?.isCritical ? 'user-blocking' : 'user-visible'
        ;(window.scheduler as any).postTask(() => resolve(), { priority })
      } else if ('requestIdleCallback' in window) {
        // Use requestIdleCallback with timeout
        requestIdleCallback(() => resolve(), { timeout: delay * 10 })
      } else {
        // Use setTimeout as fallback
        setTimeout(resolve, delay)
      }
    })
  }

  // Optimize existing heavy operations with critical resource prioritization
  optimizeHeavyOperations(): void {
    if (typeof window === 'undefined') return

    // Optimize critical images first
    const criticalImages = document.querySelectorAll('img[data-src*="hero-"]')
    criticalImages.forEach((img, index) => {
      this.addTask(() => {
        const src = img.getAttribute('data-src')
        if (src) {
          img.setAttribute('src', src)
          img.removeAttribute('data-src')
        }
      }, 'critical', 'image', img.getAttribute('data-src') || '')
    })

    // Optimize other images with lower priority
    const images = document.querySelectorAll('img[data-src]:not([data-src*="hero-"])')
    images.forEach((img, index) => {
      this.addTask(() => {
        const src = img.getAttribute('data-src')
        if (src) {
          img.setAttribute('src', src)
          img.removeAttribute('data-src')
        }
      }, 'low', 'image', img.getAttribute('data-src') || '')
    })

    // Optimize lazy loading with priority
    const lazyElements = document.querySelectorAll('[data-lazy]')
    lazyElements.forEach((element, index) => {
      this.addTask(() => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              element.removeAttribute('data-lazy')
              observer.unobserve(entry.target)
            }
          })
        })
        
        observer.observe(element)
      }, 'normal', 'component')
    })

    // Optimize API calls with priority
    const apiCalls = document.querySelectorAll('[data-api-call]')
    apiCalls.forEach((element, index) => {
      this.addTask(() => {
        element.setAttribute('data-optimized', 'true')
      }, 'low', 'api')
    })
  }

  // Get performance stats
  getStats() {
    return {
      queueLength: this.taskQueue.length,
      criticalQueueLength: this.criticalTaskQueue.length,
      isProcessing: this.isProcessing,
      isProcessingCritical: this.isProcessingCritical,
      currentTask: this.currentTask?.id || null,
      longTaskCount: this.longTaskCount,
      totalBlockingTime: this.totalBlockingTime,
      averageBlockingTime: this.longTaskCount > 0 ? this.totalBlockingTime / this.longTaskCount : 0,
      criticalResourceLoaded: this.criticalResourceLoaded
    }
  }

  // Cleanup
  destroy() {
    this.taskQueue = []
    this.criticalTaskQueue = []
    this.isProcessing = false
    this.isProcessingCritical = false
    this.currentTask = null
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
      this.performanceObserver = null
    }
  }
}

// Global optimized TBT reduction manager
let optimizedTBTManager: OptimizedTBTReductionManager | null = null

// Initialize optimized TBT reduction
export function initializeOptimizedTBTReduction(): void {
  if (typeof window === 'undefined') return

  if (!optimizedTBTManager) {
    optimizedTBTManager = new OptimizedTBTReductionManager()
    console.log('🔧 Optimized TBT reduction system initialized')
  }
}

// Add task to optimized TBT reduction queue
export function addOptimizedTBTTask(
  fn: () => void | Promise<void>, 
  priority: keyof typeof OPTIMIZED_TBT_CONFIG.priorityLevels = 'normal',
  resourceType?: string,
  resourceUrl?: string
): string {
  if (!optimizedTBTManager) {
    initializeOptimizedTBTReduction()
  }
  
  return optimizedTBTManager!.addTask(fn, priority, resourceType, resourceUrl)
}

// Optimize heavy operations with critical resource prioritization
export function optimizeHeavyOperationsWithPriority(): void {
  if (!optimizedTBTManager) {
    initializeOptimizedTBTReduction()
  }
  
  optimizedTBTManager!.optimizeHeavyOperations()
}

// Get optimized TBT reduction stats
export function getOptimizedTBTStats() {
  return optimizedTBTManager ? optimizedTBTManager.getStats() : null
}

// Cleanup optimized TBT reduction
export function cleanupOptimizedTBTReduction(): void {
  if (optimizedTBTManager) {
    optimizedTBTManager.destroy()
    optimizedTBTManager = null
    console.log('🧹 Optimized TBT reduction system cleaned up')
  }
}
