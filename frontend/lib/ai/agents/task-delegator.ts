/**
 * Task Delegator
 * Handles task distribution, load balancing, and agent coordination
 */

import { EventEmitter } from 'events';
import { AgentRegistry, AgentInfo } from './agent-registry';
import { BaseAgent } from './base-agent';

export interface TaskRequest {
  id: string;
  type: string;
  capabilities: string[];
  priority: 'low' | 'normal' | 'high' | 'emergency';
  data: any;
  timeout?: number;
  retryCount?: number;
  maxRetries?: number;
}

export interface TaskResponse {
  success: boolean;
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  agentId: string;
  executionTime: number;
  timestamp: Date;
}

export interface DelegatorConfig {
  selectionStrategy: 'weighted' | 'round-robin' | 'least-loaded' | 'random';
  loadBalancing: boolean;
  failoverEnabled: boolean;
  maxConcurrentTasks: number;
  taskTimeout: number;
  retryPolicy: {
    maxRetries: number;
    backoff: 'exponential' | 'linear' | 'fixed';
    baseDelay: number;
  };
}

export class TaskDelegator extends EventEmitter {
  private registry: AgentRegistry;
  private config: DelegatorConfig;
  private activeTasks: Map<string, TaskRequest> = new Map();
  private failedAgents: Map<string, { count: number; lastFailure: Date; cooldownUntil?: Date }> = new Map();
  private taskQueue: TaskRequest[] = [];
  private isProcessing = false;

  constructor(registry: AgentRegistry, config: Partial<DelegatorConfig> = {}) {
    super();
    this.registry = registry;
    this.config = {
      selectionStrategy: config.selectionStrategy || 'weighted',
      loadBalancing: config.loadBalancing ?? true,
      failoverEnabled: config.failoverEnabled ?? true,
      maxConcurrentTasks: config.maxConcurrentTasks || 100,
      taskTimeout: config.taskTimeout || 30000, // 30 seconds
      retryPolicy: {
        maxRetries: config.retryPolicy?.maxRetries || 3,
        backoff: config.retryPolicy?.backoff || 'exponential',
        baseDelay: config.retryPolicy?.baseDelay || 1000
      }
    };
  }

  /**
   * Delegate a task to an appropriate agent
   */
  async delegateTask(request: TaskRequest): Promise<TaskResponse> {
    const startTime = Date.now();

    try {
      // Check if we can accept more tasks
      if (this.activeTasks.size >= this.config.maxConcurrentTasks) {
        throw new Error('Maximum concurrent tasks reached');
      }

      // Add to active tasks
      this.activeTasks.set(request.id, request);

      // Find suitable agents
      const suitableAgents = this.findSuitableAgents(request);
      if (suitableAgents.length === 0) {
        throw new Error('No suitable agents available');
      }

      // Select agent based on strategy
      const selectedAgent = this.selectAgent(suitableAgents, request);
      if (!selectedAgent) {
        throw new Error('Failed to select agent');
      }

      // Execute task
      const result = await this.executeTask(selectedAgent, request);
      
      const executionTime = Date.now() - startTime;
      
      // Update agent metrics
      this.registry.updateAgentMetrics(selectedAgent.id, result.success, executionTime);

      // Remove from active tasks
      this.activeTasks.delete(request.id);

      this.emit('taskCompleted', { request, result, agentId: selectedAgent.id });

      return {
        success: result.success,
        result: result.result,
        error: result.error,
        agentId: selectedAgent.id,
        executionTime,
        timestamp: new Date()
      };

    } catch (error) {
      this.activeTasks.delete(request.id);
      
      const executionTime = Date.now() - startTime;
      
      this.emit('taskFailed', { request, error, executionTime });

      return {
        success: false,
        error: {
          code: 'DELEGATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        agentId: '',
        executionTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Find agents suitable for the task
   */
  private findSuitableAgents(request: TaskRequest): AgentInfo[] {
    const availableAgents = this.registry.getAvailableAgents();
    
    return availableAgents.filter(agent => {
      // Check if agent has required capabilities
      const hasCapabilities = request.capabilities.every(cap => 
        agent.capabilities.includes(cap)
      );

      // Check if agent is not in cooldown
      const isNotInCooldown = !this.isAgentInCooldown(agent.id);

      return hasCapabilities && isNotInCooldown;
    });
  }

  /**
   * Select agent based on configured strategy
   */
  private selectAgent(agents: AgentInfo[], request: TaskRequest): AgentInfo | null {
    if (agents.length === 0) {
      return null;
    }

    switch (this.config.selectionStrategy) {
      case 'weighted':
        return this.selectByWeight(agents);
      case 'round-robin':
        return this.selectRoundRobin(agents);
      case 'least-loaded':
        return this.selectLeastLoaded(agents);
      case 'random':
        return this.selectRandom(agents);
      default:
        return this.selectByWeight(agents);
    }
  }

  /**
   * Select agent by weight (probability-based)
   */
  private selectByWeight(agents: AgentInfo[]): AgentInfo {
    const totalWeight = agents.reduce((sum, agent) => sum + agent.weight, 0);
    let random = Math.random() * totalWeight;

    for (const agent of agents) {
      random -= agent.weight;
      if (random <= 0) {
        return agent;
      }
    }

    return agents[agents.length - 1]; // Fallback
  }

  /**
   * Select agent using round-robin
   */
  private selectRoundRobin(agents: AgentInfo[]): AgentInfo {
    // Simple round-robin implementation
    const index = Math.floor(Math.random() * agents.length);
    return agents[index];
  }

  /**
   * Select least loaded agent
   */
  private selectLeastLoaded(agents: AgentInfo[]): AgentInfo {
    return agents.reduce((least, current) => 
      current.performanceMetrics.totalRequests < least.performanceMetrics.totalRequests 
        ? current 
        : least
    );
  }

  /**
   * Select random agent
   */
  private selectRandom(agents: AgentInfo[]): AgentInfo {
    const index = Math.floor(Math.random() * agents.length);
    return agents[index];
  }

  /**
   * Execute task on selected agent
   */
  private async executeTask(agent: AgentInfo, request: TaskRequest): Promise<{ success: boolean; result?: any; error?: any }> {
    const agentInstance = this.registry.getAgentInstance(agent.id);
    if (!agentInstance) {
      throw new Error(`Agent instance not found: ${agent.id}`);
    }

    try {
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), request.timeout || this.config.taskTimeout);
      });

      // Execute task
      const taskPromise = agentInstance.execute(request.data);

      const result = await Promise.race([taskPromise, timeoutPromise]);
      
      return {
        success: true,
        result
      };

    } catch (error) {
      // Mark agent as failed if this is a critical error
      if (this.isRetryableError(error)) {
        this.markAgentFailed(agent.id);
      }

      return {
        success: false,
        error: {
          code: 'AGENT_EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown execution error',
          details: error
        }
      };
    }
  }

  /**
   * Check if agent is in cooldown period
   */
  private isAgentInCooldown(agentId: string): boolean {
    const failedAgent = this.failedAgents.get(agentId);
    if (!failedAgent || !failedAgent.cooldownUntil) {
      return false;
    }

    if (Date.now() < failedAgent.cooldownUntil.getTime()) {
      return true;
    }

    // Cooldown expired, remove from failed agents
    this.failedAgents.delete(agentId);
    return false;
  }

  /**
   * Mark agent as failed
   */
  private markAgentFailed(agentId: string): void {
    const existing = this.failedAgents.get(agentId);
    const failureCount = existing ? existing.count + 1 : 1;
    
    // Calculate cooldown duration (exponential backoff)
    const cooldownDuration = this.config.retryPolicy.baseDelay * Math.pow(2, failureCount - 1);
    const cooldownUntil = new Date(Date.now() + cooldownDuration);

    this.failedAgents.set(agentId, {
      count: failureCount,
      lastFailure: new Date(),
      cooldownUntil
    });

    this.emit('agentFailed', { agentId, failureCount, cooldownUntil });
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Define retryable error patterns
    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'temporary',
      'rate limit'
    ];

    const errorMessage = error?.message?.toLowerCase() || '';
    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Get delegator statistics
   */
  getStats(): {
    activeTasks: number;
    queuedTasks: number;
    failedAgents: number;
    totalDelegatedTasks: number;
  } {
    return {
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
      failedAgents: this.failedAgents.size,
      totalDelegatedTasks: this.activeTasks.size + this.taskQueue.length
    };
  }

  /**
   * Shutdown the delegator
   */
  async shutdown(): Promise<void> {
    this.isProcessing = false;
    this.activeTasks.clear();
    this.taskQueue = [];
    this.failedAgents.clear();
    this.removeAllListeners();
  }
}
