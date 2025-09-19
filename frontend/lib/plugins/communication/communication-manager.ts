// Plugin Communication Manager
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { EventEmitter } from 'events';
import { createClient } from '@supabase/supabase-js';
import { PluginInstallation } from '@/types/plugins/marketplace';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PluginMessage {
  id: string;
  fromPluginId: string;
  toPluginId: string;
  messageType: 'event' | 'request' | 'response' | 'broadcast';
  eventName?: string;
  data: any;
  timestamp: string;
  ttl?: number; // Time to live in seconds
  priority: 'low' | 'normal' | 'high' | 'critical';
  encrypted: boolean;
  signature?: string;
}

export interface PluginEvent {
  name: string;
  data: any;
  source: string;
  timestamp: string;
  propagation: 'stop' | 'continue';
}

export interface PluginRequest {
  id: string;
  method: string;
  params: any;
  timeout: number;
  retries: number;
  source: string;
  timestamp: string;
}

export interface PluginResponse {
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'private' | 'public' | 'broadcast';
  participants: string[];
  permissions: {
    read: string[];
    write: string[];
    admin: string[];
  };
  encryption: boolean;
  created_at: string;
  updated_at: string;
}

export class PluginCommunicationManager extends EventEmitter {
  private installations: Map<string, PluginInstallation> = new Map();
  private channels: Map<string, CommunicationChannel> = new Map();
  private messageQueue: PluginMessage[] = [];
  private pendingRequests: Map<string, PluginRequest> = new Map();
  private messageHandlers: Map<string, Function[]> = new Map();
  private encryptionKey: string;

  constructor() {
    super();
    this.encryptionKey = process.env.PLUGIN_ENCRYPTION_KEY || 'default-key';
    this.startMessageProcessor();
  }

  /**
   * Register a plugin installation
   */
  async registerPlugin(installation: PluginInstallation): Promise<void> {
    try {
      this.installations.set(installation.id, installation);
      
      // Create default private channel for the plugin
      await this.createChannel({
        id: `private-${installation.id}`,
        name: `Private Channel for ${installation.plugin_definitions?.name}`,
        type: 'private',
        participants: [installation.id],
        permissions: {
          read: [installation.id],
          write: [installation.id],
          admin: [installation.id]
        },
        encryption: true
      });

      this.emit('pluginRegistered', { installation });
    } catch (error) {
      console.error('Failed to register plugin:', error);
      throw error;
    }
  }

  /**
   * Unregister a plugin installation
   */
  async unregisterPlugin(installationId: string): Promise<void> {
    try {
      this.installations.delete(installationId);
      
      // Remove plugin from all channels
      for (const [channelId, channel] of this.channels) {
        if (channel.participants.includes(installationId)) {
          await this.removeParticipantFromChannel(channelId, installationId);
        }
      }

      this.emit('pluginUnregistered', { installationId });
    } catch (error) {
      console.error('Failed to unregister plugin:', error);
      throw error;
    }
  }

  /**
   * Create a communication channel
   */
  async createChannel(channelData: Omit<CommunicationChannel, 'created_at' | 'updated_at'>): Promise<CommunicationChannel> {
    try {
      const channel: CommunicationChannel = {
        ...channelData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.channels.set(channel.id, channel);

      // Store in database
      const { error } = await supabase
        .from('plugin_communication_channels')
        .insert({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          participants: channel.participants,
          permissions: channel.permissions,
          encryption: channel.encryption,
          created_at: channel.created_at,
          updated_at: channel.updated_at
        });

      if (error) {
        throw new Error(error.message);
      }

      this.emit('channelCreated', { channel });
      return channel;

    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error;
    }
  }

  /**
   * Join a communication channel
   */
  async joinChannel(channelId: string, pluginId: string): Promise<void> {
    try {
      const channel = this.channels.get(channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      if (!channel.participants.includes(pluginId)) {
        channel.participants.push(pluginId);
        channel.updated_at = new Date().toISOString();

        // Update in database
        const { error } = await supabase
          .from('plugin_communication_channels')
          .update({
            participants: channel.participants,
            updated_at: channel.updated_at
          })
          .eq('id', channelId);

        if (error) {
          throw new Error(error.message);
        }

        this.emit('pluginJoinedChannel', { channelId, pluginId });
      }
    } catch (error) {
      console.error('Failed to join channel:', error);
      throw error;
    }
  }

  /**
   * Leave a communication channel
   */
  async leaveChannel(channelId: string, pluginId: string): Promise<void> {
    try {
      await this.removeParticipantFromChannel(channelId, pluginId);
      this.emit('pluginLeftChannel', { channelId, pluginId });
    } catch (error) {
      console.error('Failed to leave channel:', error);
      throw error;
    }
  }

  /**
   * Send a message to a specific plugin
   */
  async sendMessage(
    fromPluginId: string,
    toPluginId: string,
    messageType: PluginMessage['messageType'],
    data: any,
    options: {
      eventName?: string;
      ttl?: number;
      priority?: PluginMessage['priority'];
      encrypted?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const message: PluginMessage = {
        id: this.generateMessageId(),
        fromPluginId,
        toPluginId,
        messageType,
        eventName: options.eventName,
        data,
        timestamp: new Date().toISOString(),
        ttl: options.ttl || 3600, // 1 hour default
        priority: options.priority || 'normal',
        encrypted: options.encrypted || false
      };

      // Encrypt message if requested
      if (message.encrypted) {
        message.data = await this.encryptData(message.data);
        message.signature = await this.signMessage(message);
      }

      // Add to message queue
      this.messageQueue.push(message);

      // Process message immediately
      await this.processMessage(message);

      this.emit('messageSent', { message });
      return message.id;

    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Broadcast a message to all plugins in a channel
   */
  async broadcastMessage(
    fromPluginId: string,
    channelId: string,
    eventName: string,
    data: any,
    options: {
      ttl?: number;
      priority?: PluginMessage['priority'];
      encrypted?: boolean;
    } = {}
  ): Promise<string[]> {
    try {
      const channel = this.channels.get(channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      const messageIds: string[] = [];

      for (const participantId of channel.participants) {
        if (participantId !== fromPluginId) {
          const messageId = await this.sendMessage(
            fromPluginId,
            participantId,
            'broadcast',
            data,
            {
              eventName,
              ...options
            }
          );
          messageIds.push(messageId);
        }
      }

      this.emit('messageBroadcast', { channelId, eventName, messageIds });
      return messageIds;

    } catch (error) {
      console.error('Failed to broadcast message:', error);
      throw error;
    }
  }

  /**
   * Send a request to a plugin and wait for response
   */
  async sendRequest(
    fromPluginId: string,
    toPluginId: string,
    method: string,
    params: any,
    options: {
      timeout?: number;
      retries?: number;
      priority?: PluginMessage['priority'];
    } = {}
  ): Promise<any> {
    try {
      const request: PluginRequest = {
        id: this.generateMessageId(),
        method,
        params,
        timeout: options.timeout || 30000, // 30 seconds default
        retries: options.retries || 3,
        source: fromPluginId,
        timestamp: new Date().toISOString()
      };

      this.pendingRequests.set(request.id, request);

      // Send request message
      const messageId = await this.sendMessage(
        fromPluginId,
        toPluginId,
        'request',
        request,
        { priority: options.priority }
      );

      // Wait for response
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(request.id);
          reject(new Error('Request timeout'));
        }, request.timeout);

        const responseHandler = (response: PluginResponse) => {
          if (response.requestId === request.id) {
            clearTimeout(timeout);
            this.pendingRequests.delete(request.id);
            this.off('response', responseHandler);
            
            if (response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response.error || 'Request failed'));
            }
          }
        };

        this.on('response', responseHandler);
      });

    } catch (error) {
      console.error('Failed to send request:', error);
      throw error;
    }
  }

  /**
   * Register a message handler
   */
  registerMessageHandler(
    pluginId: string,
    messageType: string,
    handler: (message: PluginMessage) => void
  ): void {
    const key = `${pluginId}:${messageType}`;
    if (!this.messageHandlers.has(key)) {
      this.messageHandlers.set(key, []);
    }
    this.messageHandlers.get(key)!.push(handler);
  }

  /**
   * Unregister a message handler
   */
  unregisterMessageHandler(
    pluginId: string,
    messageType: string,
    handler: (message: PluginMessage) => void
  ): void {
    const key = `${pluginId}:${messageType}`;
    const handlers = this.messageHandlers.get(key);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Get communication statistics
   */
  getCommunicationStats(): {
    totalPlugins: number;
    totalChannels: number;
    totalMessages: number;
    pendingRequests: number;
    activeChannels: number;
  } {
    return {
      totalPlugins: this.installations.size,
      totalChannels: this.channels.size,
      totalMessages: this.messageQueue.length,
      pendingRequests: this.pendingRequests.size,
      activeChannels: Array.from(this.channels.values()).filter(
        channel => channel.participants.length > 1
      ).length
    };
  }

  /**
   * Get plugin communication history
   */
  async getPluginCommunicationHistory(
    pluginId: string,
    limit: number = 100
  ): Promise<PluginMessage[]> {
    try {
      const { data, error } = await supabase
        .from('plugin_messages')
        .select('*')
        .or(`from_plugin_id.eq.${pluginId},to_plugin_id.eq.${pluginId}`)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get communication history:', error);
      throw error;
    }
  }

  /**
   * Process a message
   */
  private async processMessage(message: PluginMessage): Promise<void> {
    try {
      // Check if message has expired
      if (message.ttl && this.isMessageExpired(message)) {
        return;
      }

      // Decrypt message if encrypted
      if (message.encrypted) {
        message.data = await this.decryptData(message.data);
      }

      // Verify message signature if present
      if (message.signature && !await this.verifyMessageSignature(message)) {
        throw new Error('Invalid message signature');
      }

      // Route message to appropriate handler
      const handlers = this.messageHandlers.get(`${message.toPluginId}:${message.messageType}`);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(message);
          } catch (error) {
            console.error('Message handler error:', error);
          }
        }
      }

      // Store message in database
      await this.storeMessage(message);

    } catch (error) {
      console.error('Failed to process message:', error);
    }
  }

  /**
   * Start message processor
   */
  private startMessageProcessor(): void {
    setInterval(() => {
      this.processMessageQueue();
    }, 1000); // Process every second
  }

  /**
   * Process message queue
   */
  private async processMessageQueue(): Promise<void> {
    const now = Date.now();
    const messagesToProcess = this.messageQueue.filter(
      message => !message.ttl || (now - new Date(message.timestamp).getTime()) < (message.ttl * 1000)
    );

    for (const message of messagesToProcess) {
      await this.processMessage(message);
    }

    // Remove expired messages
    this.messageQueue = this.messageQueue.filter(
      message => !message.ttl || (now - new Date(message.timestamp).getTime()) < (message.ttl * 1000)
    );
  }

  /**
   * Remove participant from channel
   */
  private async removeParticipantFromChannel(channelId: string, pluginId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.participants = channel.participants.filter(id => id !== pluginId);
      channel.updated_at = new Date().toISOString();

      // Update in database
      const { error } = await supabase
        .from('plugin_communication_channels')
        .update({
          participants: channel.participants,
          updated_at: channel.updated_at
        })
        .eq('id', channelId);

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  /**
   * Generate message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if message has expired
   */
  private isMessageExpired(message: PluginMessage): boolean {
    if (!message.ttl) return false;
    const now = Date.now();
    const messageTime = new Date(message.timestamp).getTime();
    return (now - messageTime) > (message.ttl * 1000);
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
   * Sign message
   */
  private async signMessage(message: PluginMessage): Promise<string> {
    // This would implement actual message signing
    // For now, just return a hash
    return Buffer.from(JSON.stringify(message)).toString('base64');
  }

  /**
   * Verify message signature
   */
  private async verifyMessageSignature(message: PluginMessage): Promise<boolean> {
    // This would implement actual signature verification
    // For now, just return true
    return true;
  }

  /**
   * Store message in database
   */
  private async storeMessage(message: PluginMessage): Promise<void> {
    try {
      const { error } = await supabase
        .from('plugin_messages')
        .insert({
          id: message.id,
          from_plugin_id: message.fromPluginId,
          to_plugin_id: message.toPluginId,
          message_type: message.messageType,
          event_name: message.eventName,
          data: message.data,
          timestamp: message.timestamp,
          ttl: message.ttl,
          priority: message.priority,
          encrypted: message.encrypted,
          signature: message.signature
        });

      if (error) {
        console.error('Failed to store message:', error);
      }
    } catch (error) {
      console.error('Failed to store message:', error);
    }
  }
}
