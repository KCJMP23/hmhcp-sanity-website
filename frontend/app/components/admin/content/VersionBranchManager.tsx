/**
 * Version Branch Manager - Manage version branches for draft workflows
 * Story 1.4 Task 5 - Content versioning system branch management
 * 
 * Features:
 * - Create and manage version branches
 * - Branch visualization with tree view
 * - Merge branches back to main
 * - Branch conflict resolution
 * - Draft workflow integration
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  CodeBracketIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ContentVersion, VersionDiff } from '@/lib/dal/admin/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface VersionBranchManagerProps {
  contentType: string
  contentId: string
  versions?: ContentVersion[]
  currentBranch?: string
  loading?: boolean
  onCreateBranch?: (branchName: string, fromVersionId: string) => Promise<void>
  onSwitchBranch?: (branchName: string) => Promise<void>
  onMergeBranch?: (fromBranch: string, toBranch: string, message: string) => Promise<void>
  onDeleteBranch?: (branchName: string) => Promise<void>
  onCompareBranches?: (branch1: string, branch2: string) => Promise<VersionDiff>
  className?: string
}

interface BranchInfo {
  name: string
  versions: ContentVersion[]
  latestVersion: ContentVersion
  ahead: number
  behind: number
  isDraft: boolean
  isActive: boolean
}

interface MergeConflict {
  path: string
  baseValue: any
  sourceValue: any
  targetValue: any
  resolved: boolean
  resolution?: any
}

/**
 * Main Version Branch Manager Component
 */
export function VersionBranchManager({
  contentType,
  contentId,
  versions = [],
  currentBranch = 'main',
  loading = false,
  onCreateBranch,
  onSwitchBranch,
  onMergeBranch,
  onDeleteBranch,
  onCompareBranches,
  className
}: VersionBranchManagerProps) {
  const [showCreateBranch, setShowCreateBranch] = useState(false)
  const [showMergeBranch, setShowMergeBranch] = useState(false)
  const [selectedBranchForMerge, setSelectedBranchForMerge] = useState<string>('')
  const [branchName, setBranchName] = useState('')
  const [mergeMessage, setMergeMessage] = useState('')
  const [mergeConflicts, setMergeConflicts] = useState<MergeConflict[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>('')

  // Process versions into branches
  const branches = useMemo(() => {
    const branchMap = new Map<string, ContentVersion[]>()
    
    versions.forEach(version => {
      const branch = version.branch_name || 'main'
      if (!branchMap.has(branch)) {
        branchMap.set(branch, [])
      }
      branchMap.get(branch)!.push(version)
    })

    // Convert to BranchInfo objects
    const branchInfos: BranchInfo[] = []
    const mainVersions = branchMap.get('main') || []
    const mainLatest = mainVersions[0] // Assuming sorted by version number desc

    branchMap.forEach((branchVersions, branchName) => {
      const sortedVersions = branchVersions.sort((a, b) => b.version_number - a.version_number)
      const latestVersion = sortedVersions[0]
      
      // Calculate ahead/behind compared to main
      const ahead = branchName === 'main' ? 0 : sortedVersions.length
      const behind = branchName === 'main' ? 0 : mainVersions.length

      branchInfos.push({
        name: branchName,
        versions: sortedVersions,
        latestVersion,
        ahead,
        behind,
        isDraft: branchName !== 'main' && latestVersion?.is_draft,
        isActive: branchName === currentBranch
      })
    })

    return branchInfos.sort((a, b) => {
      if (a.name === 'main') return -1
      if (b.name === 'main') return 1
      return a.name.localeCompare(b.name)
    })
  }, [versions, currentBranch])

  const activeBranch = branches.find(b => b.isActive)
  const mainBranch = branches.find(b => b.name === 'main')

  const handleCreateBranch = async () => {
    if (!onCreateBranch || !branchName.trim() || !selectedVersion) return

    try {
      await onCreateBranch(branchName.trim(), selectedVersion)
      setShowCreateBranch(false)
      setBranchName('')
      setSelectedVersion('')
    } catch (error) {
      console.error('Failed to create branch:', error)
    }
  }

  const handleMergeBranch = async () => {
    if (!onMergeBranch || !selectedBranchForMerge || !mergeMessage.trim()) return

    try {
      await onMergeBranch(selectedBranchForMerge, 'main', mergeMessage.trim())
      setShowMergeBranch(false)
      setSelectedBranchForMerge('')
      setMergeMessage('')
      setMergeConflicts([])
    } catch (error) {
      console.error('Failed to merge branch:', error)
    }
  }

  const handleSwitchBranch = async (branchName: string) => {
    if (!onSwitchBranch) return

    try {
      await onSwitchBranch(branchName)
    } catch (error) {
      console.error('Failed to switch branch:', error)
    }
  }

  const handleCompareBranches = async (branch1: string, branch2: string) => {
    if (!onCompareBranches) return

    try {
      const diff = await onCompareBranches(branch1, branch2)
      // Handle diff display
      console.log('Branch comparison:', diff)
    } catch (error) {
      console.error('Failed to compare branches:', error)
    }
  }

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CodeBracketIcon className="h-5 w-5 animate-spin" />
            <span>Loading branch information...</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Branch Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CodeBracketIcon className="h-5 w-5" />
              <span>Version Branches</span>
              <Badge variant="outline">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowMergeBranch(true)}
                disabled={!activeBranch || activeBranch.name === 'main'}
                variant="outline"
                size="sm"
              >
                <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
                Merge Branch
              </Button>
              <Button onClick={() => setShowCreateBranch(true)} size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                New Branch
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Current Branch Info */}
          {activeBranch && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className="bg-blue-600">Current</Badge>
                    <span className="font-medium">{activeBranch.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {activeBranch.versions.length} version{activeBranch.versions.length !== 1 ? 's' : ''}
                    {activeBranch.name !== 'main' && (
                      <>
                        {' • '}
                        {activeBranch.ahead} ahead, {activeBranch.behind} behind main
                      </>
                    )}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  Latest: {formatDistanceToNow(new Date(activeBranch.latestVersion.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          )}

          {/* Branch List */}
          <div className="space-y-3">
            {branches.map(branch => (
              <BranchCard
                key={branch.name}
                branch={branch}
                isActive={branch.isActive}
                onSwitch={() => handleSwitchBranch(branch.name)}
                onDelete={onDeleteBranch ? () => onDeleteBranch(branch.name) : undefined}
                onCompare={() => handleCompareBranches(branch.name, 'main')}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Branch Tree Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <BranchTreeVisualization branches={branches} />
        </CardContent>
      </Card>

      {/* Create Branch Dialog */}
      <Dialog open={showCreateBranch} onOpenChange={setShowCreateBranch}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
            <DialogDescription>
              Create a new branch from an existing version to work on drafts or experimental changes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="branch-name">Branch Name</Label>
              <Input
                id="branch-name"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g., feature-update, draft-v2"
              />
            </div>

            <div>
              <Label htmlFor="source-version">Source Version</Label>
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version to branch from" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(version => (
                    <SelectItem key={version.id} value={version.id}>
                      Version {version.version_number} - {version.title} ({version.branch_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowCreateBranch(false)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleCreateBranch}
              disabled={!branchName.trim() || !selectedVersion}
            >
              Create Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Branch Dialog */}
      <Dialog open={showMergeBranch} onOpenChange={setShowMergeBranch}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Merge Branch</DialogTitle>
            <DialogDescription>
              Merge changes from your branch back to the main branch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="merge-branch">Branch to Merge</Label>
              <Select value={selectedBranchForMerge} onValueChange={setSelectedBranchForMerge}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch to merge" />
                </SelectTrigger>
                <SelectContent>
                  {branches
                    .filter(b => b.name !== 'main')
                    .map(branch => (
                      <SelectItem key={branch.name} value={branch.name}>
                        {branch.name} ({branch.ahead} commits ahead)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="merge-message">Merge Message</Label>
              <Textarea
                id="merge-message"
                value={mergeMessage}
                onChange={(e) => setMergeMessage(e.target.value)}
                placeholder="Describe what changes are being merged..."
                className="min-h-[80px]"
              />
            </div>

            {mergeConflicts.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Merge Conflicts</h4>
                <Alert>
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    There are {mergeConflicts.length} conflicts that need to be resolved before merging.
                  </AlertDescription>
                </Alert>
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                  {mergeConflicts.map((conflict, index) => (
                    <div key={index} className="p-2 border rounded text-sm">
                      <div className="font-medium">{conflict.path}</div>
                      <div className="text-gray-600">Conflict in field values</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowMergeBranch(false)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleMergeBranch}
              disabled={!selectedBranchForMerge || !mergeMessage.trim() || mergeConflicts.some(c => !c.resolved)}
            >
              <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
              Merge Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Branch Card Component
 */
interface BranchCardProps {
  branch: BranchInfo
  isActive: boolean
  onSwitch: () => void
  onDelete?: () => void
  onCompare: () => void
}

function BranchCard({ branch, isActive, onSwitch, onDelete, onCompare }: BranchCardProps) {
  const canDelete = branch.name !== 'main' && !isActive

  return (
    <Card className={cn(
      "transition-all",
      isActive && "ring-2 ring-blue-500 bg-blue-50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center space-x-1">
                <CodeBracketIcon className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{branch.name}</span>
              </div>
              
              {isActive && <Badge className="bg-blue-600">Active</Badge>}
              {branch.isDraft && <Badge variant="secondary">Draft</Badge>}
              {branch.name === 'main' && <Badge variant="outline">Main</Badge>}
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{branch.versions.length} version{branch.versions.length !== 1 ? 's' : ''}</span>
              
              {branch.name !== 'main' && (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">+{branch.ahead}</span>
                    <span className="text-red-600">-{branch.behind}</span>
                  </div>
                </>
              )}
              
              <span>
                Last updated {formatDistanceToNow(new Date(branch.latestVersion.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <Button
              onClick={onCompare}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={branch.name === 'main'}
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </Button>
            
            {!isActive && (
              <Button onClick={onSwitch} size="sm" variant="outline">
                Switch
              </Button>
            )}
            
            {canDelete && onDelete && (
              <Button
                onClick={onDelete}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Branch Tree Visualization Component
 */
function BranchTreeVisualization({ branches }: { branches: BranchInfo[] }) {
  const mainBranch = branches.find(b => b.name === 'main')
  const featureBranches = branches.filter(b => b.name !== 'main')

  return (
    <div className="space-y-4">
      {/* Main Branch */}
      {mainBranch && (
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            <span className="font-medium">main</span>
            <Badge variant="outline">{mainBranch.versions.length} versions</Badge>
          </div>
          
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
      )}

      {/* Feature Branches */}
      {featureBranches.map((branch, index) => (
        <div key={branch.name} className="flex items-center space-x-4 ml-8">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-px bg-gray-300 mr-2"></div>
            <div className={cn(
              "w-3 h-3 rounded-full",
              branch.isDraft ? "bg-yellow-500" : "bg-green-500"
            )}></div>
            <span className="text-sm">{branch.name}</span>
            <Badge variant="secondary" className="text-xs">
              {branch.versions.length}
            </Badge>
            {branch.isDraft && <Badge variant="secondary" className="text-xs">Draft</Badge>}
          </div>
        </div>
      ))}

      {featureBranches.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CodeBracketIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No feature branches</p>
          <p className="text-sm">Create a branch to start working on drafts</p>
        </div>
      )}
    </div>
  )
}

export default VersionBranchManager