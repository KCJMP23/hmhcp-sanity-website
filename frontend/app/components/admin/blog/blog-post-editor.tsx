'use client'

import { useState, useEffect } from 'react'
import { X as XMarkIcon, Sparkles as SparklesIcon, Image as PhotoIcon } from 'lucide-react'
import { FileText, Settings, Search } from 'lucide-react'
import { BlogPost, BlogPostCreate, AIContentGenerationRequest } from '@/types/blog'
import ImageSelector from './image-selector'
import ImageGenerator from './image-generator'

interface BlogPostEditorProps {
  post?: BlogPost
  onSave: (post: Partial<BlogPost>) => void
  onCancel: () => void
}

export default function BlogPostEditor({ post, onSave, onCancel }: BlogPostEditorProps) {
  const [formData, setFormData] = useState<Partial<BlogPostCreate>>({
    title: post?.title || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    status: post?.status || 'draft',
    featuredImage: post?.featuredImage || '',
    tags: post?.tags || [],
    seo_title: '',
    seo_description: '',
    seo_keywords: []
  })

  const [showImageSelector, setShowImageSelector] = useState(false)
  const [showImageGenerator, setShowImageGenerator] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'seo'>('content')

  const handleInputChange = (field: keyof BlogPostCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTagChange = (tags: string) => {
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    handleInputChange('tags', tagArray)
  }

  const handleImageSelect = (imageUrl: string) => {
    handleInputChange('featured_image', imageUrl)
    setShowImageSelector(false)
  }

  const handleImageGenerate = (imageUrl: string) => {
    handleInputChange('featured_image', imageUrl)
    setShowImageGenerator(false)
  }

  const handleAIGenerate = async () => {
    if (!formData.title) {
      alert('Please enter a title first to generate content')
      return
    }

    setIsGenerating(true)
    try {
      const request: AIContentGenerationRequest = {
        id: Date.now().toString(),
        prompt: formData.title,
        contentType: 'blog',
        tone: 'professional',
        length: 'medium',
        keywords: formData.seo_keywords || [],
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      const response = await fetch('/api/admin/blog/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          content: data.content,
          excerpt: data.excerpt,
          seo_title: data.seo_title,
          seo_description: data.seo_description,
          tags: data.tags,
          seo_keywords: data.seo_keywords
        }))
      } else {
        console.error('Failed to generate content')
      }
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    if (!formData.title || !formData.content) {
      alert('Title and content are required')
      return
    }
    onSave(formData)
  }

  const tabs = [
    { id: 'content', name: 'Content', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', name: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'seo', name: 'SEO', icon: <Search className="w-4 h-4" /> }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {post ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Enter blog post title..."
                />
              </div>

              {/* AI Generation */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">AI Content Generation</h3>
                  <button
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !formData.title}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    <span>{isGenerating ? 'Generating...' : 'Generate Content'}</span>
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  Use AI to generate blog content, excerpt, SEO title, description, and tags based on your title.
                </p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent font-mono text-sm"
                  placeholder="Write your blog post content here..."
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Brief description of the post..."
                />
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image
                </label>
                <div className="flex items-center space-x-3">
                  {formData.featured_image && (
                    <div className="relative">
                      <img
                        src={formData.featured_image}
                        alt="Featured"
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                      <div className="hidden w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <PhotoIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowImageSelector(true)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Select Image
                    </button>
                    <button
                      onClick={() => setShowImageGenerator(true)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      <span>Generate</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => handleTagChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Enter tags separated by commas..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple tags with commas
                </p>
              </div>

              {/* Theme Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme Template
                </label>
                <select
                  value={formData.theme_template || 'default'}
                  onChange={(e) => handleInputChange('theme_template', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="default">Default</option>
                  <option value="featured">Featured</option>
                  <option value="minimal">Minimal</option>
                  <option value="magazine">Magazine</option>
                </select>
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              {/* SEO Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={formData.seo_title || ''}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="SEO optimized title..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.seo_title?.length || 0}/60 characters
                </p>
              </div>

              {/* SEO Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Description
                </label>
                <textarea
                  value={formData.seo_description || ''}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="SEO meta description..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.seo_description?.length || 0}/160 characters
                </p>
              </div>

              {/* SEO Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Keywords
                </label>
                <input
                  type="text"
                  value={formData.seo_keywords?.join(', ') || ''}
                  onChange={(e) => {
                    const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    handleInputChange('seo_keywords', keywords)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Enter keywords separated by commas..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple keywords with commas
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800"
          >
            {post ? 'Update Post' : 'Create Post'}
          </button>
        </div>
      </div>

      {/* Image Selector Modal */}
      {showImageSelector && (
        <ImageSelector
          onSelect={handleImageSelect}
          onClose={() => setShowImageSelector(false)}
        />
      )}

      {/* Image Generator Modal */}
      {showImageGenerator && (
        <ImageGenerator
          onGenerate={handleImageGenerate}
          onClose={() => setShowImageGenerator(false)}
        />
      )}
    </div>
  )
}

