import * as Sentry from '@sentry/nextjs'
import { NextRequest } from 'next/server'

// Performance monitoring thresholds
const PERFORMANCE_THRESHOLDS = {
  api: {
    fast: 100,      // < 100ms
    normal: 500,    // < 500ms
    slow: 1000,     // < 1s
    critical: 3000  // > 3s
  },
  page: {
    fast: 500,      // < 500ms
    normal: 1500,   // < 1.5s
    slow: 3000,     // < 3s
    critical: 5000  // > 5s
  },
  database: {
    fast: 50,       // < 50ms
    normal: 200,    // < 200ms
    slow: 500,      // < 500ms
    critical: 1000  // > 1s
  }
}

// Custom error types for better categorization
export class APIError extends Error {
  statusCode: number
  endpoint: string
  method: string

  constructor(message: string, statusCode: number, endpoint: string, method: string) {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.endpoint = endpoint
    this.method = method
  }
}

export class DatabaseError extends Error {
  query?: string
  table?: string

  constructor(message: string, query?: string, table?: string) {
    super(message)
    this.name = 'DatabaseError'
    this.query = query
    this.table = table
  }
}

export class AuthenticationError extends Error {
  userId?: string
  attemptedAction?: string

  constructor(message: string, userId?: string, attemptedAction?: string) {
    super(message)
    this.name = 'AuthenticationError'
    this.userId = userId
    this.attemptedAction = attemptedAction
  }
}

export class ValidationError extends Error {
  field?: string
  value?: any

  constructor(message: string, field?: string, value?: any) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.value = value
  }
}

// Enhanced error reporting with context
export function captureError(
  error: Error,
  context?: {
    user?: { id: string; email?: string; role?: string }
    request?: NextRequest
    extra?: Record<string, any>
    tags?: Record<string, string>
    fingerprint?: string[]
  }
) {
  const scope = Sentry.getCurrentScope()

  // Set user context
  if (context?.user) {
    scope.setUser({
      id: context.user.id,
      email: context.user.email,
      role: context.user.role
    })
  }

  // Set request context
  if (context?.request) {
    scope.setContext('request', {
      url: context.request.url,
      method: context.request.method,
      headers: Object.fromEntries(context.request.headers.entries()),
      ip: context.request.headers.get('x-forwarded-for') || 'unknown'
    })
  }

  // Set extra context
  if (context?.extra) {
    Object.entries(context.extra).forEach(([key, value]) => {
      scope.setExtra(key, value)
    })
  }

  // Set tags
  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      scope.setTag(key, value)
    })
  }

  // Set fingerprint for grouping
  if (context?.fingerprint) {
    scope.setFingerprint(context.fingerprint)
  }

  // Capture the error
  Sentry.captureException(error)
}

// Performance monitoring helper
export function measurePerformance<T>(
  operation: string,
  type: 'api' | 'page' | 'database',
  callback: () => T | Promise<T>
): T | Promise<T> {
  return Sentry.startSpan(
    {
      name: operation,
      op: `${type}.${operation}`,
    },
    async () => {
      const startTime = Date.now()

      try {
        const result = await callback()
        const duration = Date.now() - startTime
        
        // Set performance status
        const thresholds = PERFORMANCE_THRESHOLDS[type]
        const activeSpan = Sentry.getActiveSpan()
        
        if (activeSpan) {
          activeSpan.setAttribute('duration', duration)
          
          if (duration < thresholds.fast) {
            activeSpan.setStatus({ code: 1 }) // OK
            activeSpan.setAttribute('performance', 'fast')
          } else if (duration < thresholds.normal) {
            activeSpan.setStatus({ code: 1 }) // OK
            activeSpan.setAttribute('performance', 'normal')
          } else if (duration < thresholds.slow) {
            activeSpan.setStatus({ code: 1 }) // OK
            activeSpan.setAttribute('performance', 'slow')
          } else {
            activeSpan.setStatus({ code: 2 }) // ERROR
            activeSpan.setAttribute('performance', 'critical')
            
            // Report slow operations
            Sentry.captureMessage(`Slow ${type} operation: ${operation}`, 'warning')
          }
        }

        return result
      } catch (error) {
        const activeSpan = Sentry.getActiveSpan()
        if (activeSpan) {
          activeSpan.setStatus({ code: 2 }) // ERROR
          activeSpan.recordException(error as Error)
        }
        throw error
      }
    }
  )
}

// Feature flag monitoring
export function monitorFeatureFlag(
  flagName: string,
  enabled: boolean,
  userId?: string
) {
  Sentry.addBreadcrumb({
    category: 'feature-flag',
    message: `Feature flag ${flagName} is ${enabled ? 'enabled' : 'disabled'}`,
    level: 'info',
    data: {
      flag: flagName,
      enabled,
      userId
    }
  })
}

// Custom metrics tracking
export function trackMetric(
  name: string,
  value: number,
  unit: string = 'none',
  tags?: Record<string, string>
) {
  const activeSpan = Sentry.getActiveSpan()
  
  if (activeSpan) {
    activeSpan.setAttribute(name, value)
    
    if (tags) {
      Object.entries(tags).forEach(([key, val]) => {
        activeSpan.setAttribute(key, val)
      })
    }
  }
  
  // Also send as custom event for dashboards
  Sentry.captureMessage(`Metric: ${name}`, 'info')
}

// User behavior tracking
export function trackUserAction(
  action: string,
  category: string,
  details?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category: 'user-action',
    message: action,
    level: 'info',
    data: {
      category,
      ...details
    }
  })
}

// Session quality monitoring
export function reportSessionQuality(
  userId: string,
  metrics: {
    pageLoadTime?: number
    apiResponseTime?: number
    errorCount?: number
    clickCount?: number
    sessionDuration?: number
  }
) {
  const quality = calculateSessionQuality(metrics)
  
  Sentry.captureMessage('Session Quality Report', 'info')
}

function calculateSessionQuality(metrics: Record<string, number | undefined>): string {
  let score = 100
  
  // Deduct points for poor performance
  if (metrics.pageLoadTime && metrics.pageLoadTime > 3000) score -= 20
  if (metrics.apiResponseTime && metrics.apiResponseTime > 1000) score -= 15
  if (metrics.errorCount && metrics.errorCount > 0) score -= metrics.errorCount * 10
  
  // Calculate quality tier
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  return 'poor'
}

// Monitoring middleware
export function createSentryMiddleware() {
  return async (req: NextRequest) => {
    // Set context for request
    Sentry.setContext('request', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    })

    // Add breadcrumb for request
    Sentry.addBreadcrumb({
      category: 'request',
      message: `${req.method} ${req.nextUrl.pathname}`,
      level: 'info',
      data: {
        method: req.method,
        url: req.url,
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return null
  }
}

// Critical operation wrapper
export async function withCriticalOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  options?: {
    timeout?: number
    retries?: number
    onError?: (error: Error) => void
  }
): Promise<T> {
  const { timeout = 30000, retries = 0, onError } = options || {}
  
  return Sentry.startSpan(
    {
      name: operationName,
      op: 'critical-operation',
    },
    async () => {

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), timeout)
        )
      ])
      
      return result
    } catch (error) {
      if (attempt === retries) {
        captureError(error as Error, {
          tags: {
            operation: operationName,
            critical: 'true',
            attempts: (attempt + 1).toString()
          }
        })
        
        if (onError) {
          onError(error as Error)
        }
        
        throw error
      }
      
      // Add retry breadcrumb
      Sentry.addBreadcrumb({
        category: 'retry',
        message: `Retrying ${operationName} (attempt ${attempt + 1})`,
        level: 'warning'
      })
    }
  }
  
      throw new Error('Should not reach here')
    }
  )
}