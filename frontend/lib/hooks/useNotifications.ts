'use client'

import { useCallback, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/hooks'

export interface Notification {
  id?: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  persistent?: boolean
}

export interface SystemNotification extends Notification {
  userId: string
  read: boolean
  createdAt: string
  category?: 'workflow' | 'content' | 'system' | 'security'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  metadata?: Record<string, any>
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Show toast notification
  const showNotification = useCallback((
    notification: Notification
  ) => {
    const { type, title, message, action, duration = 5000 } = notification

    // Show toast based on type
    const toastFn = {
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info
    }[type] || toast

    toastFn(title, {
      description: message,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined
    })

    // If persistent, also save to database
    if (notification.persistent && user) {
      saveNotification(notification)
    }
  }, [user])

  // Save notification to database
  const saveNotification = useCallback(async (
    notification: Notification
  ) => {
    if (!user) return

    try {
      const systemNotification: Partial<SystemNotification> = {
        ...notification,
        userId: user.id,
        read: false,
        createdAt: new Date().toISOString()
      }

      const { error } = await supabase
        .from('notifications')
        .insert(systemNotification)

      if (error) {
        console.error('Failed to save notification:', error)
      }
    } catch (error) {
      console.error('Error saving notification:', error)
    }
  }, [user])

  // Fetch user notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.read).length || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [user])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('userId', user.id)
        .eq('read', false)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }, [user])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [notifications])

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('userId', user.id)

      if (error) throw error

      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }, [user])

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return

    // Initial fetch
    fetchNotifications()

    // Subscribe to new notifications
    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `userId=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as SystemNotification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
          
          // Show toast for new notification
          showNotification({
            type: newNotification.type,
            title: newNotification.title,
            message: newNotification.message,
            duration: 5000
          })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, fetchNotifications, showNotification])

  return {
    notifications,
    unreadCount,
    showNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    fetchNotifications
  }
}