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
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  Mail,
  Activity,
  Zap,
  Trash2,
  RotateCcw,
  Eye,
  Filter
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BounceEvent {
  id: string
  email: string
  bounce_type: 'hard' | 'soft' | 'complaint' | 'unsubscribe'
  bounce_reason: string
  bounce_code: string
  bounce_message: string
  campaign_id: string
  campaign_name: string
  contact_id: string
  contact_name: string
  bounced_at: string
  processed_at: string
  status: 'pending' | 'processed' | 'ignored' | 'retry'
  retry_count: number
  max_retries: number
  is_permanent: boolean
  provider: string
  raw_message: string
}

interface BounceRule {
  id: string
  name: string
  condition: string
  action: 'suppress' | 'retry' | 'ignore' | 'notify'
  is_active: boolean
  priority: number
  created_at: string
  last_triggered: string
  trigger_count: number
  success_rate: number
}

const bounceTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'hard', label: 'Hard Bounce', description: 'Permanent delivery failure' },
  { value: 'soft', label: 'Soft Bounce', description: 'Temporary delivery failure' },
  { value: 'complaint', label: 'Spam Complaint', description: 'Recipient marked as spam' },
  { value: 'unsubscribe', label: 'Unsubscribe', description: 'Recipient unsubscribed' }
]

const bounceStatuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processed', label: 'Processed' },
  { value: 'ignored', label: 'Ignored' },
  { value: 'retry', label: 'Retry' }
]

const bounceProviders = [
  { value: 'all', label: 'All Providers' },
  { value: 'gmail', label: 'Gmail' },
  { value: 'outlook', label: 'Outlook' },
  { value: 'yahoo', label: 'Yahoo' },
  { value: 'aol', label: 'AOL' },
  { value: 'icloud', label: 'iCloud' },
  { value: 'other', label: 'Other' }
]

export function EmailBounceHandler() {
  const [bounceEvents, setBounceEvents] = useState<BounceEvent[]>([])
  const [bounceRules, setBounceRules] = useState<BounceRule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedProvider, setSelectedProvider] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadBounceData()
  }, [selectedType, selectedStatus, selectedProvider])

  const loadBounceData = async () => {
    try {
      setLoading(true)
      const [eventsResponse, rulesResponse] = await Promise.all([
        fetch(`/api/admin/email/deliverability/bounces?type=${selectedType}&status=${selectedStatus}&provider=${selectedProvider}`),
        fetch('/api/admin/email/deliverability/bounces/rules')
      ])
      
      const [eventsData, rulesData] = await Promise.all([
        eventsResponse.json(),
        rulesResponse.json()
      ])
      
      if (eventsData.success) {
        setBounceEvents(eventsData.data)
      }
      
      if (rulesData.success) {
        setBounceRules(rulesData.data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load bounce data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProcessBounce = async (bounceId: string) => {
    try {
      const response = await fetch(`/api/admin/email/deliverability/bounces/${bounceId}/process`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Bounce event processed successfully'
        })
        loadBounceData()
      } else {
        throw new Error('Failed to process bounce')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process bounce event',
        variant: 'destructive'
      })
    }
  }

  const handleRetryBounce = async (bounceId: string) => {
    try {
      const response = await fetch(`/api/admin/email/deliverability/bounces/${bounceId}/retry`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Bounce event queued for retry'
        })
        loadBounceData()
      } else {
        throw new Error('Failed to retry bounce')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry bounce event',
        variant: 'destructive'
      })
    }
  }

  const handleSuppressBounce = async (bounceId: string) => {
    try {
      const response = await fetch(`/api/admin/email/deliverability/bounces/${bounceId}/suppress`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Bounce event suppressed successfully'
        })
        loadBounceData()
      } else {
        throw new Error('Failed to suppress bounce')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to suppress bounce event',
        variant: 'destructive'
      })
    }
  }

  const handleBulkAction = async (action: string, selectedBounces: string[]) => {
    try {
      const response = await fetch('/api/admin/email/deliverability/bounces/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bounce_ids: selectedBounces,
          action: action
        })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `${selectedBounces.length} bounce events ${action}ed successfully`
        })
        loadBounceData()
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

  const getBounceTypeBadge = (type: string) => {
    const typeConfig = {
      hard: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      soft: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      complaint: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      unsubscribe: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.soft
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      ignored: { color: 'bg-gray-100 text-gray-800', icon: Activity },
      retry: { color: 'bg-blue-100 text-blue-800', icon: RotateCcw }
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

  const getBounceTypeInfo = (type: string) => {
    return bounceTypes.find(t => t.value === type) || bounceTypes[0]
  }

  const filteredBounces = bounceEvents.filter(bounce => {
    const matchesSearch = searchTerm === '' || 
      bounce.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bounce.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bounce.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bounce.bounce_reason.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const totalBounces = bounceEvents.length
  const hardBounces = bounceEvents.filter(b => b.bounce_type === 'hard').length
  const softBounces = bounceEvents.filter(b => b.bounce_type === 'soft').length
  const complaints = bounceEvents.filter(b => b.bounce_type === 'complaint').length
  const pendingBounces = bounceEvents.filter(b => b.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading bounce data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bounce Handler</h2>
          <p className="text-muted-foreground">
            Manage email bounces and implement list cleaning
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadBounceData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Bounce Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bounces</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBounces}</div>
            <p className="text-xs text-muted-foreground">
              {pendingBounces} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hard Bounces</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{hardBounces}</div>
            <p className="text-xs text-muted-foreground">
              Permanent failures
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soft Bounces</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{softBounces}</div>
            <p className="text-xs text-muted-foreground">
              Temporary failures
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complaints</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{complaints}</div>
            <p className="text-xs text-muted-foreground">
              Spam complaints
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingBounces}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bounce Filters
          </CardTitle>
          <CardDescription>
            Filter bounce events by type, status, and provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bounce Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {bounceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        {type.description && (
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {bounceStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {bounceProviders.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <input
                type="text"
                placeholder="Search bounces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bounce Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Bounce Events ({filteredBounces.length})
          </CardTitle>
          <CardDescription>
            Manage and process email bounce events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Bounced At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBounces.map((bounce) => (
                <TableRow key={bounce.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{bounce.email}</div>
                      <div className="text-sm text-muted-foreground">{bounce.contact_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{bounce.campaign_name}</div>
                      <div className="text-sm text-muted-foreground">ID: {bounce.campaign_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getBounceTypeBadge(bounce.bounce_type)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="text-sm font-medium">{bounce.bounce_reason}</div>
                      <div className="text-xs text-muted-foreground">Code: {bounce.bounce_code}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(bounce.status)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{bounce.provider}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(bounce.bounced_at).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {bounce.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProcessBounce(bounce.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuppressBounce(bounce.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {bounce.bounce_type === 'soft' && bounce.retry_count < bounce.max_retries && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetryBounce(bounce.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Handle view details
                          console.log('View bounce details:', bounce.id)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bounce Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Bounce Rules
          </CardTitle>
          <CardDescription>
            Automated rules for bounce processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trigger Count</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Last Triggered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bounceRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div className="font-medium">{rule.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {rule.condition}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {rule.action.charAt(0).toUpperCase() + rule.action.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{rule.priority}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{rule.trigger_count.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.success_rate.toFixed(1)}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            rule.success_rate >= 90 ? 'bg-green-500' :
                            rule.success_rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${rule.success_rate}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(rule.last_triggered).toLocaleString()}
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
