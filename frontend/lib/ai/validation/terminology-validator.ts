/**
 * Medical Terminology Validator
 * HMHCP Healthcare AI Platform
 * 
 * Specialized validator for medical terminology, abbreviations,
 * anatomical references, and clinical language accuracy.
 */

import { ValidationResult, ValidationError, ValidationWarning, ValidationSuggestion } from './medical-validator';

export interface TerminologyValidationOptions {
  checkDeprecatedTerms: boolean;
  validateAbbreviations: boolean;
  checkAnatomicalTerms: boolean;
  enforceStandardNomenclature: boolean;
  targetAudience: 'patient' | 'provider' | 'researcher';
}

export interface MedicalTerm {
  term: string;
  definition: string;
  category: 'anatomy' | 'pathology' | 'pharmacology' | 'procedure' | 'diagnosis';
  synonyms: string[];
  preferredTerm?: string;
  deprecated: boolean;
  audience: ('patient' | 'provider' | 'researcher')[];
  lastUpdated: Date;
}

export interface MedicalAbbreviation {
  abbreviation: string;
  fullForm: string;
  category: string;
  ambiguous: boolean;
  alternativeMeanings?: string[];
  context: string[];
  standardized: boolean;
}

export interface AnatomicalTerm {
  term: string;
  latinName: string;
  commonName: string;
  system: string;
  location: string;
  function: string;
  relatedTerms: string[];
}

/**
 * Medical Terminology Validator Class
 * Provides comprehensive medical terminology validation
 */
export class MedicalTerminologyValidator {
  private medicalTerms: Map<string, MedicalTerm>;
  private medicalAbbreviations: Map<string, MedicalAbbreviation>;
  private anatomicalTerms: Map<string, AnatomicalTerm>;
  private deprecatedTerms: Map<string, string>; // deprecated -> preferred
  private ambiguousAbbreviations: Set<string>;

  constructor() {
    this.medicalTerms = new Map();
    this.medicalAbbreviations = new Map();
    this.anatomicalTerms = new Map();
    this.deprecatedTerms = new Map();
    this.ambiguousAbbreviations = new Set();
    
    this.initializeTerminologyDatabase();
  }

  /**
   * Validate medical terminology in content
   */
  async validateTerminology(
    content: string, 
    options: Partial<TerminologyValidationOptions> = {}
  ): Promise<ValidationResult> {
    const defaultOptions: TerminologyValidationOptions = {
      checkDeprecatedTerms: true,
      validateAbbreviations: true,
      checkAnatomicalTerms: true,
      enforceStandardNomenclature: true,
      targetAudience: 'provider'
    };

    const validationOptions = { ...defaultOptions, ...options };
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      // Extract medical terms from content
      const extractedTerms = this.extractMedicalTerms(content);
      const extractedAbbreviations = this.extractAbbreviations(content);
      const anatomicalTerms = this.extractAnatomicalTerms(content);

      // Validate medical terms
      if (validationOptions.checkDeprecatedTerms) {
        const deprecatedResults = this.validateDeprecatedTerms(extractedTerms);
        suggestions.push(...deprecatedResults.suggestions);
        warnings.push(...deprecatedResults.warnings);
      }

      // Validate abbreviations
      if (validationOptions.validateAbbreviations) {
        const abbreviationResults = this.validateAbbreviations(extractedAbbreviations, validationOptions.targetAudience);
        errors.push(...abbreviationResults.errors);
        warnings.push(...abbreviationResults.warnings);
        suggestions.push(...abbreviationResults.suggestions);
      }

      // Validate anatomical terms
      if (validationOptions.checkAnatomicalTerms) {
        const anatomicalResults = this.validateAnatomicalTerms(anatomicalTerms);
        errors.push(...anatomicalResults.errors);
        warnings.push(...anatomicalResults.warnings);
        suggestions.push(...anatomicalResults.suggestions);
      }

      // Validate nomenclature standards
      if (validationOptions.enforceStandardNomenclature) {
        const nomenclatureResults = this.validateNomenclatureStandards(content, validationOptions.targetAudience);
        warnings.push(...nomenclatureResults.warnings);
        suggestions.push(...nomenclatureResults.suggestions);
      }

      // Calculate confidence based on validation results
      const confidence = this.calculateTerminologyConfidence(errors, warnings, extractedTerms.length);

      return {
        isValid: errors.filter(e => e.severity === 'critical').length === 0,
        severity: this.getHighestSeverity(errors),
        confidence,
        errors,
        warnings,
        suggestions,
        auditTrail: [{
          timestamp: new Date(),
          validationType: 'medical_terminology',
          result: errors.length > 0 ? 'fail' : (warnings.length > 0 ? 'warning' : 'pass'),
          details: `Validated ${extractedTerms.length} terms, ${extractedAbbreviations.length} abbreviations`
        }]
      };

    } catch (error) {
      return {
        isValid: false,
        severity: 'critical',
        confidence: 0,
        errors: [{
          code: 'TERMINOLOGY_VALIDATION_ERROR',
          message: 'Failed to validate medical terminology',
          field: 'content',
          severity: 'critical',
          confidence: 1
        }],
        warnings: [],
        suggestions: [],
        auditTrail: [{
          timestamp: new Date(),
          validationType: 'medical_terminology',
          result: 'fail',
          details: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  /**
   * Validate specific medical term
   */
  async validateTerm(term: string): Promise<{
    isValid: boolean;
    termInfo?: MedicalTerm;
    alternatives?: string[];
    severity: 'valid' | 'deprecated' | 'invalid' | 'ambiguous';
  }> {
    const normalizedTerm = term.toLowerCase().trim();
    const termInfo = this.medicalTerms.get(normalizedTerm);

    if (termInfo) {
      if (termInfo.deprecated && termInfo.preferredTerm) {
        return {
          isValid: false,
          termInfo,
          alternatives: [termInfo.preferredTerm],
          severity: 'deprecated'
        };
      }
      return {
        isValid: true,
        termInfo,
        severity: 'valid'
      };
    }

    // Check if it's a deprecated term
    const preferredTerm = this.deprecatedTerms.get(normalizedTerm);
    if (preferredTerm) {
      return {
        isValid: false,
        alternatives: [preferredTerm],
        severity: 'deprecated'
      };
    }

    // Find similar terms
    const similarTerms = this.findSimilarTerms(normalizedTerm);
    
    return {
      isValid: false,
      alternatives: similarTerms,
      severity: 'invalid'
    };
  }

  /**
   * Validate medical abbreviation
   */
  async validateAbbreviation(
    abbreviation: string, 
    context?: string
  ): Promise<{
    isValid: boolean;
    abbreviationInfo?: MedicalAbbreviation;
    ambiguous: boolean;
    possibleMeanings?: string[];
    recommendation?: string;
  }> {
    const upperAbbr = abbreviation.toUpperCase();
    const abbrInfo = this.medicalAbbreviations.get(upperAbbr);

    if (abbrInfo) {
      if (abbrInfo.ambiguous) {
        let recommendedMeaning = abbrInfo.fullForm;
        
        // Try to disambiguate based on context
        if (context && abbrInfo.alternativeMeanings) {
          const contextMatch = this.findContextualMeaning(abbreviation, context, abbrInfo);
          if (contextMatch) {
            recommendedMeaning = contextMatch;
          }
        }

        return {
          isValid: true,
          abbreviationInfo: abbrInfo,
          ambiguous: true,
          possibleMeanings: [abbrInfo.fullForm, ...(abbrInfo.alternativeMeanings || [])],
          recommendation: `Consider spelling out "${recommendedMeaning}" to avoid ambiguity`
        };
      }

      return {
        isValid: true,
        abbreviationInfo: abbrInfo,
        ambiguous: false
      };
    }

    return {
      isValid: false,
      ambiguous: false,
      recommendation: 'Abbreviation not found in medical abbreviation database'
    };
  }

  /**
   * Get terminology suggestions for content
   */
  async getTerminologySuggestions(content: string): Promise<ValidationSuggestion[]> {
    const suggestions: ValidationSuggestion[] = [];
    const terms = this.extractMedicalTerms(content);

    for (const term of terms) {
      const validation = await this.validateTerm(term);
      if (!validation.isValid && validation.alternatives) {
        suggestions.push({
          type: 'terminology',
          original: term,
          suggested: validation.alternatives[0],
          reason: validation.severity === 'deprecated' ? 'Using deprecated terminology' : 'Suggested standardized term',
          confidence: 0.8
        });
      }
    }

    return suggestions;
  }

  // Private helper methods

  private initializeTerminologyDatabase(): void {
    this.initializeMedicalTerms();
    this.initializeAbbreviations();
    this.initializeAnatomicalTerms();
    this.initializeDeprecatedTerms();
  }

  private initializeMedicalTerms(): void {
    const terms: MedicalTerm[] = [
      {
        term: 'myocardial infarction',
        definition: 'Death of heart muscle due to insufficient blood flow',
        category: 'pathology',
        synonyms: ['heart attack', 'MI'],
        deprecated: false,
        audience: ['provider', 'researcher'],
        lastUpdated: new Date('2024-01-01')
      },
      {
        term: 'cerebrovascular accident',
        definition: 'Sudden loss of brain function due to disturbance in blood supply',
        category: 'pathology',
        synonyms: ['CVA'],
        preferredTerm: 'stroke',
        deprecated: true,
        audience: ['provider'],
        lastUpdated: new Date('2024-01-01')
      },
      {
        term: 'stroke',
        definition: 'Sudden loss of brain function due to disturbance in blood supply',
        category: 'pathology',
        synonyms: ['brain attack'],
        deprecated: false,
        audience: ['patient', 'provider', 'researcher'],
        lastUpdated: new Date('2024-01-01')
      },
      {
        term: 'hypertension',
        definition: 'High blood pressure',
        category: 'pathology',
        synonyms: ['high blood pressure', 'HTN'],
        deprecated: false,
        audience: ['patient', 'provider', 'researcher'],
        lastUpdated: new Date('2024-01-01')
      },
      {
        term: 'pneumonia',
        definition: 'Infection that inflames air sacs in lungs',
        category: 'pathology',
        synonyms: ['lung infection'],
        deprecated: false,
        audience: ['patient', 'provider', 'researcher'],
        lastUpdated: new Date('2024-01-01')
      }
    ];

    terms.forEach(term => {
      this.medicalTerms.set(term.term, term);
      term.synonyms.forEach(synonym => {
        this.medicalTerms.set(synonym.toLowerCase(), term);
      });
    });
  }

  private initializeAbbreviations(): void {
    const abbreviations: MedicalAbbreviation[] = [
      {
        abbreviation: 'MI',
        fullForm: 'myocardial infarction',
        category: 'cardiology',
        ambiguous: false,
        context: ['cardiology', 'emergency'],
        standardized: true
      },
      {
        abbreviation: 'CVA',
        fullForm: 'cerebrovascular accident',
        category: 'neurology',
        ambiguous: false,
        context: ['neurology', 'emergency'],
        standardized: false // Deprecated term
      },
      {
        abbreviation: 'MS',
        fullForm: 'multiple sclerosis',
        category: 'neurology',
        ambiguous: true,
        alternativeMeanings: ['mitral stenosis', 'morphine sulfate', 'medical student'],
        context: ['neurology', 'cardiology', 'pharmacy', 'education'],
        standardized: true
      },
      {
        abbreviation: 'HTN',
        fullForm: 'hypertension',
        category: 'cardiology',
        ambiguous: false,
        context: ['cardiology', 'primary care'],
        standardized: true
      },
      {
        abbreviation: 'BP',
        fullForm: 'blood pressure',
        category: 'vital signs',
        ambiguous: false,
        context: ['vital signs', 'cardiology'],
        standardized: true
      },
      {
        abbreviation: 'HR',
        fullForm: 'heart rate',
        category: 'vital signs',
        ambiguous: false,
        context: ['vital signs', 'cardiology'],
        standardized: true
      }
    ];

    abbreviations.forEach(abbr => {
      this.medicalAbbreviations.set(abbr.abbreviation, abbr);
      if (abbr.ambiguous) {
        this.ambiguousAbbreviations.add(abbr.abbreviation);
      }
    });
  }

  private initializeAnatomicalTerms(): void {
    const anatomicalTerms: AnatomicalTerm[] = [
      {
        term: 'heart',
        latinName: 'cor',
        commonName: 'heart',
        system: 'cardiovascular',
        location: 'thoracic cavity',
        function: 'pumps blood throughout the body',
        relatedTerms: ['myocardium', 'pericardium', 'endocardium']
      },
      {
        term: 'lung',
        latinName: 'pulmo',
        commonName: 'lung',
        system: 'respiratory',
        location: 'thoracic cavity',
        function: 'gas exchange',
        relatedTerms: ['alveoli', 'bronchi', 'pleura']
      },
      {
        term: 'brain',
        latinName: 'cerebrum',
        commonName: 'brain',
        system: 'nervous',
        location: 'cranial cavity',
        function: 'central processing of nervous system',
        relatedTerms: ['cerebellum', 'brainstem', 'cerebral cortex']
      }
    ];

    anatomicalTerms.forEach(term => {
      this.anatomicalTerms.set(term.term, term);
      this.anatomicalTerms.set(term.latinName, term);
    });
  }

  private initializeDeprecatedTerms(): void {
    const deprecatedMappings: [string, string][] = [
      ['cerebrovascular accident', 'stroke'],
      ['cva', 'stroke'],
      ['mongolism', 'down syndrome'],
      ['spastic', 'cerebral palsy'],
      ['consumption', 'tuberculosis'],
      ['dropsy', 'edema'],
      ['apoplexy', 'stroke']
    ];

    deprecatedMappings.forEach(([deprecated, preferred]) => {
      this.deprecatedTerms.set(deprecated.toLowerCase(), preferred);
    });
  }

  private extractMedicalTerms(content: string): string[] {
    // Enhanced medical term extraction with better pattern matching
    const medicalPatterns = [
      // Disease/condition patterns
      /\b\w*(itis|osis|emia|uria|pathy|trophy|plasia|genesis|lysis)\b/gi,
      // Anatomical terms
      /\b(cardio|hepato|nephro|neuro|gastro|pulmo|dermato|osteo|arthr)\w*\b/gi,
      // Common medical terms
      /\b(syndrome|disease|disorder|condition|infection|inflammation|treatment|therapy|diagnosis|procedure|surgery)\b/gi,
      // Specific medical conditions
      /\b(diabetes|hypertension|pneumonia|cancer|tumor|fracture|stroke|infarction)\b/gi
    ];

    const terms = new Set<string>();
    
    medicalPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => terms.add(match.toLowerCase().trim()));
      }
    });

    // Also check against known medical terms
    const words = content.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (this.medicalTerms.has(word)) {
        terms.add(word);
      }
    });

    return Array.from(terms);
  }

  private extractAbbreviations(content: string): string[] {
    // Extract potential medical abbreviations
    const abbreviationPattern = /\b[A-Z]{2,6}\b/g;
    const matches = content.match(abbreviationPattern);
    return matches ? Array.from(new Set(matches)) : [];
  }

  private extractAnatomicalTerms(content: string): string[] {
    const anatomicalTerms: string[] = [];
    const words = content.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      if (this.anatomicalTerms.has(word)) {
        anatomicalTerms.push(word);
      }
    });

    return anatomicalTerms;
  }

  private validateDeprecatedTerms(terms: string[]): {
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  } {
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    terms.forEach(term => {
      const normalizedTerm = term.toLowerCase();
      const termInfo = this.medicalTerms.get(normalizedTerm);
      
      if (termInfo && termInfo.deprecated && termInfo.preferredTerm) {
        warnings.push({
          code: 'DEPRECATED_TERMINOLOGY',
          message: `Term "${term}" is deprecated`,
          field: 'content',
          recommendation: `Use "${termInfo.preferredTerm}" instead`
        });

        suggestions.push({
          type: 'terminology',
          original: term,
          suggested: termInfo.preferredTerm,
          reason: 'Term is deprecated in current medical practice',
          confidence: 0.95
        });
      }

      const preferredTerm = this.deprecatedTerms.get(normalizedTerm);
      if (preferredTerm) {
        warnings.push({
          code: 'DEPRECATED_TERMINOLOGY',
          message: `Term "${term}" is outdated`,
          field: 'content',
          recommendation: `Use "${preferredTerm}" instead`
        });

        suggestions.push({
          type: 'terminology',
          original: term,
          suggested: preferredTerm,
          reason: 'Term is outdated in current medical practice',
          confidence: 0.9
        });
      }
    });

    return { warnings, suggestions };
  }

  private validateAbbreviations(
    abbreviations: string[], 
    targetAudience: 'patient' | 'provider' | 'researcher'
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    abbreviations.forEach(abbr => {
      const abbrInfo = this.medicalAbbreviations.get(abbr);
      
      if (!abbrInfo) {
        errors.push({
          code: 'UNKNOWN_ABBREVIATION',
          message: `Abbreviation "${abbr}" not recognized`,
          field: 'content',
          severity: 'minor',
          correction: 'Spell out the full term or verify abbreviation',
          confidence: 0.8
        });
        return;
      }

      // Check if abbreviation is appropriate for target audience
      if (targetAudience === 'patient' && !abbrInfo.standardized) {
        warnings.push({
          code: 'PATIENT_INAPPROPRIATE_ABBREVIATION',
          message: `Abbreviation "${abbr}" may be unclear for patient audience`,
          field: 'content',
          recommendation: `Consider spelling out "${abbrInfo.fullForm}"`
        });
      }

      // Check for ambiguous abbreviations
      if (abbrInfo.ambiguous) {
        warnings.push({
          code: 'AMBIGUOUS_ABBREVIATION',
          message: `Abbreviation "${abbr}" has multiple meanings`,
          field: 'content',
          recommendation: `Consider spelling out to clarify meaning. Possible meanings: ${[abbrInfo.fullForm, ...(abbrInfo.alternativeMeanings || [])].join(', ')}`
        });

        suggestions.push({
          type: 'terminology',
          original: abbr,
          suggested: abbrInfo.fullForm,
          reason: 'Abbreviation is ambiguous and may be misinterpreted',
          confidence: 0.7
        });
      }

      // Check for deprecated abbreviations
      if (!abbrInfo.standardized) {
        suggestions.push({
          type: 'terminology',
          original: abbr,
          suggested: abbrInfo.fullForm,
          reason: 'Abbreviation is not standardized in current practice',
          confidence: 0.8
        });
      }
    });

    return { errors, warnings, suggestions };
  }

  private validateAnatomicalTerms(terms: string[]): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    terms.forEach(term => {
      const anatomicalInfo = this.anatomicalTerms.get(term);
      
      if (!anatomicalInfo) {
        warnings.push({
          code: 'UNRECOGNIZED_ANATOMICAL_TERM',
          message: `Anatomical term "${term}" not found in standard anatomy references`,
          field: 'content',
          recommendation: 'Verify anatomical term accuracy'
        });
      }
    });

    return { errors, warnings, suggestions };
  }

  private validateNomenclatureStandards(
    content: string, 
    targetAudience: 'patient' | 'provider' | 'researcher'
  ): {
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  } {
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Check for mixed terminology styles
    const hasLatinTerms = /\b[a-z]+\s+[a-z]+\b/.test(content.toLowerCase());
    const hasCommonTerms = /\bheart\b|\blung\b|\bbrain\b/i.test(content);

    if (hasLatinTerms && hasCommonTerms && targetAudience === 'patient') {
      warnings.push({
        code: 'MIXED_TERMINOLOGY_STYLE',
        message: 'Content mixes medical Latin terms with common terms',
        field: 'content',
        recommendation: 'Consider using consistent terminology appropriate for patient audience'
      });
    }

    // Check for overly technical language for patient audience
    if (targetAudience === 'patient') {
      const technicalTerms = this.findTechnicalTerms(content);
      if (technicalTerms.length > 0) {
        warnings.push({
          code: 'TECHNICAL_LANGUAGE_FOR_PATIENTS',
          message: 'Content may be too technical for patient audience',
          field: 'content',
          recommendation: 'Consider simplifying medical terminology or providing definitions'
        });

        technicalTerms.forEach(term => {
          const termInfo = this.medicalTerms.get(term.toLowerCase());
          if (termInfo && termInfo.synonyms.length > 0) {
            const patientFriendlyAlternative = termInfo.synonyms.find(synonym => 
              termInfo.audience.includes('patient')
            );
            if (patientFriendlyAlternative) {
              suggestions.push({
                type: 'terminology',
                original: term,
                suggested: patientFriendlyAlternative,
                reason: 'More patient-friendly terminology',
                confidence: 0.8
              });
            }
          }
        });
      }
    }

    return { warnings, suggestions };
  }

  private findTechnicalTerms(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const technicalTerms: string[] = [];

    words.forEach(word => {
      const termInfo = this.medicalTerms.get(word);
      if (termInfo && !termInfo.audience.includes('patient')) {
        technicalTerms.push(word);
      }
    });

    return technicalTerms;
  }

  private findSimilarTerms(term: string): string[] {
    const similarities: Array<{ term: string; similarity: number }> = [];
    
    this.medicalTerms.forEach((termInfo, knownTerm) => {
      const similarity = this.calculateStringSimilarity(term, knownTerm);
      if (similarity > 0.6) {
        similarities.push({ term: knownTerm, similarity });
      }
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(item => item.term);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private findContextualMeaning(
    abbreviation: string, 
    context: string, 
    abbrInfo: MedicalAbbreviation
  ): string | null {
    const contextLower = context.toLowerCase();
    
    // Check if context matches any of the abbreviation's context categories
    for (const contextCategory of abbrInfo.context) {
      if (contextLower.includes(contextCategory.toLowerCase())) {
        return abbrInfo.fullForm;
      }
    }

    // Check alternative meanings against context
    if (abbrInfo.alternativeMeanings) {
      for (const meaning of abbrInfo.alternativeMeanings) {
        const meaningWords = meaning.toLowerCase().split(' ');
        if (meaningWords.some(word => contextLower.includes(word))) {
          return meaning;
        }
      }
    }

    return null;
  }

  private calculateTerminologyConfidence(
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    totalTerms: number
  ): number {
    if (totalTerms === 0) return 1;

    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const majorErrors = errors.filter(e => e.severity === 'major').length;
    const minorErrors = errors.filter(e => e.severity === 'minor').length;

    const errorWeight = (criticalErrors * 0.5) + (majorErrors * 0.3) + (minorErrors * 0.1);
    const warningWeight = warnings.length * 0.05;
    
    const totalWeight = errorWeight + warningWeight;
    const maxPossibleWeight = totalTerms * 0.5; // Assuming worst case
    
    return Math.max(0, 1 - (totalWeight / Math.max(1, maxPossibleWeight)));
  }

  private getHighestSeverity(errors: ValidationError[]): 'critical' | 'major' | 'minor' | 'info' {
    if (errors.some(e => e.severity === 'critical')) return 'critical';
    if (errors.some(e => e.severity === 'major')) return 'major';
    if (errors.some(e => e.severity === 'minor')) return 'minor';
    return 'info';
  }

  // Public utility methods

  /**
   * Get all available medical terms
   */
  getMedicalTerms(): MedicalTerm[] {
    return Array.from(this.medicalTerms.values());
  }

  /**
   * Get all available medical abbreviations
   */
  getMedicalAbbreviations(): MedicalAbbreviation[] {
    return Array.from(this.medicalAbbreviations.values());
  }

  /**
   * Add custom medical term
   */
  addMedicalTerm(term: MedicalTerm): void {
    this.medicalTerms.set(term.term.toLowerCase(), term);
    term.synonyms.forEach(synonym => {
      this.medicalTerms.set(synonym.toLowerCase(), term);
    });
  }

  /**
   * Add custom medical abbreviation
   */
  addMedicalAbbreviation(abbreviation: MedicalAbbreviation): void {
    this.medicalAbbreviations.set(abbreviation.abbreviation.toUpperCase(), abbreviation);
    if (abbreviation.ambiguous) {
      this.ambiguousAbbreviations.add(abbreviation.abbreviation.toUpperCase());
    }
  }
}

// Export singleton instance
export const medicalTerminologyValidator = new MedicalTerminologyValidator();