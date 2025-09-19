/**
 * Icon Component Wrapper
 * Standardizes icon sizes across the entire application
 * Part of the unified design system
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

const iconVariants = cva(
  'inline-flex shrink-0',
  {
    variants: {
      size: {
        xs: 'w-3 h-3',    // 12px - Extra small icons
        sm: 'w-4 h-4',    // 16px - Small icons
        md: 'w-5 h-5',    // 20px - Medium icons (default)
        lg: 'w-6 h-6',    // 24px - Large icons
        xl: 'w-8 h-8',    // 32px - Extra large icons
        '2xl': 'w-10 h-10', // 40px - 2X large icons
        '3xl': 'w-12 h-12', // 48px - 3X large icons
      },
      color: {
        default: 'text-current',
        primary: 'text-blue-600 dark:text-blue-400',
        secondary: 'text-gray-600 dark:text-gray-400',
        success: 'text-green-600 dark:text-green-400',
        warning: 'text-amber-600 dark:text-amber-400',
        error: 'text-red-600 dark:text-red-400',
        muted: 'text-gray-400 dark:text-gray-600',
      }
    },
    defaultVariants: {
      size: 'md',
      color: 'default',
    },
  }
)

export interface IconProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'size' | 'color'>,
    VariantProps<typeof iconVariants> {
  icon: LucideIcon
}

/**
 * Icon component that wraps Lucide icons with consistent sizing
 * 
 * @example
 * ```tsx
 * import { Icon } from '@/components/ui/icon'
 * import { Settings } from 'lucide-react'
 * 
 * <Icon icon={Settings} size="lg" color="primary" />
 * ```
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComponent, className, size, color, ...props }, ref) => {
    return (
      <IconComponent
        ref={ref}
        className={cn(iconVariants({ size, color }), className)}
        {...props}
      />
    )
  }
)
Icon.displayName = 'Icon'

/**
 * IconContainer component for icons with background
 * Used for feature cards, service icons, etc.
 */
const iconContainerVariants = cva(
  'inline-flex items-center justify-center rounded-xl transition-all duration-200',
  {
    variants: {
      size: {
        sm: 'w-8 h-8',     // 32px container
        md: 'w-12 h-12',   // 48px container (default)
        lg: 'w-14 h-14',   // 56px container
        xl: 'w-16 h-16',   // 64px container
        '2xl': 'w-20 h-20', // 80px container
      },
      variant: {
        glass: 'bg-white/20 backdrop-blur-md border border-white/30',
        solid: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
        outline: 'border-2 border-gray-200 dark:border-gray-700',
        ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
      }
    },
    defaultVariants: {
      size: 'md',
      variant: 'solid',
    },
  }
)

export interface IconContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconContainerVariants> {
  children: React.ReactNode
}

export const IconContainer = React.forwardRef<HTMLDivElement, IconContainerProps>(
  ({ className, size, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(iconContainerVariants({ size, variant }), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
IconContainer.displayName = 'IconContainer'

// Export variants for external use
export { iconVariants, iconContainerVariants }