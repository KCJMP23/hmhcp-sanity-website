/**
 * HIPAA-Compliant Healthcare Conversion Tracking System
 * 
 * This module provides utilities for tracking healthcare conversions while maintaining
 * strict HIPAA compliance by anonymizing PII, implementing data retention policies,
 * and ensuring secure healthcare data handling.
 */

import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-client'
import logger from '@/lib/logging/winston-logger'

// HIPAA-compliant event types for healthcare conversions
export const HEALTHCARE_EVENT_TYPES = {
  // Awareness Stage
  CONTENT_VIEW: 'content_engagement',
  HEALTHCARE_RESOURCE_VIEW: 'healthcare_download',
  MEDICAL_INFO_ACCESS: 'medical_info_access',
  
  // Consideration Stage  
  WHITEPAPER_DOWNLOAD: 'whitepaper_download',
  CASE_STUDY_DOWNLOAD: 'case_study_download',
  WEBINAR_REGISTRATION: 'webinar_registration',
  EMAIL_SUBSCRIPTION: 'email_signup',
  
  // Consultation Stage
  CONSULTATION_REQUEST: 'consultation_request',
  APPOINTMENT_BOOKING: 'appointment_booking',
  CLINICAL_TRIAL_INQUIRY: 'clinical_trial_inquiry',
  PLATFORM_DEMO_REQUEST: 'platform_demo_request',
  
  // Advocacy Stage
  CONTACT_FORM_SUBMISSION: 'contact_form',
  FEEDBACK_SUBMISSION: 'feedback_submission',
  REFERRAL_SUBMISSION: 'referral_submission'
} as const

// Patient persona types for healthcare analytics
export const PATIENT_PERSONAS = {
  PATIENT: 'patient',
  CAREGIVER: 'caregiver', 
  HEALTHCARE_PROVIDER: 'provider',
  ADMINISTRATOR: 'administrator',
  RESEARCHER: 'researcher'
} as const

// Healthcare specialty categories
export const HEALTHCARE_SPECIALTIES = {
  CARDIOLOGY: 'cardiology',
  ONCOLOGY: 'oncology',
  NEUROLOGY: 'neurology',
  ENDOCRINOLOGY: 'endocrinology',
  ORTHOPEDICS: 'orthopedics',
  PEDIATRICS: 'pediatrics',
  GERIATRICS: 'geriatrics',
  MENTAL_HEALTH: 'mental_health',
  PREVENTIVE_CARE: 'preventive_care',
  GENERAL_MEDICINE: 'general_medicine'
} as const

// HIPAA-compliant conversion event schema
const HIPAAConversionEventSchema = z.object({
  // Required fields
  event_type: z.nativeEnum(HEALTHCARE_EVENT_TYPES),
  page_url: z.string().url(),
  
  // Healthcare-specific fields
  patient_persona: z.nativeEnum(PATIENT_PERSONAS).optional(),
  healthcare_specialty: z.nativeEnum(HEALTHCARE_SPECIALTIES).optional(),
  urgency_level: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  
  // Content context (anonymized)
  content_id: z.string().uuid().optional(),
  content_type: z.string().optional(),
  content_title: z.string().max(500).optional(),
  
  // Technical context
  device_type: z.enum(['desktop', 'mobile', 'tablet', 'other']).default('desktop'),
  user_agent: z.string().optional(),
  
  // Geographic data (region-level only for HIPAA compliance)
  country_code: z.string().length(2).optional(),
  region: z.string().max(100).optional(),
  
  // Campaign attribution (anonymized)
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  
  // Event value (for ROI tracking)
  event_value: z.number().min(0).default(0),
  
  // Custom properties (must be HIPAA-compliant)
  custom_properties: z.record(z.any()).default({}),
  
  // Privacy settings
  consent_given: z.boolean().default(true),
  data_retention_period: z.enum(['1_year', '3_years', '7_years']).default('7_years')
})

export type HIPAAConversionEvent = z.infer<typeof HIPAAConversionEventSchema>

/**
 * HIPAA-compliant conversion tracking utility class
 */
export class HIPAAConversionTracker {
  private static instance: HIPAAConversionTracker
  private sessionCache: Map<string, any> = new Map()
  
  static getInstance(): HIPAAConversionTracker {
    if (!HIPAAConversionTracker.instance) {
      HIPAAConversionTracker.instance = new HIPAAConversionTracker()
    }
    return HIPAAConversionTracker.instance
  }

  /**
   * Generate anonymous session ID using HIPAA-compliant hashing
   */
  private generateAnonymousSessionId(originalSessionId?: string): string {
    const baseId = originalSessionId || crypto.randomUUID()
    // Use crypto.subtle for HIPAA-compliant hashing
    const hash = crypto.createHash('sha256')
    hash.update(baseId + process.env.JWT_SECRET_KEY)
    return hash.digest('hex').substring(0, 32)
  }

  /**
   * Anonymize potentially identifying information
   */
  private anonymizeData(data: any): any {
    const anonymized = { ...data }
    
    // Remove or hash any potentially identifying fields
    if (anonymized.user_agent) {
      // Keep only browser family, not full user agent
      const browserFamily = this.extractBrowserFamily(anonymized.user_agent)
      anonymized.browser = browserFamily
      delete anonymized.user_agent
    }
    
    // Anonymize geographic data to region level only
    if (anonymized.city) {
      delete anonymized.city
    }
    
    // Remove any custom properties that might contain PII
    if (anonymized.custom_properties) {
      anonymized.custom_properties = this.sanitizeCustomProperties(anonymized.custom_properties)
    }
    
    return anonymized
  }

  /**
   * Extract browser family from user agent (HIPAA-safe)
   */
  private extractBrowserFamily(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Other'
  }

  /**
   * Sanitize custom properties to remove PII
   */
  private sanitizeCustomProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}
    const allowedKeys = [
      'page_category', 'content_category', 'interaction_type', 
      'feature_used', 'error_type', 'completion_status'
    ]
    
    for (const [key, value] of Object.entries(properties)) {
      if (allowedKeys.includes(key)) {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  /**
   * Determine data retention period based on healthcare data type
   */
  private determineRetentionPeriod(eventType: string, patientPersona?: string): string {
    // Healthcare providers and administrators need longer retention for compliance
    if (patientPersona === 'provider' || patientPersona === 'administrator') {
      return '7_years'
    }
    
    // Clinical trial and research data needs longer retention
    if (eventType === 'clinical_trial_inquiry' || patientPersona === 'researcher') {
      return '7_years'
    }
    
    // General patient interactions
    if (patientPersona === 'patient' || patientPersona === 'caregiver') {
      return '3_years'
    }
    
    // Default for anonymous interactions
    return '1_year'
  }

  /**
   * Track a HIPAA-compliant healthcare conversion event
   */
  async trackConversion(eventData: Partial<HIPAAConversionEvent>): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Validate and parse event data
      const validatedData = HIPAAConversionEventSchema.parse(eventData)
      
      // Generate anonymous identifiers
      const sessionId = this.generateAnonymousSessionId()
      const anonymousUserId = crypto.randomUUID()
      
      // Anonymize data for HIPAA compliance
      const anonymizedData = this.anonymizeData(validatedData)
      
      // Determine appropriate retention period
      const retentionPeriod = this.determineRetentionPeriod(
        validatedData.event_type,
        validatedData.patient_persona
      )
      
      // Determine journey stage
      const journeyStage = this.mapEventToJourneyStage(validatedData.event_type)
      
      // Prepare database record
      const conversionRecord = {
        session_id: sessionId,
        anonymous_user_id: anonymousUserId,
        event_type: validatedData.event_type,
        event_category: this.mapEventToCategory(validatedData.event_type),
        event_value: validatedData.event_value,
        
        // Content context
        content_id: validatedData.content_id || null,
        content_type: validatedData.content_type,
        content_title: validatedData.content_title,
        page_url: validatedData.page_url,
        
        // Healthcare-specific data
        healthcare_specialty: validatedData.healthcare_specialty,
        patient_persona: validatedData.patient_persona,
        urgency_level: validatedData.urgency_level,
        
        // Technical context (anonymized)
        device_type: validatedData.device_type,
        browser: anonymizedData.browser,
        
        // Geographic data (region-level only)
        country_code: validatedData.country_code,
        region: validatedData.region,
        
        // Campaign attribution
        utm_source: validatedData.utm_source,
        utm_medium: validatedData.utm_medium,
        utm_campaign: validatedData.utm_campaign,
        
        // Event metadata
        event_properties: {
          ...anonymizedData.custom_properties,
          journey_stage: journeyStage,
          consent_given: validatedData.consent_given,
          anonymized_at: new Date().toISOString()
        },
        
        // HIPAA compliance
        is_pii_scrubbed: true,
        retention_policy: retentionPeriod,
        
        // Timestamps
        event_timestamp: new Date().toISOString()
      }
      
      // Insert into database
      const { data, error } = await supabaseAdmin
        .from('conversion_events')
        .insert(conversionRecord)
        .select('id')
        .single()
      
      if (error) {
        logger.error('Failed to track HIPAA conversion event', {
          error: error.message,
          event_type: validatedData.event_type
        })
        return { success: false, error: error.message }
      }
      
      // Log successful tracking (without PII)
      logger.info('HIPAA conversion event tracked', {
        event_id: data.id,
        event_type: validatedData.event_type,
        journey_stage: journeyStage,
        patient_persona: validatedData.patient_persona,
        healthcare_specialty: validatedData.healthcare_specialty
      })
      
      return { success: true, eventId: data.id }
      
    } catch (error) {
      logger.error('HIPAA conversion tracking failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Map event type to journey stage
   */
  private mapEventToJourneyStage(eventType: string): string {
    const stageMapping: Record<string, string> = {
      // Awareness
      [HEALTHCARE_EVENT_TYPES.CONTENT_VIEW]: 'awareness',
      [HEALTHCARE_EVENT_TYPES.HEALTHCARE_RESOURCE_VIEW]: 'awareness',
      [HEALTHCARE_EVENT_TYPES.MEDICAL_INFO_ACCESS]: 'awareness',
      
      // Consideration
      [HEALTHCARE_EVENT_TYPES.WHITEPAPER_DOWNLOAD]: 'consideration',
      [HEALTHCARE_EVENT_TYPES.CASE_STUDY_DOWNLOAD]: 'consideration',
      [HEALTHCARE_EVENT_TYPES.WEBINAR_REGISTRATION]: 'consideration',
      [HEALTHCARE_EVENT_TYPES.EMAIL_SUBSCRIPTION]: 'consideration',
      
      // Consultation
      [HEALTHCARE_EVENT_TYPES.CONSULTATION_REQUEST]: 'consultation',
      [HEALTHCARE_EVENT_TYPES.APPOINTMENT_BOOKING]: 'consultation',
      [HEALTHCARE_EVENT_TYPES.CLINICAL_TRIAL_INQUIRY]: 'consultation',
      [HEALTHCARE_EVENT_TYPES.PLATFORM_DEMO_REQUEST]: 'consultation',
      
      // Advocacy
      [HEALTHCARE_EVENT_TYPES.CONTACT_FORM_SUBMISSION]: 'advocacy',
      [HEALTHCARE_EVENT_TYPES.FEEDBACK_SUBMISSION]: 'advocacy',
      [HEALTHCARE_EVENT_TYPES.REFERRAL_SUBMISSION]: 'advocacy'
    }
    
    return stageMapping[eventType] || 'awareness'
  }

  /**
   * Map event type to category
   */
  private mapEventToCategory(eventType: string): string {
    const categoryMapping: Record<string, string> = {
      // Engagement
      [HEALTHCARE_EVENT_TYPES.CONTENT_VIEW]: 'engagement',
      [HEALTHCARE_EVENT_TYPES.HEALTHCARE_RESOURCE_VIEW]: 'engagement',
      [HEALTHCARE_EVENT_TYPES.MEDICAL_INFO_ACCESS]: 'engagement',
      
      // Lead Generation
      [HEALTHCARE_EVENT_TYPES.WHITEPAPER_DOWNLOAD]: 'lead_generation',
      [HEALTHCARE_EVENT_TYPES.CASE_STUDY_DOWNLOAD]: 'lead_generation',
      [HEALTHCARE_EVENT_TYPES.EMAIL_SUBSCRIPTION]: 'lead_generation',
      [HEALTHCARE_EVENT_TYPES.WEBINAR_REGISTRATION]: 'lead_generation',
      
      // Conversion
      [HEALTHCARE_EVENT_TYPES.CONSULTATION_REQUEST]: 'conversion',
      [HEALTHCARE_EVENT_TYPES.APPOINTMENT_BOOKING]: 'conversion',
      [HEALTHCARE_EVENT_TYPES.CLINICAL_TRIAL_INQUIRY]: 'conversion',
      [HEALTHCARE_EVENT_TYPES.PLATFORM_DEMO_REQUEST]: 'conversion',
      [HEALTHCARE_EVENT_TYPES.CONTACT_FORM_SUBMISSION]: 'conversion',
      [HEALTHCARE_EVENT_TYPES.FEEDBACK_SUBMISSION]: 'conversion',
      [HEALTHCARE_EVENT_TYPES.REFERRAL_SUBMISSION]: 'conversion'
    }
    
    return categoryMapping[eventType] || 'engagement'
  }

  /**
   * Track healthcare content engagement
   */
  async trackContentEngagement(contentId: string, contentType: string, patientPersona?: string): Promise<void> {
    await this.trackConversion({
      event_type: HEALTHCARE_EVENT_TYPES.CONTENT_VIEW,
      content_id: contentId,
      content_type: contentType,
      patient_persona: patientPersona as any,
      page_url: `${process.env.NEXT_PUBLIC_SITE_URL}/content/${contentId}`
    })
  }

  /**
   * Track consultation request
   */
  async trackConsultationRequest(
    specialty: string, 
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical',
    patientPersona?: string
  ): Promise<void> {
    await this.trackConversion({
      event_type: HEALTHCARE_EVENT_TYPES.CONSULTATION_REQUEST,
      healthcare_specialty: specialty as any,
      urgency_level: urgencyLevel,
      patient_persona: patientPersona as any,
      event_value: 100, // Standard consultation value
      page_url: `${process.env.NEXT_PUBLIC_SITE_URL}/consultation`
    })
  }

  /**
   * Track clinical trial inquiry
   */
  async trackClinicalTrialInquiry(
    specialty: string,
    patientPersona?: string
  ): Promise<void> {
    await this.trackConversion({
      event_type: HEALTHCARE_EVENT_TYPES.CLINICAL_TRIAL_INQUIRY,
      healthcare_specialty: specialty as any,
      patient_persona: patientPersona as any,
      event_value: 200, // Higher value for research inquiries
      page_url: `${process.env.NEXT_PUBLIC_SITE_URL}/clinical-trials`
    })
  }
}

// Export singleton instance
export const hipaaConversionTracker = HIPAAConversionTracker.getInstance()

// Export utility functions for easy use
export const trackHealthcareConversion = hipaaConversionTracker.trackConversion.bind(hipaaConversionTracker)
export const trackContentEngagement = hipaaConversionTracker.trackContentEngagement.bind(hipaaConversionTracker)
export const trackConsultationRequest = hipaaConversionTracker.trackConsultationRequest.bind(hipaaConversionTracker)
export const trackClinicalTrialInquiry = hipaaConversionTracker.trackClinicalTrialInquiry.bind(hipaaConversionTracker)