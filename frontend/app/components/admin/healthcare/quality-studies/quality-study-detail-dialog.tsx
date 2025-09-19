'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { CalendarIcon, TrendingUp, Users, DollarSign, FileText, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import type { QualityStudy } from './types'
import { STUDY_TYPES, STUDY_STATUSES, PRIORITY_LEVELS } from './types'

interface QualityStudyDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  study: QualityStudy | null
  onEdit: (study: QualityStudy) => void
}

export function QualityStudyDetailDialog({
  isOpen,
  onClose,
  study,
  onEdit
}: QualityStudyDetailDialogProps) {
  if (!study) return null

  const studyType = STUDY_TYPES.find(t => t.value === study.study_type)
  const studyStatus = STUDY_STATUSES.find(s => s.value === study.status)
  const priorityLevel = PRIORITY_LEVELS.find(p => p.value === study.priority)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Quality Study Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this quality improvement study
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Study Overview */}
          <div>
            <h3 className="text-lg font-medium mb-4">Study Overview</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={`${studyType?.color} text-xs rounded-md`}>
                    {studyType?.label}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={`${studyStatus?.color} text-xs rounded-md`}>
                    {studyStatus?.label}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={`${priorityLevel?.color} text-xs rounded-md`}>
                    {priorityLevel?.label}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{study.department}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Title and Description */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{study.title}</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{study.description}</p>
          </div>

          <Separator />

          {/* Methodology */}
          <div>
            <h3 className="text-lg font-medium mb-3">Methodology</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Study Methodology</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{study.methodology}</p>
              </div>
              
              {study.intervention_description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Intervention</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{study.intervention_description}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Primary Outcome</h4>
                  <p className="text-gray-600 text-sm">{study.primary_outcome}</p>
                </div>
                
                {study.sample_size > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sample Size</h4>
                    <p className="text-gray-600 text-sm">
                      {study.sample_size.toLocaleString()} participants
                    </p>
                  </div>
                )}
              </div>

              {study.secondary_outcomes.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Secondary Outcomes</h4>
                  <div className="flex flex-wrap gap-2">
                    {study.secondary_outcomes.map((outcome, index) => (
                      <Badge key={index} variant="outline" className="text-xs rounded-md">
                        {outcome}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Team Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Team & Collaboration</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Principal Investigator</h4>
                <p className="text-gray-600 text-sm">{study.principal_investigator}</p>
              </div>

              {study.funding_source && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Funding Source</h4>
                  <p className="text-gray-600 text-sm">{study.funding_source}</p>
                </div>
              )}
            </div>

            {study.team_members.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Team Members</h4>
                <div className="flex flex-wrap gap-2">
                  {study.team_members.map((member, index) => (
                    <Badge key={index} variant="secondary" className="text-xs rounded-md">
                      <Users className="mr-1 h-3 w-3" />
                      {member}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {study.stakeholders.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Stakeholders</h4>
                <div className="flex flex-wrap gap-2">
                  {study.stakeholders.map((stakeholder, index) => (
                    <Badge key={index} variant="outline" className="text-xs rounded-md">
                      {stakeholder}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Impact & Results */}
          {(study.cost_savings || study.roi_percentage) && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-3">Impact & Results</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {study.cost_savings && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <DollarSign className="mr-2 h-4 w-4" />
                          Cost Savings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-green-600">
                          ${study.cost_savings.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {study.roi_percentage && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Return on Investment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-blue-600">
                          {study.roi_percentage}%
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Ethical Information */}
          {study.ethical_approval_required && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-3">Ethics & Compliance</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-gray-600">Ethical approval required</span>
                  </div>
                  {study.ethical_approval_number && (
                    <p className="text-sm text-gray-600">
                      Approval Number: <span className="font-medium">{study.ethical_approval_number}</span>
                    </p>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Timeline */}
          {(study.measurement_period_start || study.measurement_period_end) && (
            <div>
              <h3 className="text-lg font-medium mb-3">Timeline</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {study.measurement_period_start && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Start Date</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(study.measurement_period_start), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}

                {study.measurement_period_end && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">End Date</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(study.measurement_period_end), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sustainability Plan */}
          {study.sustainability_plan && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-3">Sustainability Plan</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{study.sustainability_plan}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} className="rounded-full">
            Close
          </Button>
          <Button onClick={() => onEdit(study)} className="rounded-lg">
            Edit Study
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}