// Enterprise Plugin Management Dashboard
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Shield,
  Settings,
  BarChart3,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Zap,
  Database,
  Network,
  FileText,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface OrganizationMetrics {
  total_plugins: number;
  active_plugins: number;
  total_users: number;
  active_users: number;
  total_installations: number;
  storage_used: number;
  api_calls_this_month: number;
  compliance_score: number;
}

interface EnterprisePolicy {
  id: string;
  name: string;
  description: string;
  type: 'security' | 'compliance' | 'performance' | 'resource' | 'access';
  priority: number;
  enabled: boolean;
  created_at: string;
}

interface DeploymentPlan {
  id: string;
  name: string;
  description: string;
  environment: 'development' | 'staging' | 'production';
  status: 'draft' | 'pending_approval' | 'approved' | 'deploying' | 'completed' | 'failed';
  plugins: any[];
  created_at: string;
  deployed_at?: string;
}

interface OrganizationUser {
  id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'developer' | 'viewer';
  permissions: string[];
  joined_at: string;
  last_active: string;
}

export default function EnterpriseDashboard() {
  const [metrics, setMetrics] = useState<OrganizationMetrics>({
    total_plugins: 0,
    active_plugins: 0,
    total_users: 0,
    active_users: 0,
    total_installations: 0,
    storage_used: 0,
    api_calls_this_month: 0,
    compliance_score: 0
  });
  const [policies, setPolicies] = useState<EnterprisePolicy[]>([]);
  const [deployments, setDeployments] = useState<DeploymentPlan[]>([]);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'deployments' | 'users' | 'settings'>('overview');
  const [filter, setFilter] = useState({
    search: '',
    type: 'all',
    status: 'all'
  });

  useEffect(() => {
    loadEnterpriseData();
  }, []);

  const loadEnterpriseData = async () => {
    try {
      setLoading(true);
      
      // Load organization metrics
      const metricsResponse = await fetch('/api/plugins/enterprise?action=metrics&organization_id=org-123');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData.metrics || metrics);

      // Load policies
      const policiesResponse = await fetch('/api/plugins/enterprise?action=policies&organization_id=org-123');
      const policiesData = await policiesResponse.json();
      setPolicies(policiesData.policies || []);

      // Load deployments
      const deploymentsResponse = await fetch('/api/plugins/enterprise?action=deployments&organization_id=org-123');
      const deploymentsData = await deploymentsResponse.json();
      setDeployments(deploymentsData.deployments || []);

      // Load users
      const usersResponse = await fetch('/api/plugins/enterprise?action=users&organization_id=org-123');
      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);

    } catch (error) {
      setError('Failed to load enterprise data');
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async () => {
    try {
      // This would create a new policy
      console.log('Creating new policy...');
    } catch (error) {
      setError('Failed to create policy');
    }
  };

  const createDeploymentPlan = async () => {
    try {
      // This would create a new deployment plan
      console.log('Creating new deployment plan...');
    } catch (error) {
      setError('Failed to create deployment plan');
    }
  };

  const addUser = async () => {
    try {
      // This would add a new user
      console.log('Adding new user...');
    } catch (error) {
      setError('Failed to add user');
    }
  };

  const getPolicyTypeColor = (type: string) => {
    switch (type) {
      case 'security': return 'text-red-600 bg-red-100';
      case 'compliance': return 'text-blue-600 bg-blue-100';
      case 'performance': return 'text-green-600 bg-green-100';
      case 'resource': return 'text-yellow-600 bg-yellow-100';
      case 'access': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDeploymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'deploying': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending_approval': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100';
      case 'manager': return 'text-blue-600 bg-blue-100';
      case 'developer': return 'text-green-600 bg-green-100';
      case 'viewer': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
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
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Plugin Management</h1>
          <p className="text-gray-600">Manage organization-wide plugin policies and deployments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadEnterpriseData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Plugins</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.total_plugins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Plugins</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.active_plugins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.total_users}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.active_users}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Download className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Installations</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.total_installations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Storage Used</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.storage_used}MB</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Network className="w-8 h-8 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">API Calls (Month)</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.api_calls_this_month}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Compliance Score</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.compliance_score}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'policies', name: 'Policies', icon: Shield },
            { id: 'deployments', name: 'Deployments', icon: Upload },
            { id: 'users', name: 'Users', icon: Users },
            { id: 'settings', name: 'Settings', icon: Settings }
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
          {/* Recent Deployments */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Deployments</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {deployments.slice(0, 5).map((deployment) => (
                <div key={deployment.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{deployment.name}</p>
                      <p className="text-sm text-gray-500">
                        {deployment.plugins.length} plugins • {deployment.environment}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDeploymentStatusColor(deployment.status)}`}>
                        {deployment.status}
                      </span>
                      {deployment.deployed_at && (
                        <span className="text-xs text-gray-500">
                          {new Date(deployment.deployed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Policies */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Active Policies</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {policies.slice(0, 5).map((policy) => (
                <div key={policy.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{policy.name}</p>
                      <p className="text-sm text-gray-500">{policy.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPolicyTypeColor(policy.type)}`}>
                        {policy.type}
                      </span>
                      <span className="text-xs text-gray-500">Priority: {policy.priority}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Enterprise Policies</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search policies..."
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
                  <option value="security">Security</option>
                  <option value="compliance">Compliance</option>
                  <option value="performance">Performance</option>
                  <option value="resource">Resource</option>
                  <option value="access">Access</option>
                </select>
                <button
                  onClick={createPolicy}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Policy
                </button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {policies.map((policy) => (
              <div key={policy.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{policy.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPolicyTypeColor(policy.type)}`}>
                        {policy.type}
                      </span>
                      {policy.enabled ? (
                        <CheckCircle className="w-4 h-4 text-green-500" title="Enabled" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" title="Disabled" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                    <p className="text-sm text-gray-500">
                      Priority: {policy.priority} • Created {new Date(policy.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'deployments' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Deployment Plans</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search deployments..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="deploying">Deploying</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
                <button
                  onClick={createDeploymentPlan}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Deployment
                </button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {deployments.map((deployment) => (
              <div key={deployment.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{deployment.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeploymentStatusColor(deployment.status)}`}>
                        {deployment.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{deployment.description}</p>
                    <p className="text-sm text-gray-500">
                      {deployment.plugins.length} plugins • {deployment.environment} • Created {new Date(deployment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    {deployment.status === 'approved' && (
                      <button className="p-2 text-gray-400 hover:text-gray-600" title="Deploy">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {deployment.status === 'deploying' && (
                      <button className="p-2 text-gray-400 hover:text-gray-600" title="Pause">
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    {deployment.status === 'failed' && (
                      <button className="p-2 text-gray-400 hover:text-gray-600" title="Retry">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Organization Users</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
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
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="developer">Developer</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={addUser}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {users.map((user) => (
              <div key={user.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">User {user.user_id}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Joined {new Date(user.joined_at).toLocaleDateString()} • 
                      Last active {new Date(user.last_active).toLocaleDateString()}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Permissions: {user.permissions.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="Edit Role">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="Remove User">
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Organization Settings</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">General Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      defaultValue="Healthcare Organization"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Domain</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      defaultValue="healthcare.org"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Plugin Limits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Plugins</label>
                    <input
                      type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      defaultValue="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Users</label>
                    <input
                      type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      defaultValue="500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Security Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Require encryption for all plugins
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Enable audit logging
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Multi-tenant mode
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  Save Settings
                </button>
              </div>
            </div>
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
