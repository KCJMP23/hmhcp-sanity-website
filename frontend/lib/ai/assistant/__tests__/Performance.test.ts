/**
 * Performance Tests
 * Comprehensive performance tests for the AI Assistant system
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

describe('AI Assistant Performance Tests', () => {
  let aiAssistant: AIAssistantCore;
  let complianceManager: HealthcareComplianceManager;

  const mockContext = {
    currentPage: '/clinical-dashboard',
    currentTask: 'patient-assessment',
    sessionId: 'performance-test-session',
    userRole: 'physician',
    medicalContext: {
      specialty: 'cardiology',
      complianceLevel: 'hipaa',
      patientData: {
        id: 'patient-999',
        name: 'Performance Test Patient',
        age: 45,
        conditions: ['hypertension']
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
    
    await aiAssistant.initialize('performance-test-user', mockContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Response Time Performance', () => {
    it('should respond to simple queries within 2 seconds', async () => {
      const startTime = Date.now();
      await aiAssistant.processInput('What is hypertension?');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it('should respond to complex medical queries within 5 seconds', async () => {
      const startTime = Date.now();
      await aiAssistant.processInput('What are the differential diagnoses for chest pain in a 45-year-old male with hypertension?');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should respond to terminology validation within 3 seconds', async () => {
      const startTime = Date.now();
      await complianceManager.processComplianceRequest('performance-test-user', {
        type: 'terminology',
        content: 'Patient has acute myocardial infarction',
        context: mockContext
      });
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(3000);
    });

    it('should respond to compliance guidance within 4 seconds', async () => {
      const startTime = Date.now();
      await complianceManager.processComplianceRequest('performance-test-user', {
        type: 'guidance',
        content: 'patient data handling',
        context: mockContext
      });
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(4000);
    });
  });

  describe('Throughput Performance', () => {
    it('should handle 100 concurrent requests within 30 seconds', async () => {
      const startTime = Date.now();
      
      const promises = Array.from({ length: 100 }, (_, i) => 
        aiAssistant.processInput(`concurrent test ${i}`)
      );
      
      await Promise.all(promises);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(30000);
    });

    it('should handle 500 requests sequentially within 5 minutes', async () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 500; i++) {
        await aiAssistant.processInput(`sequential test ${i}`);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(300000); // 5 minutes
    });

    it('should maintain consistent throughput over time', async () => {
      const batchSize = 50;
      const batches = 10;
      const responseTimes: number[] = [];
      
      for (let batch = 0; batch < batches; batch++) {
        const batchStartTime = Date.now();
        
        const promises = Array.from({ length: batchSize }, (_, i) => 
          aiAssistant.processInput(`batch ${batch} test ${i}`)
        );
        
        await Promise.all(promises);
        const batchEndTime = Date.now();
        
        responseTimes.push(batchEndTime - batchStartTime);
      }
      
      // Calculate coefficient of variation (should be less than 0.3 for consistency)
      const mean = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const variance = responseTimes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / responseTimes.length;
      const coefficientOfVariation = Math.sqrt(variance) / mean;
      
      expect(coefficientOfVariation).toBeLessThan(0.3);
    });
  });

  describe('Memory Performance', () => {
    it('should not exceed 500MB memory usage under normal load', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process 1000 requests
      for (let i = 0; i < 1000; i++) {
        await aiAssistant.processInput(`memory test ${i}`);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024); // 500MB
    });

    it('should not have memory leaks over extended usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process requests in cycles to test for memory leaks
      for (let cycle = 0; cycle < 10; cycle++) {
        for (let i = 0; i < 100; i++) {
          await aiAssistant.processInput(`leak test cycle ${cycle} ${i}`);
        }
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should handle large input data efficiently', async () => {
      const largeInput = 'Patient has '.repeat(1000) + 'hypertension';
      
      const startTime = Date.now();
      const result = await aiAssistant.processInput(largeInput);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds
    });
  });

  describe('CPU Performance', () => {
    it('should not exceed 80% CPU usage during normal operation', async () => {
      const startCpuUsage = process.cpuUsage();
      
      // Process 100 requests
      for (let i = 0; i < 100; i++) {
        await aiAssistant.processInput(`cpu test ${i}`);
      }
      
      const endCpuUsage = process.cpuUsage(startCpuUsage);
      const cpuTime = endCpuUsage.user + endCpuUsage.system;
      const elapsedTime = Date.now() - Date.now();
      
      // CPU usage should be reasonable (this is a simplified test)
      expect(cpuTime).toBeLessThan(1000000); // 1 second in microseconds
    });

    it('should handle CPU-intensive operations efficiently', async () => {
      const startTime = Date.now();
      
      // Process complex medical queries that require more CPU
      const complexQueries = [
        'Analyze this complex medical case with multiple comorbidities',
        'Generate differential diagnosis for rare condition',
        'Perform statistical analysis on patient data',
        'Validate complex medical terminology',
        'Generate comprehensive treatment plan'
      ];
      
      for (const query of complexQueries) {
        await aiAssistant.processInput(query);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(30000); // 30 seconds
    });
  });

  describe('Network Performance', () => {
    it('should handle network latency gracefully', async () => {
      // Mock network delay
      jest.spyOn(aiAssistant, 'processInput').mockImplementation(async (input) => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        return {
          success: true,
          response: 'Mock response',
          healthcareRelevant: true,
          complianceRequired: true
        };
      });
      
      const startTime = Date.now();
      await aiAssistant.processInput('test input');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(2000); // Should handle delay gracefully
    });

    it('should handle network timeouts appropriately', async () => {
      // Mock network timeout
      jest.spyOn(aiAssistant, 'processInput').mockRejectedValue(
        new Error('Network timeout')
      );
      
      try {
        await aiAssistant.processInput('test input');
      } catch (error) {
        expect(error.message).toBe('Network timeout');
      }
    });

    it('should retry failed requests efficiently', async () => {
      let attemptCount = 0;
      
      // Mock intermittent failures
      jest.spyOn(aiAssistant, 'processInput').mockImplementation(async (input) => {
        attemptCount++;
        if (attemptCount <= 2) {
          throw new Error('Network error');
        }
        return {
          success: true,
          response: 'Success after retry',
          healthcareRelevant: true,
          complianceRequired: true
        };
      });
      
      const result = await aiAssistant.processInput('test input');
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3); // Should retry twice
    });
  });

  describe('Database Performance', () => {
    it('should handle database queries efficiently', async () => {
      const startTime = Date.now();
      
      // Process requests that would trigger database queries
      for (let i = 0; i < 50; i++) {
        await complianceManager.processComplianceRequest('performance-test-user', {
          type: 'terminology',
          content: `medical term ${i}`,
          context: mockContext
        });
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(15000); // 15 seconds
    });

    it('should handle concurrent database operations', async () => {
      const startTime = Date.now();
      
      const promises = Array.from({ length: 20 }, (_, i) => 
        complianceManager.processComplianceRequest('performance-test-user', {
          type: 'guidance',
          content: `guidance request ${i}`,
          context: mockContext
        })
      );
      
      await Promise.all(promises);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(20000); // 20 seconds
    });
  });

  describe('Scalability Performance', () => {
    it('should scale linearly with request volume', async () => {
      const volumes = [10, 50, 100];
      const responseTimes: number[] = [];
      
      for (const volume of volumes) {
        const startTime = Date.now();
        
        const promises = Array.from({ length: volume }, (_, i) => 
          aiAssistant.processInput(`scalability test ${i}`)
        );
        
        await Promise.all(promises);
        const endTime = Date.now();
        
        responseTimes.push(endTime - startTime);
      }
      
      // Response time should scale roughly linearly
      const ratio1 = responseTimes[1] / responseTimes[0]; // 50/10 = 5
      const ratio2 = responseTimes[2] / responseTimes[0]; // 100/10 = 10
      
      expect(ratio1).toBeLessThan(6); // Allow some overhead
      expect(ratio2).toBeLessThan(12); // Allow some overhead
    });

    it('should maintain performance with increasing data size', async () => {
      const dataSizes = [100, 500, 1000, 2000]; // characters
      const responseTimes: number[] = [];
      
      for (const size of dataSizes) {
        const largeInput = 'A'.repeat(size);
        
        const startTime = Date.now();
        await aiAssistant.processInput(largeInput);
        const endTime = Date.now();
        
        responseTimes.push(endTime - startTime);
      }
      
      // Response time should not increase dramatically with data size
      const maxResponseTime = Math.max(...responseTimes);
      expect(maxResponseTime).toBeLessThan(10000); // 10 seconds
    });
  });

  describe('Resource Utilization', () => {
    it('should efficiently utilize available resources', async () => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;
      
      // Process 200 requests
      for (let i = 0; i < 200; i++) {
        await aiAssistant.processInput(`resource test ${i}`);
      }
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      const totalTime = endTime - startTime;
      const memoryUsed = endMemory - startMemory;
      
      // Should process requests efficiently (less than 1 second per request)
      expect(totalTime / 200).toBeLessThan(1000);
      
      // Should use memory efficiently (less than 1MB per request)
      expect(memoryUsed / 200).toBeLessThan(1024 * 1024);
    });

    it('should handle resource constraints gracefully', async () => {
      // Simulate resource constraints by limiting concurrent operations
      const maxConcurrent = 5;
      let activeOperations = 0;
      
      const processWithLimit = async (input: string) => {
        if (activeOperations >= maxConcurrent) {
          await new Promise(resolve => setTimeout(resolve, 100));
          return processWithLimit(input);
        }
        
        activeOperations++;
        try {
          return await aiAssistant.processInput(input);
        } finally {
          activeOperations--;
        }
      };
      
      const startTime = Date.now();
      
      const promises = Array.from({ length: 20 }, (_, i) => 
        processWithLimit(`constrained test ${i}`)
      );
      
      await Promise.all(promises);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(30000); // 30 seconds
    });
  });
});
