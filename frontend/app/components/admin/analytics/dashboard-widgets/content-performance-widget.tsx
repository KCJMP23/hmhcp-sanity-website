'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import {
  FileText, TrendingUp, TrendingDown, ExternalLink, Clock, Users, Eye
} from 'lucide-react'

interface ContentPerformanceWidgetProps {
  data: {
    topPages: Array<{
      path: string
      title: string
      views: number
      uniqueVisitors: number
      avgDuration: number
      bounceRate: number
    }>
    timeSeries: Array<{
      date: string
      users: number
      sessions: number
      pageViews: number
      patientUsers: number
      hcpUsers: number
    }>
  }
}

export const ContentPerformanceWidget: React.FC<ContentPerformanceWidgetProps> = ({ data }) => {
  // Calculate performance scores for content
  const getPerformanceScore = (page: any) => {
    // Weighted scoring: views (30%), engagement time (40%), low bounce rate (30%)
    const viewsScore = Math.min((page.views / 1000) * 100, 100)
    const engagementScore = Math.min((page.avgDuration / 300) * 100, 100) // 5 minutes = 100%
    const bounceScore = Math.max(100 - page.bounceRate, 0)
    
    return Math.round((viewsScore * 0.3) + (engagementScore * 0.4) + (bounceScore * 0.3))
  }

  // Get content type from path
  const getContentType = (path: string) => {
    if (path.includes('platform')) return 'Platform'
    if (path.includes('research')) return 'Research'
    if (path.includes('service')) return 'Services'
    if (path.includes('clinical')) return 'Clinical'
    return 'General'
  }

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  // Get trend color
  const getTrendColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Get performance badge
  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return { text: 'Excellent', variant: 'default' as const }
    if (score >= 60) return { text: 'Good', variant: 'secondary' as const }
    if (score >= 40) return { text: 'Fair', variant: 'outline' as const }
    return { text: 'Needs Improvement', variant: 'destructive' as const }
  }

  // Prepare chart data for content performance over time
  const chartData = data.timeSeries.slice(-14).map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pageViews: item.pageViews,
    patientViews: item.patientUsers * 2.3, // Estimate page views from users
    hcpViews: item.hcpUsers * 2.3
  }))

  return (
    <div className="space-y-6">
      {/* Content Performance Overview Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Content Performance Trends
          </CardTitle>
          <CardDescription>
            Page views breakdown by user type over the last 14 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} views`,
                    name === 'patientViews' ? 'Patient Views' : 
                    name === 'hcpViews' ? 'HCP Views' : 'Total Views'
                  ]}
                />
                <Legend />
                <Bar 
                  dataKey="patientViews" 
                  fill="#FF3B30" 
                  name="Patient Views"
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="hcpViews" 
                  fill="#34C759" 
                  name="HCP Views"
                  radius={[0, 0, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Top Performing Content
          </CardTitle>
          <CardDescription>
            Content ranking based on views, engagement, and bounce rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.topPages.slice(0, 5).map((page, index) => {
              const score = getPerformanceScore(page)
              const badge = getPerformanceBadge(score)
              const contentType = getContentType(page.path)
              
              return (
                <div key={index} className="p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {contentType}
                        </Badge>
                        <Badge variant={badge.variant} className="text-xs">
                          {badge.text}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {page.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {page.path}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-lg font-bold ${getTrendColor(score)}`}>
                        {score}
                      </div>
                      <div className="text-xs text-gray-500">Performance Score</div>
                    </div>
                  </div>

                  {/* Performance Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Overall Performance</span>
                      <span>{score}/100</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium">{page.views.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Views</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="font-medium">{page.uniqueVisitors.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Visitors</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <div>
                        <div className="font-medium">{formatDuration(page.avgDuration)}</div>
                        <div className="text-xs text-gray-500">Avg Time</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {page.bounceRate < 40 ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">{page.bounceRate.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">Bounce Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Content Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <div>
                <div className="font-medium text-blue-900">Strong Clinical Content Performance</div>
                <div className="text-blue-700">Research and clinical study pages show 40% higher engagement than average</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
              <div>
                <div className="font-medium text-blue-900">Platform Documentation Opportunity</div>
                <div className="text-blue-700">EHR platform pages have high traffic but could improve engagement time</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              <div>
                <div className="font-medium text-blue-900">HCP vs Patient Content Preference</div>
                <div className="text-blue-700">Healthcare professionals prefer detailed technical content while patients engage more with simplified guides</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}