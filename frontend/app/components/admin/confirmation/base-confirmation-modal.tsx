'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Info,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Clock,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmationModalProps, ConfirmationRisk, ConfirmationConsequence } from './types'
import { getRiskConfig, keyboardShortcuts, animationDurations } from './config'

/**
 * Risk level icon mapping
 */
const riskIcons = {
  low: Info,
  medium: AlertTriangle,
  high: AlertOctagon,
  critical: ShieldAlert
}

/**
 * Consequence type icon mapping
 */
const consequenceIcons = {
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Lightbulb
}

/**
 * Base Confirmation Modal Component
 * Apple-inspired design with risk-based visual hierarchy
 */
export function BaseConfirmationModal({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  
  // Content
  title,
  description,
  customContent,
  
  // Risk and Action Context
  risk,
  action,
  entity,
  
  // Items and Context
  item,
  items,
  consequences = [],
  relatedItems = [],
  
  // Interaction Requirements
  typeToConfirm,
  requiresApproval = false,
  
  // Visual Customization
  icon,
  illustration,
  confirmButtonText,
  cancelButtonText = 'Cancel',
  variant = 'default',
  
  // State
  isLoading = false,
  error,
  
  // Undo Support
  undo,
  
  // Accessibility
  ariaLabel,
  ariaDescription
}: ConfirmationModalProps) {
  // Risk configuration
  const riskConfig = getRiskConfig(risk)
  const RiskIcon = icon ? () => icon as React.ReactElement : riskIcons[risk]
  
  // Internal state
  const [confirmText, setConfirmText] = useState('')
  const [isApproved, setIsApproved] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(riskConfig.requirements.delay)
  const [canConfirm, setCanConfirm] = useState(false)
  
  // Refs for keyboard navigation
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const typeToConfirmRef = useRef<HTMLInputElement>(null)
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('')
      setIsApproved(false)
      setTimeRemaining(riskConfig.requirements.delay)
      setCanConfirm(riskConfig.requirements.delay === 0)
    }
  }, [isOpen, riskConfig.requirements.delay])
  
  // Handle countdown timer for delayed confirmations
  useEffect(() => {
    if (isOpen && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 100
          if (newTime <= 0) {
            setCanConfirm(true)
            return 0
          }
          return newTime
        })
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, timeRemaining])
  
  // Check if all requirements are met
  const allRequirementsMet = useCallback(() => {
    // Time delay requirement
    if (!canConfirm) return false
    
    // Type-to-confirm requirement
    if (typeToConfirm?.enabled) {
      const expectedText = typeToConfirm.caseSensitive 
        ? typeToConfirm.phrase 
        : typeToConfirm.phrase.toLowerCase()
      const actualText = typeToConfirm.caseSensitive 
        ? confirmText 
        : confirmText.toLowerCase()
      
      if (expectedText !== actualText) return false
    }
    
    // Approval requirement
    if (requiresApproval && !isApproved) return false
    
    return true
  }, [canConfirm, typeToConfirm, confirmText, requiresApproval, isApproved])
  
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default for handled keys
      const handledKeys = [
        ...keyboardShortcuts.confirm,
        ...keyboardShortcuts.cancel,
        ...keyboardShortcuts.focusConfirm,
        ...keyboardShortcuts.focusCancel
      ]
      
      if (handledKeys.some(key => {
        if (key.includes('+')) {
          const [modifier, keyCode] = key.split('+')
          return (
            ((modifier === 'Ctrl' && event.ctrlKey) || (modifier === 'Cmd' && event.metaKey)) &&
            event.code === keyCode
          )
        }
        return event.code === key || event.key === key
      })) {
        event.preventDefault()
      }
      
      // Handle confirm
      if (keyboardShortcuts.confirm.includes(event.key) || keyboardShortcuts.confirm.includes(event.code)) {
        if (allRequirementsMet() && !isLoading) {
          handleConfirm()
        }
      }
      
      // Handle cancel
      if (keyboardShortcuts.cancel.includes(event.key) || keyboardShortcuts.cancel.includes(event.code)) {
        handleCancel()
      }
      
      // Handle focus management
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift+Tab - focus cancel
          event.preventDefault()
          cancelButtonRef.current?.focus()
        } else {
          // Tab - focus confirm or type-to-confirm
          event.preventDefault()
          if (typeToConfirm?.enabled) {
            typeToConfirmRef.current?.focus()
          } else {
            confirmButtonRef.current?.focus()
          }
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, allRequirementsMet, isLoading])
  
  // Auto-focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the appropriate element based on requirements
      setTimeout(() => {
        if (typeToConfirm?.enabled) {
          typeToConfirmRef.current?.focus()
        } else if (canConfirm) {
          confirmButtonRef.current?.focus()
        } else {
          cancelButtonRef.current?.focus()
        }
      }, 100)
    }
  }, [isOpen, typeToConfirm?.enabled, canConfirm])
  
  // Handlers
  const handleConfirm = async () => {
    if (!allRequirementsMet() || isLoading) return
    
    try {
      await onConfirm()
    } catch (error) {
      console.error('Confirmation action failed:', error)
    }
  }
  
  const handleCancel = () => {
    if (isLoading) return
    onCancel?.()
    onOpenChange(false)
  }
  
  // Format countdown display
  const formatCountdown = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    return seconds > 0 ? `${seconds}s` : ''
  }
  
  // Generate item summary text
  const getItemSummary = () => {
    if (items && items.length > 0) {
      return `${items.length} item${items.length > 1 ? 's' : ''}`
    }
    if (item?.title || item?.name) {
      return `"${item.title || item.name}"`
    }
    return 'this item'
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm" />
        <DialogContent
          className={cn(
            'max-w-md w-full mx-auto p-0 overflow-hidden',
            'border-0 shadow-2xl',
            'font-display', // Apple-inspired typography
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            risk === 'low' && 'focus:ring-blue-500',
            risk === 'medium' && 'focus:ring-amber-500',
            risk === 'high' && 'focus:ring-red-500',
            risk === 'critical' && 'focus:ring-pink-600'
          )}
          aria-label={ariaLabel || `${risk} risk confirmation`}
          aria-describedby={ariaDescription}
        >
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{
                duration: riskConfig.animation.duration / 1000,
                ease: [0.42, 0, 0.58, 1] // Apple's easing curve
              }}
              className="relative"
            >
              {/* Header with risk indicator */}
              <div
                className={cn(
                  'px-6 pt-6 pb-4',
                  risk === 'low' && 'bg-gradient-to-br from-blue-50 to-slate-50',
                  risk === 'medium' && 'bg-gradient-to-br from-amber-50 to-orange-50',
                  risk === 'high' && 'bg-gradient-to-br from-red-50 to-pink-50',
                  risk === 'critical' && 'bg-gradient-to-br from-pink-50 to-rose-50'
                )}
              >
                <DialogHeader className="space-y-3">
                  {/* Risk indicator and icon */}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex-shrink-0 p-2 rounded-lg',
                        risk === 'low' && 'bg-blue-100 text-blue-600',
                        risk === 'medium' && 'bg-amber-100 text-amber-600',
                        risk === 'high' && 'bg-red-100 text-red-600',
                        risk === 'critical' && 'bg-pink-100 text-pink-600'
                      )}
                    >
                      <RiskIcon className={riskConfig.icon.size} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Risk level badge */}
                      <Badge
                        variant="outline"
                        className={cn(
                          'mb-2 text-xs font-medium border-current',
                          risk === 'low' && 'text-blue-700 bg-blue-50 border-blue-200',
                          risk === 'medium' && 'text-amber-700 bg-amber-50 border-amber-200',
                          risk === 'high' && 'text-red-700 bg-red-50 border-red-200',
                          risk === 'critical' && 'text-pink-700 bg-pink-50 border-pink-200'
                        )}
                      >
                        {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
                      </Badge>
                      
                      {/* Title */}
                      <DialogTitle className="text-lg font-semibold text-gray-900 leading-tight">
                        {title || `Confirm ${action.replace('_', ' ')}`}
                      </DialogTitle>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <DialogDescription className="text-sm text-gray-600 leading-relaxed">
                    {description || `Are you sure you want to ${action.replace('_', ' ')} ${getItemSummary()}?`}
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              {/* Content area */}
              <div className="px-6 py-4 bg-white">
                {/* Custom content */}
                {customContent && (
                  <div className="mb-4">
                    {customContent}
                  </div>
                )}
                
                {/* Item details */}
                {item && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-900">
                      {item.title || item.name}
                    </div>
                    {item.type && (
                      <div className="text-xs text-gray-500 mt-1">
                        {item.type}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Batch items preview */}
                {items && items.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Affected items ({items.length}):
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {items.slice(0, 5).map((item, index) => (
                        <div key={item.id} className="text-xs text-gray-600 px-2 py-1 bg-gray-50 rounded">
                          {item.title || item.name}
                        </div>
                      ))}
                      {items.length > 5 && (
                        <div className="text-xs text-gray-500 px-2 py-1">
                          +{items.length - 5} more items...
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Consequences */}
                {consequences.length > 0 && (
                  <div className="mb-4 space-y-3">
                    <Separator />
                    {consequences.map((consequence, index) => {
                      const ConsequenceIcon = consequenceIcons[consequence.type]
                      return (
                        <div key={index} className="flex items-start gap-2">
                          <ConsequenceIcon
                            className={cn(
                              'h-4 w-4 mt-0.5 flex-shrink-0',
                              consequence.type === 'warning' && 'text-amber-500',
                              consequence.type === 'danger' && 'text-red-500',
                              consequence.type === 'info' && 'text-blue-500'
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {consequence.title}
                            </div>
                            <div className="text-xs text-gray-600 leading-relaxed">
                              {consequence.description}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {/* Related items */}
                {relatedItems.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Related items that will be affected:
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      {relatedItems.map((related, index) => (
                        <div key={related.id} className="flex justify-between">
                          <span>{related.title}</span>
                          <span className="text-gray-400">({related.relationship})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Type-to-confirm */}
                {typeToConfirm?.enabled && (
                  <div className="mb-4">
                    <Separator className="mb-3" />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900">
                        Type <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                          {typeToConfirm.phrase}
                        </code> to confirm:
                      </label>
                      <Input
                        ref={typeToConfirmRef}
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={typeToConfirm.placeholder || 'Type to confirm'}
                        className="font-mono"
                        disabled={isLoading}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                )}
                
                {/* Additional approval checkbox */}
                {requiresApproval && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="approval"
                        checked={isApproved}
                        onCheckedChange={(checked) => setIsApproved(checked === true)}
                        disabled={isLoading}
                      />
                      <label
                        htmlFor="approval"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        I understand the consequences and want to proceed
                      </label>
                    </div>
                  </div>
                )}
                
                {/* Error display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <div className="text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer with actions */}
              <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center w-full">
                  {/* Countdown timer */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {timeRemaining > 0 && (
                      <>
                        <Clock className="h-3 w-3" />
                        <span>Wait {formatCountdown(timeRemaining)}</span>
                      </>
                    )}
                    {undo?.enabled && (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Can be undone</span>
                      </>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      ref={cancelButtonRef}
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="font-medium"
                    >
                      {cancelButtonText}
                    </Button>
                    
                    <Button
                      ref={confirmButtonRef}
                      onClick={handleConfirm}
                      disabled={!allRequirementsMet() || isLoading}
                      className={cn(
                        'font-medium transition-all duration-200',
                        // Risk-based button styling
                        risk === 'low' && 'bg-blue-600 hover:bg-blue-700 text-white',
                        risk === 'medium' && 'bg-amber-600 hover:bg-amber-700 text-white',
                        risk === 'high' && 'bg-red-600 hover:bg-red-700 text-white',
                        risk === 'critical' && 'bg-pink-600 hover:bg-pink-700 text-white',
                        // Disabled state
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        confirmButtonText || 'Confirm'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}