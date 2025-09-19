'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface ComplianceStatusProps {
  hipaaCompliance: number;
  dataAnonymization: number;
  auditLogging: number;
  userConsent: number;
  overallScore: number;
  lastAudit: string;
  violations: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    detectedAt: string;
  }>;
  loading?: boolean;
}

export function ComplianceStatus({ 
  hipaaCompliance, 
  dataAnonymization, 
  auditLogging, 
  userConsent, 
  overallScore, 
  lastAudit,
  violations,
  loading = false 
}: ComplianceStatusProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-3 w-3" />;
      case 'high': return <AlertTriangle className="h-3 w-3" />;
      case 'medium': return <AlertTriangle className="h-3 w-3" />;
      case 'low': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-gray-200 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={overallScore >= 90 ? 'border-green-200 bg-green-50' : overallScore >= 70 ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Healthcare Compliance
          {getScoreIcon(overallScore)}
        </CardTitle>
        <p className="text-xs text-gray-600">
          Last audit: {new Date(lastAudit).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Score */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Score</span>
            <span className={`text-lg font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </span>
          </div>

          {/* Individual Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>HIPAA Compliance</span>
              <span className={getScoreColor(hipaaCompliance)}>{hipaaCompliance}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Data Anonymization</span>
              <span className={getScoreColor(dataAnonymization)}>{dataAnonymization}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Audit Logging</span>
              <span className={getScoreColor(auditLogging)}>{auditLogging}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>User Consent</span>
              <span className={getScoreColor(userConsent)}>{userConsent}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                overallScore >= 90 ? 'bg-green-500' : 
                overallScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${overallScore}%` }}
            />
          </div>

          {/* Violations */}
          {violations.length > 0 && (
            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Active Violations</h4>
              <div className="space-y-2">
                {violations.slice(0, 3).map((violation, index) => (
                  <div 
                    key={index}
                    className={`p-2 rounded border text-xs ${getSeverityColor(violation.severity)}`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {getSeverityIcon(violation.severity)}
                      <span className="font-medium capitalize">{violation.severity}</span>
                    </div>
                    <p className="text-xs">{violation.description}</p>
                    <p className="text-xs opacity-75 mt-1">
                      Detected: {new Date(violation.detectedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {violations.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{violations.length - 3} more violations
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Compliance Status */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                overallScore >= 90 ? 'bg-green-500' : 
                overallScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-xs font-medium">
                {overallScore >= 90 ? 'Fully Compliant' : 
                 overallScore >= 70 ? 'Needs Attention' : 'Non-Compliant'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              HIPAA & HITRUST standards maintained
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ComplianceOverviewProps {
  complianceData: ComplianceStatusProps | null;
  loading?: boolean;
  error?: string;
}

export function ComplianceOverview({ complianceData, loading, error }: ComplianceOverviewProps) {
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <XCircle className="h-5 w-5" />
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600">
            <XCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">Unable to load compliance data</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!complianceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Healthcare Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            <Shield className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">No compliance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <ComplianceStatus {...complianceData} loading={loading} />;
}
