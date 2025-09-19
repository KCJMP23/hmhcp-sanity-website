import { RefreshCw, AlertCircle, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SEOAnalysisResult } from '../types'
import { getScoreColor, getScoreBackground, getScoreDescription } from '../utils'

interface ScoreHeaderProps {
  analysis: SEOAnalysisResult | null
  isAnalyzing: boolean
  onAnalyze: () => void
}

export function ScoreHeader({ analysis, isAnalyzing, onAnalyze }: ScoreHeaderProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-16 h-16  flex items-center justify-center',
            analysis && getScoreBackground(analysis.score)
          )}>
            <span className={cn(
              'text-2xl font-bold',
              analysis && getScoreColor(analysis.score)
            )}>
              {analysis?.score || 0}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">SEO Score</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {analysis ? getScoreDescription(analysis.score) : 'Not analyzed'}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onAnalyze} disabled={isAnalyzing}>
          <RefreshCw className={cn('w-4 h-4 mr-2', isAnalyzing && 'animate-spin')} />
          {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
        </Button>
      </div>
      
      {analysis && (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="font-medium">{analysis.issues.filter(i => i.type === 'error').length}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{analysis.issues.filter(i => i.type === 'warning').length}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Warnings</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{analysis.recommendations.length}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Suggestions</p>
          </div>
        </div>
      )}
    </Card>
  )
}