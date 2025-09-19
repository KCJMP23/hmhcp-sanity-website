'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { 
  PanelLeftClose, 
  PanelRightClose,
  Columns,
  Save,
  Eye,
  Edit3,
  Settings,
  Layout
} from 'lucide-react'
import { LexicalEditor } from '../editor/LexicalEditor'
import { ContentPreview } from './ContentPreview'
import { SEOEditor } from '../seo/SEOEditor'
import { MediaPicker } from '../media/MediaPicker'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useCMSValidation } from '@/hooks/useCMSValidation'
import type { CMSPage } from '@/types/cms-content'
import type { SEOData } from '@/lib/seo/seo-service'

// Extended interface for editor functionality
interface EditorCMSPage extends CMSPage {
  categoryId?: string;
  tags?: string[];
  publishedAt?: string;
  seo?: Record<string, any>;
}

interface ContentEditorWithPreviewProps {
  initialContent?: Partial<EditorCMSPage>
  onSave: (content: Partial<EditorCMSPage>) => Promise<void>
  onCancel?: () => void
  mode?: 'create' | 'edit'
  disabled?: boolean
  pageId?: string
}

type ViewMode = 'editor' | 'preview' | 'split'

export function ContentEditorWithPreview({
  initialContent,
  onSave,
  onCancel,
  mode = 'create',
  disabled = false,
  pageId
}: ContentEditorWithPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [activeTab, setActiveTab] = useState('content')
  const [content, setContent] = useState<Partial<EditorCMSPage>>(initialContent || {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft',
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
      openGraphImage: ''
    }
  })

  const { validate, errors, hasErrors, getFieldError } = useCMSValidation<EditorCMSPage>({
    rules: [
      {
        field: 'title',
        message: 'Title is required',
        validate: (value) => typeof value === 'string' && value.trim().length > 0
      },
      {
        field: 'slug',
        message: 'Slug is required',
        validate: (value) => typeof value === 'string' && value.trim().length > 0
      }
    ]
  })
  const { 
    saveStatus, 
    metadata, 
    triggerSave 
  } = useAutoSave({
    data: content,
    contentType: 'page',
    onSave: async (data) => {
      if (!hasErrors) {
        await onSave(data)
        return { version: Date.now(), lastModified: new Date().toISOString() }
      }
      return { version: Date.now(), lastModified: new Date().toISOString() }
    },
    enabled: mode === 'edit'
  })

  // Generate slug from title
  useEffect(() => {
    if (mode === 'create' && content.title && !content.slug) {
      const slug = content.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setContent(prev => ({ ...prev, slug }))
    }
  }, [content.title, content.slug, mode])

  const handleContentChange = useCallback((field: keyof CMSPage, value: any) => {
    setContent(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleEditorChange = useCallback((editorContent: any) => {
    handleContentChange('content', editorContent)
  }, [handleContentChange])

  const handleSEOChange = useCallback((updates: Partial<CMSPage>) => {
    setContent(prev => ({ 
      ...prev,
      ...updates
    }))
  }, [])

  const handleManualSave = async () => {
    const validationResult = validate(content)
    if (validationResult) {
      await onSave(content)
    }
  }

  const previewContent = {
    title: content.title || 'Untitled',
    slug: content.slug || 'untitled',
    excerpt: content.excerpt,
    content: content.content,
    featuredImage: undefined, // No featured image field in CMSPage
    status: content.status || 'draft',
    author: { name: 'Current User' }, // You'd get from auth context
    category: content.categoryId ? { name: 'Category Name', slug: 'category' } : undefined,
    tags: content.tags || [], 
    publishedAt: content.publishedAt?.toString(),
    updated_at: content.updated_at?.toString()
  }

  const seoMetadata = {
    metaTitle: content.seo?.metaTitle,
    metaDescription: content.seo?.metaDescription,
    ogImage: content.seo?.openGraphImage
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              {mode === 'create' ? 'Create Content' : 'Edit Content'}
            </h1>
            {disabled && (
              <span className="text-sm text-blue-600">
                Acquire a lock to enable editing
              </span>
            )}
            {!disabled && saveStatus === 'saving' && (
              <span className="text-sm text-muted-foreground">Saving...</span>
            )}
            {!disabled && saveStatus === 'saved' && metadata.lastSaved && (
              <span className="text-sm text-muted-foreground">
                Saved {new Date(metadata.lastSaved).toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border p-1">
              <Button
                variant={viewMode === 'editor' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('editor')}
                className="gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Editor
              </Button>
              <Button
                variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('split')}
                className="gap-2"
              >
                <Columns className="w-4 h-4" />
                Split
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('preview')}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
            </div>
            
            {/* Actions */}
            {mode === 'edit' && pageId && (
              <Link href={`/admin/cms/content/builder?pageId=${pageId}`}>
                <Button variant="outline" className="gap-2">
                  <Layout className="w-4 h-4" />
                  Page Builder
                </Button>
              </Link>
            )}
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button 
              onClick={handleManualSave}
              disabled={hasErrors || saveStatus === 'saving' || disabled}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className={cn(
          'h-full grid transition-all duration-300',
          viewMode === 'editor' && 'grid-cols-1',
          viewMode === 'preview' && 'grid-cols-1',
          viewMode === 'split' && 'grid-cols-2 gap-4'
        )}>
          {/* Editor Panel */}
          {viewMode !== 'preview' && (
            <div className="h-full overflow-hidden">
              <Card className="h-full">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <div className="border-b px-4">
                    <TabsList className="h-12 bg-transparent">
                      <TabsTrigger value="content" className="gap-2">
                        <Edit3 className="w-4 h-4" />
                        Content
                      </TabsTrigger>
                      <TabsTrigger value="seo" className="gap-2">
                        <Settings className="w-4 h-4" />
                        SEO
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="content" className="flex-1 p-6 overflow-auto">
                    <div className="space-y-6 max-w-4xl mx-auto">
                      {/* Title */}
                      <div>
                        <input
                          type="text"
                          value={content.title || ''}
                          onChange={(e) => handleContentChange('title', e.target.value)}
                          placeholder="Enter title..."
                          disabled={disabled}
                          className="w-full text-4xl font-bold border-0 outline-none focus:ring-0 bg-transparent placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {getFieldError('title') && (
                          <p className="text-sm text-red-500 mt-1">{getFieldError('title')}</p>
                        )}
                      </div>
                      
                      {/* Slug */}
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/</span>
                          <input
                            type="text"
                            value={content.slug || ''}
                            onChange={(e) => handleContentChange('slug', e.target.value)}
                            placeholder="url-slug"
                            disabled={disabled}
                            className="border-0 outline-none focus:ring-0 bg-transparent placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        {getFieldError('slug') && (
                          <p className="text-sm text-red-500 mt-1">{getFieldError('slug')}</p>
                        )}
                      </div>
                      
                      {/* Excerpt */}
                      <div>
                        <textarea
                          value={content.excerpt || ''}
                          onChange={(e) => handleContentChange('excerpt', e.target.value)}
                          placeholder="Brief description (optional)..."
                          rows={2}
                          disabled={disabled}
                          className="w-full resize-none border-0 outline-none focus:ring-0 bg-transparent placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      
                      {/* Note: Featured Image functionality disabled - not in CMSPage schema */}
                      
                      {/* Rich Text Editor */}
                      <div className="border-t pt-6">
                        <LexicalEditor
                          value={content.content || ''}
                          onChange={handleEditorChange}
                          placeholder="Start writing your content..."
                          readOnly={disabled}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="seo" className="flex-1 p-6 overflow-auto">
                    <div className="max-w-4xl mx-auto">
                      <SEOEditor
                        page={content as CMSPage}
                        onChange={handleSEOChange}
                        disabled={disabled}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          )}
          
          {/* Preview Panel */}
          {viewMode !== 'editor' && (
            <div className="h-full overflow-hidden">
              <ContentPreview
                content={previewContent}
                seoMetadata={seoMetadata}
                onRefresh={() => triggerSave()}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}