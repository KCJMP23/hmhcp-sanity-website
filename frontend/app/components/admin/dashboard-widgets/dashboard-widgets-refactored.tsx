'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Plus } from 'lucide-react'
// import { AnalyticsSummaryWidget } from '../analytics-summary-widget'
import type { DashboardData, DashboardStats } from './types'
import { fetchDashboardStats, fetchComprehensiveDashboardStats, formatDate } from './api'
import { MainStatistics } from './main-statistics'
import { HealthcareMetrics } from './healthcare-metrics'
import { ChartsSection } from './charts-section'
import { ContentPerformance } from './content-performance'
import { ContentManagement } from './content-management'
import { QuickActions } from './quick-actions'
import { SystemStatus } from './system-status'

const WordPressStyleDashboardComponent = () => {
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
    isLoading: true,
    error: null
  })

  const [comprehensiveStats, setComprehensiveStats] = useState<DashboardStats>({
    totalPages: 0,
    totalPosts: 0,
    totalUsers: 0,
    totalMedia: 0,
    recentPages: [],
    recentPosts: [],
    recentMedia: [],
    trafficData: [],
    contentPerformance: [],
    deviceStats: [],
    healthcareMetrics: {
      activeClinicalTrials: 0,
      activeTrialsChange: '0%',
      activeTrialsTrend: 'stable' as const,
      enrolledPatients: 0,
      enrolledPatientsChange: '0%',
      enrolledPatientsTrend: 'stable' as const,
      dataQualityScore: 0,
      dataQualityChange: '0%',
      dataQualityTrend: 'stable' as const,
      platformUptime: 99.9,
      platformUptimeChange: '0%',
      platformUptimeTrend: 'stable' as const
    },
    systemStatus: []
  })

  const loadDashboardData = async () => {
    setDashboardData(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      // Fetch both basic stats and comprehensive stats in parallel
      const [basicStats, comprehensive] = await Promise.all([
        fetchDashboardStats(),
        fetchComprehensiveDashboardStats()
      ])
      
      setDashboardData({
        stats: basicStats,
        isLoading: false,
        error: null
      })
      
      setComprehensiveStats(comprehensive)
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

  const { stats, isLoading, error } = dashboardData

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="bg-red-50 border border-red-200 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">Error loading dashboard: {error}</span>
          </div>
          <Button onClick={loadDashboardData} className="rounded-full mt-2" variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const safeComprehensive = comprehensiveStats || {
    totalPages: 0,
    totalPosts: 0,
    totalUsers: 0,
    totalMedia: 0,
    recentPages: [],
    recentPosts: [],
    recentMedia: [],
    trafficData: [],
    deviceStats: [],
    contentPerformance: [],
    healthcareMetrics: {
      activeClinicalTrials: 0,
      activeTrialsChange: '0%',
      activeTrialsTrend: 'stable' as const,
      enrolledPatients: 0,
      enrolledPatientsChange: '0%',
      enrolledPatientsTrend: 'stable' as const,
      dataQualityScore: 0,
      dataQualityChange: '0%',
      dataQualityTrend: 'stable' as const,
      platformUptime: 99.9,
      platformUptimeChange: '0%',
      platformUptimeTrend: 'stable' as const
    },
    systemStatus: [],
  }

  return (
    <div className="px-4 md:px-5 lg:px-8 pt-2 md:pt-3 space-y-6 bg-white dark:bg-transparent min-h-[calc(100vh-0rem)] w-full overflow-x-hidden">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-light tracking-tight text-foreground">Healthcare Content Management</h1>
          <p className="font-text text-sm sm:text-base text-muted-foreground mt-1 tracking-body">
            Manage your healthcare platform content, pages, and media like WordPress.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            aria-label="Refresh"
            className="h-9 w-9 p-0 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {/* Header add button removed; use global FAB for add actions on all screens */}
        </div>
      </div>

      {/* Main Statistics */}
      <MainStatistics stats={stats} />

      {/* Healthcare-Specific Metrics */}
      <HealthcareMetrics metrics={safeComprehensive.healthcareMetrics} />

      {/* Charts and Analytics */}
      <ChartsSection 
        trafficData={safeComprehensive.trafficData}
        deviceStats={safeComprehensive.deviceStats}
      />

      {/* Content Performance */}
      <ContentPerformance contentPerformance={safeComprehensive.contentPerformance} />

      {/* Content Management Row */}
      <ContentManagement 
        stats={stats} 
        isLoading={isLoading} 
        formatDate={formatDate} 
      />

      {/* WordPress-Style Quick Actions */}
      <QuickActions />

      {/* System Status Section */}
      <SystemStatus systemStatus={safeComprehensive.systemStatus} />
    </div>
  )
}

// Export with React.memo for performance optimization
export const WordPressStyleDashboard = memo(WordPressStyleDashboardComponent)