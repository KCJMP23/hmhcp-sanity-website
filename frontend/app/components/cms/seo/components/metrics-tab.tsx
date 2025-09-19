import { Image, Link, FileText, Globe } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { SEOAnalysisResult, SEOContent } from '../types'

interface MetricsTabProps {
  analysis: SEOAnalysisResult
  content: SEOContent
}

export function MetricsTab({ analysis, content }: MetricsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Image className="w-4 h-4" />
          Images & Media
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Images</span>
            <span>{analysis.metrics.imageCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Images with Alt Text</span>
            <span className={analysis.metrics.imagesWithAlt === analysis.metrics.imageCount ? 'text-blue-600' : 'text-red-500'}>
              {analysis.metrics.imagesWithAlt}/{analysis.metrics.imageCount}
            </span>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Link className="w-4 h-4" />
          Links
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Links</span>
            <span>{analysis.metrics.linkCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Internal Links</span>
            <span>{analysis.metrics.internalLinks}</span>
          </div>
          <div className="flex justify-between">
            <span>External Links</span>
            <span>{analysis.metrics.externalLinks}</span>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Readability
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Readability Score</span>
              <span className={analysis.metrics.readabilityScore >= 70 ? 'text-blue-600' : 'text-blue-500'}>
                {analysis.metrics.readabilityScore}/100
              </span>
            </div>
            <Progress value={analysis.metrics.readabilityScore} className="h-2" />
          </div>
          <div className="flex justify-between text-sm">
            <span>Word Count</span>
            <span>{analysis.metrics.wordCount}</span>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Technical SEO
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Meta Title</span>
            <span className={content.title ? 'text-blue-600' : 'text-red-500'}>
              {content.title ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Meta Description</span>
            <span className={content.description ? 'text-blue-600' : 'text-red-500'}>
              {content.description ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>URL Slug</span>
            <span className={content.slug ? 'text-blue-600' : 'text-red-500'}>
              {content.slug ? '✓' : '✗'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}