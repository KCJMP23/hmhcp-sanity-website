'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Info, AlertCircle, Check, X, Image as ImageIcon, Code } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MediaPicker } from '../media/MediaPicker'

interface SEOMetadataProps {
  value: SEOMetadata
  onChange: (value: SEOMetadata) => void
  contentTitle?: string
  contentSlug?: string
  onError?: (errors: string[]) => void
}

export interface SEOMetadata {
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  canonicalUrl?: string
  robotsMeta?: string
  structuredData?: any
}

const CHAR_LIMITS = {
  metaTitle: { ideal: 60, max: 160 },
  metaDescription: { ideal: 155, max: 160 },
  ogTitle: { ideal: 60, max: 95 },
  ogDescription: { ideal: 155, max: 200 },
  twitterTitle: { ideal: 50, max: 70 },
  twitterDescription: { ideal: 155, max: 200 }
}

const OG_TYPES = [
  'article',
  'website',
  'book',
  'profile',
  'video.movie',
  'video.episode',
  'video.tv_show',
  'video.other',
  'music.song',
  'music.album'
]

const TWITTER_CARD_TYPES = [
  'summary',
  'summary_large_image',
  'app',
  'player'
]

const ROBOTS_OPTIONS = [
  'index,follow',
  'noindex,follow',
  'index,nofollow',
  'noindex,nofollow',
  'none',
  'noarchive',
  'nosnippet',
  'notranslate',
  'noimageindex'
]

export function SEOMetadata({ 
  value, 
  onChange, 
  contentTitle = '',
  contentSlug = '',
  onError 
}: SEOMetadataProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [keywords, setKeywords] = useState(value.metaKeywords?.join(', ') || '')
  const [structuredDataText, setStructuredDataText] = useState(
    value.structuredData ? JSON.stringify(value.structuredData, null, 2) : ''
  )

  // Character count helper
  const getCharCount = (text: string = '', limits: { ideal: number, max: number }) => {
    const length = text.length
    const status = length === 0 ? 'empty' : 
                  length <= limits.ideal ? 'good' :
                  length <= limits.max ? 'warning' : 'error'
    
    return { length, status, limits }
  }

  // Validate all fields
  useEffect(() => {
    const newErrors: string[] = []

    // Check character limits
    Object.entries(CHAR_LIMITS).forEach(([field, limits]) => {
      const fieldValue = value[field as keyof SEOMetadata] as string
      if (fieldValue && fieldValue.length > limits.max) {
        newErrors.push(`${field} exceeds maximum length of ${limits.max} characters`)
      }
    })

    // Validate structured data JSON
    if (structuredDataText) {
      try {
        JSON.parse(structuredDataText)
      } catch {
        newErrors.push('Structured data must be valid JSON')
      }
    }

    // Validate URLs
    if (value.ogImage && !isValidUrl(value.ogImage)) {
      newErrors.push('Open Graph image must be a valid URL')
    }
    if (value.twitterImage && !isValidUrl(value.twitterImage)) {
      newErrors.push('Twitter image must be a valid URL')
    }
    if (value.canonicalUrl && !isValidUrl(value.canonicalUrl)) {
      newErrors.push('Canonical URL must be valid')
    }

    setErrors(newErrors)
    onError?.(newErrors)
  }, [value, structuredDataText, onError])

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleFieldChange = (field: keyof SEOMetadata, newValue: any) => {
    onChange({ ...value, [field]: newValue })
  }

  const handleKeywordsChange = (text: string) => {
    setKeywords(text)
    const keywordArray = text.split(',').map(k => k.trim()).filter(Boolean)
    handleFieldChange('metaKeywords', keywordArray)
  }

  const handleStructuredDataChange = (text: string) => {
    setStructuredDataText(text)
    try {
      const parsed = JSON.parse(text)
      handleFieldChange('structuredData', parsed)
    } catch {
      // Don't update if invalid JSON
    }
  }

  const generateFromContent = () => {
    const updates: Partial<SEOMetadata> = {}
    
    if (!value.metaTitle && contentTitle) {
      updates.metaTitle = contentTitle.substring(0, 60)
    }
    if (!value.ogTitle && contentTitle) {
      updates.ogTitle = contentTitle.substring(0, 60)
    }
    if (!value.twitterTitle && contentTitle) {
      updates.twitterTitle = contentTitle.substring(0, 50)
    }
    
    onChange({ ...value, ...updates })
  }

  const CharCounter = ({ value = '', field }: { value?: string, field: keyof typeof CHAR_LIMITS }) => {
    const count = getCharCount(value, CHAR_LIMITS[field])
    
    return (
      <span className={cn(
        'text-xs',
        count.status === 'good' && 'text-blue-600',
        count.status === 'warning' && 'text-blue-600',
        count.status === 'error' && 'text-red-600'
      )}>
        {count.length}/{count.limits.ideal} 
        {count.status === 'warning' && ` (max ${count.limits.max})`}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>SEO & Social Media</CardTitle>
            <CardDescription>
              Optimize how your content appears in search results and social shares
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateFromContent}
            disabled={!contentTitle}
          >
            Generate from content
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-blue-900/20 border border-red-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-1">
                {errors.map((error, i) => (
                  <p key={i} className="text-sm text-red-600 dark:text-blue-400">{error}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic SEO</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <CharCounter value={value.metaTitle} field="metaTitle" />
              </div>
              <Input
                id="metaTitle"
                value={value.metaTitle || ''}
                onChange={(e) => handleFieldChange('metaTitle', e.target.value)}
                placeholder="Page title for search results"
              />
              <p className="text-xs text-muted-foreground">
                This appears as the clickable headline in search results
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <CharCounter value={value.metaDescription} field="metaDescription" />
              </div>
              <Textarea
                id="metaDescription"
                value={value.metaDescription || ''}
                onChange={(e) => handleFieldChange('metaDescription', e.target.value)}
                placeholder="Brief description for search results"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This appears below the title in search results
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => handleKeywordsChange(e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of relevant keywords
              </p>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            {/* Open Graph */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Open Graph (Facebook, LinkedIn)
              </h3>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ogTitle">OG Title</Label>
                    <CharCounter value={value.ogTitle} field="ogTitle" />
                  </div>
                  <Input
                    id="ogTitle"
                    value={value.ogTitle || ''}
                    onChange={(e) => handleFieldChange('ogTitle', e.target.value)}
                    placeholder="Title for social shares"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ogDescription">OG Description</Label>
                    <CharCounter value={value.ogDescription} field="ogDescription" />
                  </div>
                  <Textarea
                    id="ogDescription"
                    value={value.ogDescription || ''}
                    onChange={(e) => handleFieldChange('ogDescription', e.target.value)}
                    placeholder="Description for social shares"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>OG Image</Label>
                    <MediaPicker
                      value={value.ogImage ? { 
                        id: 'og-image',
                        filename: 'OG Image',
                        original_name: 'OG Image',
                        publicUrl: value.ogImage,
                        mime_type: 'image/jpeg',
                        size_bytes: 0
                      } : undefined}
                      onChange={(media) => {
                        const url = Array.isArray(media) ? media[0]?.publicUrl : media?.publicUrl
                        handleFieldChange('ogImage', url || '')
                      }}
                      accept={['image/*']}
                      placeholder="Select Open Graph image"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 1200×630px for optimal display
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ogType">OG Type</Label>
                    <Select
                      value={value.ogType || 'article'}
                      onValueChange={(v) => handleFieldChange('ogType', v)}
                    >
                      <SelectTrigger id="ogType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OG_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Twitter */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-medium flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Twitter / X
              </h3>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitterCard">Card Type</Label>
                  <Select
                    value={value.twitterCard || 'summary_large_image'}
                    onValueChange={(v) => handleFieldChange('twitterCard', v)}
                  >
                    <SelectTrigger id="twitterCard">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TWITTER_CARD_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="twitterTitle">Twitter Title</Label>
                    <CharCounter value={value.twitterTitle} field="twitterTitle" />
                  </div>
                  <Input
                    id="twitterTitle"
                    value={value.twitterTitle || ''}
                    onChange={(e) => handleFieldChange('twitterTitle', e.target.value)}
                    placeholder="Title for Twitter cards"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="twitterDescription">Twitter Description</Label>
                    <CharCounter value={value.twitterDescription} field="twitterDescription" />
                  </div>
                  <Textarea
                    id="twitterDescription"
                    value={value.twitterDescription || ''}
                    onChange={(e) => handleFieldChange('twitterDescription', e.target.value)}
                    placeholder="Description for Twitter cards"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Twitter Image</Label>
                  <MediaPicker
                    value={value.twitterImage ? { 
                      id: 'twitter-image',
                      filename: 'Twitter Image',
                      original_name: 'Twitter Image',
                      publicUrl: value.twitterImage,
                      mime_type: 'image/jpeg',
                      size_bytes: 0
                    } : undefined}
                    onChange={(media) => {
                      const url = Array.isArray(media) ? media[0]?.publicUrl : media?.publicUrl
                      handleFieldChange('twitterImage', url || '')
                    }}
                    accept={['image/*']}
                    placeholder="Select Twitter card image"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 800×418px for summary_large_image
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input
                id="canonicalUrl"
                value={value.canonicalUrl || ''}
                onChange={(e) => handleFieldChange('canonicalUrl', e.target.value)}
                placeholder="https://example.com/original-page"
              />
              <p className="text-xs text-muted-foreground">
                Specify the preferred URL if this content exists in multiple locations
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="robotsMeta">Robots Meta</Label>
              <Select
                value={value.robotsMeta || 'index,follow'}
                onValueChange={(v) => handleFieldChange('robotsMeta', v)}
              >
                <SelectTrigger id="robotsMeta">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROBOTS_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Control how search engines crawl and index this page
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="structuredData">Structured Data (JSON-LD)</Label>
                <Badge variant={structuredDataText && !errors.includes('Structured data must be valid JSON') ? 'default' : 'secondary'}>
                  <Code className="w-3 h-3 mr-1" />
                  {structuredDataText ? 'Active' : 'Not set'}
                </Badge>
              </div>
              <Textarea
                id="structuredData"
                value={structuredDataText}
                onChange={(e) => handleStructuredDataChange(e.target.value)}
                placeholder={`{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your article title",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  }
}`}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Schema.org structured data for rich snippets
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Search Engine Preview</h3>
              <div className="p-4 bg-white dark:bg-gray-900 border">
                <div className="space-y-1">
                  <div className="text-blue-600 dark:text-blue-400 text-xl">
                    {value.metaTitle || contentTitle || 'Page Title'}
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 text-sm">
                    {process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/{contentSlug || 'page-url'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    {value.metaDescription || 'Page description will appear here...'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Facebook Preview</h3>
              <div className="border overflow-hidden max-w-[500px]">
                {value.ogImage && (
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    {process.env.NEXT_PUBLIC_SITE_URL || 'example.com'}
                  </div>
                  <div className="font-medium mt-1">
                    {value.ogTitle || value.metaTitle || contentTitle || 'Page Title'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {value.ogDescription || value.metaDescription || 'Description...'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Twitter Preview</h3>
              <div className="border overflow-hidden max-w-[500px]">
                {value.twitterCard === 'summary_large_image' && value.twitterImage && (
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="p-4">
                  <div className="font-medium">
                    {value.twitterTitle || value.ogTitle || value.metaTitle || contentTitle || 'Page Title'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {value.twitterDescription || value.ogDescription || value.metaDescription || 'Description...'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {process.env.NEXT_PUBLIC_SITE_URL || 'example.com'}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}