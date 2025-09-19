'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ExternalLink, FileText, Calendar, Building2, Users, Tag, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import type { ResearchPublication } from './types'
import { PUBLICATION_TYPES, PUBLICATION_STATUS } from './types'

interface PublicationDetailDialogProps {
  publication: ResearchPublication | null
  isOpen: boolean
  onClose: () => void
  onEdit: (publication: ResearchPublication) => void
}

export function PublicationDetailDialog({
  publication,
  isOpen,
  onClose,
  onEdit
}: PublicationDetailDialogProps) {
  if (!publication) return null

  const publicationType = PUBLICATION_TYPES.find(t => t.value === publication.publication_type)
  const publicationStatus = PUBLICATION_STATUS.find(s => s.value === publication.status)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold pr-8">
            {publication.title}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(publication)}
              className="rounded-lg"
            >
              Edit Publication
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              Close
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-lg">
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-display text-gray-900 dark:text-white">
                    {publication.citation_count}
                  </div>
                  <div className="text-sm text-gray-600">Citations</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-lg">
              <CardContent className="pt-4">
                <div className="text-center">
                  <Badge 
                    className="bg-gray-100 text-gray-800 text-sm rounded-md"
                  >
                    {publicationType?.label || publication.publication_type}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">Type</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-lg">
              <CardContent className="pt-4">
                <div className="text-center">
                  <Badge 
                    className={`${publicationStatus?.color || 'bg-gray-100 text-gray-800'} text-sm rounded-md`}
                  >
                    {publicationStatus?.label || publication.status}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">Status</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-lg">
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-lg font-text text-gray-900 dark:text-white">
                    {publication.impact_factor || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Impact Factor</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Publication Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Journal Information */}
              {publication.journal_name && (
                <div>
                  <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Publication Details
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-full space-y-2">
                    <p><strong>Journal:</strong> {publication.journal_name}</p>
                    {publication.volume && <p><strong>Volume:</strong> {publication.volume}</p>}
                    {publication.issue && <p><strong>Issue:</strong> {publication.issue}</p>}
                    {publication.pages && <p><strong>Pages:</strong> {publication.pages}</p>}
                  </div>
                </div>
              )}

              {/* Publication Date */}
              <div>
                <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Publication Date
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {format(new Date(publication.publication_date), 'MMMM dd, yyyy')}
                </p>
              </div>

              {/* Research Area */}
              <div>
                <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Research Area
                </h3>
                <Badge variant="outline" className="rounded-md">
                  {publication.research_area}
                </Badge>
              </div>

              {/* Funding */}
              {publication.funding_source && (
                <div>
                  <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Funding Source
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{publication.funding_source}</p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Authors */}
              <div>
                <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Authors
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-600 dark:text-gray-300">{publication.authors.join(', ')}</p>
                  <p className="text-sm text-gray-500">
                    <strong>Corresponding author:</strong> {publication.corresponding_author}
                  </p>
                </div>
              </div>

              {/* Institutions */}
              {publication.affiliated_institutions.length > 0 && (
                <div>
                  <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Affiliated Institutions
                  </h3>
                  <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                    {publication.affiliated_institutions.map((institution, idx) => (
                      <li key={idx} className="text-sm">• {institution}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Publication Characteristics */}
              <div>
                <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2">
                  Publication Characteristics
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-sm ${publication.peer_reviewed ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className="text-sm">{publication.peer_reviewed ? 'Peer Reviewed' : 'Not Peer Reviewed'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-sm ${publication.open_access ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                    <span className="text-sm">{publication.open_access ? 'Open Access' : 'Closed Access'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Abstract */}
          <div>
            <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2">Abstract</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {publication.abstract}
            </p>
          </div>

          {/* Keywords */}
          {publication.keywords.length > 0 && (
            <div>
              <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {publication.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="outline" className="rounded-md">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {(publication.doi || publication.pmid || publication.pdf_url) && (
            <div>
              <h3 className="text-lg font-text text-gray-900 dark:text-white mb-2">Links</h3>
              <div className="space-y-2">
                {publication.doi && (
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                    <a 
                      href={`https://doi.org/${publication.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      DOI: {publication.doi}
                    </a>
                  </div>
                )}
                {publication.pmid && (
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-green-500" />
                    <a 
                      href={`https://pubmed.ncbi.nlm.nih.gov/${publication.pmid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      PubMed: {publication.pmid}
                    </a>
                  </div>
                )}
                {publication.pdf_url && (
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-red-500" />
                    <a 
                      href={publication.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:underline"
                    >
                      Full Text PDF
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-500 pt-4 border-t">
            <p>Created: {format(new Date(publication.created_at), 'PPP')}</p>
            <p>Last updated: {format(new Date(publication.updated_at), 'PPP')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}