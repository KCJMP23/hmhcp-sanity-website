'use client'

import { cn } from '@/lib/utils'
import type { SEOAnalyzerProps } from './types'
import { useSEOAnalyzer } from './hooks'
import {
  ScoreHeader,
  TabNavigation,
  OverviewTab,
  IssuesTab,
  RecommendationsTab,
  MetricsTab,
  EmptyState
} from './components'

export function SEOAnalyzer({ content, onUpdate, className }: SEOAnalyzerProps) {
  const { analysis, isAnalyzing, activeTab, setActiveTab, analyzeContent } = useSEOAnalyzer(content)

  if (!analysis && !isAnalyzing) {
    return <EmptyState onAnalyze={analyzeContent} className={className} />
  }

  return (
    <div className={cn('space-y-6', className)}>
      <ScoreHeader 
        analysis={analysis} 
        isAnalyzing={isAnalyzing} 
        onAnalyze={analyzeContent} 
      />
      
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      {analysis && (
        <div>
          {activeTab === 'overview' && <OverviewTab analysis={analysis} />}
          {activeTab === 'issues' && <IssuesTab analysis={analysis} />}
          {activeTab === 'recommendations' && <RecommendationsTab analysis={analysis} />}
          {activeTab === 'metrics' && <MetricsTab analysis={analysis} content={content} />}
        </div>
      )}
    </div>
  )
}