'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, Upload, Star, Eye, Users, Clock, Tag, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { WorkflowTemplateManager, WorkflowTemplate, TemplateSearchFilters, HealthcareWorkflowCategory, HealthcareComplianceLevel } from '@/lib/workflows/template-manager';
import { cn } from '@/lib/utils';

interface TemplateLibraryProps {
  onSelectTemplate?: (template: WorkflowTemplate) => void;
  onImportTemplate?: (template: WorkflowTemplate) => void;
  className?: string;
}

export function TemplateLibrary({ onSelectTemplate, onImportTemplate, className }: TemplateLibraryProps) {
  const [templateManager] = useState(() => new WorkflowTemplateManager());
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HealthcareWorkflowCategory | 'all'>('all');
  const [selectedCompliance, setSelectedCompliance] = useState<HealthcareComplianceLevel | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [showPublicOnly, setShowPublicOnly] = useState(true);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'downloads' | 'recent' | 'name'>('rating');
  const [currentPage, setCurrentPage] = useState(1);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 12;

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Search templates when filters change
  useEffect(() => {
    searchTemplates();
  }, [searchQuery, selectedCategory, selectedCompliance, selectedTags, minRating, showPublicOnly, showFeaturedOnly, sortBy, currentPage]);

  const loadTemplates = () => {
    const allTemplates = templateManager.getAllTemplates();
    setTemplates(allTemplates);
  };

  const searchTemplates = () => {
    const filters: TemplateSearchFilters = {
      searchQuery: searchQuery || undefined,
      category: selectedCategory !== 'all' ? [selectedCategory as HealthcareWorkflowCategory] : undefined,
      complianceLevel: selectedCompliance !== 'all' ? [selectedCompliance as HealthcareComplianceLevel] : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      isPublic: showPublicOnly ? true : undefined,
      isFeatured: showFeaturedOnly ? true : undefined
    };

    const results = templateManager.searchTemplates(filters, currentPage, pageSize);
    setSearchResults(results);
  };

  const handleTemplateSelect = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    onSelectTemplate?.(template);
  };

  const handleTemplateDownload = (template: WorkflowTemplate) => {
    templateManager.downloadTemplate(template.id);
    // Refresh templates to update download count
    loadTemplates();
  };

  const handleTemplateImport = () => {
    if (!importData.trim()) return;

    const template = templateManager.importTemplate(importData);
    if (template) {
      onImportTemplate?.(template);
      setIsImportDialogOpen(false);
      setImportData('');
      loadTemplates();
    }
  };

  const handleTemplateClone = (template: WorkflowTemplate) => {
    const cloned = templateManager.cloneTemplate(
      template.id,
      `${template.name} (Copy)`,
      'Current User'
    );
    if (cloned) {
      loadTemplates();
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCompliance('all');
    setSelectedTags([]);
    setMinRating(0);
    setShowPublicOnly(true);
    setShowFeaturedOnly(false);
    setCurrentPage(1);
  };

  const categories = templateManager.getCategories();
  const complianceLevels: HealthcareComplianceLevel[] = ['basic', 'hipaa', 'fda', 'iso27001', 'soc2', 'custom'];
  
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    templates.forEach(template => {
      template.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [templates]);

  const featuredTemplates = templateManager.getFeaturedTemplates();
  const popularTemplates = templateManager.getPopularTemplates(6);
  const recentTemplates = templateManager.getRecentTemplates(6);

  const displayTemplates = searchResults?.templates || templates;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Templates</h2>
          <p className="text-muted-foreground">
            Browse and import pre-built healthcare workflow templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Workflow Template</DialogTitle>
                <DialogDescription>
                  Paste the JSON template data to import a new workflow template.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste template JSON here..."
                  className="w-full h-32 p-3 border rounded-md resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleTemplateImport} disabled={!importData.trim()}>
                    Import Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {Object.values({ selectedCategory, selectedCompliance, selectedTags, minRating, showPublicOnly, showFeaturedOnly }).some(v => 
              Array.isArray(v) ? v.length > 0 : v !== 'all' && v !== 0 && v !== true
            ) && (
              <Badge variant="secondary" className="ml-1">
                Active
              </Badge>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Compliance Level</label>
              <Select value={selectedCompliance} onValueChange={(value) => setSelectedCompliance(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {complianceLevels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {allTags.slice(0, 10).map(tag => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTags([...selectedTags, tag]);
                        } else {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        }
                      }}
                    />
                    <label htmlFor={tag} className="text-sm">
                      {tag}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Min Rating</label>
              <Select value={minRating.toString()} onValueChange={(value) => setMinRating(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Rating</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public-only"
                  checked={showPublicOnly}
                  onCheckedChange={(checked) => setShowPublicOnly(!!checked)}
                />
                <label htmlFor="public-only" className="text-sm">
                  Public Only
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured-only"
                  checked={showFeaturedOnly}
                  onCheckedChange={(checked) => setShowFeaturedOnly(!!checked)}
                />
                <label htmlFor="featured-only" className="text-sm">
                  Featured Only
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <TemplateGrid
            templates={displayTemplates}
            onSelect={handleTemplateSelect}
            onDownload={handleTemplateDownload}
            onClone={handleTemplateClone}
          />
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <TemplateGrid
            templates={featuredTemplates}
            onSelect={handleTemplateSelect}
            onDownload={handleTemplateDownload}
            onClone={handleTemplateClone}
          />
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <TemplateGrid
            templates={popularTemplates}
            onSelect={handleTemplateSelect}
            onDownload={handleTemplateDownload}
            onClone={handleTemplateClone}
          />
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <TemplateGrid
            templates={recentTemplates}
            onSelect={handleTemplateSelect}
            onDownload={handleTemplateDownload}
            onClone={handleTemplateClone}
          />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {searchResults && searchResults.totalCount > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, searchResults.totalCount)} of {searchResults.totalCount} templates
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {Math.ceil(searchResults.totalCount / pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(Math.ceil(searchResults.totalCount / pageSize), currentPage + 1))}
              disabled={!searchResults.hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Template Details Dialog */}
      {selectedTemplate && (
        <TemplateDetailsDialog
          template={selectedTemplate}
          open={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onSelect={() => {
            handleTemplateSelect(selectedTemplate);
            setSelectedTemplate(null);
          }}
          onDownload={() => {
            handleTemplateDownload(selectedTemplate);
            setSelectedTemplate(null);
          }}
          onClone={() => {
            handleTemplateClone(selectedTemplate);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
}

interface TemplateGridProps {
  templates: WorkflowTemplate[];
  onSelect: (template: WorkflowTemplate) => void;
  onDownload: (template: WorkflowTemplate) => void;
  onClone: (template: WorkflowTemplate) => void;
}

function TemplateGrid({ templates, onSelect, onDownload, onClone }: TemplateGridProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No templates found</p>
          <p className="text-sm">Try adjusting your search criteria or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {templates.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          onSelect={() => onSelect(template)}
          onDownload={() => onDownload(template)}
          onClone={() => onClone(template)}
        />
      ))}
    </div>
  );
}

interface TemplateCardProps {
  template: WorkflowTemplate;
  onSelect: () => void;
  onDownload: () => void;
  onClone: () => void;
}

function TemplateCard({ template, onSelect, onDownload, onClone }: TemplateCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg line-clamp-2">{template.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
          {template.isFeatured && (
            <Badge variant="secondary" className="ml-2">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {template.category.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge variant="outline">
            {template.healthcareComplianceLevel.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{template.rating}</span>
            <span>({template.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            <span>{template.downloadCount}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          by {template.author} • v{template.version}
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex items-center gap-2 w-full">
          <Button onClick={onSelect} className="flex-1">
            Use Template
          </Button>
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onClone}>
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

interface TemplateDetailsDialogProps {
  template: WorkflowTemplate;
  open: boolean;
  onClose: () => void;
  onSelect: () => void;
  onDownload: () => void;
  onClone: () => void;
}

function TemplateDetailsDialog({ template, open, onClose, onSelect, onDownload, onClone }: TemplateDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{template.name}</DialogTitle>
              <DialogDescription className="text-base mt-2">
                {template.description}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {template.isFeatured && (
                <Badge variant="secondary">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              <Badge variant="outline">
                {template.healthcareComplianceLevel.toUpperCase()}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <p className="text-sm">{template.category.replace('_', ' ').toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Version</p>
              <p className="text-sm">v{template.version}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Author</p>
              <p className="text-sm">{template.author}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Downloads</p>
              <p className="text-sm">{template.downloadCount.toLocaleString()}</p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {template.tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Dependencies */}
          {template.dependencies.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Dependencies</p>
              <div className="space-y-2">
                {template.dependencies.map(dep => (
                  <div key={dep.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="text-sm font-medium">{dep.name}</p>
                      <p className="text-xs text-muted-foreground">{dep.description}</p>
                    </div>
                    <Badge variant={dep.required ? "destructive" : "secondary"}>
                      {dep.required ? "Required" : "Optional"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examples */}
          {template.examples && template.examples.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Examples</p>
              <div className="space-y-3">
                {template.examples.map((example, index) => (
                  <div key={index} className="p-3 border rounded">
                    <p className="text-sm font-medium">{example.name}</p>
                    <p className="text-xs text-muted-foreground">{example.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button onClick={onSelect} className="flex-1">
              Use This Template
            </Button>
            <Button variant="outline" onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={onClone}>
              <Eye className="w-4 h-4 mr-2" />
              Clone
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
