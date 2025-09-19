// Plugin Management Dashboard Component
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  BarChart3,
  Filter,
  Search,
  MoreVertical,
  RefreshCw,
  Zap,
  Shield,
  Cpu,
  Memory
} from 'lucide-react';
import { PluginInstallation } from '@/types/plugins/marketplace';
import { PluginHealthStatus } from '@/types/plugins/installation';

interface PluginDashboardProps {
  organizationId: string;
  onPluginSelect?: (plugin: PluginInstallation) => void;
  onPluginConfigure?: (plugin: PluginInstallation) => void;
}

export default function PluginDashboard({ 
  organizationId, 
  onPluginSelect, 
  onPluginConfigure 
}: PluginDashboardProps) {
  const [plugins, setPlugins] = useState<PluginInstallation[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<Map<string, PluginHealthStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'error'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'installed_at' | 'health'>('name');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPlugins();
    loadHealthStatuses();
  }, [organizationId]);

  const loadPlugins = async () => {
    try {
      const response = await fetch(`/api/plugins/installations?organization_id=${organizationId}`);
      const data = await response.json();
      
      if (response.ok) {
        setPlugins(data.installations || []);
      } else {
        setError(data.error || 'Failed to load plugins');
      }
    } catch (error) {
      setError('Failed to load plugins');
    } finally {
      setLoading(false);
    }
  };

  const loadHealthStatuses = async () => {
    try {
      const response = await fetch(`/api/plugins/execute?installation_id=${organizationId}`);
      const data = await response.json();
      
      if (response.ok && data.health_status) {
        const healthMap = new Map();
        data.health_status.forEach((status: PluginHealthStatus) => {
          healthMap.set(status.installation_id, status);
        });
        setHealthStatuses(healthMap);
      }
    } catch (error) {
      console.error('Failed to load health statuses:', error);
    }
  };

  const handlePluginAction = async (pluginId: string, action: string) => {
    try {
      const response = await fetch(`/api/plugins/installations/${pluginId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        loadPlugins();
        loadHealthStatuses();
      } else {
        const error = await response.json();
        setError(error.error || `Failed to ${action} plugin`);
      }
    } catch (error) {
      setError(`Failed to ${action} plugin`);
    }
  };

  const handleUninstall = async (pluginId: string) => {
    if (!confirm('Are you sure you want to uninstall this plugin? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/plugins/installations/${pluginId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadPlugins();
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to uninstall plugin');
      }
    } catch (error) {
      setError('Failed to uninstall plugin');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'updating': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (healthStatus?: PluginHealthStatus) => {
    if (!healthStatus) return <Clock className="w-4 h-4 text-gray-400" />;
    
    switch (healthStatus.status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'unhealthy': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredPlugins = plugins
    .filter(plugin => {
      if (filter !== 'all' && plugin.status !== filter) return false;
      if (searchQuery && !plugin.plugin_definitions?.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.plugin_definitions?.name || '').localeCompare(b.plugin_definitions?.name || '');
        case 'status':
          return a.status.localeCompare(b.status);
        case 'installed_at':
          return new Date(b.installed_at).getTime() - new Date(a.installed_at).getTime();
        case 'health':
          const aHealth = healthStatuses.get(a.id)?.status || 'unknown';
          const bHealth = healthStatuses.get(b.id)?.status || 'unknown';
          return aHealth.localeCompare(bHealth);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plugin Management</h1>
          <p className="text-gray-600">Manage your organization's plugins</p>
        </div>
        <button
          onClick={() => { loadPlugins(); loadHealthStatuses(); }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Download className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Plugins</p>
              <p className="text-2xl font-semibold text-gray-900">{plugins.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {plugins.filter(p => p.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Issues</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Array.from(healthStatuses.values()).reduce((sum, status) => sum + status.issues.length, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Executions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Array.from(healthStatuses.values()).reduce((sum, status) => sum + status.executionCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search plugins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="installed_at">Installation Date</option>
              <option value="health">Health</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plugin List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredPlugins.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredPlugins.map((plugin) => {
              const healthStatus = healthStatuses.get(plugin.id);
              return (
                <div key={plugin.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getHealthIcon(healthStatus)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {plugin.plugin_definitions?.name || 'Unknown Plugin'}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plugin.status)}`}>
                            {plugin.status}
                          </span>
                          {plugin.plugin_definitions?.healthcare_compliance?.hipaa && (
                            <Shield className="w-4 h-4 text-green-500" title="HIPAA Compliant" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Version {plugin.version} • Installed {new Date(plugin.installed_at).toLocaleDateString()}
                        </p>
                        {healthStatus && healthStatus.issues.length > 0 && (
                          <div className="mt-2">
                            <span className="text-sm text-red-600">
                              {healthStatus.issues.length} issue{healthStatus.issues.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onPluginSelect?.(plugin)}
                        className="p-2 text-gray-400 hover:text-blue-500"
                        title="View Details"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onPluginConfigure?.(plugin)}
                        className="p-2 text-gray-400 hover:text-gray-500"
                        title="Configure"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      
                      <div className="relative">
                        <button className="p-2 text-gray-400 hover:text-gray-500">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {/* Dropdown menu would go here */}
                      </div>
                    </div>
                  </div>
                  
                  {/* Health Metrics */}
                  {healthStatus && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {Math.round(healthStatus.uptime_percentage * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {Math.round(healthStatus.average_response_time)}ms
                        </div>
                        <div className="text-xs text-gray-500">Avg Response</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {healthStatus.executionCount}
                        </div>
                        <div className="text-xs text-gray-500">Executions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {Math.round(healthStatus.error_rate * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">Error Rate</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Download className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No plugins found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by installing your first plugin.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
