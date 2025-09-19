/**
 * Activity Feed Widget with Virtual Scrolling
 * Efficiently renders large activity feeds using virtual scrolling
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  User, 
  FileText, 
  Settings, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Filter,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ActivityFeedItem } from '@/types/dashboard'
import useSWR from 'swr'

// Virtual scrolling configuration
const ITEM_HEIGHT = 80 // Height of each activity item in pixels
const BUFFER_SIZE = 5 // Number of items to render outside viewport
const VIEWPORT_HEIGHT = 400 // Height of the scrollable area

interface VirtualScrollState {
  startIndex: number
  endIndex: number
  scrollTop: number
  totalHeight: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function ActivityFeedWidgetVirtual() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<string>('all')
  const [virtualState, setVirtualState] = useState<VirtualScrollState>({
    startIndex: 0,
    endIndex: 10,
    scrollTop: 0,
    totalHeight: 0
  })

  // Fetch activity data
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/dashboard/activity-feed?filter=${filter}`,
    fetcher,
    { 
      refreshInterval: 30000,
      revalidateOnFocus: false 
    }
  )

  const activities: ActivityFeedItem[] = data?.items || []
  const hasMore = data?.hasMore || false

  // Calculate virtual scrolling parameters
  useEffect(() => {
    if (activities.length > 0) {
      setVirtualState(prev => ({
        ...prev,
        totalHeight: activities.length * ITEM_HEIGHT
      }))
    }
  }, [activities.length])

  // Handle scroll event with virtual scrolling
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return

    const scrollTop = scrollRef.current.scrollTop
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE)
    const endIndex = Math.min(
      activities.length,
      Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ITEM_HEIGHT) + BUFFER_SIZE
    )

    setVirtualState(prev => ({
      ...prev,
      startIndex,
      endIndex,
      scrollTop
    }))

    // Load more when near bottom
    if (
      hasMore &&
      scrollTop + VIEWPORT_HEIGHT >= virtualState.totalHeight - ITEM_HEIGHT * 2
    ) {
      loadMore()
    }
  }, [activities.length, hasMore, virtualState.totalHeight])

  // Load more activities
  const loadMore = async () => {
    const nextPage = Math.floor(activities.length / 20) + 1
    const response = await fetch(
      `/api/admin/dashboard/activity-feed?filter=${filter}&page=${nextPage}`
    )
    const newData = await response.json()
    
    // Append new items to existing data
    mutate({
      ...data,
      items: [...activities, ...newData.items],
      hasMore: newData.hasMore
    }, false)
  }

  // Get icon for activity type
  const getActivityIcon = (resourceType: string, severity: string) => {
    if (severity === 'error' || severity === 'critical') return <XCircle className="h-4 w-4 text-red-500" />
    if (severity === 'warning') return <AlertCircle className="h-4 w-4 text-yellow-500" />
    if (severity === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />
    
    switch (resourceType) {
      case 'content': return <FileText className="h-4 w-4 text-blue-500" />
      case 'user': return <User className="h-4 w-4 text-purple-500" />
      case 'workflow': return <Activity className="h-4 w-4 text-orange-500" />
      case 'system': return <Settings className="h-4 w-4 text-gray-500" />
      default: return <Info className="h-4 w-4 text-gray-400" />
    }
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
      case 'critical': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'success': return 'border-green-200 bg-green-50'
      default: return 'border-gray-200 bg-white'
    }
  }

  // Calculate visible items
  const visibleItems = activities.slice(virtualState.startIndex, virtualState.endIndex)
  const offsetY = virtualState.startIndex * ITEM_HEIGHT

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">Activity Feed</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            disabled={isLoading}
            aria-label="Refresh activity feed"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Filter activities"
          >
            <Filter className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        {isLoading && activities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading activities...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-500">Failed to load activities</div>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">No recent activity</div>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="overflow-auto px-4"
            style={{ height: VIEWPORT_HEIGHT }}
            onScroll={handleScroll}
            role="log"
            aria-label="Activity feed with virtual scrolling"
            aria-live="polite"
            aria-relevant="additions"
          >
            {/* Virtual scrolling container */}
            <div style={{ height: virtualState.totalHeight, position: 'relative' }}>
              {/* Visible items */}
              <div
                style={{
                  transform: `translateY(${offsetY}px)`,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0
                }}
              >
                {visibleItems.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-3 p-3 mb-2 rounded-lg border transition-colors hover:bg-gray-50 ${getSeverityColor(activity.severity)}`}
                    style={{ height: ITEM_HEIGHT }}
                    data-testid="activity-item"
                    data-resource-type={activity.resourceType}
                    role="article"
                    aria-label={`Activity: ${activity.action} by ${activity.userName || 'System'}`}
                  >
                    <div className="mt-1">
                      {getActivityIcon(activity.resourceType, activity.severity)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-medium text-sm truncate"
                          data-testid="activity-user"
                        >
                          {activity.userName || 'System'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {activity.resourceType}
                        </Badge>
                      </div>
                      
                      <p 
                        className="text-sm text-muted-foreground truncate"
                        data-testid="activity-action"
                      >
                        {activity.action}
                      </p>
                      
                      {activity.resourceName && (
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.resourceName}
                        </p>
                      )}
                    </div>
                    
                    <div 
                      className="text-xs text-muted-foreground whitespace-nowrap"
                      data-testid="activity-time"
                    >
                      <time dateTime={activity.timestamp}>
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Loading indicator for more items */}
            {hasMore && (
              <div className="text-center py-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  disabled={isLoading}
                  aria-label="Load more activities"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Virtual scroll indicator */}
        <div className="px-4 py-2 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            Showing {virtualState.startIndex + 1}-{Math.min(virtualState.endIndex, activities.length)} of {activities.length} activities
            {hasMore && ' (more available)'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}