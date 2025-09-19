/**
 * Advanced Analytics Dashboard System
 * 
 * This module provides comprehensive analytics capabilities including:
 * - Real-time performance metrics
 * - User behavior analysis
 * - Content performance tracking
 * - Business intelligence insights
 * - Custom report generation
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { seoOptimizer } from '@/lib/seo/seo-optimizer'

export interface AnalyticsMetrics {
  pageViews: number
  uniqueVisitors: number
  bounceRate: number
  averageSessionDuration: number
  conversionRate: number
  topPages: Array<{ path: string; views: number; conversions: number }>
  topReferrers: Array<{ source: string; visits: number; conversionRate: number }>
  userEngagement: Array<{ metric: string; value: number; trend: 'up' | 'down' | 'stable' }>
}

export interface ContentPerformance {
  contentId: string
  title: string
  contentType: string
  pageViews: number
  uniqueVisitors: number
  averageTimeOnPage: number
  bounceRate: number
  seoScore: number
  socialShares: number
  conversionRate: number
  lastUpdated: Date
}

export interface UserBehavior {
  userId: string
  sessionCount: number
  totalTimeSpent: number
  pagesVisited: string[]
  contentInteractions: Array<{ contentId: string; action: string; timestamp: Date }>
  conversionEvents: Array<{ event: string; value: number; timestamp: Date }>
  lastActivity: Date
}

export interface BusinessIntelligence {
  revenueMetrics: {
    totalRevenue: number
    monthlyRecurringRevenue: number
    customerLifetimeValue: number
    churnRate: number
  }
  contentROI: {
    contentInvestment: number
    contentRevenue: number
    roi: number
    topPerformingContent: string[]
  }
  userSegments: {
    segment: string
    count: number
    averageValue: number
    engagementScore: number
  }[]
}

export interface CustomReport {
  id: string
  name: string
  description: string
  metrics: string[]
  filters: Record<string, any>
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual'
  recipients: string[]
  lastGenerated: Date
  nextScheduled: Date
}

/**
 * Advanced Analytics Dashboard Class
 */
export class AdvancedAnalyticsDashboard {
  private supabase: any

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase() {
    this.supabase = await createServerSupabaseClient()
  }

  /**
   * Get comprehensive analytics metrics
   */
  async getAnalyticsMetrics(
    dateRange: { start: Date; end: Date },
    filters?: Record<string, any>
  ): Promise<AnalyticsMetrics> {
    try {
      const startDate = dateRange.start.toISOString()
      const endDate = dateRange.end.toISOString()

      // Get page views and unique visitors
      const { data: pageViews, error: viewsError } = await this.supabase
        .from('analytics_page_views')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)

      if (viewsError) throw viewsError

      // Get user sessions
      const { data: sessions, error: sessionsError } = await this.supabase
        .from('analytics_user_sessions')
        .select('*')
        .gte('start_time', startDate)
        .lte('end_time', endDate)

      if (sessionsError) throw sessionsError

      // Get conversions
      const { data: conversions, error: conversionsError } = await this.supabase
        .from('analytics_conversions')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)

      if (conversionsError) throw conversionsError

      // Calculate metrics
      const totalPageViews = pageViews?.length || 0
      const uniqueVisitors = new Set(pageViews?.map((p: any) => p.user_id)).size
      const totalSessions = sessions?.length || 0
      const totalConversions = conversions?.length || 0

      // Calculate bounce rate (single-page sessions)
      const singlePageSessions = sessions?.filter((s: any) => s.page_count === 1).length || 0
      const bounceRate = totalSessions > 0 ? (singlePageSessions / totalSessions) * 100 : 0

      // Calculate average session duration
      const totalDuration = sessions?.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) || 0
      const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0

      // Calculate conversion rate
      const conversionRate = totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0

      // Get top pages
      const pageStats = this.calculatePageStats(pageViews || [])
      const topPages = pageStats
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)

      // Get top referrers
      const referrerStats = this.calculateReferrerStats(pageViews || [])
      const topReferrers = referrerStats
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10)

      // Calculate user engagement trends
      const userEngagement = this.calculateUserEngagement(pageViews || [], sessions || [])

      return {
        pageViews: totalPageViews,
        uniqueVisitors,
        bounceRate: Math.round(bounceRate * 100) / 100,
        averageSessionDuration: Math.round(averageSessionDuration),
        conversionRate: Math.round(conversionRate * 100) / 100,
        topPages,
        topReferrers,
        userEngagement
      }

    } catch (error) {
      console.error('Error getting analytics metrics:', error)
      return {
        pageViews: 0,
        uniqueVisitors: 0,
        bounceRate: 0,
        averageSessionDuration: 0,
        conversionRate: 0,
        topPages: [],
        topReferrers: [],
        userEngagement: []
      }
    }
  }

  /**
   * Calculate page statistics
   */
  private calculatePageStats(pageViews: any[]): Array<{ path: string; views: number; conversions: number }> {
    const pageStats = new Map<string, { views: number; conversions: number }>()

    pageViews.forEach(view => {
      const path = view.page_path || '/'
      const current = pageStats.get(path) || { views: 0, conversions: 0 }
      
      current.views += 1
      if (view.is_conversion) {
        current.conversions += 1
      }
      
      pageStats.set(path, current)
    })

    return Array.from(pageStats.entries()).map(([path, stats]) => ({
      path,
      views: stats.views,
      conversions: stats.conversions
    }))
  }

  /**
   * Calculate referrer statistics
   */
  private calculateReferrerStats(pageViews: any[]): Array<{ source: string; visits: number; conversionRate: number }> {
    const referrerStats = new Map<string, { visits: number; conversions: number }>()

    pageViews.forEach(view => {
      const source = view.referrer || 'direct'
      const current = referrerStats.get(source) || { visits: 0, conversions: 0 }
      
      current.visits += 1
      if (view.is_conversion) {
        current.conversions += 1
      }
      
      referrerStats.set(source, current)
    })

    return Array.from(referrerStats.entries()).map(([source, stats]) => ({
      source,
      visits: stats.visits,
      conversionRate: stats.visits > 0 ? (stats.conversions / stats.visits) * 100 : 0
    }))
  }

  /**
   * Calculate user engagement metrics
   */
  private calculateUserEngagement(pageViews: any[], sessions: any[]): Array<{ metric: string; value: number; trend: 'up' | 'down' | 'stable' }> {
    const engagement: Array<{ metric: string; value: number; trend: 'up' | 'down' | 'stable' }> = []

    // Pages per session
    const avgPagesPerSession = sessions.length > 0 
      ? pageViews.length / sessions.length 
      : 0
    engagement.push({
      metric: 'Pages per Session',
      value: Math.round(avgPagesPerSession * 100) / 100,
      trend: 'stable'
    })

    // Average time on page
    const totalTimeOnPage = pageViews.reduce((sum, p) => sum + (p.time_on_page || 0), 0)
    const avgTimeOnPage = pageViews.length > 0 ? totalTimeOnPage / pageViews.length : 0
    engagement.push({
      metric: 'Average Time on Page',
      value: Math.round(avgTimeOnPage),
      trend: 'stable'
    })

    // Return visitor rate
    const uniqueUsers = new Set(pageViews.map(p => p.user_id))
    const returnVisitors = pageViews.filter(p => p.is_return_visitor).length
    const returnRate = uniqueUsers.size > 0 ? (returnVisitors / uniqueUsers.size) * 100 : 0
    engagement.push({
      metric: 'Return Visitor Rate',
      value: Math.round(returnRate * 100) / 100,
      trend: 'stable'
    })

    return engagement
  }

  /**
   * Get content performance analytics
   */
  async getContentPerformance(
    dateRange: { start: Date; end: Date },
    contentType?: string
  ): Promise<ContentPerformance[]> {
    try {
      const startDate = dateRange.start.toISOString()
      const endDate = dateRange.end.toISOString()

      // Get content analytics
      const { data: contentAnalytics, error } = await this.supabase
        .from('analytics_content_performance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (error) throw error

      if (!contentAnalytics || contentAnalytics.length === 0) {
        return []
      }

      // Aggregate data by content
      const contentMap = new Map<string, ContentPerformance>()

      contentAnalytics.forEach((analytics: any) => {
        const contentId = analytics.content_id
        const existing = contentMap.get(contentId)

        if (existing) {
          existing.pageViews += analytics.page_views || 0
          existing.uniqueVisitors += analytics.unique_visitors || 0
          existing.averageTimeOnPage = (existing.averageTimeOnPage + (analytics.avg_time_on_page || 0)) / 2
          existing.bounceRate = (existing.bounceRate + (analytics.bounce_rate || 0)) / 2
          existing.seoScore = Math.max(existing.seoScore, analytics.seo_score || 0)
          existing.socialShares += analytics.social_shares || 0
          existing.conversionRate = (existing.conversionRate + (analytics.conversion_rate || 0)) / 2
        } else {
          contentMap.set(contentId, {
            contentId,
            title: analytics.content_title || 'Unknown',
            contentType: analytics.content_type || 'unknown',
            pageViews: analytics.page_views || 0,
            uniqueVisitors: analytics.unique_visitors || 0,
            averageTimeOnPage: analytics.avg_time_on_page || 0,
            bounceRate: analytics.bounce_rate || 0,
            seoScore: analytics.seo_score || 0,
            socialShares: analytics.social_shares || 0,
            conversionRate: analytics.conversion_rate || 0,
            lastUpdated: new Date(analytics.date)
          })
        }
      })

      // Filter by content type if specified
      let results = Array.from(contentMap.values())
      if (contentType) {
        results = results.filter(content => content.contentType === contentType)
      }

      // Sort by page views
      return results.sort((a, b) => b.pageViews - a.pageViews)

    } catch (error) {
      console.error('Error getting content performance:', error)
      return []
    }
  }

  /**
   * Get user behavior analytics
   */
  async getUserBehavior(
    userId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<UserBehavior[]> {
    try {
      let query = this.supabase
        .from('analytics_user_behavior')
        .select('*')

      if (userId) {
        query = query.eq('user_id', userId)
      }

      if (dateRange) {
        query = query
          .gte('timestamp', dateRange.start.toISOString())
          .lte('timestamp', dateRange.end.toISOString())
      }

      const { data: behavior, error } = await query

      if (error) throw error

      if (!behavior || behavior.length === 0) {
        return []
      }

      // Group by user
      const userMap = new Map<string, UserBehavior>()

      behavior.forEach((record: any) => {
        const userId = record.user_id
        const existing = userMap.get(userId)

        if (existing) {
          existing.sessionCount += 1
          existing.totalTimeSpent += record.session_duration || 0
          existing.pagesVisited.push(record.page_path)
          existing.contentInteractions.push({
            contentId: record.content_id,
            action: record.interaction_type,
            timestamp: new Date(record.timestamp)
          })
          if (record.is_conversion) {
            existing.conversionEvents.push({
              event: record.conversion_event,
              value: record.conversion_value || 0,
              timestamp: new Date(record.timestamp)
            })
          }
          existing.lastActivity = new Date(Math.max(
            existing.lastActivity.getTime(),
            new Date(record.timestamp).getTime()
          ))
        } else {
          userMap.set(userId, {
            userId,
            sessionCount: 1,
            totalTimeSpent: record.session_duration || 0,
            pagesVisited: [record.page_path],
            contentInteractions: [{
              contentId: record.content_id,
              action: record.interaction_type,
              timestamp: new Date(record.timestamp)
            }],
            conversionEvents: record.is_conversion ? [{
              event: record.conversion_event,
              value: record.conversion_value || 0,
              timestamp: new Date(record.timestamp)
            }] : [],
            lastActivity: new Date(record.timestamp)
          })
        }
      })

      return Array.from(userMap.values())

    } catch (error) {
      console.error('Error getting user behavior:', error)
      return []
    }
  }

  /**
   * Get business intelligence insights
   */
  async getBusinessIntelligence(
    dateRange: { start: Date; end: Date }
  ): Promise<BusinessIntelligence> {
    try {
      const startDate = dateRange.start.toISOString()
      const endDate = dateRange.end.toISOString()

      // Get revenue metrics
      const { data: revenue, error: revenueError } = await this.supabase
        .from('analytics_revenue')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (revenueError) throw revenueError

      // Get content ROI data
      const { data: contentROI, error: roiError } = await this.supabase
        .from('analytics_content_roi')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (roiError) throw roiError

      // Get user segmentation data
      const { data: userSegments, error: segmentsError } = await this.supabase
        .from('analytics_user_segments')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (segmentsError) throw segmentsError

      // Calculate revenue metrics
      const totalRevenue = revenue?.reduce((sum: number, r: any) => sum + (r.revenue || 0), 0) || 0
      const mrr = revenue?.reduce((sum: number, r: any) => sum + (r.mrr || 0), 0) || 0
      const clv = revenue?.reduce((sum: number, r: any) => sum + (r.customer_lifetime_value || 0), 0) || 0
      const churnRate = revenue?.reduce((sum: number, r: any) => sum + (r.churn_rate || 0), 0) / (revenue?.length || 1) || 0

      // Calculate content ROI
      const contentInvestment = contentROI?.reduce((sum: number, r: any) => sum + (r.investment || 0), 0) || 0
      const contentRevenue = contentROI?.reduce((sum: number, r: any) => sum + (r.revenue || 0), 0) || 0
      const roi = contentInvestment > 0 ? ((contentRevenue - contentInvestment) / contentInvestment) * 100 : 0

      // Get top performing content
      const topContent = contentROI
        ?.sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0))
        .slice(0, 5)
        .map((r: any) => r.content_title || 'Unknown') || []

      // Process user segments
      const segments = userSegments?.map((segment: any) => ({
        segment: segment.segment_name || 'Unknown',
        count: segment.user_count || 0,
        averageValue: segment.average_value || 0,
        engagementScore: segment.engagement_score || 0
      })) || []

      return {
        revenueMetrics: {
          totalRevenue,
          monthlyRecurringRevenue: mrr,
          customerLifetimeValue: clv,
          churnRate: Math.round(churnRate * 100) / 100
        },
        contentROI: {
          contentInvestment,
          contentRevenue,
          roi: Math.round(roi * 100) / 100,
          topPerformingContent: topContent
        },
        userSegments: segments
      }

    } catch (error) {
      console.error('Error getting business intelligence:', error)
      return {
        revenueMetrics: {
          totalRevenue: 0,
          monthlyRecurringRevenue: 0,
          customerLifetimeValue: 0,
          churnRate: 0
        },
        contentROI: {
          contentInvestment: 0,
          contentRevenue: 0,
          roi: 0,
          topPerformingContent: []
        },
        userSegments: []
      }
    }
  }

  /**
   * Create custom report
   */
  async createCustomReport(report: Omit<CustomReport, 'id' | 'lastGenerated' | 'nextScheduled'>): Promise<CustomReport | null> {
    try {
      const nextScheduled = this.calculateNextScheduledDate(report.schedule)

      const { data: newReport, error } = await this.supabase
        .from('analytics_custom_reports')
        .insert({
          ...report,
          last_generated: null,
          next_scheduled: nextScheduled.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: newReport.id,
        name: newReport.name,
        description: newReport.description,
        metrics: newReport.metrics,
        filters: newReport.filters,
        schedule: newReport.schedule,
        recipients: newReport.recipients,
        lastGenerated: newReport.last_generated ? new Date(newReport.last_generated) : new Date(),
        nextScheduled: new Date(newReport.next_scheduled)
      }

    } catch (error) {
      console.error('Error creating custom report:', error)
      return null
    }
  }

  /**
   * Calculate next scheduled date
   */
  private calculateNextScheduledDate(schedule: string): Date {
    const now = new Date()
    
    switch (schedule) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      default:
        return now
    }
  }

  /**
   * Get custom reports
   */
  async getCustomReports(userId: string): Promise<CustomReport[]> {
    try {
      const { data: reports, error } = await this.supabase
        .from('analytics_custom_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (reports || []).map((report: any) => ({
        id: report.id,
        name: report.name,
        description: report.description,
        metrics: report.metrics,
        filters: report.filters,
        schedule: report.schedule,
        recipients: report.recipients,
        lastGenerated: report.last_generated ? new Date(report.last_generated) : new Date(),
        nextScheduled: new Date(report.next_scheduled)
      }))

    } catch (error) {
      console.error('Error getting custom reports:', error)
      return []
    }
  }

  /**
   * Generate custom report data
   */
  async generateCustomReport(reportId: string): Promise<any> {
    try {
      // Get report configuration
      const { data: report, error: reportError } = await this.supabase
        .from('analytics_custom_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (reportError || !report) {
        throw new Error('Report not found')
      }

      // Generate report data based on metrics and filters
      const reportData = await this.generateReportData(report.metrics, report.filters)

      // Update last generated timestamp
      await this.supabase
        .from('analytics_custom_reports')
        .update({ 
          last_generated: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      return reportData

    } catch (error) {
      console.error('Error generating custom report:', error)
      return null
    }
  }

  /**
   * Generate report data based on metrics and filters
   */
  private async generateReportData(metrics: string[], filters: Record<string, any>): Promise<any> {
    const reportData: any = {}

    for (const metric of metrics) {
      switch (metric) {
        case 'page_views':
          reportData.pageViews = await this.getPageViewsData(filters)
          break
        case 'user_behavior':
          reportData.userBehavior = await this.getUserBehaviorData(filters)
          break
        case 'content_performance':
          reportData.contentPerformance = await this.getContentPerformanceData(filters)
          break
        case 'seo_metrics':
          reportData.seoMetrics = await this.getSEOMetricsData(filters)
          break
        case 'conversion_funnel':
          reportData.conversionFunnel = await this.getConversionFunnelData(filters)
          break
        default:
          reportData[metric] = 'Metric not implemented'
      }
    }

    return reportData
  }

  /**
   * Get page views data for reports
   */
  private async getPageViewsData(filters: Record<string, any>): Promise<any> {
    // Implementation for page views data
    return { message: 'Page views data generation not implemented' }
  }

  /**
   * Get user behavior data for reports
   */
  private async getUserBehaviorData(filters: Record<string, any>): Promise<any> {
    // Implementation for user behavior data
    return { message: 'User behavior data generation not implemented' }
  }

  /**
   * Get content performance data for reports
   */
  private async getContentPerformanceData(filters: Record<string, any>): Promise<any> {
    // Implementation for content performance data
    return { message: 'Content performance data generation not implemented' }
  }

  /**
   * Get SEO metrics data for reports
   */
  private async getSEOMetricsData(filters: Record<string, any>): Promise<any> {
    // Implementation for SEO metrics data
    return { message: 'SEO metrics data generation not implemented' }
  }

  /**
   * Get conversion funnel data for reports
   */
  private async getConversionFunnelData(filters: Record<string, any>): Promise<any> {
    // Implementation for conversion funnel data
    return { message: 'Conversion funnel data generation not implemented' }
  }

  /**
   * Export analytics data
   */
  async exportAnalyticsData(
    metrics: string[],
    format: 'csv' | 'json' | 'excel',
    dateRange: { start: Date; end: Date }
  ): Promise<string> {
    try {
      // Get data for export
      const data = await this.getAnalyticsMetrics(dateRange)
      
      switch (format) {
        case 'json':
          return JSON.stringify(data, null, 2)
        case 'csv':
          return this.convertToCSV(data)
        case 'excel':
          return this.convertToExcel(data)
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }

    } catch (error) {
      console.error('Error exporting analytics data:', error)
      throw new Error('Export failed')
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    // Simple CSV conversion implementation
    const rows = []
    
    // Add headers
    const headers = Object.keys(data)
    rows.push(headers.join(','))
    
    // Add data row
    const values = headers.map(header => {
      const value = data[header]
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`
      }
      return value
    })
    rows.push(values.join(','))
    
    return rows.join('\n')
  }

  /**
   * Convert data to Excel format
   */
  private convertToExcel(data: any): string {
    // For now, return JSON as Excel conversion requires additional libraries
    return JSON.stringify(data, null, 2)
  }
}

// Export singleton instance
export const advancedAnalyticsDashboard = new AdvancedAnalyticsDashboard()
