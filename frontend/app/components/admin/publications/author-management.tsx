// AuthorManagement Component
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

'use client';

import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, User, Mail, ExternalLink, Award, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Author, AuthorFilters } from '@/types/publications';

interface AuthorManagementProps {
  authors: Author[];
  onEdit: (author: Author) => void;
  onDelete: (author: Author) => void;
  onAdd: () => void;
  loading?: boolean;
}

export function AuthorManagement({
  authors,
  onEdit,
  onDelete,
  onAdd,
  loading = false
}: AuthorManagementProps) {
  const [filters, setFilters] = useState<AuthorFilters>({
    search: '',
    specialty: '',
    affiliation: '',
    has_orcid: undefined,
    sort_by: 'name',
    sort_order: 'asc'
  });

  const handleFilterChange = (key: keyof AuthorFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (value: string) => {
    handleFilterChange('search', value);
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    handleFilterChange('sort_by', sortBy);
    handleFilterChange('sort_order', sortOrder);
  };

  const getSpecialtyColor = (specialty?: string) => {
    if (!specialty) return 'bg-gray-100 text-gray-800';
    
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    
    const hash = specialty.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const formatExperience = (years?: number) => {
    if (!years) return 'Not specified';
    if (years === 1) return '1 year';
    return `${years} years`;
  };

  const filteredAuthors = authors.filter(author => {
    if (filters.search && !author.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !author.affiliation?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !author.bio?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    if (filters.specialty && author.specialty !== filters.specialty) {
      return false;
    }
    
    if (filters.affiliation && !author.affiliation?.toLowerCase().includes(filters.affiliation.toLowerCase())) {
      return false;
    }
    
    if (filters.has_orcid && !author.orcid) {
      return false;
    }
    
    return true;
  });

  const sortedAuthors = [...filteredAuthors].sort((a, b) => {
    const multiplier = filters.sort_order === 'asc' ? 1 : -1;
    
    switch (filters.sort_by) {
      case 'name':
        return multiplier * a.name.localeCompare(b.name);
      case 'years_experience':
        return multiplier * ((a.years_experience || 0) - (b.years_experience || 0));
      case 'created_at':
        return multiplier * new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default:
        return 0;
    }
  });

  const specialties = [...new Set(authors.map(a => a.specialty).filter(Boolean))];
  const affiliations = [...new Set(authors.map(a => a.affiliation).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Authors</h1>
          <p className="text-gray-600">
            {filteredAuthors.length} author{filteredAuthors.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Author
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search authors..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Specialty</label>
              <Select
                value={filters.specialty || 'all'}
                onValueChange={(value) => handleFilterChange('specialty', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {specialties.map(specialty => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Affiliation</label>
              <Select
                value={filters.affiliation || 'all'}
                onValueChange={(value) => handleFilterChange('affiliation', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All affiliations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Affiliations</SelectItem>
                  {affiliations.map(affiliation => (
                    <SelectItem key={affiliation} value={affiliation}>
                      {affiliation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
              <Select
                value={`${filters.sort_by}-${filters.sort_order}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="years_experience-desc">Experience (Most)</SelectItem>
                  <SelectItem value="years_experience-asc">Experience (Least)</SelectItem>
                  <SelectItem value="created_at-desc">Created (Newest)</SelectItem>
                  <SelectItem value="created_at-asc">Created (Oldest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : sortedAuthors.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No authors found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          sortedAuthors.map((author) => (
            <Card key={author.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {author.photo_url ? (
                        <img
                          src={author.photo_url}
                          alt={author.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{author.name}</h3>
                      {author.credentials && (
                        <p className="text-sm text-gray-600">{author.credentials}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(author)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(author)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {author.affiliation && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    {author.affiliation}
                  </div>
                )}

                {author.specialty && (
                  <div className="mb-3">
                    <Badge className={getSpecialtyColor(author.specialty)}>
                      {author.specialty}
                    </Badge>
                  </div>
                )}

                {author.bio && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {author.bio}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-600">
                  {author.years_experience && (
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      {formatExperience(author.years_experience)} experience
                    </div>
                  )}

                  {author.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href={`mailto:${author.email}`} className="hover:text-blue-600">
                        {author.email}
                      </a>
                    </div>
                  )}

                  {author.orcid && (
                    <div className="flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      <a
                        href={`https://orcid.org/${author.orcid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600"
                      >
                        ORCID: {author.orcid}
                      </a>
                    </div>
                  )}
                </div>

                {author.research_interests && author.research_interests.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Research Interests:</p>
                    <div className="flex flex-wrap gap-1">
                      {author.research_interests.slice(0, 3).map((interest, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                      {author.research_interests.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{author.research_interests.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {author.board_certifications && author.board_certifications.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Board Certifications:</p>
                    <div className="flex flex-wrap gap-1">
                      {author.board_certifications.slice(0, 2).map((cert, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                      {author.board_certifications.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{author.board_certifications.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
