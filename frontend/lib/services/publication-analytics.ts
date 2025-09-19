// Publication Analytics Service
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

import { PublicationAnalytics, TrendDirection, Publication } from '@/types/publications';

export class PublicationAnalyticsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/admin/publications/analytics';
  }

  /**
   * Get analytics for a specific publication
   */
  async getPublicationAnalytics(publicationId: string): Promise<PublicationAnalytics[]> {
    try {
      const response = await fetch(`${this.baseUrl}?publicationId=${publicationId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data = await response.json();
      return data.analytics || [];

    } catch (error) {
      console.error('Error fetching publication analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics for multiple publications
   */
  async getBulkAnalytics(publicationIds: string[]): Promise<Record<string, PublicationAnalytics[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicationIds }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bulk analytics: ${response.statusText}`);
      }

      const data = await response.json();
      return data.analytics || {};

    } catch (error) {
      console.error('Error fetching bulk analytics:', error);
      throw error;
    }
  }

  /**
   * Get trend analysis for a publication
   */
  async getTrendAnalysis(publicationId: string, metric: string, timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<{
    trend: TrendDirection;
    change: number;
    data: Array<{ date: string; value: number }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/trend?publicationId=${publicationId}&metric=${metric}&timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trend analysis: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching trend analysis:', error);
      throw error;
    }
  }

  /**
   * Get benchmark comparisons
   */
  async getBenchmarkComparison(publicationId: string, specialty: string): Promise<{
    publication: {
      citations: number;
      impactFactor: number;
      hIndex: number;
    };
    specialty: {
      averageCitations: number;
      averageImpactFactor: number;
      averageHIndex: number;
    };
    percentile: {
      citations: number;
      impactFactor: number;
      hIndex: number;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/benchmark?publicationId=${publicationId}&specialty=${specialty}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch benchmark comparison: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching benchmark comparison:', error);
      throw error;
    }
  }

  /**
   * Get predictive analytics for publication impact
   */
  async getPredictiveAnalytics(publicationId: string): Promise<{
    predictedCitations: {
      nextMonth: number;
      nextQuarter: number;
      nextYear: number;
    };
    confidence: number;
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/predictive?publicationId=${publicationId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch predictive analytics: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching predictive analytics:', error);
      throw error;
    }
  }

  /**
   * Get research impact metrics for an organization
   */
  async getOrganizationMetrics(organizationId: string, timeframe: 'month' | 'quarter' | 'year' = 'year'): Promise<{
    totalPublications: number;
    totalCitations: number;
    averageImpactFactor: number;
    hIndex: number;
    topPublications: Publication[];
    trendingTopics: Array<{
      topic: string;
      publicationCount: number;
      citationCount: number;
    }>;
    growthRate: {
      publications: number;
      citations: number;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/organization?organizationId=${organizationId}&timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch organization metrics: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching organization metrics:', error);
      throw error;
    }
  }

  /**
   * Generate automated research impact report
   */
  async generateImpactReport(organizationId: string, timeframe: 'month' | 'quarter' | 'year' = 'year'): Promise<{
    reportId: string;
    generatedAt: string;
    summary: {
      totalPublications: number;
      totalCitations: number;
      averageImpactFactor: number;
      hIndex: number;
    };
    highlights: Array<{
      type: 'achievement' | 'milestone' | 'trend';
      title: string;
      description: string;
      value: number;
      change: number;
    }>;
    recommendations: Array<{
      category: 'publication' | 'collaboration' | 'funding' | 'strategy';
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
    }>;
    charts: Array<{
      type: 'line' | 'bar' | 'pie' | 'scatter';
      title: string;
      data: any;
    }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId, timeframe }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate impact report: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error generating impact report:', error);
      throw error;
    }
  }

  /**
   * Update publication metrics (called by external systems)
   */
  async updateMetrics(publicationId: string, metrics: Array<{
    metricName: string;
    metricValue: number;
    measurementDate: string;
    trendDirection?: TrendDirection;
    benchmarkValue?: number;
  }>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicationId, metrics }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update metrics: ${response.statusText}`);
      }

    } catch (error) {
      console.error('Error updating metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate publication impact score
   */
  calculateImpactScore(publication: Publication, analytics: PublicationAnalytics[]): number {
    const weights = {
      citations: 0.4,
      impactFactor: 0.3,
      recency: 0.2,
      authorCount: 0.1
    };

    const citations = analytics.find(a => a.metric_name === 'citations_count')?.metric_value || 0;
    const impactFactor = analytics.find(a => a.metric_name === 'impact_factor')?.metric_value || 0;
    
    // Calculate recency score (newer publications get higher scores)
    const publicationDate = new Date(publication.publication_date || publication.created_at);
    const now = new Date();
    const monthsSincePublication = (now.getTime() - publicationDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const recency = Math.max(0, 1 - (monthsSincePublication / 24)); // Decay over 2 years
    
    // Calculate author count score (more authors = higher score, up to a point)
    const authorCount = publication.authors?.length || 1;
    const authorScore = Math.min(authorCount / 10, 1); // Normalize to 0-1, max at 10 authors

    const score = 
      (citations * weights.citations) +
      (impactFactor * weights.impactFactor) +
      (recency * weights.recency) +
      (authorScore * weights.authorCount);

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get trending metrics for a specialty
   */
  async getTrendingMetrics(specialty: string, timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    topPublications: Array<{
      publication: Publication;
      metrics: PublicationAnalytics[];
      impactScore: number;
    }>;
    emergingTopics: Array<{
      topic: string;
      publicationCount: number;
      averageCitations: number;
      growthRate: number;
    }>;
    keyInsights: Array<{
      insight: string;
      impact: 'high' | 'medium' | 'low';
      data: any;
    }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/trending?specialty=${specialty}&timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trending metrics: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching trending metrics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const publicationAnalyticsService = new PublicationAnalyticsService();
