'use client';

// Contact Segmentation Component
// Created: 2025-01-27
// Purpose: Healthcare audience filtering and contact segmentation

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
  Users, 
  Filter, 
  Search, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw,
  Download,
  Upload,
  Eye,
  Edit,
  Copy
} from 'lucide-react';
import type { 
  EmailContact, 
  ContactSegmentationRequest, 
  ContactType 
} from '@/types/email-campaigns';

interface ContactSegmentationProps {
  contacts: EmailContact[];
  onSegmentsChange: (segments: ContactSegmentationRequest) => void;
  onContactsFiltered: (contacts: EmailContact[]) => void;
  onSaveSegment?: (segment: any) => void;
}

interface Segment {
  id: string;
  name: string;
  description: string;
  filters: ContactSegmentationRequest;
  contact_count: number;
  created_at: string;
}

interface SegmentStats {
  total_contacts: number;
  contact_types: Record<ContactType, number>;
  healthcare_specialties: Record<string, number>;
  organizations: Record<string, number>;
  subscription_preferences: Record<string, number>;
}

export default function ContactSegmentation({ 
  contacts, 
  onSegmentsChange, 
  onContactsFiltered, 
  onSaveSegment 
}: ContactSegmentationProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentSegment, setCurrentSegment] = useState<ContactSegmentationRequest>({});
  const [filteredContacts, setFilteredContacts] = useState<EmailContact[]>(contacts);
  const [segmentStats, setSegmentStats] = useState<SegmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'filters' | 'preview' | 'segments'>('filters');

  // Load segments and stats on mount
  useEffect(() => {
    loadSegments();
    calculateStats();
  }, [contacts]);

  // Apply filters when current segment changes
  useEffect(() => {
    applyFilters();
  }, [currentSegment, contacts]);

  const loadSegments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/enterprise/contacts/segments?include_counts=true');
      const result = await response.json();
      
      if (result.success) {
        // Convert API response to segments format
        const segmentsData: Segment[] = [];
        
        // Contact types
        Object.entries(result.data.contact_types).forEach(([type, data]: [string, any]) => {
          segmentsData.push({
            id: `type_${type}`,
            name: `${type.replace('_', ' ')} Contacts`,
            description: `All ${type.replace('_', ' ')} contacts`,
            filters: { contact_types: [type as ContactType] },
            contact_count: data.count,
            created_at: new Date().toISOString()
          });
        });

        // Healthcare specialties
        Object.entries(result.data.healthcare_specialties).forEach(([specialty, data]: [string, any]) => {
          segmentsData.push({
            id: `specialty_${specialty}`,
            name: `${specialty} Professionals`,
            description: `Healthcare professionals in ${specialty}`,
            filters: { healthcare_specialties: [specialty] },
            contact_count: data.count,
            created_at: new Date().toISOString()
          });
        });

        setSegments(segmentsData);
      }
    } catch (error) {
      console.error('Error loading segments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const stats: SegmentStats = {
      total_contacts: contacts.length,
      contact_types: {} as Record<ContactType, number>,
      healthcare_specialties: {},
      organizations: {},
      subscription_preferences: {}
    };

    contacts.forEach(contact => {
      // Count contact types
      stats.contact_types[contact.contact_type] = (stats.contact_types[contact.contact_type] || 0) + 1;

      // Count healthcare specialties
      if (contact.healthcare_specialty) {
        stats.healthcare_specialties[contact.healthcare_specialty] = 
          (stats.healthcare_specialties[contact.healthcare_specialty] || 0) + 1;
      }

      // Count organizations
      if (contact.organization_id) {
        stats.organizations[contact.organization_id] = 
          (stats.organizations[contact.organization_id] || 0) + 1;
      }

      // Count subscription preferences
      Object.entries(contact.subscription_preferences).forEach(([key, value]) => {
        if (typeof value === 'boolean' && value) {
          stats.subscription_preferences[key] = 
            (stats.subscription_preferences[key] || 0) + 1;
        }
      });
    });

    setSegmentStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...contacts];

    // Filter by contact types
    if (currentSegment.contact_types?.length) {
      filtered = filtered.filter(contact => 
        currentSegment.contact_types!.includes(contact.contact_type)
      );
    }

    // Filter by healthcare specialties
    if (currentSegment.healthcare_specialties?.length) {
      filtered = filtered.filter(contact => 
        contact.healthcare_specialty && 
        currentSegment.healthcare_specialties!.includes(contact.healthcare_specialty)
      );
    }

    // Filter by organizations
    if (currentSegment.organization_ids?.length) {
      filtered = filtered.filter(contact => 
        contact.organization_id && 
        currentSegment.organization_ids!.includes(contact.organization_id)
      );
    }

    // Filter by subscription preferences
    if (currentSegment.subscription_preferences) {
      Object.entries(currentSegment.subscription_preferences).forEach(([key, value]) => {
        if (value !== undefined) {
          filtered = filtered.filter(contact => 
            contact.subscription_preferences[key as keyof typeof contact.subscription_preferences] === value
          );
        }
      });
    }

    // Filter by engagement
    if (currentSegment.engagement_filters) {
      const { last_engagement_days, min_open_rate, min_click_rate, exclude_bounced, exclude_unsubscribed } = 
        currentSegment.engagement_filters;

      if (last_engagement_days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - last_engagement_days);
        filtered = filtered.filter(contact => 
          contact.last_engagement && new Date(contact.last_engagement) >= cutoffDate
        );
      }

      // Note: Open/click rates would need to be calculated from analytics data
      // This is a simplified implementation
    }

    setFilteredContacts(filtered);
    onContactsFiltered(filtered);
    onSegmentsChange(currentSegment);
  };

  const updateSegment = (updates: Partial<ContactSegmentationRequest>) => {
    setCurrentSegment(prev => ({ ...prev, ...updates }));
  };

  const clearFilters = () => {
    setCurrentSegment({});
  };

  const saveSegment = async () => {
    if (!onSaveSegment) return;

    const segmentName = prompt('Enter segment name:');
    if (!segmentName) return;

    const segment: Segment = {
      id: `segment_${Date.now()}`,
      name: segmentName,
      description: `Custom segment with ${filteredContacts.length} contacts`,
      filters: currentSegment,
      contact_count: filteredContacts.length,
      created_at: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/enterprise/contacts/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: segment.name,
          description: segment.description,
          filters: segment.filters
        })
      });

      const result = await response.json();
      if (result.success) {
        setSegments(prev => [...prev, segment]);
        onSaveSegment(segment);
      }
    } catch (error) {
      console.error('Error saving segment:', error);
    }
  };

  const loadSegment = (segment: Segment) => {
    setCurrentSegment(segment.filters);
  };

  const deleteSegment = (segmentId: string) => {
    setSegments(prev => prev.filter(s => s.id !== segmentId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contact Segmentation</h2>
          <p className="text-gray-600">Filter and segment your healthcare contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {filteredContacts.length} contacts
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="segments">Saved Segments</TabsTrigger>
        </TabsList>

        <TabsContent value="filters" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Type Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {segmentStats && Object.entries(segmentStats.contact_types).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`type_${type}`}
                        checked={currentSegment.contact_types?.includes(type as ContactType) || false}
                        onCheckedChange={(checked) => {
                          const types = currentSegment.contact_types || [];
                          if (checked) {
                            updateSegment({ contact_types: [...types, type as ContactType] });
                          } else {
                            updateSegment({ 
                              contact_types: types.filter(t => t !== type) 
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`type_${type}`} className="capitalize">
                        {type.replace('_', ' ')}
                      </Label>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Healthcare Specialties */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Healthcare Specialties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {segmentStats && Object.entries(segmentStats.healthcare_specialties).map(([specialty, count]) => (
                  <div key={specialty} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`specialty_${specialty}`}
                        checked={currentSegment.healthcare_specialties?.includes(specialty) || false}
                        onCheckedChange={(checked) => {
                          const specialties = currentSegment.healthcare_specialties || [];
                          if (checked) {
                            updateSegment({ healthcare_specialties: [...specialties, specialty] });
                          } else {
                            updateSegment({ 
                              healthcare_specialties: specialties.filter(s => s !== specialty) 
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`specialty_${specialty}`}>{specialty}</Label>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Subscription Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subscription Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {segmentStats && Object.entries(segmentStats.subscription_preferences).map(([pref, count]) => (
                  <div key={pref} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`pref_${pref}`}
                        checked={currentSegment.subscription_preferences?.[pref as keyof typeof currentSegment.subscription_preferences] === true}
                        onCheckedChange={(checked) => {
                          updateSegment({
                            subscription_preferences: {
                              ...currentSegment.subscription_preferences,
                              [pref]: checked
                            }
                          });
                        }}
                      />
                      <Label htmlFor={`pref_${pref}`} className="capitalize">
                        {pref.replace('_', ' ')}
                      </Label>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Engagement Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Engagement Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="last_engagement">Last Engagement (days)</Label>
                  <Input
                    id="last_engagement"
                    type="number"
                    placeholder="e.g., 30"
                    value={currentSegment.engagement_filters?.last_engagement_days || ''}
                    onChange={(e) => {
                      const days = e.target.value ? parseInt(e.target.value) : undefined;
                      updateSegment({
                        engagement_filters: {
                          ...currentSegment.engagement_filters,
                          last_engagement_days: days
                        }
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="exclude_bounced"
                      checked={currentSegment.engagement_filters?.exclude_bounced || false}
                      onCheckedChange={(checked) => {
                        updateSegment({
                          engagement_filters: {
                            ...currentSegment.engagement_filters,
                            exclude_bounced: checked as boolean
                          }
                        });
                      }}
                    />
                    <Label htmlFor="exclude_bounced">Exclude Bounced</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="exclude_unsubscribed"
                      checked={currentSegment.engagement_filters?.exclude_unsubscribed || false}
                      onCheckedChange={(checked) => {
                        updateSegment({
                          engagement_filters: {
                            ...currentSegment.engagement_filters,
                            exclude_unsubscribed: checked as boolean
                          }
                        });
                      }}
                    />
                    <Label htmlFor="exclude_unsubscribed">Exclude Unsubscribed</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={saveSegment}>
                <Save className="h-4 w-4 mr-2" />
                Save Segment
              </Button>
              <Button onClick={() => setActiveTab('preview')}>
                <Eye className="h-4 w-4 mr-2" />
                Preview Results
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filtered Contacts ({filteredContacts.length})</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.slice(0, 12).map((contact) => (
              <Card key={contact.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{contact.email}</h4>
                    <Badge variant="outline" className="text-xs">
                      {contact.contact_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  {contact.healthcare_specialty && (
                    <p className="text-sm text-gray-600">{contact.healthcare_specialty}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(contact.subscription_preferences)
                      .filter(([_, value]) => value === true)
                      .map(([key, _]) => (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key.replace('_', ' ')}
                        </Badge>
                      ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredContacts.length > 12 && (
            <div className="text-center py-4">
              <p className="text-gray-600">
                Showing 12 of {filteredContacts.length} contacts
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Saved Segments</h3>
            <Button variant="outline" onClick={loadSegments}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment) => (
              <Card key={segment.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{segment.name}</h4>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadSegment(segment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSegment(segment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{segment.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{segment.contact_count} contacts</Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(segment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {segments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No saved segments yet</p>
              <p className="text-sm">Create and save segments from the Filters tab</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
