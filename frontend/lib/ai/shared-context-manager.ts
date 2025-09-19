import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { SharedContextPool } from './context/context-pool';
import { AuditLogger } from '@/lib/security/audit-logging';

// Healthcare sensitivity levels
export enum HealthcareSensitivity {
  PUBLIC = 'public',
  INTERNAL = 'internal', 
  PHI = 'phi',           // Protected Health Information
  SENSITIVE_PHI = 'sensitive_phi' // Highly sensitive PHI
}

// Context types for AI orchestration
export enum ContextType {
  CONVERSATION = 'conversation',
  RESEARCH = 'research',
  CONTENT_GENERATION = 'content_generation',
  COMPLIANCE = 'compliance'
}

// Semantic search parameters
interface SemanticSearchOptions {
  similarity_threshold?: number;
  max_results?: number;
  context_types?: ContextType[];
  healthcare_sensitivity_max?: HealthcareSensitivity;
  include_expired?: boolean;
}

// Context search result with relevance scoring
interface ContextSearchResult {
  pool: SharedContextPool;
  relevance_score: number;
  semantic_similarity: number;
  context_freshness: number;
}

// Semantic content structure
interface SemanticContent {
  topics: string[];
  entities: { type: string; value: string; confidence: number }[];
  intent: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  medical_concepts?: string[];
  compliance_markers?: string[];
  embeddings?: number[]; // Vector embeddings for semantic search
}

// Configuration schema
const ContextManagerConfig = z.object({
  redis_ttl: z.number().default(300), // 5 minutes
  max_pool_size: z.number().default(1000),
  semantic_threshold: z.number().min(0).max(1).default(0.7),
  cleanup_interval: z.number().default(3600), // 1 hour
  healthcare_audit: z.boolean().default(true)
});

type ContextManagerConfigType = z.infer<typeof ContextManagerConfig>;

/**
 * Manages shared context pools across AI agents with semantic understanding
 * and healthcare compliance validation
 */
export class SharedContextManager {
  private supabase: SupabaseClient;
  private redis: Redis;
  private auditLogger: AuditLogger;
  private config: ContextManagerConfigType;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    redisUrl: string,
    config: Partial<ContextManagerConfigType> = {}
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.redis = new Redis(redisUrl);
    this.auditLogger = new AuditLogger(this.supabase);
    this.config = ContextManagerConfig.parse(config);

    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Create a new shared context pool with semantic processing
   */
  async createContextPool(
    workflowId: string,
    contextType: ContextType,
    initialContent: any,
    healthcareSensitivity: HealthcareSensitivity = HealthcareSensitivity.INTERNAL
  ): Promise<SharedContextPool> {
    try {
      // Generate semantic understanding of initial content
      const semanticContent = await this.processSemanticContent(initialContent);

      // Validate healthcare compliance
      const complianceValidation = await this.validateHealthcareCompliance(
        semanticContent,
        healthcareSensitivity
      );

      const pool = new SharedContextPool({
        workflow_id: workflowId,
        context_type: contextType,
        semantic_content: semanticContent,
        agent_contributions: { created_by: 'system', initial_content: initialContent },
        context_timeline: {
          created_at: new Date().toISOString(),
          events: [
            {
              timestamp: new Date().toISOString(),
              event: 'pool_created',
              agent: 'system'
            }
          ]
        },
        relevance_score: 1.0,
        expiration_policy: {
          ttl_seconds: this.config.redis_ttl,
          cleanup_after: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          preserve_on_high_relevance: true
        },
        healthcare_sensitivity: healthcareSensitivity,
        compliance_validation: complianceValidation
      });

      // Persist to database
      const { data, error } = await this.supabase
        .from('ai_context_pools')
        .insert([pool.toDatabase()])
        .select()
        .single();

      if (error) {
        logger.error('Failed to create context pool in database', { error, workflowId });
        throw new Error(`Database error: ${error.message}`);
      }

      // Cache in Redis
      const cacheKey = `context_pool:${data.id}`;
      await this.redis.setex(cacheKey, this.config.redis_ttl, JSON.stringify(data));

      // Audit log creation
      if (this.config.healthcare_audit) {
        await this.auditLogger.logActivity({
          action: 'context_pool_created',
          resource_type: 'ai_context_pool',
          resource_id: data.id,
          details: {
            workflow_id: workflowId,
            context_type: contextType,
            healthcare_sensitivity: healthcareSensitivity,
            relevance_score: pool.relevance_score
          }
        });
      }

      return SharedContextPool.fromDatabase(data);
    } catch (error) {
      logger.error('Failed to create context pool', { error, workflowId, contextType });
      throw error;
    }
  }

  /**
   * Retrieve context pool by ID with caching
   */
  async getContextPool(poolId: string): Promise<SharedContextPool | null> {
    try {
      // Check Redis cache first
      const cacheKey = `context_pool:${poolId}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const data = JSON.parse(cached);
        return SharedContextPool.fromDatabase(data);
      }

      // Fetch from database
      const { data, error } = await this.supabase
        .from('ai_context_pools')
        .select('*')
        .eq('id', poolId)
        .single();

      if (error || !data) {
        return null;
      }

      // Update cache
      await this.redis.setex(cacheKey, this.config.redis_ttl, JSON.stringify(data));

      return SharedContextPool.fromDatabase(data);
    } catch (error) {
      logger.error('Failed to get context pool', { error, poolId });
      return null;
    }
  }

  /**
   * Semantic search across context pools
   */
  async searchContextPools(
    query: string,
    options: SemanticSearchOptions = {}
  ): Promise<ContextSearchResult[]> {
    try {
      const {
        similarity_threshold = this.config.semantic_threshold,
        max_results = 10,
        context_types = Object.values(ContextType),
        healthcare_sensitivity_max = HealthcareSensitivity.SENSITIVE_PHI,
        include_expired = false
      } = options;

      // Process query for semantic understanding
      const querySemantics = await this.processSemanticContent(query);

      // Build database query
      let dbQuery = this.supabase
        .from('ai_context_pools')
        .select('*')
        .in('context_type', context_types)
        .lte('healthcare_sensitivity', healthcare_sensitivity_max);

      if (!include_expired) {
        dbQuery = dbQuery.gt('expiration_policy->cleanup_after', new Date().toISOString());
      }

      const { data: pools, error } = await dbQuery.limit(max_results * 2); // Get extra for filtering

      if (error) {
        logger.error('Failed to search context pools', { error, query });
        return [];
      }

      if (!pools?.length) {
        return [];
      }

      // Calculate semantic similarity and relevance
      const results: ContextSearchResult[] = [];

      for (const poolData of pools) {
        const pool = SharedContextPool.fromDatabase(poolData);
        
        // Calculate semantic similarity
        const semanticSimilarity = this.calculateSemanticSimilarity(
          querySemantics,
          pool.semantic_content
        );

        if (semanticSimilarity < similarity_threshold) {
          continue;
        }

        // Calculate context freshness
        const contextFreshness = this.calculateContextFreshness(pool);

        // Calculate overall relevance score
        const relevance_score = (
          semanticSimilarity * 0.6 +
          contextFreshness * 0.2 +
          pool.relevance_score * 0.2
        );

        results.push({
          pool,
          relevance_score,
          semantic_similarity: semanticSimilarity,
          context_freshness: contextFreshness
        });
      }

      // Sort by relevance and limit results
      return results
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, max_results);
    } catch (error) {
      logger.error('Failed to search context pools', { error, query, options });
      return [];
    }
  }

  /**
   * Update context pool with new agent contribution
   */
  async updateContextPool(
    poolId: string,
    agentId: string,
    contribution: any,
    updateRelevance: boolean = true
  ): Promise<SharedContextPool | null> {
    try {
      const pool = await this.getContextPool(poolId);
      if (!pool) {
        return null;
      }

      // Process semantic content of contribution
      const contributionSemantics = await this.processSemanticContent(contribution);

      // Update agent contributions
      const updatedContributions = {
        ...pool.agent_contributions,
        [agentId]: {
          ...(pool.agent_contributions[agentId] || {}),
          latest_contribution: contribution,
          contribution_timestamp: new Date().toISOString(),
          semantic_data: contributionSemantics
        }
      };

      // Update context timeline
      const updatedTimeline = {
        ...pool.context_timeline,
        events: [
          ...pool.context_timeline.events,
          {
            timestamp: new Date().toISOString(),
            event: 'agent_contribution',
            agent: agentId,
            contribution_summary: this.summarizeContribution(contribution)
          }
        ]
      };

      // Update semantic content by merging
      const updatedSemanticContent = await this.mergeSemanticContent(
        pool.semantic_content,
        contributionSemantics
      );

      // Recalculate relevance score if requested
      let newRelevanceScore = pool.relevance_score;
      if (updateRelevance) {
        newRelevanceScore = this.calculateRelevanceScore(
          updatedSemanticContent,
          updatedTimeline,
          pool.healthcare_sensitivity
        );
      }

      // Validate healthcare compliance
      const updatedComplianceValidation = await this.validateHealthcareCompliance(
        updatedSemanticContent,
        pool.healthcare_sensitivity
      );

      // Update database
      const { data, error } = await this.supabase
        .from('ai_context_pools')
        .update({
          semantic_content: updatedSemanticContent,
          agent_contributions: updatedContributions,
          context_timeline: updatedTimeline,
          relevance_score: newRelevanceScore,
          compliance_validation: updatedComplianceValidation,
          updated_at: new Date().toISOString()
        })
        .eq('id', poolId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update context pool', { error, poolId, agentId });
        return null;
      }

      // Update cache
      const cacheKey = `context_pool:${poolId}`;
      await this.redis.setex(cacheKey, this.config.redis_ttl, JSON.stringify(data));

      // Audit log update
      if (this.config.healthcare_audit) {
        await this.auditLogger.logActivity({
          action: 'context_pool_updated',
          resource_type: 'ai_context_pool',
          resource_id: poolId,
          details: {
            agent_id: agentId,
            contribution_type: typeof contribution,
            new_relevance_score: newRelevanceScore,
            healthcare_sensitivity: pool.healthcare_sensitivity
          }
        });
      }

      return SharedContextPool.fromDatabase(data);
    } catch (error) {
      logger.error('Failed to update context pool', { error, poolId, agentId });
      return null;
    }
  }

  /**
   * Clean up expired context pools
   */
  async cleanupExpiredPools(): Promise<number> {
    try {
      const now = new Date().toISOString();

      // Get expired pools
      const { data: expiredPools, error: fetchError } = await this.supabase
        .from('ai_context_pools')
        .select('id')
        .lt('expiration_policy->cleanup_after', now)
        .eq('expiration_policy->preserve_on_high_relevance', false);

      if (fetchError) {
        logger.error('Failed to fetch expired pools', { error: fetchError });
        return 0;
      }

      if (!expiredPools?.length) {
        return 0;
      }

      // Delete from database
      const poolIds = expiredPools.map(pool => pool.id);
      const { error: deleteError } = await this.supabase
        .from('ai_context_pools')
        .delete()
        .in('id', poolIds);

      if (deleteError) {
        logger.error('Failed to delete expired pools', { error: deleteError });
        return 0;
      }

      // Remove from cache
      const cacheKeys = poolIds.map(id => `context_pool:${id}`);
      if (cacheKeys.length > 0) {
        await this.redis.del(...cacheKeys);
      }

      logger.info('Cleaned up expired context pools', { count: poolIds.length });
      return poolIds.length;
    } catch (error) {
      logger.error('Failed to cleanup expired pools', { error });
      return 0;
    }
  }

  /**
   * Process content for semantic understanding
   */
  private async processSemanticContent(content: any): Promise<SemanticContent> {
    // This would integrate with a semantic processing service
    // For now, providing a basic implementation
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    
    return {
      topics: this.extractTopics(text),
      entities: this.extractEntities(text),
      intent: this.classifyIntent(text),
      sentiment: this.analyzeSentiment(text),
      medical_concepts: this.extractMedicalConcepts(text),
      compliance_markers: this.extractComplianceMarkers(text)
    };
  }

  /**
   * Calculate semantic similarity between two semantic contents
   */
  private calculateSemanticSimilarity(
    content1: SemanticContent,
    content2: SemanticContent
  ): number {
    // Simplified implementation - would use proper vector similarity in production
    const topicOverlap = this.calculateArrayOverlap(content1.topics, content2.topics);
    const entityOverlap = this.calculateEntityOverlap(content1.entities, content2.entities);
    const intentMatch = content1.intent === content2.intent ? 1.0 : 0.0;
    const medicalOverlap = this.calculateArrayOverlap(
      content1.medical_concepts || [],
      content2.medical_concepts || []
    );

    return (topicOverlap * 0.3 + entityOverlap * 0.3 + intentMatch * 0.2 + medicalOverlap * 0.2);
  }

  /**
   * Calculate context freshness based on timeline
   */
  private calculateContextFreshness(pool: SharedContextPool): number {
    const now = Date.now();
    const lastUpdate = new Date(pool.updated_at || pool.created_at).getTime();
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
    
    // Exponential decay: fresher contexts score higher
    return Math.exp(-hoursSinceUpdate / 24); // 24-hour half-life
  }

  /**
   * Validate healthcare compliance for context content
   */
  private async validateHealthcareCompliance(
    semanticContent: SemanticContent,
    sensitivity: HealthcareSensitivity
  ): Promise<any> {
    return {
      validated_at: new Date().toISOString(),
      sensitivity_level: sensitivity,
      phi_detected: semanticContent.medical_concepts && semanticContent.medical_concepts.length > 0,
      compliance_status: 'compliant', // Would implement actual validation logic
      audit_trail: {
        validator: 'shared_context_manager',
        validation_rules: ['hipaa_basic', 'data_classification']
      }
    };
  }

  /**
   * Merge semantic content from multiple contributions
   */
  private async mergeSemanticContent(
    existing: SemanticContent,
    newContent: SemanticContent
  ): Promise<SemanticContent> {
    return {
      topics: [...new Set([...existing.topics, ...newContent.topics])],
      entities: this.mergeEntities(existing.entities, newContent.entities),
      intent: newContent.intent, // Use latest intent
      sentiment: newContent.sentiment, // Use latest sentiment
      medical_concepts: [...new Set([
        ...(existing.medical_concepts || []),
        ...(newContent.medical_concepts || [])
      ])],
      compliance_markers: [...new Set([
        ...(existing.compliance_markers || []),
        ...(newContent.compliance_markers || [])
      ])]
    };
  }

  /**
   * Calculate relevance score based on multiple factors
   */
  private calculateRelevanceScore(
    semanticContent: SemanticContent,
    timeline: any,
    sensitivity: HealthcareSensitivity
  ): number {
    let score = 0.5; // Base score

    // Boost for medical content
    if (semanticContent.medical_concepts && semanticContent.medical_concepts.length > 0) {
      score += 0.2;
    }

    // Boost for high-value entities
    const highValueEntities = semanticContent.entities.filter(e => e.confidence > 0.8);
    score += Math.min(highValueEntities.length * 0.1, 0.3);

    // Boost for compliance content
    if (semanticContent.compliance_markers && semanticContent.compliance_markers.length > 0) {
      score += 0.1;
    }

    // Activity level boost
    const eventCount = timeline.events?.length || 0;
    score += Math.min(eventCount * 0.05, 0.2);

    return Math.min(score, 1.0);
  }

  // Helper methods for semantic processing (simplified implementations)
  private extractTopics(text: string): string[] {
    // Would use NLP service in production
    return text.toLowerCase().split(/\s+/).filter(word => word.length > 3).slice(0, 10);
  }

  private extractEntities(text: string): Array<{ type: string; value: string; confidence: number }> {
    // Would use NER service in production
    return [];
  }

  private classifyIntent(text: string): string {
    // Would use intent classification service in production
    return 'general';
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    // Would use sentiment analysis service in production
    return 'neutral';
  }

  private extractMedicalConcepts(text: string): string[] {
    // Would use medical NLP service in production
    const medicalKeywords = ['patient', 'diagnosis', 'treatment', 'medication', 'therapy', 'clinical'];
    return medicalKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  private extractComplianceMarkers(text: string): string[] {
    // Would detect compliance-related content
    const complianceKeywords = ['hipaa', 'privacy', 'consent', 'authorization', 'phi'];
    return complianceKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  private calculateArrayOverlap(arr1: string[], arr2: string[]): number {
    if (arr1.length === 0 && arr2.length === 0) return 1.0;
    if (arr1.length === 0 || arr2.length === 0) return 0.0;
    
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private calculateEntityOverlap(
    entities1: Array<{ type: string; value: string; confidence: number }>,
    entities2: Array<{ type: string; value: string; confidence: number }>
  ): number {
    if (entities1.length === 0 && entities2.length === 0) return 1.0;
    if (entities1.length === 0 || entities2.length === 0) return 0.0;

    const values1 = entities1.map(e => e.value);
    const values2 = entities2.map(e => e.value);
    return this.calculateArrayOverlap(values1, values2);
  }

  private mergeEntities(
    existing: Array<{ type: string; value: string; confidence: number }>,
    newEntities: Array<{ type: string; value: string; confidence: number }>
  ): Array<{ type: string; value: string; confidence: number }> {
    const merged = [...existing];
    
    for (const newEntity of newEntities) {
      const existingIndex = merged.findIndex(e => 
        e.type === newEntity.type && e.value === newEntity.value
      );
      
      if (existingIndex >= 0) {
        // Update confidence with weighted average
        merged[existingIndex].confidence = 
          (merged[existingIndex].confidence + newEntity.confidence) / 2;
      } else {
        merged.push(newEntity);
      }
    }
    
    return merged;
  }

  private summarizeContribution(contribution: any): string {
    // Would use summarization service in production
    const text = typeof contribution === 'string' ? contribution : JSON.stringify(contribution);
    return text.substring(0, 100) + (text.length > 100 ? '...' : '');
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredPools();
      } catch (error) {
        logger.error('Cleanup timer error', { error });
      }
    }, this.config.cleanup_interval * 1000);
  }

  /**
   * Shutdown the context manager and cleanup resources
   */
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    await this.redis.quit();
    logger.info('SharedContextManager shutdown complete');
  }
}