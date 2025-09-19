// Local SEO Manager Component
// Created: 2025-01-27
// Purpose: Local SEO management for healthcare facilities and practices

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  LocalSEOManagement, 
  AddressData,
  CitationSource 
} from '@/types/seo';

interface LocalSEOManagerProps {
  organizationId: string;
}

export default function LocalSEOManager({ organizationId }: LocalSEOManagerProps) {
  const [localListings, setLocalListings] = useState<LocalSEOManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingListing, setEditingListing] = useState<LocalSEOManagement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    businessName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
    websiteUrl: '',
    googleMyBusinessId: '',
    localKeywords: [] as string[],
    newKeyword: ''
  });

  useEffect(() => {
    loadLocalListings();
  }, [organizationId]);

  const loadLocalListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/seo/local-seo?organizationId=${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load local listings');
      }

      const data = await response.json();
      setLocalListings(data.listings || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load local listings');
    } finally {
      setLoading(false);
    }
  };

  const addLocalListing = async () => {
    try {
      setIsAdding(true);
      setError(null);

      const address: AddressData = {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        country: formData.country
      };

      const response = await fetch('/api/admin/seo/local-seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          businessName: formData.businessName,
          address,
          phone: formData.phone,
          websiteUrl: formData.websiteUrl,
          googleMyBusinessId: formData.googleMyBusinessId,
          localKeywords: formData.localKeywords
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add local listing');
      }

      // Reset form
      setFormData({
        businessName: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
        phone: '',
        websiteUrl: '',
        googleMyBusinessId: '',
        localKeywords: [],
        newKeyword: ''
      });

      loadLocalListings(); // Refresh the list

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add local listing');
    } finally {
      setIsAdding(false);
    }
  };

  const updateLocalListing = async (listingId: string, updates: Partial<LocalSEOManagement>) => {
    try {
      const response = await fetch('/api/admin/seo/local-seo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          updates
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update local listing');
      }

      loadLocalListings(); // Refresh the list

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update local listing');
    }
  };

  const deleteLocalListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this local listing?')) return;

    try {
      const response = await fetch(`/api/admin/seo/local-seo?id=${listingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete local listing');
      }

      loadLocalListings(); // Refresh the list

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete local listing');
    }
  };

  const addKeyword = () => {
    if (formData.newKeyword.trim() && !formData.localKeywords.includes(formData.newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        localKeywords: [...prev.localKeywords, prev.newKeyword.trim()],
        newKeyword: ''
      }));
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      localKeywords: prev.localKeywords.filter(k => k !== keyword)
    }));
  };

  const getCitationStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading local listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Local SEO Manager</h2>
          <p className="text-gray-600">Manage local business listings for healthcare facilities</p>
        </div>
        <div className="text-sm text-gray-500">
          {localListings.length} listings managed
        </div>
      </div>

      {/* Add New Listing Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Local Listing</CardTitle>
          <CardDescription>Create a new local business listing for SEO optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business-name">Business Name</Label>
                <Input
                  id="business-name"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Healthcare Center Name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                <Input
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Street Address"
                />
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
                <div className="flex gap-2">
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                    className="flex-1"
                  />
                  <Input
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="ZIP"
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <Label htmlFor="gmb-id">Google My Business ID (Optional)</Label>
                <Input
                  id="gmb-id"
                  value={formData.googleMyBusinessId}
                  onChange={(e) => setFormData(prev => ({ ...prev, googleMyBusinessId: e.target.value }))}
                  placeholder="GMB Listing ID"
                />
              </div>
            </div>

            <div>
              <Label>Local Keywords</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={formData.newKeyword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newKeyword: e.target.value }))}
                  placeholder="Add local keyword..."
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                />
                <Button onClick={addKeyword} variant="outline">
                  Add
                </Button>
              </div>
              {formData.localKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.localKeywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={addLocalListing} 
              disabled={!formData.businessName.trim() || isAdding}
              className="w-full"
            >
              {isAdding ? 'Adding Listing...' : 'Add Local Listing'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Local Listings */}
      <Card>
        <CardHeader>
          <CardTitle>Local Business Listings</CardTitle>
          <CardDescription>Manage your healthcare facility listings for local SEO</CardDescription>
        </CardHeader>
        <CardContent>
          {localListings.length > 0 ? (
            <div className="space-y-4">
              {localListings.map((listing) => (
                <div key={listing.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-lg">{listing.business_name}</h3>
                        <Badge variant={listing.is_active ? 'default' : 'secondary'}>
                          {listing.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <div>{listing.address.street}</div>
                        <div>{listing.address.city}, {listing.address.state} {listing.address.zip_code}</div>
                        {listing.phone && <div>Phone: {listing.phone}</div>}
                        {listing.website_url && <div>Website: {listing.website_url}</div>}
                      </div>

                      {listing.local_keywords.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-700 mb-1">Local Keywords:</div>
                          <div className="flex flex-wrap gap-1">
                            {listing.local_keywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {listing.citation_sources.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Citation Sources:</div>
                          <div className="space-y-1">
                            {listing.citation_sources.map((citation, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs">
                                <span>{citation.name}</span>
                                <Badge className={getCitationStatusColor(citation.status)}>
                                  {citation.status}
                                </Badge>
                                <span className="text-gray-500">
                                  {new Date(citation.last_verified).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateLocalListing(listing.id, { 
                          is_active: !listing.is_active 
                        })}
                      >
                        {listing.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteLocalListing(listing.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Local Listings</h3>
              <p className="text-gray-600 mb-4">Start by adding your healthcare facility listings for local SEO</p>
              <Button onClick={() => setFormData(prev => ({ ...prev, businessName: '' }))}>
                Add Your First Listing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Local SEO Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Local SEO Best Practices</CardTitle>
          <CardDescription>Tips for optimizing your healthcare facility's local presence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✓ Do</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Use consistent NAP (Name, Address, Phone) across all listings</li>
                <li>• Include healthcare-specific local keywords</li>
                <li>• Claim and optimize your Google My Business listing</li>
                <li>• Encourage patient reviews and respond to them</li>
                <li>• Add location-specific content to your website</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-red-600">✗ Don't</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Create duplicate listings for the same location</li>
                <li>• Use misleading or inaccurate information</li>
                <li>• Ignore negative reviews or feedback</li>
                <li>• Forget to update information when you move</li>
                <li>• Use generic keywords instead of local ones</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
