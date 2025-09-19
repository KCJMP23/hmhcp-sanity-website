'use client'

import React, { Component, ReactNode } from 'react'
import { AdminAlert } from '../ui/notifications/AdminAlert'
import { AdminButton } from '../ui/forms/AdminButton'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary for Admin Components
 * SECURITY FIX: Prevents component crashes from bringing down entire admin interface
 * Provides graceful error handling with user-friendly fallback UI
 */
export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    logger.error('Admin component error boundary triggered', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    })

    // Update state with error details
    this.setState({
      error,
      errorInfo
    })

    // Report to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-4">
            <AdminAlert
              type="error"
              title="Something went wrong"
              message="An unexpected error occurred in the admin interface. The error has been logged and our team has been notified."
            />
            
            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-semibold text-red-800 mb-2">
                  Error Details (Development Only)
                </h4>
                <pre className="text-xs text-red-700 overflow-auto">
                  {this.state.error.toString()}
                </pre>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-red-600 mt-2 overflow-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <AdminButton
                variant="primary"
                onClick={this.handleReset}
              >
                Try Again
              </AdminButton>
              <AdminButton
                variant="outline"
                onClick={() => window.location.href = '/admin'}
              >
                Go to Dashboard
              </AdminButton>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}