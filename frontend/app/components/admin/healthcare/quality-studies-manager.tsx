'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Plus } from 'lucide-react'
import type { QualityStudy, QualityStudyFormData, QualityStudyStats } from './quality-studies/types'
import { QualityStudyStatsCards, QualityStudyMetricsCards } from './quality-studies/quality-study-stats'
import { QualityStudyFilters } from './quality-studies/quality-study-filters'
import { QualityStudyTable } from './quality-studies/quality-study-table'
import { QualityStudyFormDialog } from './quality-studies/quality-study-form-dialog'
import { QualityStudyDetailDialog } from './quality-studies/quality-study-detail-dialog'

interface QualityStudiesManagerProps {}

export function QualityStudiesManager({}: QualityStudiesManagerProps) {
  const { toast } = useToast()
  
  // State management
  const [studies, setStudies] = useState<QualityStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudy, setSelectedStudy] = useState<QualityStudy | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterDepartment, setFilterDepartment] = useState('all')

  // Load studies from API
  const loadStudies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/healthcare/quality-studies')
      
      if (!response.ok) throw new Error('Failed to load studies')
      
      const data = await response.json()
      setStudies(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading studies:', error)
      toast({
        title: 'Error',
        description: 'Failed to load quality studies',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudies()
  }, [])

  // Filter studies
  const filteredStudies = studies.filter(study => {
    const matchesSearch = !searchQuery || 
      study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.principal_investigator.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === 'all' || study.study_type === filterType
    const matchesStatus = filterStatus === 'all' || study.status === filterStatus
    const matchesPriority = filterPriority === 'all' || study.priority === filterPriority
    const matchesDepartment = filterDepartment === 'all' || study.department === filterDepartment

    return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesDepartment
  })

  // Calculate statistics
  const calculateStats = (): QualityStudyStats => {
    const total = studies.length
    const planning = studies.filter(s => s.status === 'planning').length
    const inProgress = studies.filter(s => s.status === 'in_progress' || s.status === 'data_collection').length
    const completed = studies.filter(s => s.status === 'completed').length
    const published = studies.filter(s => s.status === 'published').length
    const highPriority = studies.filter(s => s.priority === 'high').length
    
    const totalCostSavings = studies.reduce((sum, study) => sum + (study.cost_savings || 0), 0)
    const studiesWithROI = studies.filter(s => s.roi_percentage && s.roi_percentage > 0)
    const averageROI = studiesWithROI.length > 0 
      ? studiesWithROI.reduce((sum, study) => sum + (study.roi_percentage || 0), 0) / studiesWithROI.length
      : 0

    return {
      total,
      planning,
      inProgress,
      completed,
      published,
      highPriority,
      totalCostSavings,
      averageROI
    }
  }

  // Get CSRF token
  const getCSRFToken = async () => {
    try {
      const response = await fetch('/api/csrf-token')
      const data = await response.json()
      return data.token
    } catch (error) {
      console.error('Failed to get CSRF token:', error)
      return ''
    }
  }

  // Handle form submission
  const handleFormSubmit = async (formData: QualityStudyFormData) => {
    try {
      const method = selectedStudy ? 'PUT' : 'POST'
      const url = '/api/admin/healthcare/quality-studies'
      
      const payload = {
        ...formData,
        measurement_period_start: formData.measurement_period_start?.toISOString() || null,
        measurement_period_end: formData.measurement_period_end?.toISOString() || null,
        ...(selectedStudy && { id: selectedStudy.id })
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to save study')

      toast({
        title: 'Success',
        description: `Quality study ${selectedStudy ? 'updated' : 'created'} successfully`
      })

      setIsCreateDialogOpen(false)
      setSelectedStudy(null)
      await loadStudies()
    } catch (error) {
      console.error('Error saving study:', error)
      toast({
        title: 'Error',
        description: `Failed to ${selectedStudy ? 'update' : 'create'} study`,
        variant: 'destructive'
      })
    }
  }

  // Handle study deletion
  const handleDelete = async (study: QualityStudy) => {
    if (!confirm('Are you sure you want to delete this study? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/healthcare/quality-studies', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify({ id: study.id })
      })

      if (!response.ok) throw new Error('Failed to delete study')

      toast({
        title: 'Success',
        description: 'Quality study deleted successfully'
      })

      await loadStudies()
    } catch (error) {
      console.error('Error deleting study:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete study',
        variant: 'destructive'
      })
    }
  }

  // Handle study editing
  const handleEdit = (study: QualityStudy) => {
    setSelectedStudy(study)
    setIsCreateDialogOpen(true)
    setIsDetailDialogOpen(false)
  }

  // Handle study viewing
  const handleView = (study: QualityStudy) => {
    setSelectedStudy(study)
    setIsDetailDialogOpen(true)
  }

  // Handle add new study
  const handleAddNew = () => {
    setSelectedStudy(null)
    setIsCreateDialogOpen(true)
  }

  // Handle export
  const handleExport = () => {
    try {
      const csv = [
        'Title,PI,Type,Status,Priority,Department,Sample Size,Cost Savings,ROI',
        ...filteredStudies.map(study => [
          `"${study.title}"`,
          `"${study.principal_investigator}"`,
          study.study_type,
          study.status,
          study.priority,
          `"${study.department}"`,
          study.sample_size,
          study.cost_savings || 0,
          study.roi_percentage || 0
        ].join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `quality-studies-${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      toast({
        title: 'Success',
        description: 'Quality studies exported successfully'
      })
    } catch (error) {
      console.error('Error exporting studies:', error)
      toast({
        title: 'Error',
        description: 'Failed to export studies',
        variant: 'destructive'
      })
    }
  }

  const stats = calculateStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display text-gray-900 dark:text-white tracking-tight">
            Quality Studies Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage quality improvement studies and healthcare research initiatives
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Quality Study
        </Button>
      </div>

      {/* Statistics Cards */}
      <QualityStudyStatsCards stats={stats} />
      <QualityStudyMetricsCards stats={stats} />

      {/* Filters */}
      <QualityStudyFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        filterDepartment={filterDepartment}
        setFilterDepartment={setFilterDepartment}
        onAddNew={handleAddNew}
        onExport={handleExport}
      />

      {/* Studies Table */}
      <QualityStudyTable
        studies={filteredStudies}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />

      {/* Form Dialog */}
      <QualityStudyFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false)
          setSelectedStudy(null)
        }}
        study={selectedStudy}
        onSubmit={handleFormSubmit}
      />

      {/* Detail Dialog */}
      <QualityStudyDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false)
          setSelectedStudy(null)
        }}
        study={selectedStudy}
        onEdit={handleEdit}
      />
    </div>
  )
}