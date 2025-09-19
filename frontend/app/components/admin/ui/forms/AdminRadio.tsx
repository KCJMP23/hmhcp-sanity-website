/**
 * Admin Radio Component
 * Radio button group with descriptions
 */

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import type { AdminRadioProps, AdminRadioOption } from '../types'

export const AdminRadio = forwardRef<HTMLDivElement, AdminRadioProps>(
  ({
    id,
    name,
    label,
    options = [],
    value,
    defaultValue,
    orientation = 'vertical',
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
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    }

    const dotSizeClasses = {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
    }

    const variantClasses = {
      default: 'border-gray-300 text-blue-600 focus:ring-blue-500',
      outline: 'border-2 border-gray-400 text-blue-600 focus:ring-blue-600',
      filled: 'border-gray-200 bg-gray-50 text-blue-600 focus:ring-blue-500',
      ghost: 'border-transparent bg-transparent text-blue-600 hover:bg-gray-50',
    }

    const handleChange = (optionValue: string | number) => {
      onChange?.(optionValue as any)
    }

    return (
      <div ref={ref} className="admin-radio-container">
        {label && (
          <div className={cn(
            'text-sm font-medium text-gray-700 mb-2',
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}>
            {label}
          </div>
        )}

        <div
          role="radiogroup"
          aria-labelledby={label ? `${id || name}-label` : undefined}
          aria-required={required}
          aria-invalid={!!error}
          className={cn(
            'flex gap-4',
            orientation === 'vertical' && 'flex-col',
            orientation === 'horizontal' && 'flex-row flex-wrap',
            className
          )}
        >
          {options.map((option, index) => {
            const optionId = `${id || name}-${index}`
            const isChecked = value === option.value || (!value && defaultValue === option.value)
            const isDisabled = disabled || option.disabled

            return (
              <div key={option.value} className="flex items-start">
                <div className="relative flex items-center">
                  <input
                    id={optionId}
                    name={name}
                    type="radio"
                    value={option.value}
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => handleChange(option.value)}
                    className={cn(
                      'peer appearance-none rounded-full border cursor-pointer transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2',
                      'disabled:cursor-not-allowed disabled:bg-gray-100',
                      sizeClasses[size],
                      variantClasses[variant],
                      error && 'border-red-500 text-red-600 focus:ring-red-500'
                    )}
                    {...props}
                  />
                  
                  {/* Custom radio visual */}
                  <div className={cn(
                    'absolute inset-0 rounded-full pointer-events-none flex items-center justify-center',
                    'peer-checked:border-blue-600',
                    'peer-disabled:bg-gray-100',
                    error && 'peer-checked:border-red-600'
                  )}>
                    <div className={cn(
                      'rounded-full bg-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity',
                      dotSizeClasses[size],
                      error && 'bg-red-600'
                    )} />
                  </div>
                </div>

                <div className="ml-3">
                  <label
                    htmlFor={optionId}
                    className={cn(
                      'block text-sm font-medium cursor-pointer',
                      isDisabled ? 'text-gray-400' : 'text-gray-700'
                    )}
                  >
                    {option.label}
                  </label>
                  {option.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{option.description}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <p id={`${id || name}-error`} className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {helper && !error && (
          <p id={`${id || name}-helper`} className="mt-2 text-sm text-gray-500">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

AdminRadio.displayName = 'AdminRadio'