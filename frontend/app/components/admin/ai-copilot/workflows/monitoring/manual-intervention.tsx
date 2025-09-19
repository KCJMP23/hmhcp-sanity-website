'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  Shield,
  FileText,
  Users,
  Zap,
  RefreshCw,
  Eye,
  Edit
} from 'lucide-react';

interface WorkflowIntervention {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentStep: string;
  progress: number;
  startedAt: string;
  estimatedCompletion: string;
  healthcareTopic: string;
  complianceFramework: string;
  participatingAgents: string[];
  interventionType: 'pause' | 'resume' | 'modify' | 'terminate' | 'restart' | 'approve';
  interventionReason: string;
  interventionBy: string;
  interventionAt: string;
  approvalRequired: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalBy?: string;
  approvalAt?: string;
  modificationDetails?: {
    stepChanges: string[];
    agentChanges: string[];
    configChanges: Record<string, any>;
  };
  auditTrail: InterventionAudit[];
}

interface InterventionAudit {
  id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  details: string;
  beforeState: Record<string, any>;
  afterState: Record<string, any>;
}

interface ApprovalRequest {
  id: string;
  workflowId: string;
  interventionType: string;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  healthcareContext: string;
  complianceImpact: string;
}

export function ManualIntervention() {
  const [workflows, setWorkflows] = useState<WorkflowIntervention[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowIntervention | null>(null);
  const [interventionType, setInterventionType] = useState('');
  const [interventionReason, setInterventionReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showInterventionModal, setShowInterventionModal] = useState(false);

  useEffect(() => {
    loadInterventionData();
  }, []);

  const loadInterventionData = async () => {
    try {
      setIsLoading(true);
      const [workflowsResponse, approvalsResponse] = await Promise.all([
        fetch('/api/admin/ai-workflows/intervention/active'),
        fetch('/api/admin/ai-workflows/intervention/approvals')
      ]);

      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        setWorkflows(workflowsData.workflows || []);
      }

      if (approvalsResponse.ok) {
        const approvalsData = await approvalsResponse.json();
        setApprovalRequests(approvalsData.requests || []);
      }
    } catch (error) {
      console.error('Failed to load intervention data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getApprovalColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleIntervention = async (workflowId: string, type: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/ai-workflows/intervention/${workflowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          reason,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        loadInterventionData(); // Refresh data
        setShowInterventionModal(false);
        setInterventionType('');
        setInterventionReason('');
        alert(`Intervention ${type} applied successfully`);
      } else {
        throw new Error('Failed to apply intervention');
      }
    } catch (error) {
      console.error(`Failed to ${type} workflow:`, error);
      alert(`Failed to ${type} workflow`);
    }
  };

  const handleApproval = async (requestId: string, decision: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/ai-workflows/intervention/approvals/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        loadInterventionData(); // Refresh data
        alert(`Approval request ${decision}d successfully`);
      }
    } catch (error) {
      console.error(`Failed to ${decision} approval:`, error);
      alert(`Failed to ${decision} approval request`);
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.status === 'running').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused Workflows</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {workflows.filter(w => w.status === 'paused').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting intervention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {approvalRequests.filter(r => r.priority === 'critical' || r.priority === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">
              High priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interventions</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((total, w) => total + w.auditTrail.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Approval Requests */}
      {approvalRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Pending Approval Requests
            </CardTitle>
            <CardDescription>
              High-priority workflow interventions requiring approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {approvalRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">Workflow {request.workflowId}</h3>
                      <Badge className={getPriorityColor(request.priority)}>
                        {request.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {request.interventionType.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproval(request.id, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproval(request.id, 'reject')}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-gray-600">Reason</div>
                      <div className="text-sm">{request.reason}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Requested By</div>
                      <div className="text-sm">{request.requestedBy}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Healthcare Context</div>
                      <div className="text-sm">{request.healthcareContext}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Compliance Impact</div>
                      <div className="text-sm">{request.complianceImpact}</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    Requested: {new Date(request.requestedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Active Workflows
          </CardTitle>
          <CardDescription>
            Monitor and intervene in running workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active workflows available for intervention
            </div>
          ) : (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{workflow.workflowName}</h3>
                      <Badge className={getStatusColor(workflow.status)}>
                        {getStatusIcon(workflow.status)}
                        <span className="ml-1 capitalize">{workflow.status}</span>
                      </Badge>
                      {workflow.approvalRequired && (
                        <Badge className={getApprovalColor(workflow.approvalStatus)}>
                          {workflow.approvalStatus.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedWorkflow(workflow)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedWorkflow(workflow);
                          setShowInterventionModal(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Intervene
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-gray-600">Current Step</div>
                      <div className="font-medium">{workflow.currentStep}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Progress</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${workflow.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{workflow.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Healthcare Topic</div>
                      <div className="font-medium">{workflow.healthcareTopic}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Compliance Framework</div>
                      <div className="font-medium">{workflow.complianceFramework}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Started</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{new Date(workflow.startedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Est. Completion</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{new Date(workflow.estimatedCompletion).toLocaleString()}</span>
                      </div>
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
                    <div>
                      <div className="text-gray-600">Last Intervention</div>
                      <div className="text-sm">
                        {workflow.auditTrail.length > 0 ? (
                          <span>
                            {workflow.auditTrail[workflow.auditTrail.length - 1].action} by{' '}
                            {workflow.auditTrail[workflow.auditTrail.length - 1].performedBy}
                          </span>
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Intervention Modal */}
      {showInterventionModal && selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Intervene in Workflow</CardTitle>
              <CardDescription>
                {selectedWorkflow.workflowName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Intervention Type</label>
                <Select value={interventionType} onValueChange={setInterventionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select intervention type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pause">Pause Workflow</SelectItem>
                    <SelectItem value="resume">Resume Workflow</SelectItem>
                    <SelectItem value="modify">Modify Configuration</SelectItem>
                    <SelectItem value="terminate">Terminate Workflow</SelectItem>
                    <SelectItem value="restart">Restart Workflow</SelectItem>
                    <SelectItem value="approve">Approve Step</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Reason for Intervention</label>
                <Textarea
                  value={interventionReason}
                  onChange={(e) => setInterventionReason(e.target.value)}
                  placeholder="Explain why this intervention is necessary..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInterventionModal(false);
                    setInterventionType('');
                    setInterventionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleIntervention(selectedWorkflow.workflowId, interventionType, interventionReason)}
                  disabled={!interventionType || !interventionReason}
                >
                  Apply Intervention
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflow Details Modal */}
      {selectedWorkflow && !showInterventionModal && (
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
                  <h4 className="font-semibold mb-2">Workflow Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Name:</span> {selectedWorkflow.workflowName}</div>
                    <div><span className="text-gray-600">Status:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedWorkflow.status)}`}>
                        {getStatusIcon(selectedWorkflow.status)}
                        <span className="ml-1 capitalize">{selectedWorkflow.status}</span>
                      </Badge>
                    </div>
                    <div><span className="text-gray-600">Current Step:</span> {selectedWorkflow.currentStep}</div>
                    <div><span className="text-gray-600">Progress:</span> {selectedWorkflow.progress}%</div>
                    <div><span className="text-gray-600">Healthcare Topic:</span> {selectedWorkflow.healthcareTopic}</div>
                    <div><span className="text-gray-600">Compliance Framework:</span> {selectedWorkflow.complianceFramework}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Timing Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Started:</span> {new Date(selectedWorkflow.startedAt).toLocaleString()}</div>
                    <div><span className="text-gray-600">Est. Completion:</span> {new Date(selectedWorkflow.estimatedCompletion).toLocaleString()}</div>
                    <div><span className="text-gray-600">Last Intervention:</span> 
                      {selectedWorkflow.auditTrail.length > 0 ? (
                        <span>{new Date(selectedWorkflow.auditTrail[selectedWorkflow.auditTrail.length - 1].performedAt).toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-500">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Participating Agents</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedWorkflow.participatingAgents.map((agent) => (
                    <Badge key={agent} variant="secondary">
                      {agent}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedWorkflow.auditTrail.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Intervention History</h4>
                  <div className="space-y-2">
                    {selectedWorkflow.auditTrail.map((audit) => (
                      <div key={audit.id} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{audit.action}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(audit.performedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div><strong>Performed by:</strong> {audit.performedBy}</div>
                          <div><strong>Details:</strong> {audit.details}</div>
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
