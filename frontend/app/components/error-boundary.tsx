'use client'

import React, { ErrorInfo } from 'react'
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<FallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

function DefaultErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h2>
        
        <p className="text-gray-600 mb-6">
          We're sorry, but something unexpected happened. Please try again.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
            <p className="text-sm font-mono text-gray-700 break-all">
              {error.message}
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={resetErrorBoundary} size="sm" className="rounded-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Link href="/">
            <Button variant="outline" size="sm" className="rounded-full w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary 
      FallbackComponent={fallback || DefaultErrorFallback}
      onError={onError}
    >
      {children}
    </ReactErrorBoundary>
  )
}

// Specialized error boundaries for different components

export function APIErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary 
      fallback={APIErrorFallback}
      onError={(error) => {
        console.error('API Error:', error)
        // Could send to monitoring service
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

function APIErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-6 border border-red-200 rounded-lg bg-red-50">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800">
            Failed to load data
          </h3>
          <p className="text-sm text-red-700 mt-1">
            We couldn't fetch the latest information. Please check your connection and try again.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-red-600 mt-2 font-mono">
              {error.message}
            </p>
          )}
          <Button 
            onClick={resetErrorBoundary} 
            size="sm" 
            variant="outline" 
            className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  )
}