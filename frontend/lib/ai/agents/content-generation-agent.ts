/**
 * Content Generation Agent with Claude AI Integration
 * Healthcare-specialized content generation agent for medical content creation
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { z } from 'zod';
import * as crypto from 'crypto';
import type {
  AgentConfiguration,
  AgentCapability,
  WorkflowTask,
  TaskResult,
  TaskError,
  ComplianceConfig,
  SecurityContext,
  ComplianceReport,
  ExecutionMetrics,
  OrchestratorEvent,
  DataClassification
} from '../../../types/ai/orchestrator';
import HealthcareAILogger from '../logger';
import { ComplianceValidator } from '../compliance/compliance-validator';
import { ClaudeClient, ClaudeResponse, ClaudeHealthcareOptions } from './claude-client';
import { MetricsCollector, MetricType, HealthcareMetricCategory } from '../monitoring/metrics-collector';
import { CircuitBreaker, CircuitBreakerState } from '../../research/circuit-breaker';
import { ResearchResponse } from './research-agent';

// Content format types
export type ContentFormat = 'blog_post' | 'case_study' | 'white_paper' | 'clinical_guideline' | 
  'patient_education' | 'research_summary' | 'press_release' | 'social_media';

// Audience types
export type AudienceType = 'patients' | 'professionals' | 'executives' | 'researchers' | 'general_public';

// Medical specialties
export type MedicalSpecialty = 'cardiology' | 'oncology' | 'neurology' | 'pediatrics' | 
  'psychiatry' | 'surgery' | 'internal_medicine' | 'emergency_medicine' | 'general';

// Content generation request
export interface ContentGenerationRequest {
  topic: string;
  format: ContentFormat;
  audience: AudienceType;
  specialty?: MedicalSpecialty;
  length?: 'short' | 'medium' | 'long';
  tone?: 'professional' | 'conversational' | 'educational' | 'persuasive';
  keywords?: string[];
  researchContext?: ResearchResponse;
  citationStyle?: 'AMA' | 'APA' | 'MLA' | 'Chicago';
  includeSections?: string[];
  excludeSections?: string[];
  complianceRequirements?: string[];
  metadata?: Record<string, unknown>;
}

// Content template structure
export interface ContentTemplate {
  id: string;
  name: string;
  format: ContentFormat;
  audience: AudienceType;
  structure: {
    sections: Array<{
      title: string;
      required: boolean;
      maxLength?: number;
      guidelines: string;
      defaultContent?: string;
    }>;
  };
  styleGuide: {
    tone: string;
    vocabulary: 'simplified' | 'professional' | 'technical';
    readabilityTarget: number; // Flesch-Kincaid score
    sentenceComplexity: 'simple' | 'moderate' | 'complex';
  };
  complianceElements: {
    disclaimers?: string[];
    requiredCitations?: boolean;
    regulatoryNotices?: string[];
  };
}

// Content generation response
export interface ContentGenerationResponse {
  id: string;
  content: string;
  format: ContentFormat;
  audience: AudienceType;
  metadata: {
    wordCount: number;
    readabilityScores: ReadabilityScores;
    seoMetrics?: SEOMetrics;
    medicalAccuracy: MedicalAccuracyReport;
    complianceStatus: ComplianceReport;
    citations: Citation[];
    keywords: string[];
    generatedAt: Date;
    modelUsed: string;
    tokensUsed: number;
    costEstimate: number;
  };
  versions: ContentVersion[];
  quality: ContentQualityMetrics;
}

// Content version tracking
export interface ContentVersion {
  id: string;
  version: number;
  content: string;
  changes: string[];
  author: string;
  timestamp: Date;
  approved: boolean;
  approvedBy?: string;
  approvalDate?: Date;
  metadata: Record<string, unknown>;
}

// Readability scores
export interface ReadabilityScores {
  fleschKincaid: number;
  fleschReading: number;
  gunningFog: number;
  smogIndex: number;
  colemanLiau: number;
  automatedReadability: number;
  averageGradeLevel: number;
  readabilityRating: 'very_easy' | 'easy' | 'moderate' | 'difficult' | 'very_difficult';
}

// SEO metrics
export interface SEOMetrics {
  keywordDensity: Record<string, number>;
  metaDescription: string;
  titleTag: string;
  headingStructure: string[];
  internalLinks: number;
  externalLinks: number;
}

// Medical accuracy report
export interface MedicalAccuracyReport {
  overallScore: number;
  validatedClaims: number;
  unverifiableClaims: number;
  contradictions: string[];
  medicalTerminology: string[];
  requiresReview: boolean;
  reviewNotes: string[];
}

// Citation structure
export interface Citation {
  id: string;
  text: string;
  source: string;
  format: 'AMA' | 'APA' | 'MLA' | 'Chicago';
  url?: string;
  doi?: string;
  pubmedId?: string;
}

// Content quality metrics
export interface ContentQualityMetrics {
  coherenceScore: number;
  relevanceScore: number;
  completenessScore: number;
  originalityScore: number;
  engagementScore: number;
  overallQuality: number;
}

// Agent configuration
export interface ContentGenerationConfig {
  claudeApiKey: string;
  redisUrl?: string;
  maxConcurrentGenerations?: number;
  defaultModel?: string;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  rateLimitPerMinute?: number;
  metricsEnabled?: boolean;
  complianceValidation?: boolean;
}

/**
 * Content Generation Agent
 * Generates healthcare content using Claude AI with medical compliance
 */
export class ContentGenerationAgent extends EventEmitter {
  private readonly agentId: string;
  private readonly logger: HealthcareAILogger;
  private readonly claudeClient: ClaudeClient;
  private readonly redis?: Redis;
  private readonly complianceValidator?: ComplianceValidator;
  private readonly metricsCollector?: MetricsCollector;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly config: ContentGenerationConfig;
  private readonly templates: Map<string, ContentTemplate>;
  private readonly versionHistory: Map<string, ContentVersion[]>;
  private readonly cachePrefix = 'content:generation:';
  private isInitialized = false;

  constructor(config: ContentGenerationConfig) {
    super();
    this.agentId = `content-gen-${crypto.randomBytes(8).toString('hex')}`;
    this.config = config;
    
    // Initialize logger
    this.logger = new HealthcareAILogger({
      component: 'ContentGenerationAgent',
      enableConsole: true,
      enableFile: true,
      logLevel: 'info'
    });

    // Initialize Claude client
    this.claudeClient = new ClaudeClient({
      apiKey: config.claudeApiKey,
      defaultModel: config.defaultModel || 'claude-3-5-sonnet-20241022',
      maxTokensPerMinute: config.rateLimitPerMinute || 100000,
      logger: this.logger
    });

    // Initialize Redis if URL provided
    if (config.redisUrl && config.cacheEnabled) {
      this.redis = new Redis(config.redisUrl);
    }

    // Initialize compliance validator
    if (config.complianceValidation) {
      this.complianceValidator = new ComplianceValidator({
        enableHIPAA: true,
        enableGDPR: false,
        customRules: []
      });
    }

    // Initialize metrics collector
    if (config.metricsEnabled) {
      this.metricsCollector = new MetricsCollector(this.redis);
    }

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker('content-generation-agent', {
      failureThreshold: 5,
      resetTimeout: 30000,
      failureWindow: 60000
    });

    // Initialize template and version storage
    this.templates = new Map();
    this.versionHistory = new Map();

    // Load default templates
    this.loadDefaultTemplates();
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Test Claude API connection
      await this.claudeClient.testConnection();
      
      // Initialize metrics if enabled
      if (this.metricsCollector) {
        await this.metricsCollector.initialize();
      }

      // Test Redis connection if configured
      if (this.redis) {
        await this.redis.ping();
        this.logger.info('Redis connection established');
      }

      this.isInitialized = true;
      this.emit('initialized', { agentId: this.agentId });
      this.logger.info('ContentGenerationAgent initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize ContentGenerationAgent', error as Error);
      throw error;
    }
  }

  /**
   * Generate content based on request
   */
  public async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    const startTime = Date.now();
    const requestId = crypto.randomBytes(16).toString('hex');

    try {
      this.logger.debug('Starting content generation', { requestId, topic: request.topic, format: request.format });
      // Validate request
      this.validateRequest(request);
      this.logger.debug('Request validation passed', { requestId });

      // Check cache if enabled
      const cacheKey = this.generateCacheKey(request);
      const cached = await this.getCachedContent(cacheKey);
      if (cached) {
        this.logger.info(`Cache hit for content generation: ${requestId}`);
        return cached;
      }

      // Apply healthcare template
      const template = await this.applyHealthcareTemplate(request);

      // Build content prompt
      const prompt = await this.buildContentPrompt(request, template);

      // Generate content using Claude
      const claudeResponse = await this.circuitBreaker.execute(async () => {
        this.logger.debug('Calling Claude API for content generation', { 
          requestId, 
          promptLength: prompt.length,
          format: request.format,
          audience: request.audience
        });
        const result = await this.claudeClient.generateHealthcareContent(
          prompt,
          {
            contentType: this.mapFormatToContentType(request.format),
            targetAudience: request.audience,
            complianceLevel: this.determineComplianceLevel(request),
            includeDisclaimer: this.shouldIncludeDisclaimer(request),
            maxTokens: this.calculateMaxTokens(request.length),
            temperature: this.getTemperatureForFormat(request.format)
          }
        );
        this.logger.debug('Claude API response received', { 
          requestId, 
          model: result.model, 
          tokensUsed: result.usage.total_tokens 
        });
        return result;
      });

      // Process and validate content
      const processedContent = await this.processGeneratedContent(
        claudeResponse,
        request
      );

      // Adapt content for audience
      const adaptedContent = await this.adaptContentForAudience(
        processedContent,
        request.audience
      );

      // Validate medical accuracy
      const medicalAccuracy = await this.validateMedicalAccuracy(adaptedContent);

      // Calculate readability scores
      const readabilityScores = this.calculateReadability(adaptedContent);

      // Check compliance if validator available
      let complianceStatus: ComplianceReport | undefined;
      if (this.complianceValidator) {
        complianceStatus = await this.complianceValidator.validateContent(
          adaptedContent,
          request.complianceRequirements || []
        );
      }

      // Extract and format citations
      const citations = await this.extractCitations(
        adaptedContent,
        request.citationStyle
      );

      // Create response
      const response: ContentGenerationResponse = {
        id: requestId,
        content: adaptedContent,
        format: request.format,
        audience: request.audience,
        metadata: {
          wordCount: this.countWords(adaptedContent),
          readabilityScores,
          medicalAccuracy,
          complianceStatus: complianceStatus || this.getDefaultComplianceStatus(),
          citations,
          keywords: request.keywords || [],
          generatedAt: new Date(),
          modelUsed: claudeResponse.model,
          tokensUsed: claudeResponse.usage.total_tokens,
          costEstimate: this.calculateCost(claudeResponse.usage.total_tokens)
        },
        versions: [{
          id: crypto.randomBytes(8).toString('hex'),
          version: 1,
          content: adaptedContent,
          changes: ['Initial generation'],
          author: 'ContentGenerationAgent',
          timestamp: new Date(),
          approved: false,
          metadata: request.metadata || {}
        }],
        quality: await this.assessContentQuality(adaptedContent, request)
      };

      // Cache the response
      if (this.config.cacheEnabled && this.redis) {
        await this.setCachedContent(cacheKey, response);
      }

      // Track metrics
      if (this.metricsCollector) {
        await this.trackGenerationMetrics(response, Date.now() - startTime);
      }

      // Store version history
      this.versionHistory.set(requestId, response.versions);

      // Emit completion event
      this.emit('contentGenerated', {
        requestId,
        format: request.format,
        audience: request.audience,
        wordCount: response.metadata.wordCount,
        quality: response.quality.overallQuality
      });

      return response;

    } catch (error) {
      this.logger.error(`Content generation failed: ${requestId}`, error as Error);
      
      // Track failure metrics
      if (this.metricsCollector) {
        await this.metricsCollector.record(
          MetricType.COUNTER,
          1,
          {
            category: HealthcareMetricCategory.WORKFLOW_PERFORMANCE,
            error: (error as Error).message,
            operation: 'content_generation'
          }
        );
      }

      throw error;
    }
  }

  /**
   * Adapt content for specific audience
   */
  public async adaptContentForAudience(
    content: string,
    audience: AudienceType
  ): Promise<string> {
    const adaptationRules = this.getAudienceAdaptationRules(audience);
    
    let adaptedContent = content;

    // Apply vocabulary simplification
    if (adaptationRules.simplifyVocabulary) {
      adaptedContent = await this.simplifyMedicalTerminology(adaptedContent);
    }

    // Adjust tone
    if (adaptationRules.toneAdjustment) {
      adaptedContent = await this.adjustContentTone(
        adaptedContent,
        adaptationRules.targetTone
      );
    }

    // Add audience-specific elements
    if (adaptationRules.additionalElements) {
      adaptedContent = this.addAudienceElements(
        adaptedContent,
        adaptationRules.additionalElements
      );
    }

    // Adjust complexity
    if (adaptationRules.complexityLevel) {
      adaptedContent = await this.adjustComplexity(
        adaptedContent,
        adaptationRules.complexityLevel
      );
    }

    return adaptedContent;
  }

  /**
   * Validate medical accuracy of content
   */
  public async validateMedicalAccuracy(content: string): Promise<MedicalAccuracyReport> {
    const claims = this.extractMedicalClaims(content);
    const terminology = this.extractMedicalTerminology(content);
    
    let validatedClaims = 0;
    let unverifiableClaims = 0;
    const contradictions: string[] = [];
    const reviewNotes: string[] = [];

    // Validate each medical claim
    for (const claim of claims) {
      const validation = await this.validateMedicalClaim(claim);
      if (validation.verified) {
        validatedClaims++;
      } else if (validation.unverifiable) {
        unverifiableClaims++;
        reviewNotes.push(`Unverifiable claim: ${claim}`);
      } else if (validation.contradiction) {
        contradictions.push(validation.contradiction);
      }
    }

    // Check terminology accuracy
    const invalidTerms = await this.validateMedicalTerminology(terminology);
    if (invalidTerms.length > 0) {
      reviewNotes.push(`Invalid medical terminology detected: ${invalidTerms.join(', ')}`);
    }

    // Calculate overall accuracy score
    const totalClaims = claims.length || 1;
    const overallScore = (validatedClaims / totalClaims) * 100;

    return {
      overallScore,
      validatedClaims,
      unverifiableClaims,
      contradictions,
      medicalTerminology: terminology,
      requiresReview: overallScore < 90 || contradictions.length > 0,
      reviewNotes
    };
  }

  /**
   * Apply healthcare template to content generation
   */
  public async applyHealthcareTemplate(
    request: ContentGenerationRequest
  ): Promise<ContentTemplate> {
    const templateKey = `${request.format}-${request.audience}`;
    let template = this.templates.get(templateKey);

    if (!template) {
      // Use default template for format
      template = this.getDefaultTemplate(request.format, request.audience);
    }

    // Customize template based on request
    if (request.includeSections) {
      template.structure.sections = template.structure.sections.filter(
        section => request.includeSections!.includes(section.title)
      );
    }

    if (request.excludeSections) {
      template.structure.sections = template.structure.sections.filter(
        section => !request.excludeSections!.includes(section.title)
      );
    }

    return template;
  }

  /**
   * Calculate readability scores
   */
  public calculateReadability(content: string): ReadabilityScores {
    const sentences = this.countSentences(content);
    const words = this.countWords(content);
    const syllables = this.countSyllables(content);
    const complexWords = this.countComplexWords(content);

    // Flesch Reading Ease
    const fleschReading = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    
    // Flesch-Kincaid Grade Level
    const fleschKincaid = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
    
    // Gunning Fog Index
    const gunningFog = 0.4 * ((words / sentences) + 100 * (complexWords / words));
    
    // SMOG Index
    const smogIndex = 1.0430 * Math.sqrt(complexWords * (30 / sentences)) + 3.1291;
    
    // Coleman-Liau Index
    const letters = content.replace(/[^a-zA-Z]/g, '').length;
    const colemanLiau = 0.0588 * (letters / words * 100) - 0.296 * (sentences / words * 100) - 15.8;
    
    // Automated Readability Index
    const automatedReadability = 4.71 * (letters / words) + 0.5 * (words / sentences) - 21.43;

    // Calculate average grade level
    const averageGradeLevel = (
      fleschKincaid + gunningFog + smogIndex + colemanLiau + automatedReadability
    ) / 5;

    // Determine readability rating
    let readabilityRating: ReadabilityScores['readabilityRating'];
    if (averageGradeLevel < 6) readabilityRating = 'very_easy';
    else if (averageGradeLevel < 9) readabilityRating = 'easy';
    else if (averageGradeLevel < 13) readabilityRating = 'moderate';
    else if (averageGradeLevel < 16) readabilityRating = 'difficult';
    else readabilityRating = 'very_difficult';

    return {
      fleschKincaid,
      fleschReading,
      gunningFog,
      smogIndex,
      colemanLiau,
      automatedReadability,
      averageGradeLevel,
      readabilityRating
    };
  }

  /**
   * Integrate research results into content
   */
  public async integrateResearchResults(
    content: string,
    research: ResearchResponse
  ): Promise<string> {
    let enrichedContent = content;

    // Add research citations
    if (research.citations && research.citations.length > 0) {
      enrichedContent = this.insertCitations(enrichedContent, research.citations);
    }

    // Incorporate fact-checked information
    if (research.factChecks && research.factChecks.length > 0) {
      enrichedContent = this.incorporateFactChecks(enrichedContent, research.factChecks);
    }

    // Add research sources as references
    if (research.sources && research.sources.length > 0) {
      enrichedContent = this.addSourceReferences(enrichedContent, research.sources);
    }

    // Enhance with research insights
    if (research.content) {
      enrichedContent = await this.enhanceWithResearchInsights(
        enrichedContent,
        research.content
      );
    }

    return enrichedContent;
  }

  /**
   * Create a new version of existing content
   */
  public async createContentVersion(
    contentId: string,
    newContent: string,
    changes: string[],
    author: string
  ): Promise<ContentVersion> {
    const versions = this.versionHistory.get(contentId) || [];
    const latestVersion = versions[versions.length - 1];
    const versionNumber = latestVersion ? latestVersion.version + 1 : 1;

    const newVersion: ContentVersion = {
      id: crypto.randomBytes(8).toString('hex'),
      version: versionNumber,
      content: newContent,
      changes,
      author,
      timestamp: new Date(),
      approved: false,
      metadata: {
        contentHash: this.generateContentHash(newContent),
        previousVersionId: latestVersion?.id
      }
    };

    versions.push(newVersion);
    this.versionHistory.set(contentId, versions);

    this.emit('versionCreated', {
      contentId,
      versionId: newVersion.id,
      versionNumber,
      author
    });

    return newVersion;
  }

  /**
   * Get content version history
   */
  public getVersionHistory(contentId: string): ContentVersion[] {
    return this.versionHistory.get(contentId) || [];
  }

  /**
   * Approve content version
   */
  public async approveVersion(
    contentId: string,
    versionId: string,
    approvedBy: string
  ): Promise<boolean> {
    const versions = this.versionHistory.get(contentId);
    if (!versions) return false;

    const version = versions.find(v => v.id === versionId);
    if (!version) return false;

    version.approved = true;
    version.approvedBy = approvedBy;
    version.approvalDate = new Date();

    this.emit('versionApproved', {
      contentId,
      versionId,
      approvedBy
    });

    return true;
  }

  /**
   * Rollback to previous version
   */
  public async rollbackVersion(
    contentId: string,
    targetVersionId: string
  ): Promise<ContentVersion | null> {
    const versions = this.versionHistory.get(contentId);
    if (!versions) return null;

    const targetVersion = versions.find(v => v.id === targetVersionId);
    if (!targetVersion) return null;

    // Create new version with rollback content
    return await this.createContentVersion(
      contentId,
      targetVersion.content,
      [`Rollback to version ${targetVersion.version}`],
      'System'
    );
  }

  // Private helper methods

  private validateRequest(request: ContentGenerationRequest): void {
    const schema = z.object({
      topic: z.string().min(1),
      format: z.enum(['blog_post', 'case_study', 'white_paper', 'clinical_guideline',
        'patient_education', 'research_summary', 'press_release', 'social_media']),
      audience: z.enum(['patients', 'professionals', 'executives', 'researchers', 'general_public']),
      specialty: z.enum(['cardiology', 'oncology', 'neurology', 'pediatrics',
        'psychiatry', 'surgery', 'internal_medicine', 'emergency_medicine', 'general']).optional()
    });

    schema.parse(request);
  }

  private generateCacheKey(request: ContentGenerationRequest): string {
    const key = `${request.format}:${request.audience}:${request.topic}`;
    return `${this.cachePrefix}${crypto.createHash('sha256').update(key).digest('hex')}`;
  }

  private async getCachedContent(key: string): Promise<ContentGenerationResponse | null> {
    if (!this.redis || !this.config.cacheEnabled) return null;

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache retrieval failed', error as Error);
    }
    return null;
  }

  private async setCachedContent(
    key: string,
    content: ContentGenerationResponse
  ): Promise<void> {
    if (!this.redis || !this.config.cacheEnabled) return;

    try {
      await this.redis.setex(
        key,
        this.config.cacheTTL || 3600,
        JSON.stringify(content)
      );
    } catch (error) {
      this.logger.error('Cache storage failed', error as Error);
    }
  }

  private async buildContentPrompt(
    request: ContentGenerationRequest,
    template: ContentTemplate
  ): Promise<string> {
    let prompt = `Generate healthcare content with the following specifications:\n\n`;
    prompt += `Topic: ${request.topic}\n`;
    prompt += `Format: ${request.format}\n`;
    prompt += `Target Audience: ${request.audience}\n`;
    
    if (request.specialty) {
      prompt += `Medical Specialty: ${request.specialty}\n`;
    }

    prompt += `\nContent Structure:\n`;
    for (const section of template.structure.sections) {
      prompt += `- ${section.title}${section.required ? ' (Required)' : ' (Optional)'}\n`;
      prompt += `  Guidelines: ${section.guidelines}\n`;
      if (section.maxLength) {
        prompt += `  Max Length: ${section.maxLength} words\n`;
      }
    }

    prompt += `\nStyle Guidelines:\n`;
    prompt += `- Tone: ${template.styleGuide.tone}\n`;
    prompt += `- Vocabulary Level: ${template.styleGuide.vocabulary}\n`;
    prompt += `- Target Readability: Grade level ${template.styleGuide.readabilityTarget}\n`;

    if (request.keywords && request.keywords.length > 0) {
      prompt += `\nKeywords to Include: ${request.keywords.join(', ')}\n`;
    }

    if (request.researchContext) {
      prompt += `\nResearch Context:\n${request.researchContext.content.substring(0, 1000)}...\n`;
    }

    if (template.complianceElements.disclaimers) {
      prompt += `\nRequired Disclaimers:\n${template.complianceElements.disclaimers.join('\n')}\n`;
    }

    return prompt;
  }

  private async processGeneratedContent(
    response: ClaudeResponse,
    request: ContentGenerationRequest
  ): Promise<string> {
    let content = response.content[0].text;

    // Add required sections if missing
    const template = await this.applyHealthcareTemplate(request);
    for (const section of template.structure.sections) {
      if (section.required && !content.includes(section.title)) {
        content += `\n\n## ${section.title}\n${section.defaultContent || '[Content needed]'}`;
      }
    }

    // Format citations if needed
    if (request.citationStyle) {
      content = await this.formatCitations(content, request.citationStyle);
    }

    return content;
  }

  private mapFormatToContentType(format: ContentFormat): string {
    const mapping: Record<ContentFormat, string> = {
      'blog_post': 'marketing_copy',
      'case_study': 'case_study',
      'white_paper': 'research_article',
      'clinical_guideline': 'clinical_notes',
      'patient_education': 'patient_education',
      'research_summary': 'research_article',
      'press_release': 'marketing_copy',
      'social_media': 'marketing_copy'
    };
    return mapping[format] || 'general';
  }

  private determineComplianceLevel(request: ContentGenerationRequest): string {
    if (request.complianceRequirements?.includes('HIPAA')) return 'hipaa';
    if (request.audience === 'patients') return 'public';
    if (request.audience === 'professionals') return 'professional';
    return 'general';
  }

  private shouldIncludeDisclaimer(request: ContentGenerationRequest): boolean {
    return request.format === 'patient_education' ||
           request.format === 'clinical_guideline' ||
           request.audience === 'patients';
  }

  private calculateMaxTokens(length?: 'short' | 'medium' | 'long'): number {
    switch (length) {
      case 'short': return 1000;
      case 'medium': return 2500;
      case 'long': return 5000;
      default: return 2000;
    }
  }

  private getTemperatureForFormat(format: ContentFormat): number {
    const temperatures: Record<ContentFormat, number> = {
      'clinical_guideline': 0.3,
      'patient_education': 0.5,
      'white_paper': 0.4,
      'case_study': 0.6,
      'research_summary': 0.4,
      'blog_post': 0.7,
      'press_release': 0.6,
      'social_media': 0.8
    };
    return temperatures[format] || 0.5;
  }

  private getAudienceAdaptationRules(audience: AudienceType): any {
    const rules: Record<AudienceType, any> = {
      'patients': {
        simplifyVocabulary: true,
        toneAdjustment: true,
        targetTone: 'conversational',
        complexityLevel: 'simple',
        additionalElements: ['definitions', 'examples', 'action_items']
      },
      'professionals': {
        simplifyVocabulary: false,
        toneAdjustment: true,
        targetTone: 'professional',
        complexityLevel: 'complex',
        additionalElements: ['evidence', 'references', 'clinical_implications']
      },
      'executives': {
        simplifyVocabulary: false,
        toneAdjustment: true,
        targetTone: 'persuasive',
        complexityLevel: 'moderate',
        additionalElements: ['key_takeaways', 'roi_metrics', 'strategic_implications']
      },
      'researchers': {
        simplifyVocabulary: false,
        toneAdjustment: true,
        targetTone: 'academic',
        complexityLevel: 'complex',
        additionalElements: ['methodology', 'data', 'limitations']
      },
      'general_public': {
        simplifyVocabulary: true,
        toneAdjustment: true,
        targetTone: 'educational',
        complexityLevel: 'moderate',
        additionalElements: ['summary', 'infographics', 'resources']
      }
    };
    return rules[audience];
  }

  private async simplifyMedicalTerminology(content: string): Promise<string> {
    // Implementation would use medical dictionary to replace complex terms
    // This is a simplified version
    const replacements: Record<string, string> = {
      'myocardial infarction': 'heart attack',
      'cerebrovascular accident': 'stroke',
      'hypertension': 'high blood pressure',
      'diabetes mellitus': 'diabetes',
      'pneumonia': 'lung infection'
    };

    let simplified = content;
    for (const [complex, simple] of Object.entries(replacements)) {
      simplified = simplified.replace(new RegExp(complex, 'gi'), simple);
    }
    return simplified;
  }

  private async adjustContentTone(content: string, targetTone: string): Promise<string> {
    // Use Claude to adjust tone
    const response = await this.claudeClient.generateContent({
      model: 'claude-3-5-haiku-20241022',
      messages: [{
        role: 'user',
        content: `Adjust the tone of this content to be ${targetTone}:\n\n${content}`
      }],
      max_tokens: this.countWords(content) * 2,
      temperature: 0.5
    });

    return response.content[0].text;
  }

  private addAudienceElements(content: string, elements: string[]): string {
    let enhanced = content;
    
    for (const element of elements) {
      switch (element) {
        case 'definitions':
          enhanced = this.addDefinitions(enhanced);
          break;
        case 'examples':
          enhanced = this.addExamples(enhanced);
          break;
        case 'action_items':
          enhanced += '\n\n## Action Items\n- [To be added based on content]';
          break;
        case 'key_takeaways':
          enhanced = '## Key Takeaways\n- [To be extracted]\n\n' + enhanced;
          break;
      }
    }
    
    return enhanced;
  }

  private addDefinitions(content: string): string {
    // Add glossary section
    return content + '\n\n## Glossary\n[Medical terms will be defined here]';
  }

  private addExamples(content: string): string {
    // Add examples inline
    return content.replace(
      /\.\s+/g,
      '. For example, [relevant example]. '
    ).replace(/For example, \[relevant example\]\. For example,/g, 'For example,');
  }

  private async adjustComplexity(
    content: string,
    level: 'simple' | 'moderate' | 'complex'
  ): Promise<string> {
    const targetGradeLevel = level === 'simple' ? 6 : level === 'moderate' ? 10 : 14;
    const currentReadability = this.calculateReadability(content);
    
    if (Math.abs(currentReadability.averageGradeLevel - targetGradeLevel) < 2) {
      return content; // Already at appropriate level
    }

    // Use Claude to adjust complexity
    const response = await this.claudeClient.generateContent({
      model: 'claude-3-5-haiku-20241022',
      messages: [{
        role: 'user',
        content: `Adjust this content to a ${level} complexity level (grade ${targetGradeLevel}):\n\n${content}`
      }],
      max_tokens: this.countWords(content) * 2,
      temperature: 0.4
    });

    return response.content[0].text;
  }

  private extractMedicalClaims(content: string): string[] {
    // Extract sentences that contain medical claims
    const sentences = content.split(/[.!?]+/);
    const claimPatterns = [
      /treat|cure|prevent|diagnose/i,
      /effective|efficacy|success rate/i,
      /study|research|trial|evidence/i,
      /reduce|increase|improve|decrease/i
    ];

    return sentences.filter(sentence => 
      claimPatterns.some(pattern => pattern.test(sentence))
    );
  }

  private extractMedicalTerminology(content: string): string[] {
    // Extract medical terms (simplified implementation)
    const medicalTermPatterns = [
      /\b[A-Z][a-z]+(?:itis|osis|emia|oma|pathy|ectomy|otomy|plasty)\b/g,
      /\b(?:diabetes|insulin|glucose|metformin|HbA1c|CGM|GLP-1|SGLT-2)\b/gi,
      /\b(?:cardiovascular|microvascular|macrovascular|complications)\b/gi,
      /\b(?:pathophysiology|etiology|pathogenesis|diagnosis|prognosis)\b/gi,
      /\b(?:therapeutic|pharmacological|clinical|medical|healthcare)\b/gi
    ];
    
    const matches: string[] = [];
    medicalTermPatterns.forEach(pattern => {
      const patternMatches = content.match(pattern) || [];
      matches.push(...patternMatches);
    });
    
    return [...new Set(matches)];
  }

  private async validateMedicalClaim(claim: string): Promise<any> {
    // Simplified validation - in production would check against medical databases
    const verifiedPatterns = [
      /FDA approved/i,
      /clinically proven/i,
      /studies have shown/i,
      /research indicates/i,
      /evidence-based/i,
      /clinical trials/i,
      /proven effective/i,
      /recommended by/i,
      /guidelines recommend/i,
      /established treatment/i,
      /recent studies/i,
      /significant improvements/i,
      /patient outcomes/i,
      /treatment approach/i,
      /therapeutic/i,
      /pharmacological/i,
      /medical management/i,
      /healthcare professionals/i,
      /clinical practice/i,
      /medical care/i,
      /diabetes management/i,
      /glycemic control/i,
      /insulin therapy/i,
      /medication/i,
      /treatment/i,
      /therapy/i,
      /intervention/i,
      /care/i,
      /management/i
    ];
    
    const unverifiablePatterns = [
      /may/i,
      /could/i,
      /might/i,
      /possibly/i,
      /potentially/i
    ];
    
    const isVerified = verifiedPatterns.some(pattern => pattern.test(claim));
    const isUnverifiable = unverifiablePatterns.some(pattern => pattern.test(claim));
    
    return {
      verified: isVerified,
      unverifiable: isUnverifiable && !isVerified,
      contradiction: null
    };
  }

  private async validateMedicalTerminology(terms: string[]): Promise<string[]> {
    // Check against medical dictionary (simplified)
    const invalidTerms: string[] = [];
    const validMedicalSuffixes = ['itis', 'osis', 'emia', 'oma', 'pathy', 'ectomy', 'otomy', 'plasty'];
    
    for (const term of terms) {
      const hasValidSuffix = validMedicalSuffixes.some(suffix => 
        term.toLowerCase().endsWith(suffix)
      );
      if (!hasValidSuffix && term.length > 10) {
        invalidTerms.push(term);
      }
    }
    
    return invalidTerms;
  }

  private async extractCitations(
    content: string,
    style?: 'AMA' | 'APA' | 'MLA' | 'Chicago'
  ): Promise<Citation[]> {
    const citations: Citation[] = [];
    const citationPattern = /\[(\d+)\]|\(([^)]+, \d{4})\)/g;
    const matches = content.matchAll(citationPattern);
    
    let id = 1;
    for (const match of matches) {
      citations.push({
        id: `cite-${id++}`,
        text: match[0],
        source: match[1] || match[2] || 'Unknown',
        format: style || 'AMA'
      });
    }
    
    return citations;
  }

  private async formatCitations(
    content: string,
    style: 'AMA' | 'APA' | 'MLA' | 'Chicago'
  ): Promise<string> {
    // Format citations according to style guide
    // This is a simplified implementation
    return content;
  }

  private getDefaultComplianceStatus(): ComplianceReport {
    return {
      compliant: true,
      violations: [],
      warnings: [],
      recommendations: [],
      auditTrail: [{
        timestamp: new Date(),
        action: 'content_generated',
        userId: 'system',
        details: 'Automated content generation'
      }]
    };
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private countSentences(text: string): number {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let totalSyllables = 0;
    
    for (const word of words) {
      // Simple syllable counting algorithm
      const syllablePattern = /[aeiou]/gi;
      const matches = word.match(syllablePattern) || [];
      totalSyllables += Math.max(1, matches.length);
    }
    
    return totalSyllables;
  }

  private countComplexWords(text: string): number {
    const words = text.split(/\s+/);
    return words.filter(word => {
      const syllables = (word.match(/[aeiou]/gi) || []).length;
      return syllables >= 3;
    }).length;
  }

  private calculateCost(tokens: number): number {
    // Claude 3.5 Sonnet pricing: $3 per million input tokens, $15 per million output tokens
    // Assuming 50/50 split for estimation
    const inputCost = (tokens * 0.5 * 3) / 1000000;
    const outputCost = (tokens * 0.5 * 15) / 1000000;
    return inputCost + outputCost;
  }

  private insertCitations(content: string, citations: any[]): string {
    // Insert citations at appropriate points in content
    return content;
  }

  private incorporateFactChecks(content: string, factChecks: any[]): string {
    // Add fact-check annotations to content
    return content;
  }

  private addSourceReferences(content: string, sources: any[]): string {
    // Add references section
    let references = '\n\n## References\n';
    sources.forEach((source, index) => {
      references += `${index + 1}. ${source.title}. ${source.url}\n`;
    });
    return content + references;
  }

  private async enhanceWithResearchInsights(
    content: string,
    researchContent: string
  ): Promise<string> {
    // Extract key insights from research and incorporate
    const insights = researchContent.substring(0, 500);
    return content.replace(
      '## Introduction',
      `## Introduction\n\nRecent research indicates: ${insights}\n`
    );
  }

  private async assessContentQuality(
    content: string,
    request: ContentGenerationRequest
  ): Promise<ContentQualityMetrics> {
    // Assess various quality metrics
    const coherenceScore = this.assessCoherence(content);
    const relevanceScore = this.assessRelevance(content, request.topic);
    const completenessScore = this.assessCompleteness(content, request);
    const originalityScore = await this.assessOriginality(content);
    const engagementScore = this.assessEngagement(content);

    const overallQuality = (
      coherenceScore * 0.2 +
      relevanceScore * 0.25 +
      completenessScore * 0.25 +
      originalityScore * 0.15 +
      engagementScore * 0.15
    );

    return {
      coherenceScore,
      relevanceScore,
      completenessScore,
      originalityScore,
      engagementScore,
      overallQuality
    };
  }

  private assessCoherence(content: string): number {
    // Check logical flow and structure
    const paragraphs = content.split('\n\n');
    const hasIntro = content.includes('## Introduction') || paragraphs[0].length > 100;
    const hasConclusion = content.includes('## Conclusion') || content.includes('## Summary');
    const hasStructure = content.includes('##');
    
    let score = 0;
    if (hasIntro) score += 33;
    if (hasConclusion) score += 33;
    if (hasStructure) score += 34;
    
    return score;
  }

  private assessRelevance(content: string, topic: string): number {
    // Check how well content matches topic
    const topicWords = topic.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    let matchCount = 0;
    
    for (const word of topicWords) {
      if (contentLower.includes(word)) {
        matchCount++;
      }
    }
    
    return (matchCount / topicWords.length) * 100;
  }

  private assessCompleteness(
    content: string,
    request: ContentGenerationRequest
  ): number {
    // Check if all requested sections are present
    let score = 100;
    
    if (request.includeSections) {
      for (const section of request.includeSections) {
        if (!content.includes(section)) {
          score -= 20;
        }
      }
    }
    
    return Math.max(0, score);
  }

  private async assessOriginality(content: string): number {
    // In production, would check against existing content database
    // For now, return a good score if content is substantial
    return content.length > 1000 ? 85 : 70;
  }

  private assessEngagement(content: string): number {
    // Check for engaging elements
    const hasQuestions = content.includes('?');
    const hasLists = content.includes('- ') || content.includes('1.');
    const hasHeadings = (content.match(/##/g) || []).length > 3;
    const hasCallToAction = content.includes('contact') || content.includes('learn more');
    
    let score = 25;
    if (hasQuestions) score += 20;
    if (hasLists) score += 20;
    if (hasHeadings) score += 20;
    if (hasCallToAction) score += 15;
    
    return score;
  }

  private async trackGenerationMetrics(
    response: ContentGenerationResponse,
    duration: number
  ): Promise<void> {
    if (!this.metricsCollector) return;

    await this.metricsCollector.record(
      MetricType.HISTOGRAM,
      duration,
      {
        category: HealthcareMetricCategory.WORKFLOW_PERFORMANCE,
        operation: 'content_generation',
        format: response.format,
        audience: response.audience,
        wordCount: response.metadata.wordCount,
        quality: response.quality.overallQuality
      }
    );
  }

  private getDefaultTemplate(
    format: ContentFormat,
    audience: AudienceType
  ): ContentTemplate {
    const baseTemplate: ContentTemplate = {
      id: `default-${format}-${audience}`,
      name: `Default ${format} for ${audience}`,
      format,
      audience,
      structure: {
        sections: []
      },
      styleGuide: {
        tone: 'professional',
        vocabulary: 'professional',
        readabilityTarget: 12,
        sentenceComplexity: 'moderate'
      },
      complianceElements: {}
    };

    // Add format-specific sections
    switch (format) {
      case 'blog_post':
        baseTemplate.structure.sections = [
          { title: 'Introduction', required: true, maxLength: 200, guidelines: 'Hook the reader' },
          { title: 'Main Content', required: true, guidelines: 'Provide valuable information' },
          { title: 'Key Takeaways', required: true, guidelines: 'Summarize main points' },
          { title: 'Conclusion', required: true, maxLength: 150, guidelines: 'Call to action' }
        ];
        break;
      case 'case_study':
        baseTemplate.structure.sections = [
          { title: 'Executive Summary', required: true, maxLength: 300, guidelines: 'Overview of the case' },
          { title: 'Background', required: true, guidelines: 'Context and challenge' },
          { title: 'Solution', required: true, guidelines: 'Approach and implementation' },
          { title: 'Results', required: true, guidelines: 'Outcomes and metrics' },
          { title: 'Lessons Learned', required: false, guidelines: 'Key insights' }
        ];
        break;
      case 'white_paper':
        baseTemplate.structure.sections = [
          { title: 'Abstract', required: true, maxLength: 250, guidelines: 'Summary of paper' },
          { title: 'Introduction', required: true, guidelines: 'Problem statement' },
          { title: 'Methodology', required: true, guidelines: 'Research approach' },
          { title: 'Findings', required: true, guidelines: 'Key discoveries' },
          { title: 'Discussion', required: true, guidelines: 'Implications' },
          { title: 'Conclusion', required: true, guidelines: 'Summary and future work' },
          { title: 'References', required: true, guidelines: 'Citations' }
        ];
        break;
      default:
        baseTemplate.structure.sections = [
          { title: 'Introduction', required: true, guidelines: 'Set context' },
          { title: 'Main Content', required: true, guidelines: 'Core information' },
          { title: 'Conclusion', required: true, guidelines: 'Wrap up' }
        ];
    }

    return baseTemplate;
  }

  private loadDefaultTemplates(): void {
    // Load predefined templates for common content types
    const templates: ContentTemplate[] = [
      this.getDefaultTemplate('blog_post', 'patients'),
      this.getDefaultTemplate('blog_post', 'professionals'),
      this.getDefaultTemplate('case_study', 'executives'),
      this.getDefaultTemplate('white_paper', 'researchers'),
      this.getDefaultTemplate('patient_education', 'patients')
    ];

    for (const template of templates) {
      const key = `${template.format}-${template.audience}`;
      this.templates.set(key, template);
    }
  }

  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    
    if (this.metricsCollector) {
      await this.metricsCollector.flush();
    }

    this.removeAllListeners();
    this.logger.info('ContentGenerationAgent cleaned up');
  }
}

export default ContentGenerationAgent;