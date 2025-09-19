'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import {
  BarChart3,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Accessibility,
  Globe,
  Zap,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CircularProgress } from '@/components/circular-progress'


interface QualityScore {
  type: 'readability' | 'seo' | 'accessibility' | 'performance' | 'overall'
  score: number
  maxScore: 100
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor'
  details: {
    strengths: string[]
    improvements: string[]
    metrics?: Record<string, any>
  }
}

interface ContentQualityScoreProps {
  content: any
  metadata?: any
  onImprove?: (type: string, suggestion: string) => void
  autoRefresh?: boolean
  className?: string
}

export function ContentQualityScore({
  content,
  metadata,
  onImprove,
  autoRefresh = false,
  className
}: ContentQualityScoreProps) {
  const [scores, setScores] = useState<QualityScore[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [expandedScores, setExpandedScores] = useState<Set<string>>(new Set())
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null)

  // Analyze content quality
  const analyzeContent = async () => {
    setIsAnalyzing(true)
    try {
      // Simulate quality analysis - in production, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newScores: QualityScore[] = [
        {
          type: 'readability',
          score: calculateReadabilityScore(content),
          maxScore: 100,
          status: getScoreStatus(calculateReadabilityScore(content)),
          details: {
            strengths: ['Clear paragraph structure', 'Good sentence length variation'],
            improvements: ['Consider breaking up long paragraphs', 'Add more subheadings'],
            metrics: {
              avgSentenceLength: 15.2,
              avgWordLength: 4.8,
              paragraphCount: 12,
              fleschScore: 65
            }
          }
        },
        {
          type: 'seo',
          score: calculateSEOScore(content, metadata),
          maxScore: 100,
          status: getScoreStatus(calculateSEOScore(content, metadata)),
          details: {
            strengths: ['Title tag present', 'Meta description optimized'],
            improvements: ['Add more internal links', 'Include focus keywords in H2 tags'],
            metrics: {
              titleLength: metadata?.seo_title?.length || 0,
              descriptionLength: metadata?.seo_description?.length || 0,
              keywordDensity: 2.3,
              internalLinks: 3,
              externalLinks: 1
            }
          }
        },
        {
          type: 'accessibility',
          score: calculateAccessibilityScore(content),
          maxScore: 100,
          status: getScoreStatus(calculateAccessibilityScore(content)),
          details: {
            strengths: ['All images have alt text', 'Proper heading hierarchy'],
            improvements: ['Add aria-labels to interactive elements', 'Increase color contrast'],
            metrics: {
              imagesWithAlt: 8,
              totalImages: 8,
              headingStructure: 'valid',
              colorContrast: 'AA'
            }
          }
        },
        {
          type: 'performance',
          score: calculatePerformanceScore(content),
          maxScore: 100,
          status: getScoreStatus(calculatePerformanceScore(content)),
          details: {
            strengths: ['Optimized images', 'Minimal external resources'],
            improvements: ['Lazy load below-fold images', 'Minify inline CSS'],
            metrics: {
              estimatedLoadTime: 2.3,
              totalSize: '1.2MB',
              imageOptimization: 'good',
              codeMinification: 'partial'
            }
          }
        }
      ]

      // Calculate overall score
      const overallScore = Math.round(
        newScores.reduce((sum, score) => sum + score.score, 0) / newScores.length
      )
      
      newScores.push({
        type: 'overall',
        score: overallScore,
        maxScore: 100,
        status: getScoreStatus(overallScore),
        details: {
          strengths: ['Content is well-structured', 'Good SEO foundation'],
          improvements: ['Focus on accessibility improvements', 'Optimize performance further'],
          metrics: {}
        }
      })

      setScores(newScores)
      setLastAnalyzed(new Date())
    } catch (error) {
      logger.error('Failed to analyze content:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Calculate readability score (simplified)
  function calculateReadabilityScore(content: any): number {
    const text = extractTextFromContent(content)
    const words = text.split(/\s+/).length
    const sentences = text.split(/[.!?]+/).length
    const avgWordsPerSentence = words / sentences

    if (avgWordsPerSentence < 15) return 90
    if (avgWordsPerSentence < 20) return 75
    if (avgWordsPerSentence < 25) return 60
    return 45
  }

  // Calculate SEO score (simplified)
  function calculateSEOScore(content: any, metadata: any): number {
    let score = 50 // Base score
    
    if (metadata?.seo_title && metadata.seo_title.length >= 30 && metadata.seo_title.length <= 60) {
      score += 15
    }
    
    if (metadata?.seo_description && metadata.seo_description.length >= 120 && metadata.seo_description.length <= 160) {
      score += 15
    }
    
    if (metadata?.seo_keywords?.length > 0) {
      score += 10
    }
    
    // Check for headings in content
    const text = extractTextFromContent(content)
    if (text.includes('h2') || text.includes('##')) {
      score += 10
    }
    
    return Math.min(score, 100)
  }

  // Calculate accessibility score (simplified)
  function calculateAccessibilityScore(content: any): number {
    let score = 70 // Base score
    
    // Check for images without alt text (simplified check)
    const text = extractTextFromContent(content)
    const hasImages = text.includes('img') || text.includes('image')
    const hasAltText = text.includes('alt=')
    
    if (!hasImages || hasAltText) {
      score += 20
    }
    
    // Check for proper heading structure
    if (text.includes('h1') || text.includes('h2')) {
      score += 10
    }
    
    return Math.min(score, 100)
  }

  // Calculate performance score (simplified)
  function calculatePerformanceScore(content: any): number {
    const text = extractTextFromContent(content)
    const estimatedSize = new Blob([text]).size
    
    if (estimatedSize < 50000) return 95 // < 50KB
    if (estimatedSize < 100000) return 85 // < 100KB
    if (estimatedSize < 200000) return 70 // < 200KB
    return 55
  }

  // Extract text from content (simplified)
  function extractTextFromContent(content: any): string {
    if (typeof content === 'string') return content
    if (content?.text) return content.text
    return JSON.stringify(content)
  }

  // Get score status
  function getScoreStatus(score: number): 'excellent' | 'good' | 'needs-improvement' | 'poor' {
    if (score >= 90) return 'excellent'
    if (score >= 70) return 'good'
    if (score >= 50) return 'needs-improvement'
    return 'poor'
  }

  // Get score color
  function getScoreColor(status: string) {
    switch (status) {
      case 'excellent':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      case 'needs-improvement':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      case 'poor':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-blue-900/20 dark:border-blue-800'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
    }
  }

  // Get score icon
  function getScoreIcon(type: string) {
    switch (type) {
      case 'readability':
        return FileText
      case 'seo':
        return Search
      case 'accessibility':
        return Accessibility
      case 'performance':
        return Zap
      case 'overall':
        return BarChart3
      default:
        return Info
    }
  }

  // Toggle score expansion
  const toggleScoreExpansion = (type: string) => {
    setExpandedScores(prev => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && content) {
      analyzeContent()
      const interval = setInterval(analyzeContent, 60000) // Every minute
      return () => clearInterval(interval)
    }
  }, [content, metadata, autoRefresh])

  // Initial analysis
  useEffect(() => {
    if (content && scores.length === 0) {
      analyzeContent()
    }
  }, [content])

  const overallScore = scores.find(s => s.type === 'overall')

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h3 className="font-medium">Content Quality Analysis</h3>
          </div>

          <div className="flex items-center gap-2">
            {lastAnalyzed && (
              <span className="text-xs text-gray-500">
                Last analyzed: {lastAnalyzed.toLocaleTimeString()}
              </span>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={analyzeContent}
              disabled={isAnalyzing}
              className="gap-2"
            >
              <RefreshCw className={cn('w-4 h-4', isAnalyzing && 'animate-spin')} />
              {isAnalyzing ? 'Analyzing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Overall score */}
        {overallScore && (
          <div className={cn(
            'p-4  border-2',
            getScoreColor(overallScore.status)
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CircularProgress 
                  value={overallScore.score} 
                  size={60}
                  strokeWidth={6}
                  color={
                    overallScore.status === 'excellent' ? '#2563EB' :
                    overallScore.status === 'good' ? '#2563eb' :
                    overallScore.status === 'needs-improvement' ? '#2563EB' :
                    '#dc2626'
                  }
                />
                
                <div>
                  <div className="font-medium">Overall Quality Score</div>
                  <div className="text-sm opacity-75">
                    {overallScore.status.charAt(0).toUpperCase() + overallScore.status.slice(1).replace('-', ' ')}
                  </div>
                </div>
              </div>

              <TrendingUp className="w-6 h-6 opacity-50" />
            </div>
          </div>
        )}

        {/* Individual scores */}
        <div className="space-y-3">
          {scores.filter(s => s.type !== 'overall').map((score) => {
            const Icon = getScoreIcon(score.type)
            const isExpanded = expandedScores.has(score.type)

            return (
              <div
                key={score.type}
                className={cn(
                  'border  p-4 transition-colors',
                  isExpanded && 'bg-gray-50 dark:bg-gray-800'
                )}
              >
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleScoreExpansion(score.type)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{score.type}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs',
                            score.status === 'excellent' && 'text-blue-600',
                            score.status === 'good' && 'text-blue-600',
                            score.status === 'needs-improvement' && 'text-blue-600',
                            score.status === 'poor' && 'text-red-600'
                          )}
                        >
                          {score.score}/{score.maxScore}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1">
                        {score.details.strengths.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <CheckCircle className="w-3 h-3" />
                            {score.details.strengths.length} strengths
                          </div>
                        )}
                        {score.details.improvements.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <AlertTriangle className="w-3 h-3" />
                            {score.details.improvements.length} improvements
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-4 space-y-3 pl-8">
                    {/* Strengths */}
                    {score.details.strengths.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-blue-600">Strengths:</div>
                        <ul className="text-sm space-y-1">
                          {score.details.strengths.map((strength, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvements */}
                    {score.details.improvements.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-blue-600">Suggested Improvements:</div>
                        <ul className="text-sm space-y-1">
                          {score.details.improvements.map((improvement, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5" />
                              <span className="flex-1">{improvement}</span>
                              {onImprove && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onImprove(score.type, improvement)}
                                  className="text-xs h-6 px-2"
                                >
                                  Apply
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Metrics */}
                    {score.details.metrics && Object.keys(score.details.metrics).length > 0 && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-600">Metrics:</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(score.details.metrics).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-gray-500 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <span className="font-mono">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Loading state */}
        {isAnalyzing && scores.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500">Analyzing content quality...</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}