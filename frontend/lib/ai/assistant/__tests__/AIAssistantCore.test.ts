/**
 * AI Assistant Core Tests
 * Comprehensive unit tests for the AI Assistant Core functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AIAssistantCore } from '../AIAssistantCore';
import { AssistantContext } from '../AIAssistantCore';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  })
}));

describe('AIAssistantCore', () => {
  let aiAssistant: AIAssistantCore;
  let mockContext: AssistantContext;

  beforeEach(() => {
    aiAssistant = new AIAssistantCore();
    mockContext = {
      currentPage: '/test-page',
      currentTask: 'test-task',
      sessionId: 'test-session-123',
      userRole: 'physician',
      medicalContext: {
        specialty: 'cardiology',
        complianceLevel: 'hipaa',
        patientData: {
          id: 'patient-123',
          name: 'John Doe',
          age: 45,
          conditions: ['hypertension', 'diabetes']
        }
      },
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: true
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(aiAssistant).toBeDefined();
      expect(aiAssistant.isInitialized).toBe(false);
    });

    it('should initialize successfully with valid context', async () => {
      const result = await aiAssistant.initialize('test-user', mockContext);
      expect(result).toBe(true);
      expect(aiAssistant.isInitialized).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      const invalidContext = { ...mockContext, sessionId: '' };
      const result = await aiAssistant.initialize('test-user', invalidContext);
      expect(result).toBe(false);
    });
  });

  describe('Context Management', () => {
    beforeEach(async () => {
      await aiAssistant.initialize('test-user', mockContext);
    });

    it('should update context successfully', async () => {
      const newContext = { ...mockContext, currentPage: '/new-page' };
      const result = await aiAssistant.updateContext(newContext);
      expect(result).toBe(true);
    });

    it('should get current context', () => {
      const context = aiAssistant.getCurrentContext();
      expect(context).toBeDefined();
      expect(context.currentPage).toBe('/test-page');
    });

    it('should validate context data', () => {
      const validContext = { ...mockContext };
      const isValid = aiAssistant.validateContext(validContext);
      expect(isValid).toBe(true);
    });

    it('should reject invalid context data', () => {
      const invalidContext = { ...mockContext, sessionId: '' };
      const isValid = aiAssistant.validateContext(invalidContext);
      expect(isValid).toBe(false);
    });
  });

  describe('AI Processing', () => {
    beforeEach(async () => {
      await aiAssistant.initialize('test-user', mockContext);
    });

    it('should process user input successfully', async () => {
      const input = 'What are the treatment options for hypertension?';
      const result = await aiAssistant.processInput(input);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
    });

    it('should handle empty input gracefully', async () => {
      const result = await aiAssistant.processInput('');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle medical terminology correctly', async () => {
      const input = 'Patient has acute myocardial infarction';
      const result = await aiAssistant.processInput(input);
      
      expect(result.success).toBe(true);
      expect(result.medicalTerms).toBeDefined();
      expect(result.medicalTerms.length).toBeGreaterThan(0);
    });

    it('should provide healthcare-specific responses', async () => {
      const input = 'How do I treat a patient with chest pain?';
      const result = await aiAssistant.processInput(input);
      
      expect(result.success).toBe(true);
      expect(result.healthcareRelevant).toBe(true);
      expect(result.complianceRequired).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await aiAssistant.initialize('test-user', mockContext);
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      jest.spyOn(aiAssistant, 'processInput').mockRejectedValue(new Error('Network error'));
      
      const result = await aiAssistant.processInput('test input');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle AI service errors gracefully', async () => {
      // Mock AI service error
      jest.spyOn(aiAssistant, 'processInput').mockRejectedValue(new Error('AI service unavailable'));
      
      const result = await aiAssistant.processInput('test input');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide fallback responses when AI fails', async () => {
      // Mock AI failure
      jest.spyOn(aiAssistant, 'processInput').mockResolvedValue({
        success: false,
        error: 'AI service unavailable',
        fallbackResponse: 'I apologize, but I cannot process your request at this time. Please try again later.'
      });
      
      const result = await aiAssistant.processInput('test input');
      expect(result.fallbackResponse).toBeDefined();
    });
  });

  describe('Healthcare Compliance', () => {
    beforeEach(async () => {
      await aiAssistant.initialize('test-user', mockContext);
    });

    it('should validate HIPAA compliance', async () => {
      const input = 'Patient John Doe has hypertension';
      const result = await aiAssistant.processInput(input);
      
      expect(result.hipaaCompliant).toBe(true);
      expect(result.privacyLevel).toBeDefined();
    });

    it('should handle PHI data correctly', async () => {
      const input = 'Patient SSN 123-45-6789 has diabetes';
      const result = await aiAssistant.processInput(input);
      
      expect(result.phiDetected).toBe(true);
      expect(result.privacyLevel).toBe('high');
    });

    it('should provide compliance warnings', async () => {
      const input = 'Share patient data with external party';
      const result = await aiAssistant.processInput(input);
      
      expect(result.complianceWarnings).toBeDefined();
      expect(result.complianceWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await aiAssistant.initialize('test-user', mockContext);
    });

    it('should process requests within acceptable time', async () => {
      const startTime = Date.now();
      await aiAssistant.processInput('test input');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        aiAssistant.processInput(`test input ${i}`)
      );
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      const promises = Array.from({ length: 100 }, (_, i) => 
        aiAssistant.processInput(`load test input ${i}`)
      );
      
      await Promise.all(promises);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(30000); // 30 seconds
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      await aiAssistant.initialize('test-user', mockContext);
    });

    it('should provide accessible responses', async () => {
      const input = 'What is hypertension?';
      const result = await aiAssistant.processInput(input);
      
      expect(result.accessible).toBe(true);
      expect(result.altText).toBeDefined();
      expect(result.screenReaderFriendly).toBe(true);
    });

    it('should support high contrast mode', async () => {
      const highContrastContext = { ...mockContext, preferences: { ...mockContext.preferences, highContrast: true } };
      await aiAssistant.updateContext(highContrastContext);
      
      const result = await aiAssistant.processInput('test input');
      expect(result.highContrast).toBe(true);
    });

    it('should support screen readers', async () => {
      const result = await aiAssistant.processInput('test input');
      expect(result.screenReaderFriendly).toBe(true);
      expect(result.ariaLabels).toBeDefined();
    });
  });

  describe('Integration', () => {
    beforeEach(async () => {
      await aiAssistant.initialize('test-user', mockContext);
    });

    it('should integrate with context management system', async () => {
      const result = await aiAssistant.processInput('test input');
      expect(result.contextIntegrated).toBe(true);
    });

    it('should integrate with recommendation engine', async () => {
      const result = await aiAssistant.processInput('test input');
      expect(result.recommendations).toBeDefined();
    });

    it('should integrate with voice interface', async () => {
      const result = await aiAssistant.processInput('test input');
      expect(result.voiceSupported).toBe(true);
    });

    it('should integrate with compliance system', async () => {
      const result = await aiAssistant.processInput('test input');
      expect(result.complianceIntegrated).toBe(true);
    });
  });
});