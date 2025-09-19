/**
 * Admin Switch Component
 * Toggle switch with label positioning
 */

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import type { AdminSwitchProps } from '../types'

export const AdminSwitch = forwardRef<HTMLInputElement, AdminSwitchProps>(
  ({
    id,
    name,
    label,
    description,
    checked,
    defaultChecked,
    labelPosition = 'right',
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
      sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', translate: 'translate-x-4' },
      md: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5' },
      lg: { track: 'h-7 w-14', thumb: 'h-6 w-6', translate: 'translate-x-7' },
    }

    const variantClasses = {
      default: 'bg-gray-200 peer-checked:bg-blue-600',
      outline: 'bg-white border-2 border-gray-400 peer-checked:bg-blue-600 peer-checked:border-blue-600',
      filled: 'bg-gray-300 peer-checked:bg-blue-700',
      ghost: 'bg-gray-100 peer-checked:bg-blue-500',
    }

    const content = (
      <>
        {(label || description) && (
          <div className={cn(
            labelPosition === 'left' && 'mr-3',
            labelPosition === 'right' && 'ml-3',
            labelPosition === 'top' && 'mb-2',
            labelPosition === 'bottom' && 'mt-2'
          )}>
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
      </>
    )

    return (
      <div className="admin-switch-container">
        <div className={cn(
          'flex items-center',
          (labelPosition === 'top' || labelPosition === 'bottom') && 'flex-col items-start',
          className
        )}>
          {(labelPosition === 'left' || labelPosition === 'top') && content}

          <div className="relative inline-flex items-center">
            <input
              ref={ref}
              id={id || name}
              name={name}
              type="checkbox"
              role="switch"
              checked={checked}
              defaultChecked={defaultChecked}
              required={required}
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={
                error ? `${id || name}-error` : helper ? `${id || name}-helper` : undefined
              }
              aria-checked={checked}
              onChange={onChange}
              className="peer sr-only"
              {...props}
            />
            
            <label
              htmlFor={id || name}
              className={cn(
                'relative inline-flex cursor-pointer rounded-full transition-colors duration-200',
                'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                sizeClasses[size].track,
                variantClasses[variant],
                error && 'bg-red-200 peer-checked:bg-red-600'
              )}
            >
              <span
                className={cn(
                  'absolute left-0.5 top-0.5 bg-white rounded-full shadow-lg',
                  'transition-transform duration-200',
                  'peer-checked:' + sizeClasses[size].translate,
                  sizeClasses[size].thumb
                )}
              />
            </label>
          </div>

          {(labelPosition === 'right' || labelPosition === 'bottom') && content}
        </div>

        {error && (
          <p id={`${id || name}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}

        {helper && !error && (
          <p id={`${id || name}-helper`} className="mt-1 text-sm text-gray-500">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

AdminSwitch.displayName = 'AdminSwitch'