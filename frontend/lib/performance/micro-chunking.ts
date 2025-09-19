/**
 * Micro-Chunking System
 * Breaks down long tasks into smaller chunks to reduce TBT
 */

// Micro-chunking configuration
const MICRO_CHUNK_CONFIG = {
  maxChunkTime: 5, // 5ms max per chunk
  yieldTime: 1, // 1ms yield time
  maxQueueSize: 100, // Max tasks in queue
}

// Task queue for micro-chunking
let taskQueue: Array<() => void> = []
let isProcessing = false

// Process tasks in micro-chunks
function processMicroChunks() {
  if (isProcessing || taskQueue.length === 0) return
  
  isProcessing = true
  const startTime = performance.now()
  
  while (taskQueue.length > 0 && (performance.now() - startTime) < MICRO_CHUNK_CONFIG.maxChunkTime) {
    const task = taskQueue.shift()
    if (task) {
      try {
        task()
      } catch (error) {
        console.error('Micro-chunk task error:', error)
      }
    }
  }
  
  isProcessing = false
  
  // Schedule next chunk if there are more tasks
  if (taskQueue.length > 0) {
    if ('scheduler' in window && 'postTask' in window.scheduler) {
      // Use modern scheduler API if available
      (window.scheduler as any).postTask(processMicroChunks, { priority: 'user-blocking' })
    } else if ('requestIdleCallback' in window) {
      // Use requestIdleCallback as fallback
      requestIdleCallback(processMicroChunks, { timeout: MICRO_CHUNK_CONFIG.yieldTime })
    } else {
      // Use setTimeout as last resort
      setTimeout(processMicroChunks, MICRO_CHUNK_CONFIG.yieldTime)
    }
  }
}

// Add task to micro-chunk queue
export function addMicroTask(task: () => void): void {
  if (taskQueue.length >= MICRO_CHUNK_CONFIG.maxQueueSize) {
    console.warn('Micro-chunk queue full, dropping task')
    return
  }
  
  taskQueue.push(task)
  
  // Start processing if not already running
  if (!isProcessing) {
    processMicroChunks()
  }
}

// Break down heavy computation into micro-chunks
export function microChunkHeavyComputation<T>(
  data: T[],
  processor: (item: T, index: number) => void,
  chunkSize: number = 10
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0
    
    function processChunk() {
      const startTime = performance.now()
      
      while (index < data.length && (performance.now() - startTime) < MICRO_CHUNK_CONFIG.maxChunkTime) {
        const endIndex = Math.min(index + chunkSize, data.length)
        
        for (let i = index; i < endIndex; i++) {
          processor(data[i], i)
        }
        
        index = endIndex
      }
      
      if (index < data.length) {
        // More data to process, schedule next chunk
        addMicroTask(processChunk)
      } else {
        // All data processed
        resolve()
      }
    }
    
    processChunk()
  })
}

// Optimize React component rendering
export function optimizeReactRendering(component: React.ComponentType<any>) {
  return React.memo(component, (prevProps, nextProps) => {
    // Custom comparison logic
    return JSON.stringify(prevProps) === JSON.stringify(nextProps)
  })
}

// Lazy load components with micro-chunking
export function lazyLoadWithMicroChunking<T>(
  importFn: () => Promise<T>,
  fallback?: React.ReactNode
): React.LazyExoticComponent<T> {
  return React.lazy(() => {
    return new Promise((resolve) => {
      addMicroTask(() => {
        importFn().then(resolve).catch(console.error)
      })
    })
  })
}

// Optimize API calls with micro-chunking
export function microChunkApiCall<T>(
  apiCall: () => Promise<T>,
  priority: 'high' | 'normal' | 'low' = 'normal'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const task = () => {
      apiCall()
        .then(resolve)
        .catch(reject)
    }
    
    if (priority === 'high') {
      // High priority tasks go to front of queue
      taskQueue.unshift(task)
    } else {
      addMicroTask(task)
    }
  })
}

// Initialize micro-chunking system
export function initializeMicroChunking(): void {
  if (typeof window === 'undefined') return
  
  console.log('🔧 Initializing micro-chunking system...')
  
  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          console.warn(`Long task detected: ${entry.duration}ms`)
        }
      }
    })
    
    observer.observe({ type: 'longtask', buffered: true })
  }
  
  // Optimize existing heavy operations
  optimizeExistingOperations()
}

// Optimize existing heavy operations
function optimizeExistingOperations(): void {
  // Optimize image loading
  const images = document.querySelectorAll('img[data-src]')
  images.forEach((img, index) => {
    addMicroTask(() => {
      const src = img.getAttribute('data-src')
      if (src) {
        img.setAttribute('src', src)
        img.removeAttribute('data-src')
      }
    })
  })
  
  // Optimize lazy loading
  const lazyElements = document.querySelectorAll('[data-lazy]')
  lazyElements.forEach((element, index) => {
    addMicroTask(() => {
      // Implement lazy loading logic
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Load content
            element.removeAttribute('data-lazy')
            observer.unobserve(entry.target)
          }
        })
      })
      
      observer.observe(element)
    })
  })
}

// Export for debugging
export function getMicroChunkStats() {
  return {
    queueLength: taskQueue.length,
    isProcessing,
    maxChunkTime: MICRO_CHUNK_CONFIG.maxChunkTime,
    yieldTime: MICRO_CHUNK_CONFIG.yieldTime
  }
}
