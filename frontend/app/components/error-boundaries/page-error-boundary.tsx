'use client'

import React, { ReactNode, ErrorInfo } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { FallbackProps } from 'react-error-boundary'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCw, Bug, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PageErrorBoundaryProps {
  children: ReactNode
  pageName?: string
  context?: Record<string, any>
  showDebugInfo?: boolean
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  customActions?: {
    label: string
    action: () => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  }[]
}

/**
 * Page-level error boundary with enhanced error reporting and recovery options
 */
export function PageErrorBoundary({ 
  children, 
  pageName,
  showDebugInfo = false,
  onError,
  customActions = []
}: PageErrorBoundaryProps): React.JSX.Element {
  const router = useRouter()

  const handleGoHome = () => {
    router.push('/')
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleReportIssue = () => {
    // Navigate to contact or support page
    router.push('/contact?issue=page-error')
  }

  const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 shadow-xl p-8 text-center">
          {/* Error Icon */}
          <div className="mx-auto mb-6 h-20 w-20 bg-red-100 dark:bg-blue-900/20 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-600 dark:text-blue-400" />
          </div>

          {/* Error Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Oops! Something went wrong
          </h1>
          
          {/* Error Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            {pageName ? (
              <>We encountered an issue loading the <strong>{pageName}</strong> page.</>
            ) : (
              'We encountered an unexpected error while loading this page.'
            )}
            <br />
            <span className="text-sm">
              Don't worry, our team has been notified and is working on a fix.
            </span>
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button
              variant="outline"
              onClick={handleGoHome}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>

            <Button
              variant="outline"
              onClick={handleReportIssue}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Report Issue
            </Button>

            {/* Custom Actions */}
            {customActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                onClick={action.action}
              >
                {action.label}
              </Button>
            ))}
          </div>

          {/* Debug Information (Development/Testing) */}
          {(showDebugInfo || process.env.NODE_ENV === 'development') && error && (
            <details className="text-left bg-gray-50 dark:bg-gray-900 p-4 mb-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="inline-flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Debug Information (Development Mode)
                </span>
              </summary>
              <div className="space-y-3">
                <div>
                  <strong className="text-red-600 dark:text-blue-400">Error:</strong>
                  <pre className="mt-1 text-xs bg-red-50 dark:bg-blue-900/20 p-2 overflow-auto text-red-800 dark:text-blue-200">
                    {error.message}
                  </pre>
                </div>
                {error.stack && (
                  <div>
                    <strong className="text-red-600 dark:text-blue-400">Stack Trace:</strong>
                    <pre className="mt-1 text-xs bg-red-50 dark:bg-blue-900/20 p-2 overflow-auto text-red-800 dark:text-blue-200 font-mono">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Help Text */}
          <div className="text-sm text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-4">
            <p>If this problem persists, please contact our support team.</p>
            <p className="mt-1">
              Error ID: <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 text-xs">
                ERR-{Date.now().toString(36).toUpperCase()}
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )

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
 * HOC to wrap page components with page-level error boundary
 */
export function withPageErrorBoundary<P extends object>(
  PageComponent: React.ComponentType<P>,
  options?: {
    pageName?: string
    showDebugInfo?: boolean
    onError?: (error: Error, errorInfo: ErrorInfo) => void
  }
) {
  const WrappedPage = (props: P) => (
    <PageErrorBoundary
      pageName={options?.pageName}
      showDebugInfo={options?.showDebugInfo}
      onError={options?.onError}
    >
      <PageComponent {...props} />
    </PageErrorBoundary>
  )

  WrappedPage.displayName = `withPageErrorBoundary(${PageComponent.displayName || PageComponent.name || 'Page'})`
  
  return WrappedPage
}