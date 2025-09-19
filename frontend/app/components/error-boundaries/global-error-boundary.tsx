'use client'

import React, { ReactNode, useState, ErrorInfo } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { FallbackProps } from 'react-error-boundary'

interface GlobalErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

function isChunkLoadError(error: Error): boolean {
  const message = error.message || error.toString()
  return (
    message.includes('Loading chunk') ||
    message.includes('ChunkLoadError') ||
    message.includes('Cannot read properties of undefined (reading \'call\')') ||
    message.includes('Failed to fetch dynamically imported module')
  )
}

function logErrorToService(error: Error, errorInfo: ErrorInfo) {
  // In production, you would send this to your error reporting service
  console.error('Production error:', {
    error: error.toString(),
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString()
  })
}

function GlobalErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    resetErrorBoundary()
  }

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 shadow-lg p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-blue-900/20">
            <svg className="w-8 h-8 text-red-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            {error?.message === 'ChunkLoadError' || isChunkLoadError(error)
              ? 'There was a problem loading application resources. This might be due to a network issue or outdated cache.'
              : 'An unexpected error occurred. We apologize for the inconvenience.'}
          </p>

          <div className="space-y-3">
            {retryCount < maxRetries && (
              <button
                onClick={handleRetry}
                className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
            )}
            
            <button
              onClick={handleReload}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Reload Page
            </button>

            <button
              onClick={handleGoHome}
              className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Go to Homepage
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                Error Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 text-xs font-mono overflow-auto">
                <p className="text-red-600 dark:text-blue-400 mb-2">{error.toString()}</p>
                {error.stack && (
                  <pre className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

export function GlobalErrorBoundary({ 
  children, 
  fallback,
  onError
}: GlobalErrorBoundaryProps) {
  const errorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    if (fallback) {
      return <>{fallback}</>
    }
    return <GlobalErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
  }

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('GlobalErrorBoundary caught an error:', error, errorInfo)
    
    // Check if it's a chunk loading error
    if (isChunkLoadError(error)) {
      // Let ChunkErrorHandler handle it
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unhandledrejection', {
          detail: { reason: error }
        }))
      }
    } else {
      // Log to error reporting service in production
      if (process.env.NODE_ENV === 'production') {
        logErrorToService(error, errorInfo)
      }
    }
    
    if (onError) {
      onError(error, errorInfo)
    }
  }

  return (
    <ErrorBoundary
      fallback={errorFallback}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  )
}