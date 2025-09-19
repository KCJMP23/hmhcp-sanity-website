// Report Scheduling Component
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
  Calendar, 
  Clock, 
  Mail, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  Edit,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { ReportSchedule, CustomReportTemplate } from '@/types/reporting';

interface ReportSchedulingProps {
  organizationId?: string;
  className?: string;
}

export function ReportScheduling({ organizationId = 'default-org', className = '' }: ReportSchedulingProps) {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [templates, setTemplates] = useState<CustomReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    template_id: '',
    schedule_name: '',
    schedule_cron: '0 9 * * 1', // Default: Every Monday at 9 AM
    stakeholder_emails: '',
    report_format: 'pdf' as 'pdf' | 'excel' | 'csv',
    delivery_method: 'email' as 'email' | 'webhook' | 'storage'
  });

  useEffect(() => {
    loadSchedules();
    loadTemplates();
  }, [organizationId]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/reports/schedule?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to load schedules');
      
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      const scheduleData = {
        ...formData,
        stakeholder_emails: formData.stakeholder_emails.split(',').map(email => email.trim()).filter(Boolean)
      };

      const response = await fetch('/api/admin/analytics/reports/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });

      if (!response.ok) throw new Error('Failed to create schedule');
      
      await loadSchedules();
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;

    try {
      setLoading(true);
      setError(null);

      const scheduleData = {
        ...formData,
        stakeholder_emails: formData.stakeholder_emails.split(',').map(email => email.trim()).filter(Boolean)
      };

      const response = await fetch('/api/admin/analytics/reports/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingSchedule.id, ...scheduleData })
      });

      if (!response.ok) throw new Error('Failed to update schedule');
      
      await loadSchedules();
      setEditingSchedule(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/reports/schedule?id=${scheduleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete schedule');
      
      await loadSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSchedule = async (schedule: ReportSchedule) => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics/reports/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: schedule.id, 
          is_active: !schedule.is_active 
        })
      });

      if (!response.ok) throw new Error('Failed to toggle schedule');
      
      await loadSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle schedule');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      template_id: '',
      schedule_name: '',
      schedule_cron: '0 9 * * 1',
      stakeholder_emails: '',
      report_format: 'pdf',
      delivery_method: 'email'
    });
  };

  const startEdit = (schedule: ReportSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      template_id: schedule.report_template_id,
      schedule_name: schedule.schedule_name,
      schedule_cron: schedule.schedule_cron,
      stakeholder_emails: schedule.stakeholder_emails.join(', '),
      report_format: schedule.report_format,
      delivery_method: schedule.delivery_method
    });
    setShowCreateForm(true);
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template?.name || 'Unknown Template';
  };

  const formatCronExpression = (cron: string) => {
    // Simple cron formatting - in production, use a proper cron parser
    const parts = cron.split(' ');
    if (parts.length === 5) {
      const [minute, hour, day, month, weekday] = parts;
      return `Every ${weekday === '*' ? 'day' : `weekday ${weekday}`} at ${hour}:${minute.padStart(2, '0')}`;
    }
    return cron;
  };

  const getNextGeneration = (cron: string) => {
    // Simple next generation calculation - in production, use a proper cron parser
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    return nextHour.toLocaleString();
  };

  if (loading && schedules.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Scheduling</h1>
        <p className="text-gray-600">Automate report generation and distribution</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template_id">Report Template</Label>
                <Select
                  value={formData.template_id}
                  onValueChange={(value) => setFormData({ ...formData, template_id: value })}
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
              <div>
                <Label htmlFor="schedule_name">Schedule Name</Label>
                <Input
                  id="schedule_name"
                  value={formData.schedule_name}
                  onChange={(e) => setFormData({ ...formData, schedule_name: e.target.value })}
                  placeholder="Enter schedule name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schedule_cron">Cron Expression</Label>
                <Input
                  id="schedule_cron"
                  value={formData.schedule_cron}
                  onChange={(e) => setFormData({ ...formData, schedule_cron: e.target.value })}
                  placeholder="0 9 * * 1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: minute hour day month weekday
                </p>
              </div>
              <div>
                <Label htmlFor="stakeholder_emails">Stakeholder Emails</Label>
                <Input
                  id="stakeholder_emails"
                  value={formData.stakeholder_emails}
                  onChange={(e) => setFormData({ ...formData, stakeholder_emails: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="report_format">Report Format</Label>
                <Select
                  value={formData.report_format}
                  onValueChange={(value: any) => setFormData({ ...formData, report_format: value })}
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

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingSchedule(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
                disabled={loading || !formData.template_id || !formData.schedule_name}
              >
                {loading ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Scheduled Reports</h2>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </div>

        {schedules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
              <p className="text-gray-500 mb-6">Create your first scheduled report to get started</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          schedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              templateName={getTemplateName(schedule.report_template_id)}
              onEdit={() => startEdit(schedule)}
              onDelete={() => handleDeleteSchedule(schedule.id)}
              onToggle={() => handleToggleSchedule(schedule)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ScheduleCardProps {
  schedule: ReportSchedule;
  templateName: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function ScheduleCard({ schedule, templateName, onEdit, onDelete, onToggle }: ScheduleCardProps) {
  const formatCronExpression = (cron: string) => {
    const parts = cron.split(' ');
    if (parts.length === 5) {
      const [minute, hour, day, month, weekday] = parts;
      return `Every ${weekday === '*' ? 'day' : `weekday ${weekday}`} at ${hour}:${minute.padStart(2, '0')}`;
    }
    return cron;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold">{schedule.schedule_name}</h3>
              <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                {schedule.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{formatCronExpression(schedule.schedule_cron)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>{templateName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{schedule.stakeholder_emails.length} recipients</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{schedule.report_format.toUpperCase()}</span>
              </div>
            </div>

            {schedule.last_generated_at && (
              <div className="mt-2 text-sm text-gray-500">
                Last generated: {new Date(schedule.last_generated_at).toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              {schedule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
