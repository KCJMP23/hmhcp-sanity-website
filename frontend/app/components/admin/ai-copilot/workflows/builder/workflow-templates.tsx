'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Play,
  Star,
  Download,
  Upload,
  Eye,
  Settings,
  Zap,
  Shield,
  Users,
  Clock,
  TrendingUp
} from 'lucide-react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'content_creation' | 'research_synthesis' | 'compliance_validation' | 'multi_platform_publishing';
  version: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  successRate: number;
  avgExecutionTime: number;
  cost: number;
  complianceFrameworks: string[];
  healthcareTopics: string[];
  steps: WorkflowStep[];
  tags: string[];
  isPublic: boolean;
  isFeatured: boolean;
  rating: number;
  reviews: number;
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'research' | 'content' | 'compliance' | 'review' | 'publish';
  agent: string;
  order: number;
  config: Record<string, any>;
  estimatedDuration: number;
  required: boolean;
}

export function WorkflowTemplates() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<WorkflowTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [frameworkFilter, setFrameworkFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, categoryFilter, frameworkFilter, sortBy]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/ai-workflows/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === categoryFilter);
    }

    // Framework filter
    if (frameworkFilter !== 'all') {
      filtered = filtered.filter(template => 
        template.complianceFrameworks.includes(frameworkFilter)
      );
    }

    // Sort
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'success_rate':
        filtered.sort((a, b) => b.successRate - a.successRate);
        break;
    }

    setFilteredTemplates(filtered);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'content_creation': return 'bg-blue-100 text-blue-800';
      case 'research_synthesis': return 'bg-green-100 text-green-800';
      case 'compliance_validation': return 'bg-red-100 text-red-800';
      case 'multi_platform_publishing': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content_creation': return <FileText className="h-4 w-4" />;
      case 'research_synthesis': return <Search className="h-4 w-4" />;
      case 'compliance_validation': return <Shield className="h-4 w-4" />;
      case 'multi_platform_publishing': return <Zap className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(0)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const useTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/ai-workflows/templates/${templateId}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        alert('Template applied successfully! You can now customize the workflow.');
      }
    } catch (error) {
      console.error('Failed to use template:', error);
      alert('Failed to use template');
    }
  };

  const duplicateTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/ai-workflows/templates/${templateId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        loadTemplates(); // Refresh templates
        alert('Template duplicated successfully!');
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      alert('Failed to duplicate template');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/admin/ai-workflows/templates/${templateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadTemplates(); // Refresh templates
        alert('Template deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Templates</h2>
          <p className="text-gray-600">Pre-built workflow templates for common healthcare tasks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
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
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="content_creation">Content Creation</SelectItem>
                <SelectItem value="research_synthesis">Research Synthesis</SelectItem>
                <SelectItem value="compliance_validation">Compliance Validation</SelectItem>
                <SelectItem value="multi_platform_publishing">Multi-Platform Publishing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frameworks</SelectItem>
                <SelectItem value="hipaa">HIPAA</SelectItem>
                <SelectItem value="fda_advertising">FDA Advertising</SelectItem>
                <SelectItem value="fhir_compliance">FHIR Compliance</SelectItem>
                <SelectItem value="hitrust">HITRUST</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="success_rate">Success Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {filteredTemplates.length} of {templates.length} templates
            </div>
            <Button onClick={loadTemplates} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(template.category)}
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.isFeatured && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicateTemplate(template.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(template.category)}>
                  {template.category.replace('_', ' ')}
                </Badge>
                <Badge variant="outline">v{template.version}</Badge>
                {template.isPublic && (
                  <Badge variant="secondary">Public</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Usage</div>
                  <div className="font-medium">{template.usageCount} times</div>
                </div>
                <div>
                  <div className="text-gray-600">Success Rate</div>
                  <div className="font-medium">{template.successRate}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Avg Duration</div>
                  <div className="font-medium">{formatDuration(template.avgExecutionTime)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Cost</div>
                  <div className="font-medium">${template.cost.toFixed(2)}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">Compliance Frameworks</div>
                <div className="flex flex-wrap gap-1">
                  {template.complianceFrameworks.map((framework) => (
                    <Badge key={framework} variant="outline" className="text-xs">
                      {framework.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">Healthcare Topics</div>
                <div className="flex flex-wrap gap-1">
                  {template.healthcareTopics.slice(0, 3).map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                  {template.healthcareTopics.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.healthcareTopics.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{template.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({template.reviews})</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Customize
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => useTemplate(template.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Use
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              No templates match your current filters. Try adjusting your search criteria.
            </p>
            <Button onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setFrameworkFilter('all');
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Template Details Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(selectedTemplate.category)}
                  <div>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription>v{selectedTemplate.version} by {selectedTemplate.author}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Template Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Category:</span> 
                      <Badge className={`ml-2 ${getCategoryColor(selectedTemplate.category)}`}>
                        {selectedTemplate.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div><span className="text-gray-600">Version:</span> {selectedTemplate.version}</div>
                    <div><span className="text-gray-600">Author:</span> {selectedTemplate.author}</div>
                    <div><span className="text-gray-600">Created:</span> {new Date(selectedTemplate.createdAt).toLocaleDateString()}</div>
                    <div><span className="text-gray-600">Updated:</span> {new Date(selectedTemplate.updatedAt).toLocaleDateString()}</div>
                    <div><span className="text-gray-600">Usage Count:</span> {selectedTemplate.usageCount}</div>
                    <div><span className="text-gray-600">Success Rate:</span> {selectedTemplate.successRate}%</div>
                    <div><span className="text-gray-600">Avg Duration:</span> {formatDuration(selectedTemplate.avgExecutionTime)}</div>
                    <div><span className="text-gray-600">Cost:</span> ${selectedTemplate.cost.toFixed(2)}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Performance Metrics</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Success Rate</span>
                        <span>{selectedTemplate.successRate}%</span>
                      </div>
                      <Progress value={selectedTemplate.successRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Rating</span>
                        <span>{selectedTemplate.rating.toFixed(1)}/5.0 ({selectedTemplate.reviews} reviews)</span>
                      </div>
                      <Progress value={(selectedTemplate.rating / 5) * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Compliance Frameworks</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.complianceFrameworks.map((framework) => (
                    <Badge key={framework} variant="outline">
                      {framework.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Healthcare Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.healthcareTopics.map((topic) => (
                    <Badge key={topic} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Workflow Steps</h4>
                <div className="space-y-2">
                  {selectedTemplate.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 border rounded">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{step.name}</div>
                        <div className="text-sm text-gray-600">{step.description}</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="outline">{step.type}</Badge>
                        <span>{step.agent}</span>
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(step.estimatedDuration)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => duplicateTemplate(selectedTemplate.id)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => deleteTemplate(selectedTemplate.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button onClick={() => useTemplate(selectedTemplate.id)}>
                  <Play className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
