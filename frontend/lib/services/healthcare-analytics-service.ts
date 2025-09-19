import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('HealthcareAnalyticsService');

export interface HealthcareAnalyticsData {
  postId: string;
  title: string;
  publishedAt: string;
  medicalCategory: string;
  medicalTopics: string[];
  targetAudience: string[];
  complianceScore: number;
  medicalAccuracyScore: number;
  accessibilityScore: number;
  engagementMetrics: {
    views: number;
    uniqueViews: number;
    timeOnPage: number;
    bounceRate: number;
    engagementScore: number;
  };
  medicalEngagement: {
    medicalProfessionalViews: number;
    patientViews: number;
    caregiverViews: number;
    studentViews: number;
  };
  contentPerformance: {
    readabilityScore: number;
    medicalTerminologyUsage: number;
    citationCount: number;
    referenceQuality: number;
  };
  healthcareCompliance: {
    hipaaCompliant: boolean;
    medicalDisclaimerPresent: boolean;
    sourceAttribution: boolean;
    lastReviewed: string;
  };
  demographicData: {
    ageGroups: { [key: string]: number };
    genders: { [key: string]: number };
    locations: { [key: string]: number };
    professions: { [key: string]: number };
  };
  medicalTopicEngagement: {
    topic: string;
    engagement: number;
    searchVolume: number;
    medicalRelevance: number;
    patientInterest: number;
  }[];
  trends: {
    date: string;
    views: number;
    engagement: number;
    medicalAccuracy: number;
  }[];
}

export class HealthcareAnalyticsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  async getAnalyticsData(postId?: string, timeRange: string = '30d'): Promise<HealthcareAnalyticsData[]> {
    try {
      logger.info('Fetching healthcare analytics data', { postId, timeRange });

      const params = new URLSearchParams();
      if (postId) params.append('postId', postId);
      params.append('timeRange', timeRange);
      params.append('healthcare', 'true');

      const response = await fetch(`${this.baseUrl}/admin/content/blog/analytics?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch analytics data');
      }

      logger.info('Healthcare analytics data fetched successfully', { 
        count: data.analytics.length 
      });

      return data.analytics;
    } catch (error) {
      logger.error('Failed to fetch healthcare analytics data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async trackMedicalEngagement(postId: string, engagementData: {
    userId?: string;
    userType: 'medical_professional' | 'patient' | 'caregiver' | 'student' | 'general';
    timeOnPage: number;
    sectionsRead: string[];
    medicalTermsClicked: string[];
    citationsViewed: string[];
    engagementScore: number;
  }): Promise<void> {
    try {
      logger.info('Tracking medical engagement', { postId, userType: engagementData.userType });

      const response = await fetch(`${this.baseUrl}/admin/content/blog/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'track_medical_engagement',
          postId,
          data: engagementData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to track medical engagement');
      }

      logger.info('Medical engagement tracked successfully', { postId });
    } catch (error) {
      logger.error('Failed to track medical engagement', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async trackMedicalCompliance(postId: string, complianceData: {
    hipaaCompliant: boolean;
    medicalDisclaimerPresent: boolean;
    sourceAttribution: boolean;
    lastReviewed: string;
    reviewerId: string;
    complianceScore: number;
  }): Promise<void> {
    try {
      logger.info('Tracking medical compliance', { postId, complianceScore: complianceData.complianceScore });

      const response = await fetch(`${this.baseUrl}/admin/content/blog/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'track_medical_compliance',
          postId,
          data: complianceData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to track medical compliance');
      }

      logger.info('Medical compliance tracked successfully', { postId });
    } catch (error) {
      logger.error('Failed to track medical compliance', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getMedicalTopicAnalytics(topic: string, timeRange: string = '30d'): Promise<{
    topic: string;
    totalEngagement: number;
    averageEngagement: number;
    searchVolume: number;
    medicalRelevance: number;
    patientInterest: number;
    trending: boolean;
    relatedTopics: string[];
  }> {
    try {
      logger.info('Fetching medical topic analytics', { topic, timeRange });

      const response = await fetch(`${this.baseUrl}/admin/content/blog/analytics/medical-topics?topic=${encodeURIComponent(topic)}&timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch medical topic analytics');
      }

      logger.info('Medical topic analytics fetched successfully', { topic });

      return data.analytics;
    } catch (error) {
      logger.error('Failed to fetch medical topic analytics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getComplianceReport(postId: string): Promise<{
    postId: string;
    title: string;
    complianceScore: number;
    hipaaCompliant: boolean;
    medicalDisclaimerPresent: boolean;
    sourceAttribution: boolean;
    lastReviewed: string;
    reviewerId: string;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      logger.info('Generating compliance report', { postId });

      const response = await fetch(`${this.baseUrl}/admin/content/blog/analytics/compliance-report?postId=${postId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate compliance report');
      }

      logger.info('Compliance report generated successfully', { postId });

      return data.report;
    } catch (error) {
      logger.error('Failed to generate compliance report', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getDemographicInsights(postId?: string, timeRange: string = '30d'): Promise<{
    ageGroups: { [key: string]: { count: number; percentage: number; engagement: number } };
    genders: { [key: string]: { count: number; percentage: number; engagement: number } };
    locations: { [key: string]: { count: number; percentage: number; engagement: number } };
    professions: { [key: string]: { count: number; percentage: number; engagement: number } };
    insights: string[];
  }> {
    try {
      logger.info('Fetching demographic insights', { postId, timeRange });

      const params = new URLSearchParams();
      if (postId) params.append('postId', postId);
      params.append('timeRange', timeRange);
      params.append('type', 'demographics');

      const response = await fetch(`${this.baseUrl}/admin/content/blog/analytics/demographics?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch demographic insights');
      }

      logger.info('Demographic insights fetched successfully', { postId });

      return data.insights;
    } catch (error) {
      logger.error('Failed to fetch demographic insights', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async exportAnalyticsData(postId: string, format: 'json' | 'csv' | 'xlsx' = 'json'): Promise<Blob> {
    try {
      logger.info('Exporting analytics data', { postId, format });

      const response = await fetch(`${this.baseUrl}/admin/content/blog/analytics/export?postId=${postId}&format=${format}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      
      logger.info('Analytics data exported successfully', { postId, format, size: blob.size });

      return blob;
    } catch (error) {
      logger.error('Failed to export analytics data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

export const healthcareAnalyticsService = new HealthcareAnalyticsService();
