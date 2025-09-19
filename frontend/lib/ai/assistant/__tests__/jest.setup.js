/**
 * Jest Setup File
 * Global setup and configuration for AI Assistant tests
 */

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock process.env for tests
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

// Global test utilities
global.testUtils = {
  // Create mock context
  createMockContext: (overrides = {}) => ({
    currentPage: '/test-page',
    currentTask: 'test-task',
    sessionId: 'test-session-123',
    userRole: 'physician',
    medicalContext: {
      specialty: 'cardiology',
      complianceLevel: 'hipaa',
      patientData: {
        id: 'patient-123',
        name: 'Test Patient',
        age: 45,
        conditions: ['hypertension']
      }
    },
    preferences: {
      language: 'en',
      theme: 'light',
      notifications: true
    },
    ...overrides
  }),

  // Create mock user
  createMockUser: (overrides = {}) => ({
    id: 'test-user-123',
    email: 'test@example.com',
    role: 'physician',
    specialty: 'cardiology',
    ...overrides
  }),

  // Wait for async operations
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock Supabase response
  mockSupabaseResponse: (data = null, error = null) => ({
    data,
    error,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK'
  }),

  // Mock AI response
  mockAIResponse: (overrides = {}) => ({
    success: true,
    response: 'Mock AI response',
    healthcareRelevant: true,
    complianceRequired: true,
    medicalTerms: [],
    confidence: 0.9,
    processingTime: 100,
    ...overrides
  }),

  // Mock compliance response
  mockComplianceResponse: (overrides = {}) => ({
    hipaaCompliant: true,
    fdaCompliant: true,
    cmsCompliant: true,
    jcahoCompliant: true,
    issues: [],
    warnings: [],
    ...overrides
  }),

  // Mock accessibility response
  mockAccessibilityResponse: (overrides = {}) => ({
    accessible: true,
    screenReaderFriendly: true,
    keyboardAccessible: true,
    colorContrast: {
      ratio: 7.5,
      level: 'AAA'
    },
    altText: 'Mock alt text',
    ariaLabels: [],
    ...overrides
  })
};

// Global test hooks
beforeAll(async () => {
  // Global setup before all tests
  console.log('Setting up AI Assistant test suite...');
});

afterAll(async () => {
  // Global cleanup after all tests
  console.log('Cleaning up AI Assistant test suite...');
});

beforeEach(() => {
  // Setup before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.clearAllTimers();
});

// Custom matchers
expect.extend({
  toBeAccessible(received) {
    const pass = received.accessible === true && 
                 received.screenReaderFriendly === true && 
                 received.keyboardAccessible === true;
    
    return {
      message: () => `Expected response to be accessible`,
      pass
    };
  },

  toBeHIPAACompliant(received) {
    const pass = received.hipaaCompliant === true && 
                 received.privacyLevel !== 'low';
    
    return {
      message: () => `Expected response to be HIPAA compliant`,
      pass
    };
  },

  toHaveGoodPerformance(received, threshold = 5000) {
    const pass = received.processingTime < threshold;
    
    return {
      message: () => `Expected processing time to be less than ${threshold}ms, got ${received.processingTime}ms`,
      pass
    };
  },

  toBeHealthcareRelevant(received) {
    const pass = received.healthcareRelevant === true && 
                 received.medicalTerms && 
                 received.medicalTerms.length > 0;
    
    return {
      message: () => `Expected response to be healthcare relevant`,
      pass
    };
  }
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Export test utilities
module.exports = {
  testUtils: global.testUtils
};
