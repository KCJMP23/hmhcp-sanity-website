'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Webhook,
  Plus,
  Settings,
  TestTube,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Trash2,
  Edit,
  Shield,
  Activity,
  Eye,
  Copy,
  ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  status: 'active' | 'inactive' | 'error' | 'testing'
  last_triggered: string
  success_count: number
  error_count: number
  created_at: string
  secret: string
  retry_count: number
  timeout: number
}

const webhookEvents = [
  { value: 'email_sent', label: 'Email Sent', description: 'Triggered when an email is sent' },
  { value: 'email_opened', label: 'Email Opened', description: 'Triggered when an email is opened' },
  { value: 'email_clicked', label: 'Email Clicked', description: 'Triggered when an email link is clicked' },
  { value: 'email_bounced', label: 'Email Bounced', description: 'Triggered when an email bounces' },
  { value: 'email_unsubscribed', label: 'Email Unsubscribed', description: 'Triggered when a user unsubscribes' },
  { value: 'campaign_created', label: 'Campaign Created', description: 'Triggered when a campaign is created' },
  { value: 'campaign_sent', label: 'Campaign Sent', description: 'Triggered when a campaign is sent' },
  { value: 'contact_added', label: 'Contact Added', description: 'Triggered when a contact is added' },
  { value: 'contact_updated', label: 'Contact Updated', description: 'Triggered when a contact is updated' },
  { value: 'appointment_scheduled', label: 'Appointment Scheduled', description: 'Triggered when an appointment is scheduled' },
  { value: 'appointment_cancelled', label: 'Appointment Cancelled', description: 'Triggered when an appointment is cancelled' },
  { value: 'conversion_completed', label: 'Conversion Completed', description: 'Triggered when a conversion is completed' }
]

const timeoutOptions = [
  { value: 5, label: '5 seconds' },
  { value: 10, label: '10 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' }
]

const retryOptions = [
  { value: 0, label: 'No retries' },
  { value: 1, label: '1 retry' },
  { value: 3, label: '3 retries' },
  { value: 5, label: '5 retries' },
  { value: 10, label: '10 retries' }
]

export function EmailWebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null)
  const [formData, setFormData] = useState<Partial<WebhookConfig>>({
    name: '',
    url: '',
    events: ['email_sent', 'email_opened'],
    secret: '',
    retry_count: 3,
    timeout: 30
  })
  const { toast } = useToast()

  useEffect(() => {
    loadWebhooks()
  }, [])

  const loadWebhooks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email/integrations/webhooks')
      const data = await response.json()
      
      if (data.success) {
        setWebhooks(data.data)
      } else {
        throw new Error(data.error || 'Failed to load webhooks')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load webhooks',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingWebhook?.id 
        ? `/api/admin/email/integrations/webhooks/${editingWebhook.id}`
        : '/api/admin/email/integrations/webhooks'
      
      const method = editingWebhook?.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: editingWebhook?.id ? 'Webhook updated successfully' : 'Webhook created successfully'
        })
        setShowDialog(false)
        setEditingWebhook(null)
        setFormData({
          name: '',
          url: '',
          events: ['email_sent', 'email_opened'],
          secret: '',
          retry_count: 3,
          timeout: 30
        })
        loadWebhooks()
      } else {
        throw new Error('Failed to save webhook')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save webhook',
        variant: 'destructive'
      })
    }
  }

  const handleTest = async (webhookId: string) => {
    try {
      const response = await fetch(`/api/admin/email/integrations/webhooks/${webhookId}/test`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Webhook test completed successfully'
        })
        loadWebhooks()
      } else {
        throw new Error('Webhook test failed')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Webhook test failed',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return
    
    try {
      const response = await fetch(`/api/admin/email/integrations/webhooks/${webhookId}`, {
        method: 'DELETE'
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

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    toast({
      title: 'Success',
      description: 'Webhook secret copied to clipboard'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      error: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      testing: { color: 'bg-yellow-100 text-yellow-800', icon: TestTube }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getSuccessRate = (webhook: WebhookConfig) => {
    const total = webhook.success_count + webhook.error_count
    return total > 0 ? ((webhook.success_count / total) * 100).toFixed(1) : '0.0'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading webhooks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhook Management</h2>
          <p className="text-muted-foreground">
            Configure webhooks for real-time event notifications
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingWebhook(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingWebhook ? 'Edit Webhook' : 'Add Webhook'}
              </DialogTitle>
              <DialogDescription>
                Configure webhook for real-time event notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Webhook Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter webhook name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url">Webhook URL *</Label>
                <Input
                  id="url"
                  value={formData.url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://your-webhook-endpoint.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secret">Webhook Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="secret"
                    type="password"
                    value={formData.secret || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                    placeholder="Enter webhook secret"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const randomSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                      setFormData(prev => ({ ...prev, secret: randomSecret }))
                    }}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Events to Trigger *</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {webhookEvents.map((event) => (
                    <div key={event.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={event.value}
                        checked={formData.events?.includes(event.value) || false}
                        onChange={(e) => {
                          const currentEvents = formData.events || []
                          const newEvents = e.target.checked
                            ? [...currentEvents, event.value]
                            : currentEvents.filter(ev => ev !== event.value)
                          setFormData(prev => ({ ...prev, events: newEvents }))
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={event.value} className="text-sm">
                        {event.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retry_count">Retry Count</Label>
                  <Select
                    value={formData.retry_count?.toString() || '3'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, retry_count: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select retry count" />
                    </SelectTrigger>
                    <SelectContent>
                      {retryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout</Label>
                  <Select
                    value={formData.timeout?.toString() || '30'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, timeout: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeoutOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingWebhook ? 'Update' : 'Create'} Webhook
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhooks
          </CardTitle>
          <CardDescription>
            Manage your webhook configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Last Triggered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{webhook.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {webhook.events.length} events
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono truncate max-w-48">
                        {webhook.url}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(webhook.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(webhook.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 2).map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event.replace('_', ' ')}
                        </Badge>
                      ))}
                      {webhook.events.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{webhook.events.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getSuccessRate(webhook)}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            parseFloat(getSuccessRate(webhook)) >= 90 ? 'bg-green-500' :
                            parseFloat(getSuccessRate(webhook)) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${getSuccessRate(webhook)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(webhook.last_triggered).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTest(webhook.id)}
                      >
                        <TestTube className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopySecret(webhook.secret)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingWebhook(webhook)
                          setFormData(webhook)
                          setShowDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Webhook Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhooks.length}</div>
            <p className="text-xs text-muted-foreground">
              {webhooks.filter(w => w.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webhooks.reduce((sum, w) => sum + w.success_count + w.error_count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webhooks.length > 0 
                ? (webhooks.reduce((sum, w) => sum + parseFloat(getSuccessRate(w)), 0) / webhooks.length).toFixed(1)
                : '0.0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all webhooks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webhooks.length > 0 
                ? (100 - (webhooks.reduce((sum, w) => sum + parseFloat(getSuccessRate(w)), 0) / webhooks.length)).toFixed(1)
                : '0.0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all webhooks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Webhook Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Webhook Documentation
          </CardTitle>
          <CardDescription>
            Information about webhook payloads and security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Webhook Payload Structure</h4>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm">
{`{
  "event": "email_sent",
  "timestamp": "2025-01-27T10:30:00Z",
  "data": {
    "email_id": "12345",
    "campaign_id": "67890",
    "recipient": "patient@example.com",
    "subject": "Appointment Reminder",
    "status": "sent"
  },
  "signature": "sha256=abc123..."
}`}
                </pre>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Security</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>All webhooks are signed with HMAC-SHA256</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>HTTPS is required for all webhook URLs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Webhook secrets are encrypted and stored securely</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
