'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2, Eye, ExternalLink, FileText } from 'lucide-react'
import { format } from 'date-fns'
import type { ResearchPublication } from './types'
import { PUBLICATION_TYPES, PUBLICATION_STATUS } from './types'

interface PublicationTableProps {
  publications: ResearchPublication[]
  loading: boolean
  onEdit: (publication: ResearchPublication) => void
  onDelete: (publication: ResearchPublication) => void
  onView: (publication: ResearchPublication) => void
}

export function PublicationTable({
  publications,
  loading,
  onEdit,
  onDelete,
  onView
}: PublicationTableProps) {
  const getPublicationType = (type: string) => {
    return PUBLICATION_TYPES.find(t => t.value === type) || { label: type, color: 'bg-gray-100 text-gray-800' }
  }

  const getPublicationStatus = (status: string) => {
    return PUBLICATION_STATUS.find(s => s.value === status) || { label: status, color: 'bg-gray-100 text-gray-800' }
  }

  if (loading) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Publications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-sm h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading publications...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (publications.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Publications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No research publications found</p>
            <p className="text-sm text-gray-400">Create your first publication to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Publications ({publications.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title & Authors</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Journal</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Citations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publications.map((publication) => {
                const publicationType = getPublicationType(publication.publication_type)
                const publicationStatus = getPublicationStatus(publication.status)
                
                return (
                  <TableRow key={publication.id} className="hover:bg-gray-50">
                    <TableCell className="max-w-xs">
                      <div>
                        <p className="font-medium text-gray-900 truncate" title={publication.title}>
                          {publication.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate" title={publication.authors.join(', ')}>
                          {publication.authors.length > 0 ? publication.authors.join(', ') : 'No authors'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-gray-100 text-gray-800 text-xs rounded-md">
                        {publicationType.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${publicationStatus.color} text-xs rounded-md`}>
                        {publicationStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-900 truncate" title={publication.journal_name || 'N/A'}>
                        {publication.journal_name || 'N/A'}
                      </p>
                      {publication.volume && (
                        <p className="text-xs text-gray-500">
                          Vol. {publication.volume}
                          {publication.issue && `, Issue ${publication.issue}`}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-900">
                        {format(new Date(publication.publication_date), 'MMM dd, yyyy')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {publication.citation_count}
                        </p>
                        {publication.impact_factor && (
                          <p className="text-xs text-gray-500">
                            IF: {publication.impact_factor}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(publication)}
                          className="h-8 w-8 p-0"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {publication.doi && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                            title="View DOI"
                          >
                            <a 
                              href={`https://doi.org/${publication.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        
                        {publication.pdf_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                            title="View PDF"
                          >
                            <a 
                              href={publication.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(publication)}
                          className="h-8 w-8 p-0"
                          title="Edit publication"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(publication)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Delete publication"
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