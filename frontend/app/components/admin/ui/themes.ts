/**
 * Admin Component Theme Configuration
 * Healthcare-compliant design system for admin components
 */

import { AdminThemeConfig } from './types'

/**
 * Default admin theme configuration
 * Based on Apple design system with healthcare compliance
 */
export const defaultAdminTheme: AdminThemeConfig = {
  colors: {
    // Primary colors - healthcare blue palette
    primary: 'hsl(210, 100%, 50%)',      // Bright blue for primary actions
    secondary: 'hsl(210, 60%, 40%)',     // Darker blue for secondary elements
    
    // Status colors - healthcare appropriate
    success: 'hsl(142, 71%, 45%)',       // Green for success states
    warning: 'hsl(38, 92%, 50%)',        // Amber for warnings
    error: 'hsl(0, 84%, 60%)',           // Red for errors
    info: 'hsl(199, 89%, 48%)',          // Light blue for informational
    
    // Neutral colors
    background: 'hsl(0, 0%, 100%)',      // White background
    foreground: 'hsl(222, 84%, 5%)',     // Near black text
    border: 'hsl(214, 32%, 91%)',        // Light gray borders
    muted: 'hsl(210, 40%, 96%)',         // Muted backgrounds
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
  },
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    full: '9999px',  // Fully rounded
  },
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  }
}

/**
 * Dark theme configuration for admin components
 */
export const darkAdminTheme: AdminThemeConfig = {
  colors: {
    primary: 'hsl(210, 100%, 60%)',
    secondary: 'hsl(210, 60%, 50%)',
    success: 'hsl(142, 71%, 55%)',
    warning: 'hsl(38, 92%, 60%)',
    error: 'hsl(0, 84%, 70%)',
    info: 'hsl(199, 89%, 58%)',
    background: 'hsl(222, 84%, 5%)',
    foreground: 'hsl(0, 0%, 100%)',
    border: 'hsl(217, 19%, 27%)',
    muted: 'hsl(217, 33%, 17%)',
  },
  spacing: defaultAdminTheme.spacing,
  borderRadius: defaultAdminTheme.borderRadius,
  animation: defaultAdminTheme.animation,
}

/**
 * High contrast theme for accessibility
 */
export const highContrastAdminTheme: AdminThemeConfig = {
  colors: {
    primary: 'hsl(210, 100%, 40%)',
    secondary: 'hsl(210, 100%, 30%)',
    success: 'hsl(120, 100%, 35%)',
    warning: 'hsl(45, 100%, 40%)',
    error: 'hsl(0, 100%, 50%)',
    info: 'hsl(200, 100%, 40%)',
    background: 'hsl(0, 0%, 100%)',
    foreground: 'hsl(0, 0%, 0%)',
    border: 'hsl(0, 0%, 0%)',
    muted: 'hsl(0, 0%, 90%)',
  },
  spacing: defaultAdminTheme.spacing,
  borderRadius: defaultAdminTheme.borderRadius,
  animation: defaultAdminTheme.animation,
}

/**
 * Generate CSS variables from theme configuration
 */
export function generateThemeCSSVariables(theme: AdminThemeConfig): Record<string, string> {
  return {
    // Colors
    '--admin-color-primary': theme.colors.primary,
    '--admin-color-secondary': theme.colors.secondary,
    '--admin-color-success': theme.colors.success,
    '--admin-color-warning': theme.colors.warning,
    '--admin-color-error': theme.colors.error,
    '--admin-color-info': theme.colors.info,
    '--admin-color-background': theme.colors.background,
    '--admin-color-foreground': theme.colors.foreground,
    '--admin-color-border': theme.colors.border,
    '--admin-color-muted': theme.colors.muted,
    
    // Spacing
    '--admin-spacing-xs': theme.spacing.xs,
    '--admin-spacing-sm': theme.spacing.sm,
    '--admin-spacing-md': theme.spacing.md,
    '--admin-spacing-lg': theme.spacing.lg,
    '--admin-spacing-xl': theme.spacing.xl,
    
    // Border Radius
    '--admin-radius-sm': theme.borderRadius.sm,
    '--admin-radius-md': theme.borderRadius.md,
    '--admin-radius-lg': theme.borderRadius.lg,
    '--admin-radius-full': theme.borderRadius.full,
    
    // Animation
    '--admin-animation-fast': theme.animation.fast,
    '--admin-animation-normal': theme.animation.normal,
    '--admin-animation-slow': theme.animation.slow,
  }
}

/**
 * Tailwind CSS class mappings for admin components
 */
export const adminTailwindClasses = {
  // Base styles
  base: 'font-sf-pro antialiased',
  
  // Typography
  heading: {
    h1: 'text-4xl font-semibold tracking-tight',
    h2: 'text-3xl font-semibold tracking-tight',
    h3: 'text-2xl font-semibold tracking-tight',
    h4: 'text-xl font-semibold tracking-tight',
    h5: 'text-lg font-medium tracking-tight',
    h6: 'text-base font-medium tracking-tight',
  },
  
  // Text sizes
  text: {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  },
  
  // Spacing
  padding: {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  },
  
  // Borders
  border: {
    default: 'border border-gray-200',
    focus: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    error: 'border-red-500 focus:ring-red-500 focus:border-red-500',
  },
  
  // Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },
  
  // Transitions
  transition: {
    fast: 'transition-all duration-150 ease-in-out',
    normal: 'transition-all duration-300 ease-in-out',
    slow: 'transition-all duration-500 ease-in-out',
  },
}