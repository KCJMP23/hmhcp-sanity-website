'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import {
  FileText,
  Users,
  Eye,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Calendar,
  Clock,
  MessageSquare,
  Heart,
  Database,
  Stethoscope,
  Building2,
  BookOpen,
  Mail,
  Shield,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  RefreshCw,
  Edit,
  Sparkles,
  Trash2
} from 'lucide-react'
import { AnalyticsSummaryWidget } from './analytics-summary-widget'

// Types for real data
interface SiteStats {
  totalPages: number
  totalPosts: number
  totalUsers: number
  totalMedia: number
  recentPages: any[]
  recentPosts: any[]
  recentMedia: any[]
}

interface HealthcareMetric {
  title: string
  value: number | string
  change: string
  trend: 'up' | 'down' | 'stable'
  color: string
}

interface SystemStatus {
  service: string
  status: 'operational' | 'degraded' | 'down'
  uptime: string
}

interface DashboardData {
  stats: SiteStats
  healthcareMetrics: HealthcareMetric[]
  systemStatus: SystemStatus[]
  isLoading: boolean
  error: string | null
}

// API Functions for fetching real data
async function fetchAllDashboardData(): Promise<{ 
  stats: SiteStats
  healthcareMetrics: HealthcareMetric[]
  systemStatus: SystemStatus[]
}> {
  try {
    // Fetch comprehensive dashboard stats from the main endpoint
    const response = await fetch('/api/admin/dashboard/stats', {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error(`Dashboard API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Extract site stats from API response
    const stats: SiteStats = {
      totalPages: data.totalPages || 0,
      totalPosts: data.totalPosts || 0,
      totalUsers: data.totalUsers || 0,
      totalMedia: data.totalMedia || 0,
      recentPages: data.recentPages || [],
      recentPosts: data.recentPosts || [],
      recentMedia: data.recentMedia || []
    }
    
    // Build healthcare metrics from API data - NO MORE MOCK DATA
    const healthcareMetrics: HealthcareMetric[] = [
      {
        title: 'Active Trials',
        value: data.healthcareMetrics?.activeClinicalTrials || 0,
        change: data.healthcareMetrics?.activeTrialsChange || 'No change',
        trend: data.healthcareMetrics?.activeTrialsTrend || 'stable',
        color: 'bg-blue-500'
      },
      {
        title: 'Enrolled Patients',
        value: data.healthcareMetrics?.enrolledPatients || 0,
        change: data.healthcareMetrics?.enrolledPatientsChange || 'No change',
        trend: data.healthcareMetrics?.enrolledPatientsTrend || 'stable',
        color: 'bg-green-500'
      },
      {
        title: 'Data Quality',
        value: `${data.healthcareMetrics?.dataQualityScore || 0}%`,
        change: data.healthcareMetrics?.dataQualityChange || 'No change',
        trend: data.healthcareMetrics?.dataQualityTrend || 'stable',
        color: 'bg-purple-500'
      },
      {
        title: 'Platform Uptime',
        value: `${data.healthcareMetrics?.platformUptime || 99.9}%`,
        change: data.healthcareMetrics?.platformUptimeChange || 'Stable',
        trend: data.healthcareMetrics?.platformUptimeTrend || 'stable',
        color: 'bg-orange-500'
      }
    ]
    
    // System status from API
    const systemStatus: SystemStatus[] = data.systemStatus || []
    
    return { stats, healthcareMetrics, systemStatus }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    
    // Return fallback data on error
    return {
      stats: {
        totalPages: 0,
        totalPosts: 0,
        totalUsers: 0,
        totalMedia: 0,
        recentPages: [],
        recentPosts: [],
        recentMedia: []
      },
      healthcareMetrics: [
        { title: 'Active Trials', value: 0, change: 'N/A', trend: 'stable', color: 'bg-gray-500' },
        { title: 'Enrolled Patients', value: 0, change: 'N/A', trend: 'stable', color: 'bg-gray-500' },
        { title: 'Data Quality', value: '0%', change: 'N/A', trend: 'stable', color: 'bg-gray-500' },
        { title: 'Platform Uptime', value: '0%', change: 'N/A', trend: 'stable', color: 'bg-gray-500' }
      ],
      systemStatus: []
    }
  }
}

// API functions to fetch real analytics data
async function fetchTrafficData() {
  try {
    const response = await fetch('/api/admin/analytics/overview')
    const data = await response.json()
    return data.trafficData || []
  } catch (error) {
    console.error('Error fetching traffic data:', error)
    return []
  }
}

async function fetchContentPerformance() {
  try {
    const response = await fetch('/api/admin/analytics/content')
    const data = await response.json()
    return data.performance || []
  } catch (error) {
    console.error('Error fetching content performance:', error)
    return []
  }
}

async function fetchSystemStatus() {
  try {
    const response = await fetch('/api/admin/dashboard/stats')
    const data = await response.json()
    return data.systemStatus || []
  } catch (error) {
    console.error('Error fetching system status:', error)
    return []
  }
}

function StatCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color 
}: { 
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'stable'
  icon: any
  color: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <div className="flex items-center mt-1">
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
              <span className={`text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                {change} this month
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardWidget({ 
  title, 
  children, 
  actions 
}: { 
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {actions}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

export function WordPressStyleDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      totalPages: 0,
      totalPosts: 0,
      totalUsers: 0,
      totalMedia: 0,
      recentPages: [],
      recentPosts: [],
      recentMedia: []
    },
    healthcareMetrics: [],
    systemStatus: [],
    isLoading: true,
    error: null
  })

  const loadDashboardData = async () => {
    setDashboardData(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const { stats, healthcareMetrics, systemStatus } = await fetchAllDashboardData()
      setDashboardData({
        stats,
        healthcareMetrics,
        systemStatus,
        isLoading: false,
        error: null
      })
    } catch (error) {
      setDashboardData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }))
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const { stats, healthcareMetrics, systemStatus, isLoading, error } = dashboardData

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">Error loading dashboard: {error}</span>
          </div>
          <Button onClick={loadDashboardData} className="mt-2" variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 md:px-4 lg:px-6 py-4 md:py-6 space-y-6 bg-white dark:bg-transparent min-h-screen overflow-auto w-full">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Healthcare Content Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your healthcare platform content, pages, and media like WordPress.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            aria-label="Refresh"
            className="h-9 w-9 p-0 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {/* Hide Add button on small screens; FAB handles add actions */}
          <Button size="sm" asChild className="hidden lg:inline-flex">
            <Link href="/admin/content/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pages"
          value={stats.totalPages}
          change="Active"
          trend="up"
          icon={FileText}
          color="bg-blue-500"
        />
        <StatCard
          title="Blog Posts"
          value={stats.totalPosts}
          change="Published"
          trend="up"
          icon={BookOpen}
          color="bg-green-500"
        />
        <StatCard
          title="Media Files"
          value={stats.totalMedia}
          change="Uploaded"
          trend="up"
          icon={Database}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          change="Registered"
          trend="up"
          icon={Users}
          color="bg-orange-500"
        />
      </div>

      {/* Healthcare-Specific Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {healthcareMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
            <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
            <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  <div className="flex items-center mt-1">
                    {metric.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    ) : metric.trend === 'down' ? (
                      <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    ) : null}
                    <span className={`text-sm ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${metric.color}`}>
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* WordPress-Style Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Content Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
            <CardDescription>Create and manage your website content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <Link href="/admin/cms">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm">CMS Manager</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <Link href="/admin/cms?type=blog-post">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-sm">New Post</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <Link href="/admin/cms?type=homepage-hero">
                  <Edit className="h-5 w-5" />
                  <span className="text-sm">Edit Hero</span>
                </Link>
              </Button>
              <Button variant="default" className="h-16 flex-col gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" asChild>
                <Link href="/admin/cms">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm">AI Generate</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Media & Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Media & Settings</CardTitle>
            <CardDescription>Upload files and configure your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <Link href="/admin/media">
                  <Database className="h-5 w-5" />
                  <span className="text-sm">Media Library</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <Link href="/admin/users">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Users</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <Link href="/admin/settings">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm">Settings</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <Link href="/studio">
                  <Activity className="h-5 w-5" />
                  <span className="text-sm">Sanity Studio</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status Section */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Monitor the health of your platform services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {systemStatus.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-sm ${
                    service.status === 'operational' ? 'bg-green-500' : 
                    service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <span className="text-sm font-medium text-gray-900 block">{service.service}</span>
                    <span className="text-xs text-gray-500">{service.uptime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}