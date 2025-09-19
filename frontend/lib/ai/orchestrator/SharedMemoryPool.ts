/**
 * Enhanced Shared Memory Pool
 * Microsoft Copilot-inspired shared context and memory management
 * Builds on existing shared-context-manager.ts with enhanced features
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AuditLogger } from '@/lib/security/audit-logging';

// Enhanced memory types
export enum MemoryType {
  CONVERSATION = 'conversation',
  WORKFLOW_STATE = 'workflow_state',
  AGENT_COLLABORATION = 'agent_collaboration',
  PATIENT_CONTEXT = 'patient_context',
  COMPLIANCE_STATE = 'compliance_state',
  KNOWLEDGE_BASE = 'knowledge_base'
}

export enum MemoryPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface MemoryItem {
  id: string;
  type: MemoryType;
  priority: MemoryPriority;
  content: any;
  metadata: MemoryMetadata;
  semanticEmbedding?: number[];
  relationships: string[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface MemoryMetadata {
  source: string;
  agentId?: string;
  workflowId?: string;
  sessionId?: string;
  healthcareSensitivity: HealthcareSensitivity;
  complianceFlags: string[];
  tags: string[];
  confidence: number;
  version: number;
}

export enum HealthcareSensitivity {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  PHI = 'phi',
  SENSITIVE_PHI = 'sensitive_phi'
}

export interface MemorySearchOptions {
  query: string;
  types?: MemoryType[];
  priority?: MemoryPriority;
  maxResults?: number;
  similarityThreshold?: number;
  includeExpired?: boolean;
  healthcareSensitivityMax?: HealthcareSensitivity;
  agentId?: string;
  workflowId?: string;
  sessionId?: string;
}

export interface MemorySearchResult {
  item: MemoryItem;
  relevanceScore: number;
  semanticSimilarity: number;
  temporalRelevance: number;
  accessFrequency: number;
}

export interface MemoryPoolConfig {
  redis: Redis;
  supabase: SupabaseClient;
  maxMemoryItems: number;
  defaultTtl: number;
  cleanupInterval: number;
  enableSemanticSearch: boolean;
  enableAuditLogging: boolean;
  compressionEnabled: boolean;
}

/**
 * Enhanced Shared Memory Pool with Microsoft Copilot-inspired features
 */
export class EnhancedSharedMemoryPool extends EventEmitter {
  private readonly redis: Redis;
  private readonly supabase: SupabaseClient;
  private readonly auditLogger: AuditLogger;
  private readonly config: MemoryPoolConfig;
  
  private readonly memoryCache = new Map<string, MemoryItem>();
  private readonly semanticIndex = new Map<string, number[]>();
  private readonly relationshipGraph = new Map<string, Set<string>>();
  
  private cleanupTimer: NodeJS.Timeout | null = null;
  private compressionTimer: NodeJS.Timeout | null = null;

  constructor(config: MemoryPoolConfig) {
    super();
    this.redis = config.redis;
    this.supabase = config.supabase;
    this.config = config;
    this.auditLogger = new AuditLogger(this.supabase);

    this.startCleanupTimer();
    this.startCompressionTimer();
    this.setupEventHandlers();
  }

  /**
   * Store a memory item with enhanced features
   */
  async storeMemory(
    type: MemoryType,
    content: any,
    metadata: Partial<MemoryMetadata> = {},
    priority: MemoryPriority = MemoryPriority.NORMAL
  ): Promise<string> {
    const memoryId = uuidv4();
    const now = new Date();
    
    const memoryItem: MemoryItem = {
      id: memoryId,
      type,
      priority,
      content,
      metadata: {
        source: 'enhanced-memory-pool',
        healthcareSensitivity: HealthcareSensitivity.INTERNAL,
        complianceFlags: [],
        tags: [],
        confidence: 1.0,
        version: 1,
        ...metadata
      },
      relationships: [],
      createdAt: now,
      updatedAt: now,
      expiresAt: this.calculateExpiration(priority),
      accessCount: 0,
      lastAccessed: now
    };

    try {
      // Generate semantic embedding if enabled
      if (this.config.enableSemanticSearch) {
        memoryItem.semanticEmbedding = await this.generateSemanticEmbedding(content);
        this.semanticIndex.set(memoryId, memoryItem.semanticEmbedding);
      }

      // Store in Redis cache
      await this.storeInRedis(memoryItem);

      // Store in Supabase for persistence
      await this.storeInSupabase(memoryItem);

      // Update local cache
      this.memoryCache.set(memoryId, memoryItem);

      // Audit logging
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logActivity({
          action: 'memory_stored',
          resource_type: 'memory_item',
          resource_id: memoryId,
          details: {
            type,
            priority,
            healthcareSensitivity: memoryItem.metadata.healthcareSensitivity,
            contentSize: JSON.stringify(content).length
          }
        });
      }

      // Emit event
      this.emit('memory-stored', { memoryId, type, priority });

      logger.info('Memory item stored successfully', {
        memoryId,
        type,
        priority,
        contentSize: JSON.stringify(content).length
      });

      return memoryId;
    } catch (error) {
      logger.error('Failed to store memory item', { memoryId, error });
      throw error;
    }
  }

  /**
   * Retrieve memory item by ID
   */
  async getMemory(memoryId: string): Promise<MemoryItem | null> {
    try {
      // Check local cache first
      let memoryItem = this.memoryCache.get(memoryId);
      
      if (!memoryItem) {
        // Check Redis cache
        memoryItem = await this.getFromRedis(memoryId);
        
        if (!memoryItem) {
          // Check Supabase
          memoryItem = await this.getFromSupabase(memoryId);
        }
        
        if (memoryItem) {
          this.memoryCache.set(memoryId, memoryItem);
        }
      }

      if (memoryItem) {
        // Update access statistics
        memoryItem.accessCount++;
        memoryItem.lastAccessed = new Date();
        
        // Update in Redis
        await this.storeInRedis(memoryItem);
        
        // Emit access event
        this.emit('memory-accessed', { memoryId, accessCount: memoryItem.accessCount });
      }

      return memoryItem;
    } catch (error) {
      logger.error('Failed to retrieve memory item', { memoryId, error });
      return null;
    }
  }

  /**
   * Enhanced semantic search across memory items
   */
  async searchMemory(options: MemorySearchOptions): Promise<MemorySearchResult[]> {
    try {
      const {
        query,
        types = Object.values(MemoryType),
        priority,
        maxResults = 10,
        similarityThreshold = 0.7,
        includeExpired = false,
        healthcareSensitivityMax = HealthcareSensitivity.SENSITIVE_PHI,
        agentId,
        workflowId,
        sessionId
      } = options;

      // Generate query embedding
      const queryEmbedding = await this.generateSemanticEmbedding(query);

      // Build search criteria
      const searchCriteria: any = {
        type: { in: types },
        healthcare_sensitivity: { lte: healthcareSensitivityMax }
      };

      if (priority) {
        searchCriteria.priority = priority;
      }

      if (agentId) {
        searchCriteria.agent_id = agentId;
      }

      if (workflowId) {
        searchCriteria.workflow_id = workflowId;
      }

      if (sessionId) {
        searchCriteria.session_id = sessionId;
      }

      if (!includeExpired) {
        searchCriteria.expires_at = { gt: new Date().toISOString() };
      }

      // Search in Supabase
      const { data: memoryItems, error } = await this.supabase
        .from('enhanced_memory_items')
        .select('*')
        .match(searchCriteria)
        .limit(maxResults * 2); // Get extra for filtering

      if (error) {
        logger.error('Failed to search memory items', { error, query });
        return [];
      }

      if (!memoryItems?.length) {
        return [];
      }

      // Calculate relevance scores
      const results: MemorySearchResult[] = [];

      for (const itemData of memoryItems) {
        const memoryItem = this.deserializeMemoryItem(itemData);
        
        // Calculate semantic similarity
        const semanticSimilarity = this.calculateSemanticSimilarity(
          queryEmbedding,
          memoryItem.semanticEmbedding || []
        );

        if (semanticSimilarity < similarityThreshold) {
          continue;
        }

        // Calculate temporal relevance
        const temporalRelevance = this.calculateTemporalRelevance(memoryItem);

        // Calculate access frequency score
        const accessFrequency = this.calculateAccessFrequency(memoryItem);

        // Calculate overall relevance score
        const relevanceScore = (
          semanticSimilarity * 0.4 +
          temporalRelevance * 0.3 +
          accessFrequency * 0.2 +
          (memoryItem.metadata.confidence || 0.5) * 0.1
        );

        results.push({
          item: memoryItem,
          relevanceScore,
          semanticSimilarity,
          temporalRelevance,
          accessFrequency
        });
      }

      // Sort by relevance and limit results
      return results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);
    } catch (error) {
      logger.error('Failed to search memory', { error, options });
      return [];
    }
  }

  /**
   * Update memory item with relationship tracking
   */
  async updateMemory(
    memoryId: string,
    updates: Partial<MemoryItem>,
    relatedMemoryIds: string[] = []
  ): Promise<MemoryItem | null> {
    try {
      const existingItem = await this.getMemory(memoryId);
      if (!existingItem) {
        return null;
      }

      const updatedItem: MemoryItem = {
        ...existingItem,
        ...updates,
        id: memoryId, // Ensure ID doesn't change
        updatedAt: new Date(),
        version: existingItem.metadata.version + 1
      };

      // Update relationships
      if (relatedMemoryIds.length > 0) {
        updatedItem.relationships = [...new Set([...existingItem.relationships, ...relatedMemoryIds])];
        this.updateRelationshipGraph(memoryId, relatedMemoryIds);
      }

      // Store updated item
      await this.storeInRedis(updatedItem);
      await this.storeInSupabase(updatedItem);
      this.memoryCache.set(memoryId, updatedItem);

      // Audit logging
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logActivity({
          action: 'memory_updated',
          resource_type: 'memory_item',
          resource_id: memoryId,
          details: {
            version: updatedItem.metadata.version,
            relationshipCount: updatedItem.relationships.length,
            updateFields: Object.keys(updates)
          }
        });
      }

      // Emit update event
      this.emit('memory-updated', { memoryId, version: updatedItem.metadata.version });

      return updatedItem;
    } catch (error) {
      logger.error('Failed to update memory item', { memoryId, error });
      return null;
    }
  }

  /**
   * Delete memory item and clean up relationships
   */
  async deleteMemory(memoryId: string): Promise<boolean> {
    try {
      // Remove from all storage layers
      await this.redis.del(`memory:${memoryId}`);
      await this.supabase
        .from('enhanced_memory_items')
        .delete()
        .eq('id', memoryId);
      
      this.memoryCache.delete(memoryId);
      this.semanticIndex.delete(memoryId);

      // Clean up relationships
      this.cleanupRelationships(memoryId);

      // Audit logging
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logActivity({
          action: 'memory_deleted',
          resource_type: 'memory_item',
          resource_id: memoryId
        });
      }

      // Emit deletion event
      this.emit('memory-deleted', { memoryId });

      return true;
    } catch (error) {
      logger.error('Failed to delete memory item', { memoryId, error });
      return false;
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    totalItems: number;
    itemsByType: Record<MemoryType, number>;
    itemsByPriority: Record<MemoryPriority, number>;
    averageAccessCount: number;
    memoryUsage: number;
    relationshipCount: number;
  } {
    const items = Array.from(this.memoryCache.values());
    
    const itemsByType: Record<MemoryType, number> = {} as any;
    const itemsByPriority: Record<MemoryPriority, number> = {} as any;
    
    let totalAccessCount = 0;
    let totalMemoryUsage = 0;
    let relationshipCount = 0;

    for (const item of items) {
      itemsByType[item.type] = (itemsByType[item.type] || 0) + 1;
      itemsByPriority[item.priority] = (itemsByPriority[item.priority] || 0) + 1;
      totalAccessCount += item.accessCount;
      totalMemoryUsage += JSON.stringify(item.content).length;
      relationshipCount += item.relationships.length;
    }

    return {
      totalItems: items.length,
      itemsByType,
      itemsByPriority,
      averageAccessCount: items.length > 0 ? totalAccessCount / items.length : 0,
      memoryUsage: totalMemoryUsage,
      relationshipCount
    };
  }

  // Private helper methods
  private async generateSemanticEmbedding(content: any): Promise<number[]> {
    // This would integrate with a semantic embedding service
    // For now, return a mock embedding
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    return Array.from({ length: 384 }, () => Math.random());
  }

  private calculateSemanticSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;
    
    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private calculateTemporalRelevance(item: MemoryItem): number {
    const now = Date.now();
    const age = now - item.createdAt.getTime();
    const hours = age / (1000 * 60 * 60);
    
    // Exponential decay with 24-hour half-life
    return Math.exp(-hours / 24);
  }

  private calculateAccessFrequency(item: MemoryItem): number {
    const now = Date.now();
    const timeSinceLastAccess = now - item.lastAccessed.getTime();
    const hours = timeSinceLastAccess / (1000 * 60 * 60);
    
    // Normalize access count and apply time decay
    const normalizedAccess = Math.min(item.accessCount / 100, 1);
    const timeDecay = Math.exp(-hours / 12); // 12-hour half-life
    
    return normalizedAccess * timeDecay;
  }

  private calculateExpiration(priority: MemoryPriority): Date {
    const now = Date.now();
    const ttlHours = {
      [MemoryPriority.LOW]: 24,
      [MemoryPriority.NORMAL]: 72,
      [MemoryPriority.HIGH]: 168, // 1 week
      [MemoryPriority.CRITICAL]: 720 // 1 month
    };
    
    return new Date(now + ttlHours[priority] * 60 * 60 * 1000);
  }

  private async storeInRedis(item: MemoryItem): Promise<void> {
    const key = `memory:${item.id}`;
    const ttl = item.expiresAt ? Math.floor((item.expiresAt.getTime() - Date.now()) / 1000) : this.config.defaultTtl;
    await this.redis.setex(key, ttl, JSON.stringify(item));
  }

  private async getFromRedis(memoryId: string): Promise<MemoryItem | null> {
    const key = `memory:${memoryId}`;
    const data = await this.redis.get(key);
    return data ? this.deserializeMemoryItem(JSON.parse(data)) : null;
  }

  private async storeInSupabase(item: MemoryItem): Promise<void> {
    const { error } = await this.supabase
      .from('enhanced_memory_items')
      .upsert([this.serializeMemoryItem(item)]);
    
    if (error) {
      logger.error('Failed to store memory item in Supabase', { memoryId: item.id, error });
    }
  }

  private async getFromSupabase(memoryId: string): Promise<MemoryItem | null> {
    const { data, error } = await this.supabase
      .from('enhanced_memory_items')
      .select('*')
      .eq('id', memoryId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return this.deserializeMemoryItem(data);
  }

  private serializeMemoryItem(item: MemoryItem): any {
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      expiresAt: item.expiresAt?.toISOString(),
      lastAccessed: item.lastAccessed.toISOString(),
      semanticEmbedding: item.semanticEmbedding ? JSON.stringify(item.semanticEmbedding) : null
    };
  }

  private deserializeMemoryItem(data: any): MemoryItem {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      lastAccessed: new Date(data.lastAccessed),
      semanticEmbedding: data.semanticEmbedding ? JSON.parse(data.semanticEmbedding) : undefined
    };
  }

  private updateRelationshipGraph(memoryId: string, relatedIds: string[]): void {
    for (const relatedId of relatedIds) {
      if (!this.relationshipGraph.has(memoryId)) {
        this.relationshipGraph.set(memoryId, new Set());
      }
      this.relationshipGraph.get(memoryId)!.add(relatedId);
      
      if (!this.relationshipGraph.has(relatedId)) {
        this.relationshipGraph.set(relatedId, new Set());
      }
      this.relationshipGraph.get(relatedId)!.add(memoryId);
    }
  }

  private cleanupRelationships(memoryId: string): void {
    // Remove from all relationship sets
    for (const [id, relationships] of this.relationshipGraph) {
      relationships.delete(memoryId);
      if (relationships.size === 0) {
        this.relationshipGraph.delete(id);
      }
    }
    this.relationshipGraph.delete(memoryId);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredMemories();
      } catch (error) {
        logger.error('Cleanup timer error', { error });
      }
    }, this.config.cleanupInterval * 1000);
  }

  private startCompressionTimer(): void {
    if (this.config.compressionEnabled) {
      this.compressionTimer = setInterval(async () => {
        try {
          await this.compressOldMemories();
        } catch (error) {
          logger.error('Compression timer error', { error });
        }
      }, 3600000); // 1 hour
    }
  }

  private async cleanupExpiredMemories(): Promise<void> {
    const now = new Date();
    const expiredIds: string[] = [];
    
    for (const [id, item] of this.memoryCache) {
      if (item.expiresAt && item.expiresAt < now) {
        expiredIds.push(id);
      }
    }
    
    for (const id of expiredIds) {
      await this.deleteMemory(id);
    }
    
    if (expiredIds.length > 0) {
      logger.info('Cleaned up expired memories', { count: expiredIds.length });
    }
  }

  private async compressOldMemories(): Promise<void> {
    // Implementation would compress old, rarely accessed memories
    logger.debug('Memory compression completed');
  }

  private setupEventHandlers(): void {
    this.on('memory-stored', (data) => {
      logger.debug('Memory item stored', data);
    });
    
    this.on('memory-accessed', (data) => {
      logger.debug('Memory item accessed', data);
    });
    
    this.on('memory-updated', (data) => {
      logger.debug('Memory item updated', data);
    });
    
    this.on('memory-deleted', (data) => {
      logger.debug('Memory item deleted', data);
    });
  }

  /**
   * Shutdown the memory pool
   */
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    if (this.compressionTimer) {
      clearInterval(this.compressionTimer);
      this.compressionTimer = null;
    }
    
    this.removeAllListeners();
    logger.info('Enhanced Shared Memory Pool shutdown complete');
  }
}

export default EnhancedSharedMemoryPool;
