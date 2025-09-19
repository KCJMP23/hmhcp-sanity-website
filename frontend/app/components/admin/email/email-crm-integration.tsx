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
  Database,
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
  Activity
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CRMIntegration {
  id: string
  name: string
  type: 'epic' | 'cerner' | 'allscripts' | 'custom'
  status: 'active' | 'inactive' | 'error' | 'testing'
  last_sync: string
  sync_frequency: string
  patient_count: number
  appointment_count: number
  created_at: string
  config: {
    api_endpoint: string
    api_key: string
    sync_fields: string[]
    webhook_url: string
  }
}

const crmTypes = [
  { value: 'epic', label: 'Epic MyChart', description: 'Epic Systems integration' },
  { value: 'cerner', label: 'Cerner PowerChart', description: 'Cerner Corporation integration' },
  { value: 'allscripts', label: 'Allscripts', description: 'Allscripts integration' },
  { value: 'custom', label: 'Custom CRM', description: 'Custom healthcare CRM system' }
]

const syncFrequencies = [
  { value: 'realtime', label: 'Real-time', description: 'Sync immediately on changes' },
  { value: '5min', label: 'Every 5 minutes', description: 'Sync every 5 minutes' },
  { value: '15min', label: 'Every 15 minutes', description: 'Sync every 15 minutes' },
  { value: '1hour', label: 'Every hour', description: 'Sync every hour' },
  { value: '6hours', label: 'Every 6 hours', description: 'Sync every 6 hours' },
  { value: 'daily', label: 'Daily', description: 'Sync once per day' }
]

const syncFields = [
  { value: 'patient_demographics', label: 'Patient Demographics', required: true },
  { value: 'appointment_data', label: 'Appointment Data', required: true },
  { value: 'medical_history', label: 'Medical History', required: false },
  { value: 'insurance_info', label: 'Insurance Information', required: false },
  { value: 'contact_preferences', label: 'Contact Preferences', required: true },
  { value: 'communication_log', label: 'Communication Log', required: false }
]

export function EmailCRMIntegration() {
  const [integrations, setIntegrations] = useState<CRMIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<CRMIntegration | null>(null)
  const [formData, setFormData] = useState<Partial<CRMIntegration>>({
    name: '',
    type: 'epic',
    sync_frequency: 'realtime',
    config: {
      api_endpoint: '',
      api_key: '',
      sync_fields: ['patient_demographics', 'appointment_data', 'contact_preferences'],
      webhook_url: ''
    }
  })
  const { toast } = useToast()

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email/integrations/crm')
      const data = await response.json()
      
      if (data.success) {
        setIntegrations(data.data)
      } else {
        throw new Error(data.error || 'Failed to load CRM integrations')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load CRM integrations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingIntegration?.id 
        ? `/api/admin/email/integrations/crm/${editingIntegration.id}`
        : '/api/admin/email/integrations/crm'
      
      const method = editingIntegration?.id ? 'PUT' : 'POST'
      
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
          description: editingIntegration?.id ? 'Integration updated successfully' : 'Integration created successfully'
        })
        setShowDialog(false)
        setEditingIntegration(null)
        setFormData({
          name: '',
          type: 'epic',
          sync_frequency: 'realtime',
          config: {
            api_endpoint: '',
            api_key: '',
            sync_fields: ['patient_demographics', 'appointment_data', 'contact_preferences'],
            webhook_url: ''
          }
        })
        loadIntegrations()
      } else {
        throw new Error('Failed to save integration')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save integration',
        variant: 'destructive'
      })
    }
  }

  const handleTest = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/admin/email/integrations/crm/${integrationId}/test`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Integration test completed successfully'
        })
        loadIntegrations()
      } else {
        throw new Error('Integration test failed')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Integration test failed',
        variant: 'destructive'
      })
    }
  }

  const handleSync = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/admin/email/integrations/crm/${integrationId}/sync`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Data sync initiated successfully'
        })
        loadIntegrations()
      } else {
        throw new Error('Data sync failed')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Data sync failed',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return
    
    try {
      const response = await fetch(`/api/admin/email/integrations/crm/${integrationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Integration deleted successfully'
        })
        loadIntegrations()
      } else {
        throw new Error('Failed to delete integration')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete integration',
        variant: 'destructive'
      })
    }
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

  const getCRMTypeInfo = (type: string) => {
    return crmTypes.find(t => t.value === type) || crmTypes[0]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading CRM integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CRM Integrations</h2>
          <p className="text-muted-foreground">
            Connect email campaigns with healthcare CRM systems
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingIntegration(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingIntegration ? 'Edit CRM Integration' : 'Add CRM Integration'}
              </DialogTitle>
              <DialogDescription>
                Configure integration with your healthcare CRM system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Integration Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter integration name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">CRM Type *</Label>
                  <Select
                    value={formData.type || 'epic'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select CRM type" />
                    </SelectTrigger>
                    <SelectContent>
                      {crmTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api_endpoint">API Endpoint *</Label>
                <Input
                  id="api_endpoint"
                  value={formData.config?.api_endpoint || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    config: { ...prev.config!, api_endpoint: e.target.value }
                  }))}
                  placeholder="https://api.example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key *</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.config?.api_key || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    config: { ...prev.config!, api_key: e.target.value }
                  }))}
                  placeholder="Enter API key"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  value={formData.config?.webhook_url || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    config: { ...prev.config!, webhook_url: e.target.value }
                  }))}
                  placeholder="https://webhook.example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sync_frequency">Sync Frequency *</Label>
                <Select
                  value={formData.sync_frequency || 'realtime'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sync_frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sync frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {syncFrequencies.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        <div>
                          <div className="font-medium">{freq.label}</div>
                          <div className="text-xs text-muted-foreground">{freq.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Sync Fields *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {syncFields.map((field) => (
                    <div key={field.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={field.value}
                        checked={formData.config?.sync_fields?.includes(field.value) || false}
                        onChange={(e) => {
                          const currentFields = formData.config?.sync_fields || []
                          const newFields = e.target.checked
                            ? [...currentFields, field.value]
                            : currentFields.filter(f => f !== field.value)
                          setFormData(prev => ({ 
                            ...prev, 
                            config: { ...prev.config!, sync_fields: newFields }
                          }))
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={field.value} className="text-sm">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingIntegration ? 'Update' : 'Create'} Integration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Integrations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            CRM Integrations
          </CardTitle>
          <CardDescription>
            Manage your healthcare CRM system integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Appointments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integrations.map((integration) => {
                const typeInfo = getCRMTypeInfo(integration.type)
                
                return (
                  <TableRow key={integration.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{integration.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {typeInfo.label}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(integration.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(integration.last_sync).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {integration.patient_count.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {integration.appointment_count.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTest(integration.id)}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSync(integration.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingIntegration(integration)
                            setFormData(integration)
                            setShowDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(integration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Integration Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Integration Health
          </CardTitle>
          <CardDescription>
            Monitor the health and performance of your CRM integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Sync Performance</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Sync Time</span>
                  <span className="text-sm font-medium">2.3s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="text-sm font-medium text-green-600">99.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Error</span>
                  <span className="text-sm font-medium text-gray-500">None</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Data Quality</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Complete Records</span>
                  <span className="text-sm font-medium">98.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Duplicate Records</span>
                  <span className="text-sm font-medium text-red-600">0.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Validation Errors</span>
                  <span className="text-sm font-medium text-yellow-600">1.0%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
