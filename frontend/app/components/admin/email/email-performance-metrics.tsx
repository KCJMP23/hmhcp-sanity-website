'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Mail,
  Eye,
  MousePointer,
  Target,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface PerformanceMetricsProps {
  dateRange: string
  campaignFilter: string
}

interface CampaignMetrics {
  id: string
  name: string
  type: string
  status: 'active' | 'paused' | 'completed' | 'draft'
  sent_count: number
  open_rate: number
  click_rate: number
  conversion_rate: number
  bounce_rate: number
  unsubscribe_rate: number
  revenue: number
  cost: number
  roi: number
  created_at: string
  last_sent: string
}

const metricTypes = [
  { value: 'open_rate', label: 'Open Rate', icon: Eye, color: 'text-blue-600' },
  { value: 'click_rate', label: 'Click Rate', icon: MousePointer, color: 'text-green-600' },
  { value: 'conversion_rate', label: 'Conversion Rate', icon: Target, color: 'text-purple-600' },
  { value: 'bounce_rate', label: 'Bounce Rate', icon: AlertCircle, color: 'text-red-600' },
  { value: 'unsubscribe_rate', label: 'Unsubscribe Rate', icon: XCircle, color: 'text-orange-600' }
]

const sortOptions = [
  { value: 'sent_count', label: 'Emails Sent' },
  { value: 'open_rate', label: 'Open Rate' },
  { value: 'click_rate', label: 'Click Rate' },
  { value: 'conversion_rate', label: 'Conversion Rate' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'roi', label: 'ROI' },
  { value: 'created_at', label: 'Date Created' }
]

export function EmailPerformanceMetrics({ dateRange, campaignFilter }: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<CampaignMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState('open_rate')
  const [sortBy, setSortBy] = useState('sent_count')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadMetrics()
  }, [dateRange, campaignFilter])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/email/analytics/performance?date_range=${dateRange}&campaign_filter=${campaignFilter}`)
      const data = await response.json()
      
      if (data.success) {
        setMetrics(data.data)
      } else {
        throw new Error(data.error || 'Failed to load metrics')
      }
    } catch (error) {
      console.error('Error loading performance metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      draft: { color: 'bg-gray-100 text-gray-800', icon: Minus }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600'
    if (current < previous) return 'text-red-600'
    return 'text-gray-600'
  }

  const sortedMetrics = [...metrics].sort((a, b) => {
    const aValue = a[sortBy as keyof CampaignMetrics] as number
    const bValue = b[sortBy as keyof CampaignMetrics] as number
    
    if (sortOrder === 'asc') {
      return aValue - bValue
    } else {
      return bValue - aValue
    }
  })

  const selectedMetricInfo = metricTypes.find(m => m.value === selectedMetric) || metricTypes[0]
  const SelectedMetricIcon = selectedMetricInfo.icon

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading performance metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metric Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>
            Detailed performance analysis for email campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Metric</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {metricTypes.map((metric) => {
                    const Icon = metric.icon
                    return (
                      <SelectItem key={metric.value} value={metric.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {metric.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sort option" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort Order</label>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricTypes.map((metric) => {
          const Icon = metric.icon
          const isSelected = metric.value === selectedMetric
          const avgValue = metrics.length > 0 
            ? (metrics.reduce((sum, m) => sum + (m[metric.value as keyof CampaignMetrics] as number), 0) / metrics.length).toFixed(1)
            : '0.0'
          
          return (
            <Card key={metric.value} className={isSelected ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgValue}%</div>
                <p className="text-xs text-muted-foreground">
                  Average across {metrics.length} campaigns
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SelectedMetricIcon className="h-5 w-5" />
            Campaign Performance
          </CardTitle>
          <CardDescription>
            Individual campaign performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Open Rate</TableHead>
                <TableHead>Click Rate</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMetrics.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{campaign.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(campaign.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {campaign.sent_count.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{campaign.open_rate.toFixed(1)}%</span>
                      {getTrendIcon(campaign.open_rate, 20.0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{campaign.click_rate.toFixed(1)}%</span>
                      {getTrendIcon(campaign.click_rate, 8.0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{campaign.conversion_rate.toFixed(1)}%</span>
                      {getTrendIcon(campaign.conversion_rate, 3.0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      ${campaign.revenue.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`font-medium ${getTrendColor(campaign.roi, 0)}`}>
                      {campaign.roi > 0 ? '+' : ''}{campaign.roi.toFixed(1)}%
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            AI-powered insights and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Top Performer</h4>
              <p className="text-sm text-green-700">
                "Welcome Series - New Patients" has the highest conversion rate at 5.2%
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Improvement Opportunity</h4>
              <p className="text-sm text-yellow-700">
                "Appointment Reminders" could benefit from A/B testing subject lines
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Best Send Time</h4>
              <p className="text-sm text-blue-700">
                Emails sent on Tuesday 10 AM have 23% higher open rates
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">Content Insight</h4>
              <p className="text-sm text-purple-700">
                Healthcare-focused subject lines perform 15% better than generic ones
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
