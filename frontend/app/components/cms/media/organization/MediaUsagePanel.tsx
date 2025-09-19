'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, FileText, Eye, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface MediaUsage {
  id: string
  content_type: string
  content_title: string
  content_id: string
  usage_context: string
  used_at: string
  updated_at: string
  status: string
  created_by_name?: string
}

interface MediaUsagePanelProps {
  mediaId: string
  filename: string
  className?: string
}

export function MediaUsagePanel({ mediaId, filename, className }: MediaUsagePanelProps) {
  const [usage, setUsage] = useState<MediaUsage[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (mediaId) {
      loadUsage()
    }
  }, [mediaId])

  const loadUsage = async () => {
    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch(`/api/cms/media/${mediaId}/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load usage data')

      const result = await response.json()
      setUsage(result.data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load media usage data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'cms_pages':
        return <FileText className="w-4 h-4" />
      case 'blog_posts':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getContentTypeLabel = (contentType: string) => {
    switch (contentType) {
      case 'cms_pages':
        return 'CMS Page'
      case 'blog_posts':
        return 'Blog Post'
      default:
        return contentType.replace('_', ' ').toUpperCase()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const viewContent = (contentType: string, contentId: string) => {
    let url = ''
    
    switch (contentType) {
      case 'cms_pages':
        url = `/admin/cms/content/edit/${contentId}`
        break
      case 'blog_posts':
        url = `/admin/cms/content/edit/${contentId}`
        break
      default:
        return
    }

    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Media Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Media Usage
            <Badge variant="secondary">{usage.length}</Badge>
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {usage.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Usage Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This media file is not currently used in any content.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              You can safely delete this file if it's no longer needed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This file is used in {usage.length} piece{usage.length !== 1 ? 's' : ''} of content:
            </div>

            <div className="space-y-3">
              {usage.map((item, index) => (
                <div 
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getContentTypeIcon(item.content_type)}
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {getContentTypeLabel(item.content_type)}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={getStatusColor(item.status)}
                        >
                          {item.status}
                        </Badge>
                      </div>

                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 truncate">
                        {item.content_title}
                      </h4>

                      {item.usage_context && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Context: {item.usage_context}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Used: {formatDate(item.used_at)}
                        </div>
                        {item.created_by_name && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.created_by_name}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewContent(item.content_type, item.content_id)}
                      className="ml-4"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Replacement Warning
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This file is actively used in content. If you replace or delete it, 
                    all references will be affected. Use the "Replace" feature to safely 
                    update this file while maintaining all existing references.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}