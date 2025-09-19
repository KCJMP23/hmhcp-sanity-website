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
  systemStatus: Array<{
    service: string
    status: 'operational' | 'degraded' | 'down'
    uptime: string
  }>
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Simulate database queries for real data
    const totalPages = 25
    const totalPosts = 156
    const totalUsers = 89
    const totalMedia = 342

    // Recent content (last 5 items)
    const recentPages = [
      { id: 1, title: 'Homepage', updatedAt: new Date().toISOString() },
      { id: 2, title: 'About Us', updatedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 3, title: 'Services', updatedAt: new Date(Date.now() - 172800000).toISOString() }
    ]

    const recentPosts = [
      { id: 1, title: 'Latest Healthcare Trends', publishedAt: new Date().toISOString() },
      { id: 2, title: 'Patient Care Best Practices', publishedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 3, title: 'Clinical Trial Updates', publishedAt: new Date(Date.now() - 172800000).toISOString() }
    ]

    const recentMedia = [
      { id: 1, name: 'patient-care-image.jpg', uploadedAt: new Date().toISOString() },
      { id: 2, name: 'clinical-trial-chart.png', uploadedAt: new Date(Date.now() - 86400000).toISOString() }
    ]

    // Healthcare-specific metrics
    const healthcareMetrics = {
      activeClinicalTrials: 12,
      activeTrialsChange: '+2 this month',
      activeTrialsTrend: 'up' as const,
      enrolledPatients: 2847,
      enrolledPatientsChange: '+156 this week',
      enrolledPatientsTrend: 'up' as const,
      dataQualityScore: 98.5,
      dataQualityChange: '+1.2% improvement',
      dataQualityTrend: 'up' as const,
      platformUptime: 99.9,
      platformUptimeChange: 'Stable',
      platformUptimeTrend: 'stable' as const
    }

    // System status monitoring
    const systemStatus = [
      {
        service: 'Database',
        status: 'operational' as const,
        uptime: '99.99%'
      },
      {
        service: 'API Gateway',
        status: 'operational' as const,
        uptime: '99.95%'
      },
      {
        service: 'File Storage',
        status: 'operational' as const,
        uptime: '99.98%'
      },
      {
        service: 'Authentication',
        status: 'operational' as const,
        uptime: '99.97%'
      },
      {
        service: 'Analytics',
        status: 'operational' as const,
        uptime: '99.92%'
      }
    ]

    return {
      totalPages,
      totalPosts,
      totalUsers,
      totalMedia,
      recentPages,
      recentPosts,
      recentMedia,
      healthcareMetrics,
      systemStatus
    }
  } catch (error) {
    console.error('Error generating dashboard stats:', error)
    throw new Error('Failed to generate dashboard statistics')
  }
}
