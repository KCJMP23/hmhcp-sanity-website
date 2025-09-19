/**
 * AdminTooltip Component
 * Healthcare-compliant contextual help tooltip with rich content support
 */

'use client'

import React from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Info, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BaseAdminComponentProps, AdminSeverity } from '../types'

// Extended tooltip props
interface AdminTooltipProps extends BaseAdminComponentProps {
  content: React.ReactNode
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
  // Behavior
  open?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
  skipDelayDuration?: number
  disableHoverableContent?: boolean
  // Styling
  variant?: 'default' | 'help' | 'info' | 'warning' | 'error' | 'success'
  severity?: AdminSeverity
  size?: 'sm' | 'md' | 'lg'
  maxWidth?: string
  // Healthcare-specific
  medicalContext?: boolean
  hipaaCompliant?: boolean
  // Advanced features
  arrow?: boolean
  portal?: boolean
  forceMount?: boolean
  title?: string
  description?: string
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'link'
  }>
}

// Variant configurations
const variantConfig = {
  default: {
    icon: null,
    bgColor: 'bg-slate-900',
    textColor: 'text-white',
    borderColor: 'border-slate-200'
  },
  help: {
    icon: HelpCircle,
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-200'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 border border-blue-200',
    textColor: 'text-blue-900',
    borderColor: 'border-blue-200'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-amber-50 border border-amber-200',
    textColor: 'text-amber-900',
    borderColor: 'border-amber-200'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 border border-red-200',
    textColor: 'text-red-900',
    borderColor: 'border-red-200'
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 border border-green-200',
    textColor: 'text-green-900',
    borderColor: 'border-green-200'
  }
}

// Size variants
const sizeVariants = {
  sm: 'text-xs max-w-xs p-2',
  md: 'text-sm max-w-sm p-3',
  lg: 'text-base max-w-md p-4'
}

// Default trigger button
const DefaultTrigger: React.FC<{
  variant: keyof typeof variantConfig
  className?: string
  triggerProps?: React.HTMLAttributes<HTMLButtonElement>
}> = ({ variant, className, triggerProps }) => {
  const config = variantConfig[variant]
  const Icon = config.icon || HelpCircle

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center w-5 h-5 rounded-full',
        'text-slate-400 hover:text-slate-600 focus:outline-none',
        'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'transition-colors duration-200',
        className
      )}
      aria-label="Show help"
      {...triggerProps}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </button>
  )
}

export const AdminTooltip: React.FC<AdminTooltipProps> = ({
  content,
  trigger,
  triggerProps,
  asChild = false,
  side = 'top',
  align = 'center',
  sideOffset = 4,
  alignOffset = 0,
  avoidCollisions = true,
  open,
  onOpenChange,
  delayDuration = 200,
  skipDelayDuration = 300,
  disableHoverableContent = false,
  variant = 'default',
  severity,
  size = 'md',
  maxWidth = '20rem',
  medicalContext = false,
  hipaaCompliant = false,
  arrow = true,
  portal = true,
  forceMount = false,
  title,
  description,
  actions,
  children,
  className,
  'data-testid': testId = 'admin-tooltip',
  ...props
}) => {
  // Use severity to determine variant if both are provided
  const effectiveVariant = severity ? severity === 'critical' ? 'error' : severity : variant
  const config = variantConfig[effectiveVariant]

  // Tooltip content component
  const TooltipContent = (
    <Tooltip.Content
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      avoidCollisions={avoidCollisions}
      className={cn(
        // Base styles
        'rounded-lg shadow-lg z-50 overflow-hidden',
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        // Slide animations based on side
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        // Variant styling
        config.bgColor,
        config.textColor,
        // Size variants
        sizeVariants[size],
        // Healthcare compliance styling
        medicalContext && 'border-2 border-blue-300',
        hipaaCompliant && 'shadow-xl',
        className
      )}
      style={{ maxWidth }}
      data-testid={`${testId}-content`}
      {...props}
    >
      {/* Title and icon header */}
      {(title || config.icon) && (
        <div className="flex items-start space-x-2 mb-2">
          {config.icon && (
            <config.icon className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          )}
          {title && (
            <div className="font-medium text-sm leading-5">
              {title}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="leading-5">
        {description && (
          <div className="mb-2 text-sm opacity-90">
            {description}
          </div>
        )}
        {content}
      </div>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-current border-opacity-20">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={cn(
                'text-xs px-2 py-1 rounded transition-colors duration-200',
                {
                  'bg-white bg-opacity-20 hover:bg-opacity-30': action.variant === 'primary' || !action.variant,
                  'opacity-75 hover:opacity-100': action.variant === 'secondary',
                  'underline hover:no-underline': action.variant === 'link'
                }
              )}
              data-testid={`${testId}-action-${index}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Healthcare compliance indicator */}
      {hipaaCompliant && (
        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
          <div className="text-xs opacity-75 flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            HIPAA Compliant
          </div>
        </div>
      )}

      {/* Arrow */}
      {arrow && (
        <Tooltip.Arrow 
          className={cn(
            'fill-current',
            effectiveVariant === 'default' ? 'text-slate-900' : 'text-current'
          )}
          width={11}
          height={5}
        />
      )}
    </Tooltip.Content>
  )

  const tooltipContent = portal ? (
    <Tooltip.Portal forceMount={forceMount ? true : undefined}>
      {TooltipContent}
    </Tooltip.Portal>
  ) : TooltipContent

  return (
    <Tooltip.Provider 
      delayDuration={delayDuration} 
      skipDelayDuration={skipDelayDuration}
      disableHoverableContent={disableHoverableContent}
    >
      <Tooltip.Root 
        open={open} 
        onOpenChange={onOpenChange}
        delayDuration={delayDuration}
      >
        <Tooltip.Trigger asChild={asChild || !!trigger}>
          {trigger || children || (
            <DefaultTrigger 
              variant={effectiveVariant}
              className={className}
              triggerProps={triggerProps}
            />
          )}
        </Tooltip.Trigger>

        <AnimatePresence>
          {tooltipContent}
        </AnimatePresence>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

// Convenience components for common use cases
export const HelpTooltip: React.FC<Omit<AdminTooltipProps, 'variant'>> = (props) => (
  <AdminTooltip variant="help" {...props} />
)

export const InfoTooltip: React.FC<Omit<AdminTooltipProps, 'variant'>> = (props) => (
  <AdminTooltip variant="info" {...props} />
)

export const WarningTooltip: React.FC<Omit<AdminTooltipProps, 'variant'>> = (props) => (
  <AdminTooltip variant="warning" {...props} />
)

export const ErrorTooltip: React.FC<Omit<AdminTooltipProps, 'variant'>> = (props) => (
  <AdminTooltip variant="error" {...props} />
)

export const SuccessTooltip: React.FC<Omit<AdminTooltipProps, 'variant'>> = (props) => (
  <AdminTooltip variant="success" {...props} />
)

// Export default and named
export default AdminTooltip