'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Activity,
  MapPin,
  Phone,
  Mail,
  Edit,
  Eye,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import type { TrialsTableProps } from './types'
import { TRIAL_STATUSES, PHASES } from './types'

export function TrialsTable({ 
  trials, 
  loading, 
  onSelectTrial, 
  onEditTrial 
}: TrialsTableProps) {
  // Format enrollment percentage
  const getEnrollmentPercentage = (current: number, target: number) => {
    if (target === 0) return 0
    return Math.min((current / target) * 100, 100)
  }

  return (
    <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-text">Clinical Trials</CardTitle>
        <CardDescription>
          {trials.length} trials found
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trial Information</TableHead>
                  <TableHead>Status & Phase</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trials.map((trial) => {
                  const StatusIcon = TRIAL_STATUSES[trial.status]?.icon || Activity
                  const enrollmentPercentage = getEnrollmentPercentage(trial.enrollment_current, trial.enrollment_target)
                  
                  return (
                    <TableRow key={trial.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-text font-medium text-gray-900 dark:text-white">
                            {trial.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {trial.trial_id}
                          </div>
                          <div className="text-sm text-gray-600">
                            Sponsor: {trial.sponsor}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="w-4 h-4" />
                            <Badge 
                              className={`${TRIAL_STATUSES[trial.status]?.color || 'bg-gray-100 text-gray-800'} text-xs rounded-md`}
                            >
                              {TRIAL_STATUSES[trial.status]?.label || trial.status}
                            </Badge>
                          </div>
                          {trial.phase && (
                            <Badge variant="outline" className="text-xs rounded-md">
                              {PHASES.find(p => p.value === trial.phase)?.label}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="text-sm font-text">
                            {trial.enrollment_current} / {trial.enrollment_target}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div 
                              className="bg-blue-600 h-2 rounded-lg transition-all" 
                              style={{ width: `${enrollmentPercentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            {enrollmentPercentage.toFixed(1)}% enrolled
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-gray-500">Start:</span> {format(new Date(trial.start_date), 'MMM dd, yyyy')}
                          </div>
                          <div>
                            <span className="text-gray-500">End:</span> {format(new Date(trial.completion_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-gray-600">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {trial.location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="font-text text-gray-900 dark:text-white">
                            {trial.principal_investigator}
                          </div>
                          <div className="text-gray-600">
                            <Mail className="w-3 h-3 inline mr-1" />
                            {trial.contact_email}
                          </div>
                          <div className="text-gray-600">
                            <Phone className="w-3 h-3 inline mr-1" />
                            {trial.contact_phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSelectTrial(trial)}
                            className="rounded-lg"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditTrial(trial)}
                            className="rounded-lg"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}