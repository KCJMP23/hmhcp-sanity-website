/**
 * Version Comparison Component - Visual diff viewer for content versions
 * Story 1.4 Task 5 - Content versioning system with comprehensive diff visualization
 * 
 * Features:
 * - Side-by-side and unified diff views
 * - Syntax highlighting for different content types
 * - Collapsible sections for large diffs
 * - Export diff reports
 * - Performance optimized for large content
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ChevronDownIcon, ChevronRightIcon, DocumentTextIcon, EyeIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ContentVersion, 
  VersionDiff, 
  DiffItem, 
  DiffType 
} from '@/lib/dal/admin/types'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

interface VersionComparisonProps {
  fromVersion: ContentVersion
  toVersion: ContentVersion
  diff?: VersionDiff | null
  loading?: boolean
  onRefresh?: () => void
  onExport?: () => void
  className?: string
}

interface DiffChunk {
  type: 'unchanged' | 'added' | 'removed' | 'modified'
  path: string
  oldValue?: any
  newValue?: any
  changes: DiffItem[]
  expanded: boolean
}

/**
 * Main Version Comparison Component
 */
export function VersionComparison({
  fromVersion,
  toVersion,
  diff,
  loading = false,
  onRefresh,
  onExport,
  className
}: VersionComparisonProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side')
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChangeType, setSelectedChangeType] = useState<DiffType | 'all'>('all')

  // Process diff into manageable chunks
  const diffChunks = useMemo(() => {
    if (!diff?.changes) return []

    const chunks: DiffChunk[] = []
    const pathGroups = new Map<string, DiffItem[]>()

    // Group changes by path
    diff.changes.forEach(change => {
      const basePath = change.path.split('.')[0]
      if (!pathGroups.has(basePath)) {
        pathGroups.set(basePath, [])
      }
      pathGroups.get(basePath)!.push(change)
    })

    // Create chunks from grouped changes
    pathGroups.forEach((changes, path) => {
      const chunk: DiffChunk = {
        type: determineChunkType(changes),
        path,
        changes,
        expanded: expandedChunks.has(path),
        oldValue: changes[0]?.oldValue,
        newValue: changes[0]?.newValue
      }
      chunks.push(chunk)
    })

    return chunks.sort((a, b) => a.path.localeCompare(b.path))
  }, [diff, expandedChunks])

  // Filter chunks based on search and change type
  const filteredChunks = useMemo(() => {
    return diffChunks.filter(chunk => {
      const matchesSearch = !searchQuery || 
        chunk.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chunk.changes.some(change => 
          JSON.stringify(change.oldValue || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          JSON.stringify(change.newValue || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      
      const matchesType = selectedChangeType === 'all' || 
        chunk.changes.some(change => change.type === selectedChangeType)

      return matchesSearch && matchesType
    })
  }, [diffChunks, searchQuery, selectedChangeType])

  const toggleChunkExpansion = (path: string) => {
    const newExpanded = new Set(expandedChunks)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedChunks(newExpanded)
  }

  const expandAll = () => {
    setExpandedChunks(new Set(diffChunks.map(chunk => chunk.path)))
  }

  const collapseAll = () => {
    setExpandedChunks(new Set())
  }

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ArrowsRightLeftIcon className="h-5 w-5 animate-spin" />
            <span>Comparing versions...</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-20 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!diff) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No comparison data available</p>
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline">
                Load Comparison
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <ArrowsRightLeftIcon className="h-5 w-5" />
            <span>Version Comparison</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {onExport && (
              <Button onClick={onExport} variant="outline" size="sm">
                Export Diff
              </Button>
            )}
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Version Headers */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="destructive">From</Badge>
              <span className="font-medium">Version {fromVersion.version_number}</span>
            </div>
            <p className="text-sm text-gray-600 truncate">{fromVersion.title}</p>
            <p className="text-xs text-gray-500">
              {new Date(fromVersion.created_at).toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="default" className="bg-green-600">To</Badge>
              <span className="font-medium">Version {toVersion.version_number}</span>
            </div>
            <p className="text-sm text-gray-600 truncate">{toVersion.title}</p>
            <p className="text-xs text-gray-500">
              {new Date(toVersion.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center space-x-4 mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">+{diff.summary.additions} additions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm">{diff.summary.modifications} modifications</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm">-{diff.summary.deletions} deletions</span>
          </div>
          <div className="ml-auto text-sm text-gray-600">
            {diff.summary.totalChanges} total changes
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <TabsList>
                <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                <TabsTrigger value="unified">Unified</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center space-x-2">
              <Button onClick={expandAll} variant="outline" size="sm">
                Expand All
              </Button>
              <Button onClick={collapseAll} variant="outline" size="sm">
                Collapse All
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search changes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
            <select
              value={selectedChangeType}
              onChange={(e) => setSelectedChangeType(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">All Changes</option>
              <option value="added">Added</option>
              <option value="modified">Modified</option>
              <option value="removed">Removed</option>
            </select>
          </div>
        </div>

        {/* Diff Content */}
        <ScrollArea className="max-h-[600px]">
          {filteredChunks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No changes match your current filters
            </div>
          ) : (
            <div className="space-y-4">
              {filteredChunks.map((chunk) => (
                <DiffChunkComponent
                  key={chunk.path}
                  chunk={chunk}
                  viewMode={viewMode}
                  onToggleExpansion={() => toggleChunkExpansion(chunk.path)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

/**
 * Individual Diff Chunk Component
 */
interface DiffChunkComponentProps {
  chunk: DiffChunk
  viewMode: 'side-by-side' | 'unified'
  onToggleExpansion: () => void
}

function DiffChunkComponent({ chunk, viewMode, onToggleExpansion }: DiffChunkComponentProps) {
  const chunkTypeColors = {
    unchanged: 'border-gray-200 bg-gray-50',
    added: 'border-green-200 bg-green-50',
    removed: 'border-red-200 bg-red-50',
    modified: 'border-blue-200 bg-blue-50'
  }

  const chunkTypeBadges = {
    unchanged: <Badge variant="secondary">Unchanged</Badge>,
    added: <Badge className="bg-green-600">Added</Badge>,
    removed: <Badge variant="destructive">Removed</Badge>,
    modified: <Badge className="bg-blue-600">Modified</Badge>
  }

  return (
    <div className={cn('border rounded-lg', chunkTypeColors[chunk.type])}>
      {/* Chunk Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/50"
        onClick={onToggleExpansion}
      >
        <div className="flex items-center space-x-3">
          {chunk.expanded ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
          <span className="font-medium">{chunk.path}</span>
          {chunkTypeBadges[chunk.type]}
          <span className="text-sm text-gray-500">
            {chunk.changes.length} change{chunk.changes.length !== 1 ? 's' : ''}
          </span>
        </div>
        <EyeIcon className="h-4 w-4 text-gray-400" />
      </div>

      {/* Chunk Content */}
      {chunk.expanded && (
        <div className="border-t border-gray-200">
          {viewMode === 'side-by-side' ? (
            <SideBySideDiffView changes={chunk.changes} />
          ) : (
            <UnifiedDiffView changes={chunk.changes} />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Side-by-side diff view
 */
function SideBySideDiffView({ changes }: { changes: DiffItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-gray-200">
      <div className="bg-red-50 p-3">
        <div className="text-xs font-medium text-red-800 mb-2">OLD</div>
        {changes.map((change, index) => (
          <div key={index} className="mb-2">
            <div className="text-xs text-gray-600 mb-1">{change.path}</div>
            <div className="bg-red-100 border border-red-200 rounded p-2 text-sm">
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {formatValue(change.oldValue)}
              </pre>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-green-50 p-3">
        <div className="text-xs font-medium text-green-800 mb-2">NEW</div>
        {changes.map((change, index) => (
          <div key={index} className="mb-2">
            <div className="text-xs text-gray-600 mb-1">{change.path}</div>
            <div className="bg-green-100 border border-green-200 rounded p-2 text-sm">
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {formatValue(change.newValue)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Unified diff view
 */
function UnifiedDiffView({ changes }: { changes: DiffItem[] }) {
  return (
    <div className="p-3">
      {changes.map((change, index) => (
        <div key={index} className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-medium text-gray-600">{change.path}</span>
            <DiffTypeBadge type={change.type} />
          </div>
          <div className="border border-gray-200 rounded overflow-hidden">
            {change.oldValue !== undefined && (
              <div className="bg-red-50 border-b border-red-200 p-2">
                <div className="text-xs text-red-800 mb-1">- Removed</div>
                <pre className="whitespace-pre-wrap font-mono text-xs text-red-900">
                  {formatValue(change.oldValue)}
                </pre>
              </div>
            )}
            {change.newValue !== undefined && (
              <div className="bg-green-50 p-2">
                <div className="text-xs text-green-800 mb-1">+ Added</div>
                <pre className="whitespace-pre-wrap font-mono text-xs text-green-900">
                  {formatValue(change.newValue)}
                </pre>
              </div>
            )}
          </div>
          {change.description && (
            <p className="text-xs text-gray-500 mt-1">{change.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Diff type badge component
 */
function DiffTypeBadge({ type }: { type: DiffType }) {
  const badges = {
    [DiffType.ADDED]: <Badge className="bg-green-600 text-white">Added</Badge>,
    [DiffType.REMOVED]: <Badge variant="destructive">Removed</Badge>,
    [DiffType.MODIFIED]: <Badge className="bg-blue-600 text-white">Modified</Badge>,
    [DiffType.MOVED]: <Badge className="bg-purple-600 text-white">Moved</Badge>,
    [DiffType.UNCHANGED]: <Badge variant="secondary">Unchanged</Badge>
  }

  return badges[type] || <Badge variant="outline">{type}</Badge>
}

/**
 * Utility Functions
 */
function determineChunkType(changes: DiffItem[]): DiffChunk['type'] {
  const types = changes.map(c => c.type)
  
  if (types.includes(DiffType.ADDED) && types.includes(DiffType.REMOVED)) {
    return 'modified'
  }
  if (types.includes(DiffType.ADDED)) {
    return 'added'
  }
  if (types.includes(DiffType.REMOVED)) {
    return 'removed'
  }
  if (types.includes(DiffType.MODIFIED)) {
    return 'modified'
  }
  
  return 'unchanged'
}

function formatValue(value: any): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

export default VersionComparison