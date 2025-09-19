/**
 * Intelligent Task Delegation System
 * Healthcare AI Orchestrator - Dynamic agent selection and workload distribution
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import HealthcareAgentRegistry from './agent-registry';
import HealthcareAILogger from './logger';
import type {
  AgentConfiguration,
  AgentInstance,
  WorkflowTask,
  TaskType,
  TaskPriority,
  AgentCapability,
  AgentStatus,
  TaskResult,
  TaskError,
  SecurityContext,
  ComplianceStatus,
  OrchestratorEvent,
  EventSeverity,
  DataClassification,
  HealthcareSensitivity
} from '../../types/ai/orchestrator';

export interface TaskDelegatorOptions {
  redis: Redis;
  agentRegistry: HealthcareAgentRegistry;
  logger: HealthcareAILogger;
  enableLoadBalancing: boolean;
  enableFailover: boolean;
  enableHealthcareOptimization: boolean;
  maxRetryAttempts: number;
  delegationTimeout: number;
  performanceMonitoring: boolean;
}

export interface AgentCapabilityMatch {
  agentId: string;
  matchScore: number;
  capabilityOverlap: number;
  healthcareSpecializationBonus: number;
  loadPenalty: number;
  performanceScore: number;
  complianceScore: number;
  availabilityScore: number;
}

export interface TaskDelegationResult {
  taskId: string;
  assignedAgentId: string | null;
  delegationScore: number;
  alternativeAgents: string[];
  delegationTime: number;
  reason: string;
  complianceValidated: boolean;
  requiresEscalation: boolean;
}

export interface WorkloadDistributionMetrics {
  totalTasks: number;
  activeTasks: number;
  queuedTasks: number;
  agentUtilization: Map<string, number>;
  averageWaitTime: number;
  delegationSuccess: number;
  failoverCount: number;
  complianceViolations: number;
}

export interface HealthcareSpecializationContext {
  patientDataInvolved: boolean;
  complianceLevel: 'basic' | 'hipaa' | 'phi' | 'sensitive_phi';
  medicalContentType: 'clinical' | 'research' | 'marketing' | 'educational' | 'regulatory';
  urgencyLevel: 'routine' | 'urgent' | 'emergent' | 'critical';
  auditRequired: boolean;
  encryptionRequired: boolean;
}

export class TaskDelegator extends EventEmitter {
  private readonly redis: Redis;
  private readonly agentRegistry: HealthcareAgentRegistry;
  private readonly logger: HealthcareAILogger;
  private readonly options: TaskDelegatorOptions;
  
  private readonly taskQueue = new Map<string, WorkflowTask>();
  private readonly delegationHistory = new Map<string, TaskDelegationResult>();
  private readonly agentWorkloads = new Map<string, number>();
  private readonly failoverStrategies = new Map<string, string[]>();
  
  // Performance tracking
  private readonly delegationMetrics = new Map<string, number>();
  private readonly healthcareOptimizationStats = new Map<string, number>();
  
  // Healthcare specialization registry
  private readonly healthcareSpecializations = new Map<string, Set<string>>();
  private readonly complianceValidators = new Map<string, (task: WorkflowTask) => Promise<boolean>>();

  constructor(options: TaskDelegatorOptions) {
    super();
    this.redis = options.redis;
    this.agentRegistry = options.agentRegistry;
    this.logger = options.logger;
    this.options = options;

    this.initializeHealthcareSpecializations();
    this.initializeComplianceValidators();
    this.setupPerformanceMonitoring();
    this.setupEventHandlers();
  }

  /**
   * Intelligently delegate a task to the most suitable agent
   */
  async delegateTask(task: WorkflowTask): Promise<TaskDelegationResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting task delegation', { taskId: task.id, taskType: task.type });
      
      // Validate task and extract healthcare context
      const healthcareContext = await this.extractHealthcareContext(task);
      
      // Find suitable agents with capability matching
      const candidateAgents = await this.findCandidateAgents(task, healthcareContext);
      
      if (candidateAgents.length === 0) {
        return this.handleNoCandidatesFound(task, startTime);
      }
      
      // Score and rank agents
      const rankedAgents = await this.scoreAndRankAgents(candidateAgents, task, healthcareContext);
      
      // Select best agent with load balancing
      const selectedAgent = await this.selectOptimalAgent(rankedAgents, task);
      
      if (!selectedAgent) {
        return this.handleSelectionFailure(task, startTime);
      }
      
      // Validate compliance before assignment
      const complianceValid = await this.validateCompliance(task, selectedAgent, healthcareContext);
      
      if (!complianceValid) {
        return this.handleComplianceFailure(task, startTime);
      }
      
      // Assign task to selected agent
      await this.assignTaskToAgent(task, selectedAgent);
      
      // Update workload tracking
      await this.updateAgentWorkload(selectedAgent.id, 1);
      
      // Create delegation result
      const result: TaskDelegationResult = {
        taskId: task.id,
        assignedAgentId: selectedAgent.id,
        delegationScore: rankedAgents[0].matchScore,
        alternativeAgents: rankedAgents.slice(1, 4).map(match => match.agentId),
        delegationTime: Date.now() - startTime,
        reason: 'Optimal agent selected based on capabilities and workload',
        complianceValidated: true,
        requiresEscalation: false
      };
      
      // Store delegation result
      this.delegationHistory.set(task.id, result);
      
      // Emit success event
      this.emitDelegationEvent('task-delegated', {
        taskId: task.id,
        agentId: selectedAgent.id,
        delegationScore: result.delegationScore,
        delegationTime: result.delegationTime
      });
      
      this.logger.info('Task delegated successfully', result);
      return result;
      
    } catch (error) {
      this.logger.error('Task delegation failed', { taskId: task.id, error });
      return this.handleDelegationError(task, error, startTime);
    }
  }

  /**
   * Find agents capable of handling the task
   */
  private async findCandidateAgents(
    task: WorkflowTask, 
    healthcareContext: HealthcareSpecializationContext
  ): Promise<AgentInstance[]> {
    const allAgents = this.agentRegistry.getAllAgents();
    const candidates: AgentInstance[] = [];
    
    for (const agent of allAgents) {
      // Check agent availability
      if (!this.isAgentAvailable(agent)) {
        continue;
      }
      
      // Check basic capability requirements
      if (!this.hasRequiredCapabilities(agent, task.requiredCapabilities)) {
        continue;
      }
      
      // Check healthcare specialization requirements
      if (healthcareContext.patientDataInvolved && !agent.config.isHealthcareSpecialized) {
        continue;
      }
      
      // Check compliance requirements
      if (!this.meetComplianceRequirements(agent, task, healthcareContext)) {
        continue;
      }
      
      // Check workload capacity
      if (!this.hasCapacityForTask(agent, task)) {
        continue;
      }
      
      candidates.push(agent);
    }
    
    return candidates;
  }

  /**
   * Score and rank agents based on multiple criteria
   */
  private async scoreAndRankAgents(
    candidates: AgentInstance[],
    task: WorkflowTask,
    healthcareContext: HealthcareSpecializationContext
  ): Promise<AgentCapabilityMatch[]> {
    const matches: AgentCapabilityMatch[] = [];
    
    for (const agent of candidates) {
      const match = await this.calculateAgentMatch(agent, task, healthcareContext);
      matches.push(match);
    }
    
    // Sort by match score (highest first)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate comprehensive agent matching score
   */
  private async calculateAgentMatch(
    agent: AgentInstance,
    task: WorkflowTask,
    healthcareContext: HealthcareSpecializationContext
  ): Promise<AgentCapabilityMatch> {
    let totalScore = 0;
    
    // Base capability overlap score (0-40 points)
    const capabilityScore = this.calculateCapabilityOverlap(agent, task.requiredCapabilities);
    totalScore += capabilityScore * 40;
    
    // Healthcare specialization bonus (0-20 points)
    const healthcareBonus = this.calculateHealthcareSpecializationBonus(agent, task, healthcareContext);
    totalScore += healthcareBonus * 20;
    
    // Load penalty (0-15 points deducted)
    const loadPenalty = this.calculateLoadPenalty(agent);
    totalScore -= loadPenalty * 15;
    
    // Performance score (0-15 points)
    const performanceScore = agent.metrics.successRate * agent.metrics.healthScore;
    totalScore += performanceScore * 15;
    
    // Compliance score (0-10 points)
    const complianceScore = this.calculateComplianceScore(agent, task, healthcareContext);
    totalScore += complianceScore * 10;
    
    // Availability score (immediate vs future availability)
    const availabilityScore = this.calculateAvailabilityScore(agent);
    
    return {
      agentId: agent.id,
      matchScore: Math.max(0, Math.min(100, totalScore)),
      capabilityOverlap: capabilityScore,
      healthcareSpecializationBonus: healthcareBonus,
      loadPenalty: loadPenalty,
      performanceScore,
      complianceScore,
      availabilityScore
    };
  }

  /**
   * Select optimal agent with load balancing considerations
   */
  private async selectOptimalAgent(
    rankedAgents: AgentCapabilityMatch[],
    task: WorkflowTask
  ): Promise<AgentInstance | null> {
    if (rankedAgents.length === 0) {
      return null;
    }
    
    // If load balancing is disabled, return highest scored agent
    if (!this.options.enableLoadBalancing) {
      const topMatch = rankedAgents[0];
      return this.agentRegistry.getAgent(topMatch.agentId) || null;
    }
    
    // Advanced load balancing: consider top 3 agents and their current load
    const topCandidates = rankedAgents.slice(0, 3);
    let selectedMatch = topCandidates[0];
    
    // Check if there's a significant load imbalance
    for (const candidate of topCandidates) {
      const agent = this.agentRegistry.getAgent(candidate.agentId);
      if (!agent) continue;
      
      // If another agent has much lower load and similar score, prefer it
      const scoreDifference = selectedMatch.matchScore - candidate.matchScore;
      const loadDifference = selectedMatch.loadPenalty - candidate.loadPenalty;
      
      if (scoreDifference < 10 && loadDifference > 0.3) {
        selectedMatch = candidate;
      }
    }
    
    return this.agentRegistry.getAgent(selectedMatch.agentId) || null;
  }

  /**
   * Validate compliance requirements for task assignment
   */
  private async validateCompliance(
    task: WorkflowTask,
    agent: AgentInstance,
    healthcareContext: HealthcareSpecializationContext
  ): Promise<boolean> {
    // Check basic compliance requirements
    if (task.constraints.requiredEncryption && !agent.config.compliance.encryptionRequired) {
      this.logger.warn('Agent does not meet encryption requirements', { 
        taskId: task.id, 
        agentId: agent.id 
      });
      return false;
    }
    
    if (task.constraints.auditTrail && !agent.config.compliance.auditLogging) {
      this.logger.warn('Agent does not meet audit logging requirements', {
        taskId: task.id,
        agentId: agent.id
      });
      return false;
    }
    
    // Check healthcare-specific compliance
    if (healthcareContext.patientDataInvolved && !agent.config.compliance.hipaaCompliant) {
      this.logger.warn('Agent is not HIPAA compliant for PHI task', {
        taskId: task.id,
        agentId: agent.id
      });
      return false;
    }
    
    // Run custom compliance validators
    const validatorKey = `${task.type}_${healthcareContext.complianceLevel}`;
    const validator = this.complianceValidators.get(validatorKey);
    
    if (validator) {
      try {
        return await validator(task);
      } catch (error) {
        this.logger.error('Compliance validation error', { taskId: task.id, error });
        return false;
      }
    }
    
    return true;
  }

  /**
   * Assign task to selected agent with error handling
   */
  private async assignTaskToAgent(task: WorkflowTask, agent: AgentInstance): Promise<void> {
    try {
      await this.agentRegistry.assignTaskToAgent(agent.id, task);
      
      // Store task assignment in Redis for distributed coordination
      await this.redis.setex(
        `task_assignment:${task.id}`,
        3600, // 1 hour TTL
        JSON.stringify({
          taskId: task.id,
          agentId: agent.id,
          assignedAt: new Date().toISOString(),
          expectedCompletion: task.deadline?.toISOString()
        })
      );
      
    } catch (error) {
      this.logger.error('Failed to assign task to agent', {
        taskId: task.id,
        agentId: agent.id,
        error
      });
      throw error;
    }
  }

  /**
   * Handle task completion and workload updates
   */
  async handleTaskCompletion(taskId: string, success: boolean, result?: TaskResult): Promise<void> {
    const delegationResult = this.delegationHistory.get(taskId);
    if (!delegationResult || !delegationResult.assignedAgentId) {
      return;
    }
    
    try {
      // Update agent workload
      await this.updateAgentWorkload(delegationResult.assignedAgentId, -1);
      
      // Complete task in agent registry
      await this.agentRegistry.completeTaskForAgent(
        delegationResult.assignedAgentId,
        taskId,
        success
      );
      
      // Update delegation metrics
      this.updateDelegationMetrics(delegationResult, success);
      
      // Clean up Redis data
      await this.redis.del(`task_assignment:${taskId}`);
      
      // Emit completion event
      this.emitDelegationEvent('task-completed', {
        taskId,
        agentId: delegationResult.assignedAgentId,
        success,
        executionTime: result?.executionMetrics.executionTime
      });
      
      // Clean up delegation history (keep last 1000 entries)
      if (this.delegationHistory.size > 1000) {
        const oldestKey = this.delegationHistory.keys().next().value;
        this.delegationHistory.delete(oldestKey);
      }
      
    } catch (error) {
      this.logger.error('Failed to handle task completion', { taskId, error });
    }
  }

  /**
   * Handle agent failures and implement failover strategies
   */
  async handleAgentFailure(agentId: string, taskId?: string): Promise<void> {
    if (!this.options.enableFailover) {
      this.logger.warn('Agent failover is disabled', { agentId });
      return;
    }
    
    try {
      this.logger.warn('Handling agent failure', { agentId, taskId });
      
      // If specific task is provided, attempt reassignment
      if (taskId) {
        const task = this.taskQueue.get(taskId);
        if (task) {
          this.logger.info('Attempting task reassignment due to agent failure', { taskId, failedAgentId: agentId });
          
          // Find alternative agents (excluding failed agent)
          const alternatives = await this.findAlternativeAgents(task, [agentId]);
          
          if (alternatives.length > 0) {
            // Reassign to best alternative
            const newResult = await this.delegateTask(task);
            
            if (newResult.assignedAgentId) {
              this.logger.info('Task successfully reassigned', {
                taskId,
                oldAgentId: agentId,
                newAgentId: newResult.assignedAgentId
              });
              
              // Update metrics
              this.healthcareOptimizationStats.set('failover_success', 
                (this.healthcareOptimizationStats.get('failover_success') || 0) + 1);
            }
          } else {
            this.logger.error('No alternative agents available for failover', { taskId, agentId });
            this.handleTaskEscalation(task, 'no_alternative_agents');
          }
        }
      }
      
      // Update agent workload (release all tasks)
      this.agentWorkloads.set(agentId, 0);
      
      // Emit failure event for monitoring
      this.emitDelegationEvent('agent-failure-handled', {
        agentId,
        taskId,
        failoverAttempted: !!taskId
      });
      
    } catch (error) {
      this.logger.error('Failed to handle agent failure', { agentId, taskId, error });
    }
  }

  /**
   * Get workload distribution metrics
   */
  getWorkloadMetrics(): WorkloadDistributionMetrics {
    const totalTasks = Array.from(this.agentWorkloads.values()).reduce((sum, load) => sum + load, 0);
    const activeTasks = totalTasks;
    const queuedTasks = this.taskQueue.size;
    
    const delegationSuccessCount = this.healthcareOptimizationStats.get('delegation_success') || 0;
    const delegationTotalCount = this.healthcareOptimizationStats.get('delegation_total') || 1;
    const delegationSuccess = delegationSuccessCount / delegationTotalCount;
    
    return {
      totalTasks,
      activeTasks,
      queuedTasks,
      agentUtilization: new Map(this.agentWorkloads),
      averageWaitTime: this.calculateAverageWaitTime(),
      delegationSuccess,
      failoverCount: this.healthcareOptimizationStats.get('failover_success') || 0,
      complianceViolations: this.healthcareOptimizationStats.get('compliance_violations') || 0
    };
  }

  /**
   * Extract healthcare-specific context from task
   */
  private async extractHealthcareContext(task: WorkflowTask): Promise<HealthcareSpecializationContext> {
    // Analyze task data for healthcare indicators
    const patientDataKeywords = ['patient', 'medical', 'clinical', 'phi', 'health', 'diagnosis', 'treatment'];
    const taskString = JSON.stringify(task.input.data).toLowerCase();
    
    const patientDataInvolved = patientDataKeywords.some(keyword => taskString.includes(keyword)) ||
                               task.input.securityContext.dataClassifications.includes('phi' as DataClassification);
    
    // Determine compliance level
    let complianceLevel: 'basic' | 'hipaa' | 'phi' | 'sensitive_phi' = 'basic';
    if (patientDataInvolved) {
      if (task.input.securityContext.dataClassifications.includes('phi' as DataClassification)) {
        complianceLevel = 'phi';
      }
      if (task.constraints.requiredEncryption && task.constraints.auditTrail) {
        complianceLevel = 'sensitive_phi';
      } else {
        complianceLevel = 'hipaa';
      }
    }
    
    // Determine medical content type
    let medicalContentType: 'clinical' | 'research' | 'marketing' | 'educational' | 'regulatory' = 'educational';
    if (task.type === 'patient-data-processing') {
      medicalContentType = 'clinical';
    } else if (task.type === 'compliance-check') {
      medicalContentType = 'regulatory';
    } else if (task.type === 'data-analysis') {
      medicalContentType = 'research';
    } else if (task.type === 'content-generation') {
      medicalContentType = 'marketing';
    }
    
    // Determine urgency level
    let urgencyLevel: 'routine' | 'urgent' | 'emergent' | 'critical' = 'routine';
    switch (task.priority) {
      case 'critical':
        urgencyLevel = 'critical';
        break;
      case 'urgent':
        urgencyLevel = 'emergent';
        break;
      case 'high':
        urgencyLevel = 'urgent';
        break;
      default:
        urgencyLevel = 'routine';
    }
    
    return {
      patientDataInvolved,
      complianceLevel,
      medicalContentType,
      urgencyLevel,
      auditRequired: task.constraints.auditTrail,
      encryptionRequired: task.constraints.requiredEncryption
    };
  }

  /**
   * Check if agent is currently available for task assignment
   */
  private isAgentAvailable(agent: AgentInstance): boolean {
    if (agent.status === 'offline' || agent.status === 'error' || agent.status === 'maintenance') {
      return false;
    }
    
    // Check if agent has capacity for more tasks
    if (agent.status === 'busy' || agent.loadFactor >= 1.0) {
      return false;
    }
    
    // Check if agent is responsive (last heartbeat within acceptable range)
    const heartbeatAge = Date.now() - agent.lastHeartbeat.getTime();
    const maxHeartbeatAge = 5 * 60 * 1000; // 5 minutes
    
    return heartbeatAge < maxHeartbeatAge;
  }

  /**
   * Check if agent has required capabilities
   */
  private hasRequiredCapabilities(agent: AgentInstance, requiredCapabilities: string[]): boolean {
    const agentCapabilities = agent.config.capabilities.map(cap => cap.name);
    return requiredCapabilities.every(required => agentCapabilities.includes(required));
  }

  /**
   * Check if agent meets compliance requirements
   */
  private meetComplianceRequirements(
    agent: AgentInstance,
    task: WorkflowTask,
    healthcareContext: HealthcareSpecializationContext
  ): boolean {
    // Basic compliance checks
    if (task.constraints.requiredEncryption && !agent.config.compliance.encryptionRequired) {
      return false;
    }
    
    if (task.constraints.auditTrail && !agent.config.compliance.auditLogging) {
      return false;
    }
    
    // Healthcare-specific compliance
    if (healthcareContext.patientDataInvolved && !agent.config.compliance.hipaaCompliant) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if agent has capacity for additional tasks
   */
  private hasCapacityForTask(agent: AgentInstance, task: WorkflowTask): boolean {
    const currentWorkload = this.agentWorkloads.get(agent.id) || 0;
    return currentWorkload < agent.config.maxConcurrentTasks;
  }

  /**
   * Calculate capability overlap score (0-1)
   */
  private calculateCapabilityOverlap(agent: AgentInstance, requiredCapabilities: string[]): number {
    if (requiredCapabilities.length === 0) return 1.0;
    
    const agentCapabilities = agent.config.capabilities.map(cap => cap.name);
    const matches = requiredCapabilities.filter(req => agentCapabilities.includes(req));
    
    return matches.length / requiredCapabilities.length;
  }

  /**
   * Calculate healthcare specialization bonus (0-1)
   */
  private calculateHealthcareSpecializationBonus(
    agent: AgentInstance,
    task: WorkflowTask,
    healthcareContext: HealthcareSpecializationContext
  ): number {
    let bonus = 0;
    
    // Base healthcare specialization
    if (agent.config.isHealthcareSpecialized) {
      bonus += 0.5;
    }
    
    // Specific medical content type expertise
    const agentSpecializations = this.healthcareSpecializations.get(agent.id);
    if (agentSpecializations?.has(healthcareContext.medicalContentType)) {
      bonus += 0.3;
    }
    
    // Compliance level expertise
    if (healthcareContext.complianceLevel === 'sensitive_phi' && agent.config.compliance.hipaaCompliant) {
      bonus += 0.2;
    }
    
    return Math.min(1.0, bonus);
  }

  /**
   * Calculate load penalty (0-1)
   */
  private calculateLoadPenalty(agent: AgentInstance): number {
    return agent.loadFactor;
  }

  /**
   * Calculate compliance score (0-1)
   */
  private calculateComplianceScore(
    agent: AgentInstance,
    task: WorkflowTask,
    healthcareContext: HealthcareSpecializationContext
  ): number {
    let score = 0.5; // Base score
    
    if (agent.config.compliance.hipaaCompliant) score += 0.2;
    if (agent.config.compliance.encryptionRequired) score += 0.15;
    if (agent.config.compliance.auditLogging) score += 0.15;
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate availability score (0-1)
   */
  private calculateAvailabilityScore(agent: AgentInstance): number {
    if (agent.status === 'idle') return 1.0;
    if (agent.status === 'active') return 0.7;
    if (agent.status === 'busy') return 0.3;
    return 0;
  }

  /**
   * Update agent workload tracking
   */
  private async updateAgentWorkload(agentId: string, delta: number): Promise<void> {
    const currentLoad = this.agentWorkloads.get(agentId) || 0;
    const newLoad = Math.max(0, currentLoad + delta);
    this.agentWorkloads.set(agentId, newLoad);
    
    // Update in Redis for distributed tracking
    await this.redis.setex(`agent_workload:${agentId}`, 3600, newLoad.toString());
  }

  /**
   * Initialize healthcare specializations
   */
  private initializeHealthcareSpecializations(): void {
    // This would typically be loaded from configuration or database
    // For now, we'll set up some default specializations
    this.healthcareSpecializations.set('medical-writer-01', new Set(['clinical', 'research', 'educational']));
    this.healthcareSpecializations.set('compliance-auditor-01', new Set(['regulatory', 'clinical']));
    this.healthcareSpecializations.set('data-analyst-01', new Set(['research', 'clinical']));
  }

  /**
   * Initialize compliance validators
   */
  private initializeComplianceValidators(): void {
    // PHI processing validator
    this.complianceValidators.set('patient-data-processing_phi', async (task: WorkflowTask) => {
      return task.constraints.requiredEncryption && 
             task.constraints.auditTrail && 
             task.input.securityContext.encryptionLevel !== 'none';
    });
    
    // Sensitive PHI validator
    this.complianceValidators.set('patient-data-processing_sensitive_phi', async (task: WorkflowTask) => {
      return task.constraints.requiredEncryption && 
             task.constraints.auditTrail &&
             task.input.securityContext.encryptionLevel === 'healthcare' &&
             task.input.securityContext.auditRequired;
    });
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (this.options.performanceMonitoring) {
      setInterval(() => {
        this.calculateAndEmitMetrics();
      }, 30000); // Every 30 seconds
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.agentRegistry.on('agent-status-changed', (event: OrchestratorEvent) => {
      const { agentId, newStatus } = event.data as { agentId: string; newStatus: AgentStatus };
      
      if (newStatus === 'offline' || newStatus === 'error') {
        this.handleAgentFailure(agentId).catch(error => {
          this.logger.error('Failed to handle agent failure in event handler', { agentId, error });
        });
      }
    });
  }

  // Helper methods for error handling
  private handleNoCandidatesFound(task: WorkflowTask, startTime: number): TaskDelegationResult {
    return {
      taskId: task.id,
      assignedAgentId: null,
      delegationScore: 0,
      alternativeAgents: [],
      delegationTime: Date.now() - startTime,
      reason: 'No suitable agents found for task requirements',
      complianceValidated: false,
      requiresEscalation: true
    };
  }

  private handleSelectionFailure(task: WorkflowTask, startTime: number): TaskDelegationResult {
    return {
      taskId: task.id,
      assignedAgentId: null,
      delegationScore: 0,
      alternativeAgents: [],
      delegationTime: Date.now() - startTime,
      reason: 'Agent selection failed during optimization process',
      complianceValidated: false,
      requiresEscalation: true
    };
  }

  private handleComplianceFailure(task: WorkflowTask, startTime: number): TaskDelegationResult {
    this.healthcareOptimizationStats.set('compliance_violations',
      (this.healthcareOptimizationStats.get('compliance_violations') || 0) + 1);
    
    return {
      taskId: task.id,
      assignedAgentId: null,
      delegationScore: 0,
      alternativeAgents: [],
      delegationTime: Date.now() - startTime,
      reason: 'Selected agent failed compliance validation',
      complianceValidated: false,
      requiresEscalation: true
    };
  }

  private handleDelegationError(task: WorkflowTask, error: any, startTime: number): TaskDelegationResult {
    return {
      taskId: task.id,
      assignedAgentId: null,
      delegationScore: 0,
      alternativeAgents: [],
      delegationTime: Date.now() - startTime,
      reason: `Delegation failed due to error: ${error.message}`,
      complianceValidated: false,
      requiresEscalation: true
    };
  }

  private async findAlternativeAgents(task: WorkflowTask, excludeAgentIds: string[]): Promise<AgentInstance[]> {
    const allAgents = this.agentRegistry.getAllAgents();
    return allAgents.filter(agent => 
      !excludeAgentIds.includes(agent.id) && this.isAgentAvailable(agent)
    );
  }

  private async handleTaskEscalation(task: WorkflowTask, reason: string): Promise<void> {
    this.logger.error('Task requires escalation', { taskId: task.id, reason });
    // Implementation would depend on escalation policies
  }

  private updateDelegationMetrics(result: TaskDelegationResult, success: boolean): void {
    this.healthcareOptimizationStats.set('delegation_total',
      (this.healthcareOptimizationStats.get('delegation_total') || 0) + 1);
    
    if (success) {
      this.healthcareOptimizationStats.set('delegation_success',
        (this.healthcareOptimizationStats.get('delegation_success') || 0) + 1);
    }
    
    // Track delegation times
    const avgDelegationTime = this.delegationMetrics.get('avg_delegation_time') || 0;
    const count = this.delegationMetrics.get('delegation_count') || 0;
    this.delegationMetrics.set('avg_delegation_time', 
      (avgDelegationTime * count + result.delegationTime) / (count + 1));
    this.delegationMetrics.set('delegation_count', count + 1);
  }

  private calculateAverageWaitTime(): number {
    return this.delegationMetrics.get('avg_delegation_time') || 0;
  }

  private emitDelegationEvent(type: string, data: any): void {
    this.emit('delegation-event', {
      id: uuidv4(),
      type,
      source: 'task-delegator',
      timestamp: new Date(),
      data,
      severity: 'info' as EventSeverity,
      requiresResponse: false
    } as OrchestratorEvent);
  }

  private calculateAndEmitMetrics(): void {
    const metrics = this.getWorkloadMetrics();
    this.emit('metrics-updated', metrics);
  }
}

export default TaskDelegator;