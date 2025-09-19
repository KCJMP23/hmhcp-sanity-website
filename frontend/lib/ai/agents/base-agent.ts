/**
 * Base Agent Interface
 * Abstract base class for all healthcare AI agents
 */

import { EventEmitter } from 'events';
import type {
  AgentConfiguration,
  WorkflowTask,
  TaskResult,
  TaskError,
  SecurityContext,
  ComplianceReport,
  ExecutionMetrics
} from '../../../types/ai/orchestrator';
import HealthcareAILogger from '../logger';

export interface BaseAgentOptions {
  config: AgentConfiguration;
  logger: HealthcareAILogger;
  redis?: any; // Redis instance for caching
  complianceValidator?: any; // Compliance validator instance
}

export abstract class BaseAgent extends EventEmitter {
  protected readonly config: AgentConfiguration;
  protected readonly logger: HealthcareAILogger;
  protected readonly redis?: any;
  protected readonly complianceValidator?: any;
  protected isInitialized = false;
  protected currentTask?: WorkflowTask;
  protected metrics: ExecutionMetrics = {
    tasksCompleted: 0,
    tasksFailed: 0,
    averageExecutionTime: 0,
    lastExecutionTime: 0,
    totalExecutionTime: 0,
    errorRate: 0,
    complianceViolations: 0,
    lastComplianceCheck: new Date(),
    performanceScore: 0
  };

  constructor(options: BaseAgentOptions) {
    super();
    this.config = options.config;
    this.logger = options.logger;
    this.redis = options.redis;
    this.complianceValidator = options.complianceValidator;
  }

  /**
   * Initialize the agent
   */
  abstract initialize(): Promise<void>;

  /**
   * Execute a workflow task
   */
  abstract executeTask(task: WorkflowTask, context: SecurityContext): Promise<TaskResult>;

  /**
   * Validate task input
   */
  abstract validateInput(input: any): boolean;

  /**
   * Get agent capabilities
   */
  getCapabilities() {
    return this.config.capabilities;
  }

  /**
   * Get agent configuration
   */
  getConfiguration() {
    return this.config;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return this.metrics;
  }

  /**
   * Check if agent is available for new tasks
   */
  isAvailable(): boolean {
    return this.isInitialized && !this.currentTask;
  }

  /**
   * Update metrics after task completion
   */
  protected updateMetrics(executionTime: number, success: boolean, complianceViolations = 0) {
    this.metrics.tasksCompleted += success ? 1 : 0;
    this.metrics.tasksFailed += success ? 0 : 1;
    this.metrics.lastExecutionTime = executionTime;
    this.metrics.totalExecutionTime += executionTime;
    this.metrics.averageExecutionTime = this.metrics.totalExecutionTime / this.metrics.tasksCompleted;
    this.metrics.errorRate = this.metrics.tasksFailed / (this.metrics.tasksCompleted + this.metrics.tasksFailed);
    this.metrics.complianceViolations += complianceViolations;
    this.metrics.lastComplianceCheck = new Date();
    this.metrics.performanceScore = this.calculatePerformanceScore();
  }

  /**
   * Calculate performance score based on metrics
   */
  private calculatePerformanceScore(): number {
    const errorPenalty = this.metrics.errorRate * 50;
    const compliancePenalty = this.metrics.complianceViolations * 10;
    const timePenalty = Math.min(this.metrics.averageExecutionTime / 1000, 10); // Max 10 point penalty for slow execution
    
    return Math.max(0, 100 - errorPenalty - compliancePenalty - timePenalty);
  }

  /**
   * Log agent activity
   */
  protected logActivity(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    this.logger.log(level, `[${this.config.name}] ${message}`, {
      agentId: this.config.id,
      taskId: this.currentTask?.id,
      ...data
    });
  }

  /**
   * Validate compliance before task execution
   */
  protected async validateCompliance(input: any, context: SecurityContext): Promise<ComplianceReport> {
    if (!this.complianceValidator) {
      return {
        isCompliant: true,
        violations: [],
        recommendations: [],
        lastChecked: new Date(),
        complianceScore: 100
      };
    }

    return await this.complianceValidator.validate(input, context);
  }

  /**
   * Handle task errors
   */
  protected handleError(error: Error, task: WorkflowTask): TaskError {
    this.logActivity('error', `Task execution failed: ${error.message}`, { error: error.stack });
    
    return {
      code: 'AGENT_EXECUTION_ERROR',
      message: error.message,
      details: {
        agentId: this.config.id,
        taskId: task.id,
        timestamp: new Date().toISOString(),
        stack: error.stack
      },
      retryable: this.isRetryableError(error),
      timestamp: new Date()
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = this.config.retryPolicy?.retryableErrors || [
      'timeout',
      'network',
      'rate limit',
      'temporary',
      'service unavailable'
    ];
    return retryableErrors.some(errorType => 
      error.message.toLowerCase().includes(errorType.toLowerCase())
    );
  }
}
