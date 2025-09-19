'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, TrendingUp, Eye, Edit, Calendar } from 'lucide-react'

interface ContentMetrics {
  blog: {
    total: number
    published: number
    draft: number
    scheduled: number
    recentPosts: Array<{
      id: string
      title: string
      status: string
      created_at: string
      views: number
    }>
  }
  engagement: {
    totalViews: number
    avgViewsPerPost: number
  }
  aiContent: {
    generated: number
    enhanced: number
    optimized: number
  }
}

export function ContentMetricsWidget() {
  const [metrics, setMetrics] = useState<ContentMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/content-metrics')
        if (response.ok) {
          const data = await response.json()
          setMetrics(data)
        }
      } catch (error) {
        console.error('Failed to fetch content metrics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500 text-white">Published</Badge>
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-500 text-white">Scheduled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Content Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Content Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">{metrics?.blog.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total Posts</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics?.blog.published || 0}</div>
              <div className="text-sm text-muted-foreground">Published</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics?.blog.draft || 0}</div>
              <div className="text-sm text-muted-foreground">Drafts</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics?.blog.scheduled || 0}</div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Engagement
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Views</span>
                <span className="font-medium">
                  {metrics?.engagement.totalViews.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Avg. per Post</span>
                <span className="font-medium">
                  {metrics?.engagement.avgViewsPerPost || 0}
                </span>
              </div>
            </div>
          </div>

          {/* AI Content Stats */}
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2">AI Enhancement</div>
            <div className="flex gap-2">
              <Badge variant="outline">
                {metrics?.aiContent.generated || 0} Generated
              </Badge>
              <Badge variant="outline">
                {metrics?.aiContent.enhanced || 0} Enhanced
              </Badge>
              <Badge variant="outline">
                {metrics?.aiContent.optimized || 0} SEO
              </Badge>
            </div>
          </div>

          {/* Recent Posts */}
          {metrics?.blog.recentPosts && metrics.blog.recentPosts.length > 0 && (
            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2">Recent Posts</div>
              <div className="space-y-2">
                {metrics.blog.recentPosts.slice(0, 3).map((post) => (
                  <div key={post.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1 truncate pr-2">
                      <span className="hover:underline cursor-pointer">
                        {post.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.created_at)}
                      </span>
                      {getStatusBadge(post.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}