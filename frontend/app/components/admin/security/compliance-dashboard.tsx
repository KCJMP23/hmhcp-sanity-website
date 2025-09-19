'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  FileText,
  Clock,
  Users,
  Lock
} from 'lucide-react';

interface ComplianceMetric {
  id: string;
  name: string;
  status: 'compliant' | 'warning' | 'non-compliant';
  score: number;
  description: string;
  lastChecked: string;
}

interface ComplianceReport {
  overall_score: number;
  metrics: ComplianceMetric[];
  recommendations: string[];
  last_audit: string;
}

export default function ComplianceDashboard() {
  const [complianceData, setComplianceData] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComplianceData = async () => {
      try {
        // Mock data for now - in production, this would fetch from an API
        const mockData: ComplianceReport = {
          overall_score: 85,
          last_audit: new Date().toISOString(),
          metrics: [
            {
              id: 'hipaa',
              name: 'HIPAA Compliance',
              status: 'compliant',
              score: 95,
              description: 'Health Insurance Portability and Accountability Act compliance',
              lastChecked: new Date().toISOString()
            },
            {
              id: 'gdpr',
              name: 'GDPR Compliance',
              status: 'compliant',
              score: 88,
              description: 'General Data Protection Regulation compliance',
              lastChecked: new Date().toISOString()
            },
            {
              id: 'security_headers',
              name: 'Security Headers',
              status: 'warning',
              score: 75,
              description: 'HTTP security headers implementation',
              lastChecked: new Date().toISOString()
            },
            {
              id: 'encryption',
              name: 'Data Encryption',
              status: 'compliant',
              score: 92,
              description: 'Data encryption at rest and in transit',
              lastChecked: new Date().toISOString()
            },
            {
              id: 'access_control',
              name: 'Access Control',
              status: 'compliant',
              score: 90,
              description: 'Role-based access control implementation',
              lastChecked: new Date().toISOString()
            },
            {
              id: 'audit_logging',
              name: 'Audit Logging',
              status: 'warning',
              score: 70,
              description: 'Comprehensive audit trail maintenance',
              lastChecked: new Date().toISOString()
            }
          ],
          recommendations: [
            'Strengthen Content Security Policy headers',
            'Implement additional audit logging for user actions',
            'Review and update data retention policies',
            'Conduct quarterly security assessments'
          ]
        };

        setComplianceData(mockData);
      } catch (err) {
        setError('Failed to load compliance data');
      } finally {
        setLoading(false);
      }
    };

    fetchComplianceData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'non-compliant':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'non-compliant':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!complianceData) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No compliance data available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor regulatory compliance and security standards
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <div className="text-right">
            <div className="text-2xl font-bold">{complianceData.overall_score}%</div>
            <div className="text-sm text-muted-foreground">Overall Score</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Metrics</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceData.metrics.length}</div>
            <p className="text-xs text-muted-foreground">
              Compliance standards monitored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceData.metrics.filter(m => m.status === 'compliant').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Standards meeting requirements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceData.metrics.filter(m => m.status === 'warning').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Standards requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceData.metrics.map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(metric.status)}
                    <div>
                      <div className="font-medium">{metric.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {metric.description}
                      </div>
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        Last checked: {new Date(metric.lastChecked).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="font-bold">{metric.score}%</div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceData.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-muted rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">{recommendation}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Lock className="h-4 w-4 text-blue-600" />
                <div className="font-medium text-blue-900">Last Audit</div>
              </div>
              <div className="text-sm text-blue-700">
                {new Date(complianceData.last_audit).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}