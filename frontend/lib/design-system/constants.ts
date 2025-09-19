// Unified Design System Constants for HM Healthcare Partners
// This file defines the core design tokens used throughout the application

export const DESIGN_TOKENS = {
  // Spacing Scale (using 8px base unit)
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '1rem',      // 16px
    md: '1.5rem',    // 24px
    lg: '2rem',      // 32px
    xl: '3rem',      // 48px
    '2xl': '4rem',   // 64px
    '3xl': '6rem',   // 96px
  },

  // Typography Scale
  typography: {
    fontSize: {
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
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
      // Apple-specific
      heading: '-0.005em',
      body: '-0.01em',
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },

  // Color Palette
  colors: {
    // Primary (Healthcare Blue)
    primary: {
      50: '#e6f2ff',
      100: '#b3d9ff',
      200: '#80bfff',
      300: '#4da6ff',
      400: '#1a8cff',
      500: '#0073e6',
      600: '#005bb3',
      700: '#004280',
      800: '#002a4d',
      900: '#00111a',
    },
    // Gray Scale
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    // Semantic Colors
    success: {
      light: '#3B82F6',
      DEFAULT: '#2563EB',
      dark: '#1D4ED8',
    },
    warning: {
      light: '#60A5FA',
      DEFAULT: '#3B82F6',
      dark: '#2563EB',
    },
    error: {
      light: '#f87171',
      DEFAULT: '#ef4444',
      dark: '#dc2626',
    },
    info: {
      light: '#60a5fa',
      DEFAULT: '#3b82f6',
      dark: '#2563eb',
    },
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',     // 4px
    DEFAULT: '0.5rem', // 8px
    md: '0.75rem',     // 12px
    lg: '1rem',        // 16px
    xl: '1.5rem',      // 24px
    '2xl': '2rem',     // 32px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },

  // Transitions
  transitions: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    timing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      // Apple-style bezier
      smooth: 'cubic-bezier(0.42, 0, 0.58, 1)',
    },
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-Index Scale
  zIndex: {
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    auto: 'auto',
  },
} as const

// Page Layout Constants
export const PAGE_LAYOUT = {
  maxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    full: '100%',
  },
  padding: {
    mobile: DESIGN_TOKENS.spacing.sm,
    tablet: DESIGN_TOKENS.spacing.md,
    desktop: DESIGN_TOKENS.spacing.lg,
  },
  section: {
    paddingY: {
      mobile: DESIGN_TOKENS.spacing.xl,
      tablet: DESIGN_TOKENS.spacing['2xl'],
      desktop: DESIGN_TOKENS.spacing['3xl'],
    },
  },
} as const

// Admin Layout Constants
export const ADMIN_LAYOUT = {
  sidebar: {
    width: '16rem', // 256px
    collapsedWidth: '4rem', // 64px
    headerHeight: '4rem', // 64px
  },
  content: {
    padding: {
      mobile: DESIGN_TOKENS.spacing.sm,
      desktop: DESIGN_TOKENS.spacing.lg,
    },
  },
} as const

// Component Standards
export const COMPONENT_STANDARDS = {
  card: {
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.borderRadius.xl,
    shadow: DESIGN_TOKENS.shadows.md,
  },
  button: {
    padding: {
      sm: `${DESIGN_TOKENS.spacing.xs} ${DESIGN_TOKENS.spacing.sm}`,
      md: `${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.md}`,
      lg: `${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.lg}`,
    },
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    fontSize: {
      sm: DESIGN_TOKENS.typography.fontSize.sm,
      md: DESIGN_TOKENS.typography.fontSize.base,
      lg: DESIGN_TOKENS.typography.fontSize.lg,
    },
  },
  input: {
    padding: `${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.md}`,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    fontSize: DESIGN_TOKENS.typography.fontSize.base,
  },
} as const

// Export type definitions
export type SpacingScale = keyof typeof DESIGN_TOKENS.spacing
export type ColorScale = keyof typeof DESIGN_TOKENS.colors
export type FontSizeScale = keyof typeof DESIGN_TOKENS.typography.fontSize
export type BorderRadiusScale = keyof typeof DESIGN_TOKENS.borderRadius
export type ShadowScale = keyof typeof DESIGN_TOKENS.shadows