/**
 * AI Agent Registry System
 * Healthcare-compliant agent registration and management
 */
import { EventEmitter } from 'events';
export class HealthcareAgentRegistry extends EventEmitter {
    constructor(options) {
        super();
        this.agents = new Map();
        this.agentConfigs = new Map();
        this.redis = options.redis;
        this.options = options;
        this.loadBalancer = new AgentLoadBalancer();
        // Start health check timer
        this.healthCheckTimer = setInterval(() => this.performHealthCheck(), options.healthCheckInterval);
        // Set up Redis event listeners for distributed registry
        this.setupRedisEventHandlers();
    }
    /**
     * Convert internal mutable agent instance to readonly public interface
     */
    toReadonlyAgentInstance(agent) {
        return {
            id: agent.id,
            config: agent.config,
            status: agent.status,
            currentTask: agent.currentTask,
            loadFactor: agent.loadFactor,
            lastHeartbeat: agent.lastHeartbeat,
            metrics: {
                tasksCompleted: agent.metrics.tasksCompleted,
                tasksFailed: agent.metrics.tasksFailed,
                averageExecutionTime: agent.metrics.averageExecutionTime,
                currentLoad: agent.metrics.currentLoad,
                successRate: agent.metrics.successRate,
                lastError: agent.metrics.lastError,
                healthScore: agent.metrics.healthScore
            }
        };
    }
    /**
     * Initialize agent metrics with default values
     */
    initializeMutableAgentMetrics() {
        return {
            tasksCompleted: 0,
            tasksFailed: 0,
            averageExecutionTime: 0,
            currentLoad: 0,
            successRate: 1.0,
            lastError: undefined,
            healthScore: 1.0
        };
    }
    /**
     * Register a new agent with the orchestrator
     */
    async registerAgent(config) {
        try {
            // Validate agent configuration
            await this.validateAgentConfig(config);
            // Check for duplicate registration
            if (this.agents.has(config.id)) {
                throw new Error(`Agent ${config.id} is already registered`);
            }
            // Create agent instance
            const instance = {
                id: config.id,
                config,
                status: 'idle',
                currentTask: undefined,
                loadFactor: 0,
                lastHeartbeat: new Date(),
                metrics: this.initializeMutableAgentMetrics()
            };
            // Store in local registry
            this.agents.set(config.id, instance);
            this.agentConfigs.set(config.id, config);
            // Store in Redis for distributed access
            await this.storeAgentInRedis(instance);
            // Emit registration event
            this.emit('agent-registered', {
                id: `agent-registered-${config.id}`,
                type: 'agent-registered',
                source: 'agent-registry',
                timestamp: new Date(),
                data: { agentId: config.id, config },
                severity: 'info',
                requiresResponse: false
            });
            console.log(`Agent ${config.id} registered successfully`);
        }
        catch (error) {
            console.error(`Failed to register agent ${config.id}:`, error);
            throw error;
        }
    }
    /**
     * Deregister an agent from the orchestrator
     */
    async deregisterAgent(agentId) {
        try {
            const agent = this.agents.get(agentId);
            if (!agent) {
                throw new Error(`Agent ${agentId} not found`);
            }
            // Check if agent has active tasks
            if (agent.currentTask) {
                throw new Error(`Cannot deregister agent ${agentId} - has active task ${agent.currentTask.id}`);
            }
            // Remove from local registry
            this.agents.delete(agentId);
            this.agentConfigs.delete(agentId);
            // Remove from Redis
            await this.removeAgentFromRedis(agentId);
            // Emit deregistration event
            this.emit('agent-deregistered', {
                id: `agent-deregistered-${agentId}`,
                type: 'agent-deregistered',
                source: 'agent-registry',
                timestamp: new Date(),
                data: { agentId },
                severity: 'info',
                requiresResponse: false
            });
            console.log(`Agent ${agentId} deregistered successfully`);
        }
        catch (error) {
            console.error(`Failed to deregister agent ${agentId}:`, error);
            throw error;
        }
    }
    /**
     * Get agent by ID
     */
    getAgent(agentId) {
        const agent = this.agents.get(agentId);
        return agent ? this.toReadonlyAgentInstance(agent) : undefined;
    }
    /**
     * Get all registered agents
     */
    getAllAgents() {
        return Array.from(this.agents.values())
            .map(agent => this.toReadonlyAgentInstance(agent));
    }
    /**
     * Get agents by type
     */
    getAgentsByType(type) {
        return Array.from(this.agents.values())
            .filter(agent => agent.config.type === type)
            .map(agent => this.toReadonlyAgentInstance(agent));
    }
    /**
     * Get agents by capability
     */
    getAgentsByCapability(capability) {
        return Array.from(this.agents.values())
            .filter(agent => agent.config.capabilities.some(cap => cap.name === capability))
            .map(agent => this.toReadonlyAgentInstance(agent));
    }
    /**
     * Find best agent for a task using load balancing
     */
    async findBestAgentForTask(task) {
        const suitableAgents = this.findSuitableAgents(task);
        if (suitableAgents.length === 0) {
            return null;
        }
        if (!this.options.enableLoadBalancing) {
            // Return first suitable agent if load balancing is disabled
            return this.toReadonlyAgentInstance(suitableAgents[0]);
        }
        // Use load balancer to select best agent
        const selectedAgent = this.loadBalancer.selectBestAgent(suitableAgents, task);
        return selectedAgent ? this.toReadonlyAgentInstance(selectedAgent) : null;
    }
    /**
     * Update agent status
     */
    async updateAgentStatus(agentId, status) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        const previousStatus = agent.status;
        agent.status = status;
        agent.lastHeartbeat = new Date();
        // Update in Redis
        await this.storeAgentInRedis(agent);
        // Emit status change event if status changed
        if (previousStatus !== status) {
            this.emit('agent-status-changed', {
                id: `agent-status-${agentId}`,
                type: 'agent-status-changed',
                source: 'agent-registry',
                timestamp: new Date(),
                data: { agentId, previousStatus, newStatus: status },
                severity: status === 'error' ? 'error' : 'info',
                requiresResponse: status === 'error'
            });
        }
    }
    /**
     * Assign task to agent
     */
    async assignTaskToAgent(agentId, task) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        if (agent.status !== 'idle') {
            throw new Error(`Agent ${agentId} is not available (status: ${agent.status})`);
        }
        // Check concurrent task limit
        if (agent.currentTask && agent.config.maxConcurrentTasks <= 1) {
            throw new Error(`Agent ${agentId} is already handling a task`);
        }
        // Update agent state
        agent.currentTask = task;
        agent.status = 'active';
        agent.loadFactor = this.calculateLoadFactor(agent);
        agent.lastHeartbeat = new Date();
        // Update metrics
        agent.metrics.tasksCompleted += 0; // Will be incremented on completion
        // Update in Redis
        await this.storeAgentInRedis(agent);
        console.log(`Task ${task.id} assigned to agent ${agentId}`);
    }
    /**
     * Complete task for agent
     */
    async completeTaskForAgent(agentId, taskId, success) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        if (!agent.currentTask || agent.currentTask.id !== taskId) {
            throw new Error(`Agent ${agentId} is not handling task ${taskId}`);
        }
        // Update metrics
        if (success) {
            agent.metrics.tasksCompleted += 1;
        }
        else {
            agent.metrics.tasksFailed += 1;
        }
        // Calculate success rate
        const totalTasks = agent.metrics.tasksCompleted + agent.metrics.tasksFailed;
        agent.metrics.successRate = totalTasks > 0 ? agent.metrics.tasksCompleted / totalTasks : 1;
        // Update health score based on recent performance
        agent.metrics.healthScore = this.calculateHealthScore(agent);
        // Reset agent state
        agent.currentTask = undefined;
        agent.status = 'idle';
        agent.loadFactor = 0;
        agent.lastHeartbeat = new Date();
        // Update in Redis
        await this.storeAgentInRedis(agent);
        console.log(`Task ${taskId} completed by agent ${agentId} (success: ${success})`);
    }
    /**
     * Get registry statistics
     */
    getRegistryStats() {
        const agents = Array.from(this.agents.values());
        const agentsByStatus = {
            'idle': 0,
            'active': 0,
            'busy': 0,
            'error': 0,
            'offline': 0,
            'maintenance': 0
        };
        const agentsByType = {};
        agents.forEach(agent => {
            agentsByStatus[agent.status]++;
            agentsByType[agent.config.type] = (agentsByType[agent.config.type] || 0) + 1;
        });
        const healthyAgents = agents.filter(agent => agent.status !== 'error' && agent.status !== 'offline').length;
        const averageLoadFactor = agents.length > 0
            ? agents.reduce((sum, agent) => sum + agent.loadFactor, 0) / agents.length
            : 0;
        return {
            totalAgents: agents.length,
            agentsByStatus,
            agentsByType,
            healthyAgents,
            averageLoadFactor
        };
    }
    /**
     * Shutdown the registry
     */
    async shutdown() {
        clearInterval(this.healthCheckTimer);
        // Deregister all agents
        const agentIds = Array.from(this.agents.keys());
        for (const agentId of agentIds) {
            try {
                await this.deregisterAgent(agentId);
            }
            catch (error) {
                console.error(`Error deregistering agent ${agentId} during shutdown:`, error);
            }
        }
        this.removeAllListeners();
        console.log('Agent registry shut down successfully');
    }
    async validateAgentConfig(config) {
        // Validate healthcare compliance requirements
        if (this.options.complianceValidation && config.isHealthcareSpecialized) {
            if (!config.compliance.hipaaCompliant) {
                throw new Error(`Healthcare-specialized agent ${config.id} must be HIPAA compliant`);
            }
            if (!config.compliance.encryptionRequired) {
                throw new Error(`Healthcare-specialized agent ${config.id} must require encryption`);
            }
            if (!config.compliance.auditLogging) {
                throw new Error(`Healthcare-specialized agent ${config.id} must enable audit logging`);
            }
        }
        // Validate capability requirements
        for (const capability of config.capabilities) {
            if (capability.hipaaCompliant && !config.compliance.hipaaCompliant) {
                throw new Error(`Agent ${config.id} has HIPAA-compliant capabilities but is not HIPAA compliant`);
            }
        }
        // Validate timeout and retry policy
        if (config.timeout <= 0) {
            throw new Error(`Agent ${config.id} must have a positive timeout value`);
        }
        if (config.retryPolicy.maxAttempts < 0) {
            throw new Error(`Agent ${config.id} retry policy must have non-negative max attempts`);
        }
    }
    findSuitableAgents(task) {
        return Array.from(this.agents.values())
            .filter(agent => {
            // Agent must be idle or able to handle concurrent tasks
            if (agent.status === 'error' || agent.status === 'offline' || agent.status === 'maintenance') {
                return false;
            }
            if (agent.status === 'busy' ||
                (agent.currentTask && agent.loadFactor >= 1.0)) {
                return false;
            }
            // Check if agent has required capabilities
            const hasRequiredCapabilities = task.requiredCapabilities.every(requiredCap => agent.config.capabilities.some(agentCap => agentCap.name === requiredCap));
            if (!hasRequiredCapabilities) {
                return false;
            }
            // Check compliance requirements
            if (task.context.complianceRequirements.some(req => req.mandatory)) {
                if (!agent.config.compliance.hipaaCompliant) {
                    return false;
                }
            }
            // Check security context compatibility
            const requiresEncryption = task.input.securityContext.encryptionLevel !== 'none';
            if (requiresEncryption && !agent.config.compliance.encryptionRequired) {
                return false;
            }
            return true;
        })
            .sort((a, b) => {
            // Sort by priority (higher first), then by load factor (lower first)
            if (a.config.priority !== b.config.priority) {
                return b.config.priority - a.config.priority;
            }
            return a.loadFactor - b.loadFactor;
        });
    }
    calculateLoadFactor(agent) {
        const activeTasks = agent.currentTask ? 1 : 0;
        return activeTasks / agent.config.maxConcurrentTasks;
    }
    calculateHealthScore(agent) {
        let score = 1.0;
        // Factor in success rate
        score *= agent.metrics.successRate;
        // Factor in recent errors
        if (agent.metrics.lastError) {
            const errorAge = Date.now() - agent.metrics.lastError.timestamp.getTime();
            const errorImpact = Math.max(0, 1 - errorAge / (24 * 60 * 60 * 1000)); // Decay over 24 hours
            score *= (1 - errorImpact * 0.3); // Reduce score by up to 30% for recent errors
        }
        // Factor in load
        const loadPenalty = agent.loadFactor * 0.2; // Reduce score by up to 20% for high load
        score *= (1 - loadPenalty);
        return Math.max(0, Math.min(1, score));
    }
    async performHealthCheck() {
        const now = new Date();
        const maxIdleTime = this.options.maxIdleTime;
        for (const [agentId, agent] of this.agents) {
            const idleTime = now.getTime() - agent.lastHeartbeat.getTime();
            // Mark agents as offline if they haven't sent a heartbeat
            if (idleTime > maxIdleTime && agent.status !== 'offline') {
                console.warn(`Agent ${agentId} marked as offline due to missing heartbeat`);
                await this.updateAgentStatus(agentId, 'offline');
            }
        }
    }
    setupRedisEventHandlers() {
        // Listen for agent updates from other orchestrator instances
        this.redis.subscribe('agent-registry-updates', (err) => {
            if (err) {
                console.error('Failed to subscribe to agent registry updates:', err);
            }
        });
        this.redis.on('message', (channel, message) => {
            if (channel === 'agent-registry-updates') {
                try {
                    const update = JSON.parse(message);
                    this.handleDistributedRegistryUpdate(update);
                }
                catch (error) {
                    console.error('Failed to parse registry update message:', error);
                }
            }
        });
    }
    handleDistributedRegistryUpdate(update) {
        // Handle updates from other orchestrator instances
        // This enables distributed agent registry coordination
        switch (update.type) {
            case 'agent-registered':
                // Another instance registered an agent
                break;
            case 'agent-deregistered':
                // Another instance deregistered an agent
                break;
            case 'agent-status-changed':
                // Another instance updated an agent's status
                break;
        }
    }
    async storeAgentInRedis(agent) {
        const key = `agent:${agent.id}`;
        const data = JSON.stringify({
            ...agent,
            lastHeartbeat: agent.lastHeartbeat.toISOString()
        });
        await this.redis.setex(key, 300, data); // 5-minute expiry
    }
    async removeAgentFromRedis(agentId) {
        const key = `agent:${agentId}`;
        await this.redis.del(key);
    }
}
/**
 * Load balancer for selecting optimal agents
 */
class AgentLoadBalancer {
    selectBestAgent(agents, task) {
        if (agents.length === 0) {
            return null;
        }
        // Weighted scoring algorithm
        const scoredAgents = agents.map(agent => ({
            agent,
            score: this.calculateAgentScore(agent, task)
        }));
        // Sort by score (highest first)
        scoredAgents.sort((a, b) => b.score - a.score);
        return scoredAgents[0].agent;
    }
    calculateAgentScore(agent, task) {
        let score = 0;
        // Base score from agent priority
        score += agent.config.priority * 10;
        // Health score factor
        score += agent.metrics.healthScore * 50;
        // Load factor penalty (prefer less loaded agents)
        score -= agent.loadFactor * 30;
        // Success rate bonus
        score += agent.metrics.successRate * 20;
        // Healthcare specialization bonus for healthcare tasks
        if (agent.config.isHealthcareSpecialized && this.isHealthcareTask(task)) {
            score += 15;
        }
        // Capability match bonus
        const capabilityMatch = this.calculateCapabilityMatch(agent, task);
        score += capabilityMatch * 25;
        return Math.max(0, score);
    }
    isHealthcareTask(task) {
        const healthcareTaskTypes = [
            'patient-data-processing',
            'compliance-check',
            'security-audit'
        ];
        return healthcareTaskTypes.includes(task.type) ||
            task.context.complianceRequirements.length > 0;
    }
    calculateCapabilityMatch(agent, task) {
        const requiredCaps = task.requiredCapabilities;
        const agentCaps = agent.config.capabilities.map(cap => cap.name);
        if (requiredCaps.length === 0) {
            return 1.0;
        }
        const matchCount = requiredCaps.filter(req => agentCaps.includes(req)).length;
        return matchCount / requiredCaps.length;
    }
}
export default HealthcareAgentRegistry;
