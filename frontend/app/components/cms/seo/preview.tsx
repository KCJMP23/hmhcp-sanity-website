'use client'

import { Card } from '@/components/ui/card'
import { Search, Facebook, Twitter, Smartphone, ExternalLink } from 'lucide-react'
import { Image } from 'lucide-react'
import { SEOMetaTagsProps } from './types'

interface PreviewProps {
  data: SEOMetaTagsProps['data']
  previewUrl?: string
}

export function PreviewTab({ data, previewUrl }: PreviewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Google Search Preview */}
      <Card className="p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Google Search Preview
        </h3>
        <div className="border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <div className="text-blue-600 dark:text-blue-400 text-lg hover:underline cursor-pointer">
            {data.title || 'Page Title'}
          </div>
          <div className="text-blue-600 dark:text-blue-400 text-sm mt-1">
            {previewUrl && data.slug ? `${previewUrl}/${data.slug}` : 'https://example.com/page'}
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            {data.description || 'Meta description will appear here...'}
          </div>
        </div>
      </Card>
      
      {/* Facebook Preview */}
      <Card className="p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Facebook className="w-4 h-4" />
          Facebook Preview
        </h3>
        <div className="border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          {data.ogImage && (
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 uppercase">
              {previewUrl?.replace(/^https?:\/\//, '') || 'example.com'}
            </div>
            <div className="font-medium text-gray-900 dark:text-white mt-1">
              {data.ogTitle || data.title || 'Page Title'}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {data.ogDescription || data.description || 'Description will appear here...'}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Twitter Preview */}
      <Card className="p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Twitter className="w-4 h-4" />
          Twitter Preview
        </h3>
        <div className="border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          {data.twitterImage && (
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="p-4">
            <div className="font-medium text-gray-900 dark:text-white">
              {data.twitterTitle || data.title || 'Page Title'}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {data.twitterDescription || data.description || 'Description will appear here...'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {previewUrl?.replace(/^https?:\/\//, '') || 'example.com'}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Mobile Preview */}
      <Card className="p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Mobile Search Preview
        </h3>
        <div className="max-w-sm mx-auto border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <div className="text-blue-600 dark:text-blue-400 text-base hover:underline cursor-pointer">
            {data.title || 'Page Title'}
          </div>
          <div className="text-blue-600 dark:text-blue-400 text-xs mt-1">
            {previewUrl && data.slug ? `${previewUrl}/${data.slug}` : 'https://example.com/page'}
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            {data.description || 'Meta description will appear here...'}
          </div>
        </div>
      </Card>
    </div>
  )
}