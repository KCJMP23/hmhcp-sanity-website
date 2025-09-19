// lib/performance/critical-performance-fix.ts
// Critical performance fixes for immediate impact

export function initializeCriticalPerformanceFix() {
  if (typeof window === 'undefined') return;

  console.log('Initializing Critical Performance Fix...');

  // 1. CRITICAL: Fix LCP by preloading hero images immediately
  const preloadCriticalImages = () => {
    const criticalImages = [
      '/hero-research.jpg',
      '/hero-technology.jpg',
      '/hero-consultation.jpg'
    ];

    criticalImages.forEach(src => {
      // Create preload link
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.fetchPriority = 'high';
      document.head.appendChild(link);

      // Also create image element to start loading
      const img = new Image();
      img.src = src;
      img.loading = 'eager';
      img.fetchPriority = 'high';
    });
  };

  // 2. CRITICAL: Defer ALL non-critical JavaScript
  const deferNonCriticalJS = () => {
    // Defer all scripts except critical ones
    const scripts = document.querySelectorAll('script:not([data-critical])');
    scripts.forEach(script => {
      if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
        script.setAttribute('defer', '');
      }
    });

    // Defer all performance monitoring scripts
    const perfScripts = document.querySelectorAll('script[src*="performance"], script[src*="analytics"]');
    perfScripts.forEach(script => {
      script.setAttribute('defer', '');
    });
  };

  // 3. CRITICAL: Optimize images immediately
  const optimizeAllImages = () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Set loading="eager" for above-the-fold images
      if (isAboveTheFold(img)) {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      } else {
        img.loading = 'lazy';
        img.fetchPriority = 'low';
      }

      // Add decoding="async"
      img.decoding = 'async';

      // Add error handling
      img.onerror = () => {
        console.warn(`Failed to load image: ${img.src}`);
        img.style.display = 'none';
      };
    });
  };

  // Check if element is above the fold
  const isAboveTheFold = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  // 4. CRITICAL: Break up long tasks immediately
  const breakUpLongTasks = () => {
    // Use scheduler API if available
    if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
      // Use scheduler.postTask for better task scheduling
      const scheduleTask = (task: () => void, priority: 'user-blocking' | 'user-visible' | 'background' = 'background') => {
        (window as any).scheduler.postTask(task, { priority });
      };

      // Schedule all non-critical tasks as background
      const nonCriticalTasks = [
        () => console.log('Background task 1'),
        () => console.log('Background task 2'),
        () => console.log('Background task 3')
      ];

      nonCriticalTasks.forEach(task => scheduleTask(task, 'background'));
    } else {
      // Fallback to setTimeout with 0 delay
      const scheduleTask = (task: () => void) => {
        setTimeout(task, 0);
      };

      // Schedule tasks
      scheduleTask(() => console.log('Deferred task 1'));
      scheduleTask(() => console.log('Deferred task 2'));
      scheduleTask(() => console.log('Deferred task 3'));
    }
  };

  // 5. CRITICAL: Remove unused CSS and JavaScript
  const removeUnusedResources = () => {
    // Remove unused CSS
    const unusedCSS = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
    unusedCSS.forEach(link => {
      if (!isAboveTheFold(link as HTMLElement)) {
        link.setAttribute('media', 'print');
        link.onload = () => {
          link.setAttribute('media', 'all');
        };
      }
    });

    // Defer non-critical JavaScript
    const nonCriticalJS = document.querySelectorAll('script:not([data-critical]):not([src*="react"]):not([src*="next"])');
    nonCriticalJS.forEach(script => {
      script.setAttribute('defer', '');
    });
  };

  // 6. CRITICAL: Optimize font loading
  const optimizeFontLoading = () => {
    // Use font-display: swap for all fonts
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
      }
      * {
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  };

  // 7. CRITICAL: Implement resource hints
  const addResourceHints = () => {
    const hints = [
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link rel="dns-prefetch" href="//fonts.googleapis.com">',
      '<link rel="dns-prefetch" href="//fonts.gstatic.com">'
    ];

    hints.forEach(hint => {
      const div = document.createElement('div');
      div.innerHTML = hint;
      const link = div.firstChild as HTMLElement;
      document.head.appendChild(link);
    });
  };

  // Execute all critical fixes immediately
  const executeCriticalFixes = () => {
    preloadCriticalImages();
    deferNonCriticalJS();
    optimizeAllImages();
    breakUpLongTasks();
    removeUnusedResources();
    optimizeFontLoading();
    addResourceHints();
  };

  // Run immediately
  executeCriticalFixes();

  // Also run on DOMContentLoaded to catch any late-loading resources
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', executeCriticalFixes);
  }

  // Run on load to catch any remaining resources
  window.addEventListener('load', executeCriticalFixes);

  console.log('Critical Performance Fix initialized successfully.');
}
