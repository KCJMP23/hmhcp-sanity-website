/**
 * StandardButton Component
 * Wrapper that ensures ALL buttons use LiquidGlassButton
 * This standardizes buttons across the entire site
 */

"use client"

import React from 'react'
import { LiquidGlassButton } from './liquid-glass-button'

interface StandardButtonProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'primary' | 'secondary' | 'secondary-light' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'md' | 'xl' | 'cta'
  href?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  asChild?: boolean
}

// Map old Button variants to LiquidGlassButton variants
const variantMap = {
  default: 'primary',
  outline: 'secondary-light',
  ghost: 'secondary',
  primary: 'primary',
  secondary: 'secondary',
  'secondary-light': 'secondary-light',
  destructive: 'primary',
  link: 'secondary-light',
} as const

// Map old size names to LiquidGlassButton sizes
const sizeMap = {
  default: 'md',
  sm: 'sm',
  lg: 'lg',
  icon: 'sm',
  md: 'md',
  xl: 'xl',
  cta: 'cta',
} as const

export const Button = React.forwardRef<HTMLButtonElement, StandardButtonProps>(
  ({ 
    children, 
    className = '', 
    variant = 'default', 
    size = 'default',
    href,
    onClick,
    disabled,
    type = 'button',
    asChild,
    ...props 
  }, ref) => {
    // Map variant and size to LiquidGlassButton props
    const mappedVariant = variantMap[variant] || 'primary'
    const mappedSize = sizeMap[size] || 'md'
    
    // Check if there's an arrow icon in children
    const hasArrowIcon = React.Children.toArray(children).some(
      child => React.isValidElement(child) && 
      (child.props?.className?.includes('ml-2') || child.type?.displayName === 'ArrowRight')
    )
    
    // Filter out arrow icons from children (LiquidGlassButton handles them)
    const filteredChildren = React.Children.toArray(children).filter(
      child => !(React.isValidElement(child) && 
      (child.props?.className?.includes('ml-2') || child.type?.displayName === 'ArrowRight'))
    )
    
    return (
      <LiquidGlassButton
        variant={mappedVariant as 'primary' | 'secondary' | 'secondary-light'}
        size={mappedSize as 'sm' | 'md' | 'lg' | 'xl' | 'cta'}
        href={href}
        onClick={onClick}
        disabled={disabled}
        className={className}
        showArrow={hasArrowIcon}
      >
        {filteredChildren}
      </LiquidGlassButton>
    )
  }
)

Button.displayName = 'Button'

// Export StandardButton as an alias
export const StandardButton = Button

// For TypeScript compatibility
export type StandardButtonProps = StandardButtonProps