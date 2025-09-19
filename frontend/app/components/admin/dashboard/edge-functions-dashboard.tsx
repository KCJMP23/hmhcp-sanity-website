'use client'

import React, { useState, useEffect } from 'react'
import { FrostedGlassCard } from '@/components/frosted-glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  PlayCircle, 
  PauseCircle, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Mail,
  Search,
  Database,
  BarChart3,
  Calendar
} from 'lucide-react'

interface EdgeFunction {
  name: string
  description: string
  status: 'active' | 'inactive' | 'error'
  last_execution: string | null
  success_rate: number
  total_executions: number
  icon: React.ReactNode
}

interface JobLog {
  id: string
  job_type: string
  status: 'completed' | 'failed' | 'running'
  executed_at: string
  execution_time_ms?: number
  result?: any
  error_message?: string
}

interface ScheduledJob {
  id: string
  job_type: string
  schedule_cron: string
  is_active: boolean
  next_run: string
  last_run?: string
}

export default function EdgeFunctionsDashboard() {
  const [edgeFunctions, setEdgeFunctions] = useState<EdgeFunction[]>([])
  const [jobLogs, setJobLogs] = useState<JobLog[]>([])
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJobType, setSelectedJobType] = useState<string>('')
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data for Edge Functions (in production, get from Supabase monitoring)
  const mockEdgeFunctions: EdgeFunction[] = [
    {
      name: 'seo-analysis',
      description: 'Performs comprehensive SEO analysis for content pages',
      status: 'active',
      last_execution: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      success_rate: 98.5,
      total_executions: 1247,
      icon: <Search className="h-5 w-5" />
    },
    {
      name: 'seo-bulk-analysis',
      description: 'Batch SEO analysis for multiple content items',
      status: 'active',
      last_execution: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      success_rate: 95.2,
      total_executions: 89,
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      name: 'send-email',
      description: 'Handles email sending with templates and logging',
      status: 'active',
      last_execution: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      success_rate: 99.1,
      total_executions: 2156,
      icon: <Mail className="h-5 w-5" />
    },
    {
      name: 'background-jobs',
      description: 'Processes scheduled tasks and maintenance jobs',
      status: 'active',
      last_execution: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      success_rate: 97.8,
      total_executions: 456,
      icon: <Calendar className="h-5 w-5" />
    }
  ]

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load job logs
      const jobLogsResponse = await fetch('/api/admin/jobs')
      if (jobLogsResponse.ok) {
        const jobLogsData = await jobLogsResponse.json()
        setJobLogs(jobLogsData.data || [])
      }

      // Set mock Edge Functions data
      setEdgeFunctions(mockEdgeFunctions)

      // Mock scheduled jobs
      setScheduledJobs([
        {
          id: '1',
          job_type: 'scheduled_publish',
          schedule_cron: '0 */5 * * *', // Every 5 minutes
          is_active: true,
          next_run: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
          last_run: new Date(Date.now() - 2 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          job_type: 'cleanup_logs',
          schedule_cron: '0 2 * * *', // Daily at 2 AM
          is_active: true,
          next_run: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          last_run: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          job_type: 'backup_data',
          schedule_cron: '0 1 * * 0', // Weekly on Sunday at 1 AM
          is_active: true,
          next_run: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          last_run: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ])

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const triggerJob = async (jobType: string, jobData?: any) => {
    try {
      const response = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_type: jobType,
          job_data: jobData || {}
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Job "${jobType}" executed successfully`)
        loadDashboardData() // Refresh data
      } else {
        const error = await response.json()
        alert(`Job execution failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to trigger job:', error)
      alert('Failed to trigger job')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  if (isLoading) {
    return (
      <FrostedGlassCard className="p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading Edge Functions dashboard...</span>
        </div>
      </FrostedGlassCard>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-light tracking-tight text-gray-900 dark:text-white">
            Edge Functions Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage Supabase Edge Functions and background jobs
          </p>
        </div>
        <Button 
          onClick={loadDashboardData}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="jobs">Job Logs</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FrostedGlassCard className="p-4">
              <div className="flex items-center">
                <PlayCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Functions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {edgeFunctions.filter(f => f.status === 'active').length}
                  </p>
                </div>
              </div>
            </FrostedGlassCard>

            <FrostedGlassCard className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Executions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {edgeFunctions.reduce((sum, f) => sum + f.total_executions, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </FrostedGlassCard>

            <FrostedGlassCard className="p-4">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(edgeFunctions.reduce((sum, f) => sum + f.success_rate, 0) / edgeFunctions.length).toFixed(1)}%
                  </p>
                </div>
              </div>
            </FrostedGlassCard>

            <FrostedGlassCard className="p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled Jobs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {scheduledJobs.filter(j => j.is_active).length}
                  </p>
                </div>
              </div>
            </FrostedGlassCard>
          </div>

          {/* Quick Actions */}
          <FrostedGlassCard className="p-6">
            <h3 className="text-lg font-display font-medium mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={() => triggerJob('scheduled_publish')}
                className="w-full"
                variant="outline"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Publish Scheduled Content
              </Button>
              <Button 
                onClick={() => triggerJob('cleanup_logs', { days_to_keep: 30 })}
                className="w-full"
                variant="outline"
              >
                <Database className="h-4 w-4 mr-2" />
                Clean Old Logs
              </Button>
              <Button 
                onClick={() => triggerJob('backup_data')}
                className="w-full"
                variant="outline"
              >
                <Database className="h-4 w-4 mr-2" />
                Backup Data
              </Button>
              <Button 
                onClick={() => triggerJob('analytics_aggregate')}
                className="w-full"
                variant="outline"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Update Analytics
              </Button>
            </div>
          </FrostedGlassCard>
        </TabsContent>

        <TabsContent value="functions" className="space-y-4">
          <div className="grid gap-4">
            {edgeFunctions.map((func) => (
              <FrostedGlassCard key={func.name} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      {func.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {func.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {func.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge className={getStatusColor(func.status)}>
                          {func.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Success Rate: {func.success_rate}%
                        </span>
                        <span className="text-xs text-gray-500">
                          Executions: {func.total_executions.toLocaleString()}
                        </span>
                        {func.last_execution && (
                          <span className="text-xs text-gray-500">
                            Last run: {formatRelativeTime(func.last_execution)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      View Logs
                    </Button>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </FrostedGlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Filter by job type..."
                value={selectedJobType}
                onChange={(e) => setSelectedJobType(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          <FrostedGlassCard className="overflow-hidden">
            <div className="overflow-x-hidden">
              <div className="w-full overflow-x-auto"><table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Executed At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {jobLogs
                    .filter(job => !selectedJobType || job.job_type.includes(selectedJobType))
                    .slice(0, 10)
                    .map((job) => (
                    <tr key={job.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {job.job_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatRelativeTime(job.executed_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {job.execution_time_ms ? `${job.execution_time_ms}ms` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        <Button size="sm" variant="ghost">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </FrostedGlassCard>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="grid gap-4">
            {scheduledJobs.map((job) => (
              <FrostedGlassCard key={job.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {job.job_type}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Schedule: {job.schedule_cron}
                      </span>
                      <Badge className={job.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        Next run: {formatRelativeTime(job.next_run)}
                      </span>
                      {job.last_run && (
                        <span className="text-xs text-gray-500">
                          Last run: {formatRelativeTime(job.last_run)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      {job.is_active ? <PauseCircle className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </div>
              </FrostedGlassCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}