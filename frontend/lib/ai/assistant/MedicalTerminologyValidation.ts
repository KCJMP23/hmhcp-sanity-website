/**
 * Medical Terminology Validation System
 * Advanced medical terminology validation with healthcare compliance
 */

import { createClient } from '@/lib/supabase/client';
import { AssistantContext } from './AIAssistantCore';

export interface MedicalTerm {
  id: string;
  term: string;
  definition: string;
  category: 'anatomy' | 'physiology' | 'pathology' | 'pharmacology' | 'procedures' | 'diagnosis' | 'symptoms' | 'treatment' | 'equipment' | 'abbreviation';
  specialty: string[];
  synonyms: string[];
  abbreviations: string[];
  relatedTerms: string[];
  pronunciation: string;
  etymology: string;
  usage: {
    context: string[];
    examples: string[];
    notes: string;
  };
  compliance: {
    hipaa: boolean;
    fda: boolean;
    cms: boolean;
    jcaho: boolean;
    icd10: boolean;
    snomed: boolean;
  };
  validation: {
    verified: boolean;
    verifiedBy: string;
    verifiedAt: Date;
    confidence: number; // 0-1
    source: string;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    healthcareRelevant: boolean;
    complianceRequired: boolean;
  };
}

export interface TerminologyValidation {
  id: string;
  userId: string;
  content: string;
  context: {
    page: string;
    task: string;
    userRole: string;
    medicalSpecialty?: string;
    complianceLevel: string;
    sessionId: string;
  };
  validation: {
    terms: Array<{
      term: string;
      position: { start: number; end: number };
      category: string;
      specialty: string[];
      definition: string;
      confidence: number; // 0-1
      validated: boolean;
      suggestions: string[];
      warnings: string[];
    }>;
    overall: {
      score: number; // 0-1
      accuracy: number; // 0-1
      completeness: number; // 0-1
      compliance: number; // 0-1
      warnings: string[];
      errors: string[];
    };
  };
  recommendations: Array<{
    type: 'correction' | 'suggestion' | 'warning' | 'compliance';
    term: string;
    current: string;
    suggested: string;
    reason: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    impact: 'low' | 'medium' | 'high';
  }>;
  compliance: {
    hipaaCompliant: boolean;
    fdaCompliant: boolean;
    cmsCompliant: boolean;
    jcahoCompliant: boolean;
    issues: Array<{
      type: 'privacy' | 'security' | 'data' | 'consent' | 'audit';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      suggestion: string;
    }>;
  };
  metadata: {
    validatedAt: Date;
    healthcareRelevant: boolean;
    complianceRequired: boolean;
  };
}

export interface TerminologyDictionary {
  id: string;
  name: string;
  description: string;
  version: string;
  language: string;
  specialty: string[];
  terms: MedicalTerm[];
  statistics: {
    totalTerms: number;
    categories: Record<string, number>;
    specialties: Record<string, number>;
    lastUpdated: Date;
  };
  compliance: {
    hipaa: boolean;
    fda: boolean;
    cms: boolean;
    jcaho: boolean;
    verified: boolean;
    verifiedBy: string;
    verifiedAt: Date;
  };
  metadata: {
    createdAt: Date;
    lastModified: Date;
    createdBy: string;
    healthcareRelevant: boolean;
    complianceRequired: boolean;
  };
}

export class MedicalTerminologyValidation {
  private supabase = createClient();
  private terms: Map<string, MedicalTerm> = new Map();
  private dictionaries: Map<string, TerminologyDictionary> = new Map();
  private validations: Map<string, TerminologyValidation> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeMedicalTerms();
    this.startProcessing();
  }

  /**
   * Start processing
   */
  startProcessing(): void {
    // Process every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processValidations();
    }, 30000);
  }

  /**
   * Stop processing
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Validate medical terminology
   */
  async validateMedicalTerminology(
    userId: string,
    content: string,
    context: AssistantContext
  ): Promise<TerminologyValidation> {
    try {
      const validation: TerminologyValidation = {
        id: `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        content,
        context: {
          page: context.currentPage || '',
          task: context.currentTask || '',
          userRole: context.medicalContext?.specialty || 'general',
          medicalSpecialty: context.medicalContext?.specialty,
          complianceLevel: context.medicalContext?.complianceLevel || 'institutional',
          sessionId: context.sessionId || ''
        },
        validation: {
          terms: [],
          overall: {
            score: 0,
            accuracy: 0,
            completeness: 0,
            compliance: 0,
            warnings: [],
            errors: []
          }
        },
        recommendations: [],
        compliance: {
          hipaaCompliant: true,
          fdaCompliant: true,
          cmsCompliant: true,
          jcahoCompliant: true,
          issues: []
        },
        metadata: {
          validatedAt: new Date(),
          healthcareRelevant: context.medicalContext?.complianceLevel === 'hipaa',
          complianceRequired: context.medicalContext?.complianceLevel === 'hipaa'
        }
      };

      // Extract medical terms from content
      const extractedTerms = await this.extractMedicalTerms(content);
      
      // Validate each term
      for (const term of extractedTerms) {
        const termValidation = await this.validateTerm(term, context);
        validation.validation.terms.push(termValidation);
      }

      // Calculate overall validation scores
      validation.validation.overall = await this.calculateOverallScores(validation);

      // Generate recommendations
      validation.recommendations = await this.generateRecommendations(validation);

      // Check compliance
      validation.compliance = await this.checkCompliance(validation, context);

      // Store validation
      this.validations.set(validation.id, validation);

      // Store in database
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: userId,
          interaction_type: 'medical_terminology_validated',
          user_input: content.substring(0, 100),
          assistant_response: 'terminology_validated',
          context_data: {
            validation: validation
          },
          learning_insights: {
            validationId: validation.id,
            termCount: validation.validation.terms.length,
            overallScore: validation.validation.overall.score,
            healthcareRelevant: validation.metadata.healthcareRelevant
          }
        });

      return validation;
    } catch (error) {
      console.error('Failed to validate medical terminology:', error);
      throw error;
    }
  }

  /**
   * Get medical term
   */
  async getMedicalTerm(term: string): Promise<MedicalTerm | null> {
    try {
      // Check memory first
      if (this.terms.has(term.toLowerCase())) {
        return this.terms.get(term.toLowerCase())!;
      }

      // Search in database
      const { data, error } = await this.supabase
        .from('ai_assistant_learning_data')
        .select('*')
        .eq('interaction_type', 'medical_term_created')
        .contains('context_data', { term: term.toLowerCase() })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const medicalTerm = data[0].context_data.term as MedicalTerm;
        this.terms.set(term.toLowerCase(), medicalTerm);
        return medicalTerm;
      }

      return null;
    } catch (error) {
      console.error('Failed to get medical term:', error);
      return null;
    }
  }

  /**
   * Create medical term
   */
  async createMedicalTerm(
    userId: string,
    term: Omit<MedicalTerm, 'id' | 'metadata'>
  ): Promise<MedicalTerm> {
    try {
      const medicalTerm: MedicalTerm = {
        ...term,
        id: `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          healthcareRelevant: true,
          complianceRequired: true
        }
      };

      // Store in memory
      this.terms.set(term.term.toLowerCase(), medicalTerm);

      // Store in database
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: userId,
          interaction_type: 'medical_term_created',
          user_input: term.term,
          assistant_response: 'term_created',
          context_data: {
            term: medicalTerm
          },
          learning_insights: {
            termId: medicalTerm.id,
            category: term.category,
            specialty: term.specialty,
            compliance: term.compliance
          }
        });

      return medicalTerm;
    } catch (error) {
      console.error('Failed to create medical term:', error);
      throw error;
    }
  }

  /**
   * Get terminology dictionary
   */
  async getTerminologyDictionary(
    specialty: string,
    language: string = 'en'
  ): Promise<TerminologyDictionary | null> {
    try {
      const dictionaryKey = `${specialty}_${language}`;
      
      // Check memory first
      if (this.dictionaries.has(dictionaryKey)) {
        return this.dictionaries.get(dictionaryKey)!;
      }

      // Search in database
      const { data, error } = await this.supabase
        .from('ai_assistant_learning_data')
        .select('*')
        .eq('interaction_type', 'terminology_dictionary_created')
        .contains('context_data', { specialty, language })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const dictionary = data[0].context_data.dictionary as TerminologyDictionary;
        this.dictionaries.set(dictionaryKey, dictionary);
        return dictionary;
      }

      return null;
    } catch (error) {
      console.error('Failed to get terminology dictionary:', error);
      return null;
    }
  }

  /**
   * Create terminology dictionary
   */
  async createTerminologyDictionary(
    userId: string,
    dictionary: Omit<TerminologyDictionary, 'id' | 'metadata'>
  ): Promise<TerminologyDictionary> {
    try {
      const terminologyDictionary: TerminologyDictionary = {
        ...dictionary,
        id: `dictionary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          createdAt: new Date(),
          lastModified: new Date(),
          createdBy: userId,
          healthcareRelevant: true,
          complianceRequired: true
        }
      };

      // Store in memory
      const dictionaryKey = `${dictionary.specialty.join('_')}_${dictionary.language}`;
      this.dictionaries.set(dictionaryKey, terminologyDictionary);

      // Store in database
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: userId,
          interaction_type: 'terminology_dictionary_created',
          user_input: dictionary.name,
          assistant_response: 'dictionary_created',
          context_data: {
            dictionary: terminologyDictionary
          },
          learning_insights: {
            dictionaryId: terminologyDictionary.id,
            specialty: dictionary.specialty,
            language: dictionary.language,
            termCount: dictionary.terms.length
          }
        });

      return terminologyDictionary;
    } catch (error) {
      console.error('Failed to create terminology dictionary:', error);
      throw error;
    }
  }

  /**
   * Extract medical terms from content
   */
  private async extractMedicalTerms(content: string): Promise<Array<{
    term: string;
    position: { start: number; end: number };
    category: string;
    specialty: string[];
  }>> {
    const terms: Array<{
      term: string;
      position: { start: number; end: number };
      category: string;
      specialty: string[];
    }> = [];

    // Simple term extraction - in production, use advanced NLP
    const words = content.split(/\s+/);
    let position = 0;

    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      
      // Check if word is a medical term
      const medicalTerm = this.terms.get(cleanWord);
      if (medicalTerm) {
        terms.push({
          term: cleanWord,
          position: { start: position, end: position + word.length },
          category: medicalTerm.category,
          specialty: medicalTerm.specialty
        });
      }

      position += word.length + 1; // +1 for space
    }

    return terms;
  }

  /**
   * Validate term
   */
  private async validateTerm(
    term: any,
    context: AssistantContext
  ): Promise<any> {
    const medicalTerm = this.terms.get(term.term.toLowerCase());
    
    if (!medicalTerm) {
      return {
        term: term.term,
        position: term.position,
        category: 'unknown',
        specialty: [],
        definition: '',
        confidence: 0,
        validated: false,
        suggestions: [],
        warnings: ['Term not found in medical dictionary']
      };
    }

    // Check if term is appropriate for the context
    const isAppropriate = this.isTermAppropriate(medicalTerm, context);
    
    return {
      term: term.term,
      position: term.position,
      category: medicalTerm.category,
      specialty: medicalTerm.specialty,
      definition: medicalTerm.definition,
      confidence: medicalTerm.validation.confidence,
      validated: isAppropriate,
      suggestions: isAppropriate ? [] : this.generateTermSuggestions(medicalTerm, context),
      warnings: isAppropriate ? [] : ['Term may not be appropriate for current context']
    };
  }

  /**
   * Check if term is appropriate for context
   */
  private isTermAppropriate(term: MedicalTerm, context: AssistantContext): boolean {
    // Check specialty match
    if (context.medicalContext?.specialty) {
      return term.specialty.includes(context.medicalContext.specialty);
    }

    // Check compliance level
    if (context.medicalContext?.complianceLevel === 'hipaa') {
      return term.compliance.hipaa;
    }

    return true;
  }

  /**
   * Generate term suggestions
   */
  private generateTermSuggestions(term: MedicalTerm, context: AssistantContext): string[] {
    const suggestions: string[] = [];

    // Add synonyms
    suggestions.push(...term.synonyms.slice(0, 3));

    // Add related terms
    suggestions.push(...term.relatedTerms.slice(0, 2));

    return suggestions;
  }

  /**
   * Calculate overall scores
   */
  private async calculateOverallScores(validation: TerminologyValidation): Promise<any> {
    const terms = validation.validation.terms;
    const totalTerms = terms.length;
    
    if (totalTerms === 0) {
      return {
        score: 1,
        accuracy: 1,
        completeness: 1,
        compliance: 1,
        warnings: [],
        errors: []
      };
    }

    const validatedTerms = terms.filter(t => t.validated).length;
    const accuracy = validatedTerms / totalTerms;
    const completeness = totalTerms > 0 ? 1 : 0;
    const compliance = validation.compliance.hipaaCompliant ? 1 : 0;
    const score = (accuracy + completeness + compliance) / 3;

    return {
      score,
      accuracy,
      completeness,
      compliance,
      warnings: [],
      errors: []
    };
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(validation: TerminologyValidation): Promise<any[]> {
    const recommendations: any[] = [];

    // Generate term recommendations
    for (const term of validation.validation.terms) {
      if (!term.validated && term.suggestions.length > 0) {
        recommendations.push({
          type: 'correction',
          term: term.term,
          current: term.term,
          suggested: term.suggestions[0],
          reason: 'Term not found in medical dictionary',
          priority: 'medium',
          impact: 'medium'
        });
      }
    }

    // Generate compliance recommendations
    if (!validation.compliance.hipaaCompliant) {
      recommendations.push({
        type: 'compliance',
        term: 'overall',
        current: 'non-compliant',
        suggested: 'hipaa-compliant',
        reason: 'Content contains non-HIPAA compliant terms',
        priority: 'critical',
        impact: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Check compliance
   */
  private async checkCompliance(validation: TerminologyValidation, context: AssistantContext): Promise<any> {
    const compliance = {
      hipaaCompliant: true,
      fdaCompliant: true,
      cmsCompliant: true,
      jcahoCompliant: true,
      issues: [] as any[]
    };

    // Check HIPAA compliance
    if (context.medicalContext?.complianceLevel === 'hipaa') {
      for (const term of validation.validation.terms) {
        const medicalTerm = this.terms.get(term.term.toLowerCase());
        if (medicalTerm && !medicalTerm.compliance.hipaa) {
          compliance.hipaaCompliant = false;
          compliance.issues.push({
            type: 'privacy',
            severity: 'high',
            description: `Term "${term.term}" is not HIPAA compliant`,
            suggestion: 'Use HIPAA-compliant alternative'
          });
        }
      }
    }

    // Check FDA compliance
    if (context.medicalContext?.complianceLevel === 'fda') {
      for (const term of validation.validation.terms) {
        const medicalTerm = this.terms.get(term.term.toLowerCase());
        if (medicalTerm && !medicalTerm.compliance.fda) {
          compliance.fdaCompliant = false;
          compliance.issues.push({
            type: 'data',
            severity: 'medium',
            description: `Term "${term.term}" is not FDA compliant`,
            suggestion: 'Use FDA-compliant alternative'
          });
        }
      }
    }

    return compliance;
  }

  /**
   * Initialize medical terms
   */
  private initializeMedicalTerms(): void {
    const medicalTerms: MedicalTerm[] = [
      {
        id: 'term_heart',
        term: 'heart',
        definition: 'A muscular organ that pumps blood through the circulatory system',
        category: 'anatomy',
        specialty: ['cardiology', 'general'],
        synonyms: ['cardiac', 'myocardial'],
        abbreviations: ['HR', 'HRT'],
        relatedTerms: ['cardiac', 'circulation', 'blood'],
        pronunciation: 'härt',
        etymology: 'Old English heorte',
        usage: {
          context: ['cardiology', 'general medicine'],
          examples: ['heart rate', 'heart disease', 'heart attack'],
          notes: 'Common anatomical term'
        },
        compliance: {
          hipaa: true,
          fda: true,
          cms: true,
          jcaho: true,
          icd10: true,
          snomed: true
        },
        validation: {
          verified: true,
          verifiedBy: 'system',
          verifiedAt: new Date(),
          confidence: 1.0,
          source: 'medical_dictionary'
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          healthcareRelevant: true,
          complianceRequired: true
        }
      },
      {
        id: 'term_hypertension',
        term: 'hypertension',
        definition: 'High blood pressure, a condition where the force of blood against artery walls is too high',
        category: 'pathology',
        specialty: ['cardiology', 'internal medicine'],
        synonyms: ['high blood pressure', 'HTN'],
        abbreviations: ['HTN', 'BP'],
        relatedTerms: ['blood pressure', 'cardiovascular', 'artery'],
        pronunciation: 'hī-pər-ten-shən',
        etymology: 'Greek hyper- + tension',
        usage: {
          context: ['cardiology', 'internal medicine', 'nursing'],
          examples: ['hypertension management', 'hypertensive crisis'],
          notes: 'Medical condition requiring monitoring'
        },
        compliance: {
          hipaa: true,
          fda: true,
          cms: true,
          jcaho: true,
          icd10: true,
          snomed: true
        },
        validation: {
          verified: true,
          verifiedBy: 'system',
          verifiedAt: new Date(),
          confidence: 1.0,
          source: 'medical_dictionary'
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          healthcareRelevant: true,
          complianceRequired: true
        }
      }
    ];

    medicalTerms.forEach(term => {
      this.terms.set(term.term.toLowerCase(), term);
    });
  }

  /**
   * Process validations
   */
  private async processValidations(): Promise<void> {
    // Implementation for processing validations
  }
}
