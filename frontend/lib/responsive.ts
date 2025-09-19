/**
 * Responsive Utilities
 * Standardized breakpoints and responsive patterns
 * Part of the unified design system
 */

/**
 * Breakpoint values (in pixels)
 * Consistent with Tailwind's default breakpoints
 */
export const breakpoints = {
  xs: 475,    // Extra small devices
  sm: 640,    // Small devices (landscape phones)
  md: 768,    // Medium devices (tablets)
  lg: 1024,   // Large devices (desktops)
  xl: 1280,   // Extra large devices (large desktops)
  '2xl': 1536, // 2X large devices (larger desktops)
} as const

/**
 * Media query strings
 * Pre-formatted for use in CSS-in-JS
 */
export const mediaQueries = {
  xs: `(min-width: ${breakpoints.xs}px)`,
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
  
  // Max width queries
  xsMax: `(max-width: ${breakpoints.xs - 1}px)`,
  smMax: `(max-width: ${breakpoints.sm - 1}px)`,
  mdMax: `(max-width: ${breakpoints.md - 1}px)`,
  lgMax: `(max-width: ${breakpoints.lg - 1}px)`,
  xlMax: `(max-width: ${breakpoints.xl - 1}px)`,
  '2xlMax': `(max-width: ${breakpoints['2xl'] - 1}px)`,
  
  // Range queries
  smToMd: `(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  mdToLg: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lgToXl: `(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  
  // Orientation queries
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  
  // Feature queries
  hover: '(hover: hover)',
  touch: '(pointer: coarse)',
  mouse: '(pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
} as const

/**
 * Container widths
 * Maximum content widths at each breakpoint
 */
export const containers = {
  xs: 'max-w-xs',     // 20rem (320px)
  sm: 'max-w-sm',     // 24rem (384px)
  md: 'max-w-md',     // 28rem (448px)
  lg: 'max-w-lg',     // 32rem (512px)
  xl: 'max-w-xl',     // 36rem (576px)
  '2xl': 'max-w-2xl', // 42rem (672px)
  '3xl': 'max-w-3xl', // 48rem (768px)
  '4xl': 'max-w-4xl', // 56rem (896px)
  '5xl': 'max-w-5xl', // 64rem (1024px)
  '6xl': 'max-w-6xl', // 72rem (1152px)
  '7xl': 'max-w-7xl', // 80rem (1280px)
  full: 'max-w-full',
  prose: 'max-w-prose', // 65ch
  screen: 'max-w-screen-sm sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl',
} as const

/**
 * Responsive spacing patterns
 * Common responsive spacing combinations
 */
export const spacing = {
  // Padding patterns
  section: {
    mobile: 'px-4 py-12',    // Mobile: 16px horizontal, 48px vertical
    tablet: 'sm:px-6 sm:py-16', // Tablet: 24px horizontal, 64px vertical
    desktop: 'lg:px-8 lg:py-24', // Desktop: 32px horizontal, 96px vertical
    full: 'px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24', // All combined
  },
  
  container: {
    default: 'container mx-auto px-4 sm:px-6 lg:px-8',
    narrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
    wide: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    full: 'w-full px-4 sm:px-6 lg:px-8',
  },
  
  stack: {
    sm: 'space-y-2 sm:space-y-3 lg:space-y-4',
    md: 'space-y-4 sm:space-y-6 lg:space-y-8',
    lg: 'space-y-6 sm:space-y-8 lg:space-y-12',
  },
} as const

/**
 * Responsive grid patterns
 * Common grid layouts for different screen sizes
 */
export const grids = {
  // Auto-fit grids
  autoFit: {
    sm: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    md: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    lg: 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8',
  },
  
  // Fixed column grids
  cols2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  cols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
  
  // Card grids (with consistent gaps)
  cards: {
    default: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8',
    compact: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    wide: 'grid grid-cols-1 lg:grid-cols-2 gap-8',
  },
  
  // Service/feature grids
  services: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8',
  features: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
} as const

/**
 * Responsive typography scales
 * Text sizes that adapt to screen size
 */
export const typography = {
  // Heading scales
  h1: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
  h2: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
  h3: 'text-xl sm:text-2xl md:text-3xl',
  h4: 'text-lg sm:text-xl md:text-2xl',
  h5: 'text-base sm:text-lg md:text-xl',
  h6: 'text-sm sm:text-base md:text-lg',
  
  // Body text scales
  body: {
    sm: 'text-sm md:text-base',
    base: 'text-base md:text-lg',
    lg: 'text-lg md:text-xl',
  },
  
  // Lead text
  lead: 'text-lg sm:text-xl md:text-2xl',
} as const

/**
 * Responsive visibility utilities
 * Show/hide elements at different breakpoints
 */
export const visibility = {
  // Show only on specific sizes
  mobileOnly: 'block sm:hidden',
  tabletOnly: 'hidden sm:block md:hidden',
  desktopOnly: 'hidden lg:block',
  
  // Hide on specific sizes
  hideMobile: 'hidden sm:block',
  hideTablet: 'block md:hidden lg:block',
  hideDesktop: 'block lg:hidden',
  
  // Progressive display
  showFromSm: 'hidden sm:block',
  showFromMd: 'hidden md:block',
  showFromLg: 'hidden lg:block',
  showFromXl: 'hidden xl:block',
} as const

/**
 * Responsive flex patterns
 * Common flexbox layouts
 */
export const flex = {
  // Direction changes
  responsiveRow: 'flex flex-col sm:flex-row',
  responsiveCol: 'flex flex-row lg:flex-col',
  
  // Alignment patterns
  centerMobile: 'items-center sm:items-start',
  spaceBetween: 'justify-between items-center',
  
  // Gap patterns
  gap: {
    sm: 'gap-2 sm:gap-3 lg:gap-4',
    md: 'gap-4 sm:gap-6 lg:gap-8',
    lg: 'gap-6 sm:gap-8 lg:gap-12',
  },
} as const

/**
 * Utility function to check if we're on a mobile device
 * (For use in React components with useEffect)
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < breakpoints.md
}

/**
 * Utility function to check if we're on a tablet device
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg
}

/**
 * Utility function to check if we're on a desktop device
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= breakpoints.lg
}

/**
 * Custom hook for responsive breakpoints (React)
 */
export function useBreakpoint() {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      currentBreakpoint: 'lg',
    }
  }

  const width = window.innerWidth
  
  return {
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    currentBreakpoint: 
      width < breakpoints.sm ? 'xs' :
      width < breakpoints.md ? 'sm' :
      width < breakpoints.lg ? 'md' :
      width < breakpoints.xl ? 'lg' :
      width < breakpoints['2xl'] ? 'xl' : '2xl',
  }
}

// Export everything as a single responsive system object
export const responsiveSystem = {
  breakpoints,
  mediaQueries,
  containers,
  spacing,
  grids,
  typography,
  visibility,
  flex,
  isMobile,
  isTablet,
  isDesktop,
  useBreakpoint,
} as const

export default responsiveSystem