'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { SEOAnalysis } from '@/types/seo'
import { 
  FileText, 
  Heading, 
  Image, 
  Link2, 
  CheckCircle, 
  XCircle, 
  AlertCircle 
} from 'lucide-react'

interface SEOAnalyzerProps {
  analysis: SEOAnalysis
}

export function SEOAnalyzer({ analysis }: SEOAnalyzerProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-blue-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-blue-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Fair'
    return 'Poor'
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-bold ${getScoreColor(analysis.score)}`}>
                  {analysis.score}
                </span>
                <span className="text-gray-500 text-xl">/100</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {getScoreLabel(analysis.score)} SEO Score
              </p>
            </div>
            <Badge className={`${getScoreColor(analysis.score).replace('text-', 'bg-')} text-white`}>
              {getScoreLabel(analysis.score)}
            </Badge>
          </div>
          
          <Progress value={analysis.score} className="h-3" />
        </CardContent>
      </Card>

      {/* Content Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Content Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Content Length</p>
              <p className="text-lg font-semibold">{analysis.contentLength || 0} words</p>
              {(analysis.contentLength || 0) < 300 && (
                <p className="text-xs text-red-600">Minimum 300 words recommended</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Readability Score</p>
              <p className="text-lg font-semibold">{(analysis.readabilityScore || 0).toFixed(1)}</p>
              <p className="text-xs text-gray-600">Flesch Reading Ease</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meta Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Meta Tags Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Title Length</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{analysis.metaAnalysis?.title?.length || 0} chars</span>
                {(analysis.metaAnalysis?.title?.length || 0) > 60 ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Description Length</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{analysis.metaAnalysis?.description?.length || 0} chars</span>
                {(analysis.metaAnalysis?.description?.length || 0) > 160 ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                )}
              </div>
            </div>
            
            {/* Canonical URL check removed - property doesn't exist on metaAnalysis */}
            
            {/* Open Graph Tags check removed - property doesn't exist on metaAnalysis */}
            
            {/* Schema Markup check removed - property doesn't exist on metaAnalysis */}
          </div>
        </CardContent>
      </Card>

      {/* Heading Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heading className="w-5 h-5" />
            Heading Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">H1 Tags</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{analysis.headingAnalysis?.hasH1 ? 1 : 0}</span>
                {analysis.headingAnalysis?.hasH1 && !analysis.headingAnalysis?.multipleH1 ? (
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Headings</span>
              <span className="text-sm font-medium">{analysis.headingAnalysis?.hierarchy?.length || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Heading Hierarchy</span>
              {analysis.headingAnalysis?.hierarchy ? (
                <CheckCircle className="w-4 h-4 text-blue-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            
            {(analysis.headingAnalysis?.issues?.length || 0) > 0 && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Issues:</p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  {(analysis.headingAnalysis?.issues || []).map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Image Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Images</span>
              <span className="text-sm font-medium">{analysis.imageAnalysis?.total || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Images with Alt Text</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {analysis.imageAnalysis?.withAlt || 0}/{analysis.imageAnalysis?.total || 0}
                </span>
                {(analysis.imageAnalysis?.withAlt || 0) === (analysis.imageAnalysis?.total || 0) ? (
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Optimization Score</span>
              <span className="text-sm font-medium">{analysis.imageAnalysis?.total && analysis.imageAnalysis?.optimized ? Math.round((analysis.imageAnalysis.optimized / analysis.imageAnalysis.total) * 100) : 0}%</span>
            </div>
            
            {/* Large images check removed - property doesn't exist on imageAnalysis */}
          </div>
        </CardContent>
      </Card>

      {/* Link Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Link Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Internal Links</p>
              <p className="text-lg font-semibold">{analysis.linkAnalysis?.internal || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">External Links</p>
              <p className="text-lg font-semibold">{analysis.linkAnalysis?.external || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nofollow Links</p>
              <p className="text-lg font-semibold">0</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Broken Links</p>
              <p className="text-lg font-semibold text-red-600">{analysis.linkAnalysis?.broken || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues Summary */}
      {analysis.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Issues Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.issues.map((issue, index) => (
                <div key={index} className="flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                  {getIssueIcon(issue.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.field}</p>
                    <p className="text-sm text-gray-600">{issue.message}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {issue.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}