'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart,
  FileText,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Activity
} from 'lucide-react'

interface ContentMetric {
  title: string
  views: number
  avgTimeOnPage: string
  bounceRate: number
  conversionRate: number
  trend: 'up' | 'down' | 'stable'
}

export function ContentPerformanceDashboard() {
  // Sample data - in production, this would come from your analytics service
  const contentMetrics: ContentMetric[] = [
    {
      title: 'Clinical Research Services Overview',
      views: 5432,
      avgTimeOnPage: '4:23',
      bounceRate: 32,
      conversionRate: 5.2,
      trend: 'up'
    },
    {
      title: 'Healthcare Technology Solutions',
      views: 4321,
      avgTimeOnPage: '3:45',
      bounceRate: 38,
      conversionRate: 4.8,
      trend: 'up'
    },
    {
      title: 'Platform Features Guide',
      views: 3876,
      avgTimeOnPage: '5:12',
      bounceRate: 28,
      conversionRate: 6.1,
      trend: 'stable'
    },
    {
      title: 'Case Studies: Success Stories',
      views: 2987,
      avgTimeOnPage: '6:34',
      bounceRate: 22,
      conversionRate: 7.3,
      trend: 'up'
    },
    {
      title: 'Workforce Development Programs',
      views: 2543,
      avgTimeOnPage: '3:21',
      bounceRate: 45,
      conversionRate: 3.2,
      trend: 'down'
    }
  ]

  const topPerformers = contentMetrics.slice(0, 3)
  const needsImprovement = contentMetrics.filter(m => m.bounceRate > 40 || m.conversionRate < 4)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245,678</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time on Page</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4:32</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.4%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.8%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Performance Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Content</TabsTrigger>
          <TabsTrigger value="top">Top Performers</TabsTrigger>
          <TabsTrigger value="improve">Needs Improvement</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance Metrics</CardTitle>
              <CardDescription>
                Performance data for all published content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentMetrics.map((content, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium">{content.title}</h4>
                        {content.trend === 'up' && (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        )}
                        {content.trend === 'down' && (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{content.views.toLocaleString()} views</span>
                        <span>{content.avgTimeOnPage} avg. time</span>
                        <span>{content.bounceRate}% bounce rate</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={content.conversionRate > 5 ? 'default' : 'secondary'}>
                        {content.conversionRate}% conversion
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>
                Content with highest engagement and conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((content, index) => (
                  <div key={index} className="p-4 border bg-green-50 dark:bg-blue-950">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {content.title}
                          <Badge variant="outline" className="text-green-600">
                            Top Performer
                          </Badge>
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {content.conversionRate}% conversion rate • {content.avgTimeOnPage} avg. time
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improve" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Needing Improvement</CardTitle>
              <CardDescription>
                Content with high bounce rates or low conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {needsImprovement.map((content, index) => (
                  <div key={index} className="p-4 border bg-orange-50 dark:bg-blue-950">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{content.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Issues: {content.bounceRate > 40 && `High bounce rate (${content.bounceRate}%)`}
                          {content.bounceRate > 40 && content.conversionRate < 4 && ' • '}
                          {content.conversionRate < 4 && `Low conversion (${content.conversionRate}%)`}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-orange-600">
                        Needs Review
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Trends</CardTitle>
              <CardDescription>
                Performance trends over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart className="h-12 w-12 mx-auto mb-4" />
                  <p>Content trend visualization will be displayed here</p>
                  <p className="text-sm mt-2">Showing views, engagement, and conversion trends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}