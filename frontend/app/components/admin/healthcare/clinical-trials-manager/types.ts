'use client'

import {
  Activity,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react'

// Core interfaces
export interface ClinicalTrial {
  id: string
  content_id: string
  trial_id: string
  title: string
  description: string
  status: 'recruiting' | 'active' | 'completed' | 'suspended' | 'terminated'
  phase: 'phase-1' | 'phase-2' | 'phase-3' | 'phase-4' | null
  sponsor: string
  primary_outcome: string
  secondary_outcomes: string[]
  inclusion_criteria: string[]
  exclusion_criteria: string[]
  enrollment_target: number
  enrollment_current: number
  start_date: string
  completion_date: string
  location: string
  principal_investigator: string
  contact_email: string
  contact_phone: string
  study_documents: any
  created_at: string
  updated_at: string
}

export interface ClinicalTrialFormData {
  trial_id: string
  title: string
  description: string
  status: string
  phase: string
  sponsor: string
  primary_outcome: string
  secondary_outcomes: string[]
  inclusion_criteria: string[]
  exclusion_criteria: string[]
  enrollment_target: number
  enrollment_current: number
  start_date: Date | null
  completion_date: Date | null
  location: string
  principal_investigator: string
  contact_email: string
  contact_phone: string
}

// Filter interface
export interface TrialFilters {
  search: string
  status: string
  phase: string
}

// Component props interfaces
export interface StatsCardsProps {
  trials: ClinicalTrial[]
}

export interface FiltersSectionProps {
  filters: TrialFilters
  onFiltersChange: (filters: TrialFilters) => void
}

export interface TrialsTableProps {
  trials: ClinicalTrial[]
  loading: boolean
  onSelectTrial: (trial: ClinicalTrial) => void
  onEditTrial: (trial: ClinicalTrial) => void
}

export interface TrialFormDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedTrial: ClinicalTrial | null
  formData: Partial<ClinicalTrialFormData>
  onFormDataChange: (data: Partial<ClinicalTrialFormData>) => void
  onSubmit: (e: React.FormEvent) => void
  currentTab: string
  onTabChange: (tab: string) => void
}

export interface TrialDetailDialogProps {
  selectedTrial: ClinicalTrial | null
  onClose: () => void
}

// Constants
export const TRIAL_STATUSES = {
  recruiting: { color: 'bg-green-100 text-green-800', label: 'Recruiting', icon: Users },
  active: { color: 'bg-blue-100 text-blue-800', label: 'Active', icon: Activity },
  completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed', icon: CheckCircle },
  suspended: { color: 'bg-yellow-100 text-yellow-800', label: 'Suspended', icon: AlertTriangle },
  terminated: { color: 'bg-red-100 text-red-800', label: 'Terminated', icon: XCircle }
} as const

export const PHASES = [
  { value: 'phase-1', label: 'Phase I' },
  { value: 'phase-2', label: 'Phase II' },
  { value: 'phase-3', label: 'Phase III' },
  { value: 'phase-4', label: 'Phase IV' }
] as const

// Tab constants
export const FORM_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'criteria', label: 'Criteria' },
  { value: 'contact', label: 'Contact' },
  { value: 'timeline', label: 'Timeline' }
] as const

// Utility function types
export type TrialStatus = keyof typeof TRIAL_STATUSES
export type TrialPhase = typeof PHASES[number]['value']