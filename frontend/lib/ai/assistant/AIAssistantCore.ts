/**
 * AI Assistant Core Engine
 * Microsoft Copilot-style AI assistant with healthcare optimization
 */

import { ContextManager } from './ContextManager';
import { RecommendationEngine } from './RecommendationEngine';
import { ConversationManager } from './ConversationManager';
import { VoiceInterface } from './VoiceInterface';
import { HealthcareOrchestrator } from '../healthcare-orchestrator';
import { SharedContextManager } from '../shared-context-manager';
import { TaskDelegator } from '../task-delegator';

export interface AIAssistantConfig {
  userId: string;
  healthcareRole: 'physician' | 'nurse' | 'administrator' | 'researcher';
  medicalSpecialty?: string;
  complianceLevel: 'hipaa' | 'fda' | 'institutional';
  accessibilityPreferences: {
    voiceEnabled: boolean;
    screenReaderSupport: boolean;
    keyboardNavigation: boolean;
    highContrast: boolean;
  };
  language: string;
  timezone: string;
}

export interface AssistantContext {
  currentPage: string;
  currentTask: string;
  userIntent: string;
  medicalContext: {
    specialty: string;
    complianceLevel: string;
    patientSafety: boolean;
  };
  conversationHistory: Array<{
    timestamp: Date;
    userMessage: string;
    assistantResponse: string;
    context: Record<string, any>;
  }>;
  preferences: Record<string, any>;
}

export interface AssistantResponse {
  message: string;
  suggestions: string[];
  actions: Array<{
    type: 'navigate' | 'create' | 'update' | 'delete' | 'analyze';
    target: string;
    parameters: Record<string, any>;
  }>;
  voiceResponse?: string;
  contextUpdate?: Partial<AssistantContext>;
}

export class AIAssistantCore {
  private contextManager: ContextManager;
  private recommendationEngine: RecommendationEngine;
  private conversationManager: ConversationManager;
  private voiceInterface: VoiceInterface;
  private healthcareOrchestrator: HealthcareOrchestrator;
  private sharedContextManager: SharedContextManager;
  private taskDelegator: TaskDelegator;
  private config: AIAssistantConfig;
  private isInitialized = false;

  constructor(config: AIAssistantConfig) {
    this.config = config;
    this.contextManager = new ContextManager(config);
    this.recommendationEngine = new RecommendationEngine(config);
    this.conversationManager = new ConversationManager(config);
    this.voiceInterface = new VoiceInterface(config);
    this.healthcareOrchestrator = new HealthcareOrchestrator();
    this.sharedContextManager = new SharedContextManager();
    this.taskDelegator = new TaskDelegator();
  }

  /**
   * Initialize the AI Assistant with healthcare context
   */
  async initialize(): Promise<void> {
    try {
      // Initialize context management
      await this.contextManager.initialize();
      
      // Initialize recommendation engine
      await this.recommendationEngine.initialize();
      
      // Initialize conversation management
      await this.conversationManager.initialize();
      
      // Initialize voice interface if enabled
      if (this.config.accessibilityPreferences.voiceEnabled) {
        await this.voiceInterface.initialize();
      }
      
      // Initialize healthcare orchestrator
      await this.healthcareOrchestrator.initialize();
      
      // Initialize shared context
      await this.sharedContextManager.initialize();
      
      // Initialize task delegation
      await this.taskDelegator.initialize();
      
      this.isInitialized = true;
      
      // Log initialization for audit trail
      await this.logActivity('assistant_initialized', {
        userId: this.config.userId,
        healthcareRole: this.config.healthcareRole,
        medicalSpecialty: this.config.medicalSpecialty,
        complianceLevel: this.config.complianceLevel
      });
      
    } catch (error) {
      console.error('Failed to initialize AI Assistant:', error);
      throw new Error(`AI Assistant initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process user input and generate contextual response
   */
  async processUserInput(
    input: string,
    context: Partial<AssistantContext> = {}
  ): Promise<AssistantResponse> {
    if (!this.isInitialized) {
      throw new Error('AI Assistant not initialized. Call initialize() first.');
    }

    try {
      // Update context with current state
      const updatedContext = await this.contextManager.updateContext(context);
      
      // Analyze user intent using healthcare context
      const intent = await this.analyzeUserIntent(input, updatedContext);
      
      // Generate recommendations based on context and intent
      const recommendations = await this.recommendationEngine.generateRecommendations(
        intent,
        updatedContext
      );
      
      // Process conversation with healthcare compliance
      const conversationResponse = await this.conversationManager.processMessage(
        input,
        updatedContext,
        intent
      );
      
      // Generate actionable suggestions
      const suggestions = await this.generateActionableSuggestions(
        intent,
        updatedContext,
        recommendations
      );
      
      // Generate voice response if voice is enabled
      let voiceResponse: string | undefined;
      if (this.config.accessibilityPreferences.voiceEnabled) {
        voiceResponse = await this.voiceInterface.generateVoiceResponse(
          conversationResponse.message
        );
      }
      
      // Create response object
      const response: AssistantResponse = {
        message: conversationResponse.message,
        suggestions,
        actions: conversationResponse.actions || [],
        voiceResponse,
        contextUpdate: conversationResponse.contextUpdate
      };
      
      // Log interaction for audit trail
      await this.logActivity('user_interaction', {
        userId: this.config.userId,
        input,
        intent: intent.type,
        responseLength: response.message.length,
        suggestionsCount: suggestions.length
      });
      
      return response;
      
    } catch (error) {
      console.error('Error processing user input:', error);
      
      // Return fallback response with error context preservation
      return {
        message: "I apologize, but I'm experiencing technical difficulties. Please try again or contact support if the issue persists.",
        suggestions: [
          "Try rephrasing your request",
          "Check your internet connection",
          "Contact technical support"
        ],
        actions: [],
        contextUpdate: { error: true }
      };
    }
  }

  /**
   * Analyze user intent with healthcare context awareness
   */
  private async analyzeUserIntent(
    input: string,
    context: AssistantContext
  ): Promise<{
    type: 'question' | 'command' | 'request' | 'clarification' | 'emergency';
    confidence: number;
    healthcareRelevant: boolean;
    requiresCompliance: boolean;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }> {
    // Use healthcare orchestrator for intent analysis
    const analysis = await this.healthcareOrchestrator.analyzeIntent(input, {
      userRole: this.config.healthcareRole,
      medicalSpecialty: this.config.medicalSpecialty,
      complianceLevel: this.config.complianceLevel,
      currentContext: context
    });
    
    return {
      type: analysis.intentType,
      confidence: analysis.confidence,
      healthcareRelevant: analysis.healthcareRelevant,
      requiresCompliance: analysis.requiresCompliance,
      urgency: analysis.urgency
    };
  }

  /**
   * Generate actionable suggestions based on context and recommendations
   */
  private async generateActionableSuggestions(
    intent: any,
    context: AssistantContext,
    recommendations: string[]
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Add context-aware suggestions
    if (context.currentPage.includes('content')) {
      suggestions.push("Would you like me to help optimize this content for SEO?");
      suggestions.push("I can check this content for healthcare compliance issues");
    }
    
    if (context.currentPage.includes('analytics')) {
      suggestions.push("I can provide insights on your analytics data");
      suggestions.push("Would you like me to generate a performance report?");
    }
    
    if (context.currentPage.includes('research')) {
      suggestions.push("I can help you find relevant medical literature");
      suggestions.push("Would you like me to validate these research findings?");
    }
    
    // Add healthcare-specific suggestions
    if (this.config.healthcareRole === 'physician') {
      suggestions.push("I can help you with clinical decision support");
      suggestions.push("Would you like me to check for drug interactions?");
    }
    
    if (this.config.healthcareRole === 'nurse') {
      suggestions.push("I can help you with patient care protocols");
      suggestions.push("Would you like me to check medication administration guidelines?");
    }
    
    if (this.config.healthcareRole === 'administrator') {
      suggestions.push("I can help you with compliance reporting");
      suggestions.push("Would you like me to generate a risk assessment?");
    }
    
    // Add recommendations from engine
    suggestions.push(...recommendations);
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Log activity for audit trail and compliance
   */
  private async logActivity(
    activityType: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      // Log to healthcare audit system
      await this.healthcareOrchestrator.logActivity(activityType, {
        ...data,
        timestamp: new Date().toISOString(),
        assistantVersion: '1.0.0',
        complianceLevel: this.config.complianceLevel
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - logging failures shouldn't break the assistant
    }
  }

  /**
   * Get current context for debugging and monitoring
   */
  getCurrentContext(): AssistantContext {
    return this.contextManager.getCurrentContext();
  }

  /**
   * Update configuration (requires re-initialization)
   */
  async updateConfig(newConfig: Partial<AIAssistantConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    // Re-initialize with new configuration
    await this.initialize();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.contextManager.cleanup();
      await this.recommendationEngine.cleanup();
      await this.conversationManager.cleanup();
      await this.voiceInterface.cleanup();
      
      this.isInitialized = false;
      
      await this.logActivity('assistant_cleanup', {
        userId: this.config.userId
      });
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}
