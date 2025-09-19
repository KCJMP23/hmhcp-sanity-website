/**
 * AdminModal Component
 * Healthcare-compliant modal with multiple size variants and advanced accessibility features
 */

'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminModalProps, BaseAdminComponentProps } from '../types'

// Extended props for additional modal features
interface ExtendedAdminModalProps extends AdminModalProps {
  variant?: 'default' | 'centered' | 'drawer' | 'fullscreen'
  backdrop?: 'blur' | 'dark' | 'light'
  animation?: 'fade' | 'scale' | 'slide-up' | 'slide-down'
  closeButton?: boolean
  persistent?: boolean
  maxHeight?: string
  onOpenChange?: (open: boolean) => void
}

// Size variant classes
const sizeVariants = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-none w-full h-full'
}

// Animation variants
const animationVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  },
  'slide-up': {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  'slide-down': {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }
}

// Focus trap hook
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

    // Focus first element when modal opens
    firstElement?.focus()

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen, containerRef])
}

export const AdminModal: React.FC<ExtendedAdminModalProps> = ({
  open,
  onClose,
  onOpenChange,
  title,
  description,
  size = 'md',
  variant = 'default',
  backdrop = 'blur',
  animation = 'scale',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  closeButton = true,
  persistent = false,
  maxHeight = '90vh',
  footer,
  children,
  className,
  'data-testid': testId,
  ...props
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  
  // Enable focus trap
  useFocusTrap(modalRef, open)

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

  // Keyboard navigation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc && !persistent) {
        handleClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, closeOnEsc, persistent])

  return (
    <Dialog.Root 
      open={open} 
      onOpenChange={onOpenChange || ((newOpen) => !newOpen && handleClose())}
    >
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'fixed inset-0 z-50',
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

            {/* Modal Content */}
            <Dialog.Content asChild>
              <motion.div
                ref={modalRef}
                {...animationVariants[animation]}
                transition={{ 
                  duration: 0.2,
                  ease: [0.4, 0, 0.2, 1] // Healthcare-appropriate easing
                }}
                className={cn(
                  // Base positioning and sizing
                  'fixed z-50 bg-white shadow-2xl',
                  // Healthcare-compliant styling
                  'border border-slate-200 rounded-lg',
                  // Size variants
                  sizeVariants[size],
                  // Variant-specific positioning
                  {
                    'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2': variant === 'centered' || variant === 'default',
                    'top-0 right-0 h-full rounded-l-lg rounded-r-none': variant === 'drawer',
                    'inset-0 rounded-none': variant === 'fullscreen'
                  },
                  // Max height constraint
                  variant !== 'fullscreen' && 'max-h-[90vh] overflow-hidden',
                  className
                )}
                style={{
                  maxHeight: variant !== 'fullscreen' ? maxHeight : undefined
                }}
                data-testid={testId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? `${testId}-title` : undefined}
                aria-describedby={description ? `${testId}-description` : undefined}
                {...props}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex-1">
                      {title && (
                        <Dialog.Title
                          id={`${testId}-title`}
                          className="text-lg font-semibold text-slate-900 leading-6"
                        >
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description
                          id={`${testId}-description`}
                          className="mt-1 text-sm text-slate-600"
                        >
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    
                    {showCloseButton && !persistent && (
                      <Dialog.Close asChild>
                        <button
                          onClick={handleClose}
                          className={cn(
                            'ml-4 p-2 rounded-md text-slate-400 hover:text-slate-600',
                            'hover:bg-slate-100 focus:outline-none focus:ring-2',
                            'focus:ring-blue-500 focus:ring-offset-2',
                            'transition-colors duration-200'
                          )}
                          aria-label="Close modal"
                          data-testid={`${testId}-close-button`}
                        >
                          <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </Dialog.Close>
                    )}
                  </div>
                )}

                {/* Body */}
                <div 
                  className={cn(
                    'flex-1 overflow-y-auto',
                    (title || showCloseButton) && footer ? 'p-6' : 'p-6',
                    !title && !showCloseButton && !footer && 'p-0'
                  )}
                >
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                    {footer}
                  </div>
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
export default AdminModal