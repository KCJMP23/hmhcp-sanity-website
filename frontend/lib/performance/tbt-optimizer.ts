/**
 * Total Blocking Time (TBT) Optimizer
 * Aggressively reduces main thread blocking time
 */

// Micro-chunking for heavy operations
export function microChunk<T>(
  operation: () => T,
  chunkSize: number = 1,
  delay: number = 0
): Promise<T> {
  return new Promise((resolve) => {
    const startTime = performance.now()
    
    const processChunk = () => {
      const chunkStartTime = performance.now()
      
      try {
        const result = operation()
        
        // If operation took too long, yield to main thread
        if (performance.now() - chunkStartTime > 5) {
          setTimeout(() => resolve(result), delay)
        } else {
          resolve(result)
        }
      } catch (error) {
        console.error('Micro-chunk operation failed:', error)
        resolve(null as T)
      }
    }
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(processChunk, { timeout: 50 })
    } else {
      setTimeout(processChunk, delay)
    }
  })
}

// Defer heavy computations to Web Workers
export function createWebWorker(workerScript: string) {
  const blob = new Blob([workerScript], { type: 'application/javascript' })
  const workerUrl = URL.createObjectURL(blob)
  return new Worker(workerUrl)
}

// Heavy computation worker
const HEAVY_COMPUTATION_WORKER = `
self.onmessage = function(e) {
  const { type, data } = e.data
  
  switch (type) {
    case 'PROCESS_DATA':
      // Simulate heavy computation
      const result = data.map(item => ({
        ...item,
        processed: true,
        timestamp: Date.now()
      }))
      
      self.postMessage({ type: 'PROCESSED_DATA', result })
      break
      
    case 'CALCULATE_METRICS':
      // Simulate metrics calculation
      const metrics = {
        total: data.length,
        processed: data.filter(item => item.processed).length,
        timestamp: Date.now()
      }
      
      self.postMessage({ type: 'METRICS_CALCULATED', metrics })
      break
      
    default:
      self.postMessage({ type: 'ERROR', error: 'Unknown operation' })
  }
}
`

// Web Worker manager
class WebWorkerManager {
  private worker: Worker | null = null
  
  constructor() {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      this.worker = createWebWorker(HEAVY_COMPUTATION_WORKER)
    }
  }
  
  async processData<T>(data: T[]): Promise<T[]> {
    if (!this.worker) {
      // Fallback to micro-chunking if Web Workers not available
      return microChunk(() => data, 10, 10)
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout'))
      }, 5000)
      
      this.worker!.onmessage = (e) => {
        clearTimeout(timeout)
        if (e.data.type === 'PROCESSED_DATA') {
          resolve(e.data.result)
        } else if (e.data.type === 'ERROR') {
          reject(new Error(e.data.error))
        }
      }
      
      this.worker!.postMessage({ type: 'PROCESS_DATA', data })
    })
  }
  
  destroy() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}

// Singleton worker manager
let workerManager: WebWorkerManager | null = null

export function getWorkerManager(): WebWorkerManager {
  if (!workerManager) {
    workerManager = new WebWorkerManager()
  }
  return workerManager
}

// Defer non-critical JavaScript execution
export function deferJavaScriptExecution() {
  if (typeof window === 'undefined') return
  
  // Defer all non-critical scripts
  const scripts = document.querySelectorAll('script[data-defer]')
  scripts.forEach(script => {
    script.setAttribute('defer', '')
    script.removeAttribute('data-defer')
  })
  
  // Defer analytics and tracking scripts
  const analyticsScripts = document.querySelectorAll('script[src*="analytics"], script[src*="gtag"], script[src*="ga"]')
  analyticsScripts.forEach(script => {
    script.setAttribute('defer', '')
  })
  
  // Defer third-party widgets
  const widgetScripts = document.querySelectorAll('script[src*="widget"], script[src*="embed"]')
  widgetScripts.forEach(script => {
    script.setAttribute('defer', '')
  })
}

// Optimize event listeners to reduce main thread work
export function optimizeEventListeners() {
  if (typeof window === 'undefined') return
  
  // Use passive event listeners where possible
  const passiveEvents = ['scroll', 'touchstart', 'touchmove', 'wheel']
  
  passiveEvents.forEach(eventType => {
    document.addEventListener(eventType, () => {}, { passive: true })
  })
  
  // Debounce scroll events
  let scrollTimeout: NodeJS.Timeout
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      // Handle scroll events here
    }, 16) // ~60fps
  }, { passive: true })
  
  // Debounce resize events
  let resizeTimeout: NodeJS.Timeout
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      // Handle resize events here
    }, 250)
  }, { passive: true })
}

// Optimize DOM operations
export function optimizeDOMOperations() {
  if (typeof window === 'undefined') return
  
  // Use DocumentFragment for batch DOM operations
  const fragment = document.createDocumentFragment()
  
  // Batch DOM reads and writes
  const batchDOMOperations = (operations: (() => void)[]) => {
    // Read all properties first
    operations.forEach(op => {
      if (op.toString().includes('getBoundingClientRect') || 
          op.toString().includes('offsetWidth') || 
          op.toString().includes('offsetHeight')) {
        op()
      }
    })
    
    // Then perform all writes
    operations.forEach(op => {
      if (!op.toString().includes('getBoundingClientRect') && 
          !op.toString().includes('offsetWidth') && 
          !op.toString().includes('offsetHeight')) {
        op()
      }
    })
  }
  
  // Expose batch operations globally
  ;(window as any).batchDOMOperations = batchDOMOperations
}

// Reduce main thread work by splitting heavy operations
export function splitHeavyOperations() {
  if (typeof window === 'undefined') return
  
  // Split large data processing
  const processLargeDataset = <T>(data: T[], processor: (item: T) => T) => {
    const chunkSize = 100
    const chunks = []
    
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize))
    }
    
    let processedData: T[] = []
    let currentChunk = 0
    
    const processNextChunk = () => {
      if (currentChunk < chunks.length) {
        const chunk = chunks[currentChunk]
        const processedChunk = chunk.map(processor)
        processedData = processedData.concat(processedChunk)
        currentChunk++
        
        // Yield to main thread after each chunk
        setTimeout(processNextChunk, 0)
      }
    }
    
    processNextChunk()
    return processedData
  }
  
  // Expose globally
  ;(window as any).processLargeDataset = processLargeDataset
}

// Initialize TBT optimizations
export function initializeTBTOptimizations() {
  if (typeof window === 'undefined') return
  
  // Defer JavaScript execution
  deferJavaScriptExecution()
  
  // Optimize event listeners
  optimizeEventListeners()
  
  // Optimize DOM operations
  optimizeDOMOperations()
  
  // Split heavy operations
  splitHeavyOperations()
  
  // Clean up worker on page unload
  window.addEventListener('beforeunload', () => {
    if (workerManager) {
      workerManager.destroy()
    }
  })
}

// Monitor TBT and apply optimizations
export function monitorTBT() {
  if (typeof window === 'undefined') return
  
  let totalBlockingTime = 0
  
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    
    entries.forEach((entry: any) => {
      if (entry.entryType === 'longtask') {
        totalBlockingTime += entry.duration
        
        // If TBT is getting high, apply more aggressive optimizations
        if (totalBlockingTime > 2000) {
          console.warn('High TBT detected:', totalBlockingTime, 'ms - applying optimizations')
          applyTBTOptimizations()
        }
      }
    })
  })
  
  observer.observe({ entryTypes: ['longtask'] })
}

// Apply TBT optimizations
function applyTBTOptimizations() {
  // Defer more JavaScript
  const scripts = document.querySelectorAll('script:not([defer]):not([async])')
  scripts.forEach(script => {
    const scriptElement = script as HTMLScriptElement
    if (!scriptElement.src.includes('critical') && !scriptElement.src.includes('main')) {
      scriptElement.setAttribute('defer', '')
    }
  })
  
  // Reduce animation complexity
  const animatedElements = document.querySelectorAll('[style*="animation"], [style*="transition"]')
  animatedElements.forEach(element => {
    const style = (element as HTMLElement).style
    style.animationDuration = '0.1s'
    style.transitionDuration = '0.1s'
  })
  
  // Defer non-critical images
  const images = document.querySelectorAll('img[data-defer]')
  images.forEach(img => {
    img.setAttribute('loading', 'lazy')
  })
}
