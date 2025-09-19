/**
 * Dynamic User Expertise Level Detection
 * Detects and adapts to user expertise levels in real-time
 */

import { createClient } from '@/lib/supabase/client';
import { AssistantContext } from './AIAssistantCore';

export interface ExpertiseLevel {
  id: string;
  userId: string;
  domain: 'general' | 'healthcare' | 'compliance' | 'technology' | 'workflow' | 'content';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: number; // 0-1
  indicators: {
    taskComplexity: number; // 0-1
    errorRate: number; // 0-1
    efficiency: number; // 0-1
    independence: number; // 0-1
    knowledgeDepth: number; // 0-1
    problemSolving: number; // 0-1
  };
  evidence: {
    successfulTasks: number;
    failedTasks: number;
    helpRequests: number;
    advancedFeaturesUsed: number;
    complianceViolations: number;
    timeToComplete: number; // average in seconds
  };
  lastUpdated: Date;
  metadata: {
    specialties: string[];
    certifications: string[];
    experienceYears: number;
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    preferredGuidance: 'detailed' | 'moderate' | 'minimal' | 'none';
  };
}

export interface ExpertiseAdaptation {
  userId: string;
  domain: string;
  currentLevel: ExpertiseLevel['level'];
  recommendedLevel: ExpertiseLevel['level'];
  adaptations: {
    uiComplexity: 'simple' | 'standard' | 'advanced' | 'expert';
    guidanceLevel: 'detailed' | 'moderate' | 'minimal' | 'none';
    featureAccess: string[];
    hiddenFeatures: string[];
    suggestedLearning: string[];
    workflowOptimizations: string[];
  };
  confidence: number;
  lastUpdated: Date;
}

export interface LearningRecommendation {
  id: string;
  userId: string;
  domain: string;
  type: 'skill' | 'knowledge' | 'workflow' | 'compliance' | 'feature';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  prerequisites: string[];
  resources: {
    type: 'documentation' | 'tutorial' | 'video' | 'practice' | 'certification';
    title: string;
    url?: string;
    description: string;
  }[];
  progress: {
    started: boolean;
    completed: boolean;
    progress: number; // 0-1
    lastAccessed: Date;
  };
}

export class DynamicExpertiseDetection {
  private supabase = createClient();
  private expertiseCache: Map<string, ExpertiseLevel> = new Map();
  private adaptationCache: Map<string, ExpertiseAdaptation> = new Map();
  private analysisInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startAnalysis();
  }

  /**
   * Start expertise analysis
   */
  startAnalysis(): void {
    // Analyze every 15 minutes
    this.analysisInterval = setInterval(() => {
      this.analyzeExpertiseLevels();
      this.generateAdaptations();
    }, 15 * 60 * 1000);
  }

  /**
   * Stop expertise analysis
   */
  stopAnalysis(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  /**
   * Detect expertise level from user interaction
   */
  async detectExpertiseFromInteraction(
    userId: string,
    interaction: {
      type: string;
      context: Record<string, any>;
      userAction: string;
      assistantResponse: string;
      outcome: 'success' | 'failure' | 'partial';
      duration: number;
      helpRequested: boolean;
      advancedFeaturesUsed: string[];
    }
  ): Promise<ExpertiseLevel[]> {
    try {
      const domains = this.identifyDomains(interaction.context);
      const expertiseLevels: ExpertiseLevel[] = [];

      for (const domain of domains) {
        const expertise = await this.analyzeDomainExpertise(userId, domain, interaction);
        if (expertise) {
          expertiseLevels.push(expertise);
          this.expertiseCache.set(`${userId}_${domain}`, expertise);
        }
      }

      return expertiseLevels;
    } catch (error) {
      console.error('Failed to detect expertise from interaction:', error);
      return [];
    }
  }

  /**
   * Get current expertise level for user
   */
  async getExpertiseLevel(
    userId: string,
    domain: ExpertiseLevel['domain']
  ): Promise<ExpertiseLevel | null> {
    const cacheKey = `${userId}_${domain}`;
    
    if (this.expertiseCache.has(cacheKey)) {
      return this.expertiseCache.get(cacheKey)!;
    }

    try {
      // Load from database
      const { data, error } = await this.supabase
        .from('ai_assistant_learning_data')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const expertise = await this.calculateExpertiseFromHistory(userId, domain, data || []);
      if (expertise) {
        this.expertiseCache.set(cacheKey, expertise);
      }

      return expertise;
    } catch (error) {
      console.error('Failed to get expertise level:', error);
      return null;
    }
  }

  /**
   * Get expertise adaptation for user
   */
  async getExpertiseAdaptation(
    userId: string,
    domain: string
  ): Promise<ExpertiseAdaptation | null> {
    const cacheKey = `${userId}_${domain}`;
    
    if (this.adaptationCache.has(cacheKey)) {
      return this.adaptationCache.get(cacheKey)!;
    }

    const expertise = await this.getExpertiseLevel(userId, domain as ExpertiseLevel['domain']);
    if (!expertise) return null;

    const adaptation = this.generateAdaptation(userId, domain, expertise);
    this.adaptationCache.set(cacheKey, adaptation);

    return adaptation;
  }

  /**
   * Generate learning recommendations
   */
  async generateLearningRecommendations(
    userId: string,
    domain: string
  ): Promise<LearningRecommendation[]> {
    try {
      const expertise = await this.getExpertiseLevel(userId, domain as ExpertiseLevel['domain']);
      if (!expertise) return [];

      const recommendations: LearningRecommendation[] = [];

      // Generate recommendations based on expertise level
      if (expertise.level === 'beginner') {
        recommendations.push(...this.generateBeginnerRecommendations(userId, domain));
      } else if (expertise.level === 'intermediate') {
        recommendations.push(...this.generateIntermediateRecommendations(userId, domain));
      } else if (expertise.level === 'advanced') {
        recommendations.push(...this.generateAdvancedRecommendations(userId, domain));
      }

      // Add domain-specific recommendations
      if (domain === 'healthcare') {
        recommendations.push(...this.generateHealthcareRecommendations(userId, expertise));
      } else if (domain === 'compliance') {
        recommendations.push(...this.generateComplianceRecommendations(userId, expertise));
      }

      return recommendations;
    } catch (error) {
      console.error('Failed to generate learning recommendations:', error);
      return [];
    }
  }

  /**
   * Update expertise level based on learning progress
   */
  async updateExpertiseFromLearning(
    userId: string,
    domain: string,
    learningProgress: {
      skill: string;
      progress: number;
      completed: boolean;
      timeSpent: number;
    }
  ): Promise<void> {
    try {
      const expertise = await this.getExpertiseLevel(userId, domain as ExpertiseLevel['domain']);
      if (!expertise) return;

      // Update indicators based on learning progress
      if (learningProgress.completed) {
        expertise.indicators.knowledgeDepth = Math.min(1, expertise.indicators.knowledgeDepth + 0.1);
        expertise.indicators.efficiency = Math.min(1, expertise.indicators.efficiency + 0.05);
      }

      // Update evidence
      expertise.evidence.successfulTasks += learningProgress.completed ? 1 : 0;
      expertise.evidence.timeToComplete = 
        (expertise.evidence.timeToComplete + learningProgress.timeSpent) / 2;

      // Recalculate level
      const newLevel = this.calculateExpertiseLevel(expertise.indicators);
      if (newLevel !== expertise.level) {
        expertise.level = newLevel;
        expertise.lastUpdated = new Date();
      }

      // Update in database
      await this.updateExpertiseInDatabase(expertise);

      // Update cache
      this.expertiseCache.set(`${userId}_${domain}`, expertise);
    } catch (error) {
      console.error('Failed to update expertise from learning:', error);
    }
  }

  /**
   * Analyze expertise levels
   */
  private async analyzeExpertiseLevels(): Promise<void> {
    try {
      // Get recent learning data
      const { data, error } = await this.supabase
        .from('ai_assistant_learning_data')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by user
      const userGroups = this.groupByUser(data || []);
      
      for (const [userId, interactions] of userGroups) {
        await this.analyzeUserExpertise(userId, interactions);
      }
    } catch (error) {
      console.error('Failed to analyze expertise levels:', error);
    }
  }

  /**
   * Generate adaptations
   */
  private generateAdaptations(): void {
    for (const [key, expertise] of this.expertiseCache) {
      const [userId, domain] = key.split('_');
      const adaptation = this.generateAdaptation(userId, domain, expertise);
      this.adaptationCache.set(key, adaptation);
    }
  }

  /**
   * Identify domains from context
   */
  private identifyDomains(context: Record<string, any>): ExpertiseLevel['domain'][] {
    const domains: ExpertiseLevel['domain'][] = ['general'];

    if (context.medicalContext || context.healthcareRelevant) {
      domains.push('healthcare');
    }

    if (context.complianceLevel === 'hipaa' || context.complianceLevel === 'fda') {
      domains.push('compliance');
    }

    if (context.workflowType || context.taskComplexity) {
      domains.push('workflow');
    }

    if (context.contentType || context.contentCreation) {
      domains.push('content');
    }

    if (context.technologyUsed || context.advancedFeatures) {
      domains.push('technology');
    }

    return domains;
  }

  /**
   * Analyze domain expertise
   */
  private async analyzeDomainExpertise(
    userId: string,
    domain: ExpertiseLevel['domain'],
    interaction: any
  ): Promise<ExpertiseLevel | null> {
    try {
      // Get existing expertise
      let expertise = await this.getExpertiseLevel(userId, domain);
      
      if (!expertise) {
        // Create new expertise level
        expertise = {
          id: `expertise_${userId}_${domain}`,
          userId,
          domain,
          level: 'beginner',
          confidence: 0.5,
          indicators: {
            taskComplexity: 0.3,
            errorRate: 0.5,
            efficiency: 0.5,
            independence: 0.5,
            knowledgeDepth: 0.3,
            problemSolving: 0.5
          },
          evidence: {
            successfulTasks: 0,
            failedTasks: 0,
            helpRequests: 0,
            advancedFeaturesUsed: 0,
            complianceViolations: 0,
            timeToComplete: 0
          },
          lastUpdated: new Date(),
          metadata: {
            specialties: [],
            certifications: [],
            experienceYears: 0,
            learningStyle: 'visual',
            preferredGuidance: 'moderate'
          }
        };
      }

      // Update based on interaction
      this.updateExpertiseFromInteraction(expertise, interaction);

      // Recalculate level
      expertise.level = this.calculateExpertiseLevel(expertise.indicators);
      expertise.confidence = this.calculateConfidence(expertise);
      expertise.lastUpdated = new Date();

      return expertise;
    } catch (error) {
      console.error('Failed to analyze domain expertise:', error);
      return null;
    }
  }

  /**
   * Update expertise from interaction
   */
  private updateExpertiseFromInteraction(expertise: ExpertiseLevel, interaction: any): void {
    // Update evidence
    if (interaction.outcome === 'success') {
      expertise.evidence.successfulTasks++;
    } else if (interaction.outcome === 'failure') {
      expertise.evidence.failedTasks++;
    }

    if (interaction.helpRequested) {
      expertise.evidence.helpRequests++;
    }

    expertise.evidence.advancedFeaturesUsed += interaction.advancedFeaturesUsed?.length || 0;
    expertise.evidence.timeToComplete = 
      (expertise.evidence.timeToComplete + interaction.duration) / 2;

    // Update indicators
    this.updateIndicators(expertise, interaction);
  }

  /**
   * Update expertise indicators
   */
  private updateIndicators(expertise: ExpertiseLevel, interaction: any): void {
    // Task complexity
    if (interaction.context.taskComplexity) {
      expertise.indicators.taskComplexity = 
        (expertise.indicators.taskComplexity + interaction.context.taskComplexity) / 2;
    }

    // Error rate
    const totalTasks = expertise.evidence.successfulTasks + expertise.evidence.failedTasks;
    if (totalTasks > 0) {
      expertise.indicators.errorRate = expertise.evidence.failedTasks / totalTasks;
    }

    // Efficiency
    if (interaction.duration) {
      const expectedDuration = this.getExpectedDuration(interaction.type, expertise.level);
      const efficiency = Math.max(0, 1 - (interaction.duration - expectedDuration) / expectedDuration);
      expertise.indicators.efficiency = 
        (expertise.indicators.efficiency + efficiency) / 2;
    }

    // Independence
    if (interaction.helpRequested) {
      expertise.indicators.independence = Math.max(0, expertise.indicators.independence - 0.1);
    } else {
      expertise.indicators.independence = Math.min(1, expertise.indicators.independence + 0.05);
    }

    // Knowledge depth
    if (interaction.advancedFeaturesUsed?.length > 0) {
      expertise.indicators.knowledgeDepth = 
        Math.min(1, expertise.indicators.knowledgeDepth + 0.1);
    }

    // Problem solving
    if (interaction.outcome === 'success' && interaction.context.taskComplexity > 0.7) {
      expertise.indicators.problemSolving = 
        Math.min(1, expertise.indicators.problemSolving + 0.1);
    }
  }

  /**
   * Calculate expertise level from indicators
   */
  private calculateExpertiseLevel(indicators: ExpertiseLevel['indicators']): ExpertiseLevel['level'] {
    const scores = Object.values(indicators);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    if (averageScore >= 0.8) return 'expert';
    if (averageScore >= 0.6) return 'advanced';
    if (averageScore >= 0.4) return 'intermediate';
    return 'beginner';
  }

  /**
   * Calculate confidence in expertise assessment
   */
  private calculateConfidence(expertise: ExpertiseLevel): number {
    const totalEvidence = expertise.evidence.successfulTasks + expertise.evidence.failedTasks;
    
    if (totalEvidence < 5) return 0.3; // Low confidence with little evidence
    if (totalEvidence < 20) return 0.6; // Medium confidence
    return 0.9; // High confidence with sufficient evidence
  }

  /**
   * Get expected duration for task type and expertise level
   */
  private getExpectedDuration(taskType: string, level: ExpertiseLevel['level']): number {
    const baseDurations: Record<string, number> = {
      'workflow': 1800, // 30 minutes
      'content_edit': 900, // 15 minutes
      'search': 300, // 5 minutes
      'compliance_check': 1200, // 20 minutes
      'data_analysis': 3600 // 1 hour
    };

    const baseDuration = baseDurations[taskType] || 1800;
    const levelMultipliers = {
      'beginner': 2.0,
      'intermediate': 1.5,
      'advanced': 1.0,
      'expert': 0.7
    };

    return baseDuration * levelMultipliers[level];
  }

  /**
   * Generate adaptation for user
   */
  private generateAdaptation(
    userId: string,
    domain: string,
    expertise: ExpertiseLevel
  ): ExpertiseAdaptation {
    const adaptations = this.getAdaptationsForLevel(expertise.level);
    
    return {
      userId,
      domain,
      currentLevel: expertise.level,
      recommendedLevel: expertise.level,
      adaptations,
      confidence: expertise.confidence,
      lastUpdated: new Date()
    };
  }

  /**
   * Get adaptations for expertise level
   */
  private getAdaptationsForLevel(level: ExpertiseLevel['level']): ExpertiseAdaptation['adaptations'] {
    switch (level) {
      case 'beginner':
        return {
          uiComplexity: 'simple',
          guidanceLevel: 'detailed',
          featureAccess: ['basic', 'essential'],
          hiddenFeatures: ['advanced', 'expert', 'experimental'],
          suggestedLearning: ['Basic workflow tutorials', 'Essential feature guides'],
          workflowOptimizations: ['Step-by-step guidance', 'Error prevention tips']
        };
      case 'intermediate':
        return {
          uiComplexity: 'standard',
          guidanceLevel: 'moderate',
          featureAccess: ['basic', 'essential', 'intermediate'],
          hiddenFeatures: ['expert', 'experimental'],
          suggestedLearning: ['Advanced feature tutorials', 'Workflow optimization guides'],
          workflowOptimizations: ['Efficiency tips', 'Best practices']
        };
      case 'advanced':
        return {
          uiComplexity: 'advanced',
          guidanceLevel: 'minimal',
          featureAccess: ['basic', 'essential', 'intermediate', 'advanced'],
          hiddenFeatures: ['experimental'],
          suggestedLearning: ['Expert-level techniques', 'Customization guides'],
          workflowOptimizations: ['Advanced automation', 'Custom workflows']
        };
      case 'expert':
        return {
          uiComplexity: 'expert',
          guidanceLevel: 'none',
          featureAccess: ['basic', 'essential', 'intermediate', 'advanced', 'expert'],
          hiddenFeatures: [],
          suggestedLearning: ['Cutting-edge features', 'Research and development'],
          workflowOptimizations: ['Full customization', 'Advanced integrations']
        };
    }
  }

  /**
   * Generate beginner recommendations
   */
  private generateBeginnerRecommendations(userId: string, domain: string): LearningRecommendation[] {
    return [
      {
        id: `beginner_${domain}_1`,
        userId,
        domain,
        type: 'skill',
        title: `Basic ${domain} Concepts`,
        description: `Learn the fundamental concepts of ${domain}`,
        priority: 'high',
        difficulty: 'beginner',
        estimatedTime: 30,
        prerequisites: [],
        resources: [
          {
            type: 'tutorial',
            title: `${domain} Basics Tutorial`,
            description: 'Step-by-step introduction to core concepts'
          }
        ],
        progress: {
          started: false,
          completed: false,
          progress: 0,
          lastAccessed: new Date()
        }
      }
    ];
  }

  /**
   * Generate intermediate recommendations
   */
  private generateIntermediateRecommendations(userId: string, domain: string): LearningRecommendation[] {
    return [
      {
        id: `intermediate_${domain}_1`,
        userId,
        domain,
        type: 'workflow',
        title: `Advanced ${domain} Workflows`,
        description: `Learn advanced workflow patterns for ${domain}`,
        priority: 'medium',
        difficulty: 'intermediate',
        estimatedTime: 45,
        prerequisites: [`Basic ${domain} Concepts`],
        resources: [
          {
            type: 'video',
            title: `Advanced ${domain} Workflows Video`,
            description: 'Video demonstration of advanced techniques'
          }
        ],
        progress: {
          started: false,
          completed: false,
          progress: 0,
          lastAccessed: new Date()
        }
      }
    ];
  }

  /**
   * Generate advanced recommendations
   */
  private generateAdvancedRecommendations(userId: string, domain: string): LearningRecommendation[] {
    return [
      {
        id: `advanced_${domain}_1`,
        userId,
        domain,
        type: 'feature',
        title: `Expert ${domain} Features`,
        description: `Master expert-level features in ${domain}`,
        priority: 'low',
        difficulty: 'advanced',
        estimatedTime: 60,
        prerequisites: [`Advanced ${domain} Workflows`],
        resources: [
          {
            type: 'documentation',
            title: `Expert ${domain} Documentation`,
            description: 'Comprehensive documentation for expert features'
          }
        ],
        progress: {
          started: false,
          completed: false,
          progress: 0,
          lastAccessed: new Date()
        }
      }
    ];
  }

  /**
   * Generate healthcare-specific recommendations
   */
  private generateHealthcareRecommendations(
    userId: string,
    expertise: ExpertiseLevel
  ): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = [];

    if (expertise.level === 'beginner' || expertise.level === 'intermediate') {
      recommendations.push({
        id: `healthcare_compliance_${userId}`,
        userId,
        domain: 'healthcare',
        type: 'compliance',
        title: 'HIPAA Compliance Training',
        description: 'Learn essential HIPAA compliance requirements',
        priority: 'critical',
        difficulty: 'intermediate',
        estimatedTime: 90,
        prerequisites: [],
        resources: [
          {
            type: 'certification',
            title: 'HIPAA Compliance Certification',
            description: 'Official HIPAA compliance training and certification'
          }
        ],
        progress: {
          started: false,
          completed: false,
          progress: 0,
          lastAccessed: new Date()
        }
      });
    }

    return recommendations;
  }

  /**
   * Generate compliance-specific recommendations
   */
  private generateComplianceRecommendations(
    userId: string,
    expertise: ExpertiseLevel
  ): LearningRecommendation[] {
    return [
      {
        id: `compliance_audit_${userId}`,
        userId,
        domain: 'compliance',
        type: 'knowledge',
        title: 'Compliance Audit Procedures',
        description: 'Learn how to conduct effective compliance audits',
        priority: 'high',
        difficulty: expertise.level === 'beginner' ? 'intermediate' : 'advanced',
        estimatedTime: 60,
        prerequisites: ['HIPAA Compliance Training'],
        resources: [
          {
            type: 'practice',
            title: 'Compliance Audit Simulation',
            description: 'Practice conducting compliance audits in a safe environment'
          }
        ],
        progress: {
          started: false,
          completed: false,
          progress: 0,
          lastAccessed: new Date()
        }
      }
    ];
  }

  /**
   * Calculate expertise from historical data
   */
  private async calculateExpertiseFromHistory(
    userId: string,
    domain: ExpertiseLevel['domain'],
    interactions: any[]
  ): Promise<ExpertiseLevel | null> {
    if (interactions.length === 0) return null;

    const domainInteractions = interactions.filter(i => 
      this.isRelevantToDomain(i, domain)
    );

    if (domainInteractions.length === 0) return null;

    const expertise: ExpertiseLevel = {
      id: `expertise_${userId}_${domain}`,
      userId,
      domain,
      level: 'beginner',
      confidence: 0.5,
      indicators: {
        taskComplexity: 0.3,
        errorRate: 0.5,
        efficiency: 0.5,
        independence: 0.5,
        knowledgeDepth: 0.3,
        problemSolving: 0.5
      },
      evidence: {
        successfulTasks: 0,
        failedTasks: 0,
        helpRequests: 0,
        advancedFeaturesUsed: 0,
        complianceViolations: 0,
        timeToComplete: 0
      },
      lastUpdated: new Date(),
      metadata: {
        specialties: [],
        certifications: [],
        experienceYears: 0,
        learningStyle: 'visual',
        preferredGuidance: 'moderate'
      }
    };

    // Analyze interactions
    for (const interaction of domainInteractions) {
      this.updateExpertiseFromInteraction(expertise, interaction);
    }

    // Calculate final level
    expertise.level = this.calculateExpertiseLevel(expertise.indicators);
    expertise.confidence = this.calculateConfidence(expertise);

    return expertise;
  }

  /**
   * Check if interaction is relevant to domain
   */
  private isRelevantToDomain(interaction: any, domain: ExpertiseLevel['domain']): boolean {
    const context = interaction.context_data || {};
    
    switch (domain) {
      case 'healthcare':
        return context.healthcareRelevant || context.medicalContext;
      case 'compliance':
        return context.complianceLevel === 'hipaa' || context.complianceLevel === 'fda';
      case 'workflow':
        return interaction.interaction_type === 'workflow';
      case 'content':
        return interaction.interaction_type === 'content_edit';
      case 'technology':
        return context.advancedFeatures || context.technologyUsed;
      default:
        return true;
    }
  }

  /**
   * Update expertise in database
   */
  private async updateExpertiseInDatabase(expertise: ExpertiseLevel): Promise<void> {
    try {
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: expertise.userId,
          interaction_type: 'expertise_update',
          user_input: expertise.domain,
          assistant_response: expertise.level,
          context_data: {
            expertise: expertise.indicators,
            evidence: expertise.evidence,
            metadata: expertise.metadata
          },
          learning_insights: {
            expertiseLevel: expertise.level,
            confidence: expertise.confidence,
            lastUpdated: expertise.lastUpdated.toISOString()
          }
        });
    } catch (error) {
      console.error('Failed to update expertise in database:', error);
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
   * Analyze user expertise
   */
  private async analyzeUserExpertise(userId: string, interactions: any[]): Promise<void> {
    const domains = new Set<ExpertiseLevel['domain']>();
    
    // Identify domains from interactions
    interactions.forEach(interaction => {
      const context = interaction.context_data || {};
      const interactionDomains = this.identifyDomains(context);
      interactionDomains.forEach(domain => domains.add(domain));
    });

    // Analyze each domain
    for (const domain of domains) {
      const expertise = await this.calculateExpertiseFromHistory(userId, domain, interactions);
      if (expertise) {
        this.expertiseCache.set(`${userId}_${domain}`, expertise);
      }
    }
  }
}
