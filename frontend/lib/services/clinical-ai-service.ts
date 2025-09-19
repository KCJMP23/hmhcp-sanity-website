/**
 * Clinical AI Service
 * Healthcare clinical AI and decision support
 */

import { logger } from '@/lib/logging/client-safe-logger'

export interface ClinicalDecision {
  id: string
  patientId: string
  symptoms: string[]
  vitalSigns: VitalSigns
  medicalHistory: string[]
  recommendations: ClinicalRecommendation[]
  confidence: number
  riskLevel: RiskLevel
  createdAt: Date
  updatedAt: Date
}

export interface VitalSigns {
  temperature?: number
  bloodPressure?: {
    systolic: number
    diastolic: number
  }
  heartRate?: number
  respiratoryRate?: number
  oxygenSaturation?: number
  weight?: number
  height?: number
}

export interface ClinicalRecommendation {
  type: RecommendationType
  title: string
  description: string
  priority: Priority
  evidence: EvidenceLevel
  actions: ClinicalAction[]
  warnings?: string[]
}

export enum RecommendationType {
  DIAGNOSIS = 'diagnosis',
  TREATMENT = 'treatment',
  MONITORING = 'monitoring',
  REFERRAL = 'referral',
  LIFESTYLE = 'lifestyle',
  MEDICATION = 'medication'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum EvidenceLevel {
  A = 'A',
  B = 'B',
  C = 'D',
  D = 'D'
}

export enum RiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ClinicalAction {
  id: string
  description: string
  type: ActionType
  parameters?: Record<string, any>
  timeline?: string
  requiredResources?: string[]
}

export enum ActionType {
  MEDICATION = 'medication',
  PROCEDURE = 'procedure',
  TEST = 'test',
  CONSULTATION = 'consultation',
  MONITORING = 'monitoring',
  EDUCATION = 'education'
}

export interface ClinicalContext {
  patientId: string
  age: number
  gender: string
  medicalHistory: string[]
  currentMedications: string[]
  allergies: string[]
  vitalSigns: VitalSigns
  symptoms: string[]
  chiefComplaint: string
  duration: string
  severity: number
}

export class ClinicalAIService {
  private static readonly MIN_CONFIDENCE_THRESHOLD = 0.7
  private static readonly HIGH_CONFIDENCE_THRESHOLD = 0.9

  /**
   * Generate clinical decision support
   */
  static async generateClinicalDecision(
    context: ClinicalContext
  ): Promise<{ success: boolean; data?: ClinicalDecision; error?: string }> {
    try {
      // Validate clinical context
      const validation = this.validateClinicalContext(context)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid clinical context: ${validation.errors.join(', ')}`
        }
      }

      // Generate decision ID
      const id = this.generateDecisionId()

      // Analyze symptoms and generate recommendations
      const recommendations = await this.analyzeSymptoms(context)
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(context, recommendations)
      
      // Determine risk level
      const riskLevel = this.assessRiskLevel(context, recommendations, confidence)

      // Create clinical decision
      const decision: ClinicalDecision = {
        id,
        patientId: context.patientId,
        symptoms: context.symptoms,
        vitalSigns: context.vitalSigns,
        medicalHistory: context.medicalHistory,
        recommendations,
        confidence,
        riskLevel,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      logger.info('Clinical decision generated', {
        decisionId: id,
        patientId: context.patientId,
        confidence,
        riskLevel,
        recommendationCount: recommendations.length
      })

      return {
        success: true,
        data: decision
      }
    } catch (error) {
      logger.error('Failed to generate clinical decision', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context
      })

      return {
        success: false,
        error: 'Failed to generate clinical decision'
      }
    }
  }

  /**
   * Analyze symptoms and generate recommendations
   */
  private static async analyzeSymptoms(context: ClinicalContext): Promise<ClinicalRecommendation[]> {
    const recommendations: ClinicalRecommendation[] = []

    // Analyze chief complaint
    if (context.chiefComplaint.toLowerCase().includes('chest pain')) {
      recommendations.push({
        type: RecommendationType.DIAGNOSIS,
        title: 'Chest Pain Evaluation',
        description: 'Patient presents with chest pain requiring immediate evaluation',
        priority: Priority.HIGH,
        evidence: EvidenceLevel.A,
        actions: [
          {
            id: 'ecg',
            description: 'Perform 12-lead ECG',
            type: ActionType.TEST,
            timeline: 'Immediate',
            requiredResources: ['ECG machine', 'Trained technician']
          },
          {
            id: 'cardiac_markers',
            description: 'Order cardiac enzymes',
            type: ActionType.TEST,
            timeline: 'Within 1 hour',
            requiredResources: ['Laboratory']
          }
        ],
        warnings: ['Rule out acute coronary syndrome']
      })
    }

    // Analyze vital signs
    if (context.vitalSigns.bloodPressure) {
      const { systolic, diastolic } = context.vitalSigns.bloodPressure
      if (systolic > 180 || diastolic > 110) {
        recommendations.push({
          type: RecommendationType.TREATMENT,
          title: 'Hypertensive Crisis Management',
          description: 'Patient has severely elevated blood pressure',
          priority: Priority.CRITICAL,
          evidence: EvidenceLevel.A,
          actions: [
            {
              id: 'antihypertensive',
              description: 'Administer antihypertensive medication',
              type: ActionType.MEDICATION,
              timeline: 'Immediate',
              parameters: {
                medication: 'Labetalol or Nicardipine',
                route: 'IV',
                monitoring: 'Continuous'
              }
            }
          ],
          warnings: ['Monitor for end-organ damage']
        })
      }
    }

    // Analyze temperature
    if (context.vitalSigns.temperature && context.vitalSigns.temperature > 38.5) {
      recommendations.push({
        type: RecommendationType.DIAGNOSIS,
        title: 'Fever Workup',
        description: 'Patient has elevated temperature requiring investigation',
        priority: Priority.MEDIUM,
        evidence: EvidenceLevel.B,
        actions: [
          {
            id: 'blood_culture',
            description: 'Obtain blood cultures',
            type: ActionType.TEST,
            timeline: 'Within 2 hours',
            requiredResources: ['Laboratory']
          },
          {
            id: 'urinalysis',
            description: 'Perform urinalysis',
            type: ActionType.TEST,
            timeline: 'Within 4 hours',
            requiredResources: ['Laboratory']
          }
        ]
      })
    }

    return recommendations
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(
    context: ClinicalContext,
    recommendations: ClinicalRecommendation[]
  ): number {
    let confidence = 0.5 // Base confidence

    // Increase confidence based on data completeness
    if (context.vitalSigns.temperature) confidence += 0.1
    if (context.vitalSigns.bloodPressure) confidence += 0.1
    if (context.vitalSigns.heartRate) confidence += 0.1
    if (context.medicalHistory.length > 0) confidence += 0.1
    if (context.currentMedications.length > 0) confidence += 0.1

    // Increase confidence based on recommendation quality
    const highPriorityCount = recommendations.filter(r => r.priority === Priority.HIGH || r.priority === Priority.CRITICAL).length
    confidence += highPriorityCount * 0.05

    // Increase confidence based on evidence level
    const highEvidenceCount = recommendations.filter(r => r.evidence === EvidenceLevel.A).length
    confidence += highEvidenceCount * 0.05

    return Math.min(confidence, 1.0)
  }

  /**
   * Assess risk level
   */
  private static assessRiskLevel(
    context: ClinicalContext,
    recommendations: ClinicalRecommendation[],
    confidence: number
  ): RiskLevel {
    // Check for critical conditions
    const criticalRecommendations = recommendations.filter(r => r.priority === Priority.CRITICAL)
    if (criticalRecommendations.length > 0) {
      return RiskLevel.CRITICAL
    }

    // Check for high priority conditions
    const highPriorityRecommendations = recommendations.filter(r => r.priority === Priority.HIGH)
    if (highPriorityRecommendations.length > 0) {
      return RiskLevel.HIGH
    }

    // Check vital signs for abnormalities
    if (context.vitalSigns.bloodPressure) {
      const { systolic, diastolic } = context.vitalSigns.bloodPressure
      if (systolic > 160 || diastolic > 100) {
        return RiskLevel.HIGH
      }
    }

    if (context.vitalSigns.temperature && context.vitalSigns.temperature > 39) {
      return RiskLevel.HIGH
    }

    if (context.vitalSigns.heartRate && (context.vitalSigns.heartRate > 120 || context.vitalSigns.heartRate < 50)) {
      return RiskLevel.HIGH
    }

    // Check confidence level
    if (confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      return RiskLevel.MODERATE
    }

    return RiskLevel.LOW
  }

  /**
   * Validate clinical context
   */
  private static validateClinicalContext(context: ClinicalContext): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!context.patientId || context.patientId.trim().length === 0) {
      errors.push('Patient ID is required')
    }

    if (!context.age || context.age < 0 || context.age > 150) {
      errors.push('Valid age is required')
    }

    if (!context.gender || context.gender.trim().length === 0) {
      errors.push('Gender is required')
    }

    if (!context.chiefComplaint || context.chiefComplaint.trim().length === 0) {
      errors.push('Chief complaint is required')
    }

    if (!context.symptoms || context.symptoms.length === 0) {
      errors.push('At least one symptom is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate decision ID
   */
  private static generateDecisionId(): string {
    return `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get clinical guidelines
   */
  static async getClinicalGuidelines(
    condition: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // TODO: Implement clinical guidelines lookup
      logger.info('Clinical guidelines retrieved', { condition })

      return {
        success: true,
        data: {
          condition,
          guidelines: [],
          lastUpdated: new Date()
        }
      }
    } catch (error) {
      logger.error('Failed to get clinical guidelines', {
        error: error instanceof Error ? error.message : 'Unknown error',
        condition
      })

      return {
        success: false,
        error: 'Failed to get clinical guidelines'
      }
    }
  }

  /**
   * Validate clinical decision
   */
  static async validateClinicalDecision(
    decision: ClinicalDecision
  ): Promise<{ success: boolean; isValid: boolean; errors?: string[] }> {
    try {
      const errors: string[] = []

      if (!decision.patientId) {
        errors.push('Patient ID is required')
      }

      if (!decision.recommendations || decision.recommendations.length === 0) {
        errors.push('At least one recommendation is required')
      }

      if (decision.confidence < 0 || decision.confidence > 1) {
        errors.push('Confidence must be between 0 and 1')
      }

      if (!decision.riskLevel) {
        errors.push('Risk level is required')
      }

      return {
        success: true,
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      logger.error('Failed to validate clinical decision', {
        error: error instanceof Error ? error.message : 'Unknown error',
        decisionId: decision.id
      })

      return {
        success: false,
        isValid: false,
        errors: ['Validation failed']
      }
    }
  }
}

export default ClinicalAIService

// Export functions for backward compatibility
export const getClinicalRecommendation = ClinicalAIService.generateClinicalDecision;
