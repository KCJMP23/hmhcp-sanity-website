// Plugin Data Sharing System
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { createClient } from '@supabase/supabase-js';
import { PluginCommunicationManager } from './communication-manager';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SharedData {
  id: string;
  pluginId: string;
  dataType: string;
  data: any;
  permissions: {
    read: string[];
    write: string[];
    admin: string[];
  };
  encryption: boolean;
  ttl?: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface DataSharingRequest {
  id: string;
  fromPluginId: string;
  toPluginId: string;
  dataType: string;
  permissions: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface DataSharingMetrics {
  totalSharedData: number;
  activeShares: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  dataTypes: Array<{ type: string; count: number }>;
}

export class PluginDataSharingSystem {
  private communicationManager: PluginCommunicationManager;
  private sharedData: Map<string, SharedData> = new Map();
  private sharingRequests: Map<string, DataSharingRequest> = new Map();
  private metrics: DataSharingMetrics = {
    totalSharedData: 0,
    activeShares: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    dataTypes: []
  };

  constructor(communicationManager: PluginCommunicationManager) {
    this.communicationManager = communicationManager;
    this.startCleanupProcess();
  }

  /**
   * Share data with other plugins
   */
  async shareData(
    pluginId: string,
    dataType: string,
    data: any,
    permissions: {
      read: string[];
      write: string[];
      admin: string[];
    },
    options: {
      encryption?: boolean;
      ttl?: number;
      expiresAt?: string;
    } = {}
  ): Promise<string> {
    try {
      const sharedData: SharedData = {
        id: this.generateDataId(),
        pluginId,
        dataType,
        data,
        permissions,
        encryption: options.encryption || false,
        ttl: options.ttl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: options.expiresAt
      };

      // Encrypt data if requested
      if (sharedData.encryption) {
        sharedData.data = await this.encryptData(sharedData.data);
      }

      // Store in memory
      this.sharedData.set(sharedData.id, sharedData);

      // Store in database
      const { error } = await supabase
        .from('plugin_shared_data')
        .insert({
          id: sharedData.id,
          plugin_id: pluginId,
          data_type: dataType,
          data: sharedData.data,
          permissions: permissions,
          encryption: options.encryption || false,
          ttl: options.ttl,
          created_at: sharedData.created_at,
          updated_at: sharedData.updated_at,
          expires_at: options.expiresAt
        });

      if (error) {
        throw new Error(error.message);
      }

      // Update metrics
      this.updateMetrics();

      // Notify plugins about new shared data
      await this.notifyPluginsAboutSharedData(sharedData);

      return sharedData.id;

    } catch (error) {
      console.error('Failed to share data:', error);
      throw error;
    }
  }

  /**
   * Get shared data
   */
  async getSharedData(
    pluginId: string,
    dataId: string
  ): Promise<SharedData | null> {
    try {
      const sharedData = this.sharedData.get(dataId);
      if (!sharedData) {
        return null;
      }

      // Check permissions
      if (!this.hasPermission(sharedData, pluginId, 'read')) {
        throw new Error('Insufficient permissions to read data');
      }

      // Check if data has expired
      if (this.isDataExpired(sharedData)) {
        await this.deleteSharedData(dataId);
        return null;
      }

      // Decrypt data if encrypted
      let data = sharedData.data;
      if (sharedData.encryption) {
        data = await this.decryptData(data);
      }

      return {
        ...sharedData,
        data
      };

    } catch (error) {
      console.error('Failed to get shared data:', error);
      throw error;
    }
  }

  /**
   * Update shared data
   */
  async updateSharedData(
    pluginId: string,
    dataId: string,
    data: any,
    options: {
      permissions?: {
        read: string[];
        write: string[];
        admin: string[];
      };
      ttl?: number;
      expiresAt?: string;
    } = {}
  ): Promise<void> {
    try {
      const sharedData = this.sharedData.get(dataId);
      if (!sharedData) {
        throw new Error('Shared data not found');
      }

      // Check permissions
      if (!this.hasPermission(sharedData, pluginId, 'write')) {
        throw new Error('Insufficient permissions to update data');
      }

      // Update data
      sharedData.data = data;
      sharedData.updated_at = new Date().toISOString();

      if (options.permissions) {
        sharedData.permissions = options.permissions;
      }

      if (options.ttl) {
        sharedData.ttl = options.ttl;
      }

      if (options.expiresAt) {
        sharedData.expires_at = options.expiresAt;
      }

      // Encrypt data if needed
      if (sharedData.encryption) {
        sharedData.data = await this.encryptData(sharedData.data);
      }

      // Update in database
      const { error } = await supabase
        .from('plugin_shared_data')
        .update({
          data: sharedData.data,
          permissions: sharedData.permissions,
          ttl: sharedData.ttl,
          expires_at: sharedData.expires_at,
          updated_at: sharedData.updated_at
        })
        .eq('id', dataId);

      if (error) {
        throw new Error(error.message);
      }

      // Notify plugins about updated data
      await this.notifyPluginsAboutUpdatedData(sharedData);

    } catch (error) {
      console.error('Failed to update shared data:', error);
      throw error;
    }
  }

  /**
   * Delete shared data
   */
  async deleteSharedData(
    pluginId: string,
    dataId: string
  ): Promise<void> {
    try {
      const sharedData = this.sharedData.get(dataId);
      if (!sharedData) {
        throw new Error('Shared data not found');
      }

      // Check permissions
      if (!this.hasPermission(sharedData, pluginId, 'admin')) {
        throw new Error('Insufficient permissions to delete data');
      }

      // Remove from memory
      this.sharedData.delete(dataId);

      // Remove from database
      const { error } = await supabase
        .from('plugin_shared_data')
        .delete()
        .eq('id', dataId);

      if (error) {
        throw new Error(error.message);
      }

      // Update metrics
      this.updateMetrics();

      // Notify plugins about deleted data
      await this.notifyPluginsAboutDeletedData(dataId);

    } catch (error) {
      console.error('Failed to delete shared data:', error);
      throw error;
    }
  }

  /**
   * Request data sharing permission
   */
  async requestDataSharing(
    fromPluginId: string,
    toPluginId: string,
    dataType: string,
    permissions: string[],
    reason: string
  ): Promise<string> {
    try {
      const request: DataSharingRequest = {
        id: this.generateRequestId(),
        fromPluginId,
        toPluginId,
        dataType,
        permissions,
        reason,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store in memory
      this.sharingRequests.set(request.id, request);

      // Store in database
      const { error } = await supabase
        .from('plugin_data_sharing_requests')
        .insert({
          id: request.id,
          from_plugin_id: fromPluginId,
          to_plugin_id: toPluginId,
          data_type: dataType,
          permissions: permissions,
          reason: reason,
          status: 'pending',
          created_at: request.created_at,
          updated_at: request.updated_at
        });

      if (error) {
        throw new Error(error.message);
      }

      // Update metrics
      this.updateMetrics();

      // Notify target plugin about request
      await this.communicationManager.sendMessage(
        fromPluginId,
        toPluginId,
        'request',
        {
          type: 'data_sharing_request',
          requestId: request.id,
          dataType,
          permissions,
          reason
        }
      );

      return request.id;

    } catch (error) {
      console.error('Failed to request data sharing:', error);
      throw error;
    }
  }

  /**
   * Approve data sharing request
   */
  async approveDataSharingRequest(
    pluginId: string,
    requestId: string
  ): Promise<void> {
    try {
      const request = this.sharingRequests.get(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      if (request.toPluginId !== pluginId) {
        throw new Error('Unauthorized to approve this request');
      }

      // Update request status
      request.status = 'approved';
      request.updated_at = new Date().toISOString();

      // Update in database
      const { error } = await supabase
        .from('plugin_data_sharing_requests')
        .update({
          status: 'approved',
          updated_at: request.updated_at
        })
        .eq('id', requestId);

      if (error) {
        throw new Error(error.message);
      }

      // Update metrics
      this.updateMetrics();

      // Notify requesting plugin about approval
      await this.communicationManager.sendMessage(
        pluginId,
        request.fromPluginId,
        'response',
        {
          type: 'data_sharing_approved',
          requestId: request.id
        }
      );

    } catch (error) {
      console.error('Failed to approve data sharing request:', error);
      throw error;
    }
  }

  /**
   * Reject data sharing request
   */
  async rejectDataSharingRequest(
    pluginId: string,
    requestId: string,
    reason?: string
  ): Promise<void> {
    try {
      const request = this.sharingRequests.get(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      if (request.toPluginId !== pluginId) {
        throw new Error('Unauthorized to reject this request');
      }

      // Update request status
      request.status = 'rejected';
      request.updated_at = new Date().toISOString();

      // Update in database
      const { error } = await supabase
        .from('plugin_data_sharing_requests')
        .update({
          status: 'rejected',
          updated_at: request.updated_at
        })
        .eq('id', requestId);

      if (error) {
        throw new Error(error.message);
      }

      // Update metrics
      this.updateMetrics();

      // Notify requesting plugin about rejection
      await this.communicationManager.sendMessage(
        pluginId,
        request.fromPluginId,
        'response',
        {
          type: 'data_sharing_rejected',
          requestId: request.id,
          reason
        }
      );

    } catch (error) {
      console.error('Failed to reject data sharing request:', error);
      throw error;
    }
  }

  /**
   * Get shared data for a plugin
   */
  async getSharedDataForPlugin(
    pluginId: string,
    filters: {
      dataType?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<SharedData[]> {
    try {
      let data = Array.from(this.sharedData.values())
        .filter(sharedData => this.hasPermission(sharedData, pluginId, 'read'));

      if (filters.dataType) {
        data = data.filter(sharedData => sharedData.dataType === filters.dataType);
      }

      if (filters.offset) {
        data = data.slice(filters.offset);
      }

      if (filters.limit) {
        data = data.slice(0, filters.limit);
      }

      return data;

    } catch (error) {
      console.error('Failed to get shared data for plugin:', error);
      throw error;
    }
  }

  /**
   * Get data sharing requests for a plugin
   */
  async getDataSharingRequests(
    pluginId: string,
    status?: 'pending' | 'approved' | 'rejected'
  ): Promise<DataSharingRequest[]> {
    try {
      let requests = Array.from(this.sharingRequests.values())
        .filter(request => 
          request.fromPluginId === pluginId || request.toPluginId === pluginId
        );

      if (status) {
        requests = requests.filter(request => request.status === status);
      }

      return requests;

    } catch (error) {
      console.error('Failed to get data sharing requests:', error);
      throw error;
    }
  }

  /**
   * Get data sharing metrics
   */
  getDataSharingMetrics(): DataSharingMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if plugin has permission
   */
  private hasPermission(
    sharedData: SharedData,
    pluginId: string,
    permission: 'read' | 'write' | 'admin'
  ): boolean {
    return sharedData.permissions[permission].includes(pluginId);
  }

  /**
   * Check if data has expired
   */
  private isDataExpired(sharedData: SharedData): boolean {
    if (!sharedData.expires_at) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(sharedData.expires_at);
    return now > expiresAt;
  }

  /**
   * Encrypt data
   */
  private async encryptData(data: any): Promise<string> {
    // This would implement actual encryption
    // For now, just return base64 encoded data
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  /**
   * Decrypt data
   */
  private async decryptData(encryptedData: string): Promise<any> {
    // This would implement actual decryption
    // For now, just decode base64 data
    return JSON.parse(Buffer.from(encryptedData, 'base64').toString());
  }

  /**
   * Generate data ID
   */
  private generateDataId(): string {
    return `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    this.metrics.totalSharedData = this.sharedData.size;
    this.metrics.activeShares = Array.from(this.sharedData.values())
      .filter(data => !this.isDataExpired(data)).length;
    this.metrics.pendingRequests = Array.from(this.sharingRequests.values())
      .filter(request => request.status === 'pending').length;
    this.metrics.approvedRequests = Array.from(this.sharingRequests.values())
      .filter(request => request.status === 'approved').length;
    this.metrics.rejectedRequests = Array.from(this.sharingRequests.values())
      .filter(request => request.status === 'rejected').length;

    // Update data types
    const dataTypeCounts = new Map<string, number>();
    this.sharedData.forEach(data => {
      const count = dataTypeCounts.get(data.dataType) || 0;
      dataTypeCounts.set(data.dataType, count + 1);
    });

    this.metrics.dataTypes = Array.from(dataTypeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Start cleanup process
   */
  private startCleanupProcess(): void {
    setInterval(() => {
      this.cleanupExpiredData();
    }, 60000); // Cleanup every minute
  }

  /**
   * Cleanup expired data
   */
  private async cleanupExpiredData(): Promise<void> {
    try {
      const expiredDataIds: string[] = [];

      for (const [id, data] of this.sharedData) {
        if (this.isDataExpired(data)) {
          expiredDataIds.push(id);
        }
      }

      for (const id of expiredDataIds) {
        await this.deleteSharedData(id);
      }

    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  /**
   * Notify plugins about new shared data
   */
  private async notifyPluginsAboutSharedData(sharedData: SharedData): Promise<void> {
    try {
      for (const pluginId of sharedData.permissions.read) {
        await this.communicationManager.sendMessage(
          sharedData.pluginId,
          pluginId,
          'event',
          {
            type: 'data_shared',
            dataId: sharedData.id,
            dataType: sharedData.dataType
          }
        );
      }
    } catch (error) {
      console.error('Failed to notify plugins about shared data:', error);
    }
  }

  /**
   * Notify plugins about updated data
   */
  private async notifyPluginsAboutUpdatedData(sharedData: SharedData): Promise<void> {
    try {
      for (const pluginId of sharedData.permissions.read) {
        await this.communicationManager.sendMessage(
          sharedData.pluginId,
          pluginId,
          'event',
          {
            type: 'data_updated',
            dataId: sharedData.id,
            dataType: sharedData.dataType
          }
        );
      }
    } catch (error) {
      console.error('Failed to notify plugins about updated data:', error);
    }
  }

  /**
   * Notify plugins about deleted data
   */
  private async notifyPluginsAboutDeletedData(dataId: string): Promise<void> {
    try {
      // This would notify all plugins that had access to the data
      // Implementation depends on your notification system
    } catch (error) {
      console.error('Failed to notify plugins about deleted data:', error);
    }
  }

  /**
   * Delete shared data (internal method)
   */
  private async deleteSharedData(dataId: string): Promise<void> {
    try {
      this.sharedData.delete(dataId);

      const { error } = await supabase
        .from('plugin_shared_data')
        .delete()
        .eq('id', dataId);

      if (error) {
        console.error('Failed to delete shared data:', error);
      }
    } catch (error) {
      console.error('Failed to delete shared data:', error);
    }
  }
}
