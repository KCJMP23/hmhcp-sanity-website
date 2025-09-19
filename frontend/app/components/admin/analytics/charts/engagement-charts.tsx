'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  HeartIcon,
  ClockIcon,
  EyeIcon,
  TrendingUpIcon,
  ChartBarIcon,
  CursorArrowRippleIcon,
} from '@heroicons/react/24/outline'
import { EngagementChartData, BlogPerformanceMetrics } from '@/types/blog-analytics'

interface EngagementChartsProps {
  data: BlogPerformanceMetrics[]
  className?: string
}

export function EngagementCharts({ data, className = '' }: EngagementChartsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')

  // Calculate engagement metrics
  const avgEngagementMetrics = data.length > 0 ? {
    avgTimeOnPage: Math.round(data.reduce((sum, item) => sum + item.avg_time_on_page, 0) / data.length),
    avgBounceRate: Math.round(data.reduce((sum, item) => sum + item.bounce_rate, 0) / data.length),
    avgScrollCompletion: Math.round(data.reduce((sum, item) => sum + item.scroll_completion_rate, 0) / data.length),
    totalViews: data.reduce((sum, item) => sum + item.total_views, 0),
    totalUniqueVisitors: data.reduce((sum, item) => sum + item.unique_visitors, 0),
  } : {
    avgTimeOnPage: 0,
    avgBounceRate: 0,
    avgScrollCompletion: 0,
    totalViews: 0,
    totalUniqueVisitors: 0,
  }

  // Get top performing content
  const topContent = data
    .sort((a, b) => b.total_views - a.total_views)
    .slice(0, 5)

  // Calculate healthcare professional engagement
  const healthcareProfessionalEngagement = data.map(item => ({
    title: item.title,
    professional_percentage: Math.round((item.healthcare_professional_engagement.views / item.total_views) * 100) || 0,
    avg_time: item.healthcare_professional_engagement.avg_time,
    views: item.healthcare_professional_engagement.views,
  })).sort((a, b) => b.professional_percentage - a.professional_percentage)

  // Time range labels
  const timeRangeLabels = {
    '1h': 'Last Hour',
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Engagement Analytics</h2>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {Object.entries(timeRangeLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedTimeRange(key as any)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedTimeRange === key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(avgEngagementMetrics.avgTimeOnPage / 60)}m
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Time on Page</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {avgEngagementMetrics.avgScrollCompletion}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Scroll Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <CursorArrowRippleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {avgEngagementMetrics.avgBounceRate}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bounce Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <EyeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {avgEngagementMetrics.totalViews.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Performance & Healthcare Professional Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Top Performing Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topContent.map((content, index) => {
                const engagementScore = Math.round(
                  (content.scroll_completion_rate * 0.4) + 
                  ((content.avg_time_on_page / 300) * 30) + 
                  ((100 - content.bounce_rate) * 0.3)
                )
                
                return (
                  <div key={content.slug} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                          {content.title}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{content.total_views.toLocaleString()} views</span>
                          <span>{Math.round(content.avg_time_on_page / 60)}m avg</span>
                          <span>{content.scroll_completion_rate}% scroll</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={content.views_trend === 'up' ? 'default' : 
                               content.views_trend === 'down' ? 'destructive' : 'secondary'}
                      >
                        {content.views_trend === 'up' ? '↗' : content.views_trend === 'down' ? '↘' : '→'} 
                        {engagementScore}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Healthcare Professional Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartIcon className="h-5 w-5" />
              Healthcare Professional Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthcareProfessionalEngagement.slice(0, 5).map((content, index) => (
                <div key={`${content.title}-${index}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
                      {content.title}
                    </h4>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {content.professional_percentage}%
                    </span>
                  </div>
                  <Progress value={content.professional_percentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{content.views} professional views</span>
                    <span>{Math.round(content.avg_time / 60)}m avg time</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {Math.round((100 - avgEngagementMetrics.avgBounceRate))}%
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">Engaged Visitors</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Visitors who interact with content beyond initial view
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {Math.round(avgEngagementMetrics.avgScrollCompletion)}%
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">Content Completion</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Average percentage of content viewed by readers
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {Math.round(avgEngagementMetrics.avgTimeOnPage / 60)}m
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">Reading Time</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Average time spent reading healthcare content
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}