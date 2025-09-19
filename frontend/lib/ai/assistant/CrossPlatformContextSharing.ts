/**
 * Cross-Platform Context Sharing
 * Enables context sharing across different platforms and devices
 */

import { createClient } from '@/lib/supabase/client';
import { AssistantContext } from './AIAssistantCore';

export interface SharedContext {
  id: string;
  userId: string;
  sessionId: string;
  platform: 'web' | 'mobile' | 'desktop' | 'api';
  deviceType: 'computer' | 'tablet' | 'phone' | 'other';
  context: AssistantContext;
  metadata: {
    version: string;
    lastUpdated: Date;
    expiresAt: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    healthcareRelevant: boolean;
    complianceLevel: string;
  };
  sharingRules: {
    allowCrossPlatform: boolean;
    allowCrossDevice: boolean;
    allowExternalSharing: boolean;
    retentionPeriod: number; // in hours
    encryptionRequired: boolean;
  };
}

export interface ContextSyncEvent {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'sync';
  platform: string;
  deviceType: string;
  contextId: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface ContextConflict {
  id: string;
  contextId: string;
  conflictType: 'concurrent_edit' | 'version_mismatch' | 'data_inconsistency';
  platforms: string[];
  resolution: 'manual' | 'automatic' | 'pending';
  details: {
    field: string;
    localValue: any;
    remoteValue: any;
    suggestedValue: any;
  }[];
}

export class CrossPlatformContextSharing {
  private supabase = createClient();
  private currentPlatform: string;
  private currentDeviceType: string;
  private syncInterval: NodeJS.Timeout | null = null;
  private conflictResolutionQueue: ContextConflict[] = [];

  constructor(platform: string = 'web', deviceType: string = 'computer') {
    this.currentPlatform = platform;
    this.currentDeviceType = deviceType;
    this.startSync();
  }

  /**
   * Start cross-platform context synchronization
   */
  startSync(): void {
    // Sync every 30 seconds
    this.syncInterval = setInterval(() => {
      this.syncContexts();
    }, 30000);
  }

  /**
   * Stop cross-platform context synchronization
   */
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Share context across platforms
   */
  async shareContext(
    userId: string,
    sessionId: string,
    context: AssistantContext,
    sharingRules: Partial<SharedContext['sharingRules']> = {}
  ): Promise<SharedContext> {
    try {
      const sharedContext: SharedContext = {
        id: `shared_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        sessionId,
        platform: this.currentPlatform as any,
        deviceType: this.currentDeviceType as any,
        context,
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          priority: this.calculatePriority(context),
          tags: this.generateTags(context),
          healthcareRelevant: this.isHealthcareRelevant(context),
          complianceLevel: context.medicalContext?.complianceLevel || 'institutional'
        },
        sharingRules: {
          allowCrossPlatform: true,
          allowCrossDevice: true,
          allowExternalSharing: false,
          retentionPeriod: 24,
          encryptionRequired: context.medicalContext?.complianceLevel === 'hipaa',
          ...sharingRules
        }
      };

      // Store in database
      await this.supabase
        .from('ai_assistant_context_history')
        .insert({
          user_id: userId,
          session_id: sessionId,
          context_snapshot: context,
          context_analysis: {
            platform: this.currentPlatform,
            deviceType: this.currentDeviceType,
            sharingRules: sharedContext.sharingRules,
            metadata: sharedContext.metadata
          }
        });

      // Log sync event
      await this.logSyncEvent('create', userId, sharedContext.id);

      return sharedContext;
    } catch (error) {
      console.error('Failed to share context:', error);
      throw error;
    }
  }

  /**
   * Get shared contexts for user
   */
  async getSharedContexts(
    userId: string,
    filters: {
      platform?: string;
      deviceType?: string;
      healthcareRelevant?: boolean;
      complianceLevel?: string;
      tags?: string[];
    } = {}
  ): Promise<SharedContext[]> {
    try {
      let query = this.supabase
        .from('ai_assistant_context_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters.platform) {
        query = query.eq('context_analysis->platform', filters.platform);
      }

      if (filters.healthcareRelevant !== undefined) {
        query = query.eq('context_analysis->healthcareRelevant', filters.healthcareRelevant);
      }

      if (filters.complianceLevel) {
        query = query.eq('context_analysis->complianceLevel', filters.complianceLevel);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        sessionId: item.session_id,
        platform: item.context_analysis.platform,
        deviceType: item.context_analysis.deviceType,
        context: item.context_snapshot,
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date(item.created_at),
          expiresAt: new Date(item.created_at),
          priority: item.context_analysis.metadata?.priority || 'medium',
          tags: item.context_analysis.metadata?.tags || [],
          healthcareRelevant: item.context_analysis.healthcareRelevant,
          complianceLevel: item.context_analysis.complianceLevel
        },
        sharingRules: item.context_analysis.sharingRules || {}
      }));
    } catch (error) {
      console.error('Failed to get shared contexts:', error);
      return [];
    }
  }

  /**
   * Update shared context
   */
  async updateSharedContext(
    contextId: string,
    updates: Partial<AssistantContext>,
    userId: string
  ): Promise<SharedContext | null> {
    try {
      // Get current context
      const { data: currentData, error: fetchError } = await this.supabase
        .from('ai_assistant_context_history')
        .select('*')
        .eq('id', contextId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !currentData) {
        throw new Error('Context not found');
      }

      // Check for conflicts
      const conflicts = await this.detectConflicts(contextId, updates);
      if (conflicts.length > 0) {
        await this.handleConflicts(conflicts);
        return null; // Return null to indicate conflicts need resolution
      }

      // Update context
      const updatedContext = {
        ...currentData.context_snapshot,
        ...updates
      };

      await this.supabase
        .from('ai_assistant_context_history')
        .update({
          context_snapshot: updatedContext,
          context_analysis: {
            ...currentData.context_analysis,
            lastUpdated: new Date().toISOString(),
            version: this.incrementVersion(currentData.context_analysis.version || '1.0.0')
          }
        })
        .eq('id', contextId);

      // Log sync event
      await this.logSyncEvent('update', userId, contextId);

      return {
        id: contextId,
        userId: currentData.user_id,
        sessionId: currentData.session_id,
        platform: currentData.context_analysis.platform,
        deviceType: currentData.context_analysis.deviceType,
        context: updatedContext,
        metadata: {
          version: this.incrementVersion(currentData.context_analysis.version || '1.0.0'),
          lastUpdated: new Date(),
          expiresAt: new Date(currentData.created_at),
          priority: currentData.context_analysis.metadata?.priority || 'medium',
          tags: currentData.context_analysis.metadata?.tags || [],
          healthcareRelevant: currentData.context_analysis.healthcareRelevant,
          complianceLevel: currentData.context_analysis.complianceLevel
        },
        sharingRules: currentData.context_analysis.sharingRules || {}
      };
    } catch (error) {
      console.error('Failed to update shared context:', error);
      throw error;
    }
  }

  /**
   * Sync contexts across platforms
   */
  async syncContexts(): Promise<void> {
    try {
      // Get all contexts that need syncing
      const { data: contexts, error } = await this.supabase
        .from('ai_assistant_context_history')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process each context for potential conflicts
      for (const context of contexts || []) {
        await this.processContextForSync(context);
      }

      // Resolve any pending conflicts
      await this.resolveConflicts();
    } catch (error) {
      console.error('Failed to sync contexts:', error);
    }
  }

  /**
   * Detect conflicts between local and remote contexts
   */
  async detectConflicts(
    contextId: string,
    localUpdates: Partial<AssistantContext>
  ): Promise<ContextConflict[]> {
    try {
      const { data: remoteContext, error } = await this.supabase
        .from('ai_assistant_context_history')
        .select('*')
        .eq('id', contextId)
        .single();

      if (error || !remoteContext) return [];

      const conflicts: ContextConflict[] = [];
      const remote = remoteContext.context_snapshot;

      // Check for concurrent edits
      const timeDiff = Date.now() - new Date(remoteContext.updated_at || remoteContext.created_at).getTime();
      if (timeDiff < 5000) { // 5 seconds
        conflicts.push({
          id: `conflict_${Date.now()}`,
          contextId,
          conflictType: 'concurrent_edit',
          platforms: [this.currentPlatform],
          resolution: 'pending',
          details: []
        });
      }

      // Check for data inconsistencies
      const fields = ['currentPage', 'currentTask', 'userIntent'] as const;
      for (const field of fields) {
        if (localUpdates[field] && remote[field] && localUpdates[field] !== remote[field]) {
          conflicts.push({
            id: `conflict_${Date.now()}_${field}`,
            contextId,
            conflictType: 'data_inconsistency',
            platforms: [this.currentPlatform],
            resolution: 'pending',
            details: [{
              field,
              localValue: localUpdates[field],
              remoteValue: remote[field],
              suggestedValue: this.resolveFieldConflict(field, localUpdates[field], remote[field])
            }]
          });
        }
      }

      return conflicts;
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
      return [];
    }
  }

  /**
   * Handle context conflicts
   */
  async handleConflicts(conflicts: ContextConflict[]): Promise<void> {
    for (const conflict of conflicts) {
      this.conflictResolutionQueue.push(conflict);
      
      // Log conflict
      await this.supabase
        .from('ai_assistant_audit_log')
        .insert({
          user_id: 'system',
          activity_type: 'context_conflict_detected',
          activity_data: {
            conflictId: conflict.id,
            conflictType: conflict.conflictType,
            platforms: conflict.platforms
          },
          compliance_level: 'institutional'
        });
    }
  }

  /**
   * Resolve pending conflicts
   */
  async resolveConflicts(): Promise<void> {
    for (const conflict of this.conflictResolutionQueue) {
      if (conflict.resolution === 'automatic') {
        await this.resolveConflictAutomatically(conflict);
      }
    }

    // Remove resolved conflicts
    this.conflictResolutionQueue = this.conflictResolutionQueue.filter(
      conflict => conflict.resolution === 'pending'
    );
  }

  /**
   * Resolve conflict automatically
   */
  private async resolveConflictAutomatically(conflict: ContextConflict): Promise<void> {
    try {
      // Use the suggested values to resolve conflicts
      const updates: Partial<AssistantContext> = {};
      
      for (const detail of conflict.details) {
        updates[detail.field as keyof AssistantContext] = detail.suggestedValue;
      }

      await this.updateSharedContext(conflict.contextId, updates, 'system');
      
      // Log resolution
      await this.supabase
        .from('ai_assistant_audit_log')
        .insert({
          user_id: 'system',
          activity_type: 'context_conflict_resolved',
          activity_data: {
            conflictId: conflict.id,
            resolution: 'automatic'
          },
          compliance_level: 'institutional'
        });
    } catch (error) {
      console.error('Failed to resolve conflict automatically:', error);
    }
  }

  /**
   * Process context for sync
   */
  private async processContextForSync(context: any): Promise<void> {
    // Check if context needs to be synced to other platforms
    const sharingRules = context.context_analysis.sharingRules;
    
    if (sharingRules?.allowCrossPlatform) {
      // Implement cross-platform sync logic
      await this.syncToOtherPlatforms(context);
    }
  }

  /**
   * Sync context to other platforms
   */
  private async syncToOtherPlatforms(context: any): Promise<void> {
    // This would integrate with platform-specific APIs
    // For now, we'll just log the sync event
    await this.logSyncEvent('sync', context.user_id, context.id);
  }

  /**
   * Log sync event
   */
  private async logSyncEvent(
    action: ContextSyncEvent['action'],
    userId: string,
    contextId: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('ai_assistant_audit_log')
        .insert({
          user_id: userId,
          activity_type: 'context_sync',
          activity_data: {
            action,
            platform: this.currentPlatform,
            deviceType: this.currentDeviceType,
            contextId,
            timestamp: new Date().toISOString()
          },
          compliance_level: 'institutional'
        });
    } catch (error) {
      console.error('Failed to log sync event:', error);
    }
  }

  /**
   * Calculate context priority
   */
  private calculatePriority(context: AssistantContext): 'low' | 'medium' | 'high' | 'critical' {
    if (context.medicalContext?.complianceLevel === 'hipaa') return 'critical';
    if (context.medicalContext?.patientSafety) return 'high';
    if (context.currentTask?.includes('urgent')) return 'high';
    if (context.currentPage?.includes('analytics')) return 'medium';
    return 'low';
  }

  /**
   * Generate context tags
   */
  private generateTags(context: AssistantContext): string[] {
    const tags: string[] = [];
    
    if (context.currentPage) tags.push(`page:${context.currentPage}`);
    if (context.currentTask) tags.push(`task:${context.currentTask}`);
    if (context.medicalContext?.specialty) tags.push(`specialty:${context.medicalContext.specialty}`);
    if (context.medicalContext?.complianceLevel) tags.push(`compliance:${context.medicalContext.complianceLevel}`);
    
    return tags;
  }

  /**
   * Check if context is healthcare relevant
   */
  private isHealthcareRelevant(context: AssistantContext): boolean {
    const healthcareKeywords = [
      'patient', 'medical', 'clinical', 'healthcare', 'diagnosis', 'treatment',
      'therapy', 'medication', 'surgery', 'nursing', 'physician', 'doctor'
    ];
    
    const text = `${context.currentPage} ${context.currentTask} ${context.userIntent}`.toLowerCase();
    return healthcareKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Resolve field conflict
   */
  private resolveFieldConflict(field: string, localValue: any, remoteValue: any): any {
    // Simple conflict resolution - prefer the more recent value
    // In a real implementation, this would be more sophisticated
    return localValue || remoteValue;
  }

  /**
   * Increment version number
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }
}
