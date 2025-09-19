/**
 * AdminPopover Component
 * Healthcare-compliant popover for additional actions and rich content
 */

'use client'

import React, { useEffect, useRef } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MoreVertical, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BaseAdminComponentProps } from '../types'

// Extended popover props
interface AdminPopoverProps extends BaseAdminComponentProps {
  // Content
  content: React.ReactNode
  title?: string
  description?: string
  // Trigger configuration
  trigger?: React.ReactNode
  triggerProps?: React.HTMLAttributes<HTMLButtonElement>
  asChild?: boolean
  // Positioning
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  sticky?: 'partial' | 'always'
  // Behavior
  open?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  // Styling
  variant?: 'default' | 'menu' | 'panel' | 'form' | 'info'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  maxWidth?: string
  maxHeight?: string
  // Features
  arrow?: boolean
  closable?: boolean
  portal?: boolean
  forceMount?: boolean
  // Healthcare-specific
  medicalContext?: boolean
  hipaaCompliant?: boolean
  // Animation
  animation?: 'scale' | 'slide' | 'fade'
  // Focus management
  autoFocus?: boolean
  restoreFocus?: boolean
  trapFocus?: boolean
  // Actions
  actions?: Array<{
    label: string
    onClick: () => void
    icon?: React.ReactNode
    variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'link'
    disabled?: boolean
    separator?: boolean
  }>
}

// Size variants
const sizeVariants = {
  sm: 'w-64',
  md: 'w-80',
  lg: 'w-96',
  xl: 'w-[28rem]'
}

// Variant configurations
const variantConfig = {
  default: {
    bgColor: 'bg-white',
    borderColor: 'border-slate-200',
    shadow: 'shadow-lg'
  },
  menu: {
    bgColor: 'bg-white',
    borderColor: 'border-slate-200',
    shadow: 'shadow-xl'
  },
  panel: {
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-300',
    shadow: 'shadow-lg'
  },
  form: {
    bgColor: 'bg-white',
    borderColor: 'border-blue-200',
    shadow: 'shadow-xl'
  },
  info: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    shadow: 'shadow-lg'
  }
}

// Animation variants
const animationVariants = {
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  },
  slide: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }
}

// Default trigger button
const DefaultTrigger: React.FC<{
  variant: keyof typeof variantConfig
  className?: string
  triggerProps?: React.HTMLAttributes<HTMLButtonElement>
}> = ({ variant, className, triggerProps }) => {
  const isMenu = variant === 'menu'

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-md',
        'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'transition-colors duration-200',
        isMenu ? 'w-8 h-8' : 'px-3 py-2',
        className
      )}
      aria-label={isMenu ? 'Open menu' : 'Open popover'}
      {...triggerProps}
    >
      {isMenu ? (
        <MoreVertical className="w-4 h-4" aria-hidden="true" />
      ) : (
        <ChevronDown className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  )
}

// Focus trap hook (simplified version)
const useFocusTrap = (containerRef: React.RefObject<HTMLElement>, isActive: boolean, trapFocus: boolean) => {
  useEffect(() => {
    if (!isActive || !trapFocus || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isActive, trapFocus, containerRef])
}

export const AdminPopover: React.FC<AdminPopoverProps> = ({
  content,
  title,
  description,
  trigger,
  triggerProps,
  asChild = false,
  side = 'bottom',
  align = 'center',
  sideOffset = 4,
  alignOffset = 0,
  avoidCollisions = true,
  sticky = 'partial',
  open,
  onOpenChange,
  modal = false,
  variant = 'default',
  size = 'md',
  maxWidth,
  maxHeight,
  arrow = false,
  closable = false,
  portal = true,
  forceMount = false,
  medicalContext = false,
  hipaaCompliant = false,
  animation = 'scale',
  autoFocus = false,
  restoreFocus = true,
  trapFocus = false,
  actions,
  children,
  className,
  'data-testid': testId = 'admin-popover',
  ...props
}) => {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = React.useState(open || false)

  // Enable focus trap if needed
  useFocusTrap(popoverRef, isOpen, trapFocus)

  // Handle open change
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  // Handle close
  const handleClose = () => {
    handleOpenChange(false)
  }

  // Get configuration
  const config = variantConfig[variant]
  const sizeClass = sizeVariants[size]

  // Auto-focus first element when opened
  useEffect(() => {
    if (isOpen && autoFocus && popoverRef.current) {
      const firstFocusable = popoverRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      firstFocusable?.focus()
    }
  }, [isOpen, autoFocus])

  // Popover content component
  const PopoverContent = (
    <Popover.Content
      ref={popoverRef}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      avoidCollisions={avoidCollisions}
      sticky={sticky}
      className={cn(
        // Base styles
        'rounded-lg border z-50 overflow-hidden',
        'animate-in data-[state=open]:animate-in',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        // Slide animations based on side
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        // Configuration styling
        config.bgColor,
        config.borderColor,
        config.shadow,
        // Size
        sizeClass,
        // Healthcare compliance
        medicalContext && 'ring-2 ring-blue-200',
        hipaaCompliant && 'border-blue-300',
        className
      )}
      style={{ 
        maxWidth: maxWidth || '24rem',
        maxHeight: maxHeight || '32rem'
      }}
      data-testid={`${testId}-content`}
      onOpenAutoFocus={(e) => {
        if (!autoFocus) e.preventDefault()
      }}
      onCloseAutoFocus={(e) => {
        if (!restoreFocus) e.preventDefault()
      }}
      {...props}
    >
      {/* Header */}
      {(title || description || closable) && (
        <div className={cn(
          'px-4 py-3 border-b border-slate-200',
          variant === 'info' && 'bg-blue-100/50'
        )}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-sm font-medium text-slate-900 leading-5">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-xs text-slate-600 leading-4">
                  {description}
                </p>
              )}
            </div>
            
            {closable && (
              <Popover.Close asChild>
                <button
                  onClick={handleClose}
                  className={cn(
                    'ml-3 p-1 rounded-md text-slate-400 hover:text-slate-600',
                    'hover:bg-slate-100 focus:outline-none focus:ring-2',
                    'focus:ring-blue-500 focus:ring-offset-2',
                    'transition-colors duration-200'
                  )}
                  aria-label="Close popover"
                  data-testid={`${testId}-close-button`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </Popover.Close>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn(
        'max-h-96 overflow-y-auto',
        (title || description || closable) ? 'p-0' : 'p-4'
      )}>
        {variant === 'menu' && actions ? (
          // Menu-style actions
          <div className="py-1">
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                {action.separator && (
                  <div className="my-1 border-t border-slate-200" />
                )}
                <button
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    'flex w-full items-center px-4 py-2 text-sm text-left',
                    'hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
                    'transition-colors duration-150',
                    {
                      'text-slate-700': !action.variant || action.variant === 'default',
                      'text-blue-600 font-medium': action.variant === 'primary',
                      'text-slate-600': action.variant === 'secondary',
                      'text-red-600': action.variant === 'danger',
                      'text-blue-600 hover:underline': action.variant === 'link',
                      'opacity-50 cursor-not-allowed': action.disabled
                    }
                  )}
                  data-testid={`${testId}-action-${index}`}
                >
                  {action.icon && (
                    <span className="mr-3 flex-shrink-0">
                      {action.icon}
                    </span>
                  )}
                  {action.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        ) : (
          // Regular content
          <div className={cn(
            (title || description || closable) && 'p-4'
          )}>
            {content}
            {children}
          </div>
        )}
      </div>

      {/* Actions (non-menu style) */}
      {actions && variant !== 'menu' && (
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-end space-x-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2',
                  'transition-colors duration-200',
                  {
                    'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-500': 
                      !action.variant || action.variant === 'default',
                    'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': 
                      action.variant === 'primary',
                    'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500': 
                      action.variant === 'secondary',
                    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': 
                      action.variant === 'danger',
                    'text-blue-600 hover:text-blue-800 hover:underline': 
                      action.variant === 'link',
                    'opacity-50 cursor-not-allowed': action.disabled
                  }
                )}
                data-testid={`${testId}-action-${index}`}
              >
                {action.icon && (
                  <span className="mr-1.5 -ml-0.5">
                    {action.icon}
                  </span>
                )}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HIPAA compliance indicator */}
      {hipaaCompliant && (
        <div className="px-4 py-2 border-t border-slate-200 bg-blue-50">
          <div className="text-xs text-blue-800 flex items-center">
            <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            HIPAA Compliant
          </div>
        </div>
      )}

      {/* Arrow */}
      {arrow && (
        <Popover.Arrow 
          className="fill-white stroke-slate-200"
          width={11}
          height={5}
        />
      )}
    </Popover.Content>
  )

  const popoverContent = portal ? (
    <Popover.Portal forceMount={forceMount ? true : undefined}>
      {PopoverContent}
    </Popover.Portal>
  ) : PopoverContent

  return (
    <Popover.Root 
      open={open !== undefined ? open : isOpen}
      onOpenChange={handleOpenChange}
      modal={modal}
    >
      <Popover.Trigger asChild={asChild || !!trigger}>
        {trigger || children || (
          <DefaultTrigger 
            variant={variant}
            className={className}
            triggerProps={triggerProps}
          />
        )}
      </Popover.Trigger>

      <AnimatePresence>
        {(open !== undefined ? open : isOpen) && popoverContent}
      </AnimatePresence>
    </Popover.Root>
  )
}

// Convenience components for common use cases
export const MenuPopover: React.FC<Omit<AdminPopoverProps, 'variant'>> = (props) => (
  <AdminPopover variant="menu" {...props} />
)

export const InfoPopover: React.FC<Omit<AdminPopoverProps, 'variant'>> = (props) => (
  <AdminPopover variant="info" {...props} />
)

export const FormPopover: React.FC<Omit<AdminPopoverProps, 'variant'>> = (props) => (
  <AdminPopover variant="form" {...props} />
)

export const PanelPopover: React.FC<Omit<AdminPopoverProps, 'variant'>> = (props) => (
  <AdminPopover variant="panel" {...props} />
)

// Export default and named
export default AdminPopover