import { GlassmorphismCard } from "@/components/ui/global-styles"

export function BlogPostSkeleton() {
  return (
    <GlassmorphismCard className="overflow-hidden animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        <div className="relative h-48 md:h-auto bg-gray-200 dark:bg-gray-700" />
        <div className="md:col-span-2 p-6">
          <div className="flex items-center mb-3">
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 mb-3" />
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 w-5/6" />
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </GlassmorphismCard>
  )
}

export function BlogLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <BlogPostSkeleton key={i} />
      ))}
    </div>
  )
}