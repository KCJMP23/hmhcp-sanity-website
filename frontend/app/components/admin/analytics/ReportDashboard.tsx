'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, Clock, Download, Edit, Filter, Mail, MoreHorizontal, 
  Play, Shield, Trash2, Users, Eye, FileText, BarChart3, 
  Activity, TrendingUp, AlertTriangle, CheckCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CustomReport {
  id: string
  name: string
  description?: string
  category: string
  report_type: string
  visibility: string
  hipaa_compliant: boolean
  patient_data_included: boolean
  phi_scrubbed: boolean
  is_scheduled: boolean
  schedule_cron?: string
  delivery_method?: string
  last_generated?: string
  view_count: number
  created_at: string
  updated_at: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: string
  metrics: string[]
  hipaa_compliant: boolean
  is_template: boolean
}

interface ReportDashboardProps {
  onCreateReport: () => void
  onEditReport: (report: CustomReport) => void
  onGenerateReport: (reportId: string, format: string) => void
  onScheduleReport: (reportId: string) => void
  onDeleteReport: (reportId: string) => void
}

export default function ReportDashboard({
  onCreateReport,
  onEditReport,
  onGenerateReport,
  onScheduleReport,
  onDeleteReport
}: ReportDashboardProps) {
  const [reports, setReports] = useState<CustomReport[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    category: 'all',
    type: 'all',
    search: ''
  })
  const [activeTab, setActiveTab] = useState('my-reports')

  useEffect(() => {
    fetchReports()
  }, [filter])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.category !== 'all') params.append('category', filter.category)
      if (filter.type !== 'all') params.append('type', filter.type)
      
      const response = await fetch(`/api/admin/analytics/reports?${params}`, {
        headers: {
          'user-id': 'current-user-id' // This should come from auth context
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setReports(data.data.reports)
        setTemplates(data.data.templates)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = (reportId: string, format: string = 'pdf') => {
    onGenerateReport(reportId, format)
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(filter.search.toLowerCase()) ||
                         report.description?.toLowerCase().includes(filter.search.toLowerCase())
    return matchesSearch
  })

  const reportStats = {
    total: reports.length,
    scheduled: reports.filter(r => r.is_scheduled).length,
    hipaa_compliant: reports.filter(r => r.hipaa_compliant).length,
    last_24h: reports.filter(r => {
      const lastGenerated = r.last_generated ? new Date(r.last_generated) : null
      return lastGenerated && (Date.now() - lastGenerated.getTime()) < 24 * 60 * 60 * 1000
    }).length
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      healthcare: 'bg-blue-100 text-blue-800',
      performance: 'bg-green-100 text-green-800',
      content: 'bg-purple-100 text-purple-800',
      compliance: 'bg-red-100 text-red-800',
      conversion: 'bg-orange-100 text-orange-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      dashboard: <BarChart3 className="w-4 h-4" />,
      scheduled_report: <Calendar className="w-4 h-4" />,
      export: <Download className="w-4 h-4" />,
      alert: <AlertTriangle className="w-4 h-4" />
    }
    return icons[type as keyof typeof icons] || <FileText className="w-4 h-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Healthcare Analytics Reports</h1>
          <p className="text-gray-600 mt-2">Manage HIPAA-compliant custom reports and healthcare analytics</p>
        </div>
        <Button onClick={onCreateReport} className="bg-blue-600 hover:bg-blue-700">
          <FileText className="w-4 h-4 mr-2" />
          Create New Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold">{reportStats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold">{reportStats.scheduled}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">HIPAA Compliant</p>
                <p className="text-2xl font-bold">{reportStats.hipaa_compliant}</p>
              </div>
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Generated Today</p>
                <p className="text-2xl font-bold">{reportStats.last_24h}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search reports..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="max-w-sm"
              />
            </div>
            <Select value={filter.category} onValueChange={(value) => 
              setFilter(prev => ({ ...prev, category: value }))
            }>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="conversion">Conversion</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter.type} onValueChange={(value) => 
              setFilter(prev => ({ ...prev, type: value }))
            }>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="scheduled_report">Scheduled Report</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-reports">My Reports ({filteredReports.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({reportStats.scheduled})</TabsTrigger>
        </TabsList>

        {/* My Reports Tab */}
        <TabsContent value="my-reports" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 w-16 bg-gray-200 rounded"></div>
                      <div className="h-6 w-12 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No reports found</h3>
                <p className="text-gray-600 mb-4">
                  Create your first healthcare analytics report to get started.
                </p>
                <Button onClick={onCreateReport}>
                  Create New Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getTypeIcon(report.report_type)}
                          {report.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {report.description || 'No description provided'}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEditReport(report)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Report
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateReport(report.id, 'pdf')}>
                            <Download className="w-4 h-4 mr-2" />
                            Generate PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateReport(report.id, 'excel')}>
                            <Download className="w-4 h-4 mr-2" />
                            Generate Excel
                          </DropdownMenuItem>
                          {!report.is_scheduled && (
                            <DropdownMenuItem onClick={() => onScheduleReport(report.id)}>
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule Report
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDeleteReport(report.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className={getCategoryColor(report.category)}>
                        {report.category}
                      </Badge>
                      <Badge variant="outline">
                        {report.report_type}
                      </Badge>
                      {report.hipaa_compliant && (
                        <Badge variant="outline" className="border-green-500 text-green-700">
                          <Shield className="w-3 h-3 mr-1" />
                          HIPAA
                        </Badge>
                      )}
                      {report.is_scheduled && (
                        <Badge variant="outline" className="border-blue-500 text-blue-700">
                          <Calendar className="w-3 h-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Views:</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {report.view_count}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Last Generated:</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {report.last_generated ? formatDate(report.last_generated) : 'Never'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Created:</span>
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleGenerateReport(report.id, 'pdf')}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Run Report
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onEditReport(report)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Compliance Indicators */}
                    {(report.hipaa_compliant || report.patient_data_included) && (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          <span className="font-medium">Compliance Features:</span>
                        </div>
                        <ul className="mt-1 text-green-600 space-y-0.5">
                          {report.hipaa_compliant && <li>• HIPAA compliant data handling</li>}
                          {report.phi_scrubbed && <li>• PHI automatically scrubbed</li>}
                          {report.patient_data_included && <li>• Patient data anonymized</li>}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow border-2 border-dashed border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {template.name}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                    <Badge variant="outline">Template</Badge>
                    {template.hipaa_compliant && (
                      <Badge variant="outline" className="border-green-500 text-green-700">
                        <Shield className="w-3 h-3 mr-1" />
                        HIPAA
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    <span className="font-medium">Includes:</span>
                    <div className="mt-1">
                      {template.metrics.slice(0, 3).map(metric => (
                        <div key={metric} className="text-xs">• {metric.replace(/_/g, ' ')}</div>
                      ))}
                      {template.metrics.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{template.metrics.length - 3} more metrics
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => {
                      // This would trigger report creation with template
                      onCreateReport()
                    }}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled" className="space-y-6">
          <div className="space-y-4">
            {reports.filter(r => r.is_scheduled).map((report) => (
              <Card key={report.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{report.name}</h3>
                        <p className="text-sm text-gray-600">{report.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Schedule: {report.schedule_cron}</span>
                          <span>Method: {report.delivery_method}</span>
                          <span>Last run: {report.last_generated ? formatDate(report.last_generated) : 'Never'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.hipaa_compliant && (
                        <Badge variant="outline" className="border-green-500 text-green-700">
                          <Shield className="w-3 h-3 mr-1" />
                          HIPAA
                        </Badge>
                      )}
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Schedule
                      </Button>
                      <Button size="sm" onClick={() => handleGenerateReport(report.id, 'pdf')}>
                        <Play className="w-3 h-3 mr-1" />
                        Run Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}