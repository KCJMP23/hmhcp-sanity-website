'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Calendar, Database, Download, Filter, LineChart, Mail, Settings, Shield, Users } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'

interface HealthcareMetric {
  id: string
  name: string
  description: string
  category: 'patient_engagement' | 'clinical_content' | 'compliance' | 'performance'
  dataType: 'number' | 'percentage' | 'time' | 'count'
  hipaaRelevant: boolean
  icon: React.ReactNode
}

interface ReportBuilderProps {
  onSave: (reportConfig: any) => void
  onPreview: (reportConfig: any) => void
  initialReport?: any
  availableTemplates?: any[]
}

const HEALTHCARE_METRICS: HealthcareMetric[] = [
  {
    id: 'patient_engagement_rate',
    name: 'Patient Engagement Rate',
    description: 'Percentage of patients actively engaging with healthcare content',
    category: 'patient_engagement',
    dataType: 'percentage',
    hipaaRelevant: true,
    icon: <Users className="w-4 h-4" />
  },
  {
    id: 'healthcare_topic_relevance',
    name: 'Healthcare Topic Relevance',
    description: 'Relevance score for medical and healthcare content',
    category: 'clinical_content',
    dataType: 'number',
    hipaaRelevant: false,
    icon: <Database className="w-4 h-4" />
  },
  {
    id: 'compliance_score',
    name: 'HIPAA Compliance Score',
    description: 'Overall compliance rating for content and processes',
    category: 'compliance',
    dataType: 'percentage',
    hipaaRelevant: true,
    icon: <Shield className="w-4 h-4" />
  },
  {
    id: 'patient_journey_progression',
    name: 'Patient Journey Progression',
    description: 'Movement through awareness, consideration, decision stages',
    category: 'patient_engagement',
    dataType: 'count',
    hipaaRelevant: true,
    icon: <LineChart className="w-4 h-4" />
  },
  {
    id: 'clinical_resource_downloads',
    name: 'Clinical Resource Downloads',
    description: 'Downloads of whitepapers, clinical guides, and research',
    category: 'clinical_content',
    dataType: 'count',
    hipaaRelevant: false,
    icon: <Download className="w-4 h-4" />
  },
  {
    id: 'consultation_requests',
    name: 'Consultation Requests',
    description: 'Number of consultation and appointment requests',
    category: 'patient_engagement',
    dataType: 'count',
    hipaaRelevant: true,
    icon: <Calendar className="w-4 h-4" />
  },
  {
    id: 'page_load_performance',
    name: 'Page Load Performance',
    description: 'Average page load times for healthcare content',
    category: 'performance',
    dataType: 'time',
    hipaaRelevant: false,
    icon: <LineChart className="w-4 h-4" />
  },
  {
    id: 'pii_security_incidents',
    name: 'PII Security Incidents',
    description: 'Number of potential privacy incidents detected',
    category: 'compliance',
    dataType: 'count',
    hipaaRelevant: true,
    icon: <AlertTriangle className="w-4 h-4" />
  }
]

const HEALTHCARE_DIMENSIONS = [
  { id: 'patient_journey_stage', name: 'Patient Journey Stage', hipaaRelevant: true },
  { id: 'healthcare_specialty', name: 'Healthcare Specialty', hipaaRelevant: false },
  { id: 'patient_persona', name: 'Patient Persona', hipaaRelevant: true },
  { id: 'device_type', name: 'Device Type', hipaaRelevant: false },
  { id: 'content_type', name: 'Content Type', hipaaRelevant: false },
  { id: 'urgency_level', name: 'Urgency Level', hipaaRelevant: true },
  { id: 'compliance_level', name: 'Compliance Level', hipaaRelevant: true },
  { id: 'geographic_region', name: 'Geographic Region', hipaaRelevant: false }
]

const CHART_TYPES = [
  { id: 'line', name: 'Line Chart', icon: '📈' },
  { id: 'bar', name: 'Bar Chart', icon: '📊' },
  { id: 'pie', name: 'Pie Chart', icon: '🥧' },
  { id: 'table', name: 'Data Table', icon: '📋' },
  { id: 'gauge', name: 'Gauge Chart', icon: '🎯' },
  { id: 'heatmap', name: 'Heat Map', icon: '🔥' },
  { id: 'funnel', name: 'Funnel Chart', icon: '⏺️' },
  { id: 'timeline', name: 'Timeline', icon: '⏰' }
]

export default function ReportBuilder({ onSave, onPreview, initialReport, availableTemplates }: ReportBuilderProps) {
  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    category: 'healthcare',
    report_type: 'dashboard',
    metrics: [] as string[],
    dimensions: [] as string[],
    chart_types: [] as string[],
    filters: {},
    date_range: { type: 'last_30_days' },
    hipaa_compliant: true,
    patient_data_included: false,
    phi_scrubbed: true,
    compliance_notes: '',
    visibility: 'private',
    color_scheme: 'healthcare_professional',
    is_scheduled: false,
    schedule_config: {
      frequency: 'weekly',
      delivery_method: 'email',
      recipients: []
    }
  })

  const [activeTab, setActiveTab] = useState('basic')
  const [draggedMetrics, setDraggedMetrics] = useState<HealthcareMetric[]>([])

  useEffect(() => {
    if (initialReport) {
      setReportConfig(initialReport)
      // Convert metrics to dragged format
      const selectedMetrics = HEALTHCARE_METRICS.filter(m => 
        initialReport.metrics.includes(m.id)
      )
      setDraggedMetrics(selectedMetrics)
    }
  }, [initialReport])

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, type } = result

    if (!destination) return

    if (type === 'metrics') {
      if (source.droppableId === 'available-metrics' && destination.droppableId === 'selected-metrics') {
        const metric = HEALTHCARE_METRICS[source.index]
        if (!draggedMetrics.find(m => m.id === metric.id)) {
          setDraggedMetrics([...draggedMetrics, metric])
          setReportConfig(prev => ({
            ...prev,
            metrics: [...prev.metrics, metric.id]
          }))
        }
      } else if (source.droppableId === 'selected-metrics' && destination.droppableId === 'selected-metrics') {
        const items = Array.from(draggedMetrics)
        const [reorderedItem] = items.splice(source.index, 1)
        items.splice(destination.index, 0, reorderedItem)
        setDraggedMetrics(items)
        setReportConfig(prev => ({
          ...prev,
          metrics: items.map(item => item.id)
        }))
      } else if (source.droppableId === 'selected-metrics' && destination.droppableId === 'available-metrics') {
        const items = Array.from(draggedMetrics)
        items.splice(source.index, 1)
        setDraggedMetrics(items)
        setReportConfig(prev => ({
          ...prev,
          metrics: items.map(item => item.id)
        }))
      }
    }
  }

  const removeMetric = (metricId: string) => {
    setDraggedMetrics(prev => prev.filter(m => m.id !== metricId))
    setReportConfig(prev => ({
      ...prev,
      metrics: prev.metrics.filter(id => id !== metricId)
    }))
  }

  const toggleDimension = (dimensionId: string) => {
    setReportConfig(prev => ({
      ...prev,
      dimensions: prev.dimensions.includes(dimensionId)
        ? prev.dimensions.filter(id => id !== dimensionId)
        : [...prev.dimensions, dimensionId]
    }))
  }

  const toggleChartType = (chartType: string) => {
    setReportConfig(prev => ({
      ...prev,
      chart_types: prev.chart_types.includes(chartType)
        ? prev.chart_types.filter(type => type !== chartType)
        : [...prev.chart_types, chartType]
    }))
  }

  const handleSave = () => {
    onSave(reportConfig)
  }

  const handlePreview = () => {
    onPreview(reportConfig)
  }

  const loadTemplate = (template: any) => {
    setReportConfig({
      ...reportConfig,
      ...template,
      name: `${template.name} - Custom`
    })
    
    const templateMetrics = HEALTHCARE_METRICS.filter(m => 
      template.metrics.includes(m.id)
    )
    setDraggedMetrics(templateMetrics)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Healthcare Report Builder</h1>
          <p className="text-gray-600 mt-2">Create HIPAA-compliant custom reports with drag-and-drop healthcare metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            Preview Report
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Save Report
          </Button>
        </div>
      </div>

      {/* HIPAA Compliance Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">HIPAA Compliance Enabled</span>
          </div>
          <p className="text-blue-600 text-sm mt-1">
            All healthcare reports automatically include PHI scrubbing and data anonymization
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="metrics">Metrics & Dimensions</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Basic information and report settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Report Name</Label>
                  <Input
                    id="name"
                    value={reportConfig.name}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Healthcare Performance Dashboard"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={reportConfig.category} onValueChange={(value) => 
                    setReportConfig(prev => ({ ...prev, category: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="conversion">Conversion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={reportConfig.description}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Comprehensive healthcare analytics dashboard for patient engagement and clinical content performance..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report_type">Report Type</Label>
                  <Select value={reportConfig.report_type} onValueChange={(value) => 
                    setReportConfig(prev => ({ ...prev, report_type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Interactive Dashboard</SelectItem>
                      <SelectItem value="scheduled_report">Scheduled Report</SelectItem>
                      <SelectItem value="export">Export Only</SelectItem>
                      <SelectItem value="alert">Alert-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select value={reportConfig.visibility} onValueChange={(value) => 
                    setReportConfig(prev => ({ ...prev, visibility: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="shared">Shared with Team</SelectItem>
                      <SelectItem value="role_based">Role-based Access</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Healthcare Report Templates */}
              {availableTemplates && availableTemplates.length > 0 && (
                <div className="space-y-3">
                  <Label>Healthcare Report Templates</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {availableTemplates.map((template) => (
                      <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => loadTemplate(template)}>
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-sm">{template.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {template.category}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics & Dimensions Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-2 gap-6">
              {/* Available Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Available Healthcare Metrics
                  </CardTitle>
                  <CardDescription>Drag metrics to your report</CardDescription>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId="available-metrics" type="metrics">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2 min-h-[400px]"
                      >
                        {HEALTHCARE_METRICS.map((metric, index) => (
                          <Draggable key={metric.id} draggableId={metric.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 border rounded-lg cursor-move transition-all ${
                                  snapshot.isDragging ? 'shadow-lg bg-blue-50' : 'hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {metric.icon}
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{metric.name}</h4>
                                    <p className="text-xs text-gray-600">{metric.description}</p>
                                  </div>
                                  {metric.hipaaRelevant && (
                                    <Badge variant="outline" className="text-xs">
                                      <Shield className="w-3 h-3 mr-1" />
                                      HIPAA
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>

              {/* Selected Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-5 h-5" />
                    Selected Metrics ({draggedMetrics.length})
                  </CardTitle>
                  <CardDescription>Your report will include these metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId="selected-metrics" type="metrics">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2 min-h-[400px]"
                      >
                        {draggedMetrics.length === 0 ? (
                          <div className="text-center text-gray-500 py-20">
                            <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Drag healthcare metrics here</p>
                          </div>
                        ) : (
                          draggedMetrics.map((metric, index) => (
                            <Draggable key={metric.id} draggableId={metric.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-3 border rounded-lg transition-all ${
                                    snapshot.isDragging ? 'shadow-lg bg-green-50' : 'bg-green-50 border-green-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {metric.icon}
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm">{metric.name}</h4>
                                      <p className="text-xs text-gray-600">{metric.description}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeMetric(metric.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      ×
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>
          </DragDropContext>

          {/* Dimensions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Report Dimensions
              </CardTitle>
              <CardDescription>Select dimensions to break down your metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {HEALTHCARE_DIMENSIONS.map((dimension) => (
                  <div
                    key={dimension.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      reportConfig.dimensions.includes(dimension.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => toggleDimension(dimension.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dimension.name}</span>
                      {dimension.hipaaRelevant && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          HIPAA
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visualization Tab */}
        <TabsContent value="visualization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chart Types</CardTitle>
              <CardDescription>Select visualization types for your healthcare data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {CHART_TYPES.map((chart) => (
                  <div
                    key={chart.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all text-center ${
                      reportConfig.chart_types.includes(chart.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => toggleChartType(chart.id)}
                  >
                    <div className="text-2xl mb-2">{chart.icon}</div>
                    <span className="text-sm font-medium">{chart.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visual Settings</CardTitle>
              <CardDescription>Customize the appearance of your healthcare report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="color_scheme">Color Scheme</Label>
                <Select value={reportConfig.color_scheme} onValueChange={(value) => 
                  setReportConfig(prev => ({ ...prev, color_scheme: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthcare_professional">Healthcare Professional</SelectItem>
                    <SelectItem value="clinical_blue">Clinical Blue</SelectItem>
                    <SelectItem value="medical_green">Medical Green</SelectItem>
                    <SelectItem value="accessibility_high_contrast">High Contrast (Accessibility)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_range">Default Date Range</Label>
                <Select 
                  value={reportConfig.date_range.type} 
                  onValueChange={(value) => 
                    setReportConfig(prev => ({ 
                      ...prev, 
                      date_range: { ...prev.date_range, type: value } 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                    <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                    <SelectItem value="last_year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Shield className="w-5 h-5" />
                HIPAA Compliance Settings
              </CardTitle>
              <CardDescription>Healthcare data protection and privacy controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="hipaa_compliant">HIPAA Compliant Report</Label>
                  <p className="text-sm text-gray-600">Enable HIPAA compliance features and data protection</p>
                </div>
                <Switch
                  id="hipaa_compliant"
                  checked={reportConfig.hipaa_compliant}
                  onCheckedChange={(checked) => 
                    setReportConfig(prev => ({ ...prev, hipaa_compliant: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="patient_data_included">Contains Patient Data</Label>
                  <p className="text-sm text-gray-600">Report includes patient-related information</p>
                </div>
                <Switch
                  id="patient_data_included"
                  checked={reportConfig.patient_data_included}
                  onCheckedChange={(checked) => 
                    setReportConfig(prev => ({ ...prev, patient_data_included: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="phi_scrubbed">PHI Scrubbed</Label>
                  <p className="text-sm text-gray-600">Automatically remove personally identifiable information</p>
                </div>
                <Switch
                  id="phi_scrubbed"
                  checked={reportConfig.phi_scrubbed}
                  onCheckedChange={(checked) => 
                    setReportConfig(prev => ({ ...prev, phi_scrubbed: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compliance_notes">Compliance Notes</Label>
                <Textarea
                  id="compliance_notes"
                  value={reportConfig.compliance_notes}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, compliance_notes: e.target.value }))}
                  placeholder="Document any specific compliance considerations for this report..."
                  rows={3}
                />
              </div>

              {reportConfig.hipaa_compliant && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">HIPAA Compliance Features Enabled:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ Automatic PHI scrubbing and data anonymization</li>
                    <li>✓ Geographic data limited to region level</li>
                    <li>✓ Session and user IDs hashed</li>
                    <li>✓ Audit trail for all report access</li>
                    <li>✓ Role-based access controls</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling Tab */}
        <TabsContent value="scheduling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Report Scheduling
              </CardTitle>
              <CardDescription>Automate report generation and delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_scheduled">Enable Scheduled Reports</Label>
                  <p className="text-sm text-gray-600">Automatically generate and deliver reports</p>
                </div>
                <Switch
                  id="is_scheduled"
                  checked={reportConfig.is_scheduled}
                  onCheckedChange={(checked) => 
                    setReportConfig(prev => ({ ...prev, is_scheduled: checked }))
                  }
                />
              </div>

              {reportConfig.is_scheduled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select 
                        value={reportConfig.schedule_config.frequency} 
                        onValueChange={(value) => 
                          setReportConfig(prev => ({ 
                            ...prev, 
                            schedule_config: { ...prev.schedule_config, frequency: value }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delivery_method">Delivery Method</Label>
                      <Select 
                        value={reportConfig.schedule_config.delivery_method} 
                        onValueChange={(value) => 
                          setReportConfig(prev => ({ 
                            ...prev, 
                            schedule_config: { ...prev.schedule_config, delivery_method: value }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Email
                            </div>
                          </SelectItem>
                          <SelectItem value="slack">Slack</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="download">Download Portal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {reportConfig.schedule_config.delivery_method === 'email' && (
                    <div className="space-y-2">
                      <Label htmlFor="recipients">Email Recipients</Label>
                      <Textarea
                        id="recipients"
                        placeholder="Enter email addresses, one per line"
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Scheduled Healthcare Reports:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Reports will be generated with latest HIPAA-compliant data</li>
                      <li>• All PHI will be automatically scrubbed before delivery</li>
                      <li>• Delivery logs maintained for compliance auditing</li>
                      <li>• Recipients must have appropriate role permissions</li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}