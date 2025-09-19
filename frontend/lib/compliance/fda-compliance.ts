// FDA Compliance Utilities
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

import { Publication } from '@/types/publications';

export interface FDAComplianceCheck {
  isCompliant: boolean;
  violations: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  fdaCategories: string[];
}

export class FDAComplianceService {
  /**
   * Check if a publication is FDA compliant for medical research
   */
  checkFDACompliance(publication: Publication): FDAComplianceCheck {
    const violations: string[] = [];
    const recommendations: string[] = [];
    const fdaCategories: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check for clinical trial references
    if (this.containsClinicalTrialData(publication)) {
      fdaCategories.push('Clinical Trial');
      
      if (!publication.clinical_trial_id) {
        violations.push('Clinical trial data referenced but no clinical trial ID provided');
        recommendations.push('Include FDA clinical trial registration number');
        riskLevel = 'high';
      }
    }

    // Check for drug/device references
    const drugReferences = this.findDrugReferences(publication);
    if (drugReferences.length > 0) {
      fdaCategories.push('Drug Research');
      
      drugReferences.forEach(drug => {
        if (!this.isFDAApprovedDrug(drug)) {
          violations.push(`Unapproved drug reference: ${drug}`);
          recommendations.push('Verify FDA approval status or add appropriate disclaimers');
          riskLevel = 'high';
        }
      });
    }

    const deviceReferences = this.findDeviceReferences(publication);
    if (deviceReferences.length > 0) {
      fdaCategories.push('Medical Device');
      
      deviceReferences.forEach(device => {
        if (!this.isFDAClearedDevice(device)) {
          violations.push(`Uncleared medical device reference: ${device}`);
          recommendations.push('Verify FDA clearance status or add appropriate disclaimers');
          riskLevel = 'high';
        }
      });
    }

    // Check for off-label use claims
    if (this.containsOffLabelClaims(publication)) {
      violations.push('Publication may contain off-label use claims');
      recommendations.push('Add appropriate disclaimers for off-label use');
      riskLevel = 'medium';
    }

    // Check for safety claims
    if (this.containsSafetyClaims(publication)) {
      fdaCategories.push('Safety Data');
      
      if (!this.hasAppropriateSafetyDisclaimers(publication)) {
        violations.push('Safety claims without appropriate disclaimers');
        recommendations.push('Add FDA-required safety disclaimers');
        riskLevel = 'high';
      }
    }

    // Check for efficacy claims
    if (this.containsEfficacyClaims(publication)) {
      fdaCategories.push('Efficacy Data');
      
      if (!this.hasAppropriateEfficacyDisclaimers(publication)) {
        violations.push('Efficacy claims without appropriate disclaimers');
        recommendations.push('Add FDA-required efficacy disclaimers');
        riskLevel = 'medium';
      }
    }

    // Check for adverse event reporting
    if (this.containsAdverseEventData(publication)) {
      fdaCategories.push('Adverse Events');
      
      if (!this.hasAdverseEventDisclaimers(publication)) {
        violations.push('Adverse event data without appropriate disclaimers');
        recommendations.push('Add FDA-required adverse event disclaimers');
        riskLevel = 'high';
      }
    }

    // Check for investigational use
    if (this.containsInvestigationalUse(publication)) {
      fdaCategories.push('Investigational Use');
      
      if (!this.hasInvestigationalDisclaimers(publication)) {
        violations.push('Investigational use without appropriate disclaimers');
        recommendations.push('Add FDA-required investigational use disclaimers');
        riskLevel = 'high';
      }
    }

    // Check for promotional content
    if (this.containsPromotionalContent(publication)) {
      violations.push('Publication may contain promotional content');
      recommendations.push('Ensure content is educational, not promotional');
      riskLevel = 'medium';
    }

    // Check for proper disclaimers
    if (!this.hasRequiredDisclaimers(publication)) {
      violations.push('Missing required FDA disclaimers');
      recommendations.push('Add appropriate FDA disclaimers');
      riskLevel = 'medium';
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendations,
      riskLevel,
      fdaCategories
    };
  }

  /**
   * Check if publication contains clinical trial data
   */
  private containsClinicalTrialData(publication: Publication): boolean {
    const text = `${publication.title} ${publication.abstract || ''}`.toLowerCase();
    
    const clinicalTrialKeywords = [
      'clinical trial',
      'randomized controlled trial',
      'rct',
      'phase i',
      'phase ii',
      'phase iii',
      'phase iv',
      'placebo controlled',
      'double blind',
      'single blind',
      'crossover study',
      'cohort study',
      'case control study',
      'prospective study',
      'retrospective study'
    ];

    return clinicalTrialKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Find drug references in publication
   */
  private findDrugReferences(publication: Publication): string[] {
    const text = `${publication.title} ${publication.abstract || ''}`;
    const drugReferences: string[] = [];
    
    // Common drug name patterns (simplified)
    const drugPatterns = [
      /\b[A-Z][a-z]+(?:mab|nib|zumab|ximab|cept|pib|tinib|sartan|pril|statin|mycin|cycline|pam|zole|idine|pine|sine|dine|tine|zine)\b/g,
      /\b[A-Z][a-z]+\s+\d+\b/g, // Generic names with numbers
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g // Two-word drug names
    ];

    drugPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        drugReferences.push(...matches);
      }
    });

    return [...new Set(drugReferences)]; // Remove duplicates
  }

  /**
   * Find medical device references in publication
   */
  private findDeviceReferences(publication: Publication): string[] {
    const text = `${publication.title} ${publication.abstract || ''}`;
    const deviceReferences: string[] = [];
    
    const deviceKeywords = [
      'stent', 'pacemaker', 'defibrillator', 'catheter', 'implant', 'prosthesis',
      'pacemaker', 'defibrillator', 'stent', 'graft', 'valve', 'lens',
      'surgical', 'device', 'equipment', 'instrument', 'tool', 'apparatus'
    ];

    deviceKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        deviceReferences.push(keyword);
      }
    });

    return [...new Set(deviceReferences)];
  }

  /**
   * Check if drug is FDA approved
   */
  private isFDAApprovedDrug(drugName: string): boolean {
    // This would typically query an FDA database
    // For now, return true for common approved drugs
    const approvedDrugs = [
      'aspirin', 'acetaminophen', 'ibuprofen', 'metformin', 'lisinopril',
      'atorvastatin', 'metoprolol', 'omeprazole', 'simvastatin', 'losartan'
    ];
    
    return approvedDrugs.some(drug => 
      drugName.toLowerCase().includes(drug)
    );
  }

  /**
   * Check if device is FDA cleared
   */
  private isFDAClearedDevice(deviceName: string): boolean {
    // This would typically query an FDA database
    // For now, return true for common cleared devices
    const clearedDevices = [
      'stent', 'pacemaker', 'defibrillator', 'catheter', 'implant'
    ];
    
    return clearedDevices.some(device => 
      deviceName.toLowerCase().includes(device)
    );
  }

  /**
   * Check for off-label use claims
   */
  private containsOffLabelClaims(publication: Publication): boolean {
    const text = `${publication.title} ${publication.abstract || ''}`.toLowerCase();
    
    const offLabelKeywords = [
      'off-label', 'off label', 'unapproved use', 'experimental use',
      'investigational use', 'compassionate use', 'expanded access'
    ];

    return offLabelKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check for safety claims
   */
  private containsSafetyClaims(publication: Publication): boolean {
    const text = `${publication.title} ${publication.abstract || ''}`.toLowerCase();
    
    const safetyKeywords = [
      'safe', 'safety', 'well tolerated', 'adverse events', 'side effects',
      'toxicity', 'tolerability', 'risk', 'benefit', 'harm'
    ];

    return safetyKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check for efficacy claims
   */
  private containsEfficacyClaims(publication: Publication): boolean {
    const text = `${publication.title} ${publication.abstract || ''}`.toLowerCase();
    
    const efficacyKeywords = [
      'effective', 'efficacy', 'efficacious', 'improved', 'better',
      'superior', 'inferior', 'outcome', 'response', 'remission',
      'cure', 'heal', 'treat', 'therapy', 'therapeutic'
    ];

    return efficacyKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check for adverse event data
   */
  private containsAdverseEventData(publication: Publication): boolean {
    const text = `${publication.title} ${publication.abstract || ''}`.toLowerCase();
    
    const adverseEventKeywords = [
      'adverse event', 'adverse reaction', 'side effect', 'toxicity',
      'serious adverse event', 'sae', 'ae', 'adverse drug reaction',
      'adr', 'allergic reaction', 'hypersensitivity'
    ];

    return adverseEventKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check for investigational use
   */
  private containsInvestigationalUse(publication: Publication): boolean {
    const text = `${publication.title} ${publication.abstract || ''}`.toLowerCase();
    
    const investigationalKeywords = [
      'investigational', 'experimental', 'pilot study', 'feasibility study',
      'proof of concept', 'early phase', 'first in human', 'phase 0'
    ];

    return investigationalKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check for promotional content
   */
  private containsPromotionalContent(publication: Publication): boolean {
    const text = `${publication.title} ${publication.abstract || ''}`.toLowerCase();
    
    const promotionalKeywords = [
      'best', 'leading', 'premier', 'superior', 'breakthrough',
      'revolutionary', 'innovative', 'cutting edge', 'state of the art',
      'recommended', 'preferred', 'first choice', 'gold standard'
    ];

    return promotionalKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check if publication has appropriate safety disclaimers
   */
  private hasAppropriateSafetyDisclaimers(publication: Publication): boolean {
    const text = `${publication.title} ${publication.abstract || ''}`.toLowerCase();
    
    const safetyDisclaimers = [
      'not fda approved', 'investigational', 'experimental', 'off-label',
      'safety not established', 'adverse events may occur', 'consult physician'
    ];

    return safetyDisclaimers.some(disclaimer => text.includes(disclaimer));
  }

  /**
   * Check if publication has appropriate efficacy disclaimers
   */
  private hasAppropriateEfficacyDisclaimers(publication: Publication): boolean {
    const text = `${publication.title} ${publication.abstract || ''}`.toLowerCase();
    
    const efficacyDisclaimers = [
      'not fda approved', 'investigational', 'experimental', 'off-label',
      'efficacy not established', 'individual results may vary', 'consult physician'
    ];

    return efficacyDisclaimers.some(disclaimer => text.includes(disclaimer));
  }

  /**
   * Check if publication has adverse event disclaimers
   */
  private hasAdverseEventDisclaimers(publication: Publication): boolean {
    const text = `${publication.title} ${publication.abstract || ''}`.toLowerCase();
    
    const adverseEventDisclaimers = [
      'adverse events may occur', 'serious adverse events', 'consult physician',
      'report adverse events', 'safety monitoring', 'risk benefit assessment'
    ];

    return adverseEventDisclaimers.some(disclaimer => text.includes(disclaimer));
  }

  /**
   * Check if publication has investigational disclaimers
   */
  private hasInvestigationalDisclaimers(publication: Publication): boolean {
    const text = `${publication.title} ${publication.abstract || ''}`.toLowerCase();
    
    const investigationalDisclaimers = [
      'investigational use only', 'not fda approved', 'experimental',
      'safety and efficacy not established', 'for research purposes only'
    ];

    return investigationalDisclaimers.some(disclaimer => text.includes(disclaimer));
  }

  /**
   * Check if publication has required FDA disclaimers
   */
  private hasRequiredDisclaimers(publication: Publication): boolean {
    const text = `${publication.title} ${publication.abstract || ''}`.toLowerCase();
    
    const requiredDisclaimers = [
      'not fda approved', 'investigational', 'experimental', 'off-label',
      'consult physician', 'individual results may vary'
    ];

    return requiredDisclaimers.some(disclaimer => text.includes(disclaimer));
  }

  /**
   * Generate FDA compliance report
   */
  generateComplianceReport(publications: Publication[]): {
    totalPublications: number;
    compliantPublications: number;
    nonCompliantPublications: number;
    highRiskPublications: number;
    mediumRiskPublications: number;
    lowRiskPublications: number;
    fdaCategories: Array<{ category: string; count: number }>;
    commonViolations: Array<{ violation: string; count: number }>;
    recommendations: string[];
  } {
    const checks = publications.map(pub => this.checkFDACompliance(pub));
    
    const compliantPublications = checks.filter(check => check.isCompliant).length;
    const nonCompliantPublications = checks.filter(check => !check.isCompliant).length;
    
    const highRiskPublications = checks.filter(check => check.riskLevel === 'high').length;
    const mediumRiskPublications = checks.filter(check => check.riskLevel === 'medium').length;
    const lowRiskPublications = checks.filter(check => check.riskLevel === 'low').length;
    
    // Count FDA categories
    const categoryCounts: Record<string, number> = {};
    checks.forEach(check => {
      check.fdaCategories.forEach(category => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    });
    
    const fdaCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
    
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
      fdaCategories,
      commonViolations,
      recommendations: uniqueRecommendations
    };
  }
}

// Export singleton instance
export const fdaComplianceService = new FDAComplianceService();
