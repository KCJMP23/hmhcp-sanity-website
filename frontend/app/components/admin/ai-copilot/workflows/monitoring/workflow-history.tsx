'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Pause,
  DollarSign,
  Shield,
  FileText,
  Calendar
} from 'lucide-react';

interface WorkflowExecution {
  id: string;
  name: string;
  status: 'completed' | 'failed' | 'cancelled';
  workflowType: string;
  healthcareTopic: string;
  startedAt: string;
  completedAt: string;
  duration: number;
  totalCost: number;
  complianceScore: number;
  medicalAccuracyScore: number;
  participatingAgents: string[];
  createdBy: string;
  results: {
    contentGenerated?: number;
    researchSources?: number;
    complianceChecks?: number;
    errors?: string[];
  };
  artifacts: {
    id: string;
    name: string;
    type: 'content' | 'research' | 'compliance_report' | 'error_log';
    url: string;
    size: number;
  }[];
}

export function WorkflowHistory() {
  const [workflows, setWorkflows] = useState<WorkflowExecution[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<WorkflowExecution[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowExecution | null>(null);

  useEffect(() => {
    loadWorkflowHistory();
  }, []);

  useEffect(() => {
    filterWorkflows();
  }, [workflows, searchTerm, statusFilter, typeFilter, dateFilter]);

  const loadWorkflowHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/ai-workflows/history');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Failed to load workflow history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterWorkflows = () => {
    let filtered = workflows;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(workflow =>
        workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.healthcareTopic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(workflow => workflow.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(workflow => workflow.workflowType === typeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(workflow => 
        new Date(workflow.completedAt) >= filterDate
      );
    }

    setFilteredWorkflows(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'cancelled': return <Pause className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const exportHistory = async () => {
    try {
      const response = await fetch('/api/admin/ai-workflows/history/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: { searchTerm, statusFilter, typeFilter, dateFilter }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workflow-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export history:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="content_creation">Content Creation</SelectItem>
                <SelectItem value="research_synthesis">Research Synthesis</SelectItem>
                <SelectItem value="compliance_validation">Compliance Validation</SelectItem>
                <SelectItem value="multi_platform_publishing">Multi-Platform Publishing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {filteredWorkflows.length} of {workflows.length} workflows
            </div>
            <Button onClick={exportHistory} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workflow History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Workflow Execution History
          </CardTitle>
          <CardDescription>
            Complete history of AI workflow executions with detailed metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredWorkflows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No workflows found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.map((workflow) => (
                <div key={workflow.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{workflow.name}</h3>
                      <Badge className={getStatusColor(workflow.status)}>
                        {getStatusIcon(workflow.status)}
                        <span className="ml-1 capitalize">{workflow.status}</span>
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedWorkflow(workflow)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-gray-600">Healthcare Topic</div>
                      <div className="font-medium">{workflow.healthcareTopic}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{formatDuration(workflow.duration)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Cost</div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">${workflow.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Compliance Score</div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{workflow.complianceScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Started</div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{new Date(workflow.startedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Completed</div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{new Date(workflow.completedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Created By</div>
                      <div>{workflow.createdBy}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Agents</div>
                      <div className="flex flex-wrap gap-1">
                        {workflow.participatingAgents.map((agent) => (
                          <Badge key={agent} variant="secondary" className="text-xs">
                            {agent}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {workflow.artifacts.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-gray-600 mb-2">Generated Artifacts</div>
                      <div className="flex flex-wrap gap-2">
                        {workflow.artifacts.map((artifact) => (
                          <Badge key={artifact.id} variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {artifact.name} ({formatFileSize(artifact.size)})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Details Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Workflow Details</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setSelectedWorkflow(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Name:</span> {selectedWorkflow.name}</div>
                    <div><span className="text-gray-600">Type:</span> {selectedWorkflow.workflowType}</div>
                    <div><span className="text-gray-600">Topic:</span> {selectedWorkflow.healthcareTopic}</div>
                    <div><span className="text-gray-600">Status:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedWorkflow.status)}`}>
                        {getStatusIcon(selectedWorkflow.status)}
                        <span className="ml-1 capitalize">{selectedWorkflow.status}</span>
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Duration:</span> {formatDuration(selectedWorkflow.duration)}</div>
                    <div><span className="text-gray-600">Total Cost:</span> ${selectedWorkflow.totalCost.toFixed(2)}</div>
                    <div><span className="text-gray-600">Compliance Score:</span> {selectedWorkflow.complianceScore}%</div>
                    <div><span className="text-gray-600">Medical Accuracy:</span> {selectedWorkflow.medicalAccuracyScore}%</div>
                  </div>
                </div>
              </div>

              {selectedWorkflow.results && (
                <div>
                  <h4 className="font-semibold mb-2">Execution Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {selectedWorkflow.results.contentGenerated && (
                      <div>
                        <span className="text-gray-600">Content Generated:</span> {selectedWorkflow.results.contentGenerated} items
                      </div>
                    )}
                    {selectedWorkflow.results.researchSources && (
                      <div>
                        <span className="text-gray-600">Research Sources:</span> {selectedWorkflow.results.researchSources} sources
                      </div>
                    )}
                    {selectedWorkflow.results.complianceChecks && (
                      <div>
                        <span className="text-gray-600">Compliance Checks:</span> {selectedWorkflow.results.complianceChecks} checks
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedWorkflow.artifacts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Generated Artifacts</h4>
                  <div className="space-y-2">
                    {selectedWorkflow.artifacts.map((artifact) => (
                      <div key={artifact.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span>{artifact.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {artifact.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatFileSize(artifact.size)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
