'use client'

import { useState, useEffect } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  Clock, 
  User, 
  FileText, 
  RotateCcw, 
  ChevronDown,
  ChevronUp,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { logger } from '@/lib/logger';

interface Revision {
  id: string
  page_id: string
  revision_number: number
  title: string
  content: any
  meta_data: {
    status?: string
    excerpt?: string
    meta_title?: string
    meta_description?: string
  }
  created_by: string
  created_at: string
  notes?: string
  author?: {
    name?: string
    email?: string
  }
}

interface RevisionCompare {
  field: string
  old_value: any
  new_value: any
}

interface RevisionHistoryProps {
  pageId: string
  currentTitle?: string
  onRestore?: (revisionId: string) => void
  className?: string
}

export function RevisionHistory({ 
  pageId, 
  currentTitle = 'Page',
  onRestore,
  className 
}: RevisionHistoryProps) {
  const { user } = useAuth()
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null)
  const [restoringRevision, setRestoringRevision] = useState<string | null>(null)
  const [comparing, setComparing] = useState<{ revision1: string | null, revision2: string | null }>({
    revision1: null,
    revision2: null
  })

  useEffect(() => {
    fetchRevisions()
  }, [pageId])

  const fetchRevisions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/cms/content/pages/${pageId}/revisions`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch revisions')
      }

      const data = await response.json()
      setRevisions(data.revisions || [])

    } catch (error) {
      logger.error('Error fetching revisions:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      setError('Failed to load revision history')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (revisionId: string, revisionNumber: number) => {
    if (!confirm(`Are you sure you want to restore revision #${revisionNumber}? This will overwrite the current content.`)) {
      return
    }

    setRestoringRevision(revisionId)

    try {
      const response = await fetch(`/api/cms/content/pages/${pageId}/restore/${revisionNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: `Restored from revision #${revisionNumber}`
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to restore revision')
      }

      // Refresh revisions
      await fetchRevisions()

      // Call parent callback if provided
      if (onRestore) {
        onRestore(revisionId)
      }

    } catch (error) {
      logger.error('Error restoring revision:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      alert(error instanceof Error ? error.message : 'Failed to restore revision')
    } finally {
      setRestoringRevision(null)
    }
  }

  const compareRevisions = (rev1: Revision, rev2: Revision): RevisionCompare[] => {
    const changes: RevisionCompare[] = []

    // Compare titles
    if (rev1.title !== rev2.title) {
      changes.push({
        field: 'Title',
        old_value: rev1.title,
        new_value: rev2.title
      })
    }

    // Compare metadata
    const meta1 = rev1.meta_data || {}
    const meta2 = rev2.meta_data || {}

    if (meta1.excerpt !== meta2.excerpt) {
      changes.push({
        field: 'Excerpt',
        old_value: meta1.excerpt || '',
        new_value: meta2.excerpt || ''
      })
    }

    if (meta1.status !== meta2.status) {
      changes.push({
        field: 'Status',
        old_value: meta1.status || '',
        new_value: meta2.status || ''
      })
    }

    // Add content change indicator (don't show full content diff)
    const content1 = JSON.stringify(rev1.content)
    const content2 = JSON.stringify(rev2.content)
    if (content1 !== content2) {
      changes.push({
        field: 'Content',
        old_value: `${content1.length} characters`,
        new_value: `${content2.length} characters`
      })
    }

    return changes
  }

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center gap-2 text-red-600 dark:text-blue-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    )
  }

  const canRestore = user?.role === 'super_admin' || user?.role === 'editor'

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Revision History
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {revisions.length} revision{revisions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {revisions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No revision history available</p>
            <p className="text-sm mt-1">Changes will be tracked as you edit</p>
          </div>
        ) : (
          <div className="space-y-2">
            {revisions.map((revision, index) => {
              const isExpanded = expandedRevision === revision.id
              const isLatest = index === 0
              const previousRevision = index < revisions.length - 1 ? revisions[index + 1] : null

              return (
                <div
                  key={revision.id}
                  className={cn(
                    "border  transition-colors",
                    isLatest 
                      ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20" 
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedRevision(isExpanded ? null : revision.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Revision #{revision.revision_number}
                          </span>
                          {isLatest && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                              Current
                            </span>
                          )}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(revision.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {revision.author?.name || revision.author?.email || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(revision.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>

                        {revision.notes && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                            "{revision.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {canRestore && !isLatest && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRestore(revision.id, revision.revision_number)
                            }}
                            disabled={restoringRevision === revision.id}
                            className="gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            {restoringRevision === revision.id ? 'Restoring...' : 'Restore'}
                          </Button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Revision Details
                          </h4>
                          <dl className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <dt className="text-gray-500 dark:text-gray-400">Title:</dt>
                              <dd className="text-gray-900 dark:text-gray-100">{revision.title}</dd>
                            </div>
                            {revision.meta_data?.status && (
                              <div>
                                <dt className="text-gray-500 dark:text-gray-400">Status:</dt>
                                <dd className="text-gray-900 dark:text-gray-100">{revision.meta_data.status}</dd>
                              </div>
                            )}
                            {revision.meta_data?.excerpt && (
                              <div className="col-span-2">
                                <dt className="text-gray-500 dark:text-gray-400">Excerpt:</dt>
                                <dd className="text-gray-900 dark:text-gray-100 line-clamp-2">
                                  {revision.meta_data.excerpt}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>

                        {previousRevision && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                              Changes from Previous Revision
                            </h4>
                            <div className="space-y-1">
                              {compareRevisions(previousRevision, revision).map((change, i) => (
                                <div key={i} className="text-sm">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {change.field}:
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                                    {change.old_value} → {change.new_value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}