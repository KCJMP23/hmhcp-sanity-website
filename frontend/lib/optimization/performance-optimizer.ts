/**
 * Performance Optimizer
 * Implements critical performance optimizations for production deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  maxBundleSize: 500 * 1024, // 500KB
  maxImageSize: 200 * 1024,  // 200KB
  minCacheHitRate: 0.8,      // 80%
  maxApiResponseTime: 200,    // ms
  maxDatabaseQueryTime: 50,   // ms
};

// Bundle optimization configuration
export const bundleOptimizationConfig = {
  // Code splitting strategy
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      default: false,
      vendors: false,
      // Framework chunk
      framework: {
        name: 'framework',
        chunks: 'all',
        test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
        priority: 40,
        enforce: true,
      },
      // Common libraries
      lib: {
        test(module: any) {
          return module.size() > 160000 &&
            /node_modules[/\\]/.test(module.identifier());
        },
        name(module: any) {
          const packageName = module.context.match(
            /[\\/]node_modules[\\/](.*?)[\\/]/
          );
          return `npm.${packageName[1].replace('@', '')}`;
        },
        priority: 30,
        minChunks: 1,
        reuseExistingChunk: true,
      },
      // Common components
      commons: {
        name: 'commons',
        minChunks: 2,
        priority: 20,
      },
      // Shared modules
      shared: {
        name(module: any, chunks: any) {
          const moduleFileName = module
            .identifier()
            .split('/')
            .reduceRight((item: any) => item);
          const allChunksNames = chunks.map((item: any) => item.name).join('~');
          return `${allChunksNames}~${moduleFileName}`;
        },
        priority: 10,
        minChunks: 2,
        reuseExistingChunk: true,
      },
    },
    maxAsyncRequests: 6,
    maxInitialRequests: 4,
  },
};

// Image optimization settings
export const imageOptimizationConfig = {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 31536000, // 1 year
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
};

// Cache optimization utilities
export class CacheOptimizer {
  private static cacheHeaders = {
    immutable: 'public, max-age=31536000, immutable',
    static: 'public, max-age=2592000, stale-while-revalidate=86400',
    dynamic: 'public, max-age=300, stale-while-revalidate=600',
    api: 'private, no-cache, no-store, must-revalidate',
    revalidate: (seconds: number) => 
      `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
  };

  static getCacheHeaders(path: string, options?: { revalidate?: number }) {
    // Static assets
    if (path.startsWith('/_next/static/')) {
      return this.cacheHeaders.immutable;
    }

    // Images and media
    if (/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(path)) {
      return this.cacheHeaders.static;
    }

    // API routes
    if (path.startsWith('/api/')) {
      return this.cacheHeaders.api;
    }

    // ISR pages with revalidation
    if (options?.revalidate) {
      return this.cacheHeaders.revalidate(options.revalidate);
    }

    // Default for dynamic pages
    return this.cacheHeaders.dynamic;
  }

  static shouldCompress(contentType: string): boolean {
    const compressibleTypes = [
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'application/json',
      'application/xml',
      'text/xml',
      'image/svg+xml',
    ];

    return compressibleTypes.some(type => contentType.includes(type));
  }
}

// Database query optimizer
export class QueryOptimizer {
  private static queryCache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_TTL = 60000; // 1 minute

  static async optimizeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options?: { ttl?: number; force?: boolean }
  ): Promise<T> {
    const ttl = options?.ttl || this.CACHE_TTL;
    const cached = this.queryCache.get(queryKey);

    if (!options?.force && cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const startTime = performance.now();
    const result = await queryFn();
    const queryTime = performance.now() - startTime;

    // Log slow queries
    if (queryTime > PERFORMANCE_THRESHOLDS.maxDatabaseQueryTime) {
      console.warn(`Slow query detected: ${queryKey} took ${queryTime.toFixed(2)}ms`);
    }

    this.queryCache.set(queryKey, { data: result, timestamp: Date.now() });
    return result;
  }

  static clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }
}

// API response optimizer
export class ResponseOptimizer {
  static async optimizeApiResponse(
    handler: () => Promise<any>,
    options?: {
      cache?: boolean;
      compress?: boolean;
      timeout?: number;
    }
  ): Promise<NextResponse> {
    const startTime = performance.now();

    try {
      // Set timeout
      const timeout = options?.timeout || 10000;
      const result = await Promise.race([
        handler(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        ),
      ]);

      const responseTime = performance.now() - startTime;

      // Log slow responses
      if (responseTime > PERFORMANCE_THRESHOLDS.maxApiResponseTime) {
        console.warn(`Slow API response: ${responseTime.toFixed(2)}ms`);
      }

      // Create response
      const response = NextResponse.json(result);

      // Add performance headers
      response.headers.set('X-Response-Time', `${responseTime.toFixed(0)}ms`);
      response.headers.set('X-Cache-Status', options?.cache ? 'HIT' : 'MISS');

      // Add cache headers if enabled
      if (options?.cache) {
        response.headers.set(
          'Cache-Control',
          'public, max-age=60, stale-while-revalidate=120'
        );
      }

      return response;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      console.error(`API error after ${responseTime.toFixed(2)}ms:`, error);
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}

// Resource hints for optimal loading
export class ResourceHints {
  static generateHints(pathname: string): string[] {
    const hints: string[] = [];

    // DNS prefetch for external domains
    const externalDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'www.googletagmanager.com',
    ];

    externalDomains.forEach(domain => {
      hints.push(`<link rel="dns-prefetch" href="//${domain}">`);
    });

    // Preconnect to critical origins
    hints.push('<link rel="preconnect" href="https://fonts.googleapis.com">');
    hints.push('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');

    // Preload critical resources
    if (pathname === '/') {
      // hints.push('<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>'); // Font doesn't exist
      hints.push('<link rel="preload" href="/_next/static/css/app.css" as="style">');
    }

    // Prefetch likely navigation targets
    const prefetchPaths = ['/services', '/about', '/contact'];
    prefetchPaths.forEach(path => {
      if (pathname !== path) {
        hints.push(`<link rel="prefetch" href="${path}">`);
      }
    });

    return hints;
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }

  static getMetrics(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  static getAllMetrics() {
    const allMetrics: Record<string, any> = {};
    
    for (const [name, _] of this.metrics) {
      allMetrics[name] = this.getMetrics(name);
    }
    
    return allMetrics;
  }

  static clearMetrics() {
    this.metrics.clear();
  }
}

// Lazy loading utilities
export const lazyLoadConfig = {
  // Components that should be lazy loaded
  lazyComponents: [
    'Analytics',
    'Comments',
    'ShareButtons',
    'RelatedPosts',
    'Newsletter',
    'VideoPlayer',
  ],

  // Routes that should be code-split
  splitRoutes: [
    '/admin/*',
    '/dashboard/*',
    '/analytics/*',
    '/settings/*',
  ],

  // Third-party scripts to load asynchronously
  asyncScripts: [
    { src: 'https://www.googletagmanager.com/gtag/js', strategy: 'afterInteractive' },
    { src: 'https://platform.twitter.com/widgets.js', strategy: 'lazyOnload' },
  ],
};

// Performance budget checker
export class PerformanceBudget {
  static checkBudget(metrics: {
    bundleSize?: number;
    imageSize?: number;
    apiResponseTime?: number;
    cacheHitRate?: number;
  }): { passed: boolean; violations: string[] } {
    const violations: string[] = [];

    if (metrics.bundleSize && metrics.bundleSize > PERFORMANCE_THRESHOLDS.maxBundleSize) {
      violations.push(
        `Bundle size (${(metrics.bundleSize / 1024).toFixed(0)}KB) exceeds budget (${(PERFORMANCE_THRESHOLDS.maxBundleSize / 1024).toFixed(0)}KB)`
      );
    }

    if (metrics.imageSize && metrics.imageSize > PERFORMANCE_THRESHOLDS.maxImageSize) {
      violations.push(
        `Image size (${(metrics.imageSize / 1024).toFixed(0)}KB) exceeds budget (${(PERFORMANCE_THRESHOLDS.maxImageSize / 1024).toFixed(0)}KB)`
      );
    }

    if (metrics.apiResponseTime && metrics.apiResponseTime > PERFORMANCE_THRESHOLDS.maxApiResponseTime) {
      violations.push(
        `API response time (${metrics.apiResponseTime}ms) exceeds budget (${PERFORMANCE_THRESHOLDS.maxApiResponseTime}ms)`
      );
    }

    if (metrics.cacheHitRate && metrics.cacheHitRate < PERFORMANCE_THRESHOLDS.minCacheHitRate) {
      violations.push(
        `Cache hit rate (${(metrics.cacheHitRate * 100).toFixed(1)}%) below minimum (${(PERFORMANCE_THRESHOLDS.minCacheHitRate * 100).toFixed(0)}%)`
      );
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }
}

// Export main optimizer
export const performanceOptimizer = {
  CacheOptimizer,
  QueryOptimizer,
  ResponseOptimizer,
  ResourceHints,
  PerformanceMonitor,
  PerformanceBudget,
  bundleOptimizationConfig,
  imageOptimizationConfig,
  lazyLoadConfig,
};