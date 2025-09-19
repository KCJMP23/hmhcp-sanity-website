'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { 
  Save, 
  Eye, 
  Sparkles, 
  Code, 
  Image, 
  Link, 
  Type, 
  Palette,
  Settings,
  Globe,
  Search,
  Shield,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { BaseContentItem } from '@/lib/types/cms-types'
import { RichTextEditor } from './rich-text-editor'
import { AIContentGenerator } from './ai-content-generator'
import { MediaSelector } from './media-selector'
import { SEOFields } from './seo-fields'

interface ContentEditorProps {
  content?: BaseContentItem | null
  onSave: (content: BaseContentItem) => void
  onCancel: () => void
}

export function ContentEditor({ content, onSave, onCancel }: ContentEditorProps) {
  const [formData, setFormData] = useState<Partial<BaseContentItem>>({
    type: 'homepage-hero',
    slug: '',
    title: '',
    status: 'draft',
    content: {},
    meta: {}
  })
  const [loading, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [showAIGenerator, setShowAIGenerator] = useState(false)

  const contentTypes = [
    { value: 'homepage-hero', label: 'Homepage Hero', description: 'Main homepage hero section' },
    { value: 'cro-showcase', label: 'CRO Showcase Card', description: 'Apple-style showcase card' },
    { value: 'phone-showcase', label: 'Phone Screen', description: 'Interactive phone screen content' },
    { value: 'platform-page', label: 'Platform Page', description: 'Platform detail page' },
    { value: 'service-page', label: 'Service Page', description: 'Service description page' },
    { value: 'research-page', label: 'Research Page', description: 'Research and publications' },
    { value: 'blog-post', label: 'Blog Post', description: 'Blog article or post' },
    { value: 'navigation', label: 'Navigation Menu', description: 'Site navigation' },
    { value: 'footer', label: 'Footer Content', description: 'Footer section' }
  ]

  useEffect(() => {
    if (content) {
      setFormData({
        ...content,
        meta: content.meta || {}
      })
    }
  }, [content])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleContentChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value
      }
    }))
  }

  const handleMetaChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      meta: {
        ...prev.meta,
        [field]: value
      }
    }))
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (title: string) => {
    handleInputChange('title', title)
    if (!content) {
      // Auto-generate slug for new content
      const slug = generateSlug(title)
      handleInputChange('slug', slug)
    }
  }

  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
      toast({
        title: 'Validation Error',
        description: 'Title and slug are required.',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)
    try {
      const url = content 
        ? `/api/admin/cms/content/${content.id}`
        : '/api/admin/cms/content'
      
      const method = content ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to save content')
      }

      const savedContent = await response.json()
      onSave(savedContent)

    } catch (error) {
      console.error('Failed to save content:', error)
      toast({
        title: 'Error',
        description: 'Failed to save content. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const renderContentFields = () => {
    switch (formData.type) {
      case 'homepage-hero':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={formData.content?.headline || ''}
                onChange={(e) => handleContentChange('headline', e.target.value)}
                placeholder="Enter hero headline..."
              />
            </div>
            <div>
              <Label htmlFor="subheadline">Subheadline</Label>
              <Input
                id="subheadline"
                value={formData.content?.subheadline || ''}
                onChange={(e) => handleContentChange('subheadline', e.target.value)}
                placeholder="Enter hero subheadline..."
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.content?.description || ''}
                onChange={(e) => handleContentChange('description', e.target.value)}
                placeholder="Enter hero description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary_cta_text">Primary CTA Text</Label>
                <Input
                  id="primary_cta_text"
                  value={formData.content?.primary_cta?.text || ''}
                  onChange={(e) => handleContentChange('primary_cta', {
                    ...formData.content?.primary_cta,
                    text: e.target.value
                  })}
                  placeholder="Get Started"
                />
              </div>
              <div>
                <Label htmlFor="primary_cta_href">Primary CTA Link</Label>
                <Input
                  id="primary_cta_href"
                  value={formData.content?.primary_cta?.href || ''}
                  onChange={(e) => handleContentChange('primary_cta', {
                    ...formData.content?.primary_cta,
                    href: e.target.value
                  })}
                  placeholder="/contact"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="background_image">Background Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="background_image"
                  value={formData.content?.background_image || ''}
                  onChange={(e) => handleContentChange('background_image', e.target.value)}
                  placeholder="/hero-background.jpg"
                />
                <Button variant="outline" size="sm">
                  <Image className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )

      case 'cro-showcase':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={formData.content?.subtitle || ''}
                onChange={(e) => handleContentChange('subtitle', e.target.value)}
                placeholder="Enter card subtitle..."
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.content?.description || ''}
                onChange={(e) => handleContentChange('description', e.target.value)}
                placeholder="Enter card description..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="icon">Icon (Lucide Icon Name)</Label>
              <Input
                id="icon"
                value={formData.content?.icon || ''}
                onChange={(e) => handleContentChange('icon', e.target.value)}
                placeholder="Award"
              />
            </div>
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select 
                value={formData.content?.theme || 'light'} 
                onValueChange={(value) => handleContentChange('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary_button_text">Primary Button Text</Label>
                <Input
                  id="primary_button_text"
                  value={formData.content?.primary_button?.text || ''}
                  onChange={(e) => handleContentChange('primary_button', {
                    ...formData.content?.primary_button,
                    text: e.target.value
                  })}
                  placeholder="Learn More"
                />
              </div>
              <div>
                <Label htmlFor="primary_button_href">Primary Button Link</Label>
                <Input
                  id="primary_button_href"
                  value={formData.content?.primary_button?.href || ''}
                  onChange={(e) => handleContentChange('primary_button', {
                    ...formData.content?.primary_button,
                    href: e.target.value
                  })}
                  placeholder="/services"
                />
              </div>
            </div>
          </div>
        )

      case 'blog-post':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.content?.excerpt || ''}
                onChange={(e) => handleContentChange('excerpt', e.target.value)}
                placeholder="Brief summary of the blog post..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="featured_image">Featured Image</Label>
              <div className="flex gap-2">
                <Input
                  id="featured_image"
                  value={formData.content?.featured_image || ''}
                  onChange={(e) => handleContentChange('featured_image', e.target.value)}
                  placeholder="/blog-featured-image.jpg"
                />
                <Button variant="outline" size="sm">
                  <Image className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="content_body">Content</Label>
              <RichTextEditor
                value={formData.content?.body || ''}
                onChange={(value) => handleContentChange('body', value)}
                placeholder="Write your blog post content here..."
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.content?.tags?.join(', ') || ''}
                onChange={(e) => handleContentChange('tags', e.target.value.split(',').map(tag => tag.trim()))}
                placeholder="healthcare, AI, clinical research"
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="json_content">Content (JSON)</Label>
              <Textarea
                id="json_content"
                value={JSON.stringify(formData.content || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    handleInputChange('content', parsed)
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                placeholder="Enter content as JSON..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Badge variant="outline">{formData.type}</Badge>
          <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
            {formData.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAIGenerator(true)}
            disabled={loading}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 h-full overflow-y-auto">
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Content Details
                  </CardTitle>
                  <CardDescription>
                    Edit the main content for this item
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title || ''}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter content title..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug || ''}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="content-slug"
                      required
                    />
                  </div>
                  <Separator />
                  {renderContentFields()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Content Settings
                  </CardTitle>
                  <CardDescription>
                    Configure content type and publication settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="type">Content Type</Label>
                    <Select 
                      value={formData.type || 'homepage-hero'} 
                      onValueChange={(value) => handleInputChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {contentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status || 'draft'} 
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <SEOFields
                meta={formData.meta || {}}
                onChange={handleMetaChange}
              />
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Content Preview
                  </CardTitle>
                  <CardDescription>
                    Preview how this content will appear
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-6">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(formData, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* AI Generator Dialog */}
      {showAIGenerator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <AIContentGenerator
              contentType={formData.type || 'homepage-hero'}
              currentContent={formData.content}
              onGenerate={(generatedContent) => {
                handleInputChange('content', generatedContent.content)
                setShowAIGenerator(false)
                toast({
                  title: 'Success',
                  description: 'Content generated successfully'
                })
              }}
              onCancel={() => setShowAIGenerator(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}