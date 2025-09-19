'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { logger } from '@/lib/logger'
import {
  Lock, 
  Unlock, 
  AlertTriangle, 
  Clock,
  User,
  Shield,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'


interface ContentLock {
  id: string
  contentId: string
  userId: string
  userName?: string
  lockType: 'editing' | 'reviewing' | 'publishing'
  acquiredAt: string
  expiresAt: string
  metadata?: any
}

interface ContentLockManagerProps {
  contentId: string
  lockType?: 'editing' | 'reviewing' | 'publishing'
  onLockAcquired?: (lock: ContentLock) => void
  onLockReleased?: () => void
  onLockExpired?: () => void
  autoRefresh?: boolean
  className?: string
}

export function ContentLockManager({
  contentId,
  lockType = 'editing',
  onLockAcquired,
  onLockReleased,
  onLockExpired,
  autoRefresh = true,
  className
}: ContentLockManagerProps) {
  const { user } = useAuth()
  const [currentLock, setCurrentLock] = useState<ContentLock | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Check for existing lock
  const checkLock = useCallback(async () => {
    try {
      const response = await fetch(`/api/cms/content/pages/${contentId}/lock`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.lock) {
          setCurrentLock(data.lock)
          return data.lock
        }
      }
      
      setCurrentLock(null)
      return null
    } catch (error) {
      logger.error('Failed to check lock:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      return null
    }
  }, [contentId, user?.id])

  // Acquire lock
  const acquireLock = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/cms/content/pages/${contentId}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lockType })
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentLock(data.lock)
        onLockAcquired?.(data.lock)
        toast({ title: 'Success', description: 'Lock acquired successfully' })
      } else {
        const error = await response.json()
        toast({ title: 'Error', description: error.error || 'Failed to acquire lock', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to acquire lock', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  // Release lock
  const releaseLock = async () => {
    if (!user || !currentLock || currentLock.userId !== user.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/cms/content/pages/${contentId}/lock`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCurrentLock(null)
        onLockReleased?.()
        toast({ title: 'Success', description: 'Lock released successfully' })
      } else {
        toast({ title: 'Error', description: 'Failed to release lock', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to release lock', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  // Extend lock
  const extendLock = async () => {
    if (!user || !currentLock || currentLock.userId !== user.id) return

    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/cms/content/pages/${contentId}/lock/extend`, {
        method: 'PUT'
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentLock(data.lock)
        toast({ title: "Success", description: 'Lock extended successfully' })
      }
    } catch (error) {
      logger.error('Failed to extend lock:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Break lock (admin only)
  const breakLock = async () => {
    if (!user || user.role !== 'super_admin') return

    const confirmed = confirm('Are you sure you want to break this lock? The other user may lose unsaved changes.')
    if (!confirmed) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/cms/content/pages/${contentId}/lock/break`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCurrentLock(null)
        await acquireLock()
        toast({ title: "Success", description: 'Lock broken and acquired' })
      } else {
        toast({ title: "Error", description: 'Failed to break lock', variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: 'Failed to break lock', variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // Update time remaining
  useEffect(() => {
    if (!currentLock) {
      setTimeRemaining(0)
      return
    }

    const updateTime = () => {
      const expires = new Date(currentLock.expiresAt).getTime()
      const now = Date.now()
      const remaining = Math.max(0, expires - now)
      
      setTimeRemaining(remaining)

      if (remaining === 0 && currentLock.userId === user?.id) {
        onLockExpired?.()
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [currentLock, user?.id, onLockExpired])

  // Auto-refresh lock
  useEffect(() => {
    if (!autoRefresh || !currentLock || currentLock.userId !== user?.id) return

    const refreshThreshold = 5 * 60 * 1000 // 5 minutes before expiry
    
    if (timeRemaining > 0 && timeRemaining < refreshThreshold && !isRefreshing) {
      extendLock()
    }
  }, [timeRemaining, currentLock, user?.id, autoRefresh, isRefreshing])

  // Initial lock check
  useEffect(() => {
    checkLock()
  }, [checkLock])

  // Format time remaining
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Get lock type badge color
  const getLockTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'editing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'reviewing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'publishing':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const isOwnLock = currentLock?.userId === user?.id
  const canBreakLock = user?.role === 'super_admin' && !isOwnLock

  if (!currentLock) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Unlock className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium">Content is unlocked</span>
          </div>
          
          <Button 
            onClick={acquireLock}
            disabled={isLoading}
            size="sm"
            className="gap-2"
          >
            <Lock className="w-4 h-4" />
            Acquire {lockType} lock
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className={cn(
              'w-5 h-5',
              isOwnLock ? 'text-blue-600' : 'text-blue-600'
            )} />
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {isOwnLock ? 'You have locked this content' : 'Content is locked'}
                </span>
                <Badge className={cn('text-xs', getLockTypeBadgeColor(currentLock.lockType))}>
                  {currentLock.lockType}
                </Badge>
              </div>
              
              {!isOwnLock && currentLock.userName && (
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-600 dark:text-gray-400">
                  <User className="w-3 h-3" />
                  {currentLock.userName}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {timeRemaining > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className={cn(
                  'font-mono',
                  timeRemaining < 60000 && 'text-red-600'
                )}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}

            {isOwnLock && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={extendLock}
                  disabled={isRefreshing || timeRemaining > 20 * 60 * 1000}
                  className="gap-1"
                >
                  <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={releaseLock}
                  disabled={isLoading}
                  className="gap-1 text-red-600 hover:text-blue-700"
                >
                  <Unlock className="w-4 h-4" />
                  Release
                </Button>
              </>
            )}

            {canBreakLock && (
              <Button
                variant="ghost"
                size="sm"
                onClick={breakLock}
                disabled={isLoading}
                className="gap-1 text-blue-600 hover:text-blue-700"
              >
                <Shield className="w-4 h-4" />
                Break Lock
              </Button>
            )}
          </div>
        </div>

        {!isOwnLock && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              This content is currently being {currentLock.lockType === 'editing' ? 'edited' : currentLock.lockType === 'reviewing' ? 'reviewed' : 'published'} by another user.
              {canBreakLock && ' As an administrator, you can break this lock if needed.'}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}