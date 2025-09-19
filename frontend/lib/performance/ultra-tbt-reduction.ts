// lib/performance/ultra-tbt-reduction.ts
// Ultra-aggressive TBT reduction techniques
// Focus on breaking up long-running tasks and optimizing JavaScript execution

export function initializeUltraTBTReduction() {
  if (typeof window === 'undefined') return;

  console.log('Initializing Ultra TBT Reduction...');

  // 1. CRITICAL: Break up all long-running tasks
  const breakLongTasks = () => {
    // Override setTimeout to ensure tasks don't block
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = (callback: Function, delay: number) => {
      return originalSetTimeout(() => {
        // Use requestIdleCallback for better scheduling
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => callback(), { timeout: 16 });
        } else {
          // Use MessageChannel for better scheduling
          const channel = new MessageChannel();
          channel.port2.onmessage = () => callback();
          channel.port1.postMessage(null);
        }
      }, delay);
    };

    // Override setInterval to break up recurring tasks
    const originalSetInterval = window.setInterval;
    window.setInterval = (callback: Function, delay: number) => {
      let timeoutId: number;
      const execute = () => {
        callback();
        timeoutId = originalSetTimeout(execute, delay);
      };
      timeoutId = originalSetTimeout(execute, delay);
      return timeoutId;
    };
  };

  // 2. CRITICAL: Implement micro-task scheduling
  const implementMicroTaskScheduling = () => {
    // Create a micro-task scheduler
    const microTaskQueue: Function[] = [];
    let isProcessing = false;

    const processMicroTasks = () => {
      if (isProcessing || microTaskQueue.length === 0) return;
      
      isProcessing = true;
      
      while (microTaskQueue.length > 0) {
        const task = microTaskQueue.shift();
        try {
          task?.();
        } catch (error) {
          console.error('Micro task error:', error);
        }
      }
      
      isProcessing = false;
    };

    // Schedule micro-tasks
    const scheduleMicroTask = (task: Function) => {
      microTaskQueue.push(task);
      if (!isProcessing) {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(processMicroTasks, { timeout: 16 });
        } else {
          setTimeout(processMicroTasks, 0);
        }
      }
    };

    // Expose globally for use
    (window as any).scheduleMicroTask = scheduleMicroTask;
  };

  // 3. CRITICAL: Optimize heavy operations with chunking
  const optimizeHeavyOperations = () => {
    // Chunk heavy operations into smaller pieces
    const chunkOperation = (operation: Function, data: any[], chunkSize: number = 10) => {
      return new Promise<void>((resolve) => {
        let index = 0;
        
        const processChunk = () => {
          const start = index;
          const end = Math.min(index + chunkSize, data.length);
          
          // Process chunk
          for (let i = start; i < end; i++) {
            operation(data[i], i);
          }
          
          index = end;
          
          if (index < data.length) {
            // Schedule next chunk
            if ('requestIdleCallback' in window) {
              requestIdleCallback(processChunk, { timeout: 16 });
            } else {
              setTimeout(processChunk, 0);
            }
          } else {
            resolve();
          }
        };
        
        processChunk();
      });
    };

    // Expose globally
    (window as any).chunkOperation = chunkOperation;
  };

  // 4. CRITICAL: Optimize DOM operations
  const optimizeDOMOperations = () => {
    // Batch DOM updates
    const domUpdateQueue: Function[] = [];
    let isUpdating = false;

    const flushDOMUpdates = () => {
      if (isUpdating) return;
      
      isUpdating = true;
      
      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        while (domUpdateQueue.length > 0) {
          const update = domUpdateQueue.shift();
          try {
            update?.();
          } catch (error) {
            console.error('DOM update error:', error);
          }
        }
        isUpdating = false;
      });
    };

    const scheduleDOMUpdate = (update: Function) => {
      domUpdateQueue.push(update);
      flushDOMUpdates();
    };

    // Expose globally
    (window as any).scheduleDOMUpdate = scheduleDOMUpdate;
  };

  // 5. CRITICAL: Optimize event handlers
  const optimizeEventHandlers = () => {
    // Debounce heavy event handlers
    const debounce = (func: Function, wait: number) => {
      let timeout: number;
      return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    };

    // Throttle scroll and resize events
    const throttle = (func: Function, limit: number) => {
      let inThrottle: boolean;
      return (...args: any[]) => {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    };

    // Expose globally
    (window as any).debounce = debounce;
    (window as any).throttle = throttle;
  };

  // 6. CRITICAL: Optimize JavaScript execution
  const optimizeJavaScriptExecution = () => {
    // Break up heavy computations
    const breakUpComputation = (computation: Function, data: any) => {
      return new Promise<any>((resolve) => {
        const result: any[] = [];
        let index = 0;
        const chunkSize = 100;

        const processChunk = () => {
          const start = index;
          const end = Math.min(index + chunkSize, data.length);

          for (let i = start; i < end; i++) {
            result.push(computation(data[i]));
          }

          index = end;

          if (index < data.length) {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(processChunk, { timeout: 16 });
            } else {
              setTimeout(processChunk, 0);
            }
          } else {
            resolve(result);
          }
        };

        processChunk();
      });
    };

    // Expose globally
    (window as any).breakUpComputation = breakUpComputation;
  };

  // 7. CRITICAL: Monitor and optimize TBT
  const monitorTBT = () => {
    let longTaskCount = 0;
    let totalBlockingTime = 0;

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            longTaskCount++;
            totalBlockingTime += entry.duration - 50; // TBT is duration - 50ms
            console.warn(`Long task detected: ${entry.duration}ms`);
          }
        }
      });

      observer.observe({ type: 'longtask', buffered: true });
    }

    // Report TBT metrics
    setTimeout(() => {
      console.log(`TBT Metrics: ${longTaskCount} long tasks, ${totalBlockingTime}ms total blocking time`);
    }, 5000);
  };

  // Execute all optimizations
  breakLongTasks();
  implementMicroTaskScheduling();
  optimizeHeavyOperations();
  optimizeDOMOperations();
  optimizeEventHandlers();
  optimizeJavaScriptExecution();
  monitorTBT();

  console.log('Ultra TBT Reduction initialized successfully');
}

export default initializeUltraTBTReduction;
