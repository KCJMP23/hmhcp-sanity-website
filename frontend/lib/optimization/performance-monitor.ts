import { useEffect, useCallback } from 'react';

// Performance metrics types
export interface PerformanceMetrics {
  FCP: number | null; // First Contentful Paint
  LCP: number | null; // Largest Contentful Paint
  FID: number | null; // First Input Delay
  CLS: number | null; // Cumulative Layout Shift
  TTFB: number | null; // Time to First Byte
  TTI: number | null; // Time to Interactive
  TBT: number | null; // Total Blocking Time
  bundleSize: {
    total: number;
    js: number;
    css: number;
    images: number;
  };
  memoryUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
}

// Performance Observer for Core Web Vitals
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    FCP: null,
    LCP: null,
    FID: null,
    CLS: null,
    TTFB: null,
    TTI: null,
    TBT: null,
    bundleSize: {
      total: 0,
      js: 0,
      css: 0,
      images: 0,
    },
    memoryUsage: {
      used: 0,
      limit: 0,
      percentage: 0,
    },
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
      this.measureBundleSize();
      this.measureMemoryUsage();
    }
  }

  private initializeObservers() {
    // Observe Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.LCP = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP Observer not supported');
    }

    // Observe First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const firstInput = entries[0] as any;
          this.metrics.FID = firstInput.processingStart - firstInput.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID Observer not supported');
    }

    // Observe Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.metrics.CLS = clsValue;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS Observer not supported');
    }

    // Measure First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = entry.startTime;
            break;
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP Observer not supported');
    }

    // Measure Time to First Byte
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      this.metrics.TTFB = timing.responseStart - timing.requestStart;
    }
  }

  private measureBundleSize() {
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      
      let jsSize = 0;
      let cssSize = 0;
      let imageSize = 0;

      resources.forEach((resource: any) => {
        const size = resource.transferSize || 0;
        
        if (resource.name.includes('.js') || resource.name.includes('_next/static/chunks')) {
          jsSize += size;
        } else if (resource.name.includes('.css')) {
          cssSize += size;
        } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)/)) {
          imageSize += size;
        }
      });

      this.metrics.bundleSize = {
        total: jsSize + cssSize + imageSize,
        js: jsSize,
        css: cssSize,
        images: imageSize,
      };
    }
  }

  private measureMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = {
        used: memory.usedJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
  }

  public getMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  public logMetrics() {
    console.group('Performance Metrics');
    console.log('Core Web Vitals:');
    console.log('  FCP:', this.metrics.FCP?.toFixed(2), 'ms');
    console.log('  LCP:', this.metrics.LCP?.toFixed(2), 'ms');
    console.log('  FID:', this.metrics.FID?.toFixed(2), 'ms');
    console.log('  CLS:', this.metrics.CLS?.toFixed(4));
    console.log('  TTFB:', this.metrics.TTFB?.toFixed(2), 'ms');
    console.log('\nBundle Size:');
    console.log('  Total:', (this.metrics.bundleSize.total / 1024).toFixed(2), 'KB');
    console.log('  JS:', (this.metrics.bundleSize.js / 1024).toFixed(2), 'KB');
    console.log('  CSS:', (this.metrics.bundleSize.css / 1024).toFixed(2), 'KB');
    console.log('  Images:', (this.metrics.bundleSize.images / 1024).toFixed(2), 'KB');
    console.log('\nMemory Usage:');
    console.log('  Used:', (this.metrics.memoryUsage.used / 1024 / 1024).toFixed(2), 'MB');
    console.log('  Limit:', (this.metrics.memoryUsage.limit / 1024 / 1024).toFixed(2), 'MB');
    console.log('  Percentage:', this.metrics.memoryUsage.percentage.toFixed(2), '%');
    console.groupEnd();
  }

  public sendMetricsToAnalytics(endpoint?: string) {
    const url = endpoint || '/api/analytics/performance';
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: this.metrics,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(error => {
      console.error('Failed to send performance metrics:', error);
    });
  }
}

// React Hook for performance monitoring
export function usePerformanceMonitor(options?: {
  logToConsole?: boolean;
  sendToAnalytics?: boolean;
  analyticsEndpoint?: string;
  sampleRate?: number; // 0-1, percentage of users to monitor
}) {
  useEffect(() => {
    // Check sample rate
    if (options?.sampleRate && Math.random() > options.sampleRate) {
      return;
    }

    const monitor = new PerformanceMonitor();

    // Wait for page load to complete
    const handleLoad = () => {
      setTimeout(() => {
        if (options?.logToConsole) {
          monitor.logMetrics();
        }

        if (options?.sendToAnalytics) {
          monitor.sendMetricsToAnalytics(options.analyticsEndpoint);
        }
      }, 2000); // Wait 2 seconds after load for accurate metrics
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);
}

// Performance Budget Checker
export class PerformanceBudget {
  private budgets = {
    FCP: 1800, // 1.8s
    LCP: 2500, // 2.5s
    FID: 100, // 100ms
    CLS: 0.1, // 0.1
    TTFB: 800, // 800ms
    bundleSize: {
      total: 500 * 1024, // 500KB
      js: 300 * 1024, // 300KB
      css: 50 * 1024, // 50KB
      images: 200 * 1024, // 200KB per image
    },
  };

  public checkBudget(metrics: PerformanceMetrics): {
    passed: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check Core Web Vitals
    if (metrics.FCP && metrics.FCP > this.budgets.FCP) {
      violations.push(`FCP: ${metrics.FCP.toFixed(2)}ms exceeds budget of ${this.budgets.FCP}ms`);
    }

    if (metrics.LCP && metrics.LCP > this.budgets.LCP) {
      violations.push(`LCP: ${metrics.LCP.toFixed(2)}ms exceeds budget of ${this.budgets.LCP}ms`);
    }

    if (metrics.FID && metrics.FID > this.budgets.FID) {
      violations.push(`FID: ${metrics.FID.toFixed(2)}ms exceeds budget of ${this.budgets.FID}ms`);
    }

    if (metrics.CLS && metrics.CLS > this.budgets.CLS) {
      violations.push(`CLS: ${metrics.CLS.toFixed(4)} exceeds budget of ${this.budgets.CLS}`);
    }

    if (metrics.TTFB && metrics.TTFB > this.budgets.TTFB) {
      violations.push(`TTFB: ${metrics.TTFB.toFixed(2)}ms exceeds budget of ${this.budgets.TTFB}ms`);
    }

    // Check bundle sizes
    if (metrics.bundleSize.total > this.budgets.bundleSize.total) {
      violations.push(
        `Total bundle: ${(metrics.bundleSize.total / 1024).toFixed(2)}KB exceeds budget of ${(this.budgets.bundleSize.total / 1024).toFixed(2)}KB`
      );
    }

    if (metrics.bundleSize.js > this.budgets.bundleSize.js) {
      violations.push(
        `JS bundle: ${(metrics.bundleSize.js / 1024).toFixed(2)}KB exceeds budget of ${(this.budgets.bundleSize.js / 1024).toFixed(2)}KB`
      );
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }
}

// Resource Hints for better performance
export function addResourceHints(resources: Array<{
  url: string;
  type: 'prefetch' | 'preload' | 'preconnect' | 'dns-prefetch';
  as?: string;
}>) {
  if (typeof window === 'undefined') return;

  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = resource.type;
    link.href = resource.url;
    
    if (resource.as) {
      link.setAttribute('as', resource.as);
    }

    document.head.appendChild(link);
  });
}

// Intersection Observer for lazy loading
export function useLazyLoad(
  ref: React.RefObject<HTMLElement>,
  onIntersect: () => void,
  options?: IntersectionObserverInit
) {
  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            onIntersect();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, onIntersect]);
}