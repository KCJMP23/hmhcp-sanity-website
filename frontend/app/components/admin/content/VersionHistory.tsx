/**
 * Version History Component - Timeline view of content version history
 * Story 1.4 Task 5 - Content versioning system history timeline
 * 
 * Features:
 * - Interactive timeline with version nodes
 * - Version details and metadata
 * - Quick actions (view, compare, rollback)
 * - Branch visualization for draft workflows  
 * - Filtering and search capabilities
 * - Pagination for large histories
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  ClockIcon, 
  UserIcon, 
  TagIcon, 
  EyeIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ContentVersion, VersionAnnotation } from '@/lib/dal/admin/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface VersionHistoryProps {
  contentType: string
  contentId: string
  versions?: ContentVersion[]
  currentVersion?: ContentVersion
  loading?: boolean
  totalVersions?: number
  page?: number
  pageSize?: number
  onVersionSelect?: (version: ContentVersion) => void
  onVersionCompare?: (from: ContentVersion, to: ContentVersion) => void
  onVersionRollback?: (version: ContentVersion) => void
  onVersionView?: (version: ContentVersion) => void
  onPageChange?: (page: number) => void
  onRefresh?: () => void
  className?: string
}

interface TimelineFilter {
  search: string
  branch: string
  status: 'all' | 'published' | 'draft' | 'current'
  dateRange: 'all' | 'week' | 'month' | 'year'
  author: string
}

/**
 * Main Version History Component
 */
export function VersionHistory({
  contentType,
  contentId,
  versions = [],
  currentVersion,
  loading = false,
  totalVersions = 0,
  page = 1,
  pageSize = 20,
  onVersionSelect,
  onVersionCompare,
  onVersionRollback,
  onVersionView,
  onPageChange,
  onRefresh,
  className
}: VersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<TimelineFilter>({
    search: '',
    branch: 'all',
    status: 'all',
    dateRange: 'all',
    author: 'all'
  })

  // Process versions for timeline display
  const processedVersions = useMemo(() => {
    return versions.map((version, index) => ({
      ...version,
      isFirst: index === 0,
      isLast: index === versions.length - 1,
      isCurrent: currentVersion?.id === version.id,
      timeFromNow: formatDistanceToNow(new Date(version.created_at), { addSuffix: true })
    }))
  }, [versions, currentVersion])

  // Filter versions
  const filteredVersions = useMemo(() => {
    return processedVersions.filter(version => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          version.title.toLowerCase().includes(searchLower) ||
          version.change_description?.toLowerCase().includes(searchLower) ||
          version.branch_name.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      // Branch filter
      if (filters.branch !== 'all' && version.branch_name !== filters.branch) {
        return false
      }

      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'published' && !version.is_published) return false
        if (filters.status === 'draft' && !version.is_draft) return false
        if (filters.status === 'current' && !version.is_current) return false
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const versionDate = new Date(version.created_at)
        const now = new Date()
        const daysDiff = (now.getTime() - versionDate.getTime()) / (1000 * 60 * 60 * 24)

        if (filters.dateRange === 'week' && daysDiff > 7) return false
        if (filters.dateRange === 'month' && daysDiff > 30) return false
        if (filters.dateRange === 'year' && daysDiff > 365) return false
      }

      return true
    })
  }, [processedVersions, filters])

  // Get unique branches and authors for filter dropdowns
  const uniqueBranches = useMemo(() => {
    const branches = new Set(versions.map(v => v.branch_name))
    return Array.from(branches).sort()
  }, [versions])

  const uniqueAuthors = useMemo(() => {
    const authors = new Set(versions.map(v => v.created_by))
    return Array.from(authors).sort()
  }, [versions])

  const handleVersionSelect = (version: ContentVersion) => {
    if (selectedVersions.has(version.id)) {
      const newSelected = new Set(selectedVersions)
      newSelected.delete(version.id)
      setSelectedVersions(newSelected)
    } else {
      const newSelected = new Set(selectedVersions)
      newSelected.add(version.id)
      setSelectedVersions(newSelected)
    }
  }

  const handleCompareSelected = () => {
    if (selectedVersions.size === 2) {
      const [firstId, secondId] = Array.from(selectedVersions)
      const firstVersion = versions.find(v => v.id === firstId)
      const secondVersion = versions.find(v => v.id === secondId)
      
      if (firstVersion && secondVersion && onVersionCompare) {
        // Compare older version to newer version
        const olderVersion = firstVersion.version_number < secondVersion.version_number 
          ? firstVersion : secondVersion
        const newerVersion = firstVersion.version_number > secondVersion.version_number 
          ? firstVersion : secondVersion
        
        onVersionCompare(olderVersion, newerVersion)
      }
    }
  }

  const clearSelection = () => {
    setSelectedVersions(new Set())
  }

  const totalPages = Math.ceil(totalVersions / pageSize)

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 animate-spin" />
            <span>Loading version history...</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start space-x-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
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
            <ClockIcon className="h-5 w-5" />
            <span>Version History</span>
            <Badge variant="outline">
              {totalVersions} version{totalVersions !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>

          <div className="flex items-center space-x-2">
            {selectedVersions.size > 0 && (
              <>
                <Badge variant="secondary">
                  {selectedVersions.size} selected
                </Badge>
                {selectedVersions.size === 2 && (
                  <Button
                    onClick={handleCompareSelected}
                    size="sm"
                    variant="outline"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                    Compare
                  </Button>
                )}
                <Button
                  onClick={clearSelection}
                  size="sm"
                  variant="outline"
                >
                  Clear
                </Button>
              </>
            )}
            
            <Button
              onClick={() => setShowFilters(!showFilters)}
              size="sm"
              variant="outline"
            >
              <FunnelIcon className="h-4 w-4" />
            </Button>

            {onRefresh && (
              <Button onClick={onRefresh} size="sm" variant="outline">
                <ArrowPathIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search versions..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Branch</label>
                <Select
                  value={filters.branch}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, branch: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All branches</SelectItem>
                    {uniqueBranches.map(branch => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value: any) => setFilters(prev => ({ ...prev, dateRange: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All dates</SelectItem>
                    <SelectItem value="week">Last week</SelectItem>
                    <SelectItem value="month">Last month</SelectItem>
                    <SelectItem value="year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Timeline */}
        <ScrollArea className="max-h-[600px]">
          {filteredVersions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {versions.length === 0 ? 'No versions found' : 'No versions match your filters'}
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>

              <div className="space-y-6">
                {filteredVersions.map((version) => (
                  <VersionTimelineNode
                    key={version.id}
                    version={version}
                    isSelected={selectedVersions.has(version.id)}
                    onSelect={() => handleVersionSelect(version)}
                    onView={() => onVersionView?.(version)}
                    onRollback={() => onVersionRollback?.(version)}
                    onCompare={() => onVersionCompare?.(version, currentVersion!)}
                    canRollback={!version.isCurrent && !!onVersionRollback}
                  />
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing page {page} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => onPageChange?.(page - 1)}
                  disabled={page <= 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  onClick={() => onPageChange?.(page + 1)}
                  disabled={page >= totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Timeline Node Component for Individual Versions
 */
interface VersionTimelineNodeProps {
  version: ContentVersion & { 
    isFirst: boolean
    isLast: boolean
    isCurrent: boolean
    timeFromNow: string
  }
  isSelected: boolean
  onSelect: () => void
  onView: () => void
  onRollback: () => void
  onCompare: () => void
  canRollback: boolean
}

function VersionTimelineNode({
  version,
  isSelected,
  onSelect,
  onView,
  onRollback,
  onCompare,
  canRollback
}: VersionTimelineNodeProps) {
  const getVersionIcon = () => {
    if (version.isCurrent) {
      return <CheckCircleIcon className="h-8 w-8 text-green-600" />
    }
    if (version.is_published) {
      return <InformationCircleIcon className="h-8 w-8 text-blue-600" />
    }
    return <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
  }

  const getVersionStatus = () => {
    const statuses = []
    if (version.isCurrent) statuses.push('Current')
    if (version.is_published) statuses.push('Published')
    if (version.is_draft) statuses.push('Draft')
    if (version.is_protected) statuses.push('Protected')
    return statuses
  }

  return (
    <div className="relative flex items-start space-x-4">
      {/* Timeline Node */}
      <div className="relative z-10 flex-shrink-0">
        <div 
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full border-2 cursor-pointer transition-colors",
            isSelected 
              ? "bg-blue-600 border-blue-600" 
              : version.isCurrent 
                ? "bg-green-50 border-green-600" 
                : "bg-white border-gray-300 hover:border-gray-400"
          )}
          onClick={onSelect}
        >
          {isSelected ? (
            <CheckCircleIcon className="h-5 w-5 text-white" />
          ) : (
            <div className={cn(
              "w-3 h-3 rounded-full",
              version.isCurrent ? "bg-green-600" : "bg-gray-300"
            )} />
          )}
        </div>
      </div>

      {/* Version Card */}
      <div className={cn(
        "flex-1 min-w-0 bg-white border rounded-lg p-4 transition-shadow hover:shadow-md",
        isSelected && "ring-2 ring-blue-500",
        version.isCurrent && "border-green-200 bg-green-50"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                Version {version.version_number}
              </h4>
              {getVersionStatus().map(status => (
                <Badge
                  key={status}
                  variant={
                    status === 'Current' ? 'default' :
                    status === 'Published' ? 'secondary' :
                    status === 'Protected' ? 'destructive' :
                    'outline'
                  }
                  className="text-xs"
                >
                  {status}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-gray-900 mb-2 truncate">{version.title}</p>
            {version.change_description && (
              <p className="text-xs text-gray-600 mb-2">{version.change_description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 ml-4">
            <Button
              onClick={onView}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={onCompare}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </Button>

            {canRollback && (
              <Button
                onClick={onRollback}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <UserIcon className="h-3 w-3" />
            <span>{version.created_by}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-3 w-3" />
            <span>{version.timeFromNow}</span>
          </div>
          <div className="flex items-center space-x-1">
            <TagIcon className="h-3 w-3" />
            <span>{version.branch_name}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VersionHistory