/**
 * Design System Tokens
 * Single source of truth for all design values
 * Based on 8px grid system for consistency
 */

// ============================================
// SPACING SYSTEM (8px base)
// ============================================
export const spacing = {
  // Base unit
  base: 8,
  
  // Spacing scale (multipliers of 8px)
  0: '0',
  0.5: '0.125rem',    // 2px
  1: '0.25rem',       // 4px
  2: '0.5rem',        // 8px
  3: '0.75rem',       // 12px
  4: '1rem',          // 16px
  5: '1.25rem',       // 20px
  6: '1.5rem',        // 24px
  8: '2rem',          // 32px
  10: '2.5rem',       // 40px
  12: '3rem',         // 48px
  16: '4rem',         // 64px
  20: '5rem',         // 80px
  24: '6rem',         // 96px
  32: '8rem',         // 128px
  
  // Section padding (consistent across all pages)
  section: {
    mobile: '3rem',   // 48px (py-12)
    tablet: '4rem',   // 64px (py-16)
    desktop: '6rem',  // 96px (py-24)
    hero: '8rem',     // 128px (py-32)
  },
  
  // Container max widths
  container: {
    xs: 'max-w-2xl',    // 672px
    sm: 'max-w-3xl',    // 768px
    md: 'max-w-4xl',    // 896px
    lg: 'max-w-5xl',    // 1024px
    xl: 'max-w-6xl',    // 1152px
    '2xl': 'max-w-7xl', // 1280px (default)
    full: 'max-w-full',
  }
} as const

// ============================================
// COLOR SYSTEM
// ============================================
export const colors = {
  // Primary brand colors
  primary: {
    50: 'rgb(239 246 255)',   // blue-50
    100: 'rgb(219 234 254)',  // blue-100
    200: 'rgb(191 219 254)',  // blue-200
    300: 'rgb(147 197 253)',  // blue-300
    400: 'rgb(96 165 250)',   // blue-400
    500: 'rgb(59 130 246)',   // blue-500
    600: 'rgb(37 99 235)',    // blue-600 (primary)
    700: 'rgb(29 78 216)',    // blue-700
    800: 'rgb(30 64 175)',    // blue-800
    900: 'rgb(30 58 138)',    // blue-900
  },
  
  // Grays
  gray: {
    50: 'rgb(249 250 251)',
    100: 'rgb(243 244 246)',
    200: 'rgb(229 231 235)',
    300: 'rgb(209 213 219)',
    400: 'rgb(156 163 175)',
    500: 'rgb(107 114 128)',
    600: 'rgb(75 85 99)',
    700: 'rgb(55 65 81)',
    800: 'rgb(31 41 55)',
    900: 'rgb(17 24 39)',
  },
  
  // Semantic colors
  success: {
    light: 'rgb(34 197 94)',   // green-500
    DEFAULT: 'rgb(22 163 74)', // green-600
    dark: 'rgb(21 128 61)',    // green-700
  },
  
  warning: {
    light: 'rgb(251 146 60)',  // orange-400
    DEFAULT: 'rgb(249 115 22)', // orange-500
    dark: 'rgb(234 88 12)',    // orange-600
  },
  
  error: {
    light: 'rgb(248 113 113)', // red-400
    DEFAULT: 'rgb(239 68 68)', // red-500
    dark: 'rgb(220 38 38)',    // red-600
  },
  
  // Dark mode specific
  dark: {
    background: 'rgb(17 24 39)',     // gray-900
    surface: 'rgb(31 41 55)',        // gray-800
    border: 'rgb(55 65 81)',         // gray-700
    text: {
      primary: 'rgb(243 244 246)',   // gray-100
      secondary: 'rgb(209 213 219)', // gray-300
      muted: 'rgb(156 163 175)',     // gray-400
    }
  }
} as const

// ============================================
// TYPOGRAPHY SYSTEM
// ============================================
export const typography = {
  // Font families
  fontFamily: {
    display: 'font-display', // SF Pro Display
    text: 'font-text',       // SF Pro Text
    mono: 'font-mono',       // SF Mono
  },
  
  // Font sizes with line heights
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
    '5xl': ['3rem', { lineHeight: '1.2' }],        // 48px
    '6xl': ['3.75rem', { lineHeight: '1.1' }],     // 60px
  },
  
  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
  
  // Heading scales (responsive)
  headings: {
    h1: 'text-4xl md:text-5xl lg:text-6xl font-light tracking-tight',
    h2: 'text-3xl md:text-4xl lg:text-5xl font-light tracking-tight',
    h3: 'text-2xl md:text-3xl font-medium tracking-tight',
    h4: 'text-xl md:text-2xl font-medium',
    h5: 'text-lg md:text-xl font-medium',
    h6: 'text-base md:text-lg font-medium',
  },
  
  // Body text styles
  body: {
    large: 'text-lg leading-relaxed',
    base: 'text-base leading-relaxed',
    small: 'text-sm leading-relaxed',
  }
} as const

// ============================================
// COMPONENT STYLES
// ============================================
export const components = {
  // Button variants with consistent sizing
  button: {
    base: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    
    sizes: {
      sm: 'px-3 py-1.5 text-sm rounded-full',     // Small: 24px height
      md: 'px-6 py-3 text-base rounded-full',      // Medium: 48px height (default)
      lg: 'px-8 py-4 text-lg rounded-full',        // Large: 56px height
      xl: 'px-10 py-5 text-xl rounded-full',       // Extra large: 64px height
    },
    
    variants: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl focus-visible:ring-blue-500',
      secondary: 'bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md focus-visible:ring-blue-500',
      ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus-visible:ring-gray-500',
    }
  },
  
  // Input/Form fields (matching button heights)
  input: {
    base: 'w-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
    
    sizes: {
      sm: 'px-3 py-1.5 text-sm rounded-lg',       // 24px height (matches button sm)
      md: 'px-4 py-3 text-base rounded-lg',        // 48px height (matches button md)
      lg: 'px-5 py-4 text-lg rounded-lg',          // 56px height (matches button lg)
    },
    
    variants: {
      default: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
      error: 'border border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
    }
  },
  
  // Icon sizes (consistent system)
  icon: {
    xs: 'w-3 h-3',    // 12px
    sm: 'w-4 h-4',    // 16px
    md: 'w-5 h-5',    // 20px (default)
    lg: 'w-6 h-6',    // 24px
    xl: 'w-8 h-8',    // 32px
    '2xl': 'w-10 h-10', // 40px
  },
  
  // Icon containers (consistent styling)
  iconContainer: {
    sm: 'w-8 h-8 flex items-center justify-center rounded-lg',
    md: 'w-12 h-12 flex items-center justify-center rounded-xl',
    lg: 'w-16 h-16 flex items-center justify-center rounded-2xl',
    
    variants: {
      glass: 'bg-white/20 backdrop-blur-md border border-white/30',
      solid: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
    }
  }
} as const

// ============================================
// ANIMATION & TRANSITIONS
// ============================================
export const animation = {
  // Durations (consistent across site)
  duration: {
    instant: '0ms',
    fast: '200ms',     // Default for most interactions
    normal: '300ms',   // For larger state changes
    slow: '500ms',     // For complex animations
    slower: '700ms',   // For special effects only
  },
  
  // Easing functions
  easing: {
    default: 'ease-in-out',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Common transitions
  transition: {
    all: 'transition-all duration-200 ease-in-out',
    colors: 'transition-colors duration-200 ease-in-out',
    transform: 'transition-transform duration-200 ease-in-out',
    opacity: 'transition-opacity duration-200 ease-in-out',
  },
  
  // Hover scales (consistent)
  scale: {
    sm: 'hover:scale-[1.02]',  // Subtle
    md: 'hover:scale-105',      // Default
    lg: 'hover:scale-110',      // Prominent
  }
} as const

// ============================================
// Z-INDEX SYSTEM
// ============================================
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
  notification: 70,
  navigation: 80,
  sheet: 90,
  max: 100,
} as const

// ============================================
// BREAKPOINTS
// ============================================
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ============================================
// SHADOWS
// ============================================
export const shadows = {
  xs: 'shadow-xs',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
  none: 'shadow-none',
} as const

// Export everything as a single design system object
export const designSystem = {
  spacing,
  colors,
  typography,
  components,
  animation,
  zIndex,
  breakpoints,
  shadows,
} as const

export default designSystem