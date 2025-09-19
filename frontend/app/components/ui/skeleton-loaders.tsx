"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "./skeleton"

// Base skeleton wrapper component
export function SkeletonWrapper({ 
  children, 
  isLoading = true,
  className,
  ...props 
}: {
  children: React.ReactNode
  isLoading?: boolean
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  if (!isLoading) return <>{children}</>
  
  return (
    <div className={cn("animate-pulse", className)} {...props}>
      {children}
    </div>
  )
}

// Table row skeleton for admin lists
export function TableRowSkeleton({ 
  columns = 4,
  className,
  variant = "shimmer"
}: {
  columns?: number
  className?: string
  variant?: "default" | "shimmer" | "pulse" | "wave"
}) {
  return (
    <tr className={cn("border-b border-gray-200 dark:border-gray-700", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton 
            className={cn(
              "h-5",
              i === 0 && "w-48", // First column wider
              i === 1 && "w-32", // Second column medium
              i === 2 && "w-24", // Third column small
              i > 2 && "w-20"    // Other columns smaller
            )}
            variant={variant}
          />
        </td>
      ))}
    </tr>
  )
}

// Card skeleton for grid layouts
export function CardSkeleton({ 
  className,
  variant = "shimmer",
  showImage = true,
  showActions = true
}: {
  className?: string
  variant?: "default" | "shimmer" | "pulse" | "wave"
  showImage?: boolean
  showActions?: boolean
}) {
  return (
    <div className={cn(
      "rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm",
      className
    )}>
      {/* Image placeholder */}
      {showImage && (
        <Skeleton 
          className="w-full h-48 rounded-lg mb-4" 
          variant={variant}
        />
      )}
      
      {/* Title */}
      <Skeleton 
        className="h-6 w-3/4 mb-3" 
        variant={variant}
      />
      
      {/* Description lines */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" variant={variant} />
        <Skeleton className="h-4 w-2/3" variant={variant} />
      </div>
      
      {/* Meta info */}
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="h-4 w-20" variant={variant} />
        <Skeleton className="h-4 w-16" variant={variant} />
      </div>
      
      {/* Action buttons */}
      {showActions && (
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-20 rounded-full" variant={variant} />
          <Skeleton className="h-9 w-16 rounded-full" variant={variant} />
        </div>
      )}
    </div>
  )
}

// Post/Page list skeleton
export function PostListSkeleton({ 
  count = 5,
  className 
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          {/* Thumbnail */}
          <Skeleton className="h-16 w-16 rounded-lg shrink-0" variant="shimmer" />
          
          {/* Content */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" variant="shimmer" />
            <Skeleton className="h-4 w-1/2" variant="shimmer" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-3 w-16" variant="shimmer" />
              <Skeleton className="h-3 w-20" variant="shimmer" />
              <Skeleton className="h-3 w-12" variant="shimmer" />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-2 shrink-0">
            <Skeleton className="h-8 w-8 rounded-full" variant="shimmer" />
            <Skeleton className="h-8 w-8 rounded-full" variant="shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

// User list skeleton
export function UserListSkeleton({ 
  count = 5,
  className 
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          {/* Avatar */}
          <Skeleton className="h-12 w-12 rounded-full shrink-0" variant="shimmer" />
          
          {/* User info */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" variant="shimmer" />
            <Skeleton className="h-4 w-48" variant="shimmer" />
            <div className="flex items-center space-x-3">
              <Skeleton className="h-3 w-16" variant="shimmer" />
              <Skeleton className="h-3 w-20" variant="shimmer" />
            </div>
          </div>
          
          {/* Status & Actions */}
          <div className="flex items-center space-x-3 shrink-0">
            <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
            <Skeleton className="h-8 w-8 rounded-full" variant="shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Media gallery skeleton
export function MediaGallerySkeleton({ 
  count = 12,
  className 
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="group relative aspect-square rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2"
        >
          {/* Image */}
          <Skeleton className="w-full h-full rounded-md" variant="shimmer" />
          
          {/* Overlay actions */}
          <div className="absolute inset-2 rounded-md bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Skeleton className="h-8 w-8 rounded-full" variant="pulse" />
          </div>
          
          {/* Filename */}
          <div className="mt-2">
            <Skeleton className="h-3 w-full" variant="shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Form skeleton for editing interfaces
export function FormSkeleton({ 
  fields = 6,
  className 
}: {
  fields?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" variant="shimmer" />
        <Skeleton className="h-12 w-full rounded-lg" variant="shimmer" />
      </div>
      
      {/* Form fields */}
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" variant="shimmer" />
          <Skeleton 
            className={cn(
              "w-full rounded-lg",
              i % 4 === 0 && "h-32", // Large textarea
              i % 4 === 1 && "h-10", // Regular input
              i % 4 === 2 && "h-10", // Regular input
              i % 4 === 3 && "h-20"  // Medium textarea
            )} 
            variant="shimmer" 
          />
        </div>
      ))}
      
      {/* Action buttons */}
      <div className="flex space-x-3 pt-4">
        <Skeleton className="h-11 w-24 rounded-full" variant="shimmer" />
        <Skeleton className="h-11 w-20 rounded-full" variant="shimmer" />
      </div>
    </div>
  )
}

// Dashboard stats skeleton
export function StatCardsSkeleton({ 
  count = 4,
  className 
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
        >
          {/* Icon */}
          <Skeleton className="h-12 w-12 rounded-lg mb-4" variant="shimmer" />
          
          {/* Value */}
          <Skeleton className="h-8 w-20 mb-2" variant="shimmer" />
          
          {/* Label */}
          <Skeleton className="h-4 w-24 mb-1" variant="shimmer" />
          
          {/* Change indicator */}
          <Skeleton className="h-3 w-16" variant="shimmer" />
        </div>
      ))}
    </div>
  )
}

// Navigation skeleton
export function NavigationSkeleton({ className }: { className?: string }) {
  return (
    <nav className={cn("space-y-1", className)}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div 
          key={i}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg"
        >
          <Skeleton className="h-5 w-5 rounded" variant="shimmer" />
          <Skeleton className="h-4 flex-1 max-w-32" variant="shimmer" />
        </div>
      ))}
    </nav>
  )
}

// Table skeleton with header
export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className,
  showHeader = true 
}: {
  rows?: number
  columns?: number
  className?: string
  showHeader?: boolean
}) {
  return (
    <div className={cn("rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden", className)}>
      <table className="w-full">
        {showHeader && (
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-4 text-left">
                  <Skeleton className="h-4 w-20" variant="shimmer" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="bg-white dark:bg-gray-800">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} variant="shimmer" />
          ))}
        </tbody>
      </table>
    </div>
  )
}