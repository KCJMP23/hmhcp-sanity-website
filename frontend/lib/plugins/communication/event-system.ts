// Plugin Event System
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { EventEmitter } from 'events';
import { PluginCommunicationManager, PluginEvent } from './communication-manager';

export interface EventSubscription {
  id: string;
  pluginId: string;
  eventName: string;
  handler: (event: PluginEvent) => void;
  filter?: (event: PluginEvent) => boolean;
  priority: number;
  once: boolean;
  created_at: string;
}

export interface EventFilter {
  eventName: string;
  conditions: Record<string, any>;
  operator: 'and' | 'or';
}

export interface EventMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  averageProcessingTime: number;
  errorRate: number;
  topEvents: Array<{ name: string; count: number }>;
}

export class PluginEventSystem extends EventEmitter {
  private communicationManager: PluginCommunicationManager;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHistory: PluginEvent[] = [];
  private metrics: EventMetrics = {
    totalEvents: 0,
    eventsPerSecond: 0,
    averageProcessingTime: 0,
    errorRate: 0,
    topEvents: []
  };
  private processingTimes: number[] = [];
  private errorCount: number = 0;
  private lastSecond: number = Date.now();
  private eventsThisSecond: number = 0;

  constructor(communicationManager: PluginCommunicationManager) {
    super();
    this.communicationManager = communicationManager;
    this.startMetricsCollection();
  }

  /**
   * Subscribe to an event
   */
  subscribe(
    pluginId: string,
    eventName: string,
    handler: (event: PluginEvent) => void,
    options: {
      filter?: (event: PluginEvent) => boolean;
      priority?: number;
      once?: boolean;
    } = {}
  ): string {
    const subscription: EventSubscription = {
      id: this.generateSubscriptionId(),
      pluginId,
      eventName,
      handler,
      filter: options.filter,
      priority: options.priority || 0,
      once: options.once || false,
      created_at: new Date().toISOString()
    };

    this.subscriptions.set(subscription.id, subscription);

    // Register with communication manager
    this.communicationManager.registerMessageHandler(
      pluginId,
      'event',
      (message) => {
        if (message.eventName === eventName) {
          this.handleEvent(message.data);
        }
      }
    );

    this.emit('subscriptionCreated', { subscription });
    return subscription.id;
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      this.emit('subscriptionRemoved', { subscriptionId });
    }
  }

  /**
   * Emit an event
   */
  async emitEvent(
    sourcePluginId: string,
    eventName: string,
    data: any,
    options: {
      propagation?: 'stop' | 'continue';
      targetPlugins?: string[];
      channelId?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      ttl?: number;
    } = {}
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const event: PluginEvent = {
        name: eventName,
        data,
        source: sourcePluginId,
        timestamp: new Date().toISOString(),
        propagation: options.propagation || 'continue'
      };

      // Add to event history
      this.eventHistory.push(event);
      if (this.eventHistory.length > 1000) {
        this.eventHistory = this.eventHistory.slice(-1000);
      }

      // Update metrics
      this.updateMetrics(event);

      // Find matching subscriptions
      const matchingSubscriptions = this.getMatchingSubscriptions(event);

      // Process subscriptions in priority order
      const sortedSubscriptions = matchingSubscriptions.sort(
        (a, b) => b.priority - a.priority
      );

      for (const subscription of sortedSubscriptions) {
        try {
          // Apply filter if present
          if (subscription.filter && !subscription.filter(event)) {
            continue;
          }

          // Call handler
          subscription.handler(event);

          // Remove subscription if it's a one-time subscription
          if (subscription.once) {
            this.unsubscribe(subscription.id);
          }

          // Stop propagation if requested
          if (event.propagation === 'stop') {
            break;
          }

        } catch (error) {
          console.error('Event handler error:', error);
          this.errorCount++;
        }
      }

      // Broadcast to target plugins if specified
      if (options.targetPlugins) {
        for (const pluginId of options.targetPlugins) {
          await this.communicationManager.sendMessage(
            sourcePluginId,
            pluginId,
            'event',
            event,
            {
              eventName,
              priority: options.priority,
              ttl: options.ttl
            }
          );
        }
      }

      // Broadcast to channel if specified
      if (options.channelId) {
        await this.communicationManager.broadcastMessage(
          sourcePluginId,
          options.channelId,
          eventName,
          event,
          {
            priority: options.priority,
            ttl: options.ttl
          }
        );
      }

      // Record processing time
      const processingTime = Date.now() - startTime;
      this.processingTimes.push(processingTime);
      if (this.processingTimes.length > 100) {
        this.processingTimes = this.processingTimes.slice(-100);
      }

    } catch (error) {
      console.error('Failed to emit event:', error);
      this.errorCount++;
    }
  }

  /**
   * Get event history
   */
  getEventHistory(
    filters: {
      eventName?: string;
      sourcePluginId?: string;
      limit?: number;
      since?: string;
    } = {}
  ): PluginEvent[] {
    let events = this.eventHistory;

    if (filters.eventName) {
      events = events.filter(event => event.name === filters.eventName);
    }

    if (filters.sourcePluginId) {
      events = events.filter(event => event.source === filters.sourcePluginId);
    }

    if (filters.since) {
      const sinceTime = new Date(filters.since).getTime();
      events = events.filter(event => 
        new Date(event.timestamp).getTime() >= sinceTime
      );
    }

    if (filters.limit) {
      events = events.slice(-filters.limit);
    }

    return events;
  }

  /**
   * Get event metrics
   */
  getEventMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  /**
   * Get subscriptions for a plugin
   */
  getPluginSubscriptions(pluginId: string): EventSubscription[] {
    return Array.from(this.subscriptions.values())
      .filter(subscription => subscription.pluginId === pluginId);
  }

  /**
   * Get subscriptions for an event
   */
  getEventSubscriptions(eventName: string): EventSubscription[] {
    return Array.from(this.subscriptions.values())
      .filter(subscription => subscription.eventName === eventName);
  }

  /**
   * Create event filter
   */
  createEventFilter(
    eventName: string,
    conditions: Record<string, any>,
    operator: 'and' | 'or' = 'and'
  ): EventFilter {
    return {
      eventName,
      conditions,
      operator
    };
  }

  /**
   * Apply event filter
   */
  applyEventFilter(events: PluginEvent[], filter: EventFilter): PluginEvent[] {
    return events.filter(event => {
      if (event.name !== filter.eventName) {
        return false;
      }

      const conditions = Object.entries(filter.conditions);
      if (filter.operator === 'and') {
        return conditions.every(([key, value]) => 
          this.getNestedValue(event.data, key) === value
        );
      } else {
        return conditions.some(([key, value]) => 
          this.getNestedValue(event.data, key) === value
        );
      }
    });
  }

  /**
   * Get event statistics
   */
  getEventStatistics(): {
    totalEvents: number;
    uniqueEvents: number;
    activeSubscriptions: number;
    averageProcessingTime: number;
    errorRate: number;
    eventsPerSecond: number;
    topEvents: Array<{ name: string; count: number }>;
  } {
    const uniqueEvents = new Set(this.eventHistory.map(event => event.name)).size;
    const activeSubscriptions = this.subscriptions.size;
    const averageProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length
      : 0;
    const errorRate = this.metrics.totalEvents > 0
      ? (this.errorCount / this.metrics.totalEvents) * 100
      : 0;

    // Calculate top events
    const eventCounts = new Map<string, number>();
    this.eventHistory.forEach(event => {
      const count = eventCounts.get(event.name) || 0;
      eventCounts.set(event.name, count + 1);
    });

    const topEvents = Array.from(eventCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: this.metrics.totalEvents,
      uniqueEvents,
      activeSubscriptions,
      averageProcessingTime,
      errorRate,
      eventsPerSecond: this.metrics.eventsPerSecond,
      topEvents
    };
  }

  /**
   * Clear event history
   */
  clearEventHistory(): void {
    this.eventHistory = [];
    this.emit('eventHistoryCleared');
  }

  /**
   * Get matching subscriptions for an event
   */
  private getMatchingSubscriptions(event: PluginEvent): EventSubscription[] {
    return Array.from(this.subscriptions.values())
      .filter(subscription => subscription.eventName === event.name);
  }

  /**
   * Handle event from communication manager
   */
  private handleEvent(event: PluginEvent): void {
    this.emitEvent(
      event.source,
      event.name,
      event.data,
      { propagation: event.propagation }
    );
  }

  /**
   * Update metrics
   */
  private updateMetrics(event: PluginEvent): void {
    this.metrics.totalEvents++;
    this.eventsThisSecond++;

    // Update events per second
    const now = Date.now();
    if (now - this.lastSecond >= 1000) {
      this.metrics.eventsPerSecond = this.eventsThisSecond;
      this.eventsThisSecond = 0;
      this.lastSecond = now;
    }

    // Update error rate
    this.metrics.errorRate = this.metrics.totalEvents > 0
      ? (this.errorCount / this.metrics.totalEvents) * 100
      : 0;

    // Update top events
    const eventCounts = new Map<string, number>();
    this.eventHistory.forEach(e => {
      const count = eventCounts.get(e.name) || 0;
      eventCounts.set(e.name, count + 1);
    });

    this.metrics.topEvents = Array.from(eventCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetricsCollection();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Update metrics collection
   */
  private updateMetricsCollection(): void {
    // Update average processing time
    if (this.processingTimes.length > 0) {
      this.metrics.averageProcessingTime = this.processingTimes.reduce(
        (sum, time) => sum + time, 0
      ) / this.processingTimes.length;
    }
  }

  /**
   * Generate subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
