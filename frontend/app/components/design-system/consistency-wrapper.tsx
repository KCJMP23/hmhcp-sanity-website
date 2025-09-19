'use client'

import { cn } from '@/lib/utils'
import { DESIGN_TOKENS, PAGE_LAYOUT } from '@/lib/design-system/constants'
import { ReactNode } from 'react'

interface ConsistencyWrapperProps {
  children: ReactNode
  variant?: 'page' | 'admin' | 'section'
  className?: string
  noPadding?: boolean
  maxWidth?: keyof typeof PAGE_LAYOUT.maxWidth
}

/**
 * ConsistencyWrapper ensures consistent spacing, padding, and layout across all pages
 * This component enforces our design system standards
 */
export function ConsistencyWrapper({
  children,
  variant = 'page',
  className,
  noPadding = false,
  maxWidth = 'xl'
}: ConsistencyWrapperProps) {
  const baseClasses = cn(
    'w-full',
    // Consistent padding based on variant
    !noPadding && {
      page: cn(
        'px-4 sm:px-6 lg:px-8', // Horizontal padding
        'py-8 sm:py-12 lg:py-16' // Vertical padding
      ),
      admin: cn(
        'px-4 lg:px-8', // Admin has different padding
        'py-6 lg:py-8'
      ),
      section: cn(
        'px-4 sm:px-6 lg:px-8',
        'py-12 sm:py-16 lg:py-24'
      )
    }[variant],
    className
  )

  const innerClasses = cn(
    'mx-auto w-full',
    variant !== 'admin' && `max-w-${maxWidth}`
  )

  return (
    <div className={baseClasses}>
      <div className={innerClasses}>
        {children}
      </div>
    </div>
  )
}

/**
 * PageSection provides consistent section spacing
 */
export function PageSection({
  children,
  className,
  background = 'default'
}: {
  children: ReactNode
  className?: string
  background?: 'default' | 'muted' | 'dark'
}) {
  const backgroundClasses = {
    default: 'bg-white dark:bg-gray-900',
    muted: 'bg-gray-50 dark:bg-gray-800',
    dark: 'bg-gray-900 dark:bg-black'
  }

  return (
    <section className={cn(backgroundClasses[background], className)}>
      <ConsistencyWrapper variant="section">
        {children}
      </ConsistencyWrapper>
    </section>
  )
}

/**
 * AdminPage provides consistent admin page layout
 */
export function AdminPage({
  children,
  title,
  description,
  actions
}: {
  children: ReactNode
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <ConsistencyWrapper variant="admin">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
      {children}
    </ConsistencyWrapper>
  )
}

/**
 * Card provides consistent card styling
 */
export function ConsistentCard({
  children,
  className,
  padding = 'default'
}: {
  children: ReactNode
  className?: string
  padding?: 'none' | 'small' | 'default' | 'large'
}) {
  const paddingClasses = {
    none: '',
    small: 'p-4',
    default: 'p-6',
    large: 'p-8'
  }

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800',
      'border border-gray-200 dark:border-gray-700',
      'rounded-2xl', // Consistent with Apple design
      'shadow-sm',
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}