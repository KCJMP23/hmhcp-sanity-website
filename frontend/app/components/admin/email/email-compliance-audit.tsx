'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  FileText,
  Search,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  BarChart3,
  Shield,
  Activity,
  Eye,
  Filter
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AuditEvent {
  id: string
  event_type: string
  entity_type: string
  entity_id: string
  entity_name: string
  action: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  user_id: string
  user_name: string
  ip_address: string
  user_agent: string
  timestamp: string
  metadata: Record<string, any>
  compliance_impact: boolean
  regulation: string
}

interface AuditSummary {
  total_events: number
  compliance_events: number
  high_severity_events: number
  unique_users: number
  date_range: {
    start: string
    end: string
  }
}

const eventTypes = [
  { value: 'all', label: 'All Events' },
  { value: 'email_sent', label: 'Email Sent' },
  { value: 'unsubscribe_processed', label: 'Unsubscribe Processed' },
  { value: 'compliance_check', label: 'Compliance Check' },
  { value: 'data_export', label: 'Data Export' },
  { value: 'user_login', label: 'User Login' },
  { value: 'permission_change', label: 'Permission Change' },
  { value: 'system_config', label: 'System Configuration' }
]

const severityLevels = [
  { value: 'all', label: 'All Severities' },
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
]

const regulations = [
  { value: 'all', label: 'All Regulations' },
  { value: 'can_spam', label: 'CAN-SPAM' },
  { value: 'gdpr', label: 'GDPR' },
  { value: 'hipaa', label: 'HIPAA' },
  { value: 'fda', label: 'FDA' },
  { value: 'ccpa', label: 'CCPA' }
]

export function EmailComplianceAudit() {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEventType, setSelectedEventType] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [selectedRegulation, setSelectedRegulation] = useState('all')
  const [dateRange, setDateRange] = useState('30d')
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadAuditData()
  }, [selectedEventType, selectedSeverity, selectedRegulation, dateRange])

  const loadAuditData = async () => {
    try {
      setLoading(true)
      const [eventsResponse, summaryResponse] = await Promise.all([
        fetch(`/api/admin/email/compliance/audit/events?event_type=${selectedEventType}&severity=${selectedSeverity}&regulation=${selectedRegulation}&date_range=${dateRange}`),
        fetch(`/api/admin/email/compliance/audit/summary?date_range=${dateRange}`)
      ])
      
      const [eventsData, summaryData] = await Promise.all([
        eventsResponse.json(),
        summaryResponse.json()
      ])
      
      if (eventsData.success) {
        setAuditEvents(eventsData.data)
      }
      
      if (summaryData.success) {
        setAuditSummary(summaryData.data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load audit data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportAudit = async () => {
    try {
      const response = await fetch('/api/admin/email/compliance/audit/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: selectedEventType,
          severity: selectedSeverity,
          regulation: selectedRegulation,
          date_range: dateRange
        })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Audit log exported successfully'
        })
      } else {
        throw new Error('Failed to export audit log')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export audit log',
        variant: 'destructive'
      })
    }
  }

  const getSeverityBadge = (severity: string) => {
    const config = severityLevels.find(s => s.value === severity) || severityLevels[0]
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getEventTypeIcon = (eventType: string) => {
    const iconMap = {
      email_sent: Mail,
      unsubscribe_processed: XCircle,
      compliance_check: Shield,
      data_export: Download,
      user_login: Activity,
      permission_change: Settings,
      system_config: Settings
    }
    
    const Icon = iconMap[eventType as keyof typeof iconMap] || Activity
    return <Icon className="h-4 w-4" />
  }

  const filteredEvents = auditEvents.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading audit data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Audit</h2>
          <p className="text-muted-foreground">
            Comprehensive audit trail for compliance monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAuditData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportAudit}>
            <Download className="mr-2 h-4 w-4" />
            Export Audit
          </Button>
        </div>
      </div>

      {/* Audit Summary */}
      {auditSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditSummary.total_events.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {auditSummary.date_range.start} to {auditSummary.date_range.end}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Events</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditSummary.compliance_events.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((auditSummary.compliance_events / auditSummary.total_events) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Severity</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditSummary.high_severity_events.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditSummary.unique_users.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Active users
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Audit Filters
          </CardTitle>
          <CardDescription>
            Filter audit events by type, severity, and regulation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map((severity) => (
                    <SelectItem key={severity.value} value={severity.value}>
                      {severity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Regulation</label>
              <Select value={selectedRegulation} onValueChange={setSelectedRegulation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select regulation" />
                </SelectTrigger>
                <SelectContent>
                  {regulations.map((regulation) => (
                    <SelectItem key={regulation.value} value={regulation.value}>
                      {regulation.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Events ({filteredEvents.length})
          </CardTitle>
          <CardDescription>
            Detailed audit trail of all system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Regulation</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEventTypeIcon(event.event_type)}
                      <div>
                        <div className="font-medium">{event.event_type.replace('_', ' ').toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground">{event.description}</div>
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
                    <div>
                      <div className="font-medium">{event.user_name}</div>
                      <div className="text-sm text-muted-foreground">{event.ip_address}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getSeverityBadge(event.severity)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{event.regulation.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Handle view details
                          console.log('View event details:', event.id)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {event.compliance_impact && (
                        <Badge className="bg-red-100 text-red-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Compliance
                        </Badge>
                      )}
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
