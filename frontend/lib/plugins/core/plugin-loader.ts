/**
 * Plugin Loader - Core Plugin Loading and Registration System
 * Story 02: WordPress-Style Plugin Architecture Implementation
 */

import { EventEmitter } from 'events';
import { createClient } from '@supabase/supabase-js';
import { PluginDefinition, PluginManifest, PluginType } from '@/types/plugins/marketplace';
import { PluginRegistry } from './plugin-registry';
import { PluginValidator } from './plugin-validator';
import { SandboxManager } from './sandbox-manager';
import { SecurityScanner } from './security-scanner';

export interface PluginLoaderConfig {
  supabaseUrl: string;
  supabaseKey: string;
  sandboxConfig: {
    memoryLimit: number;
    cpuLimit: number;
    timeout: number;
    networkAccess: boolean;
    fileSystemAccess: boolean;
  };
  securityConfig: {
    enableScanning: boolean;
    scanOnLoad: boolean;
    quarantineOnFailure: boolean;
  };
}

export interface LoadedPlugin {
  id: string;
  definition: PluginDefinition;
  manifest: PluginManifest;
  instance: any;
  status: 'loaded' | 'error' | 'quarantined';
  loadedAt: Date;
  error?: string;
}

export class PluginLoader extends EventEmitter {
  private readonly supabase: any;
  private readonly registry: PluginRegistry;
  private readonly validator: PluginValidator;
  private readonly sandboxManager: SandboxManager;
  private readonly securityScanner: SecurityScanner;
  private readonly config: PluginLoaderConfig;
  
  private readonly loadedPlugins = new Map<string, LoadedPlugin>();
  private readonly pluginHooks = new Map<string, Map<string, Function[]>>();
  private readonly pluginFilters = new Map<string, Map<string, Function[]>>();

  constructor(config: PluginLoaderConfig) {
    super();
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    
    // Initialize core components
    this.registry = new PluginRegistry(this.supabase);
    this.validator = new PluginValidator();
    this.sandboxManager = new SandboxManager(config.sandboxConfig);
    this.securityScanner = new SecurityScanner(config.securityConfig);
    
    this.setupEventHandlers();
  }

  /**
   * Load a plugin by ID
   */
  async loadPlugin(pluginId: string, organizationId: string): Promise<LoadedPlugin> {
    try {
      this.emit('plugin-loading', { pluginId, organizationId });

      // Get plugin definition from registry
      const definition = await this.registry.getPluginDefinition(pluginId);
      if (!definition) {
        throw new Error(`Plugin not found: ${pluginId}`);
      }

      // Validate plugin manifest
      const validation = await this.validator.validateManifest(definition.manifest);
      if (!validation.valid) {
        throw new Error(`Plugin validation failed: ${validation.errors.join(', ')}`);
      }

      // Security scan if enabled
      if (this.config.securityConfig.enableScanning) {
        const securityScan = await this.securityScanner.scanPlugin(definition);
        if (!securityScan.safe && this.config.securityConfig.quarantineOnFailure) {
          const quarantinedPlugin: LoadedPlugin = {
            id: pluginId,
            definition,
            manifest: definition.manifest,
            instance: null,
            status: 'quarantined',
            loadedAt: new Date(),
            error: 'Security scan failed'
          };
          this.loadedPlugins.set(pluginId, quarantinedPlugin);
          this.emit('plugin-quarantined', { pluginId, reason: 'Security scan failed' });
          return quarantinedPlugin;
        }
      }

      // Initialize sandbox environment
      const sandbox = await this.sandboxManager.createSandbox(pluginId, definition.sandbox_config);
      
      // Load plugin code
      const instance = await this.loadPluginCode(definition, sandbox);
      
      // Register hooks and filters
      this.registerPluginHooks(pluginId, instance);
      
      // Create loaded plugin record
      const loadedPlugin: LoadedPlugin = {
        id: pluginId,
        definition,
        manifest: definition.manifest,
        instance,
        status: 'loaded',
        loadedAt: new Date()
      };

      this.loadedPlugins.set(pluginId, loadedPlugin);
      
      this.emit('plugin-loaded', { pluginId, definition });
      
      return loadedPlugin;

    } catch (error) {
      const errorPlugin: LoadedPlugin = {
        id: pluginId,
        definition: null as any,
        manifest: null as any,
        instance: null,
        status: 'error',
        loadedAt: new Date(),
        error: error.message
      };
      
      this.loadedPlugins.set(pluginId, errorPlugin);
      this.emit('plugin-load-error', { pluginId, error: error.message });
      
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    try {
      const loadedPlugin = this.loadedPlugins.get(pluginId);
      if (!loadedPlugin) {
        throw new Error(`Plugin not loaded: ${pluginId}`);
      }

      // Call plugin cleanup if available
      if (loadedPlugin.instance && typeof loadedPlugin.instance.cleanup === 'function') {
        await loadedPlugin.instance.cleanup();
      }

      // Unregister hooks and filters
      this.unregisterPluginHooks(pluginId);

      // Cleanup sandbox
      await this.sandboxManager.destroySandbox(pluginId);

      // Remove from loaded plugins
      this.loadedPlugins.delete(pluginId);

      this.emit('plugin-unloaded', { pluginId });

    } catch (error) {
      this.emit('plugin-unload-error', { pluginId, error: error.message });
      throw error;
    }
  }

  /**
   * Get loaded plugin by ID
   */
  getLoadedPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  /**
   * Get all loaded plugins
   */
  getAllLoadedPlugins(): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Execute a plugin hook
   */
  async executeHook(hookName: string, ...args: any[]): Promise<any[]> {
    const results: any[] = [];
    const hookFunctions = this.pluginHooks.get(hookName) || new Map();

    for (const [pluginId, functions] of hookFunctions) {
      try {
        for (const fn of functions) {
          const result = await fn(...args);
          results.push(result);
        }
      } catch (error) {
        this.emit('hook-error', { hookName, pluginId, error: error.message });
        console.error(`Hook execution error in plugin ${pluginId}:`, error);
      }
    }

    return results;
  }

  /**
   * Apply a plugin filter
   */
  async applyFilter(filterName: string, value: any, ...args: any[]): Promise<any> {
    let filteredValue = value;
    const filterFunctions = this.pluginFilters.get(filterName) || new Map();

    for (const [pluginId, functions] of filterFunctions) {
      try {
        for (const fn of functions) {
          filteredValue = await fn(filteredValue, ...args);
        }
      } catch (error) {
        this.emit('filter-error', { filterName, pluginId, error: error.message });
        console.error(`Filter execution error in plugin ${pluginId}:`, error);
      }
    }

    return filteredValue;
  }

  /**
   * Register a plugin hook
   */
  registerHook(pluginId: string, hookName: string, callback: Function): void {
    if (!this.pluginHooks.has(hookName)) {
      this.pluginHooks.set(hookName, new Map());
    }
    
    const hookMap = this.pluginHooks.get(hookName)!;
    if (!hookMap.has(pluginId)) {
      hookMap.set(pluginId, []);
    }
    
    hookMap.get(pluginId)!.push(callback);
  }

  /**
   * Register a plugin filter
   */
  registerFilter(pluginId: string, filterName: string, callback: Function): void {
    if (!this.pluginFilters.has(filterName)) {
      this.pluginFilters.set(filterName, new Map());
    }
    
    const filterMap = this.pluginFilters.get(filterName)!;
    if (!filterMap.has(pluginId)) {
      filterMap.set(pluginId, []);
    }
    
    filterMap.get(pluginId)!.push(callback);
  }

  /**
   * Load plugin code from definition
   */
  private async loadPluginCode(definition: PluginDefinition, sandbox: any): Promise<any> {
    try {
      // Validate plugin definition before loading
      if (!definition.id || !definition.name || !definition.version) {
        throw new Error('Invalid plugin definition: missing required fields');
      }

      // In a real implementation, this would load the actual plugin code
      // For now, we'll create a mock plugin instance with proper error handling
      const pluginInstance = {
        id: definition.id,
        name: definition.name,
        version: definition.version,
        manifest: definition.manifest,
        
        // Plugin lifecycle methods with error handling
        init: async (): Promise<void> => {
          try {
            console.log(`Plugin ${definition.name} initialized`);
            this.emit('plugin-initialized', { pluginId: definition.id });
          } catch (error) {
            this.emit('plugin-init-error', { pluginId: definition.id, error: error.message });
            throw error;
          }
        },
        
        activate: async (): Promise<void> => {
          try {
            console.log(`Plugin ${definition.name} activated`);
            this.emit('plugin-activated', { pluginId: definition.id });
          } catch (error) {
            this.emit('plugin-activation-error', { pluginId: definition.id, error: error.message });
            throw error;
          }
        },
        
        deactivate: async (): Promise<void> => {
          try {
            console.log(`Plugin ${definition.name} deactivated`);
            this.emit('plugin-deactivated', { pluginId: definition.id });
          } catch (error) {
            this.emit('plugin-deactivation-error', { pluginId: definition.id, error: error.message });
            throw error;
          }
        },
        
        cleanup: async (): Promise<void> => {
          try {
            console.log(`Plugin ${definition.name} cleaned up`);
            this.emit('plugin-cleaned-up', { pluginId: definition.id });
          } catch (error) {
            this.emit('plugin-cleanup-error', { pluginId: definition.id, error: error.message });
            throw error;
          }
        },
        
        // Hook registration with validation
        registerHook: (hookName: string, callback: Function): void => {
          if (!hookName || typeof hookName !== 'string') {
            throw new Error('Hook name must be a non-empty string');
          }
          if (typeof callback !== 'function') {
            throw new Error('Hook callback must be a function');
          }
          this.registerHook(definition.id, hookName, callback);
        },
        
        // Filter registration with validation
        registerFilter: (filterName: string, callback: Function): void => {
          if (!filterName || typeof filterName !== 'string') {
            throw new Error('Filter name must be a non-empty string');
          }
          if (typeof callback !== 'function') {
            throw new Error('Filter callback must be a function');
          }
          this.registerFilter(definition.id, filterName, callback);
        },
        
        // Plugin API methods with type safety
        getConfig: (): Record<string, any> => {
          return definition.manifest.config || {};
        },
        
        setConfig: (config: Record<string, any>): void => {
          if (!config || typeof config !== 'object') {
            throw new Error('Configuration must be an object');
          }
          // Update configuration - in real implementation, this would persist changes
          definition.manifest.config = { ...definition.manifest.config, ...config };
        },
        
        // Healthcare-specific methods with compliance validation
        validateHealthcareData: (data: any): boolean => {
          if (!data) {
            return false;
          }
          
          // Basic healthcare data validation
          if (definition.healthcare_compliance?.hipaa && !this.isHIPAACompliant(data)) {
            console.warn('Healthcare data does not meet HIPAA compliance requirements');
            return false;
          }
          
          return true;
        },
        
        logAuditEvent: (event: string, data: any): void => {
          if (!event || typeof event !== 'string') {
            throw new Error('Audit event must be a non-empty string');
          }
          
          // Log audit event for compliance
          const auditLog = {
            pluginId: definition.id,
            event,
            data: this.sanitizeAuditData(data),
            timestamp: new Date().toISOString(),
            userId: 'current_user' // Would come from auth context
          };
          
          console.log(`Audit: ${event}`, auditLog);
          this.emit('audit-log', auditLog);
        }
      };

      // Initialize the plugin with error handling
      if (typeof pluginInstance.init === 'function') {
        await pluginInstance.init();
      }

      return pluginInstance;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load plugin code: ${errorMessage}`);
    }
  }

  /**
   * Check if data is HIPAA compliant
   */
  private isHIPAACompliant(data: any): boolean {
    // Basic HIPAA compliance check
    // In a real implementation, this would be more comprehensive
    if (typeof data === 'object' && data !== null) {
      // Check for common PHI indicators
      const phiIndicators = ['ssn', 'patient_id', 'medical_record', 'diagnosis'];
      const dataStr = JSON.stringify(data).toLowerCase();
      return !phiIndicators.some(indicator => dataStr.includes(indicator));
    }
    return true;
  }

  /**
   * Sanitize audit data to remove sensitive information
   */
  private sanitizeAuditData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'ssn', 'patient_id'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Register plugin hooks and filters
   */
  private registerPluginHooks(pluginId: string, instance: any): void {
    // Register common WordPress-style hooks
    const commonHooks = [
      'init',
      'admin_init',
      'wp_enqueue_scripts',
      'admin_enqueue_scripts',
      'wp_head',
      'wp_footer',
      'admin_head',
      'admin_footer',
      'content_save_pre',
      'content_filter',
      'the_content',
      'the_title',
      'the_excerpt'
    ];

    // Register hooks if the plugin instance has them
    commonHooks.forEach(hookName => {
      if (instance[hookName] && typeof instance[hookName] === 'function') {
        this.registerHook(pluginId, hookName, instance[hookName].bind(instance));
      }
    });

    // Register custom hooks from manifest
    if (instance.manifest && instance.manifest.hooks) {
      instance.manifest.hooks.forEach((hook: any) => {
        if (instance[hook.name] && typeof instance[hook.name] === 'function') {
          this.registerHook(pluginId, hook.name, instance[hook.name].bind(instance));
        }
      });
    }
  }

  /**
   * Unregister plugin hooks and filters
   */
  private unregisterPluginHooks(pluginId: string): void {
    // Remove from hooks
    for (const [hookName, hookMap] of this.pluginHooks) {
      hookMap.delete(pluginId);
      if (hookMap.size === 0) {
        this.pluginHooks.delete(hookName);
      }
    }

    // Remove from filters
    for (const [filterName, filterMap] of this.pluginFilters) {
      filterMap.delete(pluginId);
      if (filterMap.size === 0) {
        this.pluginFilters.delete(filterName);
      }
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('plugin-loaded', (data) => {
      console.log(`Plugin loaded: ${data.pluginId}`);
    });

    this.on('plugin-unloaded', (data) => {
      console.log(`Plugin unloaded: ${data.pluginId}`);
    });

    this.on('plugin-load-error', (data) => {
      console.error(`Plugin load error: ${data.pluginId} - ${data.error}`);
    });

    this.on('plugin-quarantined', (data) => {
      console.warn(`Plugin quarantined: ${data.pluginId} - ${data.reason}`);
    });
  }

  /**
   * Get plugin health status
   */
  async getPluginHealth(pluginId: string): Promise<any> {
    const loadedPlugin = this.loadedPlugins.get(pluginId);
    if (!loadedPlugin) {
      return { status: 'not_loaded' };
    }

    try {
      // Check sandbox health
      const sandboxHealth = await this.sandboxManager.getSandboxHealth(pluginId);
      
      return {
        status: loadedPlugin.status,
        loadedAt: loadedPlugin.loadedAt,
        sandboxHealth,
        hooks: this.pluginHooks.size,
        filters: this.pluginFilters.size
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Shutdown the plugin loader
   */
  async shutdown(): Promise<void> {
    // Unload all plugins
    const pluginIds = Array.from(this.loadedPlugins.keys());
    for (const pluginId of pluginIds) {
      try {
        await this.unloadPlugin(pluginId);
      } catch (error) {
        console.error(`Error unloading plugin ${pluginId}:`, error);
      }
    }

    // Cleanup sandbox manager
    await this.sandboxManager.shutdown();

    this.removeAllListeners();
  }
}

export default PluginLoader;
