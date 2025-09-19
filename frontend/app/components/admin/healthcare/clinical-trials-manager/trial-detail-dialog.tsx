'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import type { TrialDetailDialogProps } from './types'
import { TRIAL_STATUSES, PHASES } from './types'

export function TrialDetailDialog({ selectedTrial, onClose }: TrialDetailDialogProps) {
  if (!selectedTrial) return null

  return (
    <Dialog open={!!selectedTrial} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-text">{selectedTrial.title}</DialogTitle>
          <DialogDescription>
            Trial ID: {selectedTrial.trial_id} • {selectedTrial.sponsor}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and metrics */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="rounded-lg">
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-display text-gray-900 dark:text-white">
                    {selectedTrial.enrollment_current}/{selectedTrial.enrollment_target}
                  </div>
                  <div className="text-sm text-gray-600">Enrollment</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-lg">
              <CardContent className="pt-4">
                <div className="text-center">
                  <Badge 
                    className={`${TRIAL_STATUSES[selectedTrial.status]?.color || 'bg-gray-100 text-gray-800'} text-sm rounded-md`}
                  >
                    {TRIAL_STATUSES[selectedTrial.status]?.label || selectedTrial.status}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">Status</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-lg">
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-lg font-text text-gray-900 dark:text-white">
                    {selectedTrial.phase ? PHASES.find(p => p.value === selectedTrial.phase)?.label : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Phase</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-300">{selectedTrial.description}</p>
          </div>

          {/* Primary Outcome */}
          <div>
            <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2">Primary Outcome</h3>
            <p className="text-gray-600 dark:text-gray-300">{selectedTrial.primary_outcome}</p>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{selectedTrial.principal_investigator}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{selectedTrial.contact_email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{selectedTrial.contact_phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{selectedTrial.location}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2">Timeline</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Start Date:</span>
                <div className="font-text">{format(new Date(selectedTrial.start_date), 'MMMM dd, yyyy')}</div>
              </div>
              <div>
                <span className="text-gray-500">Completion Date:</span>
                <div className="font-text">{format(new Date(selectedTrial.completion_date), 'MMMM dd, yyyy')}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}