/**
 * Real-Time Context Tracker
 * Tracks user behavior, page interactions, and workflow patterns in real-time
 */

import { createClient } from '@/lib/supabase/client';
import { AssistantContext } from './AIAssistantCore';

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

export class RealTimeContextTracker {
  private supabase = createClient();
  private isTracking = false;
  private currentSessionId: string | null = null;
  private eventQueue: ContextEvent[] = [];
  private patterns: Map<string, ContextPattern> = new Map();
  private insights: ContextInsight[] = [];
  private trackingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startTracking();
  }

  /**
   * Start real-time context tracking
   */
  async startTracking(): Promise<void> {
    if (this.isTracking) return;

    this.isTracking = true;
    
    // Start periodic pattern analysis
    this.trackingInterval = setInterval(() => {
      this.analyzePatterns();
      this.generateInsights();
      this.flushEventQueue();
    }, 30000); // Every 30 seconds

    // Track page visibility changes
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
    }
  }

  /**
   * Stop real-time context tracking
   */
  async stopTracking(): Promise<void> {
    this.isTracking = false;
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    // Flush remaining events
    await this.flushEventQueue();
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
    if (!this.isTracking) return;

    const event: ContextEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: context.userId || 'anonymous',
      sessionId: this.currentSessionId || `session_${Date.now()}`,
      eventType,
      timestamp: new Date(),
      page,
      task: context.currentTask,
      metadata: {
        healthcareRelevant: this.isHealthcareRelevant(page, context.currentTask || ''),
        complianceLevel: context.medicalContext?.complianceLevel || 'institutional',
        ...metadata
      },
      contextSnapshot: context
    };

    this.eventQueue.push(event);

    // Process event immediately for critical events
    if (['task_complete', 'content_edit'].includes(eventType)) {
      await this.processEvent(event);
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
   * Get current context patterns
   */
  getContextPatterns(): ContextPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get context insights
   */
  getContextInsights(): ContextInsight[] {
    return [...this.insights];
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
    try {
      const { data: events, error } = await this.supabase
        .from('ai_assistant_learning_data')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString());

      if (error) throw error;

      const pageCounts = new Map<string, number>();
      let totalDuration = 0;
      let sessionCount = 0;
      let complianceEvents = 0;

      events?.forEach(event => {
        const data = event.context_data as any;
        if (data.page) {
          pageCounts.set(data.page, (pageCounts.get(data.page) || 0) + 1);
        }
        if (data.duration) {
          totalDuration += data.duration;
          sessionCount++;
        }
        if (data.complianceLevel && data.complianceLevel !== 'institutional') {
          complianceEvents++;
        }
      });

      const mostActivePages = Array.from(pageCounts.entries())
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalEvents: events?.length || 0,
        mostActivePages,
        averageSessionDuration: sessionCount > 0 ? totalDuration / sessionCount : 0,
        workflowEfficiency: this.calculateWorkflowEfficiency(events || []),
        complianceScore: events?.length ? (complianceEvents / events.length) * 100 : 0,
        patterns: this.getContextPatterns()
      };
    } catch (error) {
      console.error('Failed to get user behavior summary:', error);
      return {
        totalEvents: 0,
        mostActivePages: [],
        averageSessionDuration: 0,
        workflowEfficiency: 0,
        complianceScore: 0,
        patterns: []
      };
    }
  }

  /**
   * Process a context event
   */
  private async processEvent(event: ContextEvent): Promise<void> {
    try {
      // Store event in database
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: event.userId,
          session_id: event.sessionId,
          interaction_type: event.eventType,
          user_input: event.task || event.page,
          assistant_response: null,
          context_data: {
            page: event.page,
            task: event.task,
            metadata: event.metadata,
            timestamp: event.timestamp.toISOString()
          },
          learning_insights: {
            healthcareRelevant: event.metadata.healthcareRelevant,
            complianceLevel: event.metadata.complianceLevel
          }
        });

      // Update patterns
      this.updatePatterns(event);

    } catch (error) {
      console.error('Failed to process context event:', error);
    }
  }

  /**
   * Update context patterns based on events
   */
  private updatePatterns(event: ContextEvent): void {
    const patternKey = `${event.userId}_${event.eventType}`;
    const existingPattern = this.patterns.get(patternKey);

    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastSeen = event.timestamp;
      existingPattern.metadata.pages.push(event.page);
      if (event.task) {
        existingPattern.metadata.tasks.push(event.task);
      }
    } else {
      const newPattern: ContextPattern = {
        id: patternKey,
        userId: event.userId,
        patternType: this.getPatternType(event.eventType),
        frequency: 1,
        confidence: 0.5,
        lastSeen: event.timestamp,
        metadata: {
          pages: [event.page],
          tasks: event.task ? [event.task] : [],
          timeOfDay: [event.timestamp.getHours().toString()],
          dayOfWeek: [event.timestamp.getDay().toString()],
          averageDuration: 0,
          healthcareRelevance: event.metadata.healthcareRelevant ? 1 : 0
        },
        suggestions: []
      };
      this.patterns.set(patternKey, newPattern);
    }
  }

  /**
   * Analyze patterns and generate insights
   */
  private async analyzePatterns(): Promise<void> {
    for (const [key, pattern] of this.patterns.entries()) {
      // Calculate confidence based on frequency and recency
      const daysSinceLastSeen = (Date.now() - pattern.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
      pattern.confidence = Math.max(0, 1 - (daysSinceLastSeen / 30)) * Math.min(1, pattern.frequency / 10);

      // Generate suggestions based on patterns
      pattern.suggestions = this.generatePatternSuggestions(pattern);
    }
  }

  /**
   * Generate context insights
   */
  private generateInsights(): void {
    this.insights = [];

    // Efficiency insights
    const efficiencyInsight = this.generateEfficiencyInsight();
    if (efficiencyInsight) {
      this.insights.push(efficiencyInsight);
    }

    // Compliance insights
    const complianceInsight = this.generateComplianceInsight();
    if (complianceInsight) {
      this.insights.push(complianceInsight);
    }

    // Workflow insights
    const workflowInsight = this.generateWorkflowInsight();
    if (workflowInsight) {
      this.insights.push(workflowInsight);
    }
  }

  /**
   * Flush event queue to database
   */
  private async flushEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToProcess = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of eventsToProcess) {
      await this.processEvent(event);
    }
  }

  /**
   * Handle page visibility change
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Page is hidden, pause tracking
      this.pauseTracking();
    } else {
      // Page is visible, resume tracking
      this.resumeTracking();
    }
  }

  /**
   * Handle page unload
   */
  private handlePageUnload(): void {
    this.flushEventQueue();
  }

  /**
   * Pause tracking
   */
  private pauseTracking(): void {
    // Implementation for pausing tracking
  }

  /**
   * Resume tracking
   */
  private resumeTracking(): void {
    // Implementation for resuming tracking
  }

  /**
   * Check if content is healthcare relevant
   */
  private isHealthcareRelevant(page: string, task: string): boolean {
    const healthcareKeywords = [
      'patient', 'medical', 'clinical', 'healthcare', 'diagnosis', 'treatment',
      'therapy', 'medication', 'surgery', 'nursing', 'physician', 'doctor'
    ];
    
    const text = `${page} ${task}`.toLowerCase();
    return healthcareKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Get pattern type from event type
   */
  private getPatternType(eventType: string): ContextPattern['patternType'] {
    switch (eventType) {
      case 'page_view':
      case 'navigation':
        return 'navigation';
      case 'task_start':
      case 'task_complete':
        return 'workflow';
      case 'content_edit':
        return 'content';
      case 'search':
        return 'search';
      default:
        return 'workflow';
    }
  }

  /**
   * Generate pattern-based suggestions
   */
  private generatePatternSuggestions(pattern: ContextPattern): string[] {
    const suggestions: string[] = [];

    if (pattern.patternType === 'workflow' && pattern.frequency > 5) {
      suggestions.push('Consider creating a template for this frequent workflow');
    }

    if (pattern.metadata.healthcareRelevance > 0.7) {
      suggestions.push('This workflow involves healthcare data - ensure compliance');
    }

    if (pattern.metadata.averageDuration > 1800) { // 30 minutes
      suggestions.push('This task takes longer than average - consider breaking it down');
    }

    return suggestions;
  }

  /**
   * Generate efficiency insight
   */
  private generateEfficiencyInsight(): ContextInsight | null {
    const patterns = Array.from(this.patterns.values());
    const workflowPatterns = patterns.filter(p => p.patternType === 'workflow');
    
    if (workflowPatterns.length === 0) return null;

    const avgDuration = workflowPatterns.reduce((sum, p) => sum + p.metadata.averageDuration, 0) / workflowPatterns.length;
    
    if (avgDuration > 3600) { // 1 hour
      return {
        type: 'efficiency',
        priority: 'high',
        title: 'Long Task Duration Detected',
        description: `Average task duration is ${Math.round(avgDuration / 60)} minutes. Consider workflow optimization.`,
        actionable: true,
        metadata: { averageDuration: avgDuration }
      };
    }

    return null;
  }

  /**
   * Generate compliance insight
   */
  private generateComplianceInsight(): ContextInsight | null {
    const patterns = Array.from(this.patterns.values());
    const healthcarePatterns = patterns.filter(p => p.metadata.healthcareRelevance > 0.5);
    
    if (healthcarePatterns.length === 0) return null;

    const complianceLevels = healthcarePatterns.map(p => p.metadata.complianceLevel);
    const hasHighCompliance = complianceLevels.some(level => level === 'hipaa' || level === 'fda');
    
    if (hasHighCompliance) {
      return {
        type: 'compliance',
        priority: 'critical',
        title: 'High Compliance Data Detected',
        description: 'Workflows involve sensitive healthcare data. Ensure proper compliance measures.',
        actionable: true,
        metadata: { complianceLevels }
      };
    }

    return null;
  }

  /**
   * Generate workflow insight
   */
  private generateWorkflowInsight(): ContextInsight | null {
    const patterns = Array.from(this.patterns.values());
    const frequentPatterns = patterns.filter(p => p.frequency > 3);
    
    if (frequentPatterns.length > 0) {
      return {
        type: 'workflow',
        priority: 'medium',
        title: 'Frequent Workflow Patterns Detected',
        description: `Found ${frequentPatterns.length} frequently used workflows. Consider automation.`,
        actionable: true,
        metadata: { patternCount: frequentPatterns.length }
      };
    }

    return null;
  }

  /**
   * Calculate workflow efficiency score
   */
  private calculateWorkflowEfficiency(events: any[]): number {
    // Simple efficiency calculation based on task completion rates
    const taskStarts = events.filter(e => e.interaction_type === 'task_start').length;
    const taskCompletes = events.filter(e => e.interaction_type === 'task_complete').length;
    
    if (taskStarts === 0) return 0;
    return Math.round((taskCompletes / taskStarts) * 100);
  }
}
