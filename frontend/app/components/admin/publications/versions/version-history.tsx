/**
 * Version History Component - Story 3.7c Task 4
 * Timeline view of publication versions with actions
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  History, 
  GitBranch, 
  User, 
  Clock, 
  FileText, 
  Compare, 
  RotateCcw,
  Check,
  X,
  AlertCircle,
  Eye
} from 'lucide-react'
import { PublicationVersion } from '@/types/publications'
import { useVersionApi } from '@/hooks/use-version-api'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface VersionHistoryProps {
  publicationId: string
  onCompareVersions?: (versionFrom: string, versionTo: string) => void
  className?: string
}

const VERSION_TYPE_COLORS = {
  major: 'bg-red-100 text-red-800 border-red-200',
  minor: 'bg-blue-100 text-blue-800 border-blue-200',
  patch: 'bg-green-100 text-green-800 border-green-200',
  editorial: 'bg-purple-100 text-purple-800 border-purple-200'
}

const APPROVAL_STATUS_COLORS = {
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800'
}

export function VersionHistory({ 
  publicationId, 
  onCompareVersions,
  className 
}: VersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set())

  const {
    versions,
    isLoadingVersions,
    rollbackToVersion,
    approveVersion,
    rejectVersion,
    deleteVersion,
    isRollingBack
  } = useVersionApi({ publicationId })

  const toggleVersionSelection = (versionNumber: string) => {
    setSelectedVersions(prev => {
      const newSelection = prev.includes(versionNumber)
        ? prev.filter(v => v !== versionNumber)
        : prev.length < 2 
          ? [...prev, versionNumber]
          : [prev[1], versionNumber] // Keep only last two selections
      return newSelection
    })
  }

  const toggleShowDetails = (versionNumber: string) => {
    setShowDetails(prev => {
      const newSet = new Set(prev)
      if (newSet.has(versionNumber)) {
        newSet.delete(versionNumber)
      } else {
        newSet.add(versionNumber)
      }
      return newSet
    })
  }

  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompareVersions) {
      onCompareVersions(selectedVersions[0], selectedVersions[1])
    }
  }

  const handleRollback = async (version: PublicationVersion) => {
    if (confirm(`Are you sure you want to rollback to version ${version.versionNumber}?`)) {
      await rollbackToVersion(
        version.versionNumber, 
        `Rollback to version ${version.versionNumber}`
      )
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History ({versions.length})
          </CardTitle>
          
          {selectedVersions.length === 2 && (
            <Button onClick={handleCompare} size="sm">
              <Compare className="h-4 w-4 mr-2" />
              Compare
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoadingVersions ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading version history...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No versions available</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={cn(
                    'relative border rounded-lg p-4 transition-colors',
                    selectedVersions.includes(version.versionNumber) 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300',
                    index === 0 && 'border-green-300 bg-green-50'
                  )}
                >
                  {/* Timeline connector */}
                  {index < versions.length - 1 && (
                    <div className="absolute left-6 top-16 w-px h-8 bg-gray-300" />
                  )}
                  
                  <div className="flex items-start gap-3">
                    {/* Version selector */}
                    <input
                      type="checkbox"
                      checked={selectedVersions.includes(version.versionNumber)}
                      onChange={() => toggleVersionSelection(version.versionNumber)}
                      className="mt-1"
                      disabled={selectedVersions.length >= 2 && !selectedVersions.includes(version.versionNumber)}
                    />
                    
                    {/* Version icon */}
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                      index === 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    )}>
                      <GitBranch className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Version header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">
                            v{version.versionNumber}
                            {index === 0 && (
                              <Badge variant="outline" className="ml-2 text-xs text-green-600 border-green-200">
                                Current
                              </Badge>
                            )}
                          </h4>
                          
                          <Badge 
                            variant="outline" 
                            className={cn('text-xs', VERSION_TYPE_COLORS[version.versionType])}
                          >
                            {version.versionType}
                          </Badge>
                          
                          <Badge 
                            variant="outline"
                            className={cn('text-xs', APPROVAL_STATUS_COLORS[version.approvalStatus])}
                          >
                            {version.approvalStatus}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleShowDetails(version.versionNumber)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          {index > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRollback(version)}
                              disabled={isRollingBack}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Version metadata */}
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>{version.creator?.name || 'Unknown'}</span>
                          <Clock className="h-3 w-3 ml-2" />
                          <span>{formatDistanceToNow(new Date(version.createdAt))} ago</span>
                        </div>
                        
                        {version.changeSummary && (
                          <p className="mt-2 text-sm">{version.changeSummary}</p>
                        )}
                      </div>
                      
                      {/* Detailed information */}
                      {showDetails.has(version.versionNumber) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-xs space-y-2">
                          {version.changeReason && (
                            <div>
                              <span className="font-medium">Reason:</span> {version.changeReason}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="font-medium">Size:</span> {
                                version.dataSizeBytes 
                                  ? `${Math.round(version.dataSizeBytes / 1024)}KB` 
                                  : 'Unknown'
                              }
                            </div>
                            
                            {version.compressionRatio && (
                              <div>
                                <span className="font-medium">Compression:</span> {
                                  Math.round(version.compressionRatio * 100)
                                }%
                              </div>
                            )}
                          </div>
                          
                          {version.approver && (
                            <div>
                              <span className="font-medium">
                                {version.approvalStatus === 'approved' ? 'Approved' : 'Rejected'} by:
                              </span> {version.approver.name}
                              {version.approvedAt && (
                                <span className="ml-2 text-muted-foreground">
                                  ({formatDistanceToNow(new Date(version.approvedAt))} ago)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Approval actions */}
                      {version.approvalStatus === 'pending' && (
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveVersion(version.versionNumber)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectVersion(version.versionNumber, 'Manual rejection')}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {/* Selection info */}
        {selectedVersions.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span>
                {selectedVersions.length === 1 
                  ? `Selected version ${selectedVersions[0]} for comparison`
                  : `Selected versions ${selectedVersions.join(' and ')} for comparison`
                }
              </span>
            </div>
            
            {selectedVersions.length === 2 && (
              <p className="text-xs text-blue-600 mt-1">
                Click "Compare" to see differences between these versions.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}