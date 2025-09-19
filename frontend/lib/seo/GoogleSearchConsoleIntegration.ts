// Google Search Console Integration
// Created: 2025-01-27
// Purpose: Google Search Console API integration for healthcare SEO

export interface GSCSearchAnalytics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  date: string;
  query: string;
  page: string;
  country: string;
  device: string;
  searchType: string;
}

export interface GSCPerformanceMetrics {
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  countries: Array<{
    country: string;
    clicks: number;
    impressions: number;
  }>;
  devices: Array<{
    device: string;
    clicks: number;
    impressions: number;
  }>;
}

export interface GSCSitemapStatus {
  path: string;
  lastSubmitted: string;
  lastDownloaded: string;
  type: string;
  status: 'success' | 'warnings' | 'errors';
  warnings?: number;
  errors?: number;
}

export interface GSCUrlInspection {
  url: string;
  lastCrawlTime: string;
  lastCrawlStatus: string;
  pageFetchState: string;
  indexingState: string;
  coverageState: string;
  robotsTxtState: string;
  mobileUsabilityResult: {
    issues: Array<{
      issueType: string;
      severity: string;
      message: string;
    }>;
  };
  structuredData: {
    detected: boolean;
    structuredData: Array<{
      type: string;
      status: string;
    }>;
  };
}

export interface GSCHealthCheck {
  siteUrl: string;
  lastChecked: Date;
  status: 'healthy' | 'warning' | 'critical';
  issues: Array<{
    type: 'coverage' | 'mobile' | 'security' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    affectedUrls: number;
  }>;
  metrics: {
    totalUrls: number;
    indexedUrls: number;
    mobileUsabilityIssues: number;
    securityIssues: number;
    performanceIssues: number;
  };
}

export class GoogleSearchConsoleIntegration {
  private apiKey: string;
  private baseUrl: string = 'https://www.googleapis.com/webmasters/v3/sites';
  private siteUrl: string;

  constructor(apiKey: string, siteUrl: string) {
    this.apiKey = apiKey;
    this.siteUrl = siteUrl;
  }

  async getSearchAnalytics(
    startDate: string,
    endDate: string,
    dimensions: string[] = ['query', 'page'],
    rowLimit: number = 1000
  ): Promise<GSCSearchAnalytics[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${encodeURIComponent(this.siteUrl)}/searchAnalytics/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            startDate,
            endDate,
            dimensions,
            rowLimit,
            startRow: 0
          })
        }
      );

      if (!response.ok) {
        throw new Error(`GSC API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.formatSearchAnalyticsData(data.rows || []);

    } catch (error) {
      throw new Error(`Failed to fetch search analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPerformanceMetrics(
    startDate: string,
    endDate: string
  ): Promise<GSCPerformanceMetrics> {
    try {
      // Get search analytics data
      const searchData = await this.getSearchAnalytics(startDate, endDate, ['query', 'page', 'country', 'device']);
      
      // Calculate performance metrics
      const totalClicks = searchData.reduce((sum, row) => sum + row.clicks, 0);
      const totalImpressions = searchData.reduce((sum, row) => sum + row.impressions, 0);
      const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const averagePosition = searchData.reduce((sum, row) => sum + row.position, 0) / searchData.length;

      // Get top queries
      const queryMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();
      searchData.forEach(row => {
        const existing = queryMap.get(row.query) || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
        queryMap.set(row.query, {
          clicks: existing.clicks + row.clicks,
          impressions: existing.impressions + row.impressions,
          ctr: existing.ctr + row.ctr,
          position: existing.position + row.position
        });
      });

      const topQueries = Array.from(queryMap.entries())
        .map(([query, data]) => ({
          query,
          clicks: data.clicks,
          impressions: data.impressions,
          ctr: data.ctr,
          position: data.position
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      // Get top pages
      const pageMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();
      searchData.forEach(row => {
        const existing = pageMap.get(row.page) || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
        pageMap.set(row.page, {
          clicks: existing.clicks + row.clicks,
          impressions: existing.impressions + row.impressions,
          ctr: existing.ctr + row.ctr,
          position: existing.position + row.position
        });
      });

      const topPages = Array.from(pageMap.entries())
        .map(([page, data]) => ({
          page,
          clicks: data.clicks,
          impressions: data.impressions,
          ctr: data.ctr,
          position: data.position
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      // Get country data
      const countryMap = new Map<string, { clicks: number; impressions: number }>();
      searchData.forEach(row => {
        const existing = countryMap.get(row.country) || { clicks: 0, impressions: 0 };
        countryMap.set(row.country, {
          clicks: existing.clicks + row.clicks,
          impressions: existing.impressions + row.impressions
        });
      });

      const countries = Array.from(countryMap.entries())
        .map(([country, data]) => ({ country, ...data }))
        .sort((a, b) => b.clicks - a.clicks);

      // Get device data
      const deviceMap = new Map<string, { clicks: number; impressions: number }>();
      searchData.forEach(row => {
        const existing = deviceMap.get(row.device) || { clicks: 0, impressions: 0 };
        deviceMap.set(row.device, {
          clicks: existing.clicks + row.clicks,
          impressions: existing.impressions + row.impressions
        });
      });

      const devices = Array.from(deviceMap.entries())
        .map(([device, data]) => ({ device, ...data }))
        .sort((a, b) => b.clicks - a.clicks);

      return {
        totalClicks,
        totalImpressions,
        averageCtr,
        averagePosition,
        topQueries,
        topPages,
        countries,
        devices
      };

    } catch (error) {
      throw new Error(`Failed to get performance metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSitemapStatus(): Promise<GSCSitemapStatus[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${encodeURIComponent(this.siteUrl)}/sitemaps`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GSC API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.sitemap || [];

    } catch (error) {
      throw new Error(`Failed to fetch sitemap status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async inspectUrl(url: string): Promise<GSCUrlInspection> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${encodeURIComponent(this.siteUrl)}/urlInspection/index:inspect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inspectionUrl: url
          })
        }
      );

      if (!response.ok) {
        throw new Error(`GSC API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.formatUrlInspectionData(data);

    } catch (error) {
      throw new Error(`Failed to inspect URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async performHealthCheck(): Promise<GSCHealthCheck> {
    try {
      // Get sitemap status
      const sitemapStatus = await this.getSitemapStatus();
      
      // Get recent search analytics for health indicators
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const searchData = await this.getSearchAnalytics(startDate, endDate, ['page']);

      // Analyze health
      const issues = this.analyzeHealthIssues(sitemapStatus, searchData);
      const metrics = this.calculateHealthMetrics(sitemapStatus, searchData);
      
      const status = this.determineHealthStatus(issues);

      return {
        siteUrl: this.siteUrl,
        lastChecked: new Date(),
        status,
        issues,
        metrics
      };

    } catch (error) {
      throw new Error(`Failed to perform health check: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async submitSitemap(sitemapUrl: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${encodeURIComponent(this.siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: sitemapUrl
          })
        }
      );

      return response.ok;

    } catch (error) {
      console.error('Failed to submit sitemap:', error);
      return false;
    }
  }

  // Private helper methods
  private formatSearchAnalyticsData(rows: any[]): GSCSearchAnalytics[] {
    return rows.map(row => ({
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
      date: row.keys[0] || '',
      query: row.keys[1] || '',
      page: row.keys[2] || '',
      country: row.keys[3] || '',
      device: row.keys[4] || '',
      searchType: row.keys[5] || 'web'
    }));
  }

  private formatUrlInspectionData(data: any): GSCUrlInspection {
    return {
      url: data.inspectionResult?.inspectionResult?.indexedPage?.url || '',
      lastCrawlTime: data.inspectionResult?.inspectionResult?.indexedPage?.lastCrawlTime || '',
      lastCrawlStatus: data.inspectionResult?.inspectionResult?.indexedPage?.lastCrawlStatus || '',
      pageFetchState: data.inspectionResult?.inspectionResult?.indexedPage?.pageFetchState || '',
      indexingState: data.inspectionResult?.inspectionResult?.indexedPage?.indexingState || '',
      coverageState: data.inspectionResult?.inspectionResult?.indexedPage?.coverageState || '',
      robotsTxtState: data.inspectionResult?.inspectionResult?.indexedPage?.robotsTxtState || '',
      mobileUsabilityResult: {
        issues: data.inspectionResult?.inspectionResult?.mobileUsabilityResult?.issues || []
      },
      structuredData: {
        detected: data.inspectionResult?.inspectionResult?.structuredData?.detected || false,
        structuredData: data.inspectionResult?.inspectionResult?.structuredData?.structuredData || []
      }
    };
  }

  private analyzeHealthIssues(sitemapStatus: GSCSitemapStatus[], searchData: GSCSearchAnalytics[]): Array<{
    type: 'coverage' | 'mobile' | 'security' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    affectedUrls: number;
  }> {
    const issues: Array<{
      type: 'coverage' | 'mobile' | 'security' | 'performance';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      affectedUrls: number;
    }> = [];

    // Check sitemap issues
    const sitemapErrors = sitemapStatus.filter(s => s.status === 'errors');
    if (sitemapErrors.length > 0) {
      issues.push({
        type: 'coverage',
        severity: 'high',
        message: `${sitemapErrors.length} sitemaps have errors`,
        affectedUrls: sitemapErrors.reduce((sum, s) => sum + (s.errors || 0), 0)
      });
    }

    // Check for low CTR issues
    const lowCtrPages = searchData.filter(row => row.ctr < 1 && row.impressions > 100);
    if (lowCtrPages.length > 0) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: `${lowCtrPages.length} pages have low CTR`,
        affectedUrls: lowCtrPages.length
      });
    }

    // Check for high position issues
    const highPositionPages = searchData.filter(row => row.position > 20 && row.impressions > 50);
    if (highPositionPages.length > 0) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: `${highPositionPages.length} pages have low search rankings`,
        affectedUrls: highPositionPages.length
      });
    }

    return issues;
  }

  private calculateHealthMetrics(sitemapStatus: GSCSitemapStatus[], searchData: GSCSearchAnalytics[]): {
    totalUrls: number;
    indexedUrls: number;
    mobileUsabilityIssues: number;
    securityIssues: number;
    performanceIssues: number;
  } {
    const totalUrls = searchData.length;
    const indexedUrls = searchData.filter(row => row.clicks > 0).length;
    const mobileUsabilityIssues = 0; // Would need mobile usability API
    const securityIssues = 0; // Would need security issues API
    const performanceIssues = searchData.filter(row => row.ctr < 1 && row.impressions > 100).length;

    return {
      totalUrls,
      indexedUrls,
      mobileUsabilityIssues,
      securityIssues,
      performanceIssues
    };
  }

  private determineHealthStatus(issues: Array<{
    type: 'coverage' | 'mobile' | 'security' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    affectedUrls: number;
  }>): 'healthy' | 'warning' | 'critical' {
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    const highIssues = issues.filter(issue => issue.severity === 'high');

    if (criticalIssues.length > 0) {
      return 'critical';
    }

    if (highIssues.length > 0) {
      return 'warning';
    }

    return 'healthy';
  }
}
