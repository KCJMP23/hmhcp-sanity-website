/**
 * Proactive Workflow Recommendations
 * Provides intelligent workflow suggestions based on user context and patterns
 */

import { createClient } from '@/lib/supabase/client';
import { AssistantContext } from './AIAssistantCore';

export interface WorkflowRecommendation {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'workflow' | 'content' | 'compliance' | 'efficiency' | 'collaboration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  context: {
    currentPage: string;
    currentTask: string;
    userRole: string;
    medicalSpecialty?: string;
    complianceLevel: string;
  };
  workflow: {
    steps: WorkflowStep[];
    estimatedDuration: number; // in minutes
    complexity: 'low' | 'medium' | 'high';
    prerequisites: string[];
    outcomes: string[];
  };
  metadata: {
    source: 'pattern' | 'template' | 'ai_generated' | 'user_defined';
    frequency: number;
    successRate: number;
    lastUsed?: Date;
    healthcareRelevant: boolean;
    complianceRequired: boolean;
  };
  suggestions: {
    automation: string[];
    optimization: string[];
    compliance: string[];
    collaboration: string[];
  };
}

export interface WorkflowStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: 'action' | 'decision' | 'validation' | 'collaboration' | 'compliance';
  estimatedDuration: number; // in minutes
  required: boolean;
  automated: boolean;
  dependencies: string[];
  resources: {
    type: 'documentation' | 'template' | 'tool' | 'person' | 'system';
    name: string;
    url?: string;
    description: string;
  }[];
  validation: {
    criteria: string[];
    checks: string[];
    compliance: string[];
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  specialty?: string;
  complianceLevel: string;
  complexity: 'low' | 'medium' | 'high';
  estimatedDuration: number;
  steps: WorkflowStep[];
  metadata: {
    createdBy: string;
    lastModified: Date;
    usageCount: number;
    successRate: number;
    healthcareRelevant: boolean;
  };
}

export interface WorkflowPattern {
  id: string;
  userId: string;
  pattern: {
    trigger: {
      page: string;
      task: string;
      context: Record<string, any>;
    };
    workflow: {
      steps: string[];
      duration: number;
      success: boolean;
    };
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

export class ProactiveWorkflowRecommendations {
  private supabase = createClient();
  private templates: Map<string, WorkflowTemplate> = new Map();
  private patterns: Map<string, WorkflowPattern> = new Map();
  private analysisInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadWorkflowTemplates();
    this.startAnalysis();
  }

  /**
   * Start workflow analysis
   */
  startAnalysis(): void {
    // Analyze every 5 minutes
    this.analysisInterval = setInterval(() => {
      this.analyzeWorkflowPatterns();
      this.updateRecommendations();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop workflow analysis
   */
  stopAnalysis(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  /**
   * Generate proactive workflow recommendations
   */
  async generateRecommendations(
    userId: string,
    context: AssistantContext,
    limit: number = 5
  ): Promise<WorkflowRecommendation[]> {
    try {
      const recommendations: WorkflowRecommendation[] = [];

      // Get pattern-based recommendations
      const patternRecommendations = await this.getPatternBasedRecommendations(userId, context);
      recommendations.push(...patternRecommendations);

      // Get template-based recommendations
      const templateRecommendations = await this.getTemplateBasedRecommendations(userId, context);
      recommendations.push(...templateRecommendations);

      // Get AI-generated recommendations
      const aiRecommendations = await this.getAIGeneratedRecommendations(userId, context);
      recommendations.push(...aiRecommendations);

      // Sort by priority and confidence
      const sortedRecommendations = recommendations
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return b.confidence - a.confidence;
        })
        .slice(0, limit);

      return sortedRecommendations;
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return [];
    }
  }

  /**
   * Get pattern-based recommendations
   */
  private async getPatternBasedRecommendations(
    userId: string,
    context: AssistantContext
  ): Promise<WorkflowRecommendation[]> {
    const recommendations: WorkflowRecommendation[] = [];
    const userPatterns = Array.from(this.patterns.values()).filter(p => p.userId === userId);

    for (const pattern of userPatterns) {
      if (this.matchesPattern(context, pattern.pattern.trigger)) {
        const recommendation = await this.createRecommendationFromPattern(userId, context, pattern);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
    }

    return recommendations;
  }

  /**
   * Get template-based recommendations
   */
  private async getTemplateBasedRecommendations(
    userId: string,
    context: AssistantContext
  ): Promise<WorkflowRecommendation[]> {
    const recommendations: WorkflowRecommendation[] = [];
    const relevantTemplates = this.getRelevantTemplates(context);

    for (const template of relevantTemplates) {
      const recommendation = await this.createRecommendationFromTemplate(userId, context, template);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  /**
   * Get AI-generated recommendations
   */
  private async getAIGeneratedRecommendations(
    userId: string,
    context: AssistantContext
  ): Promise<WorkflowRecommendation[]> {
    const recommendations: WorkflowRecommendation[] = [];

    // Generate recommendations based on context analysis
    const contextAnalysis = await this.analyzeContextForRecommendations(context);
    
    for (const analysis of contextAnalysis) {
      const recommendation = await this.createAIRecommendation(userId, context, analysis);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  /**
   * Track workflow execution
   */
  async trackWorkflowExecution(
    userId: string,
    workflowId: string,
    execution: {
      startTime: Date;
      endTime: Date;
      success: boolean;
      steps: Array<{
        stepId: string;
        completed: boolean;
        duration: number;
        issues: string[];
      }>;
      feedback?: 'positive' | 'negative' | 'neutral';
    }
  ): Promise<void> {
    try {
      // Store execution data
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: userId,
          interaction_type: 'workflow_execution',
          user_input: workflowId,
          assistant_response: execution.success ? 'completed' : 'failed',
          context_data: {
            workflowId,
            execution,
            duration: execution.endTime.getTime() - execution.startTime.getTime()
          },
          learning_insights: {
            success: execution.success,
            duration: execution.endTime.getTime() - execution.startTime.getTime(),
            feedback: execution.feedback
          }
        });

      // Update pattern frequency
      this.updatePatternFrequency(userId, workflowId, execution);

    } catch (error) {
      console.error('Failed to track workflow execution:', error);
    }
  }

  /**
   * Get workflow templates
   */
  getWorkflowTemplates(category?: string, specialty?: string): WorkflowTemplate[] {
    let templates = Array.from(this.templates.values());

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    if (specialty) {
      templates = templates.filter(t => t.specialty === specialty || !t.specialty);
    }

    return templates.sort((a, b) => b.metadata.usageCount - a.metadata.usageCount);
  }

  /**
   * Create workflow template
   */
  async createWorkflowTemplate(
    userId: string,
    template: Omit<WorkflowTemplate, 'id' | 'metadata'>
  ): Promise<WorkflowTemplate> {
    const newTemplate: WorkflowTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        createdBy: userId,
        lastModified: new Date(),
        usageCount: 0,
        successRate: 0,
        healthcareRelevant: template.metadata?.healthcareRelevant || false
      }
    };

    this.templates.set(newTemplate.id, newTemplate);

    // Store in database
    await this.supabase
      .from('ai_assistant_learning_data')
      .insert({
        user_id: userId,
        interaction_type: 'template_created',
        user_input: template.name,
        assistant_response: 'template_created',
        context_data: {
          template: newTemplate
        },
        learning_insights: {
          templateId: newTemplate.id,
          category: template.category
        }
      });

    return newTemplate;
  }

  /**
   * Load workflow templates
   */
  private async loadWorkflowTemplates(): Promise<void> {
    try {
      // Load default healthcare workflow templates
      const defaultTemplates: WorkflowTemplate[] = [
        {
          id: 'template_patient_assessment',
          name: 'Patient Assessment Workflow',
          description: 'Comprehensive patient assessment workflow for healthcare providers',
          category: 'workflow',
          specialty: 'general',
          complianceLevel: 'hipaa',
          complexity: 'high',
          estimatedDuration: 45,
          steps: [
            {
              id: 'step_1',
              order: 1,
              title: 'Initial Patient Contact',
              description: 'Greet patient and establish rapport',
              type: 'action',
              estimatedDuration: 5,
              required: true,
              automated: false,
              dependencies: [],
              resources: [],
              validation: {
                criteria: ['Patient greeted professionally'],
                checks: ['Patient comfort level assessed'],
                compliance: ['HIPAA privacy maintained']
              }
            },
            {
              id: 'step_2',
              order: 2,
              title: 'Medical History Review',
              description: 'Review patient medical history and current medications',
              type: 'action',
              estimatedDuration: 15,
              required: true,
              automated: false,
              dependencies: ['step_1'],
              resources: [
                {
                  type: 'system',
                  name: 'Electronic Health Records',
                  description: 'Access patient medical records'
                }
              ],
              validation: {
                criteria: ['Complete medical history reviewed'],
                checks: ['Medication interactions checked'],
                compliance: ['HIPAA compliance maintained']
              }
            },
            {
              id: 'step_3',
              order: 3,
              title: 'Physical Examination',
              description: 'Conduct physical examination based on chief complaint',
              type: 'action',
              estimatedDuration: 20,
              required: true,
              automated: false,
              dependencies: ['step_2'],
              resources: [
                {
                  type: 'tool',
                  name: 'Examination Equipment',
                  description: 'Stethoscope, blood pressure cuff, etc.'
                }
              ],
              validation: {
                criteria: ['Physical examination completed'],
                checks: ['Vital signs recorded'],
                compliance: ['Patient consent obtained']
              }
            },
            {
              id: 'step_4',
              order: 4,
              title: 'Assessment and Plan',
              description: 'Formulate assessment and treatment plan',
              type: 'decision',
              estimatedDuration: 5,
              required: true,
              automated: false,
              dependencies: ['step_3'],
              resources: [
                {
                  type: 'documentation',
                  name: 'Clinical Guidelines',
                  description: 'Evidence-based clinical guidelines'
                }
              ],
              validation: {
                criteria: ['Assessment documented'],
                checks: ['Treatment plan appropriate'],
                compliance: ['Clinical standards met']
              }
            }
          ],
          metadata: {
            createdBy: 'system',
            lastModified: new Date(),
            usageCount: 0,
            successRate: 0,
            healthcareRelevant: true
          }
        },
        {
          id: 'template_content_creation',
          name: 'Healthcare Content Creation Workflow',
          description: 'Structured workflow for creating healthcare content with compliance',
          category: 'content',
          specialty: 'general',
          complianceLevel: 'institutional',
          complexity: 'medium',
          estimatedDuration: 60,
          steps: [
            {
              id: 'step_1',
              order: 1,
              title: 'Content Planning',
              description: 'Define content objectives and target audience',
              type: 'action',
              estimatedDuration: 10,
              required: true,
              automated: false,
              dependencies: [],
              resources: [
                {
                  type: 'template',
                  name: 'Content Planning Template',
                  description: 'Structured template for content planning'
                }
              ],
              validation: {
                criteria: ['Objectives clearly defined'],
                checks: ['Target audience identified'],
                compliance: ['Content guidelines reviewed']
              }
            },
            {
              id: 'step_2',
              order: 2,
              title: 'Research and Fact-Checking',
              description: 'Gather accurate medical information and verify sources',
              type: 'action',
              estimatedDuration: 20,
              required: true,
              automated: false,
              dependencies: ['step_1'],
              resources: [
                {
                  type: 'documentation',
                  name: 'Medical Literature Database',
                  description: 'Access to peer-reviewed medical literature'
                }
              ],
              validation: {
                criteria: ['Sources verified'],
                checks: ['Information accuracy confirmed'],
                compliance: ['Evidence-based content']
              }
            },
            {
              id: 'step_3',
              order: 3,
              title: 'Content Creation',
              description: 'Create content following healthcare writing guidelines',
              type: 'action',
              estimatedDuration: 25,
              required: true,
              automated: false,
              dependencies: ['step_2'],
              resources: [
                {
                  type: 'tool',
                  name: 'Content Management System',
                  description: 'Platform for content creation and editing'
                }
              ],
              validation: {
                criteria: ['Content created'],
                checks: ['Writing guidelines followed'],
                compliance: ['Healthcare standards met']
              }
            },
            {
              id: 'step_4',
              order: 4,
              title: 'Compliance Review',
              description: 'Review content for compliance and accuracy',
              type: 'validation',
              estimatedDuration: 5,
              required: true,
              automated: false,
              dependencies: ['step_3'],
              resources: [
                {
                  type: 'person',
                  name: 'Compliance Officer',
                  description: 'Review content for compliance'
                }
              ],
              validation: {
                criteria: ['Compliance review completed'],
                checks: ['Accuracy verified'],
                compliance: ['All requirements met']
              }
            }
          ],
          metadata: {
            createdBy: 'system',
            lastModified: new Date(),
            usageCount: 0,
            successRate: 0,
            healthcareRelevant: true
          }
        }
      ];

      // Store templates in memory
      defaultTemplates.forEach(template => {
        this.templates.set(template.id, template);
      });

    } catch (error) {
      console.error('Failed to load workflow templates:', error);
    }
  }

  /**
   * Analyze workflow patterns
   */
  private async analyzeWorkflowPatterns(): Promise<void> {
    try {
      // Get recent workflow executions
      const { data, error } = await this.supabase
        .from('ai_assistant_learning_data')
        .select('*')
        .eq('interaction_type', 'workflow_execution')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by user and analyze patterns
      const userGroups = this.groupByUser(data || []);
      
      for (const [userId, executions] of userGroups) {
        await this.analyzeUserPatterns(userId, executions);
      }
    } catch (error) {
      console.error('Failed to analyze workflow patterns:', error);
    }
  }

  /**
   * Update recommendations
   */
  private updateRecommendations(): void {
    // Update recommendation confidence based on usage patterns
    for (const [patternId, pattern] of this.patterns.entries()) {
      // Update confidence based on recent usage
      const daysSinceLastSeen = (Date.now() - pattern.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
      pattern.pattern.confidence = Math.max(0, 1 - (daysSinceLastSeen / 30)) * Math.min(1, pattern.pattern.frequency / 10);
    }
  }

  /**
   * Check if context matches pattern trigger
   */
  private matchesPattern(context: AssistantContext, trigger: any): boolean {
    if (trigger.page && context.currentPage !== trigger.page) return false;
    if (trigger.task && context.currentTask !== trigger.task) return false;
    
    // Check context properties
    for (const [key, value] of Object.entries(trigger.context || {})) {
      if (context[key as keyof AssistantContext] !== value) return false;
    }
    
    return true;
  }

  /**
   * Create recommendation from pattern
   */
  private async createRecommendationFromPattern(
    userId: string,
    context: AssistantContext,
    pattern: WorkflowPattern
  ): Promise<WorkflowRecommendation | null> {
    if (pattern.pattern.confidence < 0.3) return null;

    return {
      id: `rec_${pattern.id}_${Date.now()}`,
      userId,
      title: `Recommended Workflow: ${pattern.pattern.workflow.steps.join(' → ')}`,
      description: `Based on your previous successful workflows, this pattern has a ${Math.round(pattern.pattern.confidence * 100)}% confidence rating.`,
      category: 'workflow',
      priority: pattern.insights.efficiency > 0.8 ? 'high' : 'medium',
      confidence: pattern.pattern.confidence,
      context: {
        currentPage: context.currentPage || '',
        currentTask: context.currentTask || '',
        userRole: context.medicalContext?.specialty || 'general',
        medicalSpecialty: context.medicalContext?.specialty,
        complianceLevel: context.medicalContext?.complianceLevel || 'institutional'
      },
      workflow: {
        steps: pattern.pattern.workflow.steps.map((step, index) => ({
          id: `step_${index}`,
          order: index + 1,
          title: step,
          description: `Step ${index + 1} of the recommended workflow`,
          type: 'action' as const,
          estimatedDuration: pattern.pattern.workflow.duration / pattern.pattern.workflow.steps.length,
          required: true,
          automated: false,
          dependencies: index > 0 ? [`step_${index - 1}`] : [],
          resources: [],
          validation: {
            criteria: [`Complete ${step}`],
            checks: [],
            compliance: []
          }
        })),
        estimatedDuration: pattern.pattern.workflow.duration,
        complexity: pattern.pattern.workflow.duration > 30 ? 'high' : 'medium',
        prerequisites: [],
        outcomes: ['Improved efficiency', 'Better compliance', 'Enhanced workflow']
      },
      metadata: {
        source: 'pattern',
        frequency: pattern.pattern.frequency,
        successRate: pattern.insights.userSatisfaction,
        lastUsed: pattern.lastSeen,
        healthcareRelevant: pattern.insights.healthcareRelevance > 0.5,
        complianceRequired: pattern.insights.compliance > 0.7
      },
      suggestions: {
        automation: pattern.insights.efficiency > 0.8 ? ['Consider automating this workflow'] : [],
        optimization: ['Optimize step durations', 'Reduce manual steps'],
        compliance: pattern.insights.compliance > 0.7 ? ['Ensure compliance measures'] : [],
        collaboration: ['Share with team members', 'Create team template']
      }
    };
  }

  /**
   * Create recommendation from template
   */
  private async createRecommendationFromTemplate(
    userId: string,
    context: AssistantContext,
    template: WorkflowTemplate
  ): Promise<WorkflowRecommendation | null> {
    const relevance = this.calculateTemplateRelevance(context, template);
    if (relevance < 0.5) return null;

    return {
      id: `rec_template_${template.id}_${Date.now()}`,
      userId,
      title: `Template: ${template.name}`,
      description: template.description,
      category: template.category as any,
      priority: template.complexity === 'high' ? 'high' : 'medium',
      confidence: relevance,
      context: {
        currentPage: context.currentPage || '',
        currentTask: context.currentTask || '',
        userRole: context.medicalContext?.specialty || 'general',
        medicalSpecialty: context.medicalContext?.specialty,
        complianceLevel: context.medicalContext?.complianceLevel || 'institutional'
      },
      workflow: {
        steps: template.steps,
        estimatedDuration: template.estimatedDuration,
        complexity: template.complexity,
        prerequisites: [],
        outcomes: ['Structured workflow', 'Improved efficiency', 'Better compliance']
      },
      metadata: {
        source: 'template',
        frequency: template.metadata.usageCount,
        successRate: template.metadata.successRate,
        lastUsed: template.metadata.lastModified,
        healthcareRelevant: template.metadata.healthcareRelevant,
        complianceRequired: template.complianceLevel !== 'institutional'
      },
      suggestions: {
        automation: ['Use workflow automation tools'],
        optimization: ['Customize for your specific needs'],
        compliance: template.complianceLevel !== 'institutional' ? ['Ensure compliance requirements'] : [],
        collaboration: ['Share with team', 'Create team version']
      }
    };
  }

  /**
   * Create AI-generated recommendation
   */
  private async createAIRecommendation(
    userId: string,
    context: AssistantContext,
    analysis: any
  ): Promise<WorkflowRecommendation | null> {
    return {
      id: `rec_ai_${Date.now()}`,
      userId,
      title: analysis.title,
      description: analysis.description,
      category: analysis.category,
      priority: analysis.priority,
      confidence: analysis.confidence,
      context: {
        currentPage: context.currentPage || '',
        currentTask: context.currentTask || '',
        userRole: context.medicalContext?.specialty || 'general',
        medicalSpecialty: context.medicalContext?.specialty,
        complianceLevel: context.medicalContext?.complianceLevel || 'institutional'
      },
      workflow: analysis.workflow,
      metadata: {
        source: 'ai_generated',
        frequency: 0,
        successRate: 0,
        healthcareRelevant: analysis.healthcareRelevant,
        complianceRequired: analysis.complianceRequired
      },
      suggestions: analysis.suggestions
    };
  }

  /**
   * Get relevant templates
   */
  private getRelevantTemplates(context: AssistantContext): WorkflowTemplate[] {
    const templates = Array.from(this.templates.values());
    
    return templates.filter(template => {
      // Check specialty match
      if (template.specialty && context.medicalContext?.specialty !== template.specialty) {
        return false;
      }
      
      // Check compliance level
      if (template.complianceLevel !== context.medicalContext?.complianceLevel) {
        return false;
      }
      
      // Check category relevance
      const task = context.currentTask?.toLowerCase() || '';
      if (template.category === 'workflow' && !task.includes('workflow')) {
        return false;
      }
      if (template.category === 'content' && !task.includes('content')) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Calculate template relevance
   */
  private calculateTemplateRelevance(context: AssistantContext, template: WorkflowTemplate): number {
    let relevance = 0.5; // Base relevance
    
    // Specialty match
    if (template.specialty === context.medicalContext?.specialty) {
      relevance += 0.3;
    }
    
    // Compliance level match
    if (template.complianceLevel === context.medicalContext?.complianceLevel) {
      relevance += 0.2;
    }
    
    // Task relevance
    const task = context.currentTask?.toLowerCase() || '';
    if (template.category === 'workflow' && task.includes('workflow')) {
      relevance += 0.2;
    }
    if (template.category === 'content' && task.includes('content')) {
      relevance += 0.2;
    }
    
    // Usage frequency
    relevance += Math.min(0.1, template.metadata.usageCount / 100);
    
    return Math.min(1, relevance);
  }

  /**
   * Analyze context for recommendations
   */
  private async analyzeContextForRecommendations(context: AssistantContext): Promise<any[]> {
    const analyses: any[] = [];
    
    // Analyze task complexity
    if (context.currentTask) {
      const taskComplexity = this.analyzeTaskComplexity(context.currentTask);
      if (taskComplexity === 'high') {
        analyses.push({
          title: 'Complex Task Detected',
          description: 'This task appears complex. Consider breaking it down into smaller steps.',
          category: 'workflow',
          priority: 'high',
          confidence: 0.8,
          healthcareRelevant: true,
          complianceRequired: true,
          workflow: {
            steps: [
              {
                id: 'step_1',
                order: 1,
                title: 'Break Down Task',
                description: 'Divide the complex task into manageable subtasks',
                type: 'action',
                estimatedDuration: 10,
                required: true,
                automated: false,
                dependencies: [],
                resources: [],
                validation: {
                  criteria: ['Task broken into subtasks'],
                  checks: ['Each subtask is manageable'],
                  compliance: []
                }
              }
            ],
            estimatedDuration: 10,
            complexity: 'medium',
            prerequisites: [],
            outcomes: ['Improved task management', 'Better progress tracking']
          },
          suggestions: {
            automation: ['Use task management tools'],
            optimization: ['Create task templates'],
            compliance: ['Ensure compliance at each step'],
            collaboration: ['Assign subtasks to team members']
          }
        });
      }
    }
    
    return analyses;
  }

  /**
   * Analyze task complexity
   */
  private analyzeTaskComplexity(task: string): 'low' | 'medium' | 'high' {
    const complexKeywords = ['compliance', 'audit', 'research', 'analysis', 'review', 'validation'];
    const mediumKeywords = ['create', 'update', 'edit', 'manage', 'organize'];
    
    const taskLower = task.toLowerCase();
    
    if (complexKeywords.some(keyword => taskLower.includes(keyword))) {
      return 'high';
    }
    
    if (mediumKeywords.some(keyword => taskLower.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Update pattern frequency
   */
  private updatePatternFrequency(userId: string, workflowId: string, execution: any): void {
    const patternKey = `${userId}_${workflowId}`;
    const existingPattern = this.patterns.get(patternKey);
    
    if (existingPattern) {
      existingPattern.pattern.frequency++;
      existingPattern.lastSeen = new Date();
      existingPattern.insights.userSatisfaction = execution.feedback === 'positive' ? 0.9 : 0.5;
    } else {
      const newPattern: WorkflowPattern = {
        id: patternKey,
        userId,
        pattern: {
          trigger: {
            page: '',
            task: workflowId,
            context: {}
          },
          workflow: {
            steps: [],
            duration: execution.endTime.getTime() - execution.startTime.getTime(),
            success: execution.success
          },
          frequency: 1,
          confidence: 0.5
        },
        insights: {
          efficiency: execution.success ? 0.8 : 0.3,
          compliance: 0.5,
          userSatisfaction: execution.feedback === 'positive' ? 0.9 : 0.5,
          healthcareRelevance: 0.5
        },
        suggestions: [],
        lastSeen: new Date()
      };
      this.patterns.set(patternKey, newPattern);
    }
  }

  /**
   * Analyze user patterns
   */
  private async analyzeUserPatterns(userId: string, executions: any[]): Promise<void> {
    // Group executions by workflow type
    const workflowGroups = new Map<string, any[]>();
    
    executions.forEach(execution => {
      const workflowId = execution.user_input;
      if (!workflowGroups.has(workflowId)) {
        workflowGroups.set(workflowId, []);
      }
      workflowGroups.get(workflowId)!.push(execution);
    });
    
    // Analyze each workflow group
    for (const [workflowId, workflowExecutions] of workflowGroups) {
      const pattern = this.createPatternFromExecutions(userId, workflowId, workflowExecutions);
      if (pattern) {
        this.patterns.set(pattern.id, pattern);
      }
    }
  }

  /**
   * Create pattern from executions
   */
  private createPatternFromExecutions(userId: string, workflowId: string, executions: any[]): WorkflowPattern | null {
    if (executions.length < 2) return null; // Need at least 2 executions to create a pattern
    
    const successCount = executions.filter(e => e.learning_insights?.success).length;
    const avgDuration = executions.reduce((sum, e) => sum + (e.context_data?.duration || 0), 0) / executions.length;
    
    return {
      id: `${userId}_${workflowId}`,
      userId,
      pattern: {
        trigger: {
          page: executions[0].context_data?.page || '',
          task: workflowId,
          context: executions[0].context_data?.context || {}
        },
        workflow: {
          steps: [],
          duration: avgDuration,
          success: successCount > executions.length / 2
        },
        frequency: executions.length,
        confidence: Math.min(1, executions.length / 10)
      },
      insights: {
        efficiency: successCount / executions.length,
        compliance: 0.5,
        userSatisfaction: successCount / executions.length,
        healthcareRelevance: 0.5
      },
      suggestions: [],
      lastSeen: new Date()
    };
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
}
