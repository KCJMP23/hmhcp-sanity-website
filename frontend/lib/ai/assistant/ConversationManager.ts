/**
 * Conversation Manager for AI Assistant
 * Handles natural language conversation with healthcare context awareness
 */

import { AIAssistantConfig, AssistantContext } from './AIAssistantCore';

export interface ConversationMessage {
  id: string;
  timestamp: Date;
  role: 'user' | 'assistant' | 'system';
  content: string;
  context: Record<string, any>;
  metadata: {
    intent?: string;
    confidence?: number;
    healthcareRelevant?: boolean;
    requiresCompliance?: boolean;
    urgency?: string;
  };
}

export interface ConversationResponse {
  message: string;
  actions?: Array<{
    type: 'navigate' | 'create' | 'update' | 'delete' | 'analyze';
    target: string;
    parameters: Record<string, any>;
  }>;
  contextUpdate?: Partial<AssistantContext>;
  suggestions?: string[];
  confidence: number;
}

export interface ConversationContext {
  conversationId: string;
  messages: ConversationMessage[];
  currentIntent: string;
  conversationStage: 'greeting' | 'understanding' | 'processing' | 'responding' | 'followup';
  healthcareContext: {
    specialty: string;
    complianceLevel: string;
    patientSafety: boolean;
  };
  userPreferences: Record<string, any>;
}

export class ConversationManager {
  private config: AIAssistantConfig;
  private isInitialized = false;
  private conversationHistory: Map<string, ConversationContext> = new Map();
  private currentConversationId: string | null = null;

  constructor(config: AIAssistantConfig) {
    this.config = config;
  }

  /**
   * Initialize the conversation manager
   */
  async initialize(): Promise<void> {
    try {
      // Initialize conversation templates
      await this.initializeConversationTemplates();
      
      // Load conversation history if available
      await this.loadConversationHistory();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ConversationManager:', error);
      throw error;
    }
  }

  /**
   * Process a user message and generate response
   */
  async processMessage(
    userMessage: string,
    context: AssistantContext,
    intent: any
  ): Promise<ConversationResponse> {
    if (!this.isInitialized) {
      throw new Error('ConversationManager not initialized');
    }

    try {
      // Get or create conversation context
      const conversationContext = await this.getOrCreateConversationContext(context);
      
      // Add user message to conversation
      const userMsg = this.createMessage('user', userMessage, context, intent);
      conversationContext.messages.push(userMsg);
      
      // Update conversation stage
      this.updateConversationStage(conversationContext, userMessage, intent);
      
      // Generate response based on conversation stage and intent
      const response = await this.generateResponse(conversationContext, userMsg, intent);
      
      // Add assistant response to conversation
      const assistantMsg = this.createMessage('assistant', response.message, context, {
        intent: intent.type,
        confidence: response.confidence
      });
      conversationContext.messages.push(assistantMsg);
      
      // Update conversation context
      this.currentConversationId = conversationContext.conversationId;
      
      return response;
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Return fallback response
      return {
        message: "I apologize, but I'm having trouble understanding your request. Could you please rephrase it?",
        confidence: 0.1,
        suggestions: [
          "Try asking a more specific question",
          "Provide more context about what you're trying to do",
          "Check if you're in the right section of the platform"
        ]
      };
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId?: string): ConversationMessage[] {
    const id = conversationId || this.currentConversationId;
    if (!id || !this.conversationHistory.has(id)) {
      return [];
    }
    
    return this.conversationHistory.get(id)!.messages;
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(conversationId?: string): void {
    const id = conversationId || this.currentConversationId;
    if (id && this.conversationHistory.has(id)) {
      this.conversationHistory.delete(id);
    }
  }

  /**
   * Get or create conversation context
   */
  private async getOrCreateConversationContext(
    context: AssistantContext
  ): Promise<ConversationContext> {
    // Use current page as conversation identifier
    const conversationId = `conv_${context.currentPage}_${Date.now()}`;
    
    if (this.conversationHistory.has(conversationId)) {
      return this.conversationHistory.get(conversationId)!;
    }
    
    // Create new conversation context
    const conversationContext: ConversationContext = {
      conversationId,
      messages: [],
      currentIntent: 'general',
      conversationStage: 'greeting',
      healthcareContext: {
        specialty: context.medicalContext?.specialty || 'general',
        complianceLevel: context.medicalContext?.complianceLevel || 'institutional',
        patientSafety: context.medicalContext?.patientSafety || true
      },
      userPreferences: context.preferences || {}
    };
    
    this.conversationHistory.set(conversationId, conversationContext);
    return conversationContext;
  }

  /**
   * Create a conversation message
   */
  private createMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    context: AssistantContext,
    metadata: Record<string, any>
  ): ConversationMessage {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      role,
      content,
      context: {
        currentPage: context.currentPage,
        currentTask: context.currentTask,
        userIntent: context.userIntent
      },
      metadata: {
        intent: metadata.intent,
        confidence: metadata.confidence,
        healthcareRelevant: metadata.healthcareRelevant,
        requiresCompliance: metadata.requiresCompliance,
        urgency: metadata.urgency
      }
    };
  }

  /**
   * Update conversation stage based on message and intent
   */
  private updateConversationStage(
    context: ConversationContext,
    message: string,
    intent: any
  ): void {
    const messageLower = message.toLowerCase();
    
    // Greeting stage
    if (messageLower.includes('hello') || messageLower.includes('hi') || 
        messageLower.includes('help') || context.messages.length <= 1) {
      context.conversationStage = 'greeting';
    }
    
    // Understanding stage
    else if (messageLower.includes('how') || messageLower.includes('what') || 
             messageLower.includes('why') || messageLower.includes('explain')) {
      context.conversationStage = 'understanding';
    }
    
    // Processing stage
    else if (messageLower.includes('create') || messageLower.includes('update') || 
             messageLower.includes('delete') || messageLower.includes('analyze')) {
      context.conversationStage = 'processing';
    }
    
    // Follow-up stage
    else if (messageLower.includes('more') || messageLower.includes('also') || 
             messageLower.includes('and') || messageLower.includes('then')) {
      context.conversationStage = 'followup';
    }
    
    // Default to responding
    else {
      context.conversationStage = 'responding';
    }
    
    // Update current intent
    context.currentIntent = intent.type || 'general';
  }

  /**
   * Generate response based on conversation context
   */
  private async generateResponse(
    context: ConversationContext,
    userMessage: ConversationMessage,
    intent: any
  ): Promise<ConversationResponse> {
    const message = userMessage.content.toLowerCase();
    const healthcareContext = context.healthcareContext;
    
    // Handle different conversation stages
    switch (context.conversationStage) {
      case 'greeting':
        return this.generateGreetingResponse(context, intent);
        
      case 'understanding':
        return this.generateUnderstandingResponse(context, userMessage, intent);
        
      case 'processing':
        return this.generateProcessingResponse(context, userMessage, intent);
        
      case 'followup':
        return this.generateFollowupResponse(context, userMessage, intent);
        
      default:
        return this.generateGeneralResponse(context, userMessage, intent);
    }
  }

  /**
   * Generate greeting response
   */
  private generateGreetingResponse(
    context: ConversationContext,
    intent: any
  ): ConversationResponse {
    const role = this.config.healthcareRole;
    const specialty = context.healthcareContext.specialty;
    
    let message = `Hello! I'm your AI assistant. I'm here to help you with your healthcare workflow.`;
    
    if (role === 'physician') {
      message += ` I can assist you with clinical decision support, medical research, and compliance requirements.`;
    } else if (role === 'nurse') {
      message += ` I can help you with patient care protocols, medication management, and documentation.`;
    } else if (role === 'administrator') {
      message += ` I can assist you with compliance reporting, analytics, and administrative tasks.`;
    } else if (role === 'researcher') {
      message += ` I can help you with literature reviews, data analysis, and research documentation.`;
    }
    
    if (specialty && specialty !== 'general') {
      message += ` I have specialized knowledge in ${specialty} and can provide targeted assistance.`;
    }
    
    message += ` How can I help you today?`;
    
    return {
      message,
      confidence: 0.9,
      suggestions: [
        "What would you like to work on?",
        "I can help you with content creation",
        "I can assist with compliance checking",
        "I can provide analytics insights"
      ]
    };
  }

  /**
   * Generate understanding response
   */
  private generateUnderstandingResponse(
    context: ConversationContext,
    userMessage: ConversationMessage,
    intent: any
  ): ConversationResponse {
    const message = userMessage.content;
    const healthcareContext = context.healthcareContext;
    
    let response = "I understand you're asking about ";
    
    if (message.includes('how')) {
      response += "the process or method. ";
    } else if (message.includes('what')) {
      response += "the definition or explanation. ";
    } else if (message.includes('why')) {
      response += "the reasoning or purpose. ";
    } else if (message.includes('when')) {
      response += "the timing or schedule. ";
    } else if (message.includes('where')) {
      response += "the location or placement. ";
    }
    
    response += "Let me provide you with a comprehensive answer that's relevant to your ";
    response += `${healthcareContext.specialty} specialty and ${healthcareContext.complianceLevel} compliance requirements.`;
    
    return {
      message: response,
      confidence: 0.8,
      suggestions: [
        "Would you like me to elaborate on any specific aspect?",
        "I can provide step-by-step instructions",
        "I can show you examples or templates",
        "I can connect you with relevant resources"
      ]
    };
  }

  /**
   * Generate processing response
   */
  private generateProcessingResponse(
    context: ConversationContext,
    userMessage: ConversationMessage,
    intent: any
  ): ConversationResponse {
    const message = userMessage.content;
    const healthcareContext = context.healthcareContext;
    
    let response = "I'll help you process that request. ";
    let actions: Array<{
      type: 'navigate' | 'create' | 'update' | 'delete' | 'analyze';
      target: string;
      parameters: Record<string, any>;
    }> = [];
    
    if (message.includes('create')) {
      response += "I can help you create new content, documents, or workflows. ";
      actions.push({
        type: 'create',
        target: 'content',
        parameters: { type: 'healthcare', complianceLevel: healthcareContext.complianceLevel }
      });
    }
    
    if (message.includes('update')) {
      response += "I can help you update existing content or data. ";
      actions.push({
        type: 'update',
        target: 'content',
        parameters: { complianceLevel: healthcareContext.complianceLevel }
      });
    }
    
    if (message.includes('analyze')) {
      response += "I can help you analyze data, content, or performance metrics. ";
      actions.push({
        type: 'analyze',
        target: 'analytics',
        parameters: { specialty: healthcareContext.specialty }
      });
    }
    
    response += "What specific details would you like me to focus on?";
    
    return {
      message: response,
      actions,
      confidence: 0.8,
      suggestions: [
        "I can provide templates for this task",
        "I can check compliance requirements",
        "I can suggest best practices",
        "I can help you get started"
      ]
    };
  }

  /**
   * Generate follow-up response
   */
  private generateFollowupResponse(
    context: ConversationContext,
    userMessage: ConversationMessage,
    intent: any
  ): ConversationResponse {
    const message = userMessage.content;
    
    let response = "I see you'd like to add more to our conversation. ";
    response += "I'm here to help with any additional questions or tasks you have. ";
    response += "What else would you like to work on?";
    
    return {
      message: response,
      confidence: 0.7,
      suggestions: [
        "I can help with related tasks",
        "I can provide additional context",
        "I can suggest next steps",
        "I can help you prioritize tasks"
      ]
    };
  }

  /**
   * Generate general response
   */
  private generateGeneralResponse(
    context: ConversationContext,
    userMessage: ConversationMessage,
    intent: any
  ): ConversationResponse {
    const message = userMessage.content;
    const healthcareContext = context.healthcareContext;
    
    let response = "I understand your request. ";
    
    if (intent.healthcareRelevant) {
      response += "This is healthcare-related, so I'll ensure all recommendations ";
      response += `meet ${healthcareContext.complianceLevel} compliance standards and `;
      response += `are appropriate for ${healthcareContext.specialty} practice. `;
    }
    
    response += "Let me provide you with the most relevant assistance.";
    
    return {
      message: response,
      confidence: 0.7,
      suggestions: [
        "I can provide more specific guidance",
        "I can check for compliance issues",
        "I can suggest alternatives",
        "I can help you get started"
      ]
    };
  }

  /**
   * Initialize conversation templates
   */
  private async initializeConversationTemplates(): Promise<void> {
    // In a real implementation, this would load templates from a database
    // For now, we'll use the hardcoded responses above
  }

  /**
   * Load conversation history
   */
  private async loadConversationHistory(): Promise<void> {
    // In a real implementation, this would load from Supabase
    // For now, we'll start with empty history
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.conversationHistory.clear();
    this.currentConversationId = null;
    this.isInitialized = false;
  }
}
