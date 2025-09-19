/**
 * Admin Error Boundary Components for HMHCP
 * 
 * Provides hierarchical error boundaries with:
 * - HIPAA-compliant error display
 * - User-friendly error recovery options
 * - Automatic error reporting
 * - Graceful degradation for critical admin functionality
 */

'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, AlertTriangle, Home, ChevronDown, ChevronRight } from 'lucide-react'
import { handleClientError, type PublicErrorResponse } from '@/lib/error-handling/error-handler'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  showDetails: boolean
  retryCount: number
  publicError: PublicErrorResponse | null
}

interface BaseErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
  isolate?: boolean
}

/**
 * Base Error Boundary with comprehensive error handling
 */
class BaseErrorBoundary extends Component<BaseErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: BaseErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false,
      retryCount: 0,
      publicError: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = crypto.randomUUID()
    
    // Process error through our centralized handler
    const publicError = handleClientError(error, {
      correlationId: errorId,
      endpoint: 'admin-component',
      method: 'component-render',
      ipAddress: 'client'
    })
    
    return {
      hasError: true,
      error,
      errorId,
      publicError
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Admin Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }

    // Report error to monitoring service
    this.reportError(error, errorInfo)
  }

  componentDidUpdate(prevProps: BaseErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props
    const { hasError } = this.state

    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => key !== (prevProps.resetKeys?.[index])
        )
        
        if (hasResetKeyChanged) {
          this.resetErrorBoundary()
        }
      }
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In production, this would send to error tracking service
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(), // Get from auth context
        retryCount: this.state.retryCount
      }

      console.log('Error reported:', errorReport)
      
      // TODO: Send to actual error tracking service
      // await fetch('/api/admin/errors/report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private getUserId = (): string | undefined => {
    // This would typically come from an auth context
    // For now, return undefined
    return undefined
  }

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false,
      publicError: null
    })
  }

  private handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1
    
    this.setState({
      retryCount: newRetryCount
    })

    // Add exponential backoff for retries
    const backoffDelay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 10000)
    
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary()
    }, backoffDelay)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/admin'
  }

  private toggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails
    }))
  }

  render() {
    const { hasError, error, errorInfo, showDetails, retryCount, publicError } = this.state
    const { children, fallback, isolate } = this.props

    if (hasError) {
      if (fallback) {
        return fallback
      }

      return (
        <ErrorDisplay
          error={error}
          errorInfo={errorInfo}
          publicError={publicError}
          showDetails={showDetails}
          retryCount={retryCount}
          isolate={isolate}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
          onToggleDetails={this.toggleDetails}
        />
      )
    }

    return children
  }
}

/**
 * Error Display Component
 */
interface ErrorDisplayProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  publicError: PublicErrorResponse | null
  showDetails: boolean
  retryCount: number
  isolate?: boolean
  onRetry: () => void
  onReload: () => void
  onGoHome: () => void
  onToggleDetails: () => void
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  errorInfo,
  publicError,
  showDetails,
  retryCount,
  isolate = false,
  onRetry,
  onReload,
  onGoHome,
  onToggleDetails
}) => {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  const getRetryButtonText = () => {
    if (retryCount === 0) return 'Try Again'
    if (retryCount < 3) return `Retry (${retryCount})`
    return 'Retry (Max Attempts)'
  }

  const showRetryButton = publicError?.retryable && retryCount < 3

  return (
    <div className={`error-boundary-container ${isolate ? 'p-4' : 'min-h-[400px] flex items-center justify-center p-4'}`}>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-6 w-6 ${publicError?.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />
            <div>
              <CardTitle>
                {publicError?.severity === 'critical' 
                  ? 'Critical System Error' 
                  : 'Something went wrong'
                }
              </CardTitle>
              <CardDescription>
                {publicError?.userMessage || 'An unexpected error occurred while processing your request.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Summary */}
          <Alert variant={getSeverityColor(publicError?.severity) as any}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <div><strong>Error ID:</strong> <code className="text-xs">{publicError?.correlationId}</code></div>
                <div><strong>Time:</strong> {publicError?.timestamp ? new Date(publicError.timestamp).toLocaleString() : 'Unknown'}</div>
                <div><strong>Category:</strong> <span className="capitalize">{publicError?.category?.replace('_', ' ')}</span></div>
                {publicError?.retryable && (
                  <div className="text-sm text-muted-foreground">
                    This error can be resolved by trying again.
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Support Information */}
          {publicError?.supportInfo && (
            <Alert>
              <AlertTitle>Need Help?</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  {publicError.supportInfo.expectedResolution && (
                    <div><strong>Expected Resolution:</strong> {publicError.supportInfo.expectedResolution}</div>
                  )}
                  {publicError.supportInfo.contactSupport && (
                    <div className="text-sm text-red-600 font-medium">
                      Please contact support with the Error ID above.
                    </div>
                  )}
                  {publicError.supportInfo.documentationUrl && (
                    <div>
                      <a 
                        href={publicError.supportInfo.documentationUrl}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View troubleshooting documentation
                      </a>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Technical Details (Development/Admin Only) */}
          {(process.env.NODE_ENV === 'development' || showDetails) && error && (
            <div className="border rounded-lg p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDetails}
                className="mb-3 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
              >
                {showDetails ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Hide Technical Details
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Show Technical Details
                  </>
                )}
              </Button>

              {showDetails && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Error Message</h4>
                    <code className="block text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded whitespace-pre-wrap">
                      {error.message}
                    </code>
                  </div>
                  
                  {error.stack && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Stack Trace</h4>
                      <code className="block text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {error.stack}
                      </code>
                    </div>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Component Stack</h4>
                      <code className="block text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {errorInfo.componentStack}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2">
          {showRetryButton && (
            <Button 
              onClick={onRetry} 
              variant="default"
              disabled={retryCount >= 3}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {getRetryButtonText()}
            </Button>
          )}
          
          <Button onClick={onReload} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
          
          {!isolate && (
            <Button onClick={onGoHome} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Go to Admin Home
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

/**
 * Page-level Error Boundary for admin routes
 */
export const AdminPageErrorBoundary: React.FC<{
  children: ReactNode
  fallback?: ReactNode
}> = ({ children, fallback }) => (
  <BaseErrorBoundary
    fallback={fallback}
    isolate={false}
    resetOnPropsChange={true}
  >
    {children}
  </BaseErrorBoundary>
)

/**
 * Component-level Error Boundary for individual admin components
 */
export const AdminComponentErrorBoundary: React.FC<{
  children: ReactNode
  fallback?: ReactNode
  componentName?: string
}> = ({ children, fallback, componentName }) => (
  <BaseErrorBoundary
    fallback={fallback}
    isolate={true}
    onError={(error, errorInfo) => {
      console.error(`Error in ${componentName || 'Admin Component'}:`, error, errorInfo)
    }}
  >
    {children}
  </BaseErrorBoundary>
)

/**
 * Critical Function Error Boundary with minimal fallback
 */
export const AdminCriticalErrorBoundary: React.FC<{
  children: ReactNode
  fallback: ReactNode
}> = ({ children, fallback }) => (
  <BaseErrorBoundary fallback={fallback} isolate={true}>
    {children}
  </BaseErrorBoundary>
)

/**
 * Data Loading Error Boundary with retry capability
 */
export const AdminDataErrorBoundary: React.FC<{
  children: ReactNode
  dataSource: string
  resetKeys?: Array<string | number>
}> = ({ children, dataSource, resetKeys }) => (
  <BaseErrorBoundary
    resetOnPropsChange={true}
    resetKeys={resetKeys}
    onError={(error) => {
      console.error(`Data loading error for ${dataSource}:`, error)
    }}
  >
    {children}
  </BaseErrorBoundary>
)

/**
 * Hook for manually triggering error boundary reset
 */
export function useErrorBoundary() {
  return React.useCallback((error: Error) => {
    throw error
  }, [])
}

export default BaseErrorBoundary