/**
 * Animation Utilities
 * Standardized animations and transitions for consistent UX
 * Part of the unified design system
 */

/**
 * Standard transition durations (in milliseconds)
 * Consistent with design tokens
 */
export const duration = {
  instant: 0,
  fast: 200,     // Default for most interactions
  normal: 300,   // For larger state changes
  slow: 500,     // For complex animations
  slower: 700,   // For special effects only
} as const

/**
 * Standard easing functions
 * Based on Apple's motion design principles
 */
export const easing = {
  default: 'ease-in-out',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Apple's smooth curve
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const

/**
 * Tailwind transition classes
 * Pre-configured for common use cases
 */
export const transitions = {
  all: 'transition-all duration-200 ease-in-out',
  colors: 'transition-colors duration-200 ease-in-out',
  transform: 'transition-transform duration-200 ease-in-out',
  opacity: 'transition-opacity duration-200 ease-in-out',
  shadow: 'transition-shadow duration-200 ease-in-out',
  
  // Specific transitions
  button: 'transition-all duration-200 cubic-bezier(0.4, 0, 0.2, 1)',
  card: 'transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)',
  modal: 'transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)',
  dropdown: 'transition-all duration-200 cubic-bezier(0.4, 0, 0.2, 1)',
} as const

/**
 * Hover effects
 * Consistent hover states across components
 */
export const hover = {
  // Scale effects
  scale: {
    sm: 'hover:scale-[1.02]',  // Subtle scale
    md: 'hover:scale-105',      // Default scale
    lg: 'hover:scale-110',      // Prominent scale
  },
  
  // Lift effects (translate Y)
  lift: {
    sm: 'hover:-translate-y-0.5',  // Subtle lift (2px)
    md: 'hover:-translate-y-1',    // Default lift (4px)
    lg: 'hover:-translate-y-2',    // Prominent lift (8px)
  },
  
  // Shadow effects
  shadow: {
    sm: 'hover:shadow-md',
    md: 'hover:shadow-lg',
    lg: 'hover:shadow-xl',
    xl: 'hover:shadow-2xl',
  },
  
  // Brightness effects
  brightness: {
    dim: 'hover:brightness-95',
    bright: 'hover:brightness-105',
    brighter: 'hover:brightness-110',
  },
} as const

/**
 * Focus states
 * Consistent focus indicators for accessibility
 */
export const focus = {
  // Ring styles
  ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  ringPrimary: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
  ringSubtle: 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 focus-visible:ring-offset-1',
  
  // Outline styles
  outline: 'focus:outline-none focus:outline-2 focus:outline-blue-500 focus:outline-offset-2',
  outlineSubtle: 'focus:outline-none focus:outline-1 focus:outline-gray-400 focus:outline-offset-1',
} as const

/**
 * Animation keyframes
 * Custom animations for special effects
 */
export const keyframes = {
  // Fade animations
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  
  // Slide animations
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  
  // Special effects
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  float: 'animate-float',
  glow: 'animate-glow',
} as const

/**
 * Framer Motion variants
 * Reusable animation variants for Framer Motion components
 */
export const motionVariants = {
  // Fade variants
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  // Fade with scale
  fadeScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  
  // Slide up
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  
  // Slide down
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  
  // Stagger children
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
} as const

/**
 * Spring configurations for Framer Motion
 * Physics-based animations
 */
export const springs = {
  // Snappy spring
  snappy: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  
  // Smooth spring
  smooth: {
    type: 'spring',
    stiffness: 100,
    damping: 20,
  },
  
  // Bouncy spring
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 10,
  },
  
  // Stiff spring
  stiff: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
  },
} as const

/**
 * Combined animation classes
 * Ready-to-use animation combinations
 */
export const animations = {
  // Button animations
  button: `${transitions.button} ${hover.scale.sm} ${focus.ring}`,
  buttonPrimary: `${transitions.button} ${hover.scale.sm} ${hover.shadow.md} ${focus.ringPrimary}`,
  
  // Card animations
  card: `${transitions.card} ${hover.lift.md} ${hover.shadow.lg}`,
  cardHover: `${transitions.card} ${hover.scale.sm} ${hover.shadow.xl}`,
  
  // Link animations
  link: `${transitions.colors} hover:text-blue-600 dark:hover:text-blue-400`,
  linkUnderline: `${transitions.all} hover:underline hover:text-blue-600 dark:hover:text-blue-400`,
  
  // Input animations
  input: `${transitions.all} ${focus.ring}`,
  
  // Modal animations
  modalOverlay: `${transitions.opacity} ${keyframes.fadeIn}`,
  modalContent: `${transitions.all} ${keyframes.fadeInUp}`,
} as const

/**
 * Utility function to combine animation classes
 */
export function combineAnimations(...animations: string[]): string {
  return animations.filter(Boolean).join(' ')
}

/**
 * Utility function to create custom transition
 */
export function customTransition(
  property: string = 'all',
  durationMs: number = 200,
  easingFunction: string = easing.smooth
): string {
  return `transition-${property} duration-${durationMs} ${easingFunction}`
}

// Export everything as a single animations object
export const animationSystem = {
  duration,
  easing,
  transitions,
  hover,
  focus,
  keyframes,
  motionVariants,
  springs,
  animations,
  combineAnimations,
  customTransition,
} as const

export default animationSystem