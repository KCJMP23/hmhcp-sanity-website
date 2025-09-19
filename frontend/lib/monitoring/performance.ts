import { logger } from '@/lib/logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  page: string;
  connectionType?: string;
  deviceType?: string;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private flushInterval: NodeJS.Timeout | null = null;
  private sessionId: string;
  private visitorId: string;

  constructor() {
    this.sessionId = this.getSessionId();
    this.visitorId = this.getVisitorId();

    if (typeof window !== 'undefined') {
      this.initializeObservers();
      this.startFlushInterval();
    }
  }

  private initializeObservers() {
    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      logger.info('LCP observer not supported', { action: 'info_logged' });
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any;
          const fid = fidEntry.processingStart - fidEntry.startTime;
          this.recordMetric('FID', fid);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      logger.info('FID observer not supported', { action: 'info_logged' });
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    let clsEntries: any[] = [];
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any;
          if (!layoutShift.hadRecentInput) {
            clsEntries.push(layoutShift);
            clsValue += layoutShift.value;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Report CLS when page is hidden
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.recordMetric('CLS', clsValue);
        }
      });
    } catch (e) {
      logger.info('CLS observer not supported', { action: 'info_logged' });
    }

    // Time to First Byte (TTFB)
    try {
      const navTiming = performance.getEntriesByType('navigation')[0] as any;
      if (navTiming) {
        const ttfb = navTiming.responseStart - navTiming.requestStart;
        this.recordMetric('TTFB', ttfb);
      }
    } catch (e) {
      logger.info('Navigation timing not supported', { action: 'info_logged' });
    }

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime);
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      logger.info('FCP observer not supported', { action: 'info_logged' });
    }

    // Total Blocking Time (TBT) - simplified version
    let totalBlockingTime = 0;
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = entry.duration;
          if (duration > 50) {
            totalBlockingTime += duration - 50;
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Report TBT when page is hidden
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.recordMetric('TBT', totalBlockingTime);
        }
      });
    } catch (e) {
      logger.info('Long task observer not supported', { action: 'info_logged' });
    }
  }

  recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value: Math.round(value),
      timestamp: Date.now(),
      page: window.location.pathname,
      connectionType: this.getConnectionType(),
      deviceType: this.getDeviceType(),
    };

    this.metrics.push(metric);

    // Flush if we have too many metrics
    if (this.metrics.length >= 20) {
      this.flushMetrics();
    }
  }

  private startFlushInterval() {
    // Flush metrics every 10 seconds
    this.flushInterval = setInterval(() => {
      if (this.metrics.length > 0) {
        this.flushMetrics();
      }
    }, 10000);

    // Also flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushMetrics();
    });
  }

  private async flushMetrics() {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: metricsToSend,
          sessionId: this.sessionId,
          visitorId: this.visitorId,
        }),
        keepalive: true,
      });
    } catch (error) {
      logger.error('Failed to send performance metrics:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
      // Re-add metrics if send failed
      this.metrics = [...metricsToSend, ...this.metrics];
    }
  }

  private getConnectionType(): string {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      return conn.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    return sessionId;
  }

  private getVisitorId(): string {
    let visitorId = localStorage.getItem('monitoring_visitor_id');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('monitoring_visitor_id', visitorId);
    }
    return visitorId;
  }

  // Public method to track custom metrics
  trackCustomMetric(name: string, value: number) {
    this.recordMetric(name, value);
  }

  // Clean up
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushMetrics();
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function initializePerformanceMonitoring() {
  if (typeof window !== 'undefined' && !performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

export function getPerformanceMonitor() {
  return performanceMonitor;
}