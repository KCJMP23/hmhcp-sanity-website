'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger';
import {
  RefreshCw, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface ProcessingJob {
  id: string
  mediaId: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  operations: string[]
  progress: number
  priority: number
  error?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  mediaFilename?: string
}

interface ProcessingQueueProps {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function ProcessingQueue({ 
  autoRefresh = true, 
  refreshInterval = 5000 
}: ProcessingQueueProps) {
  const [jobs, setJobs] = useState<ProcessingJob[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processingEnabled, setProcessingEnabled] = useState(true)
  const { toast } = useToast()

  const fetchQueue = async () => {
    try {
      const [queueResponse, statsResponse] = await Promise.all([
        fetch('/api/cms/media/processing/queue', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
          }
        }),
        fetch('/api/cms/media/processing/statistics', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
          }
        })
      ])

      if (queueResponse.ok) {
        const queueData = await queueResponse.json()
        setJobs(queueData.jobs || [])
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStatistics(statsData)
      }
    } catch (error) {
      logger.error('Failed to fetch processing queue:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()

    if (autoRefresh) {
      const interval = setInterval(fetchQueue, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const getStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: ProcessingJob['status']) => {
    const variants = {
      queued: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive',
      cancelled: 'secondary'
    }

    const colors = {
      queued: 'bg-blue-100 text-blue-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-blue-100 text-blue-600',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return '-'
    if (!end && status !== 'processing') return '-'
    
    const startTime = new Date(start).getTime()
    const endTime = end ? new Date(end).getTime() : Date.now()
    const duration = Math.round((endTime - startTime) / 1000)
    
    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`
  }

  const retryJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/cms/media/processing/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Job queued for retry'
        })
        fetchQueue()
      } else {
        throw new Error('Failed to retry job')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry job',
        variant: 'destructive'
      })
    }
  }

  const cancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/cms/media/processing/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Job cancelled'
        })
        fetchQueue()
      } else {
        throw new Error('Failed to cancel job')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel job',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading processing queue...
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {statistics.queue_stats?.queued || 0}
            </div>
            <div className="text-sm text-muted-foreground">Queued</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {statistics.queue_stats?.processing || 0}
            </div>
            <div className="text-sm text-muted-foreground">Processing</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {statistics.queue_stats?.completed_today || 0}
            </div>
            <div className="text-sm text-muted-foreground">Completed Today</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {statistics.queue_stats?.failed_today || 0}
            </div>
            <div className="text-sm text-muted-foreground">Failed Today</div>
          </Card>
        </div>
      )}

      {/* Queue Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Processing Queue</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQueue}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant={processingEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setProcessingEnabled(!processingEnabled)}
            >
              {processingEnabled ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Jobs List */}
      <Card className="p-6">
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No processing jobs in queue
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-4 p-4 border"
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(job.status)}
                </div>

                {/* Job Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                      {job.mediaFilename || `Media ${job.mediaId.slice(0, 8)}`}
                    </span>
                    {getStatusBadge(job.status)}
                    <Badge variant="outline" className="text-xs">
                      Priority {job.priority}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Operations: {job.operations.join(', ')}
                  </div>
                  
                  {job.status === 'processing' && (
                    <div className="mt-2">
                      <Progress value={job.progress} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {job.progress}% complete
                      </div>
                    </div>
                  )}
                  
                  {job.error && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 p-2">
                      {job.error}
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div className="text-sm text-muted-foreground">
                  {formatDuration(job.startedAt, job.completedAt)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {job.status === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retryJob(job.id)}
                    >
                      Retry
                    </Button>
                  )}
                  {(job.status === 'queued' || job.status === 'processing') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelJob(job.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}