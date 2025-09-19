'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SERPPreview } from './SERPPreview'
import { CharacterCounter } from './CharacterCounter'
import { SchemaEditor } from './SchemaEditor'
import { SocialMediaPreview } from './SocialMediaPreview'
import { CanonicalURLEditor } from './CanonicalURLEditor'
import { SEOAnalyzer } from './analysis/SEOAnalyzer'
import { SEOService } from '@/services/cms/seoService'
import { useToast } from '@/hooks/use-toast'
import type { CMSPage } from '@/types/cms-content'
import type { SEOAnalysis } from '@/types/seo'
import { Search, BarChart3, Settings, Share2, Code, AlertCircle } from 'lucide-react'

interface SEOEditorProps {
  page: CMSPage
  onChange: (updates: Partial<CMSPage>) => void
  onSave?: () => void
  disabled?: boolean
}

export function SEOEditor({ page, onChange, onSave, disabled }: SEOEditorProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null)
  const [seoScore, setSeoScore] = useState<any | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Calculate SEO score locally for real-time feedback
    if (page) {
      const score = SEOService.calculateSEOScore(page)
      setSeoScore(score)
    }
  }, [page])

  const handleAnalyze = async () => {
    if (!page.id) return

    setIsAnalyzing(true)
    try {
      const result = await SEOService.analyzePage(page.id)
      setAnalysis(result)
      
      toast({
        title: 'SEO Analysis Complete',
        description: `Your SEO score is ${result.score}/100`,
      })
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: 'Unable to analyze page SEO',
        variant: 'destructive'
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k)
    onChange({ 
      seo: {
        ...page.seo,
        keywords: keywords 
      }
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-blue-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-blue-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-blue-100 text-blue-600">Excellent</Badge>
    if (score >= 70) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
    if (score >= 50) return <Badge className="bg-blue-100 text-blue-800">Fair</Badge>
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>
  }

  return (
    <div className="space-y-6">
      {/* SEO Score Overview */}
      {seoScore && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                SEO Score
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className={`text-3xl font-bold ${getScoreColor(seoScore.total)}`}>
                  {seoScore.total}
                </span>
                <span className="text-gray-500">/100</span>
                {getScoreBadge(seoScore.total)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {Object.entries(seoScore.breakdown).map(([key, data]: [string, any]) => (
                <div key={key} className="text-center">
                  <div className="text-sm text-gray-500 capitalize">{key}</div>
                  <div className={`text-lg font-semibold ${getScoreColor((data.score / data.maxScore) * 100)}`}>
                    {data.score}/{data.maxScore}
                  </div>
                </div>
              ))}
            </div>
            {seoScore.recommendations.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      {seoScore.recommendations.length} improvements recommended
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      {seoScore.recommendations[0].suggestion}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SEO Editor Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 lg:grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Technical</span>
              </TabsTrigger>
              <TabsTrigger value="schema" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="hidden sm:inline">Schema</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analysis</span>
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="basic" className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="seo-title">SEO Title</Label>
                  <CharacterCounter
                    value={page.seo?.metaTitle || page.title || ''}
                    onChange={(value) => onChange({ 
                      seo: {
                        ...page.seo,
                        metaTitle: value
                      }
                    })}
                    maxLength={60}
                    warningLength={50}
                    placeholder="Enter SEO optimized title"
                    disabled={disabled}
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="seo-description">Meta Description</Label>
                  <CharacterCounter
                    value={page.seo?.metaDescription || ''}
                    onChange={(value) => onChange({ 
                      seo: {
                        ...page.seo,
                        metaDescription: value
                      }
                    })}
                    maxLength={160}
                    warningLength={150}
                    placeholder="Write a compelling meta description"
                    textarea
                    disabled={disabled}
                  />
                </div>

                {/* Keywords */}
                <div>
                  <Label htmlFor="seo-keywords">Focus Keywords</Label>
                  <Input
                    id="seo-keywords"
                    value={page.seo?.keywords?.join(', ') || ''}
                    onChange={(e) => handleKeywordsChange(e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                    disabled={disabled}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Separate keywords with commas. Use 3-5 focus keywords.
                  </p>
                </div>

                {/* SERP Preview */}
                <div>
                  <Label>Search Result Preview</Label>
                  <SERPPreview
                    title={page.seo?.metaTitle || page.title || 'Page Title'}
                    description={page.seo?.metaDescription || 'Page description will appear here...'}
                    url={`/${page.slug || 'page-url'}`}
                  />
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-6">
                <SocialMediaPreview
                  page={page}
                  onChange={onChange}
                  disabled={disabled}
                />
              </TabsContent>

              <TabsContent value="technical" className="space-y-6">
                {/* Canonical URL */}
                <CanonicalURLEditor
                  value={page.seo?.canonicalUrl || ''}
                  slug={page.slug}
                  onChange={(value) => onChange({ 
                    seo: {
                      ...page.seo,
                      canonicalUrl: value
                    }
                  })}
                  disabled={disabled}
                />

                {/* Robots Directives */}
                <div>
                  <Label>Robots Meta Tags</Label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!page.seo?.noIndex}
                        onChange={(e) => {
                          onChange({
                            seo: {
                              ...page.seo,
                              noIndex: !e.target.checked
                            }
                          })
                        }}
                        disabled={disabled}
                        className="border-gray-300"
                      />
                      <span className="text-sm">index</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!page.seo?.noFollow}
                        onChange={(e) => {
                          onChange({
                            seo: {
                              ...page.seo,
                              noFollow: !e.target.checked
                            }
                          })
                        }}
                        disabled={disabled}
                        className="border-gray-300"
                      />
                      <span className="text-sm">follow</span>
                    </label>
                  </div>
                </div>

                {/* URL Slug */}
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={page.slug || ''}
                    onChange={(e) => onChange({ slug: e.target.value })}
                    placeholder="page-url-slug"
                    disabled={disabled}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use lowercase letters, numbers, and hyphens only
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="schema">
                <SchemaEditor
                  page={page}
                  onChange={(schema) => onChange({ 
                    seo: {
                      ...page.seo,
                      structuredData: schema
                    }
                  })}
                  disabled={disabled}
                />
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">SEO Analysis</h3>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || disabled}
                    size="sm"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                  </Button>
                </div>

                {analysis ? (
                  <>
                    <SEOAnalyzer analysis={analysis} />
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Run SEO analysis to see detailed insights</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Button */}
      {onSave && (
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={disabled}>
            Save SEO Settings
          </Button>
        </div>
      )}
    </div>
  )
}