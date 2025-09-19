/**
 * Enhanced Context Manager
 * Integrates all context management components for comprehensive AI assistance
 */

import { createClient } from '@/lib/supabase/client';
import { AssistantContext, AIAssistantConfig } from './AIAssistantCore';
import { RealTimeContextTracker } from './RealTimeContextTracker';
import { CrossPlatformContextSharing } from './CrossPlatformContextSharing';
import { UserPreferenceLearning } from './UserPreferenceLearning';
import { HistoricalContextAwareness } from './HistoricalContextAwareness';
import { DynamicExpertiseDetection } from './DynamicExpertiseDetection';

export interface ContextEvent {
  id: string;
  userId: string;
  sessionId: string;
  eventType: 'page_view' | 'task_start' | 'task_complete' | 'interaction' | 'navigation' | 'search' | 'content_edit';
  timestamp: Date;
  page: string;
  task?: string;
  metadata: {
    duration?: number;
    interactionType?: string;
    contentType?: string;
    searchQuery?: string;
    editType?: string;
    healthcareRelevant: boolean;
    complianceLevel: string;
  };
  contextSnapshot: Partial<AssistantContext>;
}

export interface ContextPattern {
  id: string;
  userId: string;
  patternType: 'workflow' | 'navigation' | 'content' | 'search' | 'compliance';
  frequency: number;
  confidence: number;
  lastSeen: Date;
  metadata: {
    pages: string[];
    tasks: string[];
    timeOfDay: string[];
    dayOfWeek: string[];
    averageDuration: number;
    healthcareRelevance: number;
  };
  suggestions: string[];
}

export interface ContextInsight {
  type: 'efficiency' | 'compliance' | 'workflow' | 'content' | 'collaboration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionable: boolean;
  metadata: Record<string, any>;
}

export interface ContextManagerConfig {
  enableRealTimeTracking: boolean;
  enableCrossPlatformSharing: boolean;
  enablePreferenceLearning: boolean;
  enableHistoricalAnalysis: boolean;
  enableExpertiseDetection: boolean;
  platform: string;
  deviceType: string;
}

export class EnhancedContextManager {
  private supabase = createClient();
  private config: AIAssistantConfig;
  private contextManagerConfig: ContextManagerConfig;
  private realTimeTracker: RealTimeContextTracker;
  private crossPlatformSharing: CrossPlatformContextSharing;
  private preferenceLearning: UserPreferenceLearning;
  private historicalAwareness: HistoricalContextAwareness;
  private expertiseDetection: DynamicExpertiseDetection;
  private isInitialized = false;

  constructor(config: AIAssistantConfig, contextConfig: Partial<ContextManagerConfig> = {}) {
    this.config = config;
    this.contextManagerConfig = {
      enableRealTimeTracking: true,
      enableCrossPlatformSharing: true,
      enablePreferenceLearning: true,
      enableHistoricalAnalysis: true,
      enableExpertiseDetection: true,
      platform: 'web',
      deviceType: 'computer',
      ...contextConfig
    };

    this.initializeComponents();
  }

  /**
   * Initialize all context management components
   */
  private initializeComponents(): void {
    if (this.contextManagerConfig.enableRealTimeTracking) {
      this.realTimeTracker = new RealTimeContextTracker();
    }

    if (this.contextManagerConfig.enableCrossPlatformSharing) {
      this.crossPlatformSharing = new CrossPlatformContextSharing(
        this.contextManagerConfig.platform,
        this.contextManagerConfig.deviceType
      );
    }

    if (this.contextManagerConfig.enablePreferenceLearning) {
      this.preferenceLearning = new UserPreferenceLearning();
    }

    if (this.contextManagerConfig.enableHistoricalAnalysis) {
      this.historicalAwareness = new HistoricalContextAwareness();
    }

    if (this.contextManagerConfig.enableExpertiseDetection) {
      this.expertiseDetection = new DynamicExpertiseDetection();
    }

    this.isInitialized = true;
  }

  /**
   * Start context management
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      this.initializeComponents();
    }

    if (this.realTimeTracker) {
      await this.realTimeTracker.startTracking();
    }

    if (this.crossPlatformSharing) {
      this.crossPlatformSharing.startSync();
    }

    if (this.preferenceLearning) {
      this.preferenceLearning.startLearning();
    }

    if (this.historicalAwareness) {
      this.historicalAwareness.startAnalysis();
    }

    if (this.expertiseDetection) {
      this.expertiseDetection.startAnalysis();
    }
  }

  /**
   * Stop context management
   */
  async stop(): Promise<void> {
    if (this.realTimeTracker) {
      await this.realTimeTracker.stopTracking();
    }

    if (this.crossPlatformSharing) {
      this.crossPlatformSharing.stopSync();
    }

    if (this.preferenceLearning) {
      this.preferenceLearning.stopLearning();
    }

    if (this.historicalAwareness) {
      this.historicalAwareness.stopAnalysis();
    }

    if (this.expertiseDetection) {
      this.expertiseDetection.stopAnalysis();
    }
  }

  /**
   * Track a context event
   */
  async trackEvent(
    eventType: ContextEvent['eventType'],
    page: string,
    context: Partial<AssistantContext>,
    metadata: Partial<ContextEvent['metadata']> = {}
  ): Promise<void> {
    if (this.realTimeTracker) {
      await this.realTimeTracker.trackEvent(eventType, page, context, metadata);
    }

    // Learn from interaction
    if (this.preferenceLearning) {
      await this.preferenceLearning.learnFromInteraction(context.userId || 'anonymous', {
        type: eventType,
        context: {
          page,
          task: context.currentTask,
          medicalContext: context.medicalContext,
          ...metadata
        },
        userAction: context.currentTask || page,
        assistantResponse: '',
        outcome: 'success',
        duration: metadata.duration || 0,
        helpRequested: false,
        advancedFeaturesUsed: []
      });
    }

    // Detect expertise
    if (this.expertiseDetection) {
      await this.expertiseDetection.detectExpertiseFromInteraction(
        context.userId || 'anonymous',
        {
          type: eventType,
          context: {
            page,
            task: context.currentTask,
            medicalContext: context.medicalContext,
            ...metadata
          },
          userAction: context.currentTask || page,
          assistantResponse: '',
          outcome: 'success',
          duration: metadata.duration || 0,
          helpRequested: false,
          advancedFeaturesUsed: []
        }
      );
    }
  }

  /**
   * Track page view
   */
  async trackPageView(page: string, context: Partial<AssistantContext>): Promise<void> {
    await this.trackEvent('page_view', page, context, {
      interactionType: 'navigation'
    });
  }

  /**
   * Track task start
   */
  async trackTaskStart(task: string, page: string, context: Partial<AssistantContext>): Promise<void> {
    await this.trackEvent('task_start', page, context, {
      interactionType: 'task_initiation',
      duration: 0
    });
  }

  /**
   * Track task completion
   */
  async trackTaskComplete(task: string, page: string, context: Partial<AssistantContext>, duration: number): Promise<void> {
    await this.trackEvent('task_complete', page, context, {
      interactionType: 'task_completion',
      duration
    });
  }

  /**
   * Track user interaction
   */
  async trackInteraction(
    interactionType: string,
    page: string,
    context: Partial<AssistantContext>,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent('interaction', page, context, {
      interactionType,
      ...metadata
    });
  }

  /**
   * Track content editing
   */
  async trackContentEdit(
    contentType: string,
    editType: string,
    page: string,
    context: Partial<AssistantContext>
  ): Promise<void> {
    await this.trackEvent('content_edit', page, context, {
      contentType,
      editType
    });
  }

  /**
   * Track search query
   */
  async trackSearch(
    query: string,
    page: string,
    context: Partial<AssistantContext>,
    resultsCount: number = 0
  ): Promise<void> {
    await this.trackEvent('search', page, context, {
      searchQuery: query,
      interactionType: 'search',
      metadata: { resultsCount }
    });
  }

  /**
   * Share context across platforms
   */
  async shareContext(
    userId: string,
    sessionId: string,
    context: AssistantContext,
    sharingRules: any = {}
  ): Promise<any> {
    if (!this.crossPlatformSharing) {
      throw new Error('Cross-platform sharing not enabled');
    }

    return await this.crossPlatformSharing.shareContext(userId, sessionId, context, sharingRules);
  }

  /**
   * Get shared contexts
   */
  async getSharedContexts(userId: string, filters: any = {}): Promise<any[]> {
    if (!this.crossPlatformSharing) {
      return [];
    }

    return await this.crossPlatformSharing.getSharedContexts(userId, filters);
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<any[]> {
    if (!this.preferenceLearning) {
      return [];
    }

    return await this.preferenceLearning.getUserPreferences(userId);
  }

  /**
   * Update user preference
   */
  async updateUserPreference(
    userId: string,
    category: string,
    key: string,
    value: any,
    source: string = 'explicit'
  ): Promise<void> {
    if (!this.preferenceLearning) {
      return;
    }

    await this.preferenceLearning.updateUserPreference(userId, category as any, key, value, source as any);
  }

  /**
   * Get learning patterns
   */
  getLearningPatterns(userId: string): any[] {
    if (!this.preferenceLearning) {
      return [];
    }

    return this.preferenceLearning.getLearningPatterns(userId);
  }

  /**
   * Get adaptation rules
   */
  getAdaptationRules(userId: string): any[] {
    if (!this.preferenceLearning) {
      return [];
    }

    return this.preferenceLearning.getAdaptationRules(userId);
  }

  /**
   * Generate learning insights
   */
  async generateLearningInsights(userId: string): Promise<any[]> {
    if (!this.preferenceLearning) {
      return [];
    }

    return await this.preferenceLearning.generateLearningInsights(userId);
  }

  /**
   * Apply adaptation rules
   */
  async applyAdaptationRules(userId: string, context: Record<string, any>): Promise<Record<string, any>> {
    if (!this.preferenceLearning) {
      return {};
    }

    return await this.preferenceLearning.applyAdaptationRules(userId, context);
  }

  /**
   * Search historical contexts
   */
  async searchHistoricalContexts(userId: string, query: any, limit: number = 10): Promise<any[]> {
    if (!this.historicalAwareness) {
      return [];
    }

    return await this.historicalAwareness.searchHistoricalContexts(userId, query, limit);
  }

  /**
   * Find similar contexts
   */
  async findSimilarContexts(contextId: string, userId: string, limit: number = 5): Promise<any[]> {
    if (!this.historicalAwareness) {
      return [];
    }

    return await this.historicalAwareness.findSimilarContexts(contextId, userId, limit);
  }

  /**
   * Get historical insights
   */
  getHistoricalInsights(userId: string): any[] {
    if (!this.historicalAwareness) {
      return [];
    }

    return this.historicalAwareness.getHistoricalInsights(userId);
  }

  /**
   * Get context timeline
   */
  async getContextTimeline(
    userId: string,
    timeRange: { start: Date; end: Date },
    contextType?: string
  ): Promise<any[]> {
    if (!this.historicalAwareness) {
      return [];
    }

    return await this.historicalAwareness.getContextTimeline(userId, timeRange, contextType as any);
  }

  /**
   * Get expertise level
   */
  async getExpertiseLevel(userId: string, domain: string): Promise<any> {
    if (!this.expertiseDetection) {
      return null;
    }

    return await this.expertiseDetection.getExpertiseLevel(userId, domain as any);
  }

  /**
   * Get expertise adaptation
   */
  async getExpertiseAdaptation(userId: string, domain: string): Promise<any> {
    if (!this.expertiseDetection) {
      return null;
    }

    return await this.expertiseDetection.getExpertiseAdaptation(userId, domain);
  }

  /**
   * Generate learning recommendations
   */
  async generateLearningRecommendations(userId: string, domain: string): Promise<any[]> {
    if (!this.expertiseDetection) {
      return [];
    }

    return await this.expertiseDetection.generateLearningRecommendations(userId, domain);
  }

  /**
   * Update expertise from learning
   */
  async updateExpertiseFromLearning(
    userId: string,
    domain: string,
    learningProgress: any
  ): Promise<void> {
    if (!this.expertiseDetection) {
      return;
    }

    await this.expertiseDetection.updateExpertiseFromLearning(userId, domain, learningProgress);
  }

  /**
   * Get current context patterns
   */
  getContextPatterns(): ContextPattern[] {
    if (!this.realTimeTracker) {
      return [];
    }

    return this.realTimeTracker.getContextPatterns();
  }

  /**
   * Get context insights
   */
  getContextInsights(): ContextInsight[] {
    if (!this.realTimeTracker) {
      return [];
    }

    return this.realTimeTracker.getContextInsights();
  }

  /**
   * Get user behavior summary
   */
  async getUserBehaviorSummary(userId: string, timeRange: { start: Date; end: Date }): Promise<{
    totalEvents: number;
    mostActivePages: Array<{ page: string; count: number }>;
    averageSessionDuration: number;
    workflowEfficiency: number;
    complianceScore: number;
    patterns: ContextPattern[];
  }> {
    if (!this.realTimeTracker) {
      return {
        totalEvents: 0,
        mostActivePages: [],
        averageSessionDuration: 0,
        workflowEfficiency: 0,
        complianceScore: 0,
        patterns: []
      };
    }

    return await this.realTimeTracker.getUserBehaviorSummary(userId, timeRange);
  }

  /**
   * Get comprehensive context analysis
   */
  async getComprehensiveContextAnalysis(userId: string): Promise<{
    realTimeInsights: ContextInsight[];
    historicalInsights: any[];
    learningInsights: any[];
    expertiseLevels: any[];
    preferences: any[];
    patterns: ContextPattern[];
    adaptations: any[];
  }> {
    const [
      realTimeInsights,
      historicalInsights,
      learningInsights,
      preferences,
      patterns,
      adaptations
    ] = await Promise.all([
      this.getContextInsights(),
      this.getHistoricalInsights(userId),
      this.generateLearningInsights(userId),
      this.getUserPreferences(userId),
      this.getContextPatterns(),
      this.getAdaptationRules(userId)
    ]);

    // Get expertise levels for all domains
    const domains = ['general', 'healthcare', 'compliance', 'workflow', 'content', 'technology'];
    const expertiseLevels = await Promise.all(
      domains.map(domain => this.getExpertiseLevel(userId, domain))
    );

    return {
      realTimeInsights,
      historicalInsights,
      learningInsights,
      expertiseLevels: expertiseLevels.filter(level => level !== null),
      preferences,
      patterns,
      adaptations
    };
  }

  /**
   * Store historical context
   */
  async storeHistoricalContext(
    userId: string,
    sessionId: string,
    context: AssistantContext,
    contextType: 'workflow' | 'content' | 'research' | 'compliance' | 'collaboration',
    metadata: any = {}
  ): Promise<any> {
    if (!this.historicalAwareness) {
      return null;
    }

    return await this.historicalAwareness.storeHistoricalContext(
      userId,
      sessionId,
      context,
      contextType,
      metadata
    );
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stop();
    this.isInitialized = false;
  }
}
