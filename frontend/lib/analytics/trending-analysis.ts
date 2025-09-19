// Healthcare content trending analysis system

import { TrendingAnalysis, ContentAnalytics } from '@/types/blog-analytics'
import { supabaseAdmin } from '@/lib/dal/supabase'

interface TrendingMetrics {
  currentViews: number
  previousViews: number
  currentEngagement: number
  previousEngagement: number
  viewsGrowthRate: number
  engagementVelocity: number
  specializations: Record<string, number>
  geographicData: Record<string, number>
}

interface TrendingConfig {
  analysisWindow: number // hours
  comparisonWindow: number // hours
  minViews: number
  trendingThreshold: number
  viralThreshold: number
}

class HealthcareTrendingAnalyzer {
  private config: TrendingConfig

  constructor(config: Partial<TrendingConfig> = {}) {
    this.config = {
      analysisWindow: 24, // Last 24 hours
      comparisonWindow: 48, // Compare with previous 48 hours
      minViews: 50, // Minimum views to be considered for trending
      trendingThreshold: 1.5, // 50% growth rate minimum
      viralThreshold: 5.0, // 400% growth rate for viral content
      ...config,
    }
  }

  // Main trending analysis function
  async analyzeTrendingContent(): Promise<TrendingAnalysis[]> {
    try {
      const [currentMetrics, previousMetrics] = await Promise.all([
        this.getContentMetrics(this.config.analysisWindow),
        this.getContentMetrics(this.config.comparisonWindow, this.config.analysisWindow),
      ])

      const trendingContent: TrendingAnalysis[] = []

      for (const [contentId, current] of currentMetrics.entries()) {
        const previous = previousMetrics.get(contentId)
        
        if (!previous || current.currentViews < this.config.minViews) continue

        const analysis = await this.calculateTrendingScore(contentId, current, previous)
        
        if (analysis.metrics.growth_rate >= this.config.trendingThreshold) {
          trendingContent.push(analysis)
        }
      }

      // Sort by trending score
      return trendingContent.sort((a, b) => b.metrics.current_score - a.metrics.current_score)

    } catch (error) {
      console.error('Error analyzing trending content:', error)
      return []
    }
  }

  // Get content metrics for a time window
  private async getContentMetrics(
    windowHours: number, 
    offsetHours: number = 0
  ): Promise<Map<string, TrendingMetrics>> {
    const endTime = new Date(Date.now() - (offsetHours * 60 * 60 * 1000))
    const startTime = new Date(endTime.getTime() - (windowHours * 60 * 60 * 1000))

    const { data: analytics } = await supabaseAdmin
      .from('content_analytics')
      .select('*')
      .gte('updated_at', startTime.toISOString())
      .lte('updated_at', endTime.toISOString())

    const { data: events } = await supabaseAdmin
      .from('content_analytics_events')
      .select('*')
      .gte('event_timestamp', startTime.toISOString())
      .lte('event_timestamp', endTime.toISOString())
      .in('event_type', ['page_view', 'scroll', 'terminology_click'])

    const metrics = new Map<string, TrendingMetrics>()

    // Process analytics data
    analytics?.forEach(item => {
      const contentId = item.content_id
      
      if (!metrics.has(contentId)) {
        metrics.set(contentId, {
          currentViews: 0,
          previousViews: 0,
          currentEngagement: 0,
          previousEngagement: 0,
          viewsGrowthRate: 0,
          engagementVelocity: 0,
          specializations: item.specialization_interests || {},
          geographicData: this.processGeographicData(item.top_countries || []),
        })
      }

      const metric = metrics.get(contentId)!
      metric.currentViews += item.page_views || 0
      metric.currentEngagement += this.calculateEngagementScore(item)
    })

    // Process events data for more granular metrics
    events?.forEach(event => {
      const contentId = event.content_id
      const metric = metrics.get(contentId)

      if (metric) {
        // Add event-based engagement scoring
        if (event.event_type === 'terminology_click') {
          metric.currentEngagement += 2 // Medical terminology clicks are valuable
        } else if (event.event_type === 'scroll' && event.scroll_depth && event.scroll_depth > 75) {
          metric.currentEngagement += 1 // Deep scroll engagement
        }
      }
    })

    return metrics
  }

  // Calculate engagement score from analytics data
  private calculateEngagementScore(analytics: any): number {
    let score = 0

    // Time on page (normalized to 0-10 scale)
    score += Math.min((analytics.avg_time_on_page || 0) / 60, 10) // Max 10 points for 10+ minutes

    // Scroll depth (0-10 scale)
    score += (analytics.scroll_depth_avg || 0) / 10 // Max 10 points for 100% scroll

    // Healthcare professional engagement bonus
    const professionalRatio = analytics.healthcare_professional_views / (analytics.page_views || 1)
    score += professionalRatio * 5 // Up to 5 bonus points for professional engagement

    // Medical terminology engagement
    const terminologyCount = Object.keys(analytics.medical_terminology_engagement || {}).length
    score += Math.min(terminologyCount * 0.5, 5) // Up to 5 points for terminology engagement

    // Low bounce rate bonus
    const bounceRate = analytics.bounce_rate || 100
    score += Math.max((50 - bounceRate) / 10, 0) // Bonus for low bounce rate

    return score
  }

  // Process geographic data for trending analysis
  private processGeographicData(countries: any[]): Record<string, number> {
    const geoData: Record<string, number> = {}
    
    countries.forEach(country => {
      if (country.country_code && country.views) {
        geoData[country.country_code] = country.views
      }
    })

    return geoData
  }

  // Calculate trending score and classification
  private async calculateTrendingScore(
    contentId: string, 
    current: TrendingMetrics, 
    previous: TrendingMetrics
  ): Promise<TrendingAnalysis> {
    // Get content details
    const { data: contentData } = await supabaseAdmin
      .from('content_analytics')
      .select(`
        content_slug,
        content_title,
        managed_content!inner(title, slug, created_at)
      `)
      .eq('content_id', contentId)
      .single()

    // Calculate growth metrics
    const viewsGrowthRate = previous.currentViews > 0 
      ? (current.currentViews - previous.currentViews) / previous.currentViews 
      : 0

    const engagementVelocity = previous.currentEngagement > 0
      ? (current.currentEngagement - previous.currentEngagement) / previous.currentEngagement
      : 0

    // Calculate trending score (weighted combination of metrics)
    const trendingScore = (
      (viewsGrowthRate * 40) + 
      (engagementVelocity * 30) + 
      (current.currentEngagement * 0.1) + 
      (current.currentViews * 0.001)
    )

    // Classify trend type
    let trendType: 'viral' | 'steady_growth' | 'declining' | 'seasonal'
    
    if (viewsGrowthRate >= this.config.viralThreshold) {
      trendType = 'viral'
    } else if (viewsGrowthRate >= this.config.trendingThreshold) {
      trendType = 'steady_growth'
    } else if (viewsGrowthRate < -0.2) {
      trendType = 'declining'
    } else {
      trendType = 'seasonal'
    }

    // Analyze demographics
    const totalSpecializationViews = Object.values(current.specializations).reduce((sum, views) => sum + views, 0)
    const topSpecializations = Object.entries(current.specializations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([specialty]) => specialty)

    const topCountries = Object.entries(current.geographicData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([country]) => country)

    // Generate predictions
    const predictions = this.generatePredictions(current, viewsGrowthRate, engagementVelocity)

    return {
      content_id: contentId,
      slug: contentData?.content_slug || '',
      title: contentData?.content_title || contentData?.managed_content?.title || 'Unknown',
      trend_type: trendType,
      metrics: {
        current_score: trendingScore,
        peak_score: Math.max(trendingScore, previous.currentEngagement),
        growth_rate: viewsGrowthRate,
        engagement_velocity: engagementVelocity,
      },
      demographics: {
        primary_audience: totalSpecializationViews > current.currentViews * 0.6 ? 'healthcare_professional' : 'patient',
        top_specializations: topSpecializations,
        geographic_concentration: topCountries,
      },
      predictions,
      analysis_timestamp: new Date().toISOString(),
    }
  }

  // Generate predictions based on trending patterns
  private generatePredictions(
    current: TrendingMetrics,
    growthRate: number,
    engagementVelocity: number
  ) {
    // Simple prediction model (can be enhanced with ML)
    const baseViews = current.currentViews
    const projectedGrowth = Math.max(growthRate * 0.7, 0) // Assuming deceleration
    
    const next24hViews = Math.round(baseViews * (1 + projectedGrowth))
    
    // Confidence based on data consistency and growth stability
    let confidence = 0.5 // Base confidence
    
    if (growthRate > 0 && engagementVelocity > 0) {
      confidence += 0.3 // Both metrics trending up
    }
    
    if (current.currentViews > 100) {
      confidence += 0.1 // More data points
    }
    
    if (Math.abs(growthRate - engagementVelocity) < 0.5) {
      confidence += 0.1 // Metrics align
    }

    // Trend duration estimate
    let durationEstimate = '1-2 days'
    if (growthRate > 2.0) {
      durationEstimate = '3-5 days' // Viral content lasts longer
    } else if (growthRate > 1.0) {
      durationEstimate = '2-3 days'
    } else if (growthRate < 0) {
      durationEstimate = '< 1 day' // Declining trend
    }

    return {
      next_24h_views: next24hViews,
      confidence_interval: Math.min(confidence, 0.95),
      trend_duration_estimate: durationEstimate,
    }
  }

  // Get medical specialization trending data
  async getSpecializationTrends(): Promise<Array<{
    specialization: string
    engagement_score: number
    growth_rate: number
    content_count: number
  }>> {
    try {
      const { data: analytics } = await supabaseAdmin
        .from('content_analytics')
        .select('specialization_interests, updated_at')
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const specializationData: Record<string, {
        current: number
        previous: number
        contentCount: number
      }> = {}

      analytics?.forEach(item => {
        const interests = item.specialization_interests || {}
        const isRecent = new Date(item.updated_at) > new Date(Date.now() - 12 * 60 * 60 * 1000)

        Object.entries(interests).forEach(([specialty, score]: [string, any]) => {
          if (!specializationData[specialty]) {
            specializationData[specialty] = { current: 0, previous: 0, contentCount: 0 }
          }

          specializationData[specialty].contentCount++
          
          if (isRecent) {
            specializationData[specialty].current += score
          } else {
            specializationData[specialty].previous += score
          }
        })
      })

      return Object.entries(specializationData)
        .map(([specialization, data]) => ({
          specialization,
          engagement_score: data.current,
          growth_rate: data.previous > 0 ? (data.current - data.previous) / data.previous : 0,
          content_count: data.contentCount,
        }))
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(0, 10)

    } catch (error) {
      console.error('Error getting specialization trends:', error)
      return []
    }
  }

  // Update trending scores in database
  async updateTrendingScores(): Promise<void> {
    try {
      const trendingContent = await this.analyzeTrendingContent()
      
      for (const trend of trendingContent) {
        await supabaseAdmin
          .from('content_analytics')
          .update({
            trending_score: trend.metrics.current_score,
            trending_peak_at: trend.metrics.peak_score > trend.metrics.current_score 
              ? new Date().toISOString() 
              : undefined,
          })
          .eq('content_id', trend.content_id)
      }

      console.log(`Updated trending scores for ${trendingContent.length} content items`)

    } catch (error) {
      console.error('Error updating trending scores:', error)
    }
  }
}

// Singleton instance
let trendingAnalyzer: HealthcareTrendingAnalyzer | null = null

export function getTrendingAnalyzer(config?: Partial<TrendingConfig>): HealthcareTrendingAnalyzer {
  if (!trendingAnalyzer) {
    trendingAnalyzer = new HealthcareTrendingAnalyzer(config)
  }
  return trendingAnalyzer
}

// Convenience functions
export async function analyzeTrendingHealthcareContent(): Promise<TrendingAnalysis[]> {
  const analyzer = getTrendingAnalyzer()
  return analyzer.analyzeTrendingContent()
}

export async function getHealthcareSpecializationTrends() {
  const analyzer = getTrendingAnalyzer()
  return analyzer.getSpecializationTrends()
}

export async function updateHealthcareTrendingScores(): Promise<void> {
  const analyzer = getTrendingAnalyzer()
  return analyzer.updateTrendingScores()
}

// Export the class for custom implementations
export { HealthcareTrendingAnalyzer, type TrendingConfig }