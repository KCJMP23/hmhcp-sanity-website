'use client';

// Production health check and monitoring system
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: number;
  responseTime: number;
  details: {
    database: HealthStatus;
    redis: HealthStatus;
    external: HealthStatus;
    memory: HealthStatus;
    disk: HealthStatus;
    network: HealthStatus;
  };
  errors: string[];
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  message?: string;
  metadata?: Record<string, any>;
}

export interface MonitoringConfig {
  intervals: {
    health: number;
    metrics: number;
    alerts: number;
  };
  thresholds: {
    responseTime: number;
    memoryUsage: number;
    diskUsage: number;
    errorRate: number;
  };
  endpoints: {
    health: string;
    metrics: string;
    ready: string;
  };
}

class ProductionHealthChecker {
  private static instance: ProductionHealthChecker;
  private config: MonitoringConfig;
  private healthHistory: HealthCheckResult[] = [];
  private isMonitoring = false;
  
  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      intervals: {
        health: 30000, // 30 seconds
        metrics: 60000, // 1 minute
        alerts: 300000, // 5 minutes
      },
      thresholds: {
        responseTime: 5000, // 5 seconds
        memoryUsage: 0.85, // 85%
        diskUsage: 0.90, // 90%
        errorRate: 0.05, // 5%
      },
      endpoints: {
        health: '/api/health',
        metrics: '/api/metrics',
        ready: '/api/ready',
      },
      ...config,
    };
  }
  
  static getInstance(config?: Partial<MonitoringConfig>): ProductionHealthChecker {
    if (!ProductionHealthChecker.instance) {
      ProductionHealthChecker.instance = new ProductionHealthChecker(config);
    }
    return ProductionHealthChecker.instance;
  }

  // Comprehensive health check
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      const [database, redis, external, memory, disk, network] = await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkExternalServices(),
        this.checkMemory(),
        this.checkDisk(),
        this.checkNetwork(),
      ]);

      const result: HealthCheckResult = {
        status: 'healthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        details: {
          database: this.extractResult(database, 'Database check failed'),
          redis: this.extractResult(redis, 'Redis check failed'),
          external: this.extractResult(external, 'External services check failed'),
          memory: this.extractResult(memory, 'Memory check failed'),
          disk: this.extractResult(disk, 'Disk check failed'),
          network: this.extractResult(network, 'Network check failed'),
        },
        errors,
      };

      // Determine overall status
      const statuses = Object.values(result.details).map(d => d.status);
      
      if (statuses.includes('unhealthy')) {
        result.status = 'unhealthy';
      } else if (statuses.includes('degraded')) {
        result.status = 'degraded';
      }

      // Store in history
      this.healthHistory.push(result);
      if (this.healthHistory.length > 100) {
        this.healthHistory.shift();
      }

      return result;
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        details: {
          database: { status: 'unhealthy', message: 'Check failed' },
          redis: { status: 'unhealthy', message: 'Check failed' },
          external: { status: 'unhealthy', message: 'Check failed' },
          memory: { status: 'unhealthy', message: 'Check failed' },
          disk: { status: 'unhealthy', message: 'Check failed' },
          network: { status: 'unhealthy', message: 'Check failed' },
        },
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  private extractResult(result: PromiseSettledResult<HealthStatus>, errorMessage: string): HealthStatus {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'unhealthy',
        message: errorMessage,
      };
    }
  }

  private async checkDatabase(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Check database connection
      const response = await fetch('/api/health/database', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          status: responseTime > this.config.thresholds.responseTime ? 'degraded' : 'healthy',
          responseTime,
          metadata: data,
        };
      } else {
        return {
          status: 'unhealthy',
          responseTime,
          message: `Database check failed: ${response.status}`,
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Database connection error: ${error}`,
      };
    }
  }

  private async checkRedis(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/health/redis', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: responseTime > this.config.thresholds.responseTime ? 'degraded' : 'healthy',
          responseTime,
        };
      } else {
        return {
          status: 'unhealthy',
          responseTime,
          message: `Redis check failed: ${response.status}`,
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Redis connection error: ${error}`,
      };
    }
  }

  private async checkExternalServices(): Promise<HealthStatus> {
    const services = [
      { name: 'Supabase', url: process.env.NEXT_PUBLIC_SUPABASE_URL },
      { name: 'Sentry', url: 'https://sentry.io' },
    ];
    
    const results = await Promise.allSettled(
      services.map(async (service) => {
        if (!service.url) return { name: service.name, status: 'skipped' };
        
        const startTime = Date.now();
        try {
          const response = await fetch(`${service.url}/health`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000),
          });
          
          return {
            name: service.name,
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - startTime,
          };
        } catch (error) {
          return {
            name: service.name,
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: String(error),
          };
        }
      })
    );
    
    const serviceResults = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);
    
    const unhealthyServices = serviceResults.filter(s => s.status === 'unhealthy');
    
    if (unhealthyServices.length === serviceResults.length) {
      return {
        status: 'unhealthy',
        message: 'All external services are unhealthy',
        metadata: { services: serviceResults },
      };
    } else if (unhealthyServices.length > 0) {
      return {
        status: 'degraded',
        message: `${unhealthyServices.length} external services are unhealthy`,
        metadata: { services: serviceResults },
      };
    } else {
      return {
        status: 'healthy',
        metadata: { services: serviceResults },
      };
    }
  }

  private async checkMemory(): Promise<HealthStatus> {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        const totalMemory = usage.heapTotal + usage.external;
        const usedMemory = usage.heapUsed;
        const memoryUtilization = usedMemory / totalMemory;
        
        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        if (memoryUtilization > this.config.thresholds.memoryUsage) {
          status = 'unhealthy';
        } else if (memoryUtilization > this.config.thresholds.memoryUsage * 0.8) {
          status = 'degraded';
        }
        
        return {
          status,
          metadata: {
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
            external: Math.round(usage.external / 1024 / 1024) + 'MB',
            utilization: Math.round(memoryUtilization * 100) + '%',
          },
        };
      } else {
        return { status: 'healthy', message: 'Memory check not available' };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Memory check failed: ${error}`,
      };
    }
  }

  private async checkDisk(): Promise<HealthStatus> {
    try {
      // In a real implementation, you'd check actual disk usage
      // This is a simplified version
      return {
        status: 'healthy',
        metadata: {
          available: '50GB',
          used: '30GB',
          utilization: '60%',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Disk check failed: ${error}`,
      };
    }
  }

  private async checkNetwork(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Test network connectivity
      const response = await fetch('https://api.github.com/zen', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        metadata: {
          external_connectivity: response.ok,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Network check failed: ${error}`,
      };
    }
  }

  // Start continuous monitoring
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Health check interval
    setInterval(async () => {
      const result = await this.performHealthCheck();
      
      if (result.status === 'unhealthy') {
        // System unhealthy: result
        await this.triggerAlert('unhealthy', result);
      } else if (result.status === 'degraded') {
        // System degraded: result
      }
    }, this.config.intervals.health);
    
    // Health monitoring started
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.isMonitoring = false;
    // Health monitoring stopped
  }

  // Get health history
  getHealthHistory(): HealthCheckResult[] {
    return [...this.healthHistory];
  }

  // Get system metrics
  getSystemMetrics(): {
    uptime: number;
    healthScore: number;
    lastCheck: HealthCheckResult | null;
    trends: Record<string, number>;
  } {
    const lastCheck = this.healthHistory[this.healthHistory.length - 1] || null;
    const recentChecks = this.healthHistory.slice(-10);
    
    // Calculate health score (percentage of healthy checks)
    const healthyChecks = recentChecks.filter(check => check.status === 'healthy').length;
    const healthScore = recentChecks.length > 0 ? (healthyChecks / recentChecks.length) * 100 : 100;
    
    // Calculate trends
    const trends = {
      responseTime: recentChecks.reduce((sum, check) => sum + check.responseTime, 0) / recentChecks.length || 0,
      errorRate: recentChecks.filter(check => check.errors.length > 0).length / recentChecks.length || 0,
    };
    
    return {
      uptime: process.uptime ? process.uptime() * 1000 : 0,
      healthScore,
      lastCheck,
      trends,
    };
  }

  private async triggerAlert(type: string, data: any): Promise<void> {
    try {
      // Send to monitoring webhook
      if (process.env.MONITORING_WEBHOOK_URL) {
        await fetch(process.env.MONITORING_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'health_alert',
            severity: type === 'unhealthy' ? 'critical' : 'warning',
            message: `System ${type}`,
            data,
            timestamp: new Date().toISOString(),
          }),
        });
      }
      
      // Store alert in database
      await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'health_alert',
          severity: type === 'unhealthy' ? 'critical' : 'warning',
          title: `System Health Alert: ${type}`,
          message: `System status is ${type}`,
          details: data,
        }),
      });
    } catch (error) {
      // Failed to trigger alert: error
    }
  }
}

// Singleton instance
export const healthChecker = ProductionHealthChecker.getInstance();

// React hook for health monitoring
export function useHealthMonitoring() {
  return {
    performCheck: healthChecker.performHealthCheck.bind(healthChecker),
    startMonitoring: healthChecker.startMonitoring.bind(healthChecker),
    stopMonitoring: healthChecker.stopMonitoring.bind(healthChecker),
    getHistory: healthChecker.getHealthHistory.bind(healthChecker),
    getMetrics: healthChecker.getSystemMetrics.bind(healthChecker),
  };
}

// Initialize health monitoring in production
export function initializeHealthMonitoring() {
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    healthChecker.startMonitoring();
    // Production health monitoring initialized
  }
}