'use client';

// Workflow Dashboard Component
// Story: 6.3.visual-workflow-builder.md
// Created: 2025-01-06

import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  WorkflowListResponse, 
  WorkflowStats,
  WorkflowExecution 
} from '@/types/workflow';
import { 
  Plus, 
  Play, 
  Pause, 
  Square, 
  Edit, 
  Trash2, 
  Copy, 
  Share2,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';

interface WorkflowDashboardProps {
  className?: string;
}

const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({ className = '' }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load workflows, stats, and recent executions in parallel
      const [workflowsRes, statsRes, executionsRes] = await Promise.all([
        fetch('/api/workflows'),
        fetch('/api/workflows/stats'),
        fetch('/api/workflow-executions?limit=10')
      ]);

      if (!workflowsRes.ok || !statsRes.ok || !executionsRes.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const workflowsData: WorkflowListResponse = await workflowsRes.json();
      const statsData: WorkflowStats = await statsRes.json();
      const executionsData = await executionsRes.json();

      setWorkflows(workflowsData.workflows);
      setStats(statsData);
      setRecentExecutions(executionsData.executions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkflow = () => {
    // Navigate to workflow builder
    window.location.href = '/admin/workflows/new';
  };

  const handleEditWorkflow = (workflowId: string) => {
    window.location.href = `/admin/workflows/${workflowId}/edit`;
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputData: {} })
      });

      if (!response.ok) {
        throw new Error('Failed to execute workflow');
      }

      // Refresh dashboard data
      loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete workflow');
      }

      // Refresh dashboard data
      loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workflow');
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || 
                           workflow.definition?.nodes?.some(node => node.category === categoryFilter);
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold">Error Loading Dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Management</h1>
          <p className="text-gray-600">Create, manage, and execute healthcare workflows</p>
        </div>
        <button
          onClick={handleCreateWorkflow}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWorkflows}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeWorkflows}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExecutions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed Executions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failedExecutions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="paused">Paused</option>
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="patient-care">Patient Care</option>
            <option value="research">Research</option>
            <option value="compliance">Compliance</option>
            <option value="administrative">Administrative</option>
          </select>
        </div>
      </div>

      {/* Workflows List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Workflows</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredWorkflows.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No workflows found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating a new workflow.'}
              </p>
            </div>
          ) : (
            filteredWorkflows.map((workflow) => (
              <WorkflowListItem
                key={workflow.id}
                workflow={workflow}
                onEdit={handleEditWorkflow}
                onExecute={handleExecuteWorkflow}
                onDelete={handleDeleteWorkflow}
              />
            ))
          )}
        </div>
      </div>

      {/* Recent Executions */}
      {recentExecutions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Executions</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentExecutions.map((execution) => (
              <ExecutionListItem key={execution.id} execution={execution} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Workflow List Item Component
interface WorkflowListItemProps {
  workflow: Workflow;
  onEdit: (workflowId: string) => void;
  onExecute: (workflowId: string) => void;
  onDelete: (workflowId: string) => void;
}

const WorkflowListItem: React.FC<WorkflowListItemProps> = ({
  workflow,
  onEdit,
  onExecute,
  onDelete
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'patient-care': 'Patient Care',
      'research': 'Research',
      'compliance': 'Compliance',
      'administrative': 'Administrative'
    };
    return labels[category as keyof typeof labels] || category;
  };

  return (
    <div className="px-6 py-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {workflow.name}
            </h4>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(workflow.status)}`}>
              {workflow.status}
            </span>
          </div>
          
          {workflow.description && (
            <p className="mt-1 text-sm text-gray-500 truncate">
              {workflow.description}
            </p>
          )}
          
          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
            <span>Category: {getCategoryLabel(workflow.definition?.nodes?.[0]?.category || 'unknown')}</span>
            <span>Nodes: {workflow.definition?.nodes?.length || 0}</span>
            <span>Updated: {new Date(workflow.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {workflow.status === 'active' && (
            <button
              onClick={() => onExecute(workflow.id)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-md"
              title="Execute workflow"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => onEdit(workflow.id)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
            title="Edit workflow"
          >
            <Edit className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDelete(workflow.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
            title="Delete workflow"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Execution List Item Component
interface ExecutionListItemProps {
  execution: WorkflowExecution;
}

const ExecutionListItem: React.FC<ExecutionListItemProps> = ({ execution }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      case 'paused': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon(execution.status)}
          <div>
            <p className="text-sm font-medium text-gray-900">
              Execution {execution.id.slice(0, 8)}...
            </p>
            <p className="text-xs text-gray-500">
              Started: {new Date(execution.startedAt).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className={`text-sm font-medium ${getStatusColor(execution.status)}`}>
            {execution.status}
          </span>
          
          {execution.executionTimeMs > 0 && (
            <span className="text-xs text-gray-500">
              {execution.executionTimeMs}ms
            </span>
          )}
        </div>
      </div>
      
      {execution.errorMessage && (
        <p className="mt-2 text-xs text-red-600">
          Error: {execution.errorMessage}
        </p>
      )}
    </div>
  );
};

export default WorkflowDashboard;
