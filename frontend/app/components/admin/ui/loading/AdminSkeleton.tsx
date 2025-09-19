/**
 * @fileoverview AdminSkeleton Component - Healthcare-compliant skeleton loader for content placeholders
 * @module components/admin/ui/loading/AdminSkeleton
 * @since 1.0.0
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Skeleton variant configuration using class-variance-authority
 * Provides different skeleton shapes and animation styles
 * @private
 */
const skeletonVariants = cva(
  'animate-pulse rounded-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
  {
    variants: {
      variant: {
        text: 'h-4 w-full',
        title: 'h-8 w-3/4',
        paragraph: 'h-20 w-full',
        avatar: 'h-12 w-12 rounded-full',
        thumbnail: 'h-24 w-24 rounded-lg',
        card: 'h-48 w-full rounded-lg',
        button: 'h-10 w-32 rounded-md',
        input: 'h-10 w-full rounded-md',
        badge: 'h-6 w-20 rounded-full',
      },
      animation: {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer',
        none: '',
      },
    },
    defaultVariants: {
      variant: 'text',
      animation: 'pulse',
    },
  }
)

/**
 * Props interface for AdminSkeleton component
 * @interface AdminSkeletonProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 * @extends {VariantProps<typeof skeletonVariants>}
 */
export interface AdminSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /** 
   * Number of skeleton lines to render (for text variant)
   * @default 1
   */
  lines?: number
  /** 
   * Custom width (CSS value or number in pixels)
   */
  width?: string | number
  /** 
   * Custom height (CSS value or number in pixels)
   */
  height?: string | number
  /** 
   * Show container border
   * @default false
   */
  bordered?: boolean
}

/**
 * AdminSkeleton Component
 * 
 * A versatile skeleton loader component for healthcare admin interfaces.
 * Provides placeholder animations while content is loading.
 * Supports multiple variants for different content types.
 * 
 * @component
 * @param {AdminSkeletonProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {React.ReactElement} Rendered skeleton component
 * 
 * @example
 * // Basic text skeleton
 * <AdminSkeleton variant="text" />
 * 
 * @example
 * // Multiple text lines
 * <AdminSkeleton variant="text" lines={3} />
 * 
 * @example
 * // Avatar skeleton
 * <AdminSkeleton variant="avatar" />
 * 
 * @example
 * // Card skeleton with custom dimensions
 * <AdminSkeleton variant="card" width="300px" height="200px" />
 * 
 * @example
 * // Text skeleton with border
 * <AdminSkeleton variant="paragraph" bordered />
 * 
 * @since 1.0.0
 */
export const AdminSkeleton = React.forwardRef<HTMLDivElement, AdminSkeletonProps>(
  (
    {
      className,
      variant,
      animation,
      lines = 1,
      width,
      height,
      bordered = false,
      style,
      ...props
    },
    ref
  ) => {
    const customStyle: React.CSSProperties = {
      ...style,
      width: width,
      height: height,
    }

    if (variant === 'text' && lines > 1) {
      return (
        <div
          ref={ref}
          className={cn('space-y-2', bordered && 'rounded-lg border p-4', className)}
          {...props}
        >
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                skeletonVariants({ variant, animation }),
                index === lines - 1 && 'w-4/5'
              )}
              style={customStyle}
            />
          ))}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          skeletonVariants({ variant, animation }),
          bordered && 'border',
          className
        )}
        style={customStyle}
        {...props}
      />
    )
  }
)

AdminSkeleton.displayName = 'AdminSkeleton'

/**
 * Composite skeleton components for common layouts
 * @section Composite Components
 */

/**
 * Props interface for AdminSkeletonCard component
 * @interface AdminSkeletonCardProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
export interface AdminSkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 
   * Show avatar skeleton in card header
   * @default true
   */
  showAvatar?: boolean
  /** 
   * Show action buttons skeleton
   * @default true
   */
  showActions?: boolean
}

/**
 * AdminSkeletonCard Component
 * 
 * Pre-composed skeleton card layout for consistent loading states.
 * Includes avatar, title, content, and action areas.
 * 
 * @component
 * @param {AdminSkeletonCardProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {React.ReactElement} Rendered skeleton card
 * 
 * @example
 * // Full card skeleton
 * <AdminSkeletonCard />
 * 
 * @example
 * // Card without avatar
 * <AdminSkeletonCard showAvatar={false} />
 * 
 * @example
 * // Card without actions
 * <AdminSkeletonCard showActions={false} />
 * 
 * @since 1.0.0
 */
export const AdminSkeletonCard = React.forwardRef<HTMLDivElement, AdminSkeletonCardProps>(
  ({ className, showAvatar = true, showActions = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('rounded-lg border bg-white p-6 shadow-sm', className)}
        {...props}
      >
        {showAvatar && (
          <div className="mb-4 flex items-center gap-4">
            <AdminSkeleton variant="avatar" />
            <div className="flex-1 space-y-2">
              <AdminSkeleton variant="text" width="40%" />
              <AdminSkeleton variant="text" width="60%" />
            </div>
          </div>
        )}
        <div className="space-y-3">
          <AdminSkeleton variant="title" />
          <AdminSkeleton variant="text" lines={3} />
        </div>
        {showActions && (
          <div className="mt-4 flex gap-2">
            <AdminSkeleton variant="button" />
            <AdminSkeleton variant="button" width="24" />
          </div>
        )}
      </div>
    )
  }
)

AdminSkeletonCard.displayName = 'AdminSkeletonCard'

/**
 * Props interface for AdminSkeletonTable component
 * @interface AdminSkeletonTableProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
export interface AdminSkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 
   * Number of rows to display
   * @default 5
   */
  rows?: number
  /** 
   * Number of columns to display
   * @default 4
   */
  columns?: number
  /** 
   * Show table header skeleton
   * @default true
   */
  showHeader?: boolean
}

/**
 * AdminSkeletonTable Component
 * 
 * Pre-composed skeleton table layout for tabular data loading states.
 * Configurable rows and columns with optional header.
 * 
 * @component
 * @param {AdminSkeletonTableProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {React.ReactElement} Rendered skeleton table
 * 
 * @example
 * // Default table skeleton (5 rows, 4 columns)
 * <AdminSkeletonTable />
 * 
 * @example
 * // Custom dimensions
 * <AdminSkeletonTable rows={10} columns={6} />
 * 
 * @example
 * // Table without header
 * <AdminSkeletonTable showHeader={false} />
 * 
 * @since 1.0.0
 */
export const AdminSkeletonTable = React.forwardRef<HTMLDivElement, AdminSkeletonTableProps>(
  ({ className, rows = 5, columns = 4, showHeader = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('w-full overflow-hidden rounded-lg border', className)}
        {...props}
      >
        {showHeader && (
          <div className="border-b bg-gray-50 p-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, index) => (
                <AdminSkeleton
                  key={`header-${index}`}
                  variant="text"
                  width={`${100 / columns}%`}
                />
              ))}
            </div>
          </div>
        )}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex gap-4 p-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <AdminSkeleton
                  key={`cell-${rowIndex}-${colIndex}`}
                  variant="text"
                  width={`${100 / columns}%`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }
)

AdminSkeletonTable.displayName = 'AdminSkeletonTable'

/**
 * Props interface for AdminSkeletonForm component
 * @interface AdminSkeletonFormProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
export interface AdminSkeletonFormProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 
   * Number of form fields to display
   * @default 4
   */
  fields?: number
  /** 
   * Show field labels skeleton
   * @default true
   */
  showLabels?: boolean
}

/**
 * AdminSkeletonForm Component
 * 
 * Pre-composed skeleton form layout for form loading states.
 * Includes field labels, inputs, and submit buttons.
 * 
 * @component
 * @param {AdminSkeletonFormProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {React.ReactElement} Rendered skeleton form
 * 
 * @example
 * // Default form skeleton (4 fields)
 * <AdminSkeletonForm />
 * 
 * @example
 * // Form with more fields
 * <AdminSkeletonForm fields={6} />
 * 
 * @example
 * // Form without labels
 * <AdminSkeletonForm showLabels={false} />
 * 
 * @since 1.0.0
 */
export const AdminSkeletonForm = React.forwardRef<HTMLDivElement, AdminSkeletonFormProps>(
  ({ className, fields = 4, showLabels = true, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-6', className)} {...props}>
        {Array.from({ length: fields }).map((_, index) => (
          <div key={`field-${index}`} className="space-y-2">
            {showLabels && <AdminSkeleton variant="text" width="30%" height="20px" />}
            <AdminSkeleton variant="input" />
          </div>
        ))}
        <div className="flex gap-2 pt-4">
          <AdminSkeleton variant="button" />
          <AdminSkeleton variant="button" width="100px" />
        </div>
      </div>
    )
  }
)

AdminSkeletonForm.displayName = 'AdminSkeletonForm'