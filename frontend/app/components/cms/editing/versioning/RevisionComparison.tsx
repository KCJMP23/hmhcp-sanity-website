'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  GitBranch,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Info,
  Download,
  Merge,
  Eye,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DiffViewer } from './DiffViewer'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'

interface Revision {
  id: string
  version: number
  title: string
  content: any
  excerpt: string
  author: {
    id: string
    name: string
    email: string
  }
  metadata?: any
  changeType?: 'minor' | 'major' | 'auto' | 'manual'
  changes?: any
  createdAt: string
}

interface RevisionComparisonProps {
  contentId: string
  leftRevisionId?: string
  rightRevisionId?: string
  onMerge?: (leftId: string, rightId: string) => Promise<void>
  onClose?: () => void
  className?: string
}

export function RevisionComparison({
  contentId,
  leftRevisionId: initialLeftId,
  rightRevisionId: initialRightId,
  onMerge,
  onClose,
  className
}: RevisionComparisonProps) {
  const { user } = useAuth()
  
  const [leftRevision, setLeftRevision] = useState<Revision | null>(null)
  const [rightRevision, setRightRevision] = useState<Revision | null>(null)
  const [availableRevisions, setAvailableRevisions] = useState<Revision[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMerging, setIsMerging] = useState(false)
  const [comparisonMode, setComparisonMode] = useState<'visual' | 'technical'>('visual')
  
  // Load available revisions
  useEffect(() => {
    loadRevisions()
  }, [contentId])

  const loadRevisions = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/cms/content/pages/${contentId}/revisions?limit=50`)

      if (!response.ok) {
        throw new Error('Failed to load revisions')
      }

      const data = await response.json()
      setAvailableRevisions(data.revisions)

      // Set initial revisions if provided
      if (initialLeftId && initialRightId) {
        const left = data.revisions.find((r: Revision) => r.id === initialLeftId)
        const right = data.revisions.find((r: Revision) => r.id === initialRightId)
        
        if (left) setLeftRevision(left)
        if (right) setRightRevision(right)
      } else if (data.revisions.length >= 2) {
        // Default to comparing two most recent versions
        setLeftRevision(data.revisions[1])
        setRightRevision(data.revisions[0])
      }

    } catch (error) {
      toast({ title: "Error", description: 'Failed to load revisions', variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // Load specific revision details
  const loadRevisionDetails = async (revisionId: string) => {
    try {
      const response = await fetch(`/api/cms/content/revisions/${revisionId}`)

      if (!response.ok) {
        throw new Error('Failed to load revision details')
      }

      return await response.json()
    } catch (error) {
      toast({ title: "Error", description: 'Failed to load revision details', variant: "destructive" })
      return null
    }
  }

  // Handle revision selection
  const selectRevision = async (revisionId: string, side: 'left' | 'right') => {
    const revision = availableRevisions.find(r => r.id === revisionId)
    if (!revision) return

    // Load full details if needed
    const fullRevision = await loadRevisionDetails(revisionId)
    if (!fullRevision) return

    if (side === 'left') {
      setLeftRevision(fullRevision)
    } else {
      setRightRevision(fullRevision)
    }
  }

  // Swap revisions
  const swapRevisions = () => {
    const temp = leftRevision
    setLeftRevision(rightRevision)
    setRightRevision(temp)
  }

  // Export comparison
  const exportComparison = () => {
    if (!leftRevision || !rightRevision) return

    const data = {
      comparison: {
        left: {
          version: leftRevision.version,
          author: leftRevision.author.name,
          createdAt: leftRevision.createdAt,
          content: leftRevision.content
        },
        right: {
          version: rightRevision.version,
          author: rightRevision.author.name,
          createdAt: rightRevision.createdAt,
          content: rightRevision.content
        }
      },
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revision-comparison-v${leftRevision.version}-v${rightRevision.version}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Handle merge
  const handleMerge = async () => {
    if (!leftRevision || !rightRevision || !onMerge) return

    setIsMerging(true)
    try {
      await onMerge(leftRevision.id, rightRevision.id)
      toast({ title: "Success", description: 'Revisions merged successfully' })
      onClose?.()
    } catch (error) {
      toast({ title: "Error", description: 'Failed to merge revisions', variant: "destructive" })
    } finally {
      setIsMerging(false)
    }
  }

  // Get comparison statistics
  const getComparisonStats = () => {
    if (!leftRevision || !rightRevision) {
      return { additions: 0, deletions: 0, modifications: 0 }
    }

    // Simple comparison - in production, use proper diff algorithm
    const leftStr = JSON.stringify(leftRevision.content)
    const rightStr = JSON.stringify(rightRevision.content)
    
    return {
      additions: rightStr.length > leftStr.length ? rightStr.length - leftStr.length : 0,
      deletions: leftStr.length > rightStr.length ? leftStr.length - rightStr.length : 0,
      modifications: leftStr !== rightStr ? 1 : 0
    }
  }

  const stats = getComparisonStats()
  const canMerge = leftRevision && rightRevision && leftRevision.id !== rightRevision.id

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-700" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitBranch className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Revision Comparison</h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={exportComparison}
                disabled={!leftRevision || !rightRevision}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>

              {onMerge && canMerge && (
                <Button
                  size="sm"
                  onClick={handleMerge}
                  disabled={isMerging}
                  className="gap-2"
                >
                  <Merge className="w-4 h-4" />
                  Merge Revisions
                </Button>
              )}

              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  Close
                </Button>
              )}
            </div>
          </div>

          {/* Revision selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Left Revision</label>
              <select
                value={leftRevision?.id || ''}
                onChange={(e) => selectRevision(e.target.value, 'left')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select revision...</option>
                {availableRevisions.map(rev => (
                  <option key={rev.id} value={rev.id}>
                    v{rev.version} - {rev.author.name} ({new Date(rev.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Right Revision</label>
              <select
                value={rightRevision?.id || ''}
                onChange={(e) => selectRevision(e.target.value, 'right')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select revision...</option>
                {availableRevisions.map(rev => (
                  <option key={rev.id} value={rev.id}>
                    v{rev.version} - {rev.author.name} ({new Date(rev.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={swapRevisions}
              disabled={!leftRevision || !rightRevision}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Swap
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Comparison mode toggle */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant={comparisonMode === 'visual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonMode('visual')}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Visual
            </Button>
            <Button
              variant={comparisonMode === 'technical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonMode('technical')}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Technical
            </Button>
          </div>
        </div>
      </Card>

      {/* Revision details */}
      {leftRevision && rightRevision && (
        <>
          {/* Revision info cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 border-2 border-blue-200 dark:border-blue-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    v{leftRevision.version}
                  </Badge>
                  {leftRevision.changeType && (
                    <Badge variant="outline" className="text-xs">
                      {leftRevision.changeType}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Author:</span>
                    <span>{leftRevision.author.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Date:</span>
                    <span>{new Date(leftRevision.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Title:</span>
                    <span className="truncate">{leftRevision.title}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-2 border-blue-200 dark:border-blue-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-blue-50 text-blue-600">
                    v{rightRevision.version}
                  </Badge>
                  {rightRevision.changeType && (
                    <Badge variant="outline" className="text-xs">
                      {rightRevision.changeType}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Author:</span>
                    <span>{rightRevision.author.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Date:</span>
                    <span>{new Date(rightRevision.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Title:</span>
                    <span className="truncate">{rightRevision.title}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Comparison statistics */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-around text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>{stats.additions} additions</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>{stats.deletions} deletions</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span>{stats.modifications} modifications</span>
              </div>
            </div>
          </Card>

          {/* Diff viewer */}
          {comparisonMode === 'visual' ? (
            <DiffViewer
              oldContent={leftRevision.content}
              newContent={rightRevision.content}
              oldVersion={leftRevision.version}
              newVersion={rightRevision.version}
              oldAuthor={leftRevision.author.name}
              newAuthor={rightRevision.author.name}
              viewMode="split"
            />
          ) : (
            <Card className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Left Revision Metadata</h3>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 overflow-auto max-h-96">
                    {JSON.stringify({
                      ...leftRevision.metadata,
                      changes: leftRevision.changes
                    }, null, 2)}
                  </pre>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Right Revision Metadata</h3>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 overflow-auto max-h-96">
                    {JSON.stringify({
                      ...rightRevision.metadata,
                      changes: rightRevision.changes
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Empty state */}
      {(!leftRevision || !rightRevision) && !isLoading && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <GitBranch className="w-12 h-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              Select two revisions to compare
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}