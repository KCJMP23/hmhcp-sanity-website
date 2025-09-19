/**
 * Langchain Memory Integration
 * Microsoft Copilot-inspired memory patterns with Langchain integration
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import { AuditLogger } from '@/lib/security/audit-logging';

// Langchain memory types
export interface ConversationMemory {
  id: string;
  sessionId: string;
  messages: ConversationMessage[];
  summary?: string;
  entities: MemoryEntity[];
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: Date;
  updatedAt: Date;
  lastAccessed: Date;
  accessCount: number;
  healthcareSensitivity: HealthcareSensitivity;
  complianceFlags: string[];
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata: MessageMetadata;
  embeddings?: number[];
  entities?: MemoryEntity[];
  intent?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface MemoryEntity {
  id: string;
  type: EntityType;
  value: string;
  confidence: number;
  context: string;
  relationships: string[];
  metadata: Record<string, any>;
}

export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  MEDICAL_TERM = 'medical_term',
  MEDICATION = 'medication',
  CONDITION = 'condition',
  PROCEDURE = 'procedure',
  LOCATION = 'location',
  DATE = 'date',
  TIME = 'time',
  NUMBER = 'number',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  CUSTOM = 'custom'
}

export interface MessageMetadata {
  source: string;
  agentId?: string;
  workflowId?: string;
  taskId?: string;
  complianceLevel: ComplianceLevel;
  encryptionRequired: boolean;
  auditRequired: boolean;
  version: number;
}

export enum HealthcareSensitivity {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  PHI = 'phi',
  SENSITIVE_PHI = 'sensitive_phi'
}

export enum ComplianceLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  RESTRICTED = 'restricted',
  CONFIDENTIAL = 'confidential'
}

export interface MemorySearchOptions {
  query: string;
  sessionId?: string;
  entityTypes?: EntityType[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  dateRange?: { start: Date; end: Date };
  healthcareSensitivityMax?: HealthcareSensitivity;
  maxResults?: number;
  similarityThreshold?: number;
  includeExpired?: boolean;
}

export interface MemorySearchResult {
  conversation: ConversationMemory;
  relevanceScore: number;
  semanticSimilarity: number;
  temporalRelevance: number;
  entityMatches: MemoryEntity[];
  topicMatches: string[];
}

export interface LangchainMemoryConfig {
  redis: Redis;
  supabase: SupabaseClient;
  enableEntityExtraction: boolean;
  enableSentimentAnalysis: boolean;
  enableTopicModeling: boolean;
  enableSemanticSearch: boolean;
  maxConversationLength: number;
  summaryThreshold: number;
  entityConfidenceThreshold: number;
  enableAuditLogging: boolean;
  enableCompression: boolean;
}

/**
 * Langchain Memory Integration for Healthcare AI Orchestration
 */
export class LangchainMemoryIntegration extends EventEmitter {
  private readonly redis: Redis;
  private readonly supabase: SupabaseClient;
  private readonly auditLogger: AuditLogger;
  private readonly config: LangchainMemoryConfig;
  
  private readonly conversationCache = new Map<string, ConversationMemory>();
  private readonly entityIndex = new Map<string, MemoryEntity[]>();
  private readonly topicIndex = new Map<string, string[]>();
  
  private cleanupTimer: NodeJS.Timeout | null = null;
  private compressionTimer: NodeJS.Timeout | null = null;

  constructor(config: LangchainMemoryConfig) {
    super();
    this.redis = config.redis;
    this.supabase = config.supabase;
    this.config = config;
    this.auditLogger = new AuditLogger(this.supabase);

    this.startTimers();
    this.setupEventHandlers();
  }

  /**
   * Create or update conversation memory
   */
  async createConversationMemory(
    sessionId: string,
    messages: ConversationMessage[],
    options: {
      healthcareSensitivity?: HealthcareSensitivity;
      complianceFlags?: string[];
      enableProcessing?: boolean;
    } = {}
  ): Promise<string> {
    const memoryId = uuidv4();
    const now = new Date();

    try {
      // Process messages if enabled
      let processedMessages = messages;
      let entities: MemoryEntity[] = [];
      let topics: string[] = [];
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';

      if (options.enableProcessing !== false) {
        processedMessages = await this.processMessages(messages);
        entities = await this.extractEntities(processedMessages);
        topics = await this.extractTopics(processedMessages);
        sentiment = await this.analyzeSentiment(processedMessages);
      }

      // Create conversation memory
      const conversationMemory: ConversationMemory = {
        id: memoryId,
        sessionId,
        messages: processedMessages,
        entities,
        topics,
        sentiment,
        createdAt: now,
        updatedAt: now,
        lastAccessed: now,
        accessCount: 0,
        healthcareSensitivity: options.healthcareSensitivity || HealthcareSensitivity.INTERNAL,
        complianceFlags: options.complianceFlags || []
      };

      // Generate summary if conversation is long enough
      if (processedMessages.length >= this.config.summaryThreshold) {
        conversationMemory.summary = await this.generateSummary(processedMessages);
      }

      // Store in cache
      this.conversationCache.set(memoryId, conversationMemory);

      // Store in Redis
      await this.storeInRedis(conversationMemory);

      // Store in Supabase
      await this.storeInSupabase(conversationMemory);

      // Update indexes
      this.updateEntityIndex(memoryId, entities);
      this.updateTopicIndex(memoryId, topics);

      // Audit logging
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logActivity({
          action: 'conversation_memory_created',
          resource_type: 'conversation_memory',
          resource_id: memoryId,
          details: {
            sessionId,
            messageCount: messages.length,
            entityCount: entities.length,
            topicCount: topics.length,
            healthcareSensitivity: conversationMemory.healthcareSensitivity
          }
        });
      }

      // Emit event
      this.emit('conversation-memory-created', { memoryId, sessionId, messageCount: messages.length });

      logger.info('Conversation memory created', {
        memoryId,
        sessionId,
        messageCount: messages.length,
        entityCount: entities.length,
        topicCount: topics.length
      });

      return memoryId;
    } catch (error) {
      logger.error('Failed to create conversation memory', { memoryId, sessionId, error });
      throw error;
    }
  }

  /**
   * Add message to existing conversation memory
   */
  async addMessageToConversation(
    memoryId: string,
    message: ConversationMessage
  ): Promise<ConversationMemory | null> {
    try {
      const conversation = await this.getConversationMemory(memoryId);
      if (!conversation) {
        return null;
      }

      // Process message
      const processedMessage = await this.processMessage(message);
      
      // Add to conversation
      conversation.messages.push(processedMessage);
      conversation.updatedAt = new Date();
      conversation.lastAccessed = new Date();
      conversation.accessCount++;

      // Extract entities from new message
      const newEntities = await this.extractEntities([processedMessage]);
      conversation.entities.push(...newEntities);

      // Extract topics from new message
      const newTopics = await this.extractTopics([processedMessage]);
      conversation.topics.push(...newTopics);

      // Update sentiment
      conversation.sentiment = await this.analyzeSentiment(conversation.messages);

      // Regenerate summary if needed
      if (conversation.messages.length >= this.config.summaryThreshold && !conversation.summary) {
        conversation.summary = await this.generateSummary(conversation.messages);
      }

      // Store updated conversation
      await this.storeInRedis(conversation);
      await this.storeInSupabase(conversation);

      // Update indexes
      this.updateEntityIndex(memoryId, newEntities);
      this.updateTopicIndex(memoryId, newTopics);

      // Emit event
      this.emit('message-added', { memoryId, messageId: message.id });

      return conversation;
    } catch (error) {
      logger.error('Failed to add message to conversation', { memoryId, messageId: message.id, error });
      return null;
    }
  }

  /**
   * Get conversation memory by ID
   */
  async getConversationMemory(memoryId: string): Promise<ConversationMemory | null> {
    try {
      // Check cache first
      let conversation = this.conversationCache.get(memoryId);
      
      if (!conversation) {
        // Check Redis
        conversation = await this.getFromRedis(memoryId);
        
        if (!conversation) {
          // Check Supabase
          conversation = await this.getFromSupabase(memoryId);
        }
        
        if (conversation) {
          this.conversationCache.set(memoryId, conversation);
        }
      }

      if (conversation) {
        // Update access statistics
        conversation.lastAccessed = new Date();
        conversation.accessCount++;
        
        // Update in Redis
        await this.storeInRedis(conversation);
      }

      return conversation;
    } catch (error) {
      logger.error('Failed to get conversation memory', { memoryId, error });
      return null;
    }
  }

  /**
   * Search conversation memories
   */
  async searchConversationMemories(options: MemorySearchOptions): Promise<MemorySearchResult[]> {
    try {
      const {
        query,
        sessionId,
        entityTypes = Object.values(EntityType),
        sentiment,
        dateRange,
        healthcareSensitivityMax = HealthcareSensitivity.SENSITIVE_PHI,
        maxResults = 10,
        similarityThreshold = 0.7,
        includeExpired = false
      } = options;

      // Build search criteria
      const searchCriteria: any = {
        healthcare_sensitivity: { lte: healthcareSensitivityMax }
      };

      if (sessionId) {
        searchCriteria.session_id = sessionId;
      }

      if (sentiment) {
        searchCriteria.sentiment = sentiment;
      }

      if (dateRange) {
        searchCriteria.created_at = {
          gte: dateRange.start.toISOString(),
          lte: dateRange.end.toISOString()
        };
      }

      if (!includeExpired) {
        searchCriteria.updated_at = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() };
      }

      // Search in Supabase
      const { data: conversations, error } = await this.supabase
        .from('conversation_memories')
        .select('*')
        .match(searchCriteria)
        .limit(maxResults * 2);

      if (error) {
        logger.error('Failed to search conversation memories', { error, query });
        return [];
      }

      if (!conversations?.length) {
        return [];
      }

      // Calculate relevance scores
      const results: MemorySearchResult[] = [];

      for (const conversationData of conversations) {
        const conversation = this.deserializeConversationMemory(conversationData);
        
        // Calculate semantic similarity
        const semanticSimilarity = await this.calculateSemanticSimilarity(query, conversation);
        
        if (semanticSimilarity < similarityThreshold) {
          continue;
        }

        // Calculate temporal relevance
        const temporalRelevance = this.calculateTemporalRelevance(conversation);

        // Find entity matches
        const entityMatches = conversation.entities.filter(entity => 
          entityTypes.includes(entity.type) && 
          entity.value.toLowerCase().includes(query.toLowerCase())
        );

        // Find topic matches
        const topicMatches = conversation.topics.filter(topic =>
          topic.toLowerCase().includes(query.toLowerCase())
        );

        // Calculate overall relevance score
        const relevanceScore = (
          semanticSimilarity * 0.4 +
          temporalRelevance * 0.2 +
          (entityMatches.length / Math.max(conversation.entities.length, 1)) * 0.2 +
          (topicMatches.length / Math.max(conversation.topics.length, 1)) * 0.2
        );

        results.push({
          conversation,
          relevanceScore,
          semanticSimilarity,
          temporalRelevance,
          entityMatches,
          topicMatches
        });
      }

      // Sort by relevance and limit results
      return results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);
    } catch (error) {
      logger.error('Failed to search conversation memories', { error, options });
      return [];
    }
  }

  /**
   * Get conversation summary
   */
  async getConversationSummary(memoryId: string): Promise<string | null> {
    try {
      const conversation = await this.getConversationMemory(memoryId);
      if (!conversation) {
        return null;
      }

      if (conversation.summary) {
        return conversation.summary;
      }

      // Generate summary if not exists
      if (conversation.messages.length >= this.config.summaryThreshold) {
        conversation.summary = await this.generateSummary(conversation.messages);
        
        // Store updated conversation
        await this.storeInRedis(conversation);
        await this.storeInSupabase(conversation);
      }

      return conversation.summary || null;
    } catch (error) {
      logger.error('Failed to get conversation summary', { memoryId, error });
      return null;
    }
  }

  /**
   * Extract entities from conversation
   */
  async extractEntitiesFromConversation(memoryId: string): Promise<MemoryEntity[]> {
    try {
      const conversation = await this.getConversationMemory(memoryId);
      if (!conversation) {
        return [];
      }

      return conversation.entities;
    } catch (error) {
      logger.error('Failed to extract entities from conversation', { memoryId, error });
      return [];
    }
  }

  /**
   * Get conversation topics
   */
  async getConversationTopics(memoryId: string): Promise<string[]> {
    try {
      const conversation = await this.getConversationMemory(memoryId);
      if (!conversation) {
        return [];
      }

      return conversation.topics;
    } catch (error) {
      logger.error('Failed to get conversation topics', { memoryId, error });
      return [];
    }
  }

  /**
   * Get conversation sentiment
   */
  async getConversationSentiment(memoryId: string): Promise<'positive' | 'neutral' | 'negative' | null> {
    try {
      const conversation = await this.getConversationMemory(memoryId);
      if (!conversation) {
        return null;
      }

      return conversation.sentiment;
    } catch (error) {
      logger.error('Failed to get conversation sentiment', { memoryId, error });
      return null;
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    totalConversations: number;
    totalMessages: number;
    totalEntities: number;
    conversationsBySentiment: Record<string, number>;
    topEntities: Array<{ type: EntityType; count: number }>;
    topTopics: Array<{ topic: string; count: number }>;
  } {
    const conversations = Array.from(this.conversationCache.values());
    
    const conversationsBySentiment: Record<string, number> = {};
    const entityCounts: Record<EntityType, number> = {} as any;
    const topicCounts: Record<string, number> = {};
    
    let totalMessages = 0;
    let totalEntities = 0;

    for (const conversation of conversations) {
      conversationsBySentiment[conversation.sentiment] = 
        (conversationsBySentiment[conversation.sentiment] || 0) + 1;
      
      totalMessages += conversation.messages.length;
      totalEntities += conversation.entities.length;
      
      // Count entities by type
      for (const entity of conversation.entities) {
        entityCounts[entity.type] = (entityCounts[entity.type] || 0) + 1;
      }
      
      // Count topics
      for (const topic of conversation.topics) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    }

    // Get top entities
    const topEntities = Object.entries(entityCounts)
      .map(([type, count]) => ({ type: type as EntityType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get top topics
    const topTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalConversations: conversations.length,
      totalMessages,
      totalEntities,
      conversationsBySentiment,
      topEntities,
      topTopics
    };
  }

  // Private helper methods
  private async processMessages(messages: ConversationMessage[]): Promise<ConversationMessage[]> {
    const processedMessages: ConversationMessage[] = [];
    
    for (const message of messages) {
      const processedMessage = await this.processMessage(message);
      processedMessages.push(processedMessage);
    }
    
    return processedMessages;
  }

  private async processMessage(message: ConversationMessage): Promise<ConversationMessage> {
    const processedMessage = { ...message };
    
    // Generate embeddings if enabled
    if (this.config.enableSemanticSearch) {
      processedMessage.embeddings = await this.generateEmbeddings(message.content);
    }
    
    // Extract entities if enabled
    if (this.config.enableEntityExtraction) {
      processedMessage.entities = await this.extractEntitiesFromMessage(message);
    }
    
    // Analyze intent if enabled
    if (this.config.enableTopicModeling) {
      processedMessage.intent = await this.analyzeIntent(message.content);
    }
    
    // Analyze sentiment if enabled
    if (this.config.enableSentimentAnalysis) {
      processedMessage.sentiment = await this.analyzeMessageSentiment(message.content);
    }
    
    return processedMessage;
  }

  private async extractEntities(messages: ConversationMessage[]): Promise<MemoryEntity[]> {
    const entities: MemoryEntity[] = [];
    
    for (const message of messages) {
      if (message.entities) {
        entities.push(...message.entities);
      } else {
        const messageEntities = await this.extractEntitiesFromMessage(message);
        entities.push(...messageEntities);
      }
    }
    
    return entities;
  }

  private async extractEntitiesFromMessage(message: ConversationMessage): Promise<MemoryEntity[]> {
    // This would integrate with a proper NER service
    // For now, providing a basic implementation
    const entities: MemoryEntity[] = [];
    const text = message.content.toLowerCase();
    
    // Simple entity extraction patterns
    const patterns = {
      [EntityType.PERSON]: /\b(?:dr|doctor|professor|mr|mrs|ms|patient)\s+([a-z]+(?:\s+[a-z]+)*)\b/gi,
      [EntityType.MEDICAL_TERM]: /\b(?:diagnosis|treatment|therapy|surgery|medication|prescription|symptom|condition|disease|disorder)\b/gi,
      [EntityType.MEDICATION]: /\b(?:mg|ml|tablet|capsule|injection|dose|dosage)\b/gi,
      [EntityType.DATE]: /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2}\/\d{4})\b/gi,
      [EntityType.EMAIL]: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
      [EntityType.PHONE]: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/gi
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          entities.push({
            id: uuidv4(),
            type: type as EntityType,
            value: match,
            confidence: 0.8,
            context: message.content,
            relationships: [],
            metadata: { messageId: message.id, timestamp: message.timestamp }
          });
        }
      }
    }
    
    return entities;
  }

  private async extractTopics(messages: ConversationMessage[]): Promise<string[]> {
    // This would integrate with a proper topic modeling service
    // For now, providing a basic implementation
    const topics: string[] = [];
    const text = messages.map(m => m.content).join(' ').toLowerCase();
    
    // Simple topic extraction based on keywords
    const topicKeywords = {
      'healthcare': ['health', 'medical', 'patient', 'doctor', 'hospital', 'clinic'],
      'medication': ['drug', 'medicine', 'prescription', 'dosage', 'side effect'],
      'diagnosis': ['diagnosis', 'symptom', 'condition', 'disease', 'disorder'],
      'treatment': ['treatment', 'therapy', 'surgery', 'procedure', 'recovery'],
      'appointment': ['appointment', 'schedule', 'visit', 'consultation', 'meeting']
    };
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const keywordCount = keywords.filter(keyword => text.includes(keyword)).length;
      if (keywordCount >= 2) {
        topics.push(topic);
      }
    }
    
    return topics;
  }

  private async analyzeSentiment(messages: ConversationMessage[]): Promise<'positive' | 'neutral' | 'negative'> {
    // This would integrate with a proper sentiment analysis service
    // For now, providing a basic implementation
    const text = messages.map(m => m.content).join(' ').toLowerCase();
    
    const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'perfect', 'happy', 'satisfied'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointed', 'frustrated', 'angry', 'sad', 'worried'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) {
      return 'positive';
    } else if (negativeCount > positiveCount) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  private async analyzeMessageSentiment(text: string): Promise<'positive' | 'neutral' | 'negative'> {
    return this.analyzeSentiment([{ content: text } as ConversationMessage]);
  }

  private async analyzeIntent(text: string): Promise<string> {
    // This would integrate with a proper intent classification service
    // For now, providing a basic implementation
    const textLower = text.toLowerCase();
    
    if (textLower.includes('question') || textLower.includes('what') || textLower.includes('how')) {
      return 'question';
    } else if (textLower.includes('help') || textLower.includes('assist')) {
      return 'help_request';
    } else if (textLower.includes('schedule') || textLower.includes('appointment')) {
      return 'scheduling';
    } else if (textLower.includes('medication') || textLower.includes('prescription')) {
      return 'medication_inquiry';
    } else {
      return 'general';
    }
  }

  private async generateSummary(messages: ConversationMessage[]): Promise<string> {
    // This would integrate with a proper summarization service
    // For now, providing a basic implementation
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    return `Conversation with ${userMessages.length} user messages and ${assistantMessages.length} assistant responses. ` +
           `Topics discussed: ${await this.extractTopics(messages).then(topics => topics.join(', '))}`;
  }

  private async generateEmbeddings(text: string): Promise<number[]> {
    // This would integrate with a proper embedding service
    // For now, providing a mock implementation
    return Array.from({ length: 384 }, () => Math.random());
  }

  private async calculateSemanticSimilarity(query: string, conversation: ConversationMemory): Promise<number> {
    // This would use proper semantic similarity calculation
    // For now, providing a basic implementation
    const queryLower = query.toLowerCase();
    const conversationText = conversation.messages.map(m => m.content).join(' ').toLowerCase();
    
    // Simple keyword overlap calculation
    const queryWords = new Set(queryLower.split(/\s+/));
    const conversationWords = new Set(conversationText.split(/\s+/));
    
    const intersection = new Set([...queryWords].filter(x => conversationWords.has(x)));
    const union = new Set([...queryWords, ...conversationWords]);
    
    return intersection.size / union.size;
  }

  private calculateTemporalRelevance(conversation: ConversationMemory): number {
    const now = Date.now();
    const age = now - conversation.updatedAt.getTime();
    const hours = age / (1000 * 60 * 60);
    
    // Exponential decay with 24-hour half-life
    return Math.exp(-hours / 24);
  }

  private updateEntityIndex(memoryId: string, entities: MemoryEntity[]): void {
    this.entityIndex.set(memoryId, entities);
  }

  private updateTopicIndex(memoryId: string, topics: string[]): void {
    this.topicIndex.set(memoryId, topics);
  }

  private async storeInRedis(conversation: ConversationMemory): Promise<void> {
    const key = `conversation:${conversation.id}`;
    const ttl = 7 * 24 * 60 * 60; // 7 days
    await this.redis.setex(key, ttl, JSON.stringify(this.serializeConversationMemory(conversation)));
  }

  private async getFromRedis(memoryId: string): Promise<ConversationMemory | null> {
    const key = `conversation:${memoryId}`;
    const data = await this.redis.get(key);
    return data ? this.deserializeConversationMemory(JSON.parse(data)) : null;
  }

  private async storeInSupabase(conversation: ConversationMemory): Promise<void> {
    const { error } = await this.supabase
      .from('conversation_memories')
      .upsert([this.serializeConversationMemory(conversation)]);
    
    if (error) {
      logger.error('Failed to store conversation memory in Supabase', { memoryId: conversation.id, error });
    }
  }

  private async getFromSupabase(memoryId: string): Promise<ConversationMemory | null> {
    const { data, error } = await this.supabase
      .from('conversation_memories')
      .select('*')
      .eq('id', memoryId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return this.deserializeConversationMemory(data);
  }

  private serializeConversationMemory(conversation: ConversationMemory): any {
    return {
      ...conversation,
      messages: conversation.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
        metadata: {
          ...msg.metadata,
          version: msg.metadata.version || 1
        }
      })),
      entities: conversation.entities.map(entity => ({
        ...entity,
        metadata: entity.metadata || {}
      })),
      created_at: conversation.createdAt.toISOString(),
      updated_at: conversation.updatedAt.toISOString(),
      last_accessed: conversation.lastAccessed.toISOString()
    };
  }

  private deserializeConversationMemory(data: any): ConversationMemory {
    return {
      ...data,
      messages: data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        metadata: {
          ...msg.metadata,
          version: msg.metadata.version || 1
        }
      })),
      entities: data.entities.map((entity: any) => ({
        ...entity,
        metadata: entity.metadata || {}
      })),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      last_accessed: new Date(data.last_accessed)
    };
  }

  private startTimers(): void {
    // Cleanup timer
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredMemories();
      } catch (error) {
        logger.error('Cleanup timer error', { error });
      }
    }, 3600000); // 1 hour

    // Compression timer
    if (this.config.enableCompression) {
      this.compressionTimer = setInterval(async () => {
        try {
          await this.compressOldMemories();
        } catch (error) {
          logger.error('Compression timer error', { error });
        }
      }, 24 * 3600000); // 24 hours
    }
  }

  private async cleanupExpiredMemories(): Promise<void> {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const expiredIds: string[] = [];
    
    for (const [id, conversation] of this.conversationCache) {
      if ((now - conversation.updatedAt.getTime()) > maxAge) {
        expiredIds.push(id);
      }
    }
    
    for (const id of expiredIds) {
      this.conversationCache.delete(id);
      this.entityIndex.delete(id);
      this.topicIndex.delete(id);
    }
    
    if (expiredIds.length > 0) {
      logger.info('Cleaned up expired conversation memories', { count: expiredIds.length });
    }
  }

  private async compressOldMemories(): Promise<void> {
    // Implementation would compress old, rarely accessed memories
    logger.debug('Conversation memory compression completed');
  }

  private setupEventHandlers(): void {
    this.on('conversation-memory-created', (data) => {
      logger.debug('Conversation memory created event', data);
    });
    
    this.on('message-added', (data) => {
      logger.debug('Message added event', data);
    });
  }

  /**
   * Shutdown the memory integration
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
    logger.info('Langchain Memory Integration shutdown complete');
  }
}

export default LangchainMemoryIntegration;
