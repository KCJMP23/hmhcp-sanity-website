'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  FileText,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { ComplianceStatus, ComplianceAlert, ComplianceViolation } from '@/types/analytics';

interface ComplianceStatusProps {
  complianceStatus: ComplianceStatus;
  complianceAlerts: ComplianceAlert[];
  onAcknowledgeAlert?: (alertId: string) => void;
  className?: string;
}

export function ComplianceStatusComponent({ 
  complianceStatus, 
  complianceAlerts, 
  onAcknowledgeAlert,
  className = '' 
}: ComplianceStatusProps) {
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getComplianceIcon = (compliant: boolean) => {
    return compliant ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getComplianceBadge = (compliant: boolean) => {
    return (
      <Badge variant={compliant ? "default" : "destructive"}>
        {compliant ? "Compliant" : "Non-Compliant"}
      </Badge>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Compliance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Risk Level */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center space-x-3">
                {getRiskLevelIcon(complianceStatus.riskLevel)}
                <div>
                  <div className="font-medium">Risk Level</div>
                  <div className="text-sm text-gray-500">Current compliance risk assessment</div>
                </div>
              </div>
              <Badge className={getRiskLevelColor(complianceStatus.riskLevel)}>
                {complianceStatus.riskLevel.toUpperCase()}
              </Badge>
            </div>

            {/* Compliance Frameworks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getComplianceIcon(complianceStatus.hipaaCompliant)}
                  <span className="font-medium">HIPAA</span>
                </div>
                {getComplianceBadge(complianceStatus.hipaaCompliant)}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getComplianceIcon(complianceStatus.fdaCompliant)}
                  <span className="font-medium">FDA</span>
                </div>
                {getComplianceBadge(complianceStatus.fdaCompliant)}
              </div>
            </div>

            {/* Medical Review Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Medical Review Required</span>
              </div>
              <Badge variant={complianceStatus.medicalReviewRequired ? "destructive" : "default"}>
                {complianceStatus.medicalReviewRequired ? "Yes" : "No"}
              </Badge>
            </div>

            {/* Audit Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Last Audit</div>
                  <div className="text-xs text-gray-500">
                    {complianceStatus.lastAuditDate.toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Next Audit</div>
                  <div className="text-xs text-gray-500">
                    {complianceStatus.nextAuditDate.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Violations */}
      {complianceStatus.violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Compliance Violations</span>
              <Badge variant="destructive">
                {complianceStatus.violations.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceStatus.violations.map((violation) => (
                <div key={violation.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge 
                          variant={
                            violation.severity === 'critical' ? 'destructive' :
                            violation.severity === 'high' ? 'destructive' :
                            violation.severity === 'medium' ? 'secondary' : 'default'
                          }
                        >
                          {violation.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">{violation.type}</span>
                        {violation.resolved && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{violation.description}</p>
                      <div className="text-xs text-gray-500">
                        Detected: {violation.detectedAt.toLocaleString()}
                      </div>
                      {violation.resolvedAt && (
                        <div className="text-xs text-gray-500">
                          Resolved: {violation.resolvedAt.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  {violation.actionRequired && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="text-sm font-medium text-yellow-800">Action Required:</div>
                      <div className="text-sm text-yellow-700">{violation.actionRequired}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Alerts */}
      {complianceAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span>Active Alerts</span>
              <Badge variant="secondary">
                {complianceAlerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceAlerts.map((alert) => (
                <div key={alert.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge 
                          variant={
                            alert.severity === 'critical' ? 'destructive' :
                            alert.severity === 'high' ? 'destructive' :
                            alert.severity === 'medium' ? 'secondary' : 'default'
                          }
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {alert.type.toUpperCase()}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                      <div className="text-xs text-gray-500">
                        {alert.timestamp.toLocaleString()}
                      </div>
                    </div>
                    {!alert.acknowledged && onAcknowledgeAlert && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                  {alert.actionRequired && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="text-sm font-medium text-blue-800">Action Required:</div>
                      <div className="text-sm text-blue-700">{alert.actionRequired}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {complianceStatus.hipaaCompliant && complianceStatus.fdaCompliant ? 2 : 
                 complianceStatus.hipaaCompliant || complianceStatus.fdaCompliant ? 1 : 0}
              </div>
              <div className="text-sm text-gray-500">Frameworks Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {complianceStatus.violations.filter(v => !v.resolved).length}
              </div>
              <div className="text-sm text-gray-500">Open Violations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {complianceAlerts.filter(a => !a.acknowledged).length}
              </div>
              <div className="text-sm text-gray-500">Active Alerts</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized compliance components
export function HIPAAComplianceCard({ compliant }: { compliant: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>HIPAA Compliance</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {compliant ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <span className="font-medium">
              {compliant ? 'Compliant' : 'Non-Compliant'}
            </span>
          </div>
          <Badge variant={compliant ? "default" : "destructive"}>
            {compliant ? "PASS" : "FAIL"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function FDAComplianceCard({ compliant }: { compliant: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>FDA Compliance</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {compliant ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <span className="font-medium">
              {compliant ? 'Compliant' : 'Non-Compliant'}
            </span>
          </div>
          <Badge variant={compliant ? "default" : "destructive"}>
            {compliant ? "PASS" : "FAIL"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
