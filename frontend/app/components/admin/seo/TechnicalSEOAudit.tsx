// Technical SEO Audit Component
// Created: 2025-01-27
// Purpose: Technical SEO analysis and audit interface

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  SEOAuditResult, 
  SEOIssue, 
  SEORecommendation,
  SEOAuditRequest 
} from '@/types/seo';

interface TechnicalSEOAuditProps {
  organizationId: string;
}

export default function TechnicalSEOAudit({ organizationId }: TechnicalSEOAuditProps) {
  const [audits, setAudits] = useState<SEOAuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditUrl, setAuditUrl] = useState('');
  const [auditType, setAuditType] = useState<'technical' | 'content' | 'compliance'>('technical');
  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<SEOAuditResult | null>(null);

  useEffect(() => {
    loadAudits();
  }, [organizationId]);

  const loadAudits = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/seo/audits?organizationId=${organizationId}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to load audits');
      }

      const data = await response.json();
      setAudits(data.audits || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audits');
    } finally {
      setLoading(false);
    }
  };

  const performAudit = async () => {
    if (!auditUrl.trim()) return;

    try {
      setIsAuditing(true);
      setError(null);

      const response = await fetch('/api/admin/seo/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          pageUrl: auditUrl.trim(),
          auditType,
          includeHealthcareValidation: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to perform audit');
      }

      const data = await response.json();
      setAuditUrl('');
      loadAudits(); // Refresh the list

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform audit');
    } finally {
      setIsAuditing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading audits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Technical SEO Audit</h2>
          <p className="text-gray-600">Analyze technical SEO issues and healthcare compliance</p>
        </div>
        <div className="text-sm text-gray-500">
          {audits.length} audits performed
        </div>
      </div>

      {/* New Audit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Perform New Audit</CardTitle>
          <CardDescription>Analyze a webpage for technical SEO issues and healthcare compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="audit-url">Page URL</Label>
              <Input
                id="audit-url"
                value={auditUrl}
                onChange={(e) => setAuditUrl(e.target.value)}
                placeholder="https://example.com/page"
                onKeyPress={(e) => e.key === 'Enter' && performAudit()}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="audit-type">Audit Type</Label>
              <select
                id="audit-type"
                value={auditType}
                onChange={(e) => setAuditType(e.target.value as 'technical' | 'content' | 'compliance')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="technical">Technical SEO</option>
                <option value="content">Content Analysis</option>
                <option value="compliance">Healthcare Compliance</option>
              </select>
            </div>
            <Button 
              onClick={performAudit} 
              disabled={!auditUrl.trim() || isAuditing}
            >
              {isAuditing ? 'Auditing...' : 'Start Audit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Audits List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audits */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Audits</CardTitle>
            <CardDescription>Latest SEO audit results</CardDescription>
          </CardHeader>
          <CardContent>
            {audits.length > 0 ? (
              <div className="space-y-3">
                {audits.slice(0, 5).map((audit) => (
                  <div 
                    key={audit.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedAudit(audit)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium truncate">{audit.page_url}</span>
                        <Badge variant="outline">{audit.audit_type}</Badge>
                        <Badge 
                          className={`${getScoreColor(audit.audit_score || 0)}`}
                        >
                          {audit.audit_score}/100
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {audit.issues_found.length} issues • {audit.recommendations.length} recommendations
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(audit.audit_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Audits Performed</h3>
                <p className="text-gray-600">Start by auditing a webpage for SEO issues</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Details */}
        {selectedAudit ? (
          <Card>
            <CardHeader>
              <CardTitle>Audit Details</CardTitle>
              <CardDescription>{selectedAudit.page_url}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Audit Score */}
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`text-3xl font-bold ${getScoreColor(selectedAudit.audit_score || 0)}`}>
                    {selectedAudit.audit_score}/100
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Overall SEO Score</div>
                </div>

                {/* Healthcare Compliance */}
                <div>
                  <h4 className="font-medium mb-2">Healthcare Compliance</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>FDA Compliant:</span>
                      <Badge className={selectedAudit.healthcare_compliance.fda_compliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {selectedAudit.healthcare_compliance.fda_compliant ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>HIPAA Compliant:</span>
                      <Badge className={selectedAudit.healthcare_compliance.hipaa_compliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {selectedAudit.healthcare_compliance.hipaa_compliant ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Disclaimers:</span>
                      <Badge className={selectedAudit.healthcare_compliance.disclaimers_present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {selectedAudit.healthcare_compliance.disclaimers_present ? 'Present' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Accuracy Score:</span>
                      <span className="font-medium">{selectedAudit.healthcare_compliance.medical_accuracy_score}/100</span>
                    </div>
                  </div>
                </div>

                {/* Issues Summary */}
                <div>
                  <h4 className="font-medium mb-2">Issues Found ({selectedAudit.issues_found.length})</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedAudit.issues_found.slice(0, 3).map((issue, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                        <span className="truncate">{issue.message}</span>
                      </div>
                    ))}
                    {selectedAudit.issues_found.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{selectedAudit.issues_found.length - 3} more issues
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommendations Summary */}
                <div>
                  <h4 className="font-medium mb-2">Recommendations ({selectedAudit.recommendations.length})</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedAudit.recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority}
                        </Badge>
                        <span className="truncate">{rec.title}</span>
                      </div>
                    ))}
                    {selectedAudit.recommendations.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{selectedAudit.recommendations.length - 3} more recommendations
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Select an audit to view details</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Issues and Recommendations Modal */}
      {selectedAudit && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analysis</CardTitle>
            <CardDescription>Complete list of issues and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Issues */}
              <div>
                <h4 className="font-medium mb-3">Issues Found</h4>
                <div className="space-y-3">
                  {selectedAudit.issues_found.map((issue, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                        <span className="text-sm font-medium">{issue.type}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="text-xs text-blue-600">💡 {issue.suggestion}</p>
                      )}
                      {issue.healthcare_impact && (
                        <p className="text-xs text-green-600">🏥 {issue.healthcare_impact}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-medium mb-3">Recommendations</h4>
                <div className="space-y-3">
                  {selectedAudit.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority}
                        </Badge>
                        <span className="text-sm font-medium">{rec.category}</span>
                        {rec.healthcare_specific && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Healthcare
                          </Badge>
                        )}
                      </div>
                      <h5 className="text-sm font-medium mb-1">{rec.title}</h5>
                      <p className="text-xs text-gray-700 mb-2">{rec.description}</p>
                      <p className="text-xs text-blue-600">📋 {rec.action_required}</p>
                      <p className="text-xs text-green-600">📈 {rec.estimated_impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
