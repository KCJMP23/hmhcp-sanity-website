// Real-Time Monitoring Utilities
// Story 4.5: Real-Time Analytics & Monitoring

import { ConnectionState, WebSocketMessage, AlertThresholds, AlertSeverity } from '@/types/monitoring';

export class RealTimeMonitoringService {
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private retryCount = 0;
  private maxRetries = 5;
  private retryDelay = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];

  constructor(
    private organizationId: string,
    private onMessage: (message: WebSocketMessage) => void,
    private onConnectionChange: (state: ConnectionState) => void,
    private onError: (error: Error) => void
  ) {}

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionState = ConnectionState.CONNECTING;
    this.onConnectionChange(this.connectionState);

    try {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/api/admin/monitoring/stream?organizationId=${this.organizationId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connectionState = ConnectionState.CONNECTED;
        this.retryCount = 0;
        this.retryDelay = 1000;
        this.onConnectionChange(this.connectionState);
        this.startHeartbeat();
        this.processMessageQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.onMessage(message);
        } catch (error) {
          this.onError(new Error('Failed to parse WebSocket message'));
        }
      };

      this.ws.onclose = () => {
        this.connectionState = ConnectionState.DISCONNECTED;
        this.onConnectionChange(this.connectionState);
        this.stopHeartbeat();
        this.handleReconnection();
      };

      this.ws.onerror = (error) => {
        this.connectionState = ConnectionState.ERROR;
        this.onConnectionChange(this.connectionState);
        this.onError(new Error('WebSocket connection error'));
      };
    } catch (error) {
      this.connectionState = ConnectionState.ERROR;
      this.onConnectionChange(this.connectionState);
      this.onError(error as Error);
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionState = ConnectionState.DISCONNECTED;
    this.onConnectionChange(this.connectionState);
  }

  sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'heartbeat',
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
          organization_id: this.organizationId
        });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleReconnection(): void {
    if (this.retryCount < this.maxRetries) {
      this.connectionState = ConnectionState.RECONNECTING;
      this.onConnectionChange(this.connectionState);

      // Exponential backoff with jitter to prevent thundering herd
      const jitter = Math.random() * 1000; // Add up to 1 second of jitter
      const delay = Math.min(this.retryDelay * Math.pow(2, this.retryCount) + jitter, 30000);
      
      setTimeout(() => {
        this.retryCount++;
        this.connect();
      }, delay);
    } else {
      this.connectionState = ConnectionState.ERROR;
      this.onConnectionChange(this.connectionState);
      this.onError(new Error('Max reconnection attempts reached'));
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }
}

// Alert Threshold Management
export class AlertThresholdManager {
  private thresholds: AlertThresholds;

  constructor(thresholds: AlertThresholds) {
    this.thresholds = thresholds;
  }

  checkThreshold(metricType: string, value: number): { severity: AlertSeverity; message: string } | null {
    switch (metricType) {
      case 'response_time':
        if (value >= this.thresholds.responseTime.critical) {
          return {
            severity: AlertSeverity.CRITICAL,
            message: `Response time ${value}ms exceeds critical threshold of ${this.thresholds.responseTime.critical}ms`
          };
        } else if (value >= this.thresholds.responseTime.warning) {
          return {
            severity: AlertSeverity.MEDIUM,
            message: `Response time ${value}ms exceeds warning threshold of ${this.thresholds.responseTime.warning}ms`
          };
        }
        break;

      case 'error_rate':
        if (value >= this.thresholds.errorRate.critical) {
          return {
            severity: AlertSeverity.CRITICAL,
            message: `Error rate ${value}% exceeds critical threshold of ${this.thresholds.errorRate.critical}%`
          };
        } else if (value >= this.thresholds.errorRate.warning) {
          return {
            severity: AlertSeverity.MEDIUM,
            message: `Error rate ${value}% exceeds warning threshold of ${this.thresholds.errorRate.warning}%`
          };
        }
        break;

      case 'cpu_usage':
        if (value >= this.thresholds.cpuUsage.critical) {
          return {
            severity: AlertSeverity.CRITICAL,
            message: `CPU usage ${value}% exceeds critical threshold of ${this.thresholds.cpuUsage.critical}%`
          };
        } else if (value >= this.thresholds.cpuUsage.warning) {
          return {
            severity: AlertSeverity.MEDIUM,
            message: `CPU usage ${value}% exceeds warning threshold of ${this.thresholds.cpuUsage.warning}%`
          };
        }
        break;

      case 'memory_usage':
        if (value >= this.thresholds.memoryUsage.critical) {
          return {
            severity: AlertSeverity.CRITICAL,
            message: `Memory usage ${value}% exceeds critical threshold of ${this.thresholds.memoryUsage.critical}%`
          };
        } else if (value >= this.thresholds.memoryUsage.warning) {
          return {
            severity: AlertSeverity.MEDIUM,
            message: `Memory usage ${value}% exceeds warning threshold of ${this.thresholds.memoryUsage.warning}%`
          };
        }
        break;

      case 'database_connections':
        if (value >= this.thresholds.databaseConnections.critical) {
          return {
            severity: AlertSeverity.CRITICAL,
            message: `Database connections ${value}% exceeds critical threshold of ${this.thresholds.databaseConnections.critical}%`
          };
        } else if (value >= this.thresholds.databaseConnections.warning) {
          return {
            severity: AlertSeverity.MEDIUM,
            message: `Database connections ${value}% exceeds warning threshold of ${this.thresholds.databaseConnections.warning}%`
          };
        }
        break;
    }

    return null;
  }

  updateThresholds(newThresholds: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  getThresholds(): AlertThresholds {
    return { ...this.thresholds };
  }
}

// Data Compression for Real-Time Streaming
export class DataCompressor {
  static compress(data: any): string {
    // Simple compression for demo - in production, use a proper compression library
    return JSON.stringify(data);
  }

  static decompress(compressedData: string): any {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      throw new Error('Failed to decompress data');
    }
  }
}

// Performance Monitoring Utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static recordMetric(metricName: string, value: number): void {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    
    const values = this.metrics.get(metricName)!;
    values.push(value);
    
    // Keep only last 100 values to prevent memory leaks
    if (values.length > 100) {
      values.shift();
    }
  }

  static getAverage(metricName: string): number {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  static getMax(metricName: string): number {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) return 0;
    
    return Math.max(...values);
  }

  static getMin(metricName: string): number {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) return 0;
    
    return Math.min(...values);
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

// Circuit Breaker for API Resilience
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000, // 1 minute
    private successThreshold = 3
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}

// Healthcare Compliance Utilities
export class HealthcareComplianceMonitor {
  static validateDataAnonymization(data: any): boolean {
    // Check for potential PHI (Protected Health Information) patterns
    const phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /\b\d{3}\.\d{2}\.\d{4}\b/, // SSN with dots
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone pattern
    ];

    const dataString = JSON.stringify(data);
    return !phiPatterns.some(pattern => pattern.test(dataString));
  }

  static sanitizeForLogging(data: any): any {
    // Remove or mask sensitive information for logging
    const sanitized = { ...data };
    
    // Remove common sensitive fields
    const sensitiveFields = ['ssn', 'email', 'phone', 'address', 'patient_id'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  static checkHIPAACompliance(accessData: {
    userType: string;
    dataType: string;
    accessReason: string;
  }): boolean {
    // Basic HIPAA compliance checks
    const { userType, dataType, accessReason } = accessData;
    
    // Healthcare professionals can access most data
    if (userType === 'healthcare_professional') {
      return true;
    }
    
    // Admins can access system data but not patient data
    if (userType === 'admin' && dataType !== 'patient_data') {
      return true;
    }
    
    // Patients can only access their own data
    if (userType === 'patient' && dataType === 'own_data') {
      return true;
    }
    
    return false;
  }
}
