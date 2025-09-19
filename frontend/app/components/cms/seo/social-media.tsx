'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Facebook, Twitter } from 'lucide-react'
import { SEOMetaTagsProps, SEOHooksReturn } from './types'

interface SocialMediaProps {
  data: SEOMetaTagsProps['data']
  hooks: Pick<SEOHooksReturn, 'updateField'>
}

export function SocialMediaTab({ data, hooks }: SocialMediaProps) {
  const { updateField } = hooks

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Facebook className="w-4 h-4" />
          Open Graph (Facebook)
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="ogTitle">OG Title</Label>
            <Input
              id="ogTitle"
              value={data.ogTitle || ''}
              onChange={(e) => updateField('ogTitle', e.target.value)}
              placeholder={data.title || 'Enter OG title...'}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="ogDescription">OG Description</Label>
            <Textarea
              id="ogDescription"
              value={data.ogDescription || ''}
              onChange={(e) => updateField('ogDescription', e.target.value)}
              placeholder={data.description || 'Enter OG description...'}
              rows={3}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="ogImage">OG Image URL</Label>
            <Input
              id="ogImage"
              value={data.ogImage || ''}
              onChange={(e) => updateField('ogImage', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ogType">OG Type</Label>
              <Input
                id="ogType"
                value={data.ogType || 'website'}
                onChange={(e) => updateField('ogType', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ogSiteName">Site Name</Label>
              <Input
                id="ogSiteName"
                value={data.ogSiteName || ''}
                onChange={(e) => updateField('ogSiteName', e.target.value)}
                placeholder="Your Site Name"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Twitter className="w-4 h-4" />
          Twitter Cards
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="twitterCard">Card Type</Label>
            <select
              id="twitterCard"
              value={data.twitterCard || 'summary'}
              onChange={(e) => updateField('twitterCard', e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="summary">Summary</option>
              <option value="summary_large_image">Summary Large Image</option>
              <option value="app">App</option>
              <option value="player">Player</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="twitterTitle">Twitter Title</Label>
            <Input
              id="twitterTitle"
              value={data.twitterTitle || ''}
              onChange={(e) => updateField('twitterTitle', e.target.value)}
              placeholder={data.title || 'Enter Twitter title...'}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="twitterDescription">Twitter Description</Label>
            <Textarea
              id="twitterDescription"
              value={data.twitterDescription || ''}
              onChange={(e) => updateField('twitterDescription', e.target.value)}
              placeholder={data.description || 'Enter Twitter description...'}
              rows={3}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="twitterImage">Twitter Image URL</Label>
            <Input
              id="twitterImage"
              value={data.twitterImage || ''}
              onChange={(e) => updateField('twitterImage', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="twitterSite">Twitter Site</Label>
              <Input
                id="twitterSite"
                value={data.twitterSite || ''}
                onChange={(e) => updateField('twitterSite', e.target.value)}
                placeholder="@yoursitehandle"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="twitterCreator">Twitter Creator</Label>
              <Input
                id="twitterCreator"
                value={data.twitterCreator || ''}
                onChange={(e) => updateField('twitterCreator', e.target.value)}
                placeholder="@authorhandle"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}