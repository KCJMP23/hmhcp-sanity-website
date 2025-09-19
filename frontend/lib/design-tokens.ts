/**
 * Apple-Inspired Design System Tokens
 * 
 * Centralized design tokens following Apple's design guidelines
 * and CLAUDE.md requirements for healthcare platform consistency.
 */

// Typography System
export const typography = {
  fonts: {
    display: '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
    text: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace',
  },
  letterSpacing: {
    tight: '-0.005em',  // Headers (CLAUDE.md requirement)
    body: '-0.01em',    // Body text (CLAUDE.md requirement)
    normal: '0',
    wide: '0.025em',
  },
  lineHeight: {
    tight: '1.1',
    snug: '1.2',
    normal: '1.5',
    relaxed: '1.625',
  },
  fontSizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  }
} as const

// Color System
export const colors = {
  // Apple-inspired primary gradient (CLAUDE.md requirement)
  gradients: {
    primary: 'linear-gradient(135deg, #2563eb 0%, #4338ca 50%, #7c3aed 100%)',
    primaryHover: 'linear-gradient(135deg, #1d4ed8 0%, #3730a3 50%, #6b21a8 100%)',
    subtle: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  },
  
  // Primary blues (matching Tailwind)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',  // Primary brand color
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Healthcare-specific colors
  healthcare: {
    success: '#10b981',     // Medical success states
    warning: '#f59e0b',     // Medical warnings
    critical: '#ef4444',    // Critical medical alerts
    info: '#3b82f6',        // Medical information
    neutral: '#6b7280',     // Medical neutral states
  },
  
  // Semantic colors
  semantic: {
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)',
    muted: 'hsl(210 40% 96.1%)',
    mutedForeground: 'hsl(215.4 16.3% 46.9%)',
    border: 'hsl(214.3 31.8% 91.4%)',
  }
} as const

// Spacing System (8px base grid)
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const

// Apple-inspired Border Radius System
export const borderRadius = {
  none: '0',
  xs: '4px',        // Small elements (badges, tags)
  sm: '6px',        // Small buttons, inputs
  default: '6px',   // Default radius
  md: '8px',        // Standard buttons, cards
  lg: '10px',       // Large cards, containers
  xl: '12px',       // Modals, large containers
  '2xl': '12px',    // Same as xl for consistency
  '3xl': '12px',    // Same as xl for consistency
  full: '9999px',   // Pills, avatars, circular buttons
} as const

// Shadow System (Apple-inspired)
export const shadows = {
  none: '0 0 #0000',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  
  // Apple-specific shadows
  apple: {
    card: '0 4px 16px rgba(0, 0, 0, 0.1)',
    button: '0 2px 8px rgba(37, 99, 235, 0.2)',
    modal: '0 20px 40px rgba(0, 0, 0, 0.15)',
  }
} as const

// Animation System (Apple-style easing)
export const animations = {
  // Durations
  duration: {
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',     // CLAUDE.md requirement
    slower: '800ms',
  },
  
  // Apple-standard easing curves
  easing: {
    apple: 'cubic-bezier(0.42, 0, 0.58, 1)',  // CLAUDE.md requirement
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Pre-defined transitions
  transitions: {
    all: 'all 300ms cubic-bezier(0.42, 0, 0.58, 1)',
    colors: 'color 300ms cubic-bezier(0.42, 0, 0.58, 1), background-color 300ms cubic-bezier(0.42, 0, 0.58, 1)',
    transform: 'transform 300ms cubic-bezier(0.42, 0, 0.58, 1)',
    opacity: 'opacity 300ms cubic-bezier(0.42, 0, 0.58, 1)',
  }
} as const

// Breakpoints (Mobile-first)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Z-index System
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const

// Component-specific tokens
export const components = {
  // Button variants
  button: {
    height: {
      sm: '36px',      // 9 * 4px
      default: '44px', // 11 * 4px (minimum touch target)
      lg: '48px',      // 12 * 4px
    },
    padding: {
      sm: '8px 16px',
      default: '12px 24px',
      lg: '16px 32px',
    }
  },
  
  // Form elements
  form: {
    input: {
      height: '44px',  // Minimum touch target
      padding: '12px 16px',
      radius: borderRadius.sm,
    }
  },
  
  // Cards
  card: {
    padding: {
      sm: spacing[4],
      default: spacing[6],
      lg: spacing[8],
    },
    radius: borderRadius.lg,
  },
  
  // Navigation
  nav: {
    height: '64px',
    padding: spacing[4],
    logoHeight: '32px',
  }
} as const

// Healthcare-specific design tokens
export const healthcare = {
  // Medical status colors
  status: {
    normal: '#10b981',      // Green
    warning: '#f59e0b',     // Amber
    critical: '#ef4444',    // Red
    urgent: '#dc2626',      // Dark red
    info: '#3b82f6',        // Blue
  },
  
  // Data visualization colors (accessible)
  chart: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    tertiary: '#059669',
    quaternary: '#dc2626',
    neutral: '#6b7280',
  },
  
  // Accessibility requirements
  accessibility: {
    minContrastRatio: 4.5,        // WCAG AA
    minTouchTarget: '44px',       // Minimum touch target
    focusRingWidth: '2px',
    focusRingColor: '#2563eb',
  }
} as const

// Export all tokens as a single object for easy importing
export const designTokens = {
  typography,
  colors,
  spacing,
  borderRadius,
  shadows,
  animations,
  breakpoints,
  zIndex,
  components,
  healthcare,
} as const

// Type definitions for better TypeScript support
export type DesignTokens = typeof designTokens
export type Typography = typeof typography
export type Colors = typeof colors
export type Spacing = typeof spacing
export type BorderRadius = typeof borderRadius
export type Shadows = typeof shadows
export type Animations = typeof animations
export type Breakpoints = typeof breakpoints
export type ZIndex = typeof zIndex
export type Components = typeof components
export type Healthcare = typeof healthcare