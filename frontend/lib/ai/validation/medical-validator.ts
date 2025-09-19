/**
 * Medical Accuracy Validation System
 * HMHCP Healthcare AI Platform
 * 
 * Comprehensive medical validation for healthcare content accuracy,
 * compliance, and safety standards.
 */

import { z } from 'zod';

// Types and Interfaces
export interface ValidationResult {
  isValid: boolean;
  severity: 'critical' | 'major' | 'minor' | 'info';
  confidence: number; // 0-1 scale
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  auditTrail: AuditEntry[];
}

export interface ValidationError {
  code: string;
  message: string;
  field: string;
  severity: 'critical' | 'major' | 'minor';
  correction?: string;
  sourceReference?: string;
  confidence: number;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field: string;
  recommendation?: string;
  sourceReference?: string;
}

export interface ValidationSuggestion {
  type: 'terminology' | 'dosage' | 'citation' | 'compliance';
  original: string;
  suggested: string;
  reason: string;
  confidence: number;
}

export interface AuditEntry {
  timestamp: Date;
  validationType: string;
  result: 'pass' | 'fail' | 'warning';
  details: string;
  userId?: string;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  mechanism: string;
  clinicalEffect: string;
  management: string;
  evidence: string;
}

export interface MedicalClaim {
  claim: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  studyTypes: string[];
  population: string;
  limitations: string[];
  lastReviewed: Date;
}

export interface DosageRange {
  drug: string;
  indication: string;
  minDose: number;
  maxDose: number;
  unit: string;
  frequency: string;
  route: string;
  specialPopulations: Record<string, DosageAdjustment>;
}

export interface DosageAdjustment {
  factor: number;
  reason: string;
  monitoring: string[];
}

// Validation Schemas
const MedicalContentSchema = z.object({
  content: z.string(),
  contentType: z.enum(['article', 'drug_info', 'procedure', 'diagnosis', 'treatment']),
  targetAudience: z.enum(['patient', 'provider', 'researcher']),
  clinicalContext: z.string().optional(),
  citations: z.array(z.string()).optional(),
  lastReviewed: z.date().optional()
});

const DrugValidationSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  route: z.string(),
  frequency: z.string(),
  indication: z.string(),
  patientProfile: z.object({
    age: z.number().optional(),
    weight: z.number().optional(),
    renalFunction: z.string().optional(),
    hepaticFunction: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    currentMedications: z.array(z.string()).optional()
  }).optional()
});

/**
 * Main Medical Validator Class
 * Orchestrates all medical validation functions
 */
export class MedicalValidator {
  private drugDatabase: Map<string, DrugInfo>;
  private interactionMatrix: Map<string, DrugInteraction[]>;
  private medicalTerminology: Map<string, TerminologyEntry>;
  private clinicalGuidelines: Map<string, GuidelineEntry>;
  private fdaWarnings: Map<string, FDAWarning>;
  private contraindications: Map<string, Contraindication[]>;
  private auditLog: AuditEntry[];

  constructor() {
    this.drugDatabase = new Map();
    this.interactionMatrix = new Map();
    this.medicalTerminology = new Map();
    this.clinicalGuidelines = new Map();
    this.fdaWarnings = new Map();
    this.contraindications = new Map();
    this.auditLog = [];
    
    this.initializeDatabases();
  }

  /**
   * Primary validation method for medical content
   */
  async validateMedicalContent(
    content: z.infer<typeof MedicalContentSchema>
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      // Validate input schema
      const validatedContent = MedicalContentSchema.parse(content);

      // Run comprehensive validation checks
      const terminologyResults = await this.validateMedicalTerminology(validatedContent.content);
      const claimResults = await this.validateMedicalClaims(validatedContent.content);
      const complianceResults = await this.validateCompliance(validatedContent);
      const citationResults = await this.validateCitations(validatedContent.citations || []);

      // Aggregate results
      errors.push(...terminologyResults.errors, ...claimResults.errors, 
                 ...complianceResults.errors, ...citationResults.errors);
      warnings.push(...terminologyResults.warnings, ...claimResults.warnings,
                   ...complianceResults.warnings, ...citationResults.warnings);
      suggestions.push(...terminologyResults.suggestions, ...claimResults.suggestions,
                      ...complianceResults.suggestions, ...citationResults.suggestions);

      // Calculate overall confidence and validity
      const confidence = this.calculateOverallConfidence(errors, warnings);
      const isValid = errors.filter(e => e.severity === 'critical').length === 0;

      // Create audit entry
      const auditEntry: AuditEntry = {
        timestamp: new Date(),
        validationType: 'medical_content',
        result: isValid ? (warnings.length > 0 ? 'warning' : 'pass') : 'fail',
        details: `Validation completed in ${Date.now() - startTime}ms. Errors: ${errors.length}, Warnings: ${warnings.length}`
      };
      this.auditLog.push(auditEntry);

      return {
        isValid,
        severity: this.getHighestSeverity(errors),
        confidence,
        errors,
        warnings,
        suggestions,
        auditTrail: [auditEntry]
      };

    } catch (error) {
      const auditEntry: AuditEntry = {
        timestamp: new Date(),
        validationType: 'medical_content',
        result: 'fail',
        details: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      this.auditLog.push(auditEntry);

      return {
        isValid: false,
        severity: 'critical',
        confidence: 0,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'Failed to validate medical content',
          field: 'content',
          severity: 'critical',
          confidence: 1
        }],
        warnings: [],
        suggestions: [],
        auditTrail: [auditEntry]
      };
    }
  }

  /**
   * Drug interaction checker
   */
  async checkDrugInteractions(medications: string[]): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const interactions: DrugInteraction[] = [];

    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const drug1 = this.normalizeDrugName(medications[i]);
        const drug2 = this.normalizeDrugName(medications[j]);
        
        const interaction = this.findDrugInteraction(drug1, drug2);
        if (interaction) {
          interactions.push(interaction);
          
          if (interaction.severity === 'contraindicated' || interaction.severity === 'major') {
            errors.push({
              code: 'DRUG_INTERACTION',
              message: `${interaction.severity.toUpperCase()} interaction between ${drug1} and ${drug2}: ${interaction.clinicalEffect}`,
              field: 'medications',
              severity: interaction.severity === 'contraindicated' ? 'critical' : 'major',
              correction: interaction.management,
              sourceReference: interaction.evidence,
              confidence: 0.95
            });
          } else {
            warnings.push({
              code: 'DRUG_INTERACTION_WARNING',
              message: `${interaction.severity} interaction between ${drug1} and ${drug2}`,
              field: 'medications',
              recommendation: interaction.management,
              sourceReference: interaction.evidence
            });
          }
        }
      }
    }

    const auditEntry: AuditEntry = {
      timestamp: new Date(),
      validationType: 'drug_interaction',
      result: errors.length > 0 ? 'fail' : (warnings.length > 0 ? 'warning' : 'pass'),
      details: `Checked ${medications.length} medications, found ${interactions.length} interactions`
    };
    this.auditLog.push(auditEntry);

    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      severity: this.getHighestSeverity(errors),
      confidence: 0.95,
      errors,
      warnings,
      suggestions: [],
      auditTrail: [auditEntry]
    };
  }

  /**
   * Dosage verification system
   */
  async verifyDosage(drugValidation: z.infer<typeof DrugValidationSchema>): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      const validatedData = DrugValidationSchema.parse(drugValidation);
      const drugInfo = this.drugDatabase.get(this.normalizeDrugName(validatedData.name));
      
      if (!drugInfo) {
        errors.push({
          code: 'UNKNOWN_DRUG',
          message: `Drug "${validatedData.name}" not found in database`,
          field: 'name',
          severity: 'major',
          confidence: 0.9
        });
        return this.createValidationResult(errors, warnings, suggestions, 'dosage_verification');
      }

      // Check dosage range
      const dosageRange = this.getDosageRange(validatedData.name, validatedData.indication);
      if (dosageRange) {
        const dosageValue = this.parseDosage(validatedData.dosage);
        if (dosageValue < dosageRange.minDose || dosageValue > dosageRange.maxDose) {
          errors.push({
            code: 'DOSAGE_OUT_OF_RANGE',
            message: `Dosage ${validatedData.dosage} is outside recommended range (${dosageRange.minDose}-${dosageRange.maxDose} ${dosageRange.unit})`,
            field: 'dosage',
            severity: 'major',
            correction: `Recommended range: ${dosageRange.minDose}-${dosageRange.maxDose} ${dosageRange.unit}`,
            confidence: 0.9
          });
        }
      }

      // Check route compatibility
      if (!drugInfo.approvedRoutes.includes(validatedData.route)) {
        errors.push({
          code: 'INVALID_ROUTE',
          message: `Route "${validatedData.route}" not approved for ${validatedData.name}`,
          field: 'route',
          severity: 'major',
          correction: `Approved routes: ${drugInfo.approvedRoutes.join(', ')}`,
          confidence: 0.95
        });
      }

      // Check special population adjustments
      if (validatedData.patientProfile) {
        const adjustments = this.checkSpecialPopulations(validatedData, dosageRange);
        warnings.push(...adjustments.warnings);
        suggestions.push(...adjustments.suggestions);
      }

      // Check FDA warnings
      const fdaWarning = this.fdaWarnings.get(this.normalizeDrugName(validatedData.name));
      if (fdaWarning) {
        warnings.push({
          code: 'FDA_BLACK_BOX_WARNING',
          message: `FDA Black Box Warning: ${fdaWarning.warning}`,
          field: 'name',
          recommendation: fdaWarning.monitoring,
          sourceReference: fdaWarning.source
        });
      }

      return this.createValidationResult(errors, warnings, suggestions, 'dosage_verification');

    } catch (error) {
      errors.push({
        code: 'DOSAGE_VALIDATION_ERROR',
        message: 'Failed to validate dosage information',
        field: 'dosage',
        severity: 'critical',
        confidence: 1
      });
      return this.createValidationResult(errors, warnings, suggestions, 'dosage_verification');
    }
  }

  /**
   * Medical terminology validation
   */
  async validateMedicalTerminology(content: string): Promise<Partial<ValidationResult>> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Extract medical terms and abbreviations
    const medicalTerms = this.extractMedicalTerms(content);
    const abbreviations = this.extractAbbreviations(content);

    // Validate terminology
    for (const term of medicalTerms) {
      const terminologyEntry = this.medicalTerminology.get(term.toLowerCase());
      if (!terminologyEntry) {
        warnings.push({
          code: 'UNKNOWN_TERMINOLOGY',
          message: `Medical term "${term}" not found in standard terminology`,
          field: 'content',
          recommendation: 'Verify term accuracy and consider adding definition'
        });
      } else if (terminologyEntry.deprecated) {
        suggestions.push({
          type: 'terminology',
          original: term,
          suggested: terminologyEntry.preferredTerm || term,
          reason: 'Using deprecated terminology',
          confidence: 0.9
        });
      }
    }

    // Validate abbreviations
    for (const abbr of abbreviations) {
      if (!this.isValidMedicalAbbreviation(abbr)) {
        errors.push({
          code: 'INVALID_ABBREVIATION',
          message: `Abbreviation "${abbr}" may be ambiguous or non-standard`,
          field: 'content',
          severity: 'minor',
          correction: 'Consider spelling out or using standard abbreviation',
          confidence: 0.7
        });
      }
    }

    return { errors, warnings, suggestions };
  }

  /**
   * Clinical guideline compliance checker
   */
  async validateCompliance(content: z.infer<typeof MedicalContentSchema>): Promise<Partial<ValidationResult>> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // HIPAA compliance check
    const hipaaViolations = this.checkHIPAACompliance(content.content);
    if (hipaaViolations.length > 0) {
      errors.push(...hipaaViolations.map(violation => ({
        code: 'HIPAA_VIOLATION',
        message: `Potential HIPAA violation: ${violation}`,
        field: 'content',
        severity: 'critical' as const,
        confidence: 0.8
      })));
    }

    // FDA advertising guidelines
    if (content.contentType === 'drug_info') {
      const fdaViolations = this.checkFDAAdvertisingGuidelines(content.content);
      errors.push(...fdaViolations);
    }

    // Medical ethics standards
    const ethicsIssues = this.checkMedicalEthics(content.content, content.targetAudience);
    warnings.push(...ethicsIssues);

    // Evidence level assessment
    if (content.contentType === 'article') {
      const evidenceAssessment = this.assessEvidenceLevel(content.content);
      if (evidenceAssessment.level === 'D' || evidenceAssessment.level === 'expert_opinion') {
        warnings.push({
          code: 'LOW_EVIDENCE_LEVEL',
          message: 'Content appears to be based on low-level evidence',
          field: 'content',
          recommendation: 'Consider including higher-quality evidence or clearly state evidence limitations'
        });
      }
    }

    return { errors, warnings, suggestions };
  }

  /**
   * ICD-10/CPT code validation
   */
  async validateMedicalCodes(codes: { icd10?: string[], cpt?: string[] }): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate ICD-10 codes
    if (codes.icd10) {
      for (const code of codes.icd10) {
        if (!this.isValidICD10Code(code)) {
          errors.push({
            code: 'INVALID_ICD10',
            message: `Invalid ICD-10 code: ${code}`,
            field: 'icd10',
            severity: 'major',
            confidence: 0.95
          });
        }
      }
    }

    // Validate CPT codes
    if (codes.cpt) {
      for (const code of codes.cpt) {
        if (!this.isValidCPTCode(code)) {
          errors.push({
            code: 'INVALID_CPT',
            message: `Invalid CPT code: ${code}`,
            field: 'cpt',
            severity: 'major',
            confidence: 0.95
          });
        }
      }
    }

    return this.createValidationResult(errors, warnings, [], 'medical_codes');
  }

  /**
   * Citation accuracy verification
   */
  async validateCitations(citations: string[]): Promise<Partial<ValidationResult>> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    for (const citation of citations) {
      // Check citation format
      const formatResult = this.validateCitationFormat(citation);
      if (!formatResult.isValid) {
        warnings.push({
          code: 'CITATION_FORMAT',
          message: `Citation format may be non-standard: ${citation}`,
          field: 'citations',
          recommendation: 'Use standard medical citation format (AMA, APA, or NLM)'
        });
      }

      // Check if citation appears to be from reputable source
      const sourceReliability = this.assessSourceReliability(citation);
      if (sourceReliability.score < 0.7) {
        warnings.push({
          code: 'QUESTIONABLE_SOURCE',
          message: `Citation from potentially unreliable source: ${citation}`,
          field: 'citations',
          recommendation: 'Verify source credibility and consider peer-reviewed alternatives'
        });
      }

      // Check for retracted papers (simplified check)
      if (this.isLikelyRetracted(citation)) {
        errors.push({
          code: 'RETRACTED_CITATION',
          message: `Citation may reference retracted publication: ${citation}`,
          field: 'citations',
          severity: 'major',
          confidence: 0.8
        });
      }
    }

    return { errors, warnings, suggestions };
  }

  // Private helper methods

  private initializeDatabases(): void {
    // Initialize drug database with common medications
    this.initializeDrugDatabase();
    
    // Initialize drug interaction matrix
    this.initializeInteractionMatrix();
    
    // Initialize medical terminology
    this.initializeMedicalTerminology();
    
    // Initialize clinical guidelines
    this.initializeClinicalGuidelines();
    
    // Initialize FDA warnings
    this.initializeFDAWarnings();
    
    // Initialize contraindications
    this.initializeContraindications();
  }

  private initializeDrugDatabase(): void {
    // Sample drug entries - in production, this would be loaded from comprehensive database
    const sampleDrugs: DrugInfo[] = [
      {
        name: 'acetaminophen',
        brandNames: ['Tylenol', 'Paracetamol'],
        genericName: 'acetaminophen',
        approvedRoutes: ['oral', 'IV', 'rectal'],
        indications: ['pain', 'fever'],
        contraindications: ['severe hepatic impairment'],
        blackBoxWarning: false,
        pregnancyCategory: 'B'
      },
      {
        name: 'warfarin',
        brandNames: ['Coumadin', 'Jantoven'],
        genericName: 'warfarin',
        approvedRoutes: ['oral'],
        indications: ['anticoagulation', 'atrial fibrillation', 'DVT', 'PE'],
        contraindications: ['active bleeding', 'pregnancy'],
        blackBoxWarning: true,
        pregnancyCategory: 'X'
      }
    ];

    sampleDrugs.forEach(drug => {
      this.drugDatabase.set(drug.name, drug);
      drug.brandNames.forEach(brand => {
        this.drugDatabase.set(brand.toLowerCase(), drug);
      });
    });
  }

  private initializeInteractionMatrix(): void {
    const interactions: DrugInteraction[] = [
      {
        drug1: 'warfarin',
        drug2: 'aspirin',
        severity: 'major',
        mechanism: 'Additive anticoagulant effects',
        clinicalEffect: 'Increased bleeding risk',
        management: 'Monitor INR closely, consider alternative analgesic',
        evidence: 'Multiple clinical studies, FDA warning'
      },
      {
        drug1: 'acetaminophen',
        drug2: 'warfarin',
        severity: 'moderate',
        mechanism: 'CYP2C9 inhibition',
        clinicalEffect: 'Increased warfarin effect with chronic acetaminophen use',
        management: 'Monitor INR with regular acetaminophen use >2g/day',
        evidence: 'Clinical studies, case reports'
      }
    ];

    interactions.forEach(interaction => {
      const key1 = `${interaction.drug1}-${interaction.drug2}`;
      const key2 = `${interaction.drug2}-${interaction.drug1}`;
      
      if (!this.interactionMatrix.has(key1)) {
        this.interactionMatrix.set(key1, []);
      }
      if (!this.interactionMatrix.has(key2)) {
        this.interactionMatrix.set(key2, []);
      }
      
      this.interactionMatrix.get(key1)!.push(interaction);
      this.interactionMatrix.get(key2)!.push(interaction);
    });
  }

  private initializeMedicalTerminology(): void {
    const terminology: TerminologyEntry[] = [
      {
        term: 'myocardial infarction',
        definition: 'Death of heart muscle due to insufficient blood flow',
        synonyms: ['heart attack', 'MI', 'STEMI', 'NSTEMI'],
        category: 'cardiology',
        deprecated: false
      },
      {
        term: 'cerebrovascular accident',
        definition: 'Stroke or brain attack',
        synonyms: ['stroke', 'CVA'],
        category: 'neurology',
        deprecated: true,
        preferredTerm: 'stroke'
      }
    ];

    terminology.forEach(entry => {
      this.medicalTerminology.set(entry.term.toLowerCase(), entry);
      entry.synonyms.forEach(synonym => {
        this.medicalTerminology.set(synonym.toLowerCase(), entry);
      });
    });
  }

  private initializeClinicalGuidelines(): void {
    // Initialize with key clinical guidelines
    const guidelines: GuidelineEntry[] = [
      {
        title: 'Hypertension Management',
        organization: 'AHA/ACC',
        year: 2017,
        recommendations: ['Target BP <130/80 for most adults'],
        evidenceLevel: 'A'
      }
    ];

    guidelines.forEach(guideline => {
      this.clinicalGuidelines.set(guideline.title.toLowerCase(), guideline);
    });
  }

  private initializeFDAWarnings(): void {
    const warnings: FDAWarning[] = [
      {
        drug: 'warfarin',
        warning: 'Increased risk of bleeding that can result in hospitalization and death',
        dateIssued: new Date('2007-08-01'),
        monitoring: 'Regular INR monitoring required',
        source: 'FDA Black Box Warning'
      }
    ];

    warnings.forEach(warning => {
      this.fdaWarnings.set(warning.drug.toLowerCase(), warning);
    });
  }

  private initializeContraindications(): void {
    const contraindications: Contraindication[] = [
      {
        drug: 'warfarin',
        contraindication: 'pregnancy',
        severity: 'absolute',
        reason: 'Teratogenic effects, pregnancy category X',
        alternatives: ['heparin', 'LMWH']
      }
    ];

    contraindications.forEach(contraindication => {
      const existing = this.contraindications.get(contraindication.drug) || [];
      existing.push(contraindication);
      this.contraindications.set(contraindication.drug, existing);
    });
  }

  private normalizeDrugName(drugName: string): string {
    return drugName.toLowerCase().trim().replace(/[^\w\s]/g, '');
  }

  private findDrugInteraction(drug1: string, drug2: string): DrugInteraction | null {
    const key1 = `${drug1}-${drug2}`;
    const key2 = `${drug2}-${drug1}`;
    
    const interactions1 = this.interactionMatrix.get(key1);
    if (interactions1 && interactions1.length > 0) {
      return interactions1[0];
    }
    
    const interactions2 = this.interactionMatrix.get(key2);
    if (interactions2 && interactions2.length > 0) {
      return interactions2[0];
    }
    
    return null;
  }

  private getDosageRange(drug: string, indication: string): DosageRange | null {
    // Simplified dosage range lookup - in production would use comprehensive database
    const dosageRanges: DosageRange[] = [
      {
        drug: 'acetaminophen',
        indication: 'pain',
        minDose: 325,
        maxDose: 1000,
        unit: 'mg',
        frequency: 'q6h',
        route: 'oral',
        specialPopulations: {
          'hepatic_impairment': { factor: 0.5, reason: 'Reduced metabolism', monitoring: ['ALT', 'AST'] },
          'elderly': { factor: 0.75, reason: 'Reduced clearance', monitoring: ['renal function'] }
        }
      }
    ];

    return dosageRanges.find(range => 
      range.drug === this.normalizeDrugName(drug) && 
      range.indication.toLowerCase() === indication.toLowerCase()
    ) || null;
  }

  private parseDosage(dosageString: string): number {
    const match = dosageString.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private checkSpecialPopulations(
    drugValidation: z.infer<typeof DrugValidationSchema>, 
    dosageRange: DosageRange | null
  ): { warnings: ValidationWarning[], suggestions: ValidationSuggestion[] } {
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    if (!drugValidation.patientProfile || !dosageRange) {
      return { warnings, suggestions };
    }

    const { patientProfile } = drugValidation;

    // Check age-related adjustments
    if (patientProfile.age && patientProfile.age >= 65) {
      const elderlyAdjustment = dosageRange.specialPopulations['elderly'];
      if (elderlyAdjustment) {
        suggestions.push({
          type: 'dosage',
          original: drugValidation.dosage,
          suggested: `Consider ${Math.round(this.parseDosage(drugValidation.dosage) * elderlyAdjustment.factor)}mg`,
          reason: elderlyAdjustment.reason,
          confidence: 0.8
        });
      }
    }

    // Check renal function
    if (patientProfile.renalFunction === 'impaired') {
      warnings.push({
        code: 'RENAL_ADJUSTMENT_NEEDED',
        message: 'Dosage adjustment may be needed for renal impairment',
        field: 'dosage',
        recommendation: 'Consult prescribing information for renal dosing guidelines'
      });
    }

    return { warnings, suggestions };
  }

  private calculateOverallConfidence(errors: ValidationError[], warnings: ValidationWarning[]): number {
    if (errors.length === 0 && warnings.length === 0) return 1.0;
    
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const majorErrors = errors.filter(e => e.severity === 'major').length;
    const minorErrors = errors.filter(e => e.severity === 'minor').length;

    // Weighted confidence calculation
    const confidenceReduction = (criticalErrors * 0.4) + (majorErrors * 0.2) + (minorErrors * 0.1) + (warnings.length * 0.05);
    return Math.max(0, 1 - confidenceReduction);
  }

  private getHighestSeverity(errors: ValidationError[]): 'critical' | 'major' | 'minor' | 'info' {
    if (errors.some(e => e.severity === 'critical')) return 'critical';
    if (errors.some(e => e.severity === 'major')) return 'major';
    if (errors.some(e => e.severity === 'minor')) return 'minor';
    return 'info';
  }

  private createValidationResult(
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[],
    validationType: string
  ): ValidationResult {
    const auditEntry: AuditEntry = {
      timestamp: new Date(),
      validationType,
      result: errors.length > 0 ? 'fail' : (warnings.length > 0 ? 'warning' : 'pass'),
      details: `Errors: ${errors.length}, Warnings: ${warnings.length}, Suggestions: ${suggestions.length}`
    };
    this.auditLog.push(auditEntry);

    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      severity: this.getHighestSeverity(errors),
      confidence: this.calculateOverallConfidence(errors, warnings),
      errors,
      warnings,
      suggestions,
      auditTrail: [auditEntry]
    };
  }

  private extractMedicalTerms(content: string): string[] {
    // Simplified medical term extraction - in production would use NLP
    const medicalTermRegex = /\b(?:cardio|hepato|nephro|neuro|gastro|pulmo|dermato)\w*|\b(?:syndrome|disease|disorder|condition|treatment|therapy|diagnosis)\b/gi;
    return content.match(medicalTermRegex) || [];
  }

  private extractAbbreviations(content: string): string[] {
    // Extract potential medical abbreviations (2-5 uppercase letters)
    const abbreviationRegex = /\b[A-Z]{2,5}\b/g;
    return content.match(abbreviationRegex) || [];
  }

  private isValidMedicalAbbreviation(abbreviation: string): boolean {
    // Common medical abbreviations
    const validAbbreviations = new Set([
      'BP', 'HR', 'RR', 'T', 'O2', 'CO2', 'ECG', 'EKG', 'CBC', 'BUN', 'ALT', 'AST',
      'MI', 'CHF', 'COPD', 'DM', 'HTN', 'CAD', 'PE', 'DVT', 'UTI', 'URI', 'GI',
      'IV', 'IM', 'SC', 'PO', 'PR', 'SL', 'BID', 'TID', 'QID', 'PRN', 'STAT'
    ]);
    
    return validAbbreviations.has(abbreviation);
  }

  private checkHIPAACompliance(content: string): string[] {
    const violations: string[] = [];
    
    // Check for potential PHI
    const patterns = [
      { regex: /\b\d{3}-\d{2}-\d{4}\b/g, violation: 'Potential SSN detected' },
      { regex: /\b[A-Za-z]{2}\d{6}\b/g, violation: 'Potential medical record number detected' },
      { regex: /\b\d{10,}\b/g, violation: 'Potential account number detected' }
    ];

    patterns.forEach(pattern => {
      if (pattern.regex.test(content)) {
        violations.push(pattern.violation);
      }
    });

    return violations;
  }

  private checkFDAAdvertisingGuidelines(content: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check for unsubstantiated claims
    const claimKeywords = ['cure', 'miracle', 'breakthrough', 'revolutionary'];
    claimKeywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword)) {
        errors.push({
          code: 'UNSUBSTANTIATED_CLAIM',
          message: `Potentially unsubstantiated claim using word "${keyword}"`,
          field: 'content',
          severity: 'major',
          correction: 'Ensure claims are supported by clinical evidence',
          confidence: 0.7
        });
      }
    });

    return errors;
  }

  private checkMedicalEthics(content: string, audience: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    // Check for inappropriate language for patient audience
    if (audience === 'patient') {
      if (content.includes('terminal') || content.includes('fatal')) {
        warnings.push({
          code: 'SENSITIVE_LANGUAGE',
          message: 'Content contains potentially distressing language for patient audience',
          field: 'content',
          recommendation: 'Consider more sensitive language when communicating with patients'
        });
      }
    }

    return warnings;
  }

  private assessEvidenceLevel(content: string): { level: string, confidence: number } {
    // Simplified evidence level assessment
    const evidenceKeywords = {
      'A': ['randomized controlled trial', 'systematic review', 'meta-analysis'],
      'B': ['cohort study', 'case-control study'],
      'C': ['case series', 'case report'],
      'D': ['expert opinion', 'consensus']
    };

    for (const [level, keywords] of Object.entries(evidenceKeywords)) {
      for (const keyword of keywords) {
        if (content.toLowerCase().includes(keyword)) {
          return { level, confidence: 0.8 };
        }
      }
    }

    return { level: 'expert_opinion', confidence: 0.5 };
  }

  private isValidICD10Code(code: string): boolean {
    // Simplified ICD-10 validation - basic format check
    const icd10Regex = /^[A-Z]\d{2}(\.[A-Z0-9]{1,4})?$/;
    return icd10Regex.test(code);
  }

  private isValidCPTCode(code: string): boolean {
    // Simplified CPT validation - basic format check
    const cptRegex = /^\d{5}$/;
    return cptRegex.test(code);
  }

  private validateCitationFormat(citation: string): { isValid: boolean, format?: string } {
    // Check for common citation formats
    const formats = [
      { name: 'PubMed', regex: /PMID:\s*\d+/ },
      { name: 'DOI', regex: /doi:\s*10\.\d+\/\S+/ },
      { name: 'Journal', regex: /\.\s*\d{4}(;\d+)?\(?\d+\)?:\d+(-\d+)?\./ }
    ];

    for (const format of formats) {
      if (format.regex.test(citation)) {
        return { isValid: true, format: format.name };
      }
    }

    return { isValid: false };
  }

  private assessSourceReliability(citation: string): { score: number, factors: string[] } {
    let score = 0.5; // Base score
    const factors: string[] = [];

    // Check for high-quality journals/sources
    const highQualityKeywords = ['nejm', 'lancet', 'jama', 'bmj', 'cochrane', 'pubmed'];
    if (highQualityKeywords.some(keyword => citation.toLowerCase().includes(keyword))) {
      score += 0.3;
      factors.push('High-quality publication');
    }

    // Check for peer review indicators
    if (citation.includes('peer-reviewed') || citation.includes('reviewed')) {
      score += 0.2;
      factors.push('Peer-reviewed');
    }

    // Check for government sources
    if (citation.includes('.gov') || citation.includes('CDC') || citation.includes('FDA')) {
      score += 0.2;
      factors.push('Government source');
    }

    return { score: Math.min(1, score), factors };
  }

  private isLikelyRetracted(citation: string): boolean {
    // Simplified retraction check - in production would use retraction databases
    const retractionKeywords = ['retracted', 'withdrawn', 'erratum'];
    return retractionKeywords.some(keyword => citation.toLowerCase().includes(keyword));
  }

  // Validation interface methods
  async validateMedicalClaims(content: string): Promise<Partial<ValidationResult>> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Extract potential medical claims
    const claims = this.extractMedicalClaims(content);
    
    for (const claim of claims) {
      const claimValidation = this.validateIndividualClaim(claim);
      if (!claimValidation.isSupported) {
        warnings.push({
          code: 'UNSUPPORTED_CLAIM',
          message: `Medical claim may lack sufficient evidence: "${claim}"`,
          field: 'content',
          recommendation: 'Provide supporting evidence or qualify the statement'
        });
      }
    }

    return { errors, warnings, suggestions };
  }

  private extractMedicalClaims(content: string): string[] {
    // Extract sentences that appear to make medical claims
    const sentences = content.split(/[.!?]+/);
    const claimKeywords = ['effective', 'treats', 'cures', 'prevents', 'reduces', 'improves', 'causes'];
    
    return sentences.filter(sentence => 
      claimKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );
  }

  private validateIndividualClaim(claim: string): { isSupported: boolean, evidenceLevel?: string } {
    // Simplified claim validation - in production would use knowledge base
    const supportedClaims = [
      'aspirin reduces cardiovascular risk',
      'statins lower cholesterol',
      'ace inhibitors reduce blood pressure'
    ];

    const isSupported = supportedClaims.some(supportedClaim => 
      claim.toLowerCase().includes(supportedClaim.toLowerCase())
    );

    return { isSupported, evidenceLevel: isSupported ? 'A' : 'unknown' };
  }

  // Getter methods for audit and reporting
  getAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  getValidationStatistics(): ValidationStatistics {
    const totalValidations = this.auditLog.length;
    const passedValidations = this.auditLog.filter(entry => entry.result === 'pass').length;
    const failedValidations = this.auditLog.filter(entry => entry.result === 'fail').length;
    const warningValidations = this.auditLog.filter(entry => entry.result === 'warning').length;

    return {
      totalValidations,
      passedValidations,
      failedValidations,
      warningValidations,
      successRate: totalValidations > 0 ? passedValidations / totalValidations : 0
    };
  }
}

// Supporting interfaces
interface DrugInfo {
  name: string;
  brandNames: string[];
  genericName: string;
  approvedRoutes: string[];
  indications: string[];
  contraindications: string[];
  blackBoxWarning: boolean;
  pregnancyCategory: string;
}

interface TerminologyEntry {
  term: string;
  definition: string;
  synonyms: string[];
  category: string;
  deprecated: boolean;
  preferredTerm?: string;
}

interface GuidelineEntry {
  title: string;
  organization: string;
  year: number;
  recommendations: string[];
  evidenceLevel: string;
}

interface FDAWarning {
  drug: string;
  warning: string;
  dateIssued: Date;
  monitoring: string;
  source: string;
}

interface Contraindication {
  drug: string;
  contraindication: string;
  severity: 'absolute' | 'relative';
  reason: string;
  alternatives: string[];
}

interface ValidationStatistics {
  totalValidations: number;
  passedValidations: number;
  failedValidations: number;
  warningValidations: number;
  successRate: number;
}

// Export singleton instance
export const medicalValidator = new MedicalValidator();

// Export types for external use
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationSuggestion,
  AuditEntry,
  DrugInteraction,
  MedicalClaim,
  DosageRange,
  ValidationStatistics
};