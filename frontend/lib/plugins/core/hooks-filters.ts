/**
 * Hooks and Filters System - WordPress-style Plugin Integration
 * Story 02: WordPress-Style Plugin Architecture Implementation
 */

import { EventEmitter } from 'events';

export interface HookCallback {
  id: string;
  pluginId: string;
  hookName: string;
  callback: Function;
  priority: number;
  active: boolean;
  createdAt: Date;
}

export interface FilterCallback {
  id: string;
  pluginId: string;
  filterName: string;
  callback: Function;
  priority: number;
  active: boolean;
  createdAt: Date;
}

export interface HookResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

export interface FilterResult {
  success: boolean;
  value: any;
  error?: string;
  executionTime: number;
}

export class HooksFiltersSystem extends EventEmitter {
  private readonly hooks = new Map<string, HookCallback[]>();
  private readonly filters = new Map<string, FilterCallback[]>();
  private readonly executionStats = new Map<string, { count: number; totalTime: number; errors: number }>();

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Register a hook callback
   */
  registerHook(
    pluginId: string,
    hookName: string,
    callback: Function,
    priority: number = 10
  ): string {
    const hookId = `hook_${pluginId}_${hookName}_${Date.now()}`;
    
    const hookCallback: HookCallback = {
      id: hookId,
      pluginId,
      hookName,
      callback,
      priority,
      active: true,
      createdAt: new Date()
    };

    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const hookList = this.hooks.get(hookName)!;
    hookList.push(hookCallback);
    
    // Sort by priority (lower number = higher priority)
    hookList.sort((a, b) => a.priority - b.priority);

    this.emit('hook-registered', { pluginId, hookName, hookId });
    
    return hookId;
  }

  /**
   * Register a filter callback
   */
  registerFilter(
    pluginId: string,
    filterName: string,
    callback: Function,
    priority: number = 10
  ): string {
    const filterId = `filter_${pluginId}_${filterName}_${Date.now()}`;
    
    const filterCallback: FilterCallback = {
      id: filterId,
      pluginId,
      filterName,
      callback,
      priority,
      active: true,
      createdAt: new Date()
    };

    if (!this.filters.has(filterName)) {
      this.filters.set(filterName, []);
    }

    const filterList = this.filters.get(filterName)!;
    filterList.push(filterCallback);
    
    // Sort by priority (lower number = higher priority)
    filterList.sort((a, b) => a.priority - b.priority);

    this.emit('filter-registered', { pluginId, filterName, filterId });
    
    return filterId;
  }

  /**
   * Execute a hook
   */
  async executeHook(hookName: string, ...args: any[]): Promise<HookResult[]> {
    const hookCallbacks = this.hooks.get(hookName) || [];
    const results: HookResult[] = [];

    this.emit('hook-executing', { hookName, callbackCount: hookCallbacks.length });

    for (const hookCallback of hookCallbacks) {
      if (!hookCallback.active) {
        continue;
      }

      const startTime = Date.now();
      
      try {
        const result = await hookCallback.callback(...args);
        const executionTime = Date.now() - startTime;
        
        results.push({
          success: true,
          result,
          executionTime
        });

        this.updateExecutionStats(hookName, executionTime, false);

      } catch (error) {
        const executionTime = Date.now() - startTime;
        
        results.push({
          success: false,
          error: error.message,
          executionTime
        });

        this.updateExecutionStats(hookName, executionTime, true);
        
        this.emit('hook-error', {
          pluginId: hookCallback.pluginId,
          hookName,
          error: error.message
        });
      }
    }

    this.emit('hook-executed', { hookName, results: results.length });
    
    return results;
  }

  /**
   * Apply a filter
   */
  async applyFilter(filterName: string, value: any, ...args: any[]): Promise<any> {
    const filterCallbacks = this.filters.get(filterName) || [];
    let filteredValue = value;

    this.emit('filter-applying', { filterName, callbackCount: filterCallbacks.length });

    for (const filterCallback of filterCallbacks) {
      if (!filterCallback.active) {
        continue;
      }

      const startTime = Date.now();
      
      try {
        filteredValue = await filterCallback.callback(filteredValue, ...args);
        const executionTime = Date.now() - startTime;
        
        this.updateExecutionStats(filterName, executionTime, false);

      } catch (error) {
        const executionTime = Date.now() - startTime;
        
        this.updateExecutionStats(filterName, executionTime, true);
        
        this.emit('filter-error', {
          pluginId: filterCallback.pluginId,
          filterName,
          error: error.message
        });
        
        // Continue with previous value on error
      }
    }

    this.emit('filter-applied', { filterName, finalValue: filteredValue });
    
    return filteredValue;
  }

  /**
   * Remove a hook callback
   */
  removeHook(hookId: string): boolean {
    for (const [hookName, hookCallbacks] of this.hooks) {
      const index = hookCallbacks.findIndex(hook => hook.id === hookId);
      if (index !== -1) {
        const removed = hookCallbacks.splice(index, 1)[0];
        this.emit('hook-removed', { pluginId: removed.pluginId, hookName, hookId });
        return true;
      }
    }
    return false;
  }

  /**
   * Remove a filter callback
   */
  removeFilter(filterId: string): boolean {
    for (const [filterName, filterCallbacks] of this.filters) {
      const index = filterCallbacks.findIndex(filter => filter.id === filterId);
      if (index !== -1) {
        const removed = filterCallbacks.splice(index, 1)[0];
        this.emit('filter-removed', { pluginId: removed.pluginId, filterName, filterId });
        return true;
      }
    }
    return false;
  }

  /**
   * Remove all hooks and filters for a plugin
   */
  removePluginHooks(pluginId: string): { hooks: number; filters: number } {
    let hooksRemoved = 0;
    let filtersRemoved = 0;

    // Remove hooks
    for (const [hookName, hookCallbacks] of this.hooks) {
      const originalLength = hookCallbacks.length;
      const filtered = hookCallbacks.filter(hook => hook.pluginId !== pluginId);
      hooksRemoved += originalLength - filtered.length;
      this.hooks.set(hookName, filtered);
    }

    // Remove filters
    for (const [filterName, filterCallbacks] of this.filters) {
      const originalLength = filterCallbacks.length;
      const filtered = filterCallbacks.filter(filter => filter.pluginId !== pluginId);
      filtersRemoved += originalLength - filtered.length;
      this.filters.set(filterName, filtered);
    }

    this.emit('plugin-hooks-removed', { pluginId, hooksRemoved, filtersRemoved });
    
    return { hooks: hooksRemoved, filters: filtersRemoved };
  }

  /**
   * Get all hooks for a plugin
   */
  getPluginHooks(pluginId: string): HookCallback[] {
    const hooks: HookCallback[] = [];
    
    for (const hookCallbacks of this.hooks.values()) {
      hooks.push(...hookCallbacks.filter(hook => hook.pluginId === pluginId));
    }
    
    return hooks;
  }

  /**
   * Get all filters for a plugin
   */
  getPluginFilters(pluginId: string): FilterCallback[] {
    const filters: FilterCallback[] = [];
    
    for (const filterCallbacks of this.filters.values()) {
      filters.push(...filterCallbacks.filter(filter => filter.pluginId === pluginId));
    }
    
    return filters;
  }

  /**
   * Get all registered hooks
   */
  getAllHooks(): { [hookName: string]: HookCallback[] } {
    const result: { [hookName: string]: HookCallback[] } = {};
    
    for (const [hookName, hookCallbacks] of this.hooks) {
      result[hookName] = [...hookCallbacks];
    }
    
    return result;
  }

  /**
   * Get all registered filters
   */
  getAllFilters(): { [filterName: string]: FilterCallback[] } {
    const result: { [filterName: string]: FilterCallback[] } = {};
    
    for (const [filterName, filterCallbacks] of this.filters) {
      result[filterName] = [...filterCallbacks];
    }
    
    return result;
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): { [name: string]: { count: number; totalTime: number; errors: number; avgTime: number } } {
    const stats: { [name: string]: { count: number; totalTime: number; errors: number; avgTime: number } } = {};
    
    for (const [name, stat] of this.executionStats) {
      stats[name] = {
        ...stat,
        avgTime: stat.count > 0 ? stat.totalTime / stat.count : 0
      };
    }
    
    return stats;
  }

  /**
   * Clear execution statistics
   */
  clearExecutionStats(): void {
    this.executionStats.clear();
  }

  /**
   * Update execution statistics
   */
  private updateExecutionStats(name: string, executionTime: number, isError: boolean): void {
    if (!this.executionStats.has(name)) {
      this.executionStats.set(name, { count: 0, totalTime: 0, errors: 0 });
    }
    
    const stats = this.executionStats.get(name)!;
    stats.count++;
    stats.totalTime += executionTime;
    
    if (isError) {
      stats.errors++;
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('hook-registered', (data) => {
      console.log(`Hook registered: ${data.hookName} by plugin ${data.pluginId}`);
    });

    this.on('filter-registered', (data) => {
      console.log(`Filter registered: ${data.filterName} by plugin ${data.pluginId}`);
    });

    this.on('hook-error', (data) => {
      console.error(`Hook error in plugin ${data.pluginId}: ${data.hookName} - ${data.error}`);
    });

    this.on('filter-error', (data) => {
      console.error(`Filter error in plugin ${data.pluginId}: ${data.filterName} - ${data.error}`);
    });
  }

  /**
   * Get system statistics
   */
  getSystemStats(): {
    totalHooks: number;
    totalFilters: number;
    activeHooks: number;
    activeFilters: number;
    pluginCount: number;
  } {
    let totalHooks = 0;
    let totalFilters = 0;
    let activeHooks = 0;
    let activeFilters = 0;
    const pluginIds = new Set<string>();

    // Count hooks
    for (const hookCallbacks of this.hooks.values()) {
      totalHooks += hookCallbacks.length;
      activeHooks += hookCallbacks.filter(hook => hook.active).length;
      hookCallbacks.forEach(hook => pluginIds.add(hook.pluginId));
    }

    // Count filters
    for (const filterCallbacks of this.filters.values()) {
      totalFilters += filterCallbacks.length;
      activeFilters += filterCallbacks.filter(filter => filter.active).length;
      filterCallbacks.forEach(filter => pluginIds.add(filter.pluginId));
    }

    return {
      totalHooks,
      totalFilters,
      activeHooks,
      activeFilters,
      pluginCount: pluginIds.size
    };
  }
}

export default HooksFiltersSystem;
