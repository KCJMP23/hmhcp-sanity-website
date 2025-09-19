// Custom Report Builder Component
// Story: 4.6 - Advanced Reporting & Business Intelligence

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Download, 
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  TrendingUp
} from 'lucide-react';
import type { 
  CustomReportTemplate, 
  ReportTemplateDefinition,
  DataSource,
  Visualization,
  HealthcareMetrics
} from '@/types/reporting';

interface CustomReportBuilderProps {
  templateId?: string;
  onSave?: (template: CustomReportTemplate) => void;
  onGenerate?: (template: CustomReportTemplate) => void;
  className?: string;
}

export function CustomReportBuilder({ 
  templateId, 
  onSave, 
  onGenerate, 
  className = '' 
}: CustomReportBuilderProps) {
  const [template, setTemplate] = useState<CustomReportTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'executive' as 'executive' | 'compliance' | 'operational' | 'clinical',
    compliance_framework: 'standard'
  });

  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [filters, setFilters] = useState<any[]>([]);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    } else {
      initializeNewTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/reports/templates?id=${templateId}`);
      if (!response.ok) throw new Error('Failed to load template');
      
      const data = await response.json();
      const loadedTemplate = data.template;
      
      setTemplate(loadedTemplate);
      setFormData({
        name: loadedTemplate.name,
        description: loadedTemplate.description || '',
        category: loadedTemplate.category,
        compliance_framework: loadedTemplate.compliance_framework
      });
      
      if (loadedTemplate.template_definition) {
        setDataSources(loadedTemplate.template_definition.data_sources || []);
        setVisualizations(loadedTemplate.template_definition.visualizations || []);
        setFilters(loadedTemplate.template_definition.filters || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const initializeNewTemplate = () => {
    setTemplate(null);
    setFormData({
      name: '',
      description: '',
      category: 'executive',
      compliance_framework: 'standard'
    });
    setDataSources([]);
    setVisualizations([]);
    setFilters([]);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const templateDefinition: ReportTemplateDefinition = {
        data_sources: dataSources,
        visualizations: visualizations,
        filters: filters,
        layout: {
          columns: 2,
          rows: 2,
          theme: 'healthcare'
        }
      };

      const templateData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        template_definition: templateDefinition,
        compliance_framework: formData.compliance_framework
      };

      const response = await fetch('/api/admin/analytics/reports/templates', {
        method: templateId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateId ? { id: templateId, ...templateData } : templateData)
      });

      if (!response.ok) throw new Error('Failed to save template');
      
      const data = await response.json();
      setTemplate(data.template);
      setIsEditing(false);
      onSave?.(data.template);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!template) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics/reports/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_report',
          template_id: template.id,
          format: 'pdf',
          include_ai_insights: true
        })
      });

      if (!response.ok) throw new Error('Failed to generate report');
      
      const data = await response.json();
      onGenerate?.(template);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const addDataSource = () => {
    const newDataSource: DataSource = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Data Source ${dataSources.length + 1}`,
      type: 'database',
      healthcare_compliance_level: 'standard'
    };
    setDataSources([...dataSources, newDataSource]);
  };

  const updateDataSource = (id: string, updates: Partial<DataSource>) => {
    setDataSources(dataSources.map(ds => 
      ds.id === id ? { ...ds, ...updates } : ds
    ));
  };

  const removeDataSource = (id: string) => {
    setDataSources(dataSources.filter(ds => ds.id !== id));
    setVisualizations(visualizations.filter(viz => viz.data_source_id !== id));
  };

  const addVisualization = () => {
    const newVisualization: Visualization = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'chart',
      title: `Visualization ${visualizations.length + 1}`,
      data_source_id: dataSources[0]?.id || '',
      config: { chart_type: 'bar' },
      position: { x: 0, y: 0, width: 200, height: 150 }
    };
    setVisualizations([...visualizations, newVisualization]);
  };

  const updateVisualization = (id: string, updates: Partial<Visualization>) => {
    setVisualizations(visualizations.map(viz => 
      viz.id === id ? { ...viz, ...updates } : viz
    ));
  };

  const removeVisualization = (id: string) => {
    setVisualizations(visualizations.filter(viz => viz.id !== id));
  };

  if (loading && !template) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {templateId ? 'Edit Report Template' : 'Create Custom Report'}
        </h1>
        <p className="text-gray-600">Build healthcare-specific reports with drag-and-drop interface</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Template Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Report Configuration</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Report Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter report name"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="clinical">Clinical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!isEditing}
                placeholder="Describe the report purpose and use cases"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Data Sources</span>
            <Button onClick={addDataSource} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Data Source
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dataSources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No data sources configured</p>
              <p className="text-sm">Add a data source to begin building your report</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dataSources.map((ds) => (
                <DataSourceEditor
                  key={ds.id}
                  dataSource={ds}
                  onUpdate={(updates) => updateDataSource(ds.id, updates)}
                  onRemove={() => removeDataSource(ds.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visualizations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Visualizations</span>
            <Button 
              onClick={addVisualization} 
              size="sm"
              disabled={dataSources.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Visualization
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visualizations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No visualizations configured</p>
              <p className="text-sm">Add visualizations to display your data</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visualizations.map((viz) => (
                <VisualizationEditor
                  key={viz.id}
                  visualization={viz}
                  dataSources={dataSources}
                  onUpdate={(updates) => updateVisualization(viz.id, updates)}
                  onRemove={() => removeVisualization(viz.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading || !formData.name}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Template'}
        </Button>
        {template && (
          <Button
            onClick={handleGenerate}
            disabled={loading}
            variant="default"
          >
            <Play className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        )}
      </div>
    </div>
  );
}

interface DataSourceEditorProps {
  dataSource: DataSource;
  onUpdate: (updates: Partial<DataSource>) => void;
  onRemove: () => void;
}

function DataSourceEditor({ dataSource, onUpdate, onRemove }: DataSourceEditorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Data Source</CardTitle>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Name</Label>
          <Input
            value={dataSource.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Data source name"
          />
        </div>
        <div>
          <Label>Type</Label>
          <Select
            value={dataSource.type}
            onValueChange={(value: any) => onUpdate({ type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="database">Database</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="file">File</SelectItem>
              <SelectItem value="ai_insights">AI Insights</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Compliance Level</Label>
          <Select
            value={dataSource.healthcare_compliance_level}
            onValueChange={(value: any) => onUpdate({ healthcare_compliance_level: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="enhanced">Enhanced</SelectItem>
              <SelectItem value="expert_review">Expert Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

interface VisualizationEditorProps {
  visualization: Visualization;
  dataSources: DataSource[];
  onUpdate: (updates: Partial<Visualization>) => void;
  onRemove: () => void;
}

function VisualizationEditor({ visualization, dataSources, onUpdate, onRemove }: VisualizationEditorProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'chart': return <BarChart3 className="h-4 w-4" />;
      case 'table': return <Table className="h-4 w-4" />;
      case 'metric': return <TrendingUp className="h-4 w-4" />;
      case 'kpi': return <TrendingUp className="h-4 w-4" />;
      case 'trend': return <LineChart className="h-4 w-4" />;
      default: return <PieChart className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            {getIcon(visualization.type)}
            <span className="ml-2">Visualization</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Title</Label>
          <Input
            value={visualization.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Visualization title"
          />
        </div>
        <div>
          <Label>Type</Label>
          <Select
            value={visualization.type}
            onValueChange={(value: any) => onUpdate({ type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chart">Chart</SelectItem>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="metric">Metric</SelectItem>
              <SelectItem value="kpi">KPI</SelectItem>
              <SelectItem value="trend">Trend</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Data Source</Label>
          <Select
            value={visualization.data_source_id}
            onValueChange={(value) => onUpdate({ data_source_id: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dataSources.map((ds) => (
                <SelectItem key={ds.id} value={ds.id}>
                  {ds.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
