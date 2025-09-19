// Load Testing Utilities
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

export interface LoadTestConfig {
  baseUrl: string;
  concurrency: number;
  duration: number; // in seconds
  rampUp: number; // in seconds
  rampDown: number; // in seconds
  thinkTime: number; // in milliseconds
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  errors: Array<{
    endpoint: string;
    error: string;
    count: number;
  }>;
}

export class LoadTester {
  private config: LoadTestConfig;
  private results: LoadTestResult[] = [];

  constructor(config: LoadTestConfig) {
    this.config = config;
  }

  /**
   * Run load test for publications API
   */
  async runPublicationsLoadTest(): Promise<LoadTestResult> {
    const endpoints = [
      { method: 'GET', path: '/api/admin/publications', weight: 40 },
      { method: 'GET', path: '/api/admin/publications/analytics', weight: 20 },
      { method: 'GET', path: '/api/admin/authors', weight: 20 },
      { method: 'GET', path: '/api/admin/research-topics', weight: 10 },
      { method: 'POST', path: '/api/admin/publications', weight: 10 }
    ];

    return this.runLoadTest(endpoints, 'publications');
  }

  /**
   * Run load test for research integration API
   */
  async runResearchIntegrationLoadTest(): Promise<LoadTestResult> {
    const endpoints = [
      { method: 'POST', path: '/api/admin/research/search', weight: 50 },
      { method: 'GET', path: '/api/admin/research/trending', weight: 30 },
      { method: 'GET', path: '/api/admin/research/details', weight: 20 }
    ];

    return this.runLoadTest(endpoints, 'research_integration');
  }

  /**
   * Run load test for analytics API
   */
  async runAnalyticsLoadTest(): Promise<LoadTestResult> {
    const endpoints = [
      { method: 'GET', path: '/api/admin/publications/analytics/trend', weight: 30 },
      { method: 'GET', path: '/api/admin/publications/analytics/benchmark', weight: 25 },
      { method: 'GET', path: '/api/admin/publications/analytics/predictive', weight: 25 },
      { method: 'POST', path: '/api/admin/publications/analytics/report', weight: 20 }
    ];

    return this.runLoadTest(endpoints, 'analytics');
  }

  /**
   * Run load test for bulk import
   */
  async runBulkImportLoadTest(): Promise<LoadTestResult> {
    const endpoints = [
      { method: 'POST', path: '/api/admin/publications/import', weight: 100 }
    ];

    return this.runLoadTest(endpoints, 'bulk_import');
  }

  /**
   * Run comprehensive load test
   */
  async runComprehensiveLoadTest(): Promise<{
    publications: LoadTestResult;
    research: LoadTestResult;
    analytics: LoadTestResult;
    bulkImport: LoadTestResult;
    overall: LoadTestResult;
  }> {
    console.log('Starting comprehensive load test...');

    const [publications, research, analytics, bulkImport] = await Promise.all([
      this.runPublicationsLoadTest(),
      this.runResearchIntegrationLoadTest(),
      this.runAnalyticsLoadTest(),
      this.runBulkImportLoadTest()
    ]);

    // Calculate overall results
    const overall: LoadTestResult = {
      totalRequests: publications.totalRequests + research.totalRequests + 
                    analytics.totalRequests + bulkImport.totalRequests,
      successfulRequests: publications.successfulRequests + research.successfulRequests + 
                         analytics.successfulRequests + bulkImport.successfulRequests,
      failedRequests: publications.failedRequests + research.failedRequests + 
                     analytics.failedRequests + bulkImport.failedRequests,
      averageResponseTime: (publications.averageResponseTime + research.averageResponseTime + 
                           analytics.averageResponseTime + bulkImport.averageResponseTime) / 4,
      minResponseTime: Math.min(publications.minResponseTime, research.minResponseTime, 
                               analytics.minResponseTime, bulkImport.minResponseTime),
      maxResponseTime: Math.max(publications.maxResponseTime, research.maxResponseTime, 
                               analytics.maxResponseTime, bulkImport.maxResponseTime),
      requestsPerSecond: (publications.requestsPerSecond + research.requestsPerSecond + 
                         analytics.requestsPerSecond + bulkImport.requestsPerSecond) / 4,
      errorRate: (publications.errorRate + research.errorRate + 
                 analytics.errorRate + bulkImport.errorRate) / 4,
      errors: [...publications.errors, ...research.errors, ...analytics.errors, ...bulkImport.errors]
    };

    return {
      publications,
      research,
      analytics,
      bulkImport,
      overall
    };
  }

  /**
   * Run load test with given endpoints
   */
  private async runLoadTest(
    endpoints: Array<{ method: string; path: string; weight: number }>,
    testName: string
  ): Promise<LoadTestResult> {
    console.log(`Starting load test: ${testName}`);
    
    const startTime = Date.now();
    const endTime = startTime + (this.config.duration * 1000);
    
    const results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [] as number[],
      errors: new Map<string, number>()
    };

    // Create workers
    const workers = Array.from({ length: this.config.concurrency }, (_, i) => 
      this.createWorker(endpoints, results, i)
    );

    // Start workers with ramp-up
    const rampUpDelay = (this.config.rampUp * 1000) / this.config.concurrency;
    for (let i = 0; i < workers.length; i++) {
      setTimeout(() => workers[i].start(), i * rampUpDelay);
    }

    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, this.config.duration * 1000));

    // Stop workers with ramp-down
    const rampDownDelay = (this.config.rampDown * 1000) / this.config.concurrency;
    for (let i = 0; i < workers.length; i++) {
      setTimeout(() => workers[i].stop(), i * rampDownDelay);
    }

    // Wait for ramp-down to complete
    await new Promise(resolve => setTimeout(resolve, this.config.rampDown * 1000));

    // Calculate results
    const responseTimes = results.responseTimes.sort((a, b) => a - b);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    const minResponseTime = responseTimes.length > 0 ? responseTimes[0] : 0;
    const maxResponseTime = responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0;
    const requestsPerSecond = results.totalRequests / this.config.duration;
    const errorRate = results.totalRequests > 0 
      ? (results.failedRequests / results.totalRequests) * 100 
      : 0;

    const result: LoadTestResult = {
      totalRequests: results.totalRequests,
      successfulRequests: results.successfulRequests,
      failedRequests: results.failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      requestsPerSecond,
      errorRate,
      errors: Array.from(results.errors.entries()).map(([error, count]) => ({
        endpoint: error.split(':')[0],
        error: error.split(':')[1],
        count
      }))
    };

    // Record performance metrics
    performanceMonitor.recordMetric('load_test_total_requests', result.totalRequests, 'count', { test: testName });
    performanceMonitor.recordMetric('load_test_response_time', result.averageResponseTime, 'ms', { test: testName });
    performanceMonitor.recordMetric('load_test_throughput', result.requestsPerSecond, 'rps', { test: testName });
    performanceMonitor.recordMetric('load_test_error_rate', result.errorRate, 'percent', { test: testName });

    console.log(`Load test completed: ${testName}`);
    console.log(`Total requests: ${result.totalRequests}`);
    console.log(`Success rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`);
    console.log(`Average response time: ${result.averageResponseTime.toFixed(2)}ms`);
    console.log(`Requests per second: ${result.requestsPerSecond.toFixed(2)}`);

    return result;
  }

  /**
   * Create a worker for load testing
   */
  private createWorker(
    endpoints: Array<{ method: string; path: string; weight: number }>,
    results: any,
    workerId: number
  ) {
    let running = false;
    let requestCount = 0;

    const selectEndpoint = () => {
      const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (const endpoint of endpoints) {
        random -= endpoint.weight;
        if (random <= 0) {
          return endpoint;
        }
      }
      
      return endpoints[0];
    };

    const makeRequest = async () => {
      if (!running) return;

      const endpoint = selectEndpoint();
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${this.config.baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token' // Mock token for testing
          },
          body: endpoint.method === 'POST' ? JSON.stringify({ test: true }) : undefined
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        results.totalRequests++;
        results.responseTimes.push(responseTime);

        if (response.ok) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
          const errorKey = `${endpoint.path}:${response.status}`;
          results.errors.set(errorKey, (results.errors.get(errorKey) || 0) + 1);
        }

        // Record performance metrics
        performanceMonitor.recordApiResponseTime(
          endpoint.path,
          endpoint.method,
          responseTime,
          response.status
        );

      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        results.totalRequests++;
        results.failedRequests++;
        results.responseTimes.push(responseTime);

        const errorKey = `${endpoint.path}:${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.set(errorKey, (results.errors.get(errorKey) || 0) + 1);

        console.error(`Worker ${workerId} error:`, error);
      }

      requestCount++;
    };

    const run = async () => {
      while (running) {
        await makeRequest();
        
        // Think time between requests
        if (this.config.thinkTime > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.thinkTime));
        }
      }
    };

    return {
      start: () => {
        running = true;
        run();
      },
      stop: () => {
        running = false;
      },
      getRequestCount: () => requestCount
    };
  }
}

/**
 * Run load tests for all publication management features
 */
export async function runAllLoadTests(baseUrl: string): Promise<void> {
  const config: LoadTestConfig = {
    baseUrl,
    concurrency: 10,
    duration: 300, // 5 minutes
    rampUp: 30, // 30 seconds
    rampDown: 30, // 30 seconds
    thinkTime: 100 // 100ms
  };

  const loadTester = new LoadTester(config);
  
  try {
    const results = await loadTester.runComprehensiveLoadTest();
    
    console.log('\n=== Load Test Results ===');
    console.log('Publications API:', results.publications);
    console.log('Research Integration API:', results.research);
    console.log('Analytics API:', results.analytics);
    console.log('Bulk Import API:', results.bulkImport);
    console.log('Overall:', results.overall);
    
    // Check for performance issues
    if (results.overall.averageResponseTime > 2000) {
      console.warn('⚠️  Average response time is high:', results.overall.averageResponseTime + 'ms');
    }
    
    if (results.overall.errorRate > 5) {
      console.warn('⚠️  Error rate is high:', results.overall.errorRate + '%');
    }
    
    if (results.overall.requestsPerSecond < 10) {
      console.warn('⚠️  Throughput is low:', results.overall.requestsPerSecond + ' rps');
    }
    
  } catch (error) {
    console.error('Load test failed:', error);
  }
}
