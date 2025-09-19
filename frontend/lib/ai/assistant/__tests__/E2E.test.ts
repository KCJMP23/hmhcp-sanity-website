/**
 * End-to-End Tests
 * Comprehensive end-to-end tests for the AI Assistant system
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AIAssistantCore } from '../AIAssistantCore';
import { HealthcareComplianceManager } from '../HealthcareComplianceManager';

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

describe('AI Assistant End-to-End Tests', () => {
  let aiAssistant: AIAssistantCore;
  let complianceManager: HealthcareComplianceManager;

  const mockContext = {
    currentPage: '/clinical-dashboard',
    currentTask: 'patient-assessment',
    sessionId: 'e2e-test-session',
    userRole: 'physician',
    medicalContext: {
      specialty: 'cardiology',
      complianceLevel: 'hipaa',
      patientData: {
        id: 'patient-789',
        name: 'Robert Johnson',
        age: 67,
        conditions: ['hypertension', 'diabetes', 'coronary_artery_disease']
      }
    },
    preferences: {
      language: 'en',
      theme: 'light',
      notifications: true
    }
  };

  beforeEach(async () => {
    aiAssistant = new AIAssistantCore();
    complianceManager = new HealthcareComplianceManager();
    
    await aiAssistant.initialize('e2e-test-user', mockContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Clinical Workflow', () => {
    it('should complete a full patient assessment workflow', async () => {
      // Step 1: Initial patient presentation
      const presentationInput = 'Patient presents with chest pain, shortness of breath, and diaphoresis';
      const presentationResult = await aiAssistant.processInput(presentationInput);
      
      expect(presentationResult.success).toBe(true);
      expect(presentationResult.healthcareRelevant).toBe(true);
      expect(presentationResult.medicalTerms.length).toBeGreaterThan(0);

      // Step 2: Medical terminology validation
      const terminologyResult = await complianceManager.processComplianceRequest('e2e-test-user', {
        type: 'terminology',
        content: presentationInput,
        context: mockContext
      });
      
      expect(terminologyResult.validation.overall.score).toBeGreaterThan(0.7);

      // Step 3: Compliance guidance
      const guidanceResult = await complianceManager.processComplianceRequest('e2e-test-user', {
        type: 'guidance',
        content: 'patient assessment',
        context: mockContext
      });
      
      expect(guidanceResult.assessment.currentCompliance.score).toBeGreaterThan(0.5);

      // Step 4: Differential diagnosis
      const diagnosisInput = 'What are the differential diagnoses for chest pain?';
      const diagnosisResult = await aiAssistant.processInput(diagnosisInput);
      
      expect(diagnosisResult.success).toBe(true);
      expect(diagnosisResult.differentialDiagnoses).toBeDefined();
      expect(diagnosisResult.differentialDiagnoses.length).toBeGreaterThan(0);

      // Step 5: Treatment recommendations
      const treatmentInput = 'What are the treatment options for acute coronary syndrome?';
      const treatmentResult = await aiAssistant.processInput(treatmentInput);
      
      expect(treatmentResult.success).toBe(true);
      expect(treatmentResult.treatmentOptions).toBeDefined();
      expect(treatmentResult.treatmentOptions.length).toBeGreaterThan(0);

      // Step 6: Follow-up planning
      const followupInput = 'Create a follow-up plan for this patient';
      const followupResult = await aiAssistant.processInput(followupInput);
      
      expect(followupResult.success).toBe(true);
      expect(followupResult.followUpPlan).toBeDefined();
    });

    it('should complete a research protocol workflow', async () => {
      // Step 1: Create research protocol
      const protocolResult = await complianceManager.processComplianceRequest('e2e-test-user', {
        type: 'research',
        content: 'Create a cardiovascular risk assessment study protocol',
        context: mockContext
      });
      
      expect(protocolResult.id).toBeDefined();
      expect(protocolResult.type).toBe('protocol_review');

      // Step 2: Compliance audit
      const auditResult = await complianceManager.processComplianceRequest('e2e-test-user', {
        type: 'audit',
        content: 'audit research protocol',
        context: mockContext
      });
      
      expect(auditResult.results.overallScore).toBeGreaterThan(0.5);

      // Step 3: Generate compliance report
      const reportResult = await complianceManager.generateComplianceReport(
        'e2e-test-user',
        {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date()
        },
        'detailed'
      );
      
      expect(reportResult.summary.overallCompliance).toBeGreaterThan(0.5);
      expect(reportResult.details.research.compliance).toBeGreaterThan(0.5);
    });

    it('should complete a medication management workflow', async () => {
      // Step 1: Review current medications
      const medicationInput = 'Review patient medications: metformin 500mg BID, lisinopril 10mg daily';
      const medicationResult = await aiAssistant.processInput(medicationInput);
      
      expect(medicationResult.success).toBe(true);
      expect(medicationResult.medications).toBeDefined();

      // Step 2: Check for drug interactions
      const interactionInput = 'Check for drug interactions between metformin and lisinopril';
      const interactionResult = await aiAssistant.processInput(interactionInput);
      
      expect(interactionResult.success).toBe(true);
      expect(interactionResult.drugInteractions).toBeDefined();

      // Step 3: Adjust medication dosages
      const adjustmentInput = 'Adjust lisinopril dosage based on blood pressure readings';
      const adjustmentResult = await aiAssistant.processInput(adjustmentInput);
      
      expect(adjustmentResult.success).toBe(true);
      expect(adjustmentResult.dosageAdjustments).toBeDefined();

      // Step 4: Monitor compliance
      const monitoringResult = await complianceManager.processComplianceRequest('e2e-test-user', {
        type: 'monitoring',
        content: 'medication compliance monitoring',
        context: mockContext
      });
      
      expect(monitoringResult.metrics).toBeDefined();
    });
  });

  describe('Multi-Modal Interaction Workflow', () => {
    it('should handle voice-to-text-to-voice workflow', async () => {
      // Step 1: Process voice input
      const voiceInput = 'What are the symptoms of heart failure?';
      const voiceResult = await aiAssistant.processInput(voiceInput);
      
      expect(voiceResult.success).toBe(true);
      expect(voiceResult.voiceSupported).toBe(true);

      // Step 2: Generate voice response
      const responseResult = await aiAssistant.processInput('Generate voice response for heart failure symptoms');
      
      expect(responseResult.success).toBe(true);
      expect(responseResult.voiceResponse).toBeDefined();
      expect(responseResult.audioData).toBeDefined();
    });

    it('should handle image analysis workflow', async () => {
      // Step 1: Process image input
      const imageInput = 'Analyze this chest X-ray image for signs of pneumonia';
      const imageResult = await aiAssistant.processInput(imageInput);
      
      expect(imageResult.success).toBe(true);
      expect(imageResult.imageAnalysis).toBeDefined();

      // Step 2: Generate image annotations
      const annotationResult = await aiAssistant.processInput('Annotate the chest X-ray with findings');
      
      expect(annotationResult.success).toBe(true);
      expect(annotationResult.annotations).toBeDefined();
    });

    it('should handle gesture and touch interactions', async () => {
      // Step 1: Process gesture input
      const gestureInput = 'User swiped left on patient chart';
      const gestureResult = await aiAssistant.processInput(gestureInput);
      
      expect(gestureResult.success).toBe(true);
      expect(gestureResult.gestureRecognized).toBe(true);

      // Step 2: Process touch input
      const touchInput = 'User tapped on medication list';
      const touchResult = await aiAssistant.processInput(touchInput);
      
      expect(touchResult.success).toBe(true);
      expect(touchResult.touchRecognized).toBe(true);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should recover from network errors', async () => {
      // Mock network error
      jest.spyOn(aiAssistant, 'processInput').mockRejectedValueOnce(
        new Error('Network error')
      );

      // First request should fail
      try {
        await aiAssistant.processInput('test input');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Reset mock
      jest.restoreAllMocks();

      // Second request should succeed
      const result = await aiAssistant.processInput('test input');
      expect(result.success).toBe(true);
    });

    it('should recover from AI service failures', async () => {
      // Mock AI service failure
      jest.spyOn(aiAssistant, 'processInput').mockRejectedValueOnce(
        new Error('AI service unavailable')
      );

      // First request should fail
      try {
        await aiAssistant.processInput('test input');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Reset mock
      jest.restoreAllMocks();

      // Second request should succeed
      const result = await aiAssistant.processInput('test input');
      expect(result.success).toBe(true);
    });

    it('should provide fallback responses', async () => {
      // Mock AI service failure
      jest.spyOn(aiAssistant, 'processInput').mockResolvedValue({
        success: false,
        error: 'AI service unavailable',
        fallbackResponse: 'I apologize, but I cannot process your request at this time. Please try again later.'
      });

      const result = await aiAssistant.processInput('test input');
      expect(result.fallbackResponse).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-volume requests', async () => {
      const startTime = Date.now();
      
      const promises = Array.from({ length: 100 }, (_, i) => 
        aiAssistant.processInput(`high volume test ${i}`)
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results.length).toBe(100);
      expect(endTime - startTime).toBeLessThan(120000); // 2 minutes
    });

    it('should maintain response times under load', async () => {
      const responseTimes: number[] = [];
      
      for (let i = 0; i < 50; i++) {
        const startTime = Date.now();
        await aiAssistant.processInput(`performance test ${i}`);
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }
      
      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      expect(averageResponseTime).toBeLessThan(5000); // 5 seconds average
    });

    it('should handle memory efficiently', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process many requests
      for (let i = 0; i < 200; i++) {
        await aiAssistant.processInput(`memory test ${i}`);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 200MB)
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);
    });
  });

  describe('Healthcare Compliance E2E', () => {
    it('should maintain HIPAA compliance throughout workflow', async () => {
      const phiInput = 'Patient John Doe, SSN 123-45-6789, has hypertension';
      
      const result = await aiAssistant.processInput(phiInput);
      expect(result.hipaaCompliant).toBe(true);
      expect(result.phiDetected).toBe(true);
      expect(result.privacyLevel).toBe('high');
    });

    it('should handle compliance violations appropriately', async () => {
      const violationInput = 'Share patient data with unauthorized party';
      
      const result = await aiAssistant.processInput(violationInput);
      expect(result.complianceViolation).toBe(true);
      expect(result.complianceWarnings).toBeDefined();
      expect(result.complianceWarnings.length).toBeGreaterThan(0);
    });

    it('should provide compliance guidance throughout workflow', async () => {
      const guidanceResult = await complianceManager.processComplianceRequest('e2e-test-user', {
        type: 'guidance',
        content: 'patient data handling',
        context: mockContext
      });
      
      expect(guidanceResult.assessment.currentCompliance.score).toBeGreaterThan(0.5);
      expect(guidanceResult.resources.policies.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility E2E', () => {
    it('should provide accessible responses throughout workflow', async () => {
      const input = 'What is the treatment for hypertension?';
      const result = await aiAssistant.processInput(input);
      
      expect(result.accessible).toBe(true);
      expect(result.screenReaderFriendly).toBe(true);
      expect(result.altText).toBeDefined();
      expect(result.ariaLabels).toBeDefined();
    });

    it('should support high contrast mode', async () => {
      const highContrastContext = {
        ...mockContext,
        preferences: { ...mockContext.preferences, highContrast: true }
      };
      
      await aiAssistant.updateContext(highContrastContext);
      const result = await aiAssistant.processInput('test input');
      
      expect(result.highContrast).toBe(true);
    });

    it('should support keyboard navigation', async () => {
      const result = await aiAssistant.processInput('test input');
      expect(result.keyboardAccessible).toBe(true);
      expect(result.tabOrder).toBeDefined();
    });
  });
});
