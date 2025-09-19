'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CharacterCounter } from './CharacterCounter'
import type { CMSPage } from '@/types/cms-content'
import { Facebook, Twitter, Linkedin, Image } from 'lucide-react'

interface SocialMediaPreviewProps {
  page: CMSPage
  onChange: (updates: Partial<CMSPage>) => void
  disabled?: boolean
}

export function SocialMediaPreview({ page, onChange, disabled }: SocialMediaPreviewProps) {
  const [activeTab, setActiveTab] = useState('facebook')
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com'
  const pageUrl = `${baseUrl}/${page.slug || ''}`
  
  // Use OG values with fallbacks
  const ogTitle = page.seo?.openGraphTitle || page.seo?.metaTitle || page.title || 'Page Title'
  const ogDescription = page.seo?.openGraphDescription || page.seo?.metaDescription || 'Page description'
  const ogImage = page.seo?.openGraphImage || '/images/og-default.jpg'
  
  // Use Twitter values with OG fallbacks
  const twitterTitle = page.seo?.twitterTitle || ogTitle
  const twitterDescription = page.seo?.twitterDescription || ogDescription
  const twitterImage = page.seo?.twitterImage || ogImage
  
  return (
    <div className="space-y-6">
      {/* Open Graph Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="w-5 h-5" />
            Open Graph Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="og-title">OG Title</Label>
            <CharacterCounter
              value={page.seo?.openGraphTitle || ''}
              onChange={(value) => onChange({ 
                seo: {
                  ...page.seo,
                  openGraphTitle: value
                }
              })}
              maxLength={70}
              warningLength={60}
              placeholder="Leave blank to use SEO title"
              disabled={disabled}
            />
          </div>
          
          <div>
            <Label htmlFor="og-description">OG Description</Label>
            <CharacterCounter
              value={page.seo?.openGraphDescription || ''}
              onChange={(value) => onChange({ 
                seo: {
                  ...page.seo,
                  openGraphDescription: value
                }
              })}
              maxLength={200}
              warningLength={180}
              placeholder="Leave blank to use meta description"
              textarea
              disabled={disabled}
            />
          </div>
          
          <div>
            <Label htmlFor="og-image">OG Image URL</Label>
            <Input
              id="og-image"
              value={page.seo?.openGraphImage || ''}
              onChange={(e) => onChange({ 
                seo: {
                  ...page.seo,
                  openGraphImage: e.target.value
                }
              })}
              placeholder="https://example.com/image.jpg"
              disabled={disabled}
            />
            <p className="text-sm text-gray-500 mt-1">
              Recommended: 1200x630px, max 5MB
            </p>
          </div>
          
          <div>
            <Label htmlFor="og-type">OG Type</Label>
            <Select
              value={page.seo?.openGraphUrl || 'article'}
              onValueChange={(value) => onChange({ 
                seo: {
                  ...page.seo,
                  openGraphUrl: value
                }
              })}
              disabled={disabled}
            >
              <SelectTrigger id="og-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="profile">Profile</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Twitter Card Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="w-5 h-5" />
            Twitter Card Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="twitter-card">Card Type</Label>
            <Select
              value={page.seo?.twitterCard || 'summary_large_image'}
              onValueChange={(value) => onChange({ 
                seo: {
                  ...page.seo,
                  twitterCard: value as 'summary' | 'summary_large_image' | 'app' | 'player'
                }
              })}
              disabled={disabled}
            >
              <SelectTrigger id="twitter-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                <SelectItem value="app">App</SelectItem>
                <SelectItem value="player">Player</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="twitter-title">Twitter Title</Label>
            <CharacterCounter
              value={page.seo?.twitterTitle || ''}
              onChange={(value) => onChange({ 
                seo: {
                  ...page.seo,
                  twitterTitle: value
                }
              })}
              maxLength={70}
              warningLength={60}
              placeholder="Leave blank to use OG title"
              disabled={disabled}
            />
          </div>
          
          <div>
            <Label htmlFor="twitter-description">Twitter Description</Label>
            <CharacterCounter
              value={page.seo?.twitterDescription || ''}
              onChange={(value) => onChange({ 
                seo: {
                  ...page.seo,
                  twitterDescription: value
                }
              })}
              maxLength={200}
              warningLength={180}
              placeholder="Leave blank to use OG description"
              textarea
              disabled={disabled}
            />
          </div>
          
          <div>
            <Label htmlFor="twitter-image">Twitter Image URL</Label>
            <Input
              id="twitter-image"
              value={page.seo?.twitterImage || ''}
              onChange={(e) => onChange({ 
                seo: {
                  ...page.seo,
                  twitterImage: e.target.value
                }
              })}
              placeholder="Leave blank to use OG image"
              disabled={disabled}
            />
          </div>
          
          {/* Twitter site and creator fields removed as they're not in CMSPage type */}
        </CardContent>
      </Card>

      {/* Social Media Previews */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
              <TabsTrigger value="twitter">Twitter</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            </TabsList>

            <TabsContent value="facebook" className="mt-4">
              <div className="border overflow-hidden bg-white dark:bg-gray-800">
                {ogImage && (
                  <div className="aspect-[1.91/1] bg-gray-100 dark:bg-gray-700 relative">
                    <img
                      src={ogImage}
                      alt="OG Image Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/og-default.jpg'
                      }}
                    />
                  </div>
                )}
                <div className="p-3 bg-gray-50 dark:bg-gray-900">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    {new URL(pageUrl).hostname}
                  </div>
                  <h3 className="font-semibold text-[#1877f2] dark:text-[#4599ff] line-clamp-2 mt-1">
                    {ogTitle}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mt-1">
                    {ogDescription}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="twitter" className="mt-4">
              <div className="border overflow-hidden bg-white dark:bg-gray-800">
                {page.seo?.twitterCard === 'summary_large_image' && twitterImage && (
                  <div className="aspect-[2/1] bg-gray-100 dark:bg-gray-700 relative">
                    <img
                      src={twitterImage}
                      alt="Twitter Image Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/og-default.jpg'
                      }}
                    />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {twitterTitle}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                    {twitterDescription}
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {new URL(pageUrl).hostname}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="linkedin" className="mt-4">
              <div className="border overflow-hidden bg-white dark:bg-gray-800">
                {ogImage && (
                  <div className="aspect-[1.91/1] bg-gray-100 dark:bg-gray-700 relative">
                    <img
                      src={ogImage}
                      alt="LinkedIn Image Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/og-default.jpg'
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {ogTitle}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new URL(pageUrl).hostname}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}