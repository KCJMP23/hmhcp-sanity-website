'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LoadingState } from '@/components/animations/loading-state'

/**
 * Enhanced loading fallbacks with animations and accessibility
 */

interface LoadingFallbackProps {
  message?: string
  showProgress?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Page-level loading fallback
 */
export function PageLoadingFallback({ 
  message = "Loading page...",
  className = ""
}: LoadingFallbackProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 ${className}`}>
      <div className="text-center">
        <LoadingState />
        <motion.p
          className="mt-4 text-lg text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  )
}

/**
 * Section-level loading fallback
 */
export function SectionLoadingFallback({ 
  message = "Loading section...",
  size = 'md',
  className = ""
}: LoadingFallbackProps) {
  const sizeClasses = {
    sm: 'p-4 min-h-[150px]',
    md: 'p-8 min-h-[200px]',
    lg: 'p-12 min-h-[300px]'
  }

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <div className="text-center space-y-4">
        <div className="animate-pulse">
          <div className="mx-auto h-8 w-8 bg-blue-200 dark:bg-blue-800"></div>
        </div>
        <motion.p
          className="text-sm text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  )
}

/**
 * Component-level loading fallback
 */
export function ComponentLoadingFallback({ 
  message = "Loading...",
  size = 'sm',
  className = ""
}: LoadingFallbackProps) {
  const sizeClasses = {
    sm: 'p-2 min-h-[50px]',
    md: 'p-4 min-h-[100px]',
    lg: 'p-6 min-h-[150px]'
  }

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="animate-spin h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{message}</span>
      </div>
    </div>
  )
}

/**
 * Card/Widget loading fallback
 */
export function CardLoadingFallback({ 
  className = "p-6 bg-white dark:bg-gray-800  shadow"
}: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 w-5/6"></div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/3"></div>
      </div>
    </div>
  )
}

/**
 * List loading fallback
 */
export function ListLoadingFallback({ 
  itemCount = 3,
  className = "space-y-3"
}: { itemCount?: number; className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800">
          <div className="bg-gray-200 dark:bg-gray-700 h-8 w-8"></div>
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 w-3/4"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Table loading fallback
 */
export function TableLoadingFallback({ 
  columns = 4,
  rows = 5,
  className = "w-full"
}: { columns?: number; rows?: number; className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5">
        <div className="w-full overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-6 py-3">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}

/**
 * Chart loading fallback
 */
export function ChartLoadingFallback({ 
  className = "w-full h-64 bg-gray-50 dark:bg-gray-800 "
}: { className?: string }) {
  return (
    <div className={`animate-pulse flex items-center justify-center ${className}`}>
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
      </div>
    </div>
  )
}

/**
 * Form loading fallback
 */
export function FormLoadingFallback({ 
  fieldCount = 4,
  className = "space-y-4"
}: { fieldCount?: number; className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: fieldCount }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 w-1/4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700"></div>
        </div>
      ))}
      <div className="pt-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 w-32"></div>
      </div>
    </div>
  )
}

/**
 * Navigation loading fallback
 */
export function NavigationLoadingFallback({ 
  className = "h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
}: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 w-32"></div>
          <div className="flex space-x-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 dark:bg-gray-700 w-16"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Generic loading fallback with customizable skeleton
 */
export function SkeletonLoadingFallback({ 
  lines = 3,
  showAvatar = false,
  showButton = false,
  className = "p-4"
}: { 
  lines?: number
  showAvatar?: boolean
  showButton?: boolean
  className?: string 
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="flex items-start space-x-3">
        {showAvatar && (
          <div className="bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
        )}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <div 
              key={index}
              className={`h-3 bg-gray-200 dark:bg-gray-700  ${
                index === lines - 1 ? 'w-3/4' : 'w-full'
              }`}
            ></div>
          ))}
          {showButton && (
            <div className="h-8 bg-gray-200 dark:bg-gray-700 w-20 mt-3"></div>
          )}
        </div>
      </div>
    </div>
  )
}