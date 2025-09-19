/**
 * Admin Date Picker Component
 * Calendar-based date selection with range support
 */

import React, { forwardRef, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Calendar, X } from 'lucide-react'
import { format, isValid, parse } from 'date-fns'
import { useClickOutside } from '../hooks/use-click-outside'
import type { AdminDatePickerProps } from '../types'

export const AdminDatePicker = forwardRef<HTMLInputElement, AdminDatePickerProps>(
  ({
    id,
    name,
    label,
    placeholder = 'Select date',
    value,
    defaultValue,
    min,
    max,
    disabledDates,
    format: dateFormat = 'MM/dd/yyyy',
    showTime,
    clearable,
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
    const [isOpen, setIsOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
      if (value) {
        const parsed = parse(value as string, dateFormat, new Date())
        return isValid(parsed) ? parsed : null
      }
      if (defaultValue) {
        const parsed = parse(defaultValue as string, dateFormat, new Date())
        return isValid(parsed) ? parsed : null
      }
      return null
    })
    
    const dropdownRef = useRef<HTMLDivElement>(null)
    useClickOutside(dropdownRef, () => setIsOpen(false))

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

    const handleDateSelect = (date: Date) => {
      setSelectedDate(date)
      const formatted = format(date, dateFormat)
      onChange?.({ target: { value: formatted } } as any)
      if (!showTime) {
        setIsOpen(false)
      }
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      setSelectedDate(null)
      onChange?.({ target: { value: '' } } as any)
    }

    const isDateDisabled = (date: Date) => {
      if (min && date < new Date(min)) return true
      if (max && date > new Date(max)) return true
      if (disabledDates) {
        return disabledDates.some(d => {
          const disabled = new Date(d)
          return date.toDateString() === disabled.toDateString()
        })
      }
      return false
    }

    const generateCalendarDays = () => {
      const today = new Date()
      const currentMonth = selectedDate || today
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())
      
      const days: Date[] = []
      const current = new Date(startDate)
      
      while (current <= lastDay || current.getDay() !== 0) {
        days.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }
      
      return days
    }

    const displayValue = selectedDate ? format(selectedDate, dateFormat) : ''

    return (
      <div className="admin-datepicker-container">
        {label && (
          <label
            htmlFor={id || name}
            className={cn(
              'block text-sm font-medium text-gray-700 mb-1',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}

        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <input
              ref={ref}
              id={id || name}
              name={name}
              type="text"
              value={displayValue}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              readOnly
              onClick={() => !disabled && setIsOpen(!isOpen)}
              aria-haspopup="true"
              aria-expanded={isOpen}
              aria-invalid={!!error}
              aria-describedby={
                error ? `${id || name}-error` : helper ? `${id || name}-helper` : undefined
              }
              className={cn(
                'w-full rounded-md border transition-colors duration-200 cursor-pointer',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
                'pr-20',
                sizeClasses[size],
                variantClasses[variant],
                error && 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500',
                className
              )}
              {...props}
            />
            
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
              {clearable && selectedDate && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 hover:bg-gray-100 rounded"
                  tabIndex={-1}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {isOpen && (
            <div className={cn(
              'absolute z-50 mt-1 bg-white rounded-md shadow-lg',
              'border border-gray-200 p-3',
              'animate-in fade-in-0 zoom-in-95'
            )}>
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(selectedDate || new Date())
                    prev.setMonth(prev.getMonth() - 1)
                    setSelectedDate(prev)
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  ‹
                </button>
                <div className="text-sm font-medium">
                  {format(selectedDate || new Date(), 'MMMM yyyy')}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(selectedDate || new Date())
                    next.setMonth(next.getMonth() + 1)
                    setSelectedDate(next)
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  ›
                </button>
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-xs font-medium text-gray-500 text-center p-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((date, index) => {
                  const isSelected = selectedDate?.toDateString() === date.toDateString()
                  const isToday = date.toDateString() === new Date().toDateString()
                  const isCurrentMonth = date.getMonth() === (selectedDate || new Date()).getMonth()
                  const isDisabled = isDateDisabled(date)

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => !isDisabled && handleDateSelect(date)}
                      disabled={isDisabled}
                      className={cn(
                        'p-1 text-sm rounded hover:bg-gray-100 transition-colors',
                        isSelected && 'bg-blue-600 text-white hover:bg-blue-700',
                        isToday && !isSelected && 'font-bold text-blue-600',
                        !isCurrentMonth && 'text-gray-400',
                        isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                      )}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>

              {showTime && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onChange={(e) => {
                        if (selectedDate) {
                          const [hours, minutes] = e.target.value.split(':')
                          const newDate = new Date(selectedDate)
                          newDate.setHours(parseInt(hours), parseInt(minutes))
                          handleDateSelect(newDate)
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
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

AdminDatePicker.displayName = 'AdminDatePicker'