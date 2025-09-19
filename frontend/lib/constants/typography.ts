/**
 * Typography Constants
 * Centralized typography classes to ensure consistency across all pages
 * Based on homepage patterns established as the design standard
 */

export const typography = {
  // Section Headers (H2)
  sectionHeader: "font-display text-4xl md:text-5xl font-light text-gray-900 dark:text-gray-100 mb-6 tracking-tight",
  
  // Section Subtitles (below headers)
  sectionSubtitle: "font-text text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed",
  
  // Card/Component Titles (H3)
  cardTitle: "font-display text-xl font-medium text-gray-900 dark:text-gray-100",
  
  // Subsection Headers (H3 alternative)
  subsectionHeader: "font-display text-2xl font-light text-gray-900 dark:text-gray-100 mb-4",
  
  // Body Text
  body: "font-text text-base text-gray-600 dark:text-gray-300 leading-relaxed",
  
  // Body Text Large
  bodyLarge: "font-text text-lg text-gray-600 dark:text-gray-300 leading-relaxed",
  
  // Small Text
  small: "font-text text-sm text-gray-500 dark:text-gray-400",
  
  // Label Text
  label: "font-text text-sm font-medium text-gray-700 dark:text-gray-300",
  
  // Hero Title (for non-slideshow heroes)
  heroTitle: "font-display text-5xl md:text-6xl lg:text-7xl font-light text-white tracking-tight",
  
  // Hero Subtitle
  heroSubtitle: "font-text text-xl md:text-2xl text-white/90 leading-relaxed",
  
  // CTA Section Title (on colored backgrounds)
  ctaTitle: "font-display text-4xl font-light text-white mb-6",
  
  // CTA Section Subtitle
  ctaSubtitle: "font-text text-xl text-blue-100 mb-10",
  
  // Error Text
  error: "font-text text-sm text-red-600 dark:text-red-400",
  
  // Success Text
  success: "font-text text-sm text-green-600 dark:text-green-400",
  
  // Muted Text
  muted: "font-text text-base text-gray-500 dark:text-gray-400"
} as const

export const spacing = {
  // Section Spacing
  section: "py-24", // MANDATORY for all main sections
  sectionAlt: "py-20", // Only for subsections if needed
  
  // Container
  container: "max-w-7xl mx-auto px-6",
  containerSmall: "max-w-4xl mx-auto px-6",
  containerLarge: "max-w-screen-2xl mx-auto px-6",
  
  // Grid Gaps
  gridGap: "gap-8",
  gridGapSmall: "gap-6",
  gridGapLarge: "gap-12",
  
  // Margins
  sectionTitleMargin: "mb-16", // After heading group
  cardTitleMargin: "mb-4",
  elementMargin: "mb-6",
  
  // Card Padding
  cardPadding: "p-8",
  cardPaddingSmall: "p-6",
  cardPaddingLarge: "p-10"
} as const

export const animations = {
  // Transitions
  transition: "transition-all duration-300",
  transitionFast: "transition-all duration-200",
  transitionSlow: "transition-all duration-500",
  
  // Hover Effects
  hoverLift: "hover:-translate-y-2",
  hoverLiftSmall: "hover:-translate-y-1",
  hoverShadow: "hover:shadow-xl dark:hover:shadow-2xl",
  
  // Combined Hover
  cardHover: "hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-2 transition-all duration-300",
  
  // Border Hover
  borderHover: "hover:border-blue-200 dark:hover:border-blue-600"
} as const

export const colors = {
  // Backgrounds
  bgWhite: "bg-white dark:bg-gray-900",
  bgGray: "bg-gray-50 dark:bg-gray-800",
  bgGradient: "bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900",
  
  // Text Colors
  textPrimary: "text-gray-900 dark:text-gray-100",
  textSecondary: "text-gray-600 dark:text-gray-300",
  textMuted: "text-gray-500 dark:text-gray-400",
  textWhite: "text-white",
  
  // Border Colors
  border: "border-gray-200 dark:border-gray-700",
  borderHover: "hover:border-blue-200 dark:hover:border-blue-600",
  
  // Brand Colors
  primary: "text-blue-600 dark:text-blue-400",
  primaryBg: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
} as const

// Helper function to combine classes
export function cn(...classes: string[]): string {
  return classes.filter(Boolean).join(' ')
}

// Common component class combinations
export const componentClasses = {
  // Section with standard spacing and container
  section: cn(spacing.section, colors.bgWhite),
  sectionAlt: cn(spacing.section, colors.bgGray),
  
  // Container with proper width and padding
  container: spacing.container,
  
  // Card with all standard properties
  card: cn(
    "border",
    colors.border,
    animations.cardHover,
    "rounded-2xl",
    spacing.cardPadding
  ),
  
  // Section header group
  sectionHeaderGroup: "text-center " + spacing.sectionTitleMargin,
  
  // Grid layouts
  gridTwoCol: "grid grid-cols-1 md:grid-cols-2 " + spacing.gridGap,
  gridThreeCol: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 " + spacing.gridGap,
  gridFourCol: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 " + spacing.gridGap
} as const