'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  RotateCcw,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { UndoQueueItem, ConfirmationAction, ConfirmationEntity, ConfirmationItem } from './types'

/**
 * Undo Context Type
 */
interface UndoContextType {
  // Queue management
  addToUndoQueue: (item: Omit<UndoQueueItem, 'id' | 'timestamp'>) => string
  removeFromUndoQueue: (id: string) => void
  executeUndo: (id: string) => Promise<void>
  clearUndoQueue: () => void
  
  // Queue state
  undoQueue: UndoQueueItem[]
  activeUndo: string | null
  
  // Settings
  defaultDuration: number
  maxQueueSize: number
}

/**
 * Undo Context
 */
const UndoContext = createContext<UndoContextType | null>(null)

/**
 * Undo Provider Props
 */
interface UndoProviderProps {
  children: React.ReactNode
  defaultDuration?: number // Default undo duration in milliseconds
  maxQueueSize?: number // Maximum items in undo queue
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  showNotifications?: boolean
}

/**
 * Undo Provider Component
 * Manages the global undo queue and provides undo functionality
 */
export function UndoProvider({
  children,
  defaultDuration = 10000, // 10 seconds default
  maxQueueSize = 5,
  position = 'top-right',
  showNotifications = true
}: UndoProviderProps) {
  const [undoQueue, setUndoQueue] = useState<UndoQueueItem[]>([])
  const [activeUndo, setActiveUndo] = useState<string | null>(null)
  const timerRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())
  
  // Add item to undo queue
  const addToUndoQueue = useCallback((item: Omit<UndoQueueItem, 'id' | 'timestamp'>): string => {
    const id = `undo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()
    
    const newItem: UndoQueueItem = {
      ...item,
      id,
      timestamp,
      duration: item.duration || defaultDuration
    }
    
    setUndoQueue(prev => {
      // Remove oldest items if queue is full
      const updatedQueue = prev.length >= maxQueueSize 
        ? prev.slice(1)
        : prev
      
      return [...updatedQueue, newItem]
    })
    
    // Set up auto-removal timer
    const timer = setTimeout(() => {
      removeFromUndoQueue(id)
    }, newItem.duration)
    
    timerRefs.current.set(id, timer)
    
    // Show toast notification
    if (showNotifications) {
      toast({
        title: "Action completed",
        description: newItem.description,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => executeUndo(id)}
            className="shrink-0"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Undo
          </Button>
        ),
        duration: newItem.duration
      })
    }
    
    return id
  }, [defaultDuration, maxQueueSize, showNotifications])
  
  // Remove item from undo queue
  const removeFromUndoQueue = useCallback((id: string) => {
    setUndoQueue(prev => prev.filter(item => item.id !== id))
    
    // Clear associated timer
    const timer = timerRefs.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timerRefs.current.delete(id)
    }
  }, [])
  
  // Execute undo action
  const executeUndo = useCallback(async (id: string) => {
    const item = undoQueue.find(item => item.id === id)
    if (!item) return
    
    setActiveUndo(id)
    
    try {
      await item.undoAction()
      
      // Remove from queue
      removeFromUndoQueue(id)
      
      // Show success notification
      if (showNotifications) {
        toast({
          title: "Action undone",
          description: `Successfully undid: ${item.description}`,
          variant: "default"
        })
      }
      
    } catch (error) {
      console.error('Undo failed:', error)
      
      // Show error notification
      if (showNotifications) {
        toast({
          title: "Undo failed",
          description: error instanceof Error ? error.message : "Failed to undo action",
          variant: "destructive"
        })
      }
    } finally {
      setActiveUndo(null)
    }
  }, [undoQueue, removeFromUndoQueue, showNotifications])
  
  // Clear entire undo queue
  const clearUndoQueue = useCallback(() => {
    // Clear all timers
    timerRefs.current.forEach(timer => clearTimeout(timer))
    timerRefs.current.clear()
    
    setUndoQueue([])
  }, [])
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timerRefs.current.forEach(timer => clearTimeout(timer))
    }
  }, [])
  
  const contextValue: UndoContextType = {
    addToUndoQueue,
    removeFromUndoQueue,
    executeUndo,
    clearUndoQueue,
    undoQueue,
    activeUndo,
    defaultDuration,
    maxQueueSize
  }
  
  return (
    <UndoContext.Provider value={contextValue}>
      {children}
      
      {/* Undo Queue Display */}
      <UndoQueueDisplay position={position} />
    </UndoContext.Provider>
  )
}

/**
 * Undo Queue Display Props
 */
interface UndoQueueDisplayProps {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

/**
 * Undo Queue Display Component
 * Shows active undo items with countdown and actions
 */
function UndoQueueDisplay({ position }: UndoQueueDisplayProps) {
  const context = useContext(UndoContext)
  if (!context) return null
  
  const { undoQueue, activeUndo, executeUndo, removeFromUndoQueue } = context
  const [currentTime, setCurrentTime] = useState(Date.now())
  
  // Update current time for progress calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 100)
    
    return () => clearInterval(interval)
  }, [])
  
  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }
  
  if (undoQueue.length === 0) return null
  
  return (
    <div className={cn('fixed z-[100] space-y-2', positionClasses[position])}>
      <AnimatePresence>
        {undoQueue.map((item) => {
          const timeElapsed = currentTime - item.timestamp
          const timeRemaining = Math.max(0, item.duration - timeElapsed)
          const progress = Math.max(0, (timeRemaining / item.duration) * 100)
          const isActive = activeUndo === item.id
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.8 }}
              transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
              className={cn(
                'w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg',
                'backdrop-blur-sm bg-white/95',
                isActive && 'ring-2 ring-blue-500 ring-opacity-50'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    Action completed
                  </div>
                  {item.items.length > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      {item.items.length} items
                    </Badge>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromUndoQueue(item.id)}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Description */}
              <div className="text-sm text-gray-600 mb-3">
                {item.description}
              </div>
              
              {/* Items preview */}
              {item.items.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Package className="h-3 w-3" />
                    <span>
                      {item.items.length === 1 
                        ? item.items[0].title || item.items[0].name || 'Item'
                        : `${item.items.length} items`
                      }
                    </span>
                  </div>
                  
                  {/* Show first few items */}
                  {item.items.slice(0, 2).map((affectedItem, index) => (
                    <div key={affectedItem.id} className="text-xs text-gray-400 truncate">
                      {affectedItem.title || affectedItem.name}
                    </div>
                  ))}
                  
                  {item.items.length > 2 && (
                    <div className="text-xs text-gray-400">
                      +{item.items.length - 2} more...
                    </div>
                  )}
                </div>
              )}
              
              {/* Progress bar */}
              <div className="mb-3">
                <Progress 
                  value={progress} 
                  className="h-1"
                />
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{Math.ceil(timeRemaining / 1000)}s remaining</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeUndo(item.id)}
                  disabled={isActive}
                  className="flex-1 text-xs"
                >
                  {isActive ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                      </motion.div>
                      Undoing...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Undo
                    </>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromUndoQueue(item.id)}
                  disabled={isActive}
                  className="px-2 text-xs"
                >
                  Dismiss
                </Button>
              </div>
              
              {/* Active indicator overlay */}
              {isActive && (
                <div className="absolute inset-0 bg-blue-50 bg-opacity-50 rounded-lg pointer-events-none" />
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/**
 * Hook to use undo functionality
 */
export function useUndo() {
  const context = useContext(UndoContext)
  if (!context) {
    throw new Error('useUndo must be used within an UndoProvider')
  }
  return context
}

/**
 * Helper function to create undo-enabled actions
 */
export function createUndoableAction<T extends any[]>(
  action: ConfirmationAction,
  entity: ConfirmationEntity,
  items: ConfirmationItem[],
  description: string,
  undoAction: () => Promise<void>,
  duration?: number
) {
  return {
    execute: async (addToUndoQueue: (item: Omit<UndoQueueItem, 'id' | 'timestamp'>) => string) => {
      // Add to undo queue
      addToUndoQueue({
        action,
        entity,
        items,
        undoAction,
        description,
        duration: duration || 10000
      })
    }
  }
}

/**
 * Predefined undo actions for common operations
 */
export const undoActions = {
  /**
   * Create undo action for deleting items
   */
  delete: (
    items: ConfirmationItem[],
    entity: ConfirmationEntity,
    restoreFunction: () => Promise<void>
  ) => createUndoableAction(
    'delete',
    entity,
    items,
    `Deleted ${items.length} ${entity}${items.length > 1 ? 's' : ''}`,
    restoreFunction
  ),
  
  /**
   * Create undo action for archiving items
   */
  archive: (
    items: ConfirmationItem[],
    entity: ConfirmationEntity,
    unarchiveFunction: () => Promise<void>
  ) => createUndoableAction(
    'archive',
    entity,
    items,
    `Archived ${items.length} ${entity}${items.length > 1 ? 's' : ''}`,
    unarchiveFunction
  ),
  
  /**
   * Create undo action for status changes
   */
  statusChange: (
    items: ConfirmationItem[],
    entity: ConfirmationEntity,
    fromStatus: string,
    toStatus: string,
    revertFunction: () => Promise<void>
  ) => createUndoableAction(
    'bulk_edit',
    entity,
    items,
    `Changed ${items.length} ${entity}${items.length > 1 ? 's' : ''} from ${fromStatus} to ${toStatus}`,
    revertFunction
  ),
  
  /**
   * Create undo action for bulk operations
   */
  bulkOperation: (
    action: ConfirmationAction,
    items: ConfirmationItem[],
    entity: ConfirmationEntity,
    description: string,
    undoFunction: () => Promise<void>
  ) => createUndoableAction(
    action,
    entity,
    items,
    description,
    undoFunction
  )
}

/**
 * Undo-enabled confirmation hook
 * Integrates undo functionality with confirmation modals
 */
export function useUndoableConfirmation() {
  const { addToUndoQueue } = useUndo()
  
  const executeWithUndo = async <T extends any>(
    actionFunction: () => Promise<T>,
    undoConfig: {
      action: ConfirmationAction;
      entity: ConfirmationEntity;
      items: ConfirmationItem[];
      description: string;
      undoAction: () => Promise<void>;
      duration?: number;
    }
  ): Promise<T> => {
    try {
      // Execute the main action
      const result = await actionFunction()
      
      // Add to undo queue
      addToUndoQueue({
        action: undoConfig.action,
        entity: undoConfig.entity,
        items: undoConfig.items,
        undoAction: undoConfig.undoAction,
        description: undoConfig.description,
        duration: undoConfig.duration || 10000
      })
      
      return result
    } catch (error) {
      // Don't add to undo queue if action failed
      throw error
    }
  }
  
  return {
    executeWithUndo
  }
}