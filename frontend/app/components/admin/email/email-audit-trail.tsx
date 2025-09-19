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
  Search, 
  Download,
  Filter,
  Calendar,
  User,
  Mail,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AuditEvent {
  id: string
  event_type: 'campaign_sent' | 'consent_granted' | 'consent_revoked' | 'phi_detected' | 'compliance_check' | 'template_created' | 'template_modified' | 'contact_imported' | 'segment_created' | 'ab_test_started' | 'ab_test_completed'
  entity_type: 'campaign' | 'contact' | 'template' | 'segment' | 'consent' | 'ab_test'
  entity_id: string
  entity_name: string
  action: string
  description: string
  user_id?: string
  user_name?: string
  ip_address?: string
  user_agent?: string
  metadata: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
}

const eventTypes = [
  { value: 'campaign_sent', label: 'Campaign Sent', icon: Mail, color: 'bg-blue-100 text-blue-800' },
  { value: 'consent_granted', label: 'Consent Granted', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'consent_revoked', label: 'Consent Revoked', icon: XCircle, color: 'bg-red-100 text-red-800' },
  { value: 'phi_detected', label: 'PHI Detected', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'compliance_check', label: 'Compliance Check', icon: Shield, color: 'bg-purple-100 text-purple-800' },
  { value: 'template_created', label: 'Template Created', icon: FileText, color: 'bg-indigo-100 text-indigo-800' },
  { value: 'template_modified', label: 'Template Modified', icon: FileText, color: 'bg-indigo-100 text-indigo-800' },
  { value: 'contact_imported', label: 'Contact Imported', icon: User, color: 'bg-cyan-100 text-cyan-800' },
  { value: 'segment_created', label: 'Segment Created', icon: Filter, color: 'bg-pink-100 text-pink-800' },
  { value: 'ab_test_started', label: 'A/B Test Started', icon: Calendar, color: 'bg-orange-100 text-orange-800' },
  { value: 'ab_test_completed', label: 'A/B Test Completed', icon: Calendar, color: 'bg-orange-100 text-orange-800' }
]

const severityLevels = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
]

export function EmailAuditTrail() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('7d')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    loadEvents()
  }, [page, eventTypeFilter, severityFilter, dateRange])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        event_type: eventTypeFilter,
        severity: severityFilter,
        date_range: dateRange,
        search: searchTerm
      })

      const response = await fetch(`/api/admin/email/audit?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setEvents(data.data)
        setTotalPages(data.pagination.pages)
      } else {
        throw new Error(data.error || 'Failed to load audit events')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load audit events',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadEvents()
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        event_type: eventTypeFilter,
        severity: severityFilter,
        date_range: dateRange,
        search: searchTerm,
        format: 'csv'
      })

      const response = await fetch(`/api/admin/email/audit/export?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast({
          title: 'Success',
          description: 'Audit trail exported successfully'
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export audit trail',
        variant: 'destructive'
      })
    }
  }

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find(t => t.value === type) || eventTypes[0]
  }

  const getSeverityInfo = (severity: string) => {
    return severityLevels.find(s => s.value === severity) || severityLevels[0]
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading audit events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Trail</h2>
          <p className="text-muted-foreground">
            Track all email system activities and compliance events
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter audit events by type, severity, and date range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Event Types</SelectItem>
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {severityLevels.map((severity) => (
                  <SelectItem key={severity.value} value={severity.value}>
                    {severity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events ({events.length})</CardTitle>
          <CardDescription>
            All email system activities and compliance events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const eventTypeInfo = getEventTypeInfo(event.event_type)
                const severityInfo = getSeverityInfo(event.severity)
                const EventIcon = eventTypeInfo.icon
                
                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EventIcon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{eventTypeInfo.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.action}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{event.entity_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.entity_type} • {event.entity_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(event.severity)}
                        <Badge className={severityInfo.color}>
                          {severityInfo.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {event.user_name || 'System'}
                        </div>
                        {event.ip_address && (
                          <div className="text-sm text-muted-foreground">
                            {event.ip_address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-xs truncate">
                        {event.description}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
