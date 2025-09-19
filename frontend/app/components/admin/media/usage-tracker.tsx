'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Globe, 
  Mail, 
  Calendar,
  ExternalLink,
  AlertCircle,
  Users,
  BarChart3,
  Eye
} from 'lucide-react'

interface UsageLocation {
  id: string
  media_id: string
  entity_type: 'blog_post' | 'page' | 'email_campaign' | 'event' | 'user_profile' | 'social_media'
  entity_id: string
  field_name: string
  used_at: string
  used_by: string
  entity_details?: {
    title?: string
    status?: string
    url?: string
    author?: string
    published_at?: string
    view_count?: number
  }
}

interface UsageTrackerProps {
  mediaId: string
  onNavigate?: (entityType: string, entityId: string) => void
}

export function UsageTracker({ mediaId, onNavigate }: UsageTrackerProps) {
  const [usageData, setUsageData] = useState<UsageLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState('all')

  useEffect(() => {
    fetchUsageData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId])

  const fetchUsageData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/media/${mediaId}/usage`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage data')
      }

      const data = await response.json()
      setUsageData(data.usage_locations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const removeUsage = async (usageId: string) => {
    try {
      const response = await fetch(`/api/admin/media/${mediaId}/usage`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usage_id: usageId })
      })

      if (!response.ok) {
        throw new Error('Failed to remove usage')
      }

      // Refresh usage data
      await fetchUsageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove usage')
    }
  }

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'blog_post': return <FileText className="h-4 w-4" />
      case 'page': return <Globe className="h-4 w-4" />
      case 'email_campaign': return <Mail className="h-4 w-4" />
      case 'event': return <Calendar className="h-4 w-4" />
      case 'user_profile': return <Users className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const filteredUsage = selectedTab === 'all' 
    ? usageData 
    : usageData.filter(u => u.entity_type === selectedTab)

  const usageStats = {
    total: usageData.length,
    byType: usageData.reduce((acc, item) => {
      acc[item.entity_type] = (acc[item.entity_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    totalViews: usageData.reduce((sum, item) => 
      sum + (item.entity_details?.view_count || 0), 0
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">{usageStats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Content Types</p>
                <p className="text-2xl font-bold">{Object.keys(usageStats.byType).length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{usageStats.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Locations */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Locations</CardTitle>
          <CardDescription>
            Track where this media asset is being used across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All ({usageStats.total})
              </TabsTrigger>
              {Object.entries(usageStats.byType).map(([type, count]) => (
                <TabsTrigger key={type} value={type}>
                  {type.replace(/_/g, ' ')} ({count})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedTab}>
              {filteredUsage.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No usage found for this media asset
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsage.map((usage) => (
                    <div 
                      key={usage.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getEntityIcon(usage.entity_type)}
                            <span className="font-medium">
                              {usage.entity_details?.title || `${usage.entity_type} #${usage.entity_id}`}
                            </span>
                            {usage.entity_details?.status && (
                              <Badge className={getStatusColor(usage.entity_details.status)}>
                                {usage.entity_details.status}
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Field: <span className="font-medium">{usage.field_name}</span></p>
                            {usage.entity_details?.author && (
                              <p>Author: {usage.entity_details.author}</p>
                            )}
                            {usage.entity_details?.published_at && (
                              <p>Published: {new Date(usage.entity_details.published_at).toLocaleDateString()}</p>
                            )}
                            {usage.entity_details?.view_count !== undefined && (
                              <p>Views: {usage.entity_details.view_count.toLocaleString()}</p>
                            )}
                            <p>Added: {new Date(usage.used_at).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {usage.entity_details?.url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(usage.entity_details!.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          {onNavigate && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onNavigate(usage.entity_type, usage.entity_id)}
                            >
                              View
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeUsage(usage.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}