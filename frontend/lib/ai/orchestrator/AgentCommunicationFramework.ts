/**
 * Agent Communication Framework
 * Microsoft Copilot-inspired inter-agent messaging and coordination
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AuditLogger } from '@/lib/security/audit-logging';

// Communication message types
export enum MessageType {
  TASK_DELEGATION = 'task_delegation',
  STATUS_UPDATE = 'status_update',
  RESULT_SHARING = 'result_sharing',
  ERROR_ALERT = 'error_alert',
  COORDINATION = 'coordination',
  CONTEXT_REQUEST = 'context_request',
  CONTEXT_RESPONSE = 'context_response',
  COLLABORATION_INVITE = 'collaboration_invite',
  COLLABORATION_ACCEPT = 'collaboration_accept',
  COLLABORATION_REJECT = 'collaboration_reject',
  HEARTBEAT = 'heartbeat',
  CAPABILITY_ANNOUNCEMENT = 'capability_announcement',
  WORKFLOW_SYNC = 'workflow_sync'
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  ACKNOWLEDGED = 'acknowledged',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export interface AgentMessage {
  id: string;
  type: MessageType;
  priority: MessagePriority;
  senderId: string;
  recipientIds: string[];
  content: MessageContent;
  metadata: MessageMetadata;
  status: MessageStatus;
  createdAt: Date;
  deliveredAt?: Date;
  acknowledgedAt?: Date;
  expiresAt?: Date;
  retryCount: number;
  maxRetries: number;
}

export interface MessageContent {
  text?: string;
  data?: Record<string, any>;
  attachments?: MessageAttachment[];
  context?: Record<string, any>;
  workflowId?: string;
  taskId?: string;
  requiresResponse?: boolean;
  responseTimeout?: number;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64 encoded
  encrypted: boolean;
  checksum: string;
}

export interface MessageMetadata {
  sessionId?: string;
  workflowId?: string;
  taskId?: string;
  complianceLevel: ComplianceLevel;
  encryptionRequired: boolean;
  auditRequired: boolean;
  correlationId?: string;
  parentMessageId?: string;
  threadId?: string;
}

export enum ComplianceLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  RESTRICTED = 'restricted',
  CONFIDENTIAL = 'confidential'
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
  healthcareSpecialized: boolean;
  hipaaCompliant: boolean;
  maxConcurrentTasks: number;
  currentLoad: number;
  lastUpdated: Date;
}

export interface CollaborationSession {
  id: string;
  participants: string[];
  workflowId: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  createdAt: Date;
  lastActivity: Date;
  sharedContext: Record<string, any>;
  permissions: Map<string, string[]>;
}

export interface CommunicationConfig {
  redis: Redis;
  supabase: any;
  messageTtl: number;
  maxRetries: number;
  retryDelay: number;
  heartbeatInterval: number;
  enableEncryption: boolean;
  enableAuditLogging: boolean;
  maxMessageSize: number;
  enableCompression: boolean;
}

/**
 * Enhanced Agent Communication Framework
 */
export class AgentCommunicationFramework extends EventEmitter {
  private readonly redis: Redis;
  private readonly supabase: any;
  private readonly auditLogger: AuditLogger;
  private readonly config: CommunicationConfig;
  
  private readonly messageQueue = new Map<string, AgentMessage>();
  private readonly activeSessions = new Map<string, CollaborationSession>();
  private readonly agentCapabilities = new Map<string, AgentCapability[]>();
  private readonly messageThreads = new Map<string, string[]>();
  
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageProcessorTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: CommunicationConfig) {
    super();
    this.redis = config.redis;
    this.supabase = config.supabase;
    this.config = config;
    this.auditLogger = new AuditLogger(this.supabase);

    this.startTimers();
    this.setupRedisSubscriptions();
    this.setupEventHandlers();
  }

  /**
   * Send a message to one or more agents
   */
  async sendMessage(
    senderId: string,
    recipientIds: string[],
    type: MessageType,
    content: MessageContent,
    options: {
      priority?: MessagePriority;
      requiresResponse?: boolean;
      responseTimeout?: number;
      complianceLevel?: ComplianceLevel;
      workflowId?: string;
      taskId?: string;
      correlationId?: string;
      parentMessageId?: string;
    } = {}
  ): Promise<string> {
    const messageId = uuidv4();
    const now = new Date();
    
    const message: AgentMessage = {
      id: messageId,
      type,
      priority: options.priority || MessagePriority.NORMAL,
      senderId,
      recipientIds,
      content: {
        ...content,
        requiresResponse: options.requiresResponse || false,
        responseTimeout: options.responseTimeout || 30000
      },
      metadata: {
        complianceLevel: options.complianceLevel || ComplianceLevel.INTERNAL,
        encryptionRequired: this.config.enableEncryption,
        auditRequired: this.config.enableAuditLogging,
        correlationId: options.correlationId,
        parentMessageId: options.parentMessageId,
        threadId: options.parentMessageId ? this.getMessageThreadId(options.parentMessageId) : messageId,
        sessionId: content.context?.sessionId,
        workflowId: options.workflowId || content.workflowId,
        taskId: options.taskId || content.taskId
      },
      status: MessageStatus.PENDING,
      createdAt: now,
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };

    try {
      // Validate message
      await this.validateMessage(message);

      // Store message
      this.messageQueue.set(messageId, message);

      // Process message
      await this.processMessage(message);

      // Audit logging
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logActivity({
          action: 'message_sent',
          resource_type: 'agent_message',
          resource_id: messageId,
          details: {
            senderId,
            recipientCount: recipientIds.length,
            messageType: type,
            priority: message.priority,
            complianceLevel: message.metadata.complianceLevel
          }
        });
      }

      // Emit event
      this.emit('message-sent', { messageId, senderId, recipientIds, type });

      logger.info('Message sent successfully', {
        messageId,
        senderId,
        recipientCount: recipientIds.length,
        type,
        priority: message.priority
      });

      return messageId;
    } catch (error) {
      logger.error('Failed to send message', { messageId, senderId, error });
      throw error;
    }
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcastMessage(
    senderId: string,
    type: MessageType,
    content: MessageContent,
    options: {
      priority?: MessagePriority;
      complianceLevel?: ComplianceLevel;
      excludeAgents?: string[];
    } = {}
  ): Promise<string[]> {
    try {
      // Get all active agents
      const allAgents = await this.getActiveAgents();
      const recipientIds = allAgents
        .filter(agentId => agentId !== senderId && !options.excludeAgents?.includes(agentId));

      const messageIds: string[] = [];

      // Send to each agent
      for (const recipientId of recipientIds) {
        try {
          const messageId = await this.sendMessage(
            senderId,
            [recipientId],
            type,
            content,
            options
          );
          messageIds.push(messageId);
        } catch (error) {
          logger.error('Failed to send broadcast message to agent', { recipientId, error });
        }
      }

      logger.info('Broadcast message sent', {
        senderId,
        recipientCount: recipientIds.length,
        messageIds: messageIds.length,
        type
      });

      return messageIds;
    } catch (error) {
      logger.error('Failed to broadcast message', { senderId, error });
      throw error;
    }
  }

  /**
   * Send a response to a message
   */
  async sendResponse(
    originalMessageId: string,
    senderId: string,
    content: MessageContent,
    options: {
      priority?: MessagePriority;
      complianceLevel?: ComplianceLevel;
    } = {}
  ): Promise<string> {
    const originalMessage = this.messageQueue.get(originalMessageId);
    if (!originalMessage) {
      throw new Error(`Original message ${originalMessageId} not found`);
    }

    return this.sendMessage(
      senderId,
      [originalMessage.senderId],
      MessageType.RESULT_SHARING,
      content,
      {
        ...options,
        parentMessageId: originalMessageId,
        correlationId: originalMessage.metadata.correlationId
      }
    );
  }

  /**
   * Create a collaboration session
   */
  async createCollaborationSession(
    initiatorId: string,
    participantIds: string[],
    workflowId: string,
    permissions: Map<string, string[]> = new Map()
  ): Promise<string> {
    const sessionId = uuidv4();
    const now = new Date();

    const session: CollaborationSession = {
      id: sessionId,
      participants: [initiatorId, ...participantIds],
      workflowId,
      status: 'active',
      createdAt: now,
      lastActivity: now,
      sharedContext: {},
      permissions
    };

    try {
      // Store session
      this.activeSessions.set(sessionId, session);

      // Send collaboration invites
      for (const participantId of participantIds) {
        await this.sendMessage(
          initiatorId,
          [participantId],
          MessageType.COLLABORATION_INVITE,
          {
            text: `Collaboration session created for workflow ${workflowId}`,
            data: { sessionId, workflowId, initiatorId },
            workflowId
          },
          {
            priority: MessagePriority.HIGH,
            complianceLevel: ComplianceLevel.INTERNAL
          }
        );
      }

      // Audit logging
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logActivity({
          action: 'collaboration_session_created',
          resource_type: 'collaboration_session',
          resource_id: sessionId,
          details: {
            initiatorId,
            participantCount: participantIds.length,
            workflowId
          }
        });
      }

      // Emit event
      this.emit('collaboration-session-created', { sessionId, initiatorId, participantIds, workflowId });

      logger.info('Collaboration session created', {
        sessionId,
        initiatorId,
        participantCount: participantIds.length,
        workflowId
      });

      return sessionId;
    } catch (error) {
      logger.error('Failed to create collaboration session', { sessionId, initiatorId, error });
      throw error;
    }
  }

  /**
   * Join a collaboration session
   */
  async joinCollaborationSession(
    agentId: string,
    sessionId: string
  ): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    if (!session.participants.includes(agentId)) {
      session.participants.push(agentId);
    }

    session.lastActivity = new Date();

    // Notify other participants
    await this.broadcastMessage(
      agentId,
      MessageType.COLLABORATION_ACCEPT,
      {
        text: `Agent ${agentId} joined collaboration session`,
        data: { sessionId, agentId }
      },
      {
        priority: MessagePriority.NORMAL,
        excludeAgents: [agentId]
      }
    );

    // Emit event
    this.emit('agent-joined-collaboration', { sessionId, agentId });

    return true;
  }

  /**
   * Update agent capabilities
   */
  async updateAgentCapabilities(
    agentId: string,
    capabilities: AgentCapability[]
  ): Promise<void> {
    this.agentCapabilities.set(agentId, capabilities);

    // Announce capabilities to other agents
    await this.broadcastMessage(
      agentId,
      MessageType.CAPABILITY_ANNOUNCEMENT,
      {
        text: `Agent ${agentId} updated capabilities`,
        data: { agentId, capabilities }
      },
      {
        priority: MessagePriority.LOW,
        complianceLevel: ComplianceLevel.INTERNAL
      }
    );

    // Emit event
    this.emit('agent-capabilities-updated', { agentId, capabilities });
  }

  /**
   * Get agent capabilities
   */
  getAgentCapabilities(agentId: string): AgentCapability[] {
    return this.agentCapabilities.get(agentId) || [];
  }

  /**
   * Find agents with specific capabilities
   */
  findAgentsWithCapability(capabilityName: string): string[] {
    const agents: string[] = [];
    
    for (const [agentId, capabilities] of this.agentCapabilities) {
      if (capabilities.some(cap => cap.name === capabilityName)) {
        agents.push(agentId);
      }
    }
    
    return agents;
  }

  /**
   * Get collaboration session
   */
  getCollaborationSession(sessionId: string): CollaborationSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get active collaboration sessions for an agent
   */
  getAgentCollaborationSessions(agentId: string): CollaborationSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.participants.includes(agentId));
  }

  /**
   * Get communication statistics
   */
  getCommunicationStats(): {
    totalMessages: number;
    messagesByType: Record<MessageType, number>;
    messagesByStatus: Record<MessageStatus, number>;
    activeSessions: number;
    registeredAgents: number;
    averageResponseTime: number;
  } {
    const messages = Array.from(this.messageQueue.values());
    
    const messagesByType: Record<MessageType, number> = {} as any;
    const messagesByStatus: Record<MessageStatus, number> = {} as any;
    
    for (const message of messages) {
      messagesByType[message.type] = (messagesByType[message.type] || 0) + 1;
      messagesByStatus[message.status] = (messagesByStatus[message.status] || 0) + 1;
    }

    return {
      totalMessages: messages.length,
      messagesByType,
      messagesByStatus,
      activeSessions: this.activeSessions.size,
      registeredAgents: this.agentCapabilities.size,
      averageResponseTime: 0 // Would calculate from message timestamps
    };
  }

  // Private helper methods
  private async validateMessage(message: AgentMessage): Promise<void> {
    // Validate message size
    const messageSize = JSON.stringify(message).length;
    if (messageSize > this.config.maxMessageSize) {
      throw new Error(`Message size ${messageSize} exceeds maximum ${this.config.maxMessageSize}`);
    }

    // Validate recipients
    if (message.recipientIds.length === 0) {
      throw new Error('Message must have at least one recipient');
    }

    // Validate compliance requirements
    if (message.metadata.complianceLevel === ComplianceLevel.CONFIDENTIAL && !message.metadata.encryptionRequired) {
      throw new Error('Confidential messages must be encrypted');
    }
  }

  private async processMessage(message: AgentMessage): Promise<void> {
    try {
      // Store in Redis for distributed processing
      await this.redis.setex(
        `message:${message.id}`,
        this.config.messageTtl,
        JSON.stringify(message)
      );

      // Update status
      message.status = MessageStatus.SENT;
      message.deliveredAt = new Date();

      // Store in local queue
      this.messageQueue.set(message.id, message);

      // Emit to Redis channel for other instances
      await this.redis.publish('agent-messages', JSON.stringify({
        type: 'message-sent',
        messageId: message.id,
        senderId: message.senderId,
        recipientIds: message.recipientIds
      }));

    } catch (error) {
      message.status = MessageStatus.FAILED;
      logger.error('Failed to process message', { messageId: message.id, error });
      throw error;
    }
  }

  private getMessageThreadId(parentMessageId: string): string {
    const thread = this.messageThreads.get(parentMessageId);
    if (thread) {
      return thread[0];
    }
    
    const threadId = uuidv4();
    this.messageThreads.set(parentMessageId, [threadId]);
    return threadId;
  }

  private async getActiveAgents(): Promise<string[]> {
    // This would typically query the agent registry
    // For now, return agents from capabilities map
    return Array.from(this.agentCapabilities.keys());
  }

  private startTimers(): void {
    // Heartbeat timer
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeats();
    }, this.config.heartbeatInterval);

    // Message processor timer
    this.messageProcessorTimer = setInterval(() => {
      this.processMessageQueue();
    }, 1000);

    // Cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredMessages();
    }, 60000); // 1 minute
  }

  private async sendHeartbeats(): Promise<void> {
    const activeAgents = await this.getActiveAgents();
    
    for (const agentId of activeAgents) {
      try {
        await this.sendMessage(
          'system',
          [agentId],
          MessageType.HEARTBEAT,
          { text: 'Heartbeat' },
          { priority: MessagePriority.LOW }
        );
      } catch (error) {
        logger.error('Failed to send heartbeat', { agentId, error });
      }
    }
  }

  private processMessageQueue(): void {
    // Process pending messages
    for (const [messageId, message] of this.messageQueue) {
      if (message.status === MessageStatus.PENDING) {
        this.processMessage(message).catch(error => {
          logger.error('Failed to process queued message', { messageId, error });
        });
      }
    }
  }

  private cleanupExpiredMessages(): void {
    const now = new Date();
    const expiredIds: string[] = [];
    
    for (const [messageId, message] of this.messageQueue) {
      if (message.expiresAt && message.expiresAt < now) {
        message.status = MessageStatus.EXPIRED;
        expiredIds.push(messageId);
      }
    }
    
    // Remove expired messages
    for (const messageId of expiredIds) {
      this.messageQueue.delete(messageId);
    }
    
    if (expiredIds.length > 0) {
      logger.info('Cleaned up expired messages', { count: expiredIds.length });
    }
  }

  private setupRedisSubscriptions(): void {
    this.redis.subscribe('agent-messages', (err) => {
      if (err) {
        logger.error('Failed to subscribe to agent messages channel', { error: err });
      }
    });

    this.redis.on('message', (channel, message) => {
      if (channel === 'agent-messages') {
        try {
          const data = JSON.parse(message);
          this.handleRedisMessage(data);
        } catch (error) {
          logger.error('Failed to parse Redis message', { error });
        }
      }
    });
  }

  private handleRedisMessage(data: any): void {
    switch (data.type) {
      case 'message-sent':
        this.emit('message-received', data);
        break;
      case 'agent-status-changed':
        this.emit('agent-status-changed', data);
        break;
      default:
        logger.debug('Unknown Redis message type', { type: data.type });
    }
  }

  private setupEventHandlers(): void {
    this.on('message-sent', (data) => {
      logger.debug('Message sent event', data);
    });
    
    this.on('message-received', (data) => {
      logger.debug('Message received event', data);
    });
    
    this.on('collaboration-session-created', (data) => {
      logger.debug('Collaboration session created event', data);
    });
    
    this.on('agent-joined-collaboration', (data) => {
      logger.debug('Agent joined collaboration event', data);
    });
  }

  /**
   * Shutdown the communication framework
   */
  async shutdown(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.messageProcessorTimer) {
      clearInterval(this.messageProcessorTimer);
      this.messageProcessorTimer = null;
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.removeAllListeners();
    logger.info('Agent Communication Framework shutdown complete');
  }
}

export default AgentCommunicationFramework;
