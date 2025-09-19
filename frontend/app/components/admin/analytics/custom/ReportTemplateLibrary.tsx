// Report Template Library Component
// Story: 4.6 - Advanced Reporting & Business Intelligence

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Plus,
  BarChart3,
  Shield,
  Activity,
  Stethoscope,
  Star,
  Users
} from 'lucide-react';
import type { CustomReportTemplate } from '@/types/reporting';

interface ReportTemplateLibraryProps {
  onSelectTemplate?: (template: CustomReportTemplate) => void;
  onCreateNew?: () => void;
  className?: string;
}

export function ReportTemplateLibrary({ 
  onSelectTemplate, 
  onCreateNew, 
  className = '' 
}: ReportTemplateLibraryProps) {
  const [templates, setTemplates] = useState<CustomReportTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<CustomReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'created'>('usage');

  const categories = [
    { value: 'all', label: 'All Categories', icon: <BarChart3 className="h-4 w-4" /> },
    { value: 'executive', label: 'Executive', icon: <Users className="h-4 w-4" /> },
    { value: 'compliance', label: 'Compliance', icon: <Shield className="h-4 w-4" /> },
    { value: 'operational', label: 'Operational', icon: <Activity className="h-4 w-4" /> },
    { value: 'clinical', label: 'Clinical', icon: <Stethoscope className="h-4 w-4" /> }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterAndSortTemplates();
  }, [templates, searchTerm, selectedCategory, sortBy]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/analytics/reports/templates?isPublic=true');
      if (!response.ok) throw new Error('Failed to load templates');
      
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.usage_count - a.usage_count;
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  };

  const getCategoryIcon = (category: string) => {
    const categoryInfo = categories.find(cat => cat.value === category);
    return categoryInfo?.icon || <BarChart3 className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'executive': return 'bg-blue-100 text-blue-800';
      case 'compliance': return 'bg-green-100 text-green-800';
      case 'operational': return 'bg-yellow-100 text-yellow-800';
      case 'clinical': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button onClick={loadTemplates} variant="outline" size="sm" className="mt-3">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Template Library</h1>
        <p className="text-gray-600">Browse and select from healthcare-specific report templates</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="usage">Most Used</option>
              <option value="name">Name</option>
              <option value="created">Newest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => onSelectTemplate?.(template)}
            categoryIcon={getCategoryIcon(template.category)}
            categoryColor={getCategoryColor(template.category)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'No report templates are available yet'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Template
            </Button>
          )}
        </div>
      )}

      {/* Create New Button */}
      <div className="flex justify-center">
        <Button onClick={onCreateNew} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create New Template
        </Button>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: CustomReportTemplate;
  onSelect: () => void;
  categoryIcon: React.ReactNode;
  categoryColor: string;
}

function TemplateCard({ template, onSelect, categoryIcon, categoryColor }: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${
        isHovered ? 'shadow-lg scale-105' : 'hover:shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {categoryIcon}
            <CardTitle className="text-lg">{template.name}</CardTitle>
          </div>
          <Badge className={categoryColor}>
            {template.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {template.description || 'No description available'}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Usage Count</span>
            <span className="font-medium">{template.usage_count}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Compliance</span>
            <span className="font-medium capitalize">{template.compliance_framework}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Stakeholders</span>
            <span className="font-medium">{template.stakeholder_roles.length}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Star className="h-4 w-4" />
            <span>Public Template</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
