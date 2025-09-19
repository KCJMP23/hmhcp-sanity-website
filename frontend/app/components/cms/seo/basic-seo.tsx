'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { SEOMetaTagsProps, SEOHooksReturn } from './types'

interface BasicSEOProps {
  data: SEOMetaTagsProps['data']
  previewUrl?: string
  hooks: Pick<SEOHooksReturn, 'keywordInput' | 'setKeywordInput' | 'updateField' | 'updateNestedField' | 'addKeyword' | 'removeKeyword'>
}

export function BasicSEOTab({ data, previewUrl, hooks }: BasicSEOProps) {
  const { keywordInput, setKeywordInput, updateField, updateNestedField, addKeyword, removeKeyword } = hooks

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-medium mb-4">Basic Meta Information</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={data.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Enter page title..."
              className="mt-1"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Recommended: 30-60 characters</span>
              <span className={data.title && data.title.length > 60 ? 'text-red-500' : ''}>
                {data.title?.length || 0}/60
              </span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Meta Description</Label>
            <Textarea
              id="description"
              value={data.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Enter meta description..."
              rows={3}
              className="mt-1"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Recommended: 120-160 characters</span>
              <span className={data.description && data.description.length > 160 ? 'text-red-500' : ''}>
                {data.description?.length || 0}/160
              </span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={data.slug || ''}
              onChange={(e) => updateField('slug', e.target.value)}
              placeholder="url-slug"
              className="mt-1"
            />
            {previewUrl && data.slug && (
              <p className="text-xs text-gray-500 mt-1">
                Preview: {previewUrl}/{data.slug}
              </p>
            )}
          </div>
          
          <div>
            <Label>Keywords</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="Add keyword..."
              />
              <Button type="button" onClick={addKeyword}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.keywords?.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeKeyword(index)}
                >
                  {keyword} ×
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="canonical">Canonical URL</Label>
            <Input
              id="canonical"
              value={data.canonicalUrl || ''}
              onChange={(e) => updateField('canonicalUrl', e.target.value)}
              placeholder="https://example.com/page"
              className="mt-1"
            />
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-medium mb-4">Robots Meta Tag</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={data.robots?.index ?? true}
              onCheckedChange={(checked) => updateNestedField('robots', 'index', checked)}
            />
            <Label>Allow indexing</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={data.robots?.follow ?? true}
              onCheckedChange={(checked) => updateNestedField('robots', 'follow', checked)}
            />
            <Label>Follow links</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={data.robots?.archive ?? true}
              onCheckedChange={(checked) => updateNestedField('robots', 'archive', checked)}
            />
            <Label>Allow archiving</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={data.robots?.snippet ?? true}
              onCheckedChange={(checked) => updateNestedField('robots', 'snippet', checked)}
            />
            <Label>Show snippets</Label>
          </div>
        </div>
      </Card>
    </div>
  )
}