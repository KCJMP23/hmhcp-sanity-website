import { Suspense } from 'react'
import NavigationServer from '@/components/navigation-server'
import { Skeleton, SkeletonLine, SkeletonCircle } from '@/components/animations/skeleton'

// Loading skeleton
function NavigationSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 md:h-20 bg-transparent">
      <div className="container mx-auto h-full px-4">
        <div className="flex items-center justify-between h-full">
          <Skeleton className="h-12 w-32" />
          <div className="hidden md:flex items-center space-x-8">
            {[...Array(7)].map((_, i) => (
              <SkeletonLine key={i} width="4rem" />
            ))}
          </div>
          <SkeletonCircle size="2rem" />
        </div>
      </div>
    </header>
  )
}

export default function NavigationWrapperFixed() {
  return (
    <Suspense fallback={<NavigationSkeleton />}>
      <NavigationServer />
    </Suspense>
  )
}