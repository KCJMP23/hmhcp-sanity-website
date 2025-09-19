/**
 * Admin Input Component
 * Healthcare-compliant input field with validation
 */

import React, { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react'
import type { AdminInputProps } from '../types'

export const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  ({
    id,
    name,
    type = 'text',
    label,
    placeholder,
    value,
    defaultValue,
    error,
    helper,
    required,
    disabled,
    readonly,
    autoComplete,
    icon,
    prefix,
    suffix,
    onChange,
    onBlur,
    onFocus,
    validation,
    healthcare,
    variant = 'default',
    size = 'md',
    className,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const inputType = type === 'password' && showPassword ? 'text' : type

    const sizeClasses = {
      sm: 'h-8 px-2 py-1 text-sm',
      md: 'h-10 px-3 py-2',
      lg: 'h-12 px-4 py-3 text-lg',
    }

    const variantClasses = {
      default: 'border-gray-300 focus:border-blue-500',
      outline: 'border-2 border-gray-400 focus:border-blue-600',
      filled: 'bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500',
      ghost: 'border-transparent bg-transparent hover:bg-gray-50',
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    const isHealthcareField = healthcare?.medicalDataType === 'PHI' || healthcare?.medicalDataType === 'PII'

    return (
      <div className="admin-input-container">
        {label && (
          <label
            htmlFor={id || name}
            className={cn(
              'block text-sm font-medium text-gray-700 mb-1',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
            {isHealthcareField && (
              <span className="ml-1 text-xs text-gray-500">
                ({healthcare?.medicalDataType})
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {React.cloneElement(icon as React.ReactElement, {
                className: 'h-5 w-5 text-gray-400',
              })}
            </div>
          )}

          {prefix && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">{prefix}</span>
            </div>
          )}

          <input
            ref={ref}
            id={id || name}
            name={name}
            type={inputType}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readonly}
            autoComplete={autoComplete}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${id || name}-error` : helper ? `${id || name}-helper` : undefined
            }
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'block w-full rounded-md border transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
              sizeClasses[size],
              variantClasses[variant],
              icon && 'pl-10',
              prefix && 'pl-7',
              suffix && 'pr-10',
              type === 'password' && 'pr-10',
              error && 'border-red-500 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />

          {type === 'password' && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          )}

          {suffix && type !== 'password' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">{suffix}</span>
            </div>
          )}

          {validation?.status && !error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {validation.status === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {validation.status === 'warning' && (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              {validation.status === 'info' && (
                <Info className="h-5 w-5 text-blue-500" />
              )}
            </div>
          )}
        </div>

        {error && (
          <p id={`${id || name}-error`} className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </p>
        )}

        {helper && !error && (
          <p id={`${id || name}-helper`} className="mt-1 text-sm text-gray-500">
            {helper}
          </p>
        )}

        {healthcare?.hipaaCompliant && (
          <p className="mt-1 text-xs text-gray-400">
            HIPAA-compliant field • Data encrypted at rest
          </p>
        )}
      </div>
    )
  }
)

AdminInput.displayName = 'AdminInput'