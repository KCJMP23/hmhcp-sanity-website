'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Search, Globe, Eye, Smartphone, Monitor } from 'lucide-react'
import { ContentMetadata } from '@/lib/types/cms-types'

interface SEOFieldsProps {
  meta: ContentMetadata
  onChange: (field: string, value: any) => void
}

export function SEOFields({ meta, onChange }: SEOFieldsProps) {
  const seoTitle = meta.seo_title || ''
  const seoDescription = meta.seo_description || ''
  
  const titleLength = seoTitle.length
  const descriptionLength = seoDescription.length
  
  const getTitleStatus = () => {
    if (titleLength === 0) return { color: 'text-muted-foreground', text: 'No title set' }
    if (titleLength < 30) return { color: 'text-red-500', text: 'Too short' }
    if (titleLength <= 60) return { color: 'text-green-500', text: 'Good length' }
    return { color: 'text-yellow-500', text: 'Too long' }
  }
  
  const getDescriptionStatus = () => {
    if (descriptionLength === 0) return { color: 'text-muted-foreground', text: 'No description set' }
    if (descriptionLength < 120) return { color: 'text-red-500', text: 'Too short' }
    if (descriptionLength <= 160) return { color: 'text-green-500', text: 'Good length' }
    return { color: 'text-yellow-500', text: 'Too long' }
  }

  const titleStatus = getTitleStatus()
  const descriptionStatus = getDescriptionStatus()

  return (
    <div className="space-y-4">
      {/* SEO Basics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            SEO Basics
          </CardTitle>
          <CardDescription>
            Optimize your content for search engines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="seo_title">SEO Title</Label>
            <Input
              id="seo_title"
              value={seoTitle}
              onChange={(e) => onChange('seo_title', e.target.value)}
              placeholder="Enter SEO title (50-60 characters recommended)"
              maxLength={100}
            />
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className={titleStatus.color}>{titleStatus.text}</span>
              <span className="text-muted-foreground">{titleLength}/60</span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="seo_description">SEO Description</Label>
            <Textarea
              id="seo_description"
              value={seoDescription}
              onChange={(e) => onChange('seo_description', e.target.value)}
              placeholder="Enter meta description (120-160 characters recommended)"
              rows={3}
              maxLength={200}
            />
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className={descriptionStatus.color}>{descriptionStatus.text}</span>
              <span className="text-muted-foreground">{descriptionLength}/160</span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="canonical_url">Canonical URL</Label>
            <Input
              id="canonical_url"
              value={meta.canonical_url || ''}
              onChange={(e) => onChange('canonical_url', e.target.value)}
              placeholder="https://hmhealthcarepartners.com/page-url"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use the default page URL
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Social Media Preview
          </CardTitle>
          <CardDescription>
            Control how your content appears when shared on social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="og_image">Open Graph Image URL</Label>
            <Input
              id="og_image"
              value={meta.og_image || ''}
              onChange={(e) => onChange('og_image', e.target.value)}
              placeholder="/og-image.jpg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: 1200x630px image for optimal social media display
            </p>
          </div>

          {/* Social Media Preview */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Social Media Preview
            </h4>
            <div className="space-y-3">
              {/* Facebook/LinkedIn Style */}
              <div className="border rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
                {meta.og_image && (
                  <div className="w-full h-32 bg-muted flex items-center justify-center text-sm text-muted-foreground">
                    <img 
                      src={meta.og_image} 
                      alt="OG Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.textContent = 'Image not found'
                      }}
                    />
                  </div>
                )}
                <div className="p-3">
                  <h5 className="font-medium text-sm line-clamp-1">
                    {seoTitle || 'SEO Title will appear here'}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {seoDescription || 'SEO description will appear here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    hmhealthcarepartners.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Advanced SEO
          </CardTitle>
          <CardDescription>
            Advanced search engine optimization settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>No Index</Label>
              <p className="text-xs text-muted-foreground">
                Prevent search engines from indexing this content
              </p>
            </div>
            <Switch
              checked={meta.no_index || false}
              onCheckedChange={(checked) => onChange('no_index', checked)}
            />
          </div>
          
          <div>
            <Label htmlFor="schema_markup">Schema Markup (JSON-LD)</Label>
            <Textarea
              id="schema_markup"
              value={meta.schema_markup ? JSON.stringify(meta.schema_markup, null, 2) : ''}
              onChange={(e) => {
                try {
                  const parsed = e.target.value ? JSON.parse(e.target.value) : null
                  onChange('schema_markup', parsed)
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              placeholder='{"@context": "https://schema.org", "@type": "Article", "name": "Article Name"}'
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Add structured data to help search engines understand your content
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Custom Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Custom Code
          </CardTitle>
          <CardDescription>
            Add custom CSS and JavaScript for this content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="custom_css">Custom CSS</Label>
            <Textarea
              id="custom_css"
              value={meta.custom_css || ''}
              onChange={(e) => onChange('custom_css', e.target.value)}
              placeholder=".custom-class { color: blue; }"
              rows={4}
              className="font-mono text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="custom_js">Custom JavaScript</Label>
            <Textarea
              id="custom_js"
              value={meta.custom_js || ''}
              onChange={(e) => onChange('custom_js', e.target.value)}
              placeholder="console.log('Custom script');"
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              JavaScript will be executed when the page loads
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SEO Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className="w-5 h-5" />
            SEO Checklist
          </CardTitle>
          <CardDescription>
            Quick checklist to ensure good SEO practices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${seoTitle && titleLength >= 30 && titleLength <= 60 ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">SEO title is optimal length (30-60 characters)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${seoDescription && descriptionLength >= 120 && descriptionLength <= 160 ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Meta description is optimal length (120-160 characters)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${meta.og_image ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm">Open Graph image is set</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${seoTitle?.toLowerCase().includes('healthcare') || seoTitle?.toLowerCase().includes('clinical') || seoTitle?.toLowerCase().includes('research') ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm">Title includes relevant healthcare keywords</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${!meta.no_index ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm">Content is set to be indexed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}