/**
 * Mock for client-safe-logger used in tests
 */

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  silly: jest.fn(),
  monitor: jest.fn(),
  audit: jest.fn(),
  apiRequest: jest.fn(),
  securityEvent: jest.fn(),
  performanceMetric: jest.fn(),
  databaseQuery: jest.fn(),
  contactSubmission: jest.fn()
}

export default mockLogger