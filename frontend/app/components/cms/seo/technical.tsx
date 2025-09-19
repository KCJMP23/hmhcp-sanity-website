'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check } from 'lucide-react'
import { SEOMetaTagsProps, SEOHooksReturn } from './types'

interface TechnicalProps {
  data: SEOMetaTagsProps['data']
  hooks: Pick<SEOHooksReturn, 'copiedField' | 'addCustomMeta' | 'updateCustomMeta' | 'removeCustomMeta' | 'copyToClipboard' | 'generateMetaTags'>
}

export function TechnicalTab({ data, hooks }: TechnicalProps) {
  const { copiedField, addCustomMeta, updateCustomMeta, removeCustomMeta, copyToClipboard, generateMetaTags } = hooks

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-medium mb-4">Custom Meta Tags</h3>
        <div className="space-y-4">
          {data.customMeta?.map((meta, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Name"
                value={meta.name}
                onChange={(e) => updateCustomMeta(index, 'name', e.target.value)}
              />
              <Input
                placeholder="Content"
                value={meta.content}
                onChange={(e) => updateCustomMeta(index, 'content', e.target.value)}
              />
              <Input
                placeholder="Property (optional)"
                value={meta.property || ''}
                onChange={(e) => updateCustomMeta(index, 'property', e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeCustomMeta(index)}
              >
                ×
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addCustomMeta}>
            Add Custom Meta Tag
          </Button>
        </div>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-medium mb-4">Generated Meta Tags</h3>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => copyToClipboard(generateMetaTags(), 'meta-tags')}
          >
            {copiedField === 'meta-tags' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <pre className="text-sm whitespace-pre-wrap overflow-x-hidden">
            {generateMetaTags() || 'No meta tags configured'}
          </pre>
        </div>
      </Card>
    </div>
  )
}