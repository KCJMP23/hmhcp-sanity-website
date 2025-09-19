// Google Search Console Integration Tests
// Created: 2025-01-27
// Purpose: Integration tests for Google Search Console API

import { GoogleSearchConsoleIntegration } from '../GoogleSearchConsoleIntegration';

// Mock fetch for testing
global.fetch = jest.fn();

describe('GoogleSearchConsoleIntegration', () => {
  let integration: GoogleSearchConsoleIntegration;
  const mockApiKey = 'test-api-key';
  const mockSiteUrl = 'https://example.com';

  beforeEach(() => {
    integration = new GoogleSearchConsoleIntegration(mockApiKey, mockSiteUrl);
    (fetch as jest.Mock).mockClear();
  });

  describe('getSearchAnalytics', () => {
    it('should fetch search analytics data successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          rows: [
            {
              keys: ['2024-01-01', 'healthcare services', '/services', 'US', 'desktop', 'web'],
              clicks: 100,
              impressions: 1000,
              ctr: 0.1,
              position: 5.5
            },
            {
              keys: ['2024-01-01', 'medical treatment', '/treatment', 'US', 'mobile', 'web'],
              clicks: 50,
              impressions: 500,
              ctr: 0.1,
              position: 8.2
            }
          ]
        })
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await integration.getSearchAnalytics('2024-01-01', '2024-01-31');

      expect(result).toHaveLength(2);
      expect(result[0].query).toBe('healthcare services');
      expect(result[0].clicks).toBe(100);
      expect(result[0].impressions).toBe(1000);
      expect(result[0].ctr).toBe(0.1);
      expect(result[0].position).toBe(5.5);
      expect(result[0].device).toBe('desktop');
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(integration.getSearchAnalytics('2024-01-01', '2024-01-31'))
        .rejects.toThrow('GSC API error: 401 Unauthorized');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(integration.getSearchAnalytics('2024-01-01', '2024-01-31'))
        .rejects.toThrow('Failed to fetch search analytics: Network error');
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should calculate performance metrics correctly', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          rows: [
            {
              keys: ['healthcare services', '/services', 'US', 'desktop'],
              clicks: 100,
              impressions: 1000,
              ctr: 0.1,
              position: 5.5
            },
            {
              keys: ['medical treatment', '/treatment', 'US', 'mobile'],
              clicks: 50,
              impressions: 500,
              ctr: 0.1,
              position: 8.2
            }
          ]
        })
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await integration.getPerformanceMetrics('2024-01-01', '2024-01-31');

      expect(result.totalClicks).toBe(150);
      expect(result.totalImpressions).toBe(1500);
      expect(result.averageCtr).toBe(0.1);
      expect(result.averagePosition).toBe(6.85);
      expect(result.topQueries).toHaveLength(2);
      expect(result.topPages).toHaveLength(2);
      expect(result.countries).toHaveLength(1);
      expect(result.devices).toHaveLength(2);
    });
  });

  describe('getSitemapStatus', () => {
    it('should fetch sitemap status successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          sitemap: [
            {
              path: '/sitemap.xml',
              lastSubmitted: '2024-01-01T00:00:00Z',
              lastDownloaded: '2024-01-01T00:00:00Z',
              type: 'SITEMAP',
              status: 'success'
            }
          ]
        })
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await integration.getSitemapStatus();

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('/sitemap.xml');
      expect(result[0].status).toBe('success');
    });
  });

  describe('inspectUrl', () => {
    it('should inspect URL successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          inspectionResult: {
            inspectionResult: {
              indexedPage: {
                url: 'https://example.com/test',
                lastCrawlTime: '2024-01-01T00:00:00Z',
                lastCrawlStatus: 'SUCCESS',
                pageFetchState: 'SUCCESSFUL',
                indexingState: 'INDEXED',
                coverageState: 'LIVE',
                robotsTxtState: 'ALLOWED'
              },
              mobileUsabilityResult: {
                issues: []
              },
              structuredData: {
                detected: true,
                structuredData: [
                  {
                    type: 'MedicalBusiness',
                    status: 'VALID'
                  }
                ]
              }
            }
          }
        })
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await integration.inspectUrl('https://example.com/test');

      expect(result.url).toBe('https://example.com/test');
      expect(result.lastCrawlStatus).toBe('SUCCESS');
      expect(result.indexingState).toBe('INDEXED');
      expect(result.structuredData.detected).toBe(true);
    });
  });

  describe('performHealthCheck', () => {
    it('should perform health check successfully', async () => {
      const mockSitemapResponse = {
        ok: true,
        json: () => Promise.resolve({
          sitemap: [
            {
              path: '/sitemap.xml',
              status: 'success',
              errors: 0,
              warnings: 0
            }
          ]
        })
      };

      const mockAnalyticsResponse = {
        ok: true,
        json: () => Promise.resolve({
          rows: [
            {
              keys: ['/services'],
              clicks: 100,
              impressions: 1000,
              ctr: 0.1,
              position: 5.5
            }
          ]
        })
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce(mockSitemapResponse)
        .mockResolvedValueOnce(mockAnalyticsResponse);

      const result = await integration.performHealthCheck();

      expect(result.siteUrl).toBe(mockSiteUrl);
      expect(result.status).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.metrics).toBeDefined();
    });
  });

  describe('submitSitemap', () => {
    it('should submit sitemap successfully', async () => {
      const mockResponse = {
        ok: true
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await integration.submitSitemap('/sitemap.xml');

      expect(result).toBe(true);
    });

    it('should handle sitemap submission errors', async () => {
      const mockResponse = {
        ok: false
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await integration.submitSitemap('/sitemap.xml');

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(integration.getSearchAnalytics('2024-01-01', '2024-01-31'))
        .rejects.toThrow('Failed to fetch search analytics: Network error');
    });

    it('should handle invalid API responses', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({})
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await integration.getSearchAnalytics('2024-01-01', '2024-01-31');

      expect(result).toHaveLength(0);
    });
  });
});
