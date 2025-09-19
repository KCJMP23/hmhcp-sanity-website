// Enhanced Plugin Sandbox Manager with Docker Integration
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import Docker from 'dockerode';
import { EventEmitter } from 'events';
import { PluginInstallation, ResourceLimits } from '@/types/plugins/marketplace';
import { ExecutionRequest, ExecutionResponse, ExecutionContext } from '@/types/plugins/execution';
import { SandboxConfig } from '@/types/plugins/sdk';

export class SandboxManager extends EventEmitter {
  private docker: Docker;
  private redis: any;
  private activeContainers: Map<string, Docker.Container> = new Map();
  private containerStats: Map<string, ContainerStats> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private maxContainers: number = 10;
  private containerTimeout: number = 300000; // 5 minutes

  constructor() {
    super();
    this.docker = new Docker();
    this.initializeHealthCheck();
  }

  /**
   * Initialize plugin sandbox container
   */
  async initializePlugin(installation: PluginInstallation): Promise<void> {
    try {
      const containerName = `plugin-${installation.id}`;
      
      // Check if container already exists
      if (this.activeContainers.has(installation.id)) {
        await this.cleanupPlugin(installation.id);
      }

      // Create container with enhanced security
      const container = await this.createSecureContainer(installation, containerName);
      
      // Start container
      await container.start();
      
      // Store container reference
      this.activeContainers.set(installation.id, container);
      
      // Initialize container stats
      this.containerStats.set(installation.id, {
        containerId: container.id,
        startTime: Date.now(),
        executionCount: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        lastHealthCheck: Date.now(),
        status: 'healthy'
      });

      // Start monitoring
      this.startContainerMonitoring(installation.id, container);

      this.emit('pluginInitialized', { installationId: installation.id, containerId: container.id });
      
      console.log(`Plugin ${installation.id} initialized in sandbox container ${container.id}`);
    } catch (error) {
      console.error('Failed to initialize plugin in sandbox:', error);
      throw error;
    }
  }

  /**
   * Execute plugin in sandbox container
   */
  async executePlugin(installation: PluginInstallation, request: ExecutionRequest): Promise<ExecutionResponse> {
    try {
      const container = this.activeContainers.get(installation.id);
      if (!container) {
        throw new Error(`Plugin container not found: ${installation.id}`);
      }

      // Check container health
      const stats = this.containerStats.get(installation.id);
      if (!stats || stats.status !== 'healthy') {
        throw new Error(`Plugin container is not healthy: ${installation.id}`);
      }

      // Check resource limits
      await this.checkResourceLimits(installation);

      // Execute plugin code
      const result = await this.executeInContainer(container, request);

      // Update stats
      this.updateContainerStats(installation.id, result);

      return result;
    } catch (error) {
      console.error('Plugin execution failed in sandbox:', error);
      throw error;
    }
  }

  /**
   * Cleanup plugin sandbox environment
   */
  async cleanupPlugin(installationId: string): Promise<void> {
    try {
      const container = this.activeContainers.get(installationId);
      if (container) {
        // Stop container gracefully
        try {
          await container.stop({ t: 10 });
        } catch (error) {
          // Force kill if stop fails
          await container.kill();
        }
        
        // Remove container
        await container.remove({ force: true });
        
        // Remove from active containers
        this.activeContainers.delete(installationId);
        this.containerStats.delete(installationId);
        
        this.emit('pluginCleanedUp', { installationId });
        
        console.log(`Plugin ${installationId} sandbox cleaned up`);
      }
    } catch (error) {
      console.error('Failed to cleanup plugin sandbox:', error);
      throw error;
    }
  }

  /**
   * Create secure Docker container
   */
  private async createSecureContainer(installation: PluginInstallation, containerName: string): Promise<Docker.Container> {
    const sandboxConfig = this.getSandboxConfig(installation);
    
    const containerConfig = {
      Image: 'plugin-sandbox:latest',
      name: containerName,
      Cmd: ['node', '/app/execute-plugin.js'],
      Env: [
        `PLUGIN_ID=${installation.plugin_id}`,
        `INSTALLATION_ID=${installation.id}`,
        `ORGANIZATION_ID=${installation.organization_id}`,
        `NODE_ENV=production`,
        `MEMORY_LIMIT=${sandboxConfig.memoryLimit}`,
        `CPU_LIMIT=${sandboxConfig.cpuLimit}`,
        `TIMEOUT=${sandboxConfig.timeout}`
      ],
      WorkingDir: '/app',
      HostConfig: {
        Memory: sandboxConfig.memoryLimit * 1024 * 1024, // Convert MB to bytes
        CpuQuota: Math.floor(sandboxConfig.cpuLimit * 100000), // Convert CPU cores to quota
        CpuPeriod: 100000,
        NetworkMode: 'plugin-network',
        ReadonlyRootfs: true,
        CapDrop: ['ALL'],
        CapAdd: ['CHOWN', 'SETGID', 'SETUID'],
        SecurityOpt: ['no-new-privileges:true'],
        Ulimits: [
          { Name: 'nproc', Soft: 100, Hard: 100 },
          { Name: 'nofile', Soft: 100, Hard: 100 },
          { Name: 'memlock', Soft: 0, Hard: 0 }
        ],
        Tmpfs: {
          '/tmp': 'noexec,nosuid,size=100m',
          '/var/tmp': 'noexec,nosuid,size=100m'
        },
        RestartPolicy: {
          Name: 'unless-stopped',
          MaximumRetryCount: 3
        }
      },
      Labels: {
        'plugin.id': installation.plugin_id,
        'plugin.installation': installation.id,
        'plugin.organization': installation.organization_id,
        'plugin.type': 'sandbox',
        'plugin.version': installation.version
      },
      Healthcheck: {
        Test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
        Interval: 30000000000, // 30 seconds in nanoseconds
        Timeout: 10000000000, // 10 seconds in nanoseconds
        Retries: 3,
        StartPeriod: 10000000000 // 10 seconds in nanoseconds
      }
    };

    // Create container
    const container = await this.docker.createContainer(containerConfig);
    
    return container;
  }

  /**
   * Execute plugin code in container
   */
  private async executeInContainer(container: Docker.Container, request: ExecutionRequest): Promise<ExecutionResponse> {
    const startTime = Date.now();
    
    try {
      // Execute plugin with timeout
      const exec = await container.exec({
        Cmd: ['node', '/app/execute-plugin.js'],
        AttachStdout: true,
        AttachStderr: true,
        Env: [
          `INPUT_DATA=${JSON.stringify(request.input_data || {})}`,
          `EXECUTION_CONTEXT=${JSON.stringify(request.execution_context || {})}`,
          `TIMEOUT=${request.timeout || 30000}`,
          `PRIORITY=${request.priority || 'normal'}`
        ]
      });

      const result = await this.streamExec(exec, request.timeout || 30000);
      const executionTime = Date.now() - startTime;

      return {
        execution_id: `exec-${Date.now()}`,
        status: 'success',
        output_data: result.output,
        execution_time_ms: executionTime,
        memory_usage_mb: result.memory_usage_mb || 0,
        healthcare_data_accessed: result.healthcare_data_accessed || false,
        compliance_validation: result.compliance_validation,
        retry_count: 0,
        logs: result.logs || [],
        metrics: result.metrics || {}
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        execution_id: `exec-${Date.now()}`,
        status: 'error',
        error_message: error.message,
        execution_time_ms: executionTime,
        memory_usage_mb: 0,
        healthcare_data_accessed: false,
        compliance_validation: null,
        retry_count: 0,
        logs: [],
        metrics: {}
      };
    }
  }

  /**
   * Stream execution output
   */
  private async streamExec(exec: Docker.Exec, timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Execution timeout'));
      }, timeout);

      let output = '';
      let error = '';

      exec.start((err: any, stream: any) => {
        if (err) {
          clearTimeout(timeoutId);
          reject(err);
          return;
        }

        stream.on('data', (data: any) => {
          output += data.toString();
        });

        stream.on('error', (err: any) => {
          error += err.toString();
        });

        stream.on('end', () => {
          clearTimeout(timeoutId);
          
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (parseError) {
            resolve({
              output: output,
              error: error,
              healthcare_data_accessed: false,
              compliance_validation: null,
              logs: []
            });
          }
        });
      });
    });
  }

  /**
   * Check resource limits
   */
  private async checkResourceLimits(installation: PluginInstallation): Promise<void> {
    const stats = this.containerStats.get(installation.id);
    if (!stats) {
      throw new Error('Container stats not found');
    }

    const memoryUsage = stats.memoryUsage;
    const cpuUsage = stats.cpuUsage;

    if (memoryUsage > installation.resource_limits.memory) {
      throw new Error(`Memory limit exceeded: ${memoryUsage}MB > ${installation.resource_limits.memory}MB`);
    }

    if (cpuUsage > installation.resource_limits.cpu) {
      throw new Error(`CPU limit exceeded: ${cpuUsage} > ${installation.resource_limits.cpu}`);
    }
  }

  /**
   * Start container monitoring
   */
  private startContainerMonitoring(installationId: string, container: Docker.Container): void {
    const monitorInterval = setInterval(async () => {
      try {
        const stats = await container.stats({ stream: false });
        const containerStats = this.containerStats.get(installationId);
        
        if (containerStats) {
          containerStats.memoryUsage = stats.memory_stats.usage / 1024 / 1024; // Convert to MB
          containerStats.cpuUsage = this.calculateCpuUsage(stats);
          containerStats.lastHealthCheck = Date.now();
          
          // Check if container is healthy
          const health = await container.inspect();
          containerStats.status = health.State.Health?.Status === 'healthy' ? 'healthy' : 'unhealthy';
          
          this.emit('containerStats', { installationId, stats: containerStats });
        }
      } catch (error) {
        console.error(`Failed to monitor container ${installationId}:`, error);
        this.cleanupPlugin(installationId);
      }
    }, 30000); // Monitor every 30 seconds

    // Store interval for cleanup
    container['_monitorInterval'] = monitorInterval;
  }

  /**
   * Calculate CPU usage percentage
   */
  private calculateCpuUsage(stats: any): number {
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    
    if (systemDelta > 0 && cpuDelta > 0) {
      return (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
    }
    
    return 0;
  }

  /**
   * Update container statistics
   */
  private updateContainerStats(installationId: string, executionResult: ExecutionResponse): void {
    const stats = this.containerStats.get(installationId);
    if (stats) {
      stats.executionCount++;
      stats.totalExecutionTime += executionResult.execution_time_ms;
      stats.averageExecutionTime = stats.totalExecutionTime / stats.executionCount;
      stats.memoryUsage = executionResult.memory_usage_mb;
    }
  }

  /**
   * Get sandbox configuration
   */
  private getSandboxConfig(installation: PluginInstallation): SandboxConfig {
    return {
      memoryLimit: installation.resource_limits.memory || 128,
      cpuLimit: installation.resource_limits.cpu || 0.5,
      timeout: installation.resource_limits.executionTime || 30,
      networkAccess: installation.permissions.network || false,
      fileSystemAccess: installation.permissions.file_system || false,
      allowedDomains: [],
      environmentVariables: installation.configuration.environment_variables || {}
    };
  }

  /**
   * Initialize health check
   */
  private initializeHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [installationId, container] of this.activeContainers) {
        try {
          const health = await container.inspect();
          const stats = this.containerStats.get(installationId);
          
          if (stats) {
            const isHealthy = health.State.Health?.Status === 'healthy';
            const isRunning = health.State.Running;
            const isStale = Date.now() - stats.lastHealthCheck > this.containerTimeout;
            
            if (!isHealthy || !isRunning || isStale) {
              console.log(`Container ${installationId} is unhealthy, cleaning up`);
              await this.cleanupPlugin(installationId);
            }
          }
        } catch (error) {
          console.error(`Health check failed for container ${installationId}:`, error);
          await this.cleanupPlugin(installationId);
        }
      }
    }, 60000); // Health check every minute
  }

  /**
   * Get sandbox statistics
   */
  async getSandboxStats(): Promise<any> {
    const activeContainers = this.activeContainers.size;
    const totalMemory = Array.from(this.containerStats.values())
      .reduce((total, stats) => total + stats.memoryUsage, 0);
    
    const totalCpu = Array.from(this.containerStats.values())
      .reduce((total, stats) => total + stats.cpuUsage, 0);

    return {
      active_containers: activeContainers,
      total_memory_usage: totalMemory,
      total_cpu_usage: totalCpu,
      uptime: process.uptime(),
      last_cleanup: new Date().toISOString(),
      container_stats: Array.from(this.containerStats.entries()).map(([id, stats]) => ({
        installation_id: id,
        ...stats
      }))
    };
  }

  /**
   * Health check for sandbox environment
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check Docker daemon
      const dockerInfo = await this.docker.info();
      if (!dockerInfo) {
        return false;
      }

      // Check active containers
      const healthyContainers = Array.from(this.containerStats.values())
        .filter(stats => stats.status === 'healthy').length;

      return healthyContainers > 0 || this.activeContainers.size === 0;
    } catch (error) {
      console.error('Sandbox health check failed:', error);
      return false;
    }
  }

  /**
   * Cleanup all containers
   */
  async cleanupAll(): Promise<void> {
    const cleanupPromises = Array.from(this.activeContainers.keys())
      .map(installationId => this.cleanupPlugin(installationId));
    
    await Promise.all(cleanupPromises);
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

interface ContainerStats {
  containerId: string;
  startTime: number;
  executionCount: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  lastHealthCheck: number;
  status: 'healthy' | 'unhealthy' | 'unknown';
}
