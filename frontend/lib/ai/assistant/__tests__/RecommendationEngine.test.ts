/**
 * Recommendation Engine Tests
 * Comprehensive tests for the Recommendation Engine functionality
 */

import { RecommendationEngine, Recommendation, RecommendationContext } from '../RecommendationEngine';
import { AIAssistantConfig } from '../AIAssistantCore';

describe('RecommendationEngine', () => {
  let config: AIAssistantConfig;
  let recommendationEngine: RecommendationEngine;

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

    recommendationEngine = new RecommendationEngine(config);
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(recommendationEngine.initialize()).resolves.not.toThrow();
    });

    it('should load user preferences', async () => {
      await recommendationEngine.initialize();
      // In a real implementation, we would verify that preferences are loaded
    });
  });

  describe('Recommendation Generation', () => {
    beforeEach(async () => {
      await recommendationEngine.initialize();
    });

    it('should generate recommendations for general context', async () => {
      const context = {
        currentPage: 'dashboard',
        currentTask: 'general task',
        userIntent: 'help needed',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const intent = { type: 'general' };
      const recommendations = await recommendationEngine.generateRecommendations(intent, context);
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should generate workflow recommendations for planning stage', async () => {
      const context = {
        currentPage: 'dashboard',
        currentTask: 'plan treatment',
        userIntent: 'planning',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const intent = { type: 'planning' };
      const recommendations = await recommendationEngine.generateRecommendations(intent, context);
      
      expect(recommendations).toContain('Would you like me to help you plan this task?');
    });

    it('should generate content recommendations for content pages', async () => {
      const context = {
        currentPage: 'content-creation',
        currentTask: 'create medical article',
        userIntent: 'content creation',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const intent = { type: 'content' };
      const recommendations = await recommendationEngine.generateRecommendations(intent, context);
      
      expect(recommendations).toContain('Would you like me to help optimize this content for SEO?');
      expect(recommendations).toContain('I can check this content for healthcare compliance issues');
    });

    it('should generate analytics recommendations for analytics pages', async () => {
      const context = {
        currentPage: 'analytics-dashboard',
        currentTask: 'analyze performance data',
        userIntent: 'analytics',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const intent = { type: 'analytics' };
      const recommendations = await recommendationEngine.generateRecommendations(intent, context);
      
      expect(recommendations).toContain('I can provide insights on your analytics data');
      expect(recommendations).toContain('Would you like me to generate a performance report?');
    });

    it('should generate research recommendations for research pages', async () => {
      const context = {
        currentPage: 'research-portal',
        currentTask: 'find medical literature',
        userIntent: 'research',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const intent = { type: 'research' };
      const recommendations = await recommendationEngine.generateRecommendations(intent, context);
      
      expect(recommendations).toContain('I can help you find relevant medical literature');
      expect(recommendations).toContain('Would you like me to validate these research findings?');
    });
  });

  describe('Detailed Recommendations', () => {
    beforeEach(async () => {
      await recommendationEngine.initialize();
    });

    it('should generate detailed recommendations with metadata', async () => {
      const context = {
        currentPage: 'content-creation',
        currentTask: 'create medical article',
        userIntent: 'content creation',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await recommendationEngine.generateDetailedRecommendations(context);
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Check recommendation structure
      const firstRec = recommendations[0];
      expect(firstRec).toHaveProperty('id');
      expect(firstRec).toHaveProperty('type');
      expect(firstRec).toHaveProperty('title');
      expect(firstRec).toHaveProperty('description');
      expect(firstRec).toHaveProperty('priority');
      expect(firstRec).toHaveProperty('confidence');
      expect(firstRec).toHaveProperty('actionRequired');
      expect(firstRec).toHaveProperty('healthcareRelevant');
      expect(firstRec).toHaveProperty('complianceLevel');
      expect(firstRec).toHaveProperty('category');
      expect(firstRec).toHaveProperty('metadata');
    });

    it('should generate workflow recommendations', async () => {
      const context = {
        currentPage: 'dashboard',
        currentTask: 'plan treatment',
        userIntent: 'planning',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await recommendationEngine.generateDetailedRecommendations(context);
      
      const workflowRecs = recommendations.filter(rec => rec.type === 'workflow');
      expect(workflowRecs.length).toBeGreaterThan(0);
      
      const planningRec = workflowRecs.find(rec => rec.title.includes('task plan'));
      expect(planningRec).toBeDefined();
      expect(planningRec?.priority).toBe('medium');
      expect(planningRec?.healthcareRelevant).toBe(true);
    });

    it('should generate content recommendations', async () => {
      const context = {
        currentPage: 'content-creation',
        currentTask: 'create medical content',
        userIntent: 'content creation',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await recommendationEngine.generateDetailedRecommendations(context);
      
      const contentRecs = recommendations.filter(rec => rec.type === 'content');
      expect(contentRecs.length).toBeGreaterThan(0);
      
      const seoRec = contentRecs.find(rec => rec.title.includes('SEO'));
      expect(seoRec).toBeDefined();
      expect(seoRec?.priority).toBe('medium');
      
      const accuracyRec = contentRecs.find(rec => rec.title.includes('medical accuracy'));
      expect(accuracyRec).toBeDefined();
      expect(accuracyRec?.priority).toBe('critical');
    });

    it('should generate compliance recommendations', async () => {
      const context = {
        currentPage: 'patient-data',
        currentTask: 'process patient information',
        userIntent: 'data processing',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await recommendationEngine.generateDetailedRecommendations(context);
      
      const complianceRecs = recommendations.filter(rec => rec.type === 'compliance');
      expect(complianceRecs.length).toBeGreaterThan(0);
      
      const hipaaRec = complianceRecs.find(rec => rec.title.includes('HIPAA'));
      expect(hipaaRec).toBeDefined();
      expect(hipaaRec?.priority).toBe('critical');
      expect(hipaaRec?.complianceLevel).toBe('hipaa');
    });

    it('should generate efficiency recommendations', async () => {
      const context = {
        currentPage: 'workflow',
        currentTask: 'complex automation task',
        userIntent: 'automation',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await recommendationEngine.generateDetailedRecommendations(context);
      
      const efficiencyRecs = recommendations.filter(rec => rec.type === 'efficiency');
      expect(efficiencyRecs.length).toBeGreaterThan(0);
      
      const automationRec = efficiencyRecs.find(rec => rec.title.includes('Automate'));
      expect(automationRec).toBeDefined();
      expect(automationRec?.priority).toBe('medium');
    });

    it('should generate safety recommendations', async () => {
      const context = {
        currentPage: 'patient-care',
        currentTask: 'diagnose patient condition',
        userIntent: 'medical diagnosis',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await recommendationEngine.generateDetailedRecommendations(context);
      
      const safetyRecs = recommendations.filter(rec => rec.type === 'safety');
      expect(safetyRecs.length).toBeGreaterThan(0);
      
      const patientSafetyRec = safetyRecs.find(rec => rec.title.includes('patient safety'));
      expect(patientSafetyRec).toBeDefined();
      expect(patientSafetyRec?.priority).toBe('critical');
    });
  });

  describe('Role-Specific Recommendations', () => {
    beforeEach(async () => {
      await recommendationEngine.initialize();
    });

    it('should generate physician-specific recommendations', async () => {
      const context = {
        currentPage: 'clinical-dashboard',
        currentTask: 'clinical decision',
        userIntent: 'clinical support',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await recommendationEngine.generateDetailedRecommendations(context);
      
      const clinicalRec = recommendations.find(rec => rec.title.includes('Clinical decision support'));
      expect(clinicalRec).toBeDefined();
      expect(clinicalRec?.metadata.role).toBe('physician');
    });

    it('should generate nurse-specific recommendations', async () => {
      const nurseConfig = { ...config, healthcareRole: 'nurse' as const };
      const nurseEngine = new RecommendationEngine(nurseConfig);
      await nurseEngine.initialize();

      const context = {
        currentPage: 'nursing-station',
        currentTask: 'patient care',
        userIntent: 'nursing care',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await nurseEngine.generateDetailedRecommendations(context);
      
      const nursingRec = recommendations.find(rec => rec.title.includes('Patient care protocols'));
      expect(nursingRec).toBeDefined();
      expect(nursingRec?.metadata.role).toBe('nurse');
    });

    it('should generate administrator-specific recommendations', async () => {
      const adminConfig = { ...config, healthcareRole: 'administrator' as const };
      const adminEngine = new RecommendationEngine(adminConfig);
      await adminEngine.initialize();

      const context = {
        currentPage: 'admin-dashboard',
        currentTask: 'compliance reporting',
        userIntent: 'administration',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await adminEngine.generateDetailedRecommendations(context);
      
      const adminRec = recommendations.find(rec => rec.title.includes('Compliance reporting'));
      expect(adminRec).toBeDefined();
      expect(adminRec?.metadata.role).toBe('administrator');
    });

    it('should generate researcher-specific recommendations', async () => {
      const researcherConfig = { ...config, healthcareRole: 'researcher' as const };
      const researcherEngine = new RecommendationEngine(researcherConfig);
      await researcherEngine.initialize();

      const context = {
        currentPage: 'research-portal',
        currentTask: 'literature review',
        userIntent: 'research',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await researcherEngine.generateDetailedRecommendations(context);
      
      const researchRec = recommendations.find(rec => rec.title.includes('Literature review assistance'));
      expect(researchRec).toBeDefined();
      expect(researchRec?.metadata.role).toBe('researcher');
    });
  });

  describe('Specialty-Specific Recommendations', () => {
    beforeEach(async () => {
      await recommendationEngine.initialize();
    });

    it('should generate specialty-specific recommendations', async () => {
      const context = {
        currentPage: 'cardiology-dashboard',
        currentTask: 'cardiac diagnosis',
        userIntent: 'cardiology work',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await recommendationEngine.generateDetailedRecommendations(context);
      
      const specialtyRec = recommendations.find(rec => rec.title.includes('cardiology best practices'));
      expect(specialtyRec).toBeDefined();
      expect(specialtyRec?.metadata.specialty).toBe('cardiology');
    });

    it('should not generate specialty recommendations for general specialty', async () => {
      const generalConfig = { ...config, medicalSpecialty: 'general' };
      const generalEngine = new RecommendationEngine(generalConfig);
      await generalEngine.initialize();

      const context = {
        currentPage: 'general-dashboard',
        currentTask: 'general task',
        userIntent: 'general work',
        medicalContext: {
          specialty: 'general',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await generalEngine.generateDetailedRecommendations(context);
      
      const specialtyRecs = recommendations.filter(rec => rec.metadata.specialty);
      expect(specialtyRecs.length).toBe(0);
    });
  });

  describe('Recommendation Filtering', () => {
    beforeEach(async () => {
      await recommendationEngine.initialize();
    });

    it('should filter recommendations by priority', async () => {
      const context = {
        currentPage: 'dashboard',
        currentTask: 'simple task',
        userIntent: 'basic help',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await recommendationEngine.generateDetailedRecommendations(context);
      
      // Should include critical and high priority recommendations
      const criticalRecs = recommendations.filter(rec => rec.priority === 'critical');
      const highRecs = recommendations.filter(rec => rec.priority === 'high');
      
      expect(criticalRecs.length).toBeGreaterThan(0);
      expect(highRecs.length).toBeGreaterThan(0);
    });

    it('should filter recommendations by healthcare relevance', async () => {
      const context = {
        currentPage: 'general-tools',
        currentTask: 'non-medical task',
        userIntent: 'general help',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await recommendationEngine.generateDetailedRecommendations(context);
      
      // Should filter out low healthcare relevance recommendations
      const healthcareRecs = recommendations.filter(rec => rec.healthcareRelevant);
      expect(healthcareRecs.length).toBeGreaterThan(0);
    });

    it('should filter recommendations by compliance level', async () => {
      const context = {
        currentPage: 'patient-data',
        currentTask: 'process sensitive data',
        userIntent: 'data handling',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await recommendationEngine.generateDetailedRecommendations(context);
      
      // Should include HIPAA-specific recommendations
      const hipaaRecs = recommendations.filter(rec => rec.complianceLevel === 'hipaa');
      expect(hipaaRecs.length).toBeGreaterThan(0);
    });

    it('should limit recommendations to 5', async () => {
      const context = {
        currentPage: 'comprehensive-dashboard',
        currentTask: 'complex multi-faceted task',
        userIntent: 'comprehensive help',
        medicalContext: {
          specialty: 'cardiology',
          complianceLevel: 'hipaa',
          patientSafety: true
        },
        conversationHistory: [],
        preferences: {}
      };

      const recommendations = await recommendationEngine.generateDetailedRecommendations(context);
      
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      const failingEngine = new RecommendationEngine(config);
      
      // Should not throw in current implementation
      await expect(failingEngine.initialize()).resolves.not.toThrow();
    });

    it('should handle recommendation generation errors gracefully', async () => {
      await recommendationEngine.initialize();
      
      const invalidContext = {
        currentPage: null,
        currentTask: undefined,
        userIntent: 123,
        medicalContext: null,
        conversationHistory: 'invalid',
        preferences: null
      };

      const recommendations = await recommendationEngine.generateRecommendations(
        { type: 'general' },
        invalidContext as any
      );
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations).toContain('I can help you with your current task. What would you like to do?');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      await recommendationEngine.initialize();
      await recommendationEngine.cleanup();
      
      // After cleanup, should not be initialized
      expect(recommendationEngine).toBeDefined();
    });
  });
});
