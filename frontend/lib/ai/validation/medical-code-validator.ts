/**
 * Medical Code Validator
 * HMHCP Healthcare AI Platform
 * 
 * Comprehensive validation for medical coding systems including
 * ICD-10, CPT, HCPCS, SNOMED CT, and other healthcare coding standards.
 */

import { ValidationResult, ValidationError, ValidationWarning, ValidationSuggestion } from './medical-validator';

export interface MedicalCode {
  code: string;
  system: 'icd10' | 'icd11' | 'cpt' | 'hcpcs' | 'snomed' | 'loinc' | 'rxnorm' | 'ndc';
  description: string;
  category: string;
  subcategory?: string;
  billable?: boolean;
  gender?: 'male' | 'female' | 'both';
  ageRange?: { min?: number; max?: number };
  includes?: string[];
  excludes?: string[];
  notes?: string[];
  effectiveDate?: Date;
  deprecatedDate?: Date;
  replacedBy?: string;
  addedInVersion?: string;
  modifiedInVersion?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CodeValidationOptions {
  checkFormat: boolean;
  verifyExistence: boolean;
  checkBillability: boolean;
  validateCombinations: boolean;
  checkGenderApplicability: boolean;
  checkAgeApplicability: boolean;
  verifyCurrentVersion: boolean;
  requirePrimaryDiagnosis: boolean;
  allowDeprecatedCodes: boolean;
}

export interface CodeCombination {
  primaryCode: string;
  secondaryCodes: string[];
  system: string;
  validCombination: boolean;
  conflictingCodes: string[];
  requiredCodes: string[];
  recommendations: string[];
}

export interface BillingValidation {
  code: string;
  billable: boolean;
  requiresModifier: boolean;
  suggestedModifiers: string[];
  bundledWith: string[];
  mutuallyExclusive: string[];
  frequencyLimitations: string[];
  coverageLimitations: string[];
}

export interface PatientContext {
  age: number;
  gender: 'male' | 'female' | 'other';
  primaryDiagnosis?: string;
  secondaryDiagnoses: string[];
  procedures: string[];
  admissionType?: 'inpatient' | 'outpatient' | 'emergency' | 'observation';
  serviceDate: Date;
  provider: {
    specialty: string;
    npi?: string;
    credentials: string[];
  };
}

/**
 * Medical Code Validator Class
 * Provides comprehensive medical code validation across multiple coding systems
 */
export class MedicalCodeValidator {
  private icd10Codes: Map<string, MedicalCode>;
  private cptCodes: Map<string, MedicalCode>;
  private hcpcsCodes: Map<string, MedicalCode>;
  private snomedCodes: Map<string, MedicalCode>;
  private loincCodes: Map<string, MedicalCode>;
  private codeRelationships: Map<string, string[]>;
  private billingRules: Map<string, BillingValidation>;
  private codeVersions: Map<string, string>;

  constructor() {
    this.icd10Codes = new Map();
    this.cptCodes = new Map();
    this.hcpcsCodes = new Map();
    this.snomedCodes = new Map();
    this.loincCodes = new Map();
    this.codeRelationships = new Map();
    this.billingRules = new Map();
    this.codeVersions = new Map();
    
    this.initializeCodeDatabases();
  }

  /**
   * Validate medical codes with patient context
   */
  async validateMedicalCodes(
    codes: Array<{ code: string; system: string }>,
    patientContext?: PatientContext,
    options: Partial<CodeValidationOptions> = {}
  ): Promise<ValidationResult> {
    const defaultOptions: CodeValidationOptions = {
      checkFormat: true,
      verifyExistence: true,
      checkBillability: true,
      validateCombinations: true,
      checkGenderApplicability: true,
      checkAgeApplicability: true,
      verifyCurrentVersion: true,
      requirePrimaryDiagnosis: false,
      allowDeprecatedCodes: false
    };

    const validationOptions = { ...defaultOptions, ...options };
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      for (let i = 0; i < codes.length; i++) {
        const { code, system } = codes[i];
        const codeIndex = i + 1;

        // Format validation
        if (validationOptions.checkFormat) {
          const formatResult = this.validateCodeFormat(code, system);
          if (!formatResult.isValid) {
            errors.push({
              code: 'INVALID_CODE_FORMAT',
              message: `Code ${codeIndex} (${code}): ${formatResult.issue}`,
              field: 'medicalCodes',
              severity: 'major',
              correction: formatResult.suggestion,
              confidence: 0.95
            });
            continue; // Skip further validation if format is invalid
          }
        }

        // Code existence validation
        if (validationOptions.verifyExistence) {
          const existenceResult = this.verifyCodeExistence(code, system);
          if (!existenceResult.exists) {
            errors.push({
              code: 'CODE_NOT_FOUND',
              message: `Code ${codeIndex} (${code}): Not found in ${system.toUpperCase()} database`,
              field: 'medicalCodes',
              severity: 'major',
              correction: existenceResult.suggestion,
              confidence: 0.9
            });
            continue;
          }

          const codeInfo = existenceResult.codeInfo!;

          // Version validation
          if (validationOptions.verifyCurrentVersion && codeInfo.deprecatedDate) {
            if (!validationOptions.allowDeprecatedCodes) {
              errors.push({
                code: 'DEPRECATED_CODE',
                message: `Code ${codeIndex} (${code}): Deprecated since ${codeInfo.deprecatedDate.toDateString()}`,
                field: 'medicalCodes',
                severity: 'major',
                correction: codeInfo.replacedBy ? `Use replacement code: ${codeInfo.replacedBy}` : 'Find current equivalent code',
                confidence: 0.95
              });
            } else {
              warnings.push({
                code: 'DEPRECATED_CODE_WARNING',
                message: `Code ${codeIndex} (${code}): Deprecated code in use`,
                field: 'medicalCodes',
                recommendation: 'Consider updating to current code'
              });
            }
          }

          // Gender applicability
          if (validationOptions.checkGenderApplicability && patientContext && codeInfo.gender) {
            if (codeInfo.gender !== 'both' && 
                patientContext.gender !== 'other' && 
                codeInfo.gender !== patientContext.gender) {
              errors.push({
                code: 'GENDER_MISMATCH',
                message: `Code ${codeIndex} (${code}): Not applicable to ${patientContext.gender} patients`,
                field: 'medicalCodes',
                severity: 'major',
                confidence: 0.9
              });
            }
          }

          // Age applicability
          if (validationOptions.checkAgeApplicability && patientContext && codeInfo.ageRange) {
            const { min, max } = codeInfo.ageRange;
            if ((min !== undefined && patientContext.age < min) ||
                (max !== undefined && patientContext.age > max)) {
              errors.push({
                code: 'AGE_MISMATCH',
                message: `Code ${codeIndex} (${code}): Not applicable to age ${patientContext.age}`,
                field: 'medicalCodes',
                severity: 'major',
                correction: `Code applies to ages ${min || 0}-${max || '∞'}`,
                confidence: 0.9
              });
            }
          }

          // Billability check
          if (validationOptions.checkBillability && system === 'icd10') {
            if (codeInfo.billable === false) {
              warnings.push({
                code: 'NON_BILLABLE_CODE',
                message: `Code ${codeIndex} (${code}): Not billable, may require more specific code`,
                field: 'medicalCodes',
                recommendation: 'Use more specific code for billing purposes'
              });
            }
          }
        }
      }

      // Code combination validation
      if (validationOptions.validateCombinations && codes.length > 1) {
        const combinationResults = this.validateCodeCombinations(codes, patientContext);
        errors.push(...combinationResults.errors);
        warnings.push(...combinationResults.warnings);
        suggestions.push(...combinationResults.suggestions);
      }

      // Primary diagnosis requirement
      if (validationOptions.requirePrimaryDiagnosis && patientContext) {
        const hasPrimaryDiagnosis = codes.some(({ system }) => system === 'icd10');
        if (!hasPrimaryDiagnosis) {
          errors.push({
            code: 'MISSING_PRIMARY_DIAGNOSIS',
            message: 'Primary diagnosis (ICD-10) code required',
            field: 'medicalCodes',
            severity: 'major',
            confidence: 1.0
          });
        }
      }

      // Billing validation
      if (validationOptions.checkBillability) {
        const billingResults = this.validateBillingCodes(codes, patientContext);
        warnings.push(...billingResults.warnings);
        suggestions.push(...billingResults.suggestions);
      }

      const confidence = this.calculateCodeValidationConfidence(errors, warnings, codes.length);

      return {
        isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'major').length === 0,
        severity: this.getHighestSeverity(errors),
        confidence,
        errors,
        warnings,
        suggestions,
        auditTrail: [{
          timestamp: new Date(),
          validationType: 'medical_code_validation',
          result: errors.length > 0 ? 'fail' : (warnings.length > 0 ? 'warning' : 'pass'),
          details: `Validated ${codes.length} codes across ${new Set(codes.map(c => c.system)).size} coding systems`
        }]
      };

    } catch (error) {
      return {
        isValid: false,
        severity: 'critical',
        confidence: 0,
        errors: [{
          code: 'CODE_VALIDATION_ERROR',
          message: 'Failed to validate medical codes',
          field: 'medicalCodes',
          severity: 'critical',
          confidence: 1
        }],
        warnings: [],
        suggestions: [],
        auditTrail: [{
          timestamp: new Date(),
          validationType: 'medical_code_validation',
          result: 'fail',
          details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  /**
   * Validate single medical code
   */
  async validateSingleCode(
    code: string, 
    system: string, 
    patientContext?: PatientContext
  ): Promise<{
    isValid: boolean;
    codeInfo: MedicalCode | null;
    issues: string[];
    recommendations: string[];
    billingInfo?: BillingValidation;
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Format validation
    const formatResult = this.validateCodeFormat(code, system);
    if (!formatResult.isValid) {
      issues.push(formatResult.issue!);
      if (formatResult.suggestion) {
        recommendations.push(formatResult.suggestion);
      }
    }

    // Existence validation
    const existenceResult = this.verifyCodeExistence(code, system);
    if (!existenceResult.exists) {
      issues.push(`Code not found in ${system.toUpperCase()} database`);
      if (existenceResult.suggestion) {
        recommendations.push(existenceResult.suggestion);
      }
      
      return {
        isValid: false,
        codeInfo: null,
        issues,
        recommendations
      };
    }

    const codeInfo = existenceResult.codeInfo!;

    // Patient context validation
    if (patientContext) {
      if (codeInfo.gender && codeInfo.gender !== 'both' && 
          patientContext.gender !== 'other' && 
          codeInfo.gender !== patientContext.gender) {
        issues.push(`Not applicable to ${patientContext.gender} patients`);
      }

      if (codeInfo.ageRange) {
        const { min, max } = codeInfo.ageRange;
        if ((min !== undefined && patientContext.age < min) ||
            (max !== undefined && patientContext.age > max)) {
          issues.push(`Not applicable to age ${patientContext.age}`);
          recommendations.push(`Code applies to ages ${min || 0}-${max || '∞'}`);
        }
      }
    }

    // Deprecated code check
    if (codeInfo.deprecatedDate) {
      issues.push(`Code deprecated since ${codeInfo.deprecatedDate.toDateString()}`);
      if (codeInfo.replacedBy) {
        recommendations.push(`Use replacement code: ${codeInfo.replacedBy}`);
      }
    }

    // Billing information
    const billingInfo = this.billingRules.get(code);

    return {
      isValid: issues.length === 0,
      codeInfo,
      issues,
      recommendations,
      billingInfo
    };
  }

  /**
   * Search for codes by description
   */
  async searchCodes(
    query: string, 
    system: string, 
    limit: number = 10
  ): Promise<Array<{
    code: string;
    description: string;
    relevanceScore: number;
    category: string;
    billable?: boolean;
  }>> {
    const results: Array<{
      code: string;
      description: string;
      relevanceScore: number;
      category: string;
      billable?: boolean;
    }> = [];

    const codeMap = this.getCodeMap(system);
    if (!codeMap) return results;

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    codeMap.forEach((codeInfo, code) => {
      const descriptionLower = codeInfo.description.toLowerCase();
      
      // Calculate relevance score
      let relevanceScore = 0;
      
      // Exact phrase match
      if (descriptionLower.includes(queryLower)) {
        relevanceScore += 1.0;
      }
      
      // Word matches
      const matchedWords = queryWords.filter(word => descriptionLower.includes(word));
      relevanceScore += (matchedWords.length / queryWords.length) * 0.5;
      
      // Category match
      if (codeInfo.category.toLowerCase().includes(queryLower)) {
        relevanceScore += 0.3;
      }

      if (relevanceScore > 0.2) {
        results.push({
          code,
          description: codeInfo.description,
          relevanceScore,
          category: codeInfo.category,
          billable: codeInfo.billable
        });
      }
    });

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get code hierarchy (parent/child relationships)
   */
  getCodeHierarchy(code: string, system: string): {
    parent?: string;
    children: string[];
    siblings: string[];
    level: number;
  } {
    // Simplified hierarchy for ICD-10
    if (system === 'icd10') {
      const level = this.getICD10Level(code);
      const parent = this.getICD10Parent(code);
      const children = this.getICD10Children(code);
      const siblings = parent ? this.getICD10Children(parent).filter(c => c !== code) : [];

      return { parent, children, siblings, level };
    }

    return { children: [], siblings: [], level: 0 };
  }

  /**
   * Get suggested codes based on input
   */
  getSuggestedCodes(
    partialCode: string, 
    system: string, 
    limit: number = 5
  ): Array<{
    code: string;
    description: string;
    completionScore: number;
  }> {
    const suggestions: Array<{
      code: string;
      description: string;
      completionScore: number;
    }> = [];

    const codeMap = this.getCodeMap(system);
    if (!codeMap) return suggestions;

    const partialLower = partialCode.toLowerCase();

    codeMap.forEach((codeInfo, code) => {
      if (code.toLowerCase().startsWith(partialLower)) {
        const completionScore = partialCode.length / code.length;
        suggestions.push({
          code,
          description: codeInfo.description,
          completionScore
        });
      }
    });

    return suggestions
      .sort((a, b) => b.completionScore - a.completionScore)
      .slice(0, limit);
  }

  // Private helper methods

  private initializeCodeDatabases(): void {
    this.initializeICD10Codes();
    this.initializeCPTCodes();
    this.initializeHCPCSCodes();
    this.initializeSNOMEDCodes();
    this.initializeLOINCCodes();
    this.initializeBillingRules();
    this.initializeCodeRelationships();
  }

  private initializeICD10Codes(): void {
    const icd10Codes: MedicalCode[] = [
      {
        code: 'I21.9',
        system: 'icd10',
        description: 'Acute myocardial infarction, unspecified',
        category: 'Diseases of the circulatory system',
        subcategory: 'Ischaemic heart diseases',
        billable: true,
        gender: 'both',
        includes: ['Myocardial infarction NOS', 'Acute MI NOS'],
        notes: ['Use additional code to identify major coronary artery involvement'],
        effectiveDate: new Date('2015-10-01'),
        addedInVersion: 'ICD-10-CM 2016'
      },
      {
        code: 'E11.9',
        system: 'icd10',
        description: 'Type 2 diabetes mellitus without complications',
        category: 'Endocrine, nutritional and metabolic diseases',
        subcategory: 'Diabetes mellitus',
        billable: true,
        gender: 'both',
        excludes: ['Type 1 diabetes mellitus', 'Gestational diabetes'],
        effectiveDate: new Date('2015-10-01')
      },
      {
        code: 'J44.1',
        system: 'icd10',
        description: 'Chronic obstructive pulmonary disease with acute exacerbation',
        category: 'Diseases of the respiratory system',
        subcategory: 'Chronic lower respiratory diseases',
        billable: true,
        gender: 'both',
        includes: ['COPD with acute exacerbation', 'Acute exacerbation of COPD'],
        effectiveDate: new Date('2015-10-01')
      },
      {
        code: 'N18.6',
        system: 'icd10',
        description: 'End stage renal disease',
        category: 'Diseases of the genitourinary system',
        subcategory: 'Chronic kidney disease',
        billable: true,
        gender: 'both',
        includes: ['Chronic kidney disease stage 5', 'CKD stage 5'],
        severity: 'critical',
        effectiveDate: new Date('2015-10-01')
      },
      {
        code: 'Z51.11',
        system: 'icd10',
        description: 'Encounter for antineoplastic chemotherapy',
        category: 'Factors influencing health status',
        subcategory: 'Persons encountering health services for examination',
        billable: true,
        gender: 'both',
        includes: ['Chemotherapy encounter', 'Cancer treatment'],
        effectiveDate: new Date('2015-10-01')
      }
    ];

    icd10Codes.forEach(code => {
      this.icd10Codes.set(code.code, code);
    });
  }

  private initializeCPTCodes(): void {
    const cptCodes: MedicalCode[] = [
      {
        code: '99213',
        system: 'cpt',
        description: 'Office or other outpatient visit for evaluation and management of an established patient',
        category: 'Evaluation and Management',
        subcategory: 'Office or Other Outpatient Services',
        billable: true,
        gender: 'both',
        notes: ['Requires 2 of 3 key components', 'Expanded problem focused history and examination'],
        effectiveDate: new Date('2021-01-01')
      },
      {
        code: '93000',
        system: 'cpt',
        description: 'Electrocardiogram, routine ECG with at least 12 leads',
        category: 'Medicine',
        subcategory: 'Cardiovascular',
        billable: true,
        gender: 'both',
        includes: ['12-lead ECG', 'Standard ECG'],
        effectiveDate: new Date('2021-01-01')
      },
      {
        code: '36415',
        system: 'cpt',
        description: 'Collection of venous blood by venipuncture',
        category: 'Surgery',
        subcategory: 'Cardiovascular System',
        billable: true,
        gender: 'both',
        includes: ['Blood draw', 'Venipuncture'],
        effectiveDate: new Date('2021-01-01')
      }
    ];

    cptCodes.forEach(code => {
      this.cptCodes.set(code.code, code);
    });
  }

  private initializeHCPCSCodes(): void {
    const hcpcsCodes: MedicalCode[] = [
      {
        code: 'J7050',
        system: 'hcpcs',
        description: 'Infusion, normal saline solution, 1000 cc',
        category: 'Drugs',
        subcategory: 'Intravenous Solutions',
        billable: true,
        gender: 'both',
        effectiveDate: new Date('2024-01-01')
      }
    ];

    hcpcsCodes.forEach(code => {
      this.hcpcsCodes.set(code.code, code);
    });
  }

  private initializeSNOMEDCodes(): void {
    const snomedCodes: MedicalCode[] = [
      {
        code: '22298006',
        system: 'snomed',
        description: 'Myocardial infarction',
        category: 'Clinical finding',
        subcategory: 'Disease',
        gender: 'both',
        effectiveDate: new Date('2002-01-31')
      }
    ];

    snomedCodes.forEach(code => {
      this.snomedCodes.set(code.code, code);
    });
  }

  private initializeLOINCCodes(): void {
    const loincCodes: MedicalCode[] = [
      {
        code: '33747-0',
        system: 'loinc',
        description: 'General appearance of patient',
        category: 'Clinical',
        subcategory: 'Patient assessment',
        gender: 'both',
        effectiveDate: new Date('1995-03-01')
      }
    ];

    loincCodes.forEach(code => {
      this.loincCodes.set(code.code, code);
    });
  }

  private initializeBillingRules(): void {
    const billingRules: BillingValidation[] = [
      {
        code: '99213',
        billable: true,
        requiresModifier: false,
        suggestedModifiers: ['25'],
        bundledWith: [],
        mutuallyExclusive: ['99212', '99214'],
        frequencyLimitations: ['Once per day'],
        coverageLimitations: ['Most insurance plans cover']
      },
      {
        code: 'I21.9',
        billable: true,
        requiresModifier: false,
        suggestedModifiers: [],
        bundledWith: [],
        mutuallyExclusive: [],
        frequencyLimitations: [],
        coverageLimitations: []
      }
    ];

    billingRules.forEach(rule => {
      this.billingRules.set(rule.code, rule);
    });
  }

  private initializeCodeRelationships(): void {
    // Initialize code relationships (parent-child, related codes, etc.)
    this.codeRelationships.set('I21', ['I21.0', 'I21.1', 'I21.2', 'I21.3', 'I21.4', 'I21.9']);
    this.codeRelationships.set('E11', ['E11.0', 'E11.1', 'E11.2', 'E11.3', 'E11.4', 'E11.5', 'E11.6', 'E11.7', 'E11.8', 'E11.9']);
  }

  private validateCodeFormat(code: string, system: string): {
    isValid: boolean;
    issue?: string;
    suggestion?: string;
  } {
    switch (system.toLowerCase()) {
      case 'icd10':
        return this.validateICD10Format(code);
      case 'cpt':
        return this.validateCPTFormat(code);
      case 'hcpcs':
        return this.validateHCPCSFormat(code);
      case 'snomed':
        return this.validateSNOMEDFormat(code);
      case 'loinc':
        return this.validateLOINCFormat(code);
      default:
        return { isValid: false, issue: `Unknown coding system: ${system}` };
    }
  }

  private validateICD10Format(code: string): {
    isValid: boolean;
    issue?: string;
    suggestion?: string;
  } {
    // ICD-10-CM format: Letter + 2 digits + optional decimal + up to 4 more characters
    const icd10Pattern = /^[A-Z]\d{2}(\.[A-Z0-9]{1,4})?$/;
    
    if (!icd10Pattern.test(code)) {
      return {
        isValid: false,
        issue: 'Invalid ICD-10 format',
        suggestion: 'Use format: Letter + 2 digits + optional decimal + up to 4 characters (e.g., I21.9)'
      };
    }
    
    return { isValid: true };
  }

  private validateCPTFormat(code: string): {
    isValid: boolean;
    issue?: string;
    suggestion?: string;
  } {
    // CPT format: 5 digits
    const cptPattern = /^\d{5}$/;
    
    if (!cptPattern.test(code)) {
      return {
        isValid: false,
        issue: 'Invalid CPT format',
        suggestion: 'CPT codes must be exactly 5 digits (e.g., 99213)'
      };
    }
    
    return { isValid: true };
  }

  private validateHCPCSFormat(code: string): {
    isValid: boolean;
    issue?: string;
    suggestion?: string;
  } {
    // HCPCS format: Letter + 4 digits
    const hcpcsPattern = /^[A-Z]\d{4}$/;
    
    if (!hcpcsPattern.test(code)) {
      return {
        isValid: false,
        issue: 'Invalid HCPCS format',
        suggestion: 'HCPCS codes must be 1 letter + 4 digits (e.g., J7050)'
      };
    }
    
    return { isValid: true };
  }

  private validateSNOMEDFormat(code: string): {
    isValid: boolean;
    issue?: string;
    suggestion?: string;
  } {
    // SNOMED CT format: 6-18 digits
    const snomedPattern = /^\d{6,18}$/;
    
    if (!snomedPattern.test(code)) {
      return {
        isValid: false,
        issue: 'Invalid SNOMED CT format',
        suggestion: 'SNOMED CT codes must be 6-18 digits (e.g., 22298006)'
      };
    }
    
    return { isValid: true };
  }

  private validateLOINCFormat(code: string): {
    isValid: boolean;
    issue?: string;
    suggestion?: string;
  } {
    // LOINC format: 1-5 digits + "-" + 1 digit
    const loincPattern = /^\d{1,5}-\d$/;
    
    if (!loincPattern.test(code)) {
      return {
        isValid: false,
        issue: 'Invalid LOINC format',
        suggestion: 'LOINC codes must be 1-5 digits + hyphen + 1 digit (e.g., 33747-0)'
      };
    }
    
    return { isValid: true };
  }

  private verifyCodeExistence(code: string, system: string): {
    exists: boolean;
    codeInfo?: MedicalCode;
    suggestion?: string;
  } {
    const codeMap = this.getCodeMap(system);
    if (!codeMap) {
      return { exists: false, suggestion: `Unsupported coding system: ${system}` };
    }

    const codeInfo = codeMap.get(code);
    if (codeInfo) {
      return { exists: true, codeInfo };
    }

    // Find similar codes
    const similarCodes = this.findSimilarCodes(code, system);
    const suggestion = similarCodes.length > 0 ? 
      `Similar codes found: ${similarCodes.slice(0, 3).join(', ')}` : 
      'No similar codes found';

    return { exists: false, suggestion };
  }

  private getCodeMap(system: string): Map<string, MedicalCode> | null {
    switch (system.toLowerCase()) {
      case 'icd10': return this.icd10Codes;
      case 'cpt': return this.cptCodes;
      case 'hcpcs': return this.hcpcsCodes;
      case 'snomed': return this.snomedCodes;
      case 'loinc': return this.loincCodes;
      default: return null;
    }
  }

  private findSimilarCodes(code: string, system: string): string[] {
    const codeMap = this.getCodeMap(system);
    if (!codeMap) return [];

    const similarCodes: string[] = [];
    const codePrefix = code.substring(0, Math.min(3, code.length));

    codeMap.forEach((_, mapCode) => {
      if (mapCode.startsWith(codePrefix) && mapCode !== code) {
        similarCodes.push(mapCode);
      }
    });

    return similarCodes.slice(0, 5);
  }

  private validateCodeCombinations(
    codes: Array<{ code: string; system: string }>,
    patientContext?: PatientContext
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Check for conflicting diagnoses
    const icd10Codes = codes.filter(c => c.system === 'icd10');
    if (icd10Codes.length > 1) {
      const conflicts = this.findConflictingDiagnoses(icd10Codes.map(c => c.code));
      conflicts.forEach(conflict => {
        errors.push({
          code: 'CONFLICTING_DIAGNOSES',
          message: `Conflicting diagnoses: ${conflict.codes.join(' and ')}`,
          field: 'medicalCodes',
          severity: 'major',
          correction: 'Review diagnoses for accuracy',
          confidence: 0.8
        });
      });
    }

    // Check for procedure-diagnosis consistency
    const cptCodes = codes.filter(c => c.system === 'cpt');
    if (icd10Codes.length > 0 && cptCodes.length > 0) {
      const consistencyIssues = this.checkProcedureDiagnosisConsistency(
        icd10Codes.map(c => c.code),
        cptCodes.map(c => c.code)
      );
      
      consistencyIssues.forEach(issue => {
        warnings.push({
          code: 'PROCEDURE_DIAGNOSIS_MISMATCH',
          message: `Procedure ${issue.procedure} may not be consistent with diagnosis ${issue.diagnosis}`,
          field: 'medicalCodes',
          recommendation: 'Verify procedure is appropriate for diagnosis'
        });
      });
    }

    return { errors, warnings, suggestions };
  }

  private validateBillingCodes(
    codes: Array<{ code: string; system: string }>,
    patientContext?: PatientContext
  ): {
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  } {
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    codes.forEach(({ code, system }) => {
      const billingRule = this.billingRules.get(code);
      if (billingRule) {
        if (billingRule.requiresModifier) {
          warnings.push({
            code: 'MODIFIER_REQUIRED',
            message: `Code ${code} typically requires a modifier`,
            field: 'medicalCodes',
            recommendation: `Consider modifiers: ${billingRule.suggestedModifiers.join(', ')}`
          });
        }

        if (billingRule.frequencyLimitations.length > 0) {
          warnings.push({
            code: 'FREQUENCY_LIMITATION',
            message: `Code ${code} has frequency limitations`,
            field: 'medicalCodes',
            recommendation: billingRule.frequencyLimitations.join('; ')
          });
        }
      }
    });

    return { warnings, suggestions };
  }

  private findConflictingDiagnoses(codes: string[]): Array<{ codes: string[]; reason: string }> {
    const conflicts: Array<{ codes: string[]; reason: string }> = [];
    
    // Example conflicts (simplified)
    const conflictPairs = [
      { codes: ['E10', 'E11'], reason: 'Type 1 and Type 2 diabetes are mutually exclusive' },
      { codes: ['I21', 'I25'], reason: 'Acute MI and chronic CAD may be conflicting' }
    ];

    conflictPairs.forEach(({ codes: conflictCodes, reason }) => {
      const matchedCodes = codes.filter(code => 
        conflictCodes.some(conflictCode => code.startsWith(conflictCode))
      );
      
      if (matchedCodes.length > 1) {
        conflicts.push({ codes: matchedCodes, reason });
      }
    });

    return conflicts;
  }

  private checkProcedureDiagnosisConsistency(
    diagnosisCodes: string[],
    procedureCodes: string[]
  ): Array<{ procedure: string; diagnosis: string; reason: string }> {
    const inconsistencies: Array<{ procedure: string; diagnosis: string; reason: string }> = [];
    
    // Simplified consistency rules
    const consistencyRules = [
      {
        procedure: '93000', // ECG
        appropriateDiagnoses: ['I', 'R00'], // Cardiovascular or heart rhythm
        reason: 'ECG typically ordered for cardiovascular conditions'
      }
    ];

    consistencyRules.forEach(rule => {
      if (procedureCodes.includes(rule.procedure)) {
        const hasAppropriate = diagnosisCodes.some(diag => 
          rule.appropriateDiagnoses.some(appropriate => diag.startsWith(appropriate))
        );
        
        if (!hasAppropriate) {
          inconsistencies.push({
            procedure: rule.procedure,
            diagnosis: diagnosisCodes[0] || 'Unknown',
            reason: rule.reason
          });
        }
      }
    });

    return inconsistencies;
  }

  private getICD10Level(code: string): number {
    // ICD-10 hierarchy levels
    if (code.length === 1) return 1; // Chapter (e.g., "I")
    if (code.length === 3) return 2; // Category (e.g., "I21")
    if (code.includes('.')) return 3; // Subcategory (e.g., "I21.9")
    return 0;
  }

  private getICD10Parent(code: string): string | undefined {
    if (code.includes('.')) {
      return code.split('.')[0]; // Remove subcategory
    }
    if (code.length === 3) {
      return code.charAt(0); // Return chapter
    }
    return undefined;
  }

  private getICD10Children(code: string): string[] {
    const children: string[] = [];
    const relationships = this.codeRelationships.get(code);
    
    if (relationships) {
      return relationships;
    }

    // Generate potential children for category codes
    if (code.length === 3) {
      for (let i = 0; i <= 9; i++) {
        const child = `${code}.${i}`;
        if (this.icd10Codes.has(child)) {
          children.push(child);
        }
      }
    }

    return children;
  }

  private calculateCodeValidationConfidence(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    codeCount: number
  ): number {
    if (codeCount === 0) return 0;

    const errorWeight = errors.reduce((sum, error) => {
      switch (error.severity) {
        case 'critical': return sum + 0.5;
        case 'major': return sum + 0.3;
        case 'minor': return sum + 0.1;
        default: return sum;
      }
    }, 0);

    const warningWeight = warnings.length * 0.05;
    const totalWeight = errorWeight + warningWeight;

    return Math.max(0, 1 - (totalWeight / codeCount));
  }

  private getHighestSeverity(errors: ValidationError[]): 'critical' | 'major' | 'minor' | 'info' {
    if (errors.some(e => e.severity === 'critical')) return 'critical';
    if (errors.some(e => e.severity === 'major')) return 'major';
    if (errors.some(e => e.severity === 'minor')) return 'minor';
    return 'info';
  }

  // Public utility methods

  /**
   * Get code information
   */
  getCodeInfo(code: string, system: string): MedicalCode | null {
    const codeMap = this.getCodeMap(system);
    return codeMap?.get(code) || null;
  }

  /**
   * Check if code is billable
   */
  isBillable(code: string, system: string): boolean {
    const codeInfo = this.getCodeInfo(code, system);
    return codeInfo?.billable || false;
  }

  /**
   * Get billing information
   */
  getBillingInfo(code: string): BillingValidation | null {
    return this.billingRules.get(code) || null;
  }

  /**
   * Add custom medical code
   */
  addMedicalCode(code: MedicalCode): void {
    const codeMap = this.getCodeMap(code.system);
    if (codeMap) {
      codeMap.set(code.code, code);
    }
  }

  /**
   * Get codes by category
   */
  getCodesByCategory(category: string, system: string): MedicalCode[] {
    const codeMap = this.getCodeMap(system);
    if (!codeMap) return [];

    const codes: MedicalCode[] = [];
    codeMap.forEach(codeInfo => {
      if (codeInfo.category.toLowerCase().includes(category.toLowerCase())) {
        codes.push(codeInfo);
      }
    });

    return codes;
  }
}

// Export singleton instance
export const medicalCodeValidator = new MedicalCodeValidator();