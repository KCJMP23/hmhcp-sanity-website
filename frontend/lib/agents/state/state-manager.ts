/**
 * State Manager - Workflow State Management
 * Handles persistence and recovery of workflow states
 */

import { WorkflowResult, WorkflowExecutionContext, StateManager as IStateManager } from '../healthcare-types';
import { createClient } from '@supabase/supabase-js';
import { Redis } from 'ioredis';

export class StateManager implements IStateManager {
  private supabase: any;
  private redis: Redis | null = null;
  private inMemoryStore: Map<string, any>;
  private persistenceEnabled: boolean;

  constructor() {
    this.inMemoryStore = new Map();
    this.persistenceEnabled = false;
    this.initializeStorage();
  }

  /**
   * Initialize storage backends
   */
  private async initializeStorage(): Promise<void> {
    // Initialize Supabase for persistent storage
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      this.persistenceEnabled = true;
    }

    // Initialize Redis for fast caching
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL);
        await this.redis.ping();
        console.log('Redis connected for state management');
      } catch (error) {
        console.warn('Redis connection failed, using in-memory cache', error);
        this.redis = null;
      }
    }
  }

  /**
   * Save workflow state
   */
  public async saveWorkflowState(workflowId: string, state: any): Promise<void> {
    const timestamp = Date.now();
    const stateData = {
      workflowId,
      state,
      timestamp,
      version: 1
    };

    // Save to in-memory store
    this.inMemoryStore.set(workflowId, stateData);

    // Save to Redis if available
    if (this.redis) {
      try {
        await this.redis.setex(
          `workflow:state:${workflowId}`,
          3600, // 1 hour TTL
          JSON.stringify(stateData)
        );
      } catch (error) {
        console.error('Failed to save state to Redis:', error);
      }
    }

    // Save to Supabase for persistence
    if (this.persistenceEnabled && this.supabase) {
      try {
        await this.supabase
          .from('workflow_states')
          .upsert({
            workflow_id: workflowId,
            state: stateData,
            updated_at: new Date(timestamp).toISOString()
          });
      } catch (error) {
        console.error('Failed to save state to Supabase:', error);
      }
    }
  }

  /**
   * Load workflow state
   */
  public async loadWorkflowState(workflowId: string): Promise<any> {
    // Check in-memory store first
    if (this.inMemoryStore.has(workflowId)) {
      return this.inMemoryStore.get(workflowId)!.state;
    }

    // Check Redis cache
    if (this.redis) {
      try {
        const cached = await this.redis.get(`workflow:state:${workflowId}`);
        if (cached) {
          const stateData = JSON.parse(cached);
          this.inMemoryStore.set(workflowId, stateData);
          return stateData.state;
        }
      } catch (error) {
        console.error('Failed to load state from Redis:', error);
      }
    }

    // Load from Supabase
    if (this.persistenceEnabled && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('workflow_states')
          .select('state')
          .eq('workflow_id', workflowId)
          .single();

        if (data && !error) {
          this.inMemoryStore.set(workflowId, data.state);
          return data.state.state;
        }
      } catch (error) {
        console.error('Failed to load state from Supabase:', error);
      }
    }

    return null;
  }

  /**
   * Save workflow result
   */
  public async saveWorkflowResult(workflowId: string, result: WorkflowResult): Promise<void> {
    const timestamp = Date.now();
    const resultData = {
      workflowId,
      result,
      timestamp
    };

    // Save to in-memory store
    this.inMemoryStore.set(`result:${workflowId}`, resultData);

    // Save to Redis with longer TTL
    if (this.redis) {
      try {
        await this.redis.setex(
          `workflow:result:${workflowId}`,
          86400, // 24 hours TTL
          JSON.stringify(resultData)
        );
      } catch (error) {
        console.error('Failed to save result to Redis:', error);
      }
    }

    // Save to Supabase for long-term storage
    if (this.persistenceEnabled && this.supabase) {
      try {
        await this.supabase
          .from('workflow_results')
          .insert({
            workflow_id: workflowId,
            success: result.success,
            execution_time: result.executionTime,
            result: result,
            created_at: new Date(timestamp).toISOString()
          });
      } catch (error) {
        console.error('Failed to save result to Supabase:', error);
      }
    }
  }

  /**
   * Load workflow result
   */
  public async loadWorkflowResult(workflowId: string): Promise<WorkflowResult | null> {
    // Check in-memory store
    const memoryKey = `result:${workflowId}`;
    if (this.inMemoryStore.has(memoryKey)) {
      return this.inMemoryStore.get(memoryKey)!.result;
    }

    // Check Redis
    if (this.redis) {
      try {
        const cached = await this.redis.get(`workflow:result:${workflowId}`);
        if (cached) {
          const resultData = JSON.parse(cached);
          this.inMemoryStore.set(memoryKey, resultData);
          return resultData.result;
        }
      } catch (error) {
        console.error('Failed to load result from Redis:', error);
      }
    }

    // Load from Supabase
    if (this.persistenceEnabled && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('workflow_results')
          .select('result')
          .eq('workflow_id', workflowId)
          .single();

        if (data && !error) {
          this.inMemoryStore.set(memoryKey, { result: data.result });
          return data.result;
        }
      } catch (error) {
        console.error('Failed to load result from Supabase:', error);
      }
    }

    return null;
  }

  /**
   * Delete workflow state
   */
  public async deleteWorkflowState(workflowId: string): Promise<void> {
    // Remove from in-memory store
    this.inMemoryStore.delete(workflowId);
    this.inMemoryStore.delete(`result:${workflowId}`);

    // Remove from Redis
    if (this.redis) {
      try {
        await this.redis.del([
          `workflow:state:${workflowId}`,
          `workflow:result:${workflowId}`
        ]);
      } catch (error) {
        console.error('Failed to delete from Redis:', error);
      }
    }

    // Remove from Supabase
    if (this.persistenceEnabled && this.supabase) {
      try {
        await Promise.all([
          this.supabase
            .from('workflow_states')
            .delete()
            .eq('workflow_id', workflowId),
          this.supabase
            .from('workflow_results')
            .delete()
            .eq('workflow_id', workflowId)
        ]);
      } catch (error) {
        console.error('Failed to delete from Supabase:', error);
      }
    }
  }

  /**
   * List workflows with optional filter
   */
  public async listWorkflows(filter?: any): Promise<string[]> {
    const workflows: Set<string> = new Set();

    // Get from in-memory store
    for (const key of this.inMemoryStore.keys()) {
      if (!key.startsWith('result:')) {
        workflows.add(key);
      }
    }

    // Get from Redis
    if (this.redis) {
      try {
        const keys = await this.redis.keys('workflow:state:*');
        keys.forEach(key => {
          const workflowId = key.replace('workflow:state:', '');
          workflows.add(workflowId);
        });
      } catch (error) {
        console.error('Failed to list workflows from Redis:', error);
      }
    }

    // Get from Supabase
    if (this.persistenceEnabled && this.supabase) {
      try {
        let query = this.supabase
          .from('workflow_states')
          .select('workflow_id');

        if (filter) {
          if (filter.startDate) {
            query = query.gte('updated_at', filter.startDate);
          }
          if (filter.endDate) {
            query = query.lte('updated_at', filter.endDate);
          }
        }

        const { data, error } = await query;

        if (data && !error) {
          data.forEach((row: any) => workflows.add(row.workflow_id));
        }
      } catch (error) {
        console.error('Failed to list workflows from Supabase:', error);
      }
    }

    return Array.from(workflows);
  }

  /**
   * Create checkpoint for workflow recovery
   */
  public async createCheckpoint(
    workflowId: string, 
    context: WorkflowExecutionContext
  ): Promise<void> {
    const checkpoint = {
      workflowId,
      context,
      timestamp: Date.now(),
      step: context.currentStep,
      status: context.status
    };

    // Save checkpoint with special key
    const checkpointKey = `checkpoint:${workflowId}:${context.currentStep}`;
    
    if (this.redis) {
      try {
        await this.redis.setex(
          checkpointKey,
          7200, // 2 hours TTL
          JSON.stringify(checkpoint)
        );
      } catch (error) {
        console.error('Failed to save checkpoint:', error);
      }
    }

    // Also save to persistent storage
    if (this.persistenceEnabled && this.supabase) {
      try {
        await this.supabase
          .from('workflow_checkpoints')
          .insert({
            workflow_id: workflowId,
            step: context.currentStep,
            checkpoint: checkpoint,
            created_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Failed to save checkpoint to Supabase:', error);
      }
    }
  }

  /**
   * Restore from checkpoint
   */
  public async restoreFromCheckpoint(
    workflowId: string, 
    step?: number
  ): Promise<WorkflowExecutionContext | null> {
    let checkpointKey = `checkpoint:${workflowId}:${step || '*'}`;

    // Try Redis first
    if (this.redis) {
      try {
        if (step === undefined) {
          // Get latest checkpoint
          const keys = await this.redis.keys(`checkpoint:${workflowId}:*`);
          if (keys.length > 0) {
            keys.sort((a, b) => {
              const stepA = parseInt(a.split(':').pop()!);
              const stepB = parseInt(b.split(':').pop()!);
              return stepB - stepA;
            });
            checkpointKey = keys[0];
          }
        }

        const data = await this.redis.get(checkpointKey);
        if (data) {
          const checkpoint = JSON.parse(data);
          return checkpoint.context;
        }
      } catch (error) {
        console.error('Failed to restore checkpoint from Redis:', error);
      }
    }

    // Try Supabase
    if (this.persistenceEnabled && this.supabase) {
      try {
        let query = this.supabase
          .from('workflow_checkpoints')
          .select('checkpoint')
          .eq('workflow_id', workflowId);

        if (step !== undefined) {
          query = query.eq('step', step);
        } else {
          query = query.order('step', { ascending: false }).limit(1);
        }

        const { data, error } = await query;

        if (data && data.length > 0 && !error) {
          return data[0].checkpoint.context;
        }
      } catch (error) {
        console.error('Failed to restore checkpoint from Supabase:', error);
      }
    }

    return null;
  }

  /**
   * Clean up old states and results
   */
  public async cleanup(olderThanDays: number = 7): Promise<void> {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    // Clean in-memory store
    for (const [key, value] of this.inMemoryStore.entries()) {
      if (value.timestamp < cutoffTime) {
        this.inMemoryStore.delete(key);
      }
    }

    // Clean Redis
    if (this.redis) {
      // Redis handles TTL automatically, but we can force cleanup if needed
      console.log('Redis cleanup handled by TTL');
    }

    // Clean Supabase
    if (this.persistenceEnabled && this.supabase) {
      try {
        const cutoffDate = new Date(cutoffTime).toISOString();
        
        await Promise.all([
          this.supabase
            .from('workflow_states')
            .delete()
            .lt('updated_at', cutoffDate),
          this.supabase
            .from('workflow_results')
            .delete()
            .lt('created_at', cutoffDate),
          this.supabase
            .from('workflow_checkpoints')
            .delete()
            .lt('created_at', cutoffDate)
        ]);

        console.log(`Cleaned up data older than ${olderThanDays} days`);
      } catch (error) {
        console.error('Failed to cleanup old data:', error);
      }
    }
  }
}