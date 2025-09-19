/**
 * Admin Textarea Component
 * Auto-resizing textarea with character counter
 */

import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, Info } from 'lucide-react'
import type { AdminTextareaProps } from '../types'

export const AdminTextarea = forwardRef<HTMLTextAreaElement, AdminTextareaProps>(
  ({
    id,
    name,
    label,
    placeholder,
    value,
    defaultValue,
    rows = 4,
    maxLength,
    autoResize,
    showCharCount,
    error,
    helper,
    required,
    disabled,
    readonly,
    onChange,
    onBlur,
    onFocus,
    healthcare,
    variant = 'default',
    size = 'md',
    className,
    ...props
  }, ref) => {
    const [charCount, setCharCount] = useState(0)
    const [isFocused, setIsFocused] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const combinedRef = ref || textareaRef

    const sizeClasses = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-3 py-2',
      lg: 'px-4 py-3 text-lg',
    }

    const variantClasses = {
      default: 'border-gray-300 focus:border-blue-500',
      outline: 'border-2 border-gray-400 focus:border-blue-600',
      filled: 'bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500',
      ghost: 'border-transparent bg-transparent hover:bg-gray-50',
    }

    const handleResize = () => {
      if (autoResize && combinedRef && 'current' in combinedRef && combinedRef.current) {
        const textarea = combinedRef.current
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      
      if (showCharCount || maxLength) {
        setCharCount(newValue.length)
      }
      
      handleResize()
      onChange?.(e)
    }

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    useEffect(() => {
      const currentValue = value || defaultValue || ''
      setCharCount(String(currentValue).length)
      
      if (autoResize) {
        handleResize()
      }
    }, [value, defaultValue, autoResize])

    const isHealthcareField = healthcare?.medicalDataType === 'PHI' || healthcare?.medicalDataType === 'PII'
    const remainingChars = maxLength ? maxLength - charCount : null
    const isNearLimit = remainingChars !== null && remainingChars <= 20

    return (
      <div className="admin-textarea-container">
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
          <textarea
            ref={combinedRef as React.Ref<HTMLTextAreaElement>}
            id={id || name}
            name={name}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            rows={autoResize ? Math.min(rows, 3) : rows}
            maxLength={maxLength}
            required={required}
            disabled={disabled}
            readOnly={readonly}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${id || name}-error` : helper ? `${id || name}-helper` : undefined
            }
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'block w-full rounded-md border transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
              'resize-none',
              sizeClasses[size],
              variantClasses[variant],
              error && 'border-red-500 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
              autoResize && 'overflow-hidden',
              className
            )}
            style={{
              minHeight: autoResize ? `${rows * 1.5}rem` : undefined,
              maxHeight: autoResize ? '20rem' : undefined,
            }}
            {...props}
          />

          {(showCharCount || maxLength) && (
            <div className={cn(
              'absolute bottom-2 right-2 text-xs',
              isNearLimit ? 'text-orange-500' : 'text-gray-400',
              charCount > (maxLength || Infinity) && 'text-red-500'
            )}>
              {maxLength ? `${charCount}/${maxLength}` : charCount}
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
          <p id={`${id || name}-helper`} className="mt-1 text-sm text-gray-500 flex items-center">
            <Info className="h-4 w-4 mr-1" />
            {helper}
          </p>
        )}

        {healthcare?.hipaaCompliant && (
          <p className="mt-1 text-xs text-gray-400">
            HIPAA-compliant field • Data encrypted at rest
          </p>
        )}

        {healthcare?.sanitizationRequired && (
          <p className="mt-1 text-xs text-yellow-600">
            ⚠️ This field requires sanitization before display
          </p>
        )}
      </div>
    )
  }
)

AdminTextarea.displayName = 'AdminTextarea'