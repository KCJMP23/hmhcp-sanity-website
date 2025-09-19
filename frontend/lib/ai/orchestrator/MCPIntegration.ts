/**
 * MCP (Model Context Protocol) Integration
 * Microsoft Copilot-inspired context protocol for AI orchestration
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import { AuditLogger } from '@/lib/security/audit-logging';

// MCP Protocol Types
export interface MCPMessage {
  id: string;
  type: MCPMessageType;
  source: string;
  target: string;
  payload: MCPPayload;
  metadata: MCPMetadata;
  timestamp: Date;
  correlationId?: string;
  replyTo?: string;
}

export enum MCPMessageType {
  CONTEXT_REQUEST = 'context_request',
  CONTEXT_RESPONSE = 'context_response',
  CONTEXT_UPDATE = 'context_update',
  CONTEXT_SYNC = 'context_sync',
  CAPABILITY_QUERY = 'capability_query',
  CAPABILITY_RESPONSE = 'capability_response',
  RESOURCE_REQUEST = 'resource_request',
  RESOURCE_RESPONSE = 'resource_response',
  WORKFLOW_SYNC = 'workflow_sync',
  AGENT_STATUS = 'agent_status',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error'
}

export interface MCPPayload {
  action: string;
  data: Record<string, any>;
  context?: MCPContext;
  resources?: MCPResource[];
  capabilities?: MCPCapability[];
  constraints?: MCPConstraints;
}

export interface MCPContext {
  sessionId: string;
  workflowId?: string;
  taskId?: string;
  agentId?: string;
  userId?: string;
  environment: 'development' | 'staging' | 'production';
  complianceLevel: ComplianceLevel;
  securityContext: SecurityContext;
  sharedState: Record<string, any>;
  memoryReferences: string[];
  temporalContext: TemporalContext;
}

export interface MCPResource {
  id: string;
  type: ResourceType;
  name: string;
  description?: string;
  uri: string;
  metadata: Record<string, any>;
  permissions: ResourcePermission[];
  constraints: ResourceConstraints;
  version: string;
  lastModified: Date;
  checksum: string;
}

export enum ResourceType {
  MEMORY = 'memory',
  KNOWLEDGE_BASE = 'knowledge_base',
  DATABASE = 'database',
  API = 'api',
  FILE = 'file',
  WORKFLOW = 'workflow',
  AGENT = 'agent',
  CONTEXT_POOL = 'context_pool',
  CUSTOM = 'custom'
}

export interface MCPCapability {
  id: string;
  name: string;
  description: string;
  version: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  constraints: CapabilityConstraints;
  metadata: Record<string, any>;
  provider: string;
  lastUpdated: Date;
}

export interface MCPConstraints {
  maxResponseTime: number;
  maxDataSize: number;
  requiredPermissions: string[];
  complianceRequirements: string[];
  securityLevel: SecurityLevel;
  dataRetention: number;
  auditRequired: boolean;
}

export interface MCPMetadata {
  version: string;
  protocol: 'MCP';
  encoding: 'json' | 'msgpack' | 'protobuf';
  compression: boolean;
  encryption: boolean;
  priority: MessagePriority;
  ttl: number;
  retryCount: number;
  maxRetries: number;
}

export enum ComplianceLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  RESTRICTED = 'restricted',
  CONFIDENTIAL = 'confidential'
}

export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export interface SecurityContext {
  userId?: string;
  sessionId: string;
  permissions: string[];
  dataClassifications: string[];
  encryptionLevel: string;
  auditRequired: boolean;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface TemporalContext {
  createdAt: Date;
  lastAccessed: Date;
  expiresAt?: Date;
  timezone: string;
  businessHours: BusinessHours;
  urgency: UrgencyLevel;
}

export interface BusinessHours {
  start: string;
  end: string;
  days: number[];
  timezone: string;
}

export enum UrgencyLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export interface ResourcePermission {
  action: string;
  resource: string;
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  type: string;
  value: string;
  operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than';
}

export interface ResourceConstraints {
  maxSize: number;
  allowedFormats: string[];
  requiredEncryption: boolean;
  auditRequired: boolean;
  retentionPeriod: number;
}

export interface CapabilityConstraints {
  maxConcurrentRequests: number;
  rateLimit: number;
  timeout: number;
  requiredPermissions: string[];
  complianceRequirements: string[];
}

export interface MCPIntegrationConfig {
  redis: Redis;
  supabase: any;
  enableEncryption: boolean;
  enableCompression: boolean;
  enableAuditLogging: boolean;
  defaultTtl: number;
  maxMessageSize: number;
  heartbeatInterval: number;
  syncInterval: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * MCP Integration for Healthcare AI Orchestration
 */
export class MCPIntegration extends EventEmitter {
  private readonly redis: Redis;
  private readonly supabase: any;
  private readonly auditLogger: AuditLogger;
  private readonly config: MCPIntegrationConfig;
  
  private readonly messageQueue = new Map<string, MCPMessage>();
  private readonly contextCache = new Map<string, MCPContext>();
  private readonly resourceRegistry = new Map<string, MCPResource>();
  private readonly capabilityRegistry = new Map<string, MCPCapability>();
  private readonly activeSessions = new Map<string, Set<string>>();
  
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: MCPIntegrationConfig) {
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
   * Send MCP message
   */
  async sendMessage(
    source: string,
    target: string,
    type: MCPMessageType,
    payload: MCPPayload,
    options: {
      priority?: MessagePriority;
      ttl?: number;
      correlationId?: string;
      replyTo?: string;
      context?: Partial<MCPContext>;
    } = {}
  ): Promise<string> {
    const messageId = uuidv4();
    const now = new Date();

    const message: MCPMessage = {
      id: messageId,
      type,
      source,
      target,
      payload,
      metadata: {
        version: '1.0',
        protocol: 'MCP',
        encoding: 'json',
        compression: this.config.enableCompression,
        encryption: this.config.enableEncryption,
        priority: options.priority || MessagePriority.NORMAL,
        ttl: options.ttl || this.config.defaultTtl,
        retryCount: 0,
        maxRetries: this.config.retryAttempts
      },
      timestamp: now,
      correlationId: options.correlationId,
      replyTo: options.replyTo
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
          action: 'mcp_message_sent',
          resource_type: 'mcp_message',
          resource_id: messageId,
          details: {
            source,
            target,
            type,
            priority: message.metadata.priority,
            correlationId: options.correlationId
          }
        });
      }

      // Emit event
      this.emit('message-sent', { messageId, source, target, type });

      logger.info('MCP message sent', {
        messageId,
        source,
        target,
        type,
        priority: message.metadata.priority
      });

      return messageId;
    } catch (error) {
      logger.error('Failed to send MCP message', { messageId, source, target, error });
      throw error;
    }
  }

  /**
   * Request context from another agent
   */
  async requestContext(
    source: string,
    target: string,
    contextQuery: {
      sessionId: string;
      workflowId?: string;
      taskId?: string;
      contextTypes?: string[];
      maxResults?: number;
      includeMetadata?: boolean;
    },
    options: {
      priority?: MessagePriority;
      timeout?: number;
    } = {}
  ): Promise<string> {
    const payload: MCPPayload = {
      action: 'request_context',
      data: contextQuery,
      context: {
        sessionId: contextQuery.sessionId,
        workflowId: contextQuery.workflowId,
        taskId: contextQuery.taskId,
        agentId: source,
        environment: 'production',
        complianceLevel: ComplianceLevel.INTERNAL,
        securityContext: {
          sessionId: contextQuery.sessionId,
          permissions: [],
          dataClassifications: ['internal'],
          encryptionLevel: 'standard',
          auditRequired: true,
          timestamp: new Date()
        },
        sharedState: {},
        memoryReferences: [],
        temporalContext: {
          createdAt: new Date(),
          lastAccessed: new Date(),
          timezone: 'UTC',
          businessHours: {
            start: '09:00',
            end: '17:00',
            days: [1, 2, 3, 4, 5],
            timezone: 'UTC'
          },
          urgency: UrgencyLevel.NORMAL
        }
      }
    };

    return this.sendMessage(
      source,
      target,
      MCPMessageType.CONTEXT_REQUEST,
      payload,
      {
        priority: options.priority || MessagePriority.HIGH,
        ttl: options.timeout || 30000,
        correlationId: uuidv4()
      }
    );
  }

  /**
   * Sync context with other agents
   */
  async syncContext(
    source: string,
    targets: string[],
    context: MCPContext,
    options: {
      priority?: MessagePriority;
      includeResources?: boolean;
    } = {}
  ): Promise<string[]> {
    const messageIds: string[] = [];

    for (const target of targets) {
      const payload: MCPPayload = {
        action: 'sync_context',
        data: {
          context,
          includeResources: options.includeResources || false,
          syncTimestamp: new Date().toISOString()
        },
        context
      };

      const messageId = await this.sendMessage(
        source,
        target,
        MCPMessageType.CONTEXT_SYNC,
        payload,
        {
          priority: options.priority || MessagePriority.NORMAL,
          correlationId: uuidv4()
        }
      );

      messageIds.push(messageId);
    }

    return messageIds;
  }

  /**
   * Register a resource
   */
  async registerResource(
    provider: string,
    resource: Omit<MCPResource, 'id' | 'lastModified' | 'checksum'>
  ): Promise<string> {
    const resourceId = uuidv4();
    const now = new Date();

    const fullResource: MCPResource = {
      ...resource,
      id: resourceId,
      lastModified: now,
      checksum: this.calculateChecksum(resource)
    };

    try {
      // Store in registry
      this.resourceRegistry.set(resourceId, fullResource);

      // Store in Redis
      await this.storeResourceInRedis(fullResource);

      // Store in Supabase
      await this.storeResourceInSupabase(fullResource);

      // Notify other agents
      await this.broadcastResourceUpdate(provider, fullResource);

      // Audit logging
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logActivity({
          action: 'resource_registered',
          resource_type: 'mcp_resource',
          resource_id: resourceId,
          details: {
            provider,
            type: resource.type,
            name: resource.name,
            uri: resource.uri
          }
        });
      }

      // Emit event
      this.emit('resource-registered', { resourceId, provider, type: resource.type });

      logger.info('MCP resource registered', {
        resourceId,
        provider,
        type: resource.type,
        name: resource.name
      });

      return resourceId;
    } catch (error) {
      logger.error('Failed to register MCP resource', { resourceId, provider, error });
      throw error;
    }
  }

  /**
   * Register a capability
   */
  async registerCapability(
    provider: string,
    capability: Omit<MCPCapability, 'id' | 'lastUpdated'>
  ): Promise<string> {
    const capabilityId = uuidv4();
    const now = new Date();

    const fullCapability: MCPCapability = {
      ...capability,
      id: capabilityId,
      lastUpdated: now
    };

    try {
      // Store in registry
      this.capabilityRegistry.set(capabilityId, fullCapability);

      // Store in Redis
      await this.storeCapabilityInRedis(fullCapability);

      // Store in Supabase
      await this.storeCapabilityInSupabase(fullCapability);

      // Notify other agents
      await this.broadcastCapabilityUpdate(provider, fullCapability);

      // Audit logging
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logActivity({
          action: 'capability_registered',
          resource_type: 'mcp_capability',
          resource_id: capabilityId,
          details: {
            provider,
            name: capability.name,
            version: capability.version
          }
        });
      }

      // Emit event
      this.emit('capability-registered', { capabilityId, provider, name: capability.name });

      logger.info('MCP capability registered', {
        capabilityId,
        provider,
        name: capability.name,
        version: capability.version
      });

      return capabilityId;
    } catch (error) {
      logger.error('Failed to register MCP capability', { capabilityId, provider, error });
      throw error;
    }
  }

  /**
   * Query capabilities
   */
  async queryCapabilities(
    source: string,
    target: string,
    query: {
      capabilityTypes?: string[];
      providers?: string[];
      constraints?: Partial<CapabilityConstraints>;
    },
    options: {
      priority?: MessagePriority;
      timeout?: number;
    } = {}
  ): Promise<string> {
    const payload: MCPPayload = {
      action: 'query_capabilities',
      data: query,
      capabilities: Array.from(this.capabilityRegistry.values())
    };

    return this.sendMessage(
      source,
      target,
      MCPMessageType.CAPABILITY_QUERY,
      payload,
      {
        priority: options.priority || MessagePriority.NORMAL,
        ttl: options.timeout || 10000,
        correlationId: uuidv4()
      }
    );
  }

  /**
   * Get context by session ID
   */
  getContext(sessionId: string): MCPContext | undefined {
    return this.contextCache.get(sessionId);
  }

  /**
   * Get resource by ID
   */
  getResource(resourceId: string): MCPResource | undefined {
    return this.resourceRegistry.get(resourceId);
  }

  /**
   * Get capability by ID
   */
  getCapability(capabilityId: string): MCPCapability | undefined {
    return this.capabilityRegistry.get(capabilityId);
  }

  /**
   * Search resources
   */
  searchResources(query: {
    type?: ResourceType;
    name?: string;
    provider?: string;
    tags?: string[];
  }): MCPResource[] {
    const resources = Array.from(this.resourceRegistry.values());
    
    return resources.filter(resource => {
      if (query.type && resource.type !== query.type) return false;
      if (query.name && !resource.name.toLowerCase().includes(query.name.toLowerCase())) return false;
      if (query.provider && !resource.metadata.provider?.includes(query.provider)) return false;
      if (query.tags && !query.tags.some(tag => resource.metadata.tags?.includes(tag))) return false;
      return true;
    });
  }

  /**
   * Search capabilities
   */
  searchCapabilities(query: {
    name?: string;
    provider?: string;
    inputType?: string;
    outputType?: string;
  }): MCPCapability[] {
    const capabilities = Array.from(this.capabilityRegistry.values());
    
    return capabilities.filter(capability => {
      if (query.name && !capability.name.toLowerCase().includes(query.name.toLowerCase())) return false;
      if (query.provider && capability.provider !== query.provider) return false;
      if (query.inputType && !Object.keys(capability.inputSchema).includes(query.inputType)) return false;
      if (query.outputType && !Object.keys(capability.outputSchema).includes(query.outputType)) return false;
      return true;
    });
  }

  /**
   * Get MCP statistics
   */
  getMCPStats(): {
    totalMessages: number;
    activeSessions: number;
    registeredResources: number;
    registeredCapabilities: number;
    messagesByType: Record<MCPMessageType, number>;
    resourcesByType: Record<ResourceType, number>;
  } {
    const messages = Array.from(this.messageQueue.values());
    const resources = Array.from(this.resourceRegistry.values());
    const capabilities = Array.from(this.capabilityRegistry.values());
    
    const messagesByType: Record<MCPMessageType, number> = {} as any;
    const resourcesByType: Record<ResourceType, number> = {} as any;
    
    for (const message of messages) {
      messagesByType[message.type] = (messagesByType[message.type] || 0) + 1;
    }
    
    for (const resource of resources) {
      resourcesByType[resource.type] = (resourcesByType[resource.type] || 0) + 1;
    }

    return {
      totalMessages: messages.length,
      activeSessions: this.activeSessions.size,
      registeredResources: resources.length,
      registeredCapabilities: capabilities.length,
      messagesByType,
      resourcesByType
    };
  }

  // Private helper methods
  private async validateMessage(message: MCPMessage): Promise<void> {
    // Validate message size
    const messageSize = JSON.stringify(message).length;
    if (messageSize > this.config.maxMessageSize) {
      throw new Error(`Message size ${messageSize} exceeds maximum ${this.config.maxMessageSize}`);
    }

    // Validate required fields
    if (!message.source || !message.target) {
      throw new Error('Message must have source and target');
    }

    // Validate payload
    if (!message.payload || !message.payload.action) {
      throw new Error('Message payload must have action');
    }
  }

  private async processMessage(message: MCPMessage): Promise<void> {
    try {
      // Store in Redis for distributed processing
      await this.redis.setex(
        `mcp_message:${message.id}`,
        message.metadata.ttl,
        JSON.stringify(message)
      );

      // Process based on message type
      switch (message.type) {
        case MCPMessageType.CONTEXT_REQUEST:
          await this.handleContextRequest(message);
          break;
        case MCPMessageType.CONTEXT_RESPONSE:
          await this.handleContextResponse(message);
          break;
        case MCPMessageType.CONTEXT_UPDATE:
          await this.handleContextUpdate(message);
          break;
        case MCPMessageType.CONTEXT_SYNC:
          await this.handleContextSync(message);
          break;
        case MCPMessageType.CAPABILITY_QUERY:
          await this.handleCapabilityQuery(message);
          break;
        case MCPMessageType.CAPABILITY_RESPONSE:
          await this.handleCapabilityResponse(message);
          break;
        case MCPMessageType.RESOURCE_REQUEST:
          await this.handleResourceRequest(message);
          break;
        case MCPMessageType.RESOURCE_RESPONSE:
          await this.handleResourceResponse(message);
          break;
        case MCPMessageType.WORKFLOW_SYNC:
          await this.handleWorkflowSync(message);
          break;
        case MCPMessageType.AGENT_STATUS:
          await this.handleAgentStatus(message);
          break;
        case MCPMessageType.HEARTBEAT:
          await this.handleHeartbeat(message);
          break;
        case MCPMessageType.ERROR:
          await this.handleError(message);
          break;
        default:
          logger.warn('Unknown MCP message type', { type: message.type });
      }

    } catch (error) {
      logger.error('Failed to process MCP message', { messageId: message.id, error });
      throw error;
    }
  }

  private async handleContextRequest(message: MCPMessage): Promise<void> {
    const { sessionId, workflowId, taskId, contextTypes, maxResults } = message.payload.data;
    
    // Get context from cache
    const context = this.contextCache.get(sessionId);
    if (!context) {
      // Send error response
      await this.sendMessage(
        'mcp-integration',
        message.source,
        MCPMessageType.ERROR,
        {
          action: 'context_not_found',
          data: { sessionId, error: 'Context not found' }
        },
        {
          correlationId: message.correlationId
        }
      );
      return;
    }

    // Send context response
    await this.sendMessage(
      'mcp-integration',
      message.source,
      MCPMessageType.CONTEXT_RESPONSE,
      {
        action: 'context_response',
        data: { context, sessionId, workflowId, taskId },
        context
      },
      {
        correlationId: message.correlationId
      }
    );
  }

  private async handleContextResponse(message: MCPMessage): Promise<void> {
    const { context, sessionId } = message.payload.data;
    
    // Store context in cache
    this.contextCache.set(sessionId, context);
    
    // Emit event
    this.emit('context-received', { sessionId, context });
  }

  private async handleContextUpdate(message: MCPMessage): Promise<void> {
    const { context, sessionId } = message.payload.data;
    
    // Update context in cache
    this.contextCache.set(sessionId, context);
    
    // Emit event
    this.emit('context-updated', { sessionId, context });
  }

  private async handleContextSync(message: MCPMessage): Promise<void> {
    const { context, sessionId } = message.payload.data;
    
    // Sync context
    this.contextCache.set(sessionId, context);
    
    // Emit event
    this.emit('context-synced', { sessionId, context });
  }

  private async handleCapabilityQuery(message: MCPMessage): Promise<void> {
    const { capabilityTypes, providers, constraints } = message.payload.data;
    
    // Search capabilities
    const capabilities = this.searchCapabilities({
      name: capabilityTypes?.[0],
      provider: providers?.[0]
    });

    // Send capability response
    await this.sendMessage(
      'mcp-integration',
      message.source,
      MCPMessageType.CAPABILITY_RESPONSE,
      {
        action: 'capability_response',
        data: { capabilities, query: message.payload.data },
        capabilities
      },
      {
        correlationId: message.correlationId
      }
    );
  }

  private async handleCapabilityResponse(message: MCPMessage): Promise<void> {
    const { capabilities } = message.payload.data;
    
    // Emit event
    this.emit('capabilities-received', { capabilities });
  }

  private async handleResourceRequest(message: MCPMessage): Promise<void> {
    const { resourceId, resourceType, name } = message.payload.data;
    
    let resource: MCPResource | undefined;
    
    if (resourceId) {
      resource = this.resourceRegistry.get(resourceId);
    } else if (resourceType || name) {
      const resources = this.searchResources({ type: resourceType as ResourceType, name });
      resource = resources[0];
    }

    // Send resource response
    await this.sendMessage(
      'mcp-integration',
      message.source,
      MCPMessageType.RESOURCE_RESPONSE,
      {
        action: 'resource_response',
        data: { resource, query: message.payload.data },
        resources: resource ? [resource] : []
      },
      {
        correlationId: message.correlationId
      }
    );
  }

  private async handleResourceResponse(message: MCPMessage): Promise<void> {
    const { resource } = message.payload.data;
    
    if (resource) {
      this.resourceRegistry.set(resource.id, resource);
    }
    
    // Emit event
    this.emit('resource-received', { resource });
  }

  private async handleWorkflowSync(message: MCPMessage): Promise<void> {
    const { workflowId, workflowData } = message.payload.data;
    
    // Emit event
    this.emit('workflow-synced', { workflowId, workflowData });
  }

  private async handleAgentStatus(message: MCPMessage): Promise<void> {
    const { agentId, status, capabilities, resources } = message.payload.data;
    
    // Update agent status
    if (status) {
      this.activeSessions.set(agentId, new Set([status]));
    }
    
    // Emit event
    this.emit('agent-status-updated', { agentId, status, capabilities, resources });
  }

  private async handleHeartbeat(message: MCPMessage): Promise<void> {
    const { agentId, timestamp } = message.payload.data;
    
    // Update heartbeat
    this.activeSessions.set(agentId, new Set(['active']));
    
    // Emit event
    this.emit('heartbeat-received', { agentId, timestamp });
  }

  private async handleError(message: MCPMessage): Promise<void> {
    const { error, code, details } = message.payload.data;
    
    // Emit event
    this.emit('error-received', { error, code, details, source: message.source });
  }

  private async broadcastResourceUpdate(provider: string, resource: MCPResource): Promise<void> {
    // Broadcast to all active sessions
    for (const [agentId] of this.activeSessions) {
      try {
        await this.sendMessage(
          'mcp-integration',
          agentId,
          MCPMessageType.RESOURCE_RESPONSE,
          {
            action: 'resource_update',
            data: { resource, provider },
            resources: [resource]
          }
        );
      } catch (error) {
        logger.error('Failed to broadcast resource update', { agentId, resourceId: resource.id, error });
      }
    }
  }

  private async broadcastCapabilityUpdate(provider: string, capability: MCPCapability): Promise<void> {
    // Broadcast to all active sessions
    for (const [agentId] of this.activeSessions) {
      try {
        await this.sendMessage(
          'mcp-integration',
          agentId,
          MCPMessageType.CAPABILITY_RESPONSE,
          {
            action: 'capability_update',
            data: { capability, provider },
            capabilities: [capability]
          }
        );
      } catch (error) {
        logger.error('Failed to broadcast capability update', { agentId, capabilityId: capability.id, error });
      }
    }
  }

  private calculateChecksum(resource: Omit<MCPResource, 'id' | 'lastModified' | 'checksum'>): string {
    // Simple checksum calculation
    const content = JSON.stringify(resource);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private async storeResourceInRedis(resource: MCPResource): Promise<void> {
    const key = `mcp_resource:${resource.id}`;
    const ttl = 7 * 24 * 60 * 60; // 7 days
    await this.redis.setex(key, ttl, JSON.stringify(resource));
  }

  private async storeResourceInSupabase(resource: MCPResource): Promise<void> {
    const { error } = await this.supabase
      .from('mcp_resources')
      .upsert([{
        ...resource,
        metadata: JSON.stringify(resource.metadata),
        permissions: JSON.stringify(resource.permissions),
        constraints: JSON.stringify(resource.constraints),
        last_modified: resource.lastModified.toISOString()
      }]);
    
    if (error) {
      logger.error('Failed to store MCP resource in Supabase', { resourceId: resource.id, error });
    }
  }

  private async storeCapabilityInRedis(capability: MCPCapability): Promise<void> {
    const key = `mcp_capability:${capability.id}`;
    const ttl = 7 * 24 * 60 * 60; // 7 days
    await this.redis.setex(key, ttl, JSON.stringify(capability));
  }

  private async storeCapabilityInSupabase(capability: MCPCapability): Promise<void> {
    const { error } = await this.supabase
      .from('mcp_capabilities')
      .upsert([{
        ...capability,
        input_schema: JSON.stringify(capability.inputSchema),
        output_schema: JSON.stringify(capability.outputSchema),
        constraints: JSON.stringify(capability.constraints),
        metadata: JSON.stringify(capability.metadata),
        last_updated: capability.lastUpdated.toISOString()
      }]);
    
    if (error) {
      logger.error('Failed to store MCP capability in Supabase', { capabilityId: capability.id, error });
    }
  }

  private startTimers(): void {
    // Heartbeat timer
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeats();
    }, this.config.heartbeatInterval);

    // Sync timer
    this.syncTimer = setInterval(() => {
      this.syncContexts();
    }, this.config.syncInterval);

    // Cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredMessages();
    }, 300000); // 5 minutes
  }

  private async sendHeartbeats(): Promise<void> {
    const activeAgents = Array.from(this.activeSessions.keys());
    
    for (const agentId of activeAgents) {
      try {
        await this.sendMessage(
          'mcp-integration',
          agentId,
          MCPMessageType.HEARTBEAT,
          {
            action: 'heartbeat',
            data: { agentId, timestamp: new Date().toISOString() }
          },
          {
            priority: MessagePriority.LOW,
            ttl: 5000
          }
        );
      } catch (error) {
        logger.error('Failed to send heartbeat', { agentId, error });
      }
    }
  }

  private async syncContexts(): Promise<void> {
    // Sync contexts across active sessions
    const contexts = Array.from(this.contextCache.entries());
    
    for (const [sessionId, context] of contexts) {
      const activeAgents = Array.from(this.activeSessions.keys());
      
      if (activeAgents.length > 1) {
        await this.syncContext('mcp-integration', activeAgents, context);
      }
    }
  }

  private cleanupExpiredMessages(): void {
    const now = Date.now();
    const expiredIds: string[] = [];
    
    for (const [messageId, message] of this.messageQueue) {
      const age = now - message.timestamp.getTime();
      if (age > message.metadata.ttl) {
        expiredIds.push(messageId);
      }
    }
    
    for (const messageId of expiredIds) {
      this.messageQueue.delete(messageId);
    }
    
    if (expiredIds.length > 0) {
      logger.info('Cleaned up expired MCP messages', { count: expiredIds.length });
    }
  }

  private setupRedisSubscriptions(): void {
    this.redis.subscribe('mcp-messages', (err) => {
      if (err) {
        logger.error('Failed to subscribe to MCP messages channel', { error: err });
      }
    });

    this.redis.on('message', (channel, message) => {
      if (channel === 'mcp-messages') {
        try {
          const data = JSON.parse(message);
          this.handleRedisMessage(data);
        } catch (error) {
          logger.error('Failed to parse Redis MCP message', { error });
        }
      }
    });
  }

  private handleRedisMessage(data: any): void {
    switch (data.type) {
      case 'message-sent':
        this.emit('message-received', data);
        break;
      case 'context-updated':
        this.emit('context-updated', data);
        break;
      case 'resource-updated':
        this.emit('resource-updated', data);
        break;
      case 'capability-updated':
        this.emit('capability-updated', data);
        break;
      default:
        logger.debug('Unknown Redis MCP message type', { type: data.type });
    }
  }

  private setupEventHandlers(): void {
    this.on('message-sent', (data) => {
      logger.debug('MCP message sent event', data);
    });
    
    this.on('message-received', (data) => {
      logger.debug('MCP message received event', data);
    });
    
    this.on('context-updated', (data) => {
      logger.debug('MCP context updated event', data);
    });
    
    this.on('resource-registered', (data) => {
      logger.debug('MCP resource registered event', data);
    });
    
    this.on('capability-registered', (data) => {
      logger.debug('MCP capability registered event', data);
    });
  }

  /**
   * Shutdown the MCP integration
   */
  async shutdown(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.removeAllListeners();
    logger.info('MCP Integration shutdown complete');
  }
}

export default MCPIntegration;
