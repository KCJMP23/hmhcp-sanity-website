'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { WebhookEndpoint, WEBHOOK_EVENTS } from './types'
import { CSRFProtectedCMSForm } from '@/components/cms/forms/CSRFProtectedCMSForm'

interface WebhookFormProps {
  webhook?: WebhookEndpoint | null
  onSave: (data: Partial<WebhookEndpoint>) => void
  onCancel: () => void
}

export function WebhookForm({ webhook, onSave, onCancel }: WebhookFormProps) {
  const [formData, setFormData] = useState({
    name: webhook?.name || '',
    url: webhook?.url || '',
    secret: webhook?.secret || '',
    description: webhook?.description || '',
    enabled: webhook?.enabled ?? true,
    events: webhook?.events || [],
    retryAttempts: webhook?.retryAttempts || 3,
    timeout: webhook?.timeout || 30,
    headers: webhook?.headers || {}
  })

  const handleSubmit = () => {
    onSave(formData)
  }

  const toggleEvent = (event: string) => {
    const events = formData.events.includes(event)
      ? formData.events.filter(e => e !== event)
      : [...formData.events, event]
    setFormData({ ...formData, events })
  }

  return (
    <CSRFProtectedCMSForm onSubmit={handleSubmit} className="p-6">
      <h2 className="text-xl font-semibold mb-6">
        {webhook ? 'Edit Webhook' : 'Create Webhook'}
      </h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My Webhook"
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="url">URL *</Label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://hook.make.com/..."
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what this webhook does..."
            rows={3}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="secret">Secret (optional)</Label>
          <Input
            id="secret"
            type="password"
            value={formData.secret}
            onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
            placeholder="Webhook secret for verification"
            className="mt-1"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timeout">Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              value={formData.timeout}
              onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
              min="1"
              max="300"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="retryAttempts">Retry Attempts</Label>
            <Input
              id="retryAttempts"
              type="number"
              value={formData.retryAttempts}
              onChange={(e) => setFormData({ ...formData, retryAttempts: parseInt(e.target.value) })}
              min="0"
              max="10"
              className="mt-1"
            />
          </div>
        </div>
        
        <div>
          <Label>Events to Listen For</Label>
          <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 p-3">
            <div className="grid grid-cols-1 gap-2">
              {WEBHOOK_EVENTS.map(event => (
                <label key={event.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event.value)}
                    onChange={() => toggleEvent(event.value)}
                    className="border-gray-300"
                  />
                  <span className="text-sm">{event.label}</span>
                  <code className="text-xs text-gray-500">{event.value}</code>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.enabled}
            onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
          />
          <Label>Enable webhook</Label>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {webhook ? 'Update' : 'Create'} Webhook
        </Button>
      </div>
    </CSRFProtectedCMSForm>
  )
}