'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  Play,
  SkipForward,
  StopCircle,
  ArrowUpRight,
  Bell,
  Settings2,
  Filter,
  CheckSquare,
  Square,
  Users,
  Timer,
  Target,
  Workflow,
  GitBranch
} from 'lucide-react';

interface ErrorEvent {
  id: string;
  workflowId: string;
  executionId: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  code: string;
  message: string;
  context?: any;
  status: 'active' | 'retrying' | 'resolved' | 'ignored' | 'escalated' | 'manual_review';
  retryCount: number;
  maxRetries: number;
  recoveryActions?: RecoveryAction[];
  affectedUsers?: number;
  estimatedImpact?: 'low' | 'medium' | 'high';
  resolution?: string;
  assignedTo?: string;
  tags?: string[];
  relatedErrors?: string[];
  automatedResolution?: boolean;
}

interface RecoveryAction {
  id: string;
  type: 'retry' | 'skip' | 'abort' | 'manual' | 'escalate' | 'rollback' | 'compensate';
  label: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  requiresApproval?: boolean;
  estimatedTime?: number;
  successRate?: number;
  prerequisites?: string[];
  automation?: {
    enabled: boolean;
    triggers: string[];
    conditions: string[];
  };
}

interface RetryConfig {
  enabled: boolean;
  maxRetries: number;
  backoffMultiplier: number;
  initialDelayMs: number;
  maxDelayMs: number;
  retryableErrors: string[];
}

interface AlertConfig {
  emailEnabled: boolean;
  slackEnabled: boolean;
  teamsEnabled: boolean;
  smsEnabled: boolean;
  webhookEnabled: boolean;
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  escalationRules: {
    enabled: boolean;
    timeoutMinutes: number;
    escalateTo: string[];
    skipWeekends: boolean;
  };
  rateLimiting: {
    enabled: boolean;
    maxAlertsPerHour: number;
    burstLimit: number;
  };
}

const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const ERROR_CATEGORIES = [
  'API Error',
  'Timeout',
  'Validation',
  'Authorization',
  'Rate Limit',
  'Network',
  'Compliance',
  'Data Quality'
];

export function ErrorManagement() {
  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorEvent | null>(null);
  const [retryConfig, setRetryConfig] = useState<RetryConfig>({
    enabled: true,
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMIT']
  });
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    emailEnabled: true,
    slackEnabled: false,
    teamsEnabled: false,
    smsEnabled: false,
    webhookEnabled: false,
    severityThreshold: 'high',
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    },
    escalationRules: {
      enabled: true,
      timeoutMinutes: 30,
      escalateTo: ['admin@example.com'],
      skipWeekends: false
    },
    rateLimiting: {
      enabled: true,
      maxAlertsPerHour: 10,
      burstLimit: 3
    }
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedErrors, setSelectedErrors] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [realTimeNotifications, setRealTimeNotifications] = useState(true);

  // Load errors
  useEffect(() => {
    loadErrors();
    if (autoRefresh) {
      const interval = setInterval(loadErrors, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadErrors = async () => {
    // In production, fetch from API
    setErrors(generateMockErrors());
  };

  const handleRecoveryAction = async (error: ErrorEvent, action: RecoveryAction) => {
    if (action.requiresApproval && action.risk === 'high') {
      if (!confirm(`This is a high-risk action. Are you sure you want to ${action.label}?`)) {
        return;
      }
    }

    switch (action.type) {
      case 'retry':
        await retryExecution(error);
        break;
      case 'skip':
        await skipError(error);
        break;
      case 'abort':
        await abortWorkflow(error);
        break;
      case 'escalate':
        await escalateError(error);
        break;
    }
  };

  const retryExecution = async (error: ErrorEvent) => {
    setErrors(prev => prev.map(e => 
      e.id === error.id ? { ...e, status: 'retrying', retryCount: e.retryCount + 1 } : e
    ));
  };

  const skipError = async (error: ErrorEvent) => {
    setErrors(prev => prev.map(e => 
      e.id === error.id ? { ...e, status: 'ignored' } : e
    ));
  };

  const abortWorkflow = async (error: ErrorEvent) => {
    setErrors(prev => prev.filter(e => e.workflowId !== error.workflowId));
  };

  const escalateError = async (error: ErrorEvent) => {
    setErrors(prev => prev.map(e => 
      e.id === error.id ? { ...e, status: 'escalated' } : e
    ));
  };

  const calculateAvgResolutionTime = (errors: ErrorEvent[]): number => {
    const resolvedErrors = errors.filter(e => e.status === 'resolved');
    if (resolvedErrors.length === 0) return 0;
    // Mock calculation - in production, would use actual resolution timestamps
    return Math.random() * 120 + 30; // 30-150 minutes
  };

  const calculateEscalationRate = (errors: ErrorEvent[]): number => {
    if (errors.length === 0) return 0;
    const escalatedCount = errors.filter(e => e.status === 'escalated').length;
    return (escalatedCount / errors.length) * 100;
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedErrors.size === 0) return;
    
    const selectedErrorObjects = errors.filter(e => selectedErrors.has(e.id));
    
    switch (bulkAction) {
      case 'retry_all':
        for (const error of selectedErrorObjects) {
          await retryExecution(error);
        }
        break;
      case 'ignore_all':
        setErrors(prev => prev.map(e => 
          selectedErrors.has(e.id) ? { ...e, status: 'ignored' } : e
        ));
        break;
      case 'escalate_all':
        setErrors(prev => prev.map(e => 
          selectedErrors.has(e.id) ? { ...e, status: 'escalated' } : e
        ));
        break;
    }
    
    setSelectedErrors(new Set());
    setBulkAction('');
  };

  const toggleErrorSelection = (errorId: string) => {
    const newSelection = new Set(selectedErrors);
    if (newSelection.has(errorId)) {
      newSelection.delete(errorId);
    } else {
      newSelection.add(errorId);
    }
    setSelectedErrors(newSelection);
  };

  // Calculate statistics
  const stats = {
    active: errors.filter(e => e.status === 'active').length,
    critical: errors.filter(e => e.severity === 'critical').length,
    retrying: errors.filter(e => e.status === 'retrying').length,
    resolved: errors.filter(e => e.status === 'resolved').length,
    manualReview: errors.filter(e => e.status === 'manual_review').length,
    automatedResolutions: errors.filter(e => e.automatedResolution).length,
    avgResolutionTime: calculateAvgResolutionTime(errors),
    escalationRate: calculateEscalationRate(errors)
  };

  // Error trend data
  const trendData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    errors: Math.floor(Math.random() * 50) + 10,
    resolved: Math.floor(Math.random() * 40) + 5
  }));

  // Category distribution
  const categoryData = ERROR_CATEGORIES.map(cat => ({
    name: cat,
    value: errors.filter(e => e.category === cat).length,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Error Management</h2>
          <p className="text-muted-foreground">Monitor and resolve workflow errors</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Errors</p>
                <p className="text-3xl font-bold">{stats.active}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-3xl font-bold">{stats.critical}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Retrying</p>
                <p className="text-3xl font-bold">{stats.retrying}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Manual Review</p>
                <p className="text-3xl font-bold">{stats.manualReview}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Resolution</p>
                <p className="text-3xl font-bold">{Math.round(stats.avgResolutionTime)}m</p>
              </div>
              <Timer className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto-Resolved</p>
                <p className="text-3xl font-bold">{stats.automatedResolutions}</p>
              </div>
              <Workflow className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="errors">Error List</TabsTrigger>
          <TabsTrigger value="trends">Analytics</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {errors.filter(e => e.status !== 'resolved').map(error => (
                    <Card key={error.id} className="border-l-4" style={{
                      borderLeftColor: error.severity === 'critical' ? '#ef4444' :
                                      error.severity === 'high' ? '#f97316' :
                                      error.severity === 'medium' ? '#eab308' : '#3b82f6'
                    }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={SEVERITY_COLORS[error.severity]}>
                                {error.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">{error.category}</Badge>
                              <Badge variant="secondary">{error.status}</Badge>
                            </div>
                            <p className="font-medium">{error.message}</p>
                            <p className="text-sm text-muted-foreground">
                              Error Code: {error.code} | Workflow: {error.workflowId}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Retry {error.retryCount}/{error.maxRetries}</span>
                              <span>{new Date(error.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {error.recoveryActions?.map(action => (
                              <Button
                                key={action.id}
                                size="sm"
                                variant={action.risk === 'high' ? 'destructive' : 'outline'}
                                onClick={() => handleRecoveryAction(error, action)}
                              >
                                {action.type === 'retry' && <RefreshCw className="h-4 w-4" />}
                                {action.type === 'skip' && <SkipForward className="h-4 w-4" />}
                                {action.type === 'abort' && <StopCircle className="h-4 w-4" />}
                                {action.type === 'escalate' && <ArrowUpRight className="h-4 w-4" />}
                                <span className="ml-1">{action.label}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Trend (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="errors" stroke="#ef4444" name="Errors" />
                    <Line type="monotone" dataKey="resolved" stroke="#22c55e" name="Resolved" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recovery Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Automatic Retry Success</span>
                    <span>68%</span>
                  </div>
                  <Progress value={68} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Manual Intervention Success</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Escalation Resolution</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automatic Retry Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label>Enable Automatic Retry</label>
                <input
                  type="checkbox"
                  checked={retryConfig.enabled}
                  onChange={(e) => setRetryConfig({ ...retryConfig, enabled: e.target.checked })}
                />
              </div>
              <div>
                <label>Max Retries</label>
                <input
                  type="number"
                  value={retryConfig.maxRetries}
                  onChange={(e) => setRetryConfig({ ...retryConfig, maxRetries: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label>Backoff Multiplier</label>
                <input
                  type="number"
                  value={retryConfig.backoffMultiplier}
                  onChange={(e) => setRetryConfig({ ...retryConfig, backoffMultiplier: parseFloat(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label>Retryable Error Codes</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {retryConfig.retryableErrors.map(code => (
                    <Badge key={code} variant="secondary">{code}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recovery Actions by Error Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ERROR_CATEGORIES.map(category => (
                  <div key={category} className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">{category}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">Auto-retry</Badge>
                      {category === 'Compliance' && <Badge variant="destructive">Manual Review</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Recovery Workflows</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-medium">Auto-retry on Network Errors</label>
                    <Switch defaultChecked />
                  </div>
                  <div className="text-sm text-muted-foreground ml-4">
                    Automatically retry network-related errors up to 3 times with exponential backoff
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-medium">Smart Escalation</label>
                    <Switch defaultChecked />
                  </div>
                  <div className="text-sm text-muted-foreground ml-4">
                    Automatically escalate critical errors to on-call engineers during business hours
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-medium">Rollback on Validation Failure</label>
                    <Switch />
                  </div>
                  <div className="text-sm text-muted-foreground ml-4">
                    Automatically rollback workflow state when validation errors occur
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-medium">Circuit Breaker</label>
                    <Switch defaultChecked />
                  </div>
                  <div className="text-sm text-muted-foreground ml-4">
                    Stop executing workflows when error rate exceeds threshold
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-4">Recovery Templates</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'API Timeout Recovery', description: 'Handles API timeout with exponential backoff', success: 85 },
                    { name: 'Rate Limit Backoff', description: 'Waits and retries when rate limited', success: 92 },
                    { name: 'Validation Repair', description: 'Attempts to fix common validation errors', success: 73 },
                    { name: 'Data Corruption Rollback', description: 'Rolls back to last known good state', success: 95 },
                    { name: 'Resource Exhaustion', description: 'Scales resources and retries', success: 88 },
                    { name: 'Dependency Failure', description: 'Switches to backup services', success: 79 }
                  ].map(template => (
                    <Card key={template.name} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-sm">{template.name}</h5>
                          <Badge variant="outline">{template.success}% success</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Configure</Button>
                          <Button size="sm" variant="ghost">Test</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <label>Email Alerts</label>
                  <input
                    type="checkbox"
                    checked={alertConfig.emailEnabled}
                    onChange={(e) => setAlertConfig({ ...alertConfig, emailEnabled: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label>Slack Alerts</label>
                  <input
                    type="checkbox"
                    checked={alertConfig.slackEnabled}
                    onChange={(e) => setAlertConfig({ ...alertConfig, slackEnabled: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label>Teams Alerts</label>
                  <input
                    type="checkbox"
                    checked={alertConfig.teamsEnabled}
                    onChange={(e) => setAlertConfig({ ...alertConfig, teamsEnabled: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label>SMS Alerts (Critical Only)</label>
                  <input
                    type="checkbox"
                    checked={alertConfig.smsEnabled}
                    onChange={(e) => setAlertConfig({ ...alertConfig, smsEnabled: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label>Webhook Notifications</label>
                  <input
                    type="checkbox"
                    checked={alertConfig.webhookEnabled}
                    onChange={(e) => setAlertConfig({ ...alertConfig, webhookEnabled: e.target.checked })}
                  />
                </div>
              </div>

              <div>
                <label>Alert Severity Threshold</label>
                <select
                  value={alertConfig.severityThreshold}
                  onChange={(e) => setAlertConfig({ ...alertConfig, severityThreshold: e.target.value as any })}
                  className="w-full border rounded px-3 py-2 mt-2"
                >
                  <option value="low">Low and above</option>
                  <option value="medium">Medium and above</option>
                  <option value="high">High and above</option>
                  <option value="critical">Critical only</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label>Quiet Hours</label>
                  <input
                    type="checkbox"
                    checked={alertConfig.quietHours.enabled}
                    onChange={(e) => setAlertConfig({
                      ...alertConfig,
                      quietHours: { ...alertConfig.quietHours, enabled: e.target.checked }
                    })}
                  />
                </div>
                {alertConfig.quietHours.enabled && (
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={alertConfig.quietHours.start}
                      onChange={(e) => setAlertConfig({
                        ...alertConfig,
                        quietHours: { ...alertConfig.quietHours, start: e.target.value }
                      })}
                      className="border rounded px-3 py-2"
                    />
                    <span className="py-2">to</span>
                    <input
                      type="time"
                      value={alertConfig.quietHours.end}
                      onChange={(e) => setAlertConfig({
                        ...alertConfig,
                        quietHours: { ...alertConfig.quietHours, end: e.target.value }
                      })}
                      className="border rounded px-3 py-2"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function generateMockErrors(): ErrorEvent[] {
  const severities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
  const statuses: ErrorEvent['status'][] = ['active', 'retrying', 'resolved', 'ignored', 'escalated'];
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: `error-${i}`,
    workflowId: `workflow-${Math.floor(Math.random() * 5)}`,
    executionId: `exec-${Math.floor(Math.random() * 10)}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000),
    severity: severities[Math.floor(Math.random() * severities.length)],
    category: ERROR_CATEGORIES[Math.floor(Math.random() * ERROR_CATEGORIES.length)],
    code: `ERR_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    message: `Sample error message for error ${i}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    retryCount: Math.floor(Math.random() * 3),
    maxRetries: 3,
    recoveryActions: [
      { id: '1', type: 'retry', label: 'Retry', description: 'Retry the operation', risk: 'low' },
      { id: '2', type: 'skip', label: 'Skip', description: 'Skip this step', risk: 'medium' },
      { id: '3', type: 'abort', label: 'Abort', description: 'Abort workflow', risk: 'high', requiresApproval: true }
    ]
  }));
}