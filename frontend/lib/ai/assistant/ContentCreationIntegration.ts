/**
 * Content Creation Workflow Integration
 * Integrates AI assistant with content creation workflows
 */

import { createClient } from '@/lib/supabase/client';
import { AssistantContext } from './AIAssistantCore';

export interface ContentCreationWorkflow {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: 'article' | 'report' | 'presentation' | 'documentation' | 'patient_education' | 'research';
  status: 'draft' | 'in_progress' | 'review' | 'published' | 'archived';
  content: {
    title: string;
    body: string;
    metadata: {
      tags: string[];
      category: string;
      medicalSpecialty?: string;
      complianceLevel: string;
      targetAudience: string;
      language: string;
      wordCount: number;
      readingTime: number;
    };
    structure: {
      sections: Array<{
        id: string;
        title: string;
        content: string;
        order: number;
        type: 'heading' | 'paragraph' | 'list' | 'table' | 'image' | 'code';
        metadata: Record<string, any>;
      }>;
      outline: string[];
      keyPoints: string[];
    };
    formatting: {
      headings: Array<{
        level: number;
        text: string;
        id: string;
      }>;
      lists: Array<{
        type: 'ordered' | 'unordered';
        items: string[];
      }>;
      tables: Array<{
        headers: string[];
        rows: string[][];
        caption?: string;
      }>;
      images: Array<{
        src: string;
        alt: string;
        caption?: string;
        width?: number;
        height?: number;
      }>;
    };
  };
  aiAssistance: {
    suggestions: Array<{
      id: string;
      type: 'content' | 'structure' | 'style' | 'compliance' | 'accessibility';
      priority: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      description: string;
      suggestion: string;
      applied: boolean;
      appliedAt?: Date;
    }>;
    enhancements: Array<{
      id: string;
      type: 'grammar' | 'clarity' | 'readability' | 'compliance' | 'accessibility';
      original: string;
      enhanced: string;
      explanation: string;
      applied: boolean;
      appliedAt?: Date;
    }>;
    analytics: {
      readabilityScore: number;
      complianceScore: number;
      accessibilityScore: number;
      qualityScore: number;
      suggestionsCount: number;
      enhancementsCount: number;
      timeSaved: number; // in minutes
    };
  };
  collaboration: {
    contributors: Array<{
      userId: string;
      role: 'author' | 'editor' | 'reviewer' | 'approver';
      permissions: string[];
      lastActive: Date;
    }>;
    comments: Array<{
      id: string;
      userId: string;
      content: string;
      sectionId?: string;
      resolved: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    versionHistory: Array<{
      version: string;
      changes: string[];
      userId: string;
      timestamp: Date;
    }>;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    lastModifiedBy: string;
    healthcareRelevant: boolean;
    complianceRequired: boolean;
  };
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  specialty?: string;
  complianceLevel: string;
  structure: {
    sections: Array<{
      id: string;
      title: string;
      description: string;
      required: boolean;
      order: number;
      guidelines: string[];
      examples: string[];
      aiPrompts: string[];
    }>;
    wordCount: {
      min: number;
      max: number;
      recommended: number;
    };
    formatting: {
      headings: string[];
      lists: string[];
      tables: string[];
      images: string[];
    };
  };
  guidelines: {
    writing: string[];
    compliance: string[];
    accessibility: string[];
    medical: string[];
  };
  aiPrompts: {
    contentGeneration: string[];
    structureOptimization: string[];
    complianceCheck: string[];
    accessibilityReview: string[];
  };
  metadata: {
    createdBy: string;
    lastModified: Date;
    usageCount: number;
    successRate: number;
    healthcareRelevant: boolean;
  };
}

export interface ContentWorkflowStep {
  id: string;
  workflowId: string;
  stepId: string;
  title: string;
  description: string;
  type: 'content_creation' | 'review' | 'editing' | 'compliance_check' | 'accessibility_review' | 'publishing';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  order: number;
  dependencies: string[];
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  aiAssistance: {
    suggestions: string[];
    enhancements: string[];
    automation: string[];
  };
  deliverables: {
    required: string[];
    optional: string[];
    completed: string[];
  };
  quality: {
    score: number; // 0-100
    criteria: string[];
    passed: boolean;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastModifiedBy: string;
  };
}

export class ContentCreationIntegration {
  private supabase = createClient();
  private workflows: Map<string, ContentCreationWorkflow> = new Map();
  private templates: Map<string, ContentTemplate> = new Map();
  private steps: Map<string, ContentWorkflowStep> = new Map();

  constructor() {
    this.loadContentTemplates();
  }

  /**
   * Create content creation workflow
   */
  async createContentWorkflow(
    userId: string,
    workflow: Omit<ContentCreationWorkflow, 'id' | 'metadata' | 'aiAssistance' | 'collaboration'>
  ): Promise<ContentCreationWorkflow> {
    try {
      const newWorkflow: ContentCreationWorkflow = {
        ...workflow,
        id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        aiAssistance: {
          suggestions: [],
          enhancements: [],
          analytics: {
            readabilityScore: 0,
            complianceScore: 0,
            accessibilityScore: 0,
            qualityScore: 0,
            suggestionsCount: 0,
            enhancementsCount: 0,
            timeSaved: 0
          }
        },
        collaboration: {
          contributors: [{
            userId,
            role: 'author',
            permissions: ['read', 'write', 'edit', 'delete'],
            lastActive: new Date()
          }],
          comments: [],
          versionHistory: [{
            version: '1.0',
            changes: ['Initial creation'],
            userId,
            timestamp: new Date()
          }]
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastModifiedBy: userId,
          healthcareRelevant: workflow.type === 'patient_education' || workflow.type === 'research',
          complianceRequired: workflow.content.metadata.complianceLevel !== 'institutional'
        }
      };

      // Store in memory
      this.workflows.set(newWorkflow.id, newWorkflow);

      // Store in database
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: userId,
          interaction_type: 'workflow_created',
          user_input: workflow.name,
          assistant_response: 'workflow_created',
          context_data: {
            workflow: newWorkflow
          },
          learning_insights: {
            workflowId: newWorkflow.id,
            workflowType: workflow.type,
            healthcareRelevant: newWorkflow.metadata.healthcareRelevant
          }
        });

      return newWorkflow;
    } catch (error) {
      console.error('Failed to create content workflow:', error);
      throw error;
    }
  }

  /**
   * Get content workflow
   */
  async getContentWorkflow(workflowId: string): Promise<ContentCreationWorkflow | null> {
    try {
      // Check memory first
      if (this.workflows.has(workflowId)) {
        return this.workflows.get(workflowId)!;
      }

      // Load from database
      const { data, error } = await this.supabase
        .from('ai_assistant_learning_data')
        .select('*')
        .eq('interaction_type', 'workflow_created')
        .eq('context_data->workflow->id', workflowId)
        .single();

      if (error) throw error;

      if (data) {
        const workflow = data.context_data.workflow as ContentCreationWorkflow;
        this.workflows.set(workflowId, workflow);
        return workflow;
      }

      return null;
    } catch (error) {
      console.error('Failed to get content workflow:', error);
      return null;
    }
  }

  /**
   * Update content workflow
   */
  async updateContentWorkflow(
    workflowId: string,
    updates: Partial<ContentCreationWorkflow>,
    userId: string
  ): Promise<ContentCreationWorkflow | null> {
    try {
      const workflow = await this.getContentWorkflow(workflowId);
      if (!workflow) return null;

      // Update workflow
      const updatedWorkflow: ContentCreationWorkflow = {
        ...workflow,
        ...updates,
        metadata: {
          ...workflow.metadata,
          updatedAt: new Date(),
          lastModifiedBy: userId
        }
      };

      // Add to version history
      updatedWorkflow.collaboration.versionHistory.push({
        version: `${updatedWorkflow.collaboration.versionHistory.length + 1}.0`,
        changes: Object.keys(updates),
        userId,
        timestamp: new Date()
      });

      // Store in memory
      this.workflows.set(workflowId, updatedWorkflow);

      // Store in database
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: userId,
          interaction_type: 'workflow_updated',
          user_input: workflowId,
          assistant_response: 'workflow_updated',
          context_data: {
            workflow: updatedWorkflow,
            updates: Object.keys(updates)
          },
          learning_insights: {
            workflowId,
            updateCount: updatedWorkflow.collaboration.versionHistory.length
          }
        });

      return updatedWorkflow;
    } catch (error) {
      console.error('Failed to update content workflow:', error);
      return null;
    }
  }

  /**
   * Generate AI suggestions for content
   */
  async generateContentSuggestions(
    workflowId: string,
    context: AssistantContext
  ): Promise<ContentCreationWorkflow['aiAssistance']['suggestions']> {
    try {
      const workflow = await this.getContentWorkflow(workflowId);
      if (!workflow) return [];

      const suggestions: ContentCreationWorkflow['aiAssistance']['suggestions'] = [];

      // Content suggestions
      const contentSuggestions = await this.generateContentSuggestionsForWorkflow(workflow, context);
      suggestions.push(...contentSuggestions);

      // Structure suggestions
      const structureSuggestions = await this.generateStructureSuggestions(workflow, context);
      suggestions.push(...structureSuggestions);

      // Style suggestions
      const styleSuggestions = await this.generateStyleSuggestions(workflow, context);
      suggestions.push(...styleSuggestions);

      // Compliance suggestions
      const complianceSuggestions = await this.generateComplianceSuggestions(workflow, context);
      suggestions.push(...complianceSuggestions);

      // Accessibility suggestions
      const accessibilitySuggestions = await this.generateAccessibilitySuggestions(workflow, context);
      suggestions.push(...accessibilitySuggestions);

      return suggestions;
    } catch (error) {
      console.error('Failed to generate content suggestions:', error);
      return [];
    }
  }

  /**
   * Apply content enhancement
   */
  async applyContentEnhancement(
    workflowId: string,
    enhancementId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const workflow = await this.getContentWorkflow(workflowId);
      if (!workflow) return false;

      // Find enhancement
      const enhancement = workflow.aiAssistance.enhancements.find(e => e.id === enhancementId);
      if (!enhancement) return false;

      // Apply enhancement
      enhancement.applied = true;
      enhancement.appliedAt = new Date();

      // Update content
      if (enhancement.type === 'grammar' || enhancement.type === 'clarity') {
        workflow.content.body = workflow.content.body.replace(enhancement.original, enhancement.enhanced);
      }

      // Update workflow
      await this.updateContentWorkflow(workflowId, workflow, userId);

      return true;
    } catch (error) {
      console.error('Failed to apply content enhancement:', error);
      return false;
    }
  }

  /**
   * Analyze content quality
   */
  async analyzeContentQuality(workflowId: string): Promise<ContentCreationWorkflow['aiAssistance']['analytics']> {
    try {
      const workflow = await this.getContentWorkflow(workflowId);
      if (!workflow) throw new Error('Workflow not found');

      const analytics = await this.performContentQualityAnalysis(workflow);
      
      // Update workflow
      workflow.aiAssistance.analytics = analytics;
      await this.updateContentWorkflow(workflowId, workflow, workflow.metadata.lastModifiedBy);

      return analytics;
    } catch (error) {
      console.error('Failed to analyze content quality:', error);
      throw error;
    }
  }

  /**
   * Create workflow step
   */
  async createWorkflowStep(
    workflowId: string,
    step: Omit<ContentWorkflowStep, 'id' | 'workflowId' | 'metadata' | 'aiAssistance' | 'deliverables' | 'quality'>
  ): Promise<ContentWorkflowStep> {
    try {
      const newStep: ContentWorkflowStep = {
        ...step,
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowId,
        aiAssistance: {
          suggestions: [],
          enhancements: [],
          automation: []
        },
        deliverables: {
          required: [],
          optional: [],
          completed: []
        },
        quality: {
          score: 0,
          criteria: [],
          passed: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastModifiedBy: step.assignedTo || 'system'
        }
      };

      // Store in memory
      this.steps.set(newStep.id, newStep);

      // Store in database
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: step.assignedTo || 'system',
          interaction_type: 'workflow_step_created',
          user_input: step.title,
          assistant_response: 'step_created',
          context_data: {
            step: newStep
          },
          learning_insights: {
            stepId: newStep.id,
            workflowId,
            stepType: step.type
          }
        });

      return newStep;
    } catch (error) {
      console.error('Failed to create workflow step:', error);
      throw error;
    }
  }

  /**
   * Update workflow step
   */
  async updateWorkflowStep(
    stepId: string,
    updates: Partial<ContentWorkflowStep>,
    userId: string
  ): Promise<ContentWorkflowStep | null> {
    try {
      const step = this.steps.get(stepId);
      if (!step) return null;

      const updatedStep: ContentWorkflowStep = {
        ...step,
        ...updates,
        metadata: {
          ...step.metadata,
          updatedAt: new Date(),
          lastModifiedBy: userId
        }
      };

      // Store in memory
      this.steps.set(stepId, updatedStep);

      // Store in database
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: userId,
          interaction_type: 'workflow_step_updated',
          user_input: stepId,
          assistant_response: 'step_updated',
          context_data: {
            step: updatedStep,
            updates: Object.keys(updates)
          },
          learning_insights: {
            stepId,
            workflowId: step.workflowId,
            status: updatedStep.status
          }
        });

      return updatedStep;
    } catch (error) {
      console.error('Failed to update workflow step:', error);
      return null;
    }
  }

  /**
   * Get content templates
   */
  getContentTemplates(category?: string, specialty?: string): ContentTemplate[] {
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
   * Create content template
   */
  async createContentTemplate(
    userId: string,
    template: Omit<ContentTemplate, 'id' | 'metadata'>
  ): Promise<ContentTemplate> {
    const newTemplate: ContentTemplate = {
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
   * Generate content suggestions for workflow
   */
  private async generateContentSuggestionsForWorkflow(
    workflow: ContentCreationWorkflow,
    context: AssistantContext
  ): Promise<ContentCreationWorkflow['aiAssistance']['suggestions']> {
    const suggestions: ContentCreationWorkflow['aiAssistance']['suggestions'] = [];

    // Check content length
    if (workflow.content.metadata.wordCount < 300) {
      suggestions.push({
        id: `suggestion_content_length_${Date.now()}`,
        type: 'content',
        priority: 'medium',
        title: 'Increase Content Length',
        description: 'Content is below recommended minimum length',
        suggestion: 'Add more detailed information, examples, or supporting content',
        applied: false
      });
    }

    // Check for headings
    if (workflow.content.structure.sections.length < 3) {
      suggestions.push({
        id: `suggestion_headings_${Date.now()}`,
        type: 'structure',
        priority: 'high',
        title: 'Add More Headings',
        description: 'Content needs more structure with headings',
        suggestion: 'Break content into logical sections with descriptive headings',
        applied: false
      });
    }

    // Check for key points
    if (workflow.content.structure.keyPoints.length < 3) {
      suggestions.push({
        id: `suggestion_key_points_${Date.now()}`,
        type: 'content',
        priority: 'medium',
        title: 'Add Key Points',
        description: 'Content should highlight key takeaways',
        suggestion: 'Add a key points section or summary',
        applied: false
      });
    }

    return suggestions;
  }

  /**
   * Generate structure suggestions
   */
  private async generateStructureSuggestions(
    workflow: ContentCreationWorkflow,
    context: AssistantContext
  ): Promise<ContentCreationWorkflow['aiAssistance']['suggestions']> {
    const suggestions: ContentCreationWorkflow['aiAssistance']['suggestions'] = [];

    // Check for introduction
    const hasIntroduction = workflow.content.structure.sections.some(s => 
      s.title.toLowerCase().includes('introduction') || s.title.toLowerCase().includes('overview')
    );
    if (!hasIntroduction) {
      suggestions.push({
        id: `suggestion_introduction_${Date.now()}`,
        type: 'structure',
        priority: 'high',
        title: 'Add Introduction',
        description: 'Content should start with an introduction',
        suggestion: 'Add an introduction section to provide context and overview',
        applied: false
      });
    }

    // Check for conclusion
    const hasConclusion = workflow.content.structure.sections.some(s => 
      s.title.toLowerCase().includes('conclusion') || s.title.toLowerCase().includes('summary')
    );
    if (!hasConclusion) {
      suggestions.push({
        id: `suggestion_conclusion_${Date.now()}`,
        type: 'structure',
        priority: 'medium',
        title: 'Add Conclusion',
        description: 'Content should end with a conclusion',
        suggestion: 'Add a conclusion section to summarize key points',
        applied: false
      });
    }

    return suggestions;
  }

  /**
   * Generate style suggestions
   */
  private async generateStyleSuggestions(
    workflow: ContentCreationWorkflow,
    context: AssistantContext
  ): Promise<ContentCreationWorkflow['aiAssistance']['suggestions']> {
    const suggestions: ContentCreationWorkflow['aiAssistance']['suggestions'] = [];

    // Check for active voice
    const passiveVoiceCount = (workflow.content.body.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/g) || []).length;
    if (passiveVoiceCount > 5) {
      suggestions.push({
        id: `suggestion_active_voice_${Date.now()}`,
        type: 'style',
        priority: 'medium',
        title: 'Use Active Voice',
        description: 'Content uses too much passive voice',
        suggestion: 'Rewrite sentences to use active voice for better clarity',
        applied: false
      });
    }

    // Check for sentence length
    const sentences = workflow.content.body.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const longSentences = sentences.filter(s => s.split(' ').length > 25);
    if (longSentences.length > 3) {
      suggestions.push({
        id: `suggestion_sentence_length_${Date.now()}`,
        type: 'style',
        priority: 'medium',
        title: 'Shorten Long Sentences',
        description: 'Some sentences are too long and complex',
        suggestion: 'Break long sentences into shorter, clearer ones',
        applied: false
      });
    }

    return suggestions;
  }

  /**
   * Generate compliance suggestions
   */
  private async generateComplianceSuggestions(
    workflow: ContentCreationWorkflow,
    context: AssistantContext
  ): Promise<ContentCreationWorkflow['aiAssistance']['suggestions']> {
    const suggestions: ContentCreationWorkflow['aiAssistance']['suggestions'] = [];

    // Check for disclaimers
    if (workflow.content.metadata.complianceLevel !== 'institutional' && 
        !workflow.content.body.toLowerCase().includes('disclaimer')) {
      suggestions.push({
        id: `suggestion_disclaimer_${Date.now()}`,
        type: 'compliance',
        priority: 'critical',
        title: 'Add Medical Disclaimer',
        description: 'Content requires medical disclaimer for compliance',
        suggestion: 'Add appropriate medical disclaimer to ensure compliance',
        applied: false
      });
    }

    // Check for HIPAA compliance
    if (workflow.content.metadata.complianceLevel === 'hipaa') {
      const phiPatterns = [
        /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
        /\b\d{3}-\d{3}-\d{4}\b/g, // Phone
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g // Email
      ];
      
      const hasPHI = phiPatterns.some(pattern => pattern.test(workflow.content.body));
      if (hasPHI) {
        suggestions.push({
          id: `suggestion_phi_${Date.now()}`,
          type: 'compliance',
          priority: 'critical',
          title: 'Remove PHI',
          description: 'Content contains potential PHI that must be removed',
          suggestion: 'Remove or de-identify all personally identifiable information',
          applied: false
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate accessibility suggestions
   */
  private async generateAccessibilitySuggestions(
    workflow: ContentCreationWorkflow,
    context: AssistantContext
  ): Promise<ContentCreationWorkflow['aiAssistance']['suggestions']> {
    const suggestions: ContentCreationWorkflow['aiAssistance']['suggestions'] = [];

    // Check for alt text
    const imageCount = workflow.content.formatting.images.length;
    const imagesWithAltText = workflow.content.formatting.images.filter(img => img.alt && img.alt.trim().length > 0).length;
    
    if (imageCount > 0 && imagesWithAltText < imageCount) {
      suggestions.push({
        id: `suggestion_alt_text_${Date.now()}`,
        type: 'accessibility',
        priority: 'high',
        title: 'Add Alt Text',
        description: 'Images are missing descriptive alt text',
        suggestion: 'Add descriptive alt text for all images to improve accessibility',
        applied: false
      });
    }

    // Check for heading hierarchy
    const headings = workflow.content.formatting.headings;
    const hasH1 = headings.some(h => h.level === 1);
    if (!hasH1) {
      suggestions.push({
        id: `suggestion_h1_${Date.now()}`,
        type: 'accessibility',
        priority: 'high',
        title: 'Add H1 Heading',
        description: 'Content is missing a main H1 heading',
        suggestion: 'Add a main H1 heading for better document structure',
        applied: false
      });
    }

    return suggestions;
  }

  /**
   * Perform content quality analysis
   */
  private async performContentQualityAnalysis(
    workflow: ContentCreationWorkflow
  ): Promise<ContentCreationWorkflow['aiAssistance']['analytics']> {
    const content = workflow.content.body;
    const wordCount = workflow.content.metadata.wordCount;

    // Calculate readability score (simplified)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 2));

    // Calculate compliance score
    let complianceScore = 100;
    if (workflow.content.metadata.complianceLevel !== 'institutional' && 
        !content.toLowerCase().includes('disclaimer')) {
      complianceScore -= 20;
    }
    if (workflow.content.metadata.complianceLevel === 'hipaa') {
      const phiPatterns = [/\b\d{3}-\d{2}-\d{4}\b/g, /\b\d{3}-\d{3}-\d{4}\b/g, /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g];
      const hasPHI = phiPatterns.some(pattern => pattern.test(content));
      if (hasPHI) complianceScore -= 30;
    }

    // Calculate accessibility score
    let accessibilityScore = 100;
    const imageCount = workflow.content.formatting.images.length;
    const imagesWithAltText = workflow.content.formatting.images.filter(img => img.alt && img.alt.trim().length > 0).length;
    if (imageCount > 0) {
      accessibilityScore = (imagesWithAltText / imageCount) * 100;
    }

    // Calculate quality score
    const qualityScore = (readabilityScore + complianceScore + accessibilityScore) / 3;

    return {
      readabilityScore: Math.round(readabilityScore),
      complianceScore: Math.round(complianceScore),
      accessibilityScore: Math.round(accessibilityScore),
      qualityScore: Math.round(qualityScore),
      suggestionsCount: workflow.aiAssistance.suggestions.length,
      enhancementsCount: workflow.aiAssistance.enhancements.length,
      timeSaved: Math.round(workflow.aiAssistance.suggestions.length * 5) // Estimate 5 minutes per suggestion
    };
  }

  /**
   * Load content templates
   */
  private async loadContentTemplates(): Promise<void> {
    // Load default content templates
    const defaultTemplates: ContentTemplate[] = [
      {
        id: 'template_article',
        name: 'Healthcare Article Template',
        description: 'Template for creating healthcare articles',
        type: 'article',
        category: 'content',
        specialty: 'general',
        complianceLevel: 'institutional',
        structure: {
          sections: [
            {
              id: 'introduction',
              title: 'Introduction',
              description: 'Brief overview of the topic',
              required: true,
              order: 1,
              guidelines: ['Keep it concise', 'Provide context', 'State the purpose'],
              examples: ['This article explores...', 'In this piece, we will...'],
              aiPrompts: ['Write an engaging introduction for a healthcare article about {topic}']
            },
            {
              id: 'main_content',
              title: 'Main Content',
              description: 'Detailed information about the topic',
              required: true,
              order: 2,
              guidelines: ['Use clear headings', 'Include examples', 'Provide evidence'],
              examples: ['What is...', 'How does... work', 'What are the benefits'],
              aiPrompts: ['Develop comprehensive content about {topic} with evidence-based information']
            },
            {
              id: 'conclusion',
              title: 'Conclusion',
              description: 'Summary and key takeaways',
              required: true,
              order: 3,
              guidelines: ['Summarize key points', 'Provide actionable insights'],
              examples: ['In summary...', 'Key takeaways include...'],
              aiPrompts: ['Write a conclusion that summarizes the key points about {topic}']
            }
          ],
          wordCount: { min: 500, max: 2000, recommended: 1000 },
          formatting: {
            headings: ['Use H2 for main sections', 'Use H3 for subsections'],
            lists: ['Use bullet points for key information'],
            tables: ['Use tables for comparisons'],
            images: ['Include relevant diagrams or illustrations']
          }
        },
        guidelines: {
          writing: ['Use clear, concise language', 'Avoid jargon', 'Use active voice'],
          compliance: ['Include disclaimers', 'Cite sources', 'Follow guidelines'],
          accessibility: ['Use descriptive headings', 'Include alt text', 'Ensure color contrast'],
          medical: ['Verify accuracy', 'Use current guidelines', 'Include disclaimers']
        },
        aiPrompts: {
          contentGeneration: [
            'Generate content for a healthcare article about {topic}',
            'Create an engaging introduction for {topic}',
            'Develop key points about {topic}'
          ],
          structureOptimization: [
            'Optimize the structure of this healthcare content',
            'Improve the flow and organization of this article'
          ],
          complianceCheck: [
            'Check this content for healthcare compliance requirements',
            'Ensure this content meets medical writing standards'
          ],
          accessibilityReview: [
            'Review this content for accessibility compliance',
            'Ensure this content meets WCAG guidelines'
          ]
        },
        metadata: {
          createdBy: 'system',
          lastModified: new Date(),
          usageCount: 0,
          successRate: 0,
          healthcareRelevant: true
        }
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }
}
