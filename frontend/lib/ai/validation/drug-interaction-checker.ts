/**
 * Drug Interaction Checker
 * HMHCP Healthcare AI Platform
 * 
 * Comprehensive drug interaction detection and management system
 * with dosage verification, contraindication checking, and clinical guidance.
 */

import { ValidationResult, ValidationError, ValidationWarning, ValidationSuggestion, DrugInteraction } from './medical-validator';

export interface Drug {
  name: string;
  genericName: string;
  brandNames: string[];
  activeIngredients: string[];
  drugClass: string[];
  mechanism: string;
  metabolism: string[];
  excretion: string[];
  halfLife: string;
  proteinBinding: number;
  bioavailability: number;
  therapeuticClass: string;
  controlledSubstance: boolean;
  scheduleClass?: string;
  pregnancyCategory: string;
  lactationRisk: string;
  blackBoxWarning: boolean;
  fdaApproved: boolean;
  approvalDate?: Date;
}

export interface DrugInteractionDetailed {
  drug1: Drug;
  drug2: Drug;
  interactionType: 'pharmacokinetic' | 'pharmacodynamic' | 'synergistic' | 'antagonistic';
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  mechanism: string;
  clinicalEffect: string;
  onsetTime: string;
  duration: string;
  management: string;
  monitoring: string[];
  alternatives: string[];
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  studyReferences: string[];
  frequency: 'rare' | 'uncommon' | 'common' | 'very common';
  riskFactors: string[];
  lastUpdated: Date;
}

export interface PatientProfile {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'other';
  renalFunction: {
    creatinine: number;
    gfr: number;
    status: 'normal' | 'mild' | 'moderate' | 'severe' | 'esrd';
  };
  hepaticFunction: {
    alt: number;
    ast: number;
    bilirubin: number;
    status: 'normal' | 'mild' | 'moderate' | 'severe';
  };
  allergies: string[];
  medicalConditions: string[];
  currentMedications: MedicationRegimen[];
  pregnancy: boolean;
  breastfeeding: boolean;
  smokingStatus: 'never' | 'former' | 'current';
  alcoholUse: 'none' | 'light' | 'moderate' | 'heavy';
}

export interface MedicationRegimen {
  drug: string;
  dosage: number;
  unit: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate?: Date;
  indication: string;
  prescriber: string;
  adherence: number; // 0-1 scale
}

export interface DosageRecommendation {
  drug: string;
  indication: string;
  standardDose: {
    min: number;
    max: number;
    usual: number;
    unit: string;
    frequency: string;
  };
  adjustments: {
    renal: DosageAdjustment[];
    hepatic: DosageAdjustment[];
    elderly: DosageAdjustment;
    pediatric: DosageAdjustment[];
    pregnancy: DosageAdjustment;
  };
  contraindications: string[];
  warnings: string[];
  monitoring: string[];
}

export interface DosageAdjustment {
  condition: string;
  factor: number;
  maxDose?: number;
  frequency?: string;
  monitoring: string[];
  rationale: string;
}

export interface InteractionCheckOptions {
  includeMinorInteractions: boolean;
  checkFoodInteractions: boolean;
  checkSupplementInteractions: boolean;
  patientSpecificFactors: boolean;
  includeAlternatives: boolean;
  prioritizeSeverity: boolean;
}

/**
 * Drug Interaction Checker Class
 * Provides comprehensive drug interaction analysis
 */
export class DrugInteractionChecker {
  private drugDatabase: Map<string, Drug>;
  private interactionMatrix: Map<string, DrugInteractionDetailed[]>;
  private dosageRecommendations: Map<string, DosageRecommendation[]>;
  private contraindications: Map<string, string[]>;
  private foodInteractions: Map<string, FoodInteraction[]>;
  private supplementInteractions: Map<string, SupplementInteraction[]>;

  constructor() {
    this.drugDatabase = new Map();
    this.interactionMatrix = new Map();
    this.dosageRecommendations = new Map();
    this.contraindications = new Map();
    this.foodInteractions = new Map();
    this.supplementInteractions = new Map();
    
    this.initializeDrugDatabase();
  }

  /**
   * Check drug interactions for a list of medications
   */
  async checkInteractions(
    medications: string[],
    patientProfile?: PatientProfile,
    options: Partial<InteractionCheckOptions> = {}
  ): Promise<ValidationResult> {
    const defaultOptions: InteractionCheckOptions = {
      includeMinorInteractions: true,
      checkFoodInteractions: true,
      checkSupplementInteractions: true,
      patientSpecificFactors: true,
      includeAlternatives: true,
      prioritizeSeverity: true
    };

    const checkOptions = { ...defaultOptions, ...options };
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];
    const interactions: DrugInteractionDetailed[] = [];

    try {
      // Normalize drug names and validate
      const normalizedMedications = medications.map(med => this.normalizeDrugName(med));
      const unknownDrugs = normalizedMedications.filter(med => !this.drugDatabase.has(med));
      
      if (unknownDrugs.length > 0) {
        unknownDrugs.forEach(drug => {
          warnings.push({
            code: 'UNKNOWN_DRUG',
            message: `Drug "${drug}" not found in interaction database`,
            field: 'medications',
            recommendation: 'Verify drug name and check manually for interactions'
          });
        });
      }

      // Check pairwise interactions
      for (let i = 0; i < normalizedMedications.length; i++) {
        for (let j = i + 1; j < normalizedMedications.length; j++) {
          const drug1 = normalizedMedications[i];
          const drug2 = normalizedMedications[j];
          
          const interaction = this.findDrugInteraction(drug1, drug2);
          if (interaction) {
            interactions.push(interaction);
            
            // Categorize interaction by severity
            const validationError = this.createInteractionValidationError(interaction, patientProfile);
            
            if (interaction.severity === 'contraindicated') {
              errors.push(validationError);
            } else if (interaction.severity === 'major') {
              errors.push(validationError);
            } else if (interaction.severity === 'moderate') {
              warnings.push({
                code: 'MODERATE_INTERACTION',
                message: validationError.message,
                field: 'medications',
                recommendation: interaction.management,
                sourceReference: interaction.studyReferences.join(', ')
              });
            } else if (checkOptions.includeMinorInteractions && interaction.severity === 'minor') {
              warnings.push({
                code: 'MINOR_INTERACTION',
                message: validationError.message,
                field: 'medications',
                recommendation: interaction.management
              });
            }

            // Add alternatives if available
            if (checkOptions.includeAlternatives && interaction.alternatives.length > 0) {
              suggestions.push({
                type: 'drug',
                original: `${drug1} + ${drug2}`,
                suggested: interaction.alternatives[0],
                reason: `Alternative to avoid ${interaction.severity} interaction`,
                confidence: 0.8
              });
            }
          }
        }
      }

      // Check patient-specific factors
      if (patientProfile && checkOptions.patientSpecificFactors) {
        const patientSpecificResults = await this.checkPatientSpecificFactors(
          normalizedMedications, 
          patientProfile
        );
        errors.push(...patientSpecificResults.errors);
        warnings.push(...patientSpecificResults.warnings);
        suggestions.push(...patientSpecificResults.suggestions);
      }

      // Check food interactions
      if (checkOptions.checkFoodInteractions) {
        const foodInteractionResults = this.checkFoodInteractions(normalizedMedications);
        warnings.push(...foodInteractionResults.warnings);
        suggestions.push(...foodInteractionResults.suggestions);
      }

      // Check supplement interactions
      if (checkOptions.checkSupplementInteractions && patientProfile?.currentMedications) {
        const supplementResults = this.checkSupplementInteractions(
          normalizedMedications,
          patientProfile.currentMedications
        );
        warnings.push(...supplementResults.warnings);
        suggestions.push(...supplementResults.suggestions);
      }

      // Sort by severity if requested
      if (checkOptions.prioritizeSeverity) {
        errors.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
      }

      const confidence = this.calculateInteractionConfidence(interactions, normalizedMedications.length);

      return {
        isValid: errors.filter(e => e.severity === 'critical').length === 0,
        severity: this.getHighestSeverity(errors),
        confidence,
        errors,
        warnings,
        suggestions,
        auditTrail: [{
          timestamp: new Date(),
          validationType: 'drug_interaction',
          result: errors.length > 0 ? 'fail' : (warnings.length > 0 ? 'warning' : 'pass'),
          details: `Checked ${normalizedMedications.length} medications, found ${interactions.length} interactions`
        }]
      };

    } catch (error) {
      return {
        isValid: false,
        severity: 'critical',
        confidence: 0,
        errors: [{
          code: 'INTERACTION_CHECK_ERROR',
          message: 'Failed to check drug interactions',
          field: 'medications',
          severity: 'critical',
          confidence: 1
        }],
        warnings: [],
        suggestions: [],
        auditTrail: [{
          timestamp: new Date(),
          validationType: 'drug_interaction',
          result: 'fail',
          details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  /**
   * Get detailed interaction information
   */
  async getInteractionDetails(drug1: string, drug2: string): Promise<DrugInteractionDetailed | null> {
    const normalizedDrug1 = this.normalizeDrugName(drug1);
    const normalizedDrug2 = this.normalizeDrugName(drug2);
    
    return this.findDrugInteraction(normalizedDrug1, normalizedDrug2);
  }

  /**
   * Check dosage appropriateness
   */
  async checkDosage(
    drug: string,
    dosage: number,
    unit: string,
    frequency: string,
    indication: string,
    patientProfile?: PatientProfile
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    const normalizedDrug = this.normalizeDrugName(drug);
    const drugInfo = this.drugDatabase.get(normalizedDrug);
    
    if (!drugInfo) {
      return {
        isValid: false,
        severity: 'major',
        confidence: 0.5,
        errors: [{
          code: 'UNKNOWN_DRUG_DOSAGE',
          message: `Cannot verify dosage for unknown drug: ${drug}`,
          field: 'drug',
          severity: 'major',
          confidence: 0.9
        }],
        warnings: [],
        suggestions: [],
        auditTrail: [{
          timestamp: new Date(),
          validationType: 'dosage_check',
          result: 'fail',
          details: `Unknown drug: ${drug}`
        }]
      };
    }

    const dosageRecommendations = this.dosageRecommendations.get(normalizedDrug);
    if (!dosageRecommendations) {
      warnings.push({
        code: 'NO_DOSAGE_GUIDELINES',
        message: `No dosage guidelines available for ${drug}`,
        field: 'dosage',
        recommendation: 'Consult prescribing information'
      });
    } else {
      const relevantRecommendation = dosageRecommendations.find(
        rec => rec.indication.toLowerCase() === indication.toLowerCase()
      );

      if (relevantRecommendation) {
        // Check if dosage is within recommended range
        if (dosage < relevantRecommendation.standardDose.min || 
            dosage > relevantRecommendation.standardDose.max) {
          errors.push({
            code: 'DOSAGE_OUT_OF_RANGE',
            message: `Dosage ${dosage}${unit} is outside recommended range (${relevantRecommendation.standardDose.min}-${relevantRecommendation.standardDose.max}${relevantRecommendation.standardDose.unit})`,
            field: 'dosage',
            severity: 'major',
            correction: `Recommended: ${relevantRecommendation.standardDose.usual}${relevantRecommendation.standardDose.unit} ${relevantRecommendation.standardDose.frequency}`,
            confidence: 0.9
          });
        }

        // Check patient-specific adjustments
        if (patientProfile) {
          const adjustmentResults = this.checkDosageAdjustments(
            relevantRecommendation,
            dosage,
            unit,
            patientProfile
          );
          warnings.push(...adjustmentResults.warnings);
          suggestions.push(...adjustmentResults.suggestions);
        }
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      severity: this.getHighestSeverity(errors),
      confidence: 0.85,
      errors,
      warnings,
      suggestions,
      auditTrail: [{
        timestamp: new Date(),
        validationType: 'dosage_check',
        result: errors.length > 0 ? 'fail' : (warnings.length > 0 ? 'warning' : 'pass'),
        details: `Checked dosage for ${drug}: ${dosage}${unit} ${frequency}`
      }]
    };
  }

  /**
   * Get alternative medications
   */
  async getAlternatives(
    drug: string,
    indication: string,
    avoidInteractionsWith: string[] = []
  ): Promise<{
    alternatives: Array<{
      drug: string;
      similarity: number;
      advantages: string[];
      disadvantages: string[];
      interactionRisk: 'low' | 'moderate' | 'high';
    }>;
    reasoning: string;
  }> {
    const normalizedDrug = this.normalizeDrugName(drug);
    const drugInfo = this.drugDatabase.get(normalizedDrug);
    
    if (!drugInfo) {
      return {
        alternatives: [],
        reasoning: 'Cannot suggest alternatives for unknown drug'
      };
    }

    const alternatives: Array<{
      drug: string;
      similarity: number;
      advantages: string[];
      disadvantages: string[];
      interactionRisk: 'low' | 'moderate' | 'high';
    }> = [];

    // Find drugs in the same therapeutic class
    this.drugDatabase.forEach((otherDrug, drugName) => {
      if (drugName !== normalizedDrug && 
          otherDrug.therapeuticClass === drugInfo.therapeuticClass) {
        
        // Check interaction risk with other medications
        let maxInteractionSeverity = 'none';
        for (const avoidDrug of avoidInteractionsWith) {
          const interaction = this.findDrugInteraction(drugName, this.normalizeDrugName(avoidDrug));
          if (interaction) {
            if (interaction.severity === 'contraindicated' || interaction.severity === 'major') {
              maxInteractionSeverity = 'high';
              break;
            } else if (interaction.severity === 'moderate') {
              maxInteractionSeverity = 'moderate';
            }
          }
        }

        const interactionRisk = maxInteractionSeverity === 'high' ? 'high' : 
                              maxInteractionSeverity === 'moderate' ? 'moderate' : 'low';

        if (interactionRisk !== 'high') { // Only include alternatives with low-moderate risk
          alternatives.push({
            drug: otherDrug.name,
            similarity: this.calculateDrugSimilarity(drugInfo, otherDrug),
            advantages: this.getDrugAdvantages(otherDrug, drugInfo),
            disadvantages: this.getDrugDisadvantages(otherDrug, drugInfo),
            interactionRisk
          });
        }
      }
    });

    // Sort by similarity and interaction risk
    alternatives.sort((a, b) => {
      const riskWeight = { low: 3, moderate: 2, high: 1 };
      const scoreA = a.similarity + (riskWeight[a.interactionRisk] * 0.2);
      const scoreB = b.similarity + (riskWeight[b.interactionRisk] * 0.2);
      return scoreB - scoreA;
    });

    return {
      alternatives: alternatives.slice(0, 5), // Return top 5
      reasoning: `Alternatives selected based on therapeutic class similarity and interaction profile`
    };
  }

  // Private helper methods

  private initializeDrugDatabase(): void {
    this.initializeDrugs();
    this.initializeInteractions();
    this.initializeDosageRecommendations();
    this.initializeFoodInteractions();
    this.initializeSupplementInteractions();
  }

  private initializeDrugs(): void {
    const drugs: Drug[] = [
      {
        name: 'warfarin',
        genericName: 'warfarin',
        brandNames: ['Coumadin', 'Jantoven'],
        activeIngredients: ['warfarin sodium'],
        drugClass: ['anticoagulant', 'vitamin K antagonist'],
        mechanism: 'Inhibits vitamin K-dependent clotting factors',
        metabolism: ['CYP2C9', 'CYP1A2', 'CYP3A4'],
        excretion: ['renal', 'hepatic'],
        halfLife: '36-42 hours',
        proteinBinding: 99,
        bioavailability: 100,
        therapeuticClass: 'anticoagulant',
        controlledSubstance: false,
        pregnancyCategory: 'X',
        lactationRisk: 'L2',
        blackBoxWarning: true,
        fdaApproved: true,
        approvalDate: new Date('1954-01-01')
      },
      {
        name: 'aspirin',
        genericName: 'aspirin',
        brandNames: ['Bayer', 'Bufferin', 'Ecotrin'],
        activeIngredients: ['acetylsalicylic acid'],
        drugClass: ['NSAID', 'antiplatelet'],
        mechanism: 'COX-1 and COX-2 inhibition',
        metabolism: ['hepatic esterases'],
        excretion: ['renal'],
        halfLife: '2-3 hours',
        proteinBinding: 80,
        bioavailability: 80,
        therapeuticClass: 'antiplatelet',
        controlledSubstance: false,
        pregnancyCategory: 'D',
        lactationRisk: 'L3',
        blackBoxWarning: false,
        fdaApproved: true,
        approvalDate: new Date('1950-01-01')
      },
      {
        name: 'metformin',
        genericName: 'metformin',
        brandNames: ['Glucophage', 'Fortamet', 'Riomet'],
        activeIngredients: ['metformin hydrochloride'],
        drugClass: ['biguanide', 'antidiabetic'],
        mechanism: 'Decreases hepatic glucose production',
        metabolism: ['minimal hepatic metabolism'],
        excretion: ['renal'],
        halfLife: '4-9 hours',
        proteinBinding: 0,
        bioavailability: 55,
        therapeuticClass: 'antidiabetic',
        controlledSubstance: false,
        pregnancyCategory: 'B',
        lactationRisk: 'L1',
        blackBoxWarning: true,
        fdaApproved: true,
        approvalDate: new Date('1995-01-01')
      }
    ];

    drugs.forEach(drug => {
      this.drugDatabase.set(drug.name, drug);
      drug.brandNames.forEach(brand => {
        this.drugDatabase.set(brand.toLowerCase(), drug);
      });
    });
  }

  private initializeInteractions(): void {
    const interactions: DrugInteractionDetailed[] = [
      {
        drug1: this.drugDatabase.get('warfarin')!,
        drug2: this.drugDatabase.get('aspirin')!,
        interactionType: 'pharmacodynamic',
        severity: 'major',
        mechanism: 'Additive anticoagulant and antiplatelet effects',
        clinicalEffect: 'Increased bleeding risk, particularly GI bleeding',
        onsetTime: 'hours to days',
        duration: 'duration of therapy',
        management: 'Monitor INR closely, consider proton pump inhibitor, use lowest effective aspirin dose',
        monitoring: ['INR', 'CBC', 'signs of bleeding', 'stool guaiac'],
        alternatives: ['clopidogrel with PPI', 'prasugrel', 'ticagrelor'],
        evidenceLevel: 'A',
        studyReferences: ['J Am Coll Cardiol. 2008;52:266-268', 'Circulation. 2007;115:1285-1295'],
        frequency: 'common',
        riskFactors: ['age >65', 'history of GI bleeding', 'concurrent PPI use'],
        lastUpdated: new Date('2024-01-01')
      }
    ];

    interactions.forEach(interaction => {
      const key1 = `${interaction.drug1.name}-${interaction.drug2.name}`;
      const key2 = `${interaction.drug2.name}-${interaction.drug1.name}`;
      
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

  private initializeDosageRecommendations(): void {
    const recommendations: DosageRecommendation[] = [
      {
        drug: 'warfarin',
        indication: 'atrial fibrillation',
        standardDose: {
          min: 2,
          max: 10,
          usual: 5,
          unit: 'mg',
          frequency: 'daily'
        },
        adjustments: {
          renal: [
            {
              condition: 'GFR <30',
              factor: 0.75,
              monitoring: ['INR', 'bleeding signs'],
              rationale: 'Reduced clearance of vitamin K-dependent factors'
            }
          ],
          hepatic: [
            {
              condition: 'Child-Pugh B or C',
              factor: 0.5,
              monitoring: ['INR', 'liver function'],
              rationale: 'Reduced synthesis of clotting factors'
            }
          ],
          elderly: {
            condition: 'age >75',
            factor: 0.75,
            monitoring: ['INR', 'fall risk'],
            rationale: 'Increased bleeding risk'
          },
          pediatric: [],
          pregnancy: {
            condition: 'pregnancy',
            factor: 0,
            monitoring: [],
            rationale: 'Contraindicated - teratogenic'
          }
        },
        contraindications: [
          'pregnancy',
          'active bleeding',
          'severe hepatic impairment',
          'recent surgery with bleeding risk'
        ],
        warnings: [
          'Requires regular INR monitoring',
          'Numerous drug and food interactions',
          'Variable individual response'
        ],
        monitoring: ['INR', 'CBC', 'liver function', 'bleeding assessment']
      }
    ];

    recommendations.forEach(rec => {
      const existing = this.dosageRecommendations.get(rec.drug) || [];
      existing.push(rec);
      this.dosageRecommendations.set(rec.drug, existing);
    });
  }

  private initializeFoodInteractions(): void {
    const foodInteractions: FoodInteraction[] = [
      {
        drug: 'warfarin',
        food: 'vitamin K rich foods',
        interactionType: 'antagonistic',
        effect: 'Decreased anticoagulant effect',
        mechanism: 'Vitamin K counteracts warfarin mechanism',
        management: 'Maintain consistent vitamin K intake',
        foods: ['green leafy vegetables', 'broccoli', 'brussels sprouts', 'cabbage'],
        severity: 'moderate'
      }
    ];

    foodInteractions.forEach(interaction => {
      const existing = this.foodInteractions.get(interaction.drug) || [];
      existing.push(interaction);
      this.foodInteractions.set(interaction.drug, existing);
    });
  }

  private initializeSupplementInteractions(): void {
    const supplementInteractions: SupplementInteraction[] = [
      {
        drug: 'warfarin',
        supplement: 'ginkgo biloba',
        effect: 'Increased bleeding risk',
        mechanism: 'Additive antiplatelet effects',
        severity: 'moderate',
        management: 'Monitor for bleeding, avoid concurrent use'
      }
    ];

    supplementInteractions.forEach(interaction => {
      const existing = this.supplementInteractions.get(interaction.drug) || [];
      existing.push(interaction);
      this.supplementInteractions.set(interaction.drug, existing);
    });
  }

  private normalizeDrugName(drugName: string): string {
    return drugName.toLowerCase().trim().replace(/[^\w\s]/g, '');
  }

  private findDrugInteraction(drug1: string, drug2: string): DrugInteractionDetailed | null {
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

  private createInteractionValidationError(
    interaction: DrugInteractionDetailed, 
    patientProfile?: PatientProfile
  ): ValidationError {
    let severity: 'critical' | 'major' | 'minor';
    
    switch (interaction.severity) {
      case 'contraindicated':
        severity = 'critical';
        break;
      case 'major':
        severity = 'major';
        break;
      default:
        severity = 'minor';
    }

    // Adjust severity based on patient factors
    if (patientProfile && interaction.riskFactors.length > 0) {
      const hasRiskFactors = this.checkRiskFactors(patientProfile, interaction.riskFactors);
      if (hasRiskFactors && severity === 'minor') {
        severity = 'major';
      }
    }

    return {
      code: 'DRUG_INTERACTION',
      message: `${interaction.severity.toUpperCase()} interaction: ${interaction.drug1.name} + ${interaction.drug2.name} - ${interaction.clinicalEffect}`,
      field: 'medications',
      severity,
      correction: interaction.management,
      sourceReference: interaction.studyReferences.join(', '),
      confidence: this.getInteractionConfidence(interaction)
    };
  }

  private checkRiskFactors(patientProfile: PatientProfile, riskFactors: string[]): boolean {
    for (const factor of riskFactors) {
      if (factor.includes('age') && factor.includes('>65') && patientProfile.age > 65) {
        return true;
      }
      if (factor.includes('GI bleeding') && 
          patientProfile.medicalConditions.some(condition => 
            condition.toLowerCase().includes('gi') || condition.toLowerCase().includes('gastrointestinal')
          )) {
        return true;
      }
      // Add more risk factor checks as needed
    }
    return false;
  }

  private getInteractionConfidence(interaction: DrugInteractionDetailed): number {
    const evidenceLevelScores = { 'A': 0.95, 'B': 0.85, 'C': 0.7, 'D': 0.5 };
    const frequencyScores = { 'very common': 0.95, 'common': 0.85, 'uncommon': 0.7, 'rare': 0.5 };
    
    const evidenceScore = evidenceLevelScores[interaction.evidenceLevel] || 0.5;
    const frequencyScore = frequencyScores[interaction.frequency] || 0.5;
    
    return (evidenceScore + frequencyScore) / 2;
  }

  private async checkPatientSpecificFactors(
    medications: string[],
    patientProfile: PatientProfile
  ): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    for (const medication of medications) {
      const drugInfo = this.drugDatabase.get(medication);
      if (!drugInfo) continue;

      // Check allergies
      if (patientProfile.allergies.some(allergy => 
          allergy.toLowerCase().includes(drugInfo.name) ||
          drugInfo.brandNames.some(brand => allergy.toLowerCase().includes(brand.toLowerCase()))
      )) {
        errors.push({
          code: 'DRUG_ALLERGY',
          message: `Patient has documented allergy to ${drugInfo.name}`,
          field: 'medications',
          severity: 'critical',
          confidence: 0.95
        });
      }

      // Check pregnancy
      if (patientProfile.pregnancy && drugInfo.pregnancyCategory === 'X') {
        errors.push({
          code: 'PREGNANCY_CONTRAINDICATION',
          message: `${drugInfo.name} is contraindicated in pregnancy (Category X)`,
          field: 'medications',
          severity: 'critical',
          confidence: 0.98
        });
      }

      // Check renal function
      if (patientProfile.renalFunction.status !== 'normal' && 
          drugInfo.excretion.includes('renal')) {
        warnings.push({
          code: 'RENAL_ADJUSTMENT_NEEDED',
          message: `${drugInfo.name} may require dosage adjustment for renal impairment`,
          field: 'medications',
          recommendation: 'Consider dose adjustment based on creatinine clearance'
        });
      }

      // Check hepatic function
      if (patientProfile.hepaticFunction.status !== 'normal' && 
          drugInfo.metabolism.some(enzyme => enzyme.startsWith('CYP'))) {
        warnings.push({
          code: 'HEPATIC_ADJUSTMENT_NEEDED',
          message: `${drugInfo.name} may require dosage adjustment for hepatic impairment`,
          field: 'medications',
          recommendation: 'Consider dose adjustment based on hepatic function'
        });
      }
    }

    return { errors, warnings, suggestions };
  }

  private checkFoodInteractions(medications: string[]): {
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  } {
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    medications.forEach(medication => {
      const foodInteractions = this.foodInteractions.get(medication);
      if (foodInteractions && foodInteractions.length > 0) {
        foodInteractions.forEach(interaction => {
          warnings.push({
            code: 'FOOD_INTERACTION',
            message: `${medication} interacts with ${interaction.food}: ${interaction.effect}`,
            field: 'medications',
            recommendation: interaction.management
          });

          if (interaction.foods && interaction.foods.length > 0) {
            suggestions.push({
              type: 'dietary',
              original: `${medication} with ${interaction.food}`,
              suggested: interaction.management,
              reason: interaction.mechanism,
              confidence: 0.8
            });
          }
        });
      }
    });

    return { warnings, suggestions };
  }

  private checkSupplementInteractions(
    medications: string[],
    currentMedications: MedicationRegimen[]
  ): {
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  } {
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Extract supplements from current medications
    const supplements = currentMedications
      .filter(med => this.isLikelySupplement(med.drug))
      .map(med => med.drug);

    medications.forEach(medication => {
      supplements.forEach(supplement => {
        const supplementInteractions = this.supplementInteractions.get(medication);
        if (supplementInteractions) {
          const relevantInteraction = supplementInteractions.find(
            interaction => supplement.toLowerCase().includes(interaction.supplement.toLowerCase())
          );
          
          if (relevantInteraction) {
            warnings.push({
              code: 'SUPPLEMENT_INTERACTION',
              message: `${medication} may interact with ${supplement}: ${relevantInteraction.effect}`,
              field: 'medications',
              recommendation: relevantInteraction.management
            });
          }
        }
      });
    });

    return { warnings, suggestions };
  }

  private isLikelySupplement(drugName: string): boolean {
    const supplementKeywords = [
      'vitamin', 'calcium', 'iron', 'magnesium', 'zinc', 'omega',
      'fish oil', 'ginkgo', 'ginseng', 'garlic', 'turmeric',
      'coq10', 'glucosamine', 'chondroitin', 'probiotics'
    ];
    
    return supplementKeywords.some(keyword => 
      drugName.toLowerCase().includes(keyword)
    );
  }

  private checkDosageAdjustments(
    recommendation: DosageRecommendation,
    currentDosage: number,
    unit: string,
    patientProfile: PatientProfile
  ): {
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  } {
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Check renal adjustments
    if (patientProfile.renalFunction.status !== 'normal' && recommendation.adjustments.renal.length > 0) {
      const renalAdjustment = recommendation.adjustments.renal.find(
        adj => this.matchesRenalCondition(adj.condition, patientProfile.renalFunction)
      );
      
      if (renalAdjustment) {
        const adjustedDose = currentDosage * renalAdjustment.factor;
        suggestions.push({
          type: 'dosage',
          original: `${currentDosage}${unit}`,
          suggested: `${adjustedDose}${unit}`,
          reason: `Renal function adjustment: ${renalAdjustment.rationale}`,
          confidence: 0.85
        });
      }
    }

    // Check hepatic adjustments
    if (patientProfile.hepaticFunction.status !== 'normal' && recommendation.adjustments.hepatic.length > 0) {
      const hepaticAdjustment = recommendation.adjustments.hepatic.find(
        adj => this.matchesHepaticCondition(adj.condition, patientProfile.hepaticFunction)
      );
      
      if (hepaticAdjustment) {
        const adjustedDose = currentDosage * hepaticAdjustment.factor;
        suggestions.push({
          type: 'dosage',
          original: `${currentDosage}${unit}`,
          suggested: `${adjustedDose}${unit}`,
          reason: `Hepatic function adjustment: ${hepaticAdjustment.rationale}`,
          confidence: 0.85
        });
      }
    }

    // Check elderly adjustments
    if (patientProfile.age >= 65 && recommendation.adjustments.elderly) {
      const elderlyAdjustment = recommendation.adjustments.elderly;
      const adjustedDose = currentDosage * elderlyAdjustment.factor;
      
      suggestions.push({
        type: 'dosage',
        original: `${currentDosage}${unit}`,
        suggested: `${adjustedDose}${unit}`,
        reason: `Elderly adjustment: ${elderlyAdjustment.rationale}`,
        confidence: 0.8
      });
    }

    return { warnings, suggestions };
  }

  private matchesRenalCondition(condition: string, renalFunction: PatientProfile['renalFunction']): boolean {
    if (condition.includes('GFR <30') && renalFunction.gfr < 30) return true;
    if (condition.includes('GFR <60') && renalFunction.gfr < 60) return true;
    if (condition.includes('severe') && renalFunction.status === 'severe') return true;
    return false;
  }

  private matchesHepaticCondition(condition: string, hepaticFunction: PatientProfile['hepaticFunction']): boolean {
    if (condition.includes('Child-Pugh') && 
        (hepaticFunction.status === 'moderate' || hepaticFunction.status === 'severe')) return true;
    return false;
  }

  private calculateDrugSimilarity(drug1: Drug, drug2: Drug): number {
    let similarity = 0;
    
    // Same therapeutic class
    if (drug1.therapeuticClass === drug2.therapeuticClass) similarity += 0.4;
    
    // Shared drug classes
    const sharedClasses = drug1.drugClass.filter(cls => drug2.drugClass.includes(cls));
    similarity += (sharedClasses.length / Math.max(drug1.drugClass.length, drug2.drugClass.length)) * 0.3;
    
    // Similar metabolism
    const sharedMetabolism = drug1.metabolism.filter(met => drug2.metabolism.includes(met));
    similarity += (sharedMetabolism.length / Math.max(drug1.metabolism.length, drug2.metabolism.length)) * 0.2;
    
    // Similar excretion
    const sharedExcretion = drug1.excretion.filter(exc => drug2.excretion.includes(exc));
    similarity += (sharedExcretion.length / Math.max(drug1.excretion.length, drug2.excretion.length)) * 0.1;
    
    return Math.min(1, similarity);
  }

  private getDrugAdvantages(drug: Drug, comparedToDrug: Drug): string[] {
    const advantages: string[] = [];
    
    if (!drug.blackBoxWarning && comparedToDrug.blackBoxWarning) {
      advantages.push('No black box warning');
    }
    
    if (drug.bioavailability > comparedToDrug.bioavailability) {
      advantages.push('Higher bioavailability');
    }
    
    if (drug.proteinBinding < comparedToDrug.proteinBinding) {
      advantages.push('Lower protein binding');
    }
    
    return advantages;
  }

  private getDrugDisadvantages(drug: Drug, comparedToDrug: Drug): string[] {
    const disadvantages: string[] = [];
    
    if (drug.blackBoxWarning && !comparedToDrug.blackBoxWarning) {
      disadvantages.push('Has black box warning');
    }
    
    if (drug.bioavailability < comparedToDrug.bioavailability) {
      disadvantages.push('Lower bioavailability');
    }
    
    return disadvantages;
  }

  private calculateInteractionConfidence(
    interactions: DrugInteractionDetailed[], 
    medicationCount: number
  ): number {
    if (medicationCount === 0) return 1;
    
    const totalPossibleInteractions = (medicationCount * (medicationCount - 1)) / 2;
    const highSeverityInteractions = interactions.filter(
      int => int.severity === 'major' || int.severity === 'contraindicated'
    ).length;
    
    if (highSeverityInteractions > 0) {
      return Math.max(0.3, 1 - (highSeverityInteractions / totalPossibleInteractions));
    }
    
    return Math.max(0.7, 1 - (interactions.length * 0.1));
  }

  private getSeverityWeight(severity: 'critical' | 'major' | 'minor'): number {
    switch (severity) {
      case 'critical': return 3;
      case 'major': return 2;
      case 'minor': return 1;
      default: return 0;
    }
  }

  private getHighestSeverity(errors: ValidationError[]): 'critical' | 'major' | 'minor' | 'info' {
    if (errors.some(e => e.severity === 'critical')) return 'critical';
    if (errors.some(e => e.severity === 'major')) return 'major';
    if (errors.some(e => e.severity === 'minor')) return 'minor';
    return 'info';
  }

  // Public utility methods
  
  /**
   * Get drug information
   */
  getDrugInfo(drugName: string): Drug | null {
    return this.drugDatabase.get(this.normalizeDrugName(drugName)) || null;
  }

  /**
   * Get all available drugs
   */
  getAllDrugs(): Drug[] {
    return Array.from(new Set(this.drugDatabase.values()));
  }

  /**
   * Add custom drug to database
   */
  addDrug(drug: Drug): void {
    this.drugDatabase.set(drug.name, drug);
    drug.brandNames.forEach(brand => {
      this.drugDatabase.set(brand.toLowerCase(), drug);
    });
  }
}

// Supporting interfaces
interface FoodInteraction {
  drug: string;
  food: string;
  interactionType: 'synergistic' | 'antagonistic' | 'absorption';
  effect: string;
  mechanism: string;
  management: string;
  foods: string[];
  severity: 'minor' | 'moderate' | 'major';
}

interface SupplementInteraction {
  drug: string;
  supplement: string;
  effect: string;
  mechanism: string;
  severity: 'minor' | 'moderate' | 'major';
  management: string;
}

// Export singleton instance
export const drugInteractionChecker = new DrugInteractionChecker();