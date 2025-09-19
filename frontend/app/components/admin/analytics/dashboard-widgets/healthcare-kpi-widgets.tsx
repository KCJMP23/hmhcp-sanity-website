'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Heart, Stethoscope, Users, FileText, TrendingUp, TrendingDown,
  Activity, Eye, Clock, UserCheck, Calendar, Download
} from 'lucide-react'

interface HealthcareKPIWidgetsProps {
  data: {
    overview: {
      totalUsers: number
      totalSessions: number
      totalPageViews: number
      avgSessionDuration: number
      bounceRate: number
      conversionRate?: number
    }
    healthcare: {
      patientVisitors: number
      hcpVisitors: number
      clinicalTrialViews: number
      researchDownloads: number
      platformDemoRequests: number
      averageEngagementTime: number
      contentEngagementRate: number
    }
    realTime: {
      activeUsers: number
      activePages: Array<{
        page: string
        users: number
      }>
    }
  }
  loading: boolean
}

interface KPICardProps {
  title: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down' | 'neutral'
    period: string
  }
  icon: React.ComponentType<{ className?: string }>
  color: string
  description?: string
  badge?: {
    text: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color, 
  description,
  badge 
}) => {
  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-white/80 backdrop-blur-sm border-gray-200/50">
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`} />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <CardTitle 
            className="text-sm font-medium text-gray-600"
            style={{ fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            {title}
          </CardTitle>
          {badge && (
            <Badge variant={badge.variant} className="text-xs">
              {badge.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div 
              className="text-3xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            
            {change && (
              <div className="flex items-center gap-2">
                {change.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                {change.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                <span className={`text-sm font-medium ${
                  change.trend === 'up' ? 'text-green-600' : 
                  change.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {change.value > 0 ? '+' : ''}{change.value}% {change.period}
                </span>
              </div>
            )}
            
            {description && (
              <p className="text-xs text-gray-500 mt-2">{description}</p>
            )}
          </div>
          
          {/* Icon with Apple-style glass effect */}
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const HealthcareKPIWidgets: React.FC<HealthcareKPIWidgetsProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calculate trends (mock data - in production would come from historical data)
  const getTrendData = (current: number, type: 'high_good' | 'low_good' = 'high_good') => {
    const randomChange = (Math.random() - 0.5) * 20 // -10% to +10%
    const trend = randomChange > 0 ? (type === 'high_good' ? 'up' : 'down') : (type === 'high_good' ? 'down' : 'up')
    return {
      value: Math.abs(randomChange),
      trend: trend as 'up' | 'down',
      period: 'vs last month'
    }
  }

  return (
    <div className="space-y-6">
      {/* Primary Healthcare KPIs */}
      <div>
        <h2 
          className="text-lg font-semibold text-gray-900 mb-4"
          style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' }}
        >
          Healthcare KPI Overview
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Patient Visitors"
            value={data.healthcare.patientVisitors}
            change={getTrendData(data.healthcare.patientVisitors)}
            icon={Heart}
            color="from-red-500 to-pink-500"
            description="Unique patient portal users"
            badge={{ text: "65% of traffic", variant: "secondary" }}
          />
          
          <KPICard
            title="Healthcare Professionals"
            value={data.healthcare.hcpVisitors}
            change={getTrendData(data.healthcare.hcpVisitors)}
            icon={Stethoscope}
            color="from-green-500 to-emerald-500"
            description="Medical professional visitors"
            badge={{ text: "35% of traffic", variant: "outline" }}
          />
          
          <KPICard
            title="Clinical Trial Views"
            value={data.healthcare.clinicalTrialViews}
            change={getTrendData(data.healthcare.clinicalTrialViews)}
            icon={FileText}
            color="from-blue-500 to-cyan-500"
            description="Research content engagement"
          />
          
          <KPICard
            title="Platform Demo Requests"
            value={data.healthcare.platformDemoRequests}
            change={getTrendData(data.healthcare.platformDemoRequests)}
            icon={UserCheck}
            color="from-purple-500 to-indigo-500"
            description="Qualified lead conversions"
            badge={{ text: "High intent", variant: "default" }}
          />
        </div>
      </div>

      {/* Secondary Metrics */}
      <div>
        <h2 
          className="text-lg font-semibold text-gray-900 mb-4"
          style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' }}
        >
          Engagement & Performance Metrics
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Visitors"
            value={data.overview.totalUsers}
            change={getTrendData(data.overview.totalUsers)}
            icon={Users}
            color="from-blue-500 to-blue-600"
            description="Unique website visitors"
          />
          
          <KPICard
            title="Page Views"
            value={data.overview.totalPageViews}
            change={getTrendData(data.overview.totalPageViews)}
            icon={Eye}
            color="from-green-500 to-green-600"
            description="Total content views"
          />
          
          <KPICard
            title="Avg. Session Duration"
            value={`${Math.round(data.overview.avgSessionDuration)}s`}
            change={getTrendData(data.overview.avgSessionDuration)}
            icon={Clock}
            color="from-orange-500 to-orange-600"
            description="Time spent per visit"
          />
          
          <KPICard
            title="Content Engagement"
            value={`${data.healthcare.contentEngagementRate.toFixed(1)}%`}
            change={getTrendData(data.healthcare.contentEngagementRate)}
            icon={Activity}
            color="from-indigo-500 to-indigo-600"
            description="Deep content interaction rate"
            badge={{ text: "Above average", variant: "default" }}
          />
        </div>
      </div>

      {/* Real-time Metrics */}
      <div>
        <h2 
          className="text-lg font-semibold text-gray-900 mb-4"
          style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' }}
        >
          Real-time Activity
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-green-100">
                  Live Users
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse" />
                  <span className="text-xs text-green-100">Active Now</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {data.realTime.activeUsers}
              </div>
              <p className="text-sm text-green-100">
                Users browsing healthcare content
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Most Active Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.realTime.activePages.slice(0, 3).map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate flex-1 mr-3">
                      {page.page.split('/').pop()?.replace(/-/g, ' ') || 'Homepage'}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {page.users} users
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}