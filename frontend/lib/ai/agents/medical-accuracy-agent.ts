/**
 * Medical Accuracy Agent
 * Validates medical content accuracy using PubMed API and healthcare knowledge bases
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

// Medical accuracy validation schemas
const MedicalClaimSchema = z.object({
  claim: z.string(),
  context: z.string().optional(),
  medicalField: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high']).default('medium')
});

const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.object({
    title: z.string(),
    authors: z.array(z.string()),
    journal: z.string(),
    year: z.number(),
    doi: z.string().optional(),
    pmid: z.string().optional(),
    url: z.string().optional(),
    relevanceScore: z.number().min(0).max(1)
  })),
  citations: z.array(z.object({
    text: z.string(),
    source: z.string(),
    page: z.string().optional(),
    paragraph: z.string().optional()
  })),
  warnings: z.array(z.string()),
  recommendations: z.array(z.string()),
  medicalAccuracyScore: z.number().min(0).max(100),
  lastValidated: z.date()
});

const CitationSchema = z.object({
  text: z.string(),
  source: z.string(),
  authors: z.array(z.string()),
  title: z.string(),
  journal: z.string(),
  year: z.number(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  doi: z.string().optional(),
  pmid: z.string().optional(),
  url: z.string().optional()
});

// PubMed API response schema
const PubMedResponseSchema = z.object({
  esearchresult: z.object({
    idlist: z.array(z.string()),
    count: z.string(),
    retmax: z.string(),
    retstart: z.string()
  })
});

const PubMedArticleSchema = z.object({
  uid: z.string(),
  title: z.string(),
  authors: z.array(z.object({
    name: z.string(),
    authtype: z.string().optional()
  })),
  source: z.string(),
  pubdate: z.string(),
  doi: z.string().optional(),
  pmid: z.string(),
  abstract: z.string().optional(),
  keywords: z.array(z.string()).optional()
});

export interface MedicalAccuracyRequest {
  content: string;
  medicalField?: string;
  validationLevel: 'basic' | 'comprehensive' | 'peer-reviewed';
  includeCitations: boolean;
  factCheckRequired: boolean;
  context?: Record<string, unknown>;
}

export interface MedicalAccuracyResponse {
  isValid: boolean;
  confidence: number;
  sources: MedicalSource[];
  citations: Citation[];
  warnings: string[];
  recommendations: string[];
  medicalAccuracyScore: number;
  lastValidated: Date;
  processingTime: number;
  costEstimate: number;
}

export interface MedicalSource {
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  pmid?: string;
  url?: string;
  relevanceScore: number;
}

export interface Citation {
  text: string;
  source: string;
  authors: string[];
  title: string;
  journal: string;
  year: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmid?: string;
  url?: string;
}

export interface MedicalAccuracyConfig {
  pubmedApiKey?: string;
  pubmedBaseUrl: string;
  maxSources: number;
  minRelevanceScore: number;
  validationTimeout: number;
  enableCaching: boolean;
  cacheTtl: number;
}

export class MedicalAccuracyAgent extends BaseAgent {
  private medicalTerminologyCache = new Map<string, any>();
  private validationCache = new Map<string, MedicalAccuracyResponse>();
  private medicalConfig: MedicalAccuracyConfig;

  constructor(options: BaseAgentOptions & { medicalConfig: MedicalAccuracyConfig }) {
    super(options);
    this.medicalConfig = options.medicalConfig;
  }

  async initialize(): Promise<void> {
    this.logActivity('info', 'Initializing Medical Accuracy Agent');
    
    // Validate configuration
    if (!this.medicalConfig.pubmedBaseUrl) {
      throw new Error('PubMed base URL is required for Medical Accuracy Agent');
    }

    // Initialize medical terminology cache
    await this.initializeMedicalTerminologyCache();
    
    this.isInitialized = true;
    this.logActivity('info', 'Medical Accuracy Agent initialized successfully');
  }

  async executeTask(task: WorkflowTask, context: SecurityContext): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      this.currentTask = task;
      this.logActivity('info', `Executing medical accuracy validation task: ${task.id}`);

      // Validate input
      const request = this.validateInput(task.input);
      if (!request) {
        throw new Error('Invalid medical accuracy request format');
      }

      // Validate compliance
      const complianceReport = await this.validateCompliance(request, context);
      if (!complianceReport.isCompliant) {
        throw new Error(`Compliance validation failed: ${complianceReport.violations.join(', ')}`);
      }

      // Execute medical accuracy validation
      const response = await this.validateMedicalAccuracy(request);

      const executionTime = Math.max(Date.now() - startTime, 1);
      this.updateMetrics(executionTime, true, complianceReport.complianceScore < 100 ? 1 : 0);

      this.logActivity('info', `Medical accuracy validation completed in ${executionTime}ms`);

      const result = {
        success: true,
        data: response,
        metadata: {
          executionTime,
          agentId: this.config.id,
          taskId: task.id,
          timestamp: new Date().toISOString()
        }
      };
      
      
      return result;

    } catch (error) {
      const executionTime = Math.max(Date.now() - startTime, 1);
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

  validateInput(input: any): MedicalAccuracyRequest | null {
    try {
      const request = z.object({
        content: z.string().min(1, 'Content cannot be empty'),
        medicalField: z.enum(['cardiology', 'neurology', 'oncology', 'pediatrics', 'orthopedics', 'dermatology', 'psychiatry', 'endocrinology', 'gastroenterology', 'pulmonology']).optional(),
        validationLevel: z.enum(['basic', 'comprehensive', 'peer-reviewed']).default('comprehensive'),
        includeCitations: z.boolean().default(true),
        factCheckRequired: z.boolean().default(true),
        context: z.record(z.unknown()).optional()
      }).parse(input);

      return request as MedicalAccuracyRequest;
    } catch (error) {
      this.logActivity('error', 'Invalid input format for medical accuracy validation', { error });
      return null;
    }
  }

  private async validateMedicalAccuracy(request: MedicalAccuracyRequest): Promise<MedicalAccuracyResponse> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    if (this.medicalConfig.enableCaching && this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey)!;
      this.logActivity('info', 'Using cached validation result');
      return cached;
    }

    // Extract medical claims from content
    const claims = await this.extractMedicalClaims(request.content);
    
    // Validate each claim
    const validationResults = await Promise.all(
      claims.map(claim => this.validateClaim(claim, request.medicalField))
    );

    // If no claims were found, add a warning
    if (claims.length === 0) {
      validationResults.push({
        isValid: false,
        confidence: 0,
        sources: [],
        citations: [],
        warnings: ['No medical claims found in content'],
        recommendations: ['Content may not contain medical information requiring validation'],
        medicalAccuracyScore: 0,
        lastValidated: new Date()
      });
    }

    // Aggregate results
    const aggregatedResult = this.aggregateValidationResults(validationResults, request);

    // Add citations if requested
    if (request.includeCitations) {
      aggregatedResult.citations = await this.generateCitations(aggregatedResult.sources);
    }

    const response: MedicalAccuracyResponse = {
      ...aggregatedResult,
      processingTime: Date.now() - startTime,
      costEstimate: this.calculateCostEstimate(validationResults)
    };


    // Cache result
    if (this.medicalConfig.enableCaching) {
      this.validationCache.set(cacheKey, response);
      // Set cache expiration
      setTimeout(() => {
        this.validationCache.delete(cacheKey);
      }, this.medicalConfig.cacheTtl);
    }

    return response;
  }

  private async extractMedicalClaims(content: string): Promise<string[]> {
    // Simple claim extraction - in production, use NLP libraries
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const medicalKeywords = [
      'treatment', 'diagnosis', 'symptoms', 'medication', 'therapy', 'procedure',
      'disease', 'condition', 'disorder', 'syndrome', 'cancer', 'diabetes',
      'hypertension', 'depression', 'anxiety', 'infection', 'inflammation'
    ];

    return sentences.filter(sentence => 
      medicalKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  private async validateClaim(claim: string, medicalField?: string): Promise<ValidationResultSchema> {
    try {
      // Search PubMed for relevant sources
      const sources = await this.searchPubMed(claim, medicalField);
      
      // Calculate validation metrics
      const confidence = this.calculateConfidence(sources, claim);
      const medicalAccuracyScore = this.calculateMedicalAccuracyScore(sources, claim);
      
      // Generate warnings and recommendations
      const warnings = this.generateWarnings(sources, claim);
      const recommendations = this.generateRecommendations(sources, claim);

      return {
        isValid: confidence > 0.2 && medicalAccuracyScore > 20,
        confidence,
        sources: sources.map(source => ({
          title: source.title,
          authors: source.authors.map(a => a.name),
          journal: source.source,
          year: parseInt(source.pubdate.substring(0, 4)),
          doi: source.doi,
          pmid: source.pmid,
          url: `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`,
          relevanceScore: this.calculateRelevanceScore(source, claim)
        })),
        citations: [],
        warnings,
        recommendations,
        medicalAccuracyScore,
        lastValidated: new Date()
      };
    } catch (error) {
      this.logActivity('error', `Failed to validate claim: ${claim}`, { error });
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isValid: false,
        confidence: 0,
        sources: [],
        citations: [],
        warnings: [`Failed to validate claim: Error: ${errorMessage}`],
        recommendations: ['Manual review required'],
        medicalAccuracyScore: 0,
        lastValidated: new Date()
      };
    }
  }

  private async searchPubMed(query: string, medicalField?: string): Promise<any[]> {
    try {
      const searchQuery = this.buildPubMedQuery(query, medicalField);
      const url = `${this.medicalConfig.pubmedBaseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=${this.medicalConfig.maxSources}&retmode=json`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`PubMed API error: ${response.status}`);
      }

      const data = await response.json();
      const pmids = data.esearchresult?.idlist || [];
      
      if (pmids.length === 0) {
        return [];
      }

      // Fetch article details
      const articleUrl = `${this.medicalConfig.pubmedBaseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
      const articleResponse = await fetch(articleUrl);
      
      if (!articleResponse.ok) {
        throw new Error(`PubMed article fetch error: ${articleResponse.status}`);
      }

      const articleData = await articleResponse.json();
      return articleData.PubmedArticleSet?.PubmedArticle || [];
    } catch (error) {
      this.logActivity('error', 'PubMed search failed', { error, query });
      throw error; // Re-throw the error instead of returning empty array
    }
  }

  private buildPubMedQuery(query: string, medicalField?: string): string {
    let searchQuery = query;
    
    if (medicalField) {
      searchQuery = `${query} AND ${medicalField}[MeSH Terms]`;
    }
    
    // Add filters for recent, peer-reviewed articles
    searchQuery += ' AND "last 5 years"[PDat] AND "journal article"[PT]';
    
    return searchQuery;
  }

  private calculateConfidence(sources: any[], claim: string = ''): number {
    if (sources.length === 0) return 0;
    
    const avgRelevance = sources.reduce((sum, source) => 
      sum + this.calculateRelevanceScore(source, claim), 0) / sources.length;
    
    const recencyBonus = sources.some(source => {
      const year = parseInt(source.pubdate?.substring(0, 4) || '0');
      return year >= new Date().getFullYear() - 2;
    }) ? 0.1 : 0;
    
    return Math.min(1, avgRelevance + recencyBonus);
  }

  private calculateRelevanceScore(source: any, claim: string): number {
    // Simple relevance scoring - in production, use more sophisticated NLP
    const title = source.title?.toLowerCase() || '';
    const abstract = source.abstract?.toLowerCase() || '';
    const keywords = source.keywords?.join(' ').toLowerCase() || '';
    
    const claimWords = claim.toLowerCase().split(/\s+/);
    const sourceText = `${title} ${abstract} ${keywords}`;
    
    const matchingWords = claimWords.filter(word => 
      word.length > 3 && sourceText.includes(word)
    ).length;
    
    return Math.min(1, matchingWords / claimWords.length);
  }

  private calculateMedicalAccuracyScore(sources: any[], claim: string): number {
    if (sources.length === 0) return 0;
    
    const avgRelevance = sources.reduce((sum, source) => 
      sum + this.calculateRelevanceScore(source, claim), 0) / sources.length;
    
    const sourceCountBonus = Math.min(20, sources.length * 5);
    const recencyBonus = sources.some(source => {
      const year = parseInt(source.pubdate?.substring(0, 4) || '0');
      return year >= new Date().getFullYear() - 2;
    }) ? 10 : 0;
    
    return Math.min(100, (avgRelevance * 70) + sourceCountBonus + recencyBonus);
  }

  private generateWarnings(sources: any[], claim: string): string[] {
    const warnings: string[] = [];
    
    if (sources.length === 0) {
      warnings.push('No peer-reviewed sources found for this claim');
    } else if (sources.length < 3) {
      warnings.push('Limited peer-reviewed sources available');
    }
    
    const recentSources = sources.filter(source => {
      const year = parseInt(source.pubdate?.substring(0, 4) || '0');
      return year >= new Date().getFullYear() - 5;
    });
    
    if (recentSources.length === 0) {
      warnings.push('No recent sources (within 5 years) found');
    }
    
    return warnings;
  }

  private generateRecommendations(sources: any[], claim: string): string[] {
    const recommendations: string[] = [];
    
    if (sources.length === 0) {
      recommendations.push('Consider revising or removing this claim');
      recommendations.push('Conduct additional research to find supporting evidence');
    } else if (sources.length < 3) {
      recommendations.push('Seek additional peer-reviewed sources');
    }
    
    const avgRelevance = sources.reduce((sum, source) => 
      sum + this.calculateRelevanceScore(source, claim), 0) / sources.length;
    
    if (avgRelevance < 0.5) {
      recommendations.push('Consider refining the claim to better match available evidence');
    }
    
    return recommendations;
  }

  private aggregateValidationResults(results: ValidationResultSchema[], request: MedicalAccuracyRequest): Omit<MedicalAccuracyResponse, 'processingTime' | 'costEstimate'> {
    const allSources = results.flatMap(r => r.sources);
    const allWarnings = results.flatMap(r => r.warnings);
    const allRecommendations = results.flatMap(r => r.recommendations);
    
    const avgConfidence = results.length > 0 ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length : 0;
    const avgAccuracyScore = results.length > 0 ? results.reduce((sum, r) => sum + r.medicalAccuracyScore, 0) / results.length : 0;
    
    const isValid = results.length > 0 && results.every(r => r.isValid) && avgConfidence > 0.2;
    
    return {
      isValid,
      confidence: avgConfidence,
      sources: allSources,
      citations: [],
      warnings: [...new Set(allWarnings)],
      recommendations: [...new Set(allRecommendations)],
      medicalAccuracyScore: avgAccuracyScore,
      lastValidated: new Date()
    };
  }

  private async generateCitations(sources: MedicalSource[]): Promise<Citation[]> {
    return sources.map(source => ({
      text: `${source.authors.join(', ')} (${source.year}). ${source.title}. ${source.journal}.`,
      source: source.journal,
      authors: source.authors,
      title: source.title,
      journal: source.journal,
      year: source.year,
      doi: source.doi,
      pmid: source.pmid,
      url: source.url
    }));
  }

  private calculateCostEstimate(results: ValidationResultSchema[]): number {
    // Estimate API costs based on number of PubMed searches
    const baseCost = 0.01; // Base cost per search
    const sourceCost = 0.005; // Additional cost per source
    const totalSources = results.reduce((sum, r) => sum + r.sources.length, 0);
    
    return (results.length * baseCost) + (totalSources * sourceCost);
  }

  private generateCacheKey(request: MedicalAccuracyRequest): string {
    const contentHash = Buffer.from(request.content).toString('base64').substring(0, 16);
    return `${request.validationLevel}-${request.medicalField || 'general'}-${contentHash}`;
  }

  private async initializeMedicalTerminologyCache(): Promise<void> {
    // Initialize with common medical terminology
    const commonTerms = [
      'hypertension', 'diabetes', 'cancer', 'depression', 'anxiety', 'infection',
      'inflammation', 'treatment', 'diagnosis', 'symptoms', 'medication', 'therapy'
    ];
    
    for (const term of commonTerms) {
      this.medicalTerminologyCache.set(term, {
        definition: `Medical term: ${term}`,
        lastUpdated: new Date()
      });
    }
  }
}
