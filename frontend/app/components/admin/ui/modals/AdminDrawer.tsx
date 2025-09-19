/**
 * AdminDrawer Component
 * Healthcare-compliant side panel drawer with multiple positions and sizes
 */

'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BaseAdminComponentProps } from '../types'

// Extended drawer props
interface AdminDrawerProps extends BaseAdminComponentProps {
  open: boolean
  onClose: () => void
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  position?: 'left' | 'right' | 'top' | 'bottom'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'overlay' | 'push' | 'mini'
  backdrop?: 'blur' | 'dark' | 'light' | 'none'
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  showCloseButton?: boolean
  resizable?: boolean
  collapsible?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  footer?: React.ReactNode
  header?: React.ReactNode
  persistent?: boolean
  lockBodyScroll?: boolean
}

// Position-based size variants
const sizeVariants = {
  left: {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
    xl: 'w-[30rem]',
    full: 'w-full'
  },
  right: {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
    xl: 'w-[30rem]',
    full: 'w-full'
  },
  top: {
    sm: 'h-64',
    md: 'h-80',
    lg: 'h-96',
    xl: 'h-[30rem]',
    full: 'h-full'
  },
  bottom: {
    sm: 'h-64',
    md: 'h-80',
    lg: 'h-96',
    xl: 'h-[30rem]',
    full: 'h-full'
  }
}

// Animation variants based on position
const getAnimationVariants = (position: 'left' | 'right' | 'top' | 'bottom') => {
  const variants = {
    left: {
      initial: { x: '-100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '-100%', opacity: 0 }
    },
    right: {
      initial: { x: '100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '100%', opacity: 0 }
    },
    top: {
      initial: { y: '-100%', opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: '-100%', opacity: 0 }
    },
    bottom: {
      initial: { y: '100%', opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: '100%', opacity: 0 }
    }
  }
  return variants[position]
}

// Position-based positioning classes
const positionClasses = {
  left: 'top-0 left-0 h-full',
  right: 'top-0 right-0 h-full',
  top: 'top-0 left-0 w-full',
  bottom: 'bottom-0 left-0 w-full'
}

// Focus trap hook (reused from AdminModal)
const useFocusTrap = (containerRef: React.RefObject<HTMLElement>, isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return

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

    firstElement?.focus()

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen, containerRef])
}

export const AdminDrawer: React.FC<AdminDrawerProps> = ({
  open,
  onClose,
  onOpenChange,
  title,
  description,
  position = 'right',
  size = 'md',
  variant = 'overlay',
  backdrop = 'blur',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  resizable = false,
  collapsible = false,
  collapsed = false,
  onCollapsedChange,
  footer,
  header,
  persistent = false,
  lockBodyScroll = true,
  children,
  className,
  'data-testid': testId = 'admin-drawer',
  ...props
}) => {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed)
  
  // Enable focus trap
  useFocusTrap(drawerRef, open)

  // Handle collapse toggle
  const handleCollapseToggle = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onCollapsedChange?.(newCollapsed)
  }

  // Handle close with persistence check
  const handleClose = () => {
    if (persistent) return
    onClose()
    onOpenChange?.(false)
  }

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick && !persistent) {
      handleClose()
    }
  }

  // Get animation variants
  const animationVariants = getAnimationVariants(position)

  // Get size classes based on position
  const sizeClass = sizeVariants[position][size]

  // Handle keyboard navigation and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc && !persistent) {
        handleClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      if (lockBodyScroll) {
        document.body.style.overflow = 'hidden'
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      if (lockBodyScroll) {
        document.body.style.overflow = 'unset'
      }
    }
  }, [open, closeOnEsc, persistent, lockBodyScroll])

  return (
    <Dialog.Root 
      open={open} 
      onOpenChange={onOpenChange || ((newOpen) => !newOpen && handleClose())}
    >
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            {backdrop !== 'none' && (
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'fixed inset-0 z-40',
                    {
                      'bg-black/20 backdrop-blur-sm': backdrop === 'blur',
                      'bg-black/50': backdrop === 'dark',
                      'bg-white/50': backdrop === 'light'
                    }
                  )}
                  onClick={handleOverlayClick}
                  data-testid={`${testId}-overlay`}
                />
              </Dialog.Overlay>
            )}

            {/* Drawer Content */}
            <Dialog.Content asChild>
              <motion.div
                ref={drawerRef}
                {...animationVariants}
                transition={{ 
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className={cn(
                  // Base positioning
                  'fixed z-50 bg-white shadow-2xl',
                  // Healthcare-compliant styling
                  'border border-slate-200',
                  // Position-specific classes
                  positionClasses[position],
                  // Size classes
                  !isCollapsed && sizeClass,
                  // Collapsed state
                  collapsible && isCollapsed && (
                    position === 'left' || position === 'right' ? 'w-16' : 'h-16'
                  ),
                  // Rounding based on position
                  {
                    'rounded-r-lg': position === 'left',
                    'rounded-l-lg': position === 'right',
                    'rounded-b-lg': position === 'top',
                    'rounded-t-lg': position === 'bottom'
                  },
                  // Flex direction based on position
                  {
                    'flex flex-col': position === 'top' || position === 'bottom',
                    'flex flex-col': position === 'left' || position === 'right'
                  },
                  className
                )}
                data-testid={testId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? `${testId}-title` : undefined}
                aria-describedby={description ? `${testId}-description` : undefined}
                {...props}
              >
                {/* Header */}
                {(title || header || showCloseButton || collapsible) && (
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* Collapse button */}
                      {collapsible && (
                        <button
                          onClick={handleCollapseToggle}
                          className={cn(
                            'p-1 rounded-md text-slate-400 hover:text-slate-600',
                            'hover:bg-slate-100 focus:outline-none focus:ring-2',
                            'focus:ring-blue-500 focus:ring-offset-2',
                            'transition-colors duration-200'
                          )}
                          aria-label={isCollapsed ? 'Expand drawer' : 'Collapse drawer'}
                          data-testid={`${testId}-collapse-button`}
                        >
                          {position === 'left' && (
                            isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
                          )}
                          {position === 'right' && (
                            isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      {/* Header content */}
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          {header || (
                            <>
                              {title && (
                                <Dialog.Title
                                  id={`${testId}-title`}
                                  className="text-lg font-semibold text-slate-900 leading-6 truncate"
                                >
                                  {title}
                                </Dialog.Title>
                              )}
                              {description && (
                                <Dialog.Description
                                  id={`${testId}-description`}
                                  className="mt-1 text-sm text-slate-600 truncate"
                                >
                                  {description}
                                </Dialog.Description>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Close button */}
                    {showCloseButton && !persistent && !isCollapsed && (
                      <Dialog.Close asChild>
                        <button
                          onClick={handleClose}
                          className={cn(
                            'ml-2 p-2 rounded-md text-slate-400 hover:text-slate-600',
                            'hover:bg-slate-100 focus:outline-none focus:ring-2',
                            'focus:ring-blue-500 focus:ring-offset-2',
                            'transition-colors duration-200 flex-shrink-0'
                          )}
                          aria-label="Close drawer"
                          data-testid={`${testId}-close-button`}
                        >
                          <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </Dialog.Close>
                    )}
                  </div>
                )}

                {/* Body */}
                {!isCollapsed && (
                  <div className="flex-1 overflow-y-auto p-4">
                    {children}
                  </div>
                )}

                {/* Footer */}
                {footer && !isCollapsed && (
                  <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
                    {footer}
                  </div>
                )}

                {/* Resize handle (if resizable) */}
                {resizable && !isCollapsed && (
                  <div
                    className={cn(
                      'absolute bg-slate-300 hover:bg-slate-400 transition-colors duration-200',
                      {
                        'top-0 right-0 w-1 h-full cursor-ew-resize': position === 'left',
                        'top-0 left-0 w-1 h-full cursor-ew-resize': position === 'right',
                        'bottom-0 left-0 w-full h-1 cursor-ns-resize': position === 'top',
                        'top-0 left-0 w-full h-1 cursor-ns-resize': position === 'bottom'
                      }
                    )}
                    data-testid={`${testId}-resize-handle`}
                  />
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

// Export default and named
export default AdminDrawer