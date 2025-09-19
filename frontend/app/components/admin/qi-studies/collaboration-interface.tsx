'use client';

// QI Study Collaboration Interface Component
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
import { QICollaboration } from '@/types/qi-studies';

interface CollaborationInterfaceProps {
  studyId: string;
  className?: string;
}

export function CollaborationInterface({ studyId, className }: CollaborationInterfaceProps) {
  const [collaborations, setCollaborations] = useState<QICollaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCollaboration, setNewCollaboration] = useState({
    site_name: '',
    site_type: '',
    site_location: '',
    contact_person: '',
    contact_email: '',
    collaboration_role: '',
    data_sharing_agreement: false,
    irb_approval_status: '',
  });

  useEffect(() => {
    fetchCollaborations();
  }, [studyId]);

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/qi-collaboration?study_id=${studyId}`);
      if (response.ok) {
        const data = await response.json();
        setCollaborations(data);
      } else {
        setError('Failed to fetch collaborations');
      }
    } catch (err) {
      console.error('Error fetching collaborations:', err);
      setError('Failed to load collaborations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaboration = async () => {
    try {
      const response = await fetch('/api/admin/qi-collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          study_id: studyId,
          ...newCollaboration,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCollaborations(prev => [data, ...prev]);
        setNewCollaboration({
          site_name: '',
          site_type: '',
          site_location: '',
          contact_person: '',
          contact_email: '',
          collaboration_role: '',
          data_sharing_agreement: false,
          irb_approval_status: '',
        });
        setShowAddForm(false);
      } else {
        setError('Failed to add collaboration');
      }
    } catch (err) {
      console.error('Error adding collaboration:', err);
      setError('Failed to add collaboration');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'withdrawn': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'lead': return 'bg-purple-100 text-purple-800';
      case 'participant': return 'bg-blue-100 text-blue-800';
      case 'advisor': return 'bg-yellow-100 text-yellow-800';
      case 'reviewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIRBStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'not_required': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
          <h2 className="text-2xl font-bold">Study Collaborations</h2>
          <p className="text-muted-foreground">Manage multi-site coordination and collaboration</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          Add Collaboration
        </Button>
      </div>

      {/* Add Collaboration Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Collaboration</CardTitle>
            <CardDescription>Add a new site or organization to the QI study</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="site_name">Site Name *</Label>
                <Input
                  id="site_name"
                  value={newCollaboration.site_name}
                  onChange={(e) => setNewCollaboration(prev => ({ ...prev, site_name: e.target.value }))}
                  placeholder="e.g., General Hospital"
                />
              </div>

              <div>
                <Label htmlFor="site_type">Site Type</Label>
                <Select 
                  value={newCollaboration.site_type} 
                  onValueChange={(value) => setNewCollaboration(prev => ({ ...prev, site_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select site type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">Hospital</SelectItem>
                    <SelectItem value="clinic">Clinic</SelectItem>
                    <SelectItem value="research_center">Research Center</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="site_location">Site Location</Label>
                <Input
                  id="site_location"
                  value={newCollaboration.site_location}
                  onChange={(e) => setNewCollaboration(prev => ({ ...prev, site_location: e.target.value }))}
                  placeholder="e.g., New York, NY"
                />
              </div>

              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={newCollaboration.contact_person}
                  onChange={(e) => setNewCollaboration(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="e.g., Dr. Jane Smith"
                />
              </div>

              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={newCollaboration.contact_email}
                  onChange={(e) => setNewCollaboration(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="e.g., jane.smith@hospital.com"
                />
              </div>

              <div>
                <Label htmlFor="collaboration_role">Collaboration Role *</Label>
                <Select 
                  value={newCollaboration.collaboration_role} 
                  onValueChange={(value) => setNewCollaboration(prev => ({ ...prev, collaboration_role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="participant">Participant</SelectItem>
                    <SelectItem value="advisor">Advisor</SelectItem>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="irb_approval_status">IRB Approval Status</Label>
                <Select 
                  value={newCollaboration.irb_approval_status} 
                  onValueChange={(value) => setNewCollaboration(prev => ({ ...prev, irb_approval_status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="not_required">Not Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="data_sharing_agreement"
                    checked={newCollaboration.data_sharing_agreement}
                    onChange={(e) => setNewCollaboration(prev => ({ ...prev, data_sharing_agreement: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="data_sharing_agreement">Data Sharing Agreement Signed</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddCollaboration}
                disabled={!newCollaboration.site_name || !newCollaboration.collaboration_role}
              >
                Add Collaboration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collaborations List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Collaborations ({collaborations.length})</CardTitle>
          <CardDescription>Multi-site coordination and collaboration status</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchCollaborations} variant="outline">
                Retry
              </Button>
            </div>
          ) : collaborations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No collaborations added yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {collaborations.map((collaboration) => (
                <div key={collaboration.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{collaboration.site_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {collaboration.site_type && `${collaboration.site_type} • `}
                        {collaboration.site_location}
                      </p>
                      {collaboration.contact_person && (
                        <p className="text-sm text-muted-foreground">
                          Contact: {collaboration.contact_person}
                          {collaboration.contact_email && ` (${collaboration.contact_email})`}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getStatusColor(collaboration.participation_status)}>
                        {collaboration.participation_status}
                      </Badge>
                      <Badge className={getRoleColor(collaboration.collaboration_role)}>
                        {collaboration.collaboration_role}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">IRB Approval</Label>
                      <div className="flex items-center space-x-2">
                        <Badge className={getIRBStatusColor(collaboration.irb_approval_status || 'not_required')}>
                          {collaboration.irb_approval_status || 'Not Required'}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Data Sharing</Label>
                      <div className="flex items-center space-x-2">
                        <Badge className={collaboration.data_sharing_agreement ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {collaboration.data_sharing_agreement ? 'Agreement Signed' : 'No Agreement'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {collaboration.start_date && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      <Label className="text-xs text-muted-foreground">Participation Period</Label>
                      <p>
                        {formatDate(collaboration.start_date)}
                        {collaboration.end_date && ` - ${formatDate(collaboration.end_date)}`}
                      </p>
                    </div>
                  )}

                  {collaboration.contribution_notes && (
                    <div className="mt-3">
                      <Label className="text-xs text-muted-foreground">Contribution Notes</Label>
                      <p className="text-sm">{collaboration.contribution_notes}</p>
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
