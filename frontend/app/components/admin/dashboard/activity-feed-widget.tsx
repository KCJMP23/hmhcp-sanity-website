'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRealtimeDashboard } from '@/hooks/use-realtime-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  User, 
  FileText, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash,
  Plus,
  Send,
  LogIn,
  LogOut,
  Workflow
} from 'lucide-react'

interface ActivityItem {
  id: string
  timestamp: string
  user: {
    id: string
    email: string
  }
  action: string
  resource: {
    type: string
    id: string
  }
  description: string
  status: string
  icon: string
  color: string
}

interface ActivityFeedData {
  activities: ActivityItem[]
  summary: any
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

export function ActivityFeedWidget() {
  const [feedData, setFeedData] = useState<ActivityFeedData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'content' | 'users' | 'system' | 'errors'>('all')
  const { latestActivity, isConnected } = useRealtimeDashboard()

  const fetchActivityFeed = async (filterType: string = 'all') => {
    try {
      const response = await fetch(`/api/admin/dashboard/activity-feed?filter=${filterType}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setFeedData(data)
      }
    } catch (error) {
      console.error('Failed to fetch activity feed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivityFeed(filter)
    // Remove polling since we have real-time updates
  }, [filter])

  // Handle real-time updates
  useEffect(() => {
    if (latestActivity && feedData) {
      // Add new activity to the feed
      const newActivity: ActivityItem = {
        id: latestActivity.id,
        timestamp: latestActivity.created_at,
        user: {
          id: '',
          email: latestActivity.user_email
        },
        action: latestActivity.action,
        resource: {
          type: latestActivity.resource_type,
          id: ''
        },
        description: `${latestActivity.user_email} ${latestActivity.action} on ${latestActivity.resource_type}`,
        status: latestActivity.status,
        icon: 'activity',
        color: 'blue'
      }
      
      setFeedData(prev => ({
        ...prev!,
        activities: [newActivity, ...prev!.activities.slice(0, 19)]
      }))
    }
  }, [latestActivity])

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'plus': Plus,
      'edit': Edit,
      'trash': Trash,
      'send': Send,
      'eye': Eye,
      'login': LogIn,
      'logout': LogOut,
      'workflow': Workflow,
      'user': User,
      'file-text': FileText,
      'settings': Settings,
      'activity': Activity
    }
    const Icon = iconMap[iconName] || Activity
    return <Icon className="h-4 w-4" />
  }

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      'green': 'text-green-600 bg-green-50',
      'red': 'text-red-600 bg-red-50',
      'yellow': 'text-yellow-600 bg-yellow-50',
      'blue': 'text-blue-600 bg-blue-50',
      'gray': 'text-gray-600 bg-gray-50'
    }
    return colorMap[color] || 'text-gray-600 bg-gray-50'
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
            {isConnected && (
              <Badge variant="outline" className="ml-2 text-xs">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Live
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            {(['all', 'content', 'users', 'system', 'errors'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(f)}
                className="text-xs"
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {feedData?.activities && feedData.activities.length > 0 ? (
              feedData.activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getColorClass(activity.color)}`}>
                    {getIcon(activity.icon)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user.email}</span>
                          {' '}
                          <span className="text-muted-foreground">
                            {activity.description}
                          </span>
                        </p>
                        {activity.resource.type && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.resource.type} • {activity.action}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(activity.timestamp)}
                        </span>
                        {activity.status !== 'success' && (
                          <Badge 
                            variant={activity.status === 'error' ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No activity to display
              </div>
            )}
          </div>
        </ScrollArea>
        
        {feedData?.pagination.hasMore && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Load more functionality would go here
                console.log('Load more activities')
              }}
            >
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}