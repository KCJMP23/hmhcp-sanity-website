'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Mail,
  MessageSquare,
  Smartphone,
  Settings,
  Clock,
  Trash2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Filter,
  Search,
  RefreshCw,
  Zap,
  Shield,
  Bot,
  Activity,
  Server,
  Database
} from 'lucide-react'

interface AlertRule {
  id: string
  name: string
  category: 'system' | 'agent' | 'workflow' | 'compliance' | 'performance'
  condition: string
  threshold: number | string
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  channels: ('email' | 'sms' | 'webhook' | 'dashboard')[]
  recipients: string[]
  cooldownMinutes: number
  lastTriggered?: string
}

interface NotificationAlert {
  id: string
  ruleId: string
  ruleName: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  metadata?: Record<string, any>
  actions?: {
    label: string
    action: string
    variant?: 'default' | 'destructive' | 'outline'
  }[]
}

interface NotificationChannel {
  id: string
  type: 'email' | 'sms' | 'webhook' | 'dashboard'
  name: string
  enabled: boolean
  configuration: Record<string, any>
  lastUsed?: string
  deliveryRate: number
}

export default function AlertNotificationSystem() {
  const [alerts, setAlerts] = useState<NotificationAlert[]>([])
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [channels, setChannels] = useState<NotificationChannel[]>([])
  const [selectedAlert, setSelectedAlert] = useState<NotificationAlert | null>(null)
  const [filter, setFilter] = useState<{
    severity?: string
    category?: string
    acknowledged?: boolean
    resolved?: boolean
    search?: string
  }>({})
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockAlerts: NotificationAlert[] = [
      {
        id: 'alert-1',
        ruleId: 'rule-1',
        ruleName: 'High Memory Usage',
        category: 'system',
        severity: 'critical',
        title: 'Memory Usage Critical',
        message: 'Content Quality Analyzer agent memory usage exceeded 90% for 5 minutes',
        timestamp: '2025-01-20T10:35:00Z',
        acknowledged: false,
        resolved: false,
        metadata: {
          agent: 'Content Quality Analyzer',
          memoryUsage: 91.2,
          threshold: 90
        },
        actions: [
          { label: 'Restart Agent', action: 'restart-agent', variant: 'destructive' },
          { label: 'Scale Resources', action: 'scale-resources', variant: 'default' }
        ]
      },
      {
        id: 'alert-2',
        ruleId: 'rule-2',
        ruleName: 'Compliance Violation',
        category: 'compliance',
        severity: 'high',
        title: 'HIPAA Compliance Check Failed',
        message: 'Content validation detected potential PHI in submitted content',
        timestamp: '2025-01-20T10:25:00Z',
        acknowledged: true,
        acknowledgedBy: 'admin@example.com',
        acknowledgedAt: '2025-01-20T10:27:00Z',
        resolved: false,
        metadata: {
          contentId: 'content-456',
          contentTitle: 'Patient Care Guidelines',
          violationType: 'PHI_DETECTED'
        },
        actions: [
          { label: 'Review Content', action: 'review-content', variant: 'default' },
          { label: 'Block Publication', action: 'block-publication', variant: 'destructive' }
        ]
      },
      {
        id: 'alert-3',
        ruleId: 'rule-3',
        ruleName: 'Agent Performance Degradation',
        category: 'performance',
        severity: 'medium',
        title: 'Response Time Increased',
        message: 'Medical Validator agent response time increased by 40% over last hour',
        timestamp: '2025-01-20T10:15:00Z',
        acknowledged: true,
        acknowledgedBy: 'admin@example.com',
        acknowledgedAt: '2025-01-20T10:20:00Z',
        resolved: true,
        resolvedBy: 'admin@example.com',
        resolvedAt: '2025-01-20T10:30:00Z',
        metadata: {
          agent: 'Medical Validator',
          avgResponseTime: 1250,
          previousAvg: 890
        }
      },
      {
        id: 'alert-4',
        ruleId: 'rule-4',
        ruleName: 'Workflow Execution Failed',
        category: 'workflow',
        severity: 'high',
        title: 'Content Pipeline Failure',
        message: 'Healthcare Content Generation Pipeline failed in Quality Assessment step',
        timestamp: '2025-01-20T09:45:00Z',
        acknowledged: true,
        acknowledgedBy: 'admin@example.com',
        acknowledgedAt: '2025-01-20T09:50:00Z',
        resolved: true,
        resolvedBy: 'admin@example.com',
        resolvedAt: '2025-01-20T10:05:00Z',
        metadata: {
          workflowId: 'wf-123',
          executionId: 'exec-456',
          failedStep: 'Quality Assessment',
          errorCode: 'MEMORY_ALLOCATION_FAILED'
        }
      }
    ]

    const mockRules: AlertRule[] = [
      {
        id: 'rule-1',
        name: 'High Memory Usage',
        category: 'system',
        condition: 'memory_usage > threshold',
        threshold: 90,
        severity: 'critical',
        enabled: true,
        channels: ['email', 'dashboard'],
        recipients: ['admin@example.com', 'ops@example.com'],
        cooldownMinutes: 15,
        lastTriggered: '2025-01-20T10:35:00Z'
      },
      {
        id: 'rule-2',
        name: 'Compliance Violation',
        category: 'compliance',
        condition: 'compliance_check == failed',
        threshold: 'any',
        severity: 'high',
        enabled: true,
        channels: ['email', 'sms', 'dashboard'],
        recipients: ['admin@example.com', 'compliance@example.com'],
        cooldownMinutes: 0
      },
      {
        id: 'rule-3',
        name: 'Agent Performance Degradation',
        category: 'performance',
        condition: 'response_time_increase > threshold',
        threshold: 30,
        severity: 'medium',
        enabled: true,
        channels: ['dashboard'],
        recipients: ['admin@example.com'],
        cooldownMinutes: 30
      }
    ]

    const mockChannels: NotificationChannel[] = [
      {
        id: 'channel-1',
        type: 'email',
        name: 'Email Notifications',
        enabled: true,
        configuration: {
          smtp_server: 'smtp.example.com',
          port: 587,
          from_address: 'alerts@healthcare-ai.com'
        },
        lastUsed: '2025-01-20T10:35:00Z',
        deliveryRate: 98.5
      },
      {
        id: 'channel-2',
        type: 'sms',
        name: 'SMS Alerts',
        enabled: true,
        configuration: {
          provider: 'twilio',
          from_number: '+1234567890'
        },
        lastUsed: '2025-01-20T10:25:00Z',
        deliveryRate: 97.2
      },
      {
        id: 'channel-3',
        type: 'webhook',
        name: 'Slack Integration',
        enabled: true,
        configuration: {
          webhook_url: 'https://hooks.slack.com/...',
          channel: '#alerts'
        },
        lastUsed: '2025-01-20T09:45:00Z',
        deliveryRate: 100.0
      }
    ]

    setAlerts(mockAlerts)
    setAlertRules(mockRules)
    setChannels(mockChannels)

    // Simulate real-time alerts
    const interval = setInterval(() => {
      if (Math.random() > 0.9) { // 10% chance of new alert
        const newAlert: NotificationAlert = {
          id: `alert-${Date.now()}`,
          ruleId: 'rule-system',
          ruleName: 'System Check',
          category: 'system',
          severity: Math.random() > 0.7 ? 'high' : 'medium',
          title: 'System Health Check',
          message: `Automated system health check ${Math.random() > 0.5 ? 'passed' : 'detected minor issues'}`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          resolved: false
        }
        setAlerts(prev => [newAlert, ...prev])
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'medium': return <Info className="h-4 w-4 text-yellow-500" />
      case 'low': return <CheckCircle2 className="h-4 w-4 text-blue-500" />
      default: return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return <Server className="h-4 w-4" />
      case 'agent': return <Bot className="h-4 w-4" />
      case 'workflow': return <Activity className="h-4 w-4" />
      case 'compliance': return <Shield className="h-4 w-4" />
      case 'performance': return <Zap className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <Smartphone className="h-4 w-4" />
      case 'webhook': return <MessageSquare className="h-4 w-4" />
      case 'dashboard': return <Bell className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? {
            ...alert,
            acknowledged: true,
            acknowledgedBy: 'admin@example.com',
            acknowledgedAt: new Date().toISOString()
          }
        : alert
    ))
  }

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? {
            ...alert,
            resolved: true,
            resolvedBy: 'admin@example.com',
            resolvedAt: new Date().toISOString()
          }
        : alert
    ))
  }

  const handleAlertAction = (alertId: string, action: string) => {
    console.log(`Executing action: ${action} for alert: ${alertId}`)
    // Implement alert actions
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter.severity && alert.severity !== filter.severity) return false
    if (filter.category && alert.category !== filter.category) return false
    if (filter.acknowledged !== undefined && alert.acknowledged !== filter.acknowledged) return false
    if (filter.resolved !== undefined && alert.resolved !== filter.resolved) return false
    if (filter.search && !alert.title.toLowerCase().includes(filter.search.toLowerCase()) && 
        !alert.message.toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  })

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged && !a.resolved).length
  const unresolvedCount = alerts.filter(a => !a.resolved).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8 text-red-600" />
            Alert & Notification System
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedCount} new
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage system alerts and notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={soundEnabled ? "default" : "outline"}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unresolvedCount}</div>
            <p className="text-xs text-muted-foreground">
              {unacknowledgedCount} unacknowledged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(a => a.severity === 'critical' && !a.resolved).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alert Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alertRules.filter(r => r.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {alertRules.length} total rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Channels</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {channels.filter(c => c.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(channels.reduce((sum, c) => sum + c.deliveryRate, 0) / channels.length)}% delivery rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Active Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search alerts..."
                    value={filter.search || ''}
                    onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={filter.severity || ''} onValueChange={(value) => 
                    setFilter(prev => ({ ...prev, severity: value || undefined }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={filter.category || ''} onValueChange={(value) => 
                    setFilter(prev => ({ ...prev, category: value || undefined }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="workflow">Workflow</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="acknowledged">Status</Label>
                  <Select value={
                    filter.acknowledged === true ? 'acknowledged' : 
                    filter.acknowledged === false ? 'unacknowledged' : ''
                  } onValueChange={(value) => 
                    setFilter(prev => ({ 
                      ...prev, 
                      acknowledged: value === 'acknowledged' ? true : value === 'unacknowledged' ? false : undefined 
                    }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="resolved">Resolution</Label>
                  <Select value={
                    filter.resolved === true ? 'resolved' : 
                    filter.resolved === false ? 'unresolved' : ''
                  } onValueChange={(value) => 
                    setFilter(prev => ({ 
                      ...prev, 
                      resolved: value === 'resolved' ? true : value === 'unresolved' ? false : undefined 
                    }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="All resolutions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All resolutions</SelectItem>
                      <SelectItem value="unresolved">Unresolved</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline"
                    onClick={() => setFilter({})}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Alerts ({filteredAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-lg ${
                        alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                        alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                        alert.acknowledged ? 'bg-gray-50' : 'bg-white'
                      } ${selectedAlert?.id === alert.id ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getSeverityIcon(alert.severity)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm">{alert.title}</h3>
                              <Badge className={`text-xs ${getSeverityColor(alert.severity)}`}>
                                {alert.severity}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {getCategoryIcon(alert.category)}
                                <span className="ml-1 capitalize">{alert.category}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{new Date(alert.timestamp).toLocaleString()}</span>
                              {alert.acknowledged && (
                                <span className="text-green-600">
                                  ✓ Acknowledged by {alert.acknowledgedBy}
                                </span>
                              )}
                              {alert.resolved && (
                                <span className="text-blue-600">
                                  ✓ Resolved by {alert.resolvedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!alert.acknowledged && !alert.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Acknowledge
                            </Button>
                          )}
                          {alert.acknowledged && !alert.resolved && (
                            <Button
                              size="sm"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Resolve
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
                          >
                            {selectedAlert?.id === alert.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Alert Actions */}
                      {alert.actions && alert.actions.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {alert.actions.map((action, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant={action.variant || 'outline'}
                              onClick={() => handleAlertAction(alert.id, action.action)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Expanded Details */}
                      {selectedAlert?.id === alert.id && alert.metadata && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium text-sm mb-2">Additional Details</h4>
                          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                            {JSON.stringify(alert.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {filteredAlerts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No alerts match your current filters</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertRules.map(rule => (
                  <div key={rule.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(rule.category)}
                        <div>
                          <h3 className="font-medium text-sm">{rule.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {rule.condition} ({rule.threshold})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                        <Switch 
                          checked={rule.enabled} 
                          onCheckedChange={(checked) => {
                            setAlertRules(prev => prev.map(r => 
                              r.id === rule.id ? { ...r, enabled: checked } : r
                            ))
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Channels: </span>
                        <span>{rule.channels.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Recipients: </span>
                        <span>{rule.recipients.length} contacts</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cooldown: </span>
                        <span>{rule.cooldownMinutes}m</span>
                      </div>
                      {rule.lastTriggered && (
                        <div>
                          <span className="text-muted-foreground">Last triggered: </span>
                          <span>{new Date(rule.lastTriggered).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {channels.map(channel => (
                  <div key={channel.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getChannelIcon(channel.type)}
                        <div>
                          <h3 className="font-medium text-sm">{channel.name}</h3>
                          <p className="text-xs text-muted-foreground capitalize">
                            {channel.type} channel
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={channel.enabled}
                        onCheckedChange={(checked) => {
                          setChannels(prev => prev.map(c => 
                            c.id === channel.id ? { ...c, enabled: checked } : c
                          ))
                        }}
                      />
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Delivery Rate</span>
                        <span className="font-medium text-green-600">
                          {channel.deliveryRate}%
                        </span>
                      </div>
                      {channel.lastUsed && (
                        <div className="flex justify-between">
                          <span>Last Used</span>
                          <span>{new Date(channel.lastUsed).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Alert history and analytics will be displayed here</p>
                <p className="text-sm mt-2">
                  Including resolution times, alert patterns, and performance metrics
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}