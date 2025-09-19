'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Bell,
  Check,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Trash2,
  Archive,
  Clock,
  User,
  Package,
  FileText,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'system' | 'user' | 'content' | 'analytics'
  timestamp: Date
  read: boolean
  icon: React.ComponentType<{ className?: string }>
}

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

// Mock notification data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New User Registration',
    message: 'Dr. Sarah Johnson from Metropolitan Health has registered',
    type: 'info',
    category: 'user',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false,
    icon: User
  },
  {
    id: '2',
    title: 'Content Published',
    message: 'Blog post "AI in Healthcare" has been published successfully',
    type: 'success',
    category: 'content',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
    icon: FileText
  },
  {
    id: '3',
    title: 'High Traffic Alert',
    message: 'Website traffic has increased by 150% in the last hour',
    type: 'warning',
    category: 'analytics',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    read: true,
    icon: TrendingUp
  },
  {
    id: '4',
    title: 'System Update Available',
    message: 'Version 2.5.0 is now available with security improvements',
    type: 'info',
    category: 'system',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: true,
    icon: Package
  },
  {
    id: '5',
    title: 'Failed Login Attempts',
    message: 'Multiple failed login attempts detected from IP 192.168.1.1',
    type: 'error',
    category: 'system',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    read: false,
    icon: AlertTriangle
  }
]

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [selectedTab, setSelectedTab] = useState('all')
  const [notificationSettings, setNotificationSettings] = useState({
    system: true,
    user: true,
    content: true,
    analytics: true,
    email: false,
    push: true
  })

  // Filter notifications based on selected tab
  const filteredNotifications = notifications.filter(notification => {
    if (selectedTab === 'all') return true
    if (selectedTab === 'unread') return !notification.read
    return notification.category === selectedTab
  })

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  // Delete notification
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  // Clear all notifications
  const clearAll = () => {
    setNotifications([])
  }

  // Get icon based on notification type
  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return Info
      case 'success':
        return CheckCircle
      case 'warning':
        return AlertTriangle
      case 'error':
        return XCircle
    }
  }

  // Get badge variant based on type
  const getBadgeVariant = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return 'default' as const
      case 'success':
        return 'default' as const
      case 'warning':
        return 'secondary' as const
      case 'error':
        return 'destructive' as const
    }
  }

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 1000 / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} new
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Stay updated with system alerts and user activities
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={notifications.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="px-6">
          <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="user">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {filteredNotifications.length > 0 ? (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => {
                    const Icon = notification.icon
                    const TypeIcon = getTypeIcon(notification.type)

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4  border transition-colors cursor-pointer",
                          "hover:bg-accent",
                          !notification.read && "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="relative">
                              <Icon className="h-8 w-8 text-muted-foreground" />
                              <TypeIcon
                                className={cn(
                                  "h-4 w-4 absolute -bottom-1 -right-1",
                                  notification.type === 'info' && "text-blue-600",
                                  notification.type === 'success' && "text-green-600",
                                  notification.type === 'warning' && "text-yellow-600",
                                  notification.type === 'error' && "text-red-600"
                                )}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={getBadgeVariant(notification.type)}>
                                {notification.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(notification.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notifications</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Notification Settings */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4" />
            <h3 className="font-medium">Notification Settings</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="text-sm">
                Email Notifications
              </Label>
              <Switch
                id="email-notifications"
                checked={notificationSettings.email}
                onCheckedChange={(checked) =>
                  setNotificationSettings(prev => ({ ...prev, email: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="text-sm">
                Push Notifications
              </Label>
              <Switch
                id="push-notifications"
                checked={notificationSettings.push}
                onCheckedChange={(checked) =>
                  setNotificationSettings(prev => ({ ...prev, push: checked }))
                }
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}