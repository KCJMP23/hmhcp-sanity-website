import { logger } from '@/lib/logger'

// Conditionally import Sentry only in production
const Sentry = process.env.NODE_ENV === 'production' 
  ? require('@sentry/nextjs') 
  : null

export interface ErrorContext {
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  timestamp?: number
  buildId?: string
  environment?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

export interface ErrorReport {
  error: Error
  context: ErrorContext
  level: 'error' | 'warning' | 'info'
  fingerprint?: string[]
}

/**
 * Enhanced error reporting utility with context enrichment
 */
export class ErrorReporter {
  private static instance: ErrorReporter
  private buildId: string
  private environment: string

  private constructor() {
    this.buildId = process.env.BUILD_ID || 'unknown'
    this.environment = process.env.NODE_ENV || 'development'
  }

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter()
    }
    return ErrorReporter.instance
  }

  /**
   * Report an error with enriched context
   */
  reportError(report: ErrorReport): string {
    const errorId = this.generateErrorId()
    
    // Enrich context with additional metadata
    const enrichedContext: ErrorContext = {
      ...report.context,
      timestamp: Date.now(),
      buildId: this.buildId,
      environment: this.environment,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    }

    // Log to console in development
    if (this.environment === 'development') {
      logger.error('Error Report:', { 
        error: report.error, 
        action: 'error_logged', 
        metadata: { 
          errorId,
          context: enrichedContext,
          level: report.level 
        } 
      })
    }

    // Report to Sentry in production
    if (this.environment === 'production' && Sentry) {
      Sentry.withScope((scope: any) => {
        // Set user context if available
        if (enrichedContext.userId) {
          scope.setUser({ id: enrichedContext.userId })
        }

        // Set tags
        scope.setTag('errorId', errorId)
        scope.setTag('component', enrichedContext.component || 'unknown')
        scope.setTag('buildId', this.buildId)

        // Set context
        scope.setContext('errorReport', {
          ...enrichedContext,
          reportLevel: report.level
        })

        // Set level
        scope.setLevel(report.level)

        // Set fingerprint for grouping
        if (report.fingerprint) {
          scope.setFingerprint(report.fingerprint)
        } else {
          scope.setFingerprint([
            '{{ default }}',
            report.error.name,
            enrichedContext.component || 'unknown'
          ])
        }

        // Add breadcrumb
        scope.addBreadcrumb({
          category: 'error-report',
          message: `Error in ${enrichedContext.component || 'unknown component'}`,
          level: report.level,
          data: {
            errorId,
            action: enrichedContext.action,
            metadata: enrichedContext.metadata
          }
        })

        // Capture the exception
        Sentry.captureException(report.error)
      })
    }

    return errorId
  }

  /**
   * Report a component error
   */
  reportComponentError(
    error: Error,
    componentName: string,
    additionalContext?: Partial<ErrorContext>
  ): string {
    return this.reportError({
      error,
      level: 'error',
      context: {
        component: componentName,
        action: 'component_error',
        ...additionalContext
      },
      fingerprint: ['component-error', componentName, error.name]
    })
  }

  /**
   * Report a page error
   */
  reportPageError(
    error: Error,
    pageName: string,
    additionalContext?: Partial<ErrorContext>
  ): string {
    return this.reportError({
      error,
      level: 'error',
      context: {
        component: pageName,
        action: 'page_error',
        ...additionalContext
      },
      fingerprint: ['page-error', pageName, error.name]
    })
  }

  /**
   * Report a route error
   */
  reportRouteError(
    error: Error,
    routeName: string,
    additionalContext?: Partial<ErrorContext>
  ): string {
    return this.reportError({
      error,
      level: 'error',
      context: {
        component: routeName,
        action: 'route_error',
        ...additionalContext
      },
      fingerprint: ['route-error', routeName, error.name]
    })
  }

  /**
   * Report a JavaScript/runtime error
   */
  reportJavaScriptError(
    error: Error,
    source: string,
    additionalContext?: Partial<ErrorContext>
  ): string {
    return this.reportError({
      error,
      level: 'error',
      context: {
        component: source,
        action: 'javascript_error',
        ...additionalContext
      },
      fingerprint: ['javascript-error', source, error.name]
    })
  }

  /**
   * Report a network/API error
   */
  reportNetworkError(
    error: Error,
    endpoint: string,
    additionalContext?: Partial<ErrorContext>
  ): string {
    return this.reportError({
      error,
      level: 'warning',
      context: {
        component: 'network',
        action: 'api_error',
        metadata: { endpoint },
        ...additionalContext
      },
      fingerprint: ['network-error', endpoint, error.name]
    })
  }

  /**
   * Report a resource loading error
   */
  reportResourceError(
    error: Error,
    resourceType: string,
    resourceUrl?: string,
    additionalContext?: Partial<ErrorContext>
  ): string {
    return this.reportError({
      error,
      level: 'warning',
      context: {
        component: 'resource-loader',
        action: 'resource_error',
        metadata: { resourceType, resourceUrl },
        ...additionalContext
      },
      fingerprint: ['resource-error', resourceType, error.name]
    })
  }

  /**
   * Generate a unique error ID
   */
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 9)
    return `ERR-${timestamp}-${random}`.toUpperCase()
  }
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reporter = ErrorReporter.getInstance()
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    
    reporter.reportJavaScriptError(error, 'unhandled-promise-rejection', {
      action: 'unhandled_promise_rejection',
      metadata: {
        promise: event.promise,
        reason: event.reason
      }
    })
    
    // Prevent the default browser behavior
    event.preventDefault()
  })

  // Global error handler for JavaScript errors
  window.addEventListener('error', (event) => {
    const reporter = ErrorReporter.getInstance()
    const error = event.error || new Error(event.message)
    
    reporter.reportJavaScriptError(error, 'global-error-handler', {
      action: 'global_javascript_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        message: event.message
      }
    })
  })
}

// Export singleton instance
export const errorReporter = ErrorReporter.getInstance()

// Convenience functions
export const reportError = (error: Error, context?: Partial<ErrorContext>) => 
  errorReporter.reportError({ error, level: 'error', context: context || {} })

export const reportWarning = (error: Error, context?: Partial<ErrorContext>) => 
  errorReporter.reportError({ error, level: 'warning', context: context || {} })

export const reportComponentError = errorReporter.reportComponentError.bind(errorReporter)
export const reportPageError = errorReporter.reportPageError.bind(errorReporter)
export const reportRouteError = errorReporter.reportRouteError.bind(errorReporter)
export const reportNetworkError = errorReporter.reportNetworkError.bind(errorReporter)
export const reportResourceError = errorReporter.reportResourceError.bind(errorReporter)