'use client'

import React, { ReactNode, ErrorInfo } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft, Home, RotateCcw } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { FallbackProps } from 'react-error-boundary'

interface RouteErrorBoundaryProps {
  children: ReactNode
  routeName?: string
  fallbackRoute?: string
  showBackButton?: boolean
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

/**
 * Route-level error boundary for handling navigation and route-specific errors
 */
export function RouteErrorBoundary({
  children,
  routeName,
  fallbackRoute = '/',
  showBackButton = true,
  onError
}: RouteErrorBoundaryProps) {
  const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    const router = useRouter()
    const pathname = usePathname()

    const handleGoBack = () => {
      if (window.history.length > 1) {
        router.back()
      } else {
        router.push(fallbackRoute)
      }
    }

    const handleGoHome = () => {
      router.push('/')
    }

    const handleRetry = () => {
      resetErrorBoundary()
      window.location.reload()
    }

    // Detect route-specific error types
    const isNotFoundError = error.message.includes('404') || 
                           error.message.includes('Not Found') ||
                           error.message.includes('NOTFOUND')
    
    const isAuthError = error.message.includes('unauthorized') ||
                       error.message.includes('Unauthorized') ||
                       error.message.includes('403') ||
                       error.message.includes('401')

    const isNetworkError = error.message.includes('fetch') ||
                          error.message.includes('Network') ||
                          error.message.includes('ERR_NETWORK')

    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4">
              <AlertTriangle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isNotFoundError && 'Page Not Found'}
            {isAuthError && 'Access Denied'}
            {isNetworkError && 'Connection Error'}
            {!isNotFoundError && !isAuthError && !isNetworkError && 'Route Error'}
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {isNotFoundError && "The page you're looking for doesn't exist or has been moved."}
            {isAuthError && "You don't have permission to access this page."}
            {isNetworkError && "There was a problem connecting to the server."}
            {!isNotFoundError && !isAuthError && !isNetworkError && 
              `There was an error loading ${routeName || 'this page'}.`
            }
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            {showBackButton && (
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            )}

            <Button
              onClick={handleGoHome}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>

            {!isNotFoundError && (
              <Button
                variant="outline"
                onClick={handleRetry}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </div>

          {/* Current route info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3">
            <p>Current path: <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5">{pathname}</code></p>
            {routeName && <p className="mt-1">Route: {routeName}</p>}
          </div>

          {/* Development error details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Route error details (development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 overflow-auto whitespace-pre-wrap">
                Error: {error.message}
                {error.stack && `\n\nStack:\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary
      fallback={ErrorFallback}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * HOC for wrapping route components with route error boundary
 */
export function withRouteErrorBoundary<P extends object>(
  RouteComponent: React.ComponentType<P>,
  options?: {
    routeName?: string
    fallbackRoute?: string
    showBackButton?: boolean
    onError?: (error: Error, errorInfo: ErrorInfo) => void
  }
) {
  const WrappedRoute = (props: P) => (
    <RouteErrorBoundary
      routeName={options?.routeName}
      fallbackRoute={options?.fallbackRoute}
      showBackButton={options?.showBackButton}
      onError={options?.onError}
    >
      <RouteComponent {...props} />
    </RouteErrorBoundary>
  )

  WrappedRoute.displayName = `withRouteErrorBoundary(${RouteComponent.displayName || RouteComponent.name || 'Route'})`
  
  return WrappedRoute
}