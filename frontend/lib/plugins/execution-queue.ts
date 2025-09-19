// Plugin Execution Queue System
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { EventEmitter } from 'events';
import { PluginInstallation } from '@/types/plugins/marketplace';
import { ExecutionRequest, ExecutionResponse, ExecutionQueue } from '@/types/plugins/execution';

export class PluginExecutionQueue extends EventEmitter {
  private queue: ExecutionQueue[] = [];
  private processing: Set<string> = new Set();
  private maxConcurrent: number = 5;
  private maxQueueSize: number = 1000;
  private processingInterval: NodeJS.Timeout | null = null;
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries: number = 3;

  constructor() {
    super();
    this.startProcessing();
  }

  /**
   * Add execution request to queue
   */
  async enqueue(installationId: string, request: ExecutionRequest): Promise<string> {
    const queueId = `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check queue size limit
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Execution queue is full');
    }

    const queueItem: ExecutionQueue = {
      id: queueId,
      installation_id: installationId,
      request,
      priority: this.calculatePriority(request),
      scheduled_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      status: 'queued',
      attempts: 0,
      max_attempts: this.maxRetries,
      next_retry_at: null,
      error_message: null
    };

    // Insert item in priority order
    this.insertInPriorityOrder(queueItem);
    
    this.emit('executionQueued', { queueId, installationId, priority: queueItem.priority });
    
    return queueId;
  }

  /**
   * Start processing queue
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 1000); // Process every second
  }

  /**
   * Process execution queue
   */
  private async processQueue(): Promise<void> {
    // Check if we can process more items
    if (this.processing.size >= this.maxConcurrent) {
      return;
    }

    // Get next item to process
    const nextItem = this.getNextItemToProcess();
    if (!nextItem) {
      return;
    }

    // Mark as processing
    nextItem.status = 'processing';
    this.processing.add(nextItem.id);

    try {
      // Execute plugin
      const result = await this.executePlugin(nextItem);
      
      // Mark as completed
      nextItem.status = 'completed';
      this.emit('executionCompleted', { queueId: nextItem.id, result });
      
    } catch (error) {
      // Handle execution error
      await this.handleExecutionError(nextItem, error);
    } finally {
      // Remove from processing set
      this.processing.delete(nextItem.id);
    }
  }

  /**
   * Get next item to process
   */
  private getNextItemToProcess(): ExecutionQueue | null {
    // Find highest priority item that's not processing
    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      if (item.status === 'queued' || item.status === 'failed') {
        // Check if it's time to retry
        if (item.status === 'failed' && item.next_retry_at) {
          const retryTime = new Date(item.next_retry_at).getTime();
          if (Date.now() < retryTime) {
            continue;
          }
        }
        return item;
      }
    }
    return null;
  }

  /**
   * Execute plugin
   */
  private async executePlugin(queueItem: ExecutionQueue): Promise<ExecutionResponse> {
    // This would integrate with the actual plugin execution system
    // For now, we'll simulate the execution
    
    const startTime = Date.now();
    
    try {
      // Simulate plugin execution
      await this.simulateExecution(queueItem);
      
      const executionTime = Date.now() - startTime;
      
      return {
        execution_id: `exec-${Date.now()}`,
        status: 'success',
        output_data: { result: 'success' },
        execution_time_ms: executionTime,
        memory_usage_mb: Math.random() * 50 + 10, // Random memory usage
        healthcare_data_accessed: false,
        compliance_validation: null,
        retry_count: queueItem.attempts,
        logs: [],
        metrics: {}
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Simulate plugin execution
   */
  private async simulateExecution(queueItem: ExecutionQueue): Promise<void> {
    // Simulate execution time based on priority
    const baseTime = queueItem.priority === 'critical' ? 100 : 
                    queueItem.priority === 'high' ? 200 : 
                    queueItem.priority === 'normal' ? 500 : 1000;
    
    const executionTime = baseTime + Math.random() * baseTime;
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('Simulated execution failure');
    }
  }

  /**
   * Handle execution error
   */
  private async handleExecutionError(queueItem: ExecutionQueue, error: Error): Promise<void> {
    queueItem.attempts++;
    queueItem.error_message = error.message;
    
    if (queueItem.attempts >= queueItem.max_attempts) {
      // Max retries exceeded
      queueItem.status = 'failed';
      this.emit('executionFailed', { 
        queueId: queueItem.id, 
        error: error.message,
        attempts: queueItem.attempts
      });
    } else {
      // Schedule retry
      queueItem.status = 'failed';
      queueItem.next_retry_at = this.calculateRetryTime(queueItem.attempts);
      this.emit('executionRetry', { 
        queueId: queueItem.id, 
        attempts: queueItem.attempts,
        nextRetryAt: queueItem.next_retry_at
      });
    }
  }

  /**
   * Calculate execution priority
   */
  private calculatePriority(request: ExecutionRequest): number {
    const priorityMap = {
      'critical': 1,
      'high': 2,
      'normal': 3,
      'low': 4
    };
    
    return priorityMap[request.priority || 'normal'];
  }

  /**
   * Insert item in priority order
   */
  private insertInPriorityOrder(item: ExecutionQueue): void {
    let insertIndex = this.queue.length;
    
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority > item.priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, item);
  }

  /**
   * Calculate retry time with exponential backoff
   */
  private calculateRetryTime(attempts: number): string {
    const baseDelay = 1000; // 1 second
    const maxDelay = 300000; // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, attempts - 1), maxDelay);
    
    return new Date(Date.now() + delay).toISOString();
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    total: number;
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    processingItems: string[];
  } {
    const queued = this.queue.filter(item => item.status === 'queued').length;
    const processing = this.queue.filter(item => item.status === 'processing').length;
    const completed = this.queue.filter(item => item.status === 'completed').length;
    const failed = this.queue.filter(item => item.status === 'failed').length;
    
    return {
      total: this.queue.length,
      queued,
      processing,
      completed,
      failed,
      processingItems: Array.from(this.processing)
    };
  }

  /**
   * Get queue item by ID
   */
  getQueueItem(queueId: string): ExecutionQueue | undefined {
    return this.queue.find(item => item.id === queueId);
  }

  /**
   * Cancel queue item
   */
  cancelQueueItem(queueId: string): boolean {
    const item = this.getQueueItem(queueId);
    if (!item) {
      return false;
    }
    
    if (item.status === 'processing') {
      return false; // Cannot cancel processing item
    }
    
    item.status = 'cancelled';
    this.emit('executionCancelled', { queueId });
    
    return true;
  }

  /**
   * Clear completed items
   */
  clearCompletedItems(): number {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => item.status !== 'completed');
    return initialLength - this.queue.length;
  }

  /**
   * Get queue statistics
   */
  getQueueStatistics(): {
    averageWaitTime: number;
    averageExecutionTime: number;
    successRate: number;
    failureRate: number;
    throughput: number;
  } {
    const now = Date.now();
    const completedItems = this.queue.filter(item => item.status === 'completed');
    const failedItems = this.queue.filter(item => item.status === 'failed');
    
    // Calculate average wait time
    const totalWaitTime = this.queue.reduce((sum, item) => {
      const waitTime = now - new Date(item.created_at).getTime();
      return sum + Math.max(0, waitTime);
    }, 0);
    const averageWaitTime = this.queue.length > 0 ? totalWaitTime / this.queue.length : 0;
    
    // Calculate success rate
    const totalExecutions = completedItems.length + failedItems.length;
    const successRate = totalExecutions > 0 ? completedItems.length / totalExecutions : 0;
    const failureRate = 1 - successRate;
    
    // Calculate throughput (executions per minute)
    const oneMinuteAgo = now - 60000;
    const recentExecutions = this.queue.filter(item => {
      const createdAt = new Date(item.created_at).getTime();
      return createdAt > oneMinuteAgo;
    }).length;
    const throughput = recentExecutions;
    
    return {
      averageWaitTime,
      averageExecutionTime: 0, // Would need to track actual execution times
      successRate,
      failureRate,
      throughput
    };
  }

  /**
   * Cleanup queue
   */
  cleanup(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    this.queue = [];
    this.processing.clear();
    this.retryAttempts.clear();
  }
}
