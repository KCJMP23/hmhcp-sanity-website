/**
 * @fileoverview AdminLoadingOverlay Component - Healthcare-compliant loading overlay for page transitions and async operations
 * @module components/admin/ui/loading/AdminLoadingOverlay
 * @since 1.0.0
 */

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { AdminSpinner } from './AdminSpinner'
import { AdminProgressBar } from './AdminProgressBar'

/**
 * Props interface for AdminLoadingOverlay component
 * @interface AdminLoadingOverlayProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
export interface AdminLoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 
   * Show the overlay
   * @required
   */
  isLoading: boolean
  /** 
   * Loading text to display
   * @default 'Loading...'
   */
  text?: string
  /** 
   * Subtext for additional context
   */
  subText?: string
  /** 
   * Show progress bar below spinner
   * @default false
   */
  showProgress?: boolean
  /** 
   * Progress value (0-100)
   * @default 0
   */
  progress?: number
  /** 
   * Blur background behind overlay
   * @default true
   */
  blur?: boolean
  /** 
   * Overlay opacity (0-100)
   * @default 50
   */
  opacity?: number
  /** 
   * Spinner size variant
   * @default 'lg'
   */
  spinnerSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** 
   * Spinner color variant
   * @default 'white'
   */
  spinnerColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'white'
  /** 
   * Full screen overlay mode
   * @default true
   */
  fullScreen?: boolean
  /** 
   * Z-index for overlay stacking
   * @default 50
   */
  zIndex?: number
  /** 
   * Minimum display time in milliseconds (prevents flashing)
   * @default 0
   */
  minDisplayTime?: number
  /** 
   * Show cancel button
   * @default false
   */
  showCancel?: boolean
  /** 
   * Cancel callback function
   */
  onCancel?: () => void
}

/**
 * AdminLoadingOverlay Component
 * 
 * A full-featured loading overlay for healthcare admin interfaces.
 * Provides visual feedback during async operations with optional progress tracking.
 * Supports minimum display time to prevent jarring quick flashes.
 * 
 * @component
 * @param {AdminLoadingOverlayProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {React.ReactElement | null} Rendered overlay or null when not loading
 * 
 * @example
 * // Basic overlay
 * <AdminLoadingOverlay isLoading={isLoading} />
 * 
 * @example
 * // With custom text
 * <AdminLoadingOverlay 
 *   isLoading={isLoading} 
 *   text="Processing patient data..." 
 *   subText="This may take a few moments" 
 * />
 * 
 * @example
 * // With progress bar
 * <AdminLoadingOverlay 
 *   isLoading={isLoading} 
 *   showProgress 
 *   progress={uploadProgress} 
 * />
 * 
 * @example
 * // With cancel button
 * <AdminLoadingOverlay 
 *   isLoading={isLoading} 
 *   showCancel 
 *   onCancel={handleCancel} 
 * />
 * 
 * @example
 * // Minimum display time (prevents flashing)
 * <AdminLoadingOverlay 
 *   isLoading={isLoading} 
 *   minDisplayTime={500} 
 * />
 * 
 * @since 1.0.0
 */
export const AdminLoadingOverlay = React.forwardRef<HTMLDivElement, AdminLoadingOverlayProps>(
  (
    {
      className,
      isLoading,
      text = 'Loading...',
      subText,
      showProgress = false,
      progress = 0,
      blur = true,
      opacity = 50,
      spinnerSize = 'lg',
      spinnerColor = 'white',
      fullScreen = true,
      zIndex = 50,
      minDisplayTime = 0,
      showCancel = false,
      onCancel,
      children,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = useState(false)
    const [displayTimer, setDisplayTimer] = useState<NodeJS.Timeout | null>(null)

    useEffect(() => {
      if (isLoading) {
        setVisible(true)
        if (minDisplayTime > 0) {
          const timer = setTimeout(() => {
            setDisplayTimer(null)
          }, minDisplayTime)
          setDisplayTimer(timer)
        }
      } else {
        if (displayTimer) {
          // Wait for minimum display time
          return
        }
        setVisible(false)
      }

      return () => {
        if (displayTimer) {
          clearTimeout(displayTimer)
        }
      }
    }, [isLoading, minDisplayTime, displayTimer])

    if (!visible) return null

    const overlayContent = (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4 rounded-lg bg-gray-900/90 p-8 shadow-2xl',
          !fullScreen && 'relative'
        )}
      >
        <AdminSpinner size={spinnerSize} color={spinnerColor} />
        
        {text && (
          <div className="text-center">
            <p className="text-lg font-semibold text-white">{text}</p>
            {subText && <p className="mt-1 text-sm text-gray-300">{subText}</p>}
          </div>
        )}

        {showProgress && (
          <div className="w-64">
            <AdminProgressBar
              value={progress}
              color="primary"
              size="sm"
              showLabel
              labelPosition="bottom"
            />
          </div>
        )}

        {showCancel && onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            Cancel
          </button>
        )}
      </div>
    )

    if (fullScreen) {
      return (
        <div
          ref={ref}
          className={cn(
            'fixed inset-0 flex items-center justify-center transition-opacity duration-200',
            blur && 'backdrop-blur-sm',
            className
          )}
          style={{
            zIndex,
            backgroundColor: `rgba(0, 0, 0, ${opacity / 100})`,
          }}
          {...props}
        >
          {overlayContent}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'absolute inset-0 flex items-center justify-center transition-opacity duration-200',
          blur && 'backdrop-blur-sm',
          className
        )}
        style={{
          backgroundColor: `rgba(0, 0, 0, ${opacity / 100})`,
        }}
        {...props}
      >
        {overlayContent}
      </div>
    )
  }
)

AdminLoadingOverlay.displayName = 'AdminLoadingOverlay'

/**
 * Props interface for AdminLoadingState component
 * @interface AdminLoadingStateProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
export interface AdminLoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 
   * Loading state
   * @required
   */
  isLoading: boolean
  /** 
   * Error state (Error object or string)
   */
  error?: Error | string | null
  /** 
   * Empty state (no data available)
   * @default false
   */
  isEmpty?: boolean
  /** 
   * Custom loading component
   */
  loadingComponent?: React.ReactNode
  /** 
   * Custom error component
   */
  errorComponent?: React.ReactNode
  /** 
   * Custom empty state component
   */
  emptyComponent?: React.ReactNode
  /** 
   * Retry callback for error states
   */
  onRetry?: () => void
  /** 
   * Children to render when not loading/error/empty
   * @required
   */
  children: React.ReactNode
}

/**
 * AdminLoadingState Component
 * 
 * A smart wrapper component that handles loading, error, and empty states.
 * Automatically displays appropriate UI based on current state.
 * Simplifies state management in data-fetching components.
 * 
 * @component
 * @param {AdminLoadingStateProps} props - Component props
 * @returns {React.ReactElement} Rendered state-appropriate content
 * 
 * @example
 * // Basic usage
 * <AdminLoadingState isLoading={isLoading} error={error}>
 *   <DataTable data={data} />
 * </AdminLoadingState>
 * 
 * @example
 * // With empty state
 * <AdminLoadingState 
 *   isLoading={isLoading} 
 *   error={error} 
 *   isEmpty={data.length === 0}
 * >
 *   <DataList items={data} />
 * </AdminLoadingState>
 * 
 * @example
 * // With retry functionality
 * <AdminLoadingState 
 *   isLoading={isLoading} 
 *   error={error} 
 *   onRetry={refetch}
 * >
 *   <ContentGrid content={content} />
 * </AdminLoadingState>
 * 
 * @example
 * // Custom components for each state
 * <AdminLoadingState 
 *   isLoading={isLoading}
 *   error={error}
 *   isEmpty={isEmpty}
 *   loadingComponent={<CustomLoader />}
 *   errorComponent={<CustomError />}
 *   emptyComponent={<CustomEmpty />}
 * >
 *   <MainContent />
 * </AdminLoadingState>
 * 
 * @since 1.0.0
 */
export const AdminLoadingState: React.FC<AdminLoadingStateProps> = ({
  isLoading,
  error,
  isEmpty,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
  children,
  className,
  ...props
}) => {
  if (isLoading) {
    return (
      <div className={cn('flex h-64 items-center justify-center', className)} {...props}>
        {loadingComponent || <AdminSpinner size="lg" showLabel label="Loading data..." />}
      </div>
    )
  }

  if (error) {
    const errorMessage = typeof error === 'string' ? error : error.message

    return (
      <div className={cn('flex h-64 items-center justify-center', className)} {...props}>
        {errorComponent || (
          <div className="text-center">
            <div className="mb-4 text-red-600">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Error Loading Data</h3>
            <p className="mt-1 text-sm text-gray-600">{errorMessage}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className={cn('flex h-64 items-center justify-center', className)} {...props}>
        {emptyComponent || (
          <div className="text-center">
            <div className="mb-4 text-gray-400">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No Data Available</h3>
            <p className="mt-1 text-sm text-gray-600">There are no items to display at this time.</p>
          </div>
        )}
      </div>
    )
  }

  return <>{children}</>
}