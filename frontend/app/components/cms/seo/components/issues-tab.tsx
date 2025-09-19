import { CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SEOAnalysisResult } from '../types'
import { getIssueIcon, getPriorityBadge } from '../utils'

interface IssuesTabProps {
  analysis: SEOAnalysisResult
}

export function IssuesTab({ analysis }: IssuesTabProps) {
  if (analysis.issues.length === 0) {
    return (
      <Card className="p-6 text-center">
        <CheckCircle className="w-12 h-12 mx-auto text-blue-600 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Issues Found</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your content looks good! Check the recommendations tab for optimization ideas.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {analysis.issues.map(issue => (
        <Card key={issue.id} className="p-4">
          <div className="flex items-start gap-3">
            {getIssueIcon(issue.type)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{issue.title}</h4>
                {getPriorityBadge(issue.impact)}
                <Badge variant="outline" className="text-xs">
                  {issue.category}
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {issue.description}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}