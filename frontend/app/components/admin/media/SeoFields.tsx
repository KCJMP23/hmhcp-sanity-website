'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface MediaSeoData {
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  og_title?: string
  og_description?: string
  twitter_title?: string
  twitter_description?: string
}

interface SeoFieldsProps {
  value: MediaSeoData
  editable?: boolean
  onChange?: (value: MediaSeoData) => void
}

export function SeoFields({ value, editable = false, onChange }: SeoFieldsProps) {
  const [local, setLocal] = useState<MediaSeoData>({})

  useEffect(() => {
    setLocal(value || {})
  }, [value])

  const set = (patch: Partial<MediaSeoData>) => {
    const next = { ...local, ...patch }
    setLocal(next)
    onChange?.(next)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">SEO</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>SEO Title</Label>
          {editable ? (
            <Input value={local.seo_title || ''} onChange={(e) => set({ seo_title: e.target.value })} />
          ) : (
            <p className="text-sm text-gray-900">{local.seo_title || <span className="text-gray-400 italic">Not set</span>}</p>
          )}
        </div>
        <div>
          <Label>SEO Description</Label>
          {editable ? (
            <Textarea value={local.seo_description || ''} onChange={(e) => set({ seo_description: e.target.value })} />
          ) : (
            <p className="text-sm text-gray-900">{local.seo_description || <span className="text-gray-400 italic">Not set</span>}</p>
          )}
        </div>
        <div>
          <Label>SEO Keywords (comma-separated)</Label>
          {editable ? (
            <Input
              value={(local.seo_keywords || []).join(', ')}
              onChange={(e) => set({ seo_keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })}
            />
          ) : (
            <div className="text-sm text-gray-900">
              {(local.seo_keywords || []).length ? (local.seo_keywords || []).join(', ') : <span className="text-gray-400 italic">None</span>}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>OG Title</Label>
            {editable ? (
              <Input value={local.og_title || ''} onChange={(e) => set({ og_title: e.target.value })} />
            ) : (
              <p className="text-sm text-gray-900">{local.og_title || <span className="text-gray-400 italic">Not set</span>}</p>
            )}
          </div>
          <div>
            <Label>OG Description</Label>
            {editable ? (
              <Input value={local.og_description || ''} onChange={(e) => set({ og_description: e.target.value })} />
            ) : (
              <p className="text-sm text-gray-900">{local.og_description || <span className="text-gray-400 italic">Not set</span>}</p>
            )}
          </div>
          <div>
            <Label>Twitter Title</Label>
            {editable ? (
              <Input value={local.twitter_title || ''} onChange={(e) => set({ twitter_title: e.target.value })} />
            ) : (
              <p className="text-sm text-gray-900">{local.twitter_title || <span className="text-gray-400 italic">Not set</span>}</p>
            )}
          </div>
          <div>
            <Label>Twitter Description</Label>
            {editable ? (
              <Input value={local.twitter_description || ''} onChange={(e) => set({ twitter_description: e.target.value })} />
            ) : (
              <p className="text-sm text-gray-900">{local.twitter_description || <span className="text-gray-400 italic">Not set</span>}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SeoFields


