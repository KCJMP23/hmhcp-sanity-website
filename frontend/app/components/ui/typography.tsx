/**
 * Typography Component System
 * Standardized typography with consistent sizing and styling
 * Part of the unified design system
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Heading variants with consistent responsive scaling
 * Based on the design tokens and Apple Typography patterns
 */
const headingVariants = cva(
  'font-display tracking-tight',
  {
    variants: {
      level: {
        h1: 'text-4xl md:text-5xl lg:text-6xl font-light leading-tight',
        h2: 'text-3xl md:text-4xl lg:text-5xl font-light leading-tight',
        h3: 'text-2xl md:text-3xl font-medium leading-snug',
        h4: 'text-xl md:text-2xl font-medium leading-snug',
        h5: 'text-lg md:text-xl font-medium leading-normal',
        h6: 'text-base md:text-lg font-medium leading-normal',
      },
      color: {
        default: 'text-gray-900 dark:text-gray-100',
        primary: 'text-blue-600 dark:text-blue-400',
        muted: 'text-gray-600 dark:text-gray-400',
      }
    },
    defaultVariants: {
      level: 'h2',
      color: 'default',
    },
  }
)

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

/**
 * Heading component with standardized sizes
 * 
 * @example
 * ```tsx
 * <Heading level="h1">Main Title</Heading>
 * <Heading level="h2" color="primary">Section Title</Heading>
 * ```
 */
export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level, color, as, children, ...props }, ref) => {
    const Component = as || level || 'h2'
    
    return React.createElement(
      Component,
      {
        ref,
        className: cn(headingVariants({ level, color }), className),
        ...props,
      },
      children
    )
  }
)
Heading.displayName = 'Heading'

/**
 * Text variants for body content
 */
const textVariants = cva(
  'font-text',
  {
    variants: {
      size: {
        xs: 'text-xs',           // 12px
        sm: 'text-sm',           // 14px
        base: 'text-base',       // 16px (default)
        lg: 'text-lg',           // 18px
        xl: 'text-xl',           // 20px
        '2xl': 'text-2xl',       // 24px
      },
      weight: {
        light: 'font-light',
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
      },
      color: {
        default: 'text-gray-900 dark:text-gray-100',
        muted: 'text-gray-600 dark:text-gray-400',
        subtle: 'text-gray-500 dark:text-gray-500',
        primary: 'text-blue-600 dark:text-blue-400',
        error: 'text-red-600 dark:text-red-400',
        success: 'text-green-600 dark:text-green-400',
        warning: 'text-amber-600 dark:text-amber-400',
      },
      leading: {
        none: 'leading-none',
        tight: 'leading-tight',
        snug: 'leading-snug',
        normal: 'leading-normal',
        relaxed: 'leading-relaxed',
        loose: 'leading-loose',
      }
    },
    defaultVariants: {
      size: 'base',
      weight: 'normal',
      color: 'default',
      leading: 'normal',
    },
  }
)

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: 'p' | 'span' | 'div' | 'label'
}

/**
 * Text component for body content
 * 
 * @example
 * ```tsx
 * <Text>Regular paragraph text</Text>
 * <Text size="lg" weight="medium">Emphasized text</Text>
 * <Text size="sm" color="muted">Secondary information</Text>
 * ```
 */
export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, size, weight, color, leading, as = 'p', children, ...props }, ref) => {
    return React.createElement(
      as,
      {
        ref,
        className: cn(textVariants({ size, weight, color, leading }), className),
        ...props,
      },
      children
    )
  }
)
Text.displayName = 'Text'

/**
 * Label component for form fields
 */
export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & VariantProps<typeof textVariants>
>(({ className, size = 'sm', weight = 'medium', color = 'default', ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        textVariants({ size, weight, color }),
        'inline-block',
        className
      )}
      {...props}
    />
  )
})
Label.displayName = 'Label'

/**
 * Caption component for small supporting text
 */
export const Caption = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, children, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'text-xs text-gray-500 dark:text-gray-500 font-text',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
})
Caption.displayName = 'Caption'

/**
 * Lead component for introductory paragraphs
 */
export const Lead = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        'text-xl text-gray-600 dark:text-gray-300 font-text leading-relaxed',
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
})
Lead.displayName = 'Lead'

/**
 * Code component for inline code
 */
export const Code = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => {
  return (
    <code
      ref={ref}
      className={cn(
        'relative rounded bg-gray-100 dark:bg-gray-800 px-[0.3rem] py-[0.2rem] font-mono text-sm',
        className
      )}
      {...props}
    >
      {children}
    </code>
  )
})
Code.displayName = 'Code'

/**
 * Blockquote component
 */
export const Blockquote = React.forwardRef<
  HTMLQuoteElement,
  React.HTMLAttributes<HTMLQuoteElement>
>(({ className, children, ...props }, ref) => {
  return (
    <blockquote
      ref={ref}
      className={cn(
        'border-l-4 border-gray-200 dark:border-gray-700 pl-4 italic text-gray-700 dark:text-gray-300',
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  )
})
Blockquote.displayName = 'Blockquote'

// Export variants for external use
export { headingVariants, textVariants }