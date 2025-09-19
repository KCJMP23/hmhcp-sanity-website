'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react'

export type BulkJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface BulkJobProgress {
  jobId: string
  status: BulkJobStatus
  progress: number
  message: string
  current_item?: number
  total_items?: number
  errors?: Array<{ id: string; error: string }>
  results?: {
    success: number
    failed: number
    processed: string[]
    errors: Array<{ id: string; error: string }>
  }
}

interface BulkProgressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string | null
  title: string
  description?: string
  onComplete?: (results: any) => void
  onCancel?: () => void
  allowCancel?: boolean
  showDetails?: boolean
}

export function BulkProgressModal({
  open,
  onOpenChange,
  jobId,
  title,
  description,
  onComplete,
  onCancel,
  allowCancel = true,
  showDetails = true
}: BulkProgressModalProps) {
  const [progress, setProgress] = useState<BulkJobProgress | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Subscribe to job progress via Server-Sent Events
  useEffect(() => {
    if (!jobId || !open) return

    const eventSource = new EventSource(`/api/admin/bulk/jobs/${jobId}/progress`)
    
    eventSource.onmessage = (event) => {
      try {
        const progressData: BulkJobProgress = JSON.parse(event.data)
        setProgress(progressData)

        // Handle completion
        if (['completed', 'failed', 'cancelled'].includes(progressData.status)) {
          if (progressData.status === 'completed' && onComplete && progressData.results) {
            onComplete(progressData.results)
          }
          
          // Auto-close after a delay for successful operations
          if (progressData.status === 'completed') {
            setTimeout(() => {
              onOpenChange(false)
            }, 3000)
          }
        }
      } catch (error) {
        console.error('Failed to parse progress data:', error)
      }
    }

    eventSource.onerror = () => {
      console.error('SSE connection error')
      setRetryCount(prev => prev + 1)
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        setTimeout(() => {
          eventSource.close()
        }, Math.pow(2, retryCount) * 1000)
      }
    }

    return () => {
      eventSource.close()
    }
  }, [jobId, open, onComplete, onOpenChange, retryCount])

  const handleCancel = useCallback(async () => {
    if (!jobId || !allowCancel) return

    try {
      const response = await fetch(`/api/admin/bulk/jobs/${jobId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to cancel job')
      }

      onCancel?.()
    } catch (error) {
      console.error('Failed to cancel job:', error)
    }
  }, [jobId, allowCancel, onCancel])

  const handleRetry = useCallback(() => {
    setRetryCount(0)
    setProgress(null)
  }, [])

  const handleDownloadReport = useCallback(() => {
    if (!progress?.results) return

    const report = {
      jobId,
      status: progress.status,
      results: progress.results,
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulk-operation-report-${jobId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [jobId, progress])

  const getStatusIcon = (status: BulkJobStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
    }
  }

  const getStatusColor = (status: BulkJobStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'cancelled':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {progress && getStatusIcon(progress.status)}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {progress ? (
            <>
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(progress.status)}>
                  {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
                </Badge>
                
                {showDetails && progress.results && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowErrors(!showErrors)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      {showErrors ? 'Hide' : 'Show'} Details
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadReport}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Report
                    </Button>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {progress.message}
                  </span>
                  <span className="font-medium">
                    {progress.progress}%
                  </span>
                </div>
                
                <Progress value={progress.progress} className="h-2" />
                
                {progress.current_item && progress.total_items && (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Processing {progress.current_item} of {progress.total_items} items
                  </div>
                )}
              </div>

              {/* Results Summary */}
              {progress.results && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {progress.results.success}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Successful
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {progress.results.failed}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Failed
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {progress.results.success + progress.results.failed}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total
                    </div>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {showErrors && progress.errors && progress.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Errors ({progress.errors.length})
                  </h4>
                  
                  <ScrollArea className="h-32 w-full border border-gray-200 dark:border-gray-700 rounded-md p-2">
                    <div className="space-y-1">
                      {progress.errors.map((error, index) => (
                        <div 
                          key={`${error.id}-${index}`}
                          className="flex items-start gap-2 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded border-l-2 border-red-500"
                        >
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Item: {error.id}</div>
                            <div className="text-red-600 dark:text-red-400">{error.error}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                {progress.status === 'running' && allowCancel && (
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel Operation
                  </Button>
                )}
                
                {progress.status === 'failed' && (
                  <Button variant="outline" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
                
                <Button 
                  variant={progress.status === 'completed' ? 'default' : 'secondary'}
                  onClick={() => onOpenChange(false)}
                >
                  {progress.status === 'completed' ? 'Done' : 'Close'}
                </Button>
              </div>
            </>
          ) : (
            /* Loading State */
            <div className="space-y-4 text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <div>
                <div className="font-medium">Initializing operation...</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Please wait while we prepare your request
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for managing bulk operation progress
export function useBulkProgress() {
  const [activeJob, setActiveJob] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalDescription, setModalDescription] = useState('')

  const startOperation = useCallback((
    jobId: string,
    title: string,
    description?: string
  ) => {
    setActiveJob(jobId)
    setModalTitle(title)
    setModalDescription(description || '')
    setShowModal(true)
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setTimeout(() => {
      setActiveJob(null)
      setModalTitle('')
      setModalDescription('')
    }, 300) // Delay to allow modal animation
  }, [])

  return {
    activeJob,
    showModal,
    modalTitle,
    modalDescription,
    startOperation,
    closeModal,
    setShowModal
  }
}