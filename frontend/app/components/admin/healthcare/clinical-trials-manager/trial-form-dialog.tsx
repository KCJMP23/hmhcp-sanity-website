'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar as CalendarIcon, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import type { TrialFormDialogProps } from './types'
import { TRIAL_STATUSES, PHASES, FORM_TABS } from './types'

export function TrialFormDialog({
  isOpen,
  onClose,
  selectedTrial,
  formData,
  onFormDataChange,
  onSubmit,
  currentTab,
  onTabChange
}: TrialFormDialogProps) {
  const updateFormData = (key: string, value: any) => {
    onFormDataChange({
      ...formData,
      [key]: value
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-text">
            {selectedTrial ? 'Edit Clinical Trial' : 'Create Clinical Trial'}
          </DialogTitle>
          <DialogDescription>
            Enter the clinical trial information and study details
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onSubmit}>
          <Tabs value={currentTab} onValueChange={onTabChange} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              {FORM_TABS.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trial_id">Trial ID *</Label>
                  <Input
                    id="trial_id"
                    value={formData.trial_id || ''}
                    onChange={(e) => updateFormData('trial_id', e.target.value)}
                    className="rounded-lg"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select 
                    value={formData.status || ''} 
                    onValueChange={(value) => updateFormData('status', value)}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRIAL_STATUSES).map(([key, status]) => (
                        <SelectItem key={key} value={key}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  className="rounded-lg"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  className="rounded-lg"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phase">Phase</Label>
                  <Select 
                    value={formData.phase || ''} 
                    onValueChange={(value) => updateFormData('phase', value)}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {PHASES.map(phase => (
                        <SelectItem key={phase.value} value={phase.value}>
                          {phase.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sponsor">Sponsor</Label>
                  <Input
                    id="sponsor"
                    value={formData.sponsor || ''}
                    onChange={(e) => updateFormData('sponsor', e.target.value)}
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="primary_outcome">Primary Outcome</Label>
                <Textarea
                  id="primary_outcome"
                  value={formData.primary_outcome || ''}
                  onChange={(e) => updateFormData('primary_outcome', e.target.value)}
                  className="rounded-lg"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="criteria" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="enrollment_target">Target Enrollment</Label>
                  <Input
                    id="enrollment_target"
                    type="number"
                    value={formData.enrollment_target || 0}
                    onChange={(e) => updateFormData('enrollment_target', parseInt(e.target.value))}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="enrollment_current">Current Enrollment</Label>
                  <Input
                    id="enrollment_current"
                    type="number"
                    value={formData.enrollment_current || 0}
                    onChange={(e) => updateFormData('enrollment_current', parseInt(e.target.value))}
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  className="rounded-lg"
                />
              </div>

              {/* Inclusion/Exclusion criteria would be implemented here */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Full inclusion/exclusion criteria management interface would be implemented here with dynamic list management.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div>
                <Label htmlFor="principal_investigator">Principal Investigator</Label>
                <Input
                  id="principal_investigator"
                  value={formData.principal_investigator || ''}
                  onChange={(e) => updateFormData('principal_investigator', e.target.value)}
                  className="rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email || ''}
                    onChange={(e) => updateFormData('contact_email', e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone || ''}
                    onChange={(e) => updateFormData('contact_phone', e.target.value)}
                    className="rounded-lg"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal rounded-full"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? format(formData.start_date, 'PPP') : 'Select start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.start_date || undefined}
                        onSelect={(date) => updateFormData('start_date', date || null)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Completion Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal rounded-full"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.completion_date ? format(formData.completion_date, 'PPP') : 'Select completion date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.completion_date || undefined}
                        onSelect={(date) => updateFormData('completion_date', date || null)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
            >
              {selectedTrial ? 'Update Trial' : 'Create Trial'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}