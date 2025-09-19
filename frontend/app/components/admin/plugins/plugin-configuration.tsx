// Plugin Configuration Component
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Shield, 
  Zap,
  Database,
  Network,
  Lock,
  Eye,
  EyeOff,
  TestTube,
  Download,
  Upload,
  X,
  Trash2
} from 'lucide-react';
import { PluginInstallation } from '@/types/plugins/marketplace';
import { PluginConfiguration, PluginPermissions, ResourceLimits } from '@/types/plugins/installation';

interface PluginConfigurationProps {
  plugin: PluginInstallation;
  onSave?: (configuration: PluginConfiguration) => void;
  onTest?: (configuration: PluginConfiguration) => void;
  onClose?: () => void;
}

export default function PluginConfiguration({ 
  plugin, 
  onSave, 
  onTest, 
  onClose 
}: PluginConfigurationProps) {
  const [configuration, setConfiguration] = useState<PluginConfiguration>({
    settings: plugin.configuration || {},
    permissions: plugin.permissions || {},
    resources: plugin.resource_limits || {},
    environment: {
      variables: {},
      features: [],
      debug: false,
      logLevel: 'info'
    },
    webhooks: [],
    apiKeys: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'permissions' | 'resources' | 'environment' | 'webhooks' | 'api'>('settings');
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set());

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/plugins/installations/${plugin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configuration: configuration.settings,
          permissions: configuration.permissions,
          resource_limits: configuration.resources,
          environment_variables: configuration.environment.variables
        })
      });

      if (response.ok) {
        setSuccess('Configuration saved successfully');
        onSave?.(configuration);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save configuration');
      }
    } catch (error) {
      setError('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/plugins/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installation_id: plugin.id,
          input_data: { test: true },
          execution_context: { test_mode: true }
        })
      });

      if (response.ok) {
        setSuccess('Plugin test executed successfully');
        onTest?.(configuration);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Plugin test failed');
      }
    } catch (error) {
      setError('Plugin test failed');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  };

  const updatePermission = (key: string, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value
      }
    }));
  };

  const updateResource = (key: string, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        [key]: value
      }
    }));
  };

  const updateEnvironmentVariable = (key: string, value: string) => {
    setConfiguration(prev => ({
      ...prev,
      environment: {
        ...prev.environment,
        variables: {
          ...prev.environment.variables,
          [key]: value
        }
      }
    }));
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Plugin Settings</h3>
        <div className="space-y-4">
          {Object.entries(configuration.settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 capitalize">
                {key.replace('_', ' ')}
              </label>
              <div className="flex-1 max-w-md ml-4">
                {typeof value === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updateSetting(key, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                ) : typeof value === 'number' ? (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => updateSetting(key, parseFloat(e.target.value) || 0)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateSetting(key, e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPermissionsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Plugin Permissions</h3>
        <div className="space-y-4">
          {[
            { key: 'read', label: 'Read Data', description: 'Allow plugin to read data' },
            { key: 'write', label: 'Write Data', description: 'Allow plugin to modify data' },
            { key: 'execute', label: 'Execute Commands', description: 'Allow plugin to execute system commands' },
            { key: 'network', label: 'Network Access', description: 'Allow plugin to make network requests' },
            { key: 'file_system', label: 'File System Access', description: 'Allow plugin to access file system' },
            { key: 'database', label: 'Database Access', description: 'Allow plugin to access database' },
            { key: 'healthcare_data', label: 'Healthcare Data', description: 'Allow plugin to access healthcare data' },
            { key: 'admin_functions', label: 'Admin Functions', description: 'Allow plugin to perform admin functions' },
            { key: 'user_management', label: 'User Management', description: 'Allow plugin to manage users' },
            { key: 'content_management', label: 'Content Management', description: 'Allow plugin to manage content' },
            { key: 'analytics_access', label: 'Analytics Access', description: 'Allow plugin to access analytics data' }
          ].map((permission) => (
            <div key={permission.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 className="text-sm font-medium text-gray-900">{permission.label}</h4>
                  {permission.key === 'healthcare_data' && (
                    <Shield className="w-4 h-4 text-green-500 ml-2" title="Healthcare Data Access" />
                  )}
                </div>
                <p className="text-sm text-gray-500">{permission.description}</p>
              </div>
              <div className="ml-4">
                <input
                  type="checkbox"
                  checked={configuration.permissions[permission.key] || false}
                  onChange={(e) => updatePermission(permission.key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderResourcesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Memory Limit (MB)
            </label>
            <input
              type="number"
              value={configuration.resources.memory || 128}
              onChange={(e) => updateResource('memory', parseInt(e.target.value) || 128)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPU Cores
            </label>
            <input
              type="number"
              step="0.1"
              value={configuration.resources.cpu || 0.5}
              onChange={(e) => updateResource('cpu', parseFloat(e.target.value) || 0.5)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Storage Limit (MB)
            </label>
            <input
              type="number"
              value={configuration.resources.storage || 100}
              onChange={(e) => updateResource('storage', parseInt(e.target.value) || 100)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Network Bandwidth (Mbps)
            </label>
            <input
              type="number"
              value={configuration.resources.networkBandwidth || 10}
              onChange={(e) => updateResource('networkBandwidth', parseInt(e.target.value) || 10)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Execution Time (seconds)
            </label>
            <input
              type="number"
              value={configuration.resources.executionTime || 30}
              onChange={(e) => updateResource('executionTime', parseInt(e.target.value) || 30)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Concurrent Executions
            </label>
            <input
              type="number"
              value={configuration.resources.concurrentExecutions || 1}
              onChange={(e) => updateResource('concurrentExecutions', parseInt(e.target.value) || 1)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnvironmentTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Variables</h3>
        <div className="space-y-4">
          {Object.entries(configuration.environment.variables).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <input
                type="text"
                value={key}
                readOnly
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                placeholder="Variable name"
              />
              <div className="flex-1 relative">
                <input
                  type={showSecrets.has(key) ? 'text' : 'password'}
                  value={value}
                  onChange={(e) => updateEnvironmentVariable(key, e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Variable value"
                />
                <button
                  type="button"
                  onClick={() => toggleSecretVisibility(key)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showSecrets.has(key) ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newVars = { ...configuration.environment.variables };
                  delete newVars[key];
                  setConfiguration(prev => ({
                    ...prev,
                    environment: {
                      ...prev.environment,
                      variables: newVars
                    }
                  }));
                }}
                className="p-2 text-red-600 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const newKey = `NEW_VAR_${Date.now()}`;
              updateEnvironmentVariable(newKey, '');
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Zap className="w-4 h-4 mr-2" />
            Add Variable
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Configure {plugin.plugin_definitions?.name || 'Plugin'}
            </h2>
            <p className="text-sm text-gray-500">
              Version {plugin.version} • Installed {new Date(plugin.installed_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {[
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'permissions', label: 'Permissions', icon: Lock },
            { id: 'resources', label: 'Resources', icon: Zap },
            { id: 'environment', label: 'Environment', icon: Database }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'permissions' && renderPermissionsTab()}
        {activeTab === 'resources' && renderResourcesTab()}
        {activeTab === 'environment' && renderEnvironmentTab()}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {error && (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">{success}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleTest}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Test Plugin
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
