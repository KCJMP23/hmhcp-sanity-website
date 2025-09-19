'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  FileText,
  Download,
  Plus,
  RefreshCw,
  Shield,
  Activity,
  TrendingUp,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SecurityIncident } from '@/lib/types/security'

interface IncidentTrackerProps {
  incidents: SecurityIncident[]
  isLoading: boolean
  onResolveIncident?: (incidentId: string, resolution: string) => void
  onAcknowledgeIncident?: (incidentId: string, notes?: string) => void
  onEscalateIncident?: (incidentId: string, notes?: string) => void
  onExportData?: (filters: IncidentFilters) => void
  onRefresh?: () => void
  className?: string
}

interface IncidentFilters {
  search: string
  status: string
  severity: string
  type: string
  assignedTo: string
  dateRange: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface IncidentStats {
  total: number
  active: number
  resolved: number
  critical: number
  avgResolutionTime: number
}

export function IncidentTracker({ 
  incidents, 
  isLoading, 
  onResolveIncident,
  onAcknowledgeIncident,
  onEscalateIncident,
  onExportData,
  onRefresh,
  className 
}: IncidentTrackerProps) {
  const [filters, setFilters] = useState<IncidentFilters>({
    search: '',
    status: 'all',
    severity: 'all',
    type: 'all',
    assignedTo: 'all',
    dateRange: '7d',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null)
  const [actionType, setActionType] = useState<'resolve' | 'acknowledge' | 'escalate' | null>(null)
  const [actionNotes, setActionNotes] = useState('')
  
  // Filter and sort incidents
  const filteredIncidents = useMemo(() => {
    let filtered = incidents.filter(incident => {
      const matchesSearch = !filters.search || 
        incident.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        incident.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        incident.id.toLowerCase().includes(filters.search.toLowerCase())

      const matchesStatus = filters.status === 'all' || incident.status === filters.status
      const matchesSeverity = filters.severity === 'all' || incident.severity === filters.severity
      const matchesType = filters.type === 'all' || incident.type === filters.type
      
      const matchesDateRange = matchesDateFilter(incident.created_at, filters.dateRange)

      return matchesSearch && matchesStatus && matchesSeverity && matchesType && matchesDateRange
    })

    // Sort incidents
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof SecurityIncident] as any
      const bValue = b[filters.sortBy as keyof SecurityIncident] as any
      
      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [incidents, filters])

  // Calculate incident statistics
  const stats = useMemo((): IncidentStats => {
    const total = incidents.length
    const active = incidents.filter(i => i.status === 'active').length
    const resolved = incidents.filter(i => i.status === 'resolved').length
    const critical = incidents.filter(i => i.severity === 'critical').length
    
    // Calculate average resolution time
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved' && i.resolved_at)
    const avgResolutionTime = resolvedIncidents.length > 0
      ? resolvedIncidents.reduce((sum, incident) => {
          const created = new Date(incident.created_at).getTime()
          const resolved = new Date(incident.resolved_at!).getTime()
          return sum + (resolved - created)
        }, 0) / resolvedIncidents.length / (1000 * 60 * 60) // Convert to hours
      : 0

    return { total, active, resolved, critical, avgResolutionTime }
  }, [incidents])

  const handleAction = async () => {
    if (!selectedIncident || !actionType) return

    try {
      switch (actionType) {
        case 'resolve':
          await onResolveIncident?.(selectedIncident.id, actionNotes)
          break
        case 'acknowledge':
          await onAcknowledgeIncident?.(selectedIncident.id, actionNotes)
          break
        case 'escalate':
          await onEscalateIncident?.(selectedIncident.id, actionNotes)
          break
      }
      
      setSelectedIncident(null)
      setActionType(null)
      setActionNotes('')
    } catch (error) {
      console.error('Action failed:', error)
    }
  }

  const updateFilter = (key: keyof IncidentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      severity: 'all',
      type: 'all',
      assignedTo: 'all',
      dateRange: '7d',
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header and Statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Security Incident Tracker</h3>
          <p className="text-sm text-gray-600">
            Monitor and manage security incidents across your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onExportData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExportData(filters)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <IncidentStatistics stats={stats} isLoading={isLoading} />

      {/* Filters and Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Incident Filters</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search incidents..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Severity Filter */}
            <Select value={filters.severity} onValueChange={(value) => updateFilter('severity', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                <SelectItem value="data_breach_attempt">Data Breach Attempt</SelectItem>
                <SelectItem value="malware_detection">Malware Detection</SelectItem>
                <SelectItem value="compliance_violation">Compliance Violation</SelectItem>
                <SelectItem value="system_compromise">System Compromise</SelectItem>
                <SelectItem value="phishing_attempt">Phishing Attempt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Date Range */}
            <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="updated_at">Last Updated</SelectItem>
                <SelectItem value="severity">Severity</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              className="gap-2"
            >
              {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>
                {filteredIncidents.length} of {incidents.length} incidents
              </CardDescription>
            </div>
            <Badge variant="outline">
              {filteredIncidents.filter(i => i.status === 'active').length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <IncidentTableSkeleton />
          ) : filteredIncidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No incidents found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <IncidentTable
              incidents={filteredIncidents}
              onViewIncident={setSelectedIncident}
              onActionClick={(incident, action) => {
                setSelectedIncident(incident)
                setActionType(action)
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Incident Detail Modal */}
      <Dialog open={!!selectedIncident} onOpenChange={(open) => !open && setSelectedIncident(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Incident Details</DialogTitle>
            <DialogDescription>
              Review incident information and take appropriate action
            </DialogDescription>
          </DialogHeader>
          {selectedIncident && (
            <IncidentDetailView 
              incident={selectedIncident}
              onClose={() => setSelectedIncident(null)}
              onActionClick={(action) => setActionType(action)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'resolve' ? 'Resolve Incident' : 
               actionType === 'acknowledge' ? 'Acknowledge Incident' :
               actionType === 'escalate' ? 'Escalate Incident' : 'Action Required'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'resolve' ? 'Provide resolution details and close this incident' :
               actionType === 'acknowledge' ? 'Acknowledge this incident and add any notes' :
               actionType === 'escalate' ? 'Escalate this incident to a higher severity level' :
               'Complete the requested action'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={
                actionType === 'resolve' ? 'Describe how the incident was resolved...' :
                actionType === 'acknowledge' ? 'Add acknowledgment notes (optional)...' :
                actionType === 'escalate' ? 'Provide escalation reason...' :
                'Add notes...'
              }
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActionType(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAction}
                disabled={actionType === 'resolve' && !actionNotes.trim()}
              >
                {actionType === 'resolve' ? 'Resolve' :
                 actionType === 'acknowledge' ? 'Acknowledge' :
                 actionType === 'escalate' ? 'Escalate' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function IncidentStatistics({ 
  stats, 
  isLoading 
}: { 
  stats: IncidentStats
  isLoading: boolean 
}) {
  const statCards = [
    {
      title: 'Total Incidents',
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      title: 'Active Incidents',
      value: stats.active,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50 border-red-200'
    },
    {
      title: 'Resolved Incidents',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      title: 'Critical Incidents',
      value: stats.critical,
      icon: XCircle,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="border-l-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoading ? '--' : stat.value}
                  </p>
                </div>
                <div className={cn("p-2 rounded-lg", stat.color)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function IncidentTable({ 
  incidents, 
  onViewIncident, 
  onActionClick 
}: {
  incidents: SecurityIncident[]
  onViewIncident: (incident: SecurityIncident) => void
  onActionClick: (incident: SecurityIncident, action: 'resolve' | 'acknowledge' | 'escalate') => void
}) {
  const getSeverityBadge = (severity: string) => {
    const config = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    }
    return config[severity as keyof typeof config] || config.low
  }

  const getStatusBadge = (status: string) => {
    const config = {
      active: 'bg-red-100 text-red-800 border-red-200',
      acknowledged: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return config[status as keyof typeof config] || config.active
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id} className="hover:bg-gray-50">
              <TableCell className="font-mono text-xs">
                {incident.id.slice(0, 8)}...
              </TableCell>
              <TableCell className="max-w-48">
                <div className="font-medium text-gray-900 truncate">
                  {incident.title || formatIncidentType(incident.type)}
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {incident.description}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {formatIncidentType(incident.type)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("text-xs", getSeverityBadge(incident.severity))}>
                  {incident.severity.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("text-xs", getStatusBadge(incident.status))}>
                  {incident.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(incident.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewIncident(incident)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  {incident.status === 'active' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onActionClick(incident, 'acknowledge')}
                        className="h-8 px-2 text-xs"
                      >
                        Ack
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onActionClick(incident, 'resolve')}
                        className="h-8 px-2 text-xs"
                      >
                        Resolve
                      </Button>
                    </>
                  )}
                  {incident.status !== 'resolved' && incident.severity !== 'critical' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onActionClick(incident, 'escalate')}
                      className="h-8 px-2 text-xs"
                    >
                      Escalate
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function IncidentDetailView({ 
  incident, 
  onClose, 
  onActionClick 
}: {
  incident: SecurityIncident
  onClose: () => void
  onActionClick: (action: 'resolve' | 'acknowledge' | 'escalate') => void
}) {
  return (
    <div className="space-y-6">
      {/* Incident Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {incident.title || formatIncidentType(incident.type)}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              ID: {incident.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getSeverityColor(incident.severity)}>
              {incident.severity.toUpperCase()}
            </Badge>
            <Badge variant="outline" className={getStatusColor(incident.status)}>
              {incident.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Incident Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Incident Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{formatIncidentType(incident.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Severity:</span>
                <span className="font-medium capitalize">{incident.severity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize">{incident.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{formatDateTime(incident.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Updated:</span>
                <span className="font-medium">{formatDateTime(incident.updated_at)}</span>
              </div>
            </div>
          </div>

          {incident.source_ip && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Source Information</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">IP Address:</span>
                  <span className="font-medium font-mono">{incident.source_ip}</span>
                </div>
                {incident.user_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">User ID:</span>
                    <span className="font-medium font-mono">{incident.user_id}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {incident.description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {incident.description}
              </p>
            </div>
          )}

          {incident.details && Object.keys(incident.details).length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Additional Details</h4>
              <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-32">
                {JSON.stringify(incident.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Information */}
      {incident.status === 'resolved' && incident.resolution && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Resolution</h4>
          <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">
            {incident.resolution}
          </p>
          {incident.resolved_at && (
            <p className="text-xs text-gray-600 mt-2">
              Resolved on {formatDateTime(incident.resolved_at)}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {incident.status !== 'resolved' && (
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          {incident.status === 'active' && (
            <>
              <Button
                variant="outline"
                onClick={() => onActionClick('acknowledge')}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Acknowledge
              </Button>
              <Button
                onClick={() => onActionClick('resolve')}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Resolve
              </Button>
            </>
          )}
          {incident.severity !== 'critical' && (
            <Button
              variant="outline"
              onClick={() => onActionClick('escalate')}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Escalate
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function IncidentTableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
      ))}
    </div>
  )
}

// Helper functions
function formatIncidentType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getSeverityColor(severity: string): string {
  const colors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200'
  }
  return colors[severity as keyof typeof colors] || colors.low
}

function getStatusColor(status: string): string {
  const colors = {
    active: 'bg-red-100 text-red-800 border-red-200',
    acknowledged: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    closed: 'bg-gray-100 text-gray-800 border-gray-200'
  }
  return colors[status as keyof typeof colors] || colors.active
}

function matchesDateFilter(dateString: string, range: string): boolean {
  const date = new Date(dateString)
  const now = new Date()
  
  switch (range) {
    case '1d':
      return date.getTime() > now.getTime() - 24 * 60 * 60 * 1000
    case '7d':
      return date.getTime() > now.getTime() - 7 * 24 * 60 * 60 * 1000
    case '30d':
      return date.getTime() > now.getTime() - 30 * 24 * 60 * 60 * 1000
    case '90d':
      return date.getTime() > now.getTime() - 90 * 24 * 60 * 60 * 1000
    case 'all':
    default:
      return true
  }
}