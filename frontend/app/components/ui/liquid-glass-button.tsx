"use client"

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTheme } from 'next-themes'

interface LiquidGlassButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'secondary-light'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'cta'
  href?: string
  onClick?: () => void
  className?: string
  showArrow?: boolean
  disabled?: boolean
}

export function LiquidGlassButton({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  className = '',
  showArrow = false,
  disabled = false
}: LiquidGlassButtonProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  
  // Define sizeStyles early to avoid hoisting issues
  const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '14px', minHeight: '36px' },
    md: { padding: '12px 24px', fontSize: '16px', minHeight: '44px' },
    lg: { padding: '16px 32px', fontSize: '18px', minHeight: '52px' },
    xl: { padding: '20px 40px', fontSize: '20px', minHeight: '60px' },
    cta: { padding: '16px 32px', fontSize: '18px', minHeight: '52px', minWidth: '240px' },
  }
  
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="inline-flex items-center justify-center" style={{
        ...sizeStyles[size],
        borderRadius: '9999px',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        opacity: 0.7
      }}>
        <span style={{ color: 'white', fontWeight: '500' }}>{children}</span>
      </div>
    )
  }
  
  const isDark = resolvedTheme === 'dark'
  
  // Apple's Liquid Glass CSS specifications
  const baseStyles = {
    position: 'relative' as const,
    overflow: 'hidden',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    fontWeight: '500', // font-medium for better readability
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid',
    borderRadius: '9999px', // rounded-full
  }

  const primaryStyles = {
    background: isDark ? '#1e40af' : '#1d4ed8', // bg-blue-800 in dark, bg-blue-700 in light
    borderColor: isDark ? 'rgba(96, 165, 250, 0.4)' : 'rgba(59, 130, 246, 0.3)',
    color: 'white',
    boxShadow: isDark 
      ? '0 12px 40px rgba(96, 165, 250, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      : '0 12px 40px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(4px) saturate(130%)',
  }

  const secondaryStyles = {
    background: 'rgba(255, 255, 255, 0.15)', // Apple clear liquid glass
    borderColor: 'rgba(255, 255, 255, 0.8)', // More visible border for glass effect
    color: 'rgba(255, 255, 255, 0.9)',
    boxShadow: `
      0 8px 32px rgba(31, 38, 135, 0.2),
      inset 0 4px 20px rgba(255, 255, 255, 0.3)
    `,
    backdropFilter: 'blur(2px) saturate(180%)', // Apple's clear liquid glass spec
  }

  const secondaryLightStyles = {
    background: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)',
    borderColor: isDark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(59, 130, 246, 0.4)',
    color: isDark ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
    boxShadow: isDark
      ? `
        0 8px 32px rgba(96, 165, 250, 0.2),
        inset 0 2px 8px rgba(255, 255, 255, 0.1)
      `
      : `
        0 8px 32px rgba(59, 130, 246, 0.15),
        inset 0 2px 8px rgba(255, 255, 255, 0.5)
      `,
    backdropFilter: 'blur(8px) saturate(150%)',
  }

  const getVariantStyles = () => {
    if (variant === 'primary') return primaryStyles
    if (variant === 'secondary-light') return secondaryLightStyles
    return secondaryStyles
  }

  const variantStyles = getVariantStyles()

  const combinedStyles = {
    ...baseStyles,
    ...variantStyles,
    ...sizeStyles[size],
    opacity: disabled ? 0.5 : 1,
    // Apply backdrop filter from styles
    backdropFilter: variantStyles.backdropFilter,
    WebkitBackdropFilter: variantStyles.backdropFilter,
  }

  const getHoverStyles = () => {
    if (variant === 'primary') {
      return {
        background: isDark ? '#1d4ed8' : '#1e40af', // hover:bg-blue-700 in dark, hover:bg-blue-800 in light
        transform: 'translateY(-2px)',
        boxShadow: isDark 
          ? '0 12px 40px rgba(96, 165, 250, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
          : '0 12px 40px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
      }
    }
    if (variant === 'secondary-light') {
      return {
        background: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.15)',
        transform: 'translateY(-1px)',
        boxShadow: isDark
          ? `
            0 12px 40px rgba(96, 165, 250, 0.25),
            inset 0 2px 8px rgba(255, 255, 255, 0.15)
          `
          : `
            0 12px 40px rgba(59, 130, 246, 0.2),
            inset 0 2px 8px rgba(255, 255, 255, 0.6)
          `,
      }
    }
    return {
      background: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.25)',
      transform: 'translateY(-1px)',
      boxShadow: isDark
        ? `
          0 12px 48px rgba(31, 38, 135, 0.4),
          inset 0 4px 20px rgba(255, 255, 255, 0.2)
        `
        : `
          0 12px 48px rgba(31, 38, 135, 0.3),
          inset 0 4px 20px rgba(255, 255, 255, 0.4)
        `,
    }
  }

  const hoverStyles = getHoverStyles()

  const ButtonComponent = href ? Link : 'button'
  const buttonProps = href ? { href } : { onClick, disabled }

  return (
    <ButtonComponent
      {...buttonProps}
      className={`liquid-glass-button ${className}`}
      style={combinedStyles}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, hoverStyles)
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, combinedStyles)
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = variant === 'primary' 
            ? 'translateY(0px) scale(0.98)' 
            : 'translateY(0px) scale(0.97)'
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = variant === 'primary' 
            ? 'translateY(-2px)' 
            : 'translateY(-1px)'
        }
      }}
    >
      <span style={{ position: 'relative', zIndex: 2 }}>
        {children}
        {showArrow && (
          <ArrowRight 
            style={{ 
              marginLeft: '8px', 
              width: '16px', 
              height: '16px',
              transition: 'transform 0.2s ease'
            }} 
          />
        )}
      </span>
      
      {/* Liquid Glass shine effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
          borderRadius: '2rem',
          opacity: 0.6,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </ButtonComponent>
  )
}