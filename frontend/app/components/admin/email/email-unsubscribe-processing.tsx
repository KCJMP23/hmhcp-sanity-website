'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Settings,
  BarChart3,
  Users,
  Mail,
  Calendar
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProcessingJob {
  id: string
  name: string
  type: 'unsubscribe' | 'compliance_check' | 'data_cleanup' | 'audit'
  status: 'running' | 'completed' | 'failed' | 'paused' | 'scheduled'
  progress: number
  total_items: number
  processed_items: number
  failed_items: number
  started_at: string
  completed_at: string
  duration: number
  error_message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface ProcessingRule {
  id: string
  name: string
  condition: string
  action: string
  is_active: boolean
  last_triggered: string
  trigger_count: number
  success_rate: number
}

const jobTypes = [
  { value: 'unsubscribe', label: 'Unsubscribe Processing', description: 'Process unsubscribe requests' },
  { value: 'compliance_check', label: 'Compliance Check', description: 'Run compliance validation checks' },
  { value: 'data_cleanup', label: 'Data Cleanup', description: 'Clean up invalid or outdated data' },
  { value: 'audit', label: 'Audit Processing', description: 'Process audit logs and reports' }
]

const priorityLevels = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
]

export function EmailUnsubscribeProcessing() {
  const [jobs, setJobs] = useState<ProcessingJob[]>([])
  const [rules, setRules] = useState<ProcessingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    loadProcessingData()
  }, [])

  const loadProcessingData = async () => {
    try {
      setLoading(true)
      const [jobsResponse, rulesResponse] = await Promise.all([
        fetch('/api/admin/email/unsubscribe/processing/jobs'),
        fetch('/api/admin/email/unsubscribe/processing/rules')
      ])
      
      const [jobsData, rulesData] = await Promise.all([
        jobsResponse.json(),
        rulesResponse.json()
      ])
      
      if (jobsData.success) {
        setJobs(jobsData.data)
      }
      
      if (rulesData.success) {
        setRules(rulesData.data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load processing data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/email/unsubscribe/processing/jobs/${jobId}/start`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Processing job started successfully'
        })
        loadProcessingData()
      } else {
        throw new Error('Failed to start job')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start processing job',
        variant: 'destructive'
      })
    }
  }

  const handlePauseJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/email/unsubscribe/processing/jobs/${jobId}/pause`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Processing job paused successfully'
        })
        loadProcessingData()
      } else {
        throw new Error('Failed to pause job')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to pause processing job',
        variant: 'destructive'
      })
    }
  }

  const handleResumeJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/email/unsubscribe/processing/jobs/${jobId}/resume`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Processing job resumed successfully'
        })
        loadProcessingData()
      } else {
        throw new Error('Failed to resume job')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resume processing job',
        variant: 'destructive'
      })
    }
  }

  const handleRetryJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/email/unsubscribe/processing/jobs/${jobId}/retry`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Processing job retried successfully'
        })
        loadProcessingData()
      } else {
        throw new Error('Failed to retry job')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry processing job',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      running: { color: 'bg-blue-100 text-blue-800', icon: Activity },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: Pause },
      scheduled: { color: 'bg-gray-100 text-gray-800', icon: Clock }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const config = priorityLevels.find(p => p.value === priority) || priorityLevels[0]
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getJobTypeInfo = (type: string) => {
    return jobTypes.find(t => t.value === type) || jobTypes[0]
  }

  const filteredJobs = jobs.filter(job => {
    const typeMatch = selectedType === 'all' || job.type === selectedType
    const statusMatch = selectedStatus === 'all' || job.status === selectedStatus
    const priorityMatch = selectedPriority === 'all' || job.priority === selectedPriority
    return typeMatch && statusMatch && priorityMatch
  })

  const totalJobs = jobs.length
  const runningJobs = jobs.filter(j => j.status === 'running').length
  const completedJobs = jobs.filter(j => j.status === 'completed').length
  const failedJobs = jobs.filter(j => j.status === 'failed').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading processing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Unsubscribe Processing</h2>
          <p className="text-muted-foreground">
            Manage automated unsubscribe processing jobs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadProcessingData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Start New Job
          </Button>
        </div>
      </div>

      {/* Processing Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {runningJobs} running, {completedJobs} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Jobs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningJobs}</div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Job completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedJobs}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Processing Filters
          </CardTitle>
          <CardDescription>
            Filter processing jobs by type, status, and priority
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {jobTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {priorityLevels.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Processing Jobs
          </CardTitle>
          <CardDescription>
            Monitor and manage unsubscribe processing jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => {
                const typeInfo = getJobTypeInfo(job.type)
                const progressPercentage = job.total_items > 0 
                  ? (job.processed_items / job.total_items) * 100 
                  : 0
                
                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{job.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(job.started_at).toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(job.status)}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(job.priority)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{job.processed_items.toLocaleString()}</span>
                          <span className="text-muted-foreground">
                            of {job.total_items.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              progressPercentage >= 100 ? 'bg-green-500' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {progressPercentage.toFixed(1)}% complete
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {job.duration > 0 ? `${job.duration}s` : 'Running...'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {job.status === 'running' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePauseJob(job.id)}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {job.status === 'paused' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResumeJob(job.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {job.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetryJob(job.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {job.status === 'scheduled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartJob(job.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Processing Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Processing Rules
          </CardTitle>
          <CardDescription>
            Automated rules for unsubscribe processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trigger Count</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Last Triggered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div className="font-medium">{rule.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {rule.condition}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {rule.action}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{rule.trigger_count.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.success_rate.toFixed(1)}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            rule.success_rate >= 90 ? 'bg-green-500' :
                            rule.success_rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${rule.success_rate}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(rule.last_triggered).toLocaleString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
