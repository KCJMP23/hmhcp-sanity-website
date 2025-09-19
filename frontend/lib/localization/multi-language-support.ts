/**
 * Multi-language Support System
 * 
 * This module provides comprehensive internationalization capabilities including:
 * - Multi-language content management
 * - Translation workflow and approval
 * - Locale-specific content delivery
 * - Language detection and routing
 * - Cultural adaptation and localization
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface Language {
  code: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  isActive: boolean
  isDefault: boolean
  fallbackLanguage?: string
  dateFormat: string
  numberFormat: string
  currency: string
  timezone: string
}

export interface Translation {
  id: string
  contentId: string
  contentType: string
  languageCode: string
  title: string
  content: string
  excerpt?: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string[]
  status: 'draft' | 'pending_review' | 'approved' | 'published'
  translatorId: string
  reviewerId?: string
  translationNotes?: string
  culturalAdaptations?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

export interface TranslationRequest {
  id: string
  contentId: string
  contentType: string
  sourceLanguage: string
  targetLanguage: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deadline?: Date
  assignedTranslatorId?: string
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  specialInstructions?: string
  createdAt: Date
  updatedAt: Date
}

export interface LocalizedContent {
  id: string
  contentType: string
  languageCode: string
  title: string
  content: string
  excerpt?: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string[]
  url: string
  lastModified: Date
  culturalContext?: Record<string, any>
}

export interface CulturalAdaptation {
  id: string
  languageCode: string
  adaptationType: 'date_format' | 'number_format' | 'currency' | 'measurement' | 'cultural_reference' | 'image' | 'color'
  originalValue: string
  adaptedValue: string
  context: string
  notes?: string
  isActive: boolean
  createdAt: Date
}

/**
 * Multi-language Support Class
 */
export class MultiLanguageSupport {
  private supabase: any
  private supportedLanguages: Map<string, Language>
  private defaultLanguage: string

  constructor() {
    this.initializeSupabase()
    this.supportedLanguages = new Map()
    this.defaultLanguage = 'en'
    this.loadSupportedLanguages()
  }

  private async initializeSupabase() {
    this.supabase = await createServerSupabaseClient()
  }

  /**
   * Load supported languages from database
   */
  private async loadSupportedLanguages() {
    try {
      const { data: languages, error } = await this.supabase
        .from('supported_languages')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })

      if (!error && languages) {
        languages.forEach((language: any) => {
          this.supportedLanguages.set(language.code, language)
          if (language.is_default) {
            this.defaultLanguage = language.code
          }
        })
      }
    } catch (error) {
      console.error('Error loading supported languages:', error)
    }
  }

  /**
   * Get all supported languages
   */
  async getSupportedLanguages(): Promise<Language[]> {
    try {
      const { data: languages, error } = await this.supabase
        .from('supported_languages')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      return languages || []

    } catch (error) {
      console.error('Error getting supported languages:', error)
      return []
    }
  }

  /**
   * Get language by code
   */
  async getLanguageByCode(code: string): Promise<Language | null> {
    try {
      const { data: language, error } = await this.supabase
        .from('supported_languages')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single()

      if (error) throw error

      return language

    } catch (error) {
      console.error('Error getting language by code:', error)
      return null
    }
  }

  /**
   * Get default language
   */
  getDefaultLanguage(): string {
    return this.defaultLanguage
  }

  /**
   * Detect user language from request headers
   */
  detectUserLanguage(acceptLanguageHeader: string): string {
    if (!acceptLanguageHeader) {
      return this.defaultLanguage
    }

    // Parse Accept-Language header
    const languages = acceptLanguageHeader
      .split(',')
      .map(lang => {
        const [code, quality = '1'] = lang.trim().split(';q=')
        return {
          code: code.split('-')[0], // Get primary language code
          quality: parseFloat(quality)
        }
      })
      .sort((a, b) => b.quality - a.quality)

    // Find first supported language
    for (const lang of languages) {
      if (this.supportedLanguages.has(lang.code)) {
        return lang.code
      }
    }

    return this.defaultLanguage
  }

  /**
   * Create translation request
   */
  async createTranslationRequest(request: Omit<TranslationRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<TranslationRequest | null> {
    try {
      const { data: newRequest, error } = await this.supabase
        .from('translation_requests')
        .insert({
          content_id: request.contentId,
          content_type: request.contentType,
          source_language: request.sourceLanguage,
          target_language: request.targetLanguage,
          priority: request.priority,
          deadline: request.deadline?.toISOString(),
          assigned_translator_id: request.assignedTranslatorId,
          status: request.status,
          special_instructions: request.specialInstructions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: newRequest.id,
        contentId: newRequest.content_id,
        contentType: newRequest.content_type,
        sourceLanguage: newRequest.source_language,
        targetLanguage: newRequest.target_language,
        priority: newRequest.priority,
        deadline: newRequest.deadline ? new Date(newRequest.deadline) : undefined,
        assignedTranslatorId: newRequest.assigned_translator_id,
        status: newRequest.status,
        specialInstructions: newRequest.special_instructions,
        createdAt: new Date(newRequest.created_at),
        updatedAt: new Date(newRequest.updated_at)
      }

    } catch (error) {
      console.error('Error creating translation request:', error)
      return null
    }
  }

  /**
   * Get translation requests
   */
  async getTranslationRequests(
    filters?: {
      status?: string
      priority?: string
      assignedTranslatorId?: string
      targetLanguage?: string
    }
  ): Promise<TranslationRequest[]> {
    try {
      let query = this.supabase
        .from('translation_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }

      if (filters?.assignedTranslatorId) {
        query = query.eq('assigned_translator_id', filters.assignedTranslatorId)
      }

      if (filters?.targetLanguage) {
        query = query.eq('target_language', filters.targetLanguage)
      }

      const { data: requests, error } = await query

      if (error) throw error

      return (requests || []).map((request: any) => ({
        id: request.id,
        contentId: request.content_id,
        contentType: request.content_type,
        sourceLanguage: request.source_language,
        targetLanguage: request.target_language,
        priority: request.priority,
        deadline: request.deadline ? new Date(request.deadline) : undefined,
        assignedTranslatorId: request.assigned_translator_id,
        status: request.status,
        specialInstructions: request.special_instructions,
        createdAt: new Date(request.created_at),
        updatedAt: new Date(request.updated_at)
      }))

    } catch (error) {
      console.error('Error getting translation requests:', error)
      return []
    }
  }

  /**
   * Create or update translation
   */
  async createTranslation(translation: Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Translation | null> {
    try {
      const { data: newTranslation, error } = await this.supabase
        .from('translations')
        .insert({
          content_id: translation.contentId,
          content_type: translation.contentType,
          language_code: translation.languageCode,
          title: translation.title,
          content: translation.content,
          excerpt: translation.excerpt,
          meta_title: translation.metaTitle,
          meta_description: translation.metaDescription,
          keywords: translation.keywords,
          status: translation.status,
          translator_id: translation.translatorId,
          reviewer_id: translation.reviewerId,
          translation_notes: translation.translationNotes,
          cultural_adaptations: translation.culturalAdaptations,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          published_at: translation.publishedAt?.toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: newTranslation.id,
        contentId: newTranslation.content_id,
        contentType: newTranslation.content_type,
        languageCode: newTranslation.language_code,
        title: newTranslation.title,
        content: newTranslation.content,
        excerpt: newTranslation.excerpt,
        metaTitle: newTranslation.meta_title,
        metaDescription: newTranslation.meta_description,
        keywords: newTranslation.keywords,
        status: newTranslation.status,
        translatorId: newTranslation.translator_id,
        reviewerId: newTranslation.reviewer_id,
        translationNotes: newTranslation.translation_notes,
        culturalAdaptations: newTranslation.cultural_adaptations,
        createdAt: new Date(newTranslation.created_at),
        updatedAt: new Date(newTranslation.updated_at),
        publishedAt: newTranslation.published_at ? new Date(newTranslation.published_at) : undefined
      }

    } catch (error) {
      console.error('Error creating translation:', error)
      return null
    }
  }

  /**
   * Get translation by content ID and language
   */
  async getTranslation(contentId: string, languageCode: string): Promise<Translation | null> {
    try {
      const { data: translation, error } = await this.supabase
        .from('translations')
        .select('*')
        .eq('content_id', contentId)
        .eq('language_code', languageCode)
        .eq('status', 'published')
        .single()

      if (error) throw error

      return {
        id: translation.id,
        contentId: translation.content_id,
        contentType: translation.content_type,
        languageCode: translation.language_code,
        title: translation.title,
        content: translation.content,
        excerpt: translation.excerpt,
        metaTitle: translation.meta_title,
        metaDescription: translation.meta_description,
        keywords: translation.keywords,
        status: translation.status,
        translatorId: translation.translator_id,
        reviewerId: translation.reviewer_id,
        translationNotes: translation.translation_notes,
        culturalAdaptations: translation.cultural_adaptations,
        createdAt: new Date(translation.created_at),
        updatedAt: new Date(translation.updated_at),
        publishedAt: translation.published_at ? new Date(translation.published_at) : undefined
      }

    } catch (error) {
      console.error('Error getting translation:', error)
      return null
    }
  }

  /**
   * Get localized content for a specific language
   */
  async getLocalizedContent(
    contentType: string,
    languageCode: string,
    filters?: Record<string, any>
  ): Promise<LocalizedContent[]> {
    try {
      let query = this.supabase
        .from('translations')
        .select(`
          id,
          content_type,
          language_code,
          title,
          content,
          excerpt,
          meta_title,
          meta_description,
          keywords,
          published_at,
          cultural_adaptations
        `)
        .eq('content_type', contentType)
        .eq('language_code', languageCode)
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      // Apply additional filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      const { data: translations, error } = await query

      if (error) throw error

      return (translations || []).map((translation: any) => ({
        id: translation.id,
        contentType: translation.content_type,
        languageCode: translation.language_code,
        title: translation.title,
        content: translation.content,
        excerpt: translation.excerpt,
        metaTitle: translation.meta_title,
        metaDescription: translation.meta_description,
        keywords: translation.keywords,
        url: `/${languageCode}/${translation.content_type}/${translation.id}`,
        lastModified: new Date(translation.published_at),
        culturalContext: translation.cultural_adaptations
      }))

    } catch (error) {
      console.error('Error getting localized content:', error)
      return []
    }
  }

  /**
   * Create cultural adaptation
   */
  async createCulturalAdaptation(adaptation: Omit<CulturalAdaptation, 'id' | 'createdAt'>): Promise<CulturalAdaptation | null> {
    try {
      const { data: newAdaptation, error } = await this.supabase
        .from('cultural_adaptations')
        .insert({
          language_code: adaptation.languageCode,
          adaptation_type: adaptation.adaptationType,
          original_value: adaptation.originalValue,
          adapted_value: adaptation.adaptedValue,
          context: adaptation.context,
          notes: adaptation.notes,
          is_active: adaptation.isActive,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: newAdaptation.id,
        languageCode: newAdaptation.language_code,
        adaptationType: newAdaptation.adaptation_type,
        originalValue: newAdaptation.original_value,
        adaptedValue: newAdaptation.adapted_value,
        context: newAdaptation.context,
        notes: newAdaptation.notes,
        isActive: newAdaptation.is_active,
        createdAt: new Date(newAdaptation.created_at)
      }

    } catch (error) {
      console.error('Error creating cultural adaptation:', error)
      return null
    }
  }

  /**
   * Get cultural adaptations for a language
   */
  async getCulturalAdaptations(languageCode: string): Promise<CulturalAdaptation[]> {
    try {
      const { data: adaptations, error } = await this.supabase
        .from('cultural_adaptations')
        .select('*')
        .eq('language_code', languageCode)
        .eq('is_active', true)
        .order('adaptation_type')

      if (error) throw error

      return (adaptations || []).map((adaptation: any) => ({
        id: adaptation.id,
        languageCode: adaptation.language_code,
        adaptationType: adaptation.adaptation_type,
        originalValue: adaptation.original_value,
        adaptedValue: adaptation.adapted_value,
        context: adaptation.context,
        notes: adaptation.notes,
        isActive: adaptation.is_active,
        createdAt: new Date(adaptation.created_at)
      }))

    } catch (error) {
      console.error('Error getting cultural adaptations:', error)
      return []
    }
  }

  /**
   * Apply cultural adaptations to content
   */
  async applyCulturalAdaptations(content: string, languageCode: string): Promise<string> {
    try {
      const adaptations = await this.getCulturalAdaptations(languageCode)
      let adaptedContent = content

      adaptations.forEach(adaptation => {
        // Apply different types of adaptations
        switch (adaptation.adaptationType) {
          case 'date_format':
            adaptedContent = this.adaptDateFormat(adaptedContent, adaptation.adaptedValue)
            break
          case 'number_format':
            adaptedContent = this.adaptNumberFormat(adaptedContent, adaptation.adaptedValue)
            break
          case 'currency':
            adaptedContent = this.adaptCurrency(adaptedContent, adaptation.adaptedValue)
            break
          case 'measurement':
            adaptedContent = this.adaptMeasurement(adaptedContent, adaptation.adaptedValue)
            break
          case 'cultural_reference':
            adaptedContent = adaptedContent.replace(
              new RegExp(adaptation.originalValue, 'gi'),
              adaptation.adaptedValue
            )
            break
          default:
            // Simple text replacement
            adaptedContent = adaptedContent.replace(
              new RegExp(adaptation.originalValue, 'gi'),
              adaptation.adaptedValue
            )
        }
      })

      return adaptedContent

    } catch (error) {
      console.error('Error applying cultural adaptations:', error)
      return content
    }
  }

  /**
   * Adapt date format in content
   */
  private adaptDateFormat(content: string, targetFormat: string): string {
    // This is a simplified implementation
    // In a real system, you'd use a proper date parsing and formatting library
    return content
  }

  /**
   * Adapt number format in content
   */
  private adaptNumberFormat(content: string, targetFormat: string): string {
    // This is a simplified implementation
    // In a real system, you'd use proper number formatting
    return content
  }

  /**
   * Adapt currency in content
   */
  private adaptCurrency(content: string, targetCurrency: string): string {
    // This is a simplified implementation
    // In a real system, you'd use proper currency conversion
    return content
  }

  /**
   * Adapt measurement units in content
   */
  private adaptMeasurement(content: string, targetUnit: string): string {
    // This is a simplified implementation
    // In a real system, you'd use proper unit conversion
    return content
  }

  /**
   * Get translation statistics
   */
  async getTranslationStats(): Promise<{
    totalTranslations: number
    pendingReview: number
    completedToday: number
    languagesInProgress: string[]
  }> {
    try {
      const { data: stats, error } = await this.supabase
        .rpc('get_translation_statistics')

      if (error) throw error

      return {
        totalTranslations: stats.total_translations || 0,
        pendingReview: stats.pending_review || 0,
        completedToday: stats.completed_today || 0,
        languagesInProgress: stats.languages_in_progress || []
      }

    } catch (error) {
      console.error('Error getting translation stats:', error)
      return {
        totalTranslations: 0,
        pendingReview: 0,
        completedToday: 0,
        languagesInProgress: []
      }
    }
  }

  /**
   * Update translation status
   */
  async updateTranslationStatus(
    translationId: string,
    status: string,
    reviewerId?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'approved' || status === 'published') {
        updateData.reviewer_id = reviewerId
        if (status === 'published') {
          updateData.published_at = new Date().toISOString()
        }
      }

      const { error } = await this.supabase
        .from('translations')
        .update(updateData)
        .eq('id', translationId)

      if (error) throw error

      return true

    } catch (error) {
      console.error('Error updating translation status:', error)
      return false
    }
  }

  /**
   * Get translation workflow status
   */
  async getTranslationWorkflowStatus(translationId: string): Promise<{
    currentStage: string
    nextStage: string
    estimatedCompletion: Date
    assignedTo: string
    notes: string[]
  } | null> {
    try {
      const { data: workflow, error } = await this.supabase
        .from('translation_workflows')
        .select('*')
        .eq('translation_id', translationId)
        .single()

      if (error) throw error

      return {
        currentStage: workflow.current_stage,
        nextStage: workflow.next_stage,
        estimatedCompletion: new Date(workflow.estimated_completion),
        assignedTo: workflow.assigned_to,
        notes: workflow.notes || []
      }

    } catch (error) {
      console.error('Error getting translation workflow status:', error)
      return null
    }
  }
}

// Export singleton instance
export const multiLanguageSupport = new MultiLanguageSupport()
