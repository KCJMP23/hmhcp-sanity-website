/**
 * Sentry Error Monitoring Configuration
 * Production-ready error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs'

// Initialize Sentry only in production
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    
    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.exception) {
        const error = hint.originalException
        
        // Skip common client-side errors
        if (error instanceof Error) {
          const message = error.message.toLowerCase()
          
          // Skip network errors that aren't actionable
          if (message.includes('network request failed') ||
              message.includes('fetch') ||
              message.includes('connection refused')) {
            return null
          }
          
          // Skip hydration mismatches (common in SSR)
          if (message.includes('hydration') || message.includes('hydrate')) {
            return null
          }
          
          // Skip authentication errors (expected behavior)
          if (message.includes('unauthorized') || message.includes('authentication')) {
            return null
          }
        }
      }
      
      return event
    },
    
    // Additional configuration
    integrations: [
      // Browser tracing is included by default in Next.js Sentry setup
    ],
    
    // Sample rate for session replays (only in production)
    replaysSessionSampleRate: 0.01, // 1% of sessions
    replaysOnErrorSampleRate: 0.1,  // 10% of sessions with errors
  })
}

/**
 * Custom error reporting function
 */
export function reportError(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setTag(key, value)
        })
      }
      Sentry.captureException(error)
    })
  } else {
    console.error('Error:', error, context)
  }
}

/**
 * Performance monitoring function
 */
export function trackPerformance(name: string, operation: () => Promise<any>) {
  return Sentry.startSpan(
    {
      name,
      op: 'function',
    },
    async () => {
      const start = performance.now()
      try {
        const result = await operation()
        const duration = performance.now() - start
        
        // Log slow operations
        if (duration > 1000) {
          console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
        }
        
        return result
      } catch (error) {
        reportError(error as Error, { operation: name })
        throw error
      }
    }
  )
}

/**
 * User feedback capture
 */
export function captureFeedback(feedback: {
  name: string
  email: string
  message: string
}) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureFeedback({
      name: feedback.name,
      email: feedback.email,
      message: feedback.message,
    })
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id: string
  email?: string
  role?: string
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  })
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null)
}

export default Sentry