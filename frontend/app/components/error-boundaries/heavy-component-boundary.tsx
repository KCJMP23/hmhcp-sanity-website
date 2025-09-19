'use client'

import React, { ReactNode, Suspense } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { ComponentLoadingFallback } from './async-error-boundary'
import { Button } from '@/components/ui/button'
import { AlertCircle, RotateCcw, Eye, EyeOff } from 'lucide-react'

interface HeavyComponentBoundaryProps {
  children: ReactNode
  componentName?: string
  loadingMessage?: string
  fallbackComponent?: ReactNode
  enableRetry?: boolean
  enableToggle?: boolean
}

/**
 * Error boundary specifically designed for heavy components like 3D models,
 * charts, or other resource-intensive components that might fail to load
 */
export function HeavyComponentBoundary({
  children,
  componentName = 'Component',
  loadingMessage,
  fallbackComponent,
  enableRetry = true,
  enableToggle = false
}: HeavyComponentBoundaryProps) {
  const [isVisible, setIsVisible] = React.useState(true)
  const [retryKey, setRetryKey] = React.useState(0)

  const handleRetry = () => {
    setRetryKey(prev => prev + 1)
  }

  const handleToggleVisibility = () => {
    setIsVisible(prev => !prev)
  }

  const errorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
    // Check if it's a resource loading error
    const isResourceError = error.message.includes('Loading') || 
                           error.message.includes('fetch') ||
                           error.message.includes('Network') ||
                           error.message.includes('ChunkLoadError')

    const isRenderError = error.message.includes('render') ||
                         error.message.includes('hook') ||
                         error.name === 'ChunkLoadError'

    return (
      <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {componentName} Failed to Load
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              {isResourceError && (
                <p>This component couldn't load due to a network or resource issue.</p>
              )}
              {isRenderError && (
                <p>This component encountered a rendering error.</p>
              )}
              {!isResourceError && !isRenderError && (
                <p>This component encountered an unexpected error.</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {enableRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleRetry()
                    resetErrorBoundary()
                  }}
                  className="flex items-center gap-1 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800/20"
                >
                  <RotateCcw className="h-3 w-3" />
                  Retry
                </Button>
              )}
              
              {enableToggle && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleVisibility}
                  className="flex items-center gap-1 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800/20"
                >
                  {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {isVisible ? 'Hide' : 'Show'}
                </Button>
              )}
            </div>

            {/* Fallback component if provided */}
            {fallbackComponent && (
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 border">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Fallback content:
                </p>
                {fallbackComponent}
              </div>
            )}

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
                  Show error details (development)
                </summary>
                <pre className="mt-2 text-xs bg-blue-100 dark:bg-blue-900/20 p-2 overflow-auto whitespace-pre-wrap">
                  {error.message}
                  {error.stack && `\n\nStack:\n${error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    )
  }

  const loadingFallback = (
    <ComponentLoadingFallback 
      message={loadingMessage || `Loading ${componentName}...`}
    />
  )

  if (!isVisible) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {componentName} is hidden
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleToggleVisibility}
          className="flex items-center gap-1"
        >
          <Eye className="h-3 w-3" />
          Show {componentName}
        </Button>
      </div>
    )
  }

  return (
    <ErrorBoundary
      key={retryKey}
      fallback={errorFallback}
    >
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

/**
 * HOC for wrapping heavy components with error boundary and loading states
 */
export function withHeavyComponentBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    componentName?: string
    loadingMessage?: string
    fallbackComponent?: ReactNode
    enableRetry?: boolean
    enableToggle?: boolean
  }
) {
  const WrappedComponent = (props: P) => (
    <HeavyComponentBoundary
      componentName={options?.componentName || Component.displayName || Component.name}
      loadingMessage={options?.loadingMessage}
      fallbackComponent={options?.fallbackComponent}
      enableRetry={options?.enableRetry}
      enableToggle={options?.enableToggle}
    >
      <Component {...props} />
    </HeavyComponentBoundary>
  )

  WrappedComponent.displayName = `withHeavyComponentBoundary(${Component.displayName || Component.name || 'Component'})`
  
  return WrappedComponent
}

/**
 * Special boundary for 3D components that might have WebGL issues
 */
export function ThreeDComponentBoundary({ children, ...props }: HeavyComponentBoundaryProps) {
  return (
    <HeavyComponentBoundary
      {...props}
      componentName={props.componentName || '3D Component'}
    >
      {children}
    </HeavyComponentBoundary>
  )
}

/**
 * Special boundary for chart components that might have data/rendering issues
 */
export function ChartComponentBoundary({ children, ...props }: HeavyComponentBoundaryProps) {
  return (
    <HeavyComponentBoundary
      {...props}
      componentName={props.componentName || 'Chart Component'}
    >
      {children}
    </HeavyComponentBoundary>
  )
}