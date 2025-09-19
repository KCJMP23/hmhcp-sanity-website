// Plugin Communication Dashboard Component
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  Share2,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Send,
  Download,
  Upload,
  Settings,
  RefreshCw,
  Plus,
  Filter,
  Search,
  BarChart3,
  Network,
  Shield,
  Lock,
  Unlock
} from 'lucide-react';

interface CommunicationStats {
  totalPlugins: number;
  totalChannels: number;
  totalMessages: number;
  pendingRequests: number;
  activeShares: number;
  eventsPerSecond: number;
}

interface PluginChannel {
  id: string;
  name: string;
  type: 'private' | 'public' | 'broadcast';
  participants: string[];
  encryption: boolean;
  created_at: string;
}

interface PluginMessage {
  id: string;
  fromPlugin: string;
  toPlugin: string;
  messageType: string;
  data: any;
  timestamp: string;
  priority: string;
  encrypted: boolean;
}

interface SharedData {
  id: string;
  pluginId: string;
  dataType: string;
  permissions: {
    read: string[];
    write: string[];
    admin: string[];
  };
  encryption: boolean;
  created_at: string;
  expires_at?: string;
}

export default function PluginCommunicationDashboard() {
  const [stats, setStats] = useState<CommunicationStats>({
    totalPlugins: 0,
    totalChannels: 0,
    totalMessages: 0,
    pendingRequests: 0,
    activeShares: 0,
    eventsPerSecond: 0
  });
  const [channels, setChannels] = useState<PluginChannel[]>([]);
  const [messages, setMessages] = useState<PluginMessage[]>([]);
  const [sharedData, setSharedData] = useState<SharedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'messages' | 'data'>('overview');
  const [filter, setFilter] = useState({
    search: '',
    type: 'all',
    status: 'all'
  });

  useEffect(() => {
    loadCommunicationData();
  }, []);

  const loadCommunicationData = async () => {
    try {
      setLoading(true);
      
      // Load communication stats
      const statsResponse = await fetch('/api/plugins/communication?action=stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Load channels
      const channelsResponse = await fetch('/api/plugins/communication?action=channels');
      const channelsData = await channelsResponse.json();
      setChannels(channelsData.channels || []);

      // Load recent messages
      const messagesResponse = await fetch('/api/plugins/communication?action=messages&limit=50');
      const messagesData = await messagesResponse.json();
      setMessages(messagesData.messages || []);

      // Load shared data
      const sharedDataResponse = await fetch('/api/plugins/communication?action=shared-data&limit=50');
      const sharedDataData = await sharedDataResponse.json();
      setSharedData(sharedDataData.sharedData || []);

    } catch (error) {
      setError('Failed to load communication data');
    } finally {
      setLoading(false);
    }
  };

  const createChannel = async () => {
    try {
      // This would create a new channel
      console.log('Creating new channel...');
    } catch (error) {
      setError('Failed to create channel');
    }
  };

  const sendMessage = async (channelId: string, message: string) => {
    try {
      // This would send a message
      console.log('Sending message:', message, 'to channel:', channelId);
    } catch (error) {
      setError('Failed to send message');
    }
  };

  const shareData = async (dataType: string, data: any) => {
    try {
      // This would share data
      console.log('Sharing data:', dataType, data);
    } catch (error) {
      setError('Failed to share data');
    }
  };

  const getChannelTypeColor = (type: string) => {
    switch (type) {
      case 'private': return 'text-blue-600 bg-blue-100';
      case 'public': return 'text-green-600 bg-green-100';
      case 'broadcast': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'event': return <Activity className="w-4 h-4" />;
      case 'request': return <Send className="w-4 h-4" />;
      case 'response': return <CheckCircle className="w-4 h-4" />;
      case 'broadcast': return <Network className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plugin Communication Dashboard</h1>
          <p className="text-gray-600">Monitor and manage plugin communication</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadCommunicationData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={createChannel}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Channel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Plugins</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPlugins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Communication Channels</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalChannels}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Messages Sent</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalMessages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Share2 className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Data Shares</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeShares}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Events/Second</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.eventsPerSecond}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingRequests}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'channels', name: 'Channels', icon: MessageSquare },
            { id: 'messages', name: 'Messages', icon: Activity },
            { id: 'data', name: 'Shared Data', icon: Share2 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Messages */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Messages</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {messages.slice(0, 5).map((message) => (
                <div key={message.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getMessageTypeIcon(message.messageType)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {message.fromPlugin} → {message.toPlugin}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </span>
                      {message.encrypted && (
                        <Lock className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Channels */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Active Channels</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {channels.slice(0, 5).map((channel) => (
                <div key={channel.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{channel.name}</p>
                      <p className="text-sm text-gray-500">
                        {channel.participants.length} participants
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChannelTypeColor(channel.type)}`}>
                        {channel.type}
                      </span>
                      {channel.encryption && (
                        <Shield className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'channels' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Communication Channels</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search channels..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filter.type}
                  onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                  className="border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                  <option value="broadcast">Broadcast</option>
                </select>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {channels.map((channel) => (
              <div key={channel.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{channel.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChannelTypeColor(channel.type)}`}>
                        {channel.type}
                      </span>
                      {channel.encryption && (
                        <Shield className="w-4 h-4 text-green-500" title="Encrypted" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {channel.participants.length} participants
                    </p>
                    <p className="text-sm text-gray-500">
                      Created {new Date(channel.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="Settings">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Message History</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filter.type}
                  onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                  className="border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="event">Event</option>
                  <option value="request">Request</option>
                  <option value="response">Response</option>
                  <option value="broadcast">Broadcast</option>
                </select>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {messages.map((message) => (
              <div key={message.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getMessageTypeIcon(message.messageType)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {message.fromPlugin} → {message.toPlugin}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        {JSON.stringify(message.data).substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                      {message.priority}
                    </span>
                    {message.encrypted && (
                      <Lock className="w-4 h-4 text-green-500" title="Encrypted" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Shared Data</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search shared data..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filter.type}
                  onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                  className="border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="user_data">User Data</option>
                  <option value="healthcare_data">Healthcare Data</option>
                  <option value="analytics">Analytics</option>
                </select>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {sharedData.map((data) => (
              <div key={data.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{data.dataType}</h4>
                      {data.encryption && (
                        <Shield className="w-4 h-4 text-green-500" title="Encrypted" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Plugin: {data.pluginId}
                    </p>
                    <p className="text-sm text-gray-500">
                      Created {new Date(data.created_at).toLocaleDateString()}
                      {data.expires_at && (
                        <span className="ml-2">
                          • Expires {new Date(data.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Read:</span> {data.permissions.read.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Write:</span> {data.permissions.write.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Admin:</span> {data.permissions.admin.length}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="Settings">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
