import { Suspense } from 'react'
import NavigationServer from './navigation-server'

// Skeleton loader for the navigation
function NavigationSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="container mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Logo skeleton */}
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          
          {/* Navigation items skeleton */}
          <div className="hidden lg:flex items-center space-x-8">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ))}
          </div>
          
          {/* Theme toggle skeleton */}
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </div>
    </header>
  )
}

export default function NavigationBoundary() {
  return (
    <Suspense fallback={<NavigationSkeleton />}>
      <NavigationServer />
    </Suspense>
  )
}