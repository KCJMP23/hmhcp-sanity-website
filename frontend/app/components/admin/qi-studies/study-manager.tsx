'use client';

// QI Study Manager Component
// Story 4.4: Quality Improvement Studies Tracking

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  QualityImprovementStudy, 
  QIStudyFilters,
  QIStudyListResponse 
} from '@/types/qi-studies';

interface StudyManagerProps {
  organizationId: string;
  className?: string;
}

export function StudyManager({ organizationId, className }: StudyManagerProps) {
  const [studies, setStudies] = useState<QualityImprovementStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<QIStudyFilters>({
    organization_id: organizationId,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total_pages: 0,
    total_count: 0,
  });

  useEffect(() => {
    fetchStudies();
  }, [filters, pagination.page]);

  const fetchStudies = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      queryParams.append('page', pagination.page.toString());
      queryParams.append('page_size', pagination.page_size.toString());

      const response = await fetch(`/api/admin/qi-studies?${queryParams}`);
      if (response.ok) {
        const data: QIStudyListResponse = await response.json();
        setStudies(data.studies);
        setPagination(prev => ({
          ...prev,
          total_pages: data.total_pages,
          total_count: data.total_count,
        }));
      } else {
        setError('Failed to fetch QI studies');
      }
    } catch (err) {
      console.error('Error fetching QI studies:', err);
      setError('Failed to load QI studies');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof QIStudyFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'implementation': return 'bg-blue-100 text-blue-800';
      case 'analysis': return 'bg-yellow-100 text-yellow-800';
      case 'reporting': return 'bg-purple-100 text-purple-800';
      case 'design': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter QI Studies</CardTitle>
          <CardDescription>Search and filter quality improvement studies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select 
                value={filters.status || ''} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="implementation">Implementation</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="reporting">Reporting</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Study Type</label>
              <Select 
                value={filters.study_type || ''} 
                onValueChange={(value) => handleFilterChange('study_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="process_improvement">Process Improvement</SelectItem>
                  <SelectItem value="patient_safety">Patient Safety</SelectItem>
                  <SelectItem value="clinical_outcome">Clinical Outcome</SelectItem>
                  <SelectItem value="cost_reduction">Cost Reduction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Healthcare Specialty</label>
              <Input
                placeholder="e.g., Cardiology"
                value={filters.healthcare_specialty || ''}
                onChange={(e) => handleFilterChange('healthcare_specialty', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Compliance Level</label>
              <Select 
                value={filters.compliance_level || ''} 
                onValueChange={(value) => handleFilterChange('compliance_level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All levels</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="enhanced">Enhanced</SelectItem>
                  <SelectItem value="expert_review">Expert Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Studies List */}
      <Card>
        <CardHeader>
          <CardTitle>QI Studies ({pagination.total_count})</CardTitle>
          <CardDescription>Quality improvement studies and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchStudies} variant="outline">
                Retry
              </Button>
            </div>
          ) : studies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No QI studies found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {studies.map((study) => (
                <div key={study.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{study.title}</h3>
                      {study.description && (
                        <p className="text-muted-foreground mt-1">{study.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                        <span className="capitalize">
                          {study.study_type.replace('_', ' ')}
                        </span>
                        {study.healthcare_specialty && (
                          <span>• {study.healthcare_specialty}</span>
                        )}
                        {study.start_date && (
                          <span>• Started {formatDate(study.start_date)}</span>
                        )}
                        {study.target_completion_date && (
                          <span>• Due {formatDate(study.target_completion_date)}</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getStatusColor(study.status)}>
                          {study.status}
                        </Badge>
                        <Badge variant="outline">
                          {study.compliance_level}
                        </Badge>
                        {study.regulatory_framework && (
                          <Badge variant="outline">
                            {study.regulatory_framework.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {study.budget_allocated && (
                        <p className="font-medium">
                          {formatCurrency(study.budget_allocated)}
                        </p>
                      )}
                      {study.actual_cost && (
                        <p className="text-sm text-muted-foreground">
                          Actual: {formatCurrency(study.actual_cost)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.page_size) + 1} to{' '}
                {Math.min(pagination.page * pagination.page_size, pagination.total_count)} of{' '}
                {pagination.total_count} studies
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
