// PublicationsList Component
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, Edit, Trash2, Eye, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Publication, PublicationFilters } from '@/types/publications';

interface PublicationsListProps {
  publications: Publication[];
  filters: PublicationFilters;
  onFilterChange: (filters: PublicationFilters) => void;
  onEdit: (publication: Publication) => void;
  onDelete: (publication: Publication) => void;
  onView: (publication: Publication) => void;
  loading?: boolean;
  totalCount?: number;
}

export function PublicationsList({
  publications,
  filters,
  onFilterChange,
  onEdit,
  onDelete,
  onView,
  loading = false,
  totalCount = 0
}: PublicationsListProps) {
  const [localFilters, setLocalFilters] = useState<PublicationFilters>(filters);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPublications, setSelectedPublications] = useState<string[]>([]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof PublicationFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearch = (value: string) => {
    handleFilterChange('search', value || undefined);
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    handleFilterChange('sort_by', sortBy);
    handleFilterChange('sort_order', sortOrder);
  };

  const handleBulkAction = (action: string) => {
    if (selectedPublications.length === 0) return;
    
    switch (action) {
      case 'delete':
        // Implement bulk delete
        console.log('Bulk delete:', selectedPublications);
        break;
      case 'export':
        // Implement bulk export
        console.log('Bulk export:', selectedPublications);
        break;
      default:
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'under-review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'peer-reviewed': return 'bg-blue-100 text-blue-800';
      case 'white-paper': return 'bg-purple-100 text-purple-800';
      case 'case-study': return 'bg-orange-100 text-orange-800';
      case 'review': return 'bg-green-100 text-green-800';
      case 'editorial': return 'bg-pink-100 text-pink-800';
      case 'conference-paper': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatAuthors = (authors: any[]) => {
    if (!authors || authors.length === 0) return 'No authors';
    if (authors.length === 1) return authors[0].name;
    if (authors.length === 2) return `${authors[0].name} and ${authors[1].name}`;
    return `${authors[0].name} et al.`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publications</h1>
          <p className="text-gray-600">
            {totalCount} publication{totalCount !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => handleBulkAction('export')} disabled={selectedPublications.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => handleBulkAction('delete')} disabled={selectedPublications.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Publication
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Search & Filter</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search publications..."
              value={localFilters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Publication Type</label>
                <Select
                  value={localFilters.publication_type || 'all'}
                  onValueChange={(value) => handleFilterChange('publication_type', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="peer-reviewed">Peer-reviewed</SelectItem>
                    <SelectItem value="white-paper">White Paper</SelectItem>
                    <SelectItem value="case-study">Case Study</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="editorial">Editorial</SelectItem>
                    <SelectItem value="conference-paper">Conference Paper</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <Select
                  value={localFilters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="under-review">Under Review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Medical Specialty</label>
                <Input
                  placeholder="e.g., Cardiology"
                  value={localFilters.medical_specialty || ''}
                  onChange={(e) => handleFilterChange('medical_specialty', e.target.value || undefined)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                <Select
                  value={`${localFilters.sort_by || 'created_at'}-${localFilters.sort_order || 'desc'}`}
                  onValueChange={handleSortChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    <SelectItem value="publication_date-desc">Publication Date (Newest)</SelectItem>
                    <SelectItem value="publication_date-asc">Publication Date (Oldest)</SelectItem>
                    <SelectItem value="citations_count-desc">Citations (Most)</SelectItem>
                    <SelectItem value="citations_count-asc">Citations (Least)</SelectItem>
                    <SelectItem value="created_at-desc">Created (Newest)</SelectItem>
                    <SelectItem value="created_at-asc">Created (Oldest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publications List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : publications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No publications found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {publications.map((publication) => (
                <div key={publication.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Checkbox
                        checked={selectedPublications.includes(publication.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPublications([...selectedPublications, publication.id]);
                          } else {
                            setSelectedPublications(selectedPublications.filter(id => id !== publication.id));
                          }
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {publication.title}
                          </h3>
                          {publication.featured && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span>{formatAuthors(publication.authors)}</span>
                          <span>•</span>
                          <span>{publication.journal || 'No journal'}</span>
                          <span>•</span>
                          <span>{formatDate(publication.publication_date)}</span>
                        </div>
                        
                        {publication.abstract && (
                          <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                            {publication.abstract}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(publication.publication_type)}>
                            {publication.publication_type.replace('-', ' ')}
                          </Badge>
                          <Badge className={getStatusColor(publication.status)}>
                            {publication.status.replace('-', ' ')}
                          </Badge>
                          {publication.citations_count > 0 && (
                            <Badge variant="outline">
                              {publication.citations_count} citations
                            </Badge>
                          )}
                          {publication.doi && (
                            <Badge variant="outline">
                              DOI: {publication.doi}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(publication)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(publication)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(publication)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {publications.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {publications.length} of {totalCount} publications
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!filters.offset || filters.offset === 0}
              onClick={() => handleFilterChange('offset', Math.max(0, (filters.offset || 0) - (filters.limit || 50)))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!filters.has_more}
              onClick={() => handleFilterChange('offset', (filters.offset || 0) + (filters.limit || 50))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
