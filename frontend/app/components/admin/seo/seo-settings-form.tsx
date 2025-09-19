'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { 
  Save, 
  Globe, 
  FileText, 
  Search, 
  Share2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import type { SEOSettings } from '@/lib/seo/seo-manager'

export function SEOSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SEOSettings>({
    site_title: '',
    site_description: '',
    meta_keywords: [],
    robots_txt: '',
    google_analytics_id: '',
    google_site_verification: '',
    bing_site_verification: '',
    twitter_handle: '',
    facebook_app_id: '',
    default_og_image: ''
  })
  const [keywordInput, setKeywordInput] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/seo/settings')
      const data = await res.json()
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load SEO settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/seo/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'SEO settings saved successfully'
        })
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save SEO settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !settings.meta_keywords.includes(keywordInput.trim())) {
      setSettings({
        ...settings,
        meta_keywords: [...settings.meta_keywords, keywordInput.trim()]
      })
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setSettings({
      ...settings,
      meta_keywords: settings.meta_keywords.filter(k => k !== keyword)
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
        <div>
          <h2 className="text-2xl font-bold">SEO Settings</h2>
          <p className="text-gray-600 mt-1">Manage your site's search engine optimization</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="meta">
            <FileText className="h-4 w-4 mr-2" />
            Meta Tags
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-2" />
            Social Media
          </TabsTrigger>
          <TabsTrigger value="technical">
            <Search className="h-4 w-4 mr-2" />
            Technical
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">General Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="site_title">Site Title</Label>
                <Input
                  id="site_title"
                  value={settings.site_title}
                  onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                  placeholder="Your Healthcare Site"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Appears in browser tabs and search results
                </p>
              </div>

              <div>
                <Label htmlFor="site_description">Site Description</Label>
                <Textarea
                  id="site_description"
                  value={settings.site_description}
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                  placeholder="Brief description of your healthcare services"
                  rows={3}
                />
                <p className="text-sm text-gray-600 mt-1">
                  {settings.site_description.length}/160 characters
                </p>
              </div>

              <div>
                <Label htmlFor="default_og_image">Default Social Share Image</Label>
                <Input
                  id="default_og_image"
                  value={settings.default_og_image || ''}
                  onChange={(e) => setSettings({ ...settings, default_og_image: e.target.value })}
                  placeholder="/images/og-default.jpg"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Default image for social media shares (1200x630px recommended)
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="meta" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Meta Keywords</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Add a keyword"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button onClick={addKeyword} variant="outline">
                  Add
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {settings.meta_keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-3 py-1 cursor-pointer"
                    onClick={() => removeKeyword(keyword)}
                  >
                    {keyword} ×
                  </Badge>
                ))}
              </div>
              
              {settings.meta_keywords.length === 0 && (
                <p className="text-sm text-gray-500">No keywords added yet</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Social Media Integration</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="twitter_handle">Twitter/X Handle</Label>
                <Input
                  id="twitter_handle"
                  value={settings.twitter_handle || ''}
                  onChange={(e) => setSettings({ ...settings, twitter_handle: e.target.value })}
                  placeholder="@yourhealthcare"
                />
              </div>

              <div>
                <Label htmlFor="facebook_app_id">Facebook App ID</Label>
                <Input
                  id="facebook_app_id"
                  value={settings.facebook_app_id || ''}
                  onChange={(e) => setSettings({ ...settings, facebook_app_id: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Search Engine Verification</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                <Input
                  id="google_analytics_id"
                  value={settings.google_analytics_id || ''}
                  onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="google_site_verification">Google Site Verification</Label>
                <Input
                  id="google_site_verification"
                  value={settings.google_site_verification || ''}
                  onChange={(e) => setSettings({ ...settings, google_site_verification: e.target.value })}
                  placeholder="Verification code"
                />
              </div>

              <div>
                <Label htmlFor="bing_site_verification">Bing Site Verification</Label>
                <Input
                  id="bing_site_verification"
                  value={settings.bing_site_verification || ''}
                  onChange={(e) => setSettings({ ...settings, bing_site_verification: e.target.value })}
                  placeholder="Verification code"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Robots.txt</h3>
            <Textarea
              value={settings.robots_txt}
              onChange={(e) => setSettings({ ...settings, robots_txt: e.target.value })}
              rows={10}
              className="font-mono text-sm"
            />
            <div className="mt-4 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p className="text-sm text-gray-600">
                Be careful when editing robots.txt as it controls search engine access to your site
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}