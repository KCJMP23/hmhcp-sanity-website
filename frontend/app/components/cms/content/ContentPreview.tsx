'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  RefreshCw, 
  Maximize2,
  Eye,
  Code,
  Share2,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { logger } from '@/lib/logger';

interface ContentPreviewProps {
  content: {
    title: string
    slug: string
    excerpt?: string
    content: any // Lexical content
    featuredImage?: string
    status: string
    author?: {
      name: string
      avatar?: string
    }
    category?: {
      name: string
      slug: string
    }
    tags?: string[]
    publishedAt?: string
    updatedAt?: string
  }
  seoMetadata?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: string
  }
  onRefresh?: () => void
  className?: string
}

type DeviceSize = 'mobile' | 'tablet' | 'desktop' | 'responsive'

const DEVICE_SIZES = {
  mobile: { width: 375, height: 667, label: 'iPhone SE' },
  tablet: { width: 768, height: 1024, label: 'iPad' },
  desktop: { width: 1440, height: 900, label: 'Desktop' },
  responsive: { width: '100%', height: '100%', label: 'Responsive' }
}

export function ContentPreview({ 
  content, 
  seoMetadata,
  onRefresh,
  className 
}: ContentPreviewProps) {
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [htmlContent, setHtmlContent] = useState<string>('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  // Convert Lexical content to HTML
  useEffect(() => {
    const convertToHTML = async () => {
      try {
        // This is a simplified version - you'd use the actual Lexical conversion
        let html = '<article class="prose prose-lg dark:prose-invert max-w-none">'
        
        // Add title
        html += `<h1 class="text-4xl font-bold mb-4">${content.title}</h1>`
        
        // Add metadata
        html += '<div class="flex items-center gap-4 mb-8 text-sm text-gray-600 dark:text-gray-400">'
        if (content.author) {
          html += `<span>By ${content.author.name}</span>`
        }
        if (content.publishedAt) {
          html += `<span>•</span>`
          html += `<span>${format(new Date(content.publishedAt), 'MMM d, yyyy')}</span>`
        }
        if (content.category) {
          html += `<span>•</span>`
          html += `<span>${content.category.name}</span>`
        }
        html += '</div>'
        
        // Add featured image
        if (content.featuredImage) {
          html += `<img src="${content.featuredImage}" alt="${content.title}" class="w-full  mb-8" />`
        }
        
        // Add excerpt
        if (content.excerpt) {
          html += `<p class="text-xl text-gray-600 dark:text-gray-400 mb-8">${content.excerpt}</p>`
        }
        
        // Add content (simplified - you'd parse the Lexical JSON here)
        if (content.content?.root?.children) {
          content.content.root.children.forEach((node: any) => {
            if (node.type === 'paragraph') {
              html += '<p>'
              node.children?.forEach((child: any) => {
                if (child.type === 'text') {
                  let text = child.text
                  if (child.format & 1) text = `<strong>${text}</strong>` // Bold
                  if (child.format & 2) text = `<em>${text}</em>` // Italic
                  if (child.format & 8) text = `<u>${text}</u>` // Underline
                  html += text
                }
              })
              html += '</p>'
            } else if (node.type === 'heading') {
              const tag = `h${node.tag}`
              html += `<${tag}>${node.children?.[0]?.text || ''}</${tag}>`
            } else if (node.type === 'list') {
              const listTag = node.listType === 'bullet' ? 'ul' : 'ol'
              html += `<${listTag}>`
              node.children?.forEach((item: any) => {
                html += '<li>'
                item.children?.forEach((child: any) => {
                  if (child.text) html += child.text
                })
                html += '</li>'
              })
              html += `</${listTag}>`
            }
          })
        }
        
        // Add tags
        if (content.tags && content.tags.length > 0) {
          html += '<div class="mt-8 pt-8 border-t">'
          html += '<div class="flex items-center gap-2 flex-wrap">'
          html += '<span class="text-sm text-gray-600 dark:text-gray-400">Tags:</span>'
          content.tags.forEach(tag => {
            html += `<span class="px-3 py-1 bg-gray-100 dark:bg-gray-800  text-sm">${tag}</span>`
          })
          html += '</div>'
          html += '</div>'
        }
        
        html += '</article>'
        
        // Wrap in full HTML document with styles
        const fullHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${seoMetadata?.metaTitle ? `<title>${seoMetadata.metaTitle}</title>` : `<title>${content.title}</title>`}
            ${seoMetadata?.metaDescription ? `<meta name="description" content="${seoMetadata.metaDescription}">` : ''}
            ${seoMetadata?.ogImage ? `<meta property="og:image" content="${seoMetadata.ogImage}">` : ''}
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { padding: 2rem; font-family: system-ui, -apple-system, sans-serif; }
              @media (prefers-color-scheme: dark) {
                body { background: #111; color: #fff; }
              }
            </style>
          </head>
          <body>
            <div class="max-w-4xl mx-auto">
              ${html}
            </div>
          </body>
          </html>
        `
        
        setHtmlContent(fullHTML)
      } catch (error) {
        logger.error('Error converting content to HTML:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      }
    }
    
    convertToHTML()
  }, [content, seoMetadata])

  // Update iframe content
  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(htmlContent)
        doc.close()
      }
    }
  }, [htmlContent])

  const toggleFullscreen = () => {
    if (!isFullscreen && previewContainerRef.current) {
      previewContainerRef.current.requestFullscreen?.()
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }

  const handleExport = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${content.slug}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const deviceConfig = DEVICE_SIZES[deviceSize]

  return (
    <Card className={cn('h-full flex flex-col', className)} ref={previewContainerRef}>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview
            </CardTitle>
            <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
              {content.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={deviceSize} onValueChange={(v) => setDeviceSize(v as DeviceSize)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Mobile
                  </div>
                </SelectItem>
                <SelectItem value="tablet">
                  <div className="flex items-center gap-2">
                    <Tablet className="w-4 h-4" />
                    Tablet
                  </div>
                </SelectItem>
                <SelectItem value="desktop">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Desktop
                  </div>
                </SelectItem>
                <SelectItem value="responsive">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Responsive
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onRefresh}
              title="Refresh preview"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleExport}
              title="Export HTML"
            >
              <Download className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleFullscreen}
              title="Toggle fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {deviceSize !== 'responsive' && (
          <p className="text-sm text-muted-foreground mt-1">
            {deviceConfig.label} ({deviceConfig.width} × {deviceConfig.height}px)
          </p>
        )}
      </CardHeader>
      
      <Separator />
      
      <CardContent className="flex-1 p-0 overflow-hidden bg-gray-100 dark:bg-gray-900">
        <Tabs defaultValue="visual" className="h-full">
          <div className="border-b px-4">
            <TabsList className="h-9 bg-transparent">
              <TabsTrigger value="visual" className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="html" className="text-xs">
                <Code className="w-3 h-3 mr-1" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="mobile" className="text-xs">
                <Share2 className="w-3 h-3 mr-1" />
                Social
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="visual" className="h-full mt-0 p-4">
            <div className={cn(
              'mx-auto transition-all duration-300 h-full',
              deviceSize === 'responsive' ? 'w-full' : 'shadow-xl'
            )} style={{
              width: deviceSize === 'responsive' ? '100%' : `${deviceConfig.width}px`,
              maxHeight: deviceSize === 'responsive' ? '100%' : `${deviceConfig.height}px`
            }}>
              <iframe
                ref={iframeRef}
                className="w-full h-full bg-white dark:bg-gray-950"
                title="Content preview"
                sandbox="allow-same-origin"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="html" className="h-full mt-0 p-4">
            <div className="h-full overflow-auto">
              <pre className="text-xs bg-gray-900 text-gray-100 p-4">
                <code>{htmlContent}</code>
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="mobile" className="h-full mt-0 p-4">
            <div className="space-y-4">
              <div className="max-w-[500px] mx-auto">
                <h3 className="font-medium mb-2">Search Result Preview</h3>
                <div className="p-4 bg-white dark:bg-gray-900 border">
                  <div className="text-blue-600 dark:text-blue-400 text-xl">
                    {seoMetadata?.metaTitle || content.title}
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                    {process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/{content.slug}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {seoMetadata?.metaDescription || content.excerpt || 'No description available...'}
                  </div>
                </div>
              </div>
              
              <div className="max-w-[500px] mx-auto">
                <h3 className="font-medium mb-2">Social Media Preview</h3>
                <div className="border overflow-hidden">
                  {(seoMetadata?.ogImage || content.featuredImage) && (
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800">
                      <img 
                        src={seoMetadata?.ogImage || content.featuredImage} 
                        alt={content.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      {process.env.NEXT_PUBLIC_SITE_URL || 'example.com'}
                    </div>
                    <div className="font-medium mt-1">
                      {seoMetadata?.metaTitle || content.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {seoMetadata?.metaDescription || content.excerpt || 'No description available...'}
                    </div>
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