/**
 * Dashboard Builder Component - Drag-and-drop dashboard customization
 * Healthcare-focused dashboard builder with compliance validation
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Save, 
  Share, 
  Settings, 
  Eye, 
  Grid, 
  Layout, 
  Palette,
  Shield,
  Accessibility,
  Search,
  Filter,
  Drag,
  GripVertical,
  X,
  Copy,
  Trash2
} from 'lucide-react';
import { 
  Dashboard, 
  DashboardConfig, 
  DashboardWidget, 
  WidgetDefinition,
  WidgetPosition,
  WidgetSize,
  DragDropState,
  DropZone
} from '@/types/dashboard/dashboard-types';
import { DashboardBuilderService } from '@/lib/dashboard/dashboard-builder';
import { WidgetLibraryService } from '@/lib/dashboard/widget-library';

interface DashboardBuilderProps {
  organizationId: string;
  dashboardId?: string;
  onSave?: (dashboard: Dashboard) => void;
  onCancel?: () => void;
}

export function DashboardBuilder({ organizationId, dashboardId, onSave, onCancel }: DashboardBuilderProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<WidgetDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragDropState, setDragDropState] = useState<DragDropState>({
    isDragging: false,
    draggedWidget: null,
    dragSource: null,
    dropTarget: null,
    dragPreview: null,
    constraints: {
      min_width: 2,
      min_height: 2,
      max_width: 12,
      max_height: 8,
      snap_to_grid: true,
      grid_size: 1,
      healthcare_compliant: true,
      accessibility_enhanced: true
    }
  });
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);

  const dashboardBuilder = new DashboardBuilderService();
  const widgetLibrary = new WidgetLibraryService();

  useEffect(() => {
    loadData();
  }, [dashboardId, organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load widgets
      const widgetData = await widgetLibrary.getWidgets();
      setWidgets(widgetData);

      // Load dashboard if editing
      if (dashboardId) {
        const dashboardData = await dashboardBuilder.getDashboard(dashboardId);
        setDashboard(dashboardData);
      } else {
        // Create new dashboard
        const newDashboard = await dashboardBuilder.createDashboard(organizationId, {
          name: 'New Dashboard',
          description: 'A new healthcare dashboard',
          layout_type: 'grid',
          columns: 12,
          rows: 8,
          responsive: true,
          healthcare_optimized: true,
          accessibility_enhanced: true,
          theme_id: 'default-healthcare-theme',
          custom_css: '',
          custom_js: ''
        });
        setDashboard(newDashboard);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, widget: WidgetDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify(widget));
    setDragDropState(prev => ({
      ...prev,
      isDragging: true,
      draggedWidget: widget as any,
      dragSource: 'widget-library'
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent, dropZone: DropZone) => {
    e.preventDefault();
    
    try {
      const widgetData = JSON.parse(e.dataTransfer.getData('application/json')) as WidgetDefinition;
      
      // Create new widget instance
      const newWidget: DashboardWidget = {
        id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: widgetData.id,
        title: widgetData.name,
        description: widgetData.description,
        component: widgetData.component,
        settings: widgetData.default_settings,
        healthcare_optimized: widgetData.healthcare_optimized,
        compliance_required: widgetData.compliance_required,
        position: {
          x: dropZone.position.x,
          y: dropZone.position.y,
          z_index: 1,
          locked: false
        },
        size: {
          width: 4,
          height: 3,
          min_width: 2,
          min_height: 2,
          max_width: 12,
          max_height: 8,
          resizable: true
        },
        permissions: widgetData.permissions,
        data_source: {
          type: 'api',
          healthcare_data: widgetData.data_requirements.healthcare_data,
          compliance_required: widgetData.compliance_required,
          encryption_required: widgetData.data_requirements.encryption_required,
          audit_required: widgetData.data_requirements.audit_required
        },
        refresh_interval: widgetData.data_requirements.refresh_frequency,
        last_updated: new Date().toISOString()
      };

      // Add widget to dashboard
      if (dashboard) {
        const updatedDashboard = {
          ...dashboard,
          widgets: [...dashboard.widgets, newWidget],
          layout: {
            ...dashboard.layout,
            widgets: [...dashboard.layout.widgets, newWidget]
          }
        };
        setDashboard(updatedDashboard);
      }
    } catch (err) {
      console.error('Failed to add widget:', err);
      setError('Failed to add widget to dashboard');
    } finally {
      setDragDropState(prev => ({
        ...prev,
        isDragging: false,
        draggedWidget: null,
        dragSource: null,
        dropTarget: null,
        dragPreview: null
      }));
    }
  };

  const handleWidgetMove = (widgetId: string, newPosition: WidgetPosition) => {
    if (!dashboard) return;

    const updatedWidgets = dashboard.widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, position: newPosition }
        : widget
    );

    setDashboard({
      ...dashboard,
      widgets: updatedWidgets,
      layout: {
        ...dashboard.layout,
        widgets: updatedWidgets
      }
    });
  };

  const handleWidgetResize = (widgetId: string, newSize: WidgetSize) => {
    if (!dashboard) return;

    const updatedWidgets = dashboard.widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, size: newSize }
        : widget
    );

    setDashboard({
      ...dashboard,
      widgets: updatedWidgets,
      layout: {
        ...dashboard.layout,
        widgets: updatedWidgets
      }
    });
  };

  const handleWidgetRemove = (widgetId: string) => {
    if (!dashboard) return;

    const updatedWidgets = dashboard.widgets.filter(widget => widget.id !== widgetId);
    setDashboard({
      ...dashboard,
      widgets: updatedWidgets,
      layout: {
        ...dashboard.layout,
        widgets: updatedWidgets
      }
    });
  };

  const handleSave = async () => {
    if (!dashboard) return;

    try {
      const savedDashboard = await dashboardBuilder.updateDashboard(dashboard.id, dashboard.config);
      onSave?.(savedDashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save dashboard');
    }
  };

  const filteredWidgets = widgets.filter(widget => {
    const matchesSearch = widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         widget.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || widget.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <X className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center">
          <X className="w-5 h-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800">Dashboard not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-900">Dashboard Builder</h2>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Shield className="w-3 h-3 mr-1" />
            Healthcare Optimized
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Accessibility className="w-3 h-3 mr-1" />
            Accessible
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Widget Library Sidebar */}
        <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Widget Library</h3>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search widgets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="workflow">Workflow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              {filteredWidgets.map((widget) => (
                <Card
                  key={widget.id}
                  className="cursor-move hover:shadow-md transition-shadow"
                  draggable
                  onDragStart={(e) => handleDragStart(e, widget)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Grid className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {widget.name}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {widget.description}
                        </p>
                        <div className="flex items-center space-x-1 mt-2">
                          {widget.healthcare_optimized && (
                            <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                              <Shield className="w-2 h-2 mr-1" />
                              Healthcare
                            </Badge>
                          )}
                          {widget.compliance_required && (
                            <Badge variant="outline" className="text-purple-600 border-purple-600 text-xs">
                              Compliance
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Dashboard Canvas */}
        <div className="flex-1 p-4 bg-gray-100">
          <div className="h-full">
            <div className="mb-4">
              <Input
                value={dashboard.config.name}
                onChange={(e) => setDashboard({
                  ...dashboard,
                  config: { ...dashboard.config, name: e.target.value }
                })}
                className="text-lg font-semibold border-none bg-transparent p-0"
                placeholder="Dashboard Name"
              />
              <Input
                value={dashboard.config.description}
                onChange={(e) => setDashboard({
                  ...dashboard,
                  config: { ...dashboard.config, description: e.target.value }
                })}
                className="text-sm text-gray-600 border-none bg-transparent p-0 mt-1"
                placeholder="Dashboard Description"
              />
            </div>

            <div
              className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 min-h-96 p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, {
                id: 'main-canvas',
                type: 'region',
                position: { x: 0, y: 0, width: 12, height: 8 },
                accepts: ['healthcare', 'compliance', 'analytics', 'workflow'],
                healthcare_required: true,
                compliance_required: true
              })}
            >
              <div className="grid grid-cols-12 gap-4 h-full">
                {dashboard.widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                    style={{
                      gridColumn: `span ${widget.size.width}`,
                      gridRow: `span ${widget.size.height}`
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{widget.title}</h4>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleWidgetRemove(widget.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {widget.description}
                    </div>
                    <div className="flex items-center space-x-1 mt-2">
                      {widget.healthcare_optimized && (
                        <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                          <Shield className="w-2 h-2 mr-1" />
                          Healthcare
                        </Badge>
                      )}
                      {widget.compliance_required && (
                        <Badge variant="outline" className="text-purple-600 border-purple-600 text-xs">
                          Compliance
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {dashboard.widgets.length === 0 && (
                  <div className="col-span-12 flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <Grid className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Drag widgets here to build your dashboard</p>
                      <p className="text-sm">Start by dragging a widget from the library on the left</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
