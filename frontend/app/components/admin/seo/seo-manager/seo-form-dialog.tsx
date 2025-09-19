'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SEOAnalysis, SEOFormData } from './types'
import { OG_TYPES, TWITTER_CARD_TYPES, ROBOTS_OPTIONS } from './types'

interface SEOFormDialogProps {
  isOpen: boolean
  onClose: () => void
  editingItem: SEOAnalysis | null
  formData: Partial<SEOFormData>
  onFormDataChange: (data: Partial<SEOFormData>) => void
  contentPages: any[]
  onSave: () => void
}

export function SEOFormDialog({
  isOpen,
  onClose,
  editingItem,
  formData,
  onFormDataChange,
  contentPages,
  onSave
}: SEOFormDialogProps) {
  const updateFormData = (key: keyof SEOFormData, value: any) => {
    onFormDataChange({
      ...formData,
      [key]: value
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-text">
            {editingItem ? 'Edit SEO Settings' : 'Add SEO Settings'}
          </DialogTitle>
          <DialogDescription>
            Configure SEO metadata and social media previews for optimal search engine visibility
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-lg">
            <TabsTrigger value="basic" className="rounded-md">Basic SEO</TabsTrigger>
            <TabsTrigger value="social" className="rounded-md">Social Media</TabsTrigger>
            <TabsTrigger value="technical" className="rounded-md">Technical</TabsTrigger>
            <TabsTrigger value="preview" className="rounded-md">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="content_id">Content Page</Label>
                <Select 
                  value={formData.content_id} 
                  onValueChange={(value) => updateFormData('content_id', value)}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select content page" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentPages.map(page => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title} ({page.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title || ''}
                  onChange={(e) => updateFormData('meta_title', e.target.value)}
                  placeholder="Enter meta title (50-60 characters recommended)"
                  className="rounded-lg"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.meta_title?.length || 0}/60 characters
                </div>
              </div>
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description || ''}
                  onChange={(e) => updateFormData('meta_description', e.target.value)}
                  placeholder="Enter meta description (150-160 characters recommended)"
                  className="rounded-lg"
                  rows={3}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.meta_description?.length || 0}/160 characters
                </div>
              </div>
              <div>
                <Label htmlFor="meta_keywords">Meta Keywords</Label>
                <Input
                  id="meta_keywords"
                  value={formData.meta_keywords?.join(', ') || ''}
                  onChange={(e) => updateFormData('meta_keywords', 
                    e.target.value.split(',').map(k => k.trim()).filter(k => k)
                  )}
                  placeholder="Enter keywords separated by commas"
                  className="rounded-lg"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="font-text font-medium">Open Graph (Facebook, LinkedIn)</h3>
                <div>
                  <Label htmlFor="og_title">OG Title</Label>
                  <Input
                    id="og_title"
                    value={formData.og_title || ''}
                    onChange={(e) => updateFormData('og_title', e.target.value)}
                    placeholder="Open Graph title"
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="og_description">OG Description</Label>
                  <Textarea
                    id="og_description"
                    value={formData.og_description || ''}
                    onChange={(e) => updateFormData('og_description', e.target.value)}
                    placeholder="Open Graph description"
                    className="rounded-lg"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="og_image">OG Image URL</Label>
                  <Input
                    id="og_image"
                    value={formData.og_image || ''}
                    onChange={(e) => updateFormData('og_image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="og_type">OG Type</Label>
                  <Select 
                    value={formData.og_type} 
                    onValueChange={(value) => updateFormData('og_type', value)}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {OG_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-text font-medium">Twitter</h3>
                <div>
                  <Label htmlFor="twitter_card">Twitter Card Type</Label>
                  <Select 
                    value={formData.twitter_card} 
                    onValueChange={(value) => updateFormData('twitter_card', value)}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TWITTER_CARD_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="twitter_title">Twitter Title</Label>
                  <Input
                    id="twitter_title"
                    value={formData.twitter_title || ''}
                    onChange={(e) => updateFormData('twitter_title', e.target.value)}
                    placeholder="Twitter title"
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter_description">Twitter Description</Label>
                  <Textarea
                    id="twitter_description"
                    value={formData.twitter_description || ''}
                    onChange={(e) => updateFormData('twitter_description', e.target.value)}
                    placeholder="Twitter description"
                    className="rounded-lg"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="twitter_image">Twitter Image URL</Label>
                  <Input
                    id="twitter_image"
                    value={formData.twitter_image || ''}
                    onChange={(e) => updateFormData('twitter_image', e.target.value)}
                    placeholder="https://example.com/twitter-image.jpg"
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="canonical_url">Canonical URL</Label>
                <Input
                  id="canonical_url"
                  value={formData.canonical_url || ''}
                  onChange={(e) => updateFormData('canonical_url', e.target.value)}
                  placeholder="https://example.com/canonical-url"
                  className="rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="robots_meta">Robots Meta</Label>
                <Select 
                  value={formData.robots_meta} 
                  onValueChange={(value) => updateFormData('robots_meta', value)}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select robots directive" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROBOTS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="schema_markup">Schema Markup (JSON-LD)</Label>
                <Textarea
                  id="schema_markup"
                  value={formData.schema_markup ? JSON.stringify(formData.schema_markup, null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      updateFormData('schema_markup', parsed)
                    } catch {
                      // Invalid JSON, don't update
                    }
                  }}
                  placeholder='{"@context": "https://schema.org", "@type": "Article", "headline": "..."}'
                  className="rounded-lg font-mono text-sm"
                  rows={8}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-text font-medium mb-2">Google Search Preview</h3>
                <div className="border rounded-lg p-4 space-y-2 bg-white">
                  <div className="text-blue-600 text-lg font-medium line-clamp-1">
                    {formData.meta_title || 'Page Title'}
                  </div>
                  <div className="text-green-700 text-sm">
                    {formData.canonical_url || 'https://example.com/page'}
                  </div>
                  <div className="text-gray-600 text-sm line-clamp-2">
                    {formData.meta_description || 'Meta description will appear here...'}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-text font-medium mb-2">Facebook Preview</h3>
                <div className="border rounded-lg overflow-hidden bg-white">
                  {formData.og_image && (
                    <div className="aspect-video bg-gray-200 flex items-center justify-center">
                      <img 
                        src={formData.og_image} 
                        alt="OG Image" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3 space-y-1">
                    <div className="text-sm font-medium line-clamp-1">
                      {formData.og_title || formData.meta_title || 'Page Title'}
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2">
                      {formData.og_description || formData.meta_description || 'Description will appear here...'}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">
                      {formData.canonical_url || 'EXAMPLE.COM'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button 
            onClick={onSave}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
          >
            Save SEO Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}