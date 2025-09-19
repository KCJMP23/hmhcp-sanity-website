// SEO Analysis Engine Tests
// Created: 2025-01-27
// Purpose: Unit tests for SEO analysis functionality

import { SEOAnalysisEngine } from '../SEOAnalysisEngine';
import { SEOAuditRequest } from '@/types/seo';

// Mock fetch for testing
global.fetch = jest.fn();

describe('SEOAnalysisEngine', () => {
  let seoEngine: SEOAnalysisEngine;

  beforeEach(() => {
    seoEngine = new SEOAnalysisEngine();
    (fetch as jest.Mock).mockClear();
  });

  describe('performAudit', () => {
    it('should perform a complete SEO audit', async () => {
      // Mock fetch response for page content
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <title>Healthcare Services - Medical Center</title>
              <meta name="description" content="Comprehensive healthcare services including cardiology, oncology, and general medicine. Our medical center provides expert care with state-of-the-art facilities.">
            </head>
            <body>
              <h1>Healthcare Services</h1>
              <p>Our medical center offers comprehensive healthcare services including treatment for various medical conditions. We provide evidence-based care and follow FDA guidelines for all treatments.</p>
              <p>Please consult your healthcare provider for medical advice. Results may vary and this information is not a substitute for professional medical consultation.</p>
            </body>
          </html>
        `)
      });

      const request: SEOAuditRequest = {
        page_url: 'https://example.com/healthcare-services',
        audit_type: 'technical',
        include_healthcare_validation: true
      };

      const result = await seoEngine.performAudit(request);

      expect(result).toBeDefined();
      expect(result.page_url).toBe(request.page_url);
      expect(result.audit_score).toBeGreaterThan(0);
      expect(result.issues_found).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.healthcare_compliance).toBeDefined();
      expect(result.audit_duration).toBeGreaterThan(0);
    });

    it('should identify technical SEO issues', async () => {
      // Mock fetch response for page with missing title
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <meta name="description" content="Healthcare services">
            </head>
            <body>
              <h2>Healthcare Services</h2>
              <p>Medical content without proper H1 tag.</p>
            </body>
          </html>
        `)
      });

      const request: SEOAuditRequest = {
        page_url: 'https://example.com/test',
        audit_type: 'technical',
        include_healthcare_validation: true
      };

      const result = await seoEngine.performAudit(request);

      expect(result.issues_found).toContainEqual(
        expect.objectContaining({
          type: 'technical',
          message: 'Missing H1 tag'
        })
      );
    });

    it('should validate healthcare compliance', async () => {
      // Mock fetch response for compliant healthcare content
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <title>FDA Approved Treatment Options</title>
            </head>
            <body>
              <h1>Medical Treatment Information</h1>
              <p>This treatment is FDA approved and HIPAA compliant. Please consult your doctor for medical advice. Individual results may vary.</p>
            </body>
          </html>
        `)
      });

      const request: SEOAuditRequest = {
        page_url: 'https://example.com/treatment',
        audit_type: 'compliance',
        include_healthcare_validation: true
      };

      const result = await seoEngine.performAudit(request);

      expect(result.healthcare_compliance).toBeDefined();
      expect(result.healthcare_compliance.fda_compliant).toBe(true);
      expect(result.healthcare_compliance.hipaa_compliant).toBe(true);
      expect(result.healthcare_compliance.disclaimers_present).toBe(true);
    });

    it('should handle audit errors gracefully', async () => {
      // Mock fetch to throw an error
      (fetch as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      const request: SEOAuditRequest = {
        page_url: 'https://example.com/error',
        audit_type: 'technical',
        include_healthcare_validation: true
      };

      await expect(seoEngine.performAudit(request)).rejects.toThrow('SEO audit failed: Failed to fetch page content: Network error');
    });
  });

  describe('healthcare compliance validation', () => {
    it('should identify missing FDA compliance', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head><title>Medical Treatment</title></head>
            <body>
              <h1>Treatment Information</h1>
              <p>This treatment is effective for various conditions.</p>
            </body>
          </html>
        `)
      });

      const request: SEOAuditRequest = {
        page_url: 'https://example.com/treatment',
        audit_type: 'compliance',
        include_healthcare_validation: true
      };

      const result = await seoEngine.performAudit(request);

      expect(result.healthcare_compliance.fda_compliant).toBe(false);
      expect(result.healthcare_compliance.compliance_notes).toContain(
        'Consider adding FDA compliance statements'
      );
    });

    it('should identify missing disclaimers', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head><title>Medical Advice</title></head>
            <body>
              <h1>Health Information</h1>
              <p>This information will help you understand your condition.</p>
            </body>
          </html>
        `)
      });

      const request: SEOAuditRequest = {
        page_url: 'https://example.com/advice',
        audit_type: 'compliance',
        include_healthcare_validation: true
      };

      const result = await seoEngine.performAudit(request);

      expect(result.healthcare_compliance.disclaimers_present).toBe(false);
      expect(result.healthcare_compliance.compliance_notes).toContain(
        'Add appropriate advertising disclaimers'
      );
    });
  });

  describe('content analysis', () => {
    it('should identify short content', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head><title>Short Content</title></head>
            <body>
              <h1>Healthcare</h1>
              <p>Short content.</p>
            </body>
          </html>
        `)
      });

      const request: SEOAuditRequest = {
        page_url: 'https://example.com/short',
        audit_type: 'content',
        include_healthcare_validation: true
      };

      const result = await seoEngine.performAudit(request);

      expect(result.issues_found).toContainEqual(
        expect.objectContaining({
          type: 'content',
          message: 'Content too short'
        })
      );
    });

    it('should identify insufficient healthcare keywords', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head><title>General Information</title></head>
            <body>
              <h1>Information</h1>
              <p>This is general information about various topics. It covers many different subjects and provides useful details.</p>
            </body>
          </html>
        `)
      });

      const request: SEOAuditRequest = {
        page_url: 'https://example.com/general',
        audit_type: 'content',
        include_healthcare_validation: true
      };

      const result = await seoEngine.performAudit(request);

      expect(result.issues_found).toContainEqual(
        expect.objectContaining({
          type: 'content',
          message: 'Insufficient healthcare keywords'
        })
      );
    });
  });

  describe('recommendations generation', () => {
    it('should generate recommendations for critical issues', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <body>
              <h2>Healthcare Services</h2>
              <p>Medical content without title tag.</p>
            </body>
          </html>
        `)
      });

      const request: SEOAuditRequest = {
        page_url: 'https://example.com/critical',
        audit_type: 'technical',
        include_healthcare_validation: true
      };

      const result = await seoEngine.performAudit(request);

      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          priority: 'high',
          category: 'Technical SEO'
        })
      );
    });

    it('should generate healthcare-specific recommendations', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head><title>Medical Treatment</title></head>
            <body>
              <h1>Treatment Information</h1>
              <p>This treatment is effective for various conditions.</p>
            </body>
          </html>
        `)
      });

      const request: SEOAuditRequest = {
        page_url: 'https://example.com/treatment',
        audit_type: 'compliance',
        include_healthcare_validation: true
      };

      const result = await seoEngine.performAudit(request);

      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          priority: 'high',
          category: 'Healthcare Compliance',
          healthcare_specific: true
        })
      );
    });
  });
});