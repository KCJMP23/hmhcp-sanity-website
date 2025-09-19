'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  Calendar,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ConsentRecord {
  id: string
  contact_id: string
  email: string
  consent_type: 'marketing' | 'appointment_reminders' | 'health_updates' | 'newsletter' | 'all'
  consent_status: 'granted' | 'denied' | 'expired' | 'pending'
  consent_date: string
  expiry_date?: string
  consent_source: 'website' | 'email' | 'phone' | 'in_person' | 'import'
  ip_address?: string
  user_agent?: string
  consent_text: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const consentTypes = [
  { value: 'marketing', label: 'Marketing Communications', description: 'Promotional emails and offers' },
  { value: 'appointment_reminders', label: 'Appointment Reminders', description: 'Appointment notifications and reminders' },
  { value: 'health_updates', label: 'Health Updates', description: 'Health information and updates' },
  { value: 'newsletter', label: 'Newsletter', description: 'Regular newsletters and updates' },
  { value: 'all', label: 'All Communications', description: 'All types of email communications' }
]

const consentStatuses = [
  { value: 'granted', label: 'Granted', color: 'bg-green-100 text-green-800' },
  { value: 'denied', label: 'Denied', color: 'bg-red-100 text-red-800' },
  { value: 'expired', label: 'Expired', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'pending', label: 'Pending', color: 'bg-blue-100 text-blue-800' }
]

export function EmailConsentManager() {
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedConsent, setSelectedConsent] = useState<ConsentRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isNewConsent, setIsNewConsent] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadConsents()
  }, [])

  const loadConsents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email/consent')
      const data = await response.json()
      
      if (data.success) {
        setConsents(data.data)
      } else {
        throw new Error(data.error || 'Failed to load consent records')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load consent records',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (consent: ConsentRecord) => {
    setSelectedConsent(consent)
    setIsNewConsent(false)
    setShowForm(true)
  }

  const handleNew = () => {
    setSelectedConsent(null)
    setIsNewConsent(true)
    setShowForm(true)
  }

  const handleDelete = async (consentId: string) => {
    try {
      const response = await fetch(`/api/admin/email/consent/${consentId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadConsents()
        toast({
          title: 'Success',
          description: 'Consent record deleted successfully'
        })
      } else {
        throw new Error('Failed to delete consent record')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete consent record',
        variant: 'destructive'
      })
    }
  }

  const handleRevoke = async (consentId: string) => {
    try {
      const response = await fetch(`/api/admin/email/consent/${consentId}/revoke`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadConsents()
        toast({
          title: 'Success',
          description: 'Consent revoked successfully'
        })
      } else {
        throw new Error('Failed to revoke consent')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke consent',
        variant: 'destructive'
      })
    }
  }

  const handleRenew = async (consentId: string) => {
    try {
      const response = await fetch(`/api/admin/email/consent/${consentId}/renew`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadConsents()
        toast({
          title: 'Success',
          description: 'Consent renewed successfully'
        })
      } else {
        throw new Error('Failed to renew consent')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to renew consent',
        variant: 'destructive'
      })
    }
  }

  const getStatusInfo = (status: string) => {
    return consentStatuses.find(s => s.value === status) || consentStatuses[0]
  }

  const getTypeInfo = (type: string) => {
    return consentTypes.find(t => t.value === type) || consentTypes[0]
  }

  const filteredConsents = consents.filter(consent => {
    const matchesSearch = consent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consent.consent_text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || consent.consent_status === statusFilter
    const matchesType = typeFilter === 'all' || consent.consent_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getExpiringConsents = () => {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    return consents.filter(consent => 
      consent.consent_status === 'granted' && 
      consent.expiry_date && 
      new Date(consent.expiry_date) <= thirtyDaysFromNow
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading consent records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Consent Management</h2>
          <p className="text-muted-foreground">
            Manage patient consent for email communications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Consent
          </Button>
        </div>
      </div>

      {/* Expiring Consents Alert */}
      {getExpiringConsents().length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Expiring Consents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              {getExpiringConsents().length} consent records are expiring within 30 days. 
              Consider reaching out to renew these consents.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search consent records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <UserCheck className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {consentStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <Mail className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {consentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Consent Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Consent Records ({filteredConsents.length})</CardTitle>
          <CardDescription>
            Manage patient consent for email communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Consent Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Consent Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConsents.map((consent) => {
                const statusInfo = getStatusInfo(consent.consent_status)
                const typeInfo = getTypeInfo(consent.consent_type)
                const isExpiring = consent.expiry_date && 
                  new Date(consent.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                
                return (
                  <TableRow key={consent.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{consent.email}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {consent.contact_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{typeInfo.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {typeInfo.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                        {isExpiring && (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(consent.consent_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {consent.expiry_date ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {new Date(consent.expiry_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {consent.consent_source.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* Handle view */}}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(consent)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {consent.consent_status === 'granted' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(consent.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {consent.consent_status === 'expired' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRenew(consent.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(consent.id)}
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

      {/* Consent Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isNewConsent ? 'Add Consent Record' : 'Edit Consent Record'}
            </DialogTitle>
            <DialogDescription>
              {isNewConsent 
                ? 'Add a new consent record for email communications'
                : 'Edit the selected consent record'
              }
            </DialogDescription>
          </DialogHeader>
          {/* Consent Form Component would go here */}
          <div className="p-8 text-center text-muted-foreground">
            Consent Form Component (To be implemented)
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
