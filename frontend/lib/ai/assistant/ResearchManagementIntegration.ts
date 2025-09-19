/**
 * Research Management Integration
 * Integrates AI assistant with research management for assistance
 */

import { createClient } from '@/lib/supabase/client';
import { AssistantContext } from './AIAssistantCore';

export interface ResearchProject {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'clinical_trial' | 'observational' | 'meta_analysis' | 'systematic_review' | 'case_study' | 'survey' | 'qualitative';
  status: 'planning' | 'recruiting' | 'active' | 'data_collection' | 'analysis' | 'writing' | 'submitted' | 'published' | 'archived';
  phase: 'preliminary' | 'protocol_development' | 'ethics_approval' | 'data_collection' | 'analysis' | 'publication' | 'follow_up';
  metadata: {
    principalInvestigator: string;
    coInvestigators: string[];
    institution: string;
    department: string;
    medicalSpecialty: string;
    complianceLevel: string;
    startDate: Date;
    endDate?: Date;
    estimatedDuration: number; // in months
    budget?: number;
    fundingSource?: string;
    ethicsApproval?: {
      status: 'pending' | 'approved' | 'rejected' | 'expired';
      approvalNumber?: string;
      expiryDate?: Date;
    };
    regulatoryApproval?: {
      status: 'pending' | 'approved' | 'rejected' | 'expired';
      approvalNumber?: string;
      expiryDate?: Date;
    };
  };
  objectives: {
    primary: string[];
    secondary: string[];
    exploratory: string[];
  };
  methodology: {
    design: string;
    population: {
      inclusionCriteria: string[];
      exclusionCriteria: string[];
      sampleSize: number;
      recruitmentStrategy: string;
    };
    interventions: Array<{
      name: string;
      description: string;
      type: 'drug' | 'device' | 'procedure' | 'behavioral' | 'other';
      dosage?: string;
      frequency?: string;
      duration?: string;
    }>;
    outcomes: Array<{
      name: string;
      description: string;
      type: 'primary' | 'secondary' | 'safety';
      measurement: string;
      timepoint: string;
    }>;
    dataCollection: {
      methods: string[];
      tools: string[];
      schedule: string;
      qualityControl: string[];
    };
    analysis: {
      statisticalMethods: string[];
      software: string[];
      sampleSizeCalculation: string;
      interimAnalysis?: string;
    };
  };
  aiAssistance: {
    suggestions: Array<{
      id: string;
      type: 'methodology' | 'compliance' | 'ethics' | 'statistics' | 'writing' | 'publication';
      priority: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      description: string;
      suggestion: string;
      applied: boolean;
      appliedAt?: Date;
    }>;
    enhancements: Array<{
      id: string;
      type: 'protocol' | 'consent' | 'data_collection' | 'analysis' | 'manuscript';
      original: string;
      enhanced: string;
      explanation: string;
      applied: boolean;
      appliedAt?: Date;
    }>;
    analytics: {
      completenessScore: number; // 0-100
      complianceScore: number; // 0-100
      qualityScore: number; // 0-100
      suggestionsCount: number;
      enhancementsCount: number;
      timeSaved: number; // in minutes
    };
  };
  documents: Array<{
    id: string;
    name: string;
    type: 'protocol' | 'consent_form' | 'data_collection_form' | 'analysis_plan' | 'manuscript' | 'presentation' | 'other';
    version: string;
    status: 'draft' | 'review' | 'approved' | 'final';
    content: string;
    lastModified: Date;
    modifiedBy: string;
  }>;
  timeline: Array<{
    id: string;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
    dependencies: string[];
    deliverables: string[];
    assignedTo?: string;
  }>;
  collaboration: {
    team: Array<{
      userId: string;
      role: 'principal_investigator' | 'co_investigator' | 'research_coordinator' | 'data_manager' | 'statistician' | 'writer' | 'reviewer';
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
    lastModifiedBy: string;
    healthcareRelevant: boolean;
    complianceRequired: boolean;
  };
}

export interface ResearchTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  specialty: string;
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
      figures: string[];
    };
  };
  guidelines: {
    methodology: string[];
    compliance: string[];
    ethics: string[];
    statistics: string[];
  };
  aiPrompts: {
    protocolGeneration: string[];
    methodologyOptimization: string[];
    complianceCheck: string[];
    ethicsReview: string[];
  };
  metadata: {
    createdBy: string;
    lastModified: Date;
    usageCount: number;
    successRate: number;
    healthcareRelevant: boolean;
  };
}

export interface ResearchWorkflowStep {
  id: string;
  projectId: string;
  stepId: string;
  title: string;
  description: string;
  type: 'protocol_development' | 'ethics_approval' | 'recruitment' | 'data_collection' | 'analysis' | 'writing' | 'submission';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  order: number;
  dependencies: string[];
  estimatedDuration: number; // in days
  actualDuration?: number; // in days
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

export class ResearchManagementIntegration {
  private supabase = createClient();
  private projects: Map<string, ResearchProject> = new Map();
  private templates: Map<string, ResearchTemplate> = new Map();
  private steps: Map<string, ResearchWorkflowStep> = new Map();

  constructor() {
    this.loadResearchTemplates();
  }

  /**
   * Create research project
   */
  async createResearchProject(
    userId: string,
    project: Omit<ResearchProject, 'id' | 'metadata' | 'aiAssistance' | 'documents' | 'timeline' | 'collaboration'>
  ): Promise<ResearchProject> {
    try {
      const newProject: ResearchProject = {
        ...project,
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        aiAssistance: {
          suggestions: [],
          enhancements: [],
          analytics: {
            completenessScore: 0,
            complianceScore: 0,
            qualityScore: 0,
            suggestionsCount: 0,
            enhancementsCount: 0,
            timeSaved: 0
          }
        },
        documents: [],
        timeline: [],
        collaboration: {
          team: [{
            userId,
            role: 'principal_investigator',
            permissions: ['read', 'write', 'edit', 'delete', 'approve'],
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
          healthcareRelevant: true,
          complianceRequired: project.metadata.complianceLevel !== 'institutional'
        }
      };

      // Store in memory
      this.projects.set(newProject.id, newProject);

      // Store in database
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: userId,
          interaction_type: 'research_project_created',
          user_input: project.title,
          assistant_response: 'project_created',
          context_data: {
            project: newProject
          },
          learning_insights: {
            projectId: newProject.id,
            projectType: project.type,
            medicalSpecialty: project.metadata.medicalSpecialty
          }
        });

      return newProject;
    } catch (error) {
      console.error('Failed to create research project:', error);
      throw error;
    }
  }

  /**
   * Get research project
   */
  async getResearchProject(projectId: string): Promise<ResearchProject | null> {
    try {
      // Check memory first
      if (this.projects.has(projectId)) {
        return this.projects.get(projectId)!;
      }

      // Load from database
      const { data, error } = await this.supabase
        .from('ai_assistant_learning_data')
        .select('*')
        .eq('interaction_type', 'research_project_created')
        .eq('context_data->project->id', projectId)
        .single();

      if (error) throw error;

      if (data) {
        const project = data.context_data.project as ResearchProject;
        this.projects.set(projectId, project);
        return project;
      }

      return null;
    } catch (error) {
      console.error('Failed to get research project:', error);
      return null;
    }
  }

  /**
   * Update research project
   */
  async updateResearchProject(
    projectId: string,
    updates: Partial<ResearchProject>,
    userId: string
  ): Promise<ResearchProject | null> {
    try {
      const project = await this.getResearchProject(projectId);
      if (!project) return null;

      // Update project
      const updatedProject: ResearchProject = {
        ...project,
        ...updates,
        metadata: {
          ...project.metadata,
          updatedAt: new Date(),
          lastModifiedBy: userId
        }
      };

      // Add to version history
      updatedProject.collaboration.versionHistory.push({
        version: `${updatedProject.collaboration.versionHistory.length + 1}.0`,
        changes: Object.keys(updates),
        userId,
        timestamp: new Date()
      });

      // Store in memory
      this.projects.set(projectId, updatedProject);

      // Store in database
      await this.supabase
        .from('ai_assistant_learning_data')
        .insert({
          user_id: userId,
          interaction_type: 'research_project_updated',
          user_input: projectId,
          assistant_response: 'project_updated',
          context_data: {
            project: updatedProject,
            updates: Object.keys(updates)
          },
          learning_insights: {
            projectId,
            updateCount: updatedProject.collaboration.versionHistory.length
          }
        });

      return updatedProject;
    } catch (error) {
      console.error('Failed to update research project:', error);
      return null;
    }
  }

  /**
   * Generate AI suggestions for research project
   */
  async generateResearchSuggestions(
    projectId: string,
    context: AssistantContext
  ): Promise<ResearchProject['aiAssistance']['suggestions']> {
    try {
      const project = await this.getResearchProject(projectId);
      if (!project) return [];

      const suggestions: ResearchProject['aiAssistance']['suggestions'] = [];

      // Methodology suggestions
      const methodologySuggestions = await this.generateMethodologySuggestions(project, context);
      suggestions.push(...methodologySuggestions);

      // Compliance suggestions
      const complianceSuggestions = await this.generateComplianceSuggestions(project, context);
      suggestions.push(...complianceSuggestions);

      // Ethics suggestions
      const ethicsSuggestions = await this.generateEthicsSuggestions(project, context);
      suggestions.push(...ethicsSuggestions);

      // Statistics suggestions
      const statisticsSuggestions = await this.generateStatisticsSuggestions(project, context);
      suggestions.push(...statisticsSuggestions);

      // Writing suggestions
      const writingSuggestions = await this.generateWritingSuggestions(project, context);
      suggestions.push(...writingSuggestions);

      // Publication suggestions
      const publicationSuggestions = await this.generatePublicationSuggestions(project, context);
      suggestions.push(...publicationSuggestions);

      return suggestions;
    } catch (error) {
      console.error('Failed to generate research suggestions:', error);
      return [];
    }
  }

  /**
   * Apply research enhancement
   */
  async applyResearchEnhancement(
    projectId: string,
    enhancementId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const project = await this.getResearchProject(projectId);
      if (!project) return false;

      // Find enhancement
      const enhancement = project.aiAssistance.enhancements.find(e => e.id === enhancementId);
      if (!enhancement) return false;

      // Apply enhancement
      enhancement.applied = true;
      enhancement.appliedAt = new Date();

      // Update project
      await this.updateResearchProject(projectId, project, userId);

      return true;
    } catch (error) {
      console.error('Failed to apply research enhancement:', error);
      return false;
    }
  }

  /**
   * Analyze research project quality
   */
  async analyzeResearchQuality(projectId: string): Promise<ResearchProject['aiAssistance']['analytics']> {
    try {
      const project = await this.getResearchProject(projectId);
      if (!project) throw new Error('Project not found');

      const analytics = await this.performResearchQualityAnalysis(project);
      
      // Update project
      project.aiAssistance.analytics = analytics;
      await this.updateResearchProject(projectId, project, project.metadata.lastModifiedBy);

      return analytics;
    } catch (error) {
      console.error('Failed to analyze research quality:', error);
      throw error;
    }
  }

  /**
   * Create research workflow step
   */
  async createResearchWorkflowStep(
    projectId: string,
    step: Omit<ResearchWorkflowStep, 'id' | 'projectId' | 'metadata' | 'aiAssistance' | 'deliverables' | 'quality'>
  ): Promise<ResearchWorkflowStep> {
    try {
      const newStep: ResearchWorkflowStep = {
        ...step,
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId,
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
          interaction_type: 'research_step_created',
          user_input: step.title,
          assistant_response: 'step_created',
          context_data: {
            step: newStep
          },
          learning_insights: {
            stepId: newStep.id,
            projectId,
            stepType: step.type
          }
        });

      return newStep;
    } catch (error) {
      console.error('Failed to create research workflow step:', error);
      throw error;
    }
  }

  /**
   * Get research templates
   */
  getResearchTemplates(specialty?: string, complianceLevel?: string): ResearchTemplate[] {
    let templates = Array.from(this.templates.values());

    if (specialty) {
      templates = templates.filter(t => t.specialty === specialty || t.specialty === 'general');
    }

    if (complianceLevel) {
      templates = templates.filter(t => t.complianceLevel === complianceLevel);
    }

    return templates.sort((a, b) => b.metadata.usageCount - a.metadata.usageCount);
  }

  /**
   * Generate methodology suggestions
   */
  private async generateMethodologySuggestions(
    project: ResearchProject,
    context: AssistantContext
  ): Promise<ResearchProject['aiAssistance']['suggestions']> {
    const suggestions: ResearchProject['aiAssistance']['suggestions'] = [];

    // Check sample size calculation
    if (!project.methodology.analysis.sampleSizeCalculation) {
      suggestions.push({
        id: `suggestion_sample_size_${Date.now()}`,
        type: 'methodology',
        priority: 'high',
        title: 'Add Sample Size Calculation',
        description: 'Research project requires sample size calculation',
        suggestion: 'Calculate appropriate sample size based on study design and expected effect size',
        applied: false
      });
    }

    // Check statistical methods
    if (project.methodology.analysis.statisticalMethods.length === 0) {
      suggestions.push({
        id: `suggestion_statistical_methods_${Date.now()}`,
        type: 'methodology',
        priority: 'high',
        title: 'Define Statistical Methods',
        description: 'Research project requires defined statistical methods',
        suggestion: 'Specify statistical methods for data analysis based on study design',
        applied: false
      });
    }

    // Check inclusion/exclusion criteria
    if (project.methodology.population.inclusionCriteria.length === 0) {
      suggestions.push({
        id: `suggestion_inclusion_criteria_${Date.now()}`,
        type: 'methodology',
        priority: 'critical',
        title: 'Define Inclusion Criteria',
        description: 'Research project requires clear inclusion criteria',
        suggestion: 'Define specific inclusion criteria for participant selection',
        applied: false
      });
    }

    return suggestions;
  }

  /**
   * Generate compliance suggestions
   */
  private async generateComplianceSuggestions(
    project: ResearchProject,
    context: AssistantContext
  ): Promise<ResearchProject['aiAssistance']['suggestions']> {
    const suggestions: ResearchProject['aiAssistance']['suggestions'] = [];

    // Check ethics approval
    if (!project.metadata.ethicsApproval || project.metadata.ethicsApproval.status !== 'approved') {
      suggestions.push({
        id: `suggestion_ethics_approval_${Date.now()}`,
        type: 'compliance',
        priority: 'critical',
        title: 'Obtain Ethics Approval',
        description: 'Research project requires ethics approval before proceeding',
        suggestion: 'Submit research protocol for ethics committee review and approval',
        applied: false
      });
    }

    // Check regulatory approval
    if (project.metadata.complianceLevel === 'fda' && 
        (!project.metadata.regulatoryApproval || project.metadata.regulatoryApproval.status !== 'approved')) {
      suggestions.push({
        id: `suggestion_regulatory_approval_${Date.now()}`,
        type: 'compliance',
        priority: 'critical',
        title: 'Obtain Regulatory Approval',
        description: 'Research project requires regulatory approval for FDA compliance',
        suggestion: 'Submit research protocol for regulatory review and approval',
        applied: false
      });
    }

    return suggestions;
  }

  /**
   * Generate ethics suggestions
   */
  private async generateEthicsSuggestions(
    project: ResearchProject,
    context: AssistantContext
  ): Promise<ResearchProject['aiAssistance']['suggestions']> {
    const suggestions: ResearchProject['aiAssistance']['suggestions'] = [];

    // Check informed consent
    const hasConsentForm = project.documents.some(doc => doc.type === 'consent_form');
    if (!hasConsentForm) {
      suggestions.push({
        id: `suggestion_consent_form_${Date.now()}`,
        type: 'ethics',
        priority: 'critical',
        title: 'Create Informed Consent Form',
        description: 'Research project requires informed consent form',
        suggestion: 'Develop comprehensive informed consent form for participants',
        applied: false
      });
    }

    // Check data protection
    if (project.metadata.complianceLevel === 'hipaa') {
      suggestions.push({
        id: `suggestion_data_protection_${Date.now()}`,
        type: 'ethics',
        priority: 'high',
        title: 'Implement Data Protection Measures',
        description: 'Research project requires HIPAA-compliant data protection',
        suggestion: 'Implement appropriate data protection measures for PHI',
        applied: false
      });
    }

    return suggestions;
  }

  /**
   * Generate statistics suggestions
   */
  private async generateStatisticsSuggestions(
    project: ResearchProject,
    context: AssistantContext
  ): Promise<ResearchProject['aiAssistance']['suggestions']> {
    const suggestions: ResearchProject['aiAssistance']['suggestions'] = [];

    // Check power analysis
    if (!project.methodology.analysis.sampleSizeCalculation) {
      suggestions.push({
        id: `suggestion_power_analysis_${Date.now()}`,
        type: 'statistics',
        priority: 'high',
        title: 'Perform Power Analysis',
        description: 'Research project requires power analysis for sample size determination',
        suggestion: 'Conduct power analysis to determine appropriate sample size',
        applied: false
      });
    }

    // Check interim analysis
    if (project.metadata.estimatedDuration > 12 && !project.methodology.analysis.interimAnalysis) {
      suggestions.push({
        id: `suggestion_interim_analysis_${Date.now()}`,
        type: 'statistics',
        priority: 'medium',
        title: 'Plan Interim Analysis',
        description: 'Long-term research project should consider interim analysis',
        suggestion: 'Plan interim analysis for long-term studies to monitor safety and efficacy',
        applied: false
      });
    }

    return suggestions;
  }

  /**
   * Generate writing suggestions
   */
  private async generateWritingSuggestions(
    project: ResearchProject,
    context: AssistantContext
  ): Promise<ResearchProject['aiAssistance']['suggestions']> {
    const suggestions: ResearchProject['aiAssistance']['suggestions'] = [];

    // Check protocol document
    const hasProtocol = project.documents.some(doc => doc.type === 'protocol' && doc.status === 'final');
    if (!hasProtocol) {
      suggestions.push({
        id: `suggestion_protocol_${Date.now()}`,
        type: 'writing',
        priority: 'high',
        title: 'Complete Research Protocol',
        description: 'Research project requires complete research protocol',
        suggestion: 'Develop comprehensive research protocol document',
        applied: false
      });
    }

    // Check manuscript
    const hasManuscript = project.documents.some(doc => doc.type === 'manuscript');
    if (project.status === 'analysis' && !hasManuscript) {
      suggestions.push({
        id: `suggestion_manuscript_${Date.now()}`,
        type: 'writing',
        priority: 'medium',
        title: 'Start Manuscript Writing',
        description: 'Research project is ready for manuscript writing',
        suggestion: 'Begin writing research manuscript for publication',
        applied: false
      });
    }

    return suggestions;
  }

  /**
   * Generate publication suggestions
   */
  private async generatePublicationSuggestions(
    project: ResearchProject,
    context: AssistantContext
  ): Promise<ResearchProject['aiAssistance']['suggestions']> {
    const suggestions: ResearchProject['aiAssistance']['suggestions'] = [];

    // Check publication readiness
    if (project.status === 'writing' && project.documents.some(doc => doc.type === 'manuscript' && doc.status === 'final')) {
      suggestions.push({
        id: `suggestion_publication_${Date.now()}`,
        type: 'publication',
        priority: 'medium',
        title: 'Submit for Publication',
        description: 'Research project is ready for publication submission',
        suggestion: 'Submit research manuscript to appropriate journal for publication',
        applied: false
      });
    }

    return suggestions;
  }

  /**
   * Perform research quality analysis
   */
  private async performResearchQualityAnalysis(
    project: ResearchProject
  ): Promise<ResearchProject['aiAssistance']['analytics']> {
    let completenessScore = 0;
    let complianceScore = 0;
    let qualityScore = 0;

    // Calculate completeness score
    const requiredElements = [
      project.objectives.primary.length > 0,
      project.methodology.population.inclusionCriteria.length > 0,
      project.methodology.outcomes.length > 0,
      project.methodology.analysis.statisticalMethods.length > 0,
      project.documents.some(doc => doc.type === 'protocol'),
      project.metadata.ethicsApproval?.status === 'approved'
    ];
    completenessScore = (requiredElements.filter(Boolean).length / requiredElements.length) * 100;

    // Calculate compliance score
    let complianceElements = 0;
    let totalComplianceElements = 0;

    if (project.metadata.ethicsApproval?.status === 'approved') complianceElements++;
    totalComplianceElements++;

    if (project.metadata.complianceLevel === 'fda') {
      if (project.metadata.regulatoryApproval?.status === 'approved') complianceElements++;
      totalComplianceElements++;
    }

    if (project.metadata.complianceLevel === 'hipaa') {
      if (project.documents.some(doc => doc.type === 'consent_form')) complianceElements++;
      totalComplianceElements++;
    }

    complianceScore = totalComplianceElements > 0 ? (complianceElements / totalComplianceElements) * 100 : 100;

    // Calculate quality score
    const qualityElements = [
      project.methodology.analysis.sampleSizeCalculation ? 1 : 0,
      project.methodology.analysis.interimAnalysis ? 1 : 0,
      project.documents.some(doc => doc.type === 'consent_form') ? 1 : 0,
      project.collaboration.team.length > 1 ? 1 : 0
    ];
    qualityScore = (qualityElements.reduce((sum, val) => sum + val, 0) / qualityElements.length) * 100;

    return {
      completenessScore: Math.round(completenessScore),
      complianceScore: Math.round(complianceScore),
      qualityScore: Math.round(qualityScore),
      suggestionsCount: project.aiAssistance.suggestions.length,
      enhancementsCount: project.aiAssistance.enhancements.length,
      timeSaved: Math.round(project.aiAssistance.suggestions.length * 10) // Estimate 10 minutes per suggestion
    };
  }

  /**
   * Load research templates
   */
  private async loadResearchTemplates(): Promise<void> {
    // Load default research templates
    const defaultTemplates: ResearchTemplate[] = [
      {
        id: 'template_clinical_trial',
        name: 'Clinical Trial Protocol Template',
        description: 'Template for creating clinical trial protocols',
        type: 'clinical_trial',
        specialty: 'general',
        complianceLevel: 'fda',
        structure: {
          sections: [
            {
              id: 'title',
              title: 'Title',
              description: 'Study title',
              required: true,
              order: 1,
              guidelines: ['Clear and descriptive', 'Include study design'],
              examples: ['A Randomized Controlled Trial of...'],
              aiPrompts: ['Generate a clear and descriptive title for a clinical trial about {topic}']
            },
            {
              id: 'background',
              title: 'Background',
              description: 'Study background and rationale',
              required: true,
              order: 2,
              guidelines: ['Provide context', 'State the problem', 'Justify the study'],
              examples: ['The prevalence of...', 'Current treatments...'],
              aiPrompts: ['Write a comprehensive background section for a clinical trial about {topic}']
            },
            {
              id: 'objectives',
              title: 'Objectives',
              description: 'Primary and secondary objectives',
              required: true,
              order: 3,
              guidelines: ['Clear and measurable', 'SMART objectives'],
              examples: ['To evaluate the efficacy of...', 'To assess the safety of...'],
              aiPrompts: ['Define clear primary and secondary objectives for a clinical trial about {topic}']
            }
          ],
          wordCount: { min: 5000, max: 15000, recommended: 10000 },
          formatting: {
            headings: ['Use clear section headings', 'Number sections and subsections'],
            lists: ['Use bullet points for criteria', 'Use numbered lists for procedures'],
            tables: ['Use tables for inclusion/exclusion criteria', 'Use tables for outcomes'],
            figures: ['Include study flow diagram', 'Include sample size calculation']
          }
        },
        guidelines: {
          methodology: ['Follow CONSORT guidelines', 'Use appropriate study design', 'Define clear endpoints'],
          compliance: ['Follow FDA guidelines', 'Include safety monitoring', 'Define stopping rules'],
          ethics: ['Include informed consent', 'Define data protection', 'Include safety measures'],
          statistics: ['Include sample size calculation', 'Define statistical methods', 'Plan interim analysis']
        },
        aiPrompts: {
          protocolGeneration: [
            'Generate a clinical trial protocol for {topic}',
            'Create a study design for {topic}',
            'Develop inclusion/exclusion criteria for {topic}'
          ],
          methodologyOptimization: [
            'Optimize the methodology for this clinical trial',
            'Improve the study design for better outcomes'
          ],
          complianceCheck: [
            'Check this protocol for FDA compliance',
            'Ensure this protocol meets regulatory requirements'
          ],
          ethicsReview: [
            'Review this protocol for ethical considerations',
            'Ensure this protocol protects participant rights'
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
