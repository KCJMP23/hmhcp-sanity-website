/**
 * @fileoverview AdminProgressBar Component - Healthcare-compliant progress bar for long operations
 * @module components/admin/ui/loading/AdminProgressBar
 * @since 1.0.0
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Progress bar variant configuration using class-variance-authority
 * Defines size, color, and animation variations
 * @private
 */
const progressBarVariants = cva('relative overflow-hidden rounded-full bg-gray-200', {
  variants: {
    size: {
      xs: 'h-1',
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4',
      xl: 'h-6',
    },
    color: {
      primary: '[&>.progress-fill]:bg-blue-600',
      secondary: '[&>.progress-fill]:bg-gray-600',
      success: '[&>.progress-fill]:bg-green-600',
      warning: '[&>.progress-fill]:bg-yellow-600',
      danger: '[&>.progress-fill]:bg-red-600',
      info: '[&>.progress-fill]:bg-cyan-600',
    },
    variant: {
      default: '',
      striped: '[&>.progress-fill]:bg-gradient-to-r [&>.progress-fill]:from-current [&>.progress-fill]:to-transparent [&>.progress-fill]:bg-[length:1rem_1rem]',
      animated: '[&>.progress-fill]:animate-progress-slide [&>.progress-fill]:bg-gradient-to-r [&>.progress-fill]:from-current [&>.progress-fill]:to-transparent [&>.progress-fill]:bg-[length:1rem_1rem]',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'primary',
    variant: 'default',
  },
})

/**
 * Props interface for AdminProgressBar component
 * @interface AdminProgressBarProps
 * @extends {Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>}
 * @extends {VariantProps<typeof progressBarVariants>}
 */
export interface AdminProgressBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof progressBarVariants> {
  /** 
   * Current progress value (0-100)
   * @required
   */
  value: number
  /** 
   * Maximum value
   * @default 100
   */
  max?: number
  /** 
   * Show percentage label
   * @default false
   */
  showLabel?: boolean
  /** 
   * Label position relative to progress bar
   * @default 'outside'
   */
  labelPosition?: 'inside' | 'outside' | 'top' | 'bottom'
  /** 
   * Custom label text (overrides percentage)
   */
  label?: string
  /** 
   * Indeterminate state (shows animated progress without specific value)
   * @default false
   */
  indeterminate?: boolean
  /** 
   * Buffer value for buffered progress (e.g., video buffering)
   */
  bufferValue?: number
  /** 
   * Accessibility label for screen readers
   */
  ariaLabel?: string
}

/**
 * AdminProgressBar Component
 * 
 * A flexible progress bar component for healthcare admin interfaces.
 * Supports determinate, indeterminate, and buffered progress states.
 * Provides multiple size, color, and label positioning options.
 * 
 * @component
 * @param {AdminProgressBarProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {React.ReactElement} Rendered progress bar component
 * 
 * @example
 * // Basic progress bar
 * <AdminProgressBar value={60} />
 * 
 * @example
 * // With percentage label
 * <AdminProgressBar value={75} showLabel />
 * 
 * @example
 * // Custom label and position
 * <AdminProgressBar 
 *   value={80} 
 *   showLabel 
 *   label="Processing..." 
 *   labelPosition="inside" 
 * />
 * 
 * @example
 * // Indeterminate state
 * <AdminProgressBar indeterminate />
 * 
 * @example
 * // Buffered progress (e.g., video player)
 * <AdminProgressBar value={30} bufferValue={60} />
 * 
 * @example
 * // Striped animated variant
 * <AdminProgressBar value={50} variant="animated" color="success" />
 * 
 * @since 1.0.0
 */
export const AdminProgressBar = React.forwardRef<HTMLDivElement, AdminProgressBarProps>(
  (
    {
      className,
      size,
      color,
      variant,
      value,
      max = 100,
      showLabel = false,
      labelPosition = 'outside',
      label,
      indeterminate = false,
      bufferValue,
      ariaLabel,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const bufferPercentage = bufferValue
      ? Math.min(Math.max((bufferValue / max) * 100, 0), 100)
      : undefined

    const progressLabel = label || `${Math.round(percentage)}%`

    /**
   * Renders the progress label based on position and visibility settings
   * @private
   * @returns {React.ReactElement | null} Label element or null
   */
  const renderLabel = () => {
      if (!showLabel) return null

      const labelClass = cn(
        'text-sm font-medium',
        labelPosition === 'inside' && 'absolute inset-0 flex items-center justify-center z-10',
        labelPosition === 'top' && 'mb-2',
        labelPosition === 'bottom' && 'mt-2',
        labelPosition === 'outside' && 'ml-3',
        size === 'xs' && labelPosition === 'inside' && 'text-xs',
        (color === 'primary' || color === 'info') && labelPosition === 'inside' && percentage > 50 && 'text-white'
      )

      return <span className={labelClass}>{progressLabel}</span>
    }

    return (
      <div className={cn('w-full', className)} {...props}>
        {showLabel && labelPosition === 'top' && renderLabel()}
        <div className={cn('flex items-center', labelPosition === 'outside' && 'gap-3')}>
          <div
            ref={ref}
            className={cn(progressBarVariants({ size, color, variant }), 'flex-1')}
            role="progressbar"
            aria-label={ariaLabel || `Progress: ${progressLabel}`}
            aria-valuenow={indeterminate ? undefined : value}
            aria-valuemin={0}
            aria-valuemax={max}
          >
            {bufferPercentage !== undefined && (
              <div
                className="absolute inset-y-0 left-0 bg-gray-300 transition-all duration-300 ease-out"
                style={{ width: `${bufferPercentage}%` }}
              />
            )}
            <div
              className={cn(
                'progress-fill absolute inset-y-0 left-0 transition-all duration-300 ease-out',
                indeterminate && 'animate-progress-indeterminate w-1/3'
              )}
              style={!indeterminate ? { width: `${percentage}%` } : undefined}
            >
              {showLabel && labelPosition === 'inside' && renderLabel()}
            </div>
          </div>
          {showLabel && labelPosition === 'outside' && renderLabel()}
        </div>
        {showLabel && labelPosition === 'bottom' && renderLabel()}
      </div>
    )
  }
)

AdminProgressBar.displayName = 'AdminProgressBar'

/**
 * Props interface for AdminProgressSteps component
 * @interface AdminProgressStepsProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
export interface AdminProgressStepsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 
   * Current step (0-indexed)
   * @required
   */
  currentStep: number
  /** 
   * Total number of steps or array of step labels
   * @required
   */
  steps: string[] | number
  /** 
   * Color scheme for completed steps
   * @default 'primary'
   */
  color?: 'primary' | 'success' | 'warning' | 'danger'
  /** 
   * Show step labels below circles
   * @default true
   */
  showLabels?: boolean
  /** 
   * Size variant for step indicators
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * AdminProgressSteps Component
 * 
 * A step indicator component for multi-step processes and wizards.
 * Shows progress through a series of steps with visual feedback.
 * 
 * @component
 * @param {AdminProgressStepsProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {React.ReactElement} Rendered progress steps component
 * 
 * @example
 * // Basic usage with number of steps
 * <AdminProgressSteps currentStep={2} steps={5} />
 * 
 * @example
 * // With custom step labels
 * <AdminProgressSteps 
 *   currentStep={1} 
 *   steps={['Account', 'Profile', 'Settings', 'Review']} 
 * />
 * 
 * @example
 * // Different color and size
 * <AdminProgressSteps 
 *   currentStep={3} 
 *   steps={4} 
 *   color="success" 
 *   size="lg" 
 * />
 * 
 * @example
 * // Without labels
 * <AdminProgressSteps 
 *   currentStep={0} 
 *   steps={3} 
 *   showLabels={false} 
 * />
 * 
 * @since 1.0.0
 */
export const AdminProgressSteps = React.forwardRef<HTMLDivElement, AdminProgressStepsProps>(
  (
    {
      className,
      currentStep,
      steps,
      color = 'primary',
      showLabels = true,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const stepArray = typeof steps === 'number' ? Array.from({ length: steps }, (_, i) => `Step ${i + 1}`) : steps
    const totalSteps = stepArray.length

    const sizeClasses = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
    }

    const colorClasses = {
      primary: 'bg-blue-600 text-white',
      success: 'bg-green-600 text-white',
      warning: 'bg-yellow-600 text-white',
      danger: 'bg-red-600 text-white',
    }

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <div className="relative flex items-center justify-between">
          {stepArray.map((step, index) => {
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep
            const isUpcoming = index > currentStep

            return (
              <div key={index} className="flex flex-col items-center">
                <div className="relative flex items-center">
                  {index > 0 && (
                    <div
                      className={cn(
                        'absolute right-full h-0.5 bg-gray-300',
                        isCompleted && colorClasses[color].split(' ')[0],
                        size === 'sm' && 'w-8 md:w-12 lg:w-16',
                        size === 'md' && 'w-10 md:w-16 lg:w-20',
                        size === 'lg' && 'w-12 md:w-20 lg:w-24'
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-full border-2 font-semibold transition-all',
                      sizeClasses[size],
                      isCompleted && colorClasses[color],
                      isCurrent && `border-current ${colorClasses[color]}`,
                      isUpcoming && 'border-gray-300 bg-white text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                </div>
                {showLabels && (
                  <span
                    className={cn(
                      'mt-2 text-center text-xs font-medium',
                      isCurrent ? 'text-gray-900' : 'text-gray-500'
                    )}
                  >
                    {step}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)

AdminProgressSteps.displayName = 'AdminProgressSteps'