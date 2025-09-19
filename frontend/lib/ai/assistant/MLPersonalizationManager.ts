/**
 * ML-Powered Personalization Manager
 * Coordinates all ML and personalization components
 */

import { createClient } from '@/lib/supabase/client';
import { AssistantContext } from './AIAssistantCore';
import { UserBehaviorPatternRecognition } from './UserBehaviorPatternRecognition';
import { AdaptiveLearningSystem } from './AdaptiveLearningSystem';
import { IntelligentPersonalizationEngine } from './IntelligentPersonalizationEngine';

export interface MLPersonalizationConfig {
  id: string;
  userId: string;
  name: string;
  description: string;
  enabled: boolean;
  components: {
    behaviorRecognition: boolean;
    adaptiveLearning: boolean;
    personalizationEngine: boolean;
  };
  settings: {
    learningRate: number; // 0-1
    adaptationSpeed: 'slow' | 'medium' | 'fast';
    personalizationLevel: 'minimal' | 'moderate' | 'comprehensive' | 'adaptive';
    healthcareOptimized: boolean;
    complianceRequired: boolean;
  };
  performance: {
    accuracy: number; // 0-1
    effectiveness: number; // 0-1
    userSatisfaction: number; // 0-1
    lastEvaluated: Date;
  };
  metadata: {
    createdBy: string;
    lastModified: Date;
    version: string;
    healthcareRelevant: boolean;
    complianceRequired: boolean;
  };
}

export interface MLInsight {
  id: string;
  userId: string;
  type: 'pattern' | 'preference' | 'optimization' | 'anomaly' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  confidence: number; // 0-1
  source: 'behavior_recognition' | 'adaptive_learning' | 'personalization_engine' | 'combined';
  impact: {
    performance: number; // 0-1
    efficiency: number; // 0-1
    satisfaction: number; // 0-1
    accessibility: number; // 0-1
    compliance: number; // 0-1
  };
  data: {
    patterns: string[];
    metrics: Record<string, number>;
    trends: Array<{
      period: string;
      value: number;
      change: number;
    }>;
    recommendations: string[];
  };
  actions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  metadata: {
    generatedAt: Date;
    healthcareRelevant: boolean;
    complianceRequired: boolean;
  };
}

export interface MLRecommendation {
  id: string;
  userId: string;
  type: 'ui' | 'content' | 'workflow' | 'ai' | 'accessibility' | 'compliance';
  title: string;
  description: string;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';
  personalization: {
    basedOn: string;
    relevance: number; // 0-1
    customization: string[];
  };
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: number; // in minutes
    requiredChanges: string[];
    dependencies: string[];
  };
  expectedOutcome: {
    performance: number; // 0-1
    efficiency: number; // 0-1
    satisfaction: number; // 0-1
    accessibility: number; // 0-1
    compliance: number; // 0-1
  };
  metadata: {
    generatedAt: Date;
    source: 'ml_analysis' | 'user_feedback' | 'pattern_detection' | 'combined';
    healthcareRelevant: boolean;
    complianceRequired: boolean;
  };
}

export class MLPersonalizationManager {
  private supabase = createClient();
  private behaviorRecognition: UserBehaviorPatternRecognition;
  private adaptiveLearning: AdaptiveLearningSystem;
  private personalizationEngine: IntelligentPersonalizationEngine;
  private configs: Map<string, MLPersonalizationConfig> = new Map();
  private insights: Map<string, MLInsight> = new Map();
  private recommendations: Map<string, MLRecommendation> = new Map();
  private analysisInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.behaviorRecognition = new UserBehaviorPatternRecognition();
    this.adaptiveLearning = new AdaptiveLearningSystem();
    this.personalizationEngine = new IntelligentPersonalizationEngine();
    this.startMLAnalysis();
  }

  /**
   * Start ML analysis
   */
  startMLAnalysis(): void {
    // Analyze every 10 minutes
    this.analysisInterval = setInterval(() => {
      this.performMLAnalysis();
      this.generateMLInsights();
      this.generateMLRecommendations();
    }, 10 * 60 * 1000);
  }

  /**
   * Stop ML analysis
   */
  stopMLAnalysis(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  /**
   * Initialize ML personalization
   */
  async initializeMLPersonalization(
    userId: string,
    config: Omit<MLPersonalizationConfig, 'id' | 'performance' | 'metadata'>
  ): Promise<MLPersonalizationConfig> {
    try {
      const newConfig: MLPersonalizationConfig = {
        ...config,
        id: `ml_config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        performance: {
          accuracy: 0.5,
          effectiveness: 0.5,
          userSatisfaction: 0.5,
          lastEvaluated: new Date()
        },
        metadata: {
          createdBy: 'system',
          lastModified: new Date(),
          version: '1.0.0',
          healthcareRelevant: config.settings.healthcareOptimized,
          complianceRequired: config.settings.complianceRequired
        }
      };

      // Store in memory
      this.configs.set(newConfig.id, newConfig);

      // Store in database
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: userId,
          interaction_type: 'ml_personalization_initialized',
          user_input: config.name,
          assistant_response: 'ml_personalization_initialized',
          context_data: {
            config: newConfig
          },
          learning_insights: {
            configId: newConfig.id,
            components: Object.keys(config.components).filter(k => config.components[k as keyof typeof config.components])
          }
        });

      return newConfig;
    } catch (error) {
      console.error('Failed to initialize ML personalization:', error);
      throw error;
    }
  }

  /**
   * Apply ML personalization
   */
  async applyMLPersonalization(
    userId: string,
    context: AssistantContext
  ): Promise<{
    ui: Record<string, any>;
    content: Record<string, any>;
    workflow: Record<string, any>;
    ai: Record<string, any>;
    accessibility: Record<string, any>;
    insights: MLInsight[];
    recommendations: MLRecommendation[];
  }> {
    try {
      // Get ML personalization config
      const config = await this.getMLPersonalizationConfig(userId);
      if (!config || !config.enabled) {
        return this.getDefaultPersonalization();
      }

      // Apply personalization from personalization engine
      const personalization = await this.personalizationEngine.applyPersonalization(userId, context);

      // Generate ML insights
      const insights = await this.generateMLInsights(userId, context);

      // Generate ML recommendations
      const recommendations = await this.generateMLRecommendations(userId, context);

      // Apply behavior-based adaptations
      const behaviorAdaptations = await this.applyBehaviorAdaptations(userId, context, personalization);

      // Apply learning-based adaptations
      const learningAdaptations = await this.applyLearningAdaptations(userId, context, personalization);

      return {
        ...behaviorAdaptations,
        ...learningAdaptations,
        insights,
        recommendations
      };
    } catch (error) {
      console.error('Failed to apply ML personalization:', error);
      return this.getDefaultPersonalization();
    }
  }

  /**
   * Record ML learning data
   */
  async recordMLLearningData(
    userId: string,
    data: {
      input: Record<string, any>;
      output: Record<string, any>;
      context: AssistantContext;
      feedback?: {
        rating?: number;
        comment?: string;
        helpful?: boolean;
        accuracy?: boolean;
        relevance?: boolean;
      };
    }
  ): Promise<void> {
    try {
      // Record in adaptive learning system
      await this.adaptiveLearning.recordLearningData(userId, {
        input: data.input,
        output: data.output,
        context: {
          page: data.context.currentPage || '',
          task: data.context.currentTask || '',
          userRole: data.context.medicalContext?.specialty || 'general',
          medicalSpecialty: data.context.medicalContext?.specialty,
          complianceLevel: data.context.medicalContext?.complianceLevel || 'institutional',
          sessionId: data.context.sessionId || '',
          deviceType: 'desktop',
          browser: 'chrome',
          timeOfDay: new Date().getHours() < 12 ? 'morning' : 'afternoon',
          dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        },
        feedback: data.feedback || {},
        metadata: {
          source: 'ml_personalization',
          healthcareRelevant: true,
          complianceRequired: false
        }
      });

      // Record behavior data
      await this.behaviorRecognition.recordBehavior(userId, {
        eventType: 'interaction',
        eventData: {
          page: data.context.currentPage || '',
          task: data.context.currentTask || '',
          action: 'ml_interaction',
          duration: 0,
          context: data.input,
          sequence: []
        },
        context: {
          userRole: data.context.medicalContext?.specialty || 'general',
          medicalSpecialty: data.context.medicalContext?.specialty,
          complianceLevel: data.context.medicalContext?.complianceLevel || 'institutional',
          sessionId: data.context.sessionId || '',
          deviceType: 'desktop',
          browser: 'chrome',
          timeOfDay: new Date().getHours() < 12 ? 'morning' : 'afternoon',
          dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        },
        metadata: {
          source: 'ml_personalization',
          healthcareRelevant: true,
          complianceRequired: false
        }
      });

    } catch (error) {
      console.error('Failed to record ML learning data:', error);
    }
  }

  /**
   * Generate ML insights
   */
  async generateMLInsights(
    userId: string,
    context: AssistantContext
  ): Promise<MLInsight[]> {
    try {
      const insights: MLInsight[] = [];

      // Get behavior pattern insights
      const behaviorPatterns = await this.behaviorRecognition.detectPatterns(userId, context);
      const behaviorInsights = this.convertBehaviorPatternsToInsights(userId, behaviorPatterns);
      insights.push(...behaviorInsights);

      // Get adaptive learning insights
      const learningInsights = await this.adaptiveLearning.generateLearningInsights(userId, context);
      const mlLearningInsights = this.convertLearningInsightsToMLInsights(userId, learningInsights);
      insights.push(...mlLearningInsights);

      // Get personalization insights
      const personalizationInsights = await this.personalizationEngine.generatePersonalizationInsights(userId, context);
      const mlPersonalizationInsights = this.convertPersonalizationInsightsToMLInsights(userId, personalizationInsights);
      insights.push(...mlPersonalizationInsights);

      // Generate combined insights
      const combinedInsights = await this.generateCombinedInsights(userId, context, insights);
      insights.push(...combinedInsights);

      return insights.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Failed to generate ML insights:', error);
      return [];
    }
  }

  /**
   * Generate ML recommendations
   */
  async generateMLRecommendations(
    userId: string,
    context: AssistantContext
  ): Promise<MLRecommendation[]> {
    try {
      const recommendations: MLRecommendation[] = [];

      // Get personalized recommendations from behavior recognition
      const behaviorRecommendations = await this.behaviorRecognition.generatePersonalizedRecommendations(userId, context);
      const mlBehaviorRecommendations = this.convertBehaviorRecommendationsToMLRecommendations(userId, behaviorRecommendations);
      recommendations.push(...mlBehaviorRecommendations);

      // Generate ML-based recommendations
      const mlRecommendations = await this.generateMLBasedRecommendations(userId, context);
      recommendations.push(...mlRecommendations);

      return recommendations.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Failed to generate ML recommendations:', error);
      return [];
    }
  }

  /**
   * Get ML personalization config
   */
  async getMLPersonalizationConfig(userId: string): Promise<MLPersonalizationConfig | null> {
    try {
      // Check memory first
      if (this.configs.has(userId)) {
        return this.configs.get(userId)!;
      }

      // Load from database
      const { data, error } = await this.supabase
        .from('ai_assistant_learning_data')
        .select('*')
        .eq('user_id', userId)
        .eq('interaction_type', 'ml_personalization_initialized')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const config = data[0].context_data.config as MLPersonalizationConfig;
        this.configs.set(userId, config);
        return config;
      }

      return null;
    } catch (error) {
      console.error('Failed to get ML personalization config:', error);
      return null;
    }
  }

  /**
   * Update ML personalization config
   */
  async updateMLPersonalizationConfig(
    userId: string,
    updates: Partial<MLPersonalizationConfig>
  ): Promise<MLPersonalizationConfig | null> {
    try {
      const config = await this.getMLPersonalizationConfig(userId);
      if (!config) return null;

      const updatedConfig: MLPersonalizationConfig = {
        ...config,
        ...updates,
        metadata: {
          ...config.metadata,
          lastModified: new Date()
        }
      };

      // Store in memory
      this.configs.set(userId, updatedConfig);

      // Store in database
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: userId,
          interaction_type: 'ml_personalization_updated',
          user_input: 'config_updated',
          assistant_response: 'config_updated',
          context_data: {
            config: updatedConfig
          },
          learning_insights: {
            configId: updatedConfig.id,
            updateCount: 1
          }
        });

      return updatedConfig;
    } catch (error) {
      console.error('Failed to update ML personalization config:', error);
      return null;
    }
  }

  /**
   * Apply behavior adaptations
   */
  private async applyBehaviorAdaptations(
    userId: string,
    context: AssistantContext,
    personalization: any
  ): Promise<any> {
    try {
      // Get behavior patterns
      const patterns = await this.behaviorRecognition.detectPatterns(userId, context);
      
      // Apply pattern-based adaptations
      const adaptations: any = {};
      
      for (const pattern of patterns) {
        if (pattern.confidence > 0.7) {
          // Apply high-confidence pattern adaptations
          switch (pattern.patternType) {
            case 'workflow':
              adaptations.workflow = {
                ...personalization.workflow,
                ...this.getWorkflowAdaptations(pattern)
              };
              break;
            case 'content':
              adaptations.content = {
                ...personalization.content,
                ...this.getContentAdaptations(pattern)
              };
              break;
            case 'navigation':
              adaptations.ui = {
                ...personalization.ui,
                ...this.getNavigationAdaptations(pattern)
              };
              break;
          }
        }
      }

      return adaptations;
    } catch (error) {
      console.error('Failed to apply behavior adaptations:', error);
      return personalization;
    }
  }

  /**
   * Apply learning adaptations
   */
  private async applyLearningAdaptations(
    userId: string,
    context: AssistantContext,
    personalization: any
  ): Promise<any> {
    try {
      // Get learning insights
      const learningInsights = await this.adaptiveLearning.generateLearningInsights(userId, context);
      
      // Apply learning-based adaptations
      const adaptations: any = {};
      
      for (const insight of learningInsights) {
        if (insight.confidence > 0.8) {
          // Apply high-confidence learning adaptations
          switch (insight.type) {
            case 'preference':
              adaptations.ai = {
                ...personalization.ai,
                ...this.getPreferenceAdaptations(insight)
              };
              break;
            case 'optimization':
              adaptations.workflow = {
                ...personalization.workflow,
                ...this.getOptimizationAdaptations(insight)
              };
              break;
          }
        }
      }

      return adaptations;
    } catch (error) {
      console.error('Failed to apply learning adaptations:', error);
      return personalization;
    }
  }

  /**
   * Get workflow adaptations
   */
  private getWorkflowAdaptations(pattern: any): Record<string, any> {
    return {
      automation: 'advanced',
      suggestions: 'comprehensive',
      shortcuts: 'advanced'
    };
  }

  /**
   * Get content adaptations
   */
  private getContentAdaptations(pattern: any): Record<string, any> {
    return {
      complexity: 'adaptive',
      format: 'mixed',
      personalization: 'high'
    };
  }

  /**
   * Get navigation adaptations
   */
  private getNavigationAdaptations(pattern: any): Record<string, any> {
    return {
      layout: 'optimized',
      shortcuts: 'advanced',
      personalization: 'high'
    };
  }

  /**
   * Get preference adaptations
   */
  private getPreferenceAdaptations(insight: any): Record<string, any> {
    return {
      assistance: 'comprehensive',
      explanations: 'detailed',
      suggestions: 'balanced'
    };
  }

  /**
   * Get optimization adaptations
   */
  private getOptimizationAdaptations(insight: any): Record<string, any> {
    return {
      automation: 'advanced',
      suggestions: 'comprehensive',
      optimization: 'high'
    };
  }

  /**
   * Convert behavior patterns to insights
   */
  private convertBehaviorPatternsToInsights(
    userId: string,
    patterns: any[]
  ): MLInsight[] {
    return patterns.map(pattern => ({
      id: `insight_behavior_${pattern.id}`,
      userId,
      type: 'pattern' as const,
      title: `Behavior Pattern: ${pattern.name}`,
      description: pattern.description,
      confidence: pattern.confidence,
      source: 'behavior_recognition' as const,
      impact: {
        performance: pattern.pattern.outcomes.efficiency,
        efficiency: pattern.pattern.outcomes.efficiency,
        satisfaction: pattern.pattern.outcomes.userSatisfaction,
        accessibility: 0.5,
        compliance: pattern.pattern.outcomes.healthcareRelevance
      },
      data: {
        patterns: [pattern.patternType],
        metrics: {
          confidence: pattern.confidence,
          frequency: pattern.frequency
        },
        trends: [],
        recommendations: pattern.pattern.actions.map((a: any) => a.action)
      },
      actions: {
        immediate: ['Apply pattern-based optimizations'],
        shortTerm: ['Monitor pattern changes'],
        longTerm: ['Develop pattern-specific features']
      },
      metadata: {
        generatedAt: new Date(),
        healthcareRelevant: pattern.metadata.healthcareRelevant,
        complianceRequired: pattern.metadata.complianceRequired
      }
    }));
  }

  /**
   * Convert learning insights to ML insights
   */
  private convertLearningInsightsToMLInsights(
    userId: string,
    insights: any[]
  ): MLInsight[] {
    return insights.map(insight => ({
      id: `insight_learning_${insight.id}`,
      userId,
      type: insight.type as any,
      title: insight.title,
      description: insight.description,
      confidence: insight.confidence,
      source: 'adaptive_learning' as const,
      impact: insight.impact,
      data: insight.data,
      actions: insight.actions,
      metadata: {
        generatedAt: insight.metadata.generatedAt,
        healthcareRelevant: insight.metadata.healthcareRelevant,
        complianceRequired: insight.metadata.complianceRequired
      }
    }));
  }

  /**
   * Convert personalization insights to ML insights
   */
  private convertPersonalizationInsightsToMLInsights(
    userId: string,
    insights: any[]
  ): MLInsight[] {
    return insights.map(insight => ({
      id: `insight_personalization_${insight.id}`,
      userId,
      type: insight.type as any,
      title: insight.title,
      description: insight.description,
      confidence: insight.confidence,
      source: 'personalization_engine' as const,
      impact: insight.impact,
      data: insight.data,
      actions: insight.actions,
      metadata: {
        generatedAt: insight.metadata.generatedAt,
        healthcareRelevant: insight.metadata.healthcareRelevant,
        complianceRequired: insight.metadata.complianceRequired
      }
    }));
  }

  /**
   * Convert behavior recommendations to ML recommendations
   */
  private convertBehaviorRecommendationsToMLRecommendations(
    userId: string,
    recommendations: any[]
  ): MLRecommendation[] {
    return recommendations.map(rec => ({
      id: `recommendation_behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: rec.type as any,
      title: rec.title,
      description: rec.description,
      confidence: rec.confidence,
      priority: 'medium' as const,
      personalization: rec.personalization,
      implementation: {
        difficulty: 'easy' as const,
        estimatedTime: 15,
        requiredChanges: [rec.type],
        dependencies: []
      },
      expectedOutcome: {
        performance: 0.7,
        efficiency: 0.8,
        satisfaction: 0.8,
        accessibility: 0.6,
        compliance: 0.5
      },
      metadata: {
        generatedAt: new Date(),
        source: 'ml_analysis' as const,
        healthcareRelevant: true,
        complianceRequired: false
      }
    }));
  }

  /**
   * Generate combined insights
   */
  private async generateCombinedInsights(
    userId: string,
    context: AssistantContext,
    existingInsights: MLInsight[]
  ): Promise<MLInsight[]> {
    const insights: MLInsight[] = [];
    
    // Analyze combined patterns
    if (existingInsights.length >= 3) {
      insights.push({
        id: `insight_combined_${Date.now()}`,
        userId,
        type: 'pattern',
        title: 'Combined ML Insights',
        description: 'Multiple ML components have identified complementary patterns',
        confidence: 0.9,
        source: 'combined',
        impact: {
          performance: 0.8,
          efficiency: 0.9,
          satisfaction: 0.8,
          accessibility: 0.7,
          compliance: 0.8
        },
        data: {
          patterns: ['combined_patterns', 'ml_insights'],
          metrics: { insightCount: existingInsights.length, combinedConfidence: 0.9 },
          trends: [],
          recommendations: ['Apply combined insights', 'Optimize ML components']
        },
        actions: {
          immediate: ['Apply combined insights'],
          shortTerm: ['Optimize ML components'],
          longTerm: ['Develop advanced ML features']
        },
        metadata: {
          generatedAt: new Date(),
          healthcareRelevant: true,
          complianceRequired: false
        }
      });
    }

    return insights;
  }

  /**
   * Generate ML-based recommendations
   */
  private async generateMLBasedRecommendations(
    userId: string,
    context: AssistantContext
  ): Promise<MLRecommendation[]> {
    const recommendations: MLRecommendation[] = [];
    
    // Generate ML-based recommendations
    recommendations.push({
      id: `recommendation_ml_${Date.now()}`,
      userId,
      type: 'ai',
      title: 'ML-Powered AI Optimization',
      description: 'Optimize AI assistance based on ML analysis',
      confidence: 0.8,
      priority: 'high',
      personalization: {
        basedOn: 'ml_analysis',
        relevance: 0.9,
        customization: ['ai_behavior', 'suggestions', 'learning']
      },
      implementation: {
        difficulty: 'medium',
        estimatedTime: 30,
        requiredChanges: ['ai_configuration', 'learning_parameters'],
        dependencies: ['ml_models', 'user_data']
      },
      expectedOutcome: {
        performance: 0.8,
        efficiency: 0.9,
        satisfaction: 0.8,
        accessibility: 0.7,
        compliance: 0.8
      },
      metadata: {
        generatedAt: new Date(),
        source: 'ml_analysis',
        healthcareRelevant: true,
        complianceRequired: false
      }
    });

    return recommendations;
  }

  /**
   * Get default personalization
   */
  private getDefaultPersonalization(): any {
    return {
      ui: {
        theme: 'auto',
        layout: 'comfortable',
        fontSize: 'medium',
        colorScheme: 'default',
        animations: 'standard',
        density: 'comfortable'
      },
      content: {
        complexity: 'intermediate',
        language: 'en',
        format: 'mixed',
        topics: [],
        specialties: [],
        readingLevel: 'high_school',
        medicalTerminology: 'standard'
      },
      workflow: {
        automation: 'basic',
        suggestions: 'moderate',
        notifications: 'normal',
        collaboration: 'individual',
        shortcuts: 'basic'
      },
      ai: {
        assistance: 'moderate',
        explanations: 'detailed',
        suggestions: 'balanced',
        learning: 'active',
        personality: 'professional'
      },
      accessibility: {
        screenReader: false,
        keyboardNavigation: true,
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        voiceControl: false,
        cognitiveAssistance: false
      },
      insights: [],
      recommendations: []
    };
  }

  /**
   * Perform ML analysis
   */
  private async performMLAnalysis(): Promise<void> {
    // Implementation for ML analysis
  }

  /**
   * Generate ML insights
   */
  private async generateMLInsights(): Promise<void> {
    // Implementation for generating ML insights
  }

  /**
   * Generate ML recommendations
   */
  private async generateMLRecommendations(): Promise<void> {
    // Implementation for generating ML recommendations
  }
}
