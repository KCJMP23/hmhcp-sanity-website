/**
 * Cross-Agent Communication System
 * Healthcare AI Orchestrator - Inter-agent collaboration and coordination
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import HealthcareAILogger from '../logger';
import type {
  AgentInstance,
  WorkflowTask,
  TaskResult,
  SecurityContext,
  CollaborationMessage,
  MessageType,
  MessageContent,
  MessagePriority,
  ComplianceLevel,
  OrchestratorEvent,
  EventSeverity
} from '../../../types/ai/orchestrator';

export interface CommunicationOptions {
  redis: Redis;
  logger: HealthcareAILogger;
  enableEncryption: boolean;
  enableMessageQueue: boolean;
  maxMessageRetries: number;
  messageTimeout: number;
  enableConsensusBuilding: boolean;
  enableConflictResolution: boolean;
  healthcareComplianceMode: boolean;
}

export interface AgentCommunicationChannel {
  channelId: string;
  participantIds: Set<string>;
  channelType: 'direct' | 'group' | 'broadcast';
  securityLevel: SecurityLevel;
  messageHistory: CommunicationMessage[];
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  metadata: ChannelMetadata;
}

export interface CommunicationMessage extends CollaborationMessage {
  channelId: string;
  messageStatus: MessageStatus;
  acknowledgments: Map<string, Date>;
  retryCount: number;
  encryptedContent?: string;
  complianceValidated: boolean;
  routingPath: string[];
}

export interface ConsensusRequest {
  id: string;
  initiatorId: string;
  participantIds: string[];
  topic: string;
  options: ConsensusOption[];
  requiredAgreement: number; // 0.5 = majority, 1.0 = unanimous
  deadline: Date;
  currentVotes: Map<string, string>;
  status: 'active' | 'completed' | 'failed' | 'expired';
  result?: ConsensusResult;
  metadata: ConsensusMetadata;
}

export interface ConsensusOption {
  id: string;
  title: string;
  description: string;
  implications: string[];
  riskLevel: 'low' | 'medium' | 'high';
  complianceImpact: boolean;
}

export interface ConflictResolution {
  id: string;
  conflictType: 'resource' | 'priority' | 'approach' | 'compliance';
  involvedAgents: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolutionStrategy: ResolutionStrategy;
  mediatorId?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated';
  resolution?: ConflictOutcome;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface CollaborationSession {
  id: string;
  taskId: string;
  participantIds: string[];
  sessionType: 'problem_solving' | 'review' | 'decision_making' | 'knowledge_sharing';
  sharedContext: Map<string, unknown>;
  collaborationHistory: CollaborationEvent[];
  status: 'active' | 'paused' | 'completed' | 'terminated';
  healthcareContext: HealthcareCollaborationContext;
  outcomes: CollaborationOutcome[];
}

export interface HealthcareCollaborationContext {
  involvesPatientData: boolean;
  complianceLevel: ComplianceLevel;
  auditRequired: boolean;
  encryptionRequired: boolean;
  dataClassifications: string[];
  clinicalReviewRequired: boolean;
  ethicsReviewRequired: boolean;
}

export type SecurityLevel = 'public' | 'internal' | 'restricted' | 'confidential' | 'top_secret';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'acknowledged' | 'failed' | 'expired';
export type ResolutionStrategy = 'voting' | 'mediation' | 'hierarchy' | 'expert_decision' | 'escalation';

// Zod schemas for validation
const CommunicationMessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  recipientIds: z.array(z.string()),
  type: z.enum(['task-assignment', 'status-update', 'result-sharing', 'error-alert', 'coordination']),
  content: z.object({
    text: z.string().optional(),
    data: z.record(z.unknown()).optional(),
    attachments: z.array(z.any()).optional(),
    metadata: z.object({
      priority: z.enum(['low', 'normal', 'high', 'urgent']),
      requiresAck: z.boolean(),
      retryCount: z.number(),
      expiresAt: z.date().optional()
    })
  }),
  timestamp: z.date(),
  requiresResponse: z.boolean(),
  complianceLevel: z.enum(['public', 'internal', 'restricted', 'confidential'])
});

export class AgentCommunicationSystem extends EventEmitter {
  private readonly redis: Redis;
  private readonly logger: HealthcareAILogger;
  private readonly options: CommunicationOptions;
  
  private readonly channels = new Map<string, AgentCommunicationChannel>();
  private readonly messageQueue = new Map<string, CommunicationMessage>();
  private readonly consensusRequests = new Map<string, ConsensusRequest>();
  private readonly conflictResolutions = new Map<string, ConflictResolution>();
  private readonly collaborationSessions = new Map<string, CollaborationSession>();
  
  // Routing and delivery tracking
  private readonly messageRoutes = new Map<string, string[]>();
  private readonly deliveryTracking = new Map<string, Set<string>>();
  
  // Healthcare compliance tracking
  private readonly auditTrail = new Map<string, AuditEntry[]>();
  private readonly complianceViolations = new Map<string, ComplianceViolation[]>();

  constructor(options: CommunicationOptions) {
    super();
    this.redis = options.redis;
    this.logger = options.logger;
    this.options = options;

    this.setupMessageRouting();
    this.setupConsensusSystem();
    this.setupConflictResolution();
    this.startMaintenanceTasks();
  }

  /**
   * Send message between agents with healthcare compliance
   */
  async sendMessage(
    senderId: string,
    recipientIds: string[],
    content: MessageContent,
    type: MessageType,
    priority: MessagePriority = 'normal',
    complianceLevel: ComplianceLevel = 'internal'
  ): Promise<string> {
    const messageId = uuidv4();
    
    try {
      // Validate healthcare compliance
      await this.validateHealthcareCompliance(content, complianceLevel);
      
      // Create message
      const message: CommunicationMessage = {
        id: messageId,
        senderId,
        recipientIds,
        type,
        content,
        timestamp: new Date(),
        requiresResponse: type === 'task-assignment' || priority === 'urgent',
        complianceLevel,
        channelId: '', // Will be set during routing
        messageStatus: 'pending',
        acknowledgments: new Map(),
        retryCount: 0,
        complianceValidated: true,
        routingPath: []
      };

      // Validate message structure
      this.validateMessage(message);
      
      // Find or create communication channel
      const channelId = await this.getOrCreateChannel(senderId, recipientIds, complianceLevel);
      message.channelId = channelId;
      
      // Encrypt if required
      if (this.options.enableEncryption && complianceLevel !== 'public') {
        message.encryptedContent = await this.encryptMessageContent(content);
      }
      
      // Route and deliver message
      await this.routeMessage(message);
      
      // Add to audit trail if healthcare compliance is enabled
      if (this.options.healthcareComplianceMode) {
        await this.addToAuditTrail(messageId, {
          action: 'message_sent',
          agentId: senderId,
          timestamp: new Date(),
          details: {
            recipientCount: recipientIds.length,
            complianceLevel,
            type,
            priority
          }
        });
      }
      
      this.logger.info('Message sent successfully', { messageId, senderId, recipientCount: recipientIds.length });
      return messageId;
      
    } catch (error) {
      this.logger.error('Failed to send message', { messageId, senderId, error });
      throw error;
    }
  }

  /**
   * Acknowledge message receipt
   */
  async acknowledgeMessage(messageId: string, recipientId: string): Promise<void> {
    const channel = this.findChannelByMessage(messageId);
    if (!channel) {
      throw new Error(`Channel not found for message ${messageId}`);
    }
    
    const message = channel.messageHistory.find(msg => msg.id === messageId) as CommunicationMessage;
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }
    
    // Record acknowledgment
    message.acknowledgments.set(recipientId, new Date());
    message.messageStatus = 'acknowledged';
    
    // Update in Redis
    await this.updateMessageInRedis(message);
    
    // Emit acknowledgment event
    this.emit('message-acknowledged', {
      id: uuidv4(),
      type: 'message-acknowledged' as any,
      source: 'communication-system',
      timestamp: new Date(),
      data: { messageId, recipientId },
      severity: 'info' as EventSeverity,
      requiresResponse: false
    });
    
    this.logger.debug('Message acknowledged', { messageId, recipientId });
  }

  /**
   * Initiate consensus building process
   */
  async initiateConsensus(
    initiatorId: string,
    participantIds: string[],
    topic: string,
    options: ConsensusOption[],
    requiredAgreement: number = 0.51,
    deadline: Date
  ): Promise<string> {
    const consensusId = uuidv4();
    
    try {
      const consensusRequest: ConsensusRequest = {
        id: consensusId,
        initiatorId,
        participantIds,
        topic,
        options,
        requiredAgreement,
        deadline,
        currentVotes: new Map(),
        status: 'active',
        metadata: {
          createdAt: new Date(),
          healthcareContext: await this.extractHealthcareContext(topic),
          complianceChecks: [],
          riskAssessment: this.assessConsensusRisk(options)
        }
      };
      
      // Store consensus request
      this.consensusRequests.set(consensusId, consensusRequest);
      
      // Send consensus request to participants
      for (const participantId of participantIds) {
        await this.sendMessage(
          initiatorId,
          [participantId],
          {
            text: `Consensus request: ${topic}`,
            data: {
              consensusId,
              options: options.map(opt => ({
                id: opt.id,
                title: opt.title,
                description: opt.description
              })),
              deadline: deadline.toISOString(),
              requiredAgreement
            },
            metadata: {
              priority: 'high' as MessagePriority,
              requiresAck: true,
              retryCount: 0,
              expiresAt: deadline
            }
          },
          'coordination',
          'high',
          'restricted'
        );
      }
      
      // Set up consensus timeout
      setTimeout(() => {
        this.handleConsensusTimeout(consensusId);
      }, deadline.getTime() - Date.now());
      
      this.logger.info('Consensus initiated', { consensusId, participantCount: participantIds.length });
      return consensusId;
      
    } catch (error) {
      this.logger.error('Failed to initiate consensus', { consensusId, error });
      throw error;
    }
  }

  /**
   * Submit vote for consensus
   */
  async submitVote(consensusId: string, voterId: string, optionId: string): Promise<void> {
    const consensus = this.consensusRequests.get(consensusId);
    if (!consensus) {
      throw new Error(`Consensus ${consensusId} not found`);
    }
    
    if (consensus.status !== 'active') {
      throw new Error(`Consensus ${consensusId} is not active`);
    }
    
    if (!consensus.participantIds.includes(voterId)) {
      throw new Error(`Agent ${voterId} is not a participant in consensus ${consensusId}`);
    }
    
    if (!consensus.options.some(opt => opt.id === optionId)) {
      throw new Error(`Invalid option ${optionId} for consensus ${consensusId}`);
    }
    
    // Record vote
    consensus.currentVotes.set(voterId, optionId);
    
    // Check if consensus is reached
    const result = this.evaluateConsensus(consensus);
    if (result.consensusReached) {
      consensus.status = 'completed';
      consensus.result = result;
      
      // Notify all participants of consensus result
      await this.notifyConsensusResult(consensus);
    }
    
    this.logger.info('Vote submitted', { consensusId, voterId, optionId });
  }

  /**
   * Initiate conflict resolution process
   */
  async initiateConflictResolution(
    conflictType: 'resource' | 'priority' | 'approach' | 'compliance',
    involvedAgents: string[],
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<string> {
    const conflictId = uuidv4();
    
    const resolution: ConflictResolution = {
      id: conflictId,
      conflictType,
      involvedAgents,
      description,
      severity,
      resolutionStrategy: this.selectResolutionStrategy(conflictType, severity),
      status: 'pending',
      createdAt: new Date()
    };
    
    // Assign mediator if needed
    if (resolution.resolutionStrategy === 'mediation') {
      resolution.mediatorId = await this.selectMediator(involvedAgents);
    }
    
    this.conflictResolutions.set(conflictId, resolution);
    
    // Begin resolution process
    await this.beginConflictResolution(resolution);
    
    this.logger.info('Conflict resolution initiated', { conflictId, conflictType, severity });
    return conflictId;
  }

  /**
   * Start collaborative problem-solving session
   */
  async startCollaborationSession(
    taskId: string,
    participantIds: string[],
    sessionType: 'problem_solving' | 'review' | 'decision_making' | 'knowledge_sharing',
    healthcareContext: HealthcareCollaborationContext
  ): Promise<string> {
    const sessionId = uuidv4();
    
    const session: CollaborationSession = {
      id: sessionId,
      taskId,
      participantIds,
      sessionType,
      sharedContext: new Map(),
      collaborationHistory: [],
      status: 'active',
      healthcareContext,
      outcomes: []
    };
    
    this.collaborationSessions.set(sessionId, session);
    
    // Create dedicated communication channel for the session
    const channelId = await this.getOrCreateChannel(
      'system', 
      participantIds, 
      healthcareContext.complianceLevel
    );
    
    // Initialize session context
    await this.initializeSessionContext(session);
    
    // Notify participants
    for (const participantId of participantIds) {
      await this.sendMessage(
        'system',
        [participantId],
        {
          text: `Collaboration session started for task ${taskId}`,
          data: {
            sessionId,
            sessionType,
            healthcareContext,
            channelId
          },
          metadata: {
            priority: 'high' as MessagePriority,
            requiresAck: true,
            retryCount: 0
          }
        },
        'coordination',
        'high',
        healthcareContext.complianceLevel
      );
    }
    
    this.logger.info('Collaboration session started', { sessionId, participantCount: participantIds.length });
    return sessionId;
  }

  /**
   * Share context between agents in a collaboration session
   */
  async shareContext(
    sessionId: string,
    sharingAgentId: string,
    contextKey: string,
    contextData: unknown,
    accessControlList?: string[]
  ): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Collaboration session ${sessionId} not found`);
    }
    
    if (!session.participantIds.includes(sharingAgentId)) {
      throw new Error(`Agent ${sharingAgentId} is not a participant in session ${sessionId}`);
    }
    
    // Healthcare compliance check for context sharing
    if (session.healthcareContext.involvesPatientData) {
      await this.validateHealthcareDataSharing(contextData, session.healthcareContext);
    }
    
    // Store shared context
    session.sharedContext.set(contextKey, {
      data: contextData,
      sharedBy: sharingAgentId,
      sharedAt: new Date(),
      accessControlList: accessControlList || session.participantIds
    });
    
    // Record collaboration event
    session.collaborationHistory.push({
      id: uuidv4(),
      type: 'context_shared',
      agentId: sharingAgentId,
      timestamp: new Date(),
      data: { contextKey, hasAccessControl: !!accessControlList }
    });
    
    // Notify other participants
    const otherParticipants = session.participantIds.filter(id => id !== sharingAgentId);
    if (otherParticipants.length > 0) {
      await this.sendMessage(
        sharingAgentId,
        otherParticipants,
        {
          text: `Context shared: ${contextKey}`,
          data: { sessionId, contextKey },
          metadata: {
            priority: 'normal' as MessagePriority,
            requiresAck: false,
            retryCount: 0
          }
        },
        'coordination',
        'normal',
        session.healthcareContext.complianceLevel
      );
    }
    
    this.logger.info('Context shared in collaboration session', { sessionId, contextKey, sharingAgentId });
  }

  /**
   * Get collaboration session status
   */
  getCollaborationSession(sessionId: string): CollaborationSession | undefined {
    return this.collaborationSessions.get(sessionId);
  }

  /**
   * Get active consensus requests
   */
  getActiveConsensusRequests(participantId?: string): ConsensusRequest[] {
    return Array.from(this.consensusRequests.values())
      .filter(consensus => 
        consensus.status === 'active' && 
        (!participantId || consensus.participantIds.includes(participantId))
      );
  }

  /**
   * Get pending conflict resolutions
   */
  getPendingConflicts(agentId?: string): ConflictResolution[] {
    return Array.from(this.conflictResolutions.values())
      .filter(conflict => 
        (conflict.status === 'pending' || conflict.status === 'in_progress') &&
        (!agentId || conflict.involvedAgents.includes(agentId))
      );
  }

  // Private helper methods

  private async validateHealthcareCompliance(content: MessageContent, complianceLevel: ComplianceLevel): Promise<void> {
    if (!this.options.healthcareComplianceMode) return;
    
    // Check for PHI content
    if (content.data && this.containsPHI(content.data)) {
      if (complianceLevel === 'public' || complianceLevel === 'internal') {
        throw new Error('PHI content requires restricted or confidential compliance level');
      }
    }
    
    // Additional healthcare-specific validations would go here
  }

  private containsPHI(data: any): boolean {
    const phiKeywords = ['patient', 'medical_record', 'diagnosis', 'treatment', 'ssn', 'dob'];
    const dataString = JSON.stringify(data).toLowerCase();
    return phiKeywords.some(keyword => dataString.includes(keyword));
  }

  private validateMessage(message: CommunicationMessage): void {
    try {
      CommunicationMessageSchema.parse({
        ...message,
        content: {
          ...message.content,
          metadata: {
            priority: 'normal',
            requiresAck: message.requiresResponse,
            retryCount: message.retryCount
          }
        }
      });
    } catch (error) {
      throw new Error(`Message validation failed: ${error}`);
    }
  }

  private async getOrCreateChannel(
    initiatorId: string,
    participantIds: string[],
    securityLevel: SecurityLevel
  ): Promise<string> {
    // Try to find existing channel
    for (const [channelId, channel] of this.channels) {
      const allParticipants = [initiatorId, ...participantIds];
      if (channel.participantIds.size === allParticipants.length &&
          allParticipants.every(id => channel.participantIds.has(id))) {
        return channelId;
      }
    }
    
    // Create new channel
    const channelId = uuidv4();
    const channel: AgentCommunicationChannel = {
      channelId,
      participantIds: new Set([initiatorId, ...participantIds]),
      channelType: participantIds.length === 1 ? 'direct' : 'group',
      securityLevel,
      messageHistory: [],
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: {
        createdBy: initiatorId,
        purpose: 'agent_communication',
        retentionPolicy: securityLevel === 'confidential' ? 'long_term' : 'standard'
      }
    };
    
    this.channels.set(channelId, channel);
    return channelId;
  }

  private async routeMessage(message: CommunicationMessage): Promise<void> {
    // Add to message queue if enabled
    if (this.options.enableMessageQueue) {
      this.messageQueue.set(message.id, message);
    }
    
    // Add to channel history
    const channel = this.channels.get(message.channelId);
    if (channel) {
      channel.messageHistory.push(message as CollaborationMessage);
      channel.lastActivity = new Date();
    }
    
    // Deliver to recipients
    for (const recipientId of message.recipientIds) {
      await this.deliverMessage(message, recipientId);
    }
    
    message.messageStatus = 'sent';
  }

  private async deliverMessage(message: CommunicationMessage, recipientId: string): Promise<void> {
    try {
      // Store in Redis for recipient pickup
      const key = `agent_messages:${recipientId}`;
      await this.redis.lpush(key, JSON.stringify(message));
      await this.redis.expire(key, 86400); // 24-hour expiry
      
      // Track delivery
      if (!this.deliveryTracking.has(message.id)) {
        this.deliveryTracking.set(message.id, new Set());
      }
      this.deliveryTracking.get(message.id)!.add(recipientId);
      
      // Emit delivery event
      this.emit('message-delivered', {
        messageId: message.id,
        recipientId,
        timestamp: new Date()
      });
      
    } catch (error) {
      this.logger.error('Failed to deliver message', { messageId: message.id, recipientId, error });
      message.messageStatus = 'failed';
    }
  }

  private findChannelByMessage(messageId: string): AgentCommunicationChannel | undefined {
    for (const channel of this.channels.values()) {
      if (channel.messageHistory.some(msg => msg.id === messageId)) {
        return channel;
      }
    }
    return undefined;
  }

  private async encryptMessageContent(content: MessageContent): Promise<string> {
    // Placeholder for encryption implementation
    // In a real implementation, this would use proper encryption
    return Buffer.from(JSON.stringify(content)).toString('base64');
  }

  private async updateMessageInRedis(message: CommunicationMessage): Promise<void> {
    const key = `message:${message.id}`;
    await this.redis.setex(key, 86400, JSON.stringify(message));
  }

  private evaluateConsensus(consensus: ConsensusRequest): ConsensusResult {
    const voteCount = consensus.currentVotes.size;
    const totalParticipants = consensus.participantIds.length;
    const participationRate = voteCount / totalParticipants;
    
    // Count votes for each option
    const optionVotes = new Map<string, number>();
    for (const optionId of consensus.currentVotes.values()) {
      optionVotes.set(optionId, (optionVotes.get(optionId) || 0) + 1);
    }
    
    // Find winning option
    let winningOption: string | null = null;
    let maxVotes = 0;
    
    for (const [optionId, votes] of optionVotes) {
      if (votes > maxVotes) {
        maxVotes = votes;
        winningOption = optionId;
      }
    }
    
    const agreementRate = winningOption ? (optionVotes.get(winningOption) || 0) / voteCount : 0;
    const consensusReached = agreementRate >= consensus.requiredAgreement && participationRate >= 0.7;
    
    return {
      consensusReached,
      winningOption,
      agreementRate,
      participationRate,
      voteDistribution: optionVotes,
      completedAt: new Date()
    };
  }

  private async notifyConsensusResult(consensus: ConsensusRequest): Promise<void> {
    const result = consensus.result!;
    
    for (const participantId of consensus.participantIds) {
      await this.sendMessage(
        'system',
        [participantId],
        {
          text: `Consensus reached for: ${consensus.topic}`,
          data: {
            consensusId: consensus.id,
            result: {
              winningOption: result.winningOption,
              agreementRate: result.agreementRate
            }
          },
          metadata: {
            priority: 'high' as MessagePriority,
            requiresAck: true,
            retryCount: 0
          }
        },
        'coordination',
        'high',
        'restricted'
      );
    }
  }

  private selectResolutionStrategy(
    conflictType: string,
    severity: string
  ): ResolutionStrategy {
    if (severity === 'critical') return 'escalation';
    if (conflictType === 'compliance') return 'expert_decision';
    if (conflictType === 'resource') return 'mediation';
    return 'voting';
  }

  private async selectMediator(involvedAgents: string[]): Promise<string> {
    // Placeholder implementation - would select based on agent capabilities and neutrality
    return 'mediator_agent_01';
  }

  private async beginConflictResolution(resolution: ConflictResolution): Promise<void> {
    resolution.status = 'in_progress';
    
    // Implementation would depend on resolution strategy
    switch (resolution.resolutionStrategy) {
      case 'voting':
        await this.initiateVotingResolution(resolution);
        break;
      case 'mediation':
        await this.initiateMediationResolution(resolution);
        break;
      case 'escalation':
        await this.escalateConflict(resolution);
        break;
      default:
        this.logger.warn('Unknown resolution strategy', { strategy: resolution.resolutionStrategy });
    }
  }

  private async initiateVotingResolution(resolution: ConflictResolution): Promise<void> {
    // Implementation for voting-based conflict resolution
    this.logger.info('Voting resolution initiated', { conflictId: resolution.id });
  }

  private async initiateMediationResolution(resolution: ConflictResolution): Promise<void> {
    // Implementation for mediation-based conflict resolution
    this.logger.info('Mediation resolution initiated', { conflictId: resolution.id });
  }

  private async escalateConflict(resolution: ConflictResolution): Promise<void> {
    // Implementation for conflict escalation
    this.logger.error('Conflict escalated', { conflictId: resolution.id });
  }

  private async initializeSessionContext(session: CollaborationSession): Promise<void> {
    // Initialize shared context based on session type and healthcare requirements
    session.sharedContext.set('session_metadata', {
      startTime: new Date(),
      sessionType: session.sessionType,
      healthcareContext: session.healthcareContext
    });
  }

  private async validateHealthcareDataSharing(
    data: unknown,
    healthcareContext: HealthcareCollaborationContext
  ): Promise<void> {
    if (healthcareContext.involvesPatientData && !healthcareContext.encryptionRequired) {
      throw new Error('Patient data sharing requires encryption');
    }
    
    if (healthcareContext.clinicalReviewRequired) {
      // Additional validations for clinical data
    }
  }

  private async extractHealthcareContext(topic: string): Promise<any> {
    // Extract healthcare-specific context from consensus topic
    return {
      involvesPatientData: topic.toLowerCase().includes('patient'),
      requiresCompliance: true
    };
  }

  private assessConsensusRisk(options: ConsensusOption[]): string {
    const highRiskOptions = options.filter(opt => opt.riskLevel === 'high').length;
    return highRiskOptions > 0 ? 'high' : 'medium';
  }

  private async addToAuditTrail(messageId: string, entry: AuditEntry): Promise<void> {
    if (!this.auditTrail.has(messageId)) {
      this.auditTrail.set(messageId, []);
    }
    this.auditTrail.get(messageId)!.push(entry);
    
    // Store in Redis for persistence
    const key = `audit:${messageId}`;
    await this.redis.lpush(key, JSON.stringify(entry));
    await this.redis.expire(key, 2592000); // 30-day retention
  }

  private handleConsensusTimeout(consensusId: string): void {
    const consensus = this.consensusRequests.get(consensusId);
    if (consensus && consensus.status === 'active') {
      consensus.status = 'expired';
      this.logger.warn('Consensus expired due to timeout', { consensusId });
    }
  }

  private setupMessageRouting(): void {
    // Set up Redis pub/sub for message routing
    this.redis.subscribe('agent-communication', (err) => {
      if (err) {
        this.logger.error('Failed to subscribe to communication channel', err);
      }
    });
  }

  private setupConsensusSystem(): void {
    // Initialize consensus tracking
    this.logger.info('Consensus system initialized');
  }

  private setupConflictResolution(): void {
    // Initialize conflict resolution system
    this.logger.info('Conflict resolution system initialized');
  }

  private startMaintenanceTasks(): void {
    // Clean up expired messages and sessions
    setInterval(() => {
      this.performMaintenance();
    }, 300000); // Every 5 minutes
  }

  private performMaintenance(): void {
    // Clean up expired consensus requests
    for (const [id, consensus] of this.consensusRequests) {
      if (consensus.deadline < new Date() && consensus.status === 'active') {
        consensus.status = 'expired';
        this.logger.info('Consensus expired during maintenance', { consensusId: id });
      }
    }
    
    // Clean up old messages from channels
    for (const channel of this.channels.values()) {
      const cutoff = new Date(Date.now() - 86400000); // 24 hours ago
      channel.messageHistory = channel.messageHistory.filter(msg => msg.timestamp > cutoff);
    }
  }
}

// Supporting interfaces
interface ConsensusResult {
  consensusReached: boolean;
  winningOption: string | null;
  agreementRate: number;
  participationRate: number;
  voteDistribution: Map<string, number>;
  completedAt: Date;
}

interface ConsensusMetadata {
  createdAt: Date;
  healthcareContext: any;
  complianceChecks: string[];
  riskAssessment: string;
}

interface ConflictOutcome {
  resolution: string;
  agreedBy: string[];
  implementationPlan: string[];
  monitoringRequired: boolean;
}

interface CollaborationEvent {
  id: string;
  type: string;
  agentId: string;
  timestamp: Date;
  data: any;
}

interface CollaborationOutcome {
  type: 'decision' | 'solution' | 'recommendation';
  description: string;
  contributors: string[];
  confidence: number;
  implementationRequired: boolean;
}

interface ChannelMetadata {
  createdBy: string;
  purpose: string;
  retentionPolicy: string;
}

interface AuditEntry {
  action: string;
  agentId: string;
  timestamp: Date;
  details: any;
}

interface ComplianceViolation {
  type: string;
  description: string;
  severity: string;
  timestamp: Date;
}

export default AgentCommunicationSystem;