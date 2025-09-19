'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Workflow, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface WorkflowStatus {
  summary: {
    total: number
    active: number
    completed: number
    failed: number
    queued: number
  }
  performance: {
    avgDuration: number
    successRate: number
  }
  queue: {
    size: number
    estimated_wait: number
  }
  recentWorkflows: Array<{
    id: string
    name: string
    status: string
    created_at: string
    duration: number | null
  }>
}

export function WorkflowStatusWidget() {
  const [status, setStatus] = useState<WorkflowStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/workflow-status')
        if (response.ok) {
          const data = await response.json()
          setStatus(data)
        }
      } catch (error) {
        console.error('Failed to fetch workflow status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 15000) // Update every 15 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'active':
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Workflow className="h-4 w-4 text-gray-400" />
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-'
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            AI Workflows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeCount = (status?.summary.active || 0) + (status?.summary.queued || 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            AI Workflows
          </span>
          {activeCount > 0 && (
            <Badge variant="default">
              {activeCount} Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Workflow Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">{status?.summary.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {status?.summary.completed || 0}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {status?.summary.active || 0}
              </div>
              <div className="text-sm text-muted-foreground">Processing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {status?.summary.queued || 0}
              </div>
              <div className="text-sm text-muted-foreground">Queued</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium">{status?.performance.successRate || 0}%</span>
                </div>
                <Progress 
                  value={status?.performance.successRate || 0} 
                  className="h-2"
                />
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Avg. Duration</span>
                <span className="font-medium">
                  {status?.performance.avgDuration ? `${status.performance.avgDuration}s` : '-'}
                </span>
              </div>

              {status?.queue.size > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Est. Wait</span>
                  <span className="font-medium">
                    {status?.queue.estimated_wait ? `${status.queue.estimated_wait}m` : '-'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Workflows */}
          {status?.recentWorkflows && status.recentWorkflows.length > 0 && (
            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2">Recent Activity</div>
              <div className="space-y-2">
                {status.recentWorkflows.slice(0, 3).map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1">
                      {getStatusIcon(workflow.status)}
                      <span className="truncate">{workflow.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDuration(workflow.duration)}</span>
                      <span>{formatTime(workflow.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed Workflows Alert */}
          {status?.summary.failed > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                <span>{status.summary.failed} failed workflow(s) require attention</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}