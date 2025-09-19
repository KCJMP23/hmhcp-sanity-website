import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

interface ErrorContext {
  page?: string;
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

interface ErrorThreshold {
  count: number;
  window: number; // milliseconds
}

export class ErrorTracker {
  private errorCounts = new Map<string, { count: number; timestamp: number }[]>();
  private errorThresholds: Record<string, ErrorThreshold> = {
    '4xx': { count: 10, window: 60000 }, // 10 errors per minute
    '5xx': { count: 5, window: 60000 },  // 5 errors per minute
    'js': { count: 20, window: 300000 }, // 20 errors per 5 minutes
    'network': { count: 15, window: 60000 }, // 15 errors per minute
  };
  private alertCallback?: (alert: any) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupErrorListeners();
    }
  }

  private setupErrorListeners() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        type: 'uncaught',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { type: 'unhandled_promise' }
      );
    });

    // Track console errors
    const originalError = console.error;
    console.error = (...args) => {
      this.trackError(new Error(args.join(' ')), { type: 'console_error' });
      originalError.apply(console, args);
    };
  }

  trackError(error: Error, context?: ErrorContext) {
    const errorType = this.categorizeError(error);
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      type: errorType,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      ...context,
    };

    // Send to Sentry if configured
    if (typeof Sentry !== 'undefined' && Sentry.captureException) {
      Sentry.captureException(error, { extra: context });
    }

    // Send to our backend
    this.sendErrorToBackend(errorInfo);

    // Track for alerting
    this.incrementErrorCount(errorType);

    // Check thresholds
    this.checkAlertThresholds(errorType);
  }

  track404(url: string, referrer?: string) {
    const pattern = this.extract404Pattern(url);
    
    this.sendErrorToBackend({
      type: '404',
      message: `404 Not Found: ${url}`,
      page: url,
      referrer,
      pattern,
      timestamp: Date.now(),
    });

    // Track for patterns
    this.incrementErrorCount('4xx');
    
    // Check for broken link patterns
    if (this.isBrokenLinkPattern(pattern)) {
      this.alertBrokenLinks(pattern);
    }
  }

  trackAPIError(
    endpoint: string,
    status: number,
    message: string,
    requestData?: any
  ) {
    const errorType = status >= 500 ? '5xx' : '4xx';
    
    this.sendErrorToBackend({
      type: 'api_error',
      message: `API Error ${status}: ${message}`,
      endpoint,
      status,
      requestData,
      timestamp: Date.now(),
    });

    this.incrementErrorCount(errorType);
    this.checkAlertThresholds(errorType);
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('syntax') || message.includes('reference')) {
      return 'js';
    }
    if (message.includes('permission') || message.includes('security')) {
      return 'security';
    }
    
    return 'js';
  }

  private incrementErrorCount(errorType: string) {
    const now = Date.now();
    const counts = this.errorCounts.get(errorType) || [];
    
    // Add new count
    counts.push({ count: 1, timestamp: now });
    
    // Clean old counts based on the threshold window
    const threshold = this.errorThresholds[errorType];
    if (threshold) {
      const cutoff = now - threshold.window;
      const validCounts = counts.filter(c => c.timestamp > cutoff);
      this.errorCounts.set(errorType, validCounts);
    }
  }

  private getErrorCount(errorType: string, window: number): number {
    const now = Date.now();
    const cutoff = now - window;
    const counts = this.errorCounts.get(errorType) || [];
    
    return counts.filter(c => c.timestamp > cutoff).length;
  }

  private checkAlertThresholds(errorType: string) {
    const threshold = this.errorThresholds[errorType];
    if (!threshold) return;

    const count = this.getErrorCount(errorType, threshold.window);
    
    if (count >= threshold.count) {
      this.triggerAlert({
        type: 'error_threshold',
        severity: 'high',
        title: `High ${errorType} error rate`,
        message: `${count} ${errorType} errors in the last ${threshold.window / 1000} seconds`,
        errorType,
        count,
        threshold: threshold.count,
      });
    }
  }

  private async sendErrorToBackend(errorInfo: any) {
    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorInfo),
        keepalive: true,
      });
    } catch (error) {
      logger.error('Failed to send error to backend:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    }
  }

  private extract404Pattern(url: string): string {
    // Extract pattern from URL for grouping similar 404s
    const parts = url.split('/').filter(Boolean);
    return parts
      .map(part => {
        // Replace IDs and numbers with placeholders
        if (/^\d+$/.test(part)) return '[id]';
        if (/^[a-f0-9-]{36}$/i.test(part)) return '[uuid]';
        return part;
      })
      .join('/');
  }

  private isBrokenLinkPattern(pattern: string): boolean {
    const brokenPatterns = [
      'blog/[id]', // Missing blog posts
      'api/', // API endpoints
      'admin/', // Admin routes from public
    ];
    
    return brokenPatterns.some(p => pattern.includes(p));
  }

  private alertBrokenLinks(pattern: string) {
    this.triggerAlert({
      type: 'broken_links',
      severity: 'medium',
      title: 'Broken link pattern detected',
      message: `Multiple 404 errors for pattern: ${pattern}`,
      pattern,
    });
  }

  private triggerAlert(alert: any) {
    // Send to backend
    fetch('/api/monitoring/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    }).catch(console.error);

    // Call local callback if set
    if (this.alertCallback) {
      this.alertCallback(alert);
    }
  }

  onAlert(callback: (alert: any) => void) {
    this.alertCallback = callback;
  }

  // Track custom errors
  trackCustomError(message: string, context?: ErrorContext) {
    this.trackError(new Error(message), context);
  }
}

// Singleton instance
let errorTracker: ErrorTracker | null = null;

export function initializeErrorTracking() {
  if (typeof window !== 'undefined' && !errorTracker) {
    errorTracker = new ErrorTracker();
  }
  return errorTracker;
}

export function getErrorTracker() {
  return errorTracker;
}