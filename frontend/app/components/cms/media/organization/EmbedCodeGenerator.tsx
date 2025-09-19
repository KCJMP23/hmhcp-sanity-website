'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Download, Link, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface MediaFile {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  width?: number
  height?: number
  title?: string
  alt_text?: string
  description?: string
}

interface EmbedCodeGeneratorProps {
  file: MediaFile
  onClose?: () => void
}

type EmbedFormat = 'html' | 'markdown' | 'bbcode' | 'direct' | 'srcset' | 'json'

const EMBED_TEMPLATES = {
  html: {
    name: 'HTML',
    icon: Code,
    template: (file: MediaFile, url: string, options: any) => {
      if (file.mime_type.startsWith('image/')) {
        return `<img src="${url}" alt="${options.alt || file.alt_text || file.original_name}" ${
          options.width ? `width="${options.width}"` : ''
        } ${options.height ? `height="${options.height}"` : ''} />`
      } else if (file.mime_type.startsWith('video/')) {
        return `<video controls ${options.width ? `width="${options.width}"` : ''} ${
          options.height ? `height="${options.height}"` : ''
        }>\n  <source src="${url}" type="${file.mime_type}">\n  Your browser does not support the video tag.\n</video>`
      } else {
        return `<a href="${url}" download="${file.original_name}">${options.linkText || file.original_name}</a>`
      }
    }
  },
  markdown: {
    name: 'Markdown',
    icon: Code,
    template: (file: MediaFile, url: string, options: any) => {
      if (file.mime_type.startsWith('image/')) {
        return `![${options.alt || file.alt_text || file.original_name}](${url})`
      } else {
        return `[${options.linkText || file.original_name}](${url})`
      }
    }
  },
  bbcode: {
    name: 'BBCode',
    icon: Code,
    template: (file: MediaFile, url: string, options: any) => {
      if (file.mime_type.startsWith('image/')) {
        return `[img]${url}[/img]`
      } else {
        return `[url=${url}]${options.linkText || file.original_name}[/url]`
      }
    }
  },
  direct: {
    name: 'Direct URL',
    icon: Link,
    template: (file: MediaFile, url: string) => url
  },
  srcset: {
    name: 'Responsive Image',
    icon: Code,
    template: (file: MediaFile, url: string, options: any) => {
      const baseUrl = url.replace(/\.[^/.]+$/, '')
      const ext = url.split('.').pop()
      return `<img src="${url}" 
  srcset="${baseUrl}-400w.${ext} 400w, 
          ${baseUrl}-800w.${ext} 800w, 
          ${baseUrl}-1200w.${ext} 1200w" 
  sizes="(max-width: 400px) 100vw, (max-width: 800px) 50vw, 33vw"
  alt="${options.alt || file.alt_text || file.original_name}" />`
    }
  },
  json: {
    name: 'JSON Metadata',
    icon: Code,
    template: (file: MediaFile, url: string) => {
      return JSON.stringify({
        id: file.id,
        filename: file.filename,
        original_name: file.original_name,
        url: url,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        width: file.width,
        height: file.height,
        title: file.title,
        alt_text: file.alt_text,
        description: file.description
      }, null, 2)
    }
  }
}

export function EmbedCodeGenerator({ file, onClose }: EmbedCodeGeneratorProps) {
  const [format, setFormat] = useState<EmbedFormat>('html')
  const [url, setUrl] = useState('')
  const [options, setOptions] = useState({
    alt: file.alt_text || '',
    width: '',
    height: '',
    linkText: file.original_name
  })
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadFileUrl()
  }, [file.id])

  const loadFileUrl = async () => {
    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch(`/api/cms/media/${file.id}/url`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to get file URL')

      const result = await response.json()
      setUrl(result.url || '')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate file URL',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const generateEmbedCode = () => {
    if (!url) return ''
    const template = EMBED_TEMPLATES[format]
    return template.template(file, url, options)
  }

  const copyToClipboard = async () => {
    const code = generateEmbedCode()
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      
      toast({
        title: 'Copied!',
        description: 'Embed code copied to clipboard'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      })
    }
  }

  const downloadFile = () => {
    if (!url) return
    
    const link = document.createElement('a')
    link.href = url
    link.download = file.original_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Download Started',
      description: `Downloading ${file.original_name}`
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const embedCode = generateEmbedCode()

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Embed & Share
          </span>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Info */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4">
          <div className="flex items-start gap-4">
            {file.mime_type.startsWith('image/') && url && (
              <img
                src={url}
                alt={file.alt_text || file.original_name}
                className="w-20 h-20 object-cover border"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{file.original_name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {file.mime_type} • {formatFileSize(file.size_bytes)}
                {file.width && file.height && ` • ${file.width}×${file.height}`}
              </p>
              {file.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {file.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Embed Format</label>
          <Select value={format} onValueChange={(value: EmbedFormat) => setFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EMBED_TEMPLATES).map(([key, template]) => (
                <SelectItem key={key} value={key}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Options */}
        {(format === 'html' || format === 'markdown' || format === 'srcset') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Alt Text</label>
              <Input
                value={options.alt}
                onChange={(e) => setOptions({ ...options, alt: e.target.value })}
                placeholder="Alternative text"
              />
            </div>
            {format === 'html' && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Width</label>
                  <Input
                    value={options.width}
                    onChange={(e) => setOptions({ ...options, width: e.target.value })}
                    placeholder="Width (optional)"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Height</label>
                  <Input
                    value={options.height}
                    onChange={(e) => setOptions({ ...options, height: e.target.value })}
                    placeholder="Height (optional)"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Link Text for non-images */}
        {!file.mime_type.startsWith('image/') && (format === 'html' || format === 'markdown' || format === 'bbcode') && (
          <div>
            <label className="text-sm font-medium mb-2 block">Link Text</label>
            <Input
              value={options.linkText}
              onChange={(e) => setOptions({ ...options, linkText: e.target.value })}
              placeholder="Link text"
            />
          </div>
        )}

        {/* Generated Code */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Generated Code</label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={downloadFile}
                disabled={loading || !url}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                size="sm"
                onClick={copyToClipboard}
                disabled={loading || !embedCode}
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
          
          <Textarea
            value={loading ? 'Loading...' : embedCode}
            readOnly
            className="font-mono text-sm"
            rows={Math.min(embedCode.split('\n').length + 1, 10)}
          />
        </div>

        {/* Direct URL */}
        {url && (
          <div>
            <label className="text-sm font-medium mb-2 block">Direct URL</label>
            <div className="flex gap-2">
              <Input
                value={url}
                readOnly
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(url)
                  toast({ title: 'URL copied to clipboard' })
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}