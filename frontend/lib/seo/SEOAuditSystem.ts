// SEO Audit System
// Created: 2025-01-27
// Purpose: Comprehensive SEO auditing system for healthcare websites

import { TechnicalSEOChecker, TechnicalSEOResult } from './TechnicalSEOChecker';
import { HealthcareComplianceValidator } from './HealthcareComplianceValidator';
import { SEOAnalysisEngine } from './SEOAnalysisEngine';

export interface SEOAuditResult {
  id: string;
  organizationId: string;
  auditType: 'full' | 'technical' | 'content' | 'healthcare' | 'performance';
  url: string;
  timestamp: Date;
  overallScore: number;
  technicalSEO: TechnicalSEOResult;
  contentAnalysis: {
    score: number;
    issues: string[];
    recommendations: string[];
    medicalAccuracy: number;
    contentFreshness: number;
    keywordDensity: Record<string, number>;
  };
  siteStructure: {
    score: number;
    issues: string[];
    recommendations: string[];
    internalLinking: number;
    urlStructure: number;
    navigationDepth: number;
  };
  mobileOptimization: {
    score: number;
    issues: string[];
    recommendations: string[];
    responsiveDesign: boolean;
    mobileSpeed: number;
    touchFriendly: boolean;
  };
  healthcareCompliance: {
    score: number;
    issues: string[];
    recommendations: string[];
    fdaCompliance: boolean;
    hipaaCompliance: boolean;
    advertisingCompliance: boolean;
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }[];
  nextAuditDate: Date;
}

export interface AuditConfiguration {
  organizationId: string;
  auditFrequency: 'daily' | 'weekly' | 'monthly';
  includeTechnical: boolean;
  includeContent: boolean;
  includeHealthcare: boolean;
  includePerformance: boolean;
  includeMobile: boolean;
  urls: string[];
  healthcareSpecialty?: string;
  complianceLevel: 'basic' | 'comprehensive';
}

export class SEOAuditSystem {
  private technicalChecker: TechnicalSEOChecker;
  private complianceValidator: HealthcareComplianceValidator;
  private analysisEngine: SEOAnalysisEngine;

  constructor() {
    this.technicalChecker = new TechnicalSEOChecker();
    this.complianceValidator = new HealthcareComplianceValidator();
    this.analysisEngine = new SEOAnalysisEngine();
  }

  async performFullAudit(config: AuditConfiguration): Promise<SEOAuditResult[]> {
    const results: SEOAuditResult[] = [];
    
    for (const url of config.urls) {
      try {
        const result = await this.auditSinglePage(url, config);
        results.push(result);
      } catch (error) {
        console.error(`Failed to audit ${url}:`, error);
        // Continue with other URLs
      }
    }
    
    return results;
  }

  async auditSinglePage(url: string, config: AuditConfiguration): Promise<SEOAuditResult> {
    const auditId = this.generateAuditId();
    const timestamp = new Date();
    
    // Perform technical SEO analysis
    const technicalSEO = await this.technicalChecker.analyzePage(url);
    
    // Perform content analysis
    const contentAnalysis = await this.performContentAnalysis(url, config);
    
    // Analyze site structure
    const siteStructure = await this.analyzeSiteStructure(url, config);
    
    // Check mobile optimization
    const mobileOptimization = await this.checkMobileOptimization(url, config);
    
    // Validate healthcare compliance
    const healthcareCompliance = await this.validateHealthcareCompliance(url, config);
    
    // Generate recommendations
    const recommendations = this.generateAuditRecommendations({
      technicalSEO,
      contentAnalysis,
      siteStructure,
      mobileOptimization,
      healthcareCompliance
    });
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      technicalSEO,
      contentAnalysis,
      siteStructure,
      mobileOptimization,
      healthcareCompliance
    });
    
    // Determine next audit date
    const nextAuditDate = this.calculateNextAuditDate(timestamp, config.auditFrequency);
    
    return {
      id: auditId,
      organizationId: config.organizationId,
      auditType: 'full',
      url,
      timestamp,
      overallScore,
      technicalSEO,
      contentAnalysis,
      siteStructure,
      mobileOptimization,
      healthcareCompliance,
      recommendations,
      nextAuditDate
    };
  }

  private async performContentAnalysis(url: string, config: AuditConfiguration): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
    medicalAccuracy: number;
    contentFreshness: number;
    keywordDensity: Record<string, number>;
  }> {
    try {
      const content = await this.fetchPageContent(url);
      const analysis = await this.analysisEngine.analyzeContent(content, url);
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      // Check content length
      const wordCount = content.split(/\s+/).length;
      if (wordCount < 300) {
        issues.push('Content is too short (less than 300 words)');
        recommendations.push('Expand content to provide more value to users');
      }
      
      // Check for medical accuracy indicators
      const medicalAccuracy = this.assessMedicalAccuracy(content);
      if (medicalAccuracy < 70) {
        issues.push('Content may lack medical accuracy indicators');
        recommendations.push('Add medical citations, disclaimers, and expert reviews');
      }
      
      // Check content freshness
      const contentFreshness = this.assessContentFreshness(content);
      if (contentFreshness < 60) {
        issues.push('Content appears outdated');
        recommendations.push('Update content with recent information and dates');
      }
      
      // Analyze keyword density
      const keywordDensity = this.analyzeKeywordDensity(content, config.healthcareSpecialty);
      
      const score = Math.max(0, 100 - (issues.length * 15));
      
      return {
        score,
        issues,
        recommendations,
        medicalAccuracy,
        contentFreshness,
        keywordDensity
      };
      
    } catch (error) {
      return {
        score: 0,
        issues: ['Failed to analyze content'],
        recommendations: ['Fix content accessibility issues'],
        medicalAccuracy: 0,
        contentFreshness: 0,
        keywordDensity: {}
      };
    }
  }

  private async analyzeSiteStructure(url: string, config: AuditConfiguration): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
    internalLinking: number;
    urlStructure: number;
    navigationDepth: number;
  }> {
    try {
      const content = await this.fetchPageContent(url);
      const dom = this.parseHTML(content);
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      // Analyze internal linking
      const internalLinks = this.analyzeInternalLinking(dom, url);
      if (internalLinks.count < 3) {
        issues.push('Insufficient internal linking');
        recommendations.push('Add more internal links to related content');
      }
      
      // Check URL structure
      const urlStructure = this.analyzeURLStructure(url);
      if (urlStructure.score < 70) {
        issues.push('URL structure could be improved');
        recommendations.push('Use descriptive, keyword-rich URLs');
      }
      
      // Analyze navigation depth
      const navigationDepth = this.analyzeNavigationDepth(dom);
      if (navigationDepth > 4) {
        issues.push('Navigation depth is too deep');
        recommendations.push('Reduce navigation depth to improve user experience');
      }
      
      const score = Math.max(0, 100 - (issues.length * 20));
      
      return {
        score,
        issues,
        recommendations,
        internalLinking: internalLinks.score,
        urlStructure: urlStructure.score,
        navigationDepth
      };
      
    } catch (error) {
      return {
        score: 0,
        issues: ['Failed to analyze site structure'],
        recommendations: ['Fix site structure analysis issues'],
        internalLinking: 0,
        urlStructure: 0,
        navigationDepth: 0
      };
    }
  }

  private async checkMobileOptimization(url: string, config: AuditConfiguration): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
    responsiveDesign: boolean;
    mobileSpeed: number;
    touchFriendly: boolean;
  }> {
    try {
      const content = await this.fetchPageContent(url);
      const dom = this.parseHTML(content);
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      // Check for responsive design
      const responsiveDesign = this.checkResponsiveDesign(dom);
      if (!responsiveDesign) {
        issues.push('Site is not responsive');
        recommendations.push('Implement responsive design for mobile devices');
      }
      
      // Check mobile speed (simplified)
      const mobileSpeed = this.assessMobileSpeed(content);
      if (mobileSpeed < 70) {
        issues.push('Mobile page speed is slow');
        recommendations.push('Optimize images, CSS, and JavaScript for mobile');
      }
      
      // Check touch friendliness
      const touchFriendly = this.checkTouchFriendly(dom);
      if (!touchFriendly) {
        issues.push('Site is not touch-friendly');
        recommendations.push('Increase button sizes and touch targets');
      }
      
      const score = Math.max(0, 100 - (issues.length * 25));
      
      return {
        score,
        issues,
        recommendations,
        responsiveDesign,
        mobileSpeed,
        touchFriendly
      };
      
    } catch (error) {
      return {
        score: 0,
        issues: ['Failed to analyze mobile optimization'],
        recommendations: ['Fix mobile optimization analysis issues'],
        responsiveDesign: false,
        mobileSpeed: 0,
        touchFriendly: false
      };
    }
  }

  private async validateHealthcareCompliance(url: string, config: AuditConfiguration): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
    fdaCompliance: boolean;
    hipaaCompliance: boolean;
    advertisingCompliance: boolean;
  }> {
    try {
      const content = await this.fetchPageContent(url);
      const compliance = await this.complianceValidator.validateContent(content, url);
      
      const fdaCompliance = compliance.fdaCompliance;
      const hipaaCompliance = compliance.hipaaCompliance;
      const advertisingCompliance = compliance.advertisingCompliance;
      
      const issues: string[] = [...compliance.issues];
      const recommendations: string[] = [...compliance.recommendations];
      
      if (!fdaCompliance) {
        issues.push('FDA compliance requirements not met');
        recommendations.push('Review and implement FDA guidelines for medical content');
      }
      
      if (!hipaaCompliance) {
        issues.push('HIPAA compliance requirements not met');
        recommendations.push('Implement HIPAA-compliant data handling practices');
      }
      
      if (!advertisingCompliance) {
        issues.push('Healthcare advertising compliance not met');
        recommendations.push('Review healthcare advertising guidelines and disclaimers');
      }
      
      return {
        score: compliance.score,
        issues,
        recommendations,
        fdaCompliance,
        hipaaCompliance,
        advertisingCompliance
      };
      
    } catch (error) {
      return {
        score: 0,
        issues: ['Failed to validate healthcare compliance'],
        recommendations: ['Fix healthcare compliance validation issues'],
        fdaCompliance: false,
        hipaaCompliance: false,
        advertisingCompliance: false
      };
    }
  }

  private generateAuditRecommendations(data: {
    technicalSEO: TechnicalSEOResult;
    contentAnalysis: any;
    siteStructure: any;
    mobileOptimization: any;
    healthcareCompliance: any;
  }): {
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }[] {
    const recommendations: any[] = [];
    
    // Technical SEO recommendations
    if (data.technicalSEO.score < 80) {
      recommendations.push({
        priority: 'high',
        category: 'Technical SEO',
        title: 'Improve Technical SEO',
        description: `Current score: ${data.technicalSEO.score}/100. Focus on fixing ${data.technicalSEO.issues.length} issues.`,
        impact: 'High - Better search engine visibility',
        effort: 'medium'
      });
    }
    
    // Content recommendations
    if (data.contentAnalysis.score < 70) {
      recommendations.push({
        priority: 'high',
        category: 'Content',
        title: 'Enhance Content Quality',
        description: `Content score: ${data.contentAnalysis.score}/100. Improve medical accuracy and freshness.`,
        impact: 'High - Better user engagement and trust',
        effort: 'high'
      });
    }
    
    // Mobile optimization recommendations
    if (data.mobileOptimization.score < 75) {
      recommendations.push({
        priority: 'high',
        category: 'Mobile',
        title: 'Optimize for Mobile',
        description: `Mobile score: ${data.mobileOptimization.score}/100. Improve responsive design and mobile speed.`,
        impact: 'High - Better mobile user experience',
        effort: 'medium'
      });
    }
    
    // Healthcare compliance recommendations
    if (data.healthcareCompliance.score < 90) {
      recommendations.push({
        priority: 'high',
        category: 'Healthcare Compliance',
        title: 'Ensure Healthcare Compliance',
        description: `Compliance score: ${data.healthcareCompliance.score}/100. Address regulatory requirements.`,
        impact: 'Critical - Legal and regulatory compliance',
        effort: 'high'
      });
    }
    
    // Site structure recommendations
    if (data.siteStructure.score < 70) {
      recommendations.push({
        priority: 'medium',
        category: 'Site Structure',
        title: 'Improve Site Structure',
        description: `Structure score: ${data.siteStructure.score}/100. Enhance internal linking and navigation.`,
        impact: 'Medium - Better user experience and SEO',
        effort: 'medium'
      });
    }
    
    return recommendations;
  }

  private calculateOverallScore(data: {
    technicalSEO: TechnicalSEOResult;
    contentAnalysis: any;
    siteStructure: any;
    mobileOptimization: any;
    healthcareCompliance: any;
  }): number {
    const weights = {
      technical: 0.25,
      content: 0.20,
      structure: 0.15,
      mobile: 0.20,
      compliance: 0.20
    };
    
    const weightedScore = 
      (data.technicalSEO.score * weights.technical) +
      (data.contentAnalysis.score * weights.content) +
      (data.siteStructure.score * weights.structure) +
      (data.mobileOptimization.score * weights.mobile) +
      (data.healthcareCompliance.score * weights.compliance);
    
    return Math.round(weightedScore);
  }

  private calculateNextAuditDate(timestamp: Date, frequency: string): Date {
    const nextDate = new Date(timestamp);
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 7);
    }
    
    return nextDate;
  }

  // Helper methods
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  private assessMedicalAccuracy(content: string): number {
    // Simplified medical accuracy assessment
    const medicalTerms = ['diagnosis', 'treatment', 'symptoms', 'medical', 'clinical', 'patient', 'doctor', 'physician'];
    const disclaimerTerms = ['disclaimer', 'not medical advice', 'consult your doctor', 'seek medical attention'];
    const citationTerms = ['study', 'research', 'published', 'journal', 'medical literature'];
    
    let score = 0;
    
    // Check for medical terminology
    const medicalTermCount = medicalTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length;
    score += (medicalTermCount / medicalTerms.length) * 30;
    
    // Check for disclaimers
    const disclaimerCount = disclaimerTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length;
    score += (disclaimerCount / disclaimerTerms.length) * 40;
    
    // Check for citations
    const citationCount = citationTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length;
    score += (citationCount / citationTerms.length) * 30;
    
    return Math.min(100, score);
  }

  private assessContentFreshness(content: string): number {
    const currentYear = new Date().getFullYear();
    const yearRegex = /\b(20\d{2})\b/g;
    const years = content.match(yearRegex);
    
    if (!years || years.length === 0) {
      return 0;
    }
    
    const latestYear = Math.max(...years.map(year => parseInt(year)));
    const yearsOld = currentYear - latestYear;
    
    if (yearsOld === 0) return 100;
    if (yearsOld === 1) return 80;
    if (yearsOld === 2) return 60;
    if (yearsOld <= 5) return 40;
    return 20;
  }

  private analyzeKeywordDensity(content: string, specialty?: string): Record<string, number> {
    const words = content.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    const keywordDensity: Record<string, number> = {};
    
    // Common healthcare keywords
    const healthcareKeywords = [
      'health', 'medical', 'doctor', 'patient', 'treatment', 'diagnosis',
      'symptoms', 'care', 'hospital', 'clinic', 'physician', 'nurse'
    ];
    
    if (specialty) {
      healthcareKeywords.push(specialty, `${specialty} care`, `${specialty} treatment`);
    }
    
    healthcareKeywords.forEach(keyword => {
      const count = words.filter(word => word.includes(keyword)).length;
      keywordDensity[keyword] = (count / totalWords) * 100;
    });
    
    return keywordDensity;
  }

  private analyzeInternalLinking(dom: Document, baseUrl: string): { count: number; score: number } {
    const links = dom.querySelectorAll('a[href]');
    const baseDomain = new URL(baseUrl).hostname;
    
    const internalLinks = Array.from(links).filter(link => {
      const href = link.getAttribute('href');
      return href && (href.startsWith('/') || href.includes(baseDomain));
    });
    
    const score = Math.min(100, (internalLinks.length / 5) * 100);
    
    return { count: internalLinks.length, score };
  }

  private analyzeURLStructure(url: string): { score: number } {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    let score = 100;
    
    // Check for query parameters
    if (urlObj.search) {
      score -= 20;
    }
    
    // Check for hash fragments
    if (urlObj.hash) {
      score -= 10;
    }
    
    // Check path length
    if (path.length > 100) {
      score -= 20;
    }
    
    // Check for numbers in path (could be dynamic)
    if (/\d+/.test(path)) {
      score -= 15;
    }
    
    return { score: Math.max(0, score) };
  }

  private analyzeNavigationDepth(dom: Document): number {
    const navElements = dom.querySelectorAll('nav, .navigation, .menu');
    let maxDepth = 0;
    
    navElements.forEach(nav => {
      const depth = this.calculateElementDepth(nav);
      maxDepth = Math.max(maxDepth, depth);
    });
    
    return maxDepth;
  }

  private calculateElementDepth(element: Element): number {
    let depth = 0;
    let current = element;
    
    while (current.parentElement) {
      depth++;
      current = current.parentElement;
    }
    
    return depth;
  }

  private checkResponsiveDesign(dom: Document): boolean {
    const viewportMeta = dom.querySelector('meta[name="viewport"]');
    if (!viewportMeta) return false;
    
    const content = viewportMeta.getAttribute('content') || '';
    return content.includes('width=device-width') && content.includes('initial-scale=1');
  }

  private assessMobileSpeed(content: string): number {
    // Simplified mobile speed assessment
    const imageCount = (content.match(/<img/gi) || []).length;
    const scriptCount = (content.match(/<script/gi) || []).length;
    const styleCount = (content.match(/<style/gi) || []).length;
    
    let score = 100;
    score -= imageCount * 2;
    score -= scriptCount * 3;
    score -= styleCount * 1;
    
    return Math.max(0, score);
  }

  private checkTouchFriendly(dom: Document): boolean {
    const buttons = dom.querySelectorAll('button, input[type="button"], input[type="submit"], a');
    let touchFriendlyCount = 0;
    
    buttons.forEach(button => {
      const style = window.getComputedStyle(button as Element);
      const minHeight = parseInt(style.minHeight) || button.clientHeight;
      const minWidth = parseInt(style.minWidth) || button.clientWidth;
      
      if (minHeight >= 44 && minWidth >= 44) {
        touchFriendlyCount++;
      }
    });
    
    return touchFriendlyCount > 0;
  }
}
