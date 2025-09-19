'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserIcon,
  EyeIcon,
  PencilIcon,
  SignalIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface CollaboratorData {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'editing' | 'viewing' | 'idle'
  lastSeen: Date
  currentField?: string
  cursor?: {
    x: number
    y: number
    field: string
  }
}

interface CollaborationIndicatorsProps {
  collaborators: CollaboratorData[]
  currentUserId?: string
  contentId?: string
  className?: string
}

export function CollaborationIndicators({
  collaborators,
  currentUserId,
  contentId,
  className
}: CollaborationIndicatorsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Filter out current user
  const otherCollaborators = collaborators.filter(c => c.id !== currentUserId)
  
  if (otherCollaborators.length === 0) {
    return null
  }

  const activeCollaborators = otherCollaborators.filter(c => {
    const timeDiff = Date.now() - c.lastSeen.getTime()
    return timeDiff < 5 * 60 * 1000 // Active within 5 minutes
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'editing':
        return PencilIcon
      case 'viewing':
        return EyeIcon
      default:
        return UserIcon
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'editing':
        return 'text-green-600 dark:text-green-400'
      case 'viewing':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusText = (status: string, field?: string) => {
    switch (status) {
      case 'editing':
        return field ? `Editing ${field}` : 'Currently editing'
      case 'viewing':
        return 'Viewing document'
      default:
        return 'Active'
    }
  }

  const formatLastSeen = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes === 0) {
      return 'Just now'
    } else if (minutes < 60) {
      return `${minutes}m ago`
    } else {
      const hours = Math.floor(minutes / 60)
      return `${hours}h ago`
    }
  }

  return (
    <TooltipProvider>
      <div className={cn("relative", className)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "flex items-center",
            isExpanded ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md" : "",
            isExpanded ? "border border-gray-200/50 dark:border-gray-700/50" : "",
            isExpanded ? "rounded-xl p-3 shadow-lg" : "gap-1"
          )}
        >
          {/* Compact View */}
          {!isExpanded && (
            <>
              <div className="flex -space-x-2">
                {activeCollaborators.slice(0, 3).map((collaborator, index) => {
                  const StatusIcon = getStatusIcon(collaborator.status)
                  
                  return (
                    <Tooltip key={collaborator.id}>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative"
                        >
                          <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-900">
                            <AvatarImage 
                              src={collaborator.avatar} 
                              alt={collaborator.name}
                            />
                            <AvatarFallback className="text-xs font-medium">
                              {collaborator.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Status indicator */}
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white dark:border-gray-900",
                            "flex items-center justify-center",
                            collaborator.status === 'editing' ? 'bg-green-500' :
                            collaborator.status === 'viewing' ? 'bg-blue-500' :
                            'bg-gray-400'
                          )}>
                            <StatusIcon className="h-1.5 w-1.5 text-white" />
                          </div>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="text-center">
                          <p className="font-medium">{collaborator.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {getStatusText(collaborator.status, collaborator.currentField)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatLastSeen(collaborator.lastSeen)}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
              
              {activeCollaborators.length > 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900"
                >
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    +{activeCollaborators.length - 3}
                  </span>
                </motion.div>
              )}

              {activeCollaborators.length > 0 && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <SignalIcon className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </>
          )}

          {/* Expanded View */}
          {isExpanded && (
            <div className="space-y-3 min-w-64">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SignalIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-sm">
                    Active Collaborators ({activeCollaborators.length})
                  </span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeCollaborators.map((collaborator) => {
                  const StatusIcon = getStatusIcon(collaborator.status)
                  
                  return (
                    <motion.div
                      key={collaborator.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={collaborator.avatar} 
                            alt={collaborator.name}
                          />
                          <AvatarFallback className="text-xs font-medium">
                            {collaborator.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full",
                          collaborator.status === 'editing' ? 'bg-green-500' :
                          collaborator.status === 'viewing' ? 'bg-blue-500' :
                          'bg-gray-400'
                        )}>
                          <StatusIcon className="h-1.5 w-1.5 text-white absolute top-0.5 left-0.5" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {collaborator.name}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {collaborator.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-xs",
                            getStatusColor(collaborator.status)
                          )}>
                            {getStatusText(collaborator.status, collaborator.currentField)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatLastSeen(collaborator.lastSeen)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Real-time cursors */}
        <AnimatePresence>
          {activeCollaborators
            .filter(c => c.cursor && c.status === 'editing')
            .map((collaborator) => (
              <motion.div
                key={`cursor-${collaborator.id}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                style={{
                  position: 'fixed',
                  left: collaborator.cursor!.x,
                  top: collaborator.cursor!.y,
                  pointerEvents: 'none',
                  zIndex: 1000
                }}
                className="flex items-center gap-1"
              >
                <div className="w-0.5 h-4 bg-blue-500 animate-pulse" />
                <div className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-medium shadow-lg">
                  {collaborator.name}
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}

/* Hook for managing real-time collaboration */
export function useCollaboration(contentId: string, contentType: 'post' | 'page' | 'media') {
  const [collaborators, setCollaborators] = useState<CollaboratorData[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // Simulate real-time collaboration (in real implementation, use WebSocket/Supabase Realtime)
  useEffect(() => {
    if (!contentId) return

    // Mock collaboration data
    const mockCollaborators: CollaboratorData[] = [
      {
        id: 'user-2',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        status: 'editing',
        lastSeen: new Date(Date.now() - 30000), // 30 seconds ago
        currentField: 'title',
        cursor: {
          x: 100,
          y: 200,
          field: 'title'
        }
      },
      {
        id: 'user-3',
        name: 'Mike Chen',
        email: 'mike@example.com',
        status: 'viewing',
        lastSeen: new Date(Date.now() - 60000), // 1 minute ago
      }
    ]

    // Simulate connection
    const connectTimer = setTimeout(() => {
      setIsConnected(true)
      setCollaborators(mockCollaborators)
    }, 1000)

    // Simulate real-time updates
    const updateTimer = setInterval(() => {
      setCollaborators(prev => prev.map(collab => ({
        ...collab,
        lastSeen: new Date(Date.now() - Math.random() * 120000), // Random last seen
        cursor: collab.cursor ? {
          ...collab.cursor,
          x: Math.random() * window.innerWidth * 0.8,
          y: Math.random() * window.innerHeight * 0.6 + 100
        } : undefined
      })))
    }, 5000)

    return () => {
      clearTimeout(connectTimer)
      clearInterval(updateTimer)
      setIsConnected(false)
      setCollaborators([])
    }
  }, [contentId])

  const updateUserStatus = (status: 'editing' | 'viewing' | 'idle', field?: string) => {
    // In real implementation, send status update to server
    console.log('User status updated:', { status, field })
  }

  const updateCursorPosition = (x: number, y: number, field: string) => {
    // In real implementation, broadcast cursor position
    console.log('Cursor updated:', { x, y, field })
  }

  return {
    collaborators,
    isConnected,
    updateUserStatus,
    updateCursorPosition
  }
}

/* Field-level collaboration indicator */
export function FieldCollaborationIndicator({
  fieldName,
  collaborators,
  className
}: {
  fieldName: string
  collaborators: CollaboratorData[]
  className?: string
}) {
  const activeInField = collaborators.filter(
    c => c.currentField === fieldName && c.status === 'editing'
  )

  if (activeInField.length === 0) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {activeInField.slice(0, 2).map((collaborator) => (
        <Tooltip key={collaborator.id}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-full">
              <PencilIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <Avatar className="h-4 w-4">
                <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                <AvatarFallback className="text-xs">
                  {collaborator.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">
              {collaborator.name} is editing this field
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
      
      {activeInField.length > 2 && (
        <Badge variant="outline" className="h-6 text-xs">
          +{activeInField.length - 2}
        </Badge>
      )}
    </div>
  )
}