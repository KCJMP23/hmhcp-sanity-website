'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  RefreshCw, 
  Play, 
  Pause, 
  Square,
  Clock,
  Activity,
  Shield,
  FileText,
  Zap,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface WorkflowError {
  id: string;
  workflowId: string;
  workflowName: string;
  errorType: 'agent_failure' | 'compliance_violation' | 'timeout' | 'resource_limit' | 'validation_error' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stackTrace?: string;
  occurredAt: string;
  resolvedAt?: string;
  status: 'active' | 'resolved' | 'investigating';
  affectedAgents: string[];
  recoveryActions: string[];
  autoRecoveryAttempted: boolean;
  context: {
    healthcareTopic: string;
    complianceFramework: string;
    userAgent: string;
    systemVersion: string;
  };
}

interface ErrorPattern {
  pattern: string;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  affectedWorkflows: number;
  suggestedFix: string;
}

interface RecoveryWorkflow {
  id: string;
  name: string;
  description: string;
  applicableErrors: string[];
  successRate: number;
  avgRecoveryTime: number;
}

export function ErrorMonitoring() {
  const [errors, setErrors] = useState<WorkflowError[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<WorkflowError[]>([]);
  const [errorPatterns, setErrorPatterns] = useState<ErrorPattern[]>([]);
  const [recoveryWorkflows, setRecoveryWorkflows] = useState<RecoveryWorkflow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<WorkflowError | null>(null);

  useEffect(() => {
    loadErrorData();
  }, []);

  useEffect(() => {
    filterErrors();
  }, [errors, searchTerm, severityFilter, statusFilter, typeFilter]);

  const loadErrorData = async () => {
    try {
      setIsLoading(true);
      const [errorsResponse, patternsResponse, recoveryResponse] = await Promise.all([
        fetch('/api/admin/ai-workflows/errors'),
        fetch('/api/admin/ai-workflows/errors/patterns'),
        fetch('/api/admin/ai-workflows/errors/recovery-workflows')
      ]);

      if (errorsResponse.ok) {
        const errorsData = await errorsResponse.json();
        setErrors(errorsData.errors || []);
      }

      if (patternsResponse.ok) {
        const patternsData = await patternsResponse.json();
        setErrorPatterns(patternsData.patterns || []);
      }

      if (recoveryResponse.ok) {
        const recoveryData = await recoveryResponse.json();
        setRecoveryWorkflows(recoveryData.workflows || []);
      }
    } catch (error) {
      console.error('Failed to load error data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterErrors = () => {
    let filtered = errors;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(error =>
        error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.affectedAgents.some(agent => agent.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(error => error.severity === severityFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(error => error.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(error => error.errorType === typeFilter);
    }

    setFilteredErrors(filtered);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getErrorTypeIcon = (type: string) => {
    switch (type) {
      case 'agent_failure': return <Activity className="h-4 w-4" />;
      case 'compliance_violation': return <Shield className="h-4 w-4" />;
      case 'timeout': return <Clock className="h-4 w-4" />;
      case 'resource_limit': return <Zap className="h-4 w-4" />;
      case 'validation_error': return <FileText className="h-4 w-4" />;
      case 'system_error': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleErrorAction = async (errorId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/ai-workflows/errors/${errorId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        loadErrorData(); // Refresh data
      }
    } catch (error) {
      console.error(`Failed to ${action} error:`, error);
    }
  };

  const executeRecoveryWorkflow = async (errorId: string, workflowId: string) => {
    try {
      const response = await fetch(`/api/admin/ai-workflows/errors/${errorId}/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryWorkflowId: workflowId })
      });

      if (response.ok) {
        loadErrorData(); // Refresh data
        alert('Recovery workflow initiated successfully');
      }
    } catch (error) {
      console.error('Failed to execute recovery workflow:', error);
      alert('Failed to execute recovery workflow');
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
      {/* Error Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {errors.filter(e => e.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {errors.filter(e => e.severity === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">
              High priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {errors.filter(e => 
                e.status === 'resolved' && 
                new Date(e.resolvedAt || '').toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully fixed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Recovery</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {errors.filter(e => e.autoRecoveryAttempted).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-recovery attempts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Patterns */}
      {errorPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Error Patterns & Trends
            </CardTitle>
            <CardDescription>
              Identified error patterns and suggested fixes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {errorPatterns.map((pattern, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{pattern.pattern}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {pattern.frequency} occurrences
                      </Badge>
                      <div className="flex items-center gap-1">
                        {pattern.trend === 'increasing' ? (
                          <TrendingUp className="h-4 w-4 text-red-600" />
                        ) : pattern.trend === 'decreasing' ? (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        ) : (
                          <Activity className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="text-sm capitalize">{pattern.trend}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Affects {pattern.affectedWorkflows} workflows
                  </div>
                  <div className="text-sm">
                    <strong>Suggested Fix:</strong> {pattern.suggestedFix}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search Errors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search errors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="agent_failure">Agent Failure</SelectItem>
                <SelectItem value="compliance_violation">Compliance Violation</SelectItem>
                <SelectItem value="timeout">Timeout</SelectItem>
                <SelectItem value="resource_limit">Resource Limit</SelectItem>
                <SelectItem value="validation_error">Validation Error</SelectItem>
                <SelectItem value="system_error">System Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {filteredErrors.length} of {errors.length} errors
            </div>
            <Button onClick={loadErrorData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Monitoring
          </CardTitle>
          <CardDescription>
            Real-time error monitoring and recovery management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredErrors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No errors found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              {filteredErrors.map((error) => (
                <div key={error.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{error.workflowName}</h3>
                      <Badge className={getSeverityColor(error.severity)}>
                        {error.severity.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(error.status)}>
                        {error.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {error.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleErrorAction(error.id, 'investigate')}
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            Investigate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleErrorAction(error.id, 'resolve')}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Mark Resolved
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedError(error)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-gray-600">Error Type</div>
                      <div className="flex items-center gap-2">
                        {getErrorTypeIcon(error.errorType)}
                        <span className="font-medium capitalize">
                          {error.errorType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Occurred At</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{new Date(error.occurredAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Affected Agents</div>
                      <div className="flex flex-wrap gap-1">
                        {error.affectedAgents.map((agent) => (
                          <Badge key={agent} variant="secondary" className="text-xs">
                            {agent}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Auto Recovery</div>
                      <div className="flex items-center gap-1">
                        {error.autoRecoveryAttempted ? (
                          <RefreshCw className="h-4 w-4 text-green-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm">
                          {error.autoRecoveryAttempted ? 'Attempted' : 'Not Attempted'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm text-gray-600">Error Message</div>
                    <div className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                      {error.message}
                    </div>
                  </div>

                  {error.recoveryActions.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Recovery Actions</div>
                      <div className="flex flex-wrap gap-2">
                        {error.recoveryActions.map((action, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {action}
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

      {/* Error Details Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Error Details</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setSelectedError(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Error Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Type:</span> {selectedError.errorType}</div>
                    <div><span className="text-gray-600">Severity:</span> 
                      <Badge className={`ml-2 ${getSeverityColor(selectedError.severity)}`}>
                        {selectedError.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div><span className="text-gray-600">Status:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedError.status)}`}>
                        {selectedError.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div><span className="text-gray-600">Occurred:</span> {new Date(selectedError.occurredAt).toLocaleString()}</div>
                    {selectedError.resolvedAt && (
                      <div><span className="text-gray-600">Resolved:</span> {new Date(selectedError.resolvedAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Context</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Healthcare Topic:</span> {selectedError.context.healthcareTopic}</div>
                    <div><span className="text-gray-600">Compliance Framework:</span> {selectedError.context.complianceFramework}</div>
                    <div><span className="text-gray-600">System Version:</span> {selectedError.context.systemVersion}</div>
                    <div><span className="text-gray-600">User Agent:</span> {selectedError.context.userAgent}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Error Message</h4>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  {selectedError.message}
                </div>
              </div>

              {selectedError.stackTrace && (
                <div>
                  <h4 className="font-semibold mb-2">Stack Trace</h4>
                  <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                    <pre>{selectedError.stackTrace}</pre>
                  </div>
                </div>
              )}

              {recoveryWorkflows.length > 0 && selectedError.status === 'active' && (
                <div>
                  <h4 className="font-semibold mb-2">Available Recovery Workflows</h4>
                  <div className="space-y-2">
                    {recoveryWorkflows
                      .filter(workflow => 
                        workflow.applicableErrors.includes(selectedError.errorType)
                      )
                      .map((workflow) => (
                        <div key={workflow.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{workflow.name}</div>
                            <div className="text-sm text-gray-600">{workflow.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Success Rate: {workflow.successRate}% | 
                              Avg Recovery Time: {workflow.avgRecoveryTime}ms
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => executeRecoveryWorkflow(selectedError.id, workflow.id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Execute
                          </Button>
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
