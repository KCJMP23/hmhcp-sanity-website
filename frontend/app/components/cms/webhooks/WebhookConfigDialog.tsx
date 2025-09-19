'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { WebhookConfiguration, WebhookProviderType, FieldMapping } from '@/types/webhooks';
import { Webhook, Settings, Map, Shield, TestTube } from 'lucide-react';
import { FieldMappingEditor } from './FieldMappingEditor';

interface WebhookConfigDialogProps {
  webhookId?: string | null;
  onClose: () => void;
}

export function WebhookConfigDialog({ webhookId, onClose }: WebhookConfigDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState<Partial<WebhookConfiguration>>({
    name: '',
    description: '',
    endpoint_url: '',
    provider_type: 'make' as WebhookProviderType,
    auth_type: 'webhook_secret',
    auth_config: {},
    field_mapping: {},
    retry_config: {
      max_attempts: 3,
      backoff_multiplier: 2,
      initial_delay_ms: 1000,
      max_delay_ms: 300000
    },
    is_active: true,
    test_mode: false
  });

  useEffect(() => {
    if (webhookId) {
      loadWebhook();
    }
  }, [webhookId]);

  const loadWebhook = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cms/webhooks/${webhookId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load webhook');

      const data = await response.json();
      setConfig(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load webhook configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const url = webhookId 
        ? `/api/cms/webhooks/${webhookId}`
        : '/api/cms/webhooks';
      
      const method = webhookId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Failed to save webhook');

      toast({
        title: 'Success',
        description: `Webhook ${webhookId ? 'updated' : 'created'} successfully`
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save webhook configuration',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProviderChange = (provider: WebhookProviderType) => {
    setConfig(prev => ({
      ...prev,
      provider_type: provider,
      auth_type: getDefaultAuthType(provider),
      auth_config: getDefaultAuthConfig(provider)
    }));
  };

  const getDefaultAuthType = (provider: WebhookProviderType) => {
    switch (provider) {
      case 'hubspot': return 'oauth2';
      case 'salesforce': return 'jwt';
      case 'make': return 'webhook_secret';
      default: return 'api_key';
    }
  };

  const getDefaultAuthConfig = (provider: WebhookProviderType) => {
    switch (provider) {
      case 'hubspot':
        return { client_id: '', client_secret: '', refresh_token: '' };
      case 'salesforce':
        return { client_id: '', private_key: '', username: '', login_url: 'https://login.salesforce.com' };
      case 'make':
        return { webhook_secret: '' };
      default:
        return { api_key: '' };
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            {webhookId ? 'Edit Webhook' : 'Create New Webhook'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="mapping" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Field Mapping
            </TabsTrigger>
            <TabsTrigger value="auth" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Authentication
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-6">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My CRM Webhook"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={config.description}
                onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this webhook does..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="provider">Provider</Label>
              <Select 
                value={config.provider_type} 
                onValueChange={handleProviderChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hubspot">HubSpot</SelectItem>
                  <SelectItem value="salesforce">Salesforce</SelectItem>
                  <SelectItem value="make">Make.com</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input
                id="endpoint"
                type="url"
                value={config.endpoint_url}
                onChange={(e) => setConfig(prev => ({ ...prev, endpoint_url: e.target.value }))}
                placeholder="https://hook.make.com/..."
                required
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={config.is_active}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="test_mode"
                  checked={config.test_mode}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, test_mode: checked }))}
                />
                <Label htmlFor="test_mode">Test Mode</Label>
              </div>
            </div>

            <div>
              <Label>Retry Configuration</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="max_attempts" className="text-sm">Max Attempts</Label>
                  <Input
                    id="max_attempts"
                    type="number"
                    value={config.retry_config?.max_attempts || 3}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      retry_config: { 
                        ...prev.retry_config!, 
                        max_attempts: parseInt(e.target.value) 
                      }
                    }))}
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <Label htmlFor="backoff_multiplier" className="text-sm">Backoff Multiplier</Label>
                  <Input
                    id="backoff_multiplier"
                    type="number"
                    value={config.retry_config?.backoff_multiplier || 2}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      retry_config: { 
                        ...prev.retry_config!, 
                        backoff_multiplier: parseFloat(e.target.value) 
                      }
                    }))}
                    min="1"
                    max="5"
                    step="0.5"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="mt-6">
            <FieldMappingEditor
              mapping={config.field_mapping || {}}
              onChange={(mapping) => setConfig(prev => ({ ...prev, field_mapping: mapping }))}
              provider={config.provider_type!}
            />
          </TabsContent>

          <TabsContent value="auth" className="space-y-4 mt-6">
            <div>
              <Label>Authentication Type</Label>
              <Badge variant="outline" className="mt-2">
                {config.auth_type}
              </Badge>
            </div>

            {config.provider_type === 'hubspot' && (
              <>
                <div>
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    value={config.auth_config?.client_id || ''}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      auth_config: { ...prev.auth_config, client_id: e.target.value }
                    }))}
                    placeholder="HubSpot App Client ID"
                  />
                </div>
                <div>
                  <Label htmlFor="client_secret">Client Secret</Label>
                  <Input
                    id="client_secret"
                    type="password"
                    value={config.auth_config?.client_secret || ''}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      auth_config: { ...prev.auth_config, client_secret: e.target.value }
                    }))}
                    placeholder="HubSpot App Client Secret"
                  />
                </div>
                <div>
                  <Label htmlFor="refresh_token">Refresh Token</Label>
                  <Input
                    id="refresh_token"
                    value={config.auth_config?.refresh_token || ''}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      auth_config: { ...prev.auth_config, refresh_token: e.target.value }
                    }))}
                    placeholder="OAuth Refresh Token"
                  />
                </div>
              </>
            )}

            {config.provider_type === 'salesforce' && (
              <>
                <div>
                  <Label htmlFor="sf_client_id">Client ID</Label>
                  <Input
                    id="sf_client_id"
                    value={config.auth_config?.client_id || ''}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      auth_config: { ...prev.auth_config, client_id: e.target.value }
                    }))}
                    placeholder="Salesforce Connected App Consumer Key"
                  />
                </div>
                <div>
                  <Label htmlFor="sf_username">Username</Label>
                  <Input
                    id="sf_username"
                    type="email"
                    value={config.auth_config?.username || ''}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      auth_config: { ...prev.auth_config, username: e.target.value }
                    }))}
                    placeholder="salesforce@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="private_key">Private Key</Label>
                  <Textarea
                    id="private_key"
                    value={config.auth_config?.private_key || ''}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      auth_config: { ...prev.auth_config, private_key: e.target.value }
                    }))}
                    placeholder="-----BEGIN RSA PRIVATE KEY-----"
                    rows={5}
                    className="font-mono text-xs"
                  />
                </div>
              </>
            )}

            {config.provider_type === 'make' && (
              <div>
                <Label htmlFor="webhook_secret">Webhook Secret</Label>
                <Input
                  id="webhook_secret"
                  type="password"
                  value={config.auth_config?.webhook_secret || ''}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    auth_config: { ...prev.auth_config, webhook_secret: e.target.value }
                  }))}
                  placeholder="Secret for webhook signature verification"
                />
              </div>
            )}

            {config.provider_type === 'custom' && (
              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={config.auth_config?.api_key || ''}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    auth_config: { ...prev.auth_config, api_key: e.target.value }
                  }))}
                  placeholder="Your API key"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="test" className="mt-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Save your webhook configuration first, then you can test it from the webhook list.
              </p>
              {webhookId && (
                <Button variant="outline" disabled>
                  Test functionality available after saving
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : (webhookId ? 'Update' : 'Create')} Webhook
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}