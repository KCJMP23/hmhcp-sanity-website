'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import type { QualityStudyFormData, QualityStudy } from './types'
import { STUDY_TYPES, STUDY_STATUSES, PRIORITY_LEVELS, DEPARTMENTS } from './types'

interface QualityStudyFormDialogProps {
  isOpen: boolean
  onClose: () => void
  study?: QualityStudy | null
  onSubmit: (data: QualityStudyFormData) => Promise<void>
}

export function QualityStudyFormDialog({
  isOpen,
  onClose,
  study,
  onSubmit
}: QualityStudyFormDialogProps) {
  const [currentTab, setCurrentTab] = useState('overview')
  const [formData, setFormData] = useState<QualityStudyFormData>({
    title: study?.title || '',
    description: study?.description || '',
    study_type: study?.study_type || 'quality_improvement',
    methodology: study?.methodology || '',
    intervention_description: study?.intervention_description || '',
    primary_outcome: study?.primary_outcome || '',
    secondary_outcomes: study?.secondary_outcomes || [],
    measurement_period_start: study?.measurement_period_start ? new Date(study.measurement_period_start) : null,
    measurement_period_end: study?.measurement_period_end ? new Date(study.measurement_period_end) : null,
    sample_size: study?.sample_size || 0,
    population_description: study?.population_description || '',
    status: study?.status || 'planning',
    priority: study?.priority || 'medium',
    department: study?.department || '',
    principal_investigator: study?.principal_investigator || '',
    team_members: study?.team_members || [],
    stakeholders: study?.stakeholders || [],
    ethical_approval_required: study?.ethical_approval_required || false,
    ethical_approval_number: study?.ethical_approval_number || '',
    funding_source: study?.funding_source || '',
    sustainability_plan: study?.sustainability_plan || ''
  })

  const [newOutcome, setNewOutcome] = useState('')
  const [newTeamMember, setNewTeamMember] = useState('')
  const [newStakeholder, setNewStakeholder] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    onClose()
  }

  const addSecondaryOutcome = () => {
    if (newOutcome.trim()) {
      setFormData(prev => ({
        ...prev,
        secondary_outcomes: [...prev.secondary_outcomes, newOutcome.trim()]
      }))
      setNewOutcome('')
    }
  }

  const removeSecondaryOutcome = (index: number) => {
    setFormData(prev => ({
      ...prev,
      secondary_outcomes: prev.secondary_outcomes.filter((_, i) => i !== index)
    }))
  }

  const addTeamMember = () => {
    if (newTeamMember.trim()) {
      setFormData(prev => ({
        ...prev,
        team_members: [...prev.team_members, newTeamMember.trim()]
      }))
      setNewTeamMember('')
    }
  }

  const removeTeamMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      team_members: prev.team_members.filter((_, i) => i !== index)
    }))
  }

  const addStakeholder = () => {
    if (newStakeholder.trim()) {
      setFormData(prev => ({
        ...prev,
        stakeholders: [...prev.stakeholders, newStakeholder.trim()]
      }))
      setNewStakeholder('')
    }
  }

  const removeStakeholder = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.filter((_, i) => i !== index)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {study ? 'Edit Quality Study' : 'Add Quality Study'}
          </DialogTitle>
          <DialogDescription>
            {study ? 'Update study details' : 'Create a new quality improvement study'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="methodology">Methodology</TabsTrigger>
              <TabsTrigger value="team">Team & Ethics</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div>
                <Label htmlFor="title">Study Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={4}
                  className="rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="study_type">Study Type *</Label>
                  <Select
                    value={formData.study_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, study_type: value }))}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_STATUSES.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_LEVELS.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="methodology" className="space-y-4">
              <div>
                <Label htmlFor="methodology">Methodology *</Label>
                <Textarea
                  id="methodology"
                  value={formData.methodology}
                  onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value }))}
                  required
                  rows={4}
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="intervention_description">Intervention Description</Label>
                <Textarea
                  id="intervention_description"
                  value={formData.intervention_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, intervention_description: e.target.value }))}
                  rows={3}
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="primary_outcome">Primary Outcome *</Label>
                <Input
                  id="primary_outcome"
                  value={formData.primary_outcome}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_outcome: e.target.value }))}
                  required
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label>Secondary Outcomes</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newOutcome}
                    onChange={(e) => setNewOutcome(e.target.value)}
                    placeholder="Add secondary outcome"
                    className="rounded-lg"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSecondaryOutcome())}
                  />
                  <Button type="button" onClick={addSecondaryOutcome} className="rounded-full">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.secondary_outcomes.map((outcome, index) => (
                    <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      <span className="text-sm">{outcome}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSecondaryOutcome(index)}
                        className="h-4 w-4 p-0 hover:bg-blue-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sample_size">Sample Size</Label>
                  <Input
                    id="sample_size"
                    type="number"
                    value={formData.sample_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, sample_size: parseInt(e.target.value) || 0 }))}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="population_description">Population Description</Label>
                  <Input
                    id="population_description"
                    value={formData.population_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, population_description: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <div>
                <Label htmlFor="principal_investigator">Principal Investigator *</Label>
                <Input
                  id="principal_investigator"
                  value={formData.principal_investigator}
                  onChange={(e) => setFormData(prev => ({ ...prev, principal_investigator: e.target.value }))}
                  required
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label>Team Members</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTeamMember}
                    onChange={(e) => setNewTeamMember(e.target.value)}
                    placeholder="Add team member"
                    className="rounded-lg"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTeamMember())}
                  />
                  <Button type="button" onClick={addTeamMember} className="rounded-full">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.team_members.map((member, index) => (
                    <div key={index} className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md">
                      <span className="text-sm">{member}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTeamMember(index)}
                        className="h-4 w-4 p-0 hover:bg-blue-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Stakeholders</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newStakeholder}
                    onChange={(e) => setNewStakeholder(e.target.value)}
                    placeholder="Add stakeholder"
                    className="rounded-lg"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStakeholder())}
                  />
                  <Button type="button" onClick={addStakeholder} className="rounded-full">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.stakeholders.map((stakeholder, index) => (
                    <div key={index} className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      <span className="text-sm">{stakeholder}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStakeholder(index)}
                        className="h-4 w-4 p-0 hover:bg-blue-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ethical_approval_required"
                    checked={formData.ethical_approval_required}
                    onChange={(e) => setFormData(prev => ({ ...prev, ethical_approval_required: e.target.checked }))}
                    className="rounded-sm"
                  />
                  <Label htmlFor="ethical_approval_required">Ethical Approval Required</Label>
                </div>

                {formData.ethical_approval_required && (
                  <div>
                    <Label htmlFor="ethical_approval_number">Ethical Approval Number</Label>
                    <Input
                      id="ethical_approval_number"
                      value={formData.ethical_approval_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, ethical_approval_number: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="planning" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Measurement Period Start</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal rounded-full"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.measurement_period_start ? format(formData.measurement_period_start, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.measurement_period_start || undefined}
                        onSelect={(date) => setFormData(prev => ({ ...prev, measurement_period_start: date || null }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Measurement Period End</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal rounded-full"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.measurement_period_end ? format(formData.measurement_period_end, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.measurement_period_end || undefined}
                        onSelect={(date) => setFormData(prev => ({ ...prev, measurement_period_end: date || null }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="funding_source">Funding Source</Label>
                <Input
                  id="funding_source"
                  value={formData.funding_source}
                  onChange={(e) => setFormData(prev => ({ ...prev, funding_source: e.target.value }))}
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="sustainability_plan">Sustainability Plan</Label>
                <Textarea
                  id="sustainability_plan"
                  value={formData.sustainability_plan}
                  onChange={(e) => setFormData(prev => ({ ...prev, sustainability_plan: e.target.value }))}
                  rows={4}
                  className="rounded-lg"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" className="rounded-full">
              {study ? 'Update Study' : 'Create Study'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}