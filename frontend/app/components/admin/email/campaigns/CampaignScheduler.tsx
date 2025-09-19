'use client';

// Campaign Scheduler Component
// Created: 2025-01-27
// Purpose: Advanced campaign scheduling with timezone support

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  Globe, 
  Repeat, 
  Settings, 
  Play, 
  Pause, 
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import type { EmailCampaign } from '@/types/email-campaigns';

interface CampaignSchedulerProps {
  campaigns: EmailCampaign[];
  onScheduleUpdate: (campaignId: string, updates: Partial<EmailCampaign>) => Promise<void>;
  onCampaignStart: (campaignId: string) => Promise<void>;
  onCampaignPause: (campaignId: string) => Promise<void>;
  onCampaignDelete: (campaignId: string) => Promise<void>;
}

interface ScheduleRule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  days_of_week: number[];
  day_of_month: number;
  time: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
}

interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

const TIMEZONES: TimezoneOption[] = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)', offset: 'UTC-7' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKST)', offset: 'UTC-9' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', offset: 'UTC-10' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)', offset: 'UTC+0' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: 'UTC+0' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: 'UTC+1' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: 'UTC+9' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: 'UTC+8' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AEST)', offset: 'UTC+10' }
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' }
];

export default function CampaignScheduler({ 
  campaigns, 
  onScheduleUpdate, 
  onCampaignStart, 
  onCampaignPause, 
  onCampaignDelete 
}: CampaignSchedulerProps) {
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<ScheduleRule>>({
    name: '',
    frequency: 'weekly',
    days_of_week: [],
    day_of_month: 1,
    time: '09:00',
    timezone: 'America/New_York',
    is_active: true
  });

  // Load schedule rules (in a real app, this would come from an API)
  useEffect(() => {
    // Mock data for demonstration
    const mockRules: ScheduleRule[] = [
      {
        id: 'rule_1',
        name: 'Weekly Newsletter',
        frequency: 'weekly',
        days_of_week: [1], // Monday
        day_of_month: 1,
        time: '09:00',
        timezone: 'America/New_York',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'rule_2',
        name: 'Appointment Reminders',
        frequency: 'daily',
        days_of_week: [1, 2, 3, 4, 5], // Weekdays
        day_of_month: 1,
        time: '08:00',
        timezone: 'America/New_York',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];
    setScheduleRules(mockRules);
  }, []);

  const handleCreateRule = async () => {
    if (!newRule.name || !selectedCampaign) return;

    const rule: ScheduleRule = {
      id: `rule_${Date.now()}`,
      name: newRule.name,
      frequency: newRule.frequency || 'weekly',
      days_of_week: newRule.days_of_week || [],
      day_of_month: newRule.day_of_month || 1,
      time: newRule.time || '09:00',
      timezone: newRule.timezone || 'America/New_York',
      is_active: newRule.is_active || true,
      created_at: new Date().toISOString()
    };

    setScheduleRules(prev => [...prev, rule]);
    
    // Update campaign with schedule
    await onScheduleUpdate(selectedCampaign.id, {
      scheduled_at: calculateNextRunTime(rule),
      send_immediately: false
    });

    setIsCreatingRule(false);
    setNewRule({
      name: '',
      frequency: 'weekly',
      days_of_week: [],
      day_of_month: 1,
      time: '09:00',
      timezone: 'America/New_York',
      is_active: true
    });
  };

  const calculateNextRunTime = (rule: ScheduleRule): string => {
    const now = new Date();
    const timezone = rule.timezone;
    const [hours, minutes] = rule.time.split(':').map(Number);
    
    // This is a simplified calculation
    // In a real implementation, you'd use a proper timezone library
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    // Add a day if the time has already passed today
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun.toISOString();
  };

  const getCampaignStatus = (campaign: EmailCampaign) => {
    if (campaign.status === 'draft') return 'Draft';
    if (campaign.status === 'scheduled') return 'Scheduled';
    if (campaign.status === 'sending') return 'Sending';
    if (campaign.status === 'sent') return 'Sent';
    if (campaign.status === 'paused') return 'Paused';
    return 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'text-blue-600';
      case 'Sending': return 'text-green-600';
      case 'Sent': return 'text-gray-600';
      case 'Paused': return 'text-yellow-600';
      case 'Draft': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getNextRunTime = (campaign: EmailCampaign) => {
    if (!campaign.scheduled_at) return 'Not scheduled';
    return new Date(campaign.scheduled_at).toLocaleString();
  };

  const handleCampaignAction = async (campaign: EmailCampaign, action: string) => {
    try {
      switch (action) {
        case 'start':
          await onCampaignStart(campaign.id);
          break;
        case 'pause':
          await onCampaignPause(campaign.id);
          break;
        case 'delete':
          await onCampaignDelete(campaign.id);
          break;
      }
    } catch (error) {
      console.error('Error performing campaign action:', error);
    }
  };

  const scheduledCampaigns = campaigns.filter(c => c.scheduled_at || c.status === 'scheduled');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campaign Scheduler</h2>
          <p className="text-gray-600">Schedule and manage automated email campaigns</p>
        </div>
        <Button onClick={() => setIsCreatingRule(true)}>
          <Calendar className="h-4 w-4 mr-2" />
          Create Schedule Rule
        </Button>
      </div>

      {/* Schedule Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scheduleRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{rule.name}</h4>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Frequency:</span> {rule.frequency} | 
                    <span className="font-medium ml-2">Time:</span> {rule.time} | 
                    <span className="font-medium ml-2">Timezone:</span> {rule.timezone}
                  </div>
                  {rule.frequency === 'weekly' && rule.days_of_week.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Days:</span> {rule.days_of_week.map(d => DAYS_OF_WEEK[d].label).join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scheduledCampaigns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No scheduled campaigns</p>
              </div>
            ) : (
              scheduledCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <Badge variant="outline">{campaign.campaign_type}</Badge>
                      <span className={`text-sm font-medium ${getStatusColor(getCampaignStatus(campaign))}`}>
                        {getCampaignStatus(campaign)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Next Run:</span> {getNextRunTime(campaign)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Recipients:</span> {campaign.recipient_count || 0}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === 'scheduled' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCampaignAction(campaign, 'start')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {campaign.status === 'sending' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCampaignAction(campaign, 'pause')}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCampaignAction(campaign, 'delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Schedule Rule Modal */}
      {isCreatingRule && (
        <Card>
          <CardHeader>
            <CardTitle>Create Schedule Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="rule_name">Rule Name *</Label>
                <Input
                  id="rule_name"
                  value={newRule.name || ''}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="Enter rule name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select
                  value={newRule.frequency}
                  onValueChange={(value) => setNewRule({ ...newRule, frequency: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newRule.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day_${day.value}`}
                        checked={newRule.days_of_week?.includes(day.value) || false}
                        onCheckedChange={(checked) => {
                          const days = newRule.days_of_week || [];
                          if (checked) {
                            setNewRule({ ...newRule, days_of_week: [...days, day.value] });
                          } else {
                            setNewRule({ ...newRule, days_of_week: days.filter(d => d !== day.value) });
                          }
                        }}
                      />
                      <Label htmlFor={`day_${day.value}`} className="text-sm">
                        {day.label.slice(0, 3)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={newRule.time || '09:00'}
                  onChange={(e) => setNewRule({ ...newRule, time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone *</Label>
                <Select
                  value={newRule.timezone}
                  onValueChange={(value) => setNewRule({ ...newRule, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label} ({tz.offset})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign</Label>
                <Select
                  value={selectedCampaign?.id || ''}
                  onValueChange={(value) => {
                    const campaign = campaigns.find(c => c.id === value);
                    setSelectedCampaign(campaign || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={newRule.is_active || false}
                onCheckedChange={(checked) => setNewRule({ ...newRule, is_active: checked as boolean })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreatingRule(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRule} disabled={!newRule.name || !selectedCampaign}>
                Create Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
