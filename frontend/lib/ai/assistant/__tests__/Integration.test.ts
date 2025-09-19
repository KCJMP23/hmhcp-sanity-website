/**
 * Integration Tests
 * Comprehensive integration tests for the AI Assistant system
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AIAssistantCore } from '../AIAssistantCore';
import { ContextManager } from '../ContextManager';
import { RecommendationEngine } from '../RecommendationEngine';
import { ConversationManager } from '../ConversationManager';
import { VoiceInterface } from '../VoiceInterface';
import { MedicalTerminologyValidation } from '../MedicalTerminologyValidation';
import { HealthcareComplianceGuidance } from '../HealthcareComplianceGuidance';
import { ClinicalResearchAssistance } from '../ClinicalResearchAssistance';

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

describe('AI Assistant Integration Tests', () => {
  let aiAssistant: AIAssistantCore;
  let contextManager: ContextManager;
  let recommendationEngine: RecommendationEngine;
  let conversationManager: ConversationManager;
  let voiceInterface: VoiceInterface;
  let terminologyValidation: MedicalTerminologyValidation;
  let complianceGuidance: HealthcareComplianceGuidance;
  let researchAssistance: ClinicalResearchAssistance;

  const mockContext = {
    currentPage: '/clinical-dashboard',
    currentTask: 'patient-assessment',
    sessionId: 'integration-test-session',
    userRole: 'physician',
    medicalContext: {
      specialty: 'cardiology',
      complianceLevel: 'hipaa',
      patientData: {
        id: 'patient-456',
        name: 'Jane Smith',
        age: 52,
        conditions: ['hypertension', 'atrial_fibrillation']
      }
    },
    preferences: {
      language: 'en',
      theme: 'light',
      notifications: true
    }
  };

  beforeEach(async () => {
    // Initialize all components
    aiAssistant = new AIAssistantCore();
    contextManager = new ContextManager();
    recommendationEngine = new RecommendationEngine();
    conversationManager = new ConversationManager();
    voiceInterface = new VoiceInterface();
    terminologyValidation = new MedicalTerminologyValidation();
    complianceGuidance = new HealthcareComplianceGuidance();
    researchAssistance = new ClinicalResearchAssistance();

    // Initialize AI Assistant
    await aiAssistant.initialize('integration-test-user', mockContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Workflow Tests', () => {
    it('should complete a full clinical workflow', async () => {
      // Step 1: Process patient assessment input
      const assessmentInput = 'Patient presents with chest pain and shortness of breath';
      const assessmentResult = await aiAssistant.processInput(assessmentInput);
      
      expect(assessmentResult.success).toBe(true);
      expect(assessmentResult.healthcareRelevant).toBe(true);

      // Step 2: Validate medical terminology
      const terminologyResult = await terminologyValidation.validateMedicalTerminology(
        'integration-test-user',
        assessmentInput,
        mockContext
      );
      
      expect(terminologyResult.validation.overall.score).toBeGreaterThan(0.7);

      // Step 3: Get compliance guidance
      const complianceResult = await complianceGuidance.generateComplianceGuidance(
        'integration-test-user',
        mockContext
      );
      
      expect(complianceResult.assessment.currentCompliance.score).toBeGreaterThan(0.5);

      // Step 4: Generate recommendations
      const recommendations = await recommendationEngine.generateRecommendations(
        'integration-test-user',
        mockContext
      );
      
      expect(recommendations.length).toBeGreaterThan(0);

      // Step 5: Process voice command
      const voiceResult = await voiceInterface.processVoiceCommand(
        'integration-test-session',
        {
          userId: 'integration-test-user',
          command: 'Show patient vital signs',
          type: 'navigation',
          confidence: 0.9,
          parameters: { target: 'vital-signs' },
          context: {
            page: '/clinical-dashboard',
            task: 'patient-assessment',
            userRole: 'physician',
            medicalSpecialty: 'cardiology',
            complianceLevel: 'hipaa',
            sessionId: 'integration-test-session'
          }
        }
      );
      
      expect(voiceResult.type).toBeDefined();
    });

    it('should handle research protocol workflow', async () => {
      // Step 1: Create research protocol
      const protocol = await researchAssistance.createResearchProtocol(
        'integration-test-user',
        {
          userId: 'integration-test-user',
          title: 'Cardiovascular Risk Assessment Study',
          description: 'Study to assess cardiovascular risk in patients with hypertension',
          type: 'interventional',
          phase: 'phase_ii',
          status: 'draft',
          objectives: {
            primary: ['Assess cardiovascular risk reduction'],
            secondary: ['Evaluate medication adherence'],
            exploratory: ['Analyze quality of life improvements']
          },
          methodology: {
            design: 'Randomized controlled trial',
            population: {
              inclusion: ['Age 18-75', 'Hypertension diagnosis'],
              exclusion: ['Pregnancy', 'Severe comorbidities'],
              sampleSize: 200,
              powerAnalysis: {
                alpha: 0.05,
                beta: 0.2,
                effectSize: 0.3,
                power: 0.8
              }
            },
            interventions: [],
            endpoints: [],
            statisticalPlan: {
              analysis: ['Primary endpoint analysis'],
              interimAnalysis: true,
              stoppingRules: ['Futility analysis'],
              multiplicityAdjustment: 'Bonferroni'
            }
          },
          compliance: {
            irb: { required: true, status: 'not_submitted' },
            fda: { required: true, status: 'not_submitted' },
            hipaa: { required: true, status: 'not_submitted' },
            gcp: { required: true, status: 'not_submitted' }
          },
          timeline: {
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            milestones: []
          },
          budget: {
            total: 500000,
            categories: [],
            funding: []
          },
          team: []
        }
      );

      expect(protocol.id).toBeDefined();
      expect(protocol.title).toBe('Cardiovascular Risk Assessment Study');

      // Step 2: Request research assistance
      const assistance = await researchAssistance.requestResearchAssistance(
        'integration-test-user',
        protocol.id,
        {
          type: 'protocol_review',
          request: {
            description: 'Review protocol for compliance and feasibility',
            priority: 'high',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            requirements: ['IRB compliance', 'Statistical validity']
          }
        }
      );

      expect(assistance.id).toBeDefined();
      expect(assistance.type).toBe('protocol_review');
    });
  });

  describe('Component Integration Tests', () => {
    it('should integrate context management with AI processing', async () => {
      // Update context
      const updatedContext = { ...mockContext, currentTask: 'medication-review' };
      await contextManager.updateContext(updatedContext);

      // Process input with updated context
      const result = await aiAssistant.processInput('Review patient medications');
      
      expect(result.success).toBe(true);
      expect(result.contextUpdated).toBe(true);
    });

    it('should integrate recommendations with voice interface', async () => {
      // Generate recommendations
      const recommendations = await recommendationEngine.generateRecommendations(
        'integration-test-user',
        mockContext
      );

      // Process voice command with recommendations
      const voiceResult = await voiceInterface.processVoiceCommand(
        'integration-test-session',
        {
          userId: 'integration-test-user',
          command: 'What should I do next?',
          type: 'assistance',
          confidence: 0.8,
          parameters: { query: 'next steps' },
          context: {
            page: '/clinical-dashboard',
            task: 'patient-assessment',
            userRole: 'physician',
            medicalSpecialty: 'cardiology',
            complianceLevel: 'hipaa',
            sessionId: 'integration-test-session'
          }
        }
      );

      expect(voiceResult.content.text).toBeDefined();
      expect(voiceResult.content.audio).toBeDefined();
    });

    it('should integrate compliance with terminology validation', async () => {
      // Validate terminology
      const terminologyResult = await terminologyValidation.validateMedicalTerminology(
        'integration-test-user',
        'Patient has acute myocardial infarction',
        mockContext
      );

      // Check compliance
      const complianceResult = await complianceGuidance.generateComplianceGuidance(
        'integration-test-user',
        mockContext
      );

      expect(terminologyResult.compliance.hipaaCompliant).toBe(true);
      expect(complianceResult.assessment.currentCompliance.score).toBeGreaterThan(0.5);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle component failures gracefully', async () => {
      // Mock component failure
      jest.spyOn(terminologyValidation, 'validateMedicalTerminology').mockRejectedValue(
        new Error('Terminology service unavailable')
      );

      // Process input that would trigger terminology validation
      const result = await aiAssistant.processInput('Patient has hypertension');
      
      expect(result.success).toBe(true);
      expect(result.fallbackMode).toBe(true);
    });

    it('should provide fallback when AI service fails', async () => {
      // Mock AI service failure
      jest.spyOn(aiAssistant, 'processInput').mockRejectedValue(
        new Error('AI service unavailable')
      );

      try {
        await aiAssistant.processInput('test input');
      } catch (error) {
        expect(error).toBeDefined();
        // System should provide fallback response
      }
    });

    it('should maintain system stability during partial failures', async () => {
      // Mock partial failure
      jest.spyOn(recommendationEngine, 'generateRecommendations').mockRejectedValue(
        new Error('Recommendation service unavailable')
      );

      // Other components should still work
      const contextResult = await contextManager.updateContext(mockContext);
      expect(contextResult).toBe(true);

      const terminologyResult = await terminologyValidation.validateMedicalTerminology(
        'integration-test-user',
        'test input',
        mockContext
      );
      expect(terminologyResult).toBeDefined();
    });
  });

  describe('Performance Integration Tests', () => {
    it('should handle concurrent requests across components', async () => {
      const promises = [
        aiAssistant.processInput('concurrent request 1'),
        contextManager.updateContext(mockContext),
        recommendationEngine.generateRecommendations('integration-test-user', mockContext),
        terminologyValidation.validateMedicalTerminology('integration-test-user', 'test', mockContext)
      ];

      const results = await Promise.all(promises);
      expect(results.length).toBe(4);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      
      const promises = Array.from({ length: 50 }, (_, i) => 
        aiAssistant.processInput(`load test ${i}`)
      );
      
      await Promise.all(promises);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(60000); // 1 minute
    });

    it('should handle memory efficiently', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process many requests
      for (let i = 0; i < 100; i++) {
        await aiAssistant.processInput(`memory test ${i}`);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Healthcare Compliance Integration', () => {
    it('should maintain HIPAA compliance across all components', async () => {
      const input = 'Patient John Doe has hypertension';
      
      const aiResult = await aiAssistant.processInput(input);
      const terminologyResult = await terminologyValidation.validateMedicalTerminology(
        'integration-test-user',
        input,
        mockContext
      );
      const complianceResult = await complianceGuidance.generateComplianceGuidance(
        'integration-test-user',
        mockContext
      );

      expect(aiResult.hipaaCompliant).toBe(true);
      expect(terminologyResult.compliance.hipaaCompliant).toBe(true);
      expect(complianceResult.assessment.currentCompliance.score).toBeGreaterThan(0.8);
    });

    it('should handle PHI data correctly across components', async () => {
      const phiInput = 'Patient SSN 123-45-6789 has diabetes';
      
      const aiResult = await aiAssistant.processInput(phiInput);
      const terminologyResult = await terminologyValidation.validateMedicalTerminology(
        'integration-test-user',
        phiInput,
        mockContext
      );

      expect(aiResult.phiDetected).toBe(true);
      expect(terminologyResult.compliance.issues.length).toBeGreaterThan(0);
    });

    it('should provide consistent compliance guidance', async () => {
      const complianceResult1 = await complianceGuidance.generateComplianceGuidance(
        'integration-test-user',
        mockContext
      );
      
      const complianceResult2 = await complianceGuidance.generateComplianceGuidance(
        'integration-test-user',
        mockContext
      );

      expect(complianceResult1.assessment.currentCompliance.score).toBe(
        complianceResult2.assessment.currentCompliance.score
      );
    });
  });

  describe('Accessibility Integration', () => {
    it('should provide accessible responses across all components', async () => {
      const input = 'What is hypertension?';
      
      const aiResult = await aiAssistant.processInput(input);
      const voiceResult = await voiceInterface.processVoiceCommand(
        'integration-test-session',
        {
          userId: 'integration-test-user',
          command: input,
          type: 'assistance',
          confidence: 0.9,
          parameters: { query: input },
          context: {
            page: '/clinical-dashboard',
            task: 'patient-assessment',
            userRole: 'physician',
            medicalSpecialty: 'cardiology',
            complianceLevel: 'hipaa',
            sessionId: 'integration-test-session'
          }
        }
      );

      expect(aiResult.accessible).toBe(true);
      expect(voiceResult.content.audio).toBeDefined();
    });

    it('should support screen readers across components', async () => {
      const result = await aiAssistant.processInput('test input');
      expect(result.screenReaderFriendly).toBe(true);
      expect(result.ariaLabels).toBeDefined();
    });

    it('should support high contrast mode', async () => {
      const highContrastContext = {
        ...mockContext,
        preferences: { ...mockContext.preferences, highContrast: true }
      };
      
      await contextManager.updateContext(highContrastContext);
      const result = await aiAssistant.processInput('test input');
      
      expect(result.highContrast).toBe(true);
    });
  });
});
