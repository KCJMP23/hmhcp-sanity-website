// lib/performance/js-execution-optimizer.ts
// JavaScript execution optimizer to reduce main thread blocking
// Focus on optimizing heavy operations and reducing TBT

export function initializeJSExecutionOptimizer() {
  if (typeof window === 'undefined') return;

  console.log('Initializing JS Execution Optimizer...');

  // 1. CRITICAL: Optimize heavy computations
  const optimizeHeavyComputations = () => {
    // Break up heavy loops
    const breakUpLoop = (iterations: number, callback: (index: number) => void, chunkSize: number = 100) => {
      return new Promise<void>((resolve) => {
        let index = 0;

        const processChunk = () => {
          const start = index;
          const end = Math.min(index + chunkSize, iterations);

          for (let i = start; i < end; i++) {
            callback(i);
          }

          index = end;

          if (index < iterations) {
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

    // Optimize array operations
    const optimizeArrayOperations = () => {
      // Chunk array processing
      const chunkArray = <T>(array: T[], processor: (item: T, index: number) => void, chunkSize: number = 100) => {
        return new Promise<void>((resolve) => {
          let index = 0;

          const processChunk = () => {
            const start = index;
            const end = Math.min(index + chunkSize, array.length);

            for (let i = start; i < end; i++) {
              processor(array[i], i);
            }

            index = end;

            if (index < array.length) {
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
      (window as any).chunkArray = chunkArray;
    };

    // Expose globally
    (window as any).breakUpLoop = breakUpLoop;
    optimizeArrayOperations();
  };

  // 2. CRITICAL: Optimize DOM operations
  const optimizeDOMOperations = () => {
    // Batch DOM updates
    const domUpdateQueue: Function[] = [];
    let isUpdating = false;

    const flushDOMUpdates = () => {
      if (isUpdating) return;
      
      isUpdating = true;
      
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

    // Optimize element creation
    const createElementOptimized = (tagName: string, attributes: Record<string, any> = {}) => {
      return new Promise<HTMLElement>((resolve) => {
        scheduleDOMUpdate(() => {
          const element = document.createElement(tagName);
          Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
              element.className = value;
            } else if (key === 'innerHTML') {
              element.innerHTML = value;
            } else {
              element.setAttribute(key, value);
            }
          });
          resolve(element);
        });
      });
    };

    // Expose globally
    (window as any).scheduleDOMUpdate = scheduleDOMUpdate;
    (window as any).createElementOptimized = createElementOptimized;
  };

  // 3. CRITICAL: Optimize event handling
  const optimizeEventHandling = () => {
    // Debounce function
    const debounce = (func: Function, wait: number, immediate: boolean = false) => {
      let timeout: number;
      return (...args: any[]) => {
        const later = () => {
          timeout = 0;
          if (!immediate) func.apply(this, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(this, args);
      };
    };

    // Throttle function
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

    // Optimize scroll events
    const optimizeScrollEvents = () => {
      let scrollTimeout: number;
      const scrollHandler = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          // Handle scroll logic here
        }, 16); // ~60fps
      };

      window.addEventListener('scroll', scrollHandler, { passive: true });
    };

    // Optimize resize events
    const optimizeResizeEvents = () => {
      let resizeTimeout: number;
      const resizeHandler = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          // Handle resize logic here
        }, 16);
      };

      window.addEventListener('resize', resizeHandler, { passive: true });
    };

    // Expose globally
    (window as any).debounce = debounce;
    (window as any).throttle = throttle;
    
    optimizeScrollEvents();
    optimizeResizeEvents();
  };

  // 4. CRITICAL: Optimize async operations
  const optimizeAsyncOperations = () => {
    // Create a task queue for async operations
    const taskQueue: Function[] = [];
    let isProcessing = false;

    const processTaskQueue = () => {
      if (isProcessing || taskQueue.length === 0) return;
      
      isProcessing = true;
      
      const processNext = () => {
        if (taskQueue.length === 0) {
          isProcessing = false;
          return;
        }
        
        const task = taskQueue.shift();
        try {
          task?.();
        } catch (error) {
          console.error('Task error:', error);
        }
        
        // Schedule next task
        if ('requestIdleCallback' in window) {
          requestIdleCallback(processNext, { timeout: 16 });
        } else {
          setTimeout(processNext, 0);
        }
      };
      
      processNext();
    };

    const scheduleTask = (task: Function) => {
      taskQueue.push(task);
      processTaskQueue();
    };

    // Expose globally
    (window as any).scheduleTask = scheduleTask;
  };

  // 5. CRITICAL: Optimize memory usage
  const optimizeMemoryUsage = () => {
    // Clean up unused objects
    const cleanup = () => {
      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }
    };

    // Schedule periodic cleanup
    setInterval(cleanup, 30000); // Every 30 seconds
  };

  // 6. CRITICAL: Monitor performance
  const monitorPerformance = () => {
    let longTaskCount = 0;
    let totalBlockingTime = 0;

    if ('PerformanceObserver' in window) {
      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            longTaskCount++;
            totalBlockingTime += entry.duration - 50;
            console.warn(`Long task: ${entry.duration}ms`);
          }
        }
      });

      longTaskObserver.observe({ type: 'longtask', buffered: true });

      // Monitor frame rate
      let frameCount = 0;
      let lastTime = performance.now();

      const measureFrameRate = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
          const fps = frameCount;
          console.log(`FPS: ${fps}`);
          frameCount = 0;
          lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFrameRate);
      };

      measureFrameRate();
    }

    // Report metrics
    setTimeout(() => {
      console.log(`Performance Metrics: ${longTaskCount} long tasks, ${totalBlockingTime}ms TBT`);
    }, 10000);
  };

  // Execute all optimizations
  optimizeHeavyComputations();
  optimizeDOMOperations();
  optimizeEventHandling();
  optimizeAsyncOperations();
  optimizeMemoryUsage();
  monitorPerformance();

  console.log('JS Execution Optimizer initialized successfully');
}

export default initializeJSExecutionOptimizer;
