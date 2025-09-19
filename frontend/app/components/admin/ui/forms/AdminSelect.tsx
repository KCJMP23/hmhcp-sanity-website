/**
 * Admin Select Component
 * Accessible dropdown with search and multi-select
 */

import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, X, Check, Search } from 'lucide-react'
import { useClickOutside } from '../hooks/use-click-outside'
import type { AdminSelectProps, AdminSelectOption } from '../types'

export const AdminSelect = forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({
    id,
    name,
    label,
    placeholder = 'Select an option',
    options = [],
    value,
    defaultValue,
    multiple,
    searchable,
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
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedValues, setSelectedValues] = useState<(string | number)[]>(
      multiple ? (Array.isArray(value) ? value : []) : value ? [value] : []
    )
    
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

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

    const filteredOptions = searchable
      ? options.filter(option =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options

    const handleSelect = (optionValue: string | number) => {
      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue]
        setSelectedValues(newValues)
        onChange?.(newValues as any)
      } else {
        setSelectedValues([optionValue])
        onChange?.(optionValue as any)
        setIsOpen(false)
      }
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      setSelectedValues([])
      onChange?.(multiple ? [] as any : undefined)
    }

    const getDisplayValue = () => {
      if (selectedValues.length === 0) return placeholder
      
      if (multiple) {
        if (selectedValues.length === 1) {
          const option = options.find(o => o.value === selectedValues[0])
          return option?.label || selectedValues[0]
        }
        return `${selectedValues.length} selected`
      }
      
      const option = options.find(o => o.value === selectedValues[0])
      return option?.label || selectedValues[0]
    }

    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, [isOpen, searchable])

    return (
      <div className="admin-select-container">
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
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={label ? `${id || name}-label` : undefined}
            className={cn(
              'w-full rounded-md border transition-colors duration-200 text-left',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
              'flex items-center justify-between',
              sizeClasses[size],
              variantClasses[variant],
              error && 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500',
              className
            )}
          >
            <span className={cn(
              'block truncate',
              selectedValues.length === 0 && 'text-gray-400'
            )}>
              {getDisplayValue()}
            </span>
            
            <div className="flex items-center gap-1">
              {clearable && selectedValues.length > 0 && (
                <X
                  className="h-4 w-4 text-gray-400 hover:text-gray-600"
                  onClick={handleClear}
                />
              )}
              <ChevronDown className={cn(
                'h-4 w-4 text-gray-400 transition-transform',
                isOpen && 'transform rotate-180'
              )} />
            </div>
          </button>

          {isOpen && (
            <div className={cn(
              'absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg',
              'border border-gray-200 max-h-60 overflow-auto',
              'animate-in fade-in-0 zoom-in-95'
            )}>
              {searchable && (
                <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search options..."
                      className="w-full pl-8 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <ul role="listbox" aria-multiselectable={multiple} className="py-1">
                {filteredOptions.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-gray-500">No options found</li>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = selectedValues.includes(option.value)
                    const isDisabled = option.disabled

                    return (
                      <li
                        key={option.value}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={isDisabled}
                        onClick={() => !isDisabled && handleSelect(option.value)}
                        className={cn(
                          'px-3 py-2 text-sm cursor-pointer flex items-center justify-between',
                          'hover:bg-gray-50 transition-colors',
                          isSelected && 'bg-blue-50 text-blue-600',
                          isDisabled && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div>
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {option.description}
                            </div>
                          )}
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          )}

          {/* Hidden select for form submission */}
          <select
            ref={ref}
            id={id || name}
            name={name}
            value={multiple ? undefined : selectedValues[0]}
            multiple={multiple}
            required={required}
            disabled={disabled}
            className="sr-only"
            aria-hidden="true"
            {...props}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}

        {helper && !error && (
          <p className="mt-1 text-sm text-gray-500">{helper}</p>
        )}
      </div>
    )
  }
)

AdminSelect.displayName = 'AdminSelect'