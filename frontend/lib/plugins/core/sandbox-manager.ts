/**
 * Sandbox Manager - Secure Plugin Execution Environment
 * Story 02: WordPress-Style Plugin Architecture Implementation
 */

import { EventEmitter } from 'events';
import { SandboxConfig } from '@/types/plugins/marketplace';

export interface SandboxInstance {
  id: string;
  pluginId: string;
  config: SandboxConfig;
  status: 'running' | 'stopped' | 'error';
  createdAt: Date;
  lastActivity: Date;
  resourceUsage: ResourceUsage;
  executionCount: number;
  errorCount: number;
}

export interface ResourceUsage {
  memory: number; // MB
  cpu: number; // percentage
  executionTime: number; // ms
  networkRequests: number;
  fileOperations: number;
}

export interface SandboxManagerConfig {
  memoryLimit: number; // MB
  cpuLimit: number; // percentage
  timeout: number; // seconds
  networkAccess: boolean;
  fileSystemAccess: boolean;
  maxConcurrentSandboxes: number;
  cleanupInterval: number; // ms
}

export class SandboxManager extends EventEmitter {
  private readonly config: SandboxManagerConfig;
  private readonly sandboxes = new Map<string, SandboxInstance>();
  private readonly cleanupTimer: NodeJS.Timeout;
  private readonly resourceMonitor: NodeJS.Timeout;

  constructor(config: SandboxManagerConfig) {
    super();
    this.config = config;
    
    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupInactiveSandboxes();
    }, this.config.cleanupInterval);

    // Start resource monitoring
    this.resourceMonitor = setInterval(() => {
      this.monitorResourceUsage();
    }, 5000); // Every 5 seconds

    this.setupEventHandlers();
  }

  /**
   * Create a new sandbox for a plugin
   */
  async createSandbox(pluginId: string, config: SandboxConfig): Promise<SandboxInstance> {
    try {
      // Check if sandbox already exists
      if (this.sandboxes.has(pluginId)) {
        throw new Error(`Sandbox already exists for plugin: ${pluginId}`);
      }

      // Check concurrent sandbox limit
      if (this.sandboxes.size >= this.config.maxConcurrentSandboxes) {
        throw new Error('Maximum concurrent sandboxes reached');
      }

      // Create sandbox instance
      const sandbox: SandboxInstance = {
        id: `sandbox_${pluginId}_${Date.now()}`,
        pluginId,
        config: {
          memoryLimit: config.memoryLimit || this.config.memoryLimit,
          cpuLimit: config.cpuLimit || this.config.cpuLimit,
          timeout: config.timeout || this.config.timeout,
          networkAccess: config.networkAccess !== undefined ? config.networkAccess : this.config.networkAccess,
          fileSystemAccess: config.fileSystemAccess !== undefined ? config.fileSystemAccess : this.config.fileSystemAccess,
          allowedDomains: config.allowedDomains || [],
          environmentVariables: config.environmentVariables || {}
        },
        status: 'running',
        createdAt: new Date(),
        lastActivity: new Date(),
        resourceUsage: {
          memory: 0,
          cpu: 0,
          executionTime: 0,
          networkRequests: 0,
          fileOperations: 0
        },
        executionCount: 0,
        errorCount: 0
      };

      // Initialize sandbox environment
      await this.initializeSandboxEnvironment(sandbox);

      // Store sandbox
      this.sandboxes.set(pluginId, sandbox);

      this.emit('sandbox-created', { pluginId, sandboxId: sandbox.id });

      return sandbox;

    } catch (error) {
      this.emit('sandbox-creation-error', { pluginId, error: error.message });
      throw error;
    }
  }

  /**
   * Execute code in sandbox
   */
  async executeInSandbox(pluginId: string, code: string, context: any = {}): Promise<any> {
    const sandbox = this.sandboxes.get(pluginId);
    if (!sandbox) {
      throw new Error(`Sandbox not found for plugin: ${pluginId}`);
    }

    if (sandbox.status !== 'running') {
      throw new Error(`Sandbox is not running: ${sandbox.status}`);
    }

    try {
      const startTime = Date.now();
      
      // Update activity
      sandbox.lastActivity = new Date();
      sandbox.executionCount++;

      // Execute code in isolated environment
      const result = await this.executeCode(code, context, sandbox.config);
      
      const executionTime = Date.now() - startTime;
      
      // Update resource usage
      sandbox.resourceUsage.executionTime += executionTime;
      sandbox.resourceUsage.memory = Math.max(sandbox.resourceUsage.memory, this.getCurrentMemoryUsage());

      this.emit('sandbox-execution', { 
        pluginId, 
        executionTime, 
        success: true 
      });

      return result;

    } catch (error) {
      sandbox.errorCount++;
      sandbox.lastActivity = new Date();

      this.emit('sandbox-execution-error', { 
        pluginId, 
        error: error.message 
      });

      throw error;
    }
  }

  /**
   * Destroy sandbox
   */
  async destroySandbox(pluginId: string): Promise<void> {
    const sandbox = this.sandboxes.get(pluginId);
    if (!sandbox) {
      return; // Already destroyed
    }

    try {
      // Cleanup sandbox environment
      await this.cleanupSandboxEnvironment(sandbox);

      // Remove from sandboxes
      this.sandboxes.delete(pluginId);

      this.emit('sandbox-destroyed', { pluginId, sandboxId: sandbox.id });

    } catch (error) {
      this.emit('sandbox-destruction-error', { pluginId, error: error.message });
      throw error;
    }
  }

  /**
   * Get sandbox by plugin ID
   */
  getSandbox(pluginId: string): SandboxInstance | undefined {
    return this.sandboxes.get(pluginId);
  }

  /**
   * Get all sandboxes
   */
  getAllSandboxes(): SandboxInstance[] {
    return Array.from(this.sandboxes.values());
  }

  /**
   * Get sandbox health status
   */
  async getSandboxHealth(pluginId: string): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    metrics: ResourceUsage;
  }> {
    const sandbox = this.sandboxes.get(pluginId);
    if (!sandbox) {
      return {
        status: 'unhealthy',
        issues: ['Sandbox not found'],
        metrics: {
          memory: 0,
          cpu: 0,
          executionTime: 0,
          networkRequests: 0,
          fileOperations: 0
        }
      };
    }

    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check memory usage
    if (sandbox.resourceUsage.memory > sandbox.config.memoryLimit) {
      issues.push(`Memory usage exceeded limit: ${sandbox.resourceUsage.memory}MB > ${sandbox.config.memoryLimit}MB`);
      status = 'unhealthy';
    } else if (sandbox.resourceUsage.memory > sandbox.config.memoryLimit * 0.8) {
      issues.push(`Memory usage approaching limit: ${sandbox.resourceUsage.memory}MB`);
      status = status === 'healthy' ? 'degraded' : status;
    }

    // Check CPU usage
    if (sandbox.resourceUsage.cpu > sandbox.config.cpuLimit) {
      issues.push(`CPU usage exceeded limit: ${sandbox.resourceUsage.cpu}% > ${sandbox.config.cpuLimit}%`);
      status = 'unhealthy';
    } else if (sandbox.resourceUsage.cpu > sandbox.config.cpuLimit * 0.8) {
      issues.push(`CPU usage approaching limit: ${sandbox.resourceUsage.cpu}%`);
      status = status === 'healthy' ? 'degraded' : status;
    }

    // Check error rate
    const errorRate = sandbox.executionCount > 0 ? (sandbox.errorCount / sandbox.executionCount) : 0;
    if (errorRate > 0.5) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
      status = 'unhealthy';
    } else if (errorRate > 0.2) {
      issues.push(`Elevated error rate: ${(errorRate * 100).toFixed(1)}%`);
      status = status === 'healthy' ? 'degraded' : status;
    }

    // Check inactivity
    const inactiveTime = Date.now() - sandbox.lastActivity.getTime();
    if (inactiveTime > 300000) { // 5 minutes
      issues.push(`Sandbox inactive for ${Math.round(inactiveTime / 60000)} minutes`);
      status = status === 'healthy' ? 'degraded' : status;
    }

    return {
      status,
      issues,
      metrics: sandbox.resourceUsage
    };
  }

  /**
   * Initialize sandbox environment
   */
  private async initializeSandboxEnvironment(sandbox: SandboxInstance): Promise<void> {
    // In a real implementation, this would:
    // 1. Create an isolated JavaScript environment (VM2 or similar)
    // 2. Set up security policies
    // 3. Configure resource limits
    // 4. Initialize plugin context
    
    console.log(`Initializing sandbox for plugin: ${sandbox.pluginId}`);
    
    // Mock initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Execute code in isolated environment
   */
  private async executeCode(code: string, context: any, config: SandboxConfig): Promise<any> {
    // In a real implementation, this would:
    // 1. Use VM2 or similar to create isolated execution context
    // 2. Apply security policies
    // 3. Monitor resource usage
    // 4. Handle timeouts and errors
    
    // Mock execution for now
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Execution timeout'));
      }, config.timeout * 1000);

      try {
        // Simulate code execution
        const result = {
          success: true,
          output: 'Mock execution result',
          timestamp: new Date().toISOString()
        };
        
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Cleanup sandbox environment
   */
  private async cleanupSandboxEnvironment(sandbox: SandboxInstance): Promise<void> {
    // In a real implementation, this would:
    // 1. Stop all running processes
    // 2. Clean up resources
    // 3. Remove temporary files
    // 4. Clear memory
    
    console.log(`Cleaning up sandbox for plugin: ${sandbox.pluginId}`);
    
    // Mock cleanup
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Monitor resource usage across all sandboxes
   */
  private monitorResourceUsage(): void {
    for (const [pluginId, sandbox] of this.sandboxes) {
      // Update resource usage metrics
      sandbox.resourceUsage.memory = this.getCurrentMemoryUsage();
      sandbox.resourceUsage.cpu = this.getCurrentCpuUsage();
      
      // Check for resource violations
      if (sandbox.resourceUsage.memory > sandbox.config.memoryLimit) {
        this.emit('resource-violation', {
          pluginId,
          type: 'memory',
          current: sandbox.resourceUsage.memory,
          limit: sandbox.config.memoryLimit
        });
      }
      
      if (sandbox.resourceUsage.cpu > sandbox.config.cpuLimit) {
        this.emit('resource-violation', {
          pluginId,
          type: 'cpu',
          current: sandbox.resourceUsage.cpu,
          limit: sandbox.config.cpuLimit
        });
      }
    }
  }

  /**
   * Cleanup inactive sandboxes
   */
  private cleanupInactiveSandboxes(): void {
    const now = Date.now();
    const inactiveThreshold = 600000; // 10 minutes

    for (const [pluginId, sandbox] of this.sandboxes) {
      const inactiveTime = now - sandbox.lastActivity.getTime();
      
      if (inactiveTime > inactiveThreshold) {
        console.log(`Cleaning up inactive sandbox: ${pluginId}`);
        this.destroySandbox(pluginId).catch(error => {
          console.error(`Error cleaning up sandbox ${pluginId}:`, error);
        });
      }
    }
  }

  /**
   * Get current memory usage (mock)
   */
  private getCurrentMemoryUsage(): number {
    // In a real implementation, this would get actual memory usage
    return Math.random() * 50; // Mock: 0-50MB
  }

  /**
   * Get current CPU usage (mock)
   */
  private getCurrentCpuUsage(): number {
    // In a real implementation, this would get actual CPU usage
    return Math.random() * 100; // Mock: 0-100%
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('sandbox-created', (data) => {
      console.log(`Sandbox created: ${data.pluginId}`);
    });

    this.on('sandbox-destroyed', (data) => {
      console.log(`Sandbox destroyed: ${data.pluginId}`);
    });

    this.on('resource-violation', (data) => {
      console.warn(`Resource violation in ${data.pluginId}: ${data.type} ${data.current} > ${data.limit}`);
    });
  }

  /**
   * Shutdown sandbox manager
   */
  async shutdown(): Promise<void> {
    // Clear timers
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    if (this.resourceMonitor) {
      clearInterval(this.resourceMonitor);
    }

    // Destroy all sandboxes
    const pluginIds = Array.from(this.sandboxes.keys());
    for (const pluginId of pluginIds) {
      try {
        await this.destroySandbox(pluginId);
      } catch (error) {
        console.error(`Error destroying sandbox ${pluginId}:`, error);
      }
    }

    this.removeAllListeners();
  }
}

export default SandboxManager;
