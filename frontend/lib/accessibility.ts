/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliance helpers and utilities
 * Part of the unified design system
 */

/**
 * Screen reader only styles
 * Visually hide elements while keeping them accessible
 */
export const srOnly = 'sr-only' // Tailwind's built-in sr-only class

export const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
} as const

/**
 * Focus management utilities
 */
export const focusStyles = {
  // Default focus ring (blue)
  default: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  
  // Primary focus ring
  primary: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
  
  // Subtle focus ring
  subtle: 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 focus-visible:ring-offset-1',
  
  // Error focus ring
  error: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
  
  // Success focus ring
  success: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2',
  
  // Warning focus ring
  warning: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
  
  // Within dark containers
  dark: 'dark:focus-visible:ring-offset-gray-800',
} as const

/**
 * Skip link styles
 * For keyboard navigation
 */
export const skipLink = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-600 focus:underline'

/**
 * ARIA attributes helpers
 */
export const aria = {
  // Common ARIA labels
  label: (text: string) => ({ 'aria-label': text }),
  labelledBy: (id: string) => ({ 'aria-labelledby': id }),
  describedBy: (id: string) => ({ 'aria-describedby': id }),
  
  // States
  expanded: (isExpanded: boolean) => ({ 'aria-expanded': isExpanded }),
  selected: (isSelected: boolean) => ({ 'aria-selected': isSelected }),
  checked: (isChecked: boolean) => ({ 'aria-checked': isChecked }),
  pressed: (isPressed: boolean) => ({ 'aria-pressed': isPressed }),
  disabled: (isDisabled: boolean) => ({ 'aria-disabled': isDisabled }),
  hidden: (isHidden: boolean) => ({ 'aria-hidden': isHidden }),
  
  // Live regions
  live: (politeness: 'polite' | 'assertive' | 'off' = 'polite') => ({ 'aria-live': politeness }),
  atomic: (isAtomic: boolean = true) => ({ 'aria-atomic': isAtomic }),
  relevant: (relevant: string = 'additions text') => ({ 'aria-relevant': relevant }),
  
  // Roles
  role: (role: string) => ({ role }),
  
  // Current
  current: (current: 'page' | 'step' | 'location' | 'date' | 'time' | boolean) => ({ 'aria-current': current }),
} as const

/**
 * Color contrast ratios
 * WCAG 2.1 AA requirements
 */
export const contrastRatios = {
  // Minimum contrast ratios
  normalText: 4.5,      // 4.5:1 for normal text
  largeText: 3,         // 3:1 for large text (18px+ or 14px+ bold)
  graphicalObjects: 3,  // 3:1 for graphical objects and UI components
  
  // Helper to check if contrast is sufficient
  isAccessible: (ratio: number, isLargeText: boolean = false) => {
    return ratio >= (isLargeText ? contrastRatios.largeText : contrastRatios.normalText)
  },
} as const

/**
 * Keyboard navigation helpers
 */
export const keyboard = {
  // Tab index management
  tabbable: { tabIndex: 0 },
  notTabbable: { tabIndex: -1 },
  
  // Key codes
  keys: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
  },
  
  // Key event handlers
  onEnterOrSpace: (handler: () => void) => ({
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === keyboard.keys.ENTER || e.key === keyboard.keys.SPACE) {
        e.preventDefault()
        handler()
      }
    },
  }),
} as const

/**
 * Touch target sizes
 * WCAG 2.1 AA requirement: minimum 44x44px
 */
export const touchTargets = {
  minimum: 'min-h-[44px] min-w-[44px]',  // 44x44px minimum
  comfortable: 'min-h-[48px] min-w-[48px]', // 48x48px comfortable
  large: 'min-h-[56px] min-w-[56px]',    // 56x56px large
} as const

/**
 * Reduced motion utilities
 * Respect user's motion preferences
 */
export const motion = {
  // Disable animations for users who prefer reduced motion
  reduce: 'motion-reduce:transition-none motion-reduce:animation-none',
  
  // Safe animations (opacity and color only)
  safe: 'motion-reduce:transition-[opacity,colors] motion-reduce:duration-[1ms]',
  
  // Check if user prefers reduced motion
  prefersReduced: () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },
} as const

/**
 * Focus trap utility
 * For modals and overlays
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus()
        e.preventDefault()
      }
    }
  }
  
  element.addEventListener('keydown', handleKeyDown)
  firstFocusable?.focus()
  
  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Announce to screen readers
 * For dynamic content updates
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.setAttribute('class', srOnly)
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Semantic HTML helpers
 */
export const semantic = {
  // Landmark roles
  landmarks: {
    main: { role: 'main' },
    navigation: { role: 'navigation' },
    banner: { role: 'banner' },
    contentinfo: { role: 'contentinfo' },
    complementary: { role: 'complementary' },
    search: { role: 'search' },
  },
  
  // Heading hierarchy
  heading: (level: 1 | 2 | 3 | 4 | 5 | 6) => ({
    role: 'heading',
    'aria-level': level,
  }),
  
  // Lists
  list: { role: 'list' },
  listitem: { role: 'listitem' },
  
  // Forms
  form: { role: 'form' },
  textbox: { role: 'textbox' },
  button: { role: 'button' },
  checkbox: { role: 'checkbox' },
  radio: { role: 'radio' },
} as const

/**
 * Text alternatives
 * For images and icons
 */
export const textAlternatives = {
  // Decorative images
  decorative: { alt: '', role: 'presentation' },
  
  // Informative images
  informative: (description: string) => ({ alt: description }),
  
  // Complex images
  complex: (shortDesc: string, longDescId: string) => ({
    alt: shortDesc,
    'aria-describedby': longDescId,
  }),
  
  // Icon buttons
  iconButton: (action: string) => ({
    'aria-label': action,
    title: action,
  }),
} as const

// Export everything as a single accessibility object
export const a11y = {
  srOnly,
  visuallyHidden,
  focusStyles,
  skipLink,
  aria,
  contrastRatios,
  keyboard,
  touchTargets,
  motion,
  trapFocus,
  announce,
  semantic,
  textAlternatives,
} as const

export default a11y