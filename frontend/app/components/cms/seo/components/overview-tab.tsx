import { Tag, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { SEOAnalysisResult } from '../types'

interface OverviewTabProps {
  analysis: SEOAnalysisResult
}

export function OverviewTab({ analysis }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Title & Description
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Title Length</span>
              <span className={analysis.metrics.titleLength > 60 ? 'text-red-500' : 'text-blue-600'}>
                {analysis.metrics.titleLength}/60
              </span>
            </div>
            <Progress value={(analysis.metrics.titleLength / 60) * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Description Length</span>
              <span className={analysis.metrics.descriptionLength > 160 ? 'text-red-500' : 'text-blue-600'}>
                {analysis.metrics.descriptionLength}/160
              </span>
            </div>
            <Progress value={(analysis.metrics.descriptionLength / 160) * 100} className="h-2" />
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Content Structure
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>H1 Tags</span>
            <span className={analysis.metrics.headingStructure.h1Count === 1 ? 'text-blue-600' : 'text-red-500'}>
              {analysis.metrics.headingStructure.h1Count}
            </span>
          </div>
          <div className="flex justify-between">
            <span>H2 Tags</span>
            <span>{analysis.metrics.headingStructure.h2Count}</span>
          </div>
          <div className="flex justify-between">
            <span>H3 Tags</span>
            <span>{analysis.metrics.headingStructure.h3Count}</span>
          </div>
          <div className="flex justify-between">
            <span>Word Count</span>
            <span className={analysis.metrics.wordCount < 300 ? 'text-blue-500' : 'text-blue-600'}>
              {analysis.metrics.wordCount}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}