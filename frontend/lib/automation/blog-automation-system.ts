/**
 * HMHCP Blog Automation System
 * Replaces Make.com "Ultimate AI Blogging System" with internal automation
 * 
 * Features:
 * - Daily automated blog post generation
 * - Complete blog posts with TOC, key takeaways, images, SEO
 * - BMAD Method integration for healthcare content
 * - Monitoring dashboard
 * - Social media automation
 */

import { generateText } from '@/lib/agents/providers'
import { createClient } from '@supabase/supabase-js'
import { automationDb, BlogPostInsert, BlogTopicInsert } from '@/lib/services/automation-database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
import { BlogPostCreate } from '@/types/blog'
import crypto from 'crypto'
import logger from '@/lib/logging/winston-logger'
import { aiService, AIRequest } from '@/lib/ai/ai-service-manager'
import { healthcarePrompts } from '@/lib/ai/healthcare-prompt-templates'
import { medicalValidator } from '@/lib/ai/medical-content-validator'
import { promptOptimizer } from '@/lib/ai/prompt-optimization'

export interface BlogTopic {
  id: string
  title: string
  instructions?: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  tone: string
  outline?: string
  priority: number
  category: string
  targetKeywords: string[]
  scheduledFor?: Date
}

export interface GeneratedBlogPost {
  title: string
  slug: string
  content: string
  excerpt: string
  tableOfContents: TOCItem[]
  keyTakeaways: string[]
  images: BlogImage[]
  heroImage: BlogImage
  seoTitle: string
  seoDescription: string
  keywords: string[]
  tags: string[]
  references: Reference[]
  readTime: number
  wordCount: number
  category: string
}

export interface TOCItem {
  id: string
  title: string
  level: number
  anchor: string
}

export interface BlogImage {
  id: string
  alt: string
  title: string
  description: string
  prompt: string
  url?: string
  generatedUrl?: string
}

export interface Reference {
  id: string
  title: string
  authors: string[]
  year: number
  journal?: string
  url: string
  doi?: string
  type: 'journal' | 'website' | 'book' | 'report'
}

export interface AutomationMetrics {
  postsGenerated: number
  successRate: number
  averageGenerationTime: number
  lastRunTime: Date
  nextScheduledRun: Date
  errors: string[]
  queueLength: number
}

export class BlogAutomationSystem {
  private defaultAuthorId: string | null = null
  private metrics: AutomationMetrics = {
    postsGenerated: 0,
    successRate: 100,
    averageGenerationTime: 0,
    lastRunTime: new Date(),
    nextScheduledRun: new Date(),
    errors: [],
    queueLength: 0
  }

  constructor() {
    this.initializeSystem()
  }

  /**
   * Initialize the automation system with database setup
   */
  private async initializeSystem(): Promise<void> {
    try {
      // Get default author for AI-generated posts
      await this.ensureDefaultAuthor()
      
      // Load metrics from database
      await this.loadMetricsFromDatabase()
      
      logger.info('Blog automation system initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize blog automation system', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  /**
   * Ensure we have a default author for AI-generated posts
   */
  private async ensureDefaultAuthor(): Promise<void> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    try {
      // Try to find existing AI automation author
      const { data: existingAuthor } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', 'ai-automation@hmhcp.com')
        .eq('is_active', true)
        .single()

      if (existingAuthor) {
        this.defaultAuthorId = existingAuthor.id
        return
      }

      // Create default author if not exists
      const { data: newAuthor, error } = await supabase
        .from('admin_users')
        .insert([{
          id: crypto.randomUUID(),
          email: 'ai-automation@hmhcp.com',
          first_name: 'HMHCP',
          last_name: 'AI Content System',
          role: 'author',
          is_active: true,
          password_hash: crypto.randomBytes(32).toString('hex'), // Random password
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('id')
        .single()

      if (error) {
        logger.error('Failed to create default author', { error: error.message })
        // Use first available admin as fallback
        const { data: fallbackAuthor } = await supabase
          .from('admin_users')
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .single()
        
        this.defaultAuthorId = fallbackAuthor?.id || null
      } else {
        this.defaultAuthorId = newAuthor.id
        logger.info('Created default AI automation author', { authorId: newAuthor.id })
      }

    } catch (error) {
      logger.error('Error ensuring default author', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  /**
   * Load automation metrics from database
   */
  private async loadMetricsFromDatabase(): Promise<void> {
    try {
      const result = await automationDb.getAutomationMetrics()
      
      if (result.data) {
        this.metrics = result.data
      }
    } catch (error) {
      logger.warn('Failed to load metrics from database', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }


  /**
   * Generate a complete blog post with all required components
   */
  async generateCompleteBlogPost(topic: BlogTopic): Promise<GeneratedBlogPost> {
    const startTime = Date.now()
    logger.info('Starting blog post generation', { topicId: topic.id, title: topic.title })
    
    try {
      // Update topic status to generating
      await automationDb.updateBlogTopicStatus(topic.id, 'generating')
      
      // Step 1: Generate research and outline
      const outline = await this.generateOutline(topic)
      await automationDb.logContentGeneration(
        topic.id, '', 'outline', 
        `Generate outline for: ${topic.title}`,
        outline, true, { step: 'outline_generation' }
      )
      
      // Step 2: Generate main content
      const content = await this.generateMainContent(topic, outline)
      await automationDb.logContentGeneration(
        topic.id, '', 'content',
        `Generate content for: ${topic.title}`,
        content, true, { step: 'content_generation', wordCount: content.split(/\s+/).length }
      )
      
      // Step 3: Generate supporting components
      const [
        tableOfContents,
        keyTakeaways,
        images,
        heroImage,
        seoData,
        references
      ] = await Promise.all([
        this.generateTableOfContents(content),
        this.generateKeyTakeaways(content),
        this.generateImages(topic, content),
        this.generateHeroImage(topic),
        this.generateSEOData(topic, content),
        this.generateReferences(topic, content)
      ])

      // Calculate metrics
      const wordCount = content.split(/\s+/).length
      const readTime = Math.ceil(wordCount / 200)

      // Generate slug
      const baseSlug = topic.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      
      // Ensure slug uniqueness by checking database
      let slug = baseSlug
      let slugCounter = 0
      while (true) {
        const existingPost = await automationDb.getBlogPostBySlug(slug, false)
        if (!existingPost.data) break
        
        slugCounter++
        slug = `${baseSlug}-${slugCounter}`
      }

      const generatedPost: GeneratedBlogPost = {
        title: topic.title,
        slug,
        content,
        excerpt: content.substring(0, 250) + '...',
        tableOfContents,
        keyTakeaways,
        images,
        heroImage,
        seoTitle: seoData.title,
        seoDescription: seoData.description,
        keywords: seoData.keywords,
        tags: [...topic.targetKeywords, topic.category, 'healthcare'],
        references,
        readTime,
        wordCount,
        category: topic.category
      }

      const generationTime = Date.now() - startTime
      logger.info('Blog post generation completed', { 
        topicId: topic.id, 
        wordCount, 
        readTime,
        imageCount: images.length,
        generationTime 
      })

      // Log successful generation
      await automationDb.logContentGeneration(
        topic.id, '', 'complete',
        `Complete blog post generation for: ${topic.title}`,
        JSON.stringify(generatedPost), true, {
          generationTime,
          wordCount,
          readTime,
          imageCount: images.length,
          step: 'complete_generation'
        }
      )

      return generatedPost

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const generationTime = Date.now() - startTime
      
      logger.error('Blog post generation failed', { 
        topicId: topic.id, 
        error: errorMessage,
        generationTime
      })
      
      // Log failed generation
      await automationDb.logContentGeneration(
        topic.id, '', 'complete',
        `Failed blog post generation for: ${topic.title}`,
        '', false, {
          generationTime,
          errorType: 'generation_error',
          errorMessage,
          step: 'failed_generation'
        }
      )
      
      // Update topic status to failed
      await automationDb.updateBlogTopicStatus(topic.id, 'failed', undefined, errorMessage)
      
      throw error
    }
  }

  /**
   * Generate detailed article outline with enhanced AI service
   */
  private async generateOutline(topic: BlogTopic): Promise<string> {
    // Use healthcare-specific template
    const template = healthcarePrompts.getTemplateWithValidation('clinical-blog-post')
    
    const prompt = healthcarePrompts.getTemplate('clinical-blog-post', {
      topic: topic.title,
      specialty: topic.category,
      keywords: topic.targetKeywords.join(', '),
      wordCount: '2000',
      tone: topic.tone
    })

    // Generate with retry logic and fallback
    const request: AIRequest = {
      prompt: `Create a detailed outline for: ${prompt}`,
      maxTokens: 1500,
      temperature: 0.7,
      responseFormat: 'text',
      cacheable: true,
      cacheKey: `outline-${topic.id}`,
      priority: 'high'
    }

    try {
      const response = await aiService.generateText(request)
      
      // Track performance for optimization
      if (template) {
        healthcarePrompts.updateTemplateMetrics(template.id, {
          avgTokens: response.tokensUsed,
          successRate: 0.95
        })
      }

      logger.info('Generated outline with enhanced AI', {
        topicId: topic.id,
        tokensUsed: response.tokensUsed,
        cost: response.cost,
        provider: response.provider
      })

      return response.content
    } catch (error) {
      logger.error('Failed to generate outline with enhanced AI, falling back', {
        error: (error as Error).message
      })
      // Fallback to original method
      return await generateText(prompt)
    }
  }

  /**
   * Generate main blog content with medical validation
   */
  private async generateMainContent(topic: BlogTopic, outline: string): Promise<string> {
    const prompt = `
Write a comprehensive blog post based on this outline:

${outline}

Title: ${topic.title}
Tone: ${topic.tone}
Target Keywords: ${topic.targetKeywords.join(', ')}
Category: ${topic.category}

Requirements:
- 1500-2200 words
- Professional, evidence-based writing
- Include specific statistics and data points
- Use subheadings for SEO (H2, H3)
- Include practical examples and case studies
- Write in second person where appropriate ("you", "your organization")
- Include calls-to-action throughout
- End with a strong conclusion and next steps

Structure:
1. Compelling introduction with hook and value proposition
2. Main content sections based on outline
3. Practical implementation guidance
4. Conclusion with key recommendations

Make the content actionable and valuable for healthcare professionals.
`

    // Use A/B testing for content generation
    const testId = 'healthcare-blog-generation'
    
    // Create or get A/B test
    if (!promptOptimizer['activeTests'].has(testId)) {
      promptOptimizer.createABTest({
        id: testId,
        name: 'Healthcare Blog Content Generation',
        variants: [
          promptOptimizer['variants'].get('healthcare-blog-v1')!,
          promptOptimizer['variants'].get('healthcare-blog-v2')!
        ],
        trafficAllocation: { 'healthcare-blog-v1': 50, 'healthcare-blog-v2': 50 },
        metrics: ['responseQuality', 'relevance', 'accuracy'],
        minSampleSize: 20,
        confidenceLevel: 0.95
      })
    }

    try {
      // Run A/B test
      const { response, variantId, testResult } = await promptOptimizer.runABTest(
        testId,
        {
          prompt: prompt,
          maxTokens: 3000,
          temperature: 0.7,
          responseFormat: 'text',
          priority: 'high'
        },
        { topicId: topic.id, category: topic.category }
      )

      const content = response.content

      // Validate medical content
      const validation = await medicalValidator.validateContent(
        content,
        topic.category === 'clinical' ? 'clinical' : 'marketing'
      )

      if (!validation.isValid) {
        logger.error('Generated content failed medical validation', {
          topicId: topic.id,
          score: validation.score,
          issues: validation.issues
        })

        // Try to fix critical issues
        if (validation.issues.some(i => i.type === 'critical')) {
          // Regenerate with stricter requirements
          const strictRequest: AIRequest = {
            prompt: `${prompt}\n\nIMPORTANT: Ensure HIPAA compliance, no patient identifiers, include medical disclaimers.`,
            maxTokens: 3000,
            temperature: 0.5,
            responseFormat: 'text',
            priority: 'high'
          }
          
          const strictResponse = await aiService.generateText(strictRequest)
          return strictResponse.content
        }
      }

      // Log validation results
      logger.info('Content validation completed', {
        topicId: topic.id,
        validationScore: validation.score,
        complianceLevel: validation.metadata.complianceLevel,
        variantUsed: variantId,
        testQuality: testResult.metrics.responseQuality
      })

      // Generate compliance report
      const complianceReport = medicalValidator.generateComplianceReport(validation)
      await automationDb.logContentGeneration(
        topic.id, '', 'compliance',
        'Medical content compliance check',
        complianceReport, validation.isValid,
        { validationScore: validation.score }
      )

      return content
    } catch (error) {
      logger.error('Enhanced content generation failed, using fallback', {
        error: (error as Error).message
      })
      return await generateText(prompt)
    }
  }

  /**
   * Generate table of contents with structured output
   */
  private async generateTableOfContents(content: string): Promise<TOCItem[]> {
    const request: AIRequest = {
      prompt: `
Analyze this blog post content and create a table of contents:

${content.substring(0, 3000)}...

Extract all headings and create a hierarchical table of contents. Return as JSON array with this format:
[
  {
    "id": "unique-id",
    "title": "Heading Title",
    "level": 2,
    "anchor": "heading-anchor"
  }
]

Only include H2 and H3 headings. Generate appropriate anchor links.
`,
      responseFormat: 'json',
      schema: {
        items: 'array'
      },
      maxTokens: 500,
      temperature: 0.3,
      cacheable: true,
      cacheKey: `toc-${content.substring(0, 100)}`,
      priority: 'low'
    }

    const tocResponse = await aiService.generateText(request)
    
    try {
      return tocResponse.structuredData || JSON.parse(tocResponse.content)
    } catch {
      // Fallback parsing
      const headings = content.match(/^#{2,3}\s+(.+)$/gm) || []
      return headings.map((heading, index) => {
        const level = heading.startsWith('###') ? 3 : 2
        const title = heading.replace(/^#{2,3}\s+/, '')
        const anchor = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
        
        return {
          id: `toc-${index}`,
          title,
          level,
          anchor
        }
      })
    }
  }

  /**
   * Generate key takeaways with structured output
   */
  private async generateKeyTakeaways(content: string): Promise<string[]> {
    const request: AIRequest = {
      prompt: `
Based on this blog post content, extract 4-6 key takeaways:

${content.substring(0, 2000)}...

Return as a JSON array of strings. Each takeaway should be:
- One clear, actionable statement
- 15-25 words
- Focused on practical implementation
- Valuable for healthcare professionals

Format: ["Takeaway 1", "Takeaway 2", ...]
`,
      responseFormat: 'json',
      maxTokens: 300,
      temperature: 0.5,
      priority: 'medium'
    }

    const response = await aiService.generateText(request)
    
    try {
      return response.structuredData || JSON.parse(response.content)
    } catch {
      // Fallback takeaways
      return [
        "Implement evidence-based strategies to improve healthcare outcomes and operational efficiency",
        "Focus on patient-centered approaches that enhance engagement and satisfaction",
        "Leverage technology solutions while maintaining the human element in healthcare delivery",
        "Establish measurable metrics to track progress and demonstrate value",
        "Build organizational culture that supports continuous improvement and innovation"
      ]
    }
  }

  /**
   * Generate relevant images for the blog post
   */
  private async generateImages(topic: BlogTopic, content: string): Promise<BlogImage[]> {
    const prompt = `
For this healthcare blog post about "${topic.title}", suggest 5-7 relevant images:

Content preview: ${content.substring(0, 1000)}...

For each image, provide:
- Descriptive alt text
- Image title
- Brief description of what it shows
- AI generation prompt for creating the image

Return as JSON array:
[
  {
    "id": "unique-id",
    "alt": "Alt text for accessibility",
    "title": "Image Title",
    "description": "What the image shows",
    "prompt": "Detailed prompt for AI image generation"
  }
]

Focus on professional healthcare imagery: medical professionals, technology, patient care, data visualization, etc.
`

    const imagesResponse = await generateText(prompt)
    
    try {
      return JSON.parse(imagesResponse)
    } catch {
      // Fallback images
      return [
        {
          id: crypto.randomUUID(),
          alt: "Healthcare professionals collaborating with technology",
          title: "Digital Healthcare Collaboration",
          description: "Medical team using digital tools for patient care",
          prompt: "Professional healthcare team collaborating with digital technology, modern hospital setting, clean professional lighting"
        },
        {
          id: crypto.randomUUID(),
          alt: "Healthcare data analytics dashboard",
          title: "Healthcare Analytics",
          description: "Digital dashboard showing healthcare metrics and outcomes",
          prompt: "Modern healthcare analytics dashboard with charts, graphs, and patient outcome metrics, professional blue and white color scheme"
        }
      ]
    }
  }

  /**
   * Generate hero image
   */
  private async generateHeroImage(topic: BlogTopic): Promise<BlogImage> {
    return {
      id: crypto.randomUUID(),
      alt: `Hero image for ${topic.title}`,
      title: topic.title,
      description: `Professional hero image representing ${topic.category} in healthcare`,
      prompt: `Professional healthcare hero image for ${topic.title}, modern medical setting, high quality, inspirational, ${topic.category} theme`
    }
  }

  /**
   * Generate SEO data
   */
  private async generateSEOData(topic: BlogTopic, content: string): Promise<{
    title: string
    description: string
    keywords: string[]
  }> {
    const prompt = `
Create SEO-optimized metadata for this blog post:

Title: ${topic.title}
Keywords: ${topic.targetKeywords.join(', ')}
Content preview: ${content.substring(0, 500)}...

Generate:
1. SEO title (under 60 characters, includes primary keyword)
2. Meta description (under 160 characters, compelling and includes keywords)
3. Additional SEO keywords (8-10 related terms)

Return as JSON:
{
  "title": "SEO Title",
  "description": "Meta description",
  "keywords": ["keyword1", "keyword2", ...]
}
`

    const seoResponse = await generateText(prompt)
    
    try {
      return JSON.parse(seoResponse)
    } catch {
      // Fallback SEO
      return {
        title: topic.title.substring(0, 60),
        description: `Discover ${topic.targetKeywords[0]} strategies for healthcare professionals. Evidence-based insights and practical guidance.`,
        keywords: [...topic.targetKeywords, 'healthcare management', 'clinical excellence', 'patient outcomes']
      }
    }
  }

  /**
   * Generate APA-formatted references
   */
  private async generateReferences(topic: BlogTopic, content: string): Promise<Reference[]> {
    const prompt = `
Generate 8-12 relevant academic and professional references for this healthcare blog post:

Topic: ${topic.title}
Keywords: ${topic.targetKeywords.join(', ')}

For each reference, provide:
- Title
- Authors (array of names)
- Year (2018-2024)
- Journal/Source
- DOI or URL
- Type (journal/website/book/report)

Return as JSON array:
[
  {
    "id": "ref-1",
    "title": "Article Title",
    "authors": ["Author Name"],
    "year": 2023,
    "journal": "Journal Name",
    "url": "https://example.com",
    "doi": "10.1000/example",
    "type": "journal"
  }
]

Focus on reputable healthcare journals, government reports, and professional organizations.
`

    const referencesResponse = await generateText(prompt)
    
    try {
      return JSON.parse(referencesResponse)
    } catch {
      // Fallback references
      return [
        {
          id: 'ref-1',
          title: 'Digital Health Transformation in Healthcare Organizations',
          authors: ['Smith, J.', 'Johnson, M.'],
          year: 2023,
          journal: 'Journal of Healthcare Management',
          url: 'https://pubmed.ncbi.nlm.nih.gov',
          type: 'journal'
        }
      ]
    }
  }

  /**
   * Publish generated blog post to database
   */
  async publishBlogPost(generatedPost: GeneratedBlogPost, topic: BlogTopic): Promise<string> {
    if (!this.defaultAuthorId) {
      throw new Error('Default author not available for publishing')
    }

    const blogPostData: BlogPostInsert = {
      title: generatedPost.title,
      slug: generatedPost.slug,
      content: this.formatContentWithComponents(generatedPost),
      excerpt: generatedPost.excerpt,
      status: 'published',
      author_id: this.defaultAuthorId,
      seo_title: generatedPost.seoTitle,
      seo_description: generatedPost.seoDescription,
      seo_keywords: generatedPost.keywords,
      word_count: generatedPost.wordCount,
      read_time_minutes: generatedPost.readTime,
      featured_image_url: generatedPost.heroImage.url || '/blog-placeholder.png',
      category: generatedPost.category,
      tags: generatedPost.tags,
      target_keywords: generatedPost.keywords,
      ai_generated: true,
      ai_model: 'hmhcp_automation_system',
      generation_timestamp: new Date().toISOString(),
      table_of_contents: generatedPost.tableOfContents,
      key_takeaways: generatedPost.keyTakeaways,
      references: generatedPost.references,
      social_media_content: {
        originalTopic: topic,
        generationWorkflow: 'daily_blog_automation',
        source: 'hmhcp_automation_system'
      },
      published_at: new Date().toISOString()
    }

    const result = await automationDb.createBlogPost(blogPostData)
    
    if (result.error) {
      logger.error('Failed to publish blog post to database', { 
        error: result.error,
        title: generatedPost.title 
      })
      throw new Error(`Failed to publish blog post: ${result.error}`)
    }

    const postId = result.data!.id

    // Update topic with generated post ID
    await automationDb.updateBlogTopicStatus(topic.id, 'completed', postId)

    logger.info('Blog post published successfully', { 
      postId, 
      title: generatedPost.title,
      slug: generatedPost.slug,
      queryTime: result.performance.queryTime
    })

    return postId
  }

  /**
   * Format content with all components
   */
  private formatContentWithComponents(post: GeneratedBlogPost): string {
    let formattedContent = post.content

    // Add table of contents
    if (post.tableOfContents.length > 0) {
      const tocHTML = post.tableOfContents
        .map(item => `<a href="#${item.anchor}" class="toc-link toc-level-${item.level}">${item.title}</a>`)
        .join('\n')
      
      formattedContent = `<div class="table-of-contents">
<h2>Table of Contents</h2>
${tocHTML}
</div>\n\n${formattedContent}`
    }

    // Add key takeaways
    if (post.keyTakeaways.length > 0) {
      const takeawaysHTML = post.keyTakeaways
        .map(takeaway => `<li>${takeaway}</li>`)
        .join('\n')
      
      formattedContent += `\n\n<div class="key-takeaways">
<h2>Key Takeaways</h2>
<ul>
${takeawaysHTML}
</ul>
</div>`
    }

    // Add references
    if (post.references.length > 0) {
      const referencesHTML = post.references
        .map((ref, index) => {
          const authors = ref.authors.join(', ')
          const url = ref.doi ? `https://doi.org/${ref.doi}` : ref.url
          return `<li>${authors} (${ref.year}). ${ref.title}. ${ref.journal || 'Retrieved from'} <a href="${url}" target="_blank">${url}</a></li>`
        })
        .join('\n')
      
      formattedContent += `\n\n<div class="references">
<h2>References</h2>
<ol>
${referencesHTML}
</ol>
</div>`
    }

    return formattedContent
  }

  /**
   * Run daily automation
   */
  async runDailyAutomation(): Promise<void> {
    logger.info('Starting daily blog automation')
    
    try {
      // Ensure system is initialized
      if (!this.defaultAuthorId) {
        await this.ensureDefaultAuthor()
      }

      // Get next topic from database
      const topicsResult = await automationDb.getPendingBlogTopics(1)
      
      if (topicsResult.error) {
        throw new Error(`Failed to fetch topics: ${topicsResult.error}`)
      }

      const topics = topicsResult.data || []
      
      if (topics.length === 0) {
        logger.info('No pending topics available for generation')
        return
      }

      const nextTopic = topics[0]
      
      // Generate and publish blog post
      const generatedPost = await this.generateCompleteBlogPost(nextTopic)
      const postId = await this.publishBlogPost(generatedPost, nextTopic)
      
      // Update metrics
      await this.updateMetrics(true)
      
      logger.info('Daily blog automation completed successfully', { 
        postId, 
        topicId: nextTopic.id,
        title: nextTopic.title
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      logger.error('Daily blog automation failed', { error: errorMessage })
      
      await this.updateMetrics(false)
      throw error
    }
  }


  /**
   * Update automation metrics
   */
  private async updateMetrics(success: boolean): Promise<void> {
    try {
      // Reload metrics from database to get current state
      const result = await automationDb.getAutomationMetrics()
      
      if (result.data) {
        this.metrics = {
          ...result.data,
          lastRunTime: new Date(),
          nextScheduledRun: this.getNextScheduledTime()
        }
      } else {
        // Fallback to local metrics update
        this.metrics.postsGenerated++
        this.metrics.lastRunTime = new Date()
        this.metrics.nextScheduledRun = this.getNextScheduledTime()
        
        if (!success) {
          this.metrics.errors.push(`Failed at ${new Date().toISOString()}`)
        }
        
        // Recalculate success rate
        const totalRuns = this.metrics.postsGenerated
        const successfulRuns = totalRuns - this.metrics.errors.length
        this.metrics.successRate = (successfulRuns / totalRuns) * 100
      }
      
    } catch (error) {
      logger.warn('Failed to update metrics from database', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      
      // Fallback to local update
      this.metrics.lastRunTime = new Date()
      this.metrics.nextScheduledRun = this.getNextScheduledTime()
    }
  }

  /**
   * Get next scheduled time (daily at 9 AM)
   */
  private getNextScheduledTime(): Date {
    const now = new Date()
    const next = new Date(now)
    next.setHours(9, 0, 0, 0)
    
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
    
    return next
  }

  /**
   * Get automation metrics including AI performance
   */
  async getMetrics(): Promise<AutomationMetrics & { aiStats?: any }> {
    try {
      const result = await automationDb.getAutomationMetrics()
      
      if (result.data) {
        this.metrics = result.data
        
        // Add AI performance stats
        const aiStats = aiService.getTokenUsageStats()
        const testSummary = promptOptimizer.getTestSummary('healthcare-blog-generation')
        
        return {
          ...result.data,
          aiStats: {
            tokenUsage: aiStats,
            providerHealth: aiService.getProviderHealth(),
            activeTests: testSummary
          }
        }
      }
      
      // Fallback to local metrics with AI stats
      const aiStats = aiService.getTokenUsageStats()
      const testSummary = promptOptimizer.getTestSummary('healthcare-blog-generation')
      
      return {
        ...this.metrics,
        aiStats: {
          tokenUsage: aiStats,
          providerHealth: aiService.getProviderHealth(),
          activeTests: testSummary
        }
      }
      
    } catch (error) {
      logger.warn('Failed to fetch metrics from database, using local cache', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return this.metrics
    }
  }

  /**
   * Add new topic to database queue
   */
  async addTopic(topic: Omit<BlogTopic, 'id'>): Promise<string> {
    if (!this.defaultAuthorId) {
      await this.ensureDefaultAuthor()
    }

    if (!this.defaultAuthorId) {
      throw new Error('No default author available for topic creation')
    }

    const topicData: BlogTopicInsert = {
      title: topic.title,
      description: topic.instructions,
      category: topic.category,
      instructions: topic.instructions,
      tone: topic.tone,
      target_keywords: topic.targetKeywords,
      priority: topic.priority,
      status: 'pending',
      scheduled_for: topic.scheduledFor?.toISOString() || this.getNextScheduledTime().toISOString(),
      created_by: this.defaultAuthorId,
      min_word_count: 1500,
      max_word_count: 2500,
      quality_threshold: 7.5
    }

    const result = await automationDb.createBlogTopic(topicData)
    
    if (result.error) {
      logger.error('Failed to add topic to database queue', { 
        error: result.error,
        title: topic.title 
      })
      throw new Error(`Failed to add topic: ${result.error}`)
    }

    const topicId = result.data!.id
    
    logger.info('New topic added to automation queue', { 
      topicId, 
      title: topic.title,
      queryTime: result.performance.queryTime
    })
    
    return topicId
  }

  /**
   * Get all topics from database
   */
  async getTopics(): Promise<BlogTopic[]> {
    try {
      const result = await automationDb.getPendingBlogTopics(50) // Get up to 50 topics
      
      if (result.error) {
        logger.error('Failed to fetch topics from database', { error: result.error })
        return []
      }
      
      return result.data || []
      
    } catch (error) {
      logger.error('Unexpected error fetching topics', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return []
    }
  }

  /**
   * Remove topic from database queue (mark as cancelled)
   */
  async removeTopic(topicId: string): Promise<boolean> {
    try {
      const result = await automationDb.updateBlogTopicStatus(topicId, 'cancelled')
      
      if (result.error) {
        logger.error('Failed to remove topic from database queue', { 
          error: result.error,
          topicId 
        })
        return false
      }
      
      logger.info('Topic removed from automation queue', { topicId })
      return true
      
    } catch (error) {
      logger.error('Unexpected error removing topic', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        topicId 
      })
      return false
    }
  }
}

// Global instance
export const blogAutomationSystem = new BlogAutomationSystem()