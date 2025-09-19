'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BasicSEOTab } from './basic-seo'
import { SocialMediaTab } from './social-media'
import { TechnicalTab } from './technical'
import { PreviewTab } from './preview'
import { useSEOManagement } from './hooks'
import { SEOMetaTagsProps } from './types'
import { cn } from '@/lib/utils'

export function SEOMetaTags({ data, onChange, previewUrl, className }: SEOMetaTagsProps) {
  const hooks = useSEOManagement({ data, onChange })

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic SEO</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="mt-6">
          <BasicSEOTab data={data} previewUrl={previewUrl} hooks={hooks} />
        </TabsContent>
        
        <TabsContent value="social" className="mt-6">
          <SocialMediaTab data={data} hooks={hooks} />
        </TabsContent>
        
        <TabsContent value="technical" className="mt-6">
          <TechnicalTab data={data} hooks={hooks} />
        </TabsContent>
        
        <TabsContent value="preview" className="mt-6">
          <PreviewTab data={data} previewUrl={previewUrl} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Export individual components for potential reuse
export { BasicSEOTab } from './basic-seo'
export { SocialMediaTab } from './social-media'
export { TechnicalTab } from './technical'
export { PreviewTab } from './preview'
export { useSEOManagement } from './hooks'

// Export types
export type { SEOMetaData, SEOMetaTagsProps, SEOHooksReturn } from './types'