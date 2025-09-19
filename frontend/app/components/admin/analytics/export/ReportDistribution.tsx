// Report Distribution Component
// Story: 4.6 - Advanced Reporting & Business Intelligence

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Mail, 
  Share2, 
  Cloud, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  FileText,
  Table,
  BarChart3
} from 'lucide-react';
import type { 
  CustomReportTemplate, 
  ReportGenerationLog,
  ReportGenerationResponse 
} from '@/types/reporting';

interface ReportDistributionProps {
  templateId?: string;
  organizationId?: string;
  className?: string;
}

export function ReportDistribution({ 
  templateId, 
  organizationId = 'default-org', 
  className = '' 
}: ReportDistributionProps) {
  const [templates, setTemplates] = useState<CustomReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CustomReportTemplate | null>(null);
  const [generationLogs, setGenerationLogs] = useState<ReportGenerationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    template_id: templateId || '',
    format: 'pdf' as 'pdf' | 'excel' | 'csv',
    stakeholder_emails: '',
    webhook_url: '',
    delivery_method: 'email' as 'email' | 'webhook' | 'storage',
    include_ai_insights: true,
    filters: ''
  });

  useEffect(() => {
    loadTemplates();
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  useEffect(() => {
    if (selectedTemplate) {
      loadGenerationLogs();
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/reports/templates?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to load templates');
      
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const loadTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/analytics/reports/templates?id=${id}`);
      if (!response.ok) throw new Error('Failed to load template');
      
      const data = await response.json();
      setSelectedTemplate(data.template);
      setFormData(prev => ({ ...prev, template_id: id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    }
  };

  const loadGenerationLogs = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/reports/custom?organizationId=${organizationId}&templateId=${selectedTemplate?.id}`);
      if (!response.ok) throw new Error('Failed to load generation logs');
      
      const data = await response.json();
      setGenerationLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load generation logs:', err);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/analytics/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          format: formData.format,
          filters: formData.filters ? JSON.parse(formData.filters) : undefined,
          include_ai_insights: formData.include_ai_insights
        })
      });

      if (!response.ok) throw new Error('Failed to generate report');
      
      const reportData = await response.arrayBuffer();
      const blob = new Blob([reportData], { 
        type: getMimeType(formData.format) 
      });
      
      // Download the report
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate.name}.${formData.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      await loadGenerationLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeReport = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/analytics/reports/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_report',
          template_id: selectedTemplate.id,
          format: formData.format,
          include_ai_insights: formData.include_ai_insights,
          stakeholder_emails: formData.stakeholder_emails.split(',').map(email => email.trim()).filter(Boolean),
          delivery_method: formData.delivery_method,
          webhook_url: formData.webhook_url
        })
      });

      if (!response.ok) throw new Error('Failed to distribute report');
      
      const data = await response.json();
      await loadGenerationLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to distribute report');
    } finally {
      setLoading(false);
    }
  };

  const getMimeType = (format: string) => {
    switch (format) {
      case 'pdf': return 'application/pdf';
      case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv': return 'text/csv';
      default: return 'application/octet-stream';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'excel': return <Table className="h-4 w-4" />;
      case 'csv': return <BarChart3 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'generating': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Distribution</h1>
        <p className="text-gray-600">Generate and distribute healthcare reports in multiple formats</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template_id">Report Template</Label>
              <Select
                value={formData.template_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, template_id: value });
                  loadTemplate(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="format">Format</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value: any) => setFormData({ ...formData, format: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="delivery_method">Delivery Method</Label>
                <Select
                  value={formData.delivery_method}
                  onValueChange={(value: any) => setFormData({ ...formData, delivery_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.delivery_method === 'email' && (
              <div>
                <Label htmlFor="stakeholder_emails">Stakeholder Emails</Label>
                <Input
                  id="stakeholder_emails"
                  value={formData.stakeholder_emails}
                  onChange={(e) => setFormData({ ...formData, stakeholder_emails: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
            )}

            {formData.delivery_method === 'webhook' && (
              <div>
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  placeholder="https://example.com/webhook"
                />
              </div>
            )}

            <div>
              <Label htmlFor="filters">Filters (JSON)</Label>
              <Textarea
                id="filters"
                value={formData.filters}
                onChange={(e) => setFormData({ ...formData, filters: e.target.value })}
                placeholder='{"date_range": {"start": "2024-01-01", "end": "2024-01-31"}}'
                rows={3}
              />
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={handleGenerateReport}
                disabled={loading || !selectedTemplate}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                {loading ? 'Generating...' : 'Download Report'}
              </Button>
              <Button
                onClick={handleDistributeReport}
                disabled={loading || !selectedTemplate}
                variant="outline"
                className="flex-1"
              >
                {formData.delivery_method === 'email' && <Mail className="h-4 w-4 mr-2" />}
                {formData.delivery_method === 'webhook' && <Share2 className="h-4 w-4 mr-2" />}
                {formData.delivery_method === 'storage' && <Cloud className="h-4 w-4 mr-2" />}
                {loading ? 'Distributing...' : 'Distribute Report'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generation History */}
        <Card>
          <CardHeader>
            <CardTitle>Generation History</CardTitle>
          </CardHeader>
          <CardContent>
            {generationLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No reports generated yet</p>
                <p className="text-sm">Generate your first report to see history</p>
              </div>
            ) : (
              <div className="space-y-4">
                {generationLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(log.generation_status)}
                        <span className="font-medium">
                          {selectedTemplate?.name || 'Report'}
                        </span>
                        <Badge variant="outline">
                          {log.generation_status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getFormatIcon('pdf')}
                        <span className="text-sm text-gray-500">
                          {log.generation_time_ms ? `${log.generation_time_ms}ms` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Generated: {new Date(log.generated_at).toLocaleString()}
                    </div>
                    {log.error_message && (
                      <div className="text-sm text-red-600 mt-1">
                        Error: {log.error_message}
                      </div>
                    )}
                    {log.file_path && (
                      <div className="text-sm text-blue-600 mt-1">
                        File: {log.file_path}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
