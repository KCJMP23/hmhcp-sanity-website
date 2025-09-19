'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Bot, Save, Eye, AlertTriangle, FileText } from 'lucide-react'

interface RobotsEditorProps {
  onSave?: () => void
}

export function RobotsEditor({ onSave }: RobotsEditorProps) {
  const [content, setContent] = useState('')
  const [testMode, setTestMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [preview, setPreview] = useState('')
  const { toast } = useToast()
  
  useEffect(() => {
    loadConfig()
  }, [])
  
  const loadConfig = async () => {
    try {
      const response = await fetch('/api/cms/robots', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to load configuration')
      
      const { data } = await response.json()
      setContent(data.content)
      setTestMode(data.testMode || false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load robots.txt configuration',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/cms/robots', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content,
          testMode,
          isActive: true
        })
      })
      
      if (!response.ok) throw new Error('Failed to save configuration')
      
      toast({
        title: 'Success',
        description: 'Robots.txt configuration saved successfully',
      })
      
      if (onSave) onSave()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handlePreview = async () => {
    try {
      const response = await fetch('/api/cms/robots/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content,
          testMode
        })
      })
      
      if (!response.ok) throw new Error('Failed to generate preview')
      
      const { data } = await response.json()
      setPreview(data.content)
      
      if (data.warning) {
        toast({
          title: 'Warning',
          description: data.warning,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate preview',
        variant: 'destructive'
      })
    }
  }
  
  const addTemplate = (template: string) => {
    const templates: Record<string, string> = {
      'block-bot': '\n# Block specific bot\nUser-agent: BotName\nDisallow: /\n',
      'slow-crawler': '\n# Slow down crawler\nUser-agent: CrawlerName\nCrawl-delay: 10\n',
      'allow-specific': '\n# Allow specific paths\nUser-agent: *\nAllow: /public/\nDisallow: /private/\n',
      'sitemap': '\n# Sitemap references\nSitemap: /sitemap.xml\nSitemap: /sitemap-news.xml\n'
    }
    
    setContent(prev => prev + templates[template])
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">Loading configuration...</div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Robots.txt Editor
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="test-mode" className="text-sm">Test Mode</Label>
                <Switch
                  id="test-mode"
                  checked={testMode}
                  onCheckedChange={setTestMode}
                />
              </div>
              {testMode && (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  All Crawlers Blocked
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="robots-content">Robots.txt Content</Label>
            <Textarea
              id="robots-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-mono text-sm min-h-[400px] mt-2"
              placeholder="User-agent: *&#10;Allow: /&#10;Disallow: /admin/"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => addTemplate('block-bot')}
            >
              Add Block Bot Rule
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addTemplate('slow-crawler')}
            >
              Add Crawl Delay
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addTemplate('allow-specific')}
            >
              Add Allow/Disallow
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addTemplate('sitemap')}
            >
              Add Sitemap
            </Button>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Robots.txt Guidelines
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Each rule must start with User-agent:</li>
              <li>• Use * for all bots, or specify bot names</li>
              <li>• Allow: permits access, Disallow: blocks access</li>
              <li>• Crawl-delay: slows down bot crawling (in seconds)</li>
              <li>• Test mode blocks all crawlers (use for development)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* Preview */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 dark:bg-gray-800 p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {preview}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handlePreview}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  )
}