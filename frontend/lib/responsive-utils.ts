import React, { useEffect, useState } from 'react'

export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof breakpoints

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs')
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      const width = window.innerWidth
      setWindowSize({
        width,
        height: window.innerHeight,
      })

      if (width >= breakpoints['2xl']) {
        setBreakpoint('2xl')
      } else if (width >= breakpoints.xl) {
        setBreakpoint('xl')
      } else if (width >= breakpoints.lg) {
        setBreakpoint('lg')
      } else if (width >= breakpoints.md) {
        setBreakpoint('md')
      } else if (width >= breakpoints.sm) {
        setBreakpoint('sm')
      } else {
        setBreakpoint('xs')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = breakpoint === 'xs'
  const isTablet = breakpoint === 'sm' || breakpoint === 'md'
  const isDesktop = breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl'
  const isLargeDesktop = breakpoint === 'xl' || breakpoint === '2xl'

  return {
    breakpoint,
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isBelow: (bp: Breakpoint) => windowSize.width < breakpoints[bp],
    isAbove: (bp: Breakpoint) => windowSize.width >= breakpoints[bp],
  }
}

export function getResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  currentBreakpoint: Breakpoint,
  defaultValue: T
): T {
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint)

  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i]
    if (values[bp] !== undefined) {
      return values[bp]
    }
  }

  return defaultValue
}

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export const responsiveClasses = {
  container: 'w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl',
  section: 'py-12 sm:py-16 lg:py-20 xl:py-24',
  grid: {
    base: 'grid gap-4 sm:gap-6 lg:gap-8',
    cols1: 'grid-cols-1',
    cols2: 'grid-cols-1 sm:grid-cols-2',
    cols3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    cols6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  },
  flex: {
    base: 'flex flex-wrap gap-4',
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    col: 'flex flex-col',
    row: 'flex flex-row',
  },
  text: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl lg:text-2xl',
    xl: 'text-xl sm:text-2xl lg:text-3xl',
    '2xl': 'text-2xl sm:text-3xl lg:text-4xl',
    '3xl': 'text-3xl sm:text-4xl lg:text-5xl',
    '4xl': 'text-4xl sm:text-5xl lg:text-6xl',
    '5xl': 'text-5xl sm:text-6xl lg:text-7xl',
  },
  spacing: {
    xs: 'p-2 sm:p-3 lg:p-4',
    sm: 'p-3 sm:p-4 lg:p-6',
    base: 'p-4 sm:p-6 lg:p-8',
    lg: 'p-6 sm:p-8 lg:p-10',
    xl: 'p-8 sm:p-10 lg:p-12',
  },
  width: {
    full: 'w-full',
    auto: 'w-auto',
    screen: 'w-screen',
    min: 'min-w-0',
    max: 'max-w-full',
  },
  height: {
    full: 'h-full',
    auto: 'h-auto',
    screen: 'h-screen',
    min: 'min-h-0',
    max: 'max-h-full',
  },
  overflow: {
    hidden: 'overflow-hidden',
    auto: 'overflow-auto',
    scroll: 'overflow-scroll',
    xHidden: 'overflow-x-hidden',
    yHidden: 'overflow-y-hidden',
    xAuto: 'overflow-x-hidden',
    yAuto: 'overflow-y-auto',
  },
}

export function makeResponsive(className: string): string {
  return cn(
    className,
    'max-w-full',
    'overflow-x-hidden',
    'box-border'
  )
}

export function ResponsiveWrapper({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    React.createElement('div', { className: cn(responsiveClasses.container, makeResponsive(className)) }, children)
  )
}

export const safeAreaInsets = {
  top: 'pt-safe-top',
  bottom: 'pb-safe-bottom',
  left: 'pl-safe-left',
  right: 'pr-safe-right',
  x: 'px-safe',
  y: 'py-safe',
  all: 'p-safe',
}

export function getTouchTargetSize(size: 'small' | 'medium' | 'large' = 'medium') {
  const sizes = {
    small: 'min-h-[36px] min-w-[36px]',
    medium: 'min-h-[44px] min-w-[44px]',
    large: 'min-h-[48px] min-w-[48px]',
  }
  return sizes[size]
}

export function getAspectRatio(ratio: '1:1' | '4:3' | '16:9' | '21:9' = '16:9') {
  const ratios = {
    '1:1': 'aspect-square',
    '4:3': 'aspect-4/3',
    '16:9': 'aspect-video',
    '21:9': 'aspect-[21/9]',
  }
  return ratios[ratio]
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(query)
    const listener = () => setMatches(media.matches)

    listener()
    media.addEventListener('change', listener)

    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

export function useResponsiveImageSrc(
  baseSrc: string,
  sizes: Partial<Record<Breakpoint, string>>
) {
  const { breakpoint } = useBreakpoint()
  return getResponsiveValue(sizes, breakpoint, baseSrc)
}