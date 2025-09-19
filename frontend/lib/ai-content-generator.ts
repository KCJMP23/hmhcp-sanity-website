import { AIContentGenerationRequest, AIContentGenerationResponse, AIImageGenerationRequest, AIImageGenerationResponse } from '@/types/blog'

// AI Content Generation Service
export class AIContentGenerator {
  private openaiApiKey: string
  private openaiTextModel: string
  private openaiImageModel: string

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || ''
    this.openaiTextModel = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini'
    this.openaiImageModel = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3'
  }

  // Generate blog post content using OpenAI
  async generateBlogContent(request: AIContentGenerationRequest): Promise<AIContentGenerationResponse> {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key not configured')
      }

      console.log('🤖 Generating AI content with OpenAI...')
      
      const prompt = this.buildContentPrompt(request)
      const response = await this.callOpenAI(prompt, request)
      
      console.log('✅ AI content generation successful')
      return response
    } catch (error) {
      console.error('❌ AI content generation failed:', error)
      throw error
    }
  }

  // Generate featured image using OpenAI
  async generateFeaturedImage(request: AIImageGenerationRequest): Promise<AIImageGenerationResponse> {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key not configured')
      }

      console.log('🎨 Generating AI image with OpenAI...')
      
      const response = await this.callOpenAIImage(request)
      
      console.log('✅ AI image generation successful')
      return response
    } catch (error) {
      console.error('❌ AI image generation failed:', error)
      throw error
    }
  }

  // Build comprehensive content prompt
  private buildContentPrompt(request: AIContentGenerationRequest): string {
    const { prompt, instructions, tone, customTone, length, style } = request
    
    let promptBuilder = `Write a professional healthcare blog post about: ${prompt}\n\n`
    
    if (instructions) {
      promptBuilder += `Additional instructions: ${instructions}\n\n`
    }
    
    // Tone specification
    if (customTone) {
      promptBuilder += `Tone: ${customTone}\n`
    } else if (tone) {
      promptBuilder += `Tone: ${tone}\n`
    } else {
      promptBuilder += `Tone: Professional and informative, suitable for healthcare professionals\n`
    }
    
    // Length specification
    if (length === 'short') {
      promptBuilder += `Length: 300-500 words\n`
    } else if (length === 'long') {
      promptBuilder += `Length: 1000-1500 words\n`
    } else {
      promptBuilder += `Length: 600-800 words\n`
    }
    
    // Style specification
    if (style === 'casual') {
      promptBuilder += `Style: Conversational and approachable\n`
    } else if (style === 'creative') {
      promptBuilder += `Style: Creative and engaging\n`
    } else {
      promptBuilder += `Style: Professional and authoritative\n`
    }
    
    promptBuilder += `
Requirements:
- Include a compelling title
- Write an engaging excerpt (2-3 sentences)
- Use proper markdown formatting with headers, lists, and emphasis
- Include relevant healthcare insights and best practices
- End with actionable takeaways
- Suggest relevant tags for categorization

Format the response as:
Title: [Title]
Excerpt: [Excerpt]
Tags: [tag1, tag2, tag3]
Content: [Full markdown content]`

    return promptBuilder
  }

  // Call OpenAI API for text generation
  private async callOpenAI(prompt: string, request: AIContentGenerationRequest): Promise<AIContentGenerationResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.openaiTextModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert healthcare content writer specializing in creating professional, informative, and engaging blog posts for healthcare professionals and organizations.'
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
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''
    
    return this.parseAIResponse(content)
  }

  // Call OpenAI API for image generation
  private async callOpenAIImage(request: AIImageGenerationRequest): Promise<AIImageGenerationResponse> {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.openaiImageModel,
        prompt: this.buildImagePrompt(request.prompt, request.style),
        n: 1,
        size: request.size || '1024x1024',
        quality: request.quality || 'standard',
        response_format: 'url'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const imageUrl = data.data[0]?.url || ''
    
    return {
      id: request.id,
      imageUrl,
      status: 'success' as const,
      metadata: {
        size: request.size || '1024x1024',
        format: 'png',
        prompt: request.prompt,
        style: request.style
      }
    }
  }

  // Build image generation prompt
  private buildImagePrompt(prompt: string, style?: string): string {
    let imagePrompt = `Professional healthcare image: ${prompt}`
    
    if (style) {
      imagePrompt += `, ${style} style`
    }
    
    imagePrompt += `. High quality, professional, suitable for healthcare website. Clean, modern design with excellent composition.`
    
    return imagePrompt
  }

  // Get max tokens based on length
  private getMaxTokens(length?: string): number {
    switch (length) {
      case 'short': return 800
      case 'long': return 2000
      default: return 1200
    }
  }

  // Parse AI response into structured format
  private parseAIResponse(content: string): AIContentGenerationResponse {
    const lines = content.split('\n')
    let title = ''
    let excerpt = ''
    let tags: string[] = []
    let contentText = ''

    let currentSection = ''

    for (const line of lines) {
      if (line.startsWith('Title:')) {
        title = line.replace('Title:', '').trim()
      } else if (line.startsWith('Excerpt:')) {
        excerpt = line.replace('Excerpt:', '').trim()
      } else if (line.startsWith('Tags:')) {
        const tagsLine = line.replace('Tags:', '').trim()
        tags = tagsLine.split(',').map(tag => tag.trim().replace(/[\[\]]/g, ''))
      } else if (line.startsWith('Content:')) {
        currentSection = 'content'
      } else if (currentSection === 'content') {
        contentText += line + '\n'
      }
    }

    // Fallback if parsing fails
    if (!title || !excerpt) {
      const sections = content.split('\n\n')
      if (sections.length >= 2) {
        title = sections[0].replace(/^#+\s*/, '').trim()
        excerpt = sections[1].trim()
        contentText = sections.slice(2).join('\n\n')
      }
    }

    // Generate SEO-friendly title and description
    const seoTitle = title ? `${title} | HMHCP` : 'Healthcare Insights | HMHCP'
    const seoDescription = excerpt || 'Discover insights and innovations in healthcare technology and quality improvement.'

    return {
      content: contentText.trim(),
      excerpt: excerpt || 'Professional healthcare insights and best practices.',
      title: title || 'Healthcare Innovation Insights',
      tags: tags.length > 0 ? tags : ['Healthcare', 'Innovation', 'Best Practices'],
      seo_title: seoTitle,
      seo_description: seoDescription
    }
  }

  // Generate content with fallback to mock data
  async generateContentWithFallback(request: AIContentGenerationRequest): Promise<AIContentGenerationResponse> {
    try {
      return await this.generateBlogContent(request)
    } catch (error) {
      console.log('⚠️ AI generation failed, using fallback content')
      return this.generateFallbackContent(request)
    }
  }

  // Generate fallback content when AI fails
  private generateFallbackContent(request: AIContentGenerationRequest): AIContentGenerationResponse {
    const { prompt, length } = request
    
    const fallbackContent = `# ${prompt}

This is a comprehensive guide to ${prompt.toLowerCase()} in healthcare.

## Key Benefits

- Improved patient outcomes
- Enhanced operational efficiency
- Better resource utilization
- Increased staff satisfaction

## Implementation Steps

1. **Assessment Phase**
   - Evaluate current processes
   - Identify improvement opportunities
   - Set clear objectives

2. **Planning Phase**
   - Develop implementation strategy
   - Allocate resources
   - Set timelines

3. **Execution Phase**
   - Implement changes systematically
   - Monitor progress
   - Adjust as needed

4. **Evaluation Phase**
   - Measure outcomes
   - Gather feedback
   - Plan future improvements

## Best Practices

- Start small and scale up
- Involve all stakeholders
- Maintain clear communication
- Document everything
- Celebrate successes

## Conclusion

Implementing ${prompt.toLowerCase()} requires careful planning and execution, but the benefits make it worthwhile for any healthcare organization committed to excellence.`

    const excerpt = `Learn how to effectively implement ${prompt.toLowerCase()} in healthcare settings to improve patient care and operational efficiency.`

    return {
      content: fallbackContent,
      excerpt,
      title: `Implementing ${prompt} in Healthcare`,
      tags: ['Healthcare', 'Implementation', 'Best Practices', 'Quality Improvement'],
      seo_title: `Implementing ${prompt} in Healthcare | HMHCP`,
      seo_description: excerpt
    }
  }
}

// Export singleton instance
export const aiContentGenerator = new AIContentGenerator()

// Export convenience functions
export const generateBlogContent = (request: AIContentGenerationRequest) => aiContentGenerator.generateBlogContent(request)
export const generateFeaturedImage = (request: AIImageGenerationRequest) => aiContentGenerator.generateFeaturedImage(request)
export const generateContentWithFallback = (request: AIContentGenerationRequest) => aiContentGenerator.generateContentWithFallback(request)
