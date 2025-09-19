import { Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  onAnalyze: () => void
  className?: string
}

export function EmptyState({ onAnalyze, className }: EmptyStateProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="text-center">
        <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">SEO Analysis</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Analyze your content for SEO optimization opportunities.
        </p>
        <Button onClick={onAnalyze}>
          <Search className="w-4 h-4 mr-2" />
          Analyze SEO
        </Button>
      </div>
    </Card>
  )
}