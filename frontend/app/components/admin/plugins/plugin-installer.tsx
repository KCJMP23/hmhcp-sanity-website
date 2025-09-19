// Plugin Installer Component
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, XCircle, AlertCircle, Settings, Shield } from 'lucide-react';
import { PluginDefinition, PluginInstallation } from '@/types/plugins/marketplace';
import { InstallationProgress, InstallationValidation } from '@/types/plugins/installation';

interface PluginInstallerProps {
  plugin: PluginDefinition;
  organizationId: string;
  onInstallComplete?: (installation: PluginInstallation) => void;
  onInstallError?: (error: string) => void;
  onCancel?: () => void;
}

export default function PluginInstaller({
  plugin,
  organizationId,
  onInstallComplete,
  onInstallError,
  onCancel
}: PluginInstallerProps) {
  const [step, setStep] = useState<'validation' | 'configuration' | 'installing' | 'completed' | 'error'>('validation');
  const [progress, setProgress] = useState<InstallationProgress | null>(null);
  const [validation, setValidation] = useState<InstallationValidation | null>(null);
  const [configuration, setConfiguration] = useState<any>({});
  const [permissions, setPermissions] = useState<any>({});
  const [resourceLimits, setResourceLimits] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateInstallation();
  }, []);

  const validateInstallation = async () => {
    try {
      // Mock validation - in real implementation, this would call the API
      const mockValidation: InstallationValidation = {
        valid: true,
        errors: [],
        warnings: [
          {
            code: 'VERSION_MISMATCH',
            message: 'Plugin version differs from latest',
            recommendation: 'Consider using the latest version'
          }
        ],
        requirements: [
          {
            name: 'Node.js Version',
            required: true,
            satisfied: true,
            current_value: '20.11.0',
            required_value: '18.0.0+',
            description: 'Node.js runtime version'
          },
          {
            name: 'Memory Available',
            required: true,
            satisfied: true,
            current_value: '2GB',
            required_value: '512MB',
            description: 'Available system memory'
          }
        ]
      };

      setValidation(mockValidation);
      setStep('configuration');
    } catch (error) {
      setError('Validation failed');
      setStep('error');
    }
  };

  const handleInstall = async () => {
    setStep('installing');
    setProgress({
      installation_id: `install-${Date.now()}`,
      plugin_id: plugin.id,
      status: 'pending',
      progress_percentage: 0,
      current_step: 'Starting installation...',
      started_at: new Date().toISOString()
    });

    try {
      // Simulate installation progress
      const steps = [
        'Downloading plugin files...',
        'Validating plugin manifest...',
        'Installing dependencies...',
        'Configuring plugin...',
        'Setting up sandbox environment...',
        'Finalizing installation...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setProgress(prev => ({
          ...prev!,
          status: 'downloading',
          progress_percentage: Math.round(((i + 1) / steps.length) * 100),
          current_step: steps[i]
        }));
      }

      // Complete installation
      setProgress(prev => ({
        ...prev!,
        status: 'completed',
        progress_percentage: 100,
        current_step: 'Installation completed successfully!'
      }));

      setStep('completed');
      onInstallComplete?.({
        id: `install-${Date.now()}`,
        plugin_id: plugin.id,
        organization_id: organizationId,
        version: plugin.version,
        configuration: configuration,
        permissions: permissions,
        resource_limits: resourceLimits,
        sandbox_environment: true,
        status: 'active',
        installed_by: 'current-user',
        installed_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });
    } catch (error) {
      setError('Installation failed');
      setStep('error');
      onInstallError?.(error as string);
    }
  };

  const renderValidationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-blue-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Installation Validation</h3>
        <p className="mt-1 text-sm text-gray-500">
          Validating plugin requirements and compatibility
        </p>
      </div>

      {validation && (
        <div className="space-y-4">
          {/* Errors */}
          {validation.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <XCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800">Validation Errors</h4>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">Warnings</h4>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>
                        {warning.message}
                        {warning.recommendation && (
                          <span className="block text-xs mt-1 text-yellow-600">
                            {warning.recommendation}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Requirements */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900">System Requirements</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {validation.requirements.map((req, index) => (
                <div key={index} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{req.name}</p>
                    <p className="text-xs text-gray-500">{req.description}</p>
                  </div>
                  <div className="flex items-center">
                    {req.satisfied ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => setStep('configuration')}
          disabled={validation?.errors.length > 0}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderConfigurationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Settings className="mx-auto h-12 w-12 text-blue-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Plugin Configuration</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure plugin settings and permissions
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Configuration */}
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Basic Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Plugin Name
              </label>
              <input
                type="text"
                value={configuration.name || plugin.name}
                onChange={(e) => setConfiguration(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={configuration.description || plugin.description}
                onChange={(e) => setConfiguration(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Permissions</h4>
          <div className="space-y-3">
            {[
              { key: 'read', label: 'Read Data', description: 'Allow plugin to read data' },
              { key: 'write', label: 'Write Data', description: 'Allow plugin to modify data' },
              { key: 'execute', label: 'Execute Commands', description: 'Allow plugin to execute system commands' },
              { key: 'network', label: 'Network Access', description: 'Allow plugin to make network requests' },
              { key: 'healthcare_data', label: 'Healthcare Data', description: 'Allow plugin to access healthcare data' }
            ].map((permission) => (
              <div key={permission.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{permission.label}</p>
                  <p className="text-xs text-gray-500">{permission.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={permissions[permission.key] || false}
                  onChange={(e) => setPermissions(prev => ({ ...prev, [permission.key]: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Resource Limits */}
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Resource Limits</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Memory Limit (MB)
              </label>
              <input
                type="number"
                value={resourceLimits.memory || 128}
                onChange={(e) => setResourceLimits(prev => ({ ...prev, memory: parseInt(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                CPU Cores
              </label>
              <input
                type="number"
                step="0.1"
                value={resourceLimits.cpu || 0.5}
                onChange={(e) => setResourceLimits(prev => ({ ...prev, cpu: parseFloat(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setStep('validation')}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleInstall}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Install Plugin
        </button>
      </div>
    </div>
  );

  const renderInstallingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Download className="mx-auto h-12 w-12 text-blue-500 animate-pulse" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Installing Plugin</h3>
        <p className="mt-1 text-sm text-gray-500">
          {progress?.current_step}
        </p>
      </div>

      {progress && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{progress.progress_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress_percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCompletedStep = () => (
    <div className="text-center space-y-6">
      <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
      <div>
        <h3 className="text-lg font-medium text-gray-900">Installation Complete!</h3>
        <p className="mt-1 text-sm text-gray-500">
          {plugin.name} has been successfully installed and is ready to use.
        </p>
      </div>
      <div className="flex justify-center space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center space-y-6">
      <XCircle className="mx-auto h-12 w-12 text-red-500" />
      <div>
        <h3 className="text-lg font-medium text-gray-900">Installation Failed</h3>
        <p className="mt-1 text-sm text-gray-500">
          {error || 'An unexpected error occurred during installation.'}
        </p>
      </div>
      <div className="flex justify-center space-x-3">
        <button
          onClick={() => setStep('validation')}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Try Again
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {step === 'validation' && renderValidationStep()}
      {step === 'configuration' && renderConfigurationStep()}
      {step === 'installing' && renderInstallingStep()}
      {step === 'completed' && renderCompletedStep()}
      {step === 'error' && renderErrorStep()}
    </div>
  );
}
