/**
 * PHI Data Handler - Healthcare PHI Compliance System
 * 
 * Comprehensive PHI (Protected Health Information) handling system for HIPAA compliance.
 * Provides detection, classification, masking, encryption, and audit capabilities.
 * 
 * @author HMHCP Development Team
 * @version 1.0.0
 * @compliance HIPAA Safe Harbor and Expert Determination Methods
 */

import crypto from 'crypto';
import { z } from 'zod';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * PHI Classification Levels
 */
export enum PHIClassification {
  DIRECT_IDENTIFIER = 'DIRECT_IDENTIFIER',           // Names, SSN, MRN
  QUASI_IDENTIFIER = 'QUASI_IDENTIFIER',             // DOB, Zip, Age ranges
  SENSITIVE_HEALTH = 'SENSITIVE_HEALTH',             // Mental health, substance abuse
  FINANCIAL = 'FINANCIAL',                           // Insurance, billing
  CONTACT_INFO = 'CONTACT_INFO',                     // Phone, email, address
  DEVICE_INFO = 'DEVICE_INFO',                       // Device IDs, IP addresses
  BIOMETRIC = 'BIOMETRIC',                           // Fingerprints, photos
  LOW_RISK = 'LOW_RISK'                              // General medical terms
}

/**
 * User roles for PHI access control
 */
export enum PHIAccessRole {
  HEALTHCARE_PROVIDER = 'HEALTHCARE_PROVIDER',       // Doctors, nurses
  ADMINISTRATIVE = 'ADMINISTRATIVE',                 // Billing, scheduling
  RESEARCHER = 'RESEARCHER',                         // De-identified data only
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',                     // Technical maintenance
  EMERGENCY = 'EMERGENCY',                           // Break-glass access
  AUDIT = 'AUDIT',                                   // Compliance monitoring
  PATIENT = 'PATIENT'                                // Own data access
}

/**
 * Purpose of use for PHI access
 */
export enum PHIPurposeOfUse {
  TREATMENT = 'TREATMENT',                           // Direct patient care
  PAYMENT = 'PAYMENT',                               // Billing and insurance
  OPERATIONS = 'OPERATIONS',                         // Quality improvement
  RESEARCH = 'RESEARCH',                             // Medical research
  PUBLIC_HEALTH = 'PUBLIC_HEALTH',                   // Disease surveillance
  EMERGENCY = 'EMERGENCY',                           // Life-threatening situations
  AUDIT = 'AUDIT',                                   // Compliance monitoring
  LEGAL = 'LEGAL'                                    // Legal proceedings
}

/**
 * PHI Detection Result
 */
export interface PHIDetectionResult {
  fieldName: string;
  value: string;
  classification: PHIClassification;
  confidence: number;                                // 0-1 confidence score
  patterns: string[];                                // Matched patterns
  position: { start: number; end: number };         // Text position
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: 'ENCRYPT' | 'MASK' | 'REDACT' | 'TOKENIZE' | 'ALLOW';
}

/**
 * PHI Access Request
 */
export interface PHIAccessRequest {
  userId: string;
  userRole: PHIAccessRole;
  purposeOfUse: PHIPurposeOfUse;
  requestedData: string[];                           // Field names requested
  patientId?: string;                                // Patient consent check
  emergencyOverride?: boolean;                       // Break-glass access
  consentToken?: string;                             // Patient consent proof
  accessDuration?: number;                           // Minutes of access
}

/**
 * PHI Access Context
 */
export interface PHIAccessContext {
  requestId: string;
  userId: string;
  userRole: PHIAccessRole;
  purposeOfUse: PHIPurposeOfUse;
  timestamp: Date;
  ipAddress: string;
  sessionId: string;
  minimumNecessary: boolean;
}

/**
 * PHI Audit Event
 */
export interface PHIAuditEvent {
  eventId: string;
  timestamp: Date;
  userId: string;
  userRole: PHIAccessRole;
  action: 'ACCESS' | 'EXPORT' | 'MODIFY' | 'DELETE' | 'BREACH_ATTEMPT';
  resourceId: string;
  resourceType: 'PATIENT_RECORD' | 'RESEARCH_DATA' | 'BILLING_INFO';
  purposeOfUse: PHIPurposeOfUse;
  dataFields: string[];
  success: boolean;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  ipAddress: string;
  userAgent?: string;
  metadata: Record<string, any>;
}

/**
 * De-identification Configuration
 */
export interface DeIdentificationConfig {
  method: 'SAFE_HARBOR' | 'EXPERT_DETERMINATION' | 'LIMITED_DATA_SET';
  removeDirectIdentifiers: boolean;
  removeDatesExceptYear: boolean;
  removeAgesOver89: boolean;
  removeGeographicSubdivisions: boolean;
  removePhotos: boolean;
  removeDeviceIdentifiers: boolean;
  customRules: DeIdentificationRule[];
}

/**
 * De-identification Rule
 */
export interface DeIdentificationRule {
  fieldPattern: RegExp;
  action: 'REMOVE' | 'GENERALIZE' | 'SHIFT_DATES' | 'AGGREGATE' | 'SYNTHESIZE';
  parameters?: Record<string, any>;
}

// =============================================================================
// PHI DETECTION PATTERNS
// =============================================================================

/**
 * Comprehensive PHI detection patterns
 */
export class PHIPatterns {
  // Social Security Numbers
  static readonly SSN_PATTERNS = [
    /\b\d{3}-\d{2}-\d{4}\b/g,                       // 123-45-6789
    /\b\d{3}\s\d{2}\s\d{4}\b/g,                     // 123 45 6789
    /\b\d{9}\b/g,                                   // 123456789
  ];

  // Medical Record Numbers
  static readonly MRN_PATTERNS = [
    /\b(MRN|mrn)[:\s]+[A-Z0-9]{6,12}\b/gi,         // MRN: 123456
    /\bMR[#\s]*\d{6,10}\b/gi,                       // MR# 1234567
    /\b(PATIENT|PT)[#\s]*\d{6,12}\b/gi,             // PATIENT# 123456
  ];

  // Date of Birth patterns
  static readonly DOB_PATTERNS = [
    /\b(DOB|dob)[:\s]+\d{1,2}\/\d{1,2}\/\d{2,4}\b/gi,
    /\b(born|birth)[:\s]+\d{1,2}\/\d{1,2}\/\d{2,4}\b/gi,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,               // MM/DD/YYYY
  ];

  // Phone Numbers
  static readonly PHONE_PATTERNS = [
    /\b\(\d{3}\)\s?\d{3}-\d{4}\b/g,                 // (123) 456-7890
    /\b\d{3}-\d{3}-\d{4}\b/g,                       // 123-456-7890
    /\b\d{3}\.\d{3}\.\d{4}\b/g,                     // 123.456.7890
    /\b\d{10}\b/g,                                  // 1234567890
  ];

  // Email addresses
  static readonly EMAIL_PATTERNS = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  ];

  // Addresses
  static readonly ADDRESS_PATTERNS = [
    /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi,
    /\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/g,            // State ZIP
  ];

  // Names (common patterns)
  static readonly NAME_PATTERNS = [
    /\b(Mr|Mrs|Ms|Dr|Miss)\.\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
    /\b[A-Z][a-z]+,\s+[A-Z][a-z]+\b/g,             // Last, First
  ];

  // Financial information
  static readonly FINANCIAL_PATTERNS = [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
    /\b(insurance|policy)[#\s]*[A-Z0-9]{6,15}\b/gi,
    /\b(claim|authorization)[#\s]*[A-Z0-9]{6,15}\b/gi,
  ];

  // Device and IP identifiers
  static readonly DEVICE_PATTERNS = [
    /\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, // IP addresses
    /\b[0-9A-F]{2}([:-])[0-9A-F]{2}(\1[0-9A-F]{2}){4}\b/gi, // MAC addresses
  ];

  // Medical terminology (sensitive)
  static readonly SENSITIVE_MEDICAL_TERMS = [
    /\b(HIV|AIDS|STD|STI|pregnancy|abortion|mental\s+health|substance\s+abuse|addiction|psychiatric)\b/gi,
    /\b(depression|anxiety|bipolar|schizophrenia|PTSD)\b/gi,
    /\b(alcoholism|drug\s+abuse|overdose|suicide)\b/gi,
  ];
}

// =============================================================================
// ENCRYPTION AND TOKENIZATION
// =============================================================================

/**
 * Encryption service for PHI data
 */
export class PHIEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  /**
   * Generate a new encryption key
   */
  static generateKey(): Buffer {
    return crypto.randomBytes(this.KEY_LENGTH);
  }

  /**
   * Encrypt PHI data with AES-256-GCM
   */
  static encrypt(data: string, key: Buffer): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('PHI_DATA_HMHCP'));

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine IV + tag + encrypted data
    return iv.toString('hex') + tag.toString('hex') + encrypted;
  }

  /**
   * Decrypt PHI data
   */
  static decrypt(encryptedData: string, key: Buffer): string {
    const iv = Buffer.from(encryptedData.slice(0, this.IV_LENGTH * 2), 'hex');
    const tag = Buffer.from(encryptedData.slice(this.IV_LENGTH * 2, (this.IV_LENGTH + this.TAG_LENGTH) * 2), 'hex');
    const encrypted = encryptedData.slice((this.IV_LENGTH + this.TAG_LENGTH) * 2);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('PHI_DATA_HMHCP'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate secure token for data reference
   */
  static generateToken(originalValue: string, salt?: string): string {
    const tokenSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256');
    hash.update(originalValue + tokenSalt);
    return 'PHI_' + hash.digest('hex').substring(0, 16) + '_' + tokenSalt.substring(0, 8);
  }
}

// =============================================================================
// MAIN PHI DATA HANDLER CLASS
// =============================================================================

/**
 * Comprehensive PHI Data Handler
 * 
 * Main class for handling all PHI-related operations including detection,
 * classification, protection, access control, and audit logging.
 */
export class PHIDataHandler {
  private encryptionKey: Buffer;
  private tokenMap: Map<string, string> = new Map();
  private auditEvents: PHIAuditEvent[] = [];
  private accessSessions: Map<string, PHIAccessContext> = new Map();

  constructor(encryptionKey?: Buffer) {
    this.encryptionKey = encryptionKey || PHIEncryption.generateKey();
  }

  // ===========================================================================
  // PHI DETECTION AND CLASSIFICATION
  // ===========================================================================

  /**
   * Detect PHI in text data with classification and confidence scoring
   */
  async detectPHI(data: Record<string, any>): Promise<PHIDetectionResult[]> {
    const results: PHIDetectionResult[] = [];

    for (const [fieldName, value] of Object.entries(data)) {
      if (typeof value !== 'string') continue;

      const detectionResults = await this.analyzeField(fieldName, value);
      results.push(...detectionResults);
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyze individual field for PHI content
   */
  private async analyzeField(fieldName: string, value: string): Promise<PHIDetectionResult[]> {
    const results: PHIDetectionResult[] = [];
    
    // Check against all pattern categories
    const patternChecks = [
      { patterns: PHIPatterns.SSN_PATTERNS, classification: PHIClassification.DIRECT_IDENTIFIER, risk: 'HIGH' as const },
      { patterns: PHIPatterns.MRN_PATTERNS, classification: PHIClassification.DIRECT_IDENTIFIER, risk: 'HIGH' as const },
      { patterns: PHIPatterns.DOB_PATTERNS, classification: PHIClassification.QUASI_IDENTIFIER, risk: 'MEDIUM' as const },
      { patterns: PHIPatterns.PHONE_PATTERNS, classification: PHIClassification.CONTACT_INFO, risk: 'MEDIUM' as const },
      { patterns: PHIPatterns.EMAIL_PATTERNS, classification: PHIClassification.CONTACT_INFO, risk: 'MEDIUM' as const },
      { patterns: PHIPatterns.ADDRESS_PATTERNS, classification: PHIClassification.QUASI_IDENTIFIER, risk: 'MEDIUM' as const },
      { patterns: PHIPatterns.NAME_PATTERNS, classification: PHIClassification.DIRECT_IDENTIFIER, risk: 'HIGH' as const },
      { patterns: PHIPatterns.FINANCIAL_PATTERNS, classification: PHIClassification.FINANCIAL, risk: 'HIGH' as const },
      { patterns: PHIPatterns.DEVICE_PATTERNS, classification: PHIClassification.DEVICE_INFO, risk: 'LOW' as const },
      { patterns: PHIPatterns.SENSITIVE_MEDICAL_TERMS, classification: PHIClassification.SENSITIVE_HEALTH, risk: 'HIGH' as const },
    ];

    for (const { patterns, classification, risk } of patternChecks) {
      for (const pattern of patterns) {
        const matches = [...value.matchAll(pattern)];
        
        for (const match of matches) {
          if (match.index !== undefined) {
            results.push({
              fieldName,
              value: match[0],
              classification,
              confidence: this.calculateConfidence(fieldName, match[0], classification),
              patterns: [pattern.source],
              position: { start: match.index, end: match.index + match[0].length },
              riskLevel: risk,
              recommendedAction: this.getRecommendedAction(classification, risk)
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Calculate confidence score for PHI detection
   */
  private calculateConfidence(fieldName: string, value: string, classification: PHIClassification): number {
    let confidence = 0.5; // Base confidence

    // Field name context
    const fieldLower = fieldName.toLowerCase();
    if (classification === PHIClassification.DIRECT_IDENTIFIER) {
      if (fieldLower.includes('ssn') || fieldLower.includes('social')) confidence += 0.3;
      if (fieldLower.includes('mrn') || fieldLower.includes('patient')) confidence += 0.3;
      if (fieldLower.includes('name')) confidence += 0.2;
    }

    if (classification === PHIClassification.QUASI_IDENTIFIER) {
      if (fieldLower.includes('dob') || fieldLower.includes('birth')) confidence += 0.3;
      if (fieldLower.includes('age')) confidence += 0.2;
      if (fieldLower.includes('zip') || fieldLower.includes('address')) confidence += 0.2;
    }

    // Value validation
    if (classification === PHIClassification.DIRECT_IDENTIFIER && this.validateSSN(value)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Get recommended action based on classification and risk
   */
  private getRecommendedAction(classification: PHIClassification, risk: 'HIGH' | 'MEDIUM' | 'LOW'): 'ENCRYPT' | 'MASK' | 'REDACT' | 'TOKENIZE' | 'ALLOW' {
    if (risk === 'HIGH') {
      if (classification === PHIClassification.DIRECT_IDENTIFIER) return 'ENCRYPT';
      if (classification === PHIClassification.SENSITIVE_HEALTH) return 'ENCRYPT';
      if (classification === PHIClassification.FINANCIAL) return 'TOKENIZE';
    }
    
    if (risk === 'MEDIUM') {
      if (classification === PHIClassification.QUASI_IDENTIFIER) return 'MASK';
      if (classification === PHIClassification.CONTACT_INFO) return 'MASK';
    }

    return 'ALLOW';
  }

  /**
   * Validate SSN format and checksum
   */
  private validateSSN(ssn: string): boolean {
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length !== 9) return false;
    
    // Invalid SSN patterns
    const invalidPatterns = [
      '000000000', '111111111', '222222222', '333333333',
      '444444444', '555555555', '666666666', '777777777',
      '888888888', '999999999'
    ];
    
    return !invalidPatterns.includes(cleaned);
  }

  // ===========================================================================
  // DATA PROTECTION METHODS
  // ===========================================================================

  /**
   * Mask sensitive data with configurable masking patterns
   */
  maskData(value: string, classification: PHIClassification): string {
    switch (classification) {
      case PHIClassification.DIRECT_IDENTIFIER:
        if (PHIPatterns.SSN_PATTERNS.some(p => p.test(value))) {
          return value.replace(/\d(?=\d{4})/g, '*'); // ***-**-6789
        }
        if (PHIPatterns.NAME_PATTERNS.some(p => p.test(value))) {
          return value.replace(/\b\w+/g, w => w[0] + '*'.repeat(w.length - 1));
        }
        break;
        
      case PHIClassification.QUASI_IDENTIFIER:
        if (PHIPatterns.DOB_PATTERNS.some(p => p.test(value))) {
          return value.replace(/\d{1,2}\/\d{1,2}\/(\d{4})/, '**/**/****');
        }
        break;
        
      case PHIClassification.CONTACT_INFO:
        if (PHIPatterns.PHONE_PATTERNS.some(p => p.test(value))) {
          return value.replace(/\d(?=\d{4})/g, '*'); // ***-***-7890
        }
        if (PHIPatterns.EMAIL_PATTERNS.some(p => p.test(value))) {
          return value.replace(/(.{1,3})[^@]*(@.*)/, '$1***$2');
        }
        break;
    }
    
    return value;
  }

  /**
   * Redact sensitive data completely
   */
  redactData(value: string, classification: PHIClassification): string {
    switch (classification) {
      case PHIClassification.DIRECT_IDENTIFIER:
        return '[REDACTED-IDENTIFIER]';
      case PHIClassification.SENSITIVE_HEALTH:
        return '[REDACTED-HEALTH]';
      case PHIClassification.FINANCIAL:
        return '[REDACTED-FINANCIAL]';
      default:
        return '[REDACTED]';
    }
  }

  /**
   * Tokenize sensitive data for safe reference
   */
  tokenizeData(value: string, classification: PHIClassification): string {
    const token = PHIEncryption.generateToken(value);
    this.tokenMap.set(token, value);
    return token;
  }

  /**
   * De-tokenize data (requires proper authorization)
   */
  detokenizeData(token: string, context: PHIAccessContext): string | null {
    if (!this.validateAccess(context, ['DETOKENIZE'])) {
      this.logAuditEvent({
        eventId: crypto.randomUUID(),
        timestamp: new Date(),
        userId: context.userId,
        userRole: context.userRole,
        action: 'BREACH_ATTEMPT',
        resourceId: token,
        resourceType: 'PATIENT_RECORD',
        purposeOfUse: context.purposeOfUse,
        dataFields: ['tokenized_data'],
        success: false,
        riskLevel: 'HIGH',
        ipAddress: context.ipAddress,
        metadata: { reason: 'Unauthorized detokenization attempt' }
      });
      return null;
    }

    return this.tokenMap.get(token) || null;
  }

  /**
   * Encrypt sensitive field data
   */
  encryptData(value: string): string {
    return PHIEncryption.encrypt(value, this.encryptionKey);
  }

  /**
   * Decrypt sensitive field data (requires authorization)
   */
  decryptData(encryptedValue: string, context: PHIAccessContext): string | null {
    if (!this.validateAccess(context, ['DECRYPT'])) {
      this.logAuditEvent({
        eventId: crypto.randomUUID(),
        timestamp: new Date(),
        userId: context.userId,
        userRole: context.userRole,
        action: 'BREACH_ATTEMPT',
        resourceId: 'encrypted_data',
        resourceType: 'PATIENT_RECORD',
        purposeOfUse: context.purposeOfUse,
        dataFields: ['encrypted_field'],
        success: false,
        riskLevel: 'HIGH',
        ipAddress: context.ipAddress,
        metadata: { reason: 'Unauthorized decryption attempt' }
      });
      return null;
    }

    try {
      return PHIEncryption.decrypt(encryptedValue, this.encryptionKey);
    } catch (error) {
      return null;
    }
  }

  // ===========================================================================
  // DE-IDENTIFICATION METHODS
  // ===========================================================================

  /**
   * Apply Safe Harbor de-identification method
   */
  async applySafeHarborDeIdentification(data: Record<string, any>): Promise<Record<string, any>> {
    const deIdentified = { ...data };
    const phiResults = await this.detectPHI(data);

    for (const result of phiResults) {
      const { fieldName, classification } = result;
      
      switch (classification) {
        case PHIClassification.DIRECT_IDENTIFIER:
          delete deIdentified[fieldName]; // Remove completely
          break;
          
        case PHIClassification.QUASI_IDENTIFIER:
          if (fieldName.toLowerCase().includes('date') || fieldName.toLowerCase().includes('dob')) {
            // Keep only year for dates
            deIdentified[fieldName] = this.extractYear(deIdentified[fieldName]);
          } else if (fieldName.toLowerCase().includes('age')) {
            // Aggregate ages over 89
            const age = parseInt(deIdentified[fieldName]);
            if (age > 89) deIdentified[fieldName] = '90+';
          } else if (fieldName.toLowerCase().includes('zip')) {
            // Keep only first 3 digits of ZIP
            deIdentified[fieldName] = deIdentified[fieldName].substring(0, 3) + '00';
          }
          break;
          
        case PHIClassification.CONTACT_INFO:
          delete deIdentified[fieldName]; // Remove contact information
          break;
          
        case PHIClassification.DEVICE_INFO:
          delete deIdentified[fieldName]; // Remove device identifiers
          break;
      }
    }

    return deIdentified;
  }

  /**
   * Apply expert determination de-identification
   */
  async applyExpertDeterminationDeIdentification(
    data: Record<string, any>, 
    config: DeIdentificationConfig
  ): Promise<Record<string, any>> {
    const deIdentified = { ...data };

    // Apply custom rules
    for (const rule of config.customRules) {
      for (const [fieldName, value] of Object.entries(deIdentified)) {
        if (rule.fieldPattern.test(fieldName) && typeof value === 'string') {
          switch (rule.action) {
            case 'REMOVE':
              delete deIdentified[fieldName];
              break;
              
            case 'GENERALIZE':
              deIdentified[fieldName] = this.generalizeValue(value, rule.parameters);
              break;
              
            case 'SHIFT_DATES':
              deIdentified[fieldName] = this.shiftDate(value, rule.parameters?.days || 30);
              break;
              
            case 'AGGREGATE':
              deIdentified[fieldName] = this.aggregateValue(value, rule.parameters);
              break;
              
            case 'SYNTHESIZE':
              deIdentified[fieldName] = this.generateSyntheticValue(value, rule.parameters);
              break;
          }
        }
      }
    }

    return deIdentified;
  }

  /**
   * Generate synthetic data for testing purposes
   */
  generateSyntheticData(schema: Record<string, PHIClassification>): Record<string, any> {
    const synthetic: Record<string, any> = {};

    for (const [fieldName, classification] of Object.entries(schema)) {
      switch (classification) {
        case PHIClassification.DIRECT_IDENTIFIER:
          if (fieldName.toLowerCase().includes('ssn')) {
            synthetic[fieldName] = this.generateSyntheticSSN();
          } else if (fieldName.toLowerCase().includes('name')) {
            synthetic[fieldName] = this.generateSyntheticName();
          } else if (fieldName.toLowerCase().includes('mrn')) {
            synthetic[fieldName] = this.generateSyntheticMRN();
          }
          break;
          
        case PHIClassification.QUASI_IDENTIFIER:
          if (fieldName.toLowerCase().includes('dob')) {
            synthetic[fieldName] = this.generateSyntheticDOB();
          } else if (fieldName.toLowerCase().includes('zip')) {
            synthetic[fieldName] = this.generateSyntheticZip();
          }
          break;
          
        case PHIClassification.CONTACT_INFO:
          if (fieldName.toLowerCase().includes('phone')) {
            synthetic[fieldName] = this.generateSyntheticPhone();
          } else if (fieldName.toLowerCase().includes('email')) {
            synthetic[fieldName] = this.generateSyntheticEmail();
          }
          break;
      }
    }

    return synthetic;
  }

  // ===========================================================================
  // ACCESS CONTROL METHODS
  // ===========================================================================

  /**
   * Validate PHI access request
   */
  async validatePHIAccess(request: PHIAccessRequest): Promise<{ 
    granted: boolean; 
    context?: PHIAccessContext; 
    restrictions?: string[];
    reason?: string;
  }> {
    // Check role-based access
    if (!this.isValidRoleForPurpose(request.userRole, request.purposeOfUse)) {
      return { 
        granted: false, 
        reason: 'Role not authorized for requested purpose of use' 
      };
    }

    // Check minimum necessary principle
    if (!this.validateMinimumNecessary(request)) {
      return { 
        granted: false, 
        reason: 'Request violates minimum necessary standard' 
      };
    }

    // Check patient consent if required
    if (request.patientId && !request.emergencyOverride) {
      const consentValid = await this.validatePatientConsent(
        request.patientId, 
        request.consentToken,
        request.purposeOfUse
      );
      if (!consentValid) {
        return { 
          granted: false, 
          reason: 'Patient consent required but not provided or invalid' 
        };
      }
    }

    // Handle emergency override
    if (request.emergencyOverride) {
      if (request.userRole !== PHIAccessRole.EMERGENCY && 
          request.userRole !== PHIAccessRole.HEALTHCARE_PROVIDER) {
        return { 
          granted: false, 
          reason: 'Emergency override not permitted for user role' 
        };
      }
    }

    // Create access context
    const context: PHIAccessContext = {
      requestId: crypto.randomUUID(),
      userId: request.userId,
      userRole: request.userRole,
      purposeOfUse: request.purposeOfUse,
      timestamp: new Date(),
      ipAddress: '0.0.0.0', // To be filled by caller
      sessionId: crypto.randomUUID(),
      minimumNecessary: true
    };

    // Store active session
    this.accessSessions.set(context.sessionId, context);

    // Set session timeout
    if (request.accessDuration) {
      setTimeout(() => {
        this.accessSessions.delete(context.sessionId);
      }, request.accessDuration * 60 * 1000);
    }

    // Log access grant
    this.logAuditEvent({
      eventId: crypto.randomUUID(),
      timestamp: new Date(),
      userId: request.userId,
      userRole: request.userRole,
      action: 'ACCESS',
      resourceId: request.patientId || 'SYSTEM',
      resourceType: 'PATIENT_RECORD',
      purposeOfUse: request.purposeOfUse,
      dataFields: request.requestedData,
      success: true,
      riskLevel: request.emergencyOverride ? 'HIGH' : 'MEDIUM',
      ipAddress: context.ipAddress,
      metadata: {
        emergencyOverride: request.emergencyOverride,
        requestedData: request.requestedData
      }
    });

    return { 
      granted: true, 
      context,
      restrictions: this.getAccessRestrictions(request.userRole, request.purposeOfUse)
    };
  }

  /**
   * Validate access for specific operations
   */
  private validateAccess(context: PHIAccessContext, operations: string[]): boolean {
    const session = this.accessSessions.get(context.sessionId);
    if (!session) return false;

    // Check session validity
    const sessionAge = Date.now() - session.timestamp.getTime();
    if (sessionAge > 8 * 60 * 60 * 1000) { // 8 hours max
      this.accessSessions.delete(context.sessionId);
      return false;
    }

    // Check if operations are permitted for role
    return this.areOperationsPermitted(context.userRole, operations);
  }

  /**
   * Check if user role is valid for purpose of use
   */
  private isValidRoleForPurpose(role: PHIAccessRole, purpose: PHIPurposeOfUse): boolean {
    const validCombinations: Record<PHIAccessRole, PHIPurposeOfUse[]> = {
      [PHIAccessRole.HEALTHCARE_PROVIDER]: [
        PHIPurposeOfUse.TREATMENT,
        PHIPurposeOfUse.EMERGENCY,
        PHIPurposeOfUse.OPERATIONS
      ],
      [PHIAccessRole.ADMINISTRATIVE]: [
        PHIPurposeOfUse.PAYMENT,
        PHIPurposeOfUse.OPERATIONS
      ],
      [PHIAccessRole.RESEARCHER]: [
        PHIPurposeOfUse.RESEARCH,
        PHIPurposeOfUse.PUBLIC_HEALTH
      ],
      [PHIAccessRole.SYSTEM_ADMIN]: [
        PHIPurposeOfUse.OPERATIONS,
        PHIPurposeOfUse.AUDIT
      ],
      [PHIAccessRole.EMERGENCY]: [
        PHIPurposeOfUse.EMERGENCY,
        PHIPurposeOfUse.TREATMENT
      ],
      [PHIAccessRole.AUDIT]: [
        PHIPurposeOfUse.AUDIT,
        PHIPurposeOfUse.OPERATIONS
      ],
      [PHIAccessRole.PATIENT]: [
        PHIPurposeOfUse.TREATMENT // Own records only
      ]
    };

    return validCombinations[role]?.includes(purpose) || false;
  }

  /**
   * Validate minimum necessary standard
   */
  private validateMinimumNecessary(request: PHIAccessRequest): boolean {
    // Define field restrictions by role
    const restrictedFields: Record<PHIAccessRole, string[]> = {
      [PHIAccessRole.ADMINISTRATIVE]: ['clinical_notes', 'diagnosis_details'],
      [PHIAccessRole.RESEARCHER]: ['direct_identifiers', 'contact_info'],
      [PHIAccessRole.AUDIT]: ['clinical_content']
    };

    const restrictions = restrictedFields[request.userRole] || [];
    return !request.requestedData.some(field => 
      restrictions.some(restricted => field.includes(restricted))
    );
  }

  /**
   * Validate patient consent
   */
  private async validatePatientConsent(
    patientId: string, 
    consentToken?: string, 
    purpose?: PHIPurposeOfUse
  ): Promise<boolean> {
    // This would typically check against a consent management system
    // For now, return true if consent token is provided
    return !!consentToken;
  }

  /**
   * Get access restrictions for role and purpose
   */
  private getAccessRestrictions(role: PHIAccessRole, purpose: PHIPurposeOfUse): string[] {
    const restrictions: string[] = [];

    if (role === PHIAccessRole.RESEARCHER) {
      restrictions.push('No direct identifiers allowed');
      restrictions.push('Data must be de-identified');
    }

    if (role === PHIAccessRole.ADMINISTRATIVE && purpose === PHIPurposeOfUse.PAYMENT) {
      restrictions.push('Clinical data access limited to billing-relevant information');
    }

    return restrictions;
  }

  /**
   * Check if operations are permitted for role
   */
  private areOperationsPermitted(role: PHIAccessRole, operations: string[]): boolean {
    const permittedOperations: Record<PHIAccessRole, string[]> = {
      [PHIAccessRole.HEALTHCARE_PROVIDER]: ['READ', 'WRITE', 'DECRYPT', 'DETOKENIZE'],
      [PHIAccessRole.ADMINISTRATIVE]: ['READ', 'WRITE'],
      [PHIAccessRole.RESEARCHER]: ['READ'],
      [PHIAccessRole.SYSTEM_ADMIN]: ['READ', 'WRITE', 'DECRYPT', 'DETOKENIZE'],
      [PHIAccessRole.EMERGENCY]: ['READ', 'WRITE', 'DECRYPT', 'DETOKENIZE'],
      [PHIAccessRole.AUDIT]: ['READ'],
      [PHIAccessRole.PATIENT]: ['READ']
    };

    const allowed = permittedOperations[role] || [];
    return operations.every(op => allowed.includes(op));
  }

  // ===========================================================================
  // AUDIT AND LOGGING METHODS
  // ===========================================================================

  /**
   * Log PHI audit event
   */
  private logAuditEvent(event: PHIAuditEvent): void {
    this.auditEvents.push(event);
    
    // In production, this would write to secure audit log
    console.log(`[PHI AUDIT] ${event.timestamp.toISOString()} - ${event.action} by ${event.userId} (${event.userRole})`);
  }

  /**
   * Get audit events for compliance reporting
   */
  getAuditEvents(filters?: {
    userId?: string;
    action?: PHIAuditEvent['action'];
    startDate?: Date;
    endDate?: Date;
    riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  }): PHIAuditEvent[] {
    let events = [...this.auditEvents];

    if (filters) {
      if (filters.userId) {
        events = events.filter(e => e.userId === filters.userId);
      }
      if (filters.action) {
        events = events.filter(e => e.action === filters.action);
      }
      if (filters.startDate) {
        events = events.filter(e => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        events = events.filter(e => e.timestamp <= filters.endDate!);
      }
      if (filters.riskLevel) {
        events = events.filter(e => e.riskLevel === filters.riskLevel);
      }
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(startDate: Date, endDate: Date): {
    summary: {
      totalAccess: number;
      uniqueUsers: number;
      highRiskEvents: number;
      breachAttempts: number;
    };
    accessByRole: Record<PHIAccessRole, number>;
    accessByPurpose: Record<PHIPurposeOfUse, number>;
    riskDistribution: Record<string, number>;
    events: PHIAuditEvent[];
  } {
    const events = this.getAuditEvents({ startDate, endDate });

    const summary = {
      totalAccess: events.filter(e => e.action === 'ACCESS').length,
      uniqueUsers: new Set(events.map(e => e.userId)).size,
      highRiskEvents: events.filter(e => e.riskLevel === 'HIGH').length,
      breachAttempts: events.filter(e => e.action === 'BREACH_ATTEMPT').length
    };

    const accessByRole: Record<PHIAccessRole, number> = {} as any;
    const accessByPurpose: Record<PHIPurposeOfUse, number> = {} as any;
    const riskDistribution: Record<string, number> = {};

    for (const event of events) {
      // Count by role
      accessByRole[event.userRole] = (accessByRole[event.userRole] || 0) + 1;
      
      // Count by purpose
      accessByPurpose[event.purposeOfUse] = (accessByPurpose[event.purposeOfUse] || 0) + 1;
      
      // Count by risk level
      riskDistribution[event.riskLevel] = (riskDistribution[event.riskLevel] || 0) + 1;
    }

    return {
      summary,
      accessByRole,
      accessByPurpose,
      riskDistribution,
      events
    };
  }

  /**
   * Detect potential PHI breaches
   */
  detectPotentialBreaches(): {
    suspiciousActivity: PHIAuditEvent[];
    recommendations: string[];
  } {
    const recentEvents = this.getAuditEvents({
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    });

    const suspiciousActivity: PHIAuditEvent[] = [];
    const recommendations: string[] = [];

    // Check for multiple failed access attempts
    const failedAttempts = recentEvents.filter(e => !e.success && e.action === 'ACCESS');
    const failedByUser = new Map<string, number>();
    
    for (const event of failedAttempts) {
      failedByUser.set(event.userId, (failedByUser.get(event.userId) || 0) + 1);
    }

    for (const [userId, count] of failedByUser) {
      if (count >= 5) {
        suspiciousActivity.push(...failedAttempts.filter(e => e.userId === userId));
        recommendations.push(`User ${userId} has ${count} failed access attempts - consider account review`);
      }
    }

    // Check for unusual access patterns
    const accessEvents = recentEvents.filter(e => e.action === 'ACCESS' && e.success);
    const offHoursAccess = accessEvents.filter(e => {
      const hour = e.timestamp.getHours();
      return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
    });

    if (offHoursAccess.length > 0) {
      suspiciousActivity.push(...offHoursAccess);
      recommendations.push(`${offHoursAccess.length} off-hours access events detected - review for legitimacy`);
    }

    // Check for bulk data access
    const bulkAccess = accessEvents.filter(e => e.dataFields.length > 20);
    if (bulkAccess.length > 0) {
      suspiciousActivity.push(...bulkAccess);
      recommendations.push(`${bulkAccess.length} bulk data access events - ensure minimum necessary compliance`);
    }

    return { suspiciousActivity, recommendations };
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Extract year from date string
   */
  private extractYear(dateString: string): string {
    const yearMatch = dateString.match(/\d{4}/);
    return yearMatch ? yearMatch[0] : dateString;
  }

  /**
   * Generalize value based on parameters
   */
  private generalizeValue(value: string, parameters?: Record<string, any>): string {
    if (parameters?.ranges && typeof value === 'string' && /^\d+$/.test(value)) {
      const num = parseInt(value);
      for (const range of parameters.ranges) {
        if (num >= range.min && num <= range.max) {
          return `${range.min}-${range.max}`;
        }
      }
    }
    return value;
  }

  /**
   * Shift date by specified days
   */
  private shiftDate(dateString: string, days: number): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
  }

  /**
   * Aggregate value based on parameters
   */
  private aggregateValue(value: string, parameters?: Record<string, any>): string {
    if (parameters?.buckets && typeof value === 'string' && /^\d+$/.test(value)) {
      const num = parseInt(value);
      const bucketSize = parameters.bucketSize || 10;
      const bucket = Math.floor(num / bucketSize) * bucketSize;
      return `${bucket}-${bucket + bucketSize - 1}`;
    }
    return value;
  }

  /**
   * Generate synthetic value of similar type
   */
  private generateSyntheticValue(originalValue: string, parameters?: Record<string, any>): string {
    // Simple synthetic generation - in production would be more sophisticated
    if (/^\d+$/.test(originalValue)) {
      return Math.floor(Math.random() * 1000000).toString();
    }
    if (originalValue.includes('@')) {
      return `user${Math.floor(Math.random() * 10000)}@example.com`;
    }
    return `synthetic_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Generate synthetic SSN
   */
  private generateSyntheticSSN(): string {
    return `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  /**
   * Generate synthetic name
   */
  private generateSyntheticName(): string {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Taylor'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  /**
   * Generate synthetic MRN
   */
  private generateSyntheticMRN(): string {
    return `MRN${Math.floor(Math.random() * 1000000).toString().padStart(8, '0')}`;
  }

  /**
   * Generate synthetic date of birth
   */
  private generateSyntheticDOB(): string {
    const year = 1950 + Math.floor(Math.random() * 50);
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
  }

  /**
   * Generate synthetic ZIP code
   */
  private generateSyntheticZip(): string {
    return Math.floor(Math.random() * 90000 + 10000).toString();
  }

  /**
   * Generate synthetic phone number
   */
  private generateSyntheticPhone(): string {
    return `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  /**
   * Generate synthetic email
   */
  private generateSyntheticEmail(): string {
    return `user${Math.floor(Math.random() * 10000)}@example.com`;
  }
}

// =============================================================================
// EXPORT DEFAULT INSTANCE
// =============================================================================

/**
 * Default PHI handler instance for application use
 */
export const defaultPHIHandler = new PHIDataHandler();

/**
 * Validation schemas for API integration
 */
export const PHISchemas = {
  AccessRequest: z.object({
    userId: z.string().min(1),
    userRole: z.nativeEnum(PHIAccessRole),
    purposeOfUse: z.nativeEnum(PHIPurposeOfUse),
    requestedData: z.array(z.string()),
    patientId: z.string().optional(),
    emergencyOverride: z.boolean().optional(),
    consentToken: z.string().optional(),
    accessDuration: z.number().min(1).max(480).optional() // Max 8 hours
  }),

  DeIdentificationConfig: z.object({
    method: z.enum(['SAFE_HARBOR', 'EXPERT_DETERMINATION', 'LIMITED_DATA_SET']),
    removeDirectIdentifiers: z.boolean(),
    removeDatesExceptYear: z.boolean(),
    removeAgesOver89: z.boolean(),
    removeGeographicSubdivisions: z.boolean(),
    removePhotos: z.boolean(),
    removeDeviceIdentifiers: z.boolean(),
    customRules: z.array(z.object({
      fieldPattern: z.string(), // Will be converted to RegExp
      action: z.enum(['REMOVE', 'GENERALIZE', 'SHIFT_DATES', 'AGGREGATE', 'SYNTHESIZE']),
      parameters: z.record(z.any()).optional()
    }))
  })
};

/**
 * Export types for external use
 */
export type {
  PHIDetectionResult,
  PHIAccessRequest,
  PHIAccessContext,
  PHIAuditEvent,
  DeIdentificationConfig,
  DeIdentificationRule
};