/**
 * User Preference Learning and Adaptation
 * Learns user patterns and adapts AI assistant behavior accordingly
 */

import { createClient } from '@/lib/supabase/client';
import { AIAssistantConfig } from './AIAssistantCore';

export interface UserPreference {
  id: string;
  userId: string;
  category: 'workflow' | 'ui' | 'content' | 'compliance' | 'accessibility' | 'voice' | 'notifications';
  key: string;
  value: any;
  confidence: number; // 0-1
  source: 'explicit' | 'inferred' | 'learned' | 'default';
  lastUpdated: Date;
  metadata: {
    usageCount: number;
    successRate: number;
    context: Record<string, any>;
    healthcareRelevant: boolean;
  };
}

export interface LearningPattern {
  id: string;
  userId: string;
  patternType: 'temporal' | 'workflow' | 'content' | 'interaction' | 'compliance';
  pattern: {
    condition: Record<string, any>;
    action: Record<string, any>;
    frequency: number;
    confidence: number;
  };
  insights: {
    efficiency: number;
    compliance: number;
    userSatisfaction: number;
    healthcareRelevance: number;
  };
  suggestions: string[];
  lastSeen: Date;
}

export interface AdaptationRule {
  id: string;
  userId: string;
  condition: {
    context: Record<string, any>;
    userRole: string;
    medicalSpecialty?: string;
    complianceLevel: string;
  };
  action: {
    type: 'ui_adjustment' | 'workflow_suggestion' | 'content_recommendation' | 'compliance_reminder';
    parameters: Record<string, any>;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  effectiveness: number; // 0-1
  lastApplied: Date;
}

export interface LearningInsight {
  type: 'efficiency' | 'compliance' | 'workflow' | 'content' | 'accessibility';
  title: string;
  description: string;
  actionable: boolean;
  confidence: number;
  metadata: Record<string, any>;
  suggestions: string[];
}

export class UserPreferenceLearning {
  private supabase = createClient();
  private learningInterval: NodeJS.Timeout | null = null;
  private preferences: Map<string, UserPreference> = new Map();
  private patterns: Map<string, LearningPattern> = new Map();
  private adaptationRules: Map<string, AdaptationRule> = new Map();

  constructor() {
    this.startLearning();
  }

  /**
   * Start the learning process
   */
  startLearning(): void {
    // Learn every 5 minutes
    this.learningInterval = setInterval(() => {
      this.analyzeUserBehavior();
      this.updatePreferences();
      this.generateAdaptationRules();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop the learning process
   */
  stopLearning(): void {
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
    }
  }

  /**
   * Learn from user interaction
   */
  async learnFromInteraction(
    userId: string,
    interaction: {
      type: string;
      context: Record<string, any>;
      userAction: string;
      assistantResponse: string;
      userFeedback?: 'positive' | 'negative' | 'neutral';
      outcome: 'success' | 'failure' | 'partial';
    }
  ): Promise<void> {
    try {
      // Store interaction data
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: userId,
          interaction_type: interaction.type,
          user_input: interaction.userAction,
          assistant_response: interaction.assistantResponse,
          user_feedback: interaction.userFeedback ? { sentiment: interaction.userFeedback } : null,
          context_data: interaction.context,
          learning_insights: {
            outcome: interaction.outcome,
            timestamp: new Date().toISOString(),
            healthcareRelevant: this.isHealthcareRelevant(interaction.context),
            complianceLevel: interaction.context.complianceLevel || 'institutional'
          }
        });

      // Update preferences based on interaction
      await this.updatePreferencesFromInteraction(userId, interaction);

      // Detect patterns
      await this.detectPatterns(userId, interaction);

    } catch (error) {
      console.error('Failed to learn from interaction:', error);
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreference[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_assistant_user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Convert to UserPreference format
      const preferences: UserPreference[] = [];
      
      if (data.learning_data) {
        Object.entries(data.learning_data).forEach(([key, value]) => {
          preferences.push({
            id: `pref_${key}`,
            userId,
            category: this.categorizePreference(key),
            key,
            value,
            confidence: 0.8,
            source: 'learned',
            lastUpdated: new Date(data.updated_at),
            metadata: {
              usageCount: 1,
              successRate: 0.8,
              context: {},
              healthcareRelevant: this.isHealthcareRelevant({ [key]: value })
            }
          });
        });
      }

      return preferences;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return [];
    }
  }

  /**
   * Update user preference
   */
  async updateUserPreference(
    userId: string,
    category: UserPreference['category'],
    key: string,
    value: any,
    source: UserPreference['source'] = 'explicit'
  ): Promise<void> {
    try {
      const preference: UserPreference = {
        id: `pref_${category}_${key}`,
        userId,
        category,
        key,
        value,
        confidence: source === 'explicit' ? 1.0 : 0.7,
        source,
        lastUpdated: new Date(),
        metadata: {
          usageCount: 1,
          successRate: 0.8,
          context: {},
          healthcareRelevant: this.isHealthcareRelevant({ [key]: value })
        }
      };

      // Update in memory
      this.preferences.set(preference.id, preference);

      // Update in database
      await this.supabase
        .from('ai_assistant_user_preferences')
        .upsert({
          user_id: userId,
          learning_data: {
            [key]: value,
            lastUpdated: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Failed to update user preference:', error);
    }
  }

  /**
   * Get learning patterns
   */
  getLearningPatterns(userId: string): LearningPattern[] {
    return Array.from(this.patterns.values()).filter(p => p.userId === userId);
  }

  /**
   * Get adaptation rules
   */
  getAdaptationRules(userId: string): AdaptationRule[] {
    return Array.from(this.adaptationRules.values()).filter(r => r.userId === userId);
  }

  /**
   * Generate learning insights
   */
  async generateLearningInsights(userId: string): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Analyze user behavior data
    const behaviorData = await this.getUserBehaviorData(userId);
    
    // Generate efficiency insights
    const efficiencyInsight = this.generateEfficiencyInsight(behaviorData);
    if (efficiencyInsight) insights.push(efficiencyInsight);

    // Generate compliance insights
    const complianceInsight = this.generateComplianceInsight(behaviorData);
    if (complianceInsight) insights.push(complianceInsight);

    // Generate workflow insights
    const workflowInsight = this.generateWorkflowInsight(behaviorData);
    if (workflowInsight) insights.push(workflowInsight);

    // Generate content insights
    const contentInsight = this.generateContentInsight(behaviorData);
    if (contentInsight) insights.push(contentInsight);

    return insights;
  }

  /**
   * Apply adaptation rules
   */
  async applyAdaptationRules(
    userId: string,
    context: Record<string, any>
  ): Promise<Record<string, any>> {
    const applicableRules = this.getAdaptationRules(userId).filter(rule => 
      rule.enabled && this.matchesCondition(rule.condition, context)
    );

    const adaptations: Record<string, any> = {};

    for (const rule of applicableRules) {
      switch (rule.action.type) {
        case 'ui_adjustment':
          adaptations.ui = { ...adaptations.ui, ...rule.action.parameters };
          break;
        case 'workflow_suggestion':
          adaptations.workflowSuggestions = [
            ...(adaptations.workflowSuggestions || []),
            rule.action.parameters
          ];
          break;
        case 'content_recommendation':
          adaptations.contentRecommendations = [
            ...(adaptations.contentRecommendations || []),
            rule.action.parameters
          ];
          break;
        case 'compliance_reminder':
          adaptations.complianceReminders = [
            ...(adaptations.complianceReminders || []),
            rule.action.parameters
          ];
          break;
      }

      // Update rule effectiveness
      rule.lastApplied = new Date();
      rule.effectiveness = Math.min(1, rule.effectiveness + 0.1);
    }

    return adaptations;
  }

  /**
   * Analyze user behavior
   */
  private async analyzeUserBehavior(): Promise<void> {
    try {
      // Get recent learning data
      const { data, error } = await this.supabase
        .from('ai_assistant_learning_data')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Analyze patterns in the data
      const userGroups = this.groupByUser(data || []);
      
      for (const [userId, interactions] of userGroups) {
        await this.analyzeUserPatterns(userId, interactions);
      }
    } catch (error) {
      console.error('Failed to analyze user behavior:', error);
    }
  }

  /**
   * Update preferences based on analysis
   */
  private async updatePreferences(): Promise<void> {
    for (const [preferenceId, preference] of this.preferences) {
      // Update confidence based on usage
      preference.confidence = Math.min(1, preference.confidence + 0.05);
      preference.metadata.usageCount++;
      
      // Update in database if confidence is high enough
      if (preference.confidence > 0.8) {
        await this.updateUserPreference(
          preference.userId,
          preference.category,
          preference.key,
          preference.value,
          'learned'
        );
      }
    }
  }

  /**
   * Generate adaptation rules
   */
  private async generateAdaptationRules(): Promise<void> {
    for (const [patternId, pattern] of this.patterns) {
      if (pattern.insights.efficiency > 0.7 || pattern.insights.compliance > 0.8) {
        const rule: AdaptationRule = {
          id: `rule_${patternId}`,
          userId: pattern.userId,
          condition: {
            context: pattern.pattern.condition,
            userRole: 'physician', // This would be determined from user data
            complianceLevel: 'hipaa'
          },
          action: {
            type: 'workflow_suggestion',
            parameters: {
              suggestion: pattern.suggestions[0],
              priority: pattern.insights.efficiency > 0.8 ? 'high' : 'medium'
            }
          },
          priority: pattern.insights.compliance > 0.8 ? 'critical' : 'medium',
          enabled: true,
          effectiveness: 0.5,
          lastApplied: new Date()
        };

        this.adaptationRules.set(rule.id, rule);
      }
    }
  }

  /**
   * Update preferences from interaction
   */
  private async updatePreferencesFromInteraction(
    userId: string,
    interaction: any
  ): Promise<void> {
    // Learn UI preferences
    if (interaction.context.uiPreferences) {
      for (const [key, value] of Object.entries(interaction.context.uiPreferences)) {
        await this.updateUserPreference(userId, 'ui', key, value, 'inferred');
      }
    }

    // Learn workflow preferences
    if (interaction.type === 'workflow') {
      await this.updateUserPreference(
        userId,
        'workflow',
        'preferredWorkflow',
        interaction.userAction,
        'learned'
      );
    }

    // Learn content preferences
    if (interaction.type === 'content') {
      await this.updateUserPreference(
        userId,
        'content',
        'contentType',
        interaction.context.contentType,
        'learned'
      );
    }
  }

  /**
   * Detect patterns in user behavior
   */
  private async detectPatterns(userId: string, interaction: any): Promise<void> {
    // Simple pattern detection - in a real implementation, this would be more sophisticated
    const patternKey = `${userId}_${interaction.type}`;
    
    if (this.patterns.has(patternKey)) {
      const pattern = this.patterns.get(patternKey)!;
      pattern.pattern.frequency++;
      pattern.lastSeen = new Date();
    } else {
      const pattern: LearningPattern = {
        id: patternKey,
        userId,
        patternType: this.getPatternType(interaction.type),
        pattern: {
          condition: interaction.context,
          action: { type: interaction.userAction },
          frequency: 1,
          confidence: 0.5
        },
        insights: {
          efficiency: 0.5,
          compliance: interaction.context.complianceLevel === 'hipaa' ? 0.9 : 0.3,
          userSatisfaction: interaction.userFeedback === 'positive' ? 0.8 : 0.5,
          healthcareRelevance: this.isHealthcareRelevant(interaction.context) ? 0.8 : 0.2
        },
        suggestions: this.generatePatternSuggestions(interaction),
        lastSeen: new Date()
      };
      this.patterns.set(patternKey, pattern);
    }
  }

  /**
   * Get user behavior data
   */
  private async getUserBehaviorData(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_assistant_learning_data')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user behavior data:', error);
      return [];
    }
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
  private async analyzeUserPatterns(userId: string, interactions: any[]): Promise<void> {
    // Analyze temporal patterns
    const temporalPattern = this.analyzeTemporalPattern(interactions);
    if (temporalPattern) {
      await this.createPattern(userId, 'temporal', temporalPattern);
    }

    // Analyze workflow patterns
    const workflowPattern = this.analyzeWorkflowPattern(interactions);
    if (workflowPattern) {
      await this.createPattern(userId, 'workflow', workflowPattern);
    }

    // Analyze compliance patterns
    const compliancePattern = this.analyzeCompliancePattern(interactions);
    if (compliancePattern) {
      await this.createPattern(userId, 'compliance', compliancePattern);
    }
  }

  /**
   * Create a learning pattern
   */
  private async createPattern(
    userId: string,
    patternType: LearningPattern['patternType'],
    patternData: any
  ): Promise<void> {
    const patternId = `${userId}_${patternType}_${Date.now()}`;
    
    const pattern: LearningPattern = {
      id: patternId,
      userId,
      patternType,
      pattern: patternData,
      insights: {
        efficiency: patternData.efficiency || 0.5,
        compliance: patternData.compliance || 0.5,
        userSatisfaction: patternData.satisfaction || 0.5,
        healthcareRelevance: patternData.healthcareRelevance || 0.5
      },
      suggestions: patternData.suggestions || [],
      lastSeen: new Date()
    };

    this.patterns.set(patternId, pattern);
  }

  /**
   * Analyze temporal patterns
   */
  private analyzeTemporalPattern(interactions: any[]): any | null {
    const timeGroups = new Map<string, number>();
    
    for (const interaction of interactions) {
      const hour = new Date(interaction.created_at).getHours();
      const timeSlot = `${Math.floor(hour / 4) * 4}-${Math.floor(hour / 4) * 4 + 4}`;
      timeGroups.set(timeSlot, (timeGroups.get(timeSlot) || 0) + 1);
    }

    const mostActiveTime = Array.from(timeGroups.entries())
      .sort(([,a], [,b]) => b - a)[0];

    if (mostActiveTime && mostActiveTime[1] > 3) {
      return {
        condition: { timeSlot: mostActiveTime[0] },
        action: { optimizeForTime: mostActiveTime[0] },
        frequency: mostActiveTime[1],
        confidence: Math.min(1, mostActiveTime[1] / interactions.length),
        efficiency: 0.7,
        suggestions: [`Optimize workflows for ${mostActiveTime[0]} time slot`]
      };
    }

    return null;
  }

  /**
   * Analyze workflow patterns
   */
  private analyzeWorkflowPattern(interactions: any[]): any | null {
    const workflowTypes = new Map<string, number>();
    
    for (const interaction of interactions) {
      if (interaction.interaction_type === 'workflow') {
        const workflowType = interaction.context_data?.workflowType || 'general';
        workflowTypes.set(workflowType, (workflowTypes.get(workflowType) || 0) + 1);
      }
    }

    const mostCommonWorkflow = Array.from(workflowTypes.entries())
      .sort(([,a], [,b]) => b - a)[0];

    if (mostCommonWorkflow && mostCommonWorkflow[1] > 2) {
      return {
        condition: { workflowType: mostCommonWorkflow[0] },
        action: { suggestWorkflow: mostCommonWorkflow[0] },
        frequency: mostCommonWorkflow[1],
        confidence: Math.min(1, mostCommonWorkflow[1] / interactions.length),
        efficiency: 0.8,
        suggestions: [`Create template for ${mostCommonWorkflow[0]} workflow`]
      };
    }

    return null;
  }

  /**
   * Analyze compliance patterns
   */
  private analyzeCompliancePattern(interactions: any[]): any | null {
    const complianceLevels = new Map<string, number>();
    
    for (const interaction of interactions) {
      const complianceLevel = interaction.learning_insights?.complianceLevel || 'institutional';
      complianceLevels.set(complianceLevel, (complianceLevels.get(complianceLevel) || 0) + 1);
    }

    const highComplianceCount = complianceLevels.get('hipaa') || 0;
    
    if (highComplianceCount > 0) {
      return {
        condition: { complianceLevel: 'hipaa' },
        action: { enforceCompliance: true },
        frequency: highComplianceCount,
        confidence: 0.9,
        compliance: 0.9,
        suggestions: ['Ensure HIPAA compliance in all workflows']
      };
    }

    return null;
  }

  /**
   * Generate pattern suggestions
   */
  private generatePatternSuggestions(interaction: any): string[] {
    const suggestions: string[] = [];
    
    if (interaction.type === 'workflow') {
      suggestions.push('Consider automating this workflow');
    }
    
    if (interaction.context.complianceLevel === 'hipaa') {
      suggestions.push('Ensure HIPAA compliance measures are in place');
    }
    
    if (interaction.userFeedback === 'positive') {
      suggestions.push('This approach works well - consider applying to similar tasks');
    }

    return suggestions;
  }

  /**
   * Generate efficiency insight
   */
  private generateEfficiencyInsight(behaviorData: any[]): LearningInsight | null {
    const taskCompletions = behaviorData.filter(d => d.interaction_type === 'task_complete').length;
    const taskStarts = behaviorData.filter(d => d.interaction_type === 'task_start').length;
    
    if (taskStarts > 0) {
      const completionRate = taskCompletions / taskStarts;
      
      if (completionRate < 0.7) {
        return {
          type: 'efficiency',
          title: 'Low Task Completion Rate',
          description: `Only ${Math.round(completionRate * 100)}% of tasks are being completed. Consider workflow optimization.`,
          actionable: true,
          confidence: 0.8,
          metadata: { completionRate, taskStarts, taskCompletions },
          suggestions: [
            'Break down complex tasks into smaller steps',
            'Provide more guidance during task execution',
            'Identify and remove workflow bottlenecks'
          ]
        };
      }
    }

    return null;
  }

  /**
   * Generate compliance insight
   */
  private generateComplianceInsight(behaviorData: any[]): LearningInsight | null {
    const hipaaInteractions = behaviorData.filter(d => 
      d.learning_insights?.complianceLevel === 'hipaa'
    ).length;
    
    if (hipaaInteractions > 0) {
      return {
        type: 'compliance',
        title: 'HIPAA Data Handling Detected',
        description: `${hipaaInteractions} interactions involve HIPAA-protected data. Ensure proper compliance measures.`,
        actionable: true,
        confidence: 0.9,
        metadata: { hipaaInteractions },
        suggestions: [
          'Review HIPAA compliance procedures',
          'Ensure proper data encryption',
          'Verify audit logging is enabled'
        ]
      };
    }

    return null;
  }

  /**
   * Generate workflow insight
   */
  private generateWorkflowInsight(behaviorData: any[]): LearningInsight | null {
    const workflowTypes = new Map<string, number>();
    
    behaviorData.forEach(d => {
      if (d.interaction_type === 'workflow') {
        const type = d.context_data?.workflowType || 'general';
        workflowTypes.set(type, (workflowTypes.get(type) || 0) + 1);
      }
    });

    if (workflowTypes.size > 1) {
      return {
        type: 'workflow',
        title: 'Multiple Workflow Types Detected',
        description: `User works with ${workflowTypes.size} different workflow types. Consider creating specialized templates.`,
        actionable: true,
        confidence: 0.7,
        metadata: { workflowTypes: Object.fromEntries(workflowTypes) },
        suggestions: [
          'Create workflow templates for each type',
          'Implement workflow-specific guidance',
          'Optimize workflows for each use case'
        ]
      };
    }

    return null;
  }

  /**
   * Generate content insight
   */
  private generateContentInsight(behaviorData: any[]): LearningInsight | null {
    const contentTypes = new Map<string, number>();
    
    behaviorData.forEach(d => {
      if (d.interaction_type === 'content_edit') {
        const type = d.context_data?.contentType || 'general';
        contentTypes.set(type, (contentTypes.get(type) || 0) + 1);
      }
    });

    if (contentTypes.size > 0) {
      return {
        type: 'content',
        title: 'Content Creation Patterns',
        description: `User creates ${Array.from(contentTypes.keys()).join(', ')} content types. Consider content-specific optimizations.`,
        actionable: true,
        confidence: 0.6,
        metadata: { contentTypes: Object.fromEntries(contentTypes) },
        suggestions: [
          'Create content templates for each type',
          'Implement content-specific recommendations',
          'Optimize content creation workflows'
        ]
      };
    }

    return null;
  }

  /**
   * Check if context is healthcare relevant
   */
  private isHealthcareRelevant(context: Record<string, any>): boolean {
    const healthcareKeywords = [
      'patient', 'medical', 'clinical', 'healthcare', 'diagnosis', 'treatment',
      'therapy', 'medication', 'surgery', 'nursing', 'physician', 'doctor'
    ];
    
    const text = JSON.stringify(context).toLowerCase();
    return healthcareKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Categorize preference key
   */
  private categorizePreference(key: string): UserPreference['category'] {
    if (key.includes('ui') || key.includes('theme') || key.includes('layout')) return 'ui';
    if (key.includes('workflow') || key.includes('process')) return 'workflow';
    if (key.includes('content') || key.includes('template')) return 'content';
    if (key.includes('compliance') || key.includes('hipaa')) return 'compliance';
    if (key.includes('voice') || key.includes('audio')) return 'voice';
    if (key.includes('notification') || key.includes('alert')) return 'notifications';
    return 'workflow';
  }

  /**
   * Get pattern type from interaction type
   */
  private getPatternType(interactionType: string): LearningPattern['patternType'] {
    switch (interactionType) {
      case 'workflow':
        return 'workflow';
      case 'content_edit':
        return 'content';
      case 'search':
        return 'interaction';
      default:
        return 'interaction';
    }
  }

  /**
   * Check if condition matches context
   */
  private matchesCondition(condition: any, context: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(condition)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }
}
