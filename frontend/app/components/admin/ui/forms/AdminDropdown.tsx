/**
 * Admin Dropdown Component
 * Accessible dropdown menu with comprehensive features
 */

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'
import { useClickOutside } from '../hooks/use-click-outside'

interface DropdownItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
  separator?: boolean
  onClick: () => void
}

interface AdminDropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  maxHeight?: string
  className?: string
  disabled?: boolean
  'data-testid'?: string
}

export function AdminDropdown({
  trigger,
  items,
  align = 'left',
  maxHeight = '300px',
  className,
  disabled = false,
  'data-testid': testId
}: AdminDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useClickOutside(dropdownRef, () => setIsOpen(false))

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      setFocusedIndex(-1)
    }
  }

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      item.onClick()
      setIsOpen(false)
      setFocusedIndex(-1)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return

    const enabledItems = items.filter(item => !item.disabled && !item.separator)
    
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else if (focusedIndex >= 0 && enabledItems[focusedIndex]) {
          handleItemClick(enabledItems[focusedIndex])
        }
        break
        
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setFocusedIndex(-1)
        break
        
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(0)
        } else {
          setFocusedIndex(prev => 
            prev < enabledItems.length - 1 ? prev + 1 : 0
          )
        }
        break
        
      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(enabledItems.length - 1)
        } else {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : enabledItems.length - 1
          )
        }
        break
        
      case 'Tab':
        setIsOpen(false)
        setFocusedIndex(-1)
        break
    }
  }

  // Update focus when index changes
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && menuRef.current) {
      const enabledItems = items.filter(item => !item.disabled && !item.separator)
      const focusedItem = menuRef.current.querySelector(`[data-index="${focusedIndex}"]`) as HTMLElement
      focusedItem?.focus()
    }
  }, [focusedIndex, isOpen, items])

  return (
    <div 
      ref={dropdownRef} 
      className={cn('relative inline-block', className)}
      data-testid={testId}
    >
      {/* Trigger */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'inline-flex items-center justify-center',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {React.isValidElement(trigger) ? (
          React.cloneElement(trigger, {
            ...trigger.props,
            disabled: disabled || trigger.props.disabled
          })
        ) : (
          trigger
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={cn(
            'absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg',
            'min-w-[200px] py-1',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          style={{ maxHeight }}
        >
          <div className="overflow-y-auto">
            {items.map((item, index) => {
              const enabledItems = items.filter(i => !i.disabled && !i.separator)
              const enabledIndex = enabledItems.findIndex(i => i.id === item.id)
              const isFocused = enabledIndex === focusedIndex

              if (item.separator) {
                return (
                  <hr 
                    key={item.id || `separator-${index}`}
                    className="my-1 border-gray-200"
                  />
                )
              }

              return (
                <div
                  key={item.id}
                  role="menuitem"
                  tabIndex={-1}
                  data-index={enabledIndex}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => !item.disabled && setFocusedIndex(enabledIndex)}
                  className={cn(
                    'flex items-center px-4 py-2 text-sm cursor-pointer',
                    'transition-colors duration-150',
                    item.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : cn(
                          'text-gray-700 hover:bg-gray-100',
                          isFocused && 'bg-gray-100'
                        )
                  )}
                  aria-disabled={item.disabled}
                >
                  {item.icon && (
                    <span className="mr-3 flex-shrink-0">
                      {React.isValidElement(item.icon) ? (
                        React.cloneElement(item.icon, {
                          className: cn('h-4 w-4', item.icon.props.className)
                        })
                      ) : item.icon}
                    </span>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}