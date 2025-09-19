'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { logger } from '@/lib/logger'
import {
  Users, 
  User, 
  Eye, 
  Edit3, 
  MousePointer,
  Square,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'


interface UserPresenceData {
  id: string
  userId: string
  userName: string
  userEmail: string
  userRole: string
  lastSeenAt: string
  cursorPosition?: {
    line?: number
    column?: number
    element?: string
  }
  selectionRange?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  isActive: boolean
  color: string
}

interface UserPresenceProps {
  contentId: string
  onUserClick?: (user: UserPresenceData) => void
  showCursors?: boolean
  updateInterval?: number
  className?: string
}

// Generate consistent colors for users
const getUserColor = (userId: string) => {
  const colors = [
    '#3B82F6', // blue
    '#3B82F6', // green
    '#3B82F6', // amber
    '#EF4444', // red
    '#3B82F6', // violet
    '#EC4899', // pink
    '#14B8A6', // teal
    '#3B82F6', // orange
  ]
  
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  
  return colors[Math.abs(hash) % colors.length]
}

export function UserPresence({
  contentId,
  onUserClick,
  showCursors = true,
  updateInterval = 5000,
  className
}: UserPresenceProps) {
  const { user } = useAuth()
  const [activeUsers, setActiveUsers] = useState<UserPresenceData[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Fetch active users
  const fetchActiveUsers = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/cms/content/pages/${contentId}/presence`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const users = data.users.map((u: any) => ({
          ...u,
          color: getUserColor(u.userId),
          isActive: new Date(u.lastSeenAt).getTime() > Date.now() - 30000 // Active in last 30s
        }))
        
        setActiveUsers(users.filter((u: UserPresenceData) => u.userId !== user.id))
        setLastUpdate(new Date())
      }
    } catch (error) {
      logger.error('Failed to fetch active users:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }, [contentId, user])

  // Update own presence
  const updatePresence = useCallback(async (
    cursorPosition?: any,
    selectionRange?: any
  ) => {
    if (!user?.id || isUpdating) return

    setIsUpdating(true)
    try {
      await fetch(`/api/cms/content/pages/${contentId}/presence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cursorPosition,
          selectionRange
        })
      })
    } catch (error) {
      logger.error('Failed to update presence:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    } finally {
      setIsUpdating(false)
    }
  }, [contentId, user, isUpdating])

  // Set up presence updates
  useEffect(() => {
    fetchActiveUsers()
    const interval = setInterval(fetchActiveUsers, updateInterval)

    // Update own presence immediately
    updatePresence()

    // Update presence on page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updatePresence()
        fetchActiveUsers()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchActiveUsers, updatePresence, updateInterval])

  // Get activity status
  const getActivityStatus = (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime()
    
    if (diff < 5000) return { text: 'Active now', color: 'text-blue-600' }
    if (diff < 30000) return { text: 'Active', color: 'text-blue-600' }
    if (diff < 300000) return { text: 'Recently active', color: 'text-gray-600' }
    return { text: 'Inactive', color: 'text-gray-400' }
  }

  if (activeUsers.length === 0) {
    return null
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="text-sm font-medium">Active Users</h3>
            <Badge variant="outline" className="text-xs">
              {activeUsers.length}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Activity className="w-3 h-3" />
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>

        <div className="space-y-2">
          {activeUsers.map((activeUser) => {
            const status = getActivityStatus(activeUser.lastSeenAt)
            
            return (
              <div
                key={activeUser.id}
                className={cn(
                  'flex items-center justify-between p-2  border border-gray-200 dark:border-gray-700',
                  'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                  onUserClick && 'cursor-pointer'
                )}
                onClick={() => onUserClick?.(activeUser)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div 
                      className="w-8 h-8 flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: activeUser.color }}
                    >
                      {activeUser.userName.charAt(0).toUpperCase()}
                    </div>
                    <Square 
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-3 h-3',
                        activeUser.isActive ? 'text-blue-600 fill-current' : 'text-gray-400'
                      )}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{activeUser.userName}</span>
                      <Badge variant="outline" className="text-xs">
                        {activeUser.userRole}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={status.color}>{status.text}</span>
                      {activeUser.cursorPosition?.element && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            {activeUser.cursorPosition.element}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {showCursors && activeUser.cursorPosition && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MousePointer 
                      className="w-3 h-3"
                      style={{ color: activeUser.color }}
                    />
                    {activeUser.cursorPosition.line && (
                      <span>L{activeUser.cursorPosition.line}:{activeUser.cursorPosition.column || 0}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {activeUsers.length > 3 && (
          <div className="text-xs text-center text-gray-500">
            Showing most recently active users
          </div>
        )}
      </div>
    </Card>
  )
}

// Cursor overlay component for visual representation
export function UserCursors({ 
  users, 
  containerRef 
}: { 
  users: UserPresenceData[]
  containerRef: React.RefObject<HTMLElement>
}) {
  if (!containerRef.current) return null

  return (
    <div className="pointer-events-none absolute inset-0">
      {users.map((user) => {
        if (!user.cursorPosition || !user.isActive) return null

        // Calculate position based on cursor data
        // This is a simplified example - real implementation would need
        // to map line/column to actual pixel positions
        const top = (user.cursorPosition.line || 0) * 20 // Rough line height
        const left = (user.cursorPosition.column || 0) * 8 // Rough char width

        return (
          <div
            key={user.id}
            className="absolute transition-all duration-200"
            style={{
              top: `${top}px`,
              left: `${left}px`
            }}
          >
            <div className="flex items-start gap-1">
              <div 
                className="w-0.5 h-5 animate-pulse"
                style={{ backgroundColor: user.color }}
              />
              <div 
                className="px-1.5 py-0.5 text-xs text-white shadow-sm"
                style={{ backgroundColor: user.color }}
              >
                {user.userName}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}