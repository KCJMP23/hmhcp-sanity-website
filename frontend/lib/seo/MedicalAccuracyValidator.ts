// Medical Accuracy Validator
// Created: 2025-01-27
// Purpose: Advanced medical accuracy validation for healthcare content

export interface MedicalAccuracyResult {
  score: number;
  issues: MedicalAccuracyIssue[];
  recommendations: string[];
  compliance: {
    fda: boolean;
    hipaa: boolean;
    advertising: boolean;
    medicalClaims: boolean;
  };
  contentQuality: {
    medicalTerminology: number;
    citationQuality: number;
    disclaimerCompleteness: number;
    factualAccuracy: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MedicalAccuracyIssue {
  type: 'error' | 'warning' | 'info';
  category: 'terminology' | 'claims' | 'citations' | 'disclaimers' | 'compliance';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fix: string;
  line?: number;
  element?: string;
  suggestedText?: string;
}

export interface MedicalContent {
  title: string;
  content: string;
  url: string;
  contentType: 'article' | 'service' | 'treatment' | 'condition' | 'provider' | 'general';
  medicalSpecialty?: string;
  targetAudience: 'patients' | 'professionals' | 'general' | 'mixed';
}

export class MedicalAccuracyValidator {
  private medicalTerms: Map<string, string[]> = new Map();
  private dangerousClaims: string[] = [];
  private requiredDisclaimers: string[] = [];
  private medicalSpecialties: string[] = [];

  constructor() {
    this.initializeMedicalTerms();
    this.initializeDangerousClaims();
    this.initializeRequiredDisclaimers();
    this.initializeMedicalSpecialties();
  }

  async validateContent(medicalContent: MedicalContent): Promise<MedicalAccuracyResult> {
    const issues: MedicalAccuracyIssue[] = [];
    const recommendations: string[] = [];

    // Validate medical terminology
    const terminologyIssues = this.validateMedicalTerminology(medicalContent);
    issues.push(...terminologyIssues);

    // Validate medical claims
    const claimsIssues = this.validateMedicalClaims(medicalContent);
    issues.push(...claimsIssues);

    // Validate citations and references
    const citationIssues = this.validateCitations(medicalContent);
    issues.push(...citationIssues);

    // Validate disclaimers
    const disclaimerIssues = this.validateDisclaimers(medicalContent);
    issues.push(...disclaimerIssues);

    // Validate compliance requirements
    const complianceIssues = this.validateCompliance(medicalContent);
    issues.push(...complianceIssues);

    // Calculate scores
    const contentQuality = this.calculateContentQuality(medicalContent, issues);
    const compliance = this.calculateCompliance(medicalContent, issues);
    const score = this.calculateOverallScore(contentQuality, compliance, issues);
    const riskLevel = this.determineRiskLevel(score, issues);

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(issues, contentQuality, compliance));

    return {
      score,
      issues,
      recommendations,
      compliance,
      contentQuality,
      riskLevel
    };
  }

  private validateMedicalTerminology(content: MedicalContent): MedicalAccuracyIssue[] {
    const issues: MedicalAccuracyIssue[] = [];
    const text = `${content.title} ${content.content}`.toLowerCase();

    // Check for incorrect medical terminology
    const incorrectTerms = this.findIncorrectMedicalTerms(text);
    incorrectTerms.forEach(term => {
      issues.push({
        type: 'error',
        category: 'terminology',
        title: 'Incorrect Medical Terminology',
        description: `"${term.incorrect}" should be "${term.correct}"`,
        severity: 'high',
        fix: `Replace "${term.incorrect}" with "${term.correct}"`,
        suggestedText: term.correct
      });
    });

    // Check for outdated medical terms
    const outdatedTerms = this.findOutdatedMedicalTerms(text);
    outdatedTerms.forEach(term => {
      issues.push({
        type: 'warning',
        category: 'terminology',
        title: 'Outdated Medical Terminology',
        description: `"${term.outdated}" is outdated, consider using "${term.current}"`,
        severity: 'medium',
        fix: `Update "${term.outdated}" to "${term.current}"`,
        suggestedText: term.current
      });
    });

    // Check for missing medical context
    if (content.contentType === 'treatment' || content.contentType === 'condition') {
      const hasMedicalContext = this.hasMedicalContext(text);
      if (!hasMedicalContext) {
        issues.push({
          type: 'warning',
          category: 'terminology',
          title: 'Missing Medical Context',
          description: 'Medical content should include proper medical terminology and context',
          severity: 'medium',
          fix: 'Add appropriate medical terminology and clinical context'
        });
      }
    }

    return issues;
  }

  private validateMedicalClaims(content: MedicalContent): MedicalAccuracyIssue[] {
    const issues: MedicalAccuracyIssue[] = [];
    const text = content.content.toLowerCase();

    // Check for dangerous medical claims
    this.dangerousClaims.forEach(claim => {
      if (text.includes(claim.toLowerCase())) {
        issues.push({
          type: 'error',
          category: 'claims',
          title: 'Dangerous Medical Claim',
          description: `Content contains potentially dangerous claim: "${claim}"`,
          severity: 'critical',
          fix: 'Remove or modify dangerous medical claims and add appropriate disclaimers'
        });
      }
    });

    // Check for unsubstantiated claims
    const unsubstantiatedClaims = this.findUnsubstantiatedClaims(text);
    unsubstantiatedClaims.forEach(claim => {
      issues.push({
        type: 'warning',
        category: 'claims',
        title: 'Unsubstantiated Medical Claim',
        description: `Claim "${claim}" should be supported by medical evidence`,
        severity: 'high',
        fix: 'Add medical citations or remove unsubstantiated claims'
      });
    });

    // Check for cure claims
    const cureClaims = this.findCureClaims(text);
    cureClaims.forEach(claim => {
      issues.push({
        type: 'error',
        category: 'claims',
        title: 'Unproven Cure Claim',
        description: `"${claim}" - avoid claiming cures without FDA approval`,
        severity: 'critical',
        fix: 'Remove cure claims or add appropriate FDA disclaimers'
      });
    });

    return issues;
  }

  private validateCitations(content: MedicalContent): MedicalAccuracyIssue[] {
    const issues: MedicalAccuracyIssue[] = [];
    const text = content.content;

    // Check for medical citations
    const hasCitations = this.hasMedicalCitations(text);
    if (!hasCitations && (content.contentType === 'treatment' || content.contentType === 'condition')) {
      issues.push({
        type: 'warning',
        category: 'citations',
        title: 'Missing Medical Citations',
        description: 'Medical content should include citations to medical literature',
        severity: 'medium',
        fix: 'Add citations to peer-reviewed medical literature'
      });
    }

    // Check citation quality
    const citationQuality = this.assessCitationQuality(text);
    if (citationQuality.score < 70) {
      issues.push({
        type: 'warning',
        category: 'citations',
        title: 'Low Quality Citations',
        description: `Citation quality score: ${citationQuality.score}/100`,
        severity: 'medium',
        fix: 'Use peer-reviewed medical literature and recent studies'
      });
    }

    // Check for outdated citations
    const outdatedCitations = this.findOutdatedCitations(text);
    if (outdatedCitations.length > 0) {
      issues.push({
        type: 'info',
        category: 'citations',
        title: 'Outdated Citations',
        description: `${outdatedCitations.length} citations are older than 5 years`,
        severity: 'low',
        fix: 'Update citations with more recent medical literature'
      });
    }

    return issues;
  }

  private validateDisclaimers(content: MedicalContent): MedicalAccuracyIssue[] {
    const issues: MedicalAccuracyIssue[] = [];
    const text = content.content.toLowerCase();

    // Check for required disclaimers
    this.requiredDisclaimers.forEach(disclaimer => {
      if (!text.includes(disclaimer.toLowerCase())) {
        issues.push({
          type: 'error',
          category: 'disclaimers',
          title: 'Missing Required Disclaimer',
          description: `Required disclaimer not found: "${disclaimer}"`,
          severity: 'high',
          fix: `Add the required disclaimer: "${disclaimer}"`
        });
      }
    });

    // Check for medical advice disclaimer
    if (content.contentType === 'treatment' || content.contentType === 'condition') {
      const hasMedicalAdviceDisclaimer = this.hasMedicalAdviceDisclaimer(text);
      if (!hasMedicalAdviceDisclaimer) {
        issues.push({
          type: 'error',
          category: 'disclaimers',
          title: 'Missing Medical Advice Disclaimer',
          description: 'Medical content must include a disclaimer about not providing medical advice',
          severity: 'critical',
          fix: 'Add a clear medical advice disclaimer'
        });
      }
    }

    // Check disclaimer placement
    const disclaimerPlacement = this.checkDisclaimerPlacement(content.content);
    if (!disclaimerPlacement.visible) {
      issues.push({
        type: 'warning',
        category: 'disclaimers',
        title: 'Disclaimer Not Visible',
        description: 'Important disclaimers should be prominently displayed',
        severity: 'medium',
        fix: 'Move disclaimers to a more visible location'
      });
    }

    return issues;
  }

  private validateCompliance(content: MedicalContent): MedicalAccuracyIssue[] {
    const issues: MedicalAccuracyIssue[] = [];
    const text = content.content.toLowerCase();

    // FDA compliance check
    const fdaCompliant = this.checkFDACompliance(text, content.contentType);
    if (!fdaCompliant.compliant) {
      issues.push({
        type: 'error',
        category: 'compliance',
        title: 'FDA Compliance Issue',
        description: fdaCompliant.issue,
        severity: 'critical',
        fix: fdaCompliant.fix
      });
    }

    // HIPAA compliance check
    const hipaaCompliant = this.checkHIPAACompliance(text);
    if (!hipaaCompliant.compliant) {
      issues.push({
        type: 'error',
        category: 'compliance',
        title: 'HIPAA Compliance Issue',
        description: hipaaCompliant.issue,
        severity: 'critical',
        fix: hipaaCompliant.fix
      });
    }

    // Advertising compliance check
    const advertisingCompliant = this.checkAdvertisingCompliance(text, content.contentType);
    if (!advertisingCompliant.compliant) {
      issues.push({
        type: 'warning',
        category: 'compliance',
        title: 'Advertising Compliance Issue',
        description: advertisingCompliant.issue,
        severity: 'high',
        fix: advertisingCompliant.fix
      });
    }

    return issues;
  }

  private calculateContentQuality(content: MedicalContent, issues: MedicalAccuracyIssue[]): {
    medicalTerminology: number;
    citationQuality: number;
    disclaimerCompleteness: number;
    factualAccuracy: number;
  } {
    const terminologyIssues = issues.filter(issue => issue.category === 'terminology');
    const citationIssues = issues.filter(issue => issue.category === 'citations');
    const disclaimerIssues = issues.filter(issue => issue.category === 'disclaimers');
    const claimsIssues = issues.filter(issue => issue.category === 'claims');

    return {
      medicalTerminology: Math.max(0, 100 - (terminologyIssues.length * 15)),
      citationQuality: Math.max(0, 100 - (citationIssues.length * 20)),
      disclaimerCompleteness: Math.max(0, 100 - (disclaimerIssues.length * 25)),
      factualAccuracy: Math.max(0, 100 - (claimsIssues.length * 30))
    };
  }

  private calculateCompliance(content: MedicalContent, issues: MedicalAccuracyIssue[]): {
    fda: boolean;
    hipaa: boolean;
    advertising: boolean;
    medicalClaims: boolean;
  } {
    const complianceIssues = issues.filter(issue => issue.category === 'compliance');
    const claimsIssues = issues.filter(issue => issue.category === 'claims');

    return {
      fda: !complianceIssues.some(issue => issue.title.includes('FDA')),
      hipaa: !complianceIssues.some(issue => issue.title.includes('HIPAA')),
      advertising: !complianceIssues.some(issue => issue.title.includes('Advertising')),
      medicalClaims: claimsIssues.length === 0
    };
  }

  private calculateOverallScore(
    contentQuality: any,
    compliance: any,
    issues: MedicalAccuracyIssue[]
  ): number {
    const weights = {
      terminology: 0.25,
      citations: 0.20,
      disclaimers: 0.25,
      accuracy: 0.30
    };

    const weightedScore = 
      (contentQuality.medicalTerminology * weights.terminology) +
      (contentQuality.citationQuality * weights.citations) +
      (contentQuality.disclaimerCompleteness * weights.disclaimers) +
      (contentQuality.factualAccuracy * weights.accuracy);

    // Apply compliance penalty
    const compliancePenalty = Object.values(compliance).filter(Boolean).length * 10;
    
    return Math.max(0, Math.round(weightedScore - compliancePenalty));
  }

  private determineRiskLevel(score: number, issues: MedicalAccuracyIssue[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
    const highIssues = issues.filter(issue => issue.severity === 'high').length;

    if (criticalIssues > 0 || score < 30) return 'critical';
    if (highIssues > 2 || score < 50) return 'high';
    if (highIssues > 0 || score < 70) return 'medium';
    return 'low';
  }

  private generateRecommendations(
    issues: MedicalAccuracyIssue[],
    contentQuality: any,
    compliance: any
  ): string[] {
    const recommendations: string[] = [];

    if (contentQuality.medicalTerminology < 70) {
      recommendations.push('Improve medical terminology accuracy and consistency');
    }

    if (contentQuality.citationQuality < 70) {
      recommendations.push('Add more high-quality medical citations and references');
    }

    if (contentQuality.disclaimerCompleteness < 70) {
      recommendations.push('Ensure all required disclaimers are present and visible');
    }

    if (contentQuality.factualAccuracy < 70) {
      recommendations.push('Review and verify all medical claims for accuracy');
    }

    if (!compliance.fda) {
      recommendations.push('Address FDA compliance requirements for medical content');
    }

    if (!compliance.hipaa) {
      recommendations.push('Ensure HIPAA compliance in all content');
    }

    if (!compliance.advertising) {
      recommendations.push('Review healthcare advertising compliance guidelines');
    }

    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`Address ${criticalIssues.length} critical medical accuracy issues immediately`);
    }

    return recommendations;
  }

  // Helper methods
  private initializeMedicalTerms(): void {
    this.medicalTerms.set('incorrect', [
      { incorrect: 'heart attack', correct: 'myocardial infarction' },
      { incorrect: 'stroke', correct: 'cerebrovascular accident' },
      { incorrect: 'high blood pressure', correct: 'hypertension' },
      { incorrect: 'diabetes', correct: 'diabetes mellitus' },
      { incorrect: 'cancer', correct: 'malignancy' }
    ]);

    this.medicalTerms.set('outdated', [
      { outdated: 'lunatic', current: 'person with mental illness' },
      { outdated: 'retarded', current: 'intellectually disabled' },
      { outdated: 'crippled', current: 'person with disability' }
    ]);
  }

  private initializeDangerousClaims(): void {
    this.dangerousClaims = [
      'cures all diseases',
      'guaranteed cure',
      'miracle treatment',
      '100% effective',
      'no side effects',
      'instant results',
      'permanent cure',
      'secret formula',
      'doctor recommended without evidence',
      'FDA approved for all conditions'
    ];
  }

  private initializeRequiredDisclaimers(): void {
    this.requiredDisclaimers = [
      'not medical advice',
      'consult your doctor',
      'seek medical attention',
      'individual results may vary',
      'not a substitute for professional medical care'
    ];
  }

  private initializeMedicalSpecialties(): void {
    this.medicalSpecialties = [
      'cardiology', 'oncology', 'neurology', 'orthopedics', 'dermatology',
      'pediatrics', 'mental-health', 'emergency-medicine', 'internal-medicine'
    ];
  }

  private findIncorrectMedicalTerms(text: string): any[] {
    const incorrectTerms = this.medicalTerms.get('incorrect') || [];
    return incorrectTerms.filter(term => text.includes(term.incorrect));
  }

  private findOutdatedMedicalTerms(text: string): any[] {
    const outdatedTerms = this.medicalTerms.get('outdated') || [];
    return outdatedTerms.filter(term => text.includes(term.outdated));
  }

  private hasMedicalContext(text: string): boolean {
    const medicalKeywords = ['diagnosis', 'treatment', 'symptoms', 'clinical', 'patient', 'medical'];
    return medicalKeywords.some(keyword => text.includes(keyword));
  }

  private findUnsubstantiatedClaims(text: string): string[] {
    const unsubstantiatedPatterns = [
      'proven to work',
      'scientifically proven',
      'clinically tested',
      'studies show',
      'research indicates'
    ];
    
    return unsubstantiatedPatterns.filter(pattern => 
      text.includes(pattern) && !this.hasSupportingCitations(text, pattern)
    );
  }

  private findCureClaims(text: string): string[] {
    const curePatterns = [
      'cures',
      'heals completely',
      'eliminates',
      'permanently fixes',
      'completely resolves'
    ];
    
    return curePatterns.filter(pattern => text.includes(pattern));
  }

  private hasMedicalCitations(text: string): boolean {
    const citationPatterns = [
      /\[.*?\]/g, // [1], [2], etc.
      /\(.*?\d{4}.*?\)/g, // (Smith, 2023)
      /doi:/gi,
      /pubmed/gi,
      /journal/gi,
      /study/gi
    ];
    
    return citationPatterns.some(pattern => pattern.test(text));
  }

  private assessCitationQuality(text: string): { score: number } {
    let score = 0;
    
    if (text.includes('doi:')) score += 30;
    if (text.includes('pubmed')) score += 25;
    if (text.includes('journal')) score += 20;
    if (text.includes('peer-reviewed')) score += 15;
    if (text.includes('clinical trial')) score += 10;
    
    return { score: Math.min(100, score) };
  }

  private findOutdatedCitations(text: string): string[] {
    const currentYear = new Date().getFullYear();
    const yearRegex = /\b(20\d{2})\b/g;
    const years = text.match(yearRegex);
    
    if (!years) return [];
    
    return years.filter(year => currentYear - parseInt(year) > 5);
  }

  private hasMedicalAdviceDisclaimer(text: string): boolean {
    const disclaimerPatterns = [
      'not medical advice',
      'not a substitute for medical advice',
      'consult your healthcare provider',
      'seek professional medical advice'
    ];
    
    return disclaimerPatterns.some(pattern => text.toLowerCase().includes(pattern));
  }

  private checkDisclaimerPlacement(content: string): { visible: boolean } {
    // Check if disclaimers are in the first 200 characters or last 200 characters
    const first200 = content.substring(0, 200).toLowerCase();
    const last200 = content.substring(content.length - 200).toLowerCase();
    
    const hasEarlyDisclaimer = this.requiredDisclaimers.some(disclaimer => 
      first200.includes(disclaimer.toLowerCase())
    );
    
    const hasLateDisclaimer = this.requiredDisclaimers.some(disclaimer => 
      last200.includes(disclaimer.toLowerCase())
    );
    
    return { visible: hasEarlyDisclaimer || hasLateDisclaimer };
  }

  private checkFDACompliance(text: string, contentType: string): { compliant: boolean; issue: string; fix: string } {
    if (contentType === 'treatment' && text.includes('fda approved')) {
      return {
        compliant: false,
        issue: 'FDA approval claims must be specific and accurate',
        fix: 'Specify exact FDA approval status and conditions'
      };
    }
    
    return { compliant: true, issue: '', fix: '' };
  }

  private checkHIPAACompliance(text: string): { compliant: boolean; issue: string; fix: string } {
    const hipaaViolations = [
      'patient name',
      'medical record number',
      'social security number',
      'date of birth'
    ];
    
    const hasViolation = hipaaViolations.some(violation => 
      text.toLowerCase().includes(violation)
    );
    
    if (hasViolation) {
      return {
        compliant: false,
        issue: 'Content may contain protected health information',
        fix: 'Remove or anonymize all protected health information'
      };
    }
    
    return { compliant: true, issue: '', fix: '' };
  }

  private checkAdvertisingCompliance(text: string, contentType: string): { compliant: boolean; issue: string; fix: string } {
    if (contentType === 'service' && text.includes('best') && !text.includes('disclaimer')) {
      return {
        compliant: false,
        issue: 'Superlative claims require disclaimers',
        fix: 'Add appropriate disclaimers for advertising claims'
      };
    }
    
    return { compliant: true, issue: '', fix: '' };
  }

  private hasSupportingCitations(text: string, claim: string): boolean {
    // Simplified check - in real implementation, would analyze citation context
    return text.includes('[') || text.includes('(') || text.includes('doi');
  }
}
