'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, Cloud, Circle, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Webhook, 
  Edit, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { WebhookConfiguration } from '@/types/webhooks';
import { webhookConfigService } from '@/services/webhooks/configurationService';
import { useToast } from '@/hooks/use-toast';

interface WebhookListProps {
  refreshKey: number;
  onEdit: (id: string) => void;
}

export function WebhookList({ refreshKey, onEdit }: WebhookListProps) {
  const [webhooks, setWebhooks] = useState<WebhookConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadWebhooks();
  }, [refreshKey]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cms/webhooks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load webhooks');

      const data = await response.json();
      setWebhooks(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load webhooks',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWebhook = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/cms/webhooks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ is_active: isActive })
      });

      if (!response.ok) throw new Error('Failed to update webhook');

      toast({
        title: 'Success',
        description: `Webhook ${isActive ? 'enabled' : 'disabled'}`
      });

      loadWebhooks();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update webhook',
        variant: 'destructive'
      });
    }
  };

  const testWebhook = async (id: string) => {
    try {
      setTesting(id);
      const response = await fetch(`/api/cms/webhooks/${id}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to test webhook');

      const result = await response.json();
      
      toast({
        title: result.success ? 'Success' : 'Failed',
        description: result.error || 'Test webhook sent successfully',
        variant: result.success ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test webhook',
        variant: 'destructive'
      });
    } finally {
      setTesting(null);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch(`/api/cms/webhooks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete webhook');

      toast({
        title: 'Success',
        description: 'Webhook deleted successfully'
      });

      loadWebhooks();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive'
      });
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'hubspot':
        return <Circle className="w-4 h-4 text-orange-500" />;
      case 'salesforce':
        return <Cloud className="w-4 h-4 text-blue-500" />;
      case 'make':
        return <Circle className="w-4 h-4 text-purple-500" />;
      default:
        return <LinkIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading webhooks...</div>;
  }

  if (webhooks.length === 0) {
    return (
      <div className="text-center py-8">
        <Webhook className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          No webhooks configured yet. Click "Add Webhook" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {webhooks.map((webhook) => (
        <div
          key={webhook.id}
          className="border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{getProviderIcon(webhook.provider_type || 'custom')}</span>
                <h3 className="font-medium text-lg">{webhook.name}</h3>
                <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                  {webhook.provider_type}
                </Badge>
                {webhook.test_mode && (
                  <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Test Mode
                  </Badge>
                )}
              </div>

              {webhook.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {webhook.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <code className="text-xs">{webhook.endpoint_url}</code>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={webhook.is_active}
                onCheckedChange={(checked) => webhook.id && toggleWebhook(webhook.id, checked)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => webhook.id && testWebhook(webhook.id)}
                disabled={testing === webhook.id}
              >
                {testing === webhook.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => webhook.id && onEdit(webhook.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => webhook.id && deleteWebhook(webhook.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}