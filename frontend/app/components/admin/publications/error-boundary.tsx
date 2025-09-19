/**
 * Error Boundary Component - Story 3.7c Task 4
 * Error boundary for publication components with healthcare compliance
 */

'use client'

import { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, Bug, Shield } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorId?: string
}

export class PublicationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate a unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error for monitoring (without sensitive data)
    const sanitizedError = {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'), // Limit stack trace
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    console.error('Publication Error Boundary:', sanitizedError, errorInfo)
    
    // Call error handler if provided
    this.props.onError?.(error, errorInfo)
    
    // Report to error tracking service (without PHI)
    if (typeof window !== 'undefined') {
      try {
        fetch('/api/admin/error-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...sanitizedError,
            component: 'PublicationInterface',
            severity: 'high'
          })
        }).catch(() => {
          // Silently fail - don't let error reporting cause more errors
        })
      } catch (e) {
        // Silently fail
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="w-full max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Application Error
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <Shield className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>An error occurred while loading this component.</strong>
                <br />
                The error has been reported and will be investigated. No patient data has been compromised.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div className="text-sm">
                <strong>Error ID:</strong> 
                <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                  {this.state.errorId}
                </code>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <strong>What happened?</strong>
                <br />
                A technical error prevented this component from loading properly. 
                This could be due to a temporary network issue, a data formatting problem, 
                or an unexpected system condition.
              </div>
              
              <div className="text-sm text-muted-foreground">
                <strong>What can you do?</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Try refreshing the component using the "Try Again" button</li>
                  <li>If the problem persists, reload the entire page</li>
                  <li>Check your internet connection</li>
                  <li>Contact support if the issue continues</li>
                </ul>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-red-600 hover:text-red-800">
                    <Bug className="inline h-4 w-4 mr-2" />
                    Technical Details (Development Only)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                    <div className="text-red-600 font-semibold">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
            
            <div className="flex items-center gap-3 pt-4">
              <Button
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              
              <Button
                variant="outline"
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Async Error Boundary Hook for function components
 */
export function useAsyncError() {
  const throwError = (error: Error) => {
    throw error
  }
  
  return throwError
}

/**
 * Higher-order component wrapper
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: any) => void
) {
  const WrappedComponent = (props: P) => (
    <PublicationErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </PublicationErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}