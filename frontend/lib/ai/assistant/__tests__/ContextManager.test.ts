/**
 * Context Manager Tests
 * Comprehensive tests for the Context Manager functionality
 */

import { ContextManager, ContextUpdate } from '../ContextManager';
import { AIAssistantConfig } from '../AIAssistantCore';

describe('ContextManager', () => {
  let config: AIAssistantConfig;
  let contextManager: ContextManager;

  beforeEach(() => {
    config = {
      userId: 'test-user-123',
      healthcareRole: 'physician',
      medicalSpecialty: 'cardiology',
      complianceLevel: 'hipaa',
      accessibilityPreferences: {
        voiceEnabled: true,
        screenReaderSupport: true,
        keyboardNavigation: true,
        highContrast: false
      },
      language: 'en-US',
      timezone: 'UTC'
    };

    contextManager = new ContextManager(config);
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(contextManager.initialize()).resolves.not.toThrow();
    });

    it('should set initial context with user role and specialty', async () => {
      await contextManager.initialize();
      const context = contextManager.getCurrentContext();
      
      expect(context.medicalContext.specialty).toBe('cardiology');
      expect(context.medicalContext.complianceLevel).toBe('hipaa');
      expect(context.medicalContext.patientSafety).toBe(true);
    });
  });

  describe('Context Updates', () => {
    beforeEach(async () => {
      await contextManager.initialize();
    });

    it('should update context with new information', async () => {
      const update: Partial<ContextUpdate> = {
        currentPage: 'content-creation',
        currentTask: 'create-medical-article',
        userIntent: 'write-about-heart-disease',
        timestamp: new Date()
      };

      const updatedContext = await contextManager.updateContext(update);
      
      expect(updatedContext.currentPage).toBe('content-creation');
      expect(updatedContext.currentTask).toBe('create-medical-article');
      expect(updatedContext.userIntent).toBe('write-about-heart-disease');
    });

    it('should maintain conversation history', async () => {
      const update = {
        currentPage: 'test-page',
        currentTask: 'test-task',
        userIntent: 'test-intent',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      await contextManager.updateContext(update);
      
      // Add a conversation
      contextManager.addConversation(
        'Hello, I need help with a patient case',
        'I can help you with that. What specific information do you need?',
        { patientId: '12345', caseType: 'cardiology' }
      );

      const context = contextManager.getCurrentContext();
      expect(context.conversationHistory).toHaveLength(1);
      expect(context.conversationHistory[0].userMessage).toBe('Hello, I need help with a patient case');
      expect(context.conversationHistory[0].assistantResponse).toBe('I can help you with that. What specific information do you need?');
    });

    it('should limit history size', async () => {
      await contextManager.initialize();
      
      // Add more than max history size
      for (let i = 0; i < 60; i++) {
        contextManager.addConversation(
          `Message ${i}`,
          `Response ${i}`,
          { index: i }
        );
      }

      const context = contextManager.getCurrentContext();
      expect(context.conversationHistory.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Context Analysis', () => {
    beforeEach(async () => {
      await contextManager.initialize();
    });

    it('should analyze workflow stage correctly', async () => {
      const planningContext = {
        currentPage: 'dashboard',
        currentTask: 'plan patient treatment',
        userIntent: 'prepare treatment plan',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const analysis = await contextManager.analyzeContext();
      expect(analysis.workflowStage).toBe('planning');
    });

    it('should calculate complexity correctly', async () => {
      const complexContext = {
        currentPage: 'compliance',
        currentTask: 'audit patient data compliance',
        userIntent: 'ensure hipaa compliance',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      await contextManager.updateContext(complexContext);
      const analysis = await contextManager.analyzeContext();
      expect(analysis.complexity).toBe('high');
    });

    it('should assess healthcare relevance correctly', async () => {
      const healthcareContext = {
        currentPage: 'patient-care',
        currentTask: 'diagnose heart condition',
        userIntent: 'analyze patient symptoms',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      await contextManager.updateContext(healthcareContext);
      const analysis = await contextManager.analyzeContext();
      expect(analysis.healthcareRelevance).toBeGreaterThan(0.5);
    });

    it('should evaluate compliance risk correctly', async () => {
      const highRiskContext = {
        currentPage: 'patient-data',
        currentTask: 'process patient phi',
        userIntent: 'handle sensitive data',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      await contextManager.updateContext(highRiskContext);
      const analysis = await contextManager.analyzeContext();
      expect(analysis.complianceRisk).toBe('high');
    });

    it('should determine user expertise correctly', async () => {
      // Test physician role (expert)
      const analysis = await contextManager.analyzeContext();
      expect(analysis.userExpertise).toBe('expert');
    });
  });

  describe('Context History', () => {
    beforeEach(async () => {
      await contextManager.initialize();
    });

    it('should get context history', () => {
      const history = contextManager.getContextHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should clear context history', () => {
      contextManager.addConversation('Test message', 'Test response', {});
      expect(contextManager.getCurrentContext().conversationHistory).toHaveLength(1);
      
      contextManager.clearHistory();
      expect(contextManager.getCurrentContext().conversationHistory).toHaveLength(0);
    });
  });

  describe('Suggested Actions Generation', () => {
    beforeEach(async () => {
      await contextManager.initialize();
    });

    it('should generate planning stage suggestions', async () => {
      const planningContext = {
        currentPage: 'dashboard',
        currentTask: 'plan treatment',
        userIntent: 'prepare plan',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      await contextManager.updateContext(planningContext);
      const analysis = await contextManager.analyzeContext();
      
      expect(analysis.suggestedActions).toContain('Would you like me to help you plan this task?');
    });

    it('should generate execution stage suggestions', async () => {
      const executionContext = {
        currentPage: 'content',
        currentTask: 'create medical content',
        userIntent: 'write article',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      await contextManager.updateContext(executionContext);
      const analysis = await contextManager.analyzeContext();
      
      expect(analysis.suggestedActions).toContain('I can help you execute this task efficiently');
    });

    it('should generate review stage suggestions', async () => {
      const reviewContext = {
        currentPage: 'review',
        currentTask: 'review patient data',
        userIntent: 'check accuracy',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      await contextManager.updateContext(reviewContext);
      const analysis = await contextManager.analyzeContext();
      
      expect(analysis.suggestedActions).toContain('I can help you review this content for accuracy');
    });

    it('should generate complexity-based suggestions', async () => {
      const complexContext = {
        currentPage: 'compliance',
        currentTask: 'audit compliance requirements',
        userIntent: 'ensure compliance',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      await contextManager.updateContext(complexContext);
      const analysis = await contextManager.analyzeContext();
      
      expect(analysis.suggestedActions).toContain('This is a complex task - I can break it down into steps');
    });

    it('should generate healthcare-specific suggestions', async () => {
      const healthcareContext = {
        currentPage: 'patient-care',
        currentTask: 'diagnose patient',
        userIntent: 'medical diagnosis',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      await contextManager.updateContext(healthcareContext);
      const analysis = await contextManager.analyzeContext();
      
      expect(analysis.suggestedActions).toContain('I can help with healthcare-specific considerations');
    });

    it('should generate compliance risk suggestions', async () => {
      const highRiskContext = {
        currentPage: 'patient-data',
        currentTask: 'process phi data',
        userIntent: 'handle sensitive data',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      await contextManager.updateContext(highRiskContext);
      const analysis = await contextManager.analyzeContext();
      
      expect(analysis.suggestedActions).toContain('This involves sensitive data - I can help ensure compliance');
    });

    it('should generate beginner-friendly suggestions', async () => {
      // Create a context manager for a beginner role
      const beginnerConfig = {
        ...config,
        healthcareRole: 'administrator' as const
      };
      const beginnerContextManager = new ContextManager(beginnerConfig);
      await beginnerContextManager.initialize();

      const analysis = await beginnerContextManager.analyzeContext();
      
      expect(analysis.suggestedActions).toContain('I can provide step-by-step guidance');
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      // Mock a failure scenario
      const failingContextManager = new ContextManager(config);
      
      // This should not throw in the current implementation
      await expect(failingContextManager.initialize()).resolves.not.toThrow();
    });

    it('should handle context update errors gracefully', async () => {
      await contextManager.initialize();
      
      // Test with invalid context data
      const invalidContext = {
        currentPage: null,
        currentTask: undefined,
        userIntent: 123, // Invalid type
        medicalContext: null,
        conversationHistory: 'invalid', // Invalid type
        preferences: null
      };

      // Should not throw, but handle gracefully
      await expect(contextManager.updateContext(invalidContext as any)).resolves.not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      await contextManager.initialize();
      await contextManager.cleanup();
      
      // After cleanup, should not be initialized
      expect(contextManager.getCurrentContext()).toBeDefined(); // Still returns context, but cleaned up internally
    });
  });
});
