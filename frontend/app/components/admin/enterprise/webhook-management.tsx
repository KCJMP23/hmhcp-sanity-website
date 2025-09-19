/**
 * Enterprise Webhook Management Component
 * Healthcare-compliant webhook configuration and monitoring interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Webhook, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Edit,
  Trash2,
  TestTube,
  Activity,
  BarChart3,
  Shield,
  Clock
} from 'lucide-react';

interface WebhookConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered?: string;
  lastSuccess?: string;
  lastFailure?: string;
  totalTriggers: number;
  successCount: number;
  failureCount: number;
  healthcareCompliance: {
    hipaaCompliant: boolean;
    dataEncryption: {
      inTransit: boolean;
      atRest: boolean;
    };
    auditLogging: {
      enabled: boolean;
      logLevel: 'basic' | 'detailed' | 'comprehensive';
    };
  };
  status: 'connected' | 'disconnected' | 'error' | 'testing';
}

interface WebhookMetrics {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  averageResponseTime: number;
  uptime: number;
  errorRate: number;
  complianceScore: number;
}

interface WebhookManagementProps {
  organizationId: string;
}

export default function WebhookManagementComponent({ organizationId }: WebhookManagementProps) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [metrics, setMetrics] = useState<WebhookMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    events: [] as string[],
    hipaaCompliant: true,
    dataEncryptionInTransit: true,
    dataEncryptionAtRest: true,
    auditLoggingEnabled: true,
    auditLogLevel: 'comprehensive' as 'basic' | 'detailed' | 'comprehensive',
    authType: 'bearer' as 'none' | 'basic' | 'bearer' | 'hmac' | 'oauth2',
    username: '',
    password: '',
    token: '',
    secret: '',
    clientId: '',
    clientSecret: '',
    scope: 'webhook'
  });

  const availableEvents = [
    'user.created',
    'user.updated',
    'user.deleted',
    'patient.created',
    'patient.updated',
    'patient.deleted',
    'observation.created',
    'observation.updated',
    'appointment.scheduled',
    'appointment.updated',
    'billing.created',
    'billing.updated',
    'compliance.violation',
    'audit.log_created',
    'fhir.sync_started',
    'fhir.sync_completed',
    'ehr.sync_started',
    'ehr.sync_completed'
  ];

  useEffect(() => {
    loadWebhooks();
    loadMetrics();
  }, [organizationId]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/enterprise/webhooks?organizationId=${organizationId}`);
      const data = await response.json();
      
      if (data.success) {
        setWebhooks(data.webhooks);
      } else {
        setError(data.error?.message || 'Failed to load webhooks');
      }
    } catch (err) {
      setError('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch(`/api/enterprise/webhooks/metrics?organizationId=${organizationId}`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/enterprise/webhooks', {
        method: editingWebhook ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizationId,
          id: editingWebhook?.id
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(editingWebhook ? 'Webhook updated successfully' : 'Webhook created successfully');
        setShowAddWebhook(false);
        setEditingWebhook(null);
        resetForm();
        loadWebhooks();
        loadMetrics();
      } else {
        setError(data.error?.message || 'Failed to save webhook');
      }
    } catch (err) {
      setError('Failed to save webhook');
    }
  };

  const handleEdit = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      description: webhook.description,
      url: webhook.url,
      events: webhook.events,
      hipaaCompliant: webhook.healthcareCompliance.hipaaCompliant,
      dataEncryptionInTransit: webhook.healthcareCompliance.dataEncryption.inTransit,
      dataEncryptionAtRest: webhook.healthcareCompliance.dataEncryption.atRest,
      auditLoggingEnabled: webhook.healthcareCompliance.auditLogging.enabled,
      auditLogLevel: webhook.healthcareCompliance.auditLogging.logLevel,
      authType: 'bearer',
      username: '',
      password: '',
      token: '',
      secret: '',
      clientId: '',
      clientSecret: '',
      scope: 'webhook'
    });
    setShowAddWebhook(true);
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch(`/api/enterprise/webhooks/${webhookId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Webhook deleted successfully');
        loadWebhooks();
        loadMetrics();
      } else {
        setError(data.error?.message || 'Failed to delete webhook');
      }
    } catch (err) {
      setError('Failed to delete webhook');
    }
  };

  const handleTest = async (webhookId: string, testType: string) => {
    try {
      setTestingWebhook(webhookId);
      const response = await fetch(`/api/enterprise/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testType }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Webhook ${testType} test successful`);
        loadWebhooks(); // Refresh to update status
      } else {
        setError(data.error?.message || `Webhook ${testType} test failed`);
      }
    } catch (err) {
      setError(`Failed to test webhook ${testType}`);
    } finally {
      setTestingWebhook(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      url: '',
      events: [],
      hipaaCompliant: true,
      dataEncryptionInTransit: true,
      dataEncryptionAtRest: true,
      auditLoggingEnabled: true,
      auditLogLevel: 'comprehensive',
      authType: 'bearer',
      username: '',
      password: '',
      token: '',
      secret: '',
      clientId: '',
      clientSecret: '',
      scope: 'webhook'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'testing':
        return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'testing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceStatus = (webhook: WebhookConfig) => {
    const { hipaaCompliant, dataEncryption, auditLogging } = webhook.healthcareCompliance;
    
    if (hipaaCompliant && dataEncryption.inTransit && dataEncryption.atRest && auditLogging.enabled) {
      return { status: 'compliant', label: 'HIPAA Compliant', color: 'green' };
    } else if (hipaaCompliant && (dataEncryption.inTransit || dataEncryption.atRest)) {
      return { status: 'partial', label: 'Partially Compliant', color: 'yellow' };
    } else {
      return { status: 'non-compliant', label: 'Non-Compliant', color: 'red' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Webhook Management</h2>
          <p className="text-gray-600">Manage real-time event handling and data synchronization</p>
        </div>
        <Button onClick={() => setShowAddWebhook(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalEvents.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.totalEvents > 0 ? Math.round((metrics.successfulEvents / metrics.totalEvents) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.averageResponseTime}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.complianceScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhook List */}
      <div className="grid gap-6">
        {webhooks.map((webhook) => {
          const compliance = getComplianceStatus(webhook);
          return (
            <Card key={webhook.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Webhook className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{webhook.name}</CardTitle>
                      <CardDescription>{webhook.url}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={compliance.color === 'green' ? 'default' : compliance.color === 'yellow' ? 'secondary' : 'destructive'}
                      className="bg-green-100 text-green-800"
                    >
                      {compliance.label}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(webhook.status)}
                    >
                      {getStatusIcon(webhook.status)}
                      <span className="ml-1 capitalize">{webhook.status}</span>
                    </Badge>
                    {webhook.isActive ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Events</Label>
                    <div className="text-sm text-gray-600 mt-1">
                      {webhook.events.length} configured
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Total Triggers</Label>
                    <div className="text-sm text-gray-600 mt-1">
                      {webhook.totalTriggers.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Success Rate</Label>
                    <div className="text-sm text-gray-600 mt-1">
                      {webhook.totalTriggers > 0 ? Math.round((webhook.successCount / webhook.totalTriggers) * 100) : 0}%
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Last Triggered</Label>
                    <div className="text-sm text-gray-600 mt-1">
                      {webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleString() : 'Never'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(webhook)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(webhook.id, 'connectivity')}
                    disabled={testingWebhook === webhook.id}
                  >
                    {testingWebhook === webhook.id ? (
                      <Activity className="h-4 w-4 mr-2 animate-pulse" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    {testingWebhook === webhook.id ? 'Testing...' : 'Test'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(webhook.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showAddWebhook && (
        <Card>
          <CardHeader>
            <CardTitle>{editingWebhook ? 'Edit Webhook' : 'Add New Webhook'}</CardTitle>
            <CardDescription>
              Configure a new webhook for real-time event handling and data synchronization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="security">Security & Compliance</TabsTrigger>
                  <TabsTrigger value="authentication">Authentication</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Webhook Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Patient Data Sync"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="url">Webhook URL</Label>
                      <Input
                        id="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://your-endpoint.com/webhook"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description of this webhook's purpose"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="events" className="space-y-4">
                  <div>
                    <Label>Select Events</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {availableEvents.map((event) => (
                        <div key={event} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={event}
                            checked={formData.events.includes(event)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, events: [...formData.events, event] });
                              } else {
                                setFormData({ ...formData, events: formData.events.filter(ev => ev !== event) });
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={event} className="text-sm">{event}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="security" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="hipaaCompliant">HIPAA Compliance</Label>
                        <p className="text-sm text-gray-600">Ensure this webhook meets HIPAA requirements</p>
                      </div>
                      <Switch
                        id="hipaaCompliant"
                        checked={formData.hipaaCompliant}
                        onCheckedChange={(checked) => setFormData({ ...formData, hipaaCompliant: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="dataEncryptionInTransit">Data Encryption in Transit</Label>
                        <p className="text-sm text-gray-600">Encrypt data during transmission</p>
                      </div>
                      <Switch
                        id="dataEncryptionInTransit"
                        checked={formData.dataEncryptionInTransit}
                        onCheckedChange={(checked) => setFormData({ ...formData, dataEncryptionInTransit: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="dataEncryptionAtRest">Data Encryption at Rest</Label>
                        <p className="text-sm text-gray-600">Encrypt data when stored</p>
                      </div>
                      <Switch
                        id="dataEncryptionAtRest"
                        checked={formData.dataEncryptionAtRest}
                        onCheckedChange={(checked) => setFormData({ ...formData, dataEncryptionAtRest: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auditLoggingEnabled">Audit Logging</Label>
                        <p className="text-sm text-gray-600">Enable comprehensive audit logging</p>
                      </div>
                      <Switch
                        id="auditLoggingEnabled"
                        checked={formData.auditLoggingEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, auditLoggingEnabled: checked })}
                      />
                    </div>
                    {formData.auditLoggingEnabled && (
                      <div>
                        <Label htmlFor="auditLogLevel">Audit Log Level</Label>
                        <Select 
                          value={formData.auditLogLevel} 
                          onValueChange={(value: 'basic' | 'detailed' | 'comprehensive') => setFormData({ ...formData, auditLogLevel: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="authentication" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="authType">Authentication Type</Label>
                      <Select value={formData.authType} onValueChange={(value: 'none' | 'basic' | 'bearer' | 'hmac' | 'oauth2') => setFormData({ ...formData, authType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="basic">Basic Authentication</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                          <SelectItem value="hmac">HMAC Signature</SelectItem>
                          <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.authType === 'basic' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Password"
                          />
                        </div>
                      </div>
                    )}
                    
                    {formData.authType === 'bearer' && (
                      <div>
                        <Label htmlFor="token">Bearer Token</Label>
                        <Input
                          id="token"
                          value={formData.token}
                          onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                          placeholder="Bearer token"
                        />
                      </div>
                    )}
                    
                    {formData.authType === 'hmac' && (
                      <div>
                        <Label htmlFor="secret">HMAC Secret</Label>
                        <Input
                          id="secret"
                          type="password"
                          value={formData.secret}
                          onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                          placeholder="HMAC secret key"
                        />
                      </div>
                    )}
                    
                    {formData.authType === 'oauth2' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="clientId">Client ID</Label>
                          <Input
                            id="clientId"
                            value={formData.clientId}
                            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                            placeholder="OAuth Client ID"
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientSecret">Client Secret</Label>
                          <Input
                            id="clientSecret"
                            type="password"
                            value={formData.clientSecret}
                            onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                            placeholder="OAuth Client Secret"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="scope">Scope</Label>
                          <Input
                            id="scope"
                            value={formData.scope}
                            onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                            placeholder="webhook"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex items-center justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddWebhook(false);
                    setEditingWebhook(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingWebhook ? 'Update Webhook' : 'Create Webhook'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
