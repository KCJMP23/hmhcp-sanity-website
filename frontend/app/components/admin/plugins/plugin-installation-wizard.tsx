// Plugin Installation Wizard Component
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  Settings, 
  Shield,
  Zap,
  Database,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { PluginDefinition } from '@/types/plugins/marketplace';
import { PluginConfiguration } from '@/types/plugins/installation';

interface PluginInstallationWizardProps {
  plugin: PluginDefinition;
  organizationId: string;
  onInstall?: (installation: any) => void;
  onCancel?: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

export default function PluginInstallationWizard({ 
  plugin, 
  organizationId, 
  onInstall, 
  onCancel 
}: PluginInstallationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [installation, setInstallation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<Partial<PluginConfiguration>>({
    settings: {},
    permissions: {
      read: [],
      write: [],
      execute: false,
      network: false,
      file_system: false,
      database: false,
      healthcare_data: false,
      admin_functions: false,
      user_management: false,
      content_management: false,
      analytics_access: false
    },
    resources: {
      memory: 128,
      cpu: 0.5,
      storage: 100,
      networkBandwidth: 10,
      executionTime: 30,
      concurrentExecutions: 1
    }
  });

  const steps: WizardStep[] = [
    {
      id: 'dependencies',
      title: 'Dependencies Check',
      description: 'Checking plugin dependencies and compatibility',
      component: DependenciesStep
    },
    {
      id: 'permissions',
      title: 'Permissions Setup',
      description: 'Configure plugin permissions and access controls',
      component: PermissionsStep
    },
    {
      id: 'resources',
      title: 'Resource Allocation',
      description: 'Set resource limits and performance parameters',
      component: ResourcesStep
    },
    {
      id: 'configuration',
      title: 'Plugin Configuration',
      description: 'Configure plugin settings and environment',
      component: ConfigurationStep
    },
    {
      id: 'review',
      title: 'Review & Install',
      description: 'Review configuration and complete installation',
      component: ReviewStep
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInstall = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/plugins/installations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plugin_id: plugin.id,
          organization_id: organizationId,
          configuration
        })
      });

      if (response.ok) {
        const installation = await response.json();
        setInstallation(installation);
        onInstall?.(installation);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Installation failed');
      }
    } catch (error) {
      setError('Installation failed');
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Install {plugin.name}
            </h2>
            <p className="text-gray-600">Version {plugin.version}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          <CurrentStepComponent
            plugin={plugin}
            configuration={configuration}
            setConfiguration={setConfiguration}
            error={error}
            setError={setError}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <div className="flex items-center space-x-3">
            {error && (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleInstall}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Install Plugin
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dependencies Step Component
function DependenciesStep({ plugin, error, setError }: any) {
  const [dependencies, setDependencies] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDependencies();
  }, [plugin.id]);

  const loadDependencies = async () => {
    try {
      const response = await fetch(`/api/plugins/dependencies?plugin_id=${plugin.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setDependencies(data);
      } else {
        setError(data.error || 'Failed to load dependencies');
      }
    } catch (error) {
      setError('Failed to load dependencies');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Dependencies Check</h3>
      
      {dependencies?.dependencies?.length > 0 ? (
        <div className="space-y-3">
          {dependencies.dependencies.map((dep: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  dep.dependency_type === 'required' ? 'bg-red-500' :
                  dep.dependency_type === 'optional' ? 'bg-yellow-500' : 'bg-gray-500'
                }`} />
                <span className="font-medium">{dep.dependency_plugin_id}</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({dep.dependency_type})
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {dep.min_version && `Min: ${dep.min_version}`}
                {dep.max_version && ` Max: ${dep.max_version}`}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Dependencies</h3>
          <p className="mt-1 text-sm text-gray-500">
            This plugin has no dependencies and can be installed directly.
          </p>
        </div>
      )}
    </div>
  );
}

// Permissions Step Component
function PermissionsStep({ plugin, configuration, setConfiguration }: any) {
  const updatePermission = (key: string, value: any) => {
    setConfiguration((prev: any) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value
      }
    }));
  };

  const permissions = [
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
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Permissions Setup</h3>
      
      <div className="space-y-4">
        {permissions.map((permission) => (
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
  );
}

// Resources Step Component
function ResourcesStep({ configuration, setConfiguration }: any) {
  const updateResource = (key: string, value: any) => {
    setConfiguration((prev: any) => ({
      ...prev,
      resources: {
        ...prev.resources,
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Resource Allocation</h3>
      
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
            Execution Time (seconds)
          </label>
          <input
            type="number"
            value={configuration.resources.executionTime || 30}
            onChange={(e) => updateResource('executionTime', parseInt(e.target.value) || 30)}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

// Configuration Step Component
function ConfigurationStep({ plugin, configuration, setConfiguration }: any) {
  const updateSetting = (key: string, value: any) => {
    setConfiguration((prev: any) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Plugin Configuration</h3>
      
      <div className="space-y-4">
        {Object.entries(plugin.manifest?.settings || {}).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {key.replace('_', ' ')}
            </label>
            <div className="flex-1 max-w-md ml-4">
              {typeof value === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={configuration.settings[key] || false}
                  onChange={(e) => updateSetting(key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              ) : typeof value === 'number' ? (
                <input
                  type="number"
                  value={configuration.settings[key] || 0}
                  onChange={(e) => updateSetting(key, parseFloat(e.target.value) || 0)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <input
                  type="text"
                  value={configuration.settings[key] || ''}
                  onChange={(e) => updateSetting(key, e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Review Step Component
function ReviewStep({ plugin, configuration }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Review Configuration</h3>
      
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Plugin Information</h4>
          <div className="text-sm text-gray-600">
            <p><strong>Name:</strong> {plugin.name}</p>
            <p><strong>Version:</strong> {plugin.version}</p>
            <p><strong>Author:</strong> {plugin.author}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Resource Limits</h4>
          <div className="text-sm text-gray-600">
            <p><strong>Memory:</strong> {configuration.resources.memory}MB</p>
            <p><strong>CPU:</strong> {configuration.resources.cpu} cores</p>
            <p><strong>Storage:</strong> {configuration.resources.storage}MB</p>
            <p><strong>Execution Time:</strong> {configuration.resources.executionTime}s</p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Permissions</h4>
          <div className="text-sm text-gray-600">
            {Object.entries(configuration.permissions).map(([key, value]) => (
              <p key={key}>
                <strong>{key.replace('_', ' ')}:</strong> {String(value)}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
