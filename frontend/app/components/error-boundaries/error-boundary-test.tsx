'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  ErrorBoundary, 
  PageErrorBoundary,
  RouteErrorBoundary,
  HeavyComponentBoundary,
  AsyncErrorBoundary 
} from '@/components/error-boundaries'

/**
 * Test component to verify error boundary functionality
 * Only available in development mode
 */

// Component that throws an error on command
function ErrorThrowingComponent({ 
  errorType = 'render',
  delay = 0 
}: { 
  errorType?: 'render' | 'async' | 'timeout' | 'network' | 'resource'
  delay?: number 
}) {
  const [shouldError, setShouldError] = useState(false)

  React.useEffect(() => {
    if (shouldError && delay > 0) {
      const timer = setTimeout(() => {
        throw new Error(`Delayed ${errorType} error after ${delay}ms`)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [shouldError, delay, errorType])

  if (shouldError && delay === 0) {
    if (errorType === 'render') {
      throw new Error('Test render error')
    }
    if (errorType === 'async') {
      Promise.reject(new Error('Test async error'))
      throw new Error('Test async error')
    }
    if (errorType === 'timeout') {
      throw new Error('Test timeout error')
    }
    if (errorType === 'network') {
      throw new Error('Test network error: fetch failed')
    }
    if (errorType === 'resource') {
      throw new Error('Test resource loading error: ChunkLoadError')
    }
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
      <p className="text-blue-600 dark:text-blue-200 mb-2">
        Component is working normally
      </p>
      <Button
        onClick={() => setShouldError(true)}
        variant="destructive"
        size="sm"
      >
        Trigger {errorType} Error
      </Button>
    </div>
  )
}

interface ErrorBoundaryTestProps {
  boundaryType: 'basic' | 'page' | 'route' | 'heavy' | 'async'
}

export function ErrorBoundaryTest({ boundaryType }: ErrorBoundaryTestProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const renderWithBoundary = () => {
    const testComponent = (
      <div className="space-y-4">
        <ErrorThrowingComponent errorType="render" />
        <ErrorThrowingComponent errorType="async" delay={1000} />
        <ErrorThrowingComponent errorType="network" />
        <ErrorThrowingComponent errorType="resource" />
      </div>
    )

    switch (boundaryType) {
      case 'basic':
        return (
          <ErrorBoundary>
            {testComponent}
          </ErrorBoundary>
        )
      
      case 'page':
        return (
          <PageErrorBoundary pageName="Test Page">
            {testComponent}
          </PageErrorBoundary>
        )
      
      case 'route':
        return (
          <RouteErrorBoundary routeName="Test Route">
            {testComponent}
          </RouteErrorBoundary>
        )
      
      case 'heavy':
        return (
          <HeavyComponentBoundary 
            componentName="Test Heavy Component"
            enableRetry={true}
            enableToggle={true}
          >
            {testComponent}
          </HeavyComponentBoundary>
        )
      
      case 'async':
        return (
          <AsyncErrorBoundary>
            {testComponent}
          </AsyncErrorBoundary>
        )
      
      default:
        return testComponent
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Error Boundary Test - {boundaryType}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Test different error scenarios to verify error boundary functionality.
          This component is only visible in development mode.
        </p>
      </div>
      
      {renderWithBoundary()}
    </div>
  )
}

/**
 * Complete error boundary test suite
 */
export function ErrorBoundaryTestSuite() {
  const [activeTest, setActiveTest] = useState<string | null>(null)

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const testCases = [
    { id: 'basic', label: 'Basic Error Boundary', type: 'basic' as const },
    { id: 'page', label: 'Page Error Boundary', type: 'page' as const },
    { id: 'route', label: 'Route Error Boundary', type: 'route' as const },
    { id: 'heavy', label: 'Heavy Component Boundary', type: 'heavy' as const },
    { id: 'async', label: 'Async Error Boundary', type: 'async' as const },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Error Boundary Test Suite
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Development-only component for testing error boundary implementations
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testCases.map((testCase) => (
          <Button
            key={testCase.id}
            onClick={() => setActiveTest(testCase.id)}
            variant={activeTest === testCase.id ? "default" : "outline"}
            className="h-auto p-4 flex flex-col items-center space-y-2"
          >
            <span className="font-medium">{testCase.label}</span>
            <span className="text-xs opacity-70">Click to test</span>
          </Button>
        ))}
      </div>
      
      {activeTest && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Testing: {testCases.find(t => t.id === activeTest)?.label}
            </h2>
            <Button
              onClick={() => setActiveTest(null)}
              variant="outline"
              size="sm"
            >
              Clear Test
            </Button>
          </div>
          
          <ErrorBoundaryTest 
            boundaryType={testCases.find(t => t.id === activeTest)?.type || 'basic'} 
          />
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Test Instructions:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Select a test case above to load the error boundary</li>
          <li>• Click any "Trigger Error" button to test error handling</li>
          <li>• Observe how each boundary type handles errors differently</li>
          <li>• Check browser console for error reporting</li>
          <li>• Test retry functionality where available</li>
        </ul>
      </div>
    </div>
  )
}