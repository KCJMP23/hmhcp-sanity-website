/**
 * Medical Validation System - Main Export
 * HMHCP Healthcare AI Platform
 * 
 * Comprehensive medical accuracy validation system for healthcare content.
 * Provides drug interaction checking, dosage verification, medical terminology
 * validation, compliance checking, and citation accuracy verification.
 */

export { 
  MedicalValidator,
  medicalValidator 
} from './medical-validator';

export {
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ValidationSuggestion,
  type AuditEntry,
  type DrugInteraction,
  type MedicalClaim,
  type DosageRange,
  type ValidationStatistics
} from './medical-validator';

export { 
  MedicalTerminologyValidator,
  medicalTerminologyValidator 
} from './terminology-validator';

export { 
  DrugInteractionChecker,
  drugInteractionChecker 
} from './drug-interaction-checker';

export { 
  ComplianceValidator,
  complianceValidator 
} from './compliance-validator';

export { 
  CitationValidator,
  citationValidator 
} from './citation-validator';

export { 
  MedicalCodeValidator,
  medicalCodeValidator 
} from './medical-code-validator';

// Re-export specialized types
export type {
  TerminologyValidationOptions,
  MedicalTerm,
  MedicalAbbreviation,
  AnatomicalTerm
} from './terminology-validator';

export type {
  Drug,
  DrugInteractionDetailed,
  PatientProfile,
  MedicationRegimen,
  DosageRecommendation,
  InteractionCheckOptions
} from './drug-interaction-checker';

export type {
  ComplianceRule,
  ComplianceContext,
  HIPAAAssessment,
  FDAComplianceCheck,
  AccessibilityCompliance
} from './compliance-validator';

export type {
  Citation,
  SourceReliability,
  CitationFormat,
  JournalMetrics,
  CitationValidationOptions
} from './citation-validator';

export type {
  MedicalCode,
  CodeValidationOptions,
  CodeCombination,
  BillingValidation,
  PatientContext
} from './medical-code-validator';