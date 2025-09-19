/**
 * Admin Button Component
 * Healthcare-compliant button with comprehensive variants and states
 */

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { AdminButtonProps } from '../types'

const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  children,
  className,
  'data-testid': testId,
  ...props
}, ref) => {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:transform active:scale-[0.98]'
  )

  const variantClasses = {
    primary: cn(
      'bg-blue-600 text-white shadow-sm',
      'hover:bg-blue-700 focus:ring-blue-500',
      'border border-transparent'
    ),
    secondary: cn(
      'bg-gray-600 text-white shadow-sm',
      'hover:bg-gray-700 focus:ring-gray-500',
      'border border-transparent'
    ),
    outline: cn(
      'bg-white text-gray-700 shadow-sm border border-gray-300',
      'hover:bg-gray-50 focus:ring-blue-500 hover:border-gray-400'
    ),
    ghost: cn(
      'bg-transparent text-gray-700 border border-transparent',
      'hover:bg-gray-100 focus:ring-blue-500'
    ),
    danger: cn(
      'bg-red-600 text-white shadow-sm',
      'hover:bg-red-700 focus:ring-red-500',
      'border border-transparent'
    ),
    success: cn(
      'bg-green-600 text-white shadow-sm',
      'hover:bg-green-700 focus:ring-green-500',
      'border border-transparent'
    )
  }

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs h-6',
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
    xl: 'px-8 py-4 text-lg h-14'
  }

  const iconSizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  }

  const isDisabled = disabled || loading

  const renderIcon = (iconElement: React.ReactNode, position: 'left' | 'right') => {
    if (!iconElement && !loading) return null
    
    const iconToRender = loading ? (
      <Loader2 className={cn(iconSizeClasses[size], 'animate-spin')} />
    ) : (
      React.isValidElement(iconElement) ? (
        React.cloneElement(iconElement, {
          className: cn(iconSizeClasses[size], iconElement.props.className)
        })
      ) : iconElement
    )

    return (
      <span className={cn(
        position === 'left' && children ? 'mr-2' : '',
        position === 'right' && children ? 'ml-2' : ''
      )}>
        {iconToRender}
      </span>
    )
  }

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      data-testid={testId}
      {...props}
    >
      {iconPosition === 'left' && renderIcon(icon, 'left')}
      {children}
      {iconPosition === 'right' && renderIcon(icon, 'right')}
    </button>
  )
})

AdminButton.displayName = 'AdminButton'

export { AdminButton }