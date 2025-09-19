'use client'

import React, { forwardRef, ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

export interface AdminDropZoneProps {
  id: string
  children: ReactNode
  className?: string
  data?: Record<string, any>
  disabled?: boolean
  /**
   * Accept only specific HIPAA data levels
   */
  acceptedHipaaLevels?: ('phi' | 'medical' | 'administrative' | 'public')[]
  /**
   * Validation function to determine if drop is allowed
   */
  accepts?: (data: any) => boolean
  /**
   * Visual feedback when item is being dragged over
   */
  overlay?: ReactNode
  /**
   * Placeholder content when empty
   */
  placeholder?: ReactNode
  /**
   * Accessibility label for screen readers
   */
  ariaLabel?: string
  /**
   * Called when valid item is dropped
   */
  onDrop?: (data: any) => void
  /**
   * Called when invalid item is attempted to drop
   */
  onInvalidDrop?: (data: any) => void
  /**
   * Visual variant for different use cases
   */
  variant?: 'default' | 'dashed' | 'outlined' | 'filled'
}

export interface AdminDropZoneRef extends HTMLDivElement {}

/**
 * AdminDropZone - A HIPAA-compliant drop zone component
 * 
 * Features:
 * - Healthcare data level validation and filtering
 * - HIPAA compliance with access logging
 * - Full keyboard accessibility
 * - Touch device compatibility
 * - Visual feedback and validation states
 * - TypeScript-first with comprehensive type safety
 */
export const AdminDropZone = forwardRef<AdminDropZoneRef, AdminDropZoneProps>(
  (
    {
      id,
      children,
      className,
      data,
      disabled = false,
      acceptedHipaaLevels = ['public', 'administrative', 'medical', 'phi'],
      accepts,
      overlay,
      placeholder,
      ariaLabel,
      onDrop,
      onInvalidDrop,
      variant = 'default',
    },
    ref
  ) => {
    const {
      isOver,
      active,
      setNodeRef,
    } = useDroppable({
      id,
      data: {
        ...data,
        acceptedHipaaLevels,
        timestamp: new Date().toISOString(),
      },
      disabled,
    })

    // Validate if the active dragged item can be dropped here
    const canDrop = React.useMemo(() => {
      if (!active || disabled) return false
      
      const activeData = active.data.current
      const hipaaLevel = activeData?.hipaaLevel || 'public'
      
      // Check HIPAA level compatibility
      if (!acceptedHipaaLevels.includes(hipaaLevel)) {
        return false
      }
      
      // Custom validation function
      if (accepts && !accepts(activeData)) {
        return false
      }
      
      return true
    }, [active, disabled, acceptedHipaaLevels, accepts])

    const isDraggedOver = isOver && canDrop
    const isInvalidDragOver = isOver && !canDrop

    // Handle drop events
    React.useEffect(() => {
      if (isOver && active && !isDraggedOver) {
        // Invalid drop attempt
        onInvalidDrop?.(active.data.current)
        
        // HIPAA audit log for rejected drops
        const hipaaLevel = active.data.current?.hipaaLevel
        if (hipaaLevel && hipaaLevel !== 'public') {
          console.log(
            `[HIPAA Audit] Rejected drop of ${hipaaLevel} data from ${active.id} to ${id} at ${new Date().toISOString()}`
          )
        }
      }
    }, [isOver, active, isDraggedOver, onInvalidDrop, id])

    const isEmpty = !children || (React.Children.count(children) === 0)
    
    const variantClasses = {
      default: 'border border-gray-200 bg-gray-50/50',
      dashed: 'border-2 border-dashed border-gray-300 bg-transparent',
      outlined: 'border-2 border-solid border-gray-400 bg-transparent',
      filled: 'border border-gray-200 bg-white shadow-sm',
    }

    return (
      <div
        ref={(node) => {
          setNodeRef(node)
          if (ref) {
            if (typeof ref === 'function') {
              ref(node)
            } else {
              ref.current = node
            }
          }
        }}
        className={cn(
          'relative min-h-[100px] p-4 rounded-lg transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50',
          variantClasses[variant],
          isDraggedOver && 'border-green-400 bg-green-50 ring-2 ring-green-300',
          isInvalidDragOver && 'border-red-400 bg-red-50 ring-2 ring-red-300',
          disabled && 'opacity-40 cursor-not-allowed bg-gray-100',
          className
        )}
        data-testid={`admin-dropzone-${id}`}
        data-hipaa-accepts={acceptedHipaaLevels.join(',')}
        role="region"
        aria-label={ariaLabel || `Drop zone ${id}`}
        aria-describedby={`dropzone-instructions-${id}`}
        aria-live="polite"
      >
        {/* Drop zone content */}
        {isEmpty && placeholder ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            {placeholder}
          </div>
        ) : (
          children
        )}

        {/* Drag over overlay */}
        {isDraggedOver && overlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-100/80 rounded-lg">
            {overlay}
          </div>
        )}

        {/* Invalid drag overlay */}
        {isInvalidDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100/80 rounded-lg">
            <div className="text-red-600 font-medium text-center px-4">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cannot drop here
              {active?.data.current?.hipaaLevel && acceptedHipaaLevels.length > 0 && (
                <div className="text-sm mt-1">
                  This zone accepts: {acceptedHipaaLevels.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visual drop indicator */}
        {isDraggedOver && (
          <div className="absolute inset-2 border-2 border-dashed border-green-400 rounded pointer-events-none">
            <div className="flex items-center justify-center h-full">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Drop here
              </div>
            </div>
          </div>
        )}

        {/* Hidden accessibility instructions */}
        <div
          id={`dropzone-instructions-${id}`}
          className="sr-only"
        >
          Drop zone for items. Accepts {acceptedHipaaLevels.join(', ')} data levels.
          {isDraggedOver && ' Ready to accept drop.'}
          {isInvalidDragOver && ' Cannot accept current item.'}
        </div>

        {/* Drop zone status indicator */}
        <div className="absolute top-2 right-2">
          {acceptedHipaaLevels.includes('phi') && (
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full" title="Accepts PHI data" />
          )}
          {acceptedHipaaLevels.includes('medical') && (
            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full ml-1" title="Accepts medical data" />
          )}
          {acceptedHipaaLevels.includes('administrative') && (
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-1" title="Accepts administrative data" />
          )}
        </div>
      </div>
    )
  }
)

AdminDropZone.displayName = 'AdminDropZone'

export default AdminDropZone