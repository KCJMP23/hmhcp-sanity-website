'use client'

import React, { ReactNode, useState, useEffect, ErrorInfo } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { FallbackProps } from 'react-error-boundary'

interface ChunkErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  maxRetries?: number
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

function ChunkErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const isChunkError = error.name === 'ChunkLoadError' || 
                      error.message.includes('Loading chunk') ||
                      error.message.includes('ChunkLoadError')

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    resetErrorBoundary()
  }

  const handleReload = () => {
    window.location.reload()
  }

  // Auto-retry for chunk errors
  useEffect(() => {
    if (isChunkError && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        handleRetry()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isChunkError, retryCount, maxRetries])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-red-900 dark:text-blue-100">
            {isChunkError ? 'Loading Error' : 'Something went wrong'}
          </CardTitle>
          <CardDescription>
            {isChunkError 
              ? 'There was an error loading part of the application. This is usually temporary.'
              : 'An unexpected error occurred. Please try again.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {retryCount < maxRetries && (
            <Button 
              onClick={handleRetry}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again ({maxRetries - retryCount} attempts left)
            </Button>
          )}
          
          <Button 
            onClick={handleReload}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Page
          </Button>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                Error Details
              </summary>
              <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto whitespace-pre-wrap">
                {error.toString()}
                {error.stack && `\n\nStack:\n${error.stack}`}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function ChunkErrorBoundary({ 
  children, 
  fallback,
  maxRetries = 3,
  onError
}: ChunkErrorBoundaryProps) {
  const errorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    if (fallback) {
      return <>{fallback}</>
    }
    return <ChunkErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
  }

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Check if it's a ChunkLoadError and log it
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      console.error('ChunkLoadError caught:', error)
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

// Higher-order component for easy wrapping
export function withChunkErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function ChunkErrorBoundaryWrapper(props: P) {
    return (
      <ChunkErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ChunkErrorBoundary>
    )
  }
}