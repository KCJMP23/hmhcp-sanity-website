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
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Mail,
  Users,
  MousePointer,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EmailAnalytics {
  total_emails_sent: number
  total_opens: number
  total_clicks: number
  open_rate: number
  click_rate: number
  bounce_rate: number
  unsubscribe_rate: number
  revenue: number
  campaigns_count: number
  automations_count: number
  contacts_count: number
  active_contacts: number
}

export function EmailAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const { toast } = useToast()

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/email/analytics?time_range=${timeRange}`)
      const data = await response.json()
      
      if (data.success) {
        setAnalytics(data.data)
      } else {
        throw new Error(data.error || 'Failed to load analytics')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load email analytics',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return null
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) {
      return 'text-green-600'
    } else if (current < previous) {
      return 'text-red-600'
    }
    return 'text-muted-foreground'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Analytics</h2>
          <p className="text-muted-foreground">
            Track your email campaign performance and engagement metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_emails_sent.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(analytics.total_emails_sent, 1000)}
              <span>+12% from last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.open_rate.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(analytics.open_rate, 20)}
              <span>+2.1% from last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.click_rate.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(analytics.click_rate, 3)}
              <span>+0.5% from last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.contacts_count.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(analytics.contacts_count, 2000)}
              <span>+127 from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Opens</span>
              <span className="text-sm font-bold">{analytics.total_opens.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Clicks</span>
              <span className="text-sm font-bold">{analytics.total_clicks.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Bounce Rate</span>
              <span className="text-sm font-bold">{analytics.bounce_rate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Unsubscribe Rate</span>
              <span className="text-sm font-bold">{analytics.unsubscribe_rate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campaign Performance</CardTitle>
            <CardDescription>Campaign and automation stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Campaigns</span>
              <span className="text-sm font-bold">{analytics.campaigns_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Automations</span>
              <span className="text-sm font-bold">{analytics.automations_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Contacts</span>
              <span className="text-sm font-bold">{analytics.active_contacts.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Revenue Generated</span>
              <span className="text-sm font-bold">${analytics.revenue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Health Score</CardTitle>
            <CardDescription>Overall email health metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Deliverability</span>
                <Badge className="bg-green-100 text-green-800">Excellent</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Engagement</span>
                <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compliance</span>
                <Badge className="bg-green-100 text-green-800">Excellent</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest email campaign activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Welcome Series Campaign completed</p>
                <p className="text-xs text-muted-foreground">2 hours ago • 1,247 emails sent</p>
              </div>
              <Badge variant="outline">Completed</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Appointment Reminder Automation triggered</p>
                <p className="text-xs text-muted-foreground">4 hours ago • 89 emails sent</p>
              </div>
              <Badge variant="default">Running</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Educational Newsletter scheduled</p>
                <p className="text-xs text-muted-foreground">6 hours ago • Scheduled for tomorrow</p>
              </div>
              <Badge variant="outline">Scheduled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
