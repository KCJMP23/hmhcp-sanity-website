/**
 * Healthcare Compliance Validation System
 * 
 * Comprehensive validation for HIPAA, GDPR, FDA regulations, and international healthcare standards.
 * Provides automated compliance checking, scoring, and remediation recommendations.
 * 
 * @author HMHCP Development Team
 * @version 1.0.0
 * @compliance HIPAA, GDPR, FDA, HL7, FHIR
 */

import { z } from 'zod';
import { createHash } from 'crypto';

// ============================================================================
// CORE TYPES AND INTERFACES
// ============================================================================

export type ComplianceFramework = 
  | 'HIPAA' 
  | 'GDPR' 
  | 'FDA' 
  | 'HL7' 
  | 'FHIR' 
  | 'SOC2' 
  | 'HITECH'
  | 'STATE_REGULATIONS'
  | 'INTERNATIONAL';

export type ViolationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type DataClassification = 
  | 'PHI' 
  | 'ePHI' 
  | 'PII' 
  | 'SENSITIVE' 
  | 'CONFIDENTIAL' 
  | 'INTERNAL' 
  | 'PUBLIC';

export type RiskCategory = 'PRIVACY' | 'SECURITY' | 'CLINICAL' | 'OPERATIONAL' | 'REGULATORY';

export interface ComplianceRule {
  id: string;
  framework: ComplianceFramework;
  category: RiskCategory;
  severity: ViolationSeverity;
  title: string;
  description: string;
  requirement: string;
  validator: (context: ValidationContext) => ComplianceResult;
  remediation: RemediationAction[];
  tags: string[];
  references: ComplianceReference[];
}

export interface ValidationContext {
  dataType: DataClassification;
  operationType: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'TRANSMIT' | 'STORE';
  userRole: string;
  accessContext: AccessContext;
  dataElements: DataElement[];
  systemContext: SystemContext;
  timestamp: Date;
  requestId: string;
}

export interface AccessContext {
  userId: string;
  userRole: string;
  department: string;
  location: string;
  ipAddress: string;
  deviceId: string;
  sessionId: string;
  authMethod: 'PASSWORD' | 'MFA' | 'SSO' | 'BIOMETRIC';
  consentStatus: ConsentStatus[];
}

export interface DataElement {
  field: string;
  value: any;
  classification: DataClassification;
  encryption: EncryptionStatus;
  accessLog: AccessLogEntry[];
  retentionPolicy: RetentionPolicy;
  consentRequired: boolean;
}

export interface SystemContext {
  environment: 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';
  version: string;
  deployment: 'CLOUD' | 'ON_PREMISE' | 'HYBRID';
  region: string;
  encryptionStandard: string;
  auditingEnabled: boolean;
  backupStatus: BackupStatus;
}

export interface ComplianceResult {
  passed: boolean;
  score: number;
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  recommendations: string[];
  metadata: Record<string, any>;
}

export interface ComplianceViolation {
  ruleId: string;
  severity: ViolationSeverity;
  message: string;
  field?: string;
  actualValue?: any;
  expectedValue?: any;
  remediation: RemediationAction[];
  framework: ComplianceFramework;
  category: RiskCategory;
}

export interface ComplianceWarning {
  ruleId: string;
  message: string;
  recommendation: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RemediationAction {
  action: string;
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  effort: 'LOW' | 'MEDIUM' | 'HIGH' | 'ENTERPRISE';
  timeline: string;
  responsible: string[];
  cost?: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: string;
}

export interface ComplianceReference {
  framework: ComplianceFramework;
  section: string;
  url?: string;
  description: string;
}

export interface ConsentStatus {
  purpose: string;
  granted: boolean;
  timestamp: Date;
  expirationDate?: Date;
  withdrawable: boolean;
  granular: boolean;
}

export interface EncryptionStatus {
  encrypted: boolean;
  algorithm?: string;
  keyManagement: 'HSM' | 'KMS' | 'LOCAL' | 'CLOUD';
  inTransit: boolean;
  atRest: boolean;
}

export interface AccessLogEntry {
  userId: string;
  timestamp: Date;
  operation: string;
  result: 'SUCCESS' | 'FAILURE' | 'UNAUTHORIZED';
  ipAddress: string;
  userAgent: string;
}

export interface RetentionPolicy {
  category: string;
  retentionPeriod: number; // in days
  disposalMethod: 'SECURE_DELETE' | 'ANONYMIZE' | 'ARCHIVE';
  autoDisposal: boolean;
  legalHold: boolean;
}

export interface BackupStatus {
  enabled: boolean;
  frequency: string;
  encrypted: boolean;
  offsite: boolean;
  tested: boolean;
  lastTest?: Date;
}

export interface ComplianceReport {
  id: string;
  timestamp: Date;
  framework: ComplianceFramework[];
  overallScore: number;
  frameworkScores: Record<ComplianceFramework, number>;
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  recommendations: string[];
  riskAssessment: RiskAssessment;
  actionPlan: ActionPlan;
  trends: ComplianceTrend[];
  certificationReadiness: CertificationReadiness[];
}

export interface RiskAssessment {
  overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  categoryRisks: Record<RiskCategory, 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>;
  topRisks: TopRisk[];
  mitigationStatus: MitigationStatus[];
}

export interface TopRisk {
  description: string;
  probability: number;
  impact: number;
  riskScore: number;
  category: RiskCategory;
  frameworks: ComplianceFramework[];
}

export interface MitigationStatus {
  riskId: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED';
  progress: number;
  dueDate: Date;
  owner: string;
}

export interface ActionPlan {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  actions: PrioritizedAction[];
  timeline: ActionTimeline;
  resources: ResourceRequirement[];
  milestones: Milestone[];
}

export interface PrioritizedAction {
  id: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  effort: 'LOW' | 'MEDIUM' | 'HIGH' | 'ENTERPRISE';
  dependencies: string[];
  owner: string;
  dueDate: Date;
  frameworks: ComplianceFramework[];
}

export interface ActionTimeline {
  immediate: PrioritizedAction[];
  shortTerm: PrioritizedAction[]; // 1-3 months
  mediumTerm: PrioritizedAction[]; // 3-12 months
  longTerm: PrioritizedAction[]; // 12+ months
}

export interface ResourceRequirement {
  type: 'PERSONNEL' | 'TECHNOLOGY' | 'TRAINING' | 'EXTERNAL';
  description: string;
  quantity: number;
  timeline: string;
  budget?: number;
}

export interface Milestone {
  name: string;
  description: string;
  dueDate: Date;
  dependencies: string[];
  deliverables: string[];
  success_criteria: string[];
}

export interface ComplianceTrend {
  framework: ComplianceFramework;
  timeframe: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  scores: { date: Date; score: number }[];
  violationCounts: { date: Date; count: number; severity: ViolationSeverity }[];
  improvements: string[];
  deteriorations: string[];
}

export interface CertificationReadiness {
  framework: ComplianceFramework;
  certification: string;
  readinessScore: number;
  missingRequirements: string[];
  estimatedTimeToReadiness: number;
  recommendedPath: string[];
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ValidationContextSchema = z.object({
  dataType: z.enum(['PHI', 'ePHI', 'PII', 'SENSITIVE', 'CONFIDENTIAL', 'INTERNAL', 'PUBLIC']),
  operationType: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'TRANSMIT', 'STORE']),
  userRole: z.string(),
  accessContext: z.object({
    userId: z.string(),
    userRole: z.string(),
    department: z.string(),
    location: z.string(),
    ipAddress: z.string(),
    deviceId: z.string(),
    sessionId: z.string(),
    authMethod: z.enum(['PASSWORD', 'MFA', 'SSO', 'BIOMETRIC']),
    consentStatus: z.array(z.object({
      purpose: z.string(),
      granted: z.boolean(),
      timestamp: z.date(),
      expirationDate: z.date().optional(),
      withdrawable: z.boolean(),
      granular: z.boolean()
    }))
  }),
  dataElements: z.array(z.object({
    field: z.string(),
    value: z.any(),
    classification: z.enum(['PHI', 'ePHI', 'PII', 'SENSITIVE', 'CONFIDENTIAL', 'INTERNAL', 'PUBLIC']),
    encryption: z.object({
      encrypted: z.boolean(),
      algorithm: z.string().optional(),
      keyManagement: z.enum(['HSM', 'KMS', 'LOCAL', 'CLOUD']),
      inTransit: z.boolean(),
      atRest: z.boolean()
    }),
    accessLog: z.array(z.any()),
    retentionPolicy: z.object({
      category: z.string(),
      retentionPeriod: z.number(),
      disposalMethod: z.enum(['SECURE_DELETE', 'ANONYMIZE', 'ARCHIVE']),
      autoDisposal: z.boolean(),
      legalHold: z.boolean()
    }),
    consentRequired: z.boolean()
  })),
  systemContext: z.object({
    environment: z.enum(['PRODUCTION', 'STAGING', 'DEVELOPMENT']),
    version: z.string(),
    deployment: z.enum(['CLOUD', 'ON_PREMISE', 'HYBRID']),
    region: z.string(),
    encryptionStandard: z.string(),
    auditingEnabled: z.boolean(),
    backupStatus: z.object({
      enabled: z.boolean(),
      frequency: z.string(),
      encrypted: z.boolean(),
      offsite: z.boolean(),
      tested: z.boolean(),
      lastTest: z.date().optional()
    })
  }),
  timestamp: z.date(),
  requestId: z.string()
});

// ============================================================================
// COMPLIANCE RULES DEFINITIONS
// ============================================================================

export class ComplianceRuleRegistry {
  private static rules: Map<string, ComplianceRule> = new Map();

  static registerRule(rule: ComplianceRule): void {
    this.rules.set(rule.id, rule);
  }

  static getRule(id: string): ComplianceRule | undefined {
    return this.rules.get(id);
  }

  static getRulesByFramework(framework: ComplianceFramework): ComplianceRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.framework === framework);
  }

  static getAllRules(): ComplianceRule[] {
    return Array.from(this.rules.values());
  }

  static initializeDefaultRules(): void {
    // HIPAA Rules
    this.registerRule({
      id: 'HIPAA_PHI_ENCRYPTION',
      framework: 'HIPAA',
      category: 'SECURITY',
      severity: 'CRITICAL',
      title: 'PHI Encryption Required',
      description: 'All PHI must be encrypted both in transit and at rest',
      requirement: '45 CFR §164.312(a)(2)(iv) and §164.312(e)(2)(ii)',
      validator: (context) => this.validatePHIEncryption(context),
      remediation: [
        {
          action: 'Implement AES-256 encryption for PHI at rest',
          priority: 'IMMEDIATE',
          effort: 'HIGH',
          timeline: '30 days',
          responsible: ['Security Team', 'DevOps'],
          impact: 'Ensures PHI confidentiality and regulatory compliance'
        }
      ],
      tags: ['encryption', 'phi', 'security'],
      references: [
        {
          framework: 'HIPAA',
          section: '45 CFR §164.312',
          url: 'https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C/section-164.312',
          description: 'Technical Safeguards'
        }
      ]
    });

    this.registerRule({
      id: 'HIPAA_MINIMUM_NECESSARY',
      framework: 'HIPAA',
      category: 'PRIVACY',
      severity: 'HIGH',
      title: 'Minimum Necessary Rule',
      description: 'Access to PHI must be limited to minimum necessary for the intended purpose',
      requirement: '45 CFR §164.502(b)',
      validator: (context) => this.validateMinimumNecessary(context),
      remediation: [
        {
          action: 'Implement role-based access controls with data minimization',
          priority: 'HIGH',
          effort: 'MEDIUM',
          timeline: '60 days',
          responsible: ['Security Team', 'Compliance Officer'],
          impact: 'Reduces exposure risk and ensures regulatory compliance'
        }
      ],
      tags: ['access-control', 'minimum-necessary', 'phi'],
      references: [
        {
          framework: 'HIPAA',
          section: '45 CFR §164.502(b)',
          description: 'Minimum Necessary Requirements'
        }
      ]
    });

    this.registerRule({
      id: 'HIPAA_AUDIT_TRAIL',
      framework: 'HIPAA',
      category: 'SECURITY',
      severity: 'HIGH',
      title: 'Comprehensive Audit Trail',
      description: 'All PHI access and modifications must be logged with comprehensive audit trail',
      requirement: '45 CFR §164.312(b)',
      validator: (context) => this.validateAuditTrail(context),
      remediation: [
        {
          action: 'Implement comprehensive audit logging for all PHI operations',
          priority: 'HIGH',
          effort: 'MEDIUM',
          timeline: '45 days',
          responsible: ['DevOps', 'Security Team'],
          impact: 'Enables breach detection and regulatory compliance'
        }
      ],
      tags: ['audit', 'logging', 'phi'],
      references: [
        {
          framework: 'HIPAA',
          section: '45 CFR §164.312(b)',
          description: 'Audit Controls'
        }
      ]
    });

    // GDPR Rules
    this.registerRule({
      id: 'GDPR_CONSENT_MANAGEMENT',
      framework: 'GDPR',
      category: 'PRIVACY',
      severity: 'CRITICAL',
      title: 'Valid Consent Required',
      description: 'Processing of personal data requires valid, specific, informed consent',
      requirement: 'GDPR Article 6 and 7',
      validator: (context) => this.validateGDPRConsent(context),
      remediation: [
        {
          action: 'Implement granular consent management system',
          priority: 'IMMEDIATE',
          effort: 'HIGH',
          timeline: '30 days',
          responsible: ['Privacy Team', 'Legal'],
          impact: 'Ensures lawful basis for data processing'
        }
      ],
      tags: ['consent', 'gdpr', 'privacy'],
      references: [
        {
          framework: 'GDPR',
          section: 'Article 6 and 7',
          url: 'https://gdpr-info.eu/art-6-gdpr/',
          description: 'Lawfulness of processing and Conditions for consent'
        }
      ]
    });

    this.registerRule({
      id: 'GDPR_RIGHT_TO_DELETION',
      framework: 'GDPR',
      category: 'PRIVACY',
      severity: 'HIGH',
      title: 'Right to Erasure Implementation',
      description: 'System must support complete data deletion upon valid request',
      requirement: 'GDPR Article 17',
      validator: (context) => this.validateRightToErasure(context),
      remediation: [
        {
          action: 'Implement automated data deletion workflows',
          priority: 'HIGH',
          effort: 'HIGH',
          timeline: '90 days',
          responsible: ['Engineering', 'Privacy Team'],
          impact: 'Ensures data subject rights compliance'
        }
      ],
      tags: ['right-to-erasure', 'gdpr', 'privacy'],
      references: [
        {
          framework: 'GDPR',
          section: 'Article 17',
          url: 'https://gdpr-info.eu/art-17-gdpr/',
          description: 'Right to erasure (right to be forgotten)'
        }
      ]
    });

    // FDA Rules
    this.registerRule({
      id: 'FDA_CLINICAL_VALIDATION',
      framework: 'FDA',
      category: 'CLINICAL',
      severity: 'CRITICAL',
      title: 'Clinical Decision Support Validation',
      description: 'Clinical decision support features must be clinically validated',
      requirement: 'FDA Software as Medical Device Guidance',
      validator: (context) => this.validateClinicalDecisionSupport(context),
      remediation: [
        {
          action: 'Conduct clinical validation studies for decision support features',
          priority: 'IMMEDIATE',
          effort: 'ENTERPRISE',
          timeline: '180 days',
          responsible: ['Clinical Affairs', 'Regulatory'],
          impact: 'Ensures patient safety and regulatory approval'
        }
      ],
      tags: ['clinical-validation', 'fda', 'samd'],
      references: [
        {
          framework: 'FDA',
          section: 'Software as Medical Device Guidance',
          url: 'https://www.fda.gov/medical-devices/software-medical-device-samd',
          description: 'FDA SaMD Guidance Documents'
        }
      ]
    });

    // HL7/FHIR Rules
    this.registerRule({
      id: 'FHIR_INTEROPERABILITY',
      framework: 'FHIR',
      category: 'OPERATIONAL',
      severity: 'MEDIUM',
      title: 'FHIR R4 Compliance',
      description: 'Data exchange must conform to FHIR R4 standards',
      requirement: 'HL7 FHIR R4 Specification',
      validator: (context) => this.validateFHIRCompliance(context),
      remediation: [
        {
          action: 'Implement FHIR R4 compliant APIs',
          priority: 'MEDIUM',
          effort: 'HIGH',
          timeline: '120 days',
          responsible: ['Engineering', 'Interoperability Team'],
          impact: 'Enables healthcare data interoperability'
        }
      ],
      tags: ['fhir', 'interoperability', 'hl7'],
      references: [
        {
          framework: 'FHIR',
          section: 'FHIR R4',
          url: 'https://hl7.org/fhir/R4/',
          description: 'HL7 FHIR Release 4 Specification'
        }
      ]
    });
  }

  // Individual validation methods
  private static validatePHIEncryption(context: ValidationContext): ComplianceResult {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    let score = 100;

    // Check if PHI/ePHI data elements are encrypted
    const phiElements = context.dataElements.filter(
      el => el.classification === 'PHI' || el.classification === 'ePHI'
    );

    for (const element of phiElements) {
      if (!element.encryption.encrypted) {
        violations.push({
          ruleId: 'HIPAA_PHI_ENCRYPTION',
          severity: 'CRITICAL',
          message: `PHI field '${element.field}' is not encrypted`,
          field: element.field,
          actualValue: 'Not encrypted',
          expectedValue: 'Encrypted with AES-256 or equivalent',
          remediation: [
            {
              action: `Encrypt field '${element.field}' using AES-256`,
              priority: 'IMMEDIATE',
              effort: 'MEDIUM',
              timeline: '7 days',
              responsible: ['Security Team'],
              impact: 'Protects PHI confidentiality'
            }
          ],
          framework: 'HIPAA',
          category: 'SECURITY'
        });
        score -= 25;
      }

      if (!element.encryption.inTransit) {
        violations.push({
          ruleId: 'HIPAA_PHI_ENCRYPTION',
          severity: 'HIGH',
          message: `PHI field '${element.field}' is not encrypted in transit`,
          field: element.field,
          actualValue: 'Not encrypted in transit',
          expectedValue: 'TLS 1.2+ encryption',
          remediation: [
            {
              action: 'Enable TLS 1.2+ for all PHI transmissions',
              priority: 'HIGH',
              effort: 'LOW',
              timeline: '3 days',
              responsible: ['DevOps'],
              impact: 'Protects PHI during transmission'
            }
          ],
          framework: 'HIPAA',
          category: 'SECURITY'
        });
        score -= 15;
      }
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, score),
      violations,
      warnings,
      recommendations: violations.length > 0 ? 
        ['Implement comprehensive encryption for all PHI', 'Use hardware security modules (HSM) for key management'] : 
        ['Consider upgrading to quantum-resistant encryption algorithms'],
      metadata: {
        phiElementsChecked: phiElements.length,
        encryptedElements: phiElements.filter(el => el.encryption.encrypted).length
      }
    };
  }

  private static validateMinimumNecessary(context: ValidationContext): ComplianceResult {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    let score = 100;

    // Check if user has appropriate role for data access
    const phiElements = context.dataElements.filter(
      el => el.classification === 'PHI' || el.classification === 'ePHI'
    );

    // Define role-based access patterns
    const roleAccessMap: Record<string, string[]> = {
      'physician': ['diagnosis', 'treatment', 'medical-history', 'prescriptions'],
      'nurse': ['vital-signs', 'treatment', 'care-notes'],
      'administrator': ['billing', 'insurance', 'demographics'],
      'researcher': ['anonymized-data', 'aggregate-data'],
      'billing': ['billing', 'insurance', 'payment']
    };

    const allowedFields = roleAccessMap[context.userRole.toLowerCase()] || [];

    for (const element of phiElements) {
      const fieldCategory = this.categorizeDataField(element.field);
      if (!allowedFields.includes(fieldCategory)) {
        violations.push({
          ruleId: 'HIPAA_MINIMUM_NECESSARY',
          severity: 'HIGH',
          message: `User role '${context.userRole}' should not access PHI field '${element.field}'`,
          field: element.field,
          actualValue: `${context.userRole} accessing ${fieldCategory}`,
          expectedValue: `Limited to roles: ${this.getRolesForField(fieldCategory).join(', ')}`,
          remediation: [
            {
              action: `Review and restrict access to field '${element.field}' based on minimum necessary principle`,
              priority: 'HIGH',
              effort: 'MEDIUM',
              timeline: '14 days',
              responsible: ['Security Team', 'Compliance Officer'],
              impact: 'Reduces PHI exposure risk'
            }
          ],
          framework: 'HIPAA',
          category: 'PRIVACY'
        });
        score -= 20;
      }
    }

    // Check for bulk data access patterns
    if (phiElements.length > 100 && context.operationType === 'READ') {
      warnings.push({
        ruleId: 'HIPAA_MINIMUM_NECESSARY',
        message: 'Large bulk PHI access detected - verify minimum necessary compliance',
        recommendation: 'Implement pagination and justify business need for bulk access',
        priority: 'HIGH'
      });
      score -= 10;
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, score),
      violations,
      warnings,
      recommendations: [
        'Implement granular role-based access controls',
        'Regular access reviews and recertification',
        'Data masking for non-essential personnel'
      ],
      metadata: {
        roleAccess: context.userRole,
        phiElementsAccessed: phiElements.length,
        unauthorizedAccess: violations.length
      }
    };
  }

  private static validateAuditTrail(context: ValidationContext): ComplianceResult {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    let score = 100;

    if (!context.systemContext.auditingEnabled) {
      violations.push({
        ruleId: 'HIPAA_AUDIT_TRAIL',
        severity: 'CRITICAL',
        message: 'Audit logging is not enabled at system level',
        actualValue: 'Auditing disabled',
        expectedValue: 'Comprehensive audit logging enabled',
        remediation: [
          {
            action: 'Enable comprehensive audit logging for all PHI operations',
            priority: 'IMMEDIATE',
            effort: 'MEDIUM',
            timeline: '7 days',
            responsible: ['DevOps', 'Security Team'],
            impact: 'Enables breach detection and compliance monitoring'
          }
        ],
        framework: 'HIPAA',
        category: 'SECURITY'
      });
      score = 0;
    }

    // Check individual data elements for audit trail
    const phiElements = context.dataElements.filter(
      el => el.classification === 'PHI' || el.classification === 'ePHI'
    );

    for (const element of phiElements) {
      if (!element.accessLog || element.accessLog.length === 0) {
        violations.push({
          ruleId: 'HIPAA_AUDIT_TRAIL',
          severity: 'HIGH',
          message: `No access log found for PHI field '${element.field}'`,
          field: element.field,
          actualValue: 'No audit log',
          expectedValue: 'Comprehensive access log with user, time, operation details',
          remediation: [
            {
              action: `Implement audit logging for PHI field '${element.field}'`,
              priority: 'HIGH',
              effort: 'LOW',
              timeline: '14 days',
              responsible: ['Engineering'],
              impact: 'Ensures accountability and breach detection'
            }
          ],
          framework: 'HIPAA',
          category: 'SECURITY'
        });
        score -= 15;
      }
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, score),
      violations,
      warnings,
      recommendations: [
        'Implement tamper-evident audit logs',
        'Regular audit log review and analysis',
        'Automated anomaly detection in access patterns'
      ],
      metadata: {
        auditingEnabled: context.systemContext.auditingEnabled,
        phiElementsTracked: phiElements.filter(el => el.accessLog && el.accessLog.length > 0).length,
        totalPHIElements: phiElements.length
      }
    };
  }

  private static validateGDPRConsent(context: ValidationContext): ComplianceResult {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    let score = 100;

    const personalDataElements = context.dataElements.filter(
      el => el.classification === 'PII' || el.classification === 'PHI' || el.classification === 'SENSITIVE'
    );

    for (const element of personalDataElements) {
      if (element.consentRequired) {
        const consent = context.accessContext.consentStatus.find(
          c => c.purpose.includes(element.field) || c.purpose === 'general_processing'
        );

        if (!consent) {
          violations.push({
            ruleId: 'GDPR_CONSENT_MANAGEMENT',
            severity: 'CRITICAL',
            message: `No consent record found for personal data field '${element.field}'`,
            field: element.field,
            actualValue: 'No consent',
            expectedValue: 'Valid, specific, informed consent',
            remediation: [
              {
                action: `Obtain valid consent for processing '${element.field}'`,
                priority: 'IMMEDIATE',
                effort: 'MEDIUM',
                timeline: '7 days',
                responsible: ['Privacy Team', 'Legal'],
                impact: 'Ensures lawful basis for data processing'
              }
            ],
            framework: 'GDPR',
            category: 'PRIVACY'
          });
          score -= 30;
        } else if (!consent.granted) {
          violations.push({
            ruleId: 'GDPR_CONSENT_MANAGEMENT',
            severity: 'CRITICAL',
            message: `Consent not granted for personal data field '${element.field}'`,
            field: element.field,
            actualValue: 'Consent denied',
            expectedValue: 'Valid consent granted',
            remediation: [
              {
                action: `Stop processing '${element.field}' or obtain valid consent`,
                priority: 'IMMEDIATE',
                effort: 'LOW',
                timeline: '1 day',
                responsible: ['Privacy Team'],
                impact: 'Avoids unlawful data processing'
              }
            ],
            framework: 'GDPR',
            category: 'PRIVACY'
          });
          score -= 40;
        } else if (consent.expirationDate && consent.expirationDate < new Date()) {
          violations.push({
            ruleId: 'GDPR_CONSENT_MANAGEMENT',
            severity: 'HIGH',
            message: `Consent expired for personal data field '${element.field}'`,
            field: element.field,
            actualValue: `Expired on ${consent.expirationDate}`,
            expectedValue: 'Valid, current consent',
            remediation: [
              {
                action: `Renew consent for '${element.field}' processing`,
                priority: 'HIGH',
                effort: 'MEDIUM',
                timeline: '14 days',
                responsible: ['Privacy Team'],
                impact: 'Maintains lawful processing basis'
              }
            ],
            framework: 'GDPR',
            category: 'PRIVACY'
          });
          score -= 25;
        }
      }
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, score),
      violations,
      warnings,
      recommendations: [
        'Implement consent refresh workflows',
        'Granular consent management for different processing purposes',
        'Clear consent withdrawal mechanisms'
      ],
      metadata: {
        personalDataElements: personalDataElements.length,
        consentRequiredElements: personalDataElements.filter(el => el.consentRequired).length,
        validConsents: context.accessContext.consentStatus.filter(c => c.granted).length
      }
    };
  }

  private static validateRightToErasure(context: ValidationContext): ComplianceResult {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    let score = 100;

    if (context.operationType === 'DELETE') {
      const personalDataElements = context.dataElements.filter(
        el => el.classification === 'PII' || el.classification === 'PHI' || el.classification === 'SENSITIVE'
      );

      for (const element of personalDataElements) {
        if (element.retentionPolicy.legalHold) {
          warnings.push({
            ruleId: 'GDPR_RIGHT_TO_DELETION',
            message: `Field '${element.field}' under legal hold - erasure may be restricted`,
            recommendation: 'Review legal hold requirements before processing erasure request',
            priority: 'HIGH'
          });
        }

        if (element.retentionPolicy.disposalMethod !== 'SECURE_DELETE') {
          violations.push({
            ruleId: 'GDPR_RIGHT_TO_DELETION',
            severity: 'HIGH',
            message: `Field '${element.field}' not configured for secure deletion`,
            field: element.field,
            actualValue: element.retentionPolicy.disposalMethod,
            expectedValue: 'SECURE_DELETE',
            remediation: [
              {
                action: `Configure secure deletion for field '${element.field}'`,
                priority: 'HIGH',
                effort: 'MEDIUM',
                timeline: '30 days',
                responsible: ['Engineering', 'Privacy Team'],
                impact: 'Ensures complete data erasure capability'
              }
            ],
            framework: 'GDPR',
            category: 'PRIVACY'
          });
          score -= 20;
        }
      }
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, score),
      violations,
      warnings,
      recommendations: [
        'Implement automated secure deletion workflows',
        'Regular verification of data erasure completeness',
        'Clear documentation of legal basis for retention'
      ],
      metadata: {
        deletionCapable: violations.length === 0,
        legalHolds: context.dataElements.filter(el => el.retentionPolicy?.legalHold).length
      }
    };
  }

  private static validateClinicalDecisionSupport(context: ValidationContext): ComplianceResult {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    let score = 100;

    // This is a simplified validation - in practice, this would integrate with clinical validation systems
    if (context.systemContext.environment === 'PRODUCTION') {
      // Check for clinical validation markers
      const hasClinicalValidation = context.systemContext.version.includes('clinical-validated') ||
        context.dataElements.some(el => el.field.includes('clinical-decision'));

      if (!hasClinicalValidation) {
        warnings.push({
          ruleId: 'FDA_CLINICAL_VALIDATION',
          message: 'Clinical decision support features detected without validation markers',
          recommendation: 'Ensure clinical validation is completed before production deployment',
          priority: 'HIGH'
        });
        score -= 30;
      }
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, score),
      violations,
      warnings,
      recommendations: [
        'Conduct clinical validation studies',
        'Implement adverse event reporting',
        'Regular post-market surveillance'
      ],
      metadata: {
        clinicalFeatures: context.dataElements.filter(el => el.field.includes('clinical')).length
      }
    };
  }

  private static validateFHIRCompliance(context: ValidationContext): ComplianceResult {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    let score = 100;

    // Check for FHIR-compliant data structures
    const healthcareDataElements = context.dataElements.filter(
      el => el.field.includes('patient') || el.field.includes('observation') || el.field.includes('condition')
    );

    if (healthcareDataElements.length > 0) {
      // This would integrate with FHIR validation libraries in practice
      warnings.push({
        ruleId: 'FHIR_INTEROPERABILITY',
        message: 'Healthcare data detected - ensure FHIR R4 compliance',
        recommendation: 'Validate data structures against FHIR R4 schemas',
        priority: 'MEDIUM'
      });
    }

    return {
      passed: violations.length === 0,
      score: Math.max(0, score),
      violations,
      warnings,
      recommendations: [
        'Implement FHIR R4 validation',
        'Use FHIR-compliant APIs for interoperability',
        'Regular FHIR compliance testing'
      ],
      metadata: {
        healthcareDataElements: healthcareDataElements.length
      }
    };
  }

  private static categorizeDataField(field: string): string {
    const fieldMap: Record<string, string> = {
      'diagnosis': 'diagnosis',
      'treatment': 'treatment', 
      'medical-history': 'medical-history',
      'prescription': 'prescriptions',
      'vital-signs': 'vital-signs',
      'care-notes': 'care-notes',
      'billing': 'billing',
      'insurance': 'insurance',
      'demographics': 'demographics',
      'payment': 'payment'
    };

    for (const [key, category] of Object.entries(fieldMap)) {
      if (field.toLowerCase().includes(key)) {
        return category;
      }
    }

    return 'general';
  }

  private static getRolesForField(fieldCategory: string): string[] {
    const categoryRoleMap: Record<string, string[]> = {
      'diagnosis': ['physician', 'specialist'],
      'treatment': ['physician', 'nurse'],
      'medical-history': ['physician', 'nurse'],
      'prescriptions': ['physician', 'pharmacist'],
      'vital-signs': ['nurse', 'physician'],
      'care-notes': ['nurse'],
      'billing': ['administrator', 'billing'],
      'insurance': ['administrator', 'billing'],
      'demographics': ['administrator', 'registration'],
      'payment': ['billing', 'finance']
    };

    return categoryRoleMap[fieldCategory] || ['administrator'];
  }
}

// ============================================================================
// MAIN COMPLIANCE VALIDATOR CLASS
// ============================================================================

export class ComplianceValidator {
  private frameworks: Set<ComplianceFramework>;
  private rules: ComplianceRule[];
  private customRules: Map<string, ComplianceRule> = new Map();

  constructor(frameworks: ComplianceFramework[] = ['HIPAA', 'GDPR', 'FDA']) {
    this.frameworks = new Set(frameworks);
    
    // Initialize default rules
    ComplianceRuleRegistry.initializeDefaultRules();
    
    // Load rules for specified frameworks
    this.rules = frameworks.flatMap(framework => 
      ComplianceRuleRegistry.getRulesByFramework(framework)
    );
  }

  /**
   * Add custom compliance rule
   */
  addCustomRule(rule: ComplianceRule): void {
    this.customRules.set(rule.id, rule);
    ComplianceRuleRegistry.registerRule(rule);
  }

  /**
   * Validate context against all applicable compliance rules
   */
  async validateCompliance(context: ValidationContext): Promise<ComplianceResult> {
    try {
      // Validate input context
      ValidationContextSchema.parse(context);

      const allViolations: ComplianceViolation[] = [];
      const allWarnings: ComplianceWarning[] = [];
      const allRecommendations: string[] = [];
      let totalScore = 0;
      let ruleCount = 0;

      // Run all applicable rules
      for (const rule of this.rules) {
        try {
          const result = rule.validator(context);
          
          allViolations.push(...result.violations);
          allWarnings.push(...result.warnings);
          allRecommendations.push(...result.recommendations);
          totalScore += result.score;
          ruleCount++;
        } catch (error) {
          console.error(`Error validating rule ${rule.id}:`, error);
          allWarnings.push({
            ruleId: rule.id,
            message: `Rule validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            recommendation: 'Review rule implementation and context data',
            priority: 'HIGH'
          });
        }
      }

      // Calculate overall score
      const overallScore = ruleCount > 0 ? Math.round(totalScore / ruleCount) : 0;

      return {
        passed: allViolations.length === 0,
        score: overallScore,
        violations: allViolations,
        warnings: allWarnings,
        recommendations: [...new Set(allRecommendations)], // Remove duplicates
        metadata: {
          rulesEvaluated: ruleCount,
          frameworksChecked: Array.from(this.frameworks),
          timestamp: new Date(),
          requestId: context.requestId
        }
      };

    } catch (error) {
      return {
        passed: false,
        score: 0,
        violations: [{
          ruleId: 'VALIDATION_ERROR',
          severity: 'CRITICAL',
          message: `Compliance validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          remediation: [{
            action: 'Review validation context and fix data format issues',
            priority: 'IMMEDIATE',
            effort: 'LOW',
            timeline: '1 day',
            responsible: ['Engineering'],
            impact: 'Enables compliance validation'
          }],
          framework: 'HIPAA', // Default framework
          category: 'OPERATIONAL'
        }],
        warnings: [],
        recommendations: ['Fix validation context format', 'Review compliance validator configuration'],
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(context: ValidationContext): Promise<ComplianceReport> {
    const validationResult = await this.validateCompliance(context);
    
    // Calculate framework-specific scores
    const frameworkScores: Record<ComplianceFramework, number> = {} as Record<ComplianceFramework, number>;
    for (const framework of this.frameworks) {
      const frameworkRules = this.rules.filter(rule => rule.framework === framework);
      if (frameworkRules.length > 0) {
        const frameworkResults = await Promise.all(
          frameworkRules.map(rule => rule.validator(context))
        );
        const avgScore = frameworkResults.reduce((sum, result) => sum + result.score, 0) / frameworkResults.length;
        frameworkScores[framework] = Math.round(avgScore);
      }
    }

    // Generate risk assessment
    const riskAssessment = this.generateRiskAssessment(validationResult);
    
    // Generate action plan
    const actionPlan = this.generateActionPlan(validationResult.violations);

    // Generate trends (simplified - in practice would use historical data)
    const trends: ComplianceTrend[] = Array.from(this.frameworks).map(framework => ({
      framework,
      timeframe: 'DAILY',
      scores: [{ date: new Date(), score: frameworkScores[framework] || 0 }],
      violationCounts: [{
        date: new Date(),
        count: validationResult.violations.filter(v => v.framework === framework).length,
        severity: 'HIGH'
      }],
      improvements: [],
      deteriorations: validationResult.violations.filter(v => v.framework === framework).map(v => v.message)
    }));

    // Generate certification readiness
    const certificationReadiness: CertificationReadiness[] = Array.from(this.frameworks).map(framework => {
      const score = frameworkScores[framework] || 0;
      const violations = validationResult.violations.filter(v => v.framework === framework);
      
      return {
        framework,
        certification: this.getCertificationName(framework),
        readinessScore: score,
        missingRequirements: violations.map(v => v.message),
        estimatedTimeToReadiness: this.calculateTimeToReadiness(violations),
        recommendedPath: this.getRecommendedCertificationPath(framework, violations)
      };
    });

    return {
      id: createHash('sha256').update(context.requestId + new Date().toISOString()).digest('hex'),
      timestamp: new Date(),
      framework: Array.from(this.frameworks),
      overallScore: validationResult.score,
      frameworkScores,
      violations: validationResult.violations,
      warnings: validationResult.warnings,
      recommendations: validationResult.recommendations,
      riskAssessment,
      actionPlan,
      trends,
      certificationReadiness
    };
  }

  /**
   * Check specific compliance rule
   */
  async checkRule(ruleId: string, context: ValidationContext): Promise<ComplianceResult> {
    const rule = ComplianceRuleRegistry.getRule(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    return rule.validator(context);
  }

  /**
   * Get compliance score for specific framework
   */
  async getFrameworkScore(framework: ComplianceFramework, context: ValidationContext): Promise<number> {
    const frameworkRules = this.rules.filter(rule => rule.framework === framework);
    const results = await Promise.all(
      frameworkRules.map(rule => rule.validator(context))
    );
    
    return results.length > 0 ? 
      Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length) : 
      0;
  }

  /**
   * Get available frameworks
   */
  getFrameworks(): ComplianceFramework[] {
    return Array.from(this.frameworks);
  }

  /**
   * Get all rules for framework
   */
  getRulesForFramework(framework: ComplianceFramework): ComplianceRule[] {
    return this.rules.filter(rule => rule.framework === framework);
  }

  // Private helper methods
  private generateRiskAssessment(result: ComplianceResult): RiskAssessment {
    const criticalViolations = result.violations.filter(v => v.severity === 'CRITICAL').length;
    const highViolations = result.violations.filter(v => v.severity === 'HIGH').length;
    
    let overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    if (criticalViolations > 0) overallRisk = 'CRITICAL';
    else if (highViolations > 2) overallRisk = 'HIGH';
    else if (highViolations > 0 || result.score < 70) overallRisk = 'MEDIUM';
    else overallRisk = 'LOW';

    // Calculate category risks
    const categoryRisks: Record<RiskCategory, 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = {
      PRIVACY: this.calculateCategoryRisk('PRIVACY', result.violations),
      SECURITY: this.calculateCategoryRisk('SECURITY', result.violations),
      CLINICAL: this.calculateCategoryRisk('CLINICAL', result.violations),
      OPERATIONAL: this.calculateCategoryRisk('OPERATIONAL', result.violations),
      REGULATORY: this.calculateCategoryRisk('REGULATORY', result.violations)
    };

    // Generate top risks
    const topRisks: TopRisk[] = result.violations
      .slice(0, 5)
      .map((violation, index) => ({
        description: violation.message,
        probability: this.calculateProbability(violation),
        impact: this.calculateImpact(violation),
        riskScore: this.calculateRiskScore(violation),
        category: violation.category,
        frameworks: [violation.framework]
      }));

    return {
      overallRisk,
      categoryRisks,
      topRisks,
      mitigationStatus: [] // Would be populated from remediation tracking system
    };
  }

  private generateActionPlan(violations: ComplianceViolation[]): ActionPlan {
    const actions: PrioritizedAction[] = violations.flatMap((violation, index) => 
      violation.remediation.map(remediation => ({
        id: `action_${index}_${remediation.action.replace(/\s+/g, '_').toLowerCase()}`,
        description: remediation.action,
        priority: remediation.priority as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        effort: remediation.effort,
        dependencies: [],
        owner: remediation.responsible[0] || 'Unassigned',
        dueDate: new Date(Date.now() + this.parseTimelineToDays(remediation.timeline) * 24 * 60 * 60 * 1000),
        frameworks: [violation.framework]
      }))
    );

    // Sort by priority and effort
    actions.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Categorize by timeline
    const now = new Date();
    const timeline: ActionTimeline = {
      immediate: actions.filter(a => a.priority === 'CRITICAL'),
      shortTerm: actions.filter(a => a.priority === 'HIGH' && a.dueDate <= new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)),
      mediumTerm: actions.filter(a => a.priority === 'MEDIUM' || (a.priority === 'HIGH' && a.dueDate > new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000))),
      longTerm: actions.filter(a => a.priority === 'LOW')
    };

    return {
      priority: actions.length > 0 ? actions[0].priority : 'LOW',
      actions,
      timeline,
      resources: this.calculateResourceRequirements(actions),
      milestones: this.generateMilestones(actions)
    };
  }

  private calculateCategoryRisk(category: RiskCategory, violations: ComplianceViolation[]): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const categoryViolations = violations.filter(v => v.category === category);
    const criticalCount = categoryViolations.filter(v => v.severity === 'CRITICAL').length;
    const highCount = categoryViolations.filter(v => v.severity === 'HIGH').length;

    if (criticalCount > 0) return 'CRITICAL';
    if (highCount > 1) return 'HIGH';
    if (highCount > 0 || categoryViolations.length > 2) return 'MEDIUM';
    return 'LOW';
  }

  private calculateProbability(violation: ComplianceViolation): number {
    const severityProbability = {
      CRITICAL: 0.9,
      HIGH: 0.7,
      MEDIUM: 0.5,
      LOW: 0.3,
      INFO: 0.1
    };
    return severityProbability[violation.severity];
  }

  private calculateImpact(violation: ComplianceViolation): number {
    const categoryImpact = {
      PRIVACY: 0.9,
      SECURITY: 0.8,
      CLINICAL: 0.95,
      REGULATORY: 0.7,
      OPERATIONAL: 0.5
    };
    return categoryImpact[violation.category];
  }

  private calculateRiskScore(violation: ComplianceViolation): number {
    return this.calculateProbability(violation) * this.calculateImpact(violation) * 100;
  }

  private parseTimelineToDays(timeline: string): number {
    const match = timeline.match(/(\d+)\s*(day|days|week|weeks|month|months)/i);
    if (!match) return 30; // Default to 30 days

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'day':
      case 'days':
        return value;
      case 'week':
      case 'weeks':
        return value * 7;
      case 'month':
      case 'months':
        return value * 30;
      default:
        return 30;
    }
  }

  private calculateResourceRequirements(actions: PrioritizedAction[]): ResourceRequirement[] {
    const requirements: ResourceRequirement[] = [];
    
    // Calculate personnel requirements
    const owners = [...new Set(actions.map(a => a.owner))];
    requirements.push({
      type: 'PERSONNEL',
      description: 'Compliance team members',
      quantity: owners.length,
      timeline: '3-6 months'
    });

    // Calculate technology requirements
    const techActions = actions.filter(a => 
      a.description.toLowerCase().includes('implement') || 
      a.description.toLowerCase().includes('system')
    );
    if (techActions.length > 0) {
      requirements.push({
        type: 'TECHNOLOGY',
        description: 'Compliance tools and systems',
        quantity: Math.ceil(techActions.length / 3),
        timeline: '1-3 months'
      });
    }

    return requirements;
  }

  private generateMilestones(actions: PrioritizedAction[]): Milestone[] {
    const milestones: Milestone[] = [];
    
    if (actions.some(a => a.priority === 'CRITICAL')) {
      milestones.push({
        name: 'Critical Vulnerabilities Remediated',
        description: 'All critical compliance violations have been addressed',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        dependencies: actions.filter(a => a.priority === 'CRITICAL').map(a => a.id),
        deliverables: ['Security patches', 'Process updates', 'Training completion'],
        success_criteria: ['Zero critical violations', 'All systems secure', 'Team trained']
      });
    }

    return milestones;
  }

  private getCertificationName(framework: ComplianceFramework): string {
    const certificationMap: Record<ComplianceFramework, string> = {
      HIPAA: 'HIPAA Compliance Certification',
      GDPR: 'GDPR Compliance Certification',
      FDA: 'FDA Software as Medical Device (SaMD) Approval',
      HL7: 'HL7 Interoperability Certification',
      FHIR: 'FHIR R4 Compliance Certification',
      SOC2: 'SOC 2 Type II Certification',
      HITECH: 'HITECH Compliance Certification',
      STATE_REGULATIONS: 'State Healthcare Regulations Compliance',
      INTERNATIONAL: 'International Healthcare Standards Compliance'
    };
    return certificationMap[framework] || 'Unknown Certification';
  }

  private calculateTimeToReadiness(violations: ComplianceViolation[]): number {
    // Calculate based on violation severity and effort
    let totalDays = 0;
    for (const violation of violations) {
      for (const remediation of violation.remediation) {
        totalDays = Math.max(totalDays, this.parseTimelineToDays(remediation.timeline));
      }
    }
    return totalDays;
  }

  private getRecommendedCertificationPath(framework: ComplianceFramework, violations: ComplianceViolation[]): string[] {
    const basePath = [
      'Conduct gap analysis',
      'Develop remediation plan',
      'Implement security controls',
      'Document processes and procedures',
      'Conduct internal audit',
      'Engage third-party assessor',
      'Submit for certification'
    ];

    // Add framework-specific steps
    if (framework === 'HIPAA') {
      basePath.splice(3, 0, 'Implement Business Associate Agreements');
      basePath.splice(4, 0, 'Conduct risk assessment');
    } else if (framework === 'GDPR') {
      basePath.splice(3, 0, 'Implement consent management');
      basePath.splice(4, 0, 'Establish data processing records');
    } else if (framework === 'FDA') {
      basePath.splice(3, 0, 'Conduct clinical validation studies');
      basePath.splice(4, 0, 'Implement post-market surveillance');
    }

    return basePath;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create compliance context from request data
 */
export function createComplianceContext(
  requestData: any,
  userInfo: any,
  systemInfo: any
): ValidationContext {
  return {
    dataType: classifyData(requestData),
    operationType: determineOperation(requestData),
    userRole: userInfo.role || 'unknown',
    accessContext: {
      userId: userInfo.id,
      userRole: userInfo.role,
      department: userInfo.department || 'unknown',
      location: userInfo.location || 'unknown',
      ipAddress: requestData.ip || 'unknown',
      deviceId: requestData.deviceId || 'unknown',
      sessionId: requestData.sessionId || 'unknown',
      authMethod: userInfo.authMethod || 'PASSWORD',
      consentStatus: userInfo.consentStatus || []
    },
    dataElements: extractDataElements(requestData),
    systemContext: {
      environment: systemInfo.environment || 'DEVELOPMENT',
      version: systemInfo.version || '1.0.0',
      deployment: systemInfo.deployment || 'CLOUD',
      region: systemInfo.region || 'us-east-1',
      encryptionStandard: systemInfo.encryptionStandard || 'AES-256',
      auditingEnabled: systemInfo.auditingEnabled !== false,
      backupStatus: systemInfo.backupStatus || {
        enabled: true,
        frequency: 'daily',
        encrypted: true,
        offsite: true,
        tested: true
      }
    },
    timestamp: new Date(),
    requestId: requestData.requestId || createHash('sha256').update(JSON.stringify(requestData) + Date.now()).digest('hex')
  };
}

function classifyData(data: any): DataClassification {
  const dataStr = JSON.stringify(data).toLowerCase();
  
  if (dataStr.includes('patient') || dataStr.includes('medical') || dataStr.includes('diagnosis')) {
    return 'PHI';
  }
  if (dataStr.includes('email') || dataStr.includes('phone') || dataStr.includes('ssn')) {
    return 'PII';
  }
  if (dataStr.includes('sensitive') || dataStr.includes('confidential')) {
    return 'SENSITIVE';
  }
  
  return 'INTERNAL';
}

function determineOperation(data: any): 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'TRANSMIT' | 'STORE' {
  const method = data.method?.toUpperCase();
  
  switch (method) {
    case 'POST':
      return 'CREATE';
    case 'GET':
      return 'READ';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'READ';
  }
}

function extractDataElements(data: any): DataElement[] {
  const elements: DataElement[] = [];
  
  function extractFromObject(obj: any, prefix = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        extractFromObject(value, fieldName);
      } else {
        elements.push({
          field: fieldName,
          value,
          classification: classifyField(fieldName, value),
          encryption: {
            encrypted: false, // Would be determined by actual system
            keyManagement: 'KMS',
            inTransit: true,
            atRest: false
          },
          accessLog: [],
          retentionPolicy: {
            category: 'general',
            retentionPeriod: 2555, // 7 years in days
            disposalMethod: 'SECURE_DELETE',
            autoDisposal: false,
            legalHold: false
          },
          consentRequired: requiresConsent(fieldName)
        });
      }
    }
  }
  
  if (typeof data === 'object' && data !== null) {
    extractFromObject(data);
  }
  
  return elements;
}

function classifyField(fieldName: string, value: any): DataClassification {
  const field = fieldName.toLowerCase();
  
  // PHI patterns
  if (field.includes('patient') || field.includes('medical') || field.includes('diagnosis') || 
      field.includes('treatment') || field.includes('prescription')) {
    return 'PHI';
  }
  
  // PII patterns  
  if (field.includes('email') || field.includes('phone') || field.includes('ssn') ||
      field.includes('address') || field.includes('name')) {
    return 'PII';
  }
  
  // Sensitive patterns
  if (field.includes('password') || field.includes('token') || field.includes('secret')) {
    return 'SENSITIVE';
  }
  
  return 'INTERNAL';
}

function requiresConsent(fieldName: string): boolean {
  const field = fieldName.toLowerCase();
  return field.includes('email') || field.includes('phone') || field.includes('marketing') ||
         field.includes('analytics') || field.includes('tracking');
}

/**
 * Export default instance for immediate use
 */
export const defaultComplianceValidator = new ComplianceValidator([
  'HIPAA', 
  'GDPR', 
  'FDA', 
  'HL7', 
  'FHIR'
]);

export default ComplianceValidator;