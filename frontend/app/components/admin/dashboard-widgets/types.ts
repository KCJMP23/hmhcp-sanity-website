'use client'

// Types for real data
export interface SiteStats {
  totalPages: number
  totalPosts: number
  totalUsers: number
  totalMedia: number
  recentPages: any[]
  recentPosts: any[]
  recentMedia: any[]
}

export interface DashboardData {
  stats: SiteStats
  isLoading: boolean
  error: string | null
}

// Component Props Interfaces
export interface StatCardProps {
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'stable'
  icon: any
  color: string
}

export interface DashboardWidgetProps {
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export interface MainStatisticsProps {
  stats: SiteStats
}

export interface HealthcareMetricsProps {}

export interface ChartsSectionProps {}

export interface ContentPerformanceProps {}

export interface ContentManagementProps {
  stats: SiteStats
  isLoading: boolean
  formatDate: (dateString: string) => string
}

export interface QuickActionsProps {}

export interface SystemStatusProps {
  systemStatus?: SystemService[]
}

// Data interfaces for real API responses
export interface TrafficDataPoint {
  name: string
  visits: number
  pageviews: number
}

export interface ContentPerformanceItem {
  name: string
  views: number
  engagement: number
}

export interface DeviceStat {
  name: string
  value: number
  color: string
}

export interface HealthcareMetric {
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'stable'
  color: string
}

export interface HealthcareMetricsData {
  activeClinicalTrials: number
  enrolledPatients: number
  dataQualityScore: number
  platformUptime: number
}

export interface SystemService {
  service: string
  status: 'operational' | 'degraded' | 'down'
  uptime: string
}

export interface DashboardStats {
  totalPages: number
  totalPosts: number
  totalUsers: number
  totalMedia: number
  recentPages: any[]
  recentPosts: any[]
  recentMedia: any[]
  healthcareMetrics: {
    activeClinicalTrials: number
    activeTrialsChange: string
    activeTrialsTrend: 'up' | 'down' | 'stable'
    enrolledPatients: number
    enrolledPatientsChange: string
    enrolledPatientsTrend: 'up' | 'down' | 'stable'
    dataQualityScore: number
    dataQualityChange: string
    dataQualityTrend: 'up' | 'down' | 'stable'
    platformUptime: number
    platformUptimeChange: string
    platformUptimeTrend: 'up' | 'down' | 'stable'
  }
  systemStatus: SystemService[]
  // Optional fields that might not be provided by the API
  trafficData?: TrafficDataPoint[]
  contentPerformance?: ContentPerformanceItem[]
  deviceStats?: DeviceStat[]
}

// Update component props to receive data
export interface HealthcareMetricsProps {
  metrics?: HealthcareMetricsData
}

export interface ChartsSectionProps {
  trafficData?: TrafficDataPoint[]
  deviceStats?: DeviceStat[]
}

export interface ContentPerformanceProps {
  contentPerformance?: ContentPerformanceItem[]
}