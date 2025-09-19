'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bot,
  Brain,
  Cpu,
  Database,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Settings,
  TrendingUp,
  Users,
  FileText,
  Shield,
  Eye,
  MessageSquare,
  Workflow,
  RefreshCw,
  BarChart3,
  Server,
  Network
} from 'lucide-react'

interface AgentMetrics {
  processingTime: number
  successRate: number
  throughput: number
  errorRate: number
  memoryUsage: number
  cpuUsage: number
  queueLength: number
  totalRequests: number
}

interface AgentTask {
  id: string
  type: 'content-generation' | 'validation' | 'analysis' | 'moderation'
  status: 'queued' | 'processing' | 'completed' | 'failed'
  priority: 'low' | 'normal' | 'high' | 'critical'
  startedAt?: string
  completedAt?: string
  duration?: number
  inputSize: number
  outputSize?: number
  errorMessage?: string
}

interface AIAgent {
  id: string
  name: string
  type: 'content-generator' | 'medical-validator' | 'quality-analyzer' | 'compliance-checker' | 'content-moderator'
  status: 'active' | 'idle' | 'busy' | 'error' | 'offline'
  version: string
  model: string
  endpoint: string
  lastHeartbeat: string
  uptime: number
  metrics: AgentMetrics
  currentTask?: AgentTask
  recentTasks: AgentTask[]
  configuration: {
    maxConcurrentTasks: number
    timeoutMs: number
    retryAttempts: number
    modelParameters: Record<string, any>
  }
  healthcheck: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    lastCheck: string
    response_time: number
    issues: string[]
  }
}

interface PipelineStage {
  id: string
  name: string
  agents: string[]
  status: 'active' | 'paused' | 'error'
  throughput: number
  bottleneck: boolean
}

export default function AIAgentMonitor() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [pipeline, setPipeline] = useState<PipelineStage[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5000)

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockAgents: AIAgent[] = [
      {
        id: 'agent-1',
        name: 'Healthcare Content Generator',
        type: 'content-generator',
        status: 'busy',
        version: '2.1.0',
        model: 'gpt-4-healthcare',
        endpoint: 'https://api.healthcare-ai.com/generate',
        lastHeartbeat: new Date().toISOString(),
        uptime: 98.7,
        metrics: {
          processingTime: 2340,
          successRate: 97.8,
          throughput: 145,
          errorRate: 2.2,
          memoryUsage: 78.5,
          cpuUsage: 45.2,
          queueLength: 12,
          totalRequests: 8924
        },
        currentTask: {
          id: 'task-1',
          type: 'content-generation',
          status: 'processing',
          priority: 'high',
          startedAt: '2025-01-20T10:35:00Z',
          inputSize: 2048
        },
        recentTasks: [
          {
            id: 'task-2',
            type: 'content-generation',
            status: 'completed',
            priority: 'normal',
            startedAt: '2025-01-20T10:30:00Z',
            completedAt: '2025-01-20T10:32:15Z',
            duration: 135000,
            inputSize: 1024,
            outputSize: 3072
          }
        ],
        configuration: {
          maxConcurrentTasks: 5,
          timeoutMs: 30000,
          retryAttempts: 3,
          modelParameters: {
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 0.9
          }
        },
        healthcheck: {
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          response_time: 124,
          issues: []
        }
      },
      {
        id: 'agent-2',
        name: 'Medical Accuracy Validator',
        type: 'medical-validator',
        status: 'active',
        version: '1.8.2',
        model: 'medical-validator-v2',
        endpoint: 'https://api.healthcare-ai.com/validate',
        lastHeartbeat: new Date().toISOString(),
        uptime: 99.2,
        metrics: {
          processingTime: 890,
          successRate: 99.1,
          throughput: 234,
          errorRate: 0.9,
          memoryUsage: 62.3,
          cpuUsage: 32.1,
          queueLength: 5,
          totalRequests: 12456
        },
        recentTasks: [
          {
            id: 'task-3',
            type: 'validation',
            status: 'completed',
            priority: 'high',
            startedAt: '2025-01-20T10:33:00Z',
            completedAt: '2025-01-20T10:33:45Z',
            duration: 45000,
            inputSize: 4096,
            outputSize: 512
          }
        ],
        configuration: {
          maxConcurrentTasks: 8,
          timeoutMs: 15000,
          retryAttempts: 2,
          modelParameters: {
            confidence_threshold: 0.85,
            strict_mode: true
          }
        },
        healthcheck: {
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          response_time: 89,
          issues: []
        }
      },
      {
        id: 'agent-3',
        name: 'Content Quality Analyzer',
        type: 'quality-analyzer',
        status: 'error',
        version: '1.5.1',
        model: 'quality-analyzer-v1',
        endpoint: 'https://api.healthcare-ai.com/analyze',
        lastHeartbeat: '2025-01-20T10:25:00Z',
        uptime: 87.3,
        metrics: {
          processingTime: 1567,
          successRate: 94.5,
          throughput: 89,
          errorRate: 5.5,
          memoryUsage: 91.2,
          cpuUsage: 78.9,
          queueLength: 23,
          totalRequests: 5678
        },
        recentTasks: [
          {
            id: 'task-4',
            type: 'analysis',
            status: 'failed',
            priority: 'normal',
            startedAt: '2025-01-20T10:20:00Z',
            inputSize: 2048,
            errorMessage: 'Memory allocation failed - insufficient resources'
          }
        ],
        configuration: {
          maxConcurrentTasks: 3,
          timeoutMs: 45000,
          retryAttempts: 5,
          modelParameters: {
            analysis_depth: 'comprehensive',
            include_readability: true
          }
        },
        healthcheck: {
          status: 'unhealthy',
          lastCheck: '2025-01-20T10:30:00Z',
          response_time: 5600,
          issues: [
            'High memory usage detected',
            'Response time above threshold',
            'Multiple task failures'
          ]
        }
      }
    ]

    const mockPipeline: PipelineStage[] = [
      {
        id: 'stage-1',
        name: 'Content Research',
        agents: ['agent-1'],
        status: 'active',
        throughput: 145,
        bottleneck: false
      },
      {
        id: 'stage-2',
        name: 'Content Generation',
        agents: ['agent-1'],
        status: 'active',
        throughput: 145,
        bottleneck: false
      },
      {
        id: 'stage-3',
        name: 'Medical Validation',
        agents: ['agent-2'],
        status: 'active',
        throughput: 234,
        bottleneck: false
      },
      {
        id: 'stage-4',
        name: 'Quality Analysis',
        agents: ['agent-3'],
        status: 'error',
        throughput: 45,
        bottleneck: true
      },
      {
        id: 'stage-5',
        name: 'Final Review',
        agents: ['agent-2'],
        status: 'paused',
        throughput: 0,
        bottleneck: true
      }
    ]

    setAgents(mockAgents)
    setSelectedAgent(mockAgents[0])
    setPipeline(mockPipeline)

    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        setAgents(prev => prev.map(agent => ({
          ...agent,
          lastHeartbeat: new Date().toISOString(),
          metrics: {
            ...agent.metrics,
            queueLength: Math.max(0, agent.metrics.queueLength + (Math.random() - 0.5) * 4),
            cpuUsage: Math.max(0, Math.min(100, agent.metrics.cpuUsage + (Math.random() - 0.5) * 10)),
            memoryUsage: Math.max(0, Math.min(100, agent.metrics.memoryUsage + (Math.random() - 0.5) * 5))
          }
        })))
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'busy': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'idle': return <Clock className="h-4 w-4 text-gray-400" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'offline': return <AlertTriangle className="h-4 w-4 text-gray-500" />
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'busy': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'idle': return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'offline': return 'bg-gray-200 text-gray-700 border-gray-300'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content-generator': return <FileText className="h-4 w-4" />
      case 'medical-validator': return <Shield className="h-4 w-4" />
      case 'quality-analyzer': return <Eye className="h-4 w-4" />
      case 'compliance-checker': return <CheckCircle2 className="h-4 w-4" />
      case 'content-moderator': return <MessageSquare className="h-4 w-4" />
      default: return <Bot className="h-4 w-4" />
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

  const handleAgentAction = (action: string, agentId: string) => {
    console.log(`${action} agent:`, agentId)
    // Implement agent control actions
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Agent Monitor
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring and management of AI agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="text-sm border rounded px-2 py-1"
          >
            <option value={1000}>1s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter(a => ['active', 'busy'].includes(a.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {agents.length} total agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Throughput</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((sum, agent) => sum + agent.metrics.throughput, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              requests/hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Length</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((sum, agent) => sum + agent.metrics.queueLength, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              pending tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(agents.reduce((sum, agent) => sum + agent.uptime, 0) / agents.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              average uptime
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">Agent Status</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agent List */}
            <Card>
              <CardHeader>
                <CardTitle>AI Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {agents.map(agent => (
                      <div
                        key={agent.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAgent?.id === agent.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(agent.type)}
                            <div>
                              <div className="font-medium text-sm">{agent.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {agent.model} v{agent.version}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(agent.status)}
                            <Badge className={`text-xs ${getStatusColor(agent.status)}`}>
                              {agent.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <div className="font-medium">{agent.metrics.throughput}</div>
                            <div className="text-muted-foreground">req/hr</div>
                          </div>
                          <div>
                            <div className="font-medium">{agent.metrics.successRate}%</div>
                            <div className="text-muted-foreground">success</div>
                          </div>
                          <div>
                            <div className="font-medium">{agent.metrics.queueLength}</div>
                            <div className="text-muted-foreground">queued</div>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>CPU Usage</span>
                            <span>{agent.metrics.cpuUsage.toFixed(1)}%</span>
                          </div>
                          <Progress value={agent.metrics.cpuUsage} className="h-1" />
                        </div>

                        <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                          <span className={getHealthColor(agent.healthcheck.status)}>
                            {agent.healthcheck.status}
                          </span>
                          <span>
                            Last seen: {new Date(agent.lastHeartbeat).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Agent Details */}
            {selectedAgent && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getTypeIcon(selectedAgent.type)}
                      {selectedAgent.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(selectedAgent.status)}>
                        {selectedAgent.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Task */}
                  {selectedAgent.currentTask && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Current Task</h4>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm capitalize">
                            {selectedAgent.currentTask.type.replace('-', ' ')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Started: {new Date(selectedAgent.currentTask.startedAt!).toLocaleTimeString()}
                          </div>
                        </div>
                        <Badge className={getStatusColor(selectedAgent.currentTask.status)}>
                          {selectedAgent.currentTask.status}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span className="font-medium">{selectedAgent.metrics.successRate}%</span>
                      </div>
                      <Progress value={selectedAgent.metrics.successRate} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uptime</span>
                        <span className="font-medium">{selectedAgent.uptime}%</span>
                      </div>
                      <Progress value={selectedAgent.uptime} className="h-2" />
                    </div>
                  </div>

                  {/* Resource Usage */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <span className="font-medium">{selectedAgent.metrics.memoryUsage.toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedAgent.metrics.memoryUsage} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>CPU Usage</span>
                        <span className="font-medium">{selectedAgent.metrics.cpuUsage.toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedAgent.metrics.cpuUsage} className="h-2" />
                    </div>
                  </div>

                  {/* Health Status */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Health Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Status</span>
                        <span className={`text-sm font-medium ${getHealthColor(selectedAgent.healthcheck.status)}`}>
                          {selectedAgent.healthcheck.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Response Time</span>
                        <span className="text-sm font-medium">{selectedAgent.healthcheck.response_time}ms</span>
                      </div>
                      {selectedAgent.healthcheck.issues.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-1">Issues:</div>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {selectedAgent.healthcheck.issues.map((issue, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Tasks */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Recent Tasks</h4>
                    <div className="space-y-2">
                      {selectedAgent.recentTasks.slice(0, 3).map(task => (
                        <div key={task.id} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div>
                            <div className="text-sm capitalize">
                              {task.type.replace('-', ' ')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {task.completedAt ? formatDuration(task.duration!) : 'In progress'}
                            </div>
                          </div>
                          <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                            {task.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline" onClick={() => handleAgentAction('restart', selectedAgent.id)}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restart
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAgentAction('pause', selectedAgent.id)}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAgentAction('configure', selectedAgent.id)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Content Pipeline Visualization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-50 rounded-lg p-6" style={{ height: '400px' }}>
                <div className="flex items-center justify-between h-full">
                  {pipeline.map((stage, index) => (
                    <div key={stage.id} className="flex items-center">
                      <div className={`
                        relative p-4 rounded-lg border-2 text-center min-w-32
                        ${stage.status === 'active' ? 'bg-green-100 border-green-300' : ''}
                        ${stage.status === 'paused' ? 'bg-yellow-100 border-yellow-300' : ''}
                        ${stage.status === 'error' ? 'bg-red-100 border-red-300' : ''}
                        ${stage.bottleneck ? 'ring-2 ring-red-400 ring-opacity-50' : ''}
                      `}>
                        <div className="font-medium text-sm mb-1">{stage.name}</div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {stage.agents.length} agent{stage.agents.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-lg font-bold">
                          {stage.throughput}
                        </div>
                        <div className="text-xs text-muted-foreground">req/hr</div>
                        {stage.bottleneck && (
                          <div className="absolute -top-2 -right-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          </div>
                        )}
                      </div>
                      {index < pipeline.length - 1 && (
                        <div className="flex items-center mx-4">
                          <div className="w-8 h-0.5 bg-gray-400"></div>
                          <div className="w-0 h-0 border-l-4 border-l-gray-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipeline Issues */}
              {pipeline.some(stage => stage.bottleneck) && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Pipeline Bottleneck Detected</AlertTitle>
                  <AlertDescription>
                    Performance issues detected in the content pipeline. 
                    Check the highlighted stages for optimization opportunities.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Performance charts and analytics will be displayed here</p>
                <p className="text-sm mt-2">
                  Including throughput trends, response time distributions, and resource utilization
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Agent Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Agent configuration panels will be displayed here</p>
                <p className="text-sm mt-2">
                  Including model parameters, resource limits, and scaling policies
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}