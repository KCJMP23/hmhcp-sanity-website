'use client'

import React, { Suspense, ReactNode, ErrorInfo } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { LoadingState } from '@/components/animations/loading-state'
import { FallbackProps } from 'react-error-boundary'

interface AsyncErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

/**
 * AsyncErrorBoundary combines React Suspense with ErrorBoundary
 * to handle both loading states and errors for async components
 */
export function AsyncErrorBoundary({
  children,
  fallback,
  loadingFallback,
  onError
}: AsyncErrorBoundaryProps) {
  const errorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    if (fallback) {
      return <>{fallback}</>
    }
    // Default fallback for async components
    return (
      <div className="p-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 rounded-md">
        <p className="text-amber-800 dark:text-amber-200 text-sm">
          Failed to load component. Please try again.
        </p>
        <button
          onClick={resetErrorBoundary}
          className="mt-2 px-3 py-1 bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-sm rounded hover:bg-amber-200 dark:hover:bg-amber-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ErrorBoundary
      onError={onError}
      fallback={errorFallback}
    >
      <Suspense fallback={loadingFallback || <LoadingState />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

/**
 * Lightweight loading fallback for components
 */
export function ComponentLoadingFallback({ 
  message = "Loading component...",
  className = "p-4 flex items-center justify-center min-h-[200px]"
}: { 
  message?: string
  className?: string 
}) {
  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <div className="animate-spin h-4 w-4 border-b-2 border-blue-600" />
        <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
      </div>
    </div>
  )
}

/**
 * Section-level loading fallback
 */
export function SectionLoadingFallback({ 
  title = "Loading section...",
  description = "Please wait while this section loads.",
  className = "p-8 bg-gray-50 dark:bg-gray-900/50 "
}: { 
  title?: string
  description?: string
  className?: string 
}) {
  return (
    <div className={className}>
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-pulse space-y-2 w-full max-w-sm">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 w-1/2"></div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * HOC to wrap async components with error boundary and suspense
 */
export function withAsyncErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    loadingFallback?: ReactNode
    errorFallback?: ReactNode
    onError?: (error: Error, errorInfo: ErrorInfo) => void
  }
) {
  const WrappedComponent = (props: P) => (
    <AsyncErrorBoundary
      loadingFallback={options?.loadingFallback}
      fallback={options?.errorFallback}
      onError={options?.onError}
    >
      <Component {...props} />
    </AsyncErrorBoundary>
  )

  WrappedComponent.displayName = `withAsyncErrorBoundary(${Component.displayName || Component.name || 'Component'})`
  
  return WrappedComponent
}