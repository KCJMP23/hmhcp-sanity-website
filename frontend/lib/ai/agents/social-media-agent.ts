/**
 * Social Media Agent
 * Platform-specific content adaptation and scheduling for healthcare social media
 */

import { z } from 'zod';
import { BaseAgent, BaseAgentOptions } from './base-agent';
import type {
  AgentConfiguration,
  WorkflowTask,
  TaskResult,
  TaskError,
  SecurityContext,
  ComplianceReport
} from '../../../types/ai/orchestrator';

// Social media platform types
export type SocialPlatform = 'linkedin' | 'twitter' | 'facebook' | 'instagram';

// Social media content schemas
const SocialPostSchema = z.object({
  content: z.string(),
  platform: z.enum(['linkedin', 'twitter', 'facebook', 'instagram']),
  hashtags: z.array(z.string()),
  mediaUrls: z.array(z.string()).optional(),
  scheduledTime: z.date().optional(),
  engagementPrediction: z.object({
    likes: z.number(),
    shares: z.number(),
    comments: z.number(),
    reach: z.number()
  }).optional(),
  complianceStatus: z.object({
    isCompliant: z.boolean(),
    violations: z.array(z.string()),
    recommendations: z.array(z.string())
  }),
  metadata: z.object({
    characterCount: z.number(),
    hashtagCount: z.number(),
    linkCount: z.number(),
    mentionCount: z.number(),
    created: z.date(),
    lastModified: z.date()
  })
});

const PlatformConfigSchema = z.object({
  maxCharacters: z.number(),
  hashtagLimit: z.number(),
  linkLimit: z.number(),
  mentionLimit: z.number(),
  imageLimit: z.number(),
  videoLimit: z.number(),
  allowedFormats: z.array(z.string()),
  requiredElements: z.array(z.string()),
  prohibitedElements: z.array(z.string())
});

export interface SocialMediaRequest {
  content: string;
  platforms: SocialPlatform[];
  includeHashtags: boolean;
  includeEngagementPrediction: boolean;
  scheduleTime?: Date;
  targetAudience?: 'patients' | 'professionals' | 'general' | 'mixed';
  complianceLevel: 'basic' | 'strict' | 'healthcare';
  context?: Record<string, unknown>;
}

export interface SocialMediaResponse {
  posts: SocialPost[];
  totalCost: number;
  processingTime: number;
  complianceReport: ComplianceReport;
  recommendations: string[];
}

export interface SocialPost {
  content: string;
  platform: SocialPlatform;
  hashtags: string[];
  mediaUrls?: string[];
  scheduledTime?: Date;
  engagementPrediction?: {
    likes: number;
    shares: number;
    comments: number;
    reach: number;
  };
  complianceStatus: {
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  };
  metadata: {
    characterCount: number;
    hashtagCount: number;
    linkCount: number;
    mentionCount: number;
    created: Date;
    lastModified: Date;
  };
}

export interface PlatformConfig {
  maxCharacters: number;
  hashtagLimit: number;
  linkLimit: number;
  mentionLimit: number;
  imageLimit: number;
  videoLimit: number;
  allowedFormats: string[];
  requiredElements: string[];
  prohibitedElements: string[];
}

export interface SocialMediaConfig {
  platforms: Record<SocialPlatform, PlatformConfig>;
  hashtagGeneration: {
    enabled: boolean;
    maxHashtags: number;
    healthcareKeywords: string[];
    trendingKeywords: string[];
  };
  scheduling: {
    enabled: boolean;
    optimalTimes: Record<SocialPlatform, string[]>;
    timezone: string;
  };
  compliance: {
    hipaaCompliant: boolean;
    fdaCompliant: boolean;
    ftcCompliant: boolean;
    requiredDisclaimers: string[];
  };
  engagement: {
    predictionEnabled: boolean;
    historicalDataDays: number;
    mlModelPath?: string;
  };
}

export class SocialMediaAgent extends BaseAgent {
  private config: SocialMediaConfig;
  private platformConfigs: Map<SocialPlatform, PlatformConfig>;
  private hashtagCache = new Map<string, string[]>();
  private engagementCache = new Map<string, any>();

  constructor(options: BaseAgentOptions & { socialConfig: SocialMediaConfig }) {
    super(options);
    this.config = options.socialConfig;
    this.platformConfigs = new Map();
    this.initializePlatformConfigs();
  }

  async initialize(): Promise<void> {
    this.logActivity('info', 'Initializing Social Media Agent');
    
    // Validate configuration
    if (!this.config.platforms || Object.keys(this.config.platforms).length === 0) {
      throw new Error('Platform configurations are required for Social Media Agent');
    }

    // Initialize platform configurations
    for (const [platform, config] of Object.entries(this.config.platforms)) {
      this.platformConfigs.set(platform as SocialPlatform, config);
    }

    // Initialize hashtag cache
    await this.initializeHashtagCache();
    
    this.isInitialized = true;
    this.logActivity('info', 'Social Media Agent initialized successfully');
  }

  async executeTask(task: WorkflowTask, context: SecurityContext): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      this.currentTask = task;
      this.logActivity('info', `Executing social media adaptation task: ${task.id}`);

      // Validate input
      const request = this.validateInput(task.input);
      if (!request) {
        throw new Error('Invalid social media request format');
      }

      // Validate compliance
      const complianceReport = await this.validateCompliance(request, context);
      if (!complianceReport.isCompliant) {
        throw new Error(`Compliance validation failed: ${complianceReport.violations.join(', ')}`);
      }

      // Execute social media adaptation
      const response = await this.adaptContentForPlatforms(request);

      const executionTime = Math.max(Date.now() - startTime, 1); // Ensure at least 1ms
      this.updateMetrics(executionTime, true, complianceReport.complianceScore < 100 ? 1 : 0);

      this.logActivity('info', `Social media adaptation completed in ${executionTime}ms`);

      return {
        success: true,
        data: response,
        metadata: {
          executionTime,
          agentId: this.config.id,
          taskId: task.id,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateMetrics(executionTime, false);
      
      const taskError = this.handleError(error as Error, task);
      return {
        success: false,
        error: taskError,
        metadata: {
          executionTime,
          agentId: this.config.id,
          taskId: task.id,
          timestamp: new Date().toISOString()
        }
      };
    } finally {
      this.currentTask = undefined;
    }
  }

  validateInput(input: any): SocialMediaRequest | null {
    try {
      const request = z.object({
        content: z.string().min(1),
        platforms: z.array(z.enum(['linkedin', 'twitter', 'facebook', 'instagram'])).min(1),
        includeHashtags: z.boolean().default(true),
        includeEngagementPrediction: z.boolean().default(false),
        scheduleTime: z.date().optional(),
        targetAudience: z.enum(['patients', 'professionals', 'general', 'mixed']).default('general'),
        complianceLevel: z.enum(['basic', 'strict', 'healthcare']).default('healthcare'),
        context: z.record(z.unknown()).optional()
      }).parse(input);

      return request as SocialMediaRequest;
    } catch (error) {
      this.logActivity('error', 'Invalid input format for social media adaptation', { error });
      return null;
    }
  }

  private async adaptContentForPlatforms(request: SocialMediaRequest): Promise<SocialMediaResponse> {
    const startTime = Date.now();
    const posts: SocialPost[] = [];

    // Process each platform
    for (const platform of request.platforms) {
      const platformConfig = this.platformConfigs.get(platform);
      if (!platformConfig) {
        this.logActivity('warn', `Platform configuration not found: ${platform}`);
        continue;
      }

      const post = await this.adaptContentForPlatform(request, platform, platformConfig);
      posts.push(post);
    }

    // Generate compliance report
    const complianceReport = await this.generateComplianceReport(posts, request);

    // Generate recommendations
    const recommendations = this.generateRecommendations(posts, request);

    return {
      posts,
      totalCost: this.calculateTotalCost(posts),
      processingTime: Date.now() - startTime,
      complianceReport,
      recommendations
    };
  }

  private async adaptContentForPlatform(
    request: SocialMediaRequest, 
    platform: SocialPlatform, 
    config: PlatformConfig
  ): Promise<SocialPost> {
    // Adapt content length
    let adaptedContent = this.adaptContentLength(request.content, config);
    
    // Add platform-specific formatting
    adaptedContent = this.applyPlatformFormatting(adaptedContent, platform);
    
    // Generate hashtags if requested
    const hashtags = request.includeHashtags 
      ? await this.generateHashtags(adaptedContent, platform, request.targetAudience)
      : [];
    
    // Add hashtags to content
    if (hashtags.length > 0) {
      adaptedContent = this.addHashtagsToContent(adaptedContent, hashtags, config);
    }
    
    // Generate engagement prediction if requested
    const engagementPrediction = request.includeEngagementPrediction
      ? await this.predictEngagement(adaptedContent, platform, request.targetAudience)
      : undefined;
    
    // Validate compliance
    const complianceStatus = await this.validatePostCompliance(adaptedContent, platform, request);
    
    // Calculate metadata
    const metadata = this.calculateMetadata(adaptedContent, hashtags);
    
    return {
      content: adaptedContent,
      platform,
      hashtags,
      scheduledTime: request.scheduleTime,
      engagementPrediction,
      complianceStatus,
      metadata
    };
  }

  private adaptContentLength(content: string, config: PlatformConfig): string {
    if (content.length <= config.maxCharacters) {
      return content;
    }

    // Truncate content intelligently
    const truncated = content.substring(0, config.maxCharacters - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > config.maxCharacters * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  private applyPlatformFormatting(content: string, platform: SocialPlatform): string {
    switch (platform) {
      case 'linkedin':
        return this.formatForLinkedIn(content);
      case 'twitter':
        return this.formatForTwitter(content);
      case 'facebook':
        return this.formatForFacebook(content);
      case 'instagram':
        return this.formatForInstagram(content);
      default:
        return content;
    }
  }

  private formatForLinkedIn(content: string): string {
    // LinkedIn prefers professional, structured content
    return content
      .replace(/\n\n+/g, '\n\n') // Normalize line breaks
      .trim();
  }

  private formatForTwitter(content: string): string {
    // Twitter formatting - keep it concise
    return content
      .replace(/\n+/g, ' ') // Convert line breaks to spaces
      .trim();
  }

  private formatForFacebook(content: string): string {
    // Facebook allows more formatting
    return content
      .replace(/\n/g, '\n') // Preserve line breaks
      .trim();
  }

  private formatForInstagram(content: string): string {
    // Instagram formatting with emojis and visual elements
    return content
      .replace(/\n/g, '\n') // Preserve line breaks
      .trim();
  }

  private async generateHashtags(
    content: string, 
    platform: SocialPlatform, 
    targetAudience?: string
  ): Promise<string[]> {
    const cacheKey = `${content}-${platform}-${targetAudience}`;
    
    if (this.hashtagCache.has(cacheKey)) {
      return this.hashtagCache.get(cacheKey)!;
    }

    const hashtags: string[] = [];
    
    // Extract healthcare keywords
    const healthcareKeywords = this.extractHealthcareKeywords(content);
    hashtags.push(...healthcareKeywords);
    
    // Add platform-specific hashtags
    const platformHashtags = this.getPlatformSpecificHashtags(platform, targetAudience);
    hashtags.push(...platformHashtags);
    
    // Add trending hashtags (in production, fetch from API)
    const trendingHashtags = this.getTrendingHashtags(platform);
    hashtags.push(...trendingHashtags);
    
    // Remove duplicates and limit count
    const uniqueHashtags = [...new Set(hashtags)]
      .slice(0, this.config.hashtagGeneration.maxHashtags);
    
    this.hashtagCache.set(cacheKey, uniqueHashtags);
    return uniqueHashtags;
  }

  private extractHealthcareKeywords(content: string): string[] {
    const healthcareTerms = [
      'healthcare', 'medical', 'health', 'wellness', 'treatment', 'diagnosis',
      'patient', 'doctor', 'nurse', 'hospital', 'clinic', 'medicine', 'therapy',
      'prevention', 'care', 'wellness', 'fitness', 'nutrition', 'mental health'
    ];
    
    const keywords: string[] = [];
    const contentLower = content.toLowerCase();
    
    for (const term of healthcareTerms) {
      if (contentLower.includes(term)) {
        keywords.push(`#${term.replace(/\s+/g, '')}`);
      }
    }
    
    return keywords;
  }

  private getPlatformSpecificHashtags(platform: SocialPlatform, targetAudience?: string): string[] {
    const platformHashtags: Record<SocialPlatform, string[]> = {
      linkedin: ['#healthcare', '#medical', '#professional', '#innovation'],
      twitter: ['#health', '#medical', '#healthcare', '#wellness'],
      facebook: ['#healthcare', '#wellness', '#community', '#support'],
      instagram: ['#health', '#wellness', '#lifestyle', '#motivation']
    };
    
    const audienceHashtags: Record<string, string[]> = {
      patients: ['#patientcare', '#wellness', '#healthyliving'],
      professionals: ['#healthcare', '#medical', '#professional'],
      general: ['#health', '#wellness', '#lifestyle'],
      mixed: ['#healthcare', '#wellness', '#community']
    };
    
    const platformTags = platformHashtags[platform] || [];
    const audienceTags = targetAudience ? audienceHashtags[targetAudience] || [] : [];
    
    return [...platformTags, ...audienceTags];
  }

  private getTrendingHashtags(platform: SocialPlatform): string[] {
    // In production, fetch from social media APIs
    const trendingHashtags: Record<SocialPlatform, string[]> = {
      linkedin: ['#healthcareinnovation', '#digitalhealth'],
      twitter: ['#healthtech', '#medtech'],
      facebook: ['#healthcare', '#wellness'],
      instagram: ['#healthylifestyle', '#wellness']
    };
    
    return trendingHashtags[platform] || [];
  }

  private addHashtagsToContent(content: string, hashtags: string[], config: PlatformConfig): string {
    const hashtagString = hashtags.join(' ');
    const availableSpace = config.maxCharacters - content.length - hashtagString.length - 1;
    
    if (availableSpace >= 0) {
      return `${content}\n\n${hashtagString}`;
    }
    
    // If not enough space, add as many hashtags as possible
    let addedHashtags = '';
    for (const hashtag of hashtags) {
      const testString = addedHashtags + ' ' + hashtag;
      if (content.length + testString.length + 1 <= config.maxCharacters) {
        addedHashtags = testString;
      } else {
        break;
      }
    }
    
    return addedHashtags ? `${content}\n\n${addedHashtags}` : content;
  }

  private async predictEngagement(
    content: string, 
    platform: SocialPlatform, 
    targetAudience?: string
  ): Promise<{ likes: number; shares: number; comments: number; reach: number }> {
    const cacheKey = `${content}-${platform}-${targetAudience}`;
    
    if (this.engagementCache.has(cacheKey)) {
      return this.engagementCache.get(cacheKey)!;
    }

    // Simple engagement prediction based on content analysis
    const baseEngagement = this.calculateBaseEngagement(content, platform);
    const audienceMultiplier = this.getAudienceMultiplier(targetAudience);
    const platformMultiplier = this.getPlatformMultiplier(platform);
    
    const prediction = {
      likes: Math.round(baseEngagement.likes * audienceMultiplier * platformMultiplier),
      shares: Math.round(baseEngagement.shares * audienceMultiplier * platformMultiplier),
      comments: Math.round(baseEngagement.comments * audienceMultiplier * platformMultiplier),
      reach: Math.round(baseEngagement.reach * audienceMultiplier * platformMultiplier)
    };
    
    this.engagementCache.set(cacheKey, prediction);
    return prediction;
  }

  private calculateBaseEngagement(content: string, platform: SocialPlatform): {
    likes: number;
    shares: number;
    comments: number;
    reach: number;
  } {
    const length = content.length;
    const hashtagCount = (content.match(/#\w+/g) || []).length;
    const linkCount = (content.match(/https?:\/\/\S+/g) || []).length;
    const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
    
    // Base engagement calculation
    let likes = Math.max(10, Math.min(1000, length * 0.5 + hashtagCount * 5 + emojiCount * 3));
    let shares = Math.max(2, Math.min(200, likes * 0.1 + linkCount * 10));
    let comments = Math.max(1, Math.min(100, likes * 0.05 + hashtagCount * 2));
    let reach = Math.max(50, Math.min(10000, likes * 5 + shares * 20));
    
    return { likes, shares, comments, reach };
  }

  private getAudienceMultiplier(targetAudience?: string): number {
    const multipliers: Record<string, number> = {
      patients: 1.2,
      professionals: 0.8,
      general: 1.0,
      mixed: 1.1
    };
    
    return multipliers[targetAudience || 'general'] || 1.0;
  }

  private getPlatformMultiplier(platform: SocialPlatform): number {
    const multipliers: Record<SocialPlatform, number> = {
      linkedin: 0.7,
      twitter: 1.2,
      facebook: 1.0,
      instagram: 1.3
    };
    
    return multipliers[platform] || 1.0;
  }

  private async validatePostCompliance(
    content: string, 
    platform: SocialPlatform, 
    request: SocialMediaRequest
  ): Promise<{ isCompliant: boolean; violations: string[]; recommendations: string[] }> {
    const violations: string[] = [];
    const recommendations: string[] = [];
    
    // Check for PHI
    if (this.containsPHI(content)) {
      violations.push('Content contains potential PHI');
      recommendations.push('Remove or anonymize personal health information');
    }
    
    // Check for medical claims
    if (this.containsMedicalClaims(content)) {
      if (!this.hasRequiredDisclaimers(content)) {
        violations.push('Medical claims without required disclaimers');
        recommendations.push('Add appropriate medical disclaimers');
      }
    }
    
    // Check platform-specific compliance
    const platformViolations = this.checkPlatformCompliance(content, platform);
    violations.push(...platformViolations);
    
    return {
      isCompliant: violations.length === 0,
      violations,
      recommendations
    };
  }

  private containsPHI(content: string): boolean {
    const phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}\b/i, // Date
      /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i // Day
    ];
    
    return phiPatterns.some(pattern => pattern.test(content));
  }

  private containsMedicalClaims(content: string): boolean {
    // More specific patterns that indicate medical claims rather than general medical information
    const claimPatterns = [
      /\b(?:cure|cures|cured)\s+(?:disease|illness|condition|cancer|diabetes|heart disease)\b/i,
      /\b(?:guarantee|guaranteed|guarantees)\s+(?:cure|treatment|healing|recovery)\b/i,
      /\b(?:miracle|breakthrough|revolutionary)\s+(?:cure|treatment|medicine|drug)\b/i,
      /\b(?:proven|proves|proving)\s+(?:to cure|to treat|to heal|to prevent)\b/i,
      /\b(?:effective|efficacy)\s+(?:against|for)\s+(?:cancer|disease|illness)\b/i,
      /\b(?:treats|heals|prevents)\s+(?:all|every|any)\s+(?:disease|illness|condition)\b/i
    ];
    
    return claimPatterns.some(pattern => pattern.test(content));
  }

  private hasRequiredDisclaimers(content: string): boolean {
    const disclaimers = this.config.compliance.requiredDisclaimers;
    return disclaimers.some(disclaimer => 
      content.toLowerCase().includes(disclaimer.toLowerCase())
    );
  }

  private checkPlatformCompliance(content: string, platform: SocialPlatform): string[] {
    const violations: string[] = [];
    const config = this.platformConfigs.get(platform);
    
    if (!config) return violations;
    
    // Check character limit
    if (content.length > config.maxCharacters) {
      violations.push(`Content exceeds ${platform} character limit`);
    }
    
    // Check hashtag limit
    const hashtagCount = (content.match(/#\w+/g) || []).length;
    if (hashtagCount > config.hashtagLimit) {
      violations.push(`Too many hashtags for ${platform}`);
    }
    
    return violations;
  }

  private calculateMetadata(content: string, hashtags: string[]): {
    characterCount: number;
    hashtagCount: number;
    linkCount: number;
    mentionCount: number;
    created: Date;
    lastModified: Date;
  } {
    const now = new Date();
    
    return {
      characterCount: content.length,
      hashtagCount: hashtags.length,
      linkCount: (content.match(/https?:\/\/\S+/g) || []).length,
      mentionCount: (content.match(/@\w+/g) || []).length,
      created: now,
      lastModified: now
    };
  }

  private async generateComplianceReport(posts: SocialPost[], request: SocialMediaRequest): Promise<ComplianceReport> {
    const totalViolations = posts.reduce((sum, post) => sum + post.complianceStatus.violations.length, 0);
    const compliantPosts = posts.filter(post => post.complianceStatus.isCompliant).length;
    const complianceScore = posts.length > 0 ? (compliantPosts / posts.length) * 100 : 100;
    
    return {
      isCompliant: totalViolations === 0,
      violations: posts.flatMap(post => post.complianceStatus.violations),
      recommendations: posts.flatMap(post => post.complianceStatus.recommendations),
      lastChecked: new Date(),
      complianceScore
    };
  }

  private generateRecommendations(posts: SocialPost[], request: SocialMediaRequest): string[] {
    const recommendations: string[] = [];
    
    // Check for common issues
    const longPosts = posts.filter(post => post.metadata.characterCount > 200);
    if (longPosts.length > 0) {
      recommendations.push('Consider shortening content for better engagement');
    }
    
    const postsWithoutHashtags = posts.filter(post => post.hashtags.length === 0);
    if (postsWithoutHashtags.length > 0) {
      recommendations.push('Add relevant hashtags to increase discoverability');
    }
    
    const nonCompliantPosts = posts.filter(post => !post.complianceStatus.isCompliant);
    if (nonCompliantPosts.length > 0) {
      recommendations.push('Review compliance violations before publishing');
    }
    
    return recommendations;
  }

  private calculateTotalCost(posts: SocialPost[]): number {
    // Simple cost calculation - in production, use actual API costs
    const baseCost = 0.01; // Base cost per post
    const hashtagCost = 0.001; // Additional cost per hashtag
    const engagementCost = 0.005; // Cost for engagement prediction
    
    return posts.reduce((total, post) => {
      let cost = baseCost;
      cost += post.hashtags.length * hashtagCost;
      if (post.engagementPrediction) {
        cost += engagementCost;
      }
      return total + cost;
    }, 0);
  }

  private initializePlatformConfigs(): void {
    // Platform configurations are set in constructor
  }

  private async initializeHashtagCache(): Promise<void> {
    // Initialize with common healthcare hashtags
    const commonHashtags = [
      '#healthcare', '#medical', '#health', '#wellness', '#patientcare',
      '#healthtech', '#medtech', '#digitalhealth', '#healthinnovation'
    ];
    
    for (const hashtag of commonHashtags) {
      this.hashtagCache.set(hashtag, [hashtag]);
    }
  }
}
