'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Shield,
  FileText,
  Edit3,
  Eye,
  AlertOctagon,
  UserCheck,
  Activity,
  History,
  Settings,
  Zap,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  SkipForward,
  RefreshCw
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { AppleButton } from '@/components/ui/apple-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  requiresManualApproval,
  createComplianceAuditEvent,
  detectPHI,
  sanitizeContent,
  validateMedicalTerminology,
  ComplianceStandard
} from '@/lib/validation/healthcare-compliance';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ApprovalRequest {
  id: string;
  workflowId: string;
  workflowName: string;
  type: 'treatment_plan' | 'medication_change' | 'procedure' | 'diagnosis' | 'referral' | 'lab_order';
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  requestedBy: string;
  requestedAt: Date;
  requiredApprovers: string[];
  currentApprovers: string[];
  deadline?: Date;
  patientId?: string;
  clinicalContext?: string;
  riskScore?: number;
  complianceFlags?: string[];
  documents?: Document[];
  comments?: Comment[];
}

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: Date;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
  type: 'note' | 'concern' | 'approval' | 'rejection';
}

interface WorkflowControl {
  id: string;
  workflowId: string;
  name: string;
  status: 'running' | 'paused' | 'stopped';
  type: 'clinical_decision' | 'patient_engagement' | 'data_processing' | 'integration' | 'reporting';
  progress: number;
  startedAt: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  currentStep: string;
  totalSteps: number;
  canPause: boolean;
  canStop: boolean;
  canResume: boolean;
  canOverride: boolean;
  overrideReason?: string;
  healthcareContext?: {
    patientCount?: number;
    dataVolume?: string;
    complianceRequirements?: string[];
    phiInvolved: boolean;
  };
}

interface OverrideAction {
  id: string;
  workflowId: string;
  action: string;
  reason: string;
  performedBy: string;
  performedAt: Date;
  riskAssessment?: string;
  approvedBy?: string[];
  complianceNotes?: string;
}

export default function ManualControls() {
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [workflowControls, setWorkflowControls] = useState<WorkflowControl[]>([]);
  const [overrideHistory, setOverrideHistory] = useState<OverrideAction[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowControl | null>(null);
  const [activeTab, setActiveTab] = useState('approvals');
  const [approvalComment, setApprovalComment] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);
  const [emergencyOverride, setEmergencyOverride] = useState(false);
  const [phiDetectionEnabled, setPHIDetectionEnabled] = useState(true);
  const [complianceValidation, setComplianceValidation] = useState<Record<string, any>>({});

  // Mock data generation
  useEffect(() => {
    const mockApprovals: ApprovalRequest[] = [
      {
        id: 'apr1',
        workflowId: 'wf1',
        workflowName: 'Medication Dosage Adjustment',
        type: 'medication_change',
        priority: 'high',
        status: 'pending',
        requestedBy: 'AI Clinical Assistant',
        requestedAt: new Date(Date.now() - 900000),
        requiredApprovers: ['Dr. Sarah Johnson', 'Pharmacy Review'],
        currentApprovers: [],
        deadline: new Date(Date.now() + 3600000),
        patientId: 'PT12345',
        clinicalContext: 'Patient showing elevated blood pressure readings. Recommendation to increase lisinopril from 10mg to 20mg daily.',
        riskScore: 0.3,
        complianceFlags: ['HIPAA', 'FDA'],
        documents: [
          {
            id: 'doc1',
            name: 'Blood Pressure Trends.pdf',
            type: 'application/pdf',
            url: '/documents/bp-trends.pdf',
            uploadedAt: new Date(Date.now() - 1800000)
          }
        ],
        comments: []
      },
      {
        id: 'apr2',
        workflowId: 'wf2',
        workflowName: 'Lab Order Protocol',
        type: 'lab_order',
        priority: 'normal',
        status: 'pending',
        requestedBy: 'Diagnostic AI',
        requestedAt: new Date(Date.now() - 1800000),
        requiredApprovers: ['Dr. Michael Chen'],
        currentApprovers: [],
        patientId: 'PT67890',
        clinicalContext: 'Routine follow-up labs for diabetes management.',
        riskScore: 0.1,
        complianceFlags: ['CLIA'],
        comments: []
      },
      {
        id: 'apr3',
        workflowId: 'wf3',
        workflowName: 'Emergency Referral',
        type: 'referral',
        priority: 'critical',
        status: 'escalated',
        requestedBy: 'Triage System',
        requestedAt: new Date(Date.now() - 300000),
        requiredApprovers: ['Chief Medical Officer', 'Emergency Dept Head'],
        currentApprovers: ['Emergency Dept Head'],
        deadline: new Date(Date.now() + 600000),
        patientId: 'PT11111',
        clinicalContext: 'Acute chest pain with abnormal ECG findings. Immediate cardiology consultation required.',
        riskScore: 0.9,
        complianceFlags: ['EMTALA', 'HIPAA'],
        documents: [
          {
            id: 'doc2',
            name: 'ECG Report.pdf',
            type: 'application/pdf',
            url: '/documents/ecg.pdf',
            uploadedAt: new Date(Date.now() - 600000)
          }
        ],
        comments: [
          {
            id: 'com1',
            author: 'Emergency Dept Head',
            text: 'Patient stabilized. Cardiology notified.',
            timestamp: new Date(Date.now() - 180000),
            type: 'note'
          }
        ]
      }
    ];

    const mockWorkflows: WorkflowControl[] = [
      {
        id: 'wc1',
        workflowId: 'wf1',
        name: 'Patient Risk Stratification',
        status: 'running',
        type: 'clinical_decision',
        progress: 65,
        startedAt: new Date(Date.now() - 7200000),
        currentStep: 'Analyzing Comorbidities',
        totalSteps: 8,
        canPause: true,
        canStop: true,
        canResume: false,
        canOverride: true,
        healthcareContext: {
          patientCount: 1250,
          dataVolume: '2.3GB',
          complianceRequirements: ['HIPAA', 'HITECH'],
          phiInvolved: true
        }
      },
      {
        id: 'wc2',
        workflowId: 'wf2',
        name: 'Appointment Reminder Campaign',
        status: 'paused',
        type: 'patient_engagement',
        progress: 40,
        startedAt: new Date(Date.now() - 14400000),
        pausedAt: new Date(Date.now() - 3600000),
        currentStep: 'Sending SMS Reminders',
        totalSteps: 5,
        canPause: false,
        canStop: true,
        canResume: true,
        canOverride: false,
        healthcareContext: {
          patientCount: 450,
          dataVolume: '150MB',
          complianceRequirements: ['TCPA'],
          phiInvolved: false
        }
      },
      {
        id: 'wc3',
        workflowId: 'wf3',
        name: 'Claims Processing Batch',
        status: 'running',
        type: 'data_processing',
        progress: 89,
        startedAt: new Date(Date.now() - 5400000),
        currentStep: 'Validating Codes',
        totalSteps: 10,
        canPause: true,
        canStop: false,
        canResume: false,
        canOverride: true,
        healthcareContext: {
          patientCount: 3000,
          dataVolume: '5.7GB',
          complianceRequirements: ['HIPAA', 'X12'],
          phiInvolved: true
        }
      }
    ];

    const mockOverrides: OverrideAction[] = [
      {
        id: 'ov1',
        workflowId: 'wf1',
        action: 'Force Complete Step',
        reason: 'System timeout on non-critical validation',
        performedBy: 'Admin User',
        performedAt: new Date(Date.now() - 86400000),
        riskAssessment: 'Low risk - validation can be performed post-processing',
        approvedBy: ['System Administrator'],
        complianceNotes: 'No PHI exposure risk'
      },
      {
        id: 'ov2',
        workflowId: 'wf2',
        action: 'Emergency Stop',
        reason: 'Incorrect patient cohort selected',
        performedBy: 'Dr. Sarah Johnson',
        performedAt: new Date(Date.now() - 172800000),
        riskAssessment: 'High risk if continued - potential HIPAA violation',
        approvedBy: ['Chief Compliance Officer'],
        complianceNotes: 'Immediate stop required to prevent unauthorized disclosure'
      }
    ];

    setApprovalRequests(mockApprovals);
    setWorkflowControls(mockWorkflows);
    setOverrideHistory(mockOverrides);
  }, []);

  const getPriorityColor = (priority: ApprovalRequest['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'urgent':
        return 'text-orange-600 bg-orange-50';
      case 'high':
        return 'text-yellow-600 bg-yellow-50';
      case 'normal':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: ApprovalRequest['type']) => {
    switch (type) {
      case 'treatment_plan':
        return <FileText className="h-5 w-5" />;
      case 'medication_change':
        return <Activity className="h-5 w-5" />;
      case 'procedure':
        return <Zap className="h-5 w-5" />;
      case 'diagnosis':
        return <Eye className="h-5 w-5" />;
      case 'referral':
        return <UserCheck className="h-5 w-5" />;
      case 'lab_order':
        return <FileText className="h-5 w-5" />;
    }
  };

  const handleApprove = async (requestId: string) => {
    const request = approvalRequests.find(r => r.id === requestId);
    if (!request) return;

    // Perform healthcare compliance validation before approval
    if (phiDetectionEnabled && request.clinicalContext) {
      const phiResult = detectPHI(request.clinicalContext);
      if (phiResult.hasPHI) {
        // Log PHI detection
        console.warn('PHI detected in approval request:', phiResult.phiTypes);
      }
    }

    // Check if manual approval is required based on healthcare context
    const approvalCheck = requiresManualApproval(
      request.clinicalContext || '',
      request.type === 'treatment_plan' ? 'treatment-plan' : 
      request.type === 'medication_change' ? 'medication' : 'general'
    );

    // Create audit event for approval
    const auditEvent = createComplianceAuditEvent(
      'workflow_approval',
      'approval_request',
      requestId,
      'HIPAA',
      { passed: true, score: 100, violations: [], summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }, recommendations: [] },
      'current-user',
      {
        approvalType: request.type,
        priority: request.priority,
        comment: approvalComment,
        phiInvolved: request.patientId ? true : false
      }
    );

    setApprovalRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? { 
              ...req, 
              status: 'approved' as const,
              comments: [...(req.comments || []), {
                id: `comment_${Date.now()}`,
                author: 'Current User',
                text: approvalComment || 'Approved via manual review',
                timestamp: new Date(),
                type: 'approval' as const
              }]
            }
          : req
      )
    );
    setSelectedRequest(null);
    setApprovalComment('');
  };

  const handleReject = (requestId: string) => {
    setApprovalRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'rejected' as const }
          : req
      )
    );
    setSelectedRequest(null);
    setApprovalComment('');
  };

  const handlePauseWorkflow = (workflowId: string) => {
    setWorkflowControls(prev =>
      prev.map(wf =>
        wf.id === workflowId
          ? {
              ...wf,
              status: 'paused' as const,
              pausedAt: new Date(),
              canPause: false,
              canResume: true
            }
          : wf
      )
    );
  };

  const handleResumeWorkflow = (workflowId: string) => {
    setWorkflowControls(prev =>
      prev.map(wf =>
        wf.id === workflowId
          ? {
              ...wf,
              status: 'running' as const,
              resumedAt: new Date(),
              canPause: true,
              canResume: false
            }
          : wf
      )
    );
  };

  const handleStopWorkflow = (workflowId: string) => {
    setWorkflowControls(prev =>
      prev.map(wf =>
        wf.id === workflowId
          ? {
              ...wf,
              status: 'stopped' as const,
              canPause: false,
              canStop: false,
              canResume: false
            }
          : wf
      )
    );
  };

  const handleOverride = (workflowId: string, action: string) => {
    const newOverride: OverrideAction = {
      id: `ov${Date.now()}`,
      workflowId,
      action,
      reason: overrideReason,
      performedBy: 'Current User',
      performedAt: new Date(),
      riskAssessment: emergencyOverride ? 'Emergency override - risk accepted' : 'Standard override',
      complianceNotes: 'Action logged for audit'
    };

    setOverrideHistory(prev => [newOverride, ...prev]);
    setOverrideReason('');
    setEmergencyOverride(false);
  };

  const pendingApprovals = approvalRequests.filter(r => r.status === 'pending' || r.status === 'escalated');
  const criticalApprovals = pendingApprovals.filter(r => r.priority === 'critical' || r.priority === 'urgent');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="heading3" className="text-gray-900 mb-2">
            Manual Controls & Approvals
          </Typography>
          <Typography variant="body" className="text-gray-600">
            Manage workflow approvals, manual interventions, and override controls
          </Typography>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoApproveEnabled}
              onCheckedChange={setAutoApproveEnabled}
              id="auto-approve"
            />
            <Label htmlFor="auto-approve" className="text-sm">
              Auto-approve low risk
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={phiDetectionEnabled}
              onCheckedChange={setPHIDetectionEnabled}
              id="phi-detection"
            />
            <Label htmlFor="phi-detection" className="text-sm">
              PHI Detection
            </Label>
          </div>
          <AppleButton variant="outline" icon={<Shield className="h-4 w-4" />}>
            <span className="sr-only sm:not-sr-only">HIPAA </span>Compliance
          </AppleButton>
          <AppleButton variant="outline" icon={<Settings className="h-4 w-4" />}>
            Settings
          </AppleButton>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalApprovals.length > 0 && (
        <FrostedCard className="p-4 border-l-4 border-red-500">
          <div className="flex items-start space-x-3">
            <AlertOctagon className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <Typography variant="label" className="text-red-900 mb-1">
                {criticalApprovals.length} Critical Approval{criticalApprovals.length > 1 ? 's' : ''} Required
              </Typography>
              <Typography variant="body" className="text-gray-700">
                Immediate attention needed for high-priority healthcare workflows
              </Typography>
            </div>
            <AppleButton variant="primary" size="sm" onClick={() => setActiveTab('approvals')}>
              Review Now
            </AppleButton>
          </div>
        </FrostedCard>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="approvals">
            Approvals
            {pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="controls">Workflow Controls</TabsTrigger>
          <TabsTrigger value="overrides">Override History</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          {/* Approval Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Typography variant="heading4" className="text-gray-900">
                Pending Approvals
              </Typography>
              {pendingApprovals.map(request => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FrostedCard
                    className={`p-4 cursor-pointer transition-all ${
                      selectedRequest?.id === request.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        {getTypeIcon(request.type)}
                        <div>
                          <Typography variant="label" className="text-gray-900">
                            {request.workflowName}
                          </Typography>
                          <Typography variant="small" className="text-gray-600">
                            Requested by {request.requestedBy}
                          </Typography>
                        </div>
                      </div>
                      <Badge className={getPriorityColor(request.priority)}>
                        {request.priority.toUpperCase()}
                      </Badge>
                    </div>

                    <Typography variant="body" className="text-gray-700 mb-3">
                      {request.clinicalContext}
                    </Typography>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {request.complianceFlags?.map(flag => (
                          <Badge key={flag} variant="outline" className="text-xs">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                      {request.deadline && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>
                            {Math.round((request.deadline.getTime() - Date.now()) / 60000)} min
                          </span>
                        </div>
                      )}
                    </div>

                    {request.status === 'escalated' && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <Typography variant="small" className="text-yellow-800">
                            Escalated for urgent review
                          </Typography>
                        </div>
                      </div>
                    )}
                  </FrostedCard>
                </motion.div>
              ))}
            </div>

            {/* Approval Details */}
            <div>
              {selectedRequest ? (
                <FrostedCard className="p-6">
                  <Typography variant="heading4" className="text-gray-900 mb-4">
                    Approval Details
                  </Typography>

                  <div className="space-y-4">
                    <div>
                      <Typography variant="label" className="text-gray-700 mb-1">
                        Workflow
                      </Typography>
                      <Typography variant="body" className="text-gray-900">
                        {selectedRequest.workflowName}
                      </Typography>
                    </div>

                    <div>
                      <Typography variant="label" className="text-gray-700 mb-1">
                        Clinical Context
                      </Typography>
                      <Typography variant="body" className="text-gray-900">
                        {selectedRequest.clinicalContext}
                      </Typography>
                    </div>

                    {selectedRequest.riskScore !== undefined && (
                      <div>
                        <Typography variant="label" className="text-gray-700 mb-2">
                          Risk Assessment
                        </Typography>
                        <div className="flex items-center space-x-3">
                          <Progress
                            value={selectedRequest.riskScore * 100}
                            className="flex-1"
                          />
                          <Typography variant="small" className="text-gray-600">
                            {Math.round(selectedRequest.riskScore * 100)}%
                          </Typography>
                        </div>
                      </div>
                    )}

                    <div>
                      <Typography variant="label" className="text-gray-700 mb-2">
                        Required Approvers
                      </Typography>
                      <div className="space-y-2">
                        {selectedRequest.requiredApprovers.map(approver => (
                          <div key={approver} className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <Typography variant="body" className="text-gray-900">
                              {approver}
                            </Typography>
                            {selectedRequest.currentApprovers.includes(approver) && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                      <div>
                        <Typography variant="label" className="text-gray-700 mb-2">
                          Supporting Documents
                        </Typography>
                        <div className="space-y-2">
                          {selectedRequest.documents.map(doc => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <Typography variant="small" className="text-gray-900">
                                  {doc.name}
                                </Typography>
                              </div>
                              <AppleButton variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </AppleButton>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Typography variant="label" className="text-gray-700 mb-2">
                        Comments
                      </Typography>
                      <Textarea
                        placeholder="Add approval comments or concerns..."
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="flex items-center space-x-3 pt-4">
                      <AppleButton
                        variant="primary"
                        onClick={() => handleApprove(selectedRequest.id)}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </AppleButton>
                      <AppleButton
                        variant="outline"
                        onClick={() => handleReject(selectedRequest.id)}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </AppleButton>
                    </div>
                  </div>
                </FrostedCard>
              ) : (
                <FrostedCard className="p-12 text-center">
                  <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <Typography variant="body" className="text-gray-500">
                    Select an approval request to view details
                  </Typography>
                </FrostedCard>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          {/* Workflow Controls */}
          <div className="grid grid-cols-1 gap-4">
            {workflowControls.map(workflow => (
              <FrostedCard key={workflow.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <Typography variant="heading4" className="text-gray-900">
                        {workflow.name}
                      </Typography>
                      <Badge
                        variant={
                          workflow.status === 'running'
                            ? 'secondary'
                            : workflow.status === 'paused'
                            ? 'outline'
                            : 'destructive'
                        }
                      >
                        {workflow.status.toUpperCase()}
                      </Badge>
                    </div>
                    <Typography variant="body" className="text-gray-600">
                      Step {workflow.currentStep} • {workflow.currentStep} of {workflow.totalSteps}
                    </Typography>
                  </div>
                  <div className="flex items-center space-x-2">
                    {workflow.canPause && (
                      <AppleButton
                        variant="outline"
                        size="sm"
                        onClick={() => handlePauseWorkflow(workflow.id)}
                      >
                        <Pause className="h-4 w-4" />
                      </AppleButton>
                    )}
                    {workflow.canResume && (
                      <AppleButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleResumeWorkflow(workflow.id)}
                      >
                        <Play className="h-4 w-4" />
                      </AppleButton>
                    )}
                    {workflow.canStop && (
                      <AppleButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleStopWorkflow(workflow.id)}
                      >
                        <Square className="h-4 w-4" />
                      </AppleButton>
                    )}
                    {workflow.canOverride && (
                      <AppleButton
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedWorkflow(workflow)}
                      >
                        <SkipForward className="h-4 w-4" />
                      </AppleButton>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Typography variant="label" className="text-gray-700">
                      Progress
                    </Typography>
                    <Typography variant="small" className="text-gray-600">
                      {workflow.progress}%
                    </Typography>
                  </div>
                  <Progress value={workflow.progress} className="h-2" />
                </div>

                {workflow.healthcareContext && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    {workflow.healthcareContext.patientCount !== undefined && (
                      <div>
                        <Typography variant="small" className="text-gray-600">
                          Patients
                        </Typography>
                        <Typography variant="label" className="text-gray-900">
                          {workflow.healthcareContext.patientCount.toLocaleString()}
                        </Typography>
                      </div>
                    )}
                    {workflow.healthcareContext.dataVolume && (
                      <div>
                        <Typography variant="small" className="text-gray-600">
                          Data Volume
                        </Typography>
                        <Typography variant="label" className="text-gray-900">
                          {workflow.healthcareContext.dataVolume}
                        </Typography>
                      </div>
                    )}
                    {workflow.healthcareContext.phiInvolved && (
                      <div>
                        <Typography variant="small" className="text-gray-600">
                          PHI Status
                        </Typography>
                        <Badge variant="secondary">Protected</Badge>
                      </div>
                    )}
                    {workflow.healthcareContext.complianceRequirements && (
                      <div>
                        <Typography variant="small" className="text-gray-600">
                          Compliance
                        </Typography>
                        <div className="flex flex-wrap gap-1">
                          {workflow.healthcareContext.complianceRequirements.map(req => (
                            <Badge key={req} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </FrostedCard>
            ))}
          </div>

          {/* Override Modal */}
          {selectedWorkflow && (
            <FrostedCard className="p-6">
              <Typography variant="heading4" className="text-gray-900 mb-4">
                Override Workflow
              </Typography>
              <div className="space-y-4">
                <div>
                  <Typography variant="label" className="text-gray-700 mb-2">
                    Override Action
                  </Typography>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                    <option>Skip Current Step</option>
                    <option>Force Complete</option>
                    <option>Restart Workflow</option>
                    <option>Emergency Stop</option>
                  </select>
                </div>
                <div>
                  <Typography variant="label" className="text-gray-700 mb-2">
                    Reason for Override
                  </Typography>
                  <Textarea
                    placeholder="Provide detailed justification..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={emergencyOverride}
                    onCheckedChange={setEmergencyOverride}
                    id="emergency"
                  />
                  <Label htmlFor="emergency" className="text-sm">
                    Emergency Override (bypass additional approvals)
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <AppleButton
                    variant="primary"
                    onClick={() => {
                      handleOverride(selectedWorkflow.workflowId, 'Manual Override');
                      setSelectedWorkflow(null);
                    }}
                    disabled={!overrideReason}
                  >
                    Confirm Override
                  </AppleButton>
                  <AppleButton
                    variant="outline"
                    onClick={() => setSelectedWorkflow(null)}
                  >
                    Cancel
                  </AppleButton>
                </div>
              </div>
            </FrostedCard>
          )}
        </TabsContent>

        <TabsContent value="overrides" className="space-y-4">
          {/* Override History */}
          <FrostedCard className="p-6">
            <Typography variant="heading4" className="text-gray-900 mb-4">
              Override History
            </Typography>
            <div className="space-y-4">
              {overrideHistory.map(override => (
                <div
                  key={override.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Typography variant="label" className="text-gray-900">
                        {override.action}
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        Workflow ID: {override.workflowId}
                      </Typography>
                    </div>
                    <Typography variant="small" className="text-gray-500">
                      {new Date(override.performedAt).toLocaleString()}
                    </Typography>
                  </div>
                  <Typography variant="body" className="text-gray-700 mb-2">
                    {override.reason}
                  </Typography>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <Typography variant="small" className="text-gray-600">
                          {override.performedBy}
                        </Typography>
                      </div>
                      {override.riskAssessment && (
                        <Badge variant="outline">{override.riskAssessment}</Badge>
                      )}
                    </div>
                    {override.complianceNotes && (
                      <Typography variant="small" className="text-gray-500">
                        {override.complianceNotes}
                      </Typography>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </FrostedCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}