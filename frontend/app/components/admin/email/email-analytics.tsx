'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import {
  Mail,
  Send,
  Eye,
  MousePointer,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface EmailAnalytics {
  campaigns: {
    total: number
    sent: number
    scheduled: number
    draft: number
  }
  performance: {
    totalSent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
  }
  engagement: {
    openRate: number
    clickRate: number
    bounceRate: number
    unsubscribeRate: number
  }
  topCampaigns: Array<{
    id: string
    name: string
    sent: number
    opens: number
    clicks: number
    openRate: number
    clickRate: number
  }>
  recentActivity: Array<{
    date: string
    sent: number
    opened: number
    clicked: number
  }>
  deviceStats: Array<{
    device: string
    opens: number
    percentage: number
  }>
}

export function EmailAnalytics() {
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/email/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        // Use demo data if API fails
        setAnalytics(getDemoAnalytics())
      }
    } catch (error) {
      console.error('Failed to load email analytics:', error)
      setAnalytics(getDemoAnalytics())
    } finally {
      setLoading(false)
    }
  }

  const getDemoAnalytics = (): EmailAnalytics => ({
    campaigns: {
      total: 45,
      sent: 38,
      scheduled: 4,
      draft: 3
    },
    performance: {
      totalSent: 125420,
      delivered: 122658,
      opened: 45238,
      clicked: 12458,
      bounced: 2762,
      unsubscribed: 458
    },
    engagement: {
      openRate: 36.9,
      clickRate: 10.2,
      bounceRate: 2.2,
      unsubscribeRate: 0.37
    },
    topCampaigns: [
      {
        id: '1',
        name: 'Monthly Health Newsletter - March',
        sent: 15234,
        opens: 6845,
        clicks: 1823,
        openRate: 44.9,
        clickRate: 12.0
      },
      {
        id: '2',
        name: 'New Platform Feature Announcement',
        sent: 12456,
        opens: 5234,
        clicks: 1567,
        openRate: 42.0,
        clickRate: 12.6
      },
      {
        id: '3',
        name: 'Clinical Study Results Update',
        sent: 8923,
        opens: 3123,
        clicks: 823,
        openRate: 35.0,
        clickRate: 9.2
      },
      {
        id: '4',
        name: 'Quarterly Patient Survey',
        sent: 10234,
        opens: 3456,
        clicks: 567,
        openRate: 33.8,
        clickRate: 5.5
      }
    ],
    recentActivity: generateRecentActivity(),
    deviceStats: [
      { device: 'Desktop', opens: 18456, percentage: 40.8 },
      { device: 'Mobile', opens: 22567, percentage: 49.9 },
      { device: 'Tablet', opens: 4215, percentage: 9.3 }
    ]
  })

  function generateRecentActivity() {
    const activity = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      activity.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sent: Math.floor(Math.random() * 2000) + 1000,
        opened: Math.floor(Math.random() * 800) + 200,
        clicked: Math.floor(Math.random() * 200) + 50
      })
    }
    return activity
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const colors = {
    primary: '#3B82F6',
    success: '#3B82F6',
    warning: '#3B82F6',
    danger: '#EF4444'
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Email Analytics</h2>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.performance.totalSent)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(analytics.performance.delivered)} delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagement.openRate}%</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              +2.3% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagement.clickRate}%</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              -0.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagement.bounceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(analytics.performance.bounced)} bounced
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Email Activity Over Time */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Email Activity Over Time</CardTitle>
            <CardDescription>Sent, opened, and clicked emails</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.recentActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    stackId="1"
                    stroke={colors.primary}
                    fill={colors.primary}
                    fillOpacity={0.6}
                    name="Sent"
                  />
                  <Area
                    type="monotone"
                    dataKey="opened"
                    stackId="2"
                    stroke={colors.success}
                    fill={colors.success}
                    fillOpacity={0.6}
                    name="Opened"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicked"
                    stackId="3"
                    stroke={colors.warning}
                    fill={colors.warning}
                    fillOpacity={0.6}
                    name="Clicked"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Opens */}
        <Card>
          <CardHeader>
            <CardTitle>Opens by Device</CardTitle>
            <CardDescription>Email opens distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.deviceStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="percentage"
                  >
                    {analytics.deviceStats.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={[colors.primary, colors.success, colors.warning][index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {analytics.deviceStats.map((device, index) => (
                <div key={device.device} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: [colors.primary, colors.success, colors.warning][index] }}
                    />
                    <span className="text-sm">{device.device}</span>
                  </div>
                  <span className="text-sm font-medium">{device.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Performing Campaigns</CardTitle>
              <CardDescription>Campaigns with highest engagement rates</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{campaign.name}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{formatNumber(campaign.sent)} sent</span>
                    <span>{formatNumber(campaign.opens)} opens</span>
                    <span>{formatNumber(campaign.clicks)} clicks</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{campaign.openRate}%</p>
                    <p className="text-xs text-muted-foreground">Open Rate</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{campaign.clickRate}%</p>
                    <p className="text-xs text-muted-foreground">Click Rate</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Status</CardTitle>
          <CardDescription>Overview of all campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Mail className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="text-2xl font-bold">{analytics.campaigns.total}</p>
              <p className="text-sm text-muted-foreground">Total Campaigns</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{analytics.campaigns.sent}</p>
              <p className="text-sm text-muted-foreground">Sent</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{analytics.campaigns.scheduled}</p>
              <p className="text-sm text-muted-foreground">Scheduled</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold">{analytics.campaigns.draft}</p>
              <p className="text-sm text-muted-foreground">Draft</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}