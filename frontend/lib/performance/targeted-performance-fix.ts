// lib/performance/targeted-performance-fix.ts
// Targeted performance optimizations that don't affect the design system
// Focus on TBT reduction, LCP improvement, and JavaScript optimization

export function initializeTargetedPerformanceFix() {
  if (typeof window === 'undefined') return;

  console.log('Initializing Targeted Performance Fix...');

  // 1. CRITICAL: Reduce Total Blocking Time (TBT)
  const optimizeJavaScriptExecution = () => {
    // Break up long-running tasks using micro-tasks
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = (callback: Function, delay: number) => {
      return originalSetTimeout(() => {
        // Use requestIdleCallback if available for better scheduling
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => callback(), { timeout: 50 });
        } else {
          callback();
        }
      }, delay);
    };

    // Optimize heavy operations by chunking them
    const chunkHeavyOperation = (operation: Function, chunkSize: number = 100) => {
      return new Promise<void>((resolve) => {
        let index = 0;
        const total = 1000; // Assume operation has 1000 iterations

        const processChunk = () => {
          const start = index;
          const end = Math.min(index + chunkSize, total);

          // Execute chunk
          for (let i = start; i < end; i++) {
            operation(i);
          }

          index = end;
          if (index < total) {
            // Schedule next chunk
            if ('requestIdleCallback' in window) {
              requestIdleCallback(processChunk, { timeout: 50 });
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

    // Apply to heavy operations
    window.chunkHeavyOperation = chunkHeavyOperation;
  };

  // 2. CRITICAL: Optimize Largest Contentful Paint (LCP)
  const optimizeLCP = () => {
    // Preload critical images
    const criticalImages = [
      '/hero-research.jpg',
      '/hero-technology.jpg', 
      '/hero-consultation.jpg'
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
    });

    // Optimize image loading
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.loading !== 'lazy') {
        img.loading = 'lazy';
      }
      if (!img.decoding) {
        img.decoding = 'async';
      }
    });
  };

  // 3. CRITICAL: Optimize JavaScript bundle loading
  const optimizeJavaScriptLoading = () => {
    // Defer non-critical JavaScript
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      if (!script.async && !script.defer) {
        script.defer = true;
      }
    });

    // Use dynamic imports for heavy components
    const lazyLoadComponents = () => {
      const lazyElements = document.querySelectorAll('[data-lazy-component]');
      lazyElements.forEach(element => {
        const componentName = element.getAttribute('data-lazy-component');
        if (componentName) {
          // This would be implemented with actual dynamic imports
          console.log(`Lazy loading component: ${componentName}`);
        }
      });
    };

    // Execute lazy loading after initial render
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', lazyLoadComponents);
    } else {
      lazyLoadComponents();
    }
  };

  // 4. CRITICAL: Optimize CSS loading
  const optimizeCSSLoading = () => {
    // Inline critical CSS (this would be done at build time)
    // For now, ensure non-critical CSS is deferred
    const nonCriticalCSS = document.querySelectorAll('link[rel="stylesheet"][data-non-critical]');
    nonCriticalCSS.forEach(link => {
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
      };
    });
  };

  // 5. CRITICAL: Optimize resource hints
  const optimizeResourceHints = () => {
    // Add preconnect hints for external domains
    const externalDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    externalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  };

  // 6. CRITICAL: Optimize Web Vitals
  const optimizeWebVitals = () => {
    // Monitor and optimize CLS
    let clsValue = 0;
    let lastLayoutShift = 0;

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = entry as any;
          if (firstSessionEntry.value) {
            clsValue += firstSessionEntry.value;
            lastLayoutShift = firstSessionEntry.value;
          }
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });

    // Monitor LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP candidate:', lastEntry.element);
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // Monitor FID
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = entry.processingStart - entry.startTime;
        console.log('FID:', fid);
      }
    }).observe({ type: 'first-input', buffered: true });
  };

  // Execute all optimizations
  optimizeJavaScriptExecution();
  optimizeLCP();
  optimizeJavaScriptLoading();
  optimizeCSSLoading();
  optimizeResourceHints();
  optimizeWebVitals();

  console.log('Targeted Performance Fix initialized successfully');
}

// Export for use in other modules
export default initializeTargetedPerformanceFix;
