'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Webhook,
  Plus,
  Edit,
  Trash2,
  TestTube,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { WebhookEndpoint } from './types'
import { getStatusIcon } from './WebhookHelpers'

interface WebhookEndpointsTabProps {
  webhooks: WebhookEndpoint[]
  testingWebhook: string | null
  onCreateNew: () => void
  onEdit: (webhook: WebhookEndpoint) => void
  onDelete: (id: string) => void
  onTest: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
}

export function WebhookEndpointsTab({
  webhooks,
  testingWebhook,
  onCreateNew,
  onEdit,
  onDelete,
  onTest,
  onToggle
}: WebhookEndpointsTabProps) {
  if (webhooks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Webhook className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Webhooks Configured</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Set up webhooks to integrate with external services like Make.com and Zapier.
        </p>
        <Button onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Webhook
        </Button>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {webhooks.map(webhook => (
        <Card key={webhook.id} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-medium">{webhook.name}</h3>
                <Switch 
                  checked={webhook.enabled}
                  onCheckedChange={(enabled) => onToggle(webhook.id, enabled)}
                />
                {webhook.lastStatus && getStatusIcon(webhook.lastStatus)}
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {webhook.description || 'No description provided'}
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  <span className="font-mono">{webhook.url}</span>
                </div>
                <div>
                  <span className="text-gray-500">Events:</span>
                  <span className="ml-1">{webhook.events.length}</span>
                </div>
                {webhook.lastTriggered && (
                  <div>
                    <span className="text-gray-500">Last triggered:</span>
                    <span className="ml-1">{new Date(webhook.lastTriggered).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1 mt-3">
                {webhook.events.slice(0, 3).map(event => (
                  <Badge key={event} variant="outline" className="text-xs">
                    {event}
                  </Badge>
                ))}
                {webhook.events.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{webhook.events.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTest(webhook.id)}
                disabled={testingWebhook === webhook.id}
              >
                {testingWebhook === webhook.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(webhook)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(webhook.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}