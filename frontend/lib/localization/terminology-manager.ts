/**
 * Terminology Manager Service
 * Medical specialty terminology localization system
 */

import {
  MedicalSpecialtyTerminology,
  ClinicalTermMapping,
  AdministrativeTermMapping,
  ComplianceTermMapping,
  UITermMapping,
  DataFieldMapping,
  ValidationMessageMapping,
  ErrorMessageMapping,
  ProcedureTermMapping,
  DiagnosisTermMapping,
  MedicationTermMapping,
  EquipmentTermMapping,
  RegionalVariation,
  LocalizationResponse,
  LocalizationWarning,
  LocalizationSuggestion,
  LocalizationSearchCriteria,
  LocalizationSearchResult,
  ClinicalContext,
  ClinicalCategory,
  AdministrativeContext,
  AdministrativeCategory,
  UIContext,
  UICategory,
  MessageSeverity,
  ComplianceFramework,
  SuggestionType,
  ImplementationEffort
} from '../../types/localization/localization-types';

export class TerminologyManagerService {
  private medicalSpecialties: Map<string, MedicalSpecialtyTerminology> = new Map();
  private clinicalTerms: Map<string, ClinicalTermMapping> = new Map();
  private administrativeTerms: Map<string, AdministrativeTermMapping> = new Map();
  private complianceTerms: Map<string, ComplianceTermMapping> = new Map();
  private uiTerms: Map<string, UITermMapping> = new Map();
  private dataFieldMappings: Map<string, DataFieldMapping> = new Map();
  private validationMessages: Map<string, ValidationMessageMapping> = new Map();
  private errorMessages: Map<string, ErrorMessageMapping> = new Map();
  private procedures: Map<string, ProcedureTermMapping> = new Map();
  private diagnoses: Map<string, DiagnosisTermMapping> = new Map();
  private medications: Map<string, MedicationTermMapping> = new Map();
  private equipment: Map<string, EquipmentTermMapping> = new Map();

  constructor() {
    this.initializeDefaultTerminology();
  }

  /**
   * Get medical specialty terminology
   */
  async getMedicalSpecialty(
    specialtyCode: string,
    language: string
  ): Promise<LocalizationResponse<MedicalSpecialtyTerminology>> {
    try {
      const key = `${specialtyCode}_${language}`;
      const specialty = this.medicalSpecialties.get(key);
      
      if (!specialty) {
        return {
          success: false,
          error: `Medical specialty not found: ${specialtyCode} for language: ${language}`
        };
      }

      return {
        success: true,
        data: specialty,
        metadata: {
          execution_time: Date.now(),
          language,
          region: 'US',
          cultural_adaptations_applied: true,
          compliance_checked: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get medical specialty'
      };
    }
  }

  /**
   * Search clinical terms
   */
  async searchClinicalTerms(
    criteria: LocalizationSearchCriteria,
    language: string
  ): Promise<LocalizationResponse<LocalizationSearchResult>> {
    try {
      const startTime = Date.now();
      let terms = Array.from(this.clinicalTerms.values())
        .filter(term => term.english_term || term.localized_term);

      // Apply language filter
      if (criteria.languages && criteria.languages.length > 0) {
        terms = terms.filter(term => criteria.languages!.includes(language));
      }

      // Apply medical specialty filter
      if (criteria.medical_specialties && criteria.medical_specialties.length > 0) {
        terms = terms.filter(term => 
          criteria.medical_specialties!.some(specialty => 
            term.context.includes(specialty.toLowerCase())
          )
        );
      }

      // Apply category filter
      if (criteria.term_categories && criteria.term_categories.length > 0) {
        terms = terms.filter(term => 
          criteria.term_categories!.includes(term.category)
        );
      }

      // Apply confidence level filter
      if (criteria.confidence_level_min !== undefined) {
        terms = terms.filter(term => 
          term.confidence_level >= criteria.confidence_level_min!
        );
      }

      // Apply query filter
      if (criteria.query) {
        const query = criteria.query.toLowerCase();
        terms = terms.filter(term => 
          term.english_term.toLowerCase().includes(query) ||
          term.localized_term.toLowerCase().includes(query) ||
          term.synonyms.some(synonym => synonym.toLowerCase().includes(query))
        );
      }

      // Apply sorting
      const sortBy = criteria.sort_by || 'term';
      const sortOrder = criteria.sort_order || 'asc';
      
      terms.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'term':
            aValue = a.english_term;
            bValue = b.english_term;
            break;
          case 'confidence':
            aValue = a.confidence_level;
            bValue = b.confidence_level;
            break;
          case 'last_updated':
            aValue = new Date(a.last_verified).getTime();
            bValue = new Date(b.last_verified).getTime();
            break;
          case 'category':
            aValue = a.category;
            bValue = b.category;
            break;
          default:
            aValue = a.english_term;
            bValue = b.english_term;
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const limit = criteria.limit || 50;
      const offset = criteria.offset || 0;
      const totalCount = terms.length;
      const paginatedTerms = terms.slice(offset, offset + limit);

      const result: LocalizationSearchResult = {
        terms: paginatedTerms,
        total_count: totalCount,
        page_info: {
          current_page: Math.floor(offset / limit) + 1,
          total_pages: Math.ceil(totalCount / limit),
          has_next: offset + limit < totalCount,
          has_previous: offset > 0
        },
        filters_applied: criteria,
        performance_metrics: {
          search_time: Date.now() - startTime,
          results_count: paginatedTerms.length
        }
      };

      return {
        success: true,
        data: result,
        metadata: {
          execution_time: Date.now() - startTime,
          language,
          region: 'US',
          cultural_adaptations_applied: true,
          compliance_checked: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search clinical terms'
      };
    }
  }

  /**
   * Add or update clinical term
   */
  async addClinicalTerm(
    term: Omit<ClinicalTermMapping, 'term_id' | 'last_verified' | 'verified_by'>,
    language: string,
    verifiedBy: string
  ): Promise<LocalizationResponse<ClinicalTermMapping>> {
    try {
      const termId = this.generateTermId(term.english_term);
      const clinicalTerm: ClinicalTermMapping = {
        ...term,
        term_id: termId,
        last_verified: new Date().toISOString(),
        verified_by: verifiedBy
      };

      this.clinicalTerms.set(termId, clinicalTerm);

      this.logTerminologyEvent('clinical_term_added', {
        term_id: termId,
        language,
        verified_by: verifiedBy
      });

      return {
        success: true,
        data: clinicalTerm,
        metadata: {
          execution_time: Date.now(),
          language,
          region: 'US',
          cultural_adaptations_applied: true,
          compliance_checked: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add clinical term'
      };
    }
  }

  /**
   * Update clinical term
   */
  async updateClinicalTerm(
    termId: string,
    updates: Partial<ClinicalTermMapping>,
    verifiedBy: string
  ): Promise<LocalizationResponse<ClinicalTermMapping>> {
    try {
      const existingTerm = this.clinicalTerms.get(termId);
      if (!existingTerm) {
        return {
          success: false,
          error: 'Clinical term not found'
        };
      }

      const updatedTerm: ClinicalTermMapping = {
        ...existingTerm,
        ...updates,
        term_id: termId,
        last_verified: new Date().toISOString(),
        verified_by: verifiedBy
      };

      this.clinicalTerms.set(termId, updatedTerm);

      this.logTerminologyEvent('clinical_term_updated', {
        term_id: termId,
        verified_by: verifiedBy,
        changes: Object.keys(updates)
      });

      return {
        success: true,
        data: updatedTerm,
        metadata: {
          execution_time: Date.now(),
          language: 'en',
          region: 'US',
          cultural_adaptations_applied: true,
          compliance_checked: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update clinical term'
      };
    }
  }

  /**
   * Delete clinical term
   */
  async deleteClinicalTerm(termId: string): Promise<LocalizationResponse<boolean>> {
    try {
      const existingTerm = this.clinicalTerms.get(termId);
      if (!existingTerm) {
        return {
          success: false,
          error: 'Clinical term not found'
        };
      }

      this.clinicalTerms.delete(termId);

      this.logTerminologyEvent('clinical_term_deleted', {
        term_id: termId,
        english_term: existingTerm.english_term
      });

      return {
        success: true,
        data: true,
        metadata: {
          execution_time: Date.now(),
          language: 'en',
          region: 'US',
          cultural_adaptations_applied: false,
          compliance_checked: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete clinical term'
      };
    }
  }

  /**
   * Get procedure terminology
   */
  async getProcedureTerm(
    procedureCode: string,
    language: string
  ): Promise<LocalizationResponse<ProcedureTermMapping>> {
    try {
      const key = `${procedureCode}_${language}`;
      const procedure = this.procedures.get(key);
      
      if (!procedure) {
        return {
          success: false,
          error: `Procedure term not found: ${procedureCode} for language: ${language}`
        };
      }

      return {
        success: true,
        data: procedure,
        metadata: {
          execution_time: Date.now(),
          language,
          region: 'US',
          cultural_adaptations_applied: true,
          compliance_checked: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get procedure term'
      };
    }
  }

  /**
   * Get diagnosis terminology
   */
  async getDiagnosisTerm(
    diagnosisCode: string,
    language: string
  ): Promise<LocalizationResponse<DiagnosisTermMapping>> {
    try {
      const key = `${diagnosisCode}_${language}`;
      const diagnosis = this.diagnoses.get(key);
      
      if (!diagnosis) {
        return {
          success: false,
          error: `Diagnosis term not found: ${diagnosisCode} for language: ${language}`
        };
      }

      return {
        success: true,
        data: diagnosis,
        metadata: {
          execution_time: Date.now(),
          language,
          region: 'US',
          cultural_adaptations_applied: true,
          compliance_checked: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get diagnosis term'
      };
    }
  }

  /**
   * Get medication terminology
   */
  async getMedicationTerm(
    medicationId: string,
    language: string
  ): Promise<LocalizationResponse<MedicationTermMapping>> {
    try {
      const key = `${medicationId}_${language}`;
      const medication = this.medications.get(key);
      
      if (!medication) {
        return {
          success: false,
          error: `Medication term not found: ${medicationId} for language: ${language}`
        };
      }

      return {
        success: true,
        data: medication,
        metadata: {
          execution_time: Date.now(),
          language,
          region: 'US',
          cultural_adaptations_applied: true,
          compliance_checked: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get medication term'
      };
    }
  }

  /**
   * Get equipment terminology
   */
  async getEquipmentTerm(
    equipmentId: string,
    language: string
  ): Promise<LocalizationResponse<EquipmentTermMapping>> {
    try {
      const key = `${equipmentId}_${language}`;
      const equipment = this.equipment.get(key);
      
      if (!equipment) {
        return {
          success: false,
          error: `Equipment term not found: ${equipmentId} for language: ${language}`
        };
      }

      return {
        success: true,
        data: equipment,
        metadata: {
          execution_time: Date.now(),
          language,
          region: 'US',
          cultural_adaptations_applied: true,
          compliance_checked: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get equipment term'
      };
    }
  }

  /**
   * Validate terminology consistency
   */
  async validateTerminologyConsistency(
    language: string
  ): Promise<LocalizationResponse<{
    warnings: LocalizationWarning[];
    suggestions: LocalizationSuggestion[];
    consistency_score: number;
  }>> {
    try {
      const warnings: LocalizationWarning[] = [];
      const suggestions: LocalizationSuggestion[] = [];
      let consistencyScore = 1.0;

      // Check for missing translations
      const clinicalTerms = Array.from(this.clinicalTerms.values());
      const missingTranslations = clinicalTerms.filter(term => 
        !term.localized_term || term.localized_term === term.english_term
      );

      if (missingTranslations.length > 0) {
        warnings.push({
          warning_id: 'missing_translations',
          message: `${missingTranslations.length} clinical terms missing translations`,
          localized_message: `${missingTranslations.length} clinical terms missing translations`,
          context: 'terminology_consistency',
          severity: 'warning',
          recommendation: 'Add localized translations for all clinical terms',
          cultural_consideration: 'Missing translations may impact user experience'
        });
        consistencyScore -= 0.1;
      }

      // Check for low confidence terms
      const lowConfidenceTerms = clinicalTerms.filter(term => 
        term.confidence_level < 0.7
      );

      if (lowConfidenceTerms.length > 0) {
        warnings.push({
          warning_id: 'low_confidence_terms',
          message: `${lowConfidenceTerms.length} terms have low confidence levels`,
          localized_message: `${lowConfidenceTerms.length} terms have low confidence levels`,
          context: 'terminology_quality',
          severity: 'warning',
          recommendation: 'Review and improve low confidence terms',
          cultural_consideration: 'Low confidence terms may lead to misunderstandings'
        });
        consistencyScore -= 0.05;
      }

      // Check for outdated terms
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const outdatedTerms = clinicalTerms.filter(term => 
        new Date(term.last_verified) < oneYearAgo
      );

      if (outdatedTerms.length > 0) {
        suggestions.push({
          suggestion_id: 'outdated_terms',
          type: 'terminology_improvement',
          message: `${outdatedTerms.length} terms may need updating`,
          localized_message: `${outdatedTerms.length} terms may need updating`,
          context: 'terminology_maintenance',
          implementation_effort: 'medium',
          cultural_impact: 'medium',
          compliance_benefit: 'Ensures terminology accuracy and compliance'
        });
        consistencyScore -= 0.02;
      }

      // Check for duplicate terms
      const termMap = new Map<string, ClinicalTermMapping[]>();
      clinicalTerms.forEach(term => {
        const key = term.english_term.toLowerCase();
        if (!termMap.has(key)) {
          termMap.set(key, []);
        }
        termMap.get(key)!.push(term);
      });

      const duplicateTerms = Array.from(termMap.values())
        .filter(terms => terms.length > 1);

      if (duplicateTerms.length > 0) {
        warnings.push({
          warning_id: 'duplicate_terms',
          message: `${duplicateTerms.length} duplicate terms found`,
          localized_message: `${duplicateTerms.length} duplicate terms found`,
          context: 'terminology_consistency',
          severity: 'warning',
          recommendation: 'Consolidate duplicate terms',
          cultural_consideration: 'Duplicate terms may cause confusion'
        });
        consistencyScore -= 0.03;
      }

      return {
        success: true,
        data: {
          warnings,
          suggestions,
          consistency_score: Math.max(0, consistencyScore)
        },
        metadata: {
          execution_time: Date.now(),
          language,
          region: 'US',
          cultural_adaptations_applied: true,
          compliance_checked: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate terminology consistency'
      };
    }
  }

  // Private helper methods

  private initializeDefaultTerminology(): void {
    // Initialize default medical specialties
    const cardiology: MedicalSpecialtyTerminology = {
      specialty_code: 'CARD',
      specialty_name: 'Cardiology',
      localized_name: 'Cardiology',
      description: 'Medical specialty dealing with heart and blood vessel disorders',
      localized_description: 'Medical specialty dealing with heart and blood vessel disorders',
      common_terms: [
        {
          english_term: 'heart attack',
          localized_term: 'heart attack',
          context: 'diagnosis',
          confidence_level: 1.0,
          last_verified: new Date().toISOString(),
          verified_by: 'system'
        }
      ],
      procedures: [],
      diagnoses: [],
      medications: [],
      equipment: [],
      cultural_notes: 'Cardiology is universally recognized across cultures',
      regional_variations: []
    };

    this.medicalSpecialties.set('CARD_en', cardiology);

    // Initialize default clinical terms
    const bloodPressure: ClinicalTermMapping = {
      term_id: 'blood_pressure',
      english_term: 'Blood Pressure',
      localized_term: 'Blood Pressure',
      context: 'patient_care',
      category: 'vital_signs',
      synonyms: ['BP', 'arterial pressure'],
      abbreviations: ['BP'],
      pronunciation: 'bluhd presh-er',
      cultural_considerations: 'Universal medical term',
      usage_notes: 'Standard vital sign measurement',
      confidence_level: 1.0,
      last_verified: new Date().toISOString(),
      verified_by: 'system'
    };

    this.clinicalTerms.set('blood_pressure', bloodPressure);

    // Initialize default procedures
    const officeVisit: ProcedureTermMapping = {
      procedure_code: '99213',
      english_name: 'Office Visit',
      localized_name: 'Office Visit',
      description: 'Established patient office visit',
      localized_description: 'Established patient office visit',
      cultural_considerations: 'Standard medical procedure',
      regional_variations: [],
      confidence_level: 1.0,
      last_verified: new Date().toISOString(),
      verified_by: 'system'
    };

    this.procedures.set('99213_en', officeVisit);

    // Initialize default diagnoses
    const diabetes: DiagnosisTermMapping = {
      diagnosis_code: '250.00',
      english_name: 'Type 2 Diabetes',
      localized_name: 'Type 2 Diabetes',
      description: 'Type 2 diabetes mellitus without complications',
      localized_description: 'Type 2 diabetes mellitus without complications',
      cultural_considerations: 'Common chronic condition',
      regional_variations: [],
      confidence_level: 1.0,
      last_verified: new Date().toISOString(),
      verified_by: 'system'
    };

    this.diagnoses.set('250.00_en', diabetes);
  }

  private generateTermId(englishTerm: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sanitizedTerm = englishTerm.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `term_${timestamp}_${sanitizedTerm}_${random}`;
  }

  private logTerminologyEvent(
    eventType: string,
    data: any
  ): void {
    console.log('Terminology Event:', {
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    });
  }
}
