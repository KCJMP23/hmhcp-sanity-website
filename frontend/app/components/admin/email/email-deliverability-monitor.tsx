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
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Settings,
  Mail,
  Activity,
  Zap,
  Globe,
  Shield
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DeliverabilityMetric {
  id: string
  metric_name: string
  current_value: number
  previous_value: number
  target_value: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  last_updated: string
  description: string
  recommendations: string[]
}

interface DeliverabilityAlert {
  id: string
  type: 'deliverability' | 'reputation' | 'bounce' | 'spam'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  affected_campaigns: number
  detected_at: string
  status: 'active' | 'resolved' | 'investigating'
  resolution_notes: string
}

const deliverabilityMetrics = [
  { value: 'delivery_rate', label: 'Delivery Rate', description: 'Percentage of emails successfully delivered' },
  { value: 'bounce_rate', label: 'Bounce Rate', description: 'Percentage of emails that bounced' },
  { value: 'spam_rate', label: 'Spam Rate', description: 'Percentage of emails marked as spam' },
  { value: 'open_rate', label: 'Open Rate', description: 'Percentage of delivered emails opened' },
  { value: 'click_rate', label: 'Click Rate', description: 'Percentage of delivered emails clicked' },
  { value: 'unsubscribe_rate', label: 'Unsubscribe Rate', description: 'Percentage of delivered emails resulting in unsubscribes' }
]

const timeRanges = [
  { value: '1h', label: 'Last Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' }
]

export function EmailDeliverabilityMonitor() {
  const [metrics, setMetrics] = useState<DeliverabilityMetric[]>([])
  const [alerts, setAlerts] = useState<DeliverabilityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState('all')
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    loadDeliverabilityData()
  }, [selectedMetric, selectedTimeRange])

  const loadDeliverabilityData = async () => {
    try {
      setLoading(true)
      const [metricsResponse, alertsResponse] = await Promise.all([
        fetch(`/api/admin/email/deliverability/metrics?metric=${selectedMetric}&time_range=${selectedTimeRange}`),
        fetch(`/api/admin/email/deliverability/alerts?severity=${selectedSeverity}`)
      ])
      
      const [metricsData, alertsData] = await Promise.all([
        metricsResponse.json(),
        alertsResponse.json()
      ])
      
      if (metricsData.success) {
        setMetrics(metricsData.data)
      }
      
      if (alertsData.success) {
        setAlerts(alertsData.data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load deliverability data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await loadDeliverabilityData()
    toast({
      title: 'Success',
      description: 'Deliverability data refreshed'
    })
  }

  const handleExportMetrics = async () => {
    try {
      const response = await fetch('/api/admin/email/deliverability/metrics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metric: selectedMetric,
          time_range: selectedTimeRange
        })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Deliverability metrics exported successfully'
        })
      } else {
        throw new Error('Failed to export metrics')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export deliverability metrics',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      excellent: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      good: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      critical: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.good
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { color: 'bg-blue-100 text-blue-800' },
      medium: { color: 'bg-yellow-100 text-yellow-800' },
      high: { color: 'bg-orange-100 text-orange-800' },
      critical: { color: 'bg-red-100 text-red-800' }
    }
    
    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.low
    
    return (
      <Badge className={config.color}>
        {severity.toUpperCase()}
      </Badge>
    )
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getMetricInfo = (metricName: string) => {
    return deliverabilityMetrics.find(m => m.value === metricName) || deliverabilityMetrics[0]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading deliverability data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deliverability Monitor</h2>
          <p className="text-muted-foreground">
            Monitor email deliverability metrics and performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportMetrics}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Monitor Filters
          </CardTitle>
          <CardDescription>
            Filter deliverability metrics and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Metric</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Metrics</SelectItem>
                  {deliverabilityMetrics.map((metric) => (
                    <SelectItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {timeRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Alert Severity</label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverability Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Deliverability Metrics
          </CardTitle>
          <CardDescription>
            Key performance indicators for email deliverability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead>Previous Value</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((metric) => {
                const metricInfo = getMetricInfo(metric.metric_name)
                const change = metric.current_value - metric.previous_value
                const changePercentage = metric.previous_value > 0 
                  ? ((change / metric.previous_value) * 100).toFixed(1)
                  : '0.0'
                
                return (
                  <TableRow key={metric.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{metricInfo.label}</div>
                        <div className="text-sm text-muted-foreground">{metricInfo.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{metric.current_value.toFixed(2)}%</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {metric.previous_value.toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {metric.target_value.toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(metric.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(metric.trend)}
                        <span className={`text-sm ${getTrendColor(metric.trend)}`}>
                          {change > 0 ? '+' : ''}{changePercentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(metric.last_updated).toLocaleString()}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deliverability Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Deliverability Alerts
          </CardTitle>
          <CardDescription>
            Active alerts requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Affected Campaigns</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-muted-foreground">{alert.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getSeverityBadge(alert.severity)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{alert.affected_campaigns}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                      {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(alert.detected_at).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Handle resolve alert
                          console.log('Resolve alert:', alert.id)
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Handle view details
                          console.log('View alert details:', alert.id)
                        }}
                      >
                        <Activity className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deliverability Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered recommendations to improve deliverability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric) => (
              metric.recommendations.length > 0 && (
                <div key={metric.id} className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-800 mb-2">
                    {getMetricInfo(metric.metric_name).label} Recommendations
                  </div>
                  <ul className="space-y-1 text-sm text-blue-700">
                    {metric.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
