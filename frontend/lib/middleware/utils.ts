/**
 * Middleware Utility Functions
 * 
 * This module provides utility functions for creating and applying
 * middleware in a flexible and composable way.
 */

import { NextRequest, NextResponse } from 'next/server'

export type MiddlewareFunction<T = any> = (
  request: NextRequest,
  ...args: any[]
) => Promise<NextResponse<T>>

export type MiddlewareWrapper<T = any> = (
  handler: MiddlewareFunction<T>
) => MiddlewareFunction<T>

/**
 * Create a middleware chain by composing multiple middleware functions
 */
export function createMiddlewareChain<T>(
  handler: MiddlewareFunction<T>,
  ...middlewares: MiddlewareWrapper<T>[]
): MiddlewareFunction<T> {
  return middlewares.reduceRight(
    (acc, middleware) => middleware(acc),
    handler
  )
}

/**
 * Apply middleware to a handler function
 */
export function applyMiddleware<T>(
  handler: MiddlewareFunction<T>,
  ...middlewares: MiddlewareWrapper<T>[]
): MiddlewareFunction<T> {
  return createMiddlewareChain(handler, ...middlewares)
}

/**
 * Conditional middleware - only apply if condition is met
 */
export function conditionalMiddleware<T>(
  condition: (request: NextRequest) => boolean,
  middleware: MiddlewareWrapper<T>
): MiddlewareWrapper<T> {
  return (handler: MiddlewareFunction<T>) => {
    return async (request: NextRequest, ...args: any[]) => {
      if (condition(request)) {
        return middleware(handler)(request, ...args)
      }
      return handler(request, ...args)
    }
  }
}

/**
 * Environment-based middleware - only apply in specific environments
 */
export function environmentMiddleware<T>(
  environments: string[],
  middleware: MiddlewareWrapper<T>
): MiddlewareWrapper<T> {
  const currentEnv = process.env.NODE_ENV || 'development'
  
  return conditionalMiddleware(
    () => environments.includes(currentEnv),
    middleware
  )
}

/**
 * Development-only middleware
 */
export function devOnlyMiddleware<T>(
  middleware: MiddlewareWrapper<T>
): MiddlewareWrapper<T> {
  return environmentMiddleware(['development', 'test'], middleware)
}

/**
 * Production-only middleware
 */
export function productionOnlyMiddleware<T>(
  middleware: MiddlewareWrapper<T>
): MiddlewareWrapper<T> {
  return environmentMiddleware(['production'], middleware)
}

/**
 * Skip middleware for specific paths
 */
export function skipForPaths<T>(
  paths: string[],
  middleware: MiddlewareWrapper<T>
): MiddlewareWrapper<T> {
  return conditionalMiddleware(
    (request) => !paths.some(path => request.nextUrl.pathname.startsWith(path)),
    middleware
  )
}

/**
 * Apply middleware only for specific paths
 */
export function onlyForPaths<T>(
  paths: string[],
  middleware: MiddlewareWrapper<T>
): MiddlewareWrapper<T> {
  return conditionalMiddleware(
    (request) => paths.some(path => request.nextUrl.pathname.startsWith(path)),
    middleware
  )
}

/**
 * Skip middleware for specific HTTP methods
 */
export function skipForMethods<T>(
  methods: string[],
  middleware: MiddlewareWrapper<T>
): MiddlewareWrapper<T> {
  return conditionalMiddleware(
    (request) => !methods.includes(request.method),
    middleware
  )
}

/**
 * Apply middleware only for specific HTTP methods
 */
export function onlyForMethods<T>(
  methods: string[],
  middleware: MiddlewareWrapper<T>
): MiddlewareWrapper<T> {
  return conditionalMiddleware(
    (request) => methods.includes(request.method),
    middleware
  )
}

/**
 * Retry middleware with exponential backoff
 */
export function withRetry<T>(
  maxRetries: number = 3,
  baseDelay: number = 1000
): MiddlewareWrapper<T> {
  return (handler: MiddlewareFunction<T>) => {
    return async (request: NextRequest, ...args: any[]) => {
      let lastError: Error
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await handler(request, ...args)
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          
          if (attempt === maxRetries) {
            throw lastError
          }
          
          // Exponential backoff
          const delay = baseDelay * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
      
      throw lastError!
    }
  }
}

/**
 * Timeout middleware
 */
export function withTimeout<T>(
  timeoutMs: number = 30000
): MiddlewareWrapper<T> {
  return (handler: MiddlewareFunction<T>) => {
    return async (request: NextRequest, ...args: any[]) => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
      })
      
      const handlerPromise = handler(request, ...args)
      
      return Promise.race([handlerPromise, timeoutPromise])
    }
  }
}

/**
 * Circuit breaker middleware
 */
export function withCircuitBreaker<T>(
  failureThreshold: number = 5,
  resetTimeout: number = 60000
): MiddlewareWrapper<T> {
  let failureCount = 0
  let lastFailureTime = 0
  let isOpen = false
  
  return (handler: MiddlewareFunction<T>) => {
    return async (request: NextRequest, ...args: any[]) => {
      // Check if circuit is open
      if (isOpen) {
        const now = Date.now()
        if (now - lastFailureTime > resetTimeout) {
          // Reset circuit
          isOpen = false
          failureCount = 0
        } else {
          throw new Error('Circuit breaker is open')
        }
      }
      
      try {
        const result = await handler(request, ...args)
        // Reset failure count on success
        failureCount = 0
        return result
      } catch (error) {
        failureCount++
        lastFailureTime = Date.now()
        
        if (failureCount >= failureThreshold) {
          isOpen = true
        }
        
        throw error
      }
    }
  }
}

/**
 * Metrics middleware for collecting performance data
 */
export function withMetrics<T>(
  metricsCollector?: (metric: { name: string; value: number; tags: Record<string, string> }) => void
): MiddlewareWrapper<T> {
  return (handler: MiddlewareFunction<T>) => {
    return async (request: NextRequest, ...args: any[]) => {
      const startTime = Date.now()
      const startMemory = process.memoryUsage()
      
      try {
        const result = await handler(request, ...args)
        
        // Record success metrics
        const duration = Date.now() - startTime
        const endMemory = process.memoryUsage()
        
        if (metricsCollector) {
          metricsCollector({
            name: 'request_duration',
            value: duration,
            tags: {
              method: request.method,
              path: request.nextUrl.pathname,
              status: result.status.toString(),
              success: 'true'
            }
          })
          
          metricsCollector({
            name: 'memory_usage',
            value: endMemory.heapUsed - startMemory.heapUsed,
            tags: {
              method: request.method,
              path: request.nextUrl.pathname
            }
          })
        }
        
        return result
      } catch (error) {
        // Record error metrics
        const duration = Date.now() - startTime
        
        if (metricsCollector) {
          metricsCollector({
            name: 'request_duration',
            value: duration,
            tags: {
              method: request.method,
              path: request.nextUrl.pathname,
              success: 'false',
              error: error instanceof Error ? error.name : 'Unknown'
            }
          })
        }
        
        throw error
      }
    }
  }
}
