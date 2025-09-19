/**
 * Compliance Validator
 * HMHCP Healthcare AI Platform
 * 
 * Comprehensive compliance validation for healthcare content including
 * HIPAA, FDA guidelines, medical ethics, and regulatory standards.
 */

import { ValidationResult, ValidationError, ValidationWarning, ValidationSuggestion } from './medical-validator';

export interface ComplianceRule {
  id: string;
  name: string;
  category: 'hipaa' | 'fda' | 'ethics' | 'regulatory' | 'accessibility' | 'privacy';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  regulation: string;
  section?: string;
  requirements: string[];
  violations: string[];
  remediation: string[];
  lastUpdated: Date;
  enforcementAuthority: string;
}

export interface ComplianceContext {
  contentType: 'marketing' | 'educational' | 'clinical' | 'research' | 'promotional';
  targetAudience: 'patient' | 'provider' | 'researcher' | 'general_public';
  distributionChannel: 'website' | 'email' | 'print' | 'social_media' | 'app';
  containsPersonalInfo: boolean;
  containsDrugInfo: boolean;
  containsMedicalClaims: boolean;
  containsFinancialInfo: boolean;
  jurisdiction: string[];
  publicationDate?: Date;
  lastReviewDate?: Date;
}

export interface HIPAAAssessment {
  containsPHI: boolean;
  phiElements: string[];
  requiresAuthorization: boolean;
  minimumNecessary: boolean;
  safeguardsInPlace: boolean;
  breachRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface FDAComplianceCheck {
  drugAdvertising: boolean;
  medicalDevicePromotion: boolean;
  unsubstantiatedClaims: string[];
  missingDisclosures: string[];
  fairBalance: boolean;
  appropriateAudience: boolean;
  truthfulNonMisleading: boolean;
  regulatoryViolations: string[];
}

export interface AccessibilityCompliance {
  wcagLevel: 'A' | 'AA' | 'AAA';
  violations: AccessibilityViolation[];
  improvements: AccessibilityImprovement[];
  score: number;
}

export interface AccessibilityViolation {
  rule: string;
  severity: 'error' | 'warning' | 'notice';
  element: string;
  description: string;
  remediation: string;
}

export interface AccessibilityImprovement {
  area: string;
  suggestion: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
}

/**
 * Compliance Validator Class
 * Provides comprehensive compliance validation across multiple standards
 */
export class ComplianceValidator {
  private complianceRules: Map<string, ComplianceRule>;
  private phiPatterns: RegExp[];
  private fdaKeywords: Map<string, string[]>;
  private prohibitedClaims: string[];
  private accessibilityRules: Map<string, AccessibilityRule>;

  constructor() {
    this.complianceRules = new Map();
    this.phiPatterns = [];
    this.fdaKeywords = new Map();
    this.prohibitedClaims = [];
    this.accessibilityRules = new Map();
    
    this.initializeComplianceRules();
  }

  /**
   * Comprehensive compliance validation
   */
  async validateCompliance(
    content: string,
    context: ComplianceContext
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      // HIPAA Compliance Check
      const hipaaResults = await this.validateHIPAACompliance(content, context);
      errors.push(...hipaaResults.errors);
      warnings.push(...hipaaResults.warnings);
      suggestions.push(...hipaaResults.suggestions);

      // FDA Compliance Check
      if (context.containsDrugInfo || context.contentType === 'promotional') {
        const fdaResults = await this.validateFDACompliance(content, context);
        errors.push(...fdaResults.errors);
        warnings.push(...fdaResults.warnings);
        suggestions.push(...fdaResults.suggestions);
      }

      // Medical Ethics Check
      const ethicsResults = await this.validateMedicalEthics(content, context);
      warnings.push(...ethicsResults.warnings);
      suggestions.push(...ethicsResults.suggestions);

      // Accessibility Compliance Check
      if (context.distributionChannel === 'website' || context.distributionChannel === 'app') {
        const accessibilityResults = await this.validateAccessibility(content);
        warnings.push(...accessibilityResults.warnings);
        suggestions.push(...accessibilityResults.suggestions);
      }

      // Privacy Compliance Check
      const privacyResults = await this.validatePrivacyCompliance(content, context);
      errors.push(...privacyResults.errors);
      warnings.push(...privacyResults.warnings);

      // Regulatory Compliance Check
      const regulatoryResults = await this.validateRegulatoryCompliance(content, context);
      errors.push(...regulatoryResults.errors);
      warnings.push(...regulatoryResults.warnings);

      const confidence = this.calculateComplianceConfidence(errors, warnings);

      return {
        isValid: errors.filter(e => e.severity === 'critical').length === 0,
        severity: this.getHighestSeverity(errors),
        confidence,
        errors,
        warnings,
        suggestions,
        auditTrail: [{
          timestamp: new Date(),
          validationType: 'compliance_validation',
          result: errors.length > 0 ? 'fail' : (warnings.length > 0 ? 'warning' : 'pass'),
          details: `Validated compliance for ${context.contentType} content targeting ${context.targetAudience}`
        }]
      };

    } catch (error) {
      return {
        isValid: false,
        severity: 'critical',
        confidence: 0,
        errors: [{
          code: 'COMPLIANCE_VALIDATION_ERROR',
          message: 'Failed to validate compliance',
          field: 'content',
          severity: 'critical',
          confidence: 1
        }],
        warnings: [],
        suggestions: [],
        auditTrail: [{
          timestamp: new Date(),
          validationType: 'compliance_validation',
          result: 'fail',
          details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  /**
   * HIPAA Compliance Validation
   */
  async validateHIPAACompliance(
    content: string, 
    context: ComplianceContext
  ): Promise<Partial<ValidationResult>> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Check for PHI patterns
    const phiDetection = this.detectPHI(content);
    
    if (phiDetection.containsPHI) {
      errors.push({
        code: 'PHI_DETECTED',
        message: `Potential PHI detected: ${phiDetection.phiElements.join(', ')}`,
        field: 'content',
        severity: 'critical',
        correction: 'Remove or de-identify personal health information',
        confidence: 0.9
      });

      suggestions.push({
        type: 'compliance',
        original: 'Content with PHI',
        suggested: 'De-identified content',
        reason: 'HIPAA requires protection of PHI',
        confidence: 0.95
      });
    }

    // Check minimum necessary standard
    if (context.containsPersonalInfo && !this.meetsMinimumNecessary(content, context)) {
      warnings.push({
        code: 'MINIMUM_NECESSARY_VIOLATION',
        message: 'Content may not meet HIPAA minimum necessary standard',
        field: 'content',
        recommendation: 'Ensure only necessary information is included'
      });
    }

    // Check for appropriate safeguards
    if (context.distributionChannel === 'email' && context.containsPersonalInfo) {
      warnings.push({
        code: 'TRANSMISSION_SAFEGUARDS',
        message: 'Email transmission of health information requires encryption',
        field: 'distribution',
        recommendation: 'Use encrypted email or secure messaging system'
      });
    }

    // Business Associate Agreement check
    if (context.distributionChannel === 'website' && context.containsPersonalInfo) {
      warnings.push({
        code: 'BAA_REQUIRED',
        message: 'Business Associate Agreement may be required for third-party services',
        field: 'legal',
        recommendation: 'Verify BAA coverage for all third-party services processing PHI'
      });
    }

    return { errors, warnings, suggestions };
  }

  /**
   * FDA Compliance Validation
   */
  async validateFDACompliance(
    content: string, 
    context: ComplianceContext
  ): Promise<Partial<ValidationResult>> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Check for unsubstantiated claims
    const unsubstantiatedClaims = this.findUnsubstantiatedClaims(content);
    if (unsubstantiatedClaims.length > 0) {
      unsubstantiatedClaims.forEach(claim => {
        errors.push({
          code: 'UNSUBSTANTIATED_CLAIM',
          message: `Unsubstantiated medical claim: "${claim}"`,
          field: 'content',
          severity: 'major',
          correction: 'Provide evidence or remove claim',
          confidence: 0.8
        });
      });
    }

    // Check for fair balance (for drug advertising)
    if (context.containsDrugInfo && context.contentType === 'promotional') {
      const fairBalanceResult = this.checkFairBalance(content);
      if (!fairBalanceResult.hasBalance) {
        errors.push({
          code: 'FAIR_BALANCE_VIOLATION',
          message: 'Drug promotion lacks fair balance between benefits and risks',
          field: 'content',
          severity: 'major',
          correction: 'Include balanced information about risks and side effects',
          confidence: 0.85
        });
      }
    }

    // Check for required disclosures
    const missingDisclosures = this.checkRequiredDisclosures(content, context);
    if (missingDisclosures.length > 0) {
      missingDisclosures.forEach(disclosure => {
        warnings.push({
          code: 'MISSING_DISCLOSURE',
          message: `Missing required disclosure: ${disclosure}`,
          field: 'content',
          recommendation: 'Add required FDA disclosure statements'
        });
      });
    }

    // Check for prohibited language
    const prohibitedTerms = this.findProhibitedFDATerms(content);
    if (prohibitedTerms.length > 0) {
      prohibitedTerms.forEach(term => {
        errors.push({
          code: 'PROHIBITED_FDA_TERM',
          message: `Prohibited term detected: "${term}"`,
          field: 'content',
          severity: 'major',
          correction: 'Replace with FDA-compliant language',
          confidence: 0.9
        });
      });
    }

    // Check target audience appropriateness
    if (context.targetAudience === 'patient' && this.containsProfessionalOnlyInfo(content)) {
      warnings.push({
        code: 'INAPPROPRIATE_AUDIENCE',
        message: 'Content contains professional-only information targeted at patients',
        field: 'content',
        recommendation: 'Ensure content is appropriate for intended audience'
      });
    }

    return { errors, warnings, suggestions };
  }

  /**
   * Medical Ethics Validation
   */
  async validateMedicalEthics(
    content: string, 
    context: ComplianceContext
  ): Promise<Partial<ValidationResult>> {
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Check for informed consent principles
    if (context.containsMedicalClaims && context.targetAudience === 'patient') {
      const informedConsentCheck = this.checkInformedConsentPrinciples(content);
      if (!informedConsentCheck.adequate) {
        warnings.push({
          code: 'INFORMED_CONSENT_ISSUE',
          message: 'Content may not adequately support informed decision-making',
          field: 'content',
          recommendation: 'Include risks, benefits, and alternatives information'
        });
      }
    }

    // Check for cultural sensitivity
    const culturalSensitivityIssues = this.checkCulturalSensitivity(content);
    if (culturalSensitivityIssues.length > 0) {
      culturalSensitivityIssues.forEach(issue => {
        warnings.push({
          code: 'CULTURAL_SENSITIVITY',
          message: `Potential cultural sensitivity issue: ${issue}`,
          field: 'content',
          recommendation: 'Review content for cultural appropriateness'
        });
      });
    }

    // Check for health equity considerations
    const equityIssues = this.checkHealthEquity(content);
    if (equityIssues.length > 0) {
      equityIssues.forEach(issue => {
        suggestions.push({
          type: 'ethics',
          original: issue.problematic,
          suggested: issue.improved,
          reason: 'Promote health equity and inclusion',
          confidence: 0.7
        });
      });
    }

    // Check for paternalistic language
    const paternalisticLanguage = this.findPaternalisticLanguage(content);
    if (paternalisticLanguage.length > 0) {
      paternalisticLanguage.forEach(phrase => {
        suggestions.push({
          type: 'ethics',
          original: phrase,
          suggested: 'Patient-empowering language',
          reason: 'Support patient autonomy and empowerment',
          confidence: 0.8
        });
      });
    }

    return { warnings, suggestions };
  }

  /**
   * Accessibility Compliance Validation
   */
  async validateAccessibility(content: string): Promise<Partial<ValidationResult>> {
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Check for alt text requirements
    const imagePatterns = /<img[^>]*>/gi;
    const images = content.match(imagePatterns) || [];
    
    images.forEach(img => {
      if (!img.includes('alt=')) {
        warnings.push({
          code: 'MISSING_ALT_TEXT',
          message: 'Image missing alt text for screen readers',
          field: 'content',
          recommendation: 'Add descriptive alt text to all images'
        });
      }
    });

    // Check heading structure
    const headingIssues = this.checkHeadingStructure(content);
    if (headingIssues.length > 0) {
      headingIssues.forEach(issue => {
        warnings.push({
          code: 'HEADING_STRUCTURE',
          message: issue,
          field: 'content',
          recommendation: 'Ensure proper heading hierarchy (h1, h2, h3, etc.)'
        });
      });
    }

    // Check color contrast (simplified check for color-only information)
    if (content.includes('color:') || content.includes('style=')) {
      warnings.push({
        code: 'COLOR_ACCESSIBILITY',
        message: 'Verify color contrast meets WCAG standards',
        field: 'styling',
        recommendation: 'Test color contrast ratio (4.5:1 for normal text, 3:1 for large text)'
      });
    }

    // Check for descriptive link text
    const linkPatterns = /<a[^>]*>([^<]+)<\/a>/gi;
    const links = [...content.matchAll(linkPatterns)];
    
    links.forEach(link => {
      const linkText = link[1].toLowerCase();
      if (linkText.includes('click here') || linkText.includes('read more') || linkText.includes('here')) {
        suggestions.push({
          type: 'accessibility',
          original: linkText,
          suggested: 'Descriptive link text',
          reason: 'Screen readers need descriptive link text for context',
          confidence: 0.9
        });
      }
    });

    return { warnings, suggestions };
  }

  /**
   * Privacy Compliance Validation
   */
  async validatePrivacyCompliance(
    content: string, 
    context: ComplianceContext
  ): Promise<Partial<ValidationResult>> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for personal identifiers
    const personalIdentifiers = this.findPersonalIdentifiers(content);
    if (personalIdentifiers.length > 0) {
      personalIdentifiers.forEach(identifier => {
        errors.push({
          code: 'PERSONAL_IDENTIFIER',
          message: `Personal identifier detected: ${identifier.type}`,
          field: 'content',
          severity: 'major',
          correction: 'Remove or pseudonymize personal identifiers',
          confidence: 0.85
        });
      });
    }

    // Check for tracking/analytics compliance
    if (context.distributionChannel === 'website') {
      warnings.push({
        code: 'PRIVACY_POLICY_REQUIRED',
        message: 'Website content may require privacy policy disclosure',
        field: 'legal',
        recommendation: 'Ensure privacy policy covers data collection and use'
      });
    }

    // Check for GDPR compliance (if applicable)
    if (context.jurisdiction.includes('EU') || context.jurisdiction.includes('EEA')) {
      const gdprIssues = this.checkGDPRCompliance(content, context);
      warnings.push(...gdprIssues);
    }

    return { errors, warnings };
  }

  /**
   * Regulatory Compliance Validation
   */
  async validateRegulatoryCompliance(
    content: string, 
    context: ComplianceContext
  ): Promise<Partial<ValidationResult>> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for required disclaimers
    const requiredDisclaimers = this.getRequiredDisclaimers(context);
    const missingDisclaimers = requiredDisclaimers.filter(
      disclaimer => !content.toLowerCase().includes(disclaimer.text.toLowerCase())
    );

    if (missingDisclaimers.length > 0) {
      missingDisclaimers.forEach(disclaimer => {
        warnings.push({
          code: 'MISSING_DISCLAIMER',
          message: `Missing required disclaimer: ${disclaimer.name}`,
          field: 'content',
          recommendation: `Add disclaimer: ${disclaimer.text}`
        });
      });
    }

    // Check for professional licensing requirements
    if (context.contentType === 'clinical' && context.targetAudience === 'patient') {
      const licensingCheck = this.checkProfessionalLicensing(content);
      if (!licensingCheck.adequate) {
        warnings.push({
          code: 'LICENSING_DISCLOSURE',
          message: 'Clinical content may require professional licensing disclosure',
          field: 'content',
          recommendation: 'Include appropriate professional credentials and licensing information'
        });
      }
    }

    // Check for financial disclosure requirements
    if (context.containsFinancialInfo || context.contentType === 'research') {
      const financialDisclosures = this.checkFinancialDisclosures(content);
      if (!financialDisclosures.adequate) {
        warnings.push({
          code: 'FINANCIAL_DISCLOSURE',
          message: 'Content may require financial conflict of interest disclosure',
          field: 'content',
          recommendation: 'Include relevant financial disclosures and potential conflicts of interest'
        });
      }
    }

    return { errors, warnings };
  }

  // Private helper methods

  private initializeComplianceRules(): void {
    this.initializeHIPAARules();
    this.initializeFDARules();
    this.initializeAccessibilityRules();
    this.initializePHIPatterns();
  }

  private initializeHIPAARules(): void {
    const hipaaRules: ComplianceRule[] = [
      {
        id: 'HIPAA_164_502',
        name: 'Minimum Necessary Standard',
        category: 'hipaa',
        severity: 'major',
        description: 'Covered entities must limit use and disclosure of PHI to minimum necessary',
        regulation: '45 CFR 164.502(b)',
        section: '164.502(b)',
        requirements: [
          'Identify minimum PHI needed for purpose',
          'Limit access to minimum necessary',
          'Implement policies for minimum necessary determinations'
        ],
        violations: [
          'Unnecessary PHI disclosure',
          'Blanket access to all PHI',
          'Lack of minimum necessary policies'
        ],
        remediation: [
          'Implement minimum necessary policies',
          'Train workforce on minimum necessary standards',
          'Review and limit PHI access'
        ],
        lastUpdated: new Date('2024-01-01'),
        enforcementAuthority: 'HHS Office for Civil Rights'
      },
      {
        id: 'HIPAA_164_530',
        name: 'Administrative Safeguards',
        category: 'hipaa',
        severity: 'critical',
        description: 'Administrative safeguards to protect PHI',
        regulation: '45 CFR 164.530',
        requirements: [
          'Designate privacy officer',
          'Implement workforce training',
          'Establish access management procedures'
        ],
        violations: [
          'No designated privacy officer',
          'Inadequate workforce training',
          'Poor access management'
        ],
        remediation: [
          'Designate qualified privacy officer',
          'Implement comprehensive training program',
          'Establish access management procedures'
        ],
        lastUpdated: new Date('2024-01-01'),
        enforcementAuthority: 'HHS Office for Civil Rights'
      }
    ];

    hipaaRules.forEach(rule => {
      this.complianceRules.set(rule.id, rule);
    });
  }

  private initializeFDARules(): void {
    const fdaKeywords = new Map<string, string[]>();
    
    fdaKeywords.set('prohibited_claims', [
      'cure', 'miracle', 'breakthrough', 'revolutionary', 'fountain of youth',
      'magic bullet', 'instant cure', 'guaranteed cure', 'wonder drug'
    ]);
    
    fdaKeywords.set('unsubstantiated_claims', [
      'proven to', 'scientific studies show', 'clinically proven',
      'research confirms', 'studies demonstrate'
    ]);
    
    fdaKeywords.set('required_disclosures', [
      'individual results may vary',
      'consult your healthcare provider',
      'not intended to diagnose, treat, cure, or prevent'
    ]);

    this.fdaKeywords = fdaKeywords;

    this.prohibitedClaims = [
      'cures cancer',
      'miracle cure',
      'breakthrough treatment',
      'fountain of youth',
      'instant relief',
      'guaranteed results',
      'scientific breakthrough',
      'medical miracle'
    ];
  }

  private initializeAccessibilityRules(): void {
    const accessibilityRules: AccessibilityRule[] = [
      {
        id: 'WCAG_1_1_1',
        name: 'Non-text Content',
        level: 'A',
        description: 'All non-text content has text alternative',
        checkFunction: (content: string) => {
          const images = content.match(/<img[^>]*>/gi) || [];
          return images.every(img => img.includes('alt='));
        }
      },
      {
        id: 'WCAG_1_3_1',
        name: 'Info and Relationships',
        level: 'A',
        description: 'Information and relationships conveyed through presentation can be programmatically determined',
        checkFunction: (content: string) => {
          // Simplified check for heading structure
          const headings = content.match(/<h[1-6][^>]*>/gi) || [];
          return headings.length > 0;
        }
      }
    ];

    accessibilityRules.forEach(rule => {
      this.accessibilityRules.set(rule.id, rule);
    });
  }

  private initializePHIPatterns(): void {
    this.phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b[A-Za-z]{2}\d{6,8}\b/g, // Medical record numbers
      /\b\d{10,}\b/g, // Account numbers
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // Dates
      /\b[A-Za-z]+ [A-Za-z]+ (Dr\.|MD|RN|NP)\b/gi, // Provider names with titles
      /\b\d{5}(-\d{4})?\b/g, // ZIP codes
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g // Email addresses
    ];
  }

  private detectPHI(content: string): { containsPHI: boolean; phiElements: string[] } {
    const phiElements: string[] = [];
    
    this.phiPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        const elementTypes = [
          'Social Security Number',
          'Medical Record Number',
          'Account Number',
          'Date',
          'Provider Name',
          'ZIP Code',
          'Email Address'
        ];
        phiElements.push(elementTypes[index] || 'Unknown PHI');
      }
    });

    return {
      containsPHI: phiElements.length > 0,
      phiElements
    };
  }

  private meetsMinimumNecessary(content: string, context: ComplianceContext): boolean {
    // Simplified check - in production, this would be more sophisticated
    const unnecessaryPatterns = [
      /all patient records/gi,
      /complete medical history/gi,
      /full patient information/gi
    ];

    return !unnecessaryPatterns.some(pattern => pattern.test(content));
  }

  private findUnsubstantiatedClaims(content: string): string[] {
    const claims: string[] = [];
    const unsubstantiatedPatterns = this.fdaKeywords.get('unsubstantiated_claims') || [];
    
    unsubstantiatedPatterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b[^.!?]*[.!?]`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        claims.push(...matches);
      }
    });

    return claims;
  }

  private checkFairBalance(content: string): { hasBalance: boolean; issues: string[] } {
    const benefitKeywords = ['effective', 'benefit', 'improve', 'better', 'relief'];
    const riskKeywords = ['side effect', 'risk', 'adverse', 'warning', 'caution', 'contraindication'];
    
    const benefits = benefitKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    ).length;
    
    const risks = riskKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    ).length;

    const hasBalance = risks > 0 && (risks / Math.max(benefits, 1)) >= 0.3;
    
    const issues: string[] = [];
    if (benefits > 0 && risks === 0) {
      issues.push('No risk information provided');
    }
    if (hasBalance && (risks / benefits) < 0.3) {
      issues.push('Insufficient risk information relative to benefits');
    }

    return { hasBalance, issues };
  }

  private checkRequiredDisclosures(content: string, context: ComplianceContext): string[] {
    const requiredDisclosures = [
      'Individual results may vary',
      'Consult your healthcare provider',
      'Not intended to diagnose, treat, cure, or prevent any disease'
    ];

    if (context.contentType === 'promotional' && context.containsDrugInfo) {
      requiredDisclosures.push('Please see full prescribing information');
      requiredDisclosures.push('Ask your doctor about side effects');
    }

    return requiredDisclosures.filter(disclosure => 
      !content.toLowerCase().includes(disclosure.toLowerCase())
    );
  }

  private findProhibitedFDATerms(content: string): string[] {
    const prohibitedTerms = this.fdaKeywords.get('prohibited_claims') || [];
    return prohibitedTerms.filter(term => 
      content.toLowerCase().includes(term.toLowerCase())
    );
  }

  private containsProfessionalOnlyInfo(content: string): boolean {
    const professionalTerms = [
      'dosing protocol',
      'pharmaceutical intervention',
      'clinical pathway',
      'medical algorithm',
      'therapeutic monitoring'
    ];

    return professionalTerms.some(term => 
      content.toLowerCase().includes(term.toLowerCase())
    );
  }

  private checkInformedConsentPrinciples(content: string): { adequate: boolean; issues: string[] } {
    const consentElements = [
      'risks',
      'benefits',
      'alternatives',
      'side effects',
      'outcomes'
    ];

    const presentElements = consentElements.filter(element => 
      content.toLowerCase().includes(element)
    );

    const adequate = presentElements.length >= 3;
    const issues: string[] = [];

    if (!adequate) {
      const missingElements = consentElements.filter(element => 
        !presentElements.includes(element)
      );
      issues.push(`Missing informed consent elements: ${missingElements.join(', ')}`);
    }

    return { adequate, issues };
  }

  private checkCulturalSensitivity(content: string): string[] {
    const sensitivityIssues: string[] = [];
    
    // Check for potentially insensitive language
    const insensitiveTerms = [
      'non-compliant',
      'drug seeking',
      'frequent flyer',
      'difficult patient'
    ];

    insensitiveTerms.forEach(term => {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        sensitivityIssues.push(`Potentially insensitive term: "${term}"`);
      }
    });

    return sensitivityIssues;
  }

  private checkHealthEquity(content: string): Array<{ problematic: string; improved: string }> {
    const equityIssues: Array<{ problematic: string; improved: string }> = [];
    
    // Check for exclusionary language
    if (content.includes('normal people') || content.includes('normal patients')) {
      equityIssues.push({
        problematic: 'normal people/patients',
        improved: 'people without this condition'
      });
    }

    if (content.includes('suffering from') && content.includes('disability')) {
      equityIssues.push({
        problematic: 'suffering from disability',
        improved: 'person with disability'
      });
    }

    return equityIssues;
  }

  private findPaternalisticLanguage(content: string): string[] {
    const paternalisticPhrases = [
      'you must',
      'you should always',
      'patients need to',
      'compliance is required'
    ];

    return paternalisticPhrases.filter(phrase => 
      content.toLowerCase().includes(phrase.toLowerCase())
    );
  }

  private checkHeadingStructure(content: string): string[] {
    const issues: string[] = [];
    const headings = [...content.matchAll(/<h([1-6])[^>]*>/gi)];
    
    if (headings.length === 0) {
      issues.push('No heading structure found');
      return issues;
    }

    const levels = headings.map(match => parseInt(match[1]));
    
    // Check for H1
    if (!levels.includes(1)) {
      issues.push('Missing H1 heading');
    }

    // Check for skipped levels
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i-1] > 1) {
        issues.push(`Heading level skipped: H${levels[i-1]} to H${levels[i]}`);
      }
    }

    return issues;
  }

  private findPersonalIdentifiers(content: string): Array<{ type: string; value: string }> {
    const identifiers: Array<{ type: string; value: string }> = [];
    
    // SSN pattern
    const ssnMatches = content.match(/\b\d{3}-\d{2}-\d{4}\b/g);
    if (ssnMatches) {
      ssnMatches.forEach(ssn => {
        identifiers.push({ type: 'SSN', value: ssn });
      });
    }

    // Email pattern
    const emailMatches = content.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g);
    if (emailMatches) {
      emailMatches.forEach(email => {
        identifiers.push({ type: 'Email', value: email });
      });
    }

    // Phone number pattern
    const phoneMatches = content.match(/\b\d{3}-\d{3}-\d{4}\b/g);
    if (phoneMatches) {
      phoneMatches.forEach(phone => {
        identifiers.push({ type: 'Phone', value: phone });
      });
    }

    return identifiers;
  }

  private checkGDPRCompliance(content: string, context: ComplianceContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (context.containsPersonalInfo) {
      warnings.push({
        code: 'GDPR_LAWFUL_BASIS',
        message: 'GDPR requires lawful basis for processing personal data',
        field: 'legal',
        recommendation: 'Ensure lawful basis is documented and communicated'
      });

      warnings.push({
        code: 'GDPR_DATA_SUBJECT_RIGHTS',
        message: 'GDPR data subject rights must be respected',
        field: 'legal',
        recommendation: 'Implement processes for data subject access, rectification, and erasure'
      });
    }

    return warnings;
  }

  private getRequiredDisclaimers(context: ComplianceContext): Array<{ name: string; text: string }> {
    const disclaimers: Array<{ name: string; text: string }> = [];

    if (context.contentType === 'educational' && context.targetAudience === 'patient') {
      disclaimers.push({
        name: 'Medical Advice Disclaimer',
        text: 'This information is not intended as a substitute for professional medical advice'
      });
    }

    if (context.containsDrugInfo) {
      disclaimers.push({
        name: 'Drug Information Disclaimer',
        text: 'Consult your healthcare provider before starting any medication'
      });
    }

    if (context.contentType === 'research') {
      disclaimers.push({
        name: 'Research Disclaimer',
        text: 'Results may not be applicable to all populations'
      });
    }

    return disclaimers;
  }

  private checkProfessionalLicensing(content: string): { adequate: boolean; issues: string[] } {
    const licensingIndicators = [
      'MD', 'DO', 'RN', 'NP', 'PA', 'PharmD', 'licensed',
      'board certified', 'credentials'
    ];

    const hasLicensingInfo = licensingIndicators.some(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );

    return {
      adequate: hasLicensingInfo,
      issues: hasLicensingInfo ? [] : ['No professional licensing information found']
    };
  }

  private checkFinancialDisclosures(content: string): { adequate: boolean; issues: string[] } {
    const disclosureIndicators = [
      'conflict of interest',
      'financial disclosure',
      'funding source',
      'sponsored by',
      'financial relationship'
    ];

    const hasDisclosure = disclosureIndicators.some(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );

    return {
      adequate: hasDisclosure,
      issues: hasDisclosure ? [] : ['No financial disclosure information found']
    };
  }

  private calculateComplianceConfidence(
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): number {
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const majorErrors = errors.filter(e => e.severity === 'major').length;
    const minorErrors = errors.filter(e => e.severity === 'minor').length;

    const errorWeight = (criticalErrors * 0.4) + (majorErrors * 0.2) + (minorErrors * 0.1);
    const warningWeight = warnings.length * 0.05;
    
    const totalWeight = errorWeight + warningWeight;
    return Math.max(0, 1 - Math.min(1, totalWeight));
  }

  private getHighestSeverity(errors: ValidationError[]): 'critical' | 'major' | 'minor' | 'info' {
    if (errors.some(e => e.severity === 'critical')) return 'critical';
    if (errors.some(e => e.severity === 'major')) return 'major';
    if (errors.some(e => e.severity === 'minor')) return 'minor';
    return 'info';
  }

  // Public utility methods

  /**
   * Get compliance rules for a specific category
   */
  getComplianceRules(category?: string): ComplianceRule[] {
    const rules = Array.from(this.complianceRules.values());
    return category ? rules.filter(rule => rule.category === category) : rules;
  }

  /**
   * Add custom compliance rule
   */
  addComplianceRule(rule: ComplianceRule): void {
    this.complianceRules.set(rule.id, rule);
  }

  /**
   * Quick HIPAA PHI check
   */
  quickPHICheck(content: string): boolean {
    return this.detectPHI(content).containsPHI;
  }

  /**
   * Quick FDA compliance check
   */
  quickFDACheck(content: string): { hasIssues: boolean; issues: string[] } {
    const prohibitedTerms = this.findProhibitedFDATerms(content);
    const unsubstantiatedClaims = this.findUnsubstantiatedClaims(content);
    
    const issues = [...prohibitedTerms, ...unsubstantiatedClaims];
    
    return {
      hasIssues: issues.length > 0,
      issues
    };
  }
}

// Supporting interfaces
interface AccessibilityRule {
  id: string;
  name: string;
  level: 'A' | 'AA' | 'AAA';
  description: string;
  checkFunction: (content: string) => boolean;
}

// Export singleton instance
export const complianceValidator = new ComplianceValidator();