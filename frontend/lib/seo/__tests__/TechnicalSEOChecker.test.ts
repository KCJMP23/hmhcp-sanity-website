// Technical SEO Checker Tests
// Created: 2025-01-27
// Purpose: Unit tests for technical SEO checking functionality

import { TechnicalSEOChecker } from '../TechnicalSEOChecker';

// Mock fetch for testing
global.fetch = jest.fn();

describe('TechnicalSEOChecker', () => {
  let checker: TechnicalSEOChecker;

  beforeEach(() => {
    checker = new TechnicalSEOChecker();
    (fetch as jest.Mock).mockClear();
  });

  describe('checkPageSpeed', () => {
    it('should check page speed and return performance metrics', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          lighthouseResult: {
            categories: {
              performance: { score: 0.85 },
              accessibility: { score: 0.92 },
              'best-practices': { score: 0.88 },
              seo: { score: 0.90 }
            },
            audits: {
              'first-contentful-paint': { score: 0.9, displayValue: '1.2s' },
              'largest-contentful-paint': { score: 0.8, displayValue: '2.1s' },
              'cumulative-layout-shift': { score: 0.95, displayValue: '0.05' }
            }
          }
        })
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await checker.checkPageSpeed('https://example.com');

      expect(result.performanceScore).toBe(0.85);
      expect(result.accessibilityScore).toBe(0.92);
      expect(result.seoScore).toBe(0.90);
      expect(result.coreWebVitals.lcp).toBe(2.1);
      expect(result.coreWebVitals.cls).toBe(0.05);
    });

    it('should handle page speed check errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Page speed check failed'));

      await expect(checker.checkPageSpeed('https://example.com')).rejects.toThrow('Page speed check failed');
    });
  });

  describe('checkMobileUsability', () => {
    it('should check mobile usability and return issues', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          mobileFriendlyTest: {
            mobileFriendly: true,
            issues: []
          }
        })
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await checker.checkMobileUsability('https://example.com');

      expect(result.isMobileFriendly).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect mobile usability issues', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          mobileFriendlyTest: {
            mobileFriendly: false,
            issues: [
              'Text too small to read',
              'Clickable elements too close together'
            ]
          }
        })
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await checker.checkMobileUsability('https://example.com');

      expect(result.isMobileFriendly).toBe(false);
      expect(result.issues).toHaveLength(2);
      expect(result.issues).toContain('Text too small to read');
    });
  });

  describe('checkStructuredData', () => {
    it('should validate structured data markup', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "MedicalBusiness",
                  "name": "Healthcare Clinic",
                  "description": "Medical services provider"
                }
              </script>
            </head>
          </html>
        `)
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await checker.checkStructuredData('https://example.com');

      expect(result.hasStructuredData).toBe(true);
      expect(result.validStructuredData).toBe(true);
      expect(result.schemas).toContain('MedicalBusiness');
    });

    it('should detect invalid structured data', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "MedicalBusiness",
                  "name": "Healthcare Clinic",
                  "cures": "all diseases"
                }
              </script>
            </head>
          </html>
        `)
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await checker.checkStructuredData('https://example.com');

      expect(result.hasStructuredData).toBe(true);
      expect(result.validStructuredData).toBe(false);
      expect(result.errors).toContain('Contains unsubstantiated medical claims');
    });
  });

  describe('checkCrawlability', () => {
    it('should check crawlability and return results', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <title>Healthcare Services</title>
              <meta name="description" content="Medical services">
              <meta name="robots" content="index, follow">
            </head>
            <body>
              <h1>Healthcare Services</h1>
              <p>We provide comprehensive medical care.</p>
            </body>
          </html>
        `)
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await checker.checkCrawlability('https://example.com');

      expect(result.isCrawlable).toBe(true);
      expect(result.hasTitle).toBe(true);
      expect(result.hasMetaDescription).toBe(true);
      expect(result.robotsDirective).toBe('index, follow');
      expect(result.issues).toHaveLength(0);
    });

    it('should detect crawlability issues', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <meta name="robots" content="noindex, nofollow">
            </head>
            <body>
              <h1>Healthcare Services</h1>
            </body>
          </html>
        `)
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await checker.checkCrawlability('https://example.com');

      expect(result.isCrawlable).toBe(false);
      expect(result.hasTitle).toBe(false);
      expect(result.hasMetaDescription).toBe(false);
      expect(result.robotsDirective).toBe('noindex, nofollow');
      expect(result.issues).toContain('Page is not crawlable');
    });
  });

  describe('checkHealthcareCompliance', () => {
    it('should check healthcare compliance requirements', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <title>Healthcare Services</title>
              <meta name="description" content="Medical services">
            </head>
            <body>
              <h1>Healthcare Services</h1>
              <p>We provide comprehensive medical care.</p>
              <div class="disclaimer">
                <p>This information is for educational purposes only and should not replace professional medical advice.</p>
              </div>
            </body>
          </html>
        `)
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await checker.checkHealthcareCompliance('https://example.com');

      expect(result.hasMedicalDisclaimer).toBe(true);
      expect(result.hasPrivacyPolicy).toBe(false);
      expect(result.hasTermsOfService).toBe(false);
      expect(result.complianceScore).toBeGreaterThan(0);
    });

    it('should detect healthcare compliance issues', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <title>Healthcare Services</title>
            </head>
            <body>
              <h1>Healthcare Services</h1>
              <p>We cure all diseases with our miracle treatment.</p>
            </body>
          </html>
        `)
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await checker.checkHealthcareCompliance('https://example.com');

      expect(result.hasMedicalDisclaimer).toBe(false);
      expect(result.issues).toContain('Missing medical disclaimer');
      expect(result.issues).toContain('Contains unsubstantiated medical claims');
    });
  });

  describe('performFullTechnicalAudit', () => {
    it('should perform comprehensive technical SEO audit', async () => {
      const mockPageSpeedResponse = {
        ok: true,
        json: () => Promise.resolve({
          lighthouseResult: {
            categories: {
              performance: { score: 0.85 },
              accessibility: { score: 0.92 },
              'best-practices': { score: 0.88 },
              seo: { score: 0.90 }
            },
            audits: {
              'first-contentful-paint': { score: 0.9, displayValue: '1.2s' },
              'largest-contentful-paint': { score: 0.8, displayValue: '2.1s' },
              'cumulative-layout-shift': { score: 0.95, displayValue: '0.05' }
            }
          }
        })
      };

      const mockMobileResponse = {
        ok: true,
        json: () => Promise.resolve({
          mobileFriendlyTest: {
            mobileFriendly: true,
            issues: []
          }
        })
      };

      const mockPageResponse = {
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <title>Healthcare Services</title>
              <meta name="description" content="Medical services">
              <meta name="robots" content="index, follow">
              <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "MedicalBusiness",
                  "name": "Healthcare Clinic"
                }
              </script>
            </head>
            <body>
              <h1>Healthcare Services</h1>
              <p>We provide comprehensive medical care.</p>
              <div class="disclaimer">
                <p>This information is for educational purposes only.</p>
              </div>
            </body>
          </html>
        `)
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce(mockPageSpeedResponse)
        .mockResolvedValueOnce(mockMobileResponse)
        .mockResolvedValueOnce(mockPageResponse);

      const result = await checker.performFullTechnicalAudit('https://example.com');

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.pageSpeed.performanceScore).toBe(0.85);
      expect(result.mobileUsability.isMobileFriendly).toBe(true);
      expect(result.structuredData.hasStructuredData).toBe(true);
      expect(result.crawlability.isCrawlable).toBe(true);
      expect(result.healthcareCompliance.hasMedicalDisclaimer).toBe(true);
    });

    it('should handle audit errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Audit failed'));

      await expect(checker.performFullTechnicalAudit('https://example.com')).rejects.toThrow('Audit failed');
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(checker.checkPageSpeed('https://example.com')).rejects.toThrow('Network error');
    });

    it('should handle invalid URLs gracefully', async () => {
      await expect(checker.checkPageSpeed('invalid-url')).rejects.toThrow('Invalid URL');
    });
  });
});
