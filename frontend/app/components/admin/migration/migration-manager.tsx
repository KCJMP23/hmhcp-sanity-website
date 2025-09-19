/**
 * Migration Manager Component
 * 
 * This component provides a comprehensive interface for managing migration
 * packages, including creation, execution, validation, and analytics.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  MigrationPackage, 
  CreateMigrationPackageRequest,
  MigrationSearchFilters,
  MigrationSortOptions,
  MigrationExecution,
  MigrationAnalytics
} from '@/types/migration/migration-types';

interface MigrationManagerProps {
  organizationId: string;
  userId: string;
  onMigrationChange?: (migration: MigrationPackage) => void;
}

export default function MigrationManager({ 
  organizationId, 
  userId, 
  onMigrationChange 
}: MigrationManagerProps) {
  const [packages, setPackages] = useState<MigrationPackage[]>([]);
  const [executions, setExecutions] = useState<MigrationExecution[]>([]);
  const [analytics, setAnalytics] = useState<MigrationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<MigrationPackage | null>(null);
  const [filters, setFilters] = useState<MigrationSearchFilters>({});
  const [sort, setSort] = useState<MigrationSortOptions>({ field: 'created_at', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'packages' | 'executions' | 'analytics'>('packages');

  // Load data on component mount
  useEffect(() => {
    loadPackages();
    loadExecutions();
    loadAnalytics();
  }, [organizationId, filters, sort, page]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/migration?organization_id=${organizationId}&page=${page}&limit=10&${new URLSearchParams(filters as any).toString()}&sort_field=${sort.field}&sort_direction=${sort.direction}`
      );
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.data.packages);
        setTotalPages(Math.ceil(data.data.total / 10));
      } else {
        setError(data.error || 'Failed to load migration packages');
      }
    } catch (err) {
      setError('Failed to load migration packages');
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async () => {
    try {
      // In a real implementation, this would load execution data
      setExecutions([]);
    } catch (err) {
      console.error('Failed to load executions:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(
        `/api/admin/migration/analytics?organization_id=${organizationId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const createPackage = async (request: CreateMigrationPackageRequest) => {
    try {
      const response = await fetch('/api/admin/migration', {
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
        await loadPackages();
        setShowCreateModal(false);
        return true;
      } else {
        setError(data.error || 'Failed to create migration package');
        return false;
      }
    } catch (err) {
      setError('Failed to create migration package');
      return false;
    }
  };

  const executeMigration = async (packageId: string, targetOrganizationId: string) => {
    try {
      const response = await fetch(`/api/admin/migration/${packageId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: userId,
          target_organization_id: targetOrganizationId,
          execution_options: {
            validate_before_execution: true,
            backup_before_execution: true,
            rollback_on_failure: true,
            skip_optional_steps: false,
            custom_parameters: {}
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadExecutions();
        return true;
      } else {
        setError(data.error || 'Failed to execute migration');
        return false;
      }
    } catch (err) {
      setError('Failed to execute migration');
      return false;
    }
  };

  const validateMigration = async (packageId: string, targetOrganizationId: string) => {
    try {
      const response = await fetch(`/api/admin/migration/${packageId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          target_organization_id: targetOrganizationId,
          validation_options: {
            check_compatibility: true,
            check_dependencies: true,
            check_permissions: true,
            check_data_integrity: true
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        setError(data.error || 'Failed to validate migration');
        return null;
      }
    } catch (err) {
      setError('Failed to validate migration');
      return null;
    }
  };

  const createBackup = async (backupName: string, backupDescription: string) => {
    try {
      const response = await fetch('/api/admin/migration/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: userId,
          backup_name: backupName,
          backup_description: backupDescription
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowBackupModal(false);
        return true;
      } else {
        setError(data.error || 'Failed to create backup');
        return false;
      }
    } catch (err) {
      setError('Failed to create backup');
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
          <h1 className="text-2xl font-bold text-gray-900">Migration Management</h1>
          <p className="text-gray-600">Manage configuration migrations between environments and organizations</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowBackupModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Create Backup
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Create Package
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('packages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'packages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Migration Packages
          </button>
          <button
            onClick={() => setActiveTab('executions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'executions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Executions
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

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

      {/* Content based on active tab */}
      {activeTab === 'packages' && (
        <MigrationPackagesTab
          packages={packages}
          onExecute={executeMigration}
          onValidate={validateMigration}
          onSelect={setSelectedPackage}
          filters={filters}
          onFiltersChange={setFilters}
          sort={sort}
          onSortChange={setSort}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {activeTab === 'executions' && (
        <MigrationExecutionsTab
          executions={executions}
        />
      )}

      {activeTab === 'analytics' && (
        <MigrationAnalyticsTab
          analytics={analytics}
        />
      )}

      {/* Create Package Modal */}
      {showCreateModal && (
        <CreatePackageModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createPackage}
        />
      )}

      {/* Create Backup Modal */}
      {showBackupModal && (
        <CreateBackupModal
          onClose={() => setShowBackupModal(false)}
          onCreate={createBackup}
        />
      )}

      {/* Package Details Modal */}
      {selectedPackage && (
        <PackageDetailsModal
          package={selectedPackage}
          onClose={() => setSelectedPackage(null)}
          onExecute={executeMigration}
          onValidate={validateMigration}
        />
      )}
    </div>
  );
}

// Tab Components
function MigrationPackagesTab({
  packages,
  onExecute,
  onValidate,
  onSelect,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  page,
  totalPages,
  onPageChange
}: {
  packages: MigrationPackage[];
  onExecute: (packageId: string, targetOrgId: string) => Promise<boolean>;
  onValidate: (packageId: string, targetOrgId: string) => Promise<any>;
  onSelect: (pkg: MigrationPackage) => void;
  filters: MigrationSearchFilters;
  onFiltersChange: (filters: MigrationSearchFilters) => void;
  sort: MigrationSortOptions;
  onSortChange: (sort: MigrationSortOptions) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search packages..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Types</option>
              <option value="theme">Theme</option>
              <option value="dashboard">Dashboard</option>
              <option value="custom_fields">Custom Fields</option>
              <option value="localization">Localization</option>
              <option value="workflow">Workflow</option>
              <option value="white_label">White Label</option>
              <option value="full">Full</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compliance Level</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Levels</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={`${sort.field}-${sort.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                onSortChange({ field: field as any, direction: direction as any });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at-desc">Created (Newest)</option>
              <option value="created_at-asc">Created (Oldest)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="package_type-asc">Type (A-Z)</option>
              <option value="package_type-desc">Type (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Packages List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {packages.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No migration packages</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new migration package.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                        <div className="text-sm text-gray-500">{pkg.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {pkg.metadata.package_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pkg.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(pkg.metadata.package_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(pkg.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onSelect(pkg)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onValidate(pkg.id, 'target-org')}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Validate
                        </button>
                        <button
                          onClick={() => onExecute(pkg.id, 'target-org')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Execute
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
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MigrationExecutionsTab({ executions }: { executions: MigrationExecution[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Migration Executions</h3>
      {executions.length === 0 ? (
        <p className="text-gray-500">No executions found.</p>
      ) : (
        <div className="space-y-4">
          {executions.map((execution) => (
            <div key={execution.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Execution {execution.id}</h4>
                  <p className="text-sm text-gray-500">Package: {execution.package_id}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                  execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                  execution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {execution.status}
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${execution.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{execution.progress}% complete</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MigrationAnalyticsTab({ analytics }: { analytics: MigrationAnalytics | null }) {
  if (!analytics) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{analytics.total_packages}</div>
          <div className="text-sm text-gray-500">Total Packages</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{analytics.successful_migrations}</div>
          <div className="text-sm text-gray-500">Successful Migrations</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{analytics.failed_migrations}</div>
          <div className="text-sm text-gray-500">Failed Migrations</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{analytics.migration_success_rate}%</div>
          <div className="text-sm text-gray-500">Success Rate</div>
        </div>
      </div>

      {/* Package Type Distribution */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Package Type Distribution</h3>
        <div className="space-y-2">
          {analytics.package_type_distribution.map((item) => (
            <div key={item.type} className="flex justify-between items-center">
              <span className="text-sm text-gray-700 capitalize">{item.type.replace('_', ' ')}</span>
              <span className="text-sm font-medium text-gray-900">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Most Used Packages */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Most Used Packages</h3>
        <div className="space-y-2">
          {analytics.most_used_packages.map((item) => (
            <div key={item.package_id} className="flex justify-between items-center">
              <span className="text-sm text-gray-700">{item.name}</span>
              <span className="text-sm font-medium text-gray-900">{item.usage_count} uses</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Modal Components
function CreatePackageModal({ onClose, onCreate }: { onClose: () => void; onCreate: (request: CreateMigrationPackageRequest) => Promise<boolean> }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create Migration Package</h3>
        <p className="text-sm text-gray-500 mb-4">This modal would contain the package creation form.</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate({ 
              name: 'New Package', 
              package_type: 'full', 
              configurations: {},
              export_settings: {
                export_format: 'json',
                export_scope: 'full',
                include_assets: true,
                include_dependencies: true,
                include_metadata: true,
                include_audit_logs: false,
                include_user_data: false,
                compress_export: false,
                compression_level: 6,
                encrypt_export: false,
                include_configurations: [],
                exclude_configurations: [],
                custom_options: {}
              }
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateBackupModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, description: string) => Promise<boolean> }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create Backup</h3>
        <p className="text-sm text-gray-500 mb-4">This modal would contain the backup creation form.</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate('Backup ' + new Date().toISOString(), 'Automated backup')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function PackageDetailsModal({ 
  package: pkg, 
  onClose, 
  onExecute, 
  onValidate 
}: { 
  package: MigrationPackage; 
  onClose: () => void; 
  onExecute: (packageId: string, targetOrgId: string) => Promise<boolean>;
  onValidate: (packageId: string, targetOrgId: string) => Promise<any>;
}) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Package Details: {pkg.name}</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Description</h4>
            <p className="text-sm text-gray-900">{pkg.description || 'No description provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Package Type</h4>
            <p className="text-sm text-gray-900">{pkg.metadata.package_type}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Version</h4>
            <p className="text-sm text-gray-900">{pkg.version}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Size</h4>
            <p className="text-sm text-gray-900">{(pkg.metadata.package_size / 1024).toFixed(1)} KB</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Content Summary</h4>
            <div className="text-sm text-gray-900">
              <p>Total Configurations: {pkg.metadata.content_summary.total_configurations}</p>
              <p>Total Assets: {pkg.metadata.content_summary.total_assets}</p>
              <p>Total Customizations: {pkg.metadata.content_summary.total_customizations}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => onValidate(pkg.id, 'target-org')}
            className="px-4 py-2 border border-yellow-300 text-yellow-700 rounded-md text-sm font-medium hover:bg-yellow-50"
          >
            Validate
          </button>
          <button
            onClick={() => onExecute(pkg.id, 'target-org')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Execute
          </button>
        </div>
      </div>
    </div>
  );
}
