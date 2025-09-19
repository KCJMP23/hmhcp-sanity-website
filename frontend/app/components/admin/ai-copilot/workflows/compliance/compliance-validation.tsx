'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';

interface ComplianceCheck {
  id: string;
  workflowId: string;
  workflowName: string;
  complianceFramework: 'hipaa' | 'fda_advertising' | 'fhir_compliance' | 'hitrust';
  checkType: 'data_privacy' | 'content_accuracy' | 'audit_trail' | 'access_control' | 'encryption' | 'retention';
  status: 'passed' | 'failed' | 'warning' | 'pending';
  score: number;
  maxScore: number;
  details: string;
  violations: ComplianceViolation[];
  recommendations: string[];
  checkedAt: string;
  checkedBy: string;
  nextCheckDue: string;
}

interface ComplianceViolation {
  id: string;
  type: 'critical' | 'major' | 'minor' | 'info';
  description: string;
  rule: string;
  impact: string;
  remediation: string;
  status: 'open' | 'in_progress' | 'resolved';
  dueDate: string;
  assignedTo?: string;
}

interface ComplianceFramework {
  name: string;
  version: string;
  description: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  overallScore: number;
  lastUpdated: string;
}

export function ComplianceValidation() {
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCheck, setSelectedCheck] = useState<ComplianceCheck | null>(null);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setIsLoading(true);
      const [checksResponse, frameworksResponse] = await Promise.all([
        fetch('/api/admin/ai-workflows/compliance/checks'),
        fetch('/api/admin/ai-workflows/compliance/frameworks')
      ]);

      if (checksResponse.ok) {
        const checksData = await checksResponse.json();
        setComplianceChecks(checksData.checks || []);
      }

      if (frameworksResponse.ok) {
        const frameworksData = await frameworksResponse.json();
        setFrameworks(frameworksData.frameworks || []);
      }
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getViolationColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'major': return 'bg-orange-100 text-orange-800';
      case 'minor': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrameworkIcon = (framework: string) => {
    switch (framework) {
      case 'hipaa': return <Shield className="h-4 w-4 text-blue-600" />;
      case 'fda_advertising': return <FileText className="h-4 w-4 text-green-600" />;
      case 'fhir_compliance': return <Activity className="h-4 w-4 text-purple-600" />;
      case 'hitrust': return <Shield className="h-4 w-4 text-red-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredChecks = complianceChecks.filter(check => {
    if (selectedFramework !== 'all' && check.complianceFramework !== selectedFramework) {
      return false;
    }
    if (selectedStatus !== 'all' && check.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const runComplianceCheck = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/admin/ai-workflows/compliance/check/${workflowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        loadComplianceData(); // Refresh data
        alert('Compliance check initiated successfully');
      }
    } catch (error) {
      console.error('Failed to run compliance check:', error);
      alert('Failed to run compliance check');
    }
  };

  const exportComplianceReport = async () => {
    try {
      const response = await fetch('/api/admin/ai-workflows/compliance/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framework: selectedFramework,
          status: selectedStatus
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export compliance report:', error);
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
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceChecks.length}</div>
            <p className="text-xs text-muted-foreground">
              All frameworks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {complianceChecks.filter(c => c.status === 'passed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Compliance passed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {complianceChecks.filter(c => c.status === 'failed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {complianceChecks.filter(c => c.status === 'warning').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Review needed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Frameworks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Frameworks
          </CardTitle>
          <CardDescription>
            Overview of healthcare compliance framework status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {frameworks.map((framework) => (
              <div key={framework.name} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {getFrameworkIcon(framework.name.toLowerCase())}
                  <h3 className="font-semibold">{framework.name}</h3>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">{framework.description}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Score</span>
                    <span className="font-medium">{framework.overallScore}%</span>
                  </div>
                  <Progress value={framework.overallScore} className="h-2" />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">Passed</div>
                      <div className="font-medium text-green-600">{framework.passedChecks}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Failed</div>
                      <div className="font-medium text-red-600">{framework.failedChecks}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date(framework.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Compliance Checks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frameworks</SelectItem>
                <SelectItem value="hipaa">HIPAA</SelectItem>
                <SelectItem value="fda_advertising">FDA Advertising</SelectItem>
                <SelectItem value="fhir_compliance">FHIR Compliance</SelectItem>
                <SelectItem value="hitrust">HITRUST</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadComplianceData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Button onClick={exportComplianceReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredChecks.length} of {complianceChecks.length} compliance checks
          </div>
        </CardContent>
      </Card>

      {/* Compliance Checks List */}
      <Card>
        <CardContent className="p-0">
          {filteredChecks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No compliance checks found matching your criteria
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {filteredChecks.map((check) => (
                <div key={check.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{check.workflowName}</h3>
                      <Badge className={getStatusColor(check.status)}>
                        {getStatusIcon(check.status)}
                        <span className="ml-1 capitalize">{check.status}</span>
                      </Badge>
                      <Badge variant="outline">
                        {check.complianceFramework.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runComplianceCheck(check.workflowId)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Re-check
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCheck(check)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-gray-600">Check Type</div>
                      <div className="font-medium capitalize">
                        {check.checkType.replace('_', ' ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Score</div>
                      <div className="flex items-center gap-2">
                        <Progress value={(check.score / check.maxScore) * 100} className="flex-1" />
                        <span className="font-medium">
                          {check.score}/{check.maxScore}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Checked At</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{new Date(check.checkedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm text-gray-600">Details</div>
                    <div className="text-sm">{check.details}</div>
                  </div>

                  {check.violations.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Violations ({check.violations.length})</div>
                      <div className="space-y-2">
                        {check.violations.slice(0, 3).map((violation) => (
                          <div key={violation.id} className="flex items-center gap-2 text-sm">
                            <Badge className={getViolationColor(violation.type)}>
                              {violation.type.toUpperCase()}
                            </Badge>
                            <span>{violation.description}</span>
                          </div>
                        ))}
                        {check.violations.length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{check.violations.length - 3} more violations
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {check.recommendations.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-600 mb-2">Recommendations</div>
                      <div className="space-y-1">
                        {check.recommendations.slice(0, 2).map((rec, index) => (
                          <div key={index} className="text-sm text-blue-600">
                            • {rec}
                          </div>
                        ))}
                        {check.recommendations.length > 2 && (
                          <div className="text-sm text-gray-500">
                            +{check.recommendations.length - 2} more recommendations
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Check Details Modal */}
      {selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Compliance Check Details</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCheck(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Check Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Workflow:</span> {selectedCheck.workflowName}</div>
                    <div><span className="text-gray-600">Framework:</span> {selectedCheck.complianceFramework.toUpperCase()}</div>
                    <div><span className="text-gray-600">Type:</span> {selectedCheck.checkType.replace('_', ' ')}</div>
                    <div><span className="text-gray-600">Status:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedCheck.status)}`}>
                        {getStatusIcon(selectedCheck.status)}
                        <span className="ml-1 capitalize">{selectedCheck.status}</span>
                      </Badge>
                    </div>
                    <div><span className="text-gray-600">Score:</span> {selectedCheck.score}/{selectedCheck.maxScore}</div>
                    <div><span className="text-gray-600">Checked By:</span> {selectedCheck.checkedBy}</div>
                    <div><span className="text-gray-600">Checked At:</span> {new Date(selectedCheck.checkedAt).toLocaleString()}</div>
                    <div><span className="text-gray-600">Next Check Due:</span> {new Date(selectedCheck.nextCheckDue).toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Compliance Score</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Score</span>
                        <span>{Math.round((selectedCheck.score / selectedCheck.maxScore) * 100)}%</span>
                      </div>
                      <Progress value={(selectedCheck.score / selectedCheck.maxScore) * 100} className="h-3" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Check Details</h4>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  {selectedCheck.details}
                </div>
              </div>

              {selectedCheck.violations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Violations</h4>
                  <div className="space-y-3">
                    {selectedCheck.violations.map((violation) => (
                      <div key={violation.id} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getViolationColor(violation.type)}>
                            {violation.type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {violation.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div><strong>Description:</strong> {violation.description}</div>
                          <div><strong>Rule:</strong> {violation.rule}</div>
                          <div><strong>Impact:</strong> {violation.impact}</div>
                          <div><strong>Remediation:</strong> {violation.remediation}</div>
                          {violation.assignedTo && (
                            <div><strong>Assigned To:</strong> {violation.assignedTo}</div>
                          )}
                          <div><strong>Due Date:</strong> {new Date(violation.dueDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCheck.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <div className="space-y-2">
                    {selectedCheck.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-600 font-bold">{index + 1}.</span>
                        <span>{rec}</span>
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
