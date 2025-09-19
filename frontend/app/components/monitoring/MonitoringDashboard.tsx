'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Globe,
  Server,
  Zap,
  Shield
} from 'lucide-react';
import { MetricCard } from './MetricCard';
import { VisitorMap } from './VisitorMap';
import { PerformanceChart } from './PerformanceChart';
import { ActiveAlerts } from './ActiveAlerts';
import { ServiceStatus } from './ServiceStatus';
import { RealtimeMetrics } from './RealtimeMetrics';
import { ErrorLog } from './ErrorLog';
import { useRealtimeMetrics } from '@/hooks/use-realtime-metrics';

export function MonitoringDashboard() {
  const { metrics, connected, loading } = useRealtimeMetrics();
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2  ${connected ? 'bg-blue-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-sm text-muted-foreground">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <Badge variant="outline">
          Last updated: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Visitors"
          value={metrics?.activeVisitors?.count || 0}
          icon={Users}
          trend={metrics?.activeVisitors?.trend}
          loading={loading}
        />
        
        <MetricCard
          title="Avg Response Time"
          value={`${metrics?.performance?.avgResponseTime || 0}ms`}
          icon={Zap}
          threshold={200}
          format="latency"
          loading={loading}
        />
        
        <MetricCard
          title="Error Rate"
          value={`${metrics?.performance?.errorRate || 0}%`}
          icon={AlertTriangle}
          threshold={1}
          format="percentage"
          severity={(metrics?.performance?.errorRate || 0) > 5 ? 'high' : 'normal'}
          loading={loading}
        />
        
        <MetricCard
          title="Uptime"
          value={`${metrics?.health?.uptime || 100}%`}
          icon={Shield}
          format="percentage"
          trend="stable"
          loading={loading}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visitor Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Visitor Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VisitorMap visitors={metrics?.activeVisitors?.locations || []} />
              </CardContent>
            </Card>

            {/* Real-time Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Real-time Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealtimeMetrics metrics={metrics} />
              </CardContent>
            </Card>
          </div>

          {/* Service Status */}
          <ServiceStatus services={metrics?.health?.services || []} />

          {/* Recent Alerts */}
          <ActiveAlerts limit={5} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceChart />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Core Web Vitals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Largest Contentful Paint (LCP)</span>
                    <Badge variant={(metrics?.performance?.lcp || 0) > 2500 ? 'destructive' : 'default'}>
                      {metrics?.performance?.lcp || 0}ms
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">First Input Delay (FID)</span>
                    <Badge variant={(metrics?.performance?.fid || 0) > 100 ? 'destructive' : 'default'}>
                      {metrics?.performance?.fid || 0}ms
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cumulative Layout Shift (CLS)</span>
                    <Badge variant={(metrics?.performance?.cls || 0) > 0.1 ? 'destructive' : 'default'}>
                      {metrics?.performance?.cls || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance by Page</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.performance?.pageMetrics?.map((page: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm truncate flex-1">{page.url}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline">{page.avgLoadTime}ms</Badge>
                        <Badge variant="outline">{page.views} views</Badge>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No page metrics available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <ErrorLog />
        </TabsContent>

        <TabsContent value="visitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Visitors by Page</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.activeVisitors?.byPage?.map((page: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm truncate flex-1">{page.url}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{page.visitors}</span>
                      </div>
                      <Badge variant="outline">{page.avgTime}s</Badge>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No visitor data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Desktop</span>
                    <span className="font-medium">{metrics?.activeVisitors?.deviceTypes?.desktop || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Mobile</span>
                    <span className="font-medium">{metrics?.activeVisitors?.deviceTypes?.mobile || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tablet</span>
                    <span className="font-medium">{metrics?.activeVisitors?.deviceTypes?.tablet || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Browsers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics?.activeVisitors?.browsers?.map((browser: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">{browser.name}</span>
                      <span className="font-medium">{browser.percentage}%</span>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">No data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics?.activeVisitors?.topCountries?.map((country: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">{country.name}</span>
                      <span className="font-medium">{country.visitors}</span>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">No data</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <ActiveAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}