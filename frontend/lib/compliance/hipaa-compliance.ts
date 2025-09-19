// HIPAA Compliance Utilities
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

import { Publication, Author } from '@/types/publications';

export interface HIPAAComplianceCheck {
  isCompliant: boolean;
  violations: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export class HIPAAComplianceService {
  /**
   * Check if a publication contains PHI (Protected Health Information)
   */
  checkForPHI(publication: Publication): HIPAAComplianceCheck {
    const violations: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check title for PHI
    if (this.containsPHI(publication.title)) {
      violations.push('Publication title may contain PHI');
      recommendations.push('Review and sanitize publication title');
      riskLevel = 'high';
    }

    // Check abstract for PHI
    if (publication.abstract && this.containsPHI(publication.abstract)) {
      violations.push('Publication abstract may contain PHI');
      recommendations.push('Review and sanitize publication abstract');
      riskLevel = 'high';
    }

    // Check authors for PHI
    publication.authors?.forEach((author, index) => {
      if (this.containsPHI(author.name)) {
        violations.push(`Author ${index + 1} name may contain PHI`);
        recommendations.push('Use professional titles and affiliations only');
        riskLevel = 'medium';
      }
    });

    // Check keywords for PHI
    publication.keywords?.forEach(keyword => {
      if (this.containsPHI(keyword)) {
        violations.push(`Keyword "${keyword}" may contain PHI`);
        recommendations.push('Use generic medical terms instead of specific patient information');
        riskLevel = 'medium';
      }
    });

    // Check for specific PHI patterns
    const phiPatterns = this.detectPHIPatterns(publication);
    if (phiPatterns.length > 0) {
      violations.push(...phiPatterns);
      recommendations.push('Remove or anonymize all patient-specific information');
      riskLevel = 'high';
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendations,
      riskLevel
    };
  }

  /**
   * Check if author information is HIPAA compliant
   */
  checkAuthorCompliance(author: Author): HIPAAComplianceCheck {
    const violations: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check name for PHI
    if (this.containsPHI(author.name)) {
      violations.push('Author name may contain PHI');
      recommendations.push('Use professional name format only');
      riskLevel = 'medium';
    }

    // Check email for PHI
    if (author.email && this.containsPHI(author.email)) {
      violations.push('Author email may contain PHI');
      recommendations.push('Use professional email address');
      riskLevel = 'medium';
    }

    // Check bio for PHI
    if (author.bio && this.containsPHI(author.bio)) {
      violations.push('Author bio may contain PHI');
      recommendations.push('Remove patient-specific information from bio');
      riskLevel = 'high';
    }

    // Check research interests for PHI
    author.research_interests?.forEach(interest => {
      if (this.containsPHI(interest)) {
        violations.push(`Research interest "${interest}" may contain PHI`);
        recommendations.push('Use generic medical terms');
        riskLevel = 'medium';
      }
    });

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendations,
      riskLevel
    };
  }

  /**
   * Sanitize publication data to remove PHI
   */
  sanitizePublication(publication: Publication): Publication {
    const sanitized = { ...publication };

    // Sanitize title
    sanitized.title = this.sanitizeText(sanitized.title);

    // Sanitize abstract
    if (sanitized.abstract) {
      sanitized.abstract = this.sanitizeText(sanitized.abstract);
    }

    // Sanitize authors
    sanitized.authors = sanitized.authors?.map(author => this.sanitizeAuthor(author));

    // Sanitize keywords
    sanitized.keywords = sanitized.keywords?.map(keyword => this.sanitizeText(keyword));

    return sanitized;
  }

  /**
   * Sanitize author data to remove PHI
   */
  sanitizeAuthor(author: Author): Author {
    const sanitized = { ...author };

    // Sanitize name
    sanitized.name = this.sanitizeText(sanitized.name);

    // Sanitize bio
    if (sanitized.bio) {
      sanitized.bio = this.sanitizeText(sanitized.bio);
    }

    // Sanitize research interests
    sanitized.research_interests = sanitized.research_interests?.map(interest => 
      this.sanitizeText(interest)
    );

    return sanitized;
  }

  /**
   * Check if text contains PHI
   */
  private containsPHI(text: string): boolean {
    if (!text) return false;

    const phiPatterns = [
      // SSN patterns
      /\b\d{3}-\d{2}-\d{4}\b/g,
      /\b\d{9}\b/g,
      
      // Phone number patterns
      /\b\d{3}-\d{3}-\d{4}\b/g,
      /\b\(\d{3}\)\s*\d{3}-\d{4}\b/g,
      
      // Email patterns (if they contain names)
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
      
      // Date patterns that might indicate birth dates
      /\b(0[1-9]|1[0-2])[\/\-](0[1-9]|[12][0-9]|3[01])[\/\-](19|20)\d{2}\b/g,
      
      // Medical record number patterns
      /\bMRN\s*:?\s*\d+\b/gi,
      /\bMedical\s*Record\s*Number\s*:?\s*\d+\b/gi,
      
      // Patient ID patterns
      /\bPatient\s*ID\s*:?\s*\d+\b/gi,
      /\bP\s*#\s*:?\s*\d+\b/gi,
      
      // Address patterns
      /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi,
      
      // Insurance information
      /\bInsurance\s*:?\s*[A-Za-z0-9\s]+\b/gi,
      /\bPolicy\s*Number\s*:?\s*[A-Za-z0-9]+\b/gi
    ];

    return phiPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Detect specific PHI patterns in publication
   */
  private detectPHIPatterns(publication: Publication): string[] {
    const patterns: string[] = [];
    const text = `${publication.title} ${publication.abstract || ''} ${publication.keywords?.join(' ') || ''}`;

    // Check for specific medical record references
    if (/\b(patient|case|subject)\s*#?\s*\d+/gi.test(text)) {
      patterns.push('Contains patient/case/subject references');
    }

    // Check for specific age references
    if (/\b(age|aged)\s*:?\s*\d+\s*(years?|yrs?|months?|days?)/gi.test(text)) {
      patterns.push('Contains specific age information');
    }

    // Check for specific date references
    if (/\b(admitted|discharged|seen|visited)\s*:?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi.test(text)) {
      patterns.push('Contains specific date references');
    }

    // Check for specific location references
    if (/\b(room|bed|unit|floor)\s*#?\s*\d+/gi.test(text)) {
      patterns.push('Contains specific location information');
    }

    return patterns;
  }

  /**
   * Sanitize text to remove PHI
   */
  private sanitizeText(text: string): string {
    if (!text) return text;

    let sanitized = text;

    // Replace SSN patterns
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
    sanitized = sanitized.replace(/\b\d{9}\b/g, '[SSN]');

    // Replace phone number patterns
    sanitized = sanitized.replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]');
    sanitized = sanitized.replace(/\b\(\d{3}\)\s*\d{3}-\d{4}\b/g, '[PHONE]');

    // Replace email patterns (keep domain, anonymize username)
    sanitized = sanitized.replace(/\b[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, '[EMAIL]@$1');

    // Replace date patterns
    sanitized = sanitized.replace(/\b(0[1-9]|1[0-2])[\/\-](0[1-9]|[12][0-9]|3[01])[\/\-](19|20)\d{2}\b/g, '[DATE]');

    // Replace medical record numbers
    sanitized = sanitized.replace(/\bMRN\s*:?\s*\d+\b/gi, 'MRN: [REDACTED]');
    sanitized = sanitized.replace(/\bMedical\s*Record\s*Number\s*:?\s*\d+\b/gi, 'Medical Record Number: [REDACTED]');

    // Replace patient IDs
    sanitized = sanitized.replace(/\bPatient\s*ID\s*:?\s*\d+\b/gi, 'Patient ID: [REDACTED]');
    sanitized = sanitized.replace(/\bP\s*#\s*:?\s*\d+\b/gi, 'P#: [REDACTED]');

    // Replace address patterns
    sanitized = sanitized.replace(/\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi, '[ADDRESS]');

    // Replace insurance information
    sanitized = sanitized.replace(/\bInsurance\s*:?\s*[A-Za-z0-9\s]+\b/gi, 'Insurance: [REDACTED]');
    sanitized = sanitized.replace(/\bPolicy\s*Number\s*:?\s*[A-Za-z0-9]+\b/gi, 'Policy Number: [REDACTED]');

    // Replace patient/case references
    sanitized = sanitized.replace(/\b(patient|case|subject)\s*#?\s*\d+/gi, '$1 [REDACTED]');

    // Replace age references
    sanitized = sanitized.replace(/\b(age|aged)\s*:?\s*\d+\s*(years?|yrs?|months?|days?)/gi, '$1: [REDACTED] $2');

    // Replace date references
    sanitized = sanitized.replace(/\b(admitted|discharged|seen|visited)\s*:?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi, '$1: [DATE]');

    // Replace location references
    sanitized = sanitized.replace(/\b(room|bed|unit|floor)\s*#?\s*\d+/gi, '$1 [REDACTED]');

    return sanitized;
  }

  /**
   * Generate HIPAA compliance report
   */
  generateComplianceReport(publications: Publication[]): {
    totalPublications: number;
    compliantPublications: number;
    nonCompliantPublications: number;
    highRiskPublications: number;
    mediumRiskPublications: number;
    lowRiskPublications: number;
    commonViolations: Array<{ violation: string; count: number }>;
    recommendations: string[];
  } {
    const checks = publications.map(pub => this.checkForPHI(pub));
    
    const compliantPublications = checks.filter(check => check.isCompliant).length;
    const nonCompliantPublications = checks.filter(check => !check.isCompliant).length;
    
    const highRiskPublications = checks.filter(check => check.riskLevel === 'high').length;
    const mediumRiskPublications = checks.filter(check => check.riskLevel === 'medium').length;
    const lowRiskPublications = checks.filter(check => check.riskLevel === 'low').length;
    
    // Count common violations
    const violationCounts: Record<string, number> = {};
    checks.forEach(check => {
      check.violations.forEach(violation => {
        violationCounts[violation] = (violationCounts[violation] || 0) + 1;
      });
    });
    
    const commonViolations = Object.entries(violationCounts)
      .map(([violation, count]) => ({ violation, count }))
      .sort((a, b) => b.count - a.count);
    
    // Collect all recommendations
    const allRecommendations = checks.flatMap(check => check.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    return {
      totalPublications: publications.length,
      compliantPublications,
      nonCompliantPublications,
      highRiskPublications,
      mediumRiskPublications,
      lowRiskPublications,
      commonViolations,
      recommendations: uniqueRecommendations
    };
  }
}

// Export singleton instance
export const hipaaComplianceService = new HIPAAComplianceService();
