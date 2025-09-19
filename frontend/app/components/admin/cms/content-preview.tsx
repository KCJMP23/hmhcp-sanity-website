'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye, 
  Monitor, 
  Smartphone, 
  Tablet,
  ExternalLink,
  Code,
  Globe
} from 'lucide-react'
import { BaseContentItem } from '@/lib/types/cms-types'

interface ContentPreviewProps {
  content: BaseContentItem
}

export function ContentPreview({ content }: ContentPreviewProps) {
  const renderHomepageHeroPreview = () => {
    const heroData = content.content
    return (
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-lg">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">{heroData?.headline || 'Hero Headline'}</h1>
          <p className="text-xl opacity-90">{heroData?.subheadline || 'Hero Subheadline'}</p>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            {heroData?.description || 'Hero description text will appear here'}
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold">
              {heroData?.primary_cta?.text || 'Primary CTA'}
            </button>
            {heroData?.secondary_cta && (
              <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold">
                {heroData.secondary_cta.text}
              </button>
            )}
          </div>
        </div>
        {heroData?.background_image && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20 rounded-lg"
            style={{ backgroundImage: `url(${heroData.background_image})` }}
          />
        )}
      </div>
    )
  }

  const renderCROShowcasePreview = () => {
    const cardData = content.content
    const isLight = cardData?.theme === 'light'
    
    return (
      <div className={`p-8 rounded-xl ${
        isLight 
          ? 'bg-white text-gray-900 shadow-lg' 
          : 'bg-gray-900 text-white shadow-xl'
      }`}>
        {/* Icon placeholder */}
        <div className="mb-6">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
            isLight ? 'bg-blue-100' : 'bg-blue-800'
          }`}>
            <span className="text-2xl">🎯</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-3xl font-light">
            {cardData?.title || content.title}
          </h3>
          <p className={`text-lg font-medium ${
            isLight ? 'text-gray-600' : 'text-gray-300'
          }`}>
            {cardData?.subtitle || 'Card subtitle'}
          </p>
          <p className={`leading-relaxed ${
            isLight ? 'text-gray-600' : 'text-gray-300'
          }`}>
            {cardData?.description || 'Card description will appear here'}
          </p>
          
          <div className="flex gap-4 pt-4">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">
              {cardData?.primary_button?.text || 'Primary Action'}
            </button>
            {cardData?.secondary_button && (
              <button className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg">
                {cardData.secondary_button.text}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderBlogPostPreview = () => {
    const blogData = content.content
    return (
      <article className="bg-white rounded-lg shadow-lg overflow-hidden">
        {blogData?.featured_image && (
          <div className="w-full h-48 bg-gray-200">
            <img 
              src={blogData.featured_image}
              alt="Featured"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">{content.title}</h1>
          {blogData?.excerpt && (
            <p className="text-gray-600 mb-4 italic">
              {blogData.excerpt}
            </p>
          )}
          <div className="prose max-w-none">
            {blogData?.body ? (
              <div dangerouslySetInnerHTML={{ __html: blogData.body }} />
            ) : (
              <p className="text-gray-500">Blog content will appear here...</p>
            )}
          </div>
          {blogData?.tags && blogData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {blogData.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </article>
    )
  }

  const renderDefaultPreview = () => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{content.title}</h2>
        <div className="bg-gray-50 rounded p-4">
          <pre className="text-sm overflow-auto whitespace-pre-wrap">
            {JSON.stringify(content.content, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  const renderPreview = () => {
    switch (content.type) {
      case 'homepage-hero':
        return renderHomepageHeroPreview()
      case 'cro-showcase':
        return renderCROShowcasePreview()
      case 'blog-post':
        return renderBlogPostPreview()
      default:
        return renderDefaultPreview()
    }
  }

  const deviceFrameStyle = {
    desktop: 'w-full',
    tablet: 'w-3/4 mx-auto',
    mobile: 'w-1/3 mx-auto min-w-80'
  }

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Content Preview</h3>
          <p className="text-muted-foreground">
            Preview of "{content.title}" ({content.type})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
            {content.status}
          </Badge>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>

      {/* Device Preview Tabs */}
      <Tabs defaultValue="desktop" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="desktop" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Desktop
          </TabsTrigger>
          <TabsTrigger value="tablet" className="flex items-center gap-2">
            <Tablet className="w-4 h-4" />
            Tablet
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Mobile
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Code
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="desktop">
            <div className="border rounded-lg p-6 bg-gray-50 min-h-96">
              <div className={deviceFrameStyle.desktop}>
                {renderPreview()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tablet">
            <div className="border rounded-lg p-6 bg-gray-50 min-h-96">
              <div className={deviceFrameStyle.tablet}>
                {renderPreview()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mobile">
            <div className="border rounded-lg p-6 bg-gray-50 min-h-96">
              <div className={deviceFrameStyle.mobile}>
                {renderPreview()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Content Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(content, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* SEO Preview */}
      {content.meta && (content.meta.seo_title || content.meta.seo_description) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              SEO Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Google Search Result Preview */}
              <div className="border rounded-lg p-4 bg-white">
                <h4 className="text-sm font-medium mb-3 text-gray-600">Google Search Results</h4>
                <div className="space-y-1">
                  <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                    {content.meta.seo_title || content.title}
                  </div>
                  <div className="text-green-700 text-sm">
                    https://hmhealthcarepartners.com/{content.slug}
                  </div>
                  <div className="text-gray-600 text-sm max-w-xl">
                    {content.meta.seo_description || 'No meta description set'}
                  </div>
                </div>
              </div>

              {/* Social Media Preview */}
              {content.meta.og_image && (
                <div className="border rounded-lg p-4 bg-white">
                  <h4 className="text-sm font-medium mb-3 text-gray-600">Social Media Preview</h4>
                  <div className="border rounded-lg overflow-hidden max-w-md">
                    <div className="w-full h-32 bg-gray-200">
                      <img 
                        src={content.meta.og_image}
                        alt="OG Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400">Image not found</div>'
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <div className="font-medium text-sm line-clamp-1">
                        {content.meta.seo_title || content.title}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {content.meta.seo_description || 'No description'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        hmhealthcarepartners.com
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}