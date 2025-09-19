'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Bot, 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  Trash2, 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Zap,
  FileText,
  TrendingUp,
  Shield,
  Lock,
  Activity
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { AuthProvider, useAuth } from "@/components/providers/auth-provider"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { useRealtimeUpdates, RealtimeEvent } from "@/lib/services/real-time-updates"
import { AuditComplianceMonitor } from "./audit-compliance-monitor"
import { SystemStatusOverview } from "./system-status-overview"

// Enhanced types to match new database schema and security layer
interface BlogTopic {
  id: string
  title: string
  instructions?: string
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled'
  tone: 'professional' | 'empathetic' | 'educational' | 'conversational'
  priority: number
  category: 'health-conditions' | 'medical-technology' | 'patient-care' | 'prevention-wellness' | 'healthcare-trends'
  targetKeywords: string[]
  scheduledFor?: string
  authorId?: string
  createdAt: string
  updatedAt: string
}

interface AutomationMetrics {
  postsGenerated: number
  successRate: number
  averageGenerationTime: number
  lastRunTime: string
  nextScheduledRun: string
  errors: string[]
  queueLength: number
  // Enhanced metrics from new database
  dailyQuota: number
  quotaUsed: number
  activeGenerations: number
  failureRate: number
  complianceScore: number
}

interface SecurityStatus {
  csrfToken: string
  sessionValid: boolean
  permissions: string[]
  rateLimitRemaining: number
  auditEnabled: boolean
}

interface AutomationData {
  metrics: AutomationMetrics
  topics: BlogTopic[]
  schedule: {
    lastRunTime: string
    nextScheduledRun: string
    isEnabled: boolean
    frequency: string
    scheduledTime: string
  }
  security: SecurityStatus
  requestId?: string
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  requestId?: string
  rateLimitInfo?: {
    remaining: number
    resetTime: number
  }
}

interface GenerationProgress {
  id: string
  status: 'initializing' | 'researching' | 'writing' | 'optimizing' | 'finalizing'
  progress: number
  message: string
  startTime: number
}

function BlogAutomationDashboardComponent() {
  const { user, session, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [data, setData] = useState<AutomationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [newTopic, setNewTopic] = useState({
    title: '',
    instructions: '',
    tone: 'professional' as const,
    category: '' as 'health-conditions' | 'medical-technology' | 'patient-care' | 'prevention-wellness' | 'healthcare-trends' | '',
    targetKeywords: '',
    priority: 2
  })

  useEffect(() => {
    if (!authLoading && user) {
      loadData()
      // Set up polling for real-time updates with authentication
      const interval = setInterval(() => {
        if (session?.sessionValid) {
          loadData()
        }
      }, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }
  }, [authLoading, user, session])

  // Real-time updates integration
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    switch (event.type) {
      case 'generation_started':
        setIsGenerating(true)
        setGenerationProgress({
          id: event.data.generationId,
          status: 'initializing',
          progress: 10,
          message: 'Generation started...',
          startTime: Date.now()
        })
        toast({
          title: "Generation Started",
          description: "Blog post generation has begun",
          variant: "default"
        })
        break

      case 'generation_progress':
        setGenerationProgress(prev => prev ? {
          ...prev,
          status: event.data.status,
          progress: event.data.progress,
          message: event.data.message
        } : null)
        break

      case 'generation_completed':
        setIsGenerating(false)
        setGenerationProgress(prev => prev ? {
          ...prev,
          status: 'finalizing',
          progress: 100,
          message: 'Generation completed successfully!'
        } : null)
        toast({
          title: "Generation Complete",
          description: `Blog post "${event.data.title}" has been published`,
          variant: "default"
        })
        // Refresh data to show new post
        loadData()
        // Clear progress after delay
        setTimeout(() => setGenerationProgress(null), 3000)
        break

      case 'generation_failed':
        setIsGenerating(false)
        setGenerationProgress(null)
        setLastError(event.data.error || 'Generation failed')
        toast({
          title: "Generation Failed",
          description: event.data.error || 'An error occurred during generation',
          variant: "destructive"
        })
        break

      case 'topic_added':
        toast({
          title: "Topic Added",
          description: `Topic "${event.data.title}" added to queue`,
          variant: "default"
        })
        loadData()
        break

      case 'topic_removed':
        toast({
          title: "Topic Removed",
          description: "Topic removed from queue",
          variant: "default"
        })
        loadData()
        break

      case 'metrics_updated':
        // Update metrics without full reload
        setData(prev => prev ? {
          ...prev,
          metrics: { ...prev.metrics, ...event.data.metrics }
        } : null)
        break

      default:
        console.log('Unhandled realtime event:', event.type)
    }
  }, [toast, loadData])

  // Subscribe to real-time updates
  const { isConnected: realtimeConnected } = useRealtimeUpdates(
    'blog_automation',
    handleRealtimeEvent,
    [user?.id] // Re-subscribe if user changes
  )

  // Enhanced data loading with security integration
  const makeAuthenticatedRequest = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers as HeadersInit)
      }

      // Add CSRF token for state-changing operations
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET') && csrfToken) {
        headers['x-csrf-token'] = csrfToken
      }

      // Add session token if available
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`
      }

      const response = await fetch(url, {
        ...options,
        headers
      })

      // Extract CSRF token from response headers
      const newCsrfToken = response.headers.get('x-csrf-token')
      if (newCsrfToken) {
        setCsrfToken(newCsrfToken)
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after')
        throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`)
      }

      // Handle authentication errors
      if (response.status === 401) {
        // Session expired, trigger re-authentication
        throw new Error('Session expired. Please log in again.')
      }

      // Handle authorization errors
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Insufficient permissions')
      }

      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}`)
      }

      return {
        success: true,
        data: responseData,
        requestId: responseData.requestId
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed'
      }
    }
  }, [session, csrfToken])

  const loadData = async () => {
    try {
      setLastError(null)
      
      const [statusResult, scheduleResult] = await Promise.all([
        makeAuthenticatedRequest('/api/automation/blog/generate'),
        makeAuthenticatedRequest('/api/automation/blog/schedule')
      ])

      if (statusResult.success && scheduleResult.success) {
        const combinedData: AutomationData = {
          metrics: statusResult.data.metrics,
          topics: statusResult.data.topics,
          schedule: scheduleResult.data.schedule,
          security: {
            csrfToken: csrfToken || '',
            sessionValid: true,
            permissions: user?.permissions || [],
            rateLimitRemaining: statusResult.data.rateLimitInfo?.remaining || 0,
            auditEnabled: true
          },
          requestId: statusResult.requestId
        }
        
        setData(combinedData)
      } else {
        const error = statusResult.error || scheduleResult.error || 'Failed to load data'
        setLastError(error)
        toast({
          title: "Data Loading Failed",
          description: error,
          variant: "destructive"
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLastError(errorMessage)
      console.error('Failed to load automation data:', error)
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualGeneration = async () => {
    setIsGenerating(true)
    setGenerationProgress({
      id: `gen_${Date.now()}`,
      status: 'initializing',
      progress: 0,
      message: 'Starting blog generation...',
      startTime: Date.now()
    })
    
    try {
      const result = await makeAuthenticatedRequest('/api/automation/blog/generate', {
        method: 'POST',
        body: JSON.stringify({})
      })

      if (result.success) {
        setGenerationProgress(prev => prev ? {
          ...prev,
          status: 'finalizing',
          progress: 90,
          message: 'Generation completed successfully'
        } : null)
        
        toast({
          title: "Generation Successful",
          description: "Blog post generated and published",
          variant: "default"
        })
        
        await loadData() // Refresh data
      } else {
        throw new Error(result.error || 'Generation failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLastError(errorMessage)
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      })
      console.error('Generation error:', error)
    } finally {
      setIsGenerating(false)
      // Clear progress after delay
      setTimeout(() => setGenerationProgress(null), 3000)
    }
  }

  const handleAddTopic = async () => {
    if (!newTopic.title || !newTopic.category) {
      toast({
        title: "Validation Error",
        description: "Title and category are required",
        variant: "destructive"
      })
      return
    }
    
    try {
      const topicData = {
        ...newTopic,
        targetKeywords: newTopic.targetKeywords
          .split(',')
          .map(k => k.trim())
          .filter(k => k)
      }
      
      const result = await makeAuthenticatedRequest('/api/automation/blog/topics', {
        method: 'POST',
        body: JSON.stringify(topicData)
      })

      if (result.success) {
        setNewTopic({
          title: '',
          instructions: '',
          tone: 'professional',
          category: '',
          targetKeywords: '',
          priority: 2
        })
        setShowAddTopic(false)
        toast({
          title: "Topic Added",
          description: "Topic added to generation queue",
          variant: "default"
        })
        await loadData()
      } else {
        throw new Error(result.error || 'Failed to add topic')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast({
        title: "Failed to Add Topic",
        description: errorMessage,
        variant: "destructive"
      })
      console.error('Failed to add topic:', error)
    }
  }

  const handleRemoveTopic = async (topicId: string) => {
    try {
      const result = await makeAuthenticatedRequest(`/api/automation/blog/topics?id=${topicId}`, {
        method: 'DELETE'
      })

      if (result.success) {
        toast({
          title: "Topic Removed",
          description: "Topic removed from queue",
          variant: "default"
        })
        await loadData()
      } else {
        throw new Error(result.error || 'Failed to remove topic')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast({
        title: "Failed to Remove Topic",
        description: errorMessage,
        variant: "destructive"
      })
      console.error('Failed to remove topic:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'generating':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Show authentication loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Shield className="h-8 w-8 animate-pulse text-blue-600" />
        <span className="ml-2">Authenticating...</span>
      </div>
    )
  }

  // Show authentication required
  if (!user) {
    return (
      <div className="p-8">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Authentication required. Please log in to access the automation dashboard.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading automation dashboard...</span>
      </div>
    )
  }

  // Show error state with retry option
  if (!data || lastError) {
    return (
      <div className="p-8">
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {lastError || 'Failed to load automation data.'}
          </AlertDescription>
        </Alert>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Security Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            HMHCP Blog Automation System
            {data.security.auditEnabled && (
              <Badge variant="outline" className="ml-2 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                HIPAA Compliant
              </Badge>
            )}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-600">
              Secure internal automation system
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3" />
                User: {user.email}
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  realtimeConnected ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span className={realtimeConnected ? 'text-green-600' : 'text-yellow-600'}>
                  {realtimeConnected ? 'Real-time Connected' : 'Polling Mode'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleManualGeneration}
            disabled={isGenerating || !user.permissions.includes('blog.generate')}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Generate Now
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAddTopic(true)}
            disabled={!user.permissions.includes('automation.manage')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Topic
          </Button>
          <Button
            variant="ghost"
            onClick={loadData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Generation Progress */}
      {generationProgress && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-blue-900">Generating Blog Post</h3>
              <span className="text-sm text-blue-700">{generationProgress.progress}%</span>
            </div>
            <Progress value={generationProgress.progress} className="mb-2" />
            <p className="text-sm text-blue-800">{generationProgress.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Rate Limit Warning */}
      {data.security.rateLimitRemaining < 10 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Rate limit warning:</span> 
            Only {data.security.rateLimitRemaining} requests remaining in current window.
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Posts Generated</p>
                <p className="text-2xl font-bold">{data.metrics.postsGenerated}</p>
                <p className="text-xs text-gray-500">
                  Daily Quota: {data.metrics.quotaUsed}/{data.metrics.dailyQuota}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{data.metrics.successRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">
                  Compliance: {data.metrics.complianceScore}%
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${
                data.metrics.successRate >= 90 ? 'text-green-600' : 
                data.metrics.successRate >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Queue Status</p>
                <p className="text-2xl font-bold">{data.metrics.queueLength}</p>
                <p className="text-xs text-gray-500">
                  Active: {data.metrics.activeGenerations}
                </p>
              </div>
              <Clock className={`h-8 w-8 ${
                data.metrics.activeGenerations > 0 ? 'text-blue-600 animate-pulse' : 'text-yellow-600'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Next Run</p>
                <p className="text-sm font-medium">
                  {new Date(data.schedule.nextScheduledRun).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(data.schedule.nextScheduledRun).toLocaleTimeString()}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automation Schedule
          </CardTitle>
          <CardDescription>
            Daily blog post generation at {data.schedule.scheduledTime}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={data.schedule.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {data.schedule.isEnabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Last Run</Label>
              <p className="text-sm mt-1">
                {new Date(data.schedule.lastRunTime).toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Frequency</Label>
              <p className="text-sm mt-1 capitalize">{data.schedule.frequency}</p>
            </div>
          </div>

          {/* Enhanced Error Display */}
          {data.metrics.errors.length > 0 && (
            <div className="mt-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-800">Recent Errors ({data.metrics.errors.length}):</span>
                    <span className="text-xs text-red-600">
                      Failure Rate: {data.metrics.failureRate.toFixed(1)}%
                    </span>
                  </div>
                  <ul className="mt-2 text-xs text-red-700 space-y-1">
                    {data.metrics.errors.slice(-3).map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                  {data.metrics.errors.length > 3 && (
                    <p className="text-xs text-red-600 mt-1">
                      ... and {data.metrics.errors.length - 3} more errors
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Topic Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Topic Queue ({data.topics.length})
          </CardTitle>
          <CardDescription>
            Manage blog topics for automated generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topics.map((topic) => (
              <div key={topic.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium">{topic.title}</h4>
                    <Badge variant="outline" className={getStatusColor(topic.status)}>
                      {getStatusIcon(topic.status)}
                      {topic.status}
                    </Badge>
                    <Badge variant="outline" className={`${
                      topic.priority === 1 ? 'bg-red-100 text-red-800' :
                      topic.priority === 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      Priority {topic.priority}
                    </Badge>
                    {topic.authorId === user.id && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Your Topic
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 flex-wrap">
                    <span>Category: {topic.category.replace('-', ' ')}</span>
                    <span>Tone: {topic.tone}</span>
                    <span>Keywords: {topic.targetKeywords.length}</span>
                    {topic.scheduledFor && (
                      <span>Scheduled: {new Date(topic.scheduledFor).toLocaleDateString()}</span>
                    )}
                  </div>
                  {topic.instructions && user.permissions.includes('blog.view_all') && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {topic.instructions}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span>Created: {new Date(topic.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(topic.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {topic.status === 'generating' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {/* TODO: Cancel generation */}}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTopic(topic.id)}
                    disabled={topic.status === 'generating' || !user.permissions.includes('automation.manage')}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {data.topics.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No topics in queue. Add topics to start automated generation.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Status Overview */}
      {user.permissions.includes('admin.full') && (
        <SystemStatusOverview />
      )}

      {/* Audit & Compliance Monitor */}
      {user.permissions.includes('audit.view') && (
        <AuditComplianceMonitor 
          showDetailed={user.permissions.includes('admin.full')}
          className="mt-6"
        />
      )}

      {/* Add Topic Modal */}
      {showAddTopic && (
        <Card className="fixed inset-0 z-50 m-4 max-w-2xl mx-auto my-8 max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <CardTitle>Add New Blog Topic</CardTitle>
            <CardDescription>
              Configure a new topic for automated blog generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newTopic.title}
                onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                placeholder="Enter blog post title"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={newTopic.category}
                onValueChange={(value) => setNewTopic({ ...newTopic, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health-conditions">Health Conditions</SelectItem>
                  <SelectItem value="medical-technology">Medical Technology</SelectItem>
                  <SelectItem value="patient-care">Patient Care</SelectItem>
                  <SelectItem value="prevention-wellness">Prevention & Wellness</SelectItem>
                  <SelectItem value="healthcare-trends">Healthcare Trends</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tone">Tone</Label>
                <Select
                  value={newTopic.tone}
                  onValueChange={(value) => setNewTopic({ ...newTopic, tone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="empathetic">Empathetic</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTopic.priority.toString()}
                  onValueChange={(value) => setNewTopic({ ...newTopic, priority: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - High</SelectItem>
                    <SelectItem value="2">2 - Medium</SelectItem>
                    <SelectItem value="3">3 - Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="keywords">Target Keywords</Label>
              <Input
                id="keywords"
                value={newTopic.targetKeywords}
                onChange={(e) => setNewTopic({ ...newTopic, targetKeywords: e.target.value })}
                placeholder="Enter keywords separated by commas"
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={newTopic.instructions}
                onChange={(e) => setNewTopic({ ...newTopic, instructions: e.target.value })}
                placeholder="Specific instructions for content generation"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddTopic(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddTopic}
                disabled={!newTopic.title || !newTopic.category}
              >
                Add Topic
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backdrop for modal */}
      {showAddTopic && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowAddTopic(false)}
        />
      )}
    </div>
  )
}

// Main exported component with providers
export function BlogAutomationDashboard() {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="p-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-red-800">Dashboard Error</p>
                <p className="text-sm text-red-700">
                  {error.message || 'An unexpected error occurred'}
                </p>
                <Button 
                  onClick={resetError} 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    >
      <AuthProvider>
        <BlogAutomationDashboardComponent />
      </AuthProvider>
    </ErrorBoundary>
  )
}