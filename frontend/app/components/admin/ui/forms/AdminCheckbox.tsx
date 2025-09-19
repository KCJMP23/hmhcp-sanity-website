/**
 * Admin Checkbox Component
 * Accessible checkbox with indeterminate state
 */

import React, { forwardRef, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Check, Minus } from 'lucide-react'
import type { AdminCheckboxProps } from '../types'

export const AdminCheckbox = forwardRef<HTMLInputElement, AdminCheckboxProps>(
  ({
    id,
    name,
    label,
    description,
    checked,
    defaultChecked,
    indeterminate,
    error,
    helper,
    required,
    disabled,
    onChange,
    variant = 'default',
    size = 'md',
    className,
    ...props
  }, ref) => {
    const checkboxRef = useRef<HTMLInputElement>(null)
    const combinedRef = ref || checkboxRef

    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    }

    const iconSizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-3.5 w-3.5',
      lg: 'h-4 w-4',
    }

    const variantClasses = {
      default: 'border-gray-300 text-blue-600 focus:ring-blue-500',
      outline: 'border-2 border-gray-400 text-blue-600 focus:ring-blue-600',
      filled: 'border-gray-200 bg-gray-50 text-blue-600 focus:ring-blue-500',
      ghost: 'border-transparent bg-transparent text-blue-600 hover:bg-gray-50',
    }

    useEffect(() => {
      if (combinedRef && 'current' in combinedRef && combinedRef.current) {
        combinedRef.current.indeterminate = indeterminate || false
      }
    }, [indeterminate, combinedRef])

    return (
      <div className="admin-checkbox-container">
        <div className="flex items-start">
          <div className="relative flex items-center">
            <input
              ref={combinedRef as React.Ref<HTMLInputElement>}
              id={id || name}
              name={name}
              type="checkbox"
              checked={checked}
              defaultChecked={defaultChecked}
              required={required}
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={
                error ? `${id || name}-error` : helper ? `${id || name}-helper` : undefined
              }
              onChange={onChange}
              className={cn(
                'peer appearance-none rounded border cursor-pointer transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:bg-gray-100',
                sizeClasses[size],
                variantClasses[variant],
                error && 'border-red-500 text-red-600 focus:ring-red-500',
                className
              )}
              {...props}
            />
            
            {/* Custom checkbox visual */}
            <div className={cn(
              'absolute inset-0 rounded pointer-events-none flex items-center justify-center',
              'peer-checked:bg-blue-600 peer-checked:border-blue-600',
              'peer-indeterminate:bg-blue-600 peer-indeterminate:border-blue-600',
              'peer-disabled:bg-gray-100',
              error && 'peer-checked:bg-red-600 peer-checked:border-red-600'
            )}>
              {indeterminate ? (
                <Minus className={cn(
                  'text-white',
                  iconSizeClasses[size]
                )} />
              ) : (
                <Check className={cn(
                  'text-white opacity-0 peer-checked:opacity-100 transition-opacity',
                  iconSizeClasses[size]
                )} />
              )}
            </div>
          </div>

          {(label || description) && (
            <div className="ml-3">
              {label && (
                <label
                  htmlFor={id || name}
                  className={cn(
                    'block text-sm font-medium cursor-pointer',
                    disabled ? 'text-gray-400' : 'text-gray-700',
                    required && "after:content-['*'] after:ml-0.5 after:text-red-500"
                  )}
                >
                  {label}
                </label>
              )}
              {description && (
                <p className="text-sm text-gray-500 mt-0.5">{description}</p>
              )}
            </div>
          )}
        </div>

        {error && (
          <p id={`${id || name}-error`} className="mt-1 text-sm text-red-600 ml-8">
            {error}
          </p>
        )}

        {helper && !error && (
          <p id={`${id || name}-helper`} className="mt-1 text-sm text-gray-500 ml-8">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

AdminCheckbox.displayName = 'AdminCheckbox'