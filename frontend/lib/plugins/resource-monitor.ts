// Plugin Resource Monitor
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { EventEmitter } from 'events';
import { PluginInstallation, ResourceLimits } from '@/types/plugins/marketplace';
import { ExecutionResponse } from '@/types/plugins/execution';

export class ResourceMonitor extends EventEmitter {
  private resourceUsage: Map<string, ResourceUsage> = new Map();
  private alertThresholds: AlertThresholds;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertCooldown: Map<string, number> = new Map();
  private cooldownPeriod: number = 300000; // 5 minutes

  constructor() {
    super();
    this.alertThresholds = {
      memory: 0.8, // 80% of limit
      cpu: 0.8, // 80% of limit
      executionTime: 0.9, // 90% of limit
      errorRate: 0.1, // 10% error rate
      consecutiveErrors: 3
    };
    this.startMonitoring();
  }

  /**
   * Start monitoring plugin resources
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.checkResourceUsage();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Monitor plugin execution
   */
  monitorExecution(installationId: string, installation: PluginInstallation, execution: ExecutionResponse): void {
    const usage = this.getOrCreateResourceUsage(installationId, installation);
    
    // Update execution metrics
    usage.executionCount++;
    usage.totalExecutionTime += execution.execution_time_ms;
    usage.averageExecutionTime = usage.totalExecutionTime / usage.executionCount;
    
    if (execution.status === 'success') {
      usage.successfulExecutions++;
    } else {
      usage.failedExecutions++;
      usage.consecutiveErrors++;
    }

    // Update resource usage
    usage.currentMemoryUsage = execution.memory_usage_mb;
    usage.peakMemoryUsage = Math.max(usage.peakMemoryUsage, execution.memory_usage_mb);
    
    // Calculate error rate
    usage.errorRate = usage.failedExecutions / usage.executionCount;

    // Check for alerts
    this.checkExecutionAlerts(installationId, installation, usage, execution);
    
    // Store updated usage
    this.resourceUsage.set(installationId, usage);
  }

  /**
   * Check resource usage and generate alerts
   */
  private checkResourceUsage(): void {
    for (const [installationId, usage] of this.resourceUsage) {
      const installation = usage.installation;
      
      // Check memory usage
      if (usage.currentMemoryUsage > installation.resource_limits.memory * this.alertThresholds.memory) {
        this.triggerAlert(installationId, 'memory', {
          current: usage.currentMemoryUsage,
          limit: installation.resource_limits.memory,
          threshold: this.alertThresholds.memory
        });
      }

      // Check execution time
      if (usage.averageExecutionTime > installation.resource_limits.executionTime * 1000 * this.alertThresholds.executionTime) {
        this.triggerAlert(installationId, 'execution_time', {
          current: usage.averageExecutionTime,
          limit: installation.resource_limits.executionTime * 1000,
          threshold: this.alertThresholds.executionTime
        });
      }

      // Check error rate
      if (usage.errorRate > this.alertThresholds.errorRate) {
        this.triggerAlert(installationId, 'error_rate', {
          current: usage.errorRate,
          threshold: this.alertThresholds.errorRate
        });
      }

      // Check consecutive errors
      if (usage.consecutiveErrors >= this.alertThresholds.consecutiveErrors) {
        this.triggerAlert(installationId, 'consecutive_errors', {
          current: usage.consecutiveErrors,
          threshold: this.alertThresholds.consecutiveErrors
        });
      }
    }
  }

  /**
   * Check execution-specific alerts
   */
  private checkExecutionAlerts(
    installationId: string, 
    installation: PluginInstallation, 
    usage: ResourceUsage, 
    execution: ExecutionResponse
  ): void {
    // Check if execution exceeded limits
    if (execution.memory_usage_mb > installation.resource_limits.memory) {
      this.triggerAlert(installationId, 'memory_exceeded', {
        current: execution.memory_usage_mb,
        limit: installation.resource_limits.memory
      });
    }

    if (execution.execution_time_ms > installation.resource_limits.executionTime * 1000) {
      this.triggerAlert(installationId, 'execution_time_exceeded', {
        current: execution.execution_time_ms,
        limit: installation.resource_limits.executionTime * 1000
      });
    }

    // Check for healthcare data access without proper compliance
    if (execution.healthcare_data_accessed && !execution.compliance_validation?.overall?.passed) {
      this.triggerAlert(installationId, 'compliance_violation', {
        type: 'healthcare_data_access',
        compliance: execution.compliance_validation
      });
    }
  }

  /**
   * Trigger resource alert
   */
  private triggerAlert(installationId: string, type: string, data: any): void {
    const alertKey = `${installationId}-${type}`;
    const now = Date.now();
    const lastAlert = this.alertCooldown.get(alertKey) || 0;

    // Check cooldown period
    if (now - lastAlert < this.cooldownPeriod) {
      return;
    }

    // Update cooldown
    this.alertCooldown.set(alertKey, now);

    const alert = {
      id: `alert-${Date.now()}`,
      installationId,
      type,
      severity: this.getAlertSeverity(type, data),
      message: this.getAlertMessage(type, data),
      data,
      timestamp: new Date().toISOString()
    };

    this.emit('resourceAlert', alert);
    console.warn(`Resource alert for plugin ${installationId}:`, alert);
  }

  /**
   * Get alert severity
   */
  private getAlertSeverity(type: string, data: any): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'memory_exceeded':
      case 'execution_time_exceeded':
      case 'compliance_violation':
        return 'critical';
      case 'consecutive_errors':
        return 'high';
      case 'memory':
      case 'execution_time':
        return 'medium';
      case 'error_rate':
        return data.current > 0.5 ? 'high' : 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Get alert message
   */
  private getAlertMessage(type: string, data: any): string {
    switch (type) {
      case 'memory_exceeded':
        return `Plugin memory usage exceeded limit: ${data.current}MB > ${data.limit}MB`;
      case 'execution_time_exceeded':
        return `Plugin execution time exceeded limit: ${data.current}ms > ${data.limit}ms`;
      case 'memory':
        return `Plugin memory usage is high: ${data.current}MB (${Math.round(data.current / data.limit * 100)}% of limit)`;
      case 'execution_time':
        return `Plugin execution time is high: ${data.current}ms (${Math.round(data.current / data.limit * 100)}% of limit)`;
      case 'error_rate':
        return `Plugin error rate is high: ${Math.round(data.current * 100)}%`;
      case 'consecutive_errors':
        return `Plugin has ${data.current} consecutive errors`;
      case 'compliance_violation':
        return `Plugin accessed healthcare data without proper compliance validation`;
      default:
        return `Resource alert: ${type}`;
    }
  }

  /**
   * Get or create resource usage record
   */
  private getOrCreateResourceUsage(installationId: string, installation: PluginInstallation): ResourceUsage {
    if (!this.resourceUsage.has(installationId)) {
      this.resourceUsage.set(installationId, {
        installationId,
        installation,
        startTime: Date.now(),
        executionCount: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        consecutiveErrors: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        currentMemoryUsage: 0,
        peakMemoryUsage: 0,
        errorRate: 0,
        lastExecution: null
      });
    }
    return this.resourceUsage.get(installationId)!;
  }

  /**
   * Get resource usage for installation
   */
  getResourceUsage(installationId: string): ResourceUsage | undefined {
    return this.resourceUsage.get(installationId);
  }

  /**
   * Get all resource usage
   */
  getAllResourceUsage(): ResourceUsage[] {
    return Array.from(this.resourceUsage.values());
  }

  /**
   * Get resource statistics
   */
  getResourceStatistics(): ResourceStatistics {
    const allUsage = this.getAllResourceUsage();
    
    if (allUsage.length === 0) {
      return {
        totalInstallations: 0,
        totalExecutions: 0,
        averageExecutionTime: 0,
        totalMemoryUsage: 0,
        averageErrorRate: 0,
        activeInstallations: 0
      };
    }

    const totalExecutions = allUsage.reduce((sum, usage) => sum + usage.executionCount, 0);
    const totalExecutionTime = allUsage.reduce((sum, usage) => sum + usage.totalExecutionTime, 0);
    const totalMemoryUsage = allUsage.reduce((sum, usage) => sum + usage.currentMemoryUsage, 0);
    const totalErrorRate = allUsage.reduce((sum, usage) => sum + usage.errorRate, 0);
    const activeInstallations = allUsage.filter(usage => usage.executionCount > 0).length;

    return {
      totalInstallations: allUsage.length,
      totalExecutions,
      averageExecutionTime: totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0,
      totalMemoryUsage,
      averageErrorRate: allUsage.length > 0 ? totalErrorRate / allUsage.length : 0,
      activeInstallations
    };
  }

  /**
   * Reset resource usage for installation
   */
  resetResourceUsage(installationId: string): void {
    this.resourceUsage.delete(installationId);
    this.alertCooldown.delete(installationId);
  }

  /**
   * Cleanup monitoring
   */
  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.resourceUsage.clear();
    this.alertCooldown.clear();
  }
}

interface ResourceUsage {
  installationId: string;
  installation: PluginInstallation;
  startTime: number;
  executionCount: number;
  successfulExecutions: number;
  failedExecutions: number;
  consecutiveErrors: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  currentMemoryUsage: number;
  peakMemoryUsage: number;
  errorRate: number;
  lastExecution: Date | null;
}

interface AlertThresholds {
  memory: number;
  cpu: number;
  executionTime: number;
  errorRate: number;
  consecutiveErrors: number;
}

interface ResourceStatistics {
  totalInstallations: number;
  totalExecutions: number;
  averageExecutionTime: number;
  totalMemoryUsage: number;
  averageErrorRate: number;
  activeInstallations: number;
}
