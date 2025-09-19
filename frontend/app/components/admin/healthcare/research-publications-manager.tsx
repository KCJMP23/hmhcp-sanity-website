'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, AlertTriangle, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { ResearchPublication, PublicationFormData, PublicationStats } from './publications/types'
import { PublicationStatsCards } from './publications/publication-stats'
import { PublicationFilters } from './publications/publication-filters'
import { PublicationTable } from './publications/publication-table'
import { PublicationFormDialog } from './publications/publication-form-dialog'
import { PublicationDetailDialog } from './publications/publication-detail-dialog'

// Helper function to get CSRF token
async function getCSRFToken(): Promise<string> {
  const response = await fetch('/api/csrf-token')
  const data = await response.json()
  return data.token
}

export function ResearchPublicationsManager() {
  // State management
  const [publications, setPublications] = useState<ResearchPublication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterArea, setFilterArea] = useState('all')
  
  // Dialog state
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedPublication, setSelectedPublication] = useState<ResearchPublication | null>(null)
  
  const { toast } = useToast()

  // Load publications from API
  const loadPublications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/publications')
      if (!response.ok) {
        throw new Error(`Failed to load publications: ${response.statusText}`)
      }

      const data = await response.json()
      setPublications(data.data || [])
    } catch (error) {
      console.error('Error loading publications:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load research publications'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Initialize data on mount
  useEffect(() => {
    loadPublications()
  }, [])

  // Filter publications based on current filters
  const filteredPublications = publications.filter(publication => {
    const matchesSearch = !searchQuery || 
      publication.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      publication.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (publication.journal_name && publication.journal_name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = filterType === 'all' || publication.publication_type === filterType
    const matchesStatus = filterStatus === 'all' || publication.status === filterStatus
    const matchesArea = filterArea === 'all' || publication.research_area === filterArea

    return matchesSearch && matchesType && matchesStatus && matchesArea
  })

  // Calculate statistics
  const stats: PublicationStats = {
    total: publications.length,
    published: publications.filter(p => p.status === 'published').length,
    inPress: publications.filter(p => p.status === 'in_press').length,
    underReview: publications.filter(p => p.status === 'under_review').length,
    totalCitations: publications.reduce((sum, p) => sum + p.citation_count, 0),
    averageImpact: publications.length > 0 
      ? publications.reduce((sum, p) => sum + (p.impact_factor || 0), 0) / publications.length
      : 0
  }

  // Handle form submission (create or update)
  const handleFormSubmit = async (formData: PublicationFormData) => {
    try {
      const method = selectedPublication ? 'PUT' : 'POST'
      const url = '/api/admin/publications'
      
      const payload = {
        ...formData,
        ...(selectedPublication && { id: selectedPublication.id })
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Failed to save publication: ${response.statusText}`)
      }

      toast({
        title: 'Success',
        description: `Research publication ${selectedPublication ? 'updated' : 'created'} successfully`
      })

      // Refresh data and close dialog
      await loadPublications()
      setIsFormDialogOpen(false)
      setSelectedPublication(null)
    } catch (error) {
      console.error('Error saving publication:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save publication'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  // Handle delete publication
  const handleDelete = async (publication: ResearchPublication) => {
    if (!confirm(`Are you sure you want to delete "${publication.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/publications/${publication.id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': await getCSRFToken()
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to delete publication: ${response.statusText}`)
      }

      toast({
        title: 'Success',
        description: 'Research publication deleted successfully'
      })

      // Refresh data
      await loadPublications()
    } catch (error) {
      console.error('Error deleting publication:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete publication'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  // Handle edit publication
  const handleEdit = (publication: ResearchPublication) => {
    setSelectedPublication(publication)
    setIsFormDialogOpen(true)
  }

  // Handle view publication details
  const handleView = (publication: ResearchPublication) => {
    setSelectedPublication(publication)
    setIsDetailDialogOpen(true)
  }

  // Handle add new publication
  const handleAddNew = () => {
    setSelectedPublication(null)
    setIsFormDialogOpen(true)
  }

  // Handle export functionality
  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/publications/export', {
        method: 'GET',
        headers: {
          'X-CSRF-Token': await getCSRFToken()
        }
      })

      if (!response.ok) {
        throw new Error('Failed to export publications')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `research-publications-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'Publications exported successfully'
      })
    } catch (error) {
      console.error('Error exporting publications:', error)
      toast({
        title: 'Error',
        description: 'Failed to export publications',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Research Publications
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage and track your research publications and citations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadPublications}
            disabled={loading}
            className="rounded-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <LiquidGlassButton variant="primary" size="md" onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Publication
          </LiquidGlassButton>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={loadPublications}
              className="ml-2"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <PublicationStatsCards stats={stats} />

      {/* Filters */}
      <PublicationFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterArea={filterArea}
        setFilterArea={setFilterArea}
        onAddNew={handleAddNew}
        onExport={handleExport}
      />

      {/* Publications Table */}
      <PublicationTable
        publications={filteredPublications}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />

      {/* Form Dialog */}
      <PublicationFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => {
          setIsFormDialogOpen(false)
          setSelectedPublication(null)
        }}
        publication={selectedPublication}
        onSubmit={handleFormSubmit}
      />

      {/* Detail Dialog */}
      <PublicationDetailDialog
        publication={selectedPublication}
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false)
          setSelectedPublication(null)
        }}
        onEdit={handleEdit}
      />
    </div>
  )
}