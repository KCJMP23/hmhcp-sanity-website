'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Search,
  AlertCircle,
  CheckCircle,
  Edit3,
  Eye,
  EyeOff,
  Globe,
  Twitter,
  Facebook,
  Share
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import type { PageSEO } from '@/lib/seo/seo-manager'

interface PageSEOEditorProps {
  pageId?: string
  pagePath: string
  onSave?: () => void
}

export function PageSEOEditor({ pageId, pagePath, onSave }: PageSEOEditorProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seo, setSEO] = useState<PageSEO>({
    page_path: pagePath,
    meta_title: '',
    meta_description: '',
    meta_keywords: [],
    canonical_url: '',
    og_title: '',
    og_description: '',
    og_image: '',
    twitter_card: 'summary_large_image',
    no_index: false,
    no_follow: false,
    schema_markup: null
  })
  const [keywordInput, setKeywordInput] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)

  useEffect(() => {
    fetchPageSEO()
  }, [pagePath])

  const fetchPageSEO = async () => {
    try {
      const res = await fetch(`/api/admin/seo/pages/${encodeURIComponent(pagePath)}`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setSEO(data)
        }
      }
    } catch (error) {
      console.error('Error fetching page SEO:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/seo/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(seo)
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Page SEO settings saved successfully'
        })
        onSave?.()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save page SEO settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const analyzeSEO = async () => {
    try {
      const res = await fetch('/api/admin/seo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pagePath, seo })
      })

      if (res.ok) {
        const data = await res.json()
        setAnalysis(data)
      }
    } catch (error) {
      console.error('Error analyzing SEO:', error)
    }
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !seo.meta_keywords?.includes(keywordInput.trim())) {
      setSEO({
        ...seo,
        meta_keywords: [...(seo.meta_keywords || []), keywordInput.trim()]
      })
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setSEO({
      ...seo,
      meta_keywords: seo.meta_keywords?.filter(k => k !== keyword) || []
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-sm border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">SEO Settings</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={analyzeSEO}>
            <Search className="h-4 w-4 mr-2" />
            Analyze
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save SEO'}
          </Button>
        </div>
      </div>

      {analysis && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-md ${
              analysis.score > 70 ? 'bg-green-100' : 
              analysis.score > 50 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <span className="text-2xl font-bold">
                {analysis.score}
              </span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">SEO Analysis</h4>
              {analysis.issues.length > 0 && (
                <div className="space-y-1 mb-2">
                  {analysis.issues.map((issue: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {issue}
                    </div>
                  ))}
                </div>
              )}
              {analysis.warnings.length > 0 && (
                <div className="space-y-1 mb-2">
                  {analysis.warnings.map((warning: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      {warning}
                    </div>
                  ))}
                </div>
              )}
              {analysis.successes.length > 0 && (
                <div className="space-y-1">
                  {analysis.successes.map((success: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {success}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Search Engine
        </h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="meta_title">Meta Title</Label>
            <Input
              id="meta_title"
              value={seo.meta_title}
              onChange={(e) => setSEO({ ...seo, meta_title: e.target.value })}
              placeholder="Page title for search results"
              maxLength={60}
            />
            <p className="text-sm text-gray-600 mt-1">
              {seo.meta_title.length}/60 characters
            </p>
          </div>

          <div>
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              value={seo.meta_description}
              onChange={(e) => setSEO({ ...seo, meta_description: e.target.value })}
              placeholder="Brief description for search results"
              rows={3}
              maxLength={160}
            />
            <p className="text-sm text-gray-600 mt-1">
              {seo.meta_description.length}/160 characters
            </p>
          </div>

          <div>
            <Label>Keywords</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add keyword"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              />
              <Button onClick={addKeyword} variant="outline" size="sm">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {seo.meta_keywords?.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeKeyword(keyword)}
                >
                  {keyword} ×
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="canonical_url">Canonical URL</Label>
            <Input
              id="canonical_url"
              value={seo.canonical_url || ''}
              onChange={(e) => setSEO({ ...seo, canonical_url: e.target.value })}
              placeholder="https://yourdomain.com/page"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="no_index"
                checked={seo.no_index}
                onCheckedChange={(checked) => setSEO({ ...seo, no_index: checked })}
              />
              <Label htmlFor="no_index" className="cursor-pointer">
                No Index
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="no_follow"
                checked={seo.no_follow}
                onCheckedChange={(checked) => setSEO({ ...seo, no_follow: checked })}
              />
              <Label htmlFor="no_follow" className="cursor-pointer">
                No Follow
              </Label>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Share className="h-4 w-4" />
          Social Media
        </h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="og_title">Open Graph Title</Label>
            <Input
              id="og_title"
              value={seo.og_title || ''}
              onChange={(e) => setSEO({ ...seo, og_title: e.target.value })}
              placeholder="Title for social shares (defaults to meta title)"
            />
          </div>

          <div>
            <Label htmlFor="og_description">Open Graph Description</Label>
            <Textarea
              id="og_description"
              value={seo.og_description || ''}
              onChange={(e) => setSEO({ ...seo, og_description: e.target.value })}
              placeholder="Description for social shares (defaults to meta description)"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="og_image">Open Graph Image</Label>
            <Input
              id="og_image"
              value={seo.og_image || ''}
              onChange={(e) => setSEO({ ...seo, og_image: e.target.value })}
              placeholder="/images/page-share.jpg"
            />
            <p className="text-sm text-gray-600 mt-1">
              Recommended: 1200×630px
            </p>
          </div>

          <div>
            <Label htmlFor="twitter_card">Twitter Card Type</Label>
            <select
              id="twitter_card"
              value={seo.twitter_card}
              onChange={(e) => setSEO({ ...seo, twitter_card: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="summary">Summary</option>
              <option value="summary_large_image">Summary Large Image</option>
            </select>
          </div>
        </div>
      </Card>

      {showPreview && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Search Result Preview</h4>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-full">
              <h5 className="text-blue-700 text-lg hover:underline cursor-pointer">
                {seo.meta_title || 'Page Title'}
              </h5>
              <p className="text-green-700 text-sm">
                {window.location.origin}{pagePath}
              </p>
              <p className="text-gray-700 text-sm mt-1">
                {seo.meta_description || 'Page description will appear here...'}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-full">
              <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter Preview
              </h5>
              <div className="border rounded-lg overflow-hidden">
                {seo.og_image && (
                  <div className="aspect-video bg-gray-200" />
                )}
                <div className="p-3">
                  <h6 className="font-semibold">
                    {seo.og_title || seo.meta_title || 'Page Title'}
                  </h6>
                  <p className="text-sm text-gray-600 mt-1">
                    {seo.og_description || seo.meta_description || 'Description...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Button 
        variant="outline" 
        onClick={() => setShowPreview(!showPreview)}
        className="w-full"
      >
        {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
        {showPreview ? 'Hide Preview' : 'Show Preview'}
      </Button>
    </div>
  )
}