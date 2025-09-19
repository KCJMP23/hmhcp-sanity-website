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
  UserX,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
  Calendar,
  Eye,
  RotateCcw,
  Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UnsubscribeRequest {
  id: string
  email: string
  reason: string
  category: string
  status: 'pending' | 'processed' | 'cancelled' | 'rejected'
  requested_at: string
  processed_at: string
  campaign_id: string
  campaign_name: string
  contact_id: string
  contact_name: string
  notes: string
  compliance_checked: boolean
  auto_processed: boolean
}

const unsubscribeReasons = [
  { value: 'too_frequent', label: 'Too Frequent', description: 'Receiving too many emails' },
  { value: 'not_relevant', label: 'Not Relevant', description: 'Content not relevant to me' },
  { value: 'never_signed_up', label: 'Never Signed Up', description: 'I never signed up for this' },
  { value: 'spam', label: 'Spam', description: 'This looks like spam' },
  { value: 'privacy_concerns', label: 'Privacy Concerns', description: 'Concerned about privacy' },
  { value: 'technical_issues', label: 'Technical Issues', description: 'Having technical problems' },
  { value: 'other', label: 'Other', description: 'Other reason' }
]

const unsubscribeCategories = [
  { value: 'marketing', label: 'Marketing', description: 'Marketing emails' },
  { value: 'newsletter', label: 'Newsletter', description: 'Newsletter subscriptions' },
  { value: 'appointment_reminders', label: 'Appointment Reminders', description: 'Appointment reminder emails' },
  { value: 'health_updates', label: 'Health Updates', description: 'Health-related updates' },
  { value: 'billing', label: 'Billing', description: 'Billing and payment emails' },
  { value: 'all', label: 'All Emails', description: 'All email communications' }
]

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processed', label: 'Processed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' }
]

export function EmailUnsubscribeManager() {
  const [requests, setRequests] = useState<UnsubscribeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [reasonFilter, setReasonFilter] = useState('all')
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState('process')
  const { toast } = useToast()

  useEffect(() => {
    loadUnsubscribeRequests()
  }, [])

  const loadUnsubscribeRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email/unsubscribe/requests')
      const data = await response.json()
      
      if (data.success) {
        setRequests(data.data)
      } else {
        throw new Error(data.error || 'Failed to load unsubscribe requests')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load unsubscribe requests',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProcessRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/email/unsubscribe/requests/${requestId}/process`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Unsubscribe request processed successfully'
        })
        loadUnsubscribeRequests()
      } else {
        throw new Error('Failed to process request')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process unsubscribe request',
        variant: 'destructive'
      })
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/email/unsubscribe/requests/${requestId}/reject`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Unsubscribe request rejected'
        })
        loadUnsubscribeRequests()
      } else {
        throw new Error('Failed to reject request')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject unsubscribe request',
        variant: 'destructive'
      })
    }
  }

  const handleBulkAction = async () => {
    if (selectedRequests.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select requests to process',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/admin/email/unsubscribe/requests/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_ids: selectedRequests,
          action: bulkAction
        })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `${selectedRequests.length} requests ${bulkAction}ed successfully`
        })
        setSelectedRequests([])
        setShowBulkDialog(false)
        loadUnsubscribeRequests()
      } else {
        throw new Error('Failed to process bulk action')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process bulk action',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getReasonInfo = (reason: string) => {
    return unsubscribeReasons.find(r => r.value === reason) || unsubscribeReasons[0]
  }

  const getCategoryInfo = (category: string) => {
    return unsubscribeCategories.find(c => c.value === category) || unsubscribeCategories[0]
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.campaign_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesReason = reasonFilter === 'all' || request.reason === reasonFilter
    return matchesSearch && matchesStatus && matchesReason
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading unsubscribe requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Unsubscribe Management</h2>
          <p className="text-muted-foreground">
            Manage unsubscribe requests and ensure compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUnsubscribeRequests}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {selectedRequests.length > 0 && (
            <Button onClick={() => setShowBulkDialog(true)}>
              <UserX className="mr-2 h-4 w-4" />
              Bulk Action ({selectedRequests.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter unsubscribe requests by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by email, name, or campaign..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  {unsubscribeReasons.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setReasonFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unsubscribe Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Unsubscribe Requests ({filteredRequests.length})
          </CardTitle>
          <CardDescription>
            Manage unsubscribe requests and ensure compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRequests(filteredRequests.map(r => r.id))
                      } else {
                        setSelectedRequests([])
                      }
                    }}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => {
                const reasonInfo = getReasonInfo(request.reason)
                const categoryInfo = getCategoryInfo(request.category)
                
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRequests(prev => [...prev, request.id])
                          } else {
                            setSelectedRequests(prev => prev.filter(id => id !== request.id))
                          }
                        }}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.contact_name}</div>
                        <div className="text-sm text-muted-foreground">{request.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.campaign_name}</div>
                        <div className="text-sm text-muted-foreground">ID: {request.campaign_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reasonInfo.label}</div>
                        <div className="text-sm text-muted-foreground">{reasonInfo.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{categoryInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.requested_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleProcessRequest(request.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Handle view details
                            console.log('View details for request:', request.id)
                          }}
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Action</DialogTitle>
            <DialogDescription>
              Process {selectedRequests.length} selected unsubscribe requests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk_action">Action</Label>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="process">Process Requests</SelectItem>
                  <SelectItem value="reject">Reject Requests</SelectItem>
                  <SelectItem value="cancel">Cancel Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAction}>
                {bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1)} {selectedRequests.length} Requests
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
