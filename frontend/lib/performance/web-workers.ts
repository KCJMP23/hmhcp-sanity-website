/**
 * Web Workers System
 * Offloads heavy computations to Web Workers to reduce TBT
 */

// Web Worker pool for managing multiple workers
class WorkerPool {
  private workers: Worker[] = []
  private availableWorkers: Worker[] = []
  private taskQueue: Array<{ task: any, resolve: Function, reject: Function }> = []
  private maxWorkers: number

  constructor(maxWorkers: number = navigator.hardwareConcurrency || 4) {
    this.maxWorkers = maxWorkers
    this.initializeWorkers()
  }

  private initializeWorkers() {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker()
    }
  }

  private createWorker() {
    const workerCode = `
      // Web Worker for heavy computations
      self.onmessage = function(e) {
        const { type, data, taskId } = e.data
        
        try {
          let result
          
          switch (type) {
            case 'heavy-computation':
              result = performHeavyComputation(data)
              break
            case 'data-processing':
              result = processData(data)
              break
            case 'image-processing':
              result = processImage(data)
              break
            case 'sorting':
              result = performSorting(data)
              break
            case 'filtering':
              result = performFiltering(data)
              break
            default:
              throw new Error('Unknown task type: ' + type)
          }
          
          self.postMessage({
            taskId,
            result,
            success: true
          })
        } catch (error) {
          self.postMessage({
            taskId,
            error: error.message,
            success: false
          })
        }
      }
      
      function performHeavyComputation(data) {
        // Simulate heavy computation
        let result = 0
        for (let i = 0; i < data.iterations || 1000000; i++) {
          result += Math.sqrt(i) * Math.sin(i) * Math.cos(i)
        }
        return result
      }
      
      function processData(data) {
        // Process large datasets
        if (Array.isArray(data)) {
          return data.map(item => ({
            ...item,
            processed: true,
            timestamp: Date.now()
          }))
        }
        return data
      }
      
      function processImage(data) {
        // Simulate image processing
        return {
          processed: true,
          size: data.size || 0,
          format: data.format || 'unknown'
        }
      }
      
      function performSorting(data) {
        if (Array.isArray(data)) {
          return data.sort((a, b) => {
            if (typeof a === 'object' && typeof b === 'object') {
              return (a.value || 0) - (b.value || 0)
            }
            return a - b
          })
        }
        return data
      }
      
      function performFiltering(data) {
        if (Array.isArray(data)) {
          return data.filter(item => {
            if (typeof item === 'object') {
              return item.active !== false
            }
            return Boolean(item)
          })
        }
        return data
      }
    `

    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const worker = new Worker(URL.createObjectURL(blob))
    
    worker.onmessage = (e) => {
      const { taskId, result, error, success } = e.data
      this.handleWorkerMessage(taskId, result, error, success)
    }
    
    worker.onerror = (error) => {
      console.error('Web Worker error:', error)
    }
    
    this.workers.push(worker)
    this.availableWorkers.push(worker)
  }

  private handleWorkerMessage(taskId: string, result: any, error: any, success: boolean) {
    const taskIndex = this.taskQueue.findIndex(task => task.taskId === taskId)
    if (taskIndex === -1) return

    const task = this.taskQueue[taskIndex]
    this.taskQueue.splice(taskIndex, 1)
    
    // Return worker to available pool
    const worker = this.workers.find(w => w.taskId === taskId)
    if (worker) {
      worker.taskId = null
      this.availableWorkers.push(worker)
    }
    
    if (success) {
      task.resolve(result)
    } else {
      task.reject(new Error(error))
    }
    
    // Process next task in queue
    this.processNextTask()
  }

  private processNextTask() {
    if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) return
    
    const task = this.taskQueue.shift()!
    const worker = this.availableWorkers.shift()!
    
    const taskId = Math.random().toString(36).substring(7)
    worker.taskId = taskId
    
    worker.postMessage({
      ...task.task,
      taskId
    })
  }

  executeTask(task: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject })
      this.processNextTask()
    })
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate())
    this.workers = []
    this.availableWorkers = []
    this.taskQueue = []
  }
}

// Global worker pool instance
let workerPool: WorkerPool | null = null

// Initialize Web Workers
export function initializeWebWorkers(): void {
  if (typeof window === 'undefined' || !window.Worker) {
    console.warn('Web Workers not supported, falling back to main thread')
    return
  }
  
  if (!workerPool) {
    workerPool = new WorkerPool()
    console.log('🔧 Web Workers initialized')
  }
}

// Execute heavy computation in Web Worker
export function executeInWorker(type: string, data: any): Promise<any> {
  if (!workerPool) {
    // Fallback to main thread
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ fallback: true, type, data })
      }, 0)
    })
  }
  
  return workerPool.executeTask({ type, data })
}

// Heavy computation tasks
export const WorkerTasks = {
  // Heavy mathematical computations
  heavyComputation: (iterations: number = 1000000) => 
    executeInWorker('heavy-computation', { iterations }),
  
  // Data processing
  processData: (data: any[]) => 
    executeInWorker('data-processing', data),
  
  // Image processing
  processImage: (imageData: any) => 
    executeInWorker('image-processing', imageData),
  
  // Sorting large arrays
  sortData: (data: any[]) => 
    executeInWorker('sorting', data),
  
  // Filtering large datasets
  filterData: (data: any[]) => 
    executeInWorker('filtering', data)
}

// Cleanup Web Workers
export function cleanupWebWorkers(): void {
  if (workerPool) {
    workerPool.terminate()
    workerPool = null
    console.log('🧹 Web Workers cleaned up')
  }
}

// Monitor Web Worker performance
export function monitorWorkerPerformance(): void {
  if (typeof window === 'undefined') return
  
  let taskCount = 0
  let totalTime = 0
  
  const originalExecute = executeInWorker
  executeInWorker = async (type: string, data: any) => {
    const startTime = performance.now()
    taskCount++
    
    try {
      const result = await originalExecute(type, data)
      const duration = performance.now() - startTime
      totalTime += duration
      
      console.log(`Worker task ${taskCount}: ${type} completed in ${duration.toFixed(2)}ms`)
      
      return result
    } catch (error) {
      console.error(`Worker task ${taskCount} failed:`, error)
      throw error
    }
  }
  
  // Log performance stats every 30 seconds
  setInterval(() => {
    if (taskCount > 0) {
      console.log(`Web Worker Performance: ${taskCount} tasks, avg ${(totalTime / taskCount).toFixed(2)}ms`)
    }
  }, 30000)
}

// Export for debugging
export function getWorkerStats() {
  return {
    hasWorkers: !!workerPool,
    workerCount: workerPool ? workerPool['workers'].length : 0,
    availableWorkers: workerPool ? workerPool['availableWorkers'].length : 0,
    queueLength: workerPool ? workerPool['taskQueue'].length : 0
  }
}
