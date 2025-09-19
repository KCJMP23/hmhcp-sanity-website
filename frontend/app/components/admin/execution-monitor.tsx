'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Play,
  Pause,
  Square,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Zap,
  TrendingUp,
  Activity,
  FileJson,
  Terminal,
  Eye,
  Download
} from 'lucide-react'

interface ExecutionLog {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  stepId?: string
  stepName?: string
  data?: any
  duration?: number
  memoryUsage?: number
}

interface ExecutionMetrics {
  totalDuration: number
  operationsCount: number
  dataProcessed: number
  memoryPeak: number
  successRate: number
  errorCount: number
  averageStepDuration: number
}

interface ExecutionStep {
  id: string
  name: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startTime?: string
  endTime?: string
  duration?: number
  inputData?: any
  outputData?: any
  errorDetails?: {
    message: string
    stack?: string
    code?: string
  }
  metrics?: {
    operationsUsed: number
    dataSize: number
    memoryUsage: number
  }
  logs: ExecutionLog[]
}

interface WorkflowExecution {
  id: string
  workflowId: string
  workflowName: string
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled'
  startTime: string
  endTime?: string
  triggeredBy: string
  steps: ExecutionStep[]
  metrics: ExecutionMetrics
  globalLogs: ExecutionLog[]
}

export default function ExecutionMonitor() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null)
  const [selectedStep, setSelectedStep] = useState<ExecutionStep | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'debug'>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockExecution: WorkflowExecution = {
      id: 'exec-1',
      workflowId: 'wf-1',
      workflowName: 'Healthcare Content Generation Pipeline',
      status: 'running',
      startTime: '2025-01-20T10:30:00Z',
      triggeredBy: 'Manual',
      steps: [
        {
          id: 'step-1',
          name: 'Content Research',
          type: 'ai-agent',
          status: 'completed',
          startTime: '2025-01-20T10:30:00Z',
          endTime: '2025-01-20T10:30:45Z',
          duration: 45000,
          inputData: { topic: 'Heart Health', audience: 'General' },
          outputData: { research_summary: 'Comprehensive overview of heart health topics...' },
          metrics: {
            operationsUsed: 5,
            dataSize: 2048,
            memoryUsage: 128
          },
          logs: [
            {
              id: 'log-1',
              timestamp: '2025-01-20T10:30:05Z',
              level: 'info',
              message: 'Starting content research for heart health topics',
              stepId: 'step-1'
            },
            {
              id: 'log-2',
              timestamp: '2025-01-20T10:30:25Z',
              level: 'info',
              message: 'Retrieved 15 relevant medical sources',
              stepId: 'step-1',
              data: { sources: 15 }
            },
            {
              id: 'log-3',
              timestamp: '2025-01-20T10:30:45Z',
              level: 'info',
              message: 'Research completed successfully',
              stepId: 'step-1'
            }
          ]
        },
        {
          id: 'step-2',
          name: 'AI Content Generation',
          type: 'ai-agent',
          status: 'running',
          startTime: '2025-01-20T10:30:50Z',
          inputData: { research_data: '...', tone: 'informative', word_count: 800 },
          metrics: {
            operationsUsed: 3,
            dataSize: 1024,
            memoryUsage: 256
          },
          logs: [
            {
              id: 'log-4',
              timestamp: '2025-01-20T10:30:50Z',
              level: 'info',
              message: 'Initializing AI content generation',
              stepId: 'step-2'
            },
            {
              id: 'log-5',
              timestamp: '2025-01-20T10:31:10Z',
              level: 'debug',
              message: 'Generated 400 words so far',
              stepId: 'step-2'
            }
          ]
        },
        {
          id: 'step-3',
          name: 'Medical Compliance Check',
          type: 'validation',
          status: 'pending',
          logs: []
        },
        {
          id: 'step-4',
          name: 'Quality Assessment',
          type: 'validation',
          status: 'pending',
          logs: []
        },
        {
          id: 'step-5',
          name: 'Content Publishing',
          type: 'action',
          status: 'pending',
          logs: []
        }
      ],
      metrics: {
        totalDuration: 95000,
        operationsCount: 8,
        dataProcessed: 3072,
        memoryPeak: 384,
        successRate: 100,
        errorCount: 0,
        averageStepDuration: 22500
      },
      globalLogs: [
        {
          id: 'global-1',
          timestamp: '2025-01-20T10:30:00Z',
          level: 'info',
          message: 'Workflow execution started'
        },
        {
          id: 'global-2',
          timestamp: '2025-01-20T10:30:02Z',
          level: 'info',
          message: 'Environment validated successfully'
        }
      ]
    }

    setExecutions([mockExecution])
    setSelectedExecution(mockExecution)

    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        setExecutions(prev => prev.map(exec => ({
          ...exec,
          globalLogs: [
            ...exec.globalLogs,
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              level: 'debug',
              message: `Heartbeat - execution still running`
            }
          ]
        })))
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />
      case 'cancelled': return <Square className="h-4 w-4 text-gray-500" />
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />
      case 'skipped': return <ChevronRight className="h-4 w-4 text-gray-400" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled': return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'pending': return 'bg-gray-50 text-gray-500 border-gray-200'
      case 'skipped': return 'bg-gray-50 text-gray-400 border-gray-200'
      default: return 'bg-gray-50 text-gray-500 border-gray-200'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-3 w-3 text-red-500" />
      case 'warning': return <AlertTriangle className="h-3 w-3 text-yellow-500" />
      case 'info': return <CheckCircle2 className="h-3 w-3 text-blue-500" />
      case 'debug': return <Terminal className="h-3 w-3 text-gray-500" />
      default: return <CheckCircle2 className="h-3 w-3 text-blue-500" />
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const toggleStepExpanded = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const filterLogs = (logs: ExecutionLog[]) => {
    if (logFilter === 'all') return logs
    return logs.filter(log => log.level === logFilter)
  }

  if (!selectedExecution) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No execution selected</p>
      </div>
    )
  }

  const completedSteps = selectedExecution.steps.filter(s => s.status === 'completed').length
  const progressPercent = (completedSteps / selectedExecution.steps.length) * 100

  return (
    <div className="space-y-6">
      {/* Execution Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                {getStatusIcon(selectedExecution.status)}
                {selectedExecution.workflowName}
              </CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                Execution ID: {selectedExecution.id} | 
                Started: {new Date(selectedExecution.startTime).toLocaleString()} | 
                Triggered by: {selectedExecution.triggeredBy}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(selectedExecution.status)}>
                {selectedExecution.status}
              </Badge>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{selectedExecution.metrics.operationsCount}</div>
              <div className="text-xs text-muted-foreground">Operations</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{formatBytes(selectedExecution.metrics.dataProcessed)}</div>
              <div className="text-xs text-muted-foreground">Data Processed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{formatBytes(selectedExecution.metrics.memoryPeak)}</div>
              <div className="text-xs text-muted-foreground">Peak Memory</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{selectedExecution.metrics.successRate}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{formatDuration(selectedExecution.metrics.totalDuration)}</div>
              <div className="text-xs text-muted-foreground">Total Duration</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{completedSteps}/{selectedExecution.steps.length} steps completed</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Steps Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Execution Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {selectedExecution.steps.map((step, index) => (
                  <div key={step.id} className="relative">
                    {index < selectedExecution.steps.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200" />
                    )}
                    
                    <Collapsible
                      open={expandedSteps.has(step.id)}
                      onOpenChange={() => toggleStepExpanded(step.id)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 text-left">
                          <div className="flex-shrink-0 mt-0.5">
                            {getStatusIcon(step.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{step.name}</h4>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getStatusColor(step.status)}`}>
                                  {step.status}
                                </Badge>
                                {step.duration && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDuration(step.duration)}
                                  </span>
                                )}
                                <ChevronDown 
                                  className={`h-4 w-4 transition-transform ${
                                    expandedSteps.has(step.id) ? 'rotate-180' : ''
                                  }`} 
                                />
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 capitalize">
                              {step.type}
                              {step.startTime && (
                                <span> • Started: {new Date(step.startTime).toLocaleTimeString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="ml-12 mr-3 mb-3 space-y-3">
                          {/* Step Metrics */}
                          {step.metrics && (
                            <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg text-xs">
                              <div>
                                <div className="font-medium">{step.metrics.operationsUsed}</div>
                                <div className="text-muted-foreground">Operations</div>
                              </div>
                              <div>
                                <div className="font-medium">{formatBytes(step.metrics.dataSize)}</div>
                                <div className="text-muted-foreground">Data Size</div>
                              </div>
                              <div>
                                <div className="font-medium">{formatBytes(step.metrics.memoryUsage)}</div>
                                <div className="text-muted-foreground">Memory</div>
                              </div>
                            </div>
                          )}

                          {/* Step Logs */}
                          {step.logs.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-xs">Logs</h5>
                              <div className="space-y-1">
                                {filterLogs(step.logs).slice(-5).map(log => (
                                  <div key={log.id} className="flex items-start gap-2 text-xs p-2 bg-white rounded border">
                                    {getLevelIcon(log.level)}
                                    <div className="flex-1">
                                      <div className="flex justify-between">
                                        <span>{log.message}</span>
                                        <span className="text-muted-foreground">
                                          {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                      </div>
                                      {log.data && (
                                        <pre className="mt-1 text-xs text-muted-foreground">
                                          {JSON.stringify(log.data, null, 2)}
                                        </pre>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Error Details */}
                          {step.errorDetails && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <div className="font-medium">{step.errorDetails.message}</div>
                                {step.errorDetails.code && (
                                  <div className="text-xs mt-1">Code: {step.errorDetails.code}</div>
                                )}
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Input/Output Data */}
                          <div className="grid grid-cols-2 gap-3">
                            {step.inputData && (
                              <div>
                                <h6 className="font-medium text-xs mb-1">Input Data</h6>
                                <pre className="text-xs p-2 bg-gray-100 rounded overflow-auto max-h-20">
                                  {JSON.stringify(step.inputData, null, 2)}
                                </pre>
                              </div>
                            )}
                            {step.outputData && (
                              <div>
                                <h6 className="font-medium text-xs mb-1">Output Data</h6>
                                <pre className="text-xs p-2 bg-gray-100 rounded overflow-auto max-h-20">
                                  {JSON.stringify(step.outputData, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Live Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Live Logs
              </CardTitle>
              <div className="flex items-center gap-2">
                <select 
                  value={logFilter} 
                  onChange={(e) => setLogFilter(e.target.value as any)}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="all">All Levels</option>
                  <option value="error">Errors</option>
                  <option value="warning">Warnings</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
                <Button 
                  size="sm" 
                  variant={autoRefresh ? "default" : "outline"}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
                  Auto Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-1 font-mono text-xs">
                {filterLogs([
                  ...selectedExecution.globalLogs,
                  ...selectedExecution.steps.flatMap(step => step.logs)
                ]).slice(-50).map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded">
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {getLevelIcon(log.level)}
                    <span className="flex-1">
                      {log.stepName && (
                        <span className="text-blue-600">[{log.stepName}] </span>
                      )}
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}