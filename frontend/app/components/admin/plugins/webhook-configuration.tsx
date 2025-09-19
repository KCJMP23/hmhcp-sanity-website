'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  TestTube, 
  History, 
  Settings,
  Webhook,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface WebhookConfig {
  id?: string;
  event: string;
  url: string;
  headers: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  status: 'active' | 'inactive' | 'paused';
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  status: 'success' | 'failed' | 'pending';
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  error?: string;
}

interface WebhookTestResult {
  webhookId: string;
  status: 'success' | 'failed';
  responseTime: number;
  statusCode: number;
  responseBody: string;
  timestamp: Date;
}

const EVENT_TYPES = [
  { value: 'patient.created', label: 'Patient Created', category: 'patient' },
  { value: 'patient.updated', label: 'Patient Updated', category: 'patient' },
  { value: 'patient.deleted', label: 'Patient Deleted', category: 'patient' },
  { value: 'plugin.installed', label: 'Plugin Installed', category: 'plugin' },
  { value: 'plugin.uninstalled', label: 'Plugin Uninstalled', category: 'plugin' },
  { value: 'plugin.executed', label: 'Plugin Executed', category: 'plugin' },
  { value: 'compliance.validated', label: 'Compliance Validated', category: 'compliance' },
  { value: 'compliance.violation', label: 'Compliance Violation', category: 'compliance' },
  { value: 'security.alert', label: 'Security Alert', category: 'security' },
  { value: 'system.maintenance', label: 'System Maintenance', category: 'system' }
];

const WEBHOOK_TEMPLATES = [
  {
    name: 'Patient Data Webhook',
    description: 'Notify when patient data changes',
    event: 'patient.*',
    url: 'https://your-app.com/webhooks/patient',
    headers: {
      'Authorization': 'Bearer your-token',
      'X-Custom-Header': 'patient-webhook'
    },
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000
    }
  },
  {
    name: 'Plugin Execution Webhook',
    description: 'Notify when plugins are executed',
    event: 'plugin.executed',
    url: 'https://your-app.com/webhooks/plugin-execution',
    headers: {
      'Authorization': 'Bearer your-token'
    },
    retryPolicy: {
      maxRetries: 5,
      backoffMultiplier: 1.5,
      initialDelay: 2000
    }
  },
  {
    name: 'Compliance Alert Webhook',
    description: 'Notify about compliance violations',
    event: 'compliance.violation',
    url: 'https://your-app.com/webhooks/compliance',
    headers: {
      'Authorization': 'Bearer your-token',
      'X-Priority': 'high'
    },
    retryPolicy: {
      maxRetries: 10,
      backoffMultiplier: 1.2,
      initialDelay: 500
    }
  }
];

export function WebhookConfiguration() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [testResults, setTestResults] = useState<WebhookTestResult[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [activeTab, setActiveTab] = useState('webhooks');

  // Load webhooks on component mount
  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    // Simulate loading webhooks
    const mockWebhooks: WebhookConfig[] = [
      {
        id: 'wh_1',
        event: 'patient.created',
        url: 'https://example.com/webhooks/patient-created',
        headers: {
          'Authorization': 'Bearer token123',
          'Content-Type': 'application/json'
        },
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelay: 1000
        },
        status: 'active'
      },
      {
        id: 'wh_2',
        event: 'plugin.executed',
        url: 'https://example.com/webhooks/plugin-execution',
        headers: {
          'Authorization': 'Bearer token456'
        },
        retryPolicy: {
          maxRetries: 5,
          backoffMultiplier: 1.5,
          initialDelay: 2000
        },
        status: 'inactive'
      }
    ];
    setWebhooks(mockWebhooks);
  };

  const createWebhook = async (webhookData: Omit<WebhookConfig, 'id'>) => {
    const newWebhook: WebhookConfig = {
      ...webhookData,
      id: `wh_${Date.now()}`
    };
    
    setWebhooks([...webhooks, newWebhook]);
    setIsCreating(false);
    toast.success('Webhook created successfully');
  };

  const updateWebhook = async (webhookId: string, updates: Partial<WebhookConfig>) => {
    setWebhooks(webhooks.map(wh => 
      wh.id === webhookId ? { ...wh, ...updates } : wh
    ));
    setIsEditing(false);
    setSelectedWebhook(null);
    toast.success('Webhook updated successfully');
  };

  const deleteWebhook = async (webhookId: string) => {
    setWebhooks(webhooks.filter(wh => wh.id !== webhookId));
    if (selectedWebhook?.id === webhookId) {
      setSelectedWebhook(null);
    }
    toast.success('Webhook deleted successfully');
  };

  const testWebhook = async (webhookId: string) => {
    setIsLoading(true);
    try {
      // Simulate webhook test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const testResult: WebhookTestResult = {
        webhookId,
        status: Math.random() > 0.2 ? 'success' : 'failed',
        responseTime: Math.floor(Math.random() * 1000) + 100,
        statusCode: Math.random() > 0.2 ? 200 : 500,
        responseBody: Math.random() > 0.2 ? '{"status": "success"}' : '{"error": "Internal server error"}',
        timestamp: new Date()
      };
      
      setTestResults([testResult, ...testResults]);
      toast.success('Webhook test completed');
    } catch (error) {
      toast.error('Webhook test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeliveries = async (webhookId: string) => {
    // Simulate loading deliveries
    const mockDeliveries: WebhookDelivery[] = [
      {
        id: 'del_1',
        webhookId,
        status: 'success',
        statusCode: 200,
        responseTime: 150,
        timestamp: new Date(Date.now() - 1000 * 60 * 5)
      },
      {
        id: 'del_2',
        webhookId,
        status: 'failed',
        statusCode: 500,
        responseTime: 2000,
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        error: 'Connection timeout'
      }
    ];
    setDeliveries(mockDeliveries);
  };

  const getEventTypeInfo = (eventType: string) => {
    return EVENT_TYPES.find(et => et.value === eventType) || { value: eventType, label: eventType, category: 'other' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhook Management</h2>
          <p className="text-muted-foreground">
            Configure and manage webhooks for real-time event notifications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Webhook
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Webhook List */}
            <Card>
              <CardHeader>
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>
                  Manage your webhook configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {webhooks.map((webhook) => {
                  const eventInfo = getEventTypeInfo(webhook.event);
                  return (
                    <div
                      key={webhook.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedWebhook?.id === webhook.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedWebhook(webhook)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Webhook className="h-4 w-4" />
                          <span className="font-medium">{eventInfo.label}</span>
                          <Badge className={getStatusColor(webhook.status)}>
                            {webhook.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              testWebhook(webhook.id!);
                            }}
                          >
                            <TestTube className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWebhook(webhook);
                              setIsEditing(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWebhook(webhook.id!);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {webhook.url}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Event: {webhook.event}</span>
                        <span>Retries: {webhook.retryPolicy.maxRetries}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Webhook Details */}
            {selectedWebhook && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Webhook Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Event Type</Label>
                      <p className="text-sm font-medium">{selectedWebhook.event}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge className={getStatusColor(selectedWebhook.status)}>
                        {selectedWebhook.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label>URL</Label>
                    <p className="text-sm font-mono bg-muted p-2 rounded">
                      {selectedWebhook.url}
                    </p>
                  </div>

                  <div>
                    <Label>Headers</Label>
                    <div className="space-y-1">
                      {Object.entries(selectedWebhook.headers).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{key}:</span>
                          <span className="font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Retry Policy</Label>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Max Retries:</span>
                        <p className="font-medium">{selectedWebhook.retryPolicy.maxRetries}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Backoff:</span>
                        <p className="font-medium">{selectedWebhook.retryPolicy.backoffMultiplier}x</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Initial Delay:</span>
                        <p className="font-medium">{selectedWebhook.retryPolicy.initialDelay}ms</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadDeliveries(selectedWebhook.id!)}
                    >
                      <History className="h-4 w-4 mr-2" />
                      View Deliveries
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook(selectedWebhook.id!)}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Webhook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Templates</CardTitle>
              <CardDescription>
                Pre-configured webhook templates for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {WEBHOOK_TEMPLATES.map((template, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Event:</span>
                          <p className="font-mono">{template.event}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">URL:</span>
                          <p className="font-mono text-xs break-all">{template.url}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Retries:</span>
                          <p>{template.retryPolicy.maxRetries}</p>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4"
                        onClick={() => {
                          const newWebhook: WebhookConfig = {
                            ...template,
                            id: `wh_${Date.now()}`
                          };
                          setWebhooks([...webhooks, newWebhook]);
                          toast.success('Webhook created from template');
                        }}
                      >
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Testing</CardTitle>
              <CardDescription>
                Test your webhooks and view delivery results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length > 0 ? (
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">Test Result</span>
                          <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                            {result.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Response Time:</span>
                          <p className="font-medium">{result.responseTime}ms</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status Code:</span>
                          <p className="font-medium">{result.statusCode}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Webhook ID:</span>
                          <p className="font-mono text-xs">{result.webhookId}</p>
                        </div>
                      </div>
                      {result.responseBody && (
                        <div className="mt-2">
                          <span className="text-muted-foreground text-sm">Response Body:</span>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {result.responseBody}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No test results yet</p>
                  <p className="text-sm text-muted-foreground">
                    Test a webhook to see results here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{webhooks.length}</div>
                <p className="text-xs text-muted-foreground">
                  {webhooks.filter(w => w.status === 'active').length} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.5%</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">150ms</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
