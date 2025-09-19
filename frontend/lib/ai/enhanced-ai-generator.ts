/**
 * Enhanced AI Content Generation System
 * 
 * This module provides advanced AI content generation capabilities including:
 * - Template-based content generation
 * - Advanced prompt engineering
 * - Content optimization and refinement
 * - Multi-format content generation
 * - SEO-aware content creation
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { seoOptimizer } from '@/lib/seo/seo-optimizer'

export interface AIContentRequest {
  topic: string
  contentType: 'blog_post' | 'page' | 'product_description' | 'email' | 'social_media'
  targetAudience: string
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational'
  length: 'short' | 'medium' | 'long'
  keywords: string[]
  includeImages: boolean
  language: string
  template?: string
  customInstructions?: string
}

export interface AIContentResponse {
  title: string
  content: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  keywords: string[]
  suggestedHeadings: string[]
  imagePrompts: string[]
  metaTags: Record<string, string>
  structuredData: any
  seoScore: number
  recommendations: string[]
  generationTime: number
  cost: number
}

export interface ContentTemplate {
  id: string
  name: string
  description: string
  contentType: string
  promptTemplate: string
  variables: string[]
  examples: Array<{
    input: Record<string, any>
    output: string
  }>
  isActive: boolean
}

export interface GenerationHistory {
  id: string
  request: AIContentRequest
  response: AIContentResponse
  userId: string
  cost: number
  createdAt: Date
  status: 'success' | 'failed' | 'partial'
}

/**
 * Enhanced AI Content Generator Class
 */
export class EnhancedAIGenerator {
  private supabase: any
  private openaiApiKey: string
  private templates: Map<string, ContentTemplate>

  constructor() {
    this.initializeSupabase()
    this.openaiApiKey = process.env.OPENAI_API_KEY || ''
    this.templates = new Map()
    this.loadTemplates()
  }

  private async initializeSupabase() {
    this.supabase = await createServerSupabaseClient()
  }

  /**
   * Load content templates from database
   */
  private async loadTemplates() {
    try {
      const { data: templates, error } = await this.supabase
        .from('content_templates')
        .select('*')
        .eq('is_active', true)

      if (!error && templates) {
        templates.forEach((template: any) => {
          this.templates.set(template.id, template)
        })
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  /**
   * Generate content using AI
   */
  async generateContent(request: AIContentRequest): Promise<AIContentResponse> {
    const startTime = Date.now()
    
    try {
      // Validate request
      this.validateRequest(request)

      // Get or create template
      const template = await this.getTemplate(request)
      
      // Generate enhanced prompt
      const prompt = this.buildEnhancedPrompt(request, template)
      
      // Generate content with OpenAI
      const content = await this.callOpenAI(prompt, request)
      
      // Process and optimize content
      const processedContent = await this.processContent(content, request)
      
      // Generate SEO metadata
      const seoData = await this.generateSEOMetadata(processedContent, request)
      
      // Generate image prompts
      const imagePrompts = this.generateImagePrompts(processedContent, request)
      
      // Calculate generation cost
      const cost = this.calculateCost(content.length, request.includeImages)
      
      // Create response
      const response: AIContentResponse = {
        title: processedContent.title,
        content: processedContent.content,
        excerpt: processedContent.excerpt,
        seoTitle: seoData.title,
        seoDescription: seoData.description,
        keywords: seoData.keywords,
        suggestedHeadings: processedContent.headings,
        imagePrompts,
        metaTags: seoData.metaTags,
        structuredData: seoData.structuredData,
        seoScore: seoData.score,
        recommendations: seoData.recommendations,
        generationTime: Date.now() - startTime,
        cost
      }

      // Save generation history
      await this.saveGenerationHistory(request, response)

      return response

    } catch (error) {
      console.error('Error generating content:', error)
      throw new Error(`Content generation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Validate content generation request
   */
  private validateRequest(request: AIContentRequest): void {
    if (!request.topic || request.topic.trim().length < 3) {
      throw new Error('Topic must be at least 3 characters long')
    }

    if (!request.targetAudience) {
      throw new Error('Target audience is required')
    }

    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }
  }

  /**
   * Get or create content template
   */
  private async getTemplate(request: AIContentRequest): Promise<ContentTemplate> {
    if (request.template && this.templates.has(request.template)) {
      return this.templates.get(request.template)!
    }

    // Get default template for content type
    const defaultTemplate = await this.getDefaultTemplate(request.contentType)
    if (defaultTemplate) {
      return defaultTemplate
    }

    // Create dynamic template
    return this.createDynamicTemplate(request)
  }

  /**
   * Get default template for content type
   */
  private async getDefaultTemplate(contentType: string): Promise<ContentTemplate | null> {
    try {
      const { data: template, error } = await this.supabase
        .from('content_templates')
        .select('*')
        .eq('content_type', contentType)
        .eq('is_active', true)
        .eq('is_default', true)
        .single()

      if (error || !template) return null

      return template
    } catch (error) {
      return null
    }
  }

  /**
   * Create dynamic template based on request
   */
  private createDynamicTemplate(request: AIContentRequest): ContentTemplate {
    const basePrompt = this.getBasePrompt(request.contentType)
    
    return {
      id: 'dynamic',
      name: `Dynamic ${request.contentType} Template`,
      description: `Auto-generated template for ${request.contentType}`,
      contentType: request.contentType,
      promptTemplate: basePrompt,
      variables: ['topic', 'audience', 'tone', 'length', 'keywords'],
      examples: [],
      isActive: true
    }
  }

  /**
   * Get base prompt for content type
   */
  private getBasePrompt(contentType: string): string {
    const prompts = {
      blog_post: `Write a comprehensive blog post about {topic} for {audience}. 
                  Use a {tone} tone and make it {length} in length. 
                  Include these keywords naturally: {keywords}.
                  Structure with clear headings and provide actionable insights.`,
      
      page: `Create a professional page content about {topic} for {audience}.
             Use a {tone} tone and make it {length} in length.
             Include these keywords naturally: {keywords}.
             Focus on value proposition and clear information architecture.`,
      
      product_description: `Write a compelling product description for {topic} targeting {audience}.
                           Use a {tone} tone and make it {length} in length.
                           Include these keywords naturally: {keywords}.
                           Highlight benefits, features, and unique selling points.`,
      
      email: `Compose an engaging email about {topic} for {audience}.
              Use a {tone} tone and make it {length} in length.
              Include these keywords naturally: {keywords}.
              Focus on engagement and clear call-to-action.`,
      
      social_media: `Create social media content about {topic} for {audience}.
                     Use a {tone} tone and make it {length} in length.
                     Include these keywords naturally: {keywords}.
                     Make it shareable and engaging.`
    }

    return prompts[contentType as keyof typeof prompts] || prompts.blog_post
  }

  /**
   * Build enhanced prompt with all context
   */
  private buildEnhancedPrompt(request: AIContentRequest, template: ContentTemplate): string {
    let prompt = template.promptTemplate

    // Replace template variables
    prompt = prompt.replace('{topic}', request.topic)
    prompt = prompt.replace('{audience}', request.targetAudience)
    prompt = prompt.replace('{tone}', request.tone)
    prompt = prompt.replace('{length}', this.getLengthGuidance(request.length))
    prompt = prompt.replace('{keywords}', request.keywords.join(', '))

    // Add advanced instructions
    prompt += `\n\nAdditional Requirements:
    - Write in ${request.language}
    - Optimize for SEO and readability
    - Include relevant statistics and examples
    - Use active voice and clear language
    - Structure with proper headings (H1, H2, H3)
    - Include a compelling introduction and conclusion
    - Make content actionable and valuable`

    if (request.customInstructions) {
      prompt += `\n\nCustom Instructions: ${request.customInstructions}`
    }

    return prompt
  }

  /**
   * Get length guidance for content
   */
  private getLengthGuidance(length: string): string {
    const guidance = {
      short: '300-500 words',
      medium: '800-1200 words',
      long: '1500-2500 words'
    }
    return guidance[length as keyof typeof guidance] || guidance.medium
  }

  /**
   * Call OpenAI API for content generation
   */
  private async callOpenAI(prompt: string, request: AIContentRequest): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert content writer specializing in healthcare and business content. Write engaging, informative, and SEO-optimized content.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.getMaxTokens(request.length),
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || ''

    } catch (error) {
      console.error('OpenAI API call failed:', error)
      throw new Error('Failed to generate content with AI')
    }
  }

  /**
   * Get max tokens based on content length
   */
  private getMaxTokens(length: string): number {
    const tokens = {
      short: 1000,
      medium: 2000,
      long: 4000
    }
    return tokens[length as keyof typeof tokens] || tokens.medium
  }

  /**
   * Process and optimize generated content
   */
  private async processContent(content: string, request: AIContentRequest): Promise<{
    title: string
    content: string
    excerpt: string
    headings: string[]
  }> {
    // Extract title from content
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : this.generateTitle(request.topic)

    // Extract headings
    const headings = content.match(/^#{1,3}\s+(.+)$/gm)?.map(h => h.replace(/^#{1,3}\s+/, '')) || []

    // Generate excerpt
    const excerpt = this.generateExcerpt(content, request.length)

    // Clean up content
    const cleanContent = content.replace(/^#\s+.+$/m, '') // Remove title from content

    return {
      title,
      content: cleanContent,
      excerpt,
      headings
    }
  }

  /**
   * Generate title from topic
   */
  private generateTitle(topic: string): string {
    return `${topic} - Complete Guide | HMHCP`
  }

  /**
   * Generate excerpt from content
   */
  private generateExcerpt(content: string, length: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const excerptLength = length === 'short' ? 2 : length === 'medium' ? 3 : 4
    return sentences.slice(0, excerptLength).join('. ') + '.'
  }

  /**
   * Generate SEO metadata
   */
  private async generateSEOMetadata(content: any, request: AIContentRequest): Promise<{
    title: string
    description: string
    keywords: string[]
    metaTags: Record<string, string>
    structuredData: any
    score: number
    recommendations: string[]
  }> {
    try {
      // Use SEO optimizer to analyze content
      const seoAnalysis = await seoOptimizer.analyzeContent(
        content.content,
        content.title,
        content.excerpt
      )

      // Generate optimized metadata
      const mappedContentType = this.mapContentType(request.contentType)
      const seoData = await seoOptimizer.generateContentSuggestions(
        request.topic,
        request.keywords,
        mappedContentType
      )

      return {
        title: seoData.title,
        description: seoData.description,
        keywords: seoData.keywords,
        metaTags: seoData.metaTags,
        structuredData: seoData.structuredData,
        score: seoAnalysis.score,
        recommendations: seoAnalysis.recommendations
      }

    } catch (error) {
      console.error('Error generating SEO metadata:', error)
      
      // Fallback metadata
      return {
        title: content.title,
        description: content.excerpt,
        keywords: request.keywords,
        metaTags: {},
        structuredData: {},
        score: 0,
        recommendations: ['SEO analysis failed - review manually']
      }
    }
  }

  /**
   * Generate image prompts for content
   */
  private generateImagePrompts(content: any, request: AIContentRequest): string[] {
    const prompts: string[] = []

    // Generate main image prompt
    prompts.push(`Professional ${request.contentType} illustration about ${request.topic}, ${request.tone} style, high quality, healthcare business context`)

    // Generate additional image prompts based on headings
    if (content.headings && content.headings.length > 0) {
      content.headings.slice(0, 3).forEach((heading: any) => {
        prompts.push(`Infographic or illustration for "${heading}", professional style, healthcare context`)
      })
    }

    return prompts
  }

  /**
   * Calculate generation cost
   */
  private calculateCost(contentLength: number, includeImages: boolean): number {
    // Rough cost estimation (actual costs may vary)
    const baseCost = contentLength / 1000 * 0.02 // $0.02 per 1000 characters
    const imageCost = includeImages ? 0.10 : 0 // $0.10 per image
    return Math.round((baseCost + imageCost) * 100) / 100
  }

  /**
   * Map content type to expected SEO optimizer types
   */
  private mapContentType(contentType: string): 'blog' | 'page' | 'product' {
    switch (contentType) {
      case 'blog_post':
      case 'blog':
        return 'blog'
      case 'product_description':
        return 'product'
      case 'email':
      case 'social_media':
      case 'page':
      default:
        return 'page'
    }
  }

  /**
   * Save generation history
   */
  private async saveGenerationHistory(request: AIContentRequest, response: AIContentResponse): Promise<void> {
    try {
      await this.supabase
        .from('ai_generation_history')
        .insert({
          request_data: request,
          response_data: response,
          user_id: 'system', // Will be updated with actual user ID
          cost: response.cost,
          status: 'success',
          created_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error saving generation history:', error)
    }
  }

  /**
   * Get generation history for user
   */
  async getGenerationHistory(userId: string, limit: number = 20): Promise<GenerationHistory[]> {
    try {
      const { data: history, error } = await this.supabase
        .from('ai_generation_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (history || []).map((item: any) => ({
        id: item.id,
        request: item.request_data,
        response: item.response_data,
        userId: item.user_id,
        cost: item.cost,
        createdAt: new Date(item.created_at),
        status: item.status
      }))

    } catch (error) {
      console.error('Error getting generation history:', error)
      return []
    }
  }

  /**
   * Get content templates
   */
  async getContentTemplates(): Promise<ContentTemplate[]> {
    try {
      const { data: templates, error } = await this.supabase
        .from('content_templates')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      return templates || []

    } catch (error) {
      console.error('Error getting content templates:', error)
      return []
    }
  }

  /**
   * Create new content template
   */
  async createContentTemplate(template: Omit<ContentTemplate, 'id'>): Promise<ContentTemplate | null> {
    try {
      const { data: newTemplate, error } = await this.supabase
        .from('content_templates')
        .insert({
          ...template,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Reload templates
      await this.loadTemplates()

      return newTemplate

    } catch (error) {
      console.error('Error creating content template:', error)
      return null
    }
  }

  /**
   * Update content template
   */
  async updateContentTemplate(id: string, updates: Partial<ContentTemplate>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('content_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      // Reload templates
      await this.loadTemplates()

      return true

    } catch (error) {
      console.error('Error updating content template:', error)
      return false
    }
  }

  /**
   * Delete content template
   */
  async deleteContentTemplate(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('content_templates')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Reload templates
      this.templates.delete(id)

      return true

    } catch (error) {
      console.error('Error deleting content template:', error)
      return false
    }
  }
}

// Export singleton instance
export const enhancedAIGenerator = new EnhancedAIGenerator()
