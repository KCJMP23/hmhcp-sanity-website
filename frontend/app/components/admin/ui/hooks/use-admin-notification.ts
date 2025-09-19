/**
 * Admin Notification Hook
 * Manages notification state and queue for admin components
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { AdminToastProps, AdminSeverity } from '../types'
import { generateAdminId } from '../utils'

interface Notification extends Omit<AdminToastProps, 'id'> {
  id: string
  timestamp: number
}

interface UseAdminNotificationReturn {
  notifications: Notification[]
  showNotification: (notification: Omit<AdminToastProps, 'id'>) => string
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
  showSuccess: (title: string, description?: string) => string
  showError: (title: string, description?: string) => string
  showWarning: (title: string, description?: string) => string
  showInfo: (title: string, description?: string) => string
}

/**
 * Hook for managing admin notifications
 */
export function useAdminNotification(
  maxNotifications = 5,
  defaultDuration = 5000
): UseAdminNotificationReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())
  
  // Add notification to queue
  const showNotification = useCallback((
    notification: Omit<AdminToastProps, 'id'>
  ): string => {
    const id = generateAdminId('notification')
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration || defaultDuration,
    }
    
    setNotifications(prev => {
      // Limit number of notifications
      const updated = [newNotification, ...prev].slice(0, maxNotifications)
      return updated
    })
    
    // Auto-remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      const timeout = setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
      
      timeoutRefs.current.set(id, timeout)
    }
    
    // Log critical notifications for audit trail
    if (notification.severity === 'critical' || notification.severity === 'error') {
      console.error('[Admin Notification]', notification.title, notification.description)
    }
    
    return id
  }, [maxNotifications, defaultDuration])
  
  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    
    // Clear timeout if exists
    const timeout = timeoutRefs.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutRefs.current.delete(id)
    }
  }, [])
  
  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
    
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    timeoutRefs.current.clear()
  }, [])
  
  // Convenience methods for different severity levels
  const showSuccess = useCallback((title: string, description?: string): string => {
    return showNotification({
      title,
      description,
      severity: 'success',
    })
  }, [showNotification])
  
  const showError = useCallback((title: string, description?: string): string => {
    return showNotification({
      title,
      description,
      severity: 'error',
      duration: 0, // Errors don't auto-dismiss
    })
  }, [showNotification])
  
  const showWarning = useCallback((title: string, description?: string): string => {
    return showNotification({
      title,
      description,
      severity: 'warning',
    })
  }, [showNotification])
  
  const showInfo = useCallback((title: string, description?: string): string => {
    return showNotification({
      title,
      description,
      severity: 'info',
    })
  }, [showNotification])
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    }
  }, [])
  
  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}