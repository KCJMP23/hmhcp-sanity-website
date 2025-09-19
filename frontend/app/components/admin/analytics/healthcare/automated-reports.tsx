'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Settings
} from 'lucide-react';
import { 
  AnalyticsAPIResponse, 
  ClinicalEngagementMetrics, 
  ComplianceStatus,
  IndustryBenchmarking 
} from '@/types/analytics';

interface AutomatedReport {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  status: 'scheduled' | 'generating' | 'completed' | 'failed';
  lastGenerated?: Date;
  nextScheduled?: Date;
  complianceLevel: 'standard' | 'enhanced' | 'expert_review';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  sections: ReportSection[];
  createdAt: Date;
  updatedAt: Date;
}

interface ReportSection {
  id: string;
  name: string;
  type: 'clinical_engagement' | 'content_performance' | 'compliance' | 'predictive' | 'benchmarking';
  enabled: boolean;
  order: number;
}

interface AutomatedReportsProps {
  organizationId: string;
  className?: string;
}

export function AutomatedReports({ organizationId, className = '' }: AutomatedReportsProps) {
  const [reports, setReports] = useState<AutomatedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [organizationId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Mock data - would fetch from API
      const mockReports: AutomatedReport[] = [
        {
          id: 'report-1',
          name: 'Daily Healthcare Analytics Summary',
          type: 'daily',
          status: 'scheduled',
          lastGenerated: new Date('2024-01-03T08:00:00Z'),
          nextScheduled: new Date('2024-01-05T08:00:00Z'),
          complianceLevel: 'standard',
          recipients: ['admin@healthcare.com', 'analytics@healthcare.com'],
          format: 'pdf',
          sections: [
            { id: 'clinical', name: 'Clinical Engagement', type: 'clinical_engagement', enabled: true, order: 1 },
            { id: 'content', name: 'Content Performance', type: 'content_performance', enabled: true, order: 2 },
            { id: 'compliance', name: 'Compliance Status', type: 'compliance', enabled: true, order: 3 }
          ],
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-04T10:00:00Z')
        },
        {
          id: 'report-2',
          name: 'Weekly Executive Summary',
          type: 'weekly',
          status: 'completed',
          lastGenerated: new Date('2024-01-01T09:00:00Z'),
          nextScheduled: new Date('2024-01-08T09:00:00Z'),
          complianceLevel: 'enhanced',
          recipients: ['ceo@healthcare.com', 'cmo@healthcare.com'],
          format: 'excel',
          sections: [
            { id: 'clinical', name: 'Clinical Engagement', type: 'clinical_engagement', enabled: true, order: 1 },
            { id: 'predictive', name: 'Predictive Analytics', type: 'predictive', enabled: true, order: 2 },
            { id: 'benchmarking', name: 'Industry Benchmarking', type: 'benchmarking', enabled: true, order: 3 }
          ],
          createdAt: new Date('2023-12-15T00:00:00Z'),
          updatedAt: new Date('2024-01-01T09:00:00Z')
        },
        {
          id: 'report-3',
          name: 'Monthly Compliance Report',
          type: 'monthly',
          status: 'generating',
          lastGenerated: new Date('2023-12-01T10:00:00Z'),
          nextScheduled: new Date('2024-02-01T10:00:00Z'),
          complianceLevel: 'expert_review',
          recipients: ['compliance@healthcare.com', 'legal@healthcare.com'],
          format: 'pdf',
          sections: [
            { id: 'compliance', name: 'Compliance Status', type: 'compliance', enabled: true, order: 1 },
            { id: 'clinical', name: 'Clinical Engagement', type: 'clinical_engagement', enabled: true, order: 2 }
          ],
          createdAt: new Date('2023-11-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z')
        }
      ];
      
      setReports(mockReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportId: string) => {
    try {
      setGenerating(reportId);
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update report status
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: 'completed', lastGenerated: new Date() }
          : report
      ));
    } catch (error) {
      console.error('Error generating report:', error);
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: 'failed' }
          : report
      ));
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      // Mock download - would generate actual report
      const report = reports.find(r => r.id === reportId);
      if (report) {
        const blob = new Blob(['Mock report content'], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.name}.${report.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceLevelColor = (level: string) => {
    switch (level) {
      case 'expert_review':
        return 'bg-red-100 text-red-800';
      case 'enhanced':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading automated reports...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Automated Reports</h2>
          <p className="text-gray-600">Healthcare compliance-focused automated reporting</p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Configure Reports
        </Button>
      </div>

      {/* Reports List */}
      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">{report.name}</h3>
                    <Badge className={getStatusColor(report.status)}>
                      {getStatusIcon(report.status)}
                      <span className="ml-1 capitalize">{report.status}</span>
                    </Badge>
                    <Badge className={getComplianceLevelColor(report.complianceLevel)}>
                      {report.complianceLevel.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Type</div>
                      <div className="font-medium capitalize">{report.type}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Format</div>
                      <div className="font-medium uppercase">{report.format}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Recipients</div>
                      <div className="font-medium">{report.recipients.length} recipients</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Last Generated</div>
                      <div className="font-medium">
                        {report.lastGenerated 
                          ? report.lastGenerated.toLocaleString()
                          : 'Never'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Next Scheduled</div>
                      <div className="font-medium">
                        {report.nextScheduled?.toLocaleString() || 'Not scheduled'}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-2">Report Sections</div>
                    <div className="flex flex-wrap gap-2">
                      {report.sections.filter(s => s.enabled).map((section) => (
                        <Badge key={section.id} variant="outline">
                          {section.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  {report.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(report.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                  
                  {report.status === 'scheduled' && (
                    <Button
                      size="sm"
                      onClick={() => generateReport(report.id)}
                      disabled={generating === report.id}
                    >
                      {generating === report.id ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      Generate Now
                    </Button>
                  )}

                  {report.status === 'generating' && (
                    <Button
                      size="sm"
                      disabled
                    >
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </Button>
                  )}

                  {report.status === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateReport(report.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {reports.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Automated Reports</h3>
            <p className="text-gray-600 mb-4">
              Create your first automated report to start generating healthcare analytics summaries.
            </p>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Report Generation Service
export class ReportGenerationService {
  static async generateReport(
    reportId: string, 
    organizationId: string, 
    sections: ReportSection[]
  ): Promise<{ success: boolean; reportUrl?: string; error?: string }> {
    try {
      // Collect data for each section
      const reportData: any = {};
      
      for (const section of sections) {
        if (!section.enabled) continue;
        
        switch (section.type) {
          case 'clinical_engagement':
            reportData.clinicalEngagement = await this.fetchClinicalEngagementData(organizationId);
            break;
          case 'content_performance':
            reportData.contentPerformance = await this.fetchContentPerformanceData(organizationId);
            break;
          case 'compliance':
            reportData.compliance = await this.fetchComplianceData(organizationId);
            break;
          case 'predictive':
            reportData.predictive = await this.fetchPredictiveData(organizationId);
            break;
          case 'benchmarking':
            reportData.benchmarking = await this.fetchBenchmarkingData(organizationId);
            break;
        }
      }

      // Generate report based on format
      const reportUrl = await this.generateReportFile(reportData, reportId);
      
      return { success: true, reportUrl };
    } catch (error) {
      console.error('Error generating report:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private static async fetchClinicalEngagementData(organizationId: string) {
    // Mock implementation - would fetch from API
    return {
      totalProfessionals: 150,
      activeProfessionals: 120,
      averageSessionDuration: 25,
      contentInteractions: 450
    };
  }

  private static async fetchContentPerformanceData(organizationId: string) {
    // Mock implementation
    return {
      totalViews: 2500,
      engagementRate: 0.75,
      topContent: ['Clinical Study A', 'Publication B', 'Case Study C']
    };
  }

  private static async fetchComplianceData(organizationId: string) {
    // Mock implementation
    return {
      hipaaCompliant: true,
      fdaCompliant: true,
      riskLevel: 'low',
      violations: []
    };
  }

  private static async fetchPredictiveData(organizationId: string) {
    // Mock implementation
    return {
      engagementForecast: 0.85,
      professionalInteractionPrediction: 200,
      patientInquiryForecast: 50
    };
  }

  private static async fetchBenchmarkingData(organizationId: string) {
    // Mock implementation
    return {
      industryAverage: 0.72,
      ourPerformance: 0.85,
      percentile: 78
    };
  }

  private static async generateReportFile(data: any, reportId: string): Promise<string> {
    // Mock implementation - would generate actual PDF/Excel/CSV
    return `/reports/${reportId}-${Date.now()}.pdf`;
  }
}
