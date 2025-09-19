/**
 * White-Label Manager Component
 * 
 * This component provides a comprehensive interface for managing white-label
 * configurations, including creation, editing, activation, and export/import.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  WhiteLabelConfiguration, 
  CreateWhiteLabelRequest,
  WhiteLabelSearchFilters,
  WhiteLabelSortOptions 
} from '@/types/white-label/white-label-types';

interface WhiteLabelManagerProps {
  organizationId: string;
  userId: string;
  onConfigurationChange?: (configuration: WhiteLabelConfiguration) => void;
}

export default function WhiteLabelManager({ 
  organizationId, 
  userId, 
  onConfigurationChange 
}: WhiteLabelManagerProps) {
  const [configurations, setConfigurations] = useState<WhiteLabelConfiguration[]>([]);
  const [activeConfiguration, setActiveConfiguration] = useState<WhiteLabelConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedConfiguration, setSelectedConfiguration] = useState<WhiteLabelConfiguration | null>(null);
  const [filters, setFilters] = useState<WhiteLabelSearchFilters>({});
  const [sort, setSort] = useState<WhiteLabelSortOptions>({ field: 'created_at', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load configurations on component mount
  useEffect(() => {
    loadConfigurations();
    loadActiveConfiguration();
  }, [organizationId, filters, sort, page]);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/white-label?organization_id=${organizationId}&page=${page}&limit=10&${new URLSearchParams(filters as any).toString()}&sort_field=${sort.field}&sort_direction=${sort.direction}`
      );
      const data = await response.json();
      
      if (data.success) {
        setConfigurations(data.data.configurations);
        setTotalPages(Math.ceil(data.data.total / 10));
      } else {
        setError(data.error || 'Failed to load configurations');
      }
    } catch (err) {
      setError('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveConfiguration = async () => {
    try {
      const response = await fetch(
        `/api/admin/white-label/active?organization_id=${organizationId}`
      );
      const data = await response.json();
      
      if (data.success && data.data) {
        setActiveConfiguration(data.data);
        onConfigurationChange?.(data.data);
      }
    } catch (err) {
      console.error('Failed to load active configuration:', err);
    }
  };

  const createConfiguration = async (request: CreateWhiteLabelRequest) => {
    try {
      const response = await fetch('/api/admin/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: userId,
          ...request
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadConfigurations();
        setShowCreateModal(false);
        return true;
      } else {
        setError(data.error || 'Failed to create configuration');
        return false;
      }
    } catch (err) {
      setError('Failed to create configuration');
      return false;
    }
  };

  const updateConfiguration = async (id: string, request: Partial<CreateWhiteLabelRequest>) => {
    try {
      const response = await fetch(`/api/admin/white-label/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: userId,
          ...request
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadConfigurations();
        await loadActiveConfiguration();
        return true;
      } else {
        setError(data.error || 'Failed to update configuration');
        return false;
      }
    } catch (err) {
      setError('Failed to update configuration');
      return false;
    }
  };

  const activateConfiguration = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/white-label/${id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: userId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadConfigurations();
        await loadActiveConfiguration();
        return true;
      } else {
        setError(data.error || 'Failed to activate configuration');
        return false;
      }
    } catch (err) {
      setError('Failed to activate configuration');
      return false;
    }
  };

  const deactivateConfiguration = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/white-label/${id}/activate`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: userId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadConfigurations();
        await loadActiveConfiguration();
        return true;
      } else {
        setError(data.error || 'Failed to deactivate configuration');
        return false;
      }
    } catch (err) {
      setError('Failed to deactivate configuration');
      return false;
    }
  };

  const deleteConfiguration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return false;
    }

    try {
      const response = await fetch(`/api/admin/white-label/${id}?organization_id=${organizationId}&user_id=${userId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadConfigurations();
        await loadActiveConfiguration();
        return true;
      } else {
        setError(data.error || 'Failed to delete configuration');
        return false;
      }
    } catch (err) {
      setError('Failed to delete configuration');
      return false;
    }
  };

  const exportConfiguration = async (id: string, format: 'json' | 'yaml' | 'xml' = 'json') => {
    try {
      const response = await fetch(`/api/admin/white-label/${id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: userId,
          export_format: format,
          include_assets: true,
          include_custom_css: true,
          include_custom_javascript: true,
          include_custom_fonts: true,
          compress_export: false,
          encrypt_export: false
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Download the exported configuration
        const blob = new Blob([data.data.export_data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `white-label-config-${id}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
      } else {
        setError(data.error || 'Failed to export configuration');
        return false;
      }
    } catch (err) {
      setError('Failed to export configuration');
      return false;
    }
  };

  const importConfiguration = async (file: File) => {
    try {
      const text = await file.text();
      const response = await fetch('/api/admin/white-label/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: userId,
          export_data: text,
          export_format: 'json',
          import_name: file.name.replace(/\.[^/.]+$/, ''),
          validate_compliance: true,
          validate_assets: true,
          overwrite_existing: false
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadConfigurations();
        setShowImportModal(false);
        return true;
      } else {
        setError(data.error || 'Failed to import configuration');
        return false;
      }
    } catch (err) {
      setError('Failed to import configuration');
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">White-Label Configurations</h1>
          <p className="text-gray-600">Manage your organization's branding and customization settings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Import
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Create Configuration
          </button>
        </div>
      </div>

      {/* Active Configuration */}
      {activeConfiguration && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Active Configuration: {activeConfiguration.name}
              </h3>
              <p className="text-sm text-green-600">
                Version {activeConfiguration.version} • Updated {new Date(activeConfiguration.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search configurations..."
              value={filters.name || ''}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.is_active === undefined ? '' : filters.is_active.toString()}
              onChange={(e) => setFilters({ 
                ...filters, 
                is_active: e.target.value === '' ? undefined : e.target.value === 'true' 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={`${sort.field}-${sort.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSort({ field: field as any, direction: direction as any });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at-desc">Created (Newest)</option>
              <option value="created_at-asc">Created (Oldest)</option>
              <option value="updated_at-desc">Updated (Newest)</option>
              <option value="updated_at-asc">Updated (Oldest)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Configurations List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {configurations.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No configurations</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new white-label configuration.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Configuration
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {configurations.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {config.branding.logo.primary.url ? (
                            <img
                              className="h-10 w-10 rounded-lg object-contain"
                              src={config.branding.logo.primary.url}
                              alt={config.branding.logo.primary.alt_text}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{config.name}</div>
                          <div className="text-sm text-gray-500">{config.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        config.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {config.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(config.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedConfiguration(config)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        {config.is_active ? (
                          <button
                            onClick={() => deactivateConfiguration(config.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => activateConfiguration(config.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => exportConfiguration(config.id)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Export
                        </button>
                        <button
                          onClick={() => deleteConfiguration(config.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Configuration Modal */}
      {showCreateModal && (
        <CreateConfigurationModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createConfiguration}
        />
      )}

      {/* Import Configuration Modal */}
      {showImportModal && (
        <ImportConfigurationModal
          onClose={() => setShowImportModal(false)}
          onImport={importConfiguration}
        />
      )}

      {/* Edit Configuration Modal */}
      {selectedConfiguration && (
        <EditConfigurationModal
          configuration={selectedConfiguration}
          onClose={() => setSelectedConfiguration(null)}
          onUpdate={updateConfiguration}
        />
      )}
    </div>
  );
}

// Placeholder components - these would be implemented separately
function CreateConfigurationModal({ onClose, onCreate }: { onClose: () => void; onCreate: (request: CreateWhiteLabelRequest) => Promise<boolean> }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create Configuration</h3>
        <p className="text-sm text-gray-500 mb-4">This modal would contain the configuration creation form.</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate({ name: 'New Configuration', branding: {} })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportConfigurationModal({ onClose, onImport }: { onClose: () => void; onImport: (file: File) => Promise<boolean> }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Import Configuration</h3>
        <p className="text-sm text-gray-500 mb-4">This modal would contain the file import form.</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

function EditConfigurationModal({ configuration, onClose, onUpdate }: { 
  configuration: WhiteLabelConfiguration; 
  onClose: () => void; 
  onUpdate: (id: string, request: Partial<CreateWhiteLabelRequest>) => Promise<boolean> 
}) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Configuration: {configuration.name}</h3>
        <p className="text-sm text-gray-500 mb-4">This modal would contain the configuration editing form.</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onUpdate(configuration.id, { name: configuration.name })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
