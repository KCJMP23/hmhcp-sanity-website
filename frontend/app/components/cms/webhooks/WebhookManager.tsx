'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Webhook, Plus, RefreshCw, Activity, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { WebhookEndpoint, WebhookLog } from './types'
import { WebhookStats } from './WebhookStats'
import { WebhookEndpointsTab } from './WebhookEndpointsTab'
import { WebhookLogsTab } from './WebhookLogsTab'
import { WebhookSettingsTab } from './WebhookSettingsTab'
import { WebhookForm } from './WebhookForm'
import { logger } from '@/lib/logger';

interface WebhookManagerProps {
  className?: string
}

export function WebhookManager({ className }: WebhookManagerProps) {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([])
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [activeTab, setActiveTab] = useState<'endpoints' | 'logs' | 'settings'>('endpoints')
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(null)
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    loadWebhooks()
    loadLogs()
  }, [])

  const loadWebhooks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/cms/webhooks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks)
      }
    } catch (error) {
      logger.error('Error loading webhooks:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      toast({
        title: 'Error',
        description: 'Failed to load webhooks',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadLogs = async (webhookId?: string) => {
    try {
      const url = webhookId 
        ? `/api/cms/webhooks/logs?webhookId=${webhookId}`
        : '/api/cms/webhooks/logs'
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
      }
    } catch (error) {
      logger.error('Error loading webhook logs:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const createWebhook = async (webhookData: Partial<WebhookEndpoint>) => {
    try {
      const response = await fetch('/api/cms/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(webhookData)
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Webhook created successfully'
        })
        loadWebhooks()
        setShowCreateModal(false)
      } else {
        throw new Error('Failed to create webhook')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create webhook',
        variant: 'destructive'
      })
    }
  }

  const updateWebhook = async (id: string, updates: Partial<WebhookEndpoint>) => {
    try {
      const response = await fetch(`/api/cms/webhooks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Webhook updated successfully'
        })
        loadWebhooks()
        setEditingWebhook(null)
      } else {
        throw new Error('Failed to update webhook')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update webhook',
        variant: 'destructive'
      })
    }
  }

  const deleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return
    
    try {
      const response = await fetch(`/api/cms/webhooks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Webhook deleted successfully'
        })
        loadWebhooks()
      } else {
        throw new Error('Failed to delete webhook')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive'
      })
    }
  }

  const testWebhook = async (id: string) => {
    setTestingWebhook(id)
    try {
      const response = await fetch(`/api/cms/webhooks/${id}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Test webhook sent successfully'
        })
        loadLogs()
      } else {
        throw new Error('Failed to test webhook')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test webhook',
        variant: 'destructive'
      })
    } finally {
      setTestingWebhook(null)
    }
  }

  const toggleWebhook = async (id: string, enabled: boolean) => {
    await updateWebhook(id, { enabled })
  }


  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="w-6 h-6" />
            Webhook Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure webhooks for external integrations like Make.com and Zapier
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            loadWebhooks()
            loadLogs()
            setRefreshKey(prev => prev + 1)
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Webhook
          </Button>
        </div>
      </div>

      {/* Stats */}
      <WebhookStats refreshKey={refreshKey} />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'endpoints', label: 'Endpoints', icon: Webhook },
            { id: 'logs', label: 'Activity Logs', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'endpoints' && (
        <WebhookEndpointsTab
          webhooks={webhooks}
          testingWebhook={testingWebhook}
          onCreateNew={() => setShowCreateModal(true)}
          onEdit={setEditingWebhook}
          onDelete={deleteWebhook}
          onTest={testWebhook}
          onToggle={toggleWebhook}
        />
      )}

      {activeTab === 'logs' && (
        <WebhookLogsTab logs={logs} onRefresh={loadLogs} />
      )}

      {activeTab === 'settings' && <WebhookSettingsTab />}

      {/* Create/Edit Modal would go here */}
      {(showCreateModal || editingWebhook) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <WebhookForm
              webhook={editingWebhook}
              onSave={editingWebhook ? (data) => updateWebhook(editingWebhook.id, data) : createWebhook}
              onCancel={() => {
                setShowCreateModal(false)
                setEditingWebhook(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

