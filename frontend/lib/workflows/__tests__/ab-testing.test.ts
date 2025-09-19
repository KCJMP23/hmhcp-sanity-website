import { WorkflowABTesting, ABTest, WorkflowVariant, TestMetric } from '../ab-testing';
import { WorkflowDefinition } from '../../types/workflows/visual-builder';

// Mock workflow for testing
const createMockWorkflow = (id: string = 'test-workflow'): WorkflowDefinition => ({
  id,
  name: 'Test Workflow',
  description: 'A test workflow',
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 0, y: 0 },
      data: { label: 'Start' }
    },
    {
      id: 'process',
      type: 'dataProcessor',
      position: { x: 100, y: 0 },
      data: { label: 'Process Data' }
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 200, y: 0 },
      data: { label: 'End' }
    }
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'process' },
    { id: 'e2', source: 'process', target: 'end' }
  ]
});

describe('WorkflowABTesting', () => {
  let abTesting: WorkflowABTesting;
  let mockWorkflow: WorkflowDefinition;
  let variants: WorkflowVariant[];
  let metrics: TestMetric[];

  beforeEach(() => {
    abTesting = new WorkflowABTesting();
    mockWorkflow = createMockWorkflow();
    
    variants = [
      {
        id: 'control-variant',
        name: 'Control',
        description: 'Original workflow',
        workflow: mockWorkflow,
        trafficPercentage: 50,
        isControl: true,
        metadata: {
          nodeCount: 3,
          edgeCount: 2,
          complexity: 5,
          estimatedExecutionTime: 1000
        }
      },
      {
        id: 'treatment-variant',
        name: 'Treatment',
        description: 'Optimized workflow',
        workflow: mockWorkflow,
        trafficPercentage: 50,
        isControl: false,
        metadata: {
          nodeCount: 3,
          edgeCount: 2,
          complexity: 4,
          estimatedExecutionTime: 800
        }
      }
    ];

    metrics = [
      {
        id: 'conversion-metric',
        name: 'Conversion Rate',
        type: 'conversion',
        description: 'Percentage of successful completions',
        isPrimary: true,
        calculationMethod: 'percentage'
      },
      {
        id: 'performance-metric',
        name: 'Execution Time',
        type: 'performance',
        description: 'Average execution time in milliseconds',
        isPrimary: false,
        calculationMethod: 'average'
      }
    ];
  });

  describe('Test Creation', () => {
    it('should create a new A/B test', () => {
      const test = abTesting.createTest(
        'Test Name',
        'Test Description',
        variants,
        metrics,
        14,
        'test-user'
      );

      expect(test).toBeDefined();
      expect(test.id).toMatch(/^test-/);
      expect(test.name).toBe('Test Name');
      expect(test.description).toBe('Test Description');
      expect(test.variants).toEqual(variants);
      expect(test.metrics).toEqual(metrics);
      expect(test.duration).toBe(14);
      expect(test.status).toBe('draft');
      expect(test.createdBy).toBe('test-user');
      expect(test.confidenceLevel).toBe(0.95);
      expect(test.minSampleSize).toBe(1000);
    });

    it('should create test with custom options', () => {
      const test = abTesting.createTest(
        'Test Name',
        'Test Description',
        variants,
        metrics,
        7,
        'test-user',
        {
          minSampleSize: 500,
          confidenceLevel: 0.99
        }
      );

      expect(test.minSampleSize).toBe(500);
      expect(test.confidenceLevel).toBe(0.99);
    });

    it('should throw error for insufficient variants', () => {
      expect(() => {
        abTesting.createTest(
          'Test Name',
          'Test Description',
          [variants[0]], // Only one variant
          metrics,
          14,
          'test-user'
        );
      }).toThrow('A/B test must have at least 2 variants');
    });

    it('should throw error for no control variant', () => {
      const noControlVariants = variants.map(v => ({ ...v, isControl: false }));
      
      expect(() => {
        abTesting.createTest(
          'Test Name',
          'Test Description',
          noControlVariants,
          metrics,
          14,
          'test-user'
        );
      }).toThrow('A/B test must have exactly one control variant');
    });

    it('should throw error for multiple control variants', () => {
      const multipleControlVariants = variants.map(v => ({ ...v, isControl: true }));
      
      expect(() => {
        abTesting.createTest(
          'Test Name',
          'Test Description',
          multipleControlVariants,
          metrics,
          14,
          'test-user'
        );
      }).toThrow('A/B test must have exactly one control variant');
    });

    it('should throw error for invalid traffic allocation', () => {
      const invalidVariants = variants.map(v => ({ ...v, trafficPercentage: 30 })); // Sums to 60%
      
      expect(() => {
        abTesting.createTest(
          'Test Name',
          'Test Description',
          invalidVariants,
          metrics,
          14,
          'test-user'
        );
      }).toThrow('Traffic allocation must sum to 100%');
    });
  });

  describe('Test Management', () => {
    let test: ABTest;

    beforeEach(() => {
      test = abTesting.createTest(
        'Test Name',
        'Test Description',
        variants,
        metrics,
        14,
        'test-user'
      );
    });

    it('should get test by ID', () => {
      const retrieved = abTesting.getTest(test.id);
      expect(retrieved).toEqual(test);
    });

    it('should return null for non-existent test', () => {
      const retrieved = abTesting.getTest('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should get all tests', () => {
      const test2 = abTesting.createTest('Test 2', 'Description', variants, metrics, 7, 'user2');
      const allTests = abTesting.getAllTests();
      
      expect(allTests).toHaveLength(2);
      expect(allTests).toContain(test);
      expect(allTests).toContain(test2);
    });

    it('should get tests by status', () => {
      abTesting.startTest(test.id, 'user');
      const runningTests = abTesting.getTestsByStatus('running');
      
      expect(runningTests).toHaveLength(1);
      expect(runningTests[0]).toEqual(test);
    });

    it('should update test configuration', () => {
      const success = abTesting.updateTest(
        test.id,
        { name: 'Updated Name', duration: 21 },
        'user'
      );
      
      expect(success).toBe(true);
      expect(test.name).toBe('Updated Name');
      expect(test.duration).toBe(21);
    });

    it('should not update running test', () => {
      abTesting.startTest(test.id, 'user');
      const success = abTesting.updateTest(
        test.id,
        { name: 'Updated Name' },
        'user'
      );
      
      expect(success).toBe(false);
      expect(test.name).toBe('Test Name');
    });

    it('should delete test', () => {
      const success = abTesting.deleteTest(test.id);
      expect(success).toBe(true);
      expect(abTesting.getTest(test.id)).toBeNull();
    });

    it('should not delete running test', () => {
      abTesting.startTest(test.id, 'user');
      const success = abTesting.deleteTest(test.id);
      expect(success).toBe(false);
      expect(abTesting.getTest(test.id)).toBeDefined();
    });
  });

  describe('Test Execution', () => {
    let test: ABTest;

    beforeEach(() => {
      test = abTesting.createTest(
        'Test Name',
        'Test Description',
        variants,
        metrics,
        14,
        'test-user'
      );
    });

    it('should start a test', () => {
      const success = abTesting.startTest(test.id, 'user');
      expect(success).toBe(true);
      expect(test.status).toBe('running');
    });

    it('should not start non-existent test', () => {
      const success = abTesting.startTest('non-existent', 'user');
      expect(success).toBe(false);
    });

    it('should not start non-draft test', () => {
      abTesting.startTest(test.id, 'user');
      const success = abTesting.startTest(test.id, 'user');
      expect(success).toBe(false);
    });

    it('should pause a running test', () => {
      abTesting.startTest(test.id, 'user');
      const success = abTesting.pauseTest(test.id, 'user');
      expect(success).toBe(true);
      expect(test.status).toBe('paused');
    });

    it('should resume a paused test', () => {
      abTesting.startTest(test.id, 'user');
      abTesting.pauseTest(test.id, 'user');
      const success = abTesting.resumeTest(test.id, 'user');
      expect(success).toBe(true);
      expect(test.status).toBe('running');
    });

    it('should complete a running test', () => {
      abTesting.startTest(test.id, 'user');
      const success = abTesting.completeTest(test.id, 'user');
      expect(success).toBe(true);
      expect(test.status).toBe('completed');
      expect(test.endDate).toBeDefined();
    });
  });

  describe('Result Recording', () => {
    let test: ABTest;

    beforeEach(() => {
      test = abTesting.createTest(
        'Test Name',
        'Test Description',
        variants,
        metrics,
        14,
        'test-user'
      );
      abTesting.startTest(test.id, 'user');
    });

    it('should record a test result', () => {
      const result = abTesting.recordResult(
        test.id,
        'control-variant',
        'conversion-metric',
        1,
        'user-1',
        'session-1'
      );

      expect(result).toBeDefined();
      expect(result?.testId).toBe(test.id);
      expect(result?.variantId).toBe('control-variant');
      expect(result?.metricId).toBe('conversion-metric');
      expect(result?.value).toBe(1);
      expect(result?.userId).toBe('user-1');
      expect(result?.sessionId).toBe('session-1');
    });

    it('should not record result for non-existent test', () => {
      const result = abTesting.recordResult(
        'non-existent',
        'control-variant',
        'conversion-metric',
        1
      );
      expect(result).toBeNull();
    });

    it('should not record result for non-running test', () => {
      abTesting.pauseTest(test.id, 'user');
      const result = abTesting.recordResult(
        test.id,
        'control-variant',
        'conversion-metric',
        1
      );
      expect(result).toBeNull();
    });

    it('should not record result for invalid variant', () => {
      const result = abTesting.recordResult(
        test.id,
        'invalid-variant',
        'conversion-metric',
        1
      );
      expect(result).toBeNull();
    });

    it('should not record result for invalid metric', () => {
      const result = abTesting.recordResult(
        test.id,
        'control-variant',
        'invalid-metric',
        1
      );
      expect(result).toBeNull();
    });

    it('should get variant results', () => {
      abTesting.recordResult(test.id, 'control-variant', 'conversion-metric', 1);
      abTesting.recordResult(test.id, 'control-variant', 'conversion-metric', 0);
      abTesting.recordResult(test.id, 'treatment-variant', 'conversion-metric', 1);

      const controlResults = abTesting.getVariantResults(test.id, 'control-variant', 'conversion-metric');
      expect(controlResults).toHaveLength(2);
      expect(controlResults.every(r => r.variantId === 'control-variant')).toBe(true);
    });
  });

  describe('Statistical Analysis', () => {
    let test: ABTest;

    beforeEach(() => {
      test = abTesting.createTest(
        'Test Name',
        'Test Description',
        variants,
        metrics,
        14,
        'test-user'
      );
      abTesting.startTest(test.id, 'user');
    });

    it('should generate statistical analysis', () => {
      // Add some test results for both metrics
      for (let i = 0; i < 100; i++) {
        abTesting.recordResult(test.id, 'control-variant', 'conversion-metric', Math.random() < 0.5 ? 1 : 0);
        abTesting.recordResult(test.id, 'treatment-variant', 'conversion-metric', Math.random() < 0.6 ? 1 : 0);
        abTesting.recordResult(test.id, 'control-variant', 'performance-metric', 950 + Math.random() * 100);
        abTesting.recordResult(test.id, 'treatment-variant', 'performance-metric', 750 + Math.random() * 100);
      }

      const analyses = abTesting.generateAnalysis(test.id);
      expect(analyses).toHaveLength(4); // 2 variants × 2 metrics
      
      analyses.forEach(analysis => {
        expect(analysis.testId).toBe(test.id);
        expect(analysis.sampleSize).toBeGreaterThan(0);
        expect(analysis.mean).toBeGreaterThanOrEqual(0);
        expect(analysis.standardDeviation).toBeGreaterThanOrEqual(0);
        expect(analysis.confidenceInterval).toBeDefined();
        expect(analysis.pValue).toBeGreaterThanOrEqual(0);
        expect(analysis.pValue).toBeLessThanOrEqual(1);
      });
    });

    it('should generate test comparisons', () => {
      // Add some test results for both metrics
      for (let i = 0; i < 100; i++) {
        abTesting.recordResult(test.id, 'control-variant', 'conversion-metric', Math.random() < 0.5 ? 1 : 0);
        abTesting.recordResult(test.id, 'treatment-variant', 'conversion-metric', Math.random() < 0.6 ? 1 : 0);
        abTesting.recordResult(test.id, 'control-variant', 'performance-metric', 950 + Math.random() * 100);
        abTesting.recordResult(test.id, 'treatment-variant', 'performance-metric', 750 + Math.random() * 100);
      }

      abTesting.generateAnalysis(test.id);
      const comparisons = abTesting.generateComparisons(test.id);
      
      expect(comparisons).toHaveLength(2); // 2 metrics
      comparisons.forEach(comparison => {
        expect(comparison.testId).toBe(test.id);
        expect(comparison.controlVariant).toBe('control-variant');
        expect(comparison.treatmentVariant).toBe('treatment-variant');
        expect(comparison.lift).toBeDefined();
        expect(comparison.confidenceLevel).toBe(test.confidenceLevel);
        expect(comparison.isSignificant).toBeDefined();
        expect(comparison.recommendation).toBeDefined();
        expect(comparison.reasoning).toBeDefined();
      });
    });

    it('should generate test report', () => {
      // Add some test results for both metrics
      for (let i = 0; i < 100; i++) {
        abTesting.recordResult(test.id, 'control-variant', 'conversion-metric', Math.random() < 0.5 ? 1 : 0);
        abTesting.recordResult(test.id, 'treatment-variant', 'conversion-metric', Math.random() < 0.6 ? 1 : 0);
        abTesting.recordResult(test.id, 'control-variant', 'performance-metric', 950 + Math.random() * 100);
        abTesting.recordResult(test.id, 'treatment-variant', 'performance-metric', 750 + Math.random() * 100);
      }

      abTesting.completeTest(test.id, 'user');
      const report = abTesting.generateReport(test.id);
      
      expect(report).toBeDefined();
      expect(report?.testId).toBe(test.id);
      expect(report?.testName).toBe(test.name);
      expect(report?.status).toBe('completed');
      expect(report?.variants).toHaveLength(2);
      expect(report?.comparisons).toHaveLength(2);
      expect(report?.summary).toBeDefined();
      expect(report?.generatedAt).toBeDefined();
    });

    it('should return null for non-existent test report', () => {
      const report = abTesting.generateReport('non-existent');
      expect(report).toBeNull();
    });
  });

  describe('Event Emission', () => {
    let eventSpy: jest.SpyInstance;

    beforeEach(() => {
      eventSpy = jest.fn();
      abTesting.on('test-created', eventSpy);
    });

    it('should emit test-created event', () => {
      abTesting.createTest('Test Name', 'Description', variants, metrics, 14, 'user');
      expect(eventSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
    });

    it('should emit test-started event', () => {
      const test = abTesting.createTest('Test Name', 'Description', variants, metrics, 14, 'user');
      const startSpy = jest.fn();
      abTesting.on('test-started', startSpy);
      
      abTesting.startTest(test.id, 'user');
      expect(startSpy).toHaveBeenCalledWith(test.id, expect.any(Object));
    });

    it('should emit result-recorded event', () => {
      const test = abTesting.createTest('Test Name', 'Description', variants, metrics, 14, 'user');
      abTesting.startTest(test.id, 'user');
      
      const resultSpy = jest.fn();
      abTesting.on('result-recorded', resultSpy);
      
      abTesting.recordResult(test.id, 'control-variant', 'conversion-metric', 1);
      expect(resultSpy).toHaveBeenCalledWith(test.id, expect.any(Object));
    });
  });
});
