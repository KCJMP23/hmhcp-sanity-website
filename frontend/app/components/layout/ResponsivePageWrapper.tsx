'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ResponsivePageWrapperProps {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export function ResponsivePageWrapper({ 
  children, 
  className,
  fullWidth = false 
}: ResponsivePageWrapperProps) {
  return (
    <div className={cn(
      'w-full overflow-x-hidden',
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveSectionProps {
  children: React.ReactNode
  className?: string
  background?: 'white' | 'gray' | 'gradient' | 'transparent'
  padding?: 'sm' | 'md' | 'lg' | 'xl'
}

export function ResponsiveSection({
  children,
  className,
  background = 'transparent',
  padding = 'lg'
}: ResponsiveSectionProps) {
  const backgroundClasses = {
    white: 'bg-white dark:bg-gray-900',
    gray: 'bg-gray-50 dark:bg-gray-800',
    gradient: 'bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900',
    transparent: ''
  }

  const paddingClasses = {
    sm: 'py-8 sm:py-12 md:py-16',
    md: 'py-12 sm:py-16 md:py-20',
    lg: 'py-12 sm:py-16 md:py-20 lg:py-24',
    xl: 'py-16 sm:py-20 md:py-24 lg:py-32'
  }

  return (
    <section className={cn(
      'w-full overflow-x-hidden',
      backgroundClasses[background],
      paddingClasses[padding],
      className
    )}>
      <div className="responsive-container">
        {children}
      </div>
    </section>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg'
}

export function ResponsiveGrid({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 2, lg: 3 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-4 sm:gap-6',
    md: 'gap-6 sm:gap-8',
    lg: 'gap-6 sm:gap-8 lg:gap-10'
  }

  const getGridCols = () => {
    const classes = ['grid']
    
    if (cols.xs) classes.push(`grid-cols-${cols.xs}`)
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`)
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`)
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`)
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`)
    
    return classes.join(' ')
  }

  return (
    <div className={cn(
      getGridCols(),
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = '2xl'
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full'
  }

  return (
    <div className={cn(
      'w-full mx-auto px-4 sm:px-6 lg:px-8',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveStackProps {
  children: React.ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg'
}

export function ResponsiveStack({
  children,
  className,
  spacing = 'md'
}: ResponsiveStackProps) {
  const spacingClasses = {
    sm: 'space-y-4',
    md: 'space-y-6 sm:space-y-8',
    lg: 'space-y-8 sm:space-y-10 lg:space-y-12'
  }

  return (
    <div className={cn(
      'flex flex-col',
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveFlexProps {
  children: React.ReactNode
  className?: string
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'
  wrap?: boolean
  gap?: 'sm' | 'md' | 'lg'
}

export function ResponsiveFlex({
  children,
  className,
  direction = 'row',
  justify = 'start',
  align = 'start',
  wrap = true,
  gap = 'md'
}: ResponsiveFlexProps) {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse'
  }

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch'
  }

  const gapClasses = {
    sm: 'gap-2 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  }

  return (
    <div className={cn(
      'flex',
      directionClasses[direction],
      justifyClasses[justify],
      alignClasses[align],
      wrap && 'flex-wrap',
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

export function ResponsiveText({
  children,
  className,
  size = 'base'
}: {
  children: React.ReactNode
  className?: string
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
}) {
  const sizeClasses = {
    xs: 'responsive-text-xs',
    sm: 'responsive-text-sm',
    base: 'responsive-text-base',
    lg: 'responsive-text-lg',
    xl: 'responsive-text-xl',
    '2xl': 'responsive-text-2xl',
    '3xl': 'responsive-text-3xl',
    '4xl': 'responsive-text-4xl',
    '5xl': 'responsive-text-5xl'
  }

  return (
    <div className={cn(
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  )
}