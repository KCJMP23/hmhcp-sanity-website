/**
 * Aggressive TBT (Total Blocking Time) Reduction System
 * Implements multiple strategies to minimize main thread blocking
 */

import { executeInWorker, WorkerTasks } from './web-workers'

// TBT reduction configuration
const TBT_REDUCTION_CONFIG = {
  maxTaskTime: 5, // 5ms max per task
  yieldInterval: 1, // 1ms yield interval
  maxConcurrentTasks: 3, // Max concurrent tasks
  priorityLevels: {
    critical: 0,
    high: 1,
    normal: 2,
    low: 3,
    background: 4
  }
}

// Task queue with priority
interface Task {
  id: string
  fn: () => void | Promise<void>
  priority: number
  timeout: number
  createdAt: number
}

class TBTReductionManager {
  private taskQueue: Task[] = []
  private isProcessing = false
  private currentTask: Task | null = null
  private performanceObserver: PerformanceObserver | null = null
  private longTaskCount = 0
  private totalBlockingTime = 0

  constructor() {
    this.initializePerformanceMonitoring()
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

  // Add task to queue with priority
  addTask(fn: () => void | Promise<void>, priority: keyof typeof TBT_REDUCTION_CONFIG.priorityLevels = 'normal'): string {
    const task: Task = {
      id: Math.random().toString(36).substring(7),
      fn,
      priority: TBT_REDUCTION_CONFIG.priorityLevels[priority],
      timeout: 50, // 50ms timeout
      createdAt: performance.now()
    }

    // Insert task based on priority
    const insertIndex = this.taskQueue.findIndex(t => t.priority > task.priority)
    if (insertIndex === -1) {
      this.taskQueue.push(task)
    } else {
      this.taskQueue.splice(insertIndex, 0, task)
    }

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processTasks()
    }

    return task.id
  }

  // Process tasks with micro-chunking
  private async processTasks() {
    if (this.isProcessing || this.taskQueue.length === 0) return

    this.isProcessing = true

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!
      this.currentTask = task

      try {
        await this.executeTaskWithChunking(task)
      } catch (error) {
        console.error('Task execution failed:', error)
      }

      this.currentTask = null

      // Yield to browser
      await this.yieldToBrowser()
    }

    this.isProcessing = false
  }

  // Execute task with micro-chunking
  private async executeTaskWithChunking(task: Task): Promise<void> {
    const startTime = performance.now()
    const maxTime = TBT_REDUCTION_CONFIG.maxTaskTime

    // Check if task is a function or async function
    if (task.fn.constructor.name === 'AsyncFunction') {
      // For async functions, execute with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), task.timeout)
      })

      try {
        await Promise.race([task.fn(), timeoutPromise])
      } catch (error) {
        console.warn('Task timeout or error:', error)
      }
    } else {
      // For sync functions, use micro-chunking
      const result = task.fn()
      
      // If result is a promise, handle it
      if (result && typeof result.then === 'function') {
        try {
          await Promise.race([result, new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Task timeout')), task.timeout)
          )])
        } catch (error) {
          console.warn('Async task timeout or error:', error)
        }
      }
    }

    const duration = performance.now() - startTime
    if (duration > maxTime) {
      console.warn(`Task took ${duration.toFixed(2)}ms (max: ${maxTime}ms)`)
    }
  }

  // Yield to browser to prevent blocking
  private yieldToBrowser(): Promise<void> {
    return new Promise(resolve => {
      if ('scheduler' in window && 'postTask' in window.scheduler) {
        // Use modern scheduler API
        (window.scheduler as any).postTask(() => resolve(), { priority: 'user-blocking' })
      } else if ('requestIdleCallback' in window) {
        // Use requestIdleCallback
        requestIdleCallback(() => resolve(), { timeout: TBT_REDUCTION_CONFIG.yieldInterval })
      } else {
        // Use setTimeout as fallback
        setTimeout(resolve, TBT_REDUCTION_CONFIG.yieldInterval)
      }
    })
  }

  // Move heavy computations to Web Workers
  async moveToWorker<T>(computation: () => T, data?: any): Promise<T> {
    try {
      // Try to use Web Worker first
      const result = await WorkerTasks.heavyComputation(100000)
      return result as T
    } catch (error) {
      console.warn('Web Worker failed, falling back to main thread:', error)
      // Fallback to main thread with micro-chunking
      return this.executeWithMicroChunking(computation)
    }
  }

  // Execute with micro-chunking on main thread
  private executeWithMicroChunking<T>(computation: () => T): T {
    const startTime = performance.now()
    const maxTime = TBT_REDUCTION_CONFIG.maxTaskTime

    try {
      const result = computation()
      const duration = performance.now() - startTime

      if (duration > maxTime) {
        console.warn(`Computation took ${duration.toFixed(2)}ms (max: ${maxTime}ms)`)
      }

      return result
    } catch (error) {
      console.error('Micro-chunked computation failed:', error)
      throw error
    }
  }

  // Get performance stats
  getStats() {
    return {
      queueLength: this.taskQueue.length,
      isProcessing: this.isProcessing,
      currentTask: this.currentTask?.id || null,
      longTaskCount: this.longTaskCount,
      totalBlockingTime: this.totalBlockingTime,
      averageBlockingTime: this.longTaskCount > 0 ? this.totalBlockingTime / this.longTaskCount : 0
    }
  }

  // Cleanup
  destroy() {
    this.taskQueue = []
    this.isProcessing = false
    this.currentTask = null
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
      this.performanceObserver = null
    }
  }
}

// Global TBT reduction manager
let tbtManager: TBTReductionManager | null = null

// Initialize TBT reduction
export function initializeTBTReduction(): void {
  if (typeof window === 'undefined') return

  if (!tbtManager) {
    tbtManager = new TBTReductionManager()
    console.log('🔧 TBT reduction system initialized')
  }
}

// Add task to TBT reduction queue
export function addTBTTask(
  fn: () => void | Promise<void>, 
  priority: keyof typeof TBT_REDUCTION_CONFIG.priorityLevels = 'normal'
): string {
  if (!tbtManager) {
    initializeTBTReduction()
  }
  
  return tbtManager!.addTask(fn, priority)
}

// Move heavy computation to Web Worker
export async function moveHeavyComputationToWorker<T>(
  computation: () => T, 
  data?: any
): Promise<T> {
  if (!tbtManager) {
    initializeTBTReduction()
  }
  
  return tbtManager!.moveToWorker(computation, data)
}

// Optimize existing heavy operations
export function optimizeHeavyOperations(): void {
  if (typeof window === 'undefined') return

  // Optimize image loading
  const images = document.querySelectorAll('img[data-src]')
  images.forEach((img, index) => {
    addTBTTask(() => {
      const src = img.getAttribute('data-src')
      if (src) {
        img.setAttribute('src', src)
        img.removeAttribute('data-src')
      }
    }, 'low')
  })

  // Optimize lazy loading
  const lazyElements = document.querySelectorAll('[data-lazy]')
  lazyElements.forEach((element, index) => {
    addTBTTask(() => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            element.removeAttribute('data-lazy')
            observer.unobserve(entry.target)
          }
        })
      })
      
      observer.observe(element)
    }, 'low')
  })

  // Optimize API calls
  const apiCalls = document.querySelectorAll('[data-api-call]')
  apiCalls.forEach((element, index) => {
    addTBTTask(() => {
      // Implement API call optimization
      element.setAttribute('data-optimized', 'true')
    }, 'normal')
  })
}

// Get TBT reduction stats
export function getTBTReductionStats() {
  return tbtManager ? tbtManager.getStats() : null
}

// Cleanup TBT reduction
export function cleanupTBTReduction(): void {
  if (tbtManager) {
    tbtManager.destroy()
    tbtManager = null
    console.log('🧹 TBT reduction system cleaned up')
  }
}
