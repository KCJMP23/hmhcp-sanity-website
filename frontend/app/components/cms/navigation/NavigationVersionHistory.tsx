'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  History, 
  RotateCcw, 
  MessageSquare, 
  User, 
  Calendar, 
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
// Removed sonner dependency - using console.log for notifications
import { formatDistanceToNow } from 'date-fns'

interface NavigationVersion {
  id: string
  navigation_id: string
  version_number: number
  structure: any[]
  comment?: string
  auto_save: boolean
  changes_summary?: string
  created_at: string
  created_by: string
  creator: {
    id: string
    email: string
    full_name: string
  }
  itemCount: number
  isCurrentVersion: boolean
}

interface NavigationVersionHistoryProps {
  navigationId: string
  navigationName: string
  currentVersion?: number
  onVersionRestore?: () => void
}

export function NavigationVersionHistory({
  navigationId,
  navigationName,
  currentVersion,
  onVersionRestore
}: NavigationVersionHistoryProps) {
  const [versions, setVersions] = useState<NavigationVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateVersionDialog, setShowCreateVersionDialog] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<NavigationVersion | null>(null)
  const [versionComment, setVersionComment] = useState('')
  const [restoring, setRestoring] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchVersions()
  }, [navigationId, page])

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/navigations/${navigationId}/versions?page=${page}&limit=10`
      )
      if (!response.ok) throw new Error('Failed to fetch versions')
      
      const data = await response.json()
      
      // Mark current version
      const enrichedVersions = data.versions.map((version: NavigationVersion) => ({
        ...version,
        isCurrentVersion: version.version_number === currentVersion
      }))
      
      setVersions(enrichedVersions)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const createVersion = async () => {
    setCreating(true)
    try {
      const response = await fetch(`/api/admin/navigations/${navigationId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          comment: versionComment.trim() || undefined
        })
      })

      if (!response.ok) throw new Error('Failed to create version')

      console.log('Version created successfully')
      setShowCreateVersionDialog(false)
      setVersionComment('')
      fetchVersions()
    } catch (error) {
      console.error('Failed to create version')
    } finally {
      setCreating(false)
    }
  }

  const restoreVersion = async (version: NavigationVersion) => {
    setRestoring(true)
    try {
      const response = await fetch(
        `/api/admin/navigations/${navigationId}/versions/${version.id}/restore`,
        { method: 'POST' }
      )

      if (!response.ok) throw new Error('Failed to restore version')

      const result = await response.json()
      console.log(`Successfully restored to version ${version.version_number}`)
      setShowRestoreDialog(false)
      setSelectedVersion(null)
      fetchVersions()
      onVersionRestore?.()
    } catch (error) {
      console.error('Failed to restore version')
    } finally {
      setRestoring(false)
    }
  }

  const getVersionBadgeVariant = (version: NavigationVersion) => {
    if (version.isCurrentVersion) return 'default'
    if (version.auto_save) return 'secondary'
    return 'outline'
  }

  const getVersionBadgeText = (version: NavigationVersion) => {
    if (version.isCurrentVersion) return 'Current'
    if (version.auto_save) return 'Auto-save'
    return `v${version.version_number}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </h3>
          <p className="text-sm text-muted-foreground">
            Track and restore previous versions of {navigationName}
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateVersionDialog(true)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Create Version
        </Button>
      </div>

      {/* Version List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Loading version history...</p>
          </div>
        ) : versions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">No versions found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first version to start tracking changes
              </p>
              <Button onClick={() => setShowCreateVersionDialog(true)}>
                Create First Version
              </Button>
            </CardContent>
          </Card>
        ) : (
          versions.map((version) => (
            <Card key={version.id} className={version.isCurrentVersion ? 'ring-2 ring-blue-500' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={getVersionBadgeVariant(version)}>
                        {getVersionBadgeText(version)}
                      </Badge>
                      {version.comment && (
                        <span className="text-sm font-medium">{version.comment}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {version.creator.full_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {version.itemCount} items
                      </div>
                    </div>

                    {version.changes_summary && (
                      <p className="text-sm text-muted-foreground">
                        {version.changes_summary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Production implementation: Open preview in new tab
                        const previewUrl = `/preview/navigation?version=${version.id}`
                        window.open(previewUrl, '_blank', 'noopener,noreferrer')
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!version.isCurrentVersion && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedVersion(version)
                          setShowRestoreDialog(true)
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Create Version Dialog */}
      <Dialog open={showCreateVersionDialog} onOpenChange={setShowCreateVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Save the current state of the navigation as a new version
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="version-comment" className="text-sm font-medium">
                Version Comment (Optional)
              </label>
              <Textarea
                id="version-comment"
                placeholder="Describe the changes made in this version..."
                value={versionComment}
                onChange={(e) => setVersionComment(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateVersionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={createVersion} disabled={creating}>
              {creating ? 'Creating...' : 'Create Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Version Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version {selectedVersion?.version_number}</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current navigation structure with version{' '}
              {selectedVersion?.version_number}. The current state will be saved as a new version
              before restoring.
              {selectedVersion?.comment && (
                <div className="mt-2 p-3 bg-muted text-sm">
                  <strong>Version comment:</strong> {selectedVersion.comment}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedVersion && restoreVersion(selectedVersion)}
              disabled={restoring}
            >
              {restoring ? 'Restoring...' : 'Restore Version'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}