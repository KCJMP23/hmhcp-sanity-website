// Technical SEO Checker
// Created: 2025-01-27
// Purpose: Comprehensive technical SEO analysis for healthcare websites

import { HealthcareComplianceValidator } from './HealthcareComplianceValidator';

export interface TechnicalSEOResult {
  score: number;
  issues: TechnicalSEOIssue[];
  recommendations: string[];
  healthcareCompliance: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  performance: {
    pageSpeed: number;
    mobileFriendly: boolean;
    coreWebVitals: {
      lcp: number;
      fid: number;
      cls: number;
    };
  };
  accessibility: {
    score: number;
    issues: string[];
    wcagLevel: 'A' | 'AA' | 'AAA' | 'None';
  };
  structuredData: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    healthcareSchemas: string[];
  };
}

export interface TechnicalSEOIssue {
  type: 'error' | 'warning' | 'info';
  category: 'performance' | 'accessibility' | 'seo' | 'healthcare' | 'security';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  fix: string;
  element?: string;
  line?: number;
}

export class TechnicalSEOChecker {
  private complianceValidator: HealthcareComplianceValidator;

  constructor() {
    this.complianceValidator = new HealthcareComplianceValidator();
  }

  async analyzePage(url: string, htmlContent?: string): Promise<TechnicalSEOResult> {
    try {
      const content = htmlContent || await this.fetchPageContent(url);
      const dom = this.parseHTML(content);
      
      const issues: TechnicalSEOIssue[] = [];
      const recommendations: string[] = [];

      // Basic SEO checks
      issues.push(...this.checkBasicSEO(dom, url));
      
      // Performance checks
      const performance = await this.checkPerformance(url, content);
      issues.push(...performance.issues);
      
      // Accessibility checks
      const accessibility = this.checkAccessibility(dom);
      issues.push(...accessibility.issues);
      
      // Healthcare compliance checks
      const healthcareCompliance = await this.complianceValidator.validateContent(content, url);
      issues.push(...this.convertComplianceToIssues(healthcareCompliance));
      
      // Structured data checks
      const structuredData = this.checkStructuredData(dom);
      issues.push(...structuredData.issues);
      
      // Security checks
      issues.push(...this.checkSecurity(dom, url));
      
      // Generate recommendations
      recommendations.push(...this.generateRecommendations(issues));
      
      // Calculate overall score
      const score = this.calculateScore(issues);
      
      return {
        score,
        issues,
        recommendations,
        healthcareCompliance: {
          score: healthcareCompliance.score,
          issues: healthcareCompliance.issues,
          recommendations: healthcareCompliance.recommendations
        },
        performance: {
          pageSpeed: performance.pageSpeed,
          mobileFriendly: performance.mobileFriendly,
          coreWebVitals: performance.coreWebVitals
        },
        accessibility: {
          score: accessibility.score,
          issues: accessibility.issues,
          wcagLevel: accessibility.wcagLevel
        },
        structuredData: {
          valid: structuredData.valid,
          errors: structuredData.errors,
          warnings: structuredData.warnings,
          healthcareSchemas: structuredData.healthcareSchemas
        }
      };
      
    } catch (error) {
      throw new Error(`Technical SEO analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchPageContent(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to fetch page content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseHTML(html: string): Document {
    // In a real implementation, you'd use a proper HTML parser like jsdom or cheerio
    // For now, we'll create a mock DOM parser
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  private checkBasicSEO(dom: Document, url: string): TechnicalSEOIssue[] {
    const issues: TechnicalSEOIssue[] = [];
    
    // Title tag check
    const title = dom.querySelector('title');
    if (!title) {
      issues.push({
        type: 'error',
        category: 'seo',
        title: 'Missing title tag',
        description: 'The page is missing a title tag, which is essential for SEO',
        impact: 'high',
        fix: 'Add a descriptive title tag to the head section'
      });
    } else if (title.textContent!.length < 30) {
      issues.push({
        type: 'warning',
        category: 'seo',
        title: 'Title tag too short',
        description: 'Title tag should be at least 30 characters for better SEO',
        impact: 'medium',
        fix: 'Expand the title tag to be more descriptive',
        element: 'title'
      });
    } else if (title.textContent!.length > 60) {
      issues.push({
        type: 'warning',
        category: 'seo',
        title: 'Title tag too long',
        description: 'Title tag should be under 60 characters to avoid truncation',
        impact: 'medium',
        fix: 'Shorten the title tag to under 60 characters',
        element: 'title'
      });
    }

    // Meta description check
    const metaDescription = dom.querySelector('meta[name="description"]');
    if (!metaDescription) {
      issues.push({
        type: 'error',
        category: 'seo',
        title: 'Missing meta description',
        description: 'The page is missing a meta description tag',
        impact: 'high',
        fix: 'Add a meta description tag to the head section'
      });
    } else {
      const content = metaDescription.getAttribute('content') || '';
      if (content.length < 120) {
        issues.push({
          type: 'warning',
          category: 'seo',
          title: 'Meta description too short',
          description: 'Meta description should be at least 120 characters',
          impact: 'medium',
          fix: 'Expand the meta description to be more descriptive',
          element: 'meta[name="description"]'
        });
      } else if (content.length > 160) {
        issues.push({
          type: 'warning',
          category: 'seo',
          title: 'Meta description too long',
          description: 'Meta description should be under 160 characters',
          impact: 'medium',
          fix: 'Shorten the meta description to under 160 characters',
          element: 'meta[name="description"]'
        });
      }
    }

    // Heading structure check
    const headings = dom.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const h1Count = dom.querySelectorAll('h1').length;
    
    if (h1Count === 0) {
      issues.push({
        type: 'error',
        category: 'seo',
        title: 'Missing H1 tag',
        description: 'The page should have exactly one H1 tag',
        impact: 'high',
        fix: 'Add a single H1 tag to the main content area'
      });
    } else if (h1Count > 1) {
      issues.push({
        type: 'warning',
        category: 'seo',
        title: 'Multiple H1 tags',
        description: 'The page should have only one H1 tag',
        impact: 'medium',
        fix: 'Use only one H1 tag and use H2-H6 for other headings',
        element: 'h1'
      });
    }

    // Image alt text check
    const images = dom.querySelectorAll('img');
    let imagesWithoutAlt = 0;
    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        imagesWithoutAlt++;
      }
    });
    
    if (imagesWithoutAlt > 0) {
      issues.push({
        type: 'warning',
        category: 'accessibility',
        title: 'Images missing alt text',
        description: `${imagesWithoutAlt} images are missing alt text`,
        impact: 'medium',
        fix: 'Add descriptive alt text to all images'
      });
    }

    // Internal link check
    const links = dom.querySelectorAll('a[href]');
    const internalLinks = Array.from(links).filter(link => {
      const href = link.getAttribute('href');
      return href && (href.startsWith('/') || href.includes(new URL(url).hostname));
    });
    
    if (internalLinks.length < 3) {
      issues.push({
        type: 'info',
        category: 'seo',
        title: 'Low internal linking',
        description: 'Consider adding more internal links to improve site structure',
        impact: 'low',
        fix: 'Add more internal links to related content'
      });
    }

    return issues;
  }

  private async checkPerformance(url: string, content: string): Promise<{
    pageSpeed: number;
    mobileFriendly: boolean;
    coreWebVitals: { lcp: number; fid: number; cls: number };
    issues: TechnicalSEOIssue[];
  }> {
    const issues: TechnicalSEOIssue[] = [];
    
    // Simulate performance analysis
    // In a real implementation, you'd use Google PageSpeed Insights API or similar
    const pageSpeed = Math.floor(Math.random() * 40) + 60; // 60-100
    const mobileFriendly = Math.random() > 0.2; // 80% chance
    
    if (pageSpeed < 80) {
      issues.push({
        type: 'warning',
        category: 'performance',
        title: 'Page speed needs improvement',
        description: `Page speed score is ${pageSpeed}, should be above 80`,
        impact: 'high',
        fix: 'Optimize images, minify CSS/JS, and enable compression'
      });
    }
    
    if (!mobileFriendly) {
      issues.push({
        type: 'error',
        category: 'performance',
        title: 'Not mobile friendly',
        description: 'The page is not optimized for mobile devices',
        impact: 'high',
        fix: 'Implement responsive design and mobile optimization'
      });
    }

    // Check for large images
    const imageSizeRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
    const images = content.match(imageSizeRegex);
    if (images && images.length > 10) {
      issues.push({
        type: 'warning',
        category: 'performance',
        title: 'Too many images',
        description: `Page has ${images.length} images, consider lazy loading`,
        impact: 'medium',
        fix: 'Implement lazy loading for images below the fold'
      });
    }

    return {
      pageSpeed,
      mobileFriendly,
      coreWebVitals: {
        lcp: Math.random() * 2.5 + 1.0, // 1.0-3.5s
        fid: Math.random() * 100 + 10, // 10-110ms
        cls: Math.random() * 0.25 // 0-0.25
      },
      issues
    };
  }

  private checkAccessibility(dom: Document): {
    score: number;
    issues: string[];
    wcagLevel: 'A' | 'AA' | 'AAA' | 'None';
    issues: TechnicalSEOIssue[];
  } {
    const issues: TechnicalSEOIssue[] = [];
    const accessibilityIssues: string[] = [];
    
    // Check for proper heading hierarchy
    const headings = Array.from(dom.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;
    let hasHeadingIssues = false;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        hasHeadingIssues = true;
      }
      previousLevel = level;
    });
    
    if (hasHeadingIssues) {
      issues.push({
        type: 'warning',
        category: 'accessibility',
        title: 'Improper heading hierarchy',
        description: 'Headings should follow a logical order (H1 → H2 → H3, etc.)',
        impact: 'medium',
        fix: 'Ensure headings follow a proper hierarchy without skipping levels'
      });
      accessibilityIssues.push('Improper heading hierarchy');
    }

    // Check for form labels
    const inputs = dom.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea, select');
    let unlabeledInputs = 0;
    
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      
      if (!id && !ariaLabel && !ariaLabelledBy) {
        unlabeledInputs++;
      }
    });
    
    if (unlabeledInputs > 0) {
      issues.push({
        type: 'error',
        category: 'accessibility',
        title: 'Form inputs missing labels',
        description: `${unlabeledInputs} form inputs are missing proper labels`,
        impact: 'high',
        fix: 'Add labels, aria-label, or aria-labelledby to all form inputs'
      });
      accessibilityIssues.push('Form inputs missing labels');
    }

    // Check for sufficient color contrast (simplified)
    const textElements = dom.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    if (textElements.length > 0) {
      issues.push({
        type: 'info',
        category: 'accessibility',
        title: 'Color contrast check needed',
        description: 'Verify that text has sufficient color contrast (4.5:1 for normal text)',
        impact: 'medium',
        fix: 'Use a color contrast checker to verify WCAG compliance'
      });
    }

    const score = Math.max(0, 100 - (accessibilityIssues.length * 20));
    const wcagLevel = score >= 80 ? 'AA' : score >= 60 ? 'A' : 'None';

    return {
      score,
      issues: accessibilityIssues,
      wcagLevel,
      issues
    };
  }

  private checkStructuredData(dom: Document): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    healthcareSchemas: string[];
    issues: TechnicalSEOIssue[];
  } {
    const issues: TechnicalSEOIssue[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const healthcareSchemas: string[] = [];
    
    // Check for JSON-LD structured data
    const jsonLdScripts = dom.querySelectorAll('script[type="application/ld+json"]');
    
    if (jsonLdScripts.length === 0) {
      issues.push({
        type: 'warning',
        category: 'seo',
        title: 'No structured data found',
        description: 'Consider adding structured data to improve search visibility',
        impact: 'medium',
        fix: 'Add JSON-LD structured data for healthcare content'
      });
      warnings.push('No structured data found');
    } else {
      jsonLdScripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent || '');
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (item['@type']) {
                if (item['@type'].includes('Medical') || 
                    item['@type'].includes('Health') ||
                    item['@type'].includes('Organization')) {
                  healthcareSchemas.push(item['@type']);
                }
              }
            });
          } else if (data['@type']) {
            if (data['@type'].includes('Medical') || 
                data['@type'].includes('Health') ||
                data['@type'].includes('Organization')) {
              healthcareSchemas.push(data['@type']);
            }
          }
        } catch (error) {
          issues.push({
            type: 'error',
            category: 'seo',
            title: 'Invalid JSON-LD structured data',
            description: 'Structured data contains invalid JSON',
            impact: 'high',
            fix: 'Fix the JSON syntax in the structured data',
            element: 'script[type="application/ld+json"]'
          });
          errors.push('Invalid JSON-LD structured data');
        }
      });
    }

    // Check for microdata
    const microdataElements = dom.querySelectorAll('[itemscope]');
    if (microdataElements.length === 0 && jsonLdScripts.length === 0) {
      issues.push({
        type: 'info',
        category: 'seo',
        title: 'No microdata found',
        description: 'Consider adding microdata for better search engine understanding',
        impact: 'low',
        fix: 'Add microdata attributes to relevant content'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      healthcareSchemas,
      issues
    };
  }

  private checkSecurity(dom: Document, url: string): TechnicalSEOIssue[] {
    const issues: TechnicalSEOIssue[] = [];
    
    // Check for HTTPS
    if (!url.startsWith('https://')) {
      issues.push({
        type: 'error',
        category: 'security',
        title: 'Not using HTTPS',
        description: 'The page is not served over HTTPS',
        impact: 'high',
        fix: 'Enable SSL/TLS certificate and redirect HTTP to HTTPS'
      });
    }

    // Check for security headers (simplified)
    const metaHttpEquiv = dom.querySelectorAll('meta[http-equiv]');
    const hasSecurityHeaders = Array.from(metaHttpEquiv).some(meta => {
      const content = meta.getAttribute('content') || '';
      return content.includes('X-Frame-Options') || 
             content.includes('X-Content-Type-Options') ||
             content.includes('X-XSS-Protection');
    });
    
    if (!hasSecurityHeaders) {
      issues.push({
        type: 'warning',
        category: 'security',
        title: 'Missing security headers',
        description: 'Consider adding security headers for better protection',
        impact: 'medium',
        fix: 'Add security headers like X-Frame-Options, X-Content-Type-Options'
      });
    }

    return issues;
  }

  private convertComplianceToIssues(compliance: any): TechnicalSEOIssue[] {
    const issues: TechnicalSEOIssue[] = [];
    
    compliance.issues.forEach((issue: string) => {
      issues.push({
        type: 'error',
        category: 'healthcare',
        title: 'Healthcare compliance issue',
        description: issue,
        impact: 'high',
        fix: 'Address healthcare compliance requirements'
      });
    });

    return issues;
  }

  private generateRecommendations(issues: TechnicalSEOIssue[]): string[] {
    const recommendations: string[] = [];
    
    const highImpactIssues = issues.filter(issue => issue.impact === 'high');
    const mediumImpactIssues = issues.filter(issue => issue.impact === 'medium');
    
    if (highImpactIssues.length > 0) {
      recommendations.push(`Address ${highImpactIssues.length} high-impact issues first`);
    }
    
    if (mediumImpactIssues.length > 0) {
      recommendations.push(`Fix ${mediumImpactIssues.length} medium-impact issues for better SEO`);
    }
    
    const healthcareIssues = issues.filter(issue => issue.category === 'healthcare');
    if (healthcareIssues.length > 0) {
      recommendations.push('Ensure all healthcare compliance requirements are met');
    }
    
    const performanceIssues = issues.filter(issue => issue.category === 'performance');
    if (performanceIssues.length > 0) {
      recommendations.push('Optimize page performance for better user experience');
    }
    
    return recommendations;
  }

  private calculateScore(issues: TechnicalSEOIssue[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.impact) {
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    });
    
    return Math.max(0, score);
  }
}
