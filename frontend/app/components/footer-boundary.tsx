import { Suspense } from 'react'
import FooterServer from './footer-server'

// Skeleton loader for the footer
function FooterSkeleton() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="col-span-1">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 mb-4 animate-pulse" />
              <div className="space-y-2">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-3 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}

export default function FooterBoundary() {
  return (
    <Suspense fallback={<FooterSkeleton />}>
      <FooterServer />
    </Suspense>
  )
}