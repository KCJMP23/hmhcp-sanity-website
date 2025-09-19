import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createDatabaseAdapter } from '@/lib/db/adapter'

export interface AnalyticsData {
  pageViews: PageView[]
  uniqueVisitors: number
  bounceRate: number
  avgSessionDuration: number
  topPages: TopPage[]
  trafficSources: TrafficSource[]
  deviceTypes: DeviceType[]
  locations: Location[]
  conversions: Conversion[]
  realTimeUsers: number
}

export interface PageView {
  id?: string
  page_path: string
  page_title: string
  visitor_id: string
  session_id: string
  timestamp: string
  duration?: number
  bounce?: boolean
  referrer?: string
  device_type?: string
  browser?: string
  os?: string
  country?: string
  city?: string
}

export interface TopPage {
  path: string
  title: string
  views: number
  unique_visitors: number
  avg_duration: number
  bounce_rate: number
}

export interface TrafficSource {
  source: string
  medium: string
  visits: number
  percentage: number
}

export interface DeviceType {
  type: 'desktop' | 'mobile' | 'tablet'
  count: number
  percentage: number
}

export interface Location {
  country: string
  city?: string
  visits: number
  percentage: number
}

export interface Conversion {
  id?: string
  goal_name: string
  goal_type: 'page_view' | 'event' | 'form_submission' | 'button_click'
  completed_at: string
  visitor_id: string
  session_id: string
  value?: number
}

export interface AnalyticsFilter {
  startDate: Date
  endDate: Date
  page?: string
  source?: string
  device?: string
  country?: string
}

// Track page view
export async function trackPageView(data: Omit<PageView, 'id' | 'timestamp'>): Promise<{ success: boolean; error?: string }> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    if (!adapter.data.analytics_page_views) adapter.data.analytics_page_views = []
    
    const pageView: PageView = {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    }
    
    adapter.data.analytics_page_views.push(pageView)
    return { success: true }
  }
  
  const { error } = await adapter.supabaseClient
    .from('analytics_page_views')
    .insert({
      ...data,
      timestamp: new Date().toISOString()
    })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// Track conversion
export async function trackConversion(data: Omit<Conversion, 'id' | 'completed_at'>): Promise<{ success: boolean; error?: string }> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    if (!adapter.data.analytics_conversions) adapter.data.analytics_conversions = []
    
    const conversion: Conversion = {
      ...data,
      id: Date.now().toString(),
      completed_at: new Date().toISOString()
    }
    
    adapter.data.analytics_conversions.push(conversion)
    return { success: true }
  }
  
  const { error } = await adapter.supabaseClient
    .from('analytics_conversions')
    .insert({
      ...data,
      completed_at: new Date().toISOString()
    })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// Get analytics data
export async function getAnalyticsData(filter: AnalyticsFilter): Promise<AnalyticsData> {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    // Return empty data for local adapter - production code should use real database
    return {
      pageViews: [],
      uniqueVisitors: 0,
      bounceRate: 0,
      avgSessionDuration: 0,
      topPages: [],
      trafficSources: [],
      deviceTypes: [],
      locations: [],
      conversions: [],
      realTimeUsers: 0
    }
  }
  
  try {
    // Fetch page views
    let pageViewsQuery = adapter.supabaseClient
      .from('analytics_page_views')
      .select('*')
      .gte('timestamp', filter.startDate.toISOString())
      .lte('timestamp', filter.endDate.toISOString())
    
    if (filter.page) {
      pageViewsQuery = pageViewsQuery.eq('page_path', filter.page)
    }
    if (filter.device) {
      pageViewsQuery = pageViewsQuery.eq('device_type', filter.device)
    }
    if (filter.country) {
      pageViewsQuery = pageViewsQuery.eq('country', filter.country)
    }
    
    const { data: pageViews = [] } = await pageViewsQuery
    
    // Calculate metrics
    const uniqueVisitors = pageViews ? new Set(pageViews.map((pv: any) => pv.visitor_id)).size : 0
    const sessions = pageViews ? new Set(pageViews.map((pv: any) => pv.session_id)).size : 0
    const bounces = pageViews ? pageViews.filter((pv: any) => pv.bounce).length : 0
    const bounceRate = sessions > 0 ? (bounces / sessions) * 100 : 0
    
    const totalDuration = pageViews ? pageViews.reduce((sum: number, pv: any) => sum + (pv.duration || 0), 0) : 0
    const avgSessionDuration = sessions > 0 ? totalDuration / sessions : 0
    
    // Calculate top pages
    const pageStats = (pageViews || []).reduce((acc: any, pv: any) => {
      const key = pv.page_path
      if (!acc[key]) {
        acc[key] = {
          path: pv.page_path,
          title: pv.page_title,
          views: 0,
          visitors: new Set(),
          duration: 0,
          bounces: 0,
          sessions: new Set()
        }
      }
      acc[key].views++
      acc[key].visitors.add(pv.visitor_id)
      acc[key].sessions.add(pv.session_id)
      acc[key].duration += pv.duration || 0
      if (pv.bounce) acc[key].bounces++
      return acc
    }, {} as Record<string, any>)
    
    const topPages: TopPage[] = Object.values(pageStats)
      .map((stat: any) => ({
        path: stat.path,
        title: stat.title,
        views: stat.views,
        unique_visitors: stat.visitors.size,
        avg_duration: stat.views > 0 ? stat.duration / stat.views : 0,
        bounce_rate: stat.sessions.size > 0 ? (stat.bounces / stat.sessions.size) * 100 : 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
    
    // Calculate traffic sources
    const sourceStats = (pageViews || []).reduce((acc: any, pv: any) => {
      if (pv.referrer) {
        const source = new URL(pv.referrer).hostname
        if (!acc[source]) acc[source] = 0
        acc[source]++
      }
      return acc
    }, {} as Record<string, number>)
    
    const totalSourceVisits = Object.values(sourceStats).reduce((sum: number, count: any) => sum + count, 0)
    const trafficSources: TrafficSource[] = Object.entries(sourceStats)
      .map(([source, visits]) => ({
        source,
        medium: 'referral',
        visits: visits as number,
        percentage: totalSourceVisits > 0 ? ((visits as number) / totalSourceVisits) * 100 : 0
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5)
    
    // Calculate device types
    const deviceStats = (pageViews || []).reduce((acc: any, pv: any) => {
      const device = pv.device_type || 'desktop'
      if (!acc[device]) acc[device] = 0
      acc[device]++
      return acc
    }, {} as Record<string, number>)
    
    const totalDeviceVisits = Object.values(deviceStats).reduce((sum: number, count: any) => sum + count, 0)
    const deviceTypes: DeviceType[] = ['desktop', 'mobile', 'tablet'].map(type => ({
      type: type as DeviceType['type'],
      count: deviceStats[type] || 0,
      percentage: totalDeviceVisits > 0 ? ((deviceStats[type] || 0) / totalDeviceVisits) * 100 : 0
    }))
    
    // Calculate locations
    const locationStats = (pageViews || []).reduce((acc: any, pv: any) => {
      if (pv.country) {
        if (!acc[pv.country]) acc[pv.country] = 0
        acc[pv.country]++
      }
      return acc
    }, {} as Record<string, number>)
    
    const totalLocationVisits = Object.values(locationStats).reduce((sum: number, count: any) => sum + count, 0)
    const locations: Location[] = Object.entries(locationStats)
      .map(([country, visits]) => ({
        country,
        visits: visits as number,
        percentage: totalLocationVisits > 0 ? ((visits as number) / totalLocationVisits) * 100 : 0
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10)
    
    // Fetch conversions
    const { data: conversions = [] } = await adapter.supabaseClient
      .from('analytics_conversions')
      .select('*')
      .gte('completed_at', filter.startDate.toISOString())
      .lte('completed_at', filter.endDate.toISOString())
    
    // Calculate real-time users (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const { data: realtimeViews = [] } = await adapter.supabaseClient
      .from('analytics_page_views')
      .select('visitor_id')
      .gte('timestamp', fiveMinutesAgo.toISOString())
    
    const realTimeUsers = realtimeViews ? new Set(realtimeViews.map((v: any) => v.visitor_id)).size : 0
    
    return {
      pageViews: pageViews || [],
      uniqueVisitors,
      bounceRate,
      avgSessionDuration,
      topPages,
      trafficSources,
      deviceTypes,
      locations,
      conversions: conversions || [],
      realTimeUsers
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return {
      pageViews: [],
      uniqueVisitors: 0,
      bounceRate: 0,
      avgSessionDuration: 0,
      topPages: [],
      trafficSources: [],
      deviceTypes: [],
      locations: [],
      conversions: [],
      realTimeUsers: 0
    }
  }
}

// Get healthcare-specific metrics
export async function getHealthcareMetrics(filter: AnalyticsFilter) {
  const adapter = await createDatabaseAdapter()
  
  if (adapter.type === 'local') {
    // Return empty data for local adapter - production code should use real database
    return {
      patientPortalVisits: 0,
      clinicalTrialViews: 0,
      researchDownloads: 0,
      platformDemoRequests: 0,
      averageEngagementTime: 0,
      contentEngagementRate: 0
    }
  }
  
  try {
    // Patient portal visits
    const { count: patientPortalVisits } = await adapter.supabaseClient
      .from('analytics_page_views')
      .select('*', { count: 'exact', head: true })
      .like('page_path', '/patient-portal%')
      .gte('timestamp', filter.startDate.toISOString())
      .lte('timestamp', filter.endDate.toISOString())
    
    // Clinical trial views
    const { count: clinicalTrialViews } = await adapter.supabaseClient
      .from('analytics_page_views')
      .select('*', { count: 'exact', head: true })
      .like('page_path', '/research/clinical-studies%')
      .gte('timestamp', filter.startDate.toISOString())
      .lte('timestamp', filter.endDate.toISOString())
    
    // Research downloads (conversions)
    const { count: researchDownloads } = await adapter.supabaseClient
      .from('analytics_conversions')
      .select('*', { count: 'exact', head: true })
      .eq('goal_type', 'event')
      .eq('goal_name', 'research_download')
      .gte('completed_at', filter.startDate.toISOString())
      .lte('completed_at', filter.endDate.toISOString())
    
    // Platform demo requests
    const { count: platformDemoRequests } = await adapter.supabaseClient
      .from('analytics_conversions')
      .select('*', { count: 'exact', head: true })
      .eq('goal_type', 'form_submission')
      .eq('goal_name', 'demo_request')
      .gte('completed_at', filter.startDate.toISOString())
      .lte('completed_at', filter.endDate.toISOString())
    
    // Average engagement time
    const { data: engagementData } = await adapter.supabaseClient
      .from('analytics_page_views')
      .select('duration')
      .gte('timestamp', filter.startDate.toISOString())
      .lte('timestamp', filter.endDate.toISOString())
      .not('duration', 'is', null)
    
    const totalEngagementTime = engagementData?.reduce((sum: number, item: any) => sum + (item.duration || 0), 0) || 0
    const averageEngagementTime = engagementData && engagementData.length > 0 
      ? totalEngagementTime / engagementData.length 
      : 0
    
    // Content engagement rate
    const { data: allViews } = await adapter.supabaseClient
      .from('analytics_page_views')
      .select('visitor_id, duration')
      .gte('timestamp', filter.startDate.toISOString())
      .lte('timestamp', filter.endDate.toISOString())
    
    const engagedSessions = allViews?.filter((v: any) => v.duration && v.duration > 10).length || 0
    const totalSessions = allViews?.length || 0
    const contentEngagementRate = totalSessions > 0 
      ? (engagedSessions / totalSessions) * 100 
      : 0
    
    return {
      patientPortalVisits: patientPortalVisits || 0,
      clinicalTrialViews: clinicalTrialViews || 0,
      researchDownloads: researchDownloads || 0,
      platformDemoRequests: platformDemoRequests || 0,
      averageEngagementTime,
      contentEngagementRate
    }
  } catch (error) {
    console.error('Error fetching healthcare metrics:', error)
    return {
      patientPortalVisits: 0,
      clinicalTrialViews: 0,
      researchDownloads: 0,
      platformDemoRequests: 0,
      averageEngagementTime: 0,
      contentEngagementRate: 0
    }
  }
}

// Export analytics data
export async function exportAnalyticsData(filter: AnalyticsFilter, format: 'csv' | 'json'): Promise<{ data: string; filename: string }> {
  const analyticsData = await getAnalyticsData(filter)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  
  if (format === 'json') {
    return {
      data: JSON.stringify(analyticsData, null, 2),
      filename: `analytics-export-${timestamp}.json`
    }
  }
  
  // CSV export
  const headers = ['Date', 'Page', 'Page Views', 'Unique Visitors', 'Bounce Rate', 'Avg Duration']
  const rows = analyticsData.topPages.map(page => [
    new Date().toLocaleDateString(),
    page.path,
    page.views.toString(),
    page.unique_visitors.toString(),
    page.bounce_rate.toFixed(2) + '%',
    (page.avg_duration / 1000).toFixed(2) + 's'
  ])
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  return {
    data: csv,
    filename: `analytics-export-${timestamp}.csv`
  }
}