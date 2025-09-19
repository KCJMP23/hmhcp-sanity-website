'use client';

// QI Study Compliance Monitor Component
// Story 4.4: Quality Improvement Studies Tracking

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RegulatoryComplianceTracking } from '@/types/qi-studies';

interface ComplianceMonitorProps {
  studyId: string;
  className?: string;
}

export function ComplianceMonitor({ studyId, className }: ComplianceMonitorProps) {
  const [complianceRecords, setComplianceRecords] = useState<RegulatoryComplianceTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompliance, setNewCompliance] = useState({
    compliance_framework: '',
    requirement_description: '',
    compliance_status: 'pending',
    evidence_documentation: {},
    review_date: '',
    next_review_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchComplianceRecords();
  }, [studyId]);

  const fetchComplianceRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/qi-compliance?study_id=${studyId}`);
      if (response.ok) {
        const data = await response.json();
        setComplianceRecords(data);
      } else {
        setError('Failed to fetch compliance records');
      }
    } catch (err) {
      console.error('Error fetching compliance records:', err);
      setError('Failed to load compliance records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompliance = async () => {
    try {
      const response = await fetch('/api/admin/qi-compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          study_id: studyId,
          ...newCompliance,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComplianceRecords(prev => [data, ...prev]);
        setNewCompliance({
          compliance_framework: '',
          requirement_description: '',
          compliance_status: 'pending',
          evidence_documentation: {},
          review_date: '',
          next_review_date: '',
          notes: '',
        });
        setShowAddForm(false);
      } else {
        setError('Failed to add compliance record');
      }
    } catch (err) {
      console.error('Error adding compliance record:', err);
      setError('Failed to add compliance record');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrameworkColor = (framework: string) => {
    switch (framework) {
      case 'hipaa': return 'bg-blue-100 text-blue-800';
      case 'fda': return 'bg-purple-100 text-purple-800';
      case 'joint_commission': return 'bg-green-100 text-green-800';
      case 'cms': return 'bg-orange-100 text-orange-800';
      case 'state_regulations': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (nextReviewDate: string) => {
    return new Date(nextReviewDate) < new Date();
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Regulatory Compliance</h2>
          <p className="text-muted-foreground">Track compliance with healthcare regulations</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          Add Compliance Record
        </Button>
      </div>

      {/* Add Compliance Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Compliance Record</CardTitle>
            <CardDescription>Track regulatory compliance requirements for the QI study</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="compliance_framework">Compliance Framework *</Label>
                <Select 
                  value={newCompliance.compliance_framework} 
                  onValueChange={(value) => setNewCompliance(prev => ({ ...prev, compliance_framework: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hipaa">HIPAA</SelectItem>
                    <SelectItem value="fda">FDA</SelectItem>
                    <SelectItem value="joint_commission">Joint Commission</SelectItem>
                    <SelectItem value="cms">CMS</SelectItem>
                    <SelectItem value="state_regulations">State Regulations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="compliance_status">Compliance Status</Label>
                <Select 
                  value={newCompliance.compliance_status} 
                  onValueChange={(value) => setNewCompliance(prev => ({ ...prev, compliance_status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="requirement_description">Requirement Description</Label>
                <Input
                  id="requirement_description"
                  value={newCompliance.requirement_description}
                  onChange={(e) => setNewCompliance(prev => ({ ...prev, requirement_description: e.target.value }))}
                  placeholder="Describe the compliance requirement"
                />
              </div>

              <div>
                <Label htmlFor="review_date">Review Date</Label>
                <Input
                  id="review_date"
                  type="date"
                  value={newCompliance.review_date}
                  onChange={(e) => setNewCompliance(prev => ({ ...prev, review_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="next_review_date">Next Review Date</Label>
                <Input
                  id="next_review_date"
                  type="date"
                  value={newCompliance.next_review_date}
                  onChange={(e) => setNewCompliance(prev => ({ ...prev, next_review_date: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={newCompliance.notes}
                  onChange={(e) => setNewCompliance(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional compliance notes"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddCompliance}
                disabled={!newCompliance.compliance_framework}
              >
                Add Compliance Record
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Records ({complianceRecords.length})</CardTitle>
          <CardDescription>Regulatory compliance tracking and status</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchComplianceRecords} variant="outline">
                Retry
              </Button>
            </div>
          ) : complianceRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No compliance records added yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complianceRecords.map((record) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {record.compliance_framework.toUpperCase()} Compliance
                      </h4>
                      {record.requirement_description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {record.requirement_description}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getFrameworkColor(record.compliance_framework)}>
                        {record.compliance_framework.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(record.compliance_status)}>
                        {record.compliance_status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {record.review_date && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Last Review</Label>
                        <p className="font-medium">{formatDate(record.review_date)}</p>
                      </div>
                    )}

                    {record.next_review_date && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Next Review</Label>
                        <div className="flex items-center space-x-2">
                          <p className={`font-medium ${isOverdue(record.next_review_date) ? 'text-red-600' : ''}`}>
                            {formatDate(record.next_review_date)}
                          </p>
                          {isOverdue(record.next_review_date) && (
                            <Badge className="bg-red-100 text-red-800">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {record.evidence_documentation && Object.keys(record.evidence_documentation).length > 0 && (
                    <div className="mt-3">
                      <Label className="text-xs text-muted-foreground">Evidence Documentation</Label>
                      <div className="mt-1 text-sm">
                        {Object.entries(record.evidence_documentation).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {record.notes && (
                    <div className="mt-3">
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <p className="text-sm">{record.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
