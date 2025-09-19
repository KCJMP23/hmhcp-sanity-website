'use client';

// Email Service Configuration Component
// Created: 2025-01-27
// Purpose: Configure email service providers and settings

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  TestTube,
  Save,
  Trash2,
  Plus,
  Server,
  Key,
  Globe,
  Mail
} from 'lucide-react';
import { emailServiceManager, errorHandler } from '@/lib/email/services';
import type { EmailServiceConfig, HealthStatus } from '@/lib/email/services';

interface EmailServiceConfigProps {
  onConfigUpdate: () => void;
}

interface ProviderConfig {
  name: string;
  type: 'sendgrid' | 'mailchimp' | 'ses' | 'smtp';
  isConfigured: boolean;
  isHealthy: boolean;
  lastHealthCheck: Date;
  config: EmailServiceConfig;
}

const PROVIDER_TYPES = [
  { value: 'sendgrid', label: 'SendGrid', description: 'Cloud-based email delivery service' },
  { value: 'mailchimp', label: 'Mailchimp', description: 'Marketing automation platform' },
  { value: 'ses', label: 'AWS SES', description: 'Amazon Simple Email Service' },
  { value: 'smtp', label: 'SMTP', description: 'Direct SMTP server connection' }
];

export default function EmailServiceConfig({ onConfigUpdate }: EmailServiceConfigProps) {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Load provider configurations
  useEffect(() => {
    loadProviderConfigs();
  }, []);

  const loadProviderConfigs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const providerConfigs: ProviderConfig[] = [];
      
      // Get all configured providers
      for (const [name, provider] of emailServiceManager.providers) {
        const healthStatus = await provider.healthCheck();
        const config = emailServiceManager.getProviderConfig(name);
        
        providerConfigs.push({
          name,
          type: config?.provider || 'smtp',
          isConfigured: provider.isConfigured,
          isHealthy: healthStatus.isHealthy,
          lastHealthCheck: healthStatus.lastChecked,
          config: config || {
            provider: 'smtp',
            fromEmail: 'noreply@example.com'
          }
        });
      }
      
      setProviders(providerConfigs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load provider configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderTest = async (providerName: string) => {
    setIsTesting(true);
    setError(null);
    
    try {
      const provider = emailServiceManager.providers.get(providerName);
      if (!provider) {
        throw new Error('Provider not found');
      }
      
      // Test with a simple health check
      const healthStatus = await provider.healthCheck();
      
      if (healthStatus.isHealthy) {
        // Update provider status
        await loadProviderConfigs();
      } else {
        throw new Error(healthStatus.message || 'Health check failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Provider test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleProviderDelete = async (providerName: string) => {
    try {
      emailServiceManager.removeProvider(providerName);
      await loadProviderConfigs();
      onConfigUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider');
    }
  };

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  const getStatusText = (isHealthy: boolean) => {
    return isHealthy ? 'Healthy' : 'Unhealthy';
  };

  const getErrorStats = () => {
    const stats = errorHandler.getErrorStats();
    return stats;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Service Configuration</h2>
          <p className="text-gray-600">Manage email service providers and settings</p>
        </div>
        <Button onClick={loadProviderConfigs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Provider Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <Card key={provider.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-blue-500" />
                      <h3 className="font-medium">{provider.name}</h3>
                    </div>
                    {getStatusIcon(provider.isHealthy)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge 
                        variant={provider.isHealthy ? 'default' : 'destructive'}
                        className={getStatusColor(provider.isHealthy)}
                      >
                        {getStatusText(provider.isHealthy)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Type</span>
                      <span className="text-sm font-medium">{provider.type}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Check</span>
                      <span className="text-sm text-gray-500">
                        {provider.lastHealthCheck.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProviderTest(provider.name)}
                      disabled={isTesting}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProvider(provider.name)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProviderDelete(provider.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{providers.length}</div>
                  <div className="text-sm text-gray-600">Configured Providers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {providers.filter(p => p.isHealthy).length}
                  </div>
                  <div className="text-sm text-gray-600">Healthy Providers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {emailServiceManager.primaryProvider || 'None'}
                  </div>
                  <div className="text-sm text-gray-600">Primary Provider</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configure Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PROVIDER_TYPES.map((type) => (
                  <div key={type.value} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{type.label}</h4>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedProvider(type.value)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Provider
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Error Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const errorStats = getErrorStats();
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{errorStats.totalErrors}</div>
                        <div className="text-sm text-gray-600">Total Errors</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {Object.keys(errorStats.errorsByProvider).length}
                        </div>
                        <div className="text-sm text-gray-600">Affected Providers</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {errorStats.recentErrors.length}
                        </div>
                        <div className="text-sm text-gray-600">Recent Errors</div>
                      </div>
                    </div>

                    {errorStats.recentErrors.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recent Errors</h4>
                        <div className="space-y-2">
                          {errorStats.recentErrors.slice(0, 5).map((error, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <span className="text-sm font-medium">{error.operation}</span>
                                <span className="text-sm text-gray-600 ml-2">via {error.provider}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {error.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="retry_enabled">Enable Retry Logic</Label>
                    <p className="text-sm text-gray-600">Automatically retry failed email sends</p>
                  </div>
                  <Switch id="retry_enabled" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="failover_enabled">Enable Failover</Label>
                    <p className="text-sm text-gray-600">Use backup providers when primary fails</p>
                  </div>
                  <Switch id="failover_enabled" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="webhook_enabled">Enable Webhooks</Label>
                    <p className="text-sm text-gray-600">Process delivery and engagement events</p>
                  </div>
                  <Switch id="webhook_enabled" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
