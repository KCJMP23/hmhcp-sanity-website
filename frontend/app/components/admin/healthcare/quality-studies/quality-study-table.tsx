'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2, Eye, DollarSign, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import type { QualityStudy } from './types'
import { STUDY_TYPES, STUDY_STATUSES, PRIORITY_LEVELS } from './types'

interface QualityStudyTableProps {
  studies: QualityStudy[]
  loading: boolean
  onEdit: (study: QualityStudy) => void
  onDelete: (study: QualityStudy) => void
  onView: (study: QualityStudy) => void
}

export function QualityStudyTable({
  studies,
  loading,
  onEdit,
  onDelete,
  onView
}: QualityStudyTableProps) {
  const getStudyType = (type: string) => {
    return STUDY_TYPES.find(t => t.value === type) || { label: type, color: 'bg-gray-100 text-gray-800' }
  }

  const getStudyStatus = (status: string) => {
    return STUDY_STATUSES.find(s => s.value === status) || { label: status, color: 'bg-gray-100 text-gray-800' }
  }

  const getPriorityLevel = (priority: string) => {
    return PRIORITY_LEVELS.find(p => p.value === priority) || { label: priority, color: 'bg-gray-100 text-gray-800' }
  }

  if (loading) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Quality Studies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-sm h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading studies...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (studies.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Quality Studies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No quality studies found</p>
            <p className="text-sm text-gray-400">Create your first study to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Studies ({studies.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Study & PI</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Sample Size</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studies.map((study) => {
                const studyType = getStudyType(study.study_type)
                const studyStatus = getStudyStatus(study.status)
                const priorityLevel = getPriorityLevel(study.priority)
                
                return (
                  <TableRow key={study.id} className="hover:bg-gray-50">
                    <TableCell className="max-w-xs">
                      <div>
                        <p className="font-medium text-gray-900 truncate" title={study.title}>
                          {study.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate" title={study.principal_investigator}>
                          PI: {study.principal_investigator}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${studyType.color} text-xs rounded-md`}>
                        {studyType.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${studyStatus.color} text-xs rounded-md`}>
                        {studyStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${priorityLevel.color} text-xs rounded-md`}>
                        {priorityLevel.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-900 truncate" title={study.department}>
                        {study.department}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {study.sample_size.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">participants</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        {study.cost_savings ? (
                          <div>
                            <p className="text-sm font-medium text-green-600">
                              ${study.cost_savings.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">savings</p>
                          </div>
                        ) : study.roi_percentage ? (
                          <div>
                            <p className="text-sm font-medium text-blue-600">
                              {study.roi_percentage}%
                            </p>
                            <p className="text-xs text-gray-500">ROI</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">TBD</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(study)}
                          className="h-8 w-8 p-0"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(study)}
                          className="h-8 w-8 p-0"
                          title="Edit study"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(study)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Delete study"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}