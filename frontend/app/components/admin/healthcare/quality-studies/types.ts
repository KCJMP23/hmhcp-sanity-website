// Types for Quality Studies
export interface QualityStudy {
  id: string
  content_id: string
  title: string
  description: string
  study_type: 'quality_improvement' | 'patient_safety' | 'clinical_outcome' | 'process_improvement' | 'cost_effectiveness'
  methodology: string
  intervention_description: string
  primary_outcome: string
  secondary_outcomes: string[]
  measurement_period_start: string
  measurement_period_end: string
  sample_size: number
  population_description: string
  baseline_data: any
  post_intervention_data: any
  statistical_significance: boolean
  p_value?: number
  confidence_interval?: string
  effect_size?: number
  roi_percentage?: number
  cost_savings?: number
  implementation_barriers: string[]
  lessons_learned: string[]
  recommendations: string[]
  sustainability_plan: string
  status: 'planning' | 'in_progress' | 'data_collection' | 'analysis' | 'completed' | 'published'
  priority: 'high' | 'medium' | 'low'
  department: string
  principal_investigator: string
  team_members: string[]
  stakeholders: string[]
  ethical_approval_required: boolean
  ethical_approval_number?: string
  funding_source?: string
  created_at: string
  updated_at: string
}

export interface QualityStudyFormData {
  title: string
  description: string
  study_type: string
  methodology: string
  intervention_description: string
  primary_outcome: string
  secondary_outcomes: string[]
  measurement_period_start: Date | null
  measurement_period_end: Date | null
  sample_size: number
  population_description: string
  status: string
  priority: string
  department: string
  principal_investigator: string
  team_members: string[]
  stakeholders: string[]
  ethical_approval_required: boolean
  ethical_approval_number: string
  funding_source: string
  sustainability_plan: string
}

export interface QualityStudyStats {
  total: number
  planning: number
  inProgress: number
  completed: number
  published: number
  highPriority: number
  totalCostSavings: number
  averageROI: number
}

export const STUDY_TYPES = [
  { value: 'quality_improvement', label: 'Quality Improvement', color: 'bg-blue-100 text-blue-800' },
  { value: 'patient_safety', label: 'Patient Safety', color: 'bg-red-100 text-red-800' },
  { value: 'clinical_outcome', label: 'Clinical Outcome', color: 'bg-green-100 text-green-800' },
  { value: 'process_improvement', label: 'Process Improvement', color: 'bg-purple-100 text-purple-800' },
  { value: 'cost_effectiveness', label: 'Cost Effectiveness', color: 'bg-orange-100 text-orange-800' }
] as const

export const STUDY_STATUSES = [
  { value: 'planning', label: 'Planning', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'data_collection', label: 'Data Collection', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'analysis', label: 'Analysis', color: 'bg-purple-100 text-purple-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'published', label: 'Published', color: 'bg-teal-100 text-teal-800' }
] as const

export const PRIORITY_LEVELS = [
  { value: 'high', label: 'High Priority', color: 'bg-red-100 text-red-800' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' }
] as const

export const DEPARTMENTS = [
  'Emergency Medicine',
  'Internal Medicine',
  'Surgery',
  'Pediatrics',
  'Cardiology',
  'Nursing',
  'Pharmacy',
  'Laboratory',
  'Radiology',
  'Administration',
  'Quality & Safety',
  'Information Technology'
] as const