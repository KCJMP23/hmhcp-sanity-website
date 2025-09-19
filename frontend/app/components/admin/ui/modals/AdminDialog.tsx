/**
 * AdminDialog Component
 * Healthcare-compliant confirmation dialog with enhanced accessibility
 */

'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { AlertTriangle, Info, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BaseAdminComponentProps, AdminSeverity } from '../types'

// Dialog button configuration
interface DialogButton {
  label: string
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  autoFocus?: boolean
}

// Extended dialog props
interface AdminDialogProps extends BaseAdminComponentProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  severity?: AdminSeverity | 'question'
  content?: React.ReactNode
  buttons?: DialogButton[]
  // Quick action configurations
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  destructive?: boolean
  // Advanced options
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  persistent?: boolean
  size?: 'sm' | 'md' | 'lg'
  animation?: 'scale' | 'fade' | 'slide-up'
}

// Severity icons mapping
const severityIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  critical: XCircle,
  question: HelpCircle
}

// Severity colors
const severityColors = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
  critical: 'text-red-600',
  question: 'text-slate-500'
}

// Button variant styles
const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 focus:ring-slate-500',
  danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
  outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus:ring-blue-500'
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
  }
}

// Size variants
const sizeVariants = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg'
}

export const AdminDialog: React.FC<AdminDialogProps> = ({
  open,
  onClose,
  title,
  description,
  severity = 'info',
  content,
  buttons,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  closeOnOverlayClick = false,
  closeOnEsc = true,
  persistent = false,
  size = 'md',
  animation = 'scale',
  children,
  className,
  'data-testid': testId = 'admin-dialog',
  ...props
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [isConfirmLoading, setIsConfirmLoading] = React.useState(false)

  // Get severity icon and color
  const SeverityIcon = severityIcons[severity]
  const severityColor = severityColors[severity]

  // Handle confirm action
  const handleConfirm = async () => {
    if (!onConfirm) return
    
    try {
      setIsConfirmLoading(true)
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Dialog confirm error:', error)
    } finally {
      setIsConfirmLoading(false)
    }
  }

  // Handle cancel action
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onClose()
  }

  // Handle close with persistence check
  const handleClose = () => {
    if (persistent) return
    onClose()
  }

  // Default buttons if none provided
  const defaultButtons: DialogButton[] = [
    {
      label: cancelText,
      variant: 'outline',
      onClick: handleCancel
    },
    {
      label: confirmText,
      variant: destructive ? 'danger' : 'primary',
      onClick: handleConfirm,
      loading: isConfirmLoading,
      autoFocus: true
    }
  ]

  const dialogButtons = buttons || (onConfirm ? defaultButtons : [
    {
      label: 'OK',
      variant: 'primary' as const,
      onClick: onClose,
      autoFocus: true
    }
  ])

  // Keyboard navigation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc && !persistent) {
        handleClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, closeOnEsc, persistent])

  return (
    <AlertDialog.Root open={open} onOpenChange={(newOpen) => !newOpen && handleClose()}>
      <AnimatePresence>
        {open && (
          <AlertDialog.Portal forceMount>
            {/* Backdrop */}
            <AlertDialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
                onClick={closeOnOverlayClick ? handleClose : undefined}
                data-testid={`${testId}-overlay`}
              />
            </AlertDialog.Overlay>

            {/* Dialog Content */}
            <AlertDialog.Content asChild>
              <motion.div
                ref={dialogRef}
                {...animationVariants[animation]}
                transition={{ 
                  duration: 0.2,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className={cn(
                  // Base positioning and styling
                  'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
                  'bg-white shadow-2xl border border-slate-200 rounded-lg',
                  'p-6 w-full',
                  // Size variants
                  sizeVariants[size],
                  className
                )}
                data-testid={testId}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={`${testId}-title`}
                aria-describedby={description ? `${testId}-description` : undefined}
                {...props}
              >
                {/* Header with Icon */}
                <div className="flex items-start space-x-3">
                  {SeverityIcon && (
                    <div className={cn(
                      'flex-shrink-0 w-6 h-6 mt-0.5',
                      severityColor
                    )}>
                      <SeverityIcon className="w-6 h-6" aria-hidden="true" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <AlertDialog.Title
                      id={`${testId}-title`}
                      className="text-lg font-semibold text-slate-900 leading-6"
                    >
                      {title}
                    </AlertDialog.Title>
                    
                    {description && (
                      <AlertDialog.Description
                        id={`${testId}-description`}
                        className="mt-2 text-sm text-slate-600 leading-5"
                      >
                        {description}
                      </AlertDialog.Description>
                    )}
                  </div>
                </div>

                {/* Content */}
                {(content || children) && (
                  <div className="mt-4">
                    {content || children}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6">
                  {dialogButtons.map((button, index) => (
                    <button
                      key={index}
                      onClick={button.onClick}
                      disabled={button.disabled || button.loading}
                      autoFocus={button.autoFocus}
                      className={cn(
                        // Base button styles
                        'inline-flex items-center px-4 py-2 text-sm font-medium',
                        'rounded-md border-0 focus:outline-none focus:ring-2',
                        'focus:ring-offset-2 transition-colors duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        // Variant styles
                        buttonVariants[button.variant || 'primary']
                      )}
                      data-testid={`${testId}-button-${index}`}
                    >
                      {button.loading ? (
                        <div className="flex items-center">
                          <svg 
                            className="animate-spin -ml-1 mr-2 h-4 w-4" 
                            fill="none" 
                            viewBox="0 0 24 24"
                          >
                            <circle 
                              className="opacity-25" 
                              cx="12" 
                              cy="12" 
                              r="10" 
                              stroke="currentColor" 
                              strokeWidth="4"
                            />
                            <path 
                              className="opacity-75" 
                              fill="currentColor" 
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          {button.label}
                        </div>
                      ) : (
                        button.label
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        )}
      </AnimatePresence>
    </AlertDialog.Root>
  )
}

// Export default and named
export default AdminDialog