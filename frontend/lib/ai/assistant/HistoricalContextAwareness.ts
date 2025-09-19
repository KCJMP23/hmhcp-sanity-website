/**
 * Historical Context Awareness System
 * Maintains and analyzes historical context for better AI assistance
 */

import { createClient } from '@/lib/supabase/client';
import { AssistantContext } from './AIAssistantCore';

export interface HistoricalContext {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  context: AssistantContext;
  contextType: 'workflow' | 'content' | 'research' | 'compliance' | 'collaboration';
  significance: 'low' | 'medium' | 'high' | 'critical';
  metadata: {
    duration: number;
    outcome: 'success' | 'failure' | 'partial' | 'abandoned';
    efficiency: number; // 0-1
    compliance: number; // 0-1
    healthcareRelevance: number; // 0-1
    tags: string[];
    relatedContexts: string[];
  };
}

export interface ContextSimilarity {
  contextId: string;
  similarity: number; // 0-1
  sharedElements: string[];
  differences: string[];
  recommendations: string[];
}

export interface HistoricalInsight {
  type: 'pattern' | 'efficiency' | 'compliance' | 'workflow' | 'content';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  metadata: {
    contextIds: string[];
    timeRange: { start: Date; end: Date };
    frequency: number;
    impact: number;
  };
  suggestions: string[];
}

export interface ContextSearchResult {
  context: HistoricalContext;
  relevance: number;
  matchReason: string;
  suggestions: string[];
}

export class HistoricalContextAwareness {
  private supabase = createClient();
  private contextCache: Map<string, HistoricalContext> = new Map();
  private insightsCache: Map<string, HistoricalInsight> = new Map();
  private analysisInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startAnalysis();
  }

  /**
   * Start historical context analysis
   */
  startAnalysis(): void {
    // Analyze every 10 minutes
    this.analysisInterval = setInterval(() => {
      this.analyzeHistoricalPatterns();
      this.generateHistoricalInsights();
    }, 10 * 60 * 1000);
  }

  /**
   * Stop historical context analysis
   */
  stopAnalysis(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  /**
   * Store historical context
   */
  async storeHistoricalContext(
    userId: string,
    sessionId: string,
    context: AssistantContext,
    contextType: HistoricalContext['contextType'],
    metadata: Partial<HistoricalContext['metadata']> = {}
  ): Promise<HistoricalContext> {
    try {
      const historicalContext: HistoricalContext = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        sessionId,
        timestamp: new Date(),
        context,
        contextType,
        significance: this.calculateSignificance(context, metadata),
        metadata: {
          duration: metadata.duration || 0,
          outcome: metadata.outcome || 'success',
          efficiency: metadata.efficiency || 0.5,
          compliance: metadata.compliance || 0.5,
          healthcareRelevance: this.calculateHealthcareRelevance(context),
          tags: this.generateTags(context, contextType),
          relatedContexts: [],
          ...metadata
        }
      };

      // Store in database
      await this.supabase
        .from('ai_assistant_context_history')
        .insert({
          user_id: userId,
          session_id: sessionId,
          context_snapshot: context,
          context_analysis: {
            contextType,
            significance: historicalContext.significance,
            metadata: historicalContext.metadata,
            timestamp: historicalContext.timestamp.toISOString()
          }
        });

      // Cache locally
      this.contextCache.set(historicalContext.id, historicalContext);

      // Find related contexts
      await this.findRelatedContexts(historicalContext);

      return historicalContext;
    } catch (error) {
      console.error('Failed to store historical context:', error);
      throw error;
    }
  }

  /**
   * Search historical contexts
   */
  async searchHistoricalContexts(
    userId: string,
    query: {
      text?: string;
      contextType?: HistoricalContext['contextType'];
      timeRange?: { start: Date; end: Date };
      significance?: HistoricalContext['significance'];
      tags?: string[];
      healthcareRelevant?: boolean;
      complianceLevel?: string;
    },
    limit: number = 10
  ): Promise<ContextSearchResult[]> {
    try {
      let dbQuery = this.supabase
        .from('ai_assistant_context_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (query.contextType) {
        dbQuery = dbQuery.eq('context_analysis->contextType', query.contextType);
      }

      if (query.timeRange) {
        dbQuery = dbQuery
          .gte('created_at', query.timeRange.start.toISOString())
          .lte('created_at', query.timeRange.end.toISOString());
      }

      if (query.significance) {
        dbQuery = dbQuery.eq('context_analysis->significance', query.significance);
      }

      if (query.healthcareRelevant !== undefined) {
        dbQuery = dbQuery.eq('context_analysis->healthcareRelevant', query.healthcareRelevant);
      }

      if (query.complianceLevel) {
        dbQuery = dbQuery.eq('context_analysis->complianceLevel', query.complianceLevel);
      }

      const { data, error } = await dbQuery;

      if (error) throw error;

      const results: ContextSearchResult[] = [];

      for (const item of data || []) {
        const historicalContext = this.convertToHistoricalContext(item);
        const relevance = this.calculateRelevance(historicalContext, query);
        
        if (relevance > 0.3) { // Only include relevant results
          results.push({
            context: historicalContext,
            relevance,
            matchReason: this.getMatchReason(historicalContext, query),
            suggestions: this.generateSuggestions(historicalContext, query)
          });
        }
      }

      return results.sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('Failed to search historical contexts:', error);
      return [];
    }
  }

  /**
   * Find similar contexts
   */
  async findSimilarContexts(
    contextId: string,
    userId: string,
    limit: number = 5
  ): Promise<ContextSimilarity[]> {
    try {
      const currentContext = this.contextCache.get(contextId);
      if (!currentContext) {
        throw new Error('Context not found');
      }

      // Get other contexts for the user
      const { data, error } = await this.supabase
        .from('ai_assistant_context_history')
        .select('*')
        .eq('user_id', userId)
        .neq('id', contextId)
        .order('created_at', { ascending: false })
        .limit(50); // Get more to find the best matches

      if (error) throw error;

      const similarities: ContextSimilarity[] = [];

      for (const item of data || []) {
        const historicalContext = this.convertToHistoricalContext(item);
        const similarity = this.calculateSimilarity(currentContext, historicalContext);
        
        if (similarity > 0.5) { // Only include similar contexts
          similarities.push({
            contextId: historicalContext.id,
            similarity,
            sharedElements: this.findSharedElements(currentContext, historicalContext),
            differences: this.findDifferences(currentContext, historicalContext),
            recommendations: this.generateSimilarityRecommendations(currentContext, historicalContext)
          });
        }
      }

      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to find similar contexts:', error);
      return [];
    }
  }

  /**
   * Get historical insights
   */
  getHistoricalInsights(userId: string): HistoricalInsight[] {
    return Array.from(this.insightsCache.values()).filter(insight => 
      insight.metadata.contextIds.some(id => 
        this.contextCache.get(id)?.userId === userId
      )
    );
  }

  /**
   * Get context timeline
   */
  async getContextTimeline(
    userId: string,
    timeRange: { start: Date; end: Date },
    contextType?: HistoricalContext['contextType']
  ): Promise<HistoricalContext[]> {
    try {
      let query = this.supabase
        .from('ai_assistant_context_history')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString())
        .order('created_at', { ascending: true });

      if (contextType) {
        query = query.eq('context_analysis->contextType', contextType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => this.convertToHistoricalContext(item));
    } catch (error) {
      console.error('Failed to get context timeline:', error);
      return [];
    }
  }

  /**
   * Analyze historical patterns
   */
  private async analyzeHistoricalPatterns(): Promise<void> {
    try {
      // Get recent contexts for analysis
      const { data, error } = await this.supabase
        .from('ai_assistant_context_history')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by user
      const userGroups = this.groupByUser(data || []);
      
      for (const [userId, contexts] of userGroups) {
        await this.analyzeUserPatterns(userId, contexts);
      }
    } catch (error) {
      console.error('Failed to analyze historical patterns:', error);
    }
  }

  /**
   * Generate historical insights
   */
  private generateHistoricalInsights(): void {
    // Clear old insights
    this.insightsCache.clear();

    // Generate new insights based on cached contexts
    const contexts = Array.from(this.contextCache.values());
    
    // Group by user
    const userGroups = this.groupByUser(contexts.map(c => ({ user_id: c.userId, ...c })));
    
    for (const [userId, userContexts] of userGroups) {
      this.generateUserInsights(userId, userContexts);
    }
  }

  /**
   * Find related contexts
   */
  private async findRelatedContexts(context: HistoricalContext): Promise<void> {
    try {
      const similarContexts = await this.findSimilarContexts(context.id, context.userId, 3);
      
      // Update related contexts
      context.metadata.relatedContexts = similarContexts.map(s => s.contextId);
      
      // Update in database
      await this.supabase
        .from('ai_assistant_context_history')
        .update({
          context_analysis: {
            ...context,
            metadata: context.metadata
          }
        })
        .eq('id', context.id);
    } catch (error) {
      console.error('Failed to find related contexts:', error);
    }
  }

  /**
   * Calculate context significance
   */
  private calculateSignificance(
    context: AssistantContext,
    metadata: Partial<HistoricalContext['metadata']>
  ): HistoricalContext['significance'] {
    let score = 0;

    // Healthcare relevance
    if (context.medicalContext?.complianceLevel === 'hipaa') score += 3;
    if (context.medicalContext?.patientSafety) score += 2;
    if (metadata.healthcareRelevance && metadata.healthcareRelevance > 0.7) score += 2;

    // Efficiency
    if (metadata.efficiency && metadata.efficiency > 0.8) score += 2;
    if (metadata.efficiency && metadata.efficiency < 0.3) score += 1; // Low efficiency is also significant

    // Compliance
    if (metadata.compliance && metadata.compliance > 0.8) score += 2;

    // Duration
    if (metadata.duration && metadata.duration > 3600) score += 1; // Long tasks

    // Outcome
    if (metadata.outcome === 'failure') score += 2;
    if (metadata.outcome === 'success' && metadata.efficiency && metadata.efficiency > 0.8) score += 1;

    if (score >= 5) return 'critical';
    if (score >= 3) return 'high';
    if (score >= 1) return 'medium';
    return 'low';
  }

  /**
   * Calculate healthcare relevance
   */
  private calculateHealthcareRelevance(context: AssistantContext): number {
    let score = 0;

    if (context.medicalContext?.complianceLevel === 'hipaa') score += 0.4;
    if (context.medicalContext?.patientSafety) score += 0.3;
    if (context.medicalContext?.specialty) score += 0.2;
    if (context.currentTask?.toLowerCase().includes('patient')) score += 0.1;
    if (context.currentPage?.toLowerCase().includes('medical')) score += 0.1;

    return Math.min(1, score);
  }

  /**
   * Generate context tags
   */
  private generateTags(
    context: AssistantContext,
    contextType: HistoricalContext['contextType']
  ): string[] {
    const tags: string[] = [];

    // Context type
    tags.push(`type:${contextType}`);

    // Page and task
    if (context.currentPage) tags.push(`page:${context.currentPage}`);
    if (context.currentTask) tags.push(`task:${context.currentTask}`);

    // Medical context
    if (context.medicalContext?.specialty) tags.push(`specialty:${context.medicalContext.specialty}`);
    if (context.medicalContext?.complianceLevel) tags.push(`compliance:${context.medicalContext.complianceLevel}`);

    // User intent
    if (context.userIntent) tags.push(`intent:${context.userIntent}`);

    return tags;
  }

  /**
   * Convert database item to HistoricalContext
   */
  private convertToHistoricalContext(item: any): HistoricalContext {
    return {
      id: item.id,
      userId: item.user_id,
      sessionId: item.session_id,
      timestamp: new Date(item.created_at),
      context: item.context_snapshot,
      contextType: item.context_analysis?.contextType || 'workflow',
      significance: item.context_analysis?.significance || 'medium',
      metadata: {
        duration: item.context_analysis?.metadata?.duration || 0,
        outcome: item.context_analysis?.metadata?.outcome || 'success',
        efficiency: item.context_analysis?.metadata?.efficiency || 0.5,
        compliance: item.context_analysis?.metadata?.compliance || 0.5,
        healthcareRelevance: item.context_analysis?.metadata?.healthcareRelevance || 0,
        tags: item.context_analysis?.metadata?.tags || [],
        relatedContexts: item.context_analysis?.metadata?.relatedContexts || []
      }
    };
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(
    context: HistoricalContext,
    query: any
  ): number {
    let score = 0;

    // Text search
    if (query.text) {
      const searchText = query.text.toLowerCase();
      const contextText = `${context.context.currentPage} ${context.context.currentTask} ${context.context.userIntent}`.toLowerCase();
      
      if (contextText.includes(searchText)) {
        score += 0.4;
      }
    }

    // Context type match
    if (query.contextType && context.contextType === query.contextType) {
      score += 0.3;
    }

    // Significance match
    if (query.significance && context.significance === query.significance) {
      score += 0.2;
    }

    // Healthcare relevance
    if (query.healthcareRelevant && context.metadata.healthcareRelevance > 0.5) {
      score += 0.3;
    }

    // Compliance level
    if (query.complianceLevel && context.context.medicalContext?.complianceLevel === query.complianceLevel) {
      score += 0.2;
    }

    // Tag matches
    if (query.tags && query.tags.length > 0) {
      const tagMatches = query.tags.filter((tag: string) => 
        context.metadata.tags.some(t => t.includes(tag))
      ).length;
      score += (tagMatches / query.tags.length) * 0.2;
    }

    return Math.min(1, score);
  }

  /**
   * Get match reason
   */
  private getMatchReason(context: HistoricalContext, query: any): string {
    const reasons: string[] = [];

    if (query.text) {
      reasons.push('text match');
    }
    if (query.contextType && context.contextType === query.contextType) {
      reasons.push('context type match');
    }
    if (query.healthcareRelevant && context.metadata.healthcareRelevance > 0.5) {
      reasons.push('healthcare relevant');
    }
    if (query.complianceLevel && context.context.medicalContext?.complianceLevel === query.complianceLevel) {
      reasons.push('compliance level match');
    }

    return reasons.join(', ') || 'general relevance';
  }

  /**
   * Generate suggestions
   */
  private generateSuggestions(context: HistoricalContext, query: any): string[] {
    const suggestions: string[] = [];

    if (context.metadata.outcome === 'success' && context.metadata.efficiency > 0.8) {
      suggestions.push('This workflow was successful and efficient - consider applying similar approach');
    }

    if (context.metadata.healthcareRelevance > 0.7) {
      suggestions.push('This context involves healthcare data - ensure compliance measures are in place');
    }

    if (context.metadata.compliance > 0.8) {
      suggestions.push('This context shows good compliance practices - consider as a reference');
    }

    if (context.metadata.duration > 3600) {
      suggestions.push('This was a long-running task - consider breaking it down into smaller steps');
    }

    return suggestions;
  }

  /**
   * Calculate similarity between contexts
   */
  private calculateSimilarity(context1: HistoricalContext, context2: HistoricalContext): number {
    let score = 0;

    // Context type similarity
    if (context1.contextType === context2.contextType) {
      score += 0.3;
    }

    // Page similarity
    if (context1.context.currentPage === context2.context.currentPage) {
      score += 0.2;
    }

    // Task similarity
    if (context1.context.currentTask === context2.context.currentTask) {
      score += 0.2;
    }

    // Medical context similarity
    if (context1.context.medicalContext?.specialty === context2.context.medicalContext?.specialty) {
      score += 0.1;
    }

    if (context1.context.medicalContext?.complianceLevel === context2.context.medicalContext?.complianceLevel) {
      score += 0.1;
    }

    // Tag similarity
    const commonTags = context1.metadata.tags.filter(tag => 
      context2.metadata.tags.includes(tag)
    ).length;
    const totalTags = new Set([...context1.metadata.tags, ...context2.metadata.tags]).size;
    
    if (totalTags > 0) {
      score += (commonTags / totalTags) * 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Find shared elements between contexts
   */
  private findSharedElements(context1: HistoricalContext, context2: HistoricalContext): string[] {
    const shared: string[] = [];

    if (context1.contextType === context2.contextType) {
      shared.push('context type');
    }
    if (context1.context.currentPage === context2.context.currentPage) {
      shared.push('page');
    }
    if (context1.context.currentTask === context2.context.currentTask) {
      shared.push('task');
    }
    if (context1.context.medicalContext?.specialty === context2.context.medicalContext?.specialty) {
      shared.push('medical specialty');
    }

    return shared;
  }

  /**
   * Find differences between contexts
   */
  private findDifferences(context1: HistoricalContext, context2: HistoricalContext): string[] {
    const differences: string[] = [];

    if (context1.context.currentPage !== context2.context.currentPage) {
      differences.push('page');
    }
    if (context1.context.currentTask !== context2.context.currentTask) {
      differences.push('task');
    }
    if (context1.metadata.efficiency !== context2.metadata.efficiency) {
      differences.push('efficiency');
    }
    if (context1.metadata.outcome !== context2.metadata.outcome) {
      differences.push('outcome');
    }

    return differences;
  }

  /**
   * Generate similarity recommendations
   */
  private generateSimilarityRecommendations(
    context1: HistoricalContext,
    context2: HistoricalContext
  ): string[] {
    const recommendations: string[] = [];

    if (context2.metadata.outcome === 'success' && context2.metadata.efficiency > context1.metadata.efficiency) {
      recommendations.push('Consider applying the successful approach from the similar context');
    }

    if (context2.metadata.compliance > context1.metadata.compliance) {
      recommendations.push('The similar context shows better compliance practices');
    }

    if (context2.metadata.duration < context1.metadata.duration) {
      recommendations.push('The similar context was completed faster - consider optimizing workflow');
    }

    return recommendations;
  }

  /**
   * Group data by user
   */
  private groupByUser(data: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    for (const item of data) {
      const userId = item.user_id;
      if (!groups.has(userId)) {
        groups.set(userId, []);
      }
      groups.get(userId)!.push(item);
    }
    
    return groups;
  }

  /**
   * Analyze patterns for a specific user
   */
  private async analyzeUserPatterns(userId: string, contexts: any[]): Promise<void> {
    // Analyze temporal patterns
    this.analyzeTemporalPatterns(userId, contexts);
    
    // Analyze workflow patterns
    this.analyzeWorkflowPatterns(userId, contexts);
    
    // Analyze compliance patterns
    this.analyzeCompliancePatterns(userId, contexts);
  }

  /**
   * Analyze temporal patterns
   */
  private analyzeTemporalPatterns(userId: string, contexts: any[]): void {
    const timeGroups = new Map<string, number>();
    
    contexts.forEach(context => {
      const hour = new Date(context.created_at).getHours();
      const timeSlot = `${Math.floor(hour / 4) * 4}-${Math.floor(hour / 4) * 4 + 4}`;
      timeGroups.set(timeSlot, (timeGroups.get(timeSlot) || 0) + 1);
    });

    const mostActiveTime = Array.from(timeGroups.entries())
      .sort(([,a], [,b]) => b - a)[0];

    if (mostActiveTime && mostActiveTime[1] > 3) {
      const insight: HistoricalInsight = {
        type: 'pattern',
        title: 'Peak Activity Time Detected',
        description: `User is most active during ${mostActiveTime[0]} time slot`,
        confidence: 0.8,
        actionable: true,
        metadata: {
          contextIds: contexts.map(c => c.id),
          timeRange: {
            start: new Date(Math.min(...contexts.map(c => new Date(c.created_at).getTime()))),
            end: new Date(Math.max(...contexts.map(c => new Date(c.created_at).getTime())))
          },
          frequency: mostActiveTime[1],
          impact: 0.7
        },
        suggestions: [
          `Schedule important tasks during ${mostActiveTime[0]} time slot`,
          'Optimize workflows for peak activity time'
        ]
      };

      this.insightsCache.set(`temporal_${userId}`, insight);
    }
  }

  /**
   * Analyze workflow patterns
   */
  private analyzeWorkflowPatterns(userId: string, contexts: any[]): void {
    const workflowTypes = new Map<string, number>();
    
    contexts.forEach(context => {
      const contextType = context.context_analysis?.contextType || 'workflow';
      workflowTypes.set(contextType, (workflowTypes.get(contextType) || 0) + 1);
    });

    const mostCommonWorkflow = Array.from(workflowTypes.entries())
      .sort(([,a], [,b]) => b - a)[0];

    if (mostCommonWorkflow && mostCommonWorkflow[1] > 2) {
      const insight: HistoricalInsight = {
        type: 'workflow',
        title: 'Frequent Workflow Pattern',
        description: `User frequently uses ${mostCommonWorkflow[0]} workflows`,
        confidence: 0.7,
        actionable: true,
        metadata: {
          contextIds: contexts.map(c => c.id),
          timeRange: {
            start: new Date(Math.min(...contexts.map(c => new Date(c.created_at).getTime()))),
            end: new Date(Math.max(...contexts.map(c => new Date(c.created_at).getTime())))
          },
          frequency: mostCommonWorkflow[1],
          impact: 0.6
        },
        suggestions: [
          `Create templates for ${mostCommonWorkflow[0]} workflows`,
          'Optimize workflows for this pattern'
        ]
      };

      this.insightsCache.set(`workflow_${userId}`, insight);
    }
  }

  /**
   * Analyze compliance patterns
   */
  private analyzeCompliancePatterns(userId: string, contexts: any[]): void {
    const complianceLevels = new Map<string, number>();
    
    contexts.forEach(context => {
      const complianceLevel = context.context_analysis?.metadata?.complianceLevel || 'institutional';
      complianceLevels.set(complianceLevel, (complianceLevels.get(complianceLevel) || 0) + 1);
    });

    const hipaaCount = complianceLevels.get('hipaa') || 0;
    
    if (hipaaCount > 0) {
      const insight: HistoricalInsight = {
        type: 'compliance',
        title: 'HIPAA Data Handling Pattern',
        description: `User handles HIPAA-protected data in ${hipaaCount} contexts`,
        confidence: 0.9,
        actionable: true,
        metadata: {
          contextIds: contexts.map(c => c.id),
          timeRange: {
            start: new Date(Math.min(...contexts.map(c => new Date(c.created_at).getTime()))),
            end: new Date(Math.max(...contexts.map(c => new Date(c.created_at).getTime())))
          },
          frequency: hipaaCount,
          impact: 0.9
        },
        suggestions: [
          'Ensure HIPAA compliance measures are consistently applied',
          'Review compliance procedures regularly',
          'Consider additional training for HIPAA data handling'
        ]
      };

      this.insightsCache.set(`compliance_${userId}`, insight);
    }
  }

  /**
   * Generate insights for a specific user
   */
  private generateUserInsights(userId: string, contexts: any[]): void {
    // This method would generate additional insights based on the user's context history
    // Implementation would depend on specific insight generation requirements
  }
}
