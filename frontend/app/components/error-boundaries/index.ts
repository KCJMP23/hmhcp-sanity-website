// Error Boundary System
// This module provides a comprehensive error boundary system for the application

// Core error boundary (already exists)
export { ErrorBoundary, APIErrorBoundary } from '@/components/error-boundary'

// React Error Boundary utilities
export { withErrorBoundary, useErrorBoundary } from 'react-error-boundary'

// Specialized error boundaries
export {
  AsyncErrorBoundary,
  ComponentLoadingFallback,
  SectionLoadingFallback,
  withAsyncErrorBoundary
} from './async-error-boundary'

export {
  PageErrorBoundary,
  withPageErrorBoundary
} from './page-error-boundary'

export {
  HeavyComponentBoundary,
  withHeavyComponentBoundary,
  ThreeDComponentBoundary,
  ChartComponentBoundary
} from './heavy-component-boundary'

export {
  RouteErrorBoundary,
  withRouteErrorBoundary
} from './route-error-boundary'

export {
  ChunkErrorBoundary,
  withChunkErrorBoundary
} from './chunk-error-boundary'

export {
  GlobalErrorBoundary
} from './global-error-boundary'

// Type definitions for error boundary props
export interface ErrorBoundaryContext {
  componentName?: string
  routeName?: string
  pageName?: string
  boundaryType?: 'page' | 'route' | 'section' | 'component' | 'async' | 'heavy-component' | '3d-component' | 'chart-component'
  retryCount?: number
  [key: string]: any
}

// Error boundary configuration for different use cases
export const ERROR_BOUNDARY_CONFIGS = {
  page: {
    showDebugInfo: process.env.NODE_ENV === 'development'
  },
  route: {
    showBackButton: true
  },
  component: {
    enableRetry: true
  },
  heavyComponent: {
    enableRetry: true,
    enableToggle: true
  },
  async: {
    enableRetry: true
  }
} as const