/**
 * Context Manager for AI Assistant
 * Manages real-time context tracking and analysis for healthcare workflows
 */

import { AssistantContext, AIAssistantConfig } from './AIAssistantCore';

export interface ContextUpdate {
  currentPage?: string;
  currentTask?: string;
  userIntent?: string;
  medicalContext?: {
    specialty: string;
    complianceLevel: string;
    patientSafety: boolean;
  };
  preferences?: Record<string, any>;
  timestamp: Date;
}

export interface ContextAnalysis {
  workflowStage: 'planning' | 'execution' | 'review' | 'completion';
  complexity: 'low' | 'medium' | 'high';
  healthcareRelevance: number; // 0-1
  complianceRisk: 'low' | 'medium' | 'high';
  userExpertise: 'beginner' | 'intermediate' | 'expert';
  suggestedActions: string[];
}

export class ContextManager {
  private config: AIAssistantConfig;
  private currentContext: AssistantContext;
  private contextHistory: AssistantContext[] = [];
  private maxHistorySize = 50;
  private isInitialized = false;

  constructor(config: AIAssistantConfig) {
    this.config = config;
    this.currentContext = this.createInitialContext();
  }

  /**
   * Initialize the context manager
   */
  async initialize(): Promise<void> {
    try {
      // Load user preferences from storage
      await this.loadUserPreferences();
      
      // Initialize context with user role and specialty
      this.currentContext.medicalContext = {
        specialty: this.config.medicalSpecialty || 'general',
        complianceLevel: this.config.complianceLevel,
        patientSafety: true
      };
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ContextManager:', error);
      throw error;
    }
  }

  /**
   * Update context with new information
   */
  async updateContext(update: Partial<AssistantContext>): Promise<AssistantContext> {
    if (!this.isInitialized) {
      throw new Error('ContextManager not initialized');
    }

    // Store previous context in history
    this.contextHistory.unshift({ ...this.currentContext });
    
    // Limit history size
    if (this.contextHistory.length > this.maxHistorySize) {
      this.contextHistory = this.contextHistory.slice(0, this.maxHistorySize);
    }

    // Update current context
    this.currentContext = {
      ...this.currentContext,
      ...update,
      conversationHistory: this.currentContext.conversationHistory || []
    };

    // Analyze context for insights
    const analysis = await this.analyzeContext();
    
    // Update context with analysis insights
    this.currentContext.userIntent = analysis.suggestedActions[0] || this.currentContext.userIntent;

    return this.currentContext;
  }

  /**
   * Analyze current context for insights and recommendations
   */
  async analyzeContext(): Promise<ContextAnalysis> {
    const context = this.currentContext;
    
    // Determine workflow stage
    const workflowStage = this.determineWorkflowStage(context);
    
    // Calculate complexity based on task and context
    const complexity = this.calculateComplexity(context);
    
    // Assess healthcare relevance
    const healthcareRelevance = this.assessHealthcareRelevance(context);
    
    // Evaluate compliance risk
    const complianceRisk = this.evaluateComplianceRisk(context);
    
    // Determine user expertise level
    const userExpertise = this.determineUserExpertise(context);
    
    // Generate suggested actions
    const suggestedActions = await this.generateSuggestedActions(context, {
      workflowStage,
      complexity,
      healthcareRelevance,
      complianceRisk,
      userExpertise
    });

    return {
      workflowStage,
      complexity,
      healthcareRelevance,
      complianceRisk,
      userExpertise,
      suggestedActions
    };
  }

  /**
   * Get current context
   */
  getCurrentContext(): AssistantContext {
    return { ...this.currentContext };
  }

  /**
   * Get context history
   */
  getContextHistory(): AssistantContext[] {
    return [...this.contextHistory];
  }

  /**
   * Add conversation to context
   */
  addConversation(
    userMessage: string,
    assistantResponse: string,
    context: Record<string, any> = {}
  ): void {
    this.currentContext.conversationHistory.push({
      timestamp: new Date(),
      userMessage,
      assistantResponse,
      context
    });
  }

  /**
   * Clear context history
   */
  clearHistory(): void {
    this.contextHistory = [];
  }

  /**
   * Create initial context based on configuration
   */
  private createInitialContext(): AssistantContext {
    return {
      currentPage: '',
      currentTask: '',
      userIntent: '',
      medicalContext: {
        specialty: this.config.medicalSpecialty || 'general',
        complianceLevel: this.config.complianceLevel,
        patientSafety: true
      },
      conversationHistory: [],
      preferences: {}
    };
  }

  /**
   * Load user preferences from storage
   */
  private async loadUserPreferences(): Promise<void> {
    try {
      // In a real implementation, this would load from Supabase
      // For now, we'll use default preferences
      this.currentContext.preferences = {
        language: this.config.language,
        timezone: this.config.timezone,
        accessibility: this.config.accessibilityPreferences,
        healthcareRole: this.config.healthcareRole,
        medicalSpecialty: this.config.medicalSpecialty
      };
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      // Use default preferences
    }
  }

  /**
   * Determine current workflow stage
   */
  private determineWorkflowStage(context: AssistantContext): 'planning' | 'execution' | 'review' | 'completion' {
    const task = context.currentTask.toLowerCase();
    const page = context.currentPage.toLowerCase();
    
    if (task.includes('plan') || task.includes('prepare') || page.includes('dashboard')) {
      return 'planning';
    }
    
    if (task.includes('create') || task.includes('edit') || task.includes('update')) {
      return 'execution';
    }
    
    if (task.includes('review') || task.includes('check') || task.includes('validate')) {
      return 'review';
    }
    
    if (task.includes('complete') || task.includes('finish') || task.includes('submit')) {
      return 'completion';
    }
    
    return 'execution'; // Default
  }

  /**
   * Calculate task complexity
   */
  private calculateComplexity(context: AssistantContext): 'low' | 'medium' | 'high' {
    const task = context.currentTask.toLowerCase();
    const page = context.currentPage.toLowerCase();
    
    // High complexity indicators
    if (task.includes('compliance') || task.includes('audit') || 
        task.includes('research') || task.includes('analysis')) {
      return 'high';
    }
    
    // Medium complexity indicators
    if (task.includes('create') || task.includes('update') || 
        task.includes('review') || page.includes('analytics')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Assess healthcare relevance
   */
  private assessHealthcareRelevance(context: AssistantContext): number {
    let relevance = 0;
    
    // Check for medical terminology
    const medicalTerms = ['patient', 'clinical', 'medical', 'healthcare', 'diagnosis', 'treatment', 'therapy'];
    const text = `${context.currentTask} ${context.currentPage}`.toLowerCase();
    
    medicalTerms.forEach(term => {
      if (text.includes(term)) {
        relevance += 0.2;
      }
    });
    
    // Check medical context
    if (context.medicalContext?.specialty !== 'general') {
      relevance += 0.3;
    }
    
    // Check compliance level
    if (context.medicalContext?.complianceLevel !== 'institutional') {
      relevance += 0.2;
    }
    
    return Math.min(relevance, 1);
  }

  /**
   * Evaluate compliance risk
   */
  private evaluateComplianceRisk(context: AssistantContext): 'low' | 'medium' | 'high' {
    const task = context.currentTask.toLowerCase();
    const complianceLevel = context.medicalContext?.complianceLevel;
    
    // High risk indicators
    if (task.includes('patient') || task.includes('phi') || 
        task.includes('hipaa') || task.includes('fda')) {
      return 'high';
    }
    
    // Medium risk indicators
    if (task.includes('data') || task.includes('privacy') || 
        task.includes('security') || complianceLevel === 'hipaa') {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Determine user expertise level
   */
  private determineUserExpertise(context: AssistantContext): 'beginner' | 'intermediate' | 'expert' {
    const role = this.config.healthcareRole;
    const conversationCount = context.conversationHistory.length;
    
    // Expert indicators
    if (role === 'physician' || conversationCount > 20) {
      return 'expert';
    }
    
    // Intermediate indicators
    if (role === 'nurse' || conversationCount > 10) {
      return 'intermediate';
    }
    
    return 'beginner';
  }

  /**
   * Generate suggested actions based on context analysis
   */
  private async generateSuggestedActions(
    context: AssistantContext,
    analysis: Omit<ContextAnalysis, 'suggestedActions'>
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Workflow stage suggestions
    if (analysis.workflowStage === 'planning') {
      suggestions.push("Would you like me to help you plan this task?");
      suggestions.push("I can suggest best practices for this type of work");
    }
    
    if (analysis.workflowStage === 'execution') {
      suggestions.push("I can help you execute this task efficiently");
      suggestions.push("Would you like me to check for potential issues?");
    }
    
    if (analysis.workflowStage === 'review') {
      suggestions.push("I can help you review this content for accuracy");
      suggestions.push("Would you like me to check compliance requirements?");
    }
    
    // Complexity-based suggestions
    if (analysis.complexity === 'high') {
      suggestions.push("This is a complex task - I can break it down into steps");
      suggestions.push("Would you like me to provide detailed guidance?");
    }
    
    // Healthcare relevance suggestions
    if (analysis.healthcareRelevance > 0.7) {
      suggestions.push("I can help with healthcare-specific considerations");
      suggestions.push("Would you like me to check medical accuracy?");
    }
    
    // Compliance risk suggestions
    if (analysis.complianceRisk === 'high') {
      suggestions.push("This involves sensitive data - I can help ensure compliance");
      suggestions.push("Would you like me to review privacy requirements?");
    }
    
    // User expertise suggestions
    if (analysis.userExpertise === 'beginner') {
      suggestions.push("I can provide step-by-step guidance");
      suggestions.push("Would you like me to explain any medical terms?");
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.contextHistory = [];
    this.isInitialized = false;
  }
}
