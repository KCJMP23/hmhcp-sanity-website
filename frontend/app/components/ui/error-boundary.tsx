'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Bug, Shield } from 'lucide-react'
import { Alert, AlertDescription } from './alert'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

interface Props {
  children: ReactNode
  fallback?: (props: { error: Error; resetError: () => void }) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: null
  }

  public static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Send to monitoring service if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        error_id: this.state.errorId
      })
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Report to backend error tracking
    this.reportError(error, errorInfo)
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          errorInfo: {
            componentStack: errorInfo.componentStack
          },
          errorId: this.state.errorId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null
    })
  }

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium'
    }
    
    if (message.includes('auth') || message.includes('permission')) {
      return 'high'
    }
    
    if (message.includes('security') || message.includes('csrf')) {
      return 'critical'
    }
    
    return 'low'
  }

  private getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50'
      case 'high':
        return 'border-orange-500 bg-orange-50'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50'
      default:
        return 'border-blue-500 bg-blue-50'
    }
  }

  private getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Shield className="h-5 w-5 text-red-600" />
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <Bug className="h-5 w-5 text-blue-600" />
    }
  }

  public render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.resetError
        })
      }

      const severity = this.getErrorSeverity(this.state.error)
      const isProduction = process.env.NODE_ENV === 'production'
      
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className={`w-full max-w-2xl ${this.getSeverityColor(severity)}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {this.getSeverityIcon(severity)}
                <span>Something went wrong</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {severity === 'critical' ? 'Critical Error' :
                       severity === 'high' ? 'High Priority Error' :
                       severity === 'medium' ? 'Service Error' :
                       'Application Error'}
                    </p>
                    
                    <p className="text-sm">
                      {isProduction 
                        ? 'An unexpected error occurred. Our team has been notified.'
                        : this.state.error.message
                      }
                    </p>
                    
                    {this.state.errorId && (
                      <p className="text-xs text-gray-500 font-mono">
                        Error ID: {this.state.errorId}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.resetError}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                
                {severity === 'critical' && (
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/admin/login'}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Re-authenticate
                  </Button>
                )}
              </div>

              {!isProduction && this.state.error.stack && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Show Error Details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40 text-gray-800">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>If this error persists, please contact support with the error ID above.</p>
                {severity === 'critical' && (
                  <p className="text-red-600 font-medium">
                    This may be a security-related issue. Please re-authenticate if the problem continues.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for use with hooks
interface FunctionalErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export function FunctionalErrorBoundary({ 
  children, 
  fallback,
  onError 
}: FunctionalErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={fallback ? () => fallback : undefined}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}

// Hook for manual error reporting
export function useErrorReporting() {
  const reportError = async (error: Error, context?: Record<string, any>) => {
    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  return { reportError }
}