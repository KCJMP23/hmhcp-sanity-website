'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { 
  ClinicalTrial, 
  ClinicalTrialFormData, 
  TrialFilters 
} from './types'
import { StatsCards } from './stats-cards'
import { FiltersSection } from './filters-section'
import { TrialsTable } from './trials-table'
import { TrialFormDialog } from './trial-form-dialog'
import { TrialDetailDialog } from './trial-detail-dialog'

export function ClinicalTrialsManager() {
  const [trials, setTrials] = useState<ClinicalTrial[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TrialFilters>({
    search: '',
    status: '',
    phase: ''
  })
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<ClinicalTrialFormData>>({
    trial_id: '',
    title: '',
    description: '',
    status: 'recruiting',
    phase: '',
    sponsor: '',
    primary_outcome: '',
    secondary_outcomes: [],
    inclusion_criteria: [],
    exclusion_criteria: [],
    enrollment_target: 0,
    enrollment_current: 0,
    start_date: null,
    completion_date: null,
    location: '',
    principal_investigator: '',
    contact_email: '',
    contact_phone: ''
  })
  const [currentTab, setCurrentTab] = useState('overview')
  const { toast } = useToast()

  // Load clinical trials
  const loadTrials = async () => {
    try {
      setLoading(true)
      // This would connect to your API endpoint for clinical trials
      const response = await fetch('/api/admin/healthcare/clinical-trials')
      if (!response.ok) throw new Error('Failed to load trials')

      const data = await response.json()
      setTrials(data.data || [])
    } catch (error) {
      console.error('Error loading trials:', error)
      toast({
        title: 'Error',
        description: 'Failed to load clinical trials',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrials()
  }, [])

  // Filter trials
  const filteredTrials = trials.filter(trial => {
    const matchesSearch = !filters.search || 
      trial.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      trial.trial_id.toLowerCase().includes(filters.search.toLowerCase()) ||
      trial.sponsor.toLowerCase().includes(filters.search.toLowerCase())
    
    const matchesStatus = !filters.status || trial.status === filters.status
    const matchesPhase = !filters.phase || trial.phase === filters.phase

    return matchesSearch && matchesStatus && matchesPhase
  })

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const method = selectedTrial ? 'PUT' : 'POST'
      const url = '/api/admin/healthcare/clinical-trials'
      
      const payload = {
        ...formData,
        ...(selectedTrial && { id: selectedTrial.id })
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to save trial')

      toast({
        title: 'Success',
        description: `Clinical trial ${selectedTrial ? 'updated' : 'created'} successfully`
      })

      closeFormDialog()
      loadTrials()
    } catch (error) {
      console.error('Error saving trial:', error)
      toast({
        title: 'Error',
        description: `Failed to ${selectedTrial ? 'update' : 'create'} trial`,
        variant: 'destructive'
      })
    }
  }

  // Get CSRF token
  const getCSRFToken = async () => {
    return 'csrf-token' // Implementation depends on your CSRF system
  }

  // Event handlers
  const handleCreateNew = () => {
    setSelectedTrial(null)
    setFormData({
      trial_id: '',
      title: '',
      description: '',
      status: 'recruiting',
      phase: '',
      sponsor: '',
      primary_outcome: '',
      secondary_outcomes: [],
      inclusion_criteria: [],
      exclusion_criteria: [],
      enrollment_target: 0,
      enrollment_current: 0,
      start_date: null,
      completion_date: null,
      location: '',
      principal_investigator: '',
      contact_email: '',
      contact_phone: ''
    })
    setCurrentTab('overview')
    setIsCreateDialogOpen(true)
  }

  const handleEditTrial = (trial: ClinicalTrial) => {
    setSelectedTrial(trial)
    setFormData({
      trial_id: trial.trial_id,
      title: trial.title,
      description: trial.description,
      status: trial.status,
      phase: trial.phase || '',
      sponsor: trial.sponsor,
      primary_outcome: trial.primary_outcome,
      secondary_outcomes: trial.secondary_outcomes,
      inclusion_criteria: trial.inclusion_criteria,
      exclusion_criteria: trial.exclusion_criteria,
      enrollment_target: trial.enrollment_target,
      enrollment_current: trial.enrollment_current,
      start_date: trial.start_date ? new Date(trial.start_date) : null,
      completion_date: trial.completion_date ? new Date(trial.completion_date) : null,
      location: trial.location,
      principal_investigator: trial.principal_investigator,
      contact_email: trial.contact_email,
      contact_phone: trial.contact_phone
    })
    setCurrentTab('overview')
    setIsCreateDialogOpen(true)
  }

  const handleSelectTrial = (trial: ClinicalTrial) => {
    setSelectedTrial(trial)
  }

  const closeFormDialog = () => {
    setIsCreateDialogOpen(false)
    setSelectedTrial(null)
    setFormData({})
    setCurrentTab('overview')
  }

  const closeDetailDialog = () => {
    setSelectedTrial(null)
  }

  const handleFiltersChange = (newFilters: TrialFilters) => {
    setFilters(newFilters)
  }

  const handleFormDataChange = (newFormData: Partial<ClinicalTrialFormData>) => {
    setFormData(newFormData)
  }

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display text-gray-900 dark:text-white tracking-tight">
            Clinical Trials Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage clinical research studies and trial protocols
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Clinical Trial
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards trials={trials} />

      {/* Filters */}
      <FiltersSection 
        filters={filters} 
        onFiltersChange={handleFiltersChange} 
      />

      {/* Trials Table */}
      <TrialsTable
        trials={filteredTrials}
        loading={loading}
        onSelectTrial={handleSelectTrial}
        onEditTrial={handleEditTrial}
      />

      {/* Create/Edit Dialog */}
      <TrialFormDialog
        isOpen={isCreateDialogOpen}
        onClose={closeFormDialog}
        selectedTrial={selectedTrial}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSubmit={handleSubmit}
        currentTab={currentTab}
        onTabChange={handleTabChange}
      />

      {/* Trial Detail View */}
      {selectedTrial && !isCreateDialogOpen && (
        <TrialDetailDialog
          selectedTrial={selectedTrial}
          onClose={closeDetailDialog}
        />
      )}
    </div>
  )
}