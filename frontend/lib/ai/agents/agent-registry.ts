/**
 * Agent Registry
 * Manages AI agent registration, health checks, and discovery
 */

import { EventEmitter } from 'events';
import { BaseAgent } from './base-agent';

export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  weight: number;
  status: 'available' | 'busy' | 'unhealthy' | 'offline';
  lastHealthCheck: Date;
  performanceMetrics: {
    successRate: number;
    averageResponseTime: number;
    totalRequests: number;
    failedRequests: number;
  };
  metadata: Record<string, any>;
}

export interface AgentRegistryConfig {
  maxAgents?: number;
  healthCheckInterval?: number;
  retryPolicy?: {
    maxRetries: number;
    backoff: 'exponential' | 'linear' | 'fixed';
    baseDelay: number;
  };
}

export class AgentRegistry extends EventEmitter {
  private agents: Map<string, AgentInfo> = new Map();
  private agentInstances: Map<string, BaseAgent> = new Map();
  private originalAgents: Map<string, any> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private config: Required<AgentRegistryConfig>;

  constructor(config: AgentRegistryConfig = {}) {
    super();
    this.config = {
      maxAgents: config.maxAgents || 50,
      healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
      retryPolicy: {
        maxRetries: config.retryPolicy?.maxRetries || 3,
        backoff: config.retryPolicy?.backoff || 'exponential',
        baseDelay: config.retryPolicy?.baseDelay || 1000
      }
    };
  }

  /**
   * Register a new agent
   */
  async registerAgent(agent: BaseAgent | any): Promise<boolean> {
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error('Maximum number of agents reached');
    }

    // Handle both BaseAgent objects and direct config objects
    const config = agent.config || agent;
    
    const agentInfo: AgentInfo = {
      id: config.id,
      name: config.name,
      type: config.type,
      capabilities: config.capabilities,
      weight: config.weight || 1,
      status: 'available',
      lastHealthCheck: new Date(),
      performanceMetrics: {
        successRate: 1.0,
        averageResponseTime: 0,
        totalRequests: 0,
        failedRequests: 0
      },
      metadata: config.metadata || {}
    };

    this.agents.set(agentInfo.id, agentInfo);
    this.agentInstances.set(agentInfo.id, agent);
    
    // Store original agent for getAgent method
    this.originalAgents.set(agentInfo.id, config);

    this.emit('agentRegistered', agentInfo);
    return true;
  }

  /**
   * Deregister an agent
   */
  async deregisterAgent(agentId: string): Promise<boolean> {
    const agentInfo = this.agents.get(agentId);
    if (!agentInfo) {
      return false;
    }

    this.agents.delete(agentId);
    this.agentInstances.delete(agentId);

    this.emit('agentDeregistered', agentInfo);
    return true;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): any | undefined {
    return this.originalAgents.get(agentId);
  }

  /**
   * Get agent instance by ID
   */
  getAgentInstance(agentId: string): BaseAgent | undefined {
    return this.agentInstances.get(agentId);
  }

  /**
   * Find agents by capability
   */
  findAgentsByCapability(capability: string): AgentInfo[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.capabilities.includes(capability) && agent.status === 'available');
  }

  /**
   * Find agents by multiple capabilities
   */
  findAgentsByCapabilities(capabilities: string[]): AgentInfo[] {
    return Array.from(this.agents.values())
      .filter(agent => 
        capabilities.every(cap => agent.capabilities.includes(cap)) && 
        agent.status === 'available'
      );
  }

  /**
   * Get all available agents
   */
  getAvailableAgents(): AgentInfo[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.status === 'available');
  }

  /**
   * Get agents ranked by weight
   */
  getAgentsByWeight(): AgentInfo[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.status === 'available')
      .sort((a, b) => b.weight - a.weight);
  }

  /**
   * Start health check monitoring
   */
  startHealthChecks(): void {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop health check monitoring
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Perform health checks on all agents
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.agents.entries()).map(async ([agentId, agentInfo]) => {
      try {
        const agent = this.agentInstances.get(agentId);
        if (!agent) {
          agentInfo.status = 'offline';
          return;
        }

        // Simple health check - try to get agent status
        const isHealthy = await this.checkAgentHealth(agent);
        
        if (isHealthy) {
          agentInfo.status = 'available';
          agentInfo.lastHealthCheck = new Date();
        } else {
          agentInfo.status = 'unhealthy';
          this.emit('agentUnhealthy', agentInfo);
        }
      } catch (error) {
        agentInfo.status = 'unhealthy';
        this.emit('agentHealthCheckFailed', { agentId, error });
      }
    });

    await Promise.all(healthCheckPromises);
  }

  /**
   * Check if an agent is healthy
   */
  private async checkAgentHealth(agent: BaseAgent): Promise<boolean> {
    try {
      // Simple health check - verify agent can respond
      return agent.config.id && agent.config.name && agent.config.type;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update agent performance metrics
   */
  updateAgentMetrics(agentId: string, success: boolean, responseTime: number): void {
    const agentInfo = this.agents.get(agentId);
    if (!agentInfo) {
      return;
    }

    agentInfo.performanceMetrics.totalRequests++;
    if (!success) {
      agentInfo.performanceMetrics.failedRequests++;
    }

    // Update success rate
    agentInfo.performanceMetrics.successRate = 
      (agentInfo.performanceMetrics.totalRequests - agentInfo.performanceMetrics.failedRequests) / 
      agentInfo.performanceMetrics.totalRequests;

    // Update average response time (exponential moving average)
    const alpha = 0.1; // Smoothing factor
    agentInfo.performanceMetrics.averageResponseTime = 
      (alpha * responseTime) + ((1 - alpha) * agentInfo.performanceMetrics.averageResponseTime);

    this.emit('agentMetricsUpdated', { agentId, metrics: agentInfo.performanceMetrics });
  }

  /**
   * Calculate agent reliability score
   */
  calculateReliabilityScore(agentId: string): number {
    const agentInfo = this.agents.get(agentId);
    if (!agentInfo) {
      return 0;
    }

    const { successRate, averageResponseTime } = agentInfo.performanceMetrics;
    
    // Reliability score based on success rate and response time
    // Higher success rate and lower response time = higher reliability
    const responseTimeScore = Math.max(0, 1 - (averageResponseTime / 5000)); // Normalize to 5 seconds
    return (successRate * 0.7) + (responseTimeScore * 0.3);
  }

  /**
   * Get all agents with their reliability scores
   */
  getAgentsWithReliabilityScores(): Array<AgentInfo & { reliabilityScore: number }> {
    return Array.from(this.agents.values()).map(agent => ({
      ...agent,
      reliabilityScore: this.calculateReliabilityScore(agent.id)
    }));
  }

  /**
   * Shutdown the registry
   */
  async shutdown(): Promise<void> {
    this.stopHealthChecks();
    this.agents.clear();
    this.agentInstances.clear();
    this.removeAllListeners();
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalAgents: number;
    availableAgents: number;
    busyAgents: number;
    unhealthyAgents: number;
    offlineAgents: number;
  } {
    const agents = Array.from(this.agents.values());
    return {
      totalAgents: agents.length,
      availableAgents: agents.filter(a => a.status === 'available').length,
      busyAgents: agents.filter(a => a.status === 'busy').length,
      unhealthyAgents: agents.filter(a => a.status === 'unhealthy').length,
      offlineAgents: agents.filter(a => a.status === 'offline').length
    };
  }
}
