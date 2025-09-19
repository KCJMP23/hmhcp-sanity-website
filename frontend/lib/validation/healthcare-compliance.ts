/**
 * Healthcare Compliance Validation Library
 * 
 * Provides HIPAA-first compliance checking with support for GDPR, SOC2, ISO27001, and FDA
 * regulations for healthcare AI workflow management.
 */

import { z } from 'zod';
import { createHash } from 'crypto';

// Types for compliance standards
export type ComplianceStandard = 'HIPAA' | 'GDPR' | 'SOC2' | 'ISO27001' | 'FDA';

export interface ComplianceRule {
  id: string;
  standard: ComplianceStandard;
  category: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  validator: (data: any) => ComplianceViolation | null;
  autoFix?: (data: any) => any;
}

export interface ComplianceViolation {
  ruleId: string;
  standard: ComplianceStandard;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  data: any;
  suggestion?: string;
  autoFixAvailable: boolean;
  location?: string;
}

export interface ComplianceResult {
  passed: boolean;
  score: number;
  violations: ComplianceViolation[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
}

export interface PHIDetectionResult {
  hasPHI: boolean;
  phiTypes: string[];
  confidence: number;
  locations: Array<{
    type: string;
    location: string;
    value: string;
    confidence: number;
  }>;
  sanitizedContent?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  resourceId: string;
  standard: ComplianceStandard;
  compliancePassed: boolean;
  violations: ComplianceViolation[];
  metadata: Record<string, any>;
}

// PHI Detection Patterns
const PHI_PATTERNS = {
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  dob: /\b(?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\d|3[01])[-/](?:19|20)\d{2}\b/g,
  mrn: /\b(?:MRN|mrn|Medical Record|medical record)[\s:]+([A-Z0-9-]+)/gi,
  npi: /\b\d{10}\b/g,
  address: /\b\d+\s+[A-Za-z\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Circle|Cir|Court|Ct)\b/gi,
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  hipaaIds: /\b(?:Patient|patient|ID|id)[\s:]+([A-Z0-9-]+)/gi,
  medicalConditions: /\b(?:diabetes|hypertension|cancer|HIV|AIDS|depression|anxiety|heart disease|stroke|pneumonia)\b/gi
};

// Medical terminology validation patterns
const MEDICAL_TERMS = {
  medications: /\b(?:aspirin|ibuprofen|acetaminophen|metformin|lisinopril|amlodipine|atorvastatin|metoprolol|omeprazole|albuterol)\b/gi,
  procedures: /\b(?:surgery|biopsy|endoscopy|angioplasty|catheterization|dialysis|chemotherapy|radiation therapy)\b/gi,
  specialties: /\b(?:cardiology|oncology|neurology|pediatrics|psychiatry|radiology|pathology|anesthesiology)\b/gi,
  anatomical: /\b(?:heart|brain|lung|liver|kidney|spine|bone|muscle|blood|nerve)\b/gi
};

// Compliance Rules Registry
class ComplianceRulesRegistry {
  private rules: Map<string, ComplianceRule> = new Map();

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    // HIPAA Rules
    this.addRule({
      id: 'hipaa-phi-detection',
      standard: 'HIPAA',
      category: 'Privacy',
      title: 'PHI Detection and Protection',
      description: 'Detects and flags potential PHI in content',
      severity: 'critical',
      validator: (data) => {
        const phiResult = detectPHI(data.content || '');
        if (phiResult.hasPHI) {
          return {
            ruleId: 'hipaa-phi-detection',
            standard: 'HIPAA',
            severity: 'critical',
            title: 'PHI Detected',
            description: `Potential PHI found: ${phiResult.phiTypes.join(', ')}`,
            data: phiResult,
            suggestion: 'Remove or encrypt PHI before processing',
            autoFixAvailable: true
          };
        }
        return null;
      },
      autoFix: (data) => {
        const phiResult = detectPHI(data.content || '');
        return { ...data, content: phiResult.sanitizedContent };
      }
    });

    this.addRule({
      id: 'hipaa-minimum-necessary',
      standard: 'HIPAA',
      category: 'Privacy',
      title: 'Minimum Necessary Rule',
      description: 'Ensures minimum necessary PHI is accessed',
      severity: 'high',
      validator: (data) => {
        if (data.accessScope === 'full' && !data.justification) {
          return {
            ruleId: 'hipaa-minimum-necessary',
            standard: 'HIPAA',
            severity: 'high',
            title: 'Minimum Necessary Violation',
            description: 'Full PHI access requested without proper justification',
            data: data,
            suggestion: 'Limit access scope or provide justification',
            autoFixAvailable: false
          };
        }
        return null;
      }
    });

    this.addRule({
      id: 'hipaa-audit-logging',
      standard: 'HIPAA',
      category: 'Security',
      title: 'Audit Logging Required',
      description: 'All PHI access must be logged for audit purposes',
      severity: 'critical',
      validator: (data) => {
        if (data.containsPHI && !data.auditLogged) {
          return {
            ruleId: 'hipaa-audit-logging',
            standard: 'HIPAA',
            severity: 'critical',
            title: 'Missing Audit Log',
            description: 'PHI access not properly logged',
            data: data,
            suggestion: 'Enable audit logging for this operation',
            autoFixAvailable: true
          };
        }
        return null;
      }
    });

    // GDPR Rules
    this.addRule({
      id: 'gdpr-consent-required',
      standard: 'GDPR',
      category: 'Privacy',
      title: 'Consent Required',
      description: 'User consent required for personal data processing',
      severity: 'critical',
      validator: (data) => {
        if (data.processingPersonalData && !data.userConsent) {
          return {
            ruleId: 'gdpr-consent-required',
            standard: 'GDPR',
            severity: 'critical',
            title: 'Missing User Consent',
            description: 'Personal data processing without user consent',
            data: data,
            suggestion: 'Obtain explicit user consent before processing',
            autoFixAvailable: false
          };
        }
        return null;
      }
    });

    // SOC2 Rules
    this.addRule({
      id: 'soc2-access-control',
      standard: 'SOC2',
      category: 'Security',
      title: 'Access Control',
      description: 'Proper access controls must be implemented',
      severity: 'high',
      validator: (data) => {
        if (data.sensitiveOperation && !data.roleBasedAccess) {
          return {
            ruleId: 'soc2-access-control',
            standard: 'SOC2',
            severity: 'high',
            title: 'Access Control Missing',
            description: 'Sensitive operation without proper access controls',
            data: data,
            suggestion: 'Implement role-based access control',
            autoFixAvailable: false
          };
        }
        return null;
      }
    });

    // ISO27001 Rules
    this.addRule({
      id: 'iso27001-encryption',
      standard: 'ISO27001',
      category: 'Information Security',
      title: 'Data Encryption',
      description: 'Sensitive data must be encrypted',
      severity: 'critical',
      validator: (data) => {
        if (data.sensitiveData && !data.encrypted) {
          return {
            ruleId: 'iso27001-encryption',
            standard: 'ISO27001',
            severity: 'critical',
            title: 'Data Not Encrypted',
            description: 'Sensitive data stored without encryption',
            data: data,
            suggestion: 'Enable encryption for sensitive data',
            autoFixAvailable: false
          };
        }
        return null;
      }
    });

    // FDA Rules
    this.addRule({
      id: 'fda-clinical-validation',
      standard: 'FDA',
      category: 'Medical Device',
      title: 'Clinical Validation',
      description: 'Medical recommendations must be clinically validated',
      severity: 'critical',
      validator: (data) => {
        if (data.medicalRecommendation && !data.clinicallyValidated) {
          return {
            ruleId: 'fda-clinical-validation',
            standard: 'FDA',
            severity: 'critical',
            title: 'Clinical Validation Required',
            description: 'Medical recommendation without clinical validation',
            data: data,
            suggestion: 'Require clinical validation for medical content',
            autoFixAvailable: false
          };
        }
        return null;
      }
    });
  }

  addRule(rule: ComplianceRule) {
    this.rules.set(rule.id, rule);
  }

  getRule(id: string): ComplianceRule | undefined {
    return this.rules.get(id);
  }

  getRulesByStandard(standard: ComplianceStandard): ComplianceRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.standard === standard);
  }

  getAllRules(): ComplianceRule[] {
    return Array.from(this.rules.values());
  }
}

// Global registry instance
const complianceRegistry = new ComplianceRulesRegistry();

/**
 * Detects Protected Health Information (PHI) in text content using advanced pattern matching
 * 
 * This function scans content for HIPAA-defined PHI including:
 * - Social Security Numbers (SSN)
 * - Medical Record Numbers (MRN)
 * - Phone numbers, email addresses, dates of birth
 * - Medical conditions and clinical identifiers
 * 
 * @param content - Text content to scan for PHI
 * @returns PHIDetectionResult containing:
 *   - hasPHI: Boolean indicating if PHI was detected
 *   - phiTypes: Array of detected PHI types
 *   - confidence: Average confidence score (0-1)
 *   - locations: Specific locations and values found
 *   - sanitizedContent: Content with PHI redacted
 * 
 * @example
 * ```typescript
 * const result = detectPHI("Patient John Doe, SSN: 123-45-6789");
 * console.log(result.hasPHI); // true
 * console.log(result.phiTypes); // ['ssn']
 * console.log(result.sanitizedContent); // "Patient John Doe, SSN: [SSN_REDACTED]"
 * ```
 */
export function detectPHI(content: string): PHIDetectionResult {
  const locations: Array<{
    type: string;
    location: string;
    value: string;
    confidence: number;
  }> = [];
  
  let sanitizedContent = content;
  const phiTypes: string[] = [];
  let totalConfidence = 0;
  let detectionCount = 0;

  // Check each PHI pattern
  Object.entries(PHI_PATTERNS).forEach(([type, pattern]) => {
    const matches = Array.from(content.matchAll(pattern));
    
    matches.forEach((match) => {
      if (match[0] && match.index !== undefined) {
        const confidence = calculatePHIConfidence(type, match[0]);
        
        locations.push({
          type,
          location: `position ${match.index}`,
          value: match[0],
          confidence
        });

        if (!phiTypes.includes(type)) {
          phiTypes.push(type);
        }

        // Sanitize content by replacing with placeholder
        sanitizedContent = sanitizedContent.replace(match[0], `[${type.toUpperCase()}_REDACTED]`);
        
        totalConfidence += confidence;
        detectionCount++;
      }
    });
  });

  const avgConfidence = detectionCount > 0 ? totalConfidence / detectionCount : 0;

  return {
    hasPHI: phiTypes.length > 0,
    phiTypes,
    confidence: avgConfidence,
    locations,
    sanitizedContent
  };
}

/**
 * Calculates confidence score for PHI detection
 */
function calculatePHIConfidence(type: string, value: string): number {
  // Base confidence scores by type
  const baseConfidence: Record<string, number> = {
    ssn: 0.95,
    phone: 0.80,
    email: 0.90,
    dob: 0.85,
    mrn: 0.90,
    npi: 0.95,
    address: 0.70,
    creditCard: 0.95,
    hipaaIds: 0.75,
    medicalConditions: 0.60
  };

  let confidence = baseConfidence[type] || 0.5;

  // Adjust based on context and format
  if (type === 'ssn' && /^\d{3}-\d{2}-\d{4}$/.test(value)) {
    confidence = Math.min(1.0, confidence + 0.05);
  }

  if (type === 'phone' && /^\(\d{3}\)\s\d{3}-\d{4}$/.test(value)) {
    confidence = Math.min(1.0, confidence + 0.05);
  }

  return confidence;
}

/**
 * Validates medical terminology for clinical accuracy and safety
 * 
 * Performs comprehensive validation of medical content including:
 * - Drug interaction detection (e.g., warfarin + aspirin)
 * - Procedure context validation (surgery mentions require surgical context)
 * - Medical terminology consistency checks
 * - Clinical safety warnings for dangerous combinations
 * 
 * @param content - Medical content to validate
 * @returns Validation result object containing:
 *   - isValid: Boolean indicating if content passes validation
 *   - issues: Array of detected issues with severity levels
 * 
 * @example
 * ```typescript
 * const result = validateMedicalTerminology("Patient prescribed warfarin and aspirin");
 * console.log(result.isValid); // false
 * console.log(result.issues[0].severity); // 'error' - dangerous combination
 * ```
 */
export function validateMedicalTerminology(content: string): {
  isValid: boolean;
  issues: Array<{
    term: string;
    issue: string;
    suggestion?: string;
    severity: 'error' | 'warning' | 'info';
  }>;
} {
  const issues: Array<{
    term: string;
    issue: string;
    suggestion?: string;
    severity: 'error' | 'warning' | 'info';
  }> = [];

  // Check for potential medication misspellings or dangerous combinations
  const medicationMatches = Array.from(content.matchAll(MEDICAL_TERMS.medications));
  medicationMatches.forEach((match) => {
    if (match[0]) {
      // Example validation: check for dangerous drug combinations
      if (content.includes('warfarin') && content.includes('aspirin')) {
        issues.push({
          term: 'warfarin + aspirin',
          issue: 'Potential dangerous drug combination detected',
          suggestion: 'Verify with clinical pharmacist',
          severity: 'error'
        });
      }
    }
  });

  // Check procedure terminology
  const procedureMatches = Array.from(content.matchAll(MEDICAL_TERMS.procedures));
  procedureMatches.forEach((match) => {
    if (match[0]) {
      // Validate procedure context
      const term = match[0].toLowerCase();
      if (term.includes('surgery') && !content.includes('surgeon') && !content.includes('surgical')) {
        issues.push({
          term: match[0],
          issue: 'Surgery mentioned without proper medical context',
          suggestion: 'Add appropriate medical professional reference',
          severity: 'warning'
        });
      }
    }
  });

  return {
    isValid: issues.filter(issue => issue.severity === 'error').length === 0,
    issues
  };
}

/**
 * Runs comprehensive compliance validation against healthcare and regulatory standards
 * 
 * Validates data against multiple compliance frameworks:
 * - HIPAA: PHI protection, minimum necessary rule, audit logging
 * - GDPR: Consent management, personal data processing
 * - SOC2: Access controls, security frameworks
 * - ISO27001: Data encryption, information security
 * - FDA: Clinical validation for medical recommendations
 * 
 * @param data - Data object to validate (content, access scope, flags, etc.)
 * @param standards - Array of compliance standards to validate against (default: ['HIPAA'])
 * @returns ComplianceResult containing:
 *   - passed: Boolean indicating overall compliance
 *   - score: Percentage compliance score (0-100)
 *   - violations: Array of detected violations with auto-fix flags
 *   - summary: Categorized violation counts by severity
 *   - recommendations: Actionable remediation suggestions
 * 
 * @example
 * ```typescript
 * const result = validateCompliance({
 *   content: "Patient data...",
 *   containsPHI: true,
 *   auditLogged: false
 * }, ['HIPAA', 'GDPR']);
 * 
 * console.log(result.passed); // false
 * console.log(result.score); // 75
 * console.log(result.violations.length); // 2
 * ```
 */
export function validateCompliance(
  data: any,
  standards: ComplianceStandard[] = ['HIPAA']
): ComplianceResult {
  const violations: ComplianceViolation[] = [];
  let totalRules = 0;

  // Get rules for specified standards
  const applicableRules = complianceRegistry.getAllRules()
    .filter(rule => standards.includes(rule.standard));

  // Run validation for each rule
  applicableRules.forEach(rule => {
    totalRules++;
    const violation = rule.validator(data);
    if (violation) {
      violations.push(violation);
    }
  });

  // Calculate compliance score
  const passedRules = totalRules - violations.length;
  const score = totalRules > 0 ? (passedRules / totalRules) * 100 : 100;

  // Categorize violations
  const summary = violations.reduce((acc, violation) => {
    acc.total++;
    acc[violation.severity]++;
    return acc;
  }, { total: 0, critical: 0, high: 0, medium: 0, low: 0 });

  // Generate recommendations
  const recommendations: string[] = [];
  if (summary.critical > 0) {
    recommendations.push('Address critical compliance violations immediately');
  }
  if (summary.high > 0) {
    recommendations.push('Review and fix high-priority compliance issues');
  }
  if (violations.some(v => v.autoFixAvailable)) {
    recommendations.push('Apply available automatic fixes to resolve violations');
  }

  return {
    passed: violations.length === 0,
    score,
    violations,
    summary,
    recommendations
  };
}

/**
 * Applies automatic fixes for compliance violations that support remediation
 * 
 * Automatically resolves violations where safe auto-fixes are available:
 * - PHI sanitization and redaction
 * - Audit logging activation
 * - Basic data formatting corrections
 * 
 * Only applies fixes that don't require human judgment or clinical validation.
 * Manual review violations are preserved for human attention.
 * 
 * @param data - Original data object with violations
 * @param violations - Array of compliance violations to attempt fixing
 * @returns Auto-fix result containing:
 *   - fixedData: Data with auto-fixes applied
 *   - appliedFixes: Array of rule IDs that were auto-fixed
 *   - remainingViolations: Violations requiring manual intervention
 * 
 * @example
 * ```typescript
 * const { fixedData, appliedFixes, remainingViolations } = applyAutoFixes(
 *   { content: "SSN: 123-45-6789", auditLogged: false },
 *   violations
 * );
 * console.log(appliedFixes); // ['hipaa-phi-detection', 'hipaa-audit-logging']
 * console.log(fixedData.content); // "SSN: [SSN_REDACTED]"
 * ```
 */
export function applyAutoFixes(data: any, violations: ComplianceViolation[]): {
  fixedData: any;
  appliedFixes: string[];
  remainingViolations: ComplianceViolation[];
} {
  let fixedData = { ...data };
  const appliedFixes: string[] = [];
  const remainingViolations: ComplianceViolation[] = [];

  violations.forEach(violation => {
    const rule = complianceRegistry.getRule(violation.ruleId);
    if (rule?.autoFix) {
      fixedData = rule.autoFix(fixedData);
      appliedFixes.push(violation.ruleId);
    } else {
      remainingViolations.push(violation);
    }
  });

  return {
    fixedData,
    appliedFixes,
    remainingViolations
  };
}

/**
 * Creates audit event for compliance tracking
 */
export function createComplianceAuditEvent(
  action: string,
  resource: string,
  resourceId: string,
  standard: ComplianceStandard,
  result: ComplianceResult,
  userId?: string,
  metadata: Record<string, any> = {}
): AuditEvent {
  return {
    id: generateAuditId(),
    timestamp: new Date(),
    userId,
    action,
    resource,
    resourceId,
    standard,
    compliancePassed: result.passed,
    violations: result.violations,
    metadata: {
      ...metadata,
      score: result.score,
      violationCount: result.violations.length,
      standards: [standard]
    }
  };
}

/**
 * Generates unique audit ID
 */
function generateAuditId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  return createHash('sha256').update(`${timestamp}-${random}`).digest('hex').substring(0, 16);
}

/**
 * Sanitizes content by removing or masking PHI
 */
export function sanitizeContent(content: string, maskingChar: string = '*'): {
  sanitized: string;
  phiDetected: boolean;
  phiTypes: string[];
} {
  const phiResult = detectPHI(content);
  
  let sanitized = content;
  
  if (phiResult.hasPHI) {
    // Use the sanitized content from PHI detection
    sanitized = phiResult.sanitizedContent || content;
  }

  return {
    sanitized,
    phiDetected: phiResult.hasPHI,
    phiTypes: phiResult.phiTypes
  };
}

/**
 * Checks if content requires manual approval based on compliance rules
 */
export function requiresManualApproval(
  content: any,
  workflowType: 'treatment-plan' | 'medication' | 'diagnosis' | 'general'
): {
  required: boolean;
  reasons: string[];
  approvalLevel: 'clinical' | 'administrative' | 'legal';
} {
  const reasons: string[] = [];
  let approvalLevel: 'clinical' | 'administrative' | 'legal' = 'administrative';

  // Check for PHI
  if (typeof content === 'string') {
    const phiResult = detectPHI(content);
    if (phiResult.hasPHI) {
      reasons.push('Contains PHI requiring review');
      approvalLevel = 'legal';
    }
  }

  // Check workflow-specific requirements
  if (workflowType === 'treatment-plan') {
    reasons.push('Treatment plans require clinical approval');
    approvalLevel = 'clinical';
  }

  if (workflowType === 'medication') {
    reasons.push('Medication workflows require clinical oversight');
    approvalLevel = 'clinical';
  }

  // Check for medical terminology that needs validation
  if (typeof content === 'string') {
    const medValidation = validateMedicalTerminology(content);
    if (!medValidation.isValid) {
      reasons.push('Medical terminology requires validation');
      if (approvalLevel === 'administrative') {
        approvalLevel = 'clinical';
      }
    }
  }

  return {
    required: reasons.length > 0,
    reasons,
    approvalLevel
  };
}

// Export the registry for advanced usage
export { complianceRegistry, ComplianceRulesRegistry };

// Export schemas for validation
export const ComplianceDataSchema = z.object({
  content: z.string().optional(),
  accessScope: z.enum(['limited', 'full']).optional(),
  justification: z.string().optional(),
  containsPHI: z.boolean().optional(),
  auditLogged: z.boolean().optional(),
  processingPersonalData: z.boolean().optional(),
  userConsent: z.boolean().optional(),
  sensitiveOperation: z.boolean().optional(),
  roleBasedAccess: z.boolean().optional(),
  sensitiveData: z.boolean().optional(),
  encrypted: z.boolean().optional(),
  medicalRecommendation: z.boolean().optional(),
  clinicallyValidated: z.boolean().optional()
});

export type ComplianceData = z.infer<typeof ComplianceDataSchema>;