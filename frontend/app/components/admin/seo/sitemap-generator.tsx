'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Map,
  Download,
  RefreshCw,
  Globe,
  Calendar,
  Activity,
  CheckCircle
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import type { SitemapEntry } from '@/lib/seo/seo-manager'

export function SitemapGenerator() {
  const [generating, setGenerating] = useState(false)
  const [entries, setEntries] = useState<SitemapEntry[]>([])
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)

  const generateSitemap = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/seo/sitemap/generate', {
        method: 'POST'
      })

      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries)
        setLastGenerated(new Date())
        toast({
          title: 'Success',
          description: `Sitemap generated with ${data.entries.length} entries`
        })
      } else {
        throw new Error('Failed to generate sitemap')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate sitemap',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  const downloadSitemap = async () => {
    try {
      const res = await fetch('/api/admin/seo/sitemap/download')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'sitemap.xml'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download sitemap',
        variant: 'destructive'
      })
    }
  }

  const getChangefreqColor = (freq: string) => {
    switch (freq) {
      case 'always':
      case 'hourly':
        return 'bg-red-100 text-red-700'
      case 'daily':
        return 'bg-blue-100 text-blue-700'
      case 'weekly':
        return 'bg-green-100 text-green-700'
      case 'monthly':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 0.8) return 'text-green-600'
    if (priority >= 0.5) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Map className="h-5 w-5" />
              XML Sitemap
            </h3>
            <p className="text-gray-600 mt-1">
              Generate and manage your XML sitemap for search engines
            </p>
            {lastGenerated && (
              <p className="text-sm text-gray-500 mt-2">
                Last generated: {lastGenerated.toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadSitemap}
              disabled={entries.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={generateSitemap} disabled={generating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>

        {entries.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Total URLs</p>
                    <p className="text-2xl font-bold text-blue-700">{entries.length}</p>
                  </div>
                  <Globe className="h-8 w-8 text-blue-500" />
                </div>
              </Card>

              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">High Priority</p>
                    <p className="text-2xl font-bold text-green-700">
                      {entries.filter(e => (e.priority || 0) >= 0.8).length}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </Card>

              <Card className="p-4 bg-purple-50 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Daily Updates</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {entries.filter(e => e.changefreq === 'daily').length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </Card>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="w-full overflow-x-auto"><table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">URL</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Change Frequency</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Priority</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Last Modified</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.slice(0, 10).map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">{entry.url}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getChangefreqColor(entry.changefreq || 'monthly')}>
                          {entry.changefreq || 'monthly'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${getPriorityColor(entry.priority || 0.5)}`}>
                          {entry.priority || 0.5}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {entry.lastmod ? new Date(entry.lastmod).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
              {entries.length > 10 && (
                <div className="px-4 py-3 bg-gray-50 border-t text-center">
                  <p className="text-sm text-gray-600">
                    Showing 10 of {entries.length} entries
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sitemap Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-full">
            <div>
              <p className="font-medium">Auto-submit to Search Engines</p>
              <p className="text-sm text-gray-600">Automatically ping search engines when sitemap is updated</p>
            </div>
            <Badge>Coming Soon</Badge>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-full">
            <div>
              <p className="font-medium">Include Images</p>
              <p className="text-sm text-gray-600">Add image information to sitemap entries</p>
            </div>
            <Badge>Coming Soon</Badge>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-full">
            <div>
              <p className="font-medium">Multi-language Support</p>
              <p className="text-sm text-gray-600">Generate hreflang tags for international SEO</p>
            </div>
            <Badge>Coming Soon</Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}