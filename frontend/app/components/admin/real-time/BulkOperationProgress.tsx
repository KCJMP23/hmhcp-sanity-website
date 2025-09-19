/**
 * Real-time Bulk Operation Progress Component
 * 
 * Shows live progress updates for bulk operations with detailed status
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { 
  Play, 
  Pause, 
  Square, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Activity,
  FileText,
  Users,
  Database,
  RefreshCw,
  Download,
  Eye,
  Trash2
} from 'lucide-react'
import { BulkOperationEvent } from '@/lib/services/websocket-manager'
import { useWebSocketConnection } from '@/hooks/useWebSocketConnection'
import { motion, AnimatePresence } from 'framer-motion'

// ================================
// Types and Interfaces
// ================================

export interface BulkOperationProgressProps {
  operationId: string
  initialData?: BulkOperationEvent
  showDetails?: boolean
  showLogs?: boolean
  onComplete?: (operation: BulkOperationEvent) => void
  onError?: (operation: BulkOperationEvent, error: any) => void
  onCancel?: (operationId: string) => void
  className?: string
}

export interface OperationLogEntry {
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  details?: any
  itemId?: string
}

export interface OperationStats {
  totalItems: number
  processedItems: number
  successfulItems: number
  failedItems: number
  skippedItems: number
  progress: number
  estimatedTimeRemaining?: number
  processingRate?: number // items per minute
  errorRate?: number // percentage
}

// ================================
// Operation Type Configuration
// ================================

const operationTypeConfig = {
  approve: {
    label: 'Approve Content',
    icon: CheckCircle2,
    color: 'green',
    description: 'Bulk approval of content items'
  },
  reject: {
    label: 'Reject Content',
    icon: XCircle,
    color: 'red',
    description: 'Bulk rejection of content items'
  },
  publish: {
    label: 'Publish Content',
    icon: FileText,
    color: 'blue',
    description: 'Bulk publishing of approved content'
  },
  archive: {
    label: 'Archive Content',
    icon: Database,
    color: 'gray',
    description: 'Bulk archiving of content items'
  },
  bulk_edit: {
    label: 'Bulk Edit',
    icon: RefreshCw,
    color: 'purple',
    description: 'Bulk editing of content properties'
  }
}

const statusConfig = {
  started: {
    label: 'Running',
    color: 'bg-blue-100 text-blue-800',
    icon: Play
  },
  progress: {
    label: 'In Progress',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Activity
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  }
}

// ================================
// Main Component
// ================================

export function BulkOperationProgress({
  operationId,
  initialData,
  showDetails = true,
  showLogs = true,
  onComplete,
  onError,
  onCancel,
  className
}: BulkOperationProgressProps) {
  const [operation, setOperation] = useState<BulkOperationEvent | null>(initialData || null)
  const [logs, setLogs] = useState<OperationLogEntry[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [stats, setStats] = useState<OperationStats | null>(null)
  const [startTime] = useState<Date>(new Date())

  // WebSocket connection for real-time updates
  const { isConnected, sendMessage } = useWebSocketConnection({
    autoConnect: true,
    channels: [`bulk:${operationId}`, 'bulk:operations'],
    onMessage: handleWebSocketMessage
  })

  /**
   * Handle incoming WebSocket messages
   */
  function handleWebSocketMessage(message: any) {
    try {
      if (message.operationId !== operationId) return

      switch (message.type) {
        case 'bulk_operation_started':
          handleOperationStarted(message.payload)
          break
        case 'bulk_operation_progress':
          handleOperationProgress(message.payload)
          break
        case 'bulk_operation_completed':
          handleOperationCompleted(message.payload)
          break
        case 'bulk_operation_failed':
          handleOperationFailed(message.payload)
          break
      }
    } catch (error) {
      console.error('Error handling bulk operation message:', error)
    }
  }

  /**
   * Handle operation started
   */
  const handleOperationStarted = useCallback((data: BulkOperationEvent) => {
    setOperation(data)
    
    const logEntry: OperationLogEntry = {
      timestamp: new Date(),
      level: 'info',
      message: `Started ${operationTypeConfig[data.operationType]?.label} operation`,
      details: { totalItems: data.totalItems }
    }
    
    setLogs(prev => [logEntry, ...prev])
  }, [])

  /**
   * Handle operation progress
   */
  const handleOperationProgress = useCallback((data: BulkOperationEvent) => {
    setOperation(prev => prev ? { ...prev, ...data } : data)
    
    // Update stats
    const currentStats: OperationStats = {
      totalItems: data.totalItems,
      processedItems: data.processedItems,
      successfulItems: data.processedItems - data.failedItems,
      failedItems: data.failedItems,
      skippedItems: 0, // Would be calculated from actual data
      progress: data.progress,
      processingRate: calculateProcessingRate(data.processedItems),
      errorRate: data.totalItems > 0 ? (data.failedItems / data.totalItems) * 100 : 0
    }

    // Estimate time remaining
    if (currentStats.processingRate && currentStats.processingRate > 0) {
      const remainingItems = data.totalItems - data.processedItems
      currentStats.estimatedTimeRemaining = Math.ceil(remainingItems / currentStats.processingRate)
    }

    setStats(currentStats)

    // Add progress log entry (throttled)
    if (data.processedItems % Math.max(1, Math.floor(data.totalItems / 10)) === 0) {
      const logEntry: OperationLogEntry = {
        timestamp: new Date(),
        level: 'info',
        message: `Progress: ${data.processedItems}/${data.totalItems} items processed (${data.progress}%)`,
        details: { 
          processed: data.processedItems, 
          failed: data.failedItems, 
          progress: data.progress 
        }
      }
      
      setLogs(prev => [logEntry, ...prev.slice(0, 49)]) // Keep last 50 entries
    }

    // Add error logs if failures occurred
    if (data.failedItems > (stats?.failedItems || 0)) {
      const newFailures = data.failedItems - (stats?.failedItems || 0)
      const logEntry: OperationLogEntry = {
        timestamp: new Date(),
        level: 'error',
        message: `${newFailures} item(s) failed processing`,
        details: data.data?.lastError
      }
      
      setLogs(prev => [logEntry, ...prev])
    }
  }, [stats])

  /**
   * Handle operation completion
   */
  const handleOperationCompleted = useCallback((data: BulkOperationEvent) => {
    setOperation(data)
    
    const logEntry: OperationLogEntry = {
      timestamp: new Date(),
      level: 'success',
      message: `Operation completed successfully`,
      details: { 
        totalProcessed: data.processedItems,
        totalFailed: data.failedItems,
        duration: Date.now() - startTime.getTime()
      }
    }
    
    setLogs(prev => [logEntry, ...prev])
    onComplete?.(data)
  }, [onComplete, startTime])

  /**
   * Handle operation failure
   */
  const handleOperationFailed = useCallback((data: BulkOperationEvent) => {
    setOperation(data)
    
    const logEntry: OperationLogEntry = {
      timestamp: new Date(),
      level: 'error',
      message: `Operation failed: ${data.data?.error || 'Unknown error'}`,
      details: data.data
    }
    
    setLogs(prev => [logEntry, ...prev])
    onError?.(data, data.data?.error)
  }, [onError])

  /**
   * Calculate processing rate (items per minute)
   */
  const calculateProcessingRate = useCallback((processedItems: number): number => {
    const elapsed = (Date.now() - startTime.getTime()) / 1000 / 60 // minutes
    return elapsed > 0 ? processedItems / elapsed : 0
  }, [startTime])

  /**
   * Cancel operation
   */
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel(operationId)
    }
    
    // Send cancellation message via WebSocket
    sendMessage({
      type: 'cancel_bulk_operation',
      payload: { operationId }
    })
  }, [operationId, onCancel, sendMessage])

  /**
   * Download operation logs
   */
  const downloadLogs = useCallback(() => {
    const logData = logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      message: log.message,
      details: log.details
    }))

    const blob = new Blob([JSON.stringify(logData, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulk-operation-${operationId}-logs.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [logs, operationId])

  /**
   * Format duration
   */
  const formatDuration = useCallback((milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }, [])

  if (!operation) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
            <p className="text-sm text-gray-600">Loading operation data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const typeConfig = operationTypeConfig[operation.operationType]
  const statusInfo = statusConfig[operation.type]
  const TypeIcon = typeConfig?.icon || Activity
  const StatusIcon = statusInfo?.icon || Activity

  const duration = Date.now() - startTime.getTime()

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-gray-100">
              <TypeIcon className={cn(
                "w-5 h-5",
                typeConfig ? `text-${typeConfig.color}-600` : "text-gray-600"
              )} />
            </div>
            <div>
              <CardTitle className="text-lg">
                {typeConfig?.label || 'Bulk Operation'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {typeConfig?.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={statusInfo?.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusInfo?.label}
                </Badge>
                <span className="text-xs text-gray-500">
                  Duration: {formatDuration(duration)}
                </span>
                {!isConnected && (
                  <Badge variant="destructive" className="text-xs">
                    Disconnected
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            
            {showLogs && logs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadLogs}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}

            {(operation.type === 'started' || operation.type === 'progress') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-red-600 hover:text-red-700"
              >
                <Square className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">
              {operation.processedItems} / {operation.totalItems} items ({operation.progress}%)
            </span>
          </div>
          <Progress value={operation.progress} className="h-3" />
          
          {stats && (
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>
                {stats.failedItems > 0 && `${stats.failedItems} failed`}
              </span>
              {stats.estimatedTimeRemaining && operation.type === 'progress' && (
                <span>
                  ~{Math.ceil(stats.estimatedTimeRemaining)} min remaining
                </span>
              )}
            </div>
          )}
        </div>

        {/* Statistics Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.successfulItems}
              </div>
              <div className="text-xs text-gray-600">Successful</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {stats.failedItems}
              </div>
              <div className="text-xs text-gray-600">Failed</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.processingRate ? Math.round(stats.processingRate) : 0}
              </div>
              <div className="text-xs text-gray-600">Items/min</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(stats.errorRate)}%
              </div>
              <div className="text-xs text-gray-600">Error Rate</div>
            </div>
          </div>
        )}

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Separator className="my-4" />
              
              {/* Operation Logs */}
              {showLogs && logs.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Operation Logs
                  </h4>
                  <ScrollArea className="h-64 w-full rounded-md border p-4">
                    <div className="space-y-2">
                      {logs.map((log, index) => (
                        <motion.div
                          key={`${log.timestamp}-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={cn(
                            "flex items-start gap-3 text-sm p-2 rounded",
                            log.level === 'error' && "bg-red-50 text-red-800",
                            log.level === 'warning' && "bg-yellow-50 text-yellow-800",
                            log.level === 'success' && "bg-green-50 text-green-800",
                            log.level === 'info' && "bg-blue-50 text-blue-800"
                          )}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {log.level === 'error' && <XCircle className="w-4 h-4" />}
                            {log.level === 'warning' && <AlertTriangle className="w-4 h-4" />}
                            {log.level === 'success' && <CheckCircle2 className="w-4 h-4" />}
                            {log.level === 'info' && <Activity className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{log.message}</span>
                              <span className="text-xs opacity-70">
                                {log.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            {log.details && (
                              <pre className="text-xs mt-1 opacity-70 whitespace-pre-wrap">
                                {typeof log.details === 'string' 
                                  ? log.details 
                                  : JSON.stringify(log.details, null, 2)
                                }
                              </pre>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}