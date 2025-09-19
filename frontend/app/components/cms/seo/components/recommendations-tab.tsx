import { TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SEOAnalysisResult } from '../types'
import { getPriorityBadge } from '../utils'

interface RecommendationsTabProps {
  analysis: SEOAnalysisResult
}

export function RecommendationsTab({ analysis }: RecommendationsTabProps) {
  if (analysis.recommendations.length === 0) {
    return (
      <Card className="p-6 text-center">
        <TrendingUp className="w-12 h-12 mx-auto text-blue-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Recommendations</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your content is well optimized! Keep up the good work.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {analysis.recommendations.map(rec => (
        <Card key={rec.id} className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium">{rec.title}</h4>
            <div className="flex gap-2">
              {getPriorityBadge(rec.priority)}
              <Badge variant="outline" className="text-xs">
                {rec.effort}
              </Badge>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            {rec.description}
          </p>
          <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
            Impact: {rec.impact}
          </p>
        </Card>
      ))}
    </div>
  )
}