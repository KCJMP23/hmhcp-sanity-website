/**
 * Healthcare AI Workflow State Manager
 * 
 * Manages workflow state persistence, versioning, and recovery with healthcare compliance.
 * Features atomic operations, distributed locking, and PHI data protection.
 * 
 * @version 1.0.0
 * @author HMHCP Development Team
 */

import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import { createCipher, createDecipher } from 'crypto';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { compress, decompress } from 'lz4';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

const WorkflowStateSchema = z.object({
  id: z.string().uuid(),
  workflowId: z.string(),
  version: z.number().int().positive(),
  state: z.record(z.unknown()),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    createdBy: z.string(),
    tags: z.array(z.string()).optional(),
    phiLevel: z.enum(['none', 'limited', 'full']),
    retentionDate: z.string().datetime(),
  }),
  checkpoints: z.array(z.object({
    id: z.string(),
    timestamp: z.string().datetime(),
    state: z.record(z.unknown()),
    description: z.string().optional(),
  })).optional(),
  transitions: z.array(z.object({
    from: z.string(),
    to: z.string(),
    timestamp: z.string().datetime(),
    userId: z.string(),
    reason: z.string().optional(),
  })).optional(),
});

export type WorkflowState = z.infer<typeof WorkflowStateSchema>;

export interface StateManagerConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    keyPrefix?: string;
  };
  supabase: {
    url: string;
    serviceKey: string;
  };
  encryption: {
    key: string;
    algorithm: string;
  };
  versioning: {
    maxVersions: number;
    snapshotInterval: number;
  };
  caching: {
    ttl: number;
    maxSize: number;
  };
  compliance: {
    retentionYears: number;
    auditLevel: 'basic' | 'detailed' | 'comprehensive';
  };
}

export interface StateOperation {
  type: 'create' | 'update' | 'delete' | 'checkpoint' | 'restore';
  workflowId: string;
  data?: Partial<WorkflowState>;
  userId: string;
  reason?: string;
}

export interface StateLock {
  id: string;
  workflowId: string;
  acquiredBy: string;
  acquiredAt: Date;
  expiresAt: Date;
}

export interface StateSnapshot {
  id: string;
  workflowId: string;
  version: number;
  compressedState: Buffer;
  metadata: {
    timestamp: string;
    size: number;
    compressionRatio: number;
    phiLevel: 'none' | 'limited' | 'full';
  };
}

// =============================================================================
// WORKFLOW STATE MANAGER
// =============================================================================

export class WorkflowStateManager {
  private redis: Redis;
  private supabase: ReturnType<typeof createClient>;
  private config: StateManagerConfig;
  private cache: Map<string, { state: WorkflowState; timestamp: number }>;
  private locks: Map<string, StateLock>;

  constructor(config: StateManagerConfig) {
    this.config = config;
    this.cache = new Map();
    this.locks = new Map();

    // Initialize Redis connection
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      keyPrefix: config.redis.keyPrefix || 'workflow:state:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    // Initialize Supabase client
    this.supabase = createClient(config.supabase.url, config.supabase.serviceKey);

    // Setup cleanup intervals
    this.setupCleanupIntervals();
  }

  // ===========================================================================
  // STATE OPERATIONS
  // ===========================================================================

  /**
   * Create a new workflow state with initial data
   */
  public async createState(
    workflowId: string,
    initialState: Record<string, unknown>,
    userId: string,
    phiLevel: 'none' | 'limited' | 'full' = 'none'
  ): Promise<WorkflowState> {
    const stateId = uuidv4();
    const now = new Date().toISOString();
    const retentionDate = new Date(
      Date.now() + this.config.compliance.retentionYears * 365 * 24 * 60 * 60 * 1000
    ).toISOString();

    const workflowState: WorkflowState = {
      id: stateId,
      workflowId,
      version: 1,
      state: initialState,
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        phiLevel,
        retentionDate,
      },
    };

    // Validate state structure
    const validatedState = WorkflowStateSchema.parse(workflowState);

    // Acquire distributed lock
    const lock = await this.acquireLock(workflowId, userId);
    
    try {
      // Store in Redis for fast access
      await this.storeInRedis(validatedState);

      // Store in Supabase for persistence
      await this.storeInSupabase(validatedState);

      // Create initial snapshot
      await this.createSnapshot(validatedState);

      // Update cache
      this.updateCache(validatedState);

      // Log audit event
      await this.logAuditEvent({
        type: 'create',
        workflowId,
        data: validatedState,
        userId,
      });

      return validatedState;

    } finally {
      await this.releaseLock(lock.id);
    }
  }

  /**
   * Update workflow state with atomic operations
   */
  public async updateState(
    workflowId: string,
    updates: Partial<Record<string, unknown>>,
    userId: string,
    reason?: string
  ): Promise<WorkflowState> {
    // Acquire distributed lock
    const lock = await this.acquireLock(workflowId, userId);
    
    try {
      // Get current state
      const currentState = await this.getState(workflowId);
      if (!currentState) {
        throw new Error(`Workflow state not found: ${workflowId}`);
      }

      // Create new version
      const updatedState: WorkflowState = {
        ...currentState,
        version: currentState.version + 1,
        state: { ...currentState.state, ...updates },
        metadata: {
          ...currentState.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      // Validate updated state
      const validatedState = WorkflowStateSchema.parse(updatedState);

      // Store updated state
      await this.storeInRedis(validatedState);
      await this.storeInSupabase(validatedState);

      // Create snapshot if needed
      if (validatedState.version % this.config.versioning.snapshotInterval === 0) {
        await this.createSnapshot(validatedState);
      }

      // Update cache
      this.updateCache(validatedState);

      // Log transition
      await this.logTransition(workflowId, currentState.version, validatedState.version, userId, reason);

      // Log audit event
      await this.logAuditEvent({
        type: 'update',
        workflowId,
        data: validatedState,
        userId,
        reason,
      });

      return validatedState;

    } finally {
      await this.releaseLock(lock.id);
    }
  }

  /**
   * Get current workflow state with caching
   */
  public async getState(workflowId: string): Promise<WorkflowState | null> {
    // Check cache first
    const cached = this.cache.get(workflowId);
    if (cached && (Date.now() - cached.timestamp) < this.config.caching.ttl) {
      return cached.state;
    }

    // Try Redis
    const redisState = await this.getFromRedis(workflowId);
    if (redisState) {
      this.updateCache(redisState);
      return redisState;
    }

    // Fallback to Supabase
    const supabaseState = await this.getFromSupabase(workflowId);
    if (supabaseState) {
      // Restore to Redis
      await this.storeInRedis(supabaseState);
      this.updateCache(supabaseState);
      return supabaseState;
    }

    return null;
  }

  /**
   * Create a state checkpoint for recovery
   */
  public async createCheckpoint(
    workflowId: string,
    description: string,
    userId: string
  ): Promise<void> {
    const lock = await this.acquireLock(workflowId, userId);
    
    try {
      const currentState = await this.getState(workflowId);
      if (!currentState) {
        throw new Error(`Workflow state not found: ${workflowId}`);
      }

      const checkpoint = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        state: currentState.state,
        description,
      };

      const updatedState: WorkflowState = {
        ...currentState,
        checkpoints: [...(currentState.checkpoints || []), checkpoint],
        metadata: {
          ...currentState.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      await this.storeInRedis(updatedState);
      await this.storeInSupabase(updatedState);
      this.updateCache(updatedState);

      // Create snapshot
      await this.createSnapshot(updatedState);

      // Log audit event
      await this.logAuditEvent({
        type: 'checkpoint',
        workflowId,
        data: updatedState,
        userId,
        reason: `Checkpoint: ${description}`,
      });

    } finally {
      await this.releaseLock(lock.id);
    }
  }

  /**
   * Restore workflow state from a checkpoint
   */
  public async restoreFromCheckpoint(
    workflowId: string,
    checkpointId: string,
    userId: string,
    reason?: string
  ): Promise<WorkflowState> {
    const lock = await this.acquireLock(workflowId, userId);
    
    try {
      const currentState = await this.getState(workflowId);
      if (!currentState) {
        throw new Error(`Workflow state not found: ${workflowId}`);
      }

      const checkpoint = currentState.checkpoints?.find(cp => cp.id === checkpointId);
      if (!checkpoint) {
        throw new Error(`Checkpoint not found: ${checkpointId}`);
      }

      const restoredState: WorkflowState = {
        ...currentState,
        version: currentState.version + 1,
        state: checkpoint.state,
        metadata: {
          ...currentState.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      await this.storeInRedis(restoredState);
      await this.storeInSupabase(restoredState);
      this.updateCache(restoredState);

      // Log transition
      await this.logTransition(
        workflowId,
        currentState.version,
        restoredState.version,
        userId,
        `Restored from checkpoint: ${checkpoint.description}`
      );

      // Log audit event
      await this.logAuditEvent({
        type: 'restore',
        workflowId,
        data: restoredState,
        userId,
        reason: reason || `Restored from checkpoint: ${checkpoint.description}`,
      });

      return restoredState;

    } finally {
      await this.releaseLock(lock.id);
    }
  }

  // ===========================================================================
  // VERSIONING AND HISTORY
  // ===========================================================================

  /**
   * Get workflow state history with pagination
   */
  public async getStateHistory(
    workflowId: string,
    options: {
      limit?: number;
      offset?: number;
      fromVersion?: number;
      toVersion?: number;
    } = {}
  ): Promise<WorkflowState[]> {
    const { limit = 50, offset = 0, fromVersion, toVersion } = options;

    const { data, error } = await this.supabase
      .from('workflow_states')
      .select('*')
      .eq('workflow_id', workflowId)
      .gte('version', fromVersion || 1)
      .lte('version', toVersion || Number.MAX_SAFE_INTEGER)
      .order('version', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get state history: ${error.message}`);
    }

    return data.map(row => this.deserializeState(row));
  }

  /**
   * Get state at specific version
   */
  public async getStateAtVersion(
    workflowId: string,
    version: number
  ): Promise<WorkflowState | null> {
    const { data, error } = await this.supabase
      .from('workflow_states')
      .select('*')
      .eq('workflow_id', workflowId)
      .eq('version', version)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get state at version: ${error.message}`);
    }

    return data ? this.deserializeState(data) : null;
  }

  // ===========================================================================
  // DISTRIBUTED LOCKING
  // ===========================================================================

  /**
   * Acquire distributed lock for workflow state
   */
  private async acquireLock(
    workflowId: string,
    userId: string,
    timeout: number = 30000
  ): Promise<StateLock> {
    const lockId = uuidv4();
    const lockKey = `lock:${workflowId}`;
    const expiresAt = new Date(Date.now() + timeout);

    // Try to acquire lock with exponential backoff
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const result = await this.redis.set(
        lockKey,
        JSON.stringify({ lockId, userId, expiresAt }),
        'PX',
        timeout,
        'NX'
      );

      if (result === 'OK') {
        const lock: StateLock = {
          id: lockId,
          workflowId,
          acquiredBy: userId,
          acquiredAt: new Date(),
          expiresAt,
        };

        this.locks.set(lockId, lock);
        return lock;
      }

      // Wait with exponential backoff
      const delay = Math.min(100 * Math.pow(2, attempts), 2000);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
    }

    throw new Error(`Failed to acquire lock for workflow: ${workflowId}`);
  }

  /**
   * Release distributed lock
   */
  private async releaseLock(lockId: string): Promise<void> {
    const lock = this.locks.get(lockId);
    if (!lock) {
      return;
    }

    const lockKey = `lock:${lock.workflowId}`;
    
    // Use Lua script for atomic release
    const script = `
      local current = redis.call('GET', KEYS[1])
      if current then
        local data = cjson.decode(current)
        if data.lockId == ARGV[1] then
          return redis.call('DEL', KEYS[1])
        end
      end
      return 0
    `;

    await this.redis.eval(script, 1, lockKey, lockId);
    this.locks.delete(lockId);
  }

  // ===========================================================================
  // STORAGE OPERATIONS
  // ===========================================================================

  /**
   * Store state in Redis for fast access
   */
  private async storeInRedis(state: WorkflowState): Promise<void> {
    const serializedState = this.serializeState(state);
    const key = `state:${state.workflowId}`;
    
    await this.redis.setex(
      key,
      this.config.caching.ttl / 1000,
      serializedState
    );
  }

  /**
   * Get state from Redis
   */
  private async getFromRedis(workflowId: string): Promise<WorkflowState | null> {
    const key = `state:${workflowId}`;
    const serializedState = await this.redis.get(key);
    
    if (!serializedState) {
      return null;
    }

    return this.deserializeState(serializedState);
  }

  /**
   * Store state in Supabase for persistence
   */
  private async storeInSupabase(state: WorkflowState): Promise<void> {
    const encryptedState = this.encryptState(state);
    
    const { error } = await this.supabase
      .from('workflow_states')
      .upsert({
        id: state.id,
        workflow_id: state.workflowId,
        version: state.version,
        state_data: encryptedState,
        metadata: state.metadata,
        created_at: state.metadata.createdAt,
        updated_at: state.metadata.updatedAt,
      });

    if (error) {
      throw new Error(`Failed to store state in Supabase: ${error.message}`);
    }
  }

  /**
   * Get state from Supabase
   */
  private async getFromSupabase(workflowId: string): Promise<WorkflowState | null> {
    const { data, error } = await this.supabase
      .from('workflow_states')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get state from Supabase: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return this.deserializeState(data);
  }

  // ===========================================================================
  // SNAPSHOTS AND COMPRESSION
  // ===========================================================================

  /**
   * Create compressed state snapshot
   */
  private async createSnapshot(state: WorkflowState): Promise<void> {
    const stateData = JSON.stringify(state.state);
    const compressedData = compress(Buffer.from(stateData));
    
    const snapshot: StateSnapshot = {
      id: uuidv4(),
      workflowId: state.workflowId,
      version: state.version,
      compressedState: compressedData,
      metadata: {
        timestamp: new Date().toISOString(),
        size: compressedData.length,
        compressionRatio: stateData.length / compressedData.length,
        phiLevel: state.metadata.phiLevel,
      },
    };

    // Store encrypted snapshot
    const encryptedSnapshot = this.encryptData(JSON.stringify(snapshot));
    
    const { error } = await this.supabase
      .from('workflow_snapshots')
      .insert({
        id: snapshot.id,
        workflow_id: snapshot.workflowId,
        version: snapshot.version,
        compressed_data: encryptedSnapshot,
        metadata: snapshot.metadata,
      });

    if (error) {
      throw new Error(`Failed to create snapshot: ${error.message}`);
    }
  }

  /**
   * Restore state from snapshot
   */
  public async restoreFromSnapshot(
    workflowId: string,
    version: number
  ): Promise<WorkflowState | null> {
    const { data, error } = await this.supabase
      .from('workflow_snapshots')
      .select('*')
      .eq('workflow_id', workflowId)
      .eq('version', version)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get snapshot: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Decrypt and decompress
    const decryptedData = this.decryptData(data.compressed_data);
    const snapshot: StateSnapshot = JSON.parse(decryptedData);
    const decompressedState = JSON.parse(decompress(snapshot.compressedState).toString());

    // Reconstruct full state
    const restoredState: WorkflowState = {
      id: uuidv4(),
      workflowId,
      version: snapshot.version,
      state: decompressedState,
      metadata: {
        createdAt: data.metadata.timestamp,
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        phiLevel: data.metadata.phiLevel,
        retentionDate: new Date(
          Date.now() + this.config.compliance.retentionYears * 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    };

    return restoredState;
  }

  // ===========================================================================
  // ENCRYPTION AND SECURITY
  // ===========================================================================

  /**
   * Encrypt state data containing PHI
   */
  private encryptState(state: WorkflowState): string {
    if (state.metadata.phiLevel === 'none') {
      return JSON.stringify(state);
    }

    return this.encryptData(JSON.stringify(state));
  }

  /**
   * Encrypt sensitive data
   */
  private encryptData(data: string): string {
    const cipher = createCipher(this.config.encryption.algorithm, this.config.encryption.key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private decryptData(encryptedData: string): string {
    const decipher = createDecipher(this.config.encryption.algorithm, this.config.encryption.key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Serialize state for storage
   */
  private serializeState(state: WorkflowState): string {
    return JSON.stringify(state);
  }

  /**
   * Deserialize state from storage
   */
  private deserializeState(data: any): WorkflowState {
    if (typeof data === 'string') {
      const parsed = JSON.parse(data);
      return WorkflowStateSchema.parse(parsed);
    }

    // Handle Supabase row format
    const state: WorkflowState = {
      id: data.id,
      workflowId: data.workflow_id,
      version: data.version,
      state: JSON.parse(this.decryptData(data.state_data)),
      metadata: data.metadata,
    };

    return WorkflowStateSchema.parse(state);
  }

  // ===========================================================================
  // CACHING
  // ===========================================================================

  /**
   * Update in-memory cache
   */
  private updateCache(state: WorkflowState): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.config.caching.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(state.workflowId, {
      state,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache for workflow
   */
  public clearCache(workflowId?: string): void {
    if (workflowId) {
      this.cache.delete(workflowId);
    } else {
      this.cache.clear();
    }
  }

  // ===========================================================================
  // AUDIT LOGGING
  // ===========================================================================

  /**
   * Log audit event for compliance
   */
  private async logAuditEvent(operation: StateOperation): Promise<void> {
    const auditLog = {
      id: uuidv4(),
      workflow_id: operation.workflowId,
      operation_type: operation.type,
      user_id: operation.userId,
      timestamp: new Date().toISOString(),
      reason: operation.reason,
      phi_level: operation.data?.metadata?.phiLevel || 'none',
      version: operation.data?.version,
    };

    const { error } = await this.supabase
      .from('workflow_audit_logs')
      .insert(auditLog);

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log state transition
   */
  private async logTransition(
    workflowId: string,
    fromVersion: number,
    toVersion: number,
    userId: string,
    reason?: string
  ): Promise<void> {
    const transition = {
      id: uuidv4(),
      workflow_id: workflowId,
      from_version: fromVersion,
      to_version: toVersion,
      user_id: userId,
      timestamp: new Date().toISOString(),
      reason: reason || 'State transition',
    };

    const { error } = await this.supabase
      .from('workflow_transitions')
      .insert(transition);

    if (error) {
      console.error('Failed to log transition:', error);
    }
  }

  // ===========================================================================
  // CLEANUP AND MAINTENANCE
  // ===========================================================================

  /**
   * Setup cleanup intervals for maintenance
   */
  private setupCleanupIntervals(): void {
    // Clean expired locks every minute
    setInterval(() => {
      this.cleanupExpiredLocks();
    }, 60000);

    // Clean old cache entries every 5 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 300000);

    // Clean old versions based on retention policy every hour
    setInterval(() => {
      this.cleanupOldVersions();
    }, 3600000);
  }

  /**
   * Clean up expired distributed locks
   */
  private async cleanupExpiredLocks(): Promise<void> {
    const now = new Date();
    for (const [lockId, lock] of this.locks.entries()) {
      if (lock.expiresAt < now) {
        await this.releaseLock(lockId);
      }
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.caching.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clean up old versions based on retention policy
   */
  private async cleanupOldVersions(): Promise<void> {
    try {
      // Keep only the latest N versions per workflow
      const { error } = await this.supabase.rpc('cleanup_old_workflow_versions', {
        max_versions: this.config.versioning.maxVersions,
      });

      if (error) {
        console.error('Failed to cleanup old versions:', error);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Get workflow state statistics
   */
  public async getStateStats(workflowId: string): Promise<{
    totalVersions: number;
    totalCheckpoints: number;
    latestVersion: number;
    storageSize: number;
    phiLevel: string;
    retentionDate: string;
  }> {
    const { data, error } = await this.supabase.rpc('get_workflow_state_stats', {
      workflow_id: workflowId,
    });

    if (error) {
      throw new Error(`Failed to get state stats: ${error.message}`);
    }

    return data;
  }

  /**
   * Migrate state between versions
   */
  public async migrateState(
    workflowId: string,
    migrationScript: (state: Record<string, unknown>) => Record<string, unknown>,
    userId: string
  ): Promise<WorkflowState> {
    const lock = await this.acquireLock(workflowId, userId);
    
    try {
      const currentState = await this.getState(workflowId);
      if (!currentState) {
        throw new Error(`Workflow state not found: ${workflowId}`);
      }

      // Apply migration
      const migratedState = migrationScript(currentState.state);

      return await this.updateState(
        workflowId,
        migratedState,
        userId,
        'State migration'
      );

    } finally {
      await this.releaseLock(lock.id);
    }
  }

  /**
   * Cleanup resources and close connections
   */
  public async destroy(): Promise<void> {
    // Release all locks
    for (const lockId of this.locks.keys()) {
      await this.releaseLock(lockId);
    }

    // Clear cache
    this.cache.clear();

    // Close Redis connection
    await this.redis.disconnect();
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a configured workflow state manager instance
 */
export function createWorkflowStateManager(
  config?: Partial<StateManagerConfig>
): WorkflowStateManager {
  const defaultConfig: StateManagerConfig = {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: 'hmhcp:workflow:',
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    encryption: {
      key: process.env.WORKFLOW_ENCRYPTION_KEY || 'default-key-change-me',
      algorithm: 'aes192',
    },
    versioning: {
      maxVersions: 100,
      snapshotInterval: 10,
    },
    caching: {
      ttl: 300000, // 5 minutes
      maxSize: 1000,
    },
    compliance: {
      retentionYears: 7,
      auditLevel: 'comprehensive',
    },
  };

  const mergedConfig = { ...defaultConfig, ...config };
  return new WorkflowStateManager(mergedConfig);
}

// =============================================================================
// USAGE EXAMPLE
// =============================================================================

/*
Example usage:

const stateManager = createWorkflowStateManager({
  compliance: {
    retentionYears: 10,
    auditLevel: 'comprehensive',
  },
});

// Create workflow state
const initialState = await stateManager.createState(
  'workflow-123',
  { step: 'patient-intake', data: { patientId: 'P123' } },
  'user-456',
  'full' // PHI level
);

// Update state
const updatedState = await stateManager.updateState(
  'workflow-123',
  { step: 'diagnosis', findings: 'example-findings' },
  'doctor-789',
  'Completed patient examination'
);

// Create checkpoint
await stateManager.createCheckpoint(
  'workflow-123',
  'Pre-treatment checkpoint',
  'doctor-789'
);

// Get state history
const history = await stateManager.getStateHistory('workflow-123', {
  limit: 20,
  fromVersion: 1,
});
*/