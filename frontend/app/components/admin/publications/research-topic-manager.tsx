// ResearchTopicManager Component
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

'use client';

import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Tag, ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResearchTopic, ResearchTopicFilters } from '@/types/publications';

interface ResearchTopicManagerProps {
  topics: ResearchTopic[];
  onEdit: (topic: ResearchTopic) => void;
  onDelete: (topic: ResearchTopic) => void;
  onAdd: () => void;
  loading?: boolean;
}

export function ResearchTopicManager({
  topics,
  onEdit,
  onDelete,
  onAdd,
  loading = false
}: ResearchTopicManagerProps) {
  const [filters, setFilters] = useState<ResearchTopicFilters>({
    search: '',
    medical_specialty: '',
    parent_id: undefined,
    has_children: undefined,
    sort_by: 'name',
    sort_order: 'asc'
  });
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const handleFilterChange = (key: keyof ResearchTopicFilters, value: any) => {
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

  const toggleExpanded = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const getSpecialtyColor = (specialty?: string) => {
    if (!specialty) return 'bg-gray-100 text-gray-800';
    
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-yellow-100 text-yellow-800'
    ];
    
    const hash = specialty.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Build hierarchical structure
  const buildHierarchy = (topics: ResearchTopic[]) => {
    const topicMap = new Map(topics.map(topic => [topic.id, { ...topic, children: [] }]));
    const rootTopics: ResearchTopic[] = [];

    topics.forEach(topic => {
      if (topic.parent_id) {
        const parent = topicMap.get(topic.parent_id);
        if (parent) {
          parent.children.push(topicMap.get(topic.id)!);
        }
      } else {
        rootTopics.push(topicMap.get(topic.id)!);
      }
    });

    return rootTopics;
  };

  const filteredTopics = topics.filter(topic => {
    if (filters.search && !topic.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !topic.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    if (filters.medical_specialty && topic.medical_specialty !== filters.medical_specialty) {
      return false;
    }
    
    if (filters.parent_id !== undefined) {
      if (filters.parent_id === null && topic.parent_id) return false;
      if (filters.parent_id !== null && topic.parent_id !== filters.parent_id) return false;
    }
    
    if (filters.has_children !== undefined) {
      const hasChildren = topics.some(t => t.parent_id === topic.id);
      if (filters.has_children !== hasChildren) return false;
    }
    
    return true;
  });

  const sortedTopics = [...filteredTopics].sort((a, b) => {
    const multiplier = filters.sort_order === 'asc' ? 1 : -1;
    
    switch (filters.sort_by) {
      case 'name':
        return multiplier * a.name.localeCompare(b.name);
      case 'created_at':
        return multiplier * new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default:
        return 0;
    }
  });

  const hierarchicalTopics = buildHierarchy(sortedTopics);
  const specialties = [...new Set(topics.map(t => t.medical_specialty).filter(Boolean))];

  const renderTopic = (topic: ResearchTopic, level = 0) => {
    const hasChildren = topics.some(t => t.parent_id === topic.id);
    const isExpanded = expandedTopics.has(topic.id);
    const indentClass = `ml-${level * 4}`;

    return (
      <div key={topic.id} className={`${indentClass} ${level > 0 ? 'border-l-2 border-gray-200 pl-4' : ''}`}>
        <Card className="mb-2 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(topic.id)}
                    className="p-1 h-6 w-6"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                {!hasChildren && <div className="w-6" />}
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {topic.slug}
                    </Badge>
                  </div>
                  
                  {topic.description && (
                    <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    {topic.medical_specialty && (
                      <Badge className={getSpecialtyColor(topic.medical_specialty)}>
                        {topic.medical_specialty}
                      </Badge>
                    )}
                    
                    {topic.specialty_code && (
                      <Badge variant="outline" className="text-xs">
                        Code: {topic.specialty_code}
                      </Badge>
                    )}
                  </div>
                  
                  {(topic.icd_10_codes.length > 0 || topic.mesh_terms.length > 0) && (
                    <div className="mt-2 space-y-1">
                      {topic.icd_10_codes.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium text-gray-500">ICD-10:</span>
                          <div className="flex flex-wrap gap-1">
                            {topic.icd_10_codes.slice(0, 3).map((code, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {code}
                              </Badge>
                            ))}
                            {topic.icd_10_codes.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{topic.icd_10_codes.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {topic.mesh_terms.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium text-gray-500">MeSH:</span>
                          <div className="flex flex-wrap gap-1">
                            {topic.mesh_terms.slice(0, 3).map((term, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {term}
                              </Badge>
                            ))}
                            {topic.mesh_terms.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{topic.mesh_terms.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(topic)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(topic)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {topic.children?.map(child => renderTopic(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Research Topics</h1>
          <p className="text-gray-600">
            {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Topic
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
              placeholder="Search topics..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Medical Specialty</label>
              <Select
                value={filters.medical_specialty || 'all'}
                onValueChange={(value) => handleFilterChange('medical_specialty', value === 'all' ? undefined : value)}
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">Parent Topic</label>
              <Select
                value={filters.parent_id || 'all'}
                onValueChange={(value) => handleFilterChange('parent_id', value === 'all' ? undefined : value === 'none' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  <SelectItem value="none">Root Topics Only</SelectItem>
                  {topics.filter(t => !t.parent_id).map(topic => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
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
                  <SelectItem value="created_at-desc">Created (Newest)</SelectItem>
                  <SelectItem value="created_at-asc">Created (Oldest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredTopics.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Tag className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No topics found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          hierarchicalTopics.map(topic => renderTopic(topic))
        )}
      </div>
    </div>
  );
}
