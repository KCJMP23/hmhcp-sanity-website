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
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  Filter,
  Users,
  UserCheck,
  UserX,
  Mail
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { EmailContact } from '@/types/email-campaigns'

export function EmailContactManager() {
  const [contacts, setContacts] = useState<EmailContact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { toast } = useToast()

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email/contacts')
      const data = await response.json()
      
      if (data.success) {
        setContacts(data.data)
      } else {
        throw new Error(data.error || 'Failed to load contacts')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (contactId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/email/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      })
      
      if (response.ok) {
        await loadContacts()
        toast({
          title: 'Success',
          description: `Contact ${!isActive ? 'activated' : 'deactivated'} successfully`
        })
      } else {
        throw new Error('Failed to update contact')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update contact',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (contactId: string) => {
    try {
      const response = await fetch(`/api/admin/email/contacts/${contactId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadContacts()
        toast({
          title: 'Success',
          description: 'Contact deleted successfully'
        })
      } else {
        throw new Error('Failed to delete contact')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete contact',
        variant: 'destructive'
      })
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'healthcare_professional':
        return <Badge className="bg-blue-100 text-blue-800">Healthcare Professional</Badge>
      case 'patient':
        return <Badge className="bg-green-100 text-green-800">Patient</Badge>
      case 'general_contact':
        return <Badge className="bg-gray-100 text-gray-800">General Contact</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.healthcare_specialty?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || contact.contact_type === typeFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && contact.is_active) ||
                         (statusFilter === 'inactive' && !contact.is_active)
    return matchesSearch && matchesType && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading contacts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Contacts</h2>
          <p className="text-muted-foreground">
            Manage your email contact list and segmentation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts.filter(c => c.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthcare Professionals</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts.filter(c => c.contact_type === 'healthcare_professional').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts.filter(c => c.contact_type === 'patient').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="healthcare_professional">Healthcare Professional</SelectItem>
            <SelectItem value="patient">Patient</SelectItem>
            <SelectItem value="general_contact">General Contact</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts ({filteredContacts.length})</CardTitle>
          <CardDescription>
            Manage your email contact list and their preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Engagement</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="font-medium">{contact.email}</div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(contact.contact_type)}
                  </TableCell>
                  <TableCell>
                    {contact.healthcare_specialty || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={contact.is_active ? 'default' : 'secondary'}>
                      {contact.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contact.last_engagement 
                      ? new Date(contact.last_engagement).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    {new Date(contact.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* Handle edit */}}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(contact.id!, contact.is_active)}
                      >
                        {contact.is_active ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contact.id!)}
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
    </div>
  )
}