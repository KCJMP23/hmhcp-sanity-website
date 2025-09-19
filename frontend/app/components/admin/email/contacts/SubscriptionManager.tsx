'use client';

// Subscription Manager Component
// Created: 2025-01-27
// Purpose: Contact subscription preference management with compliance tracking

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Users, 
  Mail, 
  Bell, 
  BookOpen, 
  Heart, 
  Shield,
  Search,
  Filter,
  Save,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import type { EmailContact, SubscriptionPreferences } from '@/types/email-campaigns';

interface SubscriptionManagerProps {
  contacts: EmailContact[];
  onContactUpdate: (contactId: string, updates: Partial<EmailContact>) => void;
  onBulkUpdate: (contactIds: string[], updates: Partial<EmailContact>) => void;
}

interface SubscriptionStats {
  total_contacts: number;
  newsletter_subscribers: number;
  appointment_reminder_subscribers: number;
  educational_content_subscribers: number;
  promotional_content_subscribers: number;
  compliance_notification_subscribers: number;
  frequency_distribution: Record<string, number>;
  format_distribution: Record<string, number>;
}

const SUBSCRIPTION_TYPES = [
  {
    key: 'newsletter',
    label: 'Newsletter',
    description: 'Monthly healthcare updates and news',
    icon: <Mail className="h-4 w-4" />,
    default: true
  },
  {
    key: 'appointment_reminders',
    label: 'Appointment Reminders',
    description: 'Patient appointment confirmations and reminders',
    icon: <Bell className="h-4 w-4" />,
    default: false
  },
  {
    key: 'educational_content',
    label: 'Educational Content',
    description: 'Medical education and continuing education materials',
    icon: <BookOpen className="h-4 w-4" />,
    default: true
  },
  {
    key: 'promotional_content',
    label: 'Promotional Content',
    description: 'Service announcements and promotional offers',
    icon: <Heart className="h-4 w-4" />,
    default: false
  },
  {
    key: 'compliance_notifications',
    label: 'Compliance Notifications',
    description: 'HIPAA and regulatory compliance updates',
    icon: <Shield className="h-4 w-4" />,
    default: true
  }
];

const FREQUENCY_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
];

const FORMAT_OPTIONS = [
  { value: 'html', label: 'HTML' },
  { value: 'text', label: 'Text' }
];

export default function SubscriptionManager({ 
  contacts, 
  onContactUpdate, 
  onBulkUpdate 
}: SubscriptionManagerProps) {
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'bulk'>('overview');
  const [isUpdating, setIsUpdating] = useState(false);

  // Calculate stats when contacts change
  useEffect(() => {
    calculateStats();
  }, [contacts]);

  const calculateStats = () => {
    const stats: SubscriptionStats = {
      total_contacts: contacts.length,
      newsletter_subscribers: 0,
      appointment_reminder_subscribers: 0,
      educational_content_subscribers: 0,
      promotional_content_subscribers: 0,
      compliance_notification_subscribers: 0,
      frequency_distribution: {},
      format_distribution: {}
    };

    contacts.forEach(contact => {
      const prefs = contact.subscription_preferences;
      
      if (prefs.newsletter) stats.newsletter_subscribers++;
      if (prefs.appointment_reminders) stats.appointment_reminder_subscribers++;
      if (prefs.educational_content) stats.educational_content_subscribers++;
      if (prefs.promotional_content) stats.promotional_content_subscribers++;
      if (prefs.compliance_notifications) stats.compliance_notification_subscribers++;

      stats.frequency_distribution[prefs.frequency] = 
        (stats.frequency_distribution[prefs.frequency] || 0) + 1;
      stats.format_distribution[prefs.preferred_format] = 
        (stats.format_distribution[prefs.preferred_format] || 0) + 1;
    });

    setSubscriptionStats(stats);
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.healthcare_specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    
    const prefs = contact.subscription_preferences;
    switch (filterType) {
      case 'newsletter':
        return matchesSearch && prefs.newsletter;
      case 'appointment_reminders':
        return matchesSearch && prefs.appointment_reminders;
      case 'educational_content':
        return matchesSearch && prefs.educational_content;
      case 'promotional_content':
        return matchesSearch && prefs.promotional_content;
      case 'compliance_notifications':
        return matchesSearch && prefs.compliance_notifications;
      default:
        return matchesSearch;
    }
  });

  const handleContactUpdate = async (contactId: string, updates: Partial<SubscriptionPreferences>) => {
    setIsUpdating(true);
    try {
      onContactUpdate(contactId, {
        subscription_preferences: updates
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkUpdate = async (updates: Partial<SubscriptionPreferences>) => {
    if (selectedContacts.size === 0) return;

    setIsUpdating(true);
    try {
      const contactIds = Array.from(selectedContacts);
      onBulkUpdate(contactIds, {
        subscription_preferences: updates
      });
      setSelectedContacts(new Set());
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelection = new Set(selectedContacts);
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId);
    } else {
      newSelection.add(contactId);
    }
    setSelectedContacts(newSelection);
  };

  const selectAllContacts = () => {
    setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
  };

  const clearSelection = () => {
    setSelectedContacts(new Set());
  };

  const getSubscriptionPercentage = (count: number) => {
    return subscriptionStats ? Math.round((count / subscriptionStats.total_contacts) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subscription Management</h2>
          <p className="text-gray-600">Manage contact subscription preferences and compliance</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {contacts.length} contacts
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {subscriptionStats && (
            <>
              {/* Subscription Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SUBSCRIPTION_TYPES.map((type) => {
                  const count = subscriptionStats[`${type.key}_subscribers` as keyof SubscriptionStats] as number;
                  const percentage = getSubscriptionPercentage(count);
                  
                  return (
                    <Card key={type.key}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {type.icon}
                            <h3 className="font-medium">{type.label}</h3>
                          </div>
                          <Badge variant="outline">{percentage}%</Badge>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Frequency and Format Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Frequency Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {FREQUENCY_OPTIONS.map((option) => {
                        const count = subscriptionStats.frequency_distribution[option.value] || 0;
                        const percentage = getSubscriptionPercentage(count);
                        
                        return (
                          <div key={option.value} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{option.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Format Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {FORMAT_OPTIONS.map((option) => {
                        const count = subscriptionStats.format_distribution[option.value] || 0;
                        const percentage = getSubscriptionPercentage(count);
                        
                        return (
                          <div key={option.value} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{option.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts</SelectItem>
                {SUBSCRIPTION_TYPES.map((type) => (
                  <SelectItem key={type.key} value={type.key}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contacts ({filteredContacts.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllContacts}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredContacts.map((contact) => (
                  <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{contact.email}</h4>
                          <Badge variant="outline" className="text-xs">
                            {contact.contact_type.replace('_', ' ')}
                          </Badge>
                          {contact.healthcare_specialty && (
                            <Badge variant="secondary" className="text-xs">
                              {contact.healthcare_specialty}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {SUBSCRIPTION_TYPES.map((type) => {
                            const isSubscribed = contact.subscription_preferences[type.key as keyof SubscriptionPreferences] as boolean;
                            
                            return (
                              <div key={type.key} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${contact.id}_${type.key}`}
                                  checked={isSubscribed}
                                  onCheckedChange={(checked) => {
                                    handleContactUpdate(contact.id, {
                                      [type.key]: checked
                                    } as Partial<SubscriptionPreferences>);
                                  }}
                                  disabled={isUpdating}
                                />
                                <Label 
                                  htmlFor={`${contact.id}_${type.key}`} 
                                  className="text-xs flex items-center gap-1"
                                >
                                  {type.icon}
                                  {type.label}
                                </Label>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <span>Frequency:</span>
                            <Select
                              value={contact.subscription_preferences.frequency}
                              onValueChange={(value) => {
                                handleContactUpdate(contact.id, {
                                  frequency: value as any
                                });
                              }}
                            >
                              <SelectTrigger className="w-24 h-6">
                                <SelectValue />
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
                          <div className="flex items-center gap-1">
                            <span>Format:</span>
                            <Select
                              value={contact.subscription_preferences.preferred_format}
                              onValueChange={(value) => {
                                handleContactUpdate(contact.id, {
                                  preferred_format: value as any
                                });
                              }}
                            >
                              <SelectTrigger className="w-20 h-6">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FORMAT_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Subscription Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Selected Contacts</h4>
                  <p className="text-sm text-gray-600">
                    {selectedContacts.size} contacts selected
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllContacts}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </div>
              </div>

              {selectedContacts.size > 0 && (
                <div className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Bulk updates will apply to all selected contacts. Changes will be saved immediately.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Subscription Types</h4>
                      {SUBSCRIPTION_TYPES.map((type) => (
                        <div key={type.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`bulk_${type.key}`}
                            onCheckedChange={(checked) => {
                              handleBulkUpdate({
                                [type.key]: checked
                              } as Partial<SubscriptionPreferences>);
                            }}
                            disabled={isUpdating}
                          />
                          <Label htmlFor={`bulk_${type.key}`} className="flex items-center gap-2">
                            {type.icon}
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bulk_frequency">Frequency</Label>
                        <Select
                          onValueChange={(value) => {
                            handleBulkUpdate({
                              frequency: value as any
                            });
                          }}
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

                      <div>
                        <Label htmlFor="bulk_format">Format</Label>
                        <Select
                          onValueChange={(value) => {
                            handleBulkUpdate({
                              preferred_format: value as any
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            {FORMAT_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
