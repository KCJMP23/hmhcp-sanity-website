/**
 * Jest Configuration for AI Assistant Tests
 * Comprehensive test configuration for unit, integration, and E2E tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // TypeScript support
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test timeout
  testTimeout: 30000, // 30 seconds for complex tests
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage paths
  collectCoverageFrom: [
    'lib/ai/assistant/**/*.ts',
    '!lib/ai/assistant/**/*.d.ts',
    '!lib/ai/assistant/**/__tests__/**',
    '!lib/ai/assistant/**/node_modules/**'
  ],
  
  // Test suites
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['**/__tests__/**/*.test.ts'],
      testPathIgnorePatterns: ['**/Integration.test.ts', '**/E2E.test.ts', '**/Performance.test.ts', '**/Accessibility.test.ts']
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['**/__tests__/Integration.test.ts'],
      testTimeout: 60000 // 1 minute for integration tests
    },
    {
      displayName: 'E2E Tests',
      testMatch: ['**/__tests__/E2E.test.ts'],
      testTimeout: 120000 // 2 minutes for E2E tests
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['**/__tests__/Performance.test.ts'],
      testTimeout: 300000 // 5 minutes for performance tests
    },
    {
      displayName: 'Accessibility Tests',
      testMatch: ['**/__tests__/Accessibility.test.ts'],
      testTimeout: 60000 // 1 minute for accessibility tests
    }
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',
  
  // Test parallelization
  maxWorkers: '50%', // Use half of available CPU cores
  
  // Verbose output
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/lib/$1'
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'test-report.html',
      expand: true
    }],
    ['jest-junit', {
      outputDirectory: './test-reports',
      outputName: 'junit.xml'
    }]
  ],
  
  // Watch mode configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Performance monitoring
  detectOpenHandles: true,
  forceExit: true,
  
  // Custom matchers
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test data
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/test-reports/'
  ],
  
  // Module resolution
  moduleDirectories: ['node_modules', 'lib'],
  
  // Extensions
  extensionsToTreatAsEsm: ['.ts'],
  
  // Globals
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};
