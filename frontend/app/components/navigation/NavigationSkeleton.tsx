import React from 'react'

export function NavigationSkeleton() {
  return (
    <div className="flex items-center space-x-8">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ))}
    </div>
  )
}

export function FooterNavigationSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
      {[1, 2, 3].map((col) => (
        <div key={col}>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-3 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}