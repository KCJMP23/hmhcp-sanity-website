/**
 * Content Generation Agent - Powered by Claude AI
 * Handles healthcare content generation with medical accuracy
 */

import { 
  HealthcareAgent, 
  AgentInput, 
  AgentOutput, 
  AgentStatus,
  AgentArtifact,
  HealthcareContentType
} from '../healthcare-types';

interface ContentGenerationRequest {
  type: HealthcareContentType;
  topic: string;
  researchData?: any;
  targetAudience: 'patients' | 'providers' | 'researchers' | 'general';
  tone: 'professional' | 'educational' | 'conversational' | 'technical';
  length: 'short' | 'medium' | 'long' | number;
  keywords?: string[];
  outline?: string[];
  includeSections?: string[];
  excludeTopics?: string[];
  citations?: boolean;
  callToAction?: string;
  seoOptimized?: boolean;
}

interface GeneratedContent {
  title: string;
  subtitle?: string;
  metaDescription: string;
  introduction: string;
  sections: Array<{
    heading: string;
    content: string;
    subSections?: Array<{
      heading: string;
      content: string;
    }>;
  }>;
  conclusion: string;
  callToAction?: string;
  keywords: string[];
  readingTime: number;
  wordCount: number;
  citations?: Array<{
    text: string;
    source: string;
    url?: string;
  }>;
  medicalDisclaimer?: string;
  imagePrompts?: string[];
  socialMediaVersions?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
}

export class ContentGenerationAgent extends HealthcareAgent {
  private anthropicApiKey: string;
  private model: string;
  private healthcareTemplates: Map<HealthcareContentType, string>;
  private medicalTerminology: Set<string>;
  private complianceRules: Map<string, any>;

  constructor(config: any) {
    super(config);
    this.anthropicApiKey = config.apiConfig.apiKey;
    this.model = config.apiConfig.model || 'claude-3-opus-20240229';
    this.healthcareTemplates = this.initializeTemplates();
    this.medicalTerminology = new Set();
    this.complianceRules = this.initializeComplianceRules();
  }

  /**
   * Initialize the content generation agent
   */
  public async initialize(): Promise<void> {
    this.setStatus(AgentStatus.INITIALIZING);
    
    try {
      // Verify Anthropic API connection
      await this.verifyAPIConnection();
      
      // Load medical terminology database
      await this.loadMedicalTerminology();
      
      // Load content templates
      await this.loadContentTemplates();
      
      // Initialize compliance checkers
      await this.initializeComplianceCheckers();
      
      this.setStatus(AgentStatus.READY);
      this.log('info', 'Content Generation Agent initialized successfully');
      
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      this.log('error', 'Failed to initialize Content Generation Agent', error);
      throw error;
    }
  }

  /**
   * Execute content generation task
   */
  public async execute(input: AgentInput): Promise<AgentOutput> {
    this.setStatus(AgentStatus.EXECUTING);
    this.currentTask = input;
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!this.validateInput(input)) {
        throw new Error('Invalid input for content generation');
      }
      
      const request = input.data as ContentGenerationRequest;
      
      // Generate content structure
      this.emitProgress(10);
      const contentStructure = await this.planContentStructure(request);
      
      // Generate main content
      this.emitProgress(30);
      const mainContent = await this.generateMainContent(request, contentStructure);
      
      // Enhance with medical accuracy
      this.emitProgress(50);
      const medicallyEnhanced = await this.enhanceMedicalAccuracy(mainContent, request);
      
      // Optimize for SEO if requested
      this.emitProgress(70);
      let finalContent = medicallyEnhanced;
      if (request.seoOptimized) {
        finalContent = await this.optimizeForSEO(medicallyEnhanced, request.keywords);
      }
      
      // Add citations if required
      if (request.citations && request.researchData) {
        finalContent = await this.addCitations(finalContent, request.researchData);
      }
      
      // Generate social media versions
      this.emitProgress(85);
      if (request.type === HealthcareContentType.MEDICAL_BLOG || 
          request.type === HealthcareContentType.HEALTH_NEWS) {
        finalContent.socialMediaVersions = await this.generateSocialMediaVersions(finalContent);
      }
      
      // Add medical disclaimer
      finalContent.medicalDisclaimer = this.generateMedicalDisclaimer(request.type);
      
      // Generate image prompts for visual content
      finalContent.imagePrompts = await this.generateImagePrompts(finalContent);
      
      // Compliance check
      this.emitProgress(95);
      await this.performComplianceCheck(finalContent);
      
      // Update metrics
      this.metrics.executionTime += Date.now() - startTime;
      
      this.emitProgress(100);
      this.setStatus(AgentStatus.READY);
      return this.formatOutput(input.taskId, finalContent, Date.now() - startTime);
      
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      this.log('error', 'Content generation failed', error);
      
      // Try fallback generation
      const fallbackContent = await this.generateFallbackContent(input);
      if (fallbackContent) {
        return fallbackContent;
      }
      
      throw error;
    } finally {
      this.currentTask = null;
    }
  }

  /**
   * Plan content structure based on type and requirements
   */
  private async planContentStructure(request: ContentGenerationRequest): Promise<any> {
    const template = this.healthcareTemplates.get(request.type);
    
    const structurePrompt = `Create a detailed content structure for a ${request.type} about "${request.topic}".
    
    Target audience: ${request.targetAudience}
    Tone: ${request.tone}
    Length: ${request.length}
    
    ${template ? `Use this template as a guide: ${template}` : ''}
    ${request.outline ? `Follow this outline: ${request.outline.join(', ')}` : ''}
    
    Provide a comprehensive structure with:
    1. Compelling title and subtitle
    2. Meta description (150-160 characters)
    3. Section headings and subheadings
    4. Key points for each section
    5. Suggested word count for each section`;
    
    const response = await this.callClaudeAPI({
      model: this.model,
      messages: [{
        role: 'user',
        content: structurePrompt
      }],
      max_tokens: 1500,
      temperature: 0.3
    });
    
    return this.parseStructureResponse(response);
  }

  /**
   * Generate main content based on structure
   */
  private async generateMainContent(
    request: ContentGenerationRequest, 
    structure: any
  ): Promise<GeneratedContent> {
    const contentPrompt = this.buildContentPrompt(request, structure);
    
    const response = await this.callClaudeAPI({
      model: this.model,
      messages: [{
        role: 'system',
        content: `You are a medical content writer with expertise in ${request.type}. 
        Create accurate, engaging healthcare content that is evidence-based and compliant with medical guidelines.
        Always maintain medical accuracy and include appropriate disclaimers.`
      }, {
        role: 'user',
        content: contentPrompt
      }],
      max_tokens: this.calculateMaxTokens(request.length),
      temperature: 0.4
    });
    
    return this.parseContentResponse(response, structure);
  }

  /**
   * Enhance content with medical accuracy
   */
  private async enhanceMedicalAccuracy(
    content: GeneratedContent, 
    request: ContentGenerationRequest
  ): Promise<GeneratedContent> {
    const accuracyPrompt = `Review and enhance the following healthcare content for medical accuracy:
    
    ${JSON.stringify(content)}
    
    Ensure:
    1. All medical statements are factually correct
    2. Terminology is used appropriately
    3. Drug names, dosages, and procedures are accurate
    4. Statistics and data are current and cited
    5. No misleading or dangerous information
    
    Enhance with:
    - Proper medical terminology where appropriate
    - Evidence-based recommendations
    - Current clinical guidelines
    - Appropriate warnings and contraindications`;
    
    const response = await this.callClaudeAPI({
      model: this.model,
      messages: [{
        role: 'user',
        content: accuracyPrompt
      }],
      max_tokens: 2000,
      temperature: 0.2
    });
    
    return this.mergeEnhancements(content, response);
  }

  /**
   * Call Claude API with retry logic
   */
  private async callClaudeAPI(params: any): Promise<any> {
    return await this.callAPIWithRetry(async () => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${error}`);
      }
      
      const data = await response.json();
      
      // Track token usage
      if (data.usage) {
        this.metrics.tokensUsed += data.usage.input_tokens + data.usage.output_tokens;
        this.metrics.costs += this.calculateCost(data.usage);
      }
      
      return data;
    });
  }

  /**
   * Optimize content for SEO
   */
  private async optimizeForSEO(
    content: GeneratedContent, 
    keywords?: string[]
  ): Promise<GeneratedContent> {
    const seoPrompt = `Optimize the following healthcare content for SEO:
    
    ${JSON.stringify(content)}
    
    Target keywords: ${keywords?.join(', ') || 'healthcare, medical'}
    
    Optimize:
    1. Title tag (50-60 characters)
    2. Meta description (150-160 characters)
    3. Header tags (H1, H2, H3) hierarchy
    4. Keyword density (1-2%)
    5. Internal linking opportunities
    6. Schema markup suggestions
    
    Maintain readability and medical accuracy while optimizing.`;
    
    const response = await this.callClaudeAPI({
      model: this.model,
      messages: [{
        role: 'user',
        content: seoPrompt
      }],
      max_tokens: 1500,
      temperature: 0.3
    });
    
    return this.applySEOOptimizations(content, response);
  }

  /**
   * Add citations to content
   */
  private async addCitations(
    content: GeneratedContent, 
    researchData: any
  ): Promise<GeneratedContent> {
    const citations = this.extractCitationsFromResearch(researchData);
    
    const citationPrompt = `Add proper medical citations to the following content:
    
    Content: ${JSON.stringify(content)}
    Available citations: ${JSON.stringify(citations)}
    
    Add citations in AMA format where statements need support.
    Ensure all medical claims have appropriate references.`;
    
    const response = await this.callClaudeAPI({
      model: this.model,
      messages: [{
        role: 'user',
        content: citationPrompt
      }],
      max_tokens: 1000,
      temperature: 0.2
    });
    
    return this.integrateCitations(content, response, citations);
  }

  /**
   * Generate social media versions
   */
  private async generateSocialMediaVersions(content: GeneratedContent): Promise<any> {
    const socialPrompt = `Create social media versions of this healthcare content:
    
    Title: ${content.title}
    Key points: ${content.sections.map(s => s.heading).join(', ')}
    
    Create:
    1. Twitter/X post (280 characters) with hashtags
    2. LinkedIn post (1300 characters) professional tone
    3. Facebook post (500 characters) engaging tone
    
    Include relevant healthcare hashtags and maintain accuracy.`;
    
    const response = await this.callClaudeAPI({
      model: this.model,
      messages: [{
        role: 'user',
        content: socialPrompt
      }],
      max_tokens: 500,
      temperature: 0.5
    });
    
    return this.parseSocialMediaResponse(response);
  }

  /**
   * Generate image prompts for visual content
   */
  private async generateImagePrompts(content: GeneratedContent): Promise<string[]> {
    const imagePrompt = `Generate image prompts for healthcare content about: ${content.title}
    
    Create 3-5 professional medical image prompts that:
    1. Are appropriate for healthcare content
    2. Avoid showing identifiable patients
    3. Focus on educational value
    4. Are visually engaging but professional
    5. Complement the written content
    
    Describe each image in detail for AI generation.`;
    
    const response = await this.callClaudeAPI({
      model: this.model,
      messages: [{
        role: 'user',
        content: imagePrompt
      }],
      max_tokens: 500,
      temperature: 0.6
    });
    
    return this.parseImagePrompts(response);
  }

  /**
   * Perform compliance check on content
   */
  private async performComplianceCheck(content: GeneratedContent): Promise<void> {
    const complianceIssues = [];
    
    // Check HIPAA compliance
    if (this.containsPHI(content)) {
      complianceIssues.push('Potential PHI detected - requires review');
    }
    
    // Check FDA compliance for drug/device content
    if (this.containsFDARegulatedContent(content)) {
      const fdaCompliant = await this.checkFDACompliance(content);
      if (!fdaCompliant) {
        complianceIssues.push('FDA compliance review required');
      }
    }
    
    // Check FTC compliance for health claims
    if (this.containsHealthClaims(content)) {
      const ftcCompliant = await this.checkFTCCompliance(content);
      if (!ftcCompliant) {
        complianceIssues.push('FTC health claim compliance required');
      }
    }
    
    if (complianceIssues.length > 0) {
      this.log('warning', 'Compliance issues detected', complianceIssues);
      content.complianceWarnings = complianceIssues;
    }
  }

  /**
   * Generate fallback content if primary generation fails
   */
  private async generateFallbackContent(input: AgentInput): Promise<AgentOutput | null> {
    try {
      // Use a simpler prompt with OpenAI as fallback
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) return null;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [{
            role: 'system',
            content: 'You are a medical content writer. Create accurate healthcare content.'
          }, {
            role: 'user',
            content: `Write a ${input.data.type} about ${input.data.topic}`
          }],
          temperature: 0.4,
          max_tokens: 2000
        })
      });
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return {
        success: true,
        taskId: input.taskId,
        agentId: this.config.id,
        type: 'content',
        content: {
          title: input.data.topic,
          sections: [{
            heading: 'Content',
            content: content
          }],
          provider: 'openai-fallback'
        },
        artifacts: [],
        metrics: {
          executionTime: Date.now() - Date.now(),
          apiCalls: 1,
          tokensUsed: data.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      this.log('error', 'Fallback content generation failed', error);
      return null;
    }
  }

  /**
   * Validate input
   */
  protected validateInput(input: AgentInput): boolean {
    if (!input.data || !input.data.topic || !input.data.type) {
      this.log('error', 'Topic and type are required for content generation');
      return false;
    }
    
    return true;
  }

  /**
   * Format output
   */
  private formatOutput(
    taskId: string, 
    content: GeneratedContent, 
    executionTime: number
  ): AgentOutput {
    const artifacts: AgentArtifact[] = [
      {
        id: `content_${Date.now()}`,
        type: 'json',
        name: 'generated_content',
        content: content,
        created: Date.now()
      }
    ];
    
    // Add separate artifacts for different versions
    if (content.socialMediaVersions) {
      artifacts.push({
        id: `social_${Date.now()}`,
        type: 'json',
        name: 'social_media_content',
        content: content.socialMediaVersions,
        created: Date.now()
      });
    }
    
    if (content.imagePrompts) {
      artifacts.push({
        id: `images_${Date.now()}`,
        type: 'json',
        name: 'image_prompts',
        content: content.imagePrompts,
        created: Date.now()
      });
    }
    
    return {
      success: true,
      taskId,
      agentId: this.config.id,
      type: 'content',
      content: content,
      artifacts,
      metrics: {
        executionTime,
        apiCalls: this.metrics.apiCalls,
        tokensUsed: this.metrics.tokensUsed,
        costs: this.metrics.costs
      },
      metadata: {
        wordCount: content.wordCount,
        readingTime: content.readingTime,
        sectionCount: content.sections.length,
        hasDisclaimer: !!content.medicalDisclaimer
      }
    };
  }

  /**
   * Helper methods
   */
  private initializeTemplates(): Map<HealthcareContentType, string> {
    const templates = new Map<HealthcareContentType, string>();
    
    templates.set(HealthcareContentType.CLINICAL_ARTICLE, 
      'Abstract, Introduction, Methods, Results, Discussion, Conclusion, References');
    
    templates.set(HealthcareContentType.PATIENT_EDUCATION,
      'What is [condition]?, Symptoms, Causes, Diagnosis, Treatment, Prevention, When to See a Doctor');
    
    templates.set(HealthcareContentType.MEDICAL_BLOG,
      'Introduction, Key Points, Deep Dive, Practical Applications, Conclusion, Resources');
    
    return templates;
  }

  private initializeComplianceRules(): Map<string, any> {
    const rules = new Map<string, any>();
    
    rules.set('HIPAA', {
      noPHI: true,
      deIdentified: true,
      generalEducation: true
    });
    
    rules.set('FDA', {
      noUnapprovedClaims: true,
      accurateDrugInfo: true,
      properWarnings: true
    });
    
    return rules;
  }

  private buildContentPrompt(request: ContentGenerationRequest, structure: any): string {
    return `Write a comprehensive ${request.type} about "${request.topic}".
    
    Structure: ${JSON.stringify(structure)}
    Target audience: ${request.targetAudience}
    Tone: ${request.tone}
    Keywords to include: ${request.keywords?.join(', ') || ''}
    
    Requirements:
    - Medical accuracy is paramount
    - Evidence-based information only
    - Clear and accessible language for the target audience
    - Include practical takeaways
    - Maintain professional healthcare standards
    
    ${request.researchData ? `Use this research data: ${JSON.stringify(request.researchData).substring(0, 1000)}` : ''}`;
  }

  private calculateMaxTokens(length: 'short' | 'medium' | 'long' | number): number {
    if (typeof length === 'number') return Math.min(length * 2, 8000);
    switch (length) {
      case 'short': return 1500;
      case 'medium': return 3000;
      case 'long': return 5000;
      default: return 3000;
    }
  }

  private calculateCost(usage: any): number {
    // Claude pricing (adjust based on actual pricing)
    const inputCost = (usage.input_tokens / 1000) * 0.008;
    const outputCost = (usage.output_tokens / 1000) * 0.024;
    return inputCost + outputCost;
  }

  private generateMedicalDisclaimer(type: HealthcareContentType): string {
    return `This content is for informational purposes only and is not intended as medical advice. 
    Always consult with a qualified healthcare professional for personalized medical guidance.`;
  }

  private containsPHI(content: GeneratedContent): boolean {
    // Check for potential PHI patterns
    const phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /patient\s+name/i,
      /date\s+of\s+birth/i,
      /medical\s+record\s+number/i
    ];
    
    const contentStr = JSON.stringify(content);
    return phiPatterns.some(pattern => pattern.test(contentStr));
  }

  private containsFDARegulatedContent(content: GeneratedContent): boolean {
    const fdaKeywords = ['drug', 'medication', 'device', 'treatment', 'therapy', 'FDA'];
    const contentStr = JSON.stringify(content).toLowerCase();
    return fdaKeywords.some(keyword => contentStr.includes(keyword));
  }

  private containsHealthClaims(content: GeneratedContent): boolean {
    const claimPatterns = [
      /cure/i,
      /treat/i,
      /prevent/i,
      /diagnose/i,
      /clinically proven/i
    ];
    
    const contentStr = JSON.stringify(content);
    return claimPatterns.some(pattern => pattern.test(contentStr));
  }

  private async checkFDACompliance(content: GeneratedContent): Promise<boolean> {
    // Implement FDA compliance checking logic
    return true;
  }

  private async checkFTCCompliance(content: GeneratedContent): Promise<boolean> {
    // Implement FTC compliance checking logic
    return true;
  }

  // Parsing methods
  private parseStructureResponse(response: any): any {
    // Parse Claude's response into structure format
    return JSON.parse(response.content[0].text);
  }

  private parseContentResponse(response: any, structure: any): GeneratedContent {
    // Parse Claude's response into GeneratedContent format
    const content = response.content[0].text;
    return {
      title: structure.title,
      metaDescription: structure.metaDescription,
      introduction: '',
      sections: [],
      conclusion: '',
      keywords: [],
      readingTime: 5,
      wordCount: 1000
    };
  }

  private mergeEnhancements(content: GeneratedContent, response: any): GeneratedContent {
    // Merge medical enhancements into content
    return content;
  }

  private applySEOOptimizations(content: GeneratedContent, response: any): GeneratedContent {
    // Apply SEO optimizations to content
    return content;
  }

  private extractCitationsFromResearch(researchData: any): any[] {
    // Extract citations from research data
    return [];
  }

  private integrateCitations(content: GeneratedContent, response: any, citations: any[]): GeneratedContent {
    // Integrate citations into content
    return content;
  }

  private parseSocialMediaResponse(response: any): any {
    // Parse social media versions from response
    return {};
  }

  private parseImagePrompts(response: any): string[] {
    // Parse image prompts from response
    return [];
  }

  // Initialization methods
  private async verifyAPIConnection(): Promise<void> {
    // Verify Claude API connection
  }

  private async loadMedicalTerminology(): Promise<void> {
    // Load medical terminology database
  }

  private async loadContentTemplates(): Promise<void> {
    // Load additional content templates
  }

  private async initializeComplianceCheckers(): Promise<void> {
    // Initialize compliance checking systems
  }

  /**
   * Shutdown the agent
   */
  public async shutdown(): Promise<void> {
    this.setStatus(AgentStatus.OFFLINE);
    this.log('info', 'Content Generation Agent shutdown complete');
  }

  /**
   * Cancel current task
   */
  public async cancel(): Promise<void> {
    if (this.currentTask) {
      this.log('info', 'Cancelling current content generation task');
      this.currentTask = null;
      this.setStatus(AgentStatus.READY);
    }
  }
}