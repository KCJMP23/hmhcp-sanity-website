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
  Users,
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
  Mail,
  Calendar,
  FileText,
  Bell
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PatientPortal {
  id: string
  name: string
  type: 'mychart' | 'patient_gateway' | 'custom'
  status: 'active' | 'inactive' | 'error' | 'testing'
  last_sync: string
  patient_count: number
  message_count: number
  appointment_count: number
  created_at: string
  config: {
    api_endpoint: string
    api_key: string
    webhook_url: string
    features: string[]
  }
}

const portalTypes = [
  { value: 'mychart', label: 'Epic MyChart', description: 'Epic Systems patient portal' },
  { value: 'patient_gateway', label: 'Patient Gateway', description: 'Cerner patient portal' },
  { value: 'custom', label: 'Custom Portal', description: 'Custom patient portal system' }
]

const portalFeatures = [
  { value: 'appointment_booking', label: 'Appointment Booking', description: 'Allow patients to book appointments' },
  { value: 'message_center', label: 'Message Center', description: 'Secure messaging between patients and providers' },
  { value: 'test_results', label: 'Test Results', description: 'Access to lab and test results' },
  { value: 'prescription_refills', label: 'Prescription Refills', description: 'Request prescription refills' },
  { value: 'billing_portal', label: 'Billing Portal', description: 'View and pay bills online' },
  { value: 'health_records', label: 'Health Records', description: 'Access to medical records' },
  { value: 'telehealth', label: 'Telehealth', description: 'Virtual appointments and consultations' },
  { value: 'medication_reminders', label: 'Medication Reminders', description: 'Automated medication reminders' }
]

export function EmailPatientPortal() {
  const [portals, setPortals] = useState<PatientPortal[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingPortal, setEditingPortal] = useState<PatientPortal | null>(null)
  const [formData, setFormData] = useState<Partial<PatientPortal>>({
    name: '',
    type: 'mychart',
    config: {
      api_endpoint: '',
      api_key: '',
      webhook_url: '',
      features: ['appointment_booking', 'message_center', 'test_results']
    }
  })
  const { toast } = useToast()

  useEffect(() => {
    loadPortals()
  }, [])

  const loadPortals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email/integrations/patient-portals')
      const data = await response.json()
      
      if (data.success) {
        setPortals(data.data)
      } else {
        throw new Error(data.error || 'Failed to load patient portals')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load patient portals',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingPortal?.id 
        ? `/api/admin/email/integrations/patient-portals/${editingPortal.id}`
        : '/api/admin/email/integrations/patient-portals'
      
      const method = editingPortal?.id ? 'PUT' : 'POST'
      
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
          description: editingPortal?.id ? 'Portal updated successfully' : 'Portal created successfully'
        })
        setShowDialog(false)
        setEditingPortal(null)
        setFormData({
          name: '',
          type: 'mychart',
          config: {
            api_endpoint: '',
            api_key: '',
            webhook_url: '',
            features: ['appointment_booking', 'message_center', 'test_results']
          }
        })
        loadPortals()
      } else {
        throw new Error('Failed to save portal')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save portal',
        variant: 'destructive'
      })
    }
  }

  const handleTest = async (portalId: string) => {
    try {
      const response = await fetch(`/api/admin/email/integrations/patient-portals/${portalId}/test`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Portal test completed successfully'
        })
        loadPortals()
      } else {
        throw new Error('Portal test failed')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Portal test failed',
        variant: 'destructive'
      })
    }
  }

  const handleSync = async (portalId: string) => {
    try {
      const response = await fetch(`/api/admin/email/integrations/patient-portals/${portalId}/sync`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Data sync initiated successfully'
        })
        loadPortals()
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

  const handleDelete = async (portalId: string) => {
    if (!confirm('Are you sure you want to delete this portal integration?')) return
    
    try {
      const response = await fetch(`/api/admin/email/integrations/patient-portals/${portalId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Portal deleted successfully'
        })
        loadPortals()
      } else {
        throw new Error('Failed to delete portal')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete portal',
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

  const getPortalTypeInfo = (type: string) => {
    return portalTypes.find(t => t.value === type) || portalTypes[0]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading patient portals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patient Portal Integration</h2>
          <p className="text-muted-foreground">
            Connect email campaigns with patient portal systems
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPortal(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Portal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPortal ? 'Edit Patient Portal' : 'Add Patient Portal'}
              </DialogTitle>
              <DialogDescription>
                Configure integration with your patient portal system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Portal Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter portal name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Portal Type *</Label>
                  <Select
                    value={formData.type || 'mychart'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select portal type" />
                    </SelectTrigger>
                    <SelectContent>
                      {portalTypes.map((type) => (
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
                  placeholder="https://api.patientportal.com"
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
                <Label>Portal Features *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {portalFeatures.map((feature) => (
                    <div key={feature.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={feature.value}
                        checked={formData.config?.features?.includes(feature.value) || false}
                        onChange={(e) => {
                          const currentFeatures = formData.config?.features || []
                          const newFeatures = e.target.checked
                            ? [...currentFeatures, feature.value]
                            : currentFeatures.filter(f => f !== feature.value)
                          setFormData(prev => ({ 
                            ...prev, 
                            config: { ...prev.config!, features: newFeatures }
                          }))
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={feature.value} className="text-sm">
                        {feature.label}
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
                  {editingPortal ? 'Update' : 'Create'} Portal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Portals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Patient Portals
          </CardTitle>
          <CardDescription>
            Manage your patient portal integrations
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
                <TableHead>Messages</TableHead>
                <TableHead>Appointments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portals.map((portal) => {
                const typeInfo = getPortalTypeInfo(portal.type)
                
                return (
                  <TableRow key={portal.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{portal.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {typeInfo.label}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(portal.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(portal.last_sync).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {portal.patient_count.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {portal.message_count.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {portal.appointment_count.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTest(portal.id)}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSync(portal.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPortal(portal)
                            setFormData(portal)
                            setShowDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(portal.id)}
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

      {/* Portal Features Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portals.reduce((sum, p) => sum + p.patient_count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all portals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portals.reduce((sum, p) => sum + p.message_count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portals.reduce((sum, p) => sum + p.appointment_count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Portals</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portals.filter(p => p.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {portals.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portal Communication Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Communication Features
          </CardTitle>
          <CardDescription>
            Email integration features available through patient portals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Appointment Communications</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Appointment confirmations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Reminder notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Cancellation alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Rescheduling notifications</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Patient Communications</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Test result notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Prescription reminders</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Health education content</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Billing notifications</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
