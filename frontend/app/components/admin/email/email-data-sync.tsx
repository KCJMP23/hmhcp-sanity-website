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
  RefreshCw,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  Download,
  Upload,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SyncJob {
  id: string
  name: string
  type: 'full' | 'incremental' | 'real_time'
  status: 'running' | 'completed' | 'failed' | 'paused'
  source: string
  target: string
  records_processed: number
  records_successful: number
  records_failed: number
  started_at: string
  completed_at: string
  duration: number
  error_message: string
}

interface SyncSchedule {
  id: string
  name: string
  frequency: 'realtime' | '5min' | '15min' | '1hour' | '6hours' | 'daily'
  last_run: string
  next_run: string
  is_active: boolean
  sync_type: 'full' | 'incremental'
}

const syncTypes = [
  { value: 'full', label: 'Full Sync', description: 'Sync all data from source to target' },
  { value: 'incremental', label: 'Incremental Sync', description: 'Sync only changed data since last sync' },
  { value: 'real_time', label: 'Real-time Sync', description: 'Sync data immediately when changes occur' }
]

const syncSources = [
  { value: 'epic', label: 'Epic MyChart', description: 'Epic Systems patient data' },
  { value: 'cerner', label: 'Cerner PowerChart', description: 'Cerner patient data' },
  { value: 'allscripts', label: 'Allscripts', description: 'Allscripts patient data' },
  { value: 'patient_portal', label: 'Patient Portal', description: 'Patient portal data' },
  { value: 'email_system', label: 'Email System', description: 'Email campaign data' }
]

const syncTargets = [
  { value: 'email_contacts', label: 'Email Contacts', description: 'Email contact database' },
  { value: 'email_campaigns', label: 'Email Campaigns', description: 'Email campaign database' },
  { value: 'patient_data', label: 'Patient Data', description: 'Patient information database' },
  { value: 'appointment_data', label: 'Appointment Data', description: 'Appointment scheduling database' }
]

export function EmailDataSync() {
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([])
  const [syncSchedules, setSyncSchedules] = useState<SyncSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSource, setSelectedSource] = useState('all')
  const [selectedTarget, setSelectedTarget] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    loadSyncData()
  }, [])

  const loadSyncData = async () => {
    try {
      setLoading(true)
      const [jobsResponse, schedulesResponse] = await Promise.all([
        fetch('/api/admin/email/integrations/sync/jobs'),
        fetch('/api/admin/email/integrations/sync/schedules')
      ])
      
      const [jobsData, schedulesData] = await Promise.all([
        jobsResponse.json(),
        schedulesResponse.json()
      ])
      
      if (jobsData.success) {
        setSyncJobs(jobsData.data)
      }
      
      if (schedulesData.success) {
        setSyncSchedules(schedulesData.data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load sync data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartSync = async (syncType: string) => {
    try {
      const response = await fetch('/api/admin/email/integrations/sync/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sync_type: syncType })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Sync job started successfully'
        })
        loadSyncData()
      } else {
        throw new Error('Failed to start sync job')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start sync job',
        variant: 'destructive'
      })
    }
  }

  const handlePauseSync = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/email/integrations/sync/jobs/${jobId}/pause`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Sync job paused successfully'
        })
        loadSyncData()
      } else {
        throw new Error('Failed to pause sync job')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to pause sync job',
        variant: 'destructive'
      })
    }
  }

  const handleResumeSync = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/email/integrations/sync/jobs/${jobId}/resume`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Sync job resumed successfully'
        })
        loadSyncData()
      } else {
        throw new Error('Failed to resume sync job')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resume sync job',
        variant: 'destructive'
      })
    }
  }

  const handleRetrySync = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/email/integrations/sync/jobs/${jobId}/retry`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Sync job retried successfully'
        })
        loadSyncData()
      } else {
        throw new Error('Failed to retry sync job')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry sync job',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      running: { color: 'bg-blue-100 text-blue-800', icon: Activity },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: Pause }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getSyncTypeInfo = (type: string) => {
    return syncTypes.find(t => t.value === type) || syncTypes[0]
  }

  const getSourceInfo = (source: string) => {
    return syncSources.find(s => s.value === source) || syncSources[0]
  }

  const getTargetInfo = (target: string) => {
    return syncTargets.find(t => t.value === target) || syncTargets[0]
  }

  const filteredJobs = syncJobs.filter(job => {
    const sourceMatch = selectedSource === 'all' || job.source === selectedSource
    const targetMatch = selectedTarget === 'all' || job.target === selectedTarget
    const statusMatch = selectedStatus === 'all' || job.status === selectedStatus
    return sourceMatch && targetMatch && statusMatch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading sync data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Synchronization</h2>
          <p className="text-muted-foreground">
            Manage data synchronization between systems
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSyncData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => handleStartSync('full')}>
            <Play className="mr-2 h-4 w-4" />
            Start Full Sync
          </Button>
        </div>
      </div>

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sync Controls
          </CardTitle>
          <CardDescription>
            Start and manage data synchronization jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Source System</label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {syncSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target System</label>
              <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Targets</SelectItem>
                  {syncTargets.map((target) => (
                    <SelectItem key={target.value} value={target.value}>
                      {target.label}
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
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sync Jobs
          </CardTitle>
          <CardDescription>
            Current and recent synchronization jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source → Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => {
                const sourceInfo = getSourceInfo(job.source)
                const targetInfo = getTargetInfo(job.target)
                const typeInfo = getSyncTypeInfo(job.type)
                const successRate = job.records_processed > 0 
                  ? ((job.records_successful / job.records_processed) * 100).toFixed(1)
                  : '0.0'
                
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
                      <div className="text-sm">
                        <div className="font-medium">{sourceInfo.label}</div>
                        <div className="text-muted-foreground">→ {targetInfo.label}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(job.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{job.records_successful.toLocaleString()}</span>
                          <span className="text-muted-foreground">
                            of {job.records_processed.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              parseFloat(successRate) >= 90 ? 'bg-green-500' :
                              parseFloat(successRate) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {successRate}% success rate
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
                            onClick={() => handlePauseSync(job.id)}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {job.status === 'paused' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResumeSync(job.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {job.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetrySync(job.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
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

      {/* Sync Schedules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sync Schedules
          </CardTitle>
          <CardDescription>
            Automated synchronization schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Schedule Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    <div className="font-medium">{schedule.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {schedule.frequency.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {schedule.sync_type.charAt(0).toUpperCase() + schedule.sync_type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {schedule.is_active ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        <Pause className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(schedule.last_run).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(schedule.next_run).toLocaleString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sync Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              {syncJobs.filter(j => j.status === 'running').length} running
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records Synced</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncJobs.reduce((sum, j) => sum + j.records_successful, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
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
              {syncJobs.length > 0 
                ? (syncJobs.reduce((sum, j) => {
                    const rate = j.records_processed > 0 
                      ? (j.records_successful / j.records_processed) * 100
                      : 0
                    return sum + rate
                  }, 0) / syncJobs.length).toFixed(1)
                : '0.0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all jobs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncSchedules.filter(s => s.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {syncSchedules.length} total
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
