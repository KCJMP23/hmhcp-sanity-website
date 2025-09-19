'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle,
  GitBranch,
  FileText,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Merge,
  FileX,
  ArrowRight,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DiffViewer } from './versioning/DiffViewer'

interface Conflict {
  id: string
  type: 'content' | 'metadata' | 'status' | 'structural'
  field: string
  severity: 'low' | 'medium' | 'high'
  description: string
  yourChange: any
  theirChange: any
  baseValue: any
  suggestedResolution?: 'yours' | 'theirs' | 'merge'
  canAutoResolve: boolean
}

interface ConflictResolverProps {
  conflicts: Conflict[]
  yourVersion: {
    version: number
    author: string
    timestamp: string
    content: any
  }
  theirVersion: {
    version: number
    author: string
    timestamp: string
    content: any
  }
  baseVersion?: {
    version: number
    content: any
  }
  onResolve: (resolutions: Record<string, 'yours' | 'theirs' | 'custom'>, customValues?: Record<string, any>) => Promise<void>
  onCancel: () => void
  className?: string
}

export function ConflictResolver({
  conflicts,
  yourVersion,
  theirVersion,
  baseVersion,
  onResolve,
  onCancel,
  className
}: ConflictResolverProps) {
  const [resolutions, setResolutions] = useState<Record<string, 'yours' | 'theirs' | 'custom'>>({})
  const [customValues, setCustomValues] = useState<Record<string, any>>({})
  const [isResolving, setIsResolving] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set())

  // Auto-resolve low severity conflicts
  const autoResolve = () => {
    const newResolutions: Record<string, 'yours' | 'theirs' | 'custom'> = {}
    
    conflicts.forEach(conflict => {
      if (conflict.canAutoResolve && conflict.suggestedResolution) {
        // Map 'merge' to 'custom' since resolutions only accept 'yours' | 'theirs' | 'custom'
        const resolution = conflict.suggestedResolution === 'merge' ? 'custom' : conflict.suggestedResolution
        newResolutions[conflict.id] = resolution
      }
    })
    
    setResolutions(prev => ({ ...prev, ...newResolutions }))
  }

  // Set resolution for a conflict
  const setConflictResolution = (conflictId: string, resolution: 'yours' | 'theirs' | 'custom', customValue?: any) => {
    setResolutions(prev => ({ ...prev, [conflictId]: resolution }))
    
    if (resolution === 'custom' && customValue !== undefined) {
      setCustomValues(prev => ({ ...prev, [conflictId]: customValue }))
    }
  }

  // Handle resolve
  const handleResolve = async () => {
    // Check if all conflicts are resolved
    const unresolvedConflicts = conflicts.filter(c => !resolutions[c.id])
    
    if (unresolvedConflicts.length > 0) {
      alert(`Please resolve all conflicts. ${unresolvedConflicts.length} conflicts remain unresolved.`)
      return
    }

    setIsResolving(true)
    try {
      await onResolve(resolutions, customValues)
    } finally {
      setIsResolving(false)
    }
  }

  // Toggle conflict expansion
  const toggleConflictExpansion = (conflictId: string) => {
    setExpandedConflicts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(conflictId)) {
        newSet.delete(conflictId)
      } else {
        newSet.add(conflictId)
      }
      return newSet
    })
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-blue-900/20 dark:border-blue-800'
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
    }
  }

  // Get conflict type icon
  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'content':
        return FileText
      case 'metadata':
        return Info
      case 'status':
        return GitBranch
      case 'structural':
        return FileX
      default:
        return AlertTriangle
    }
  }

  const resolvedCount = Object.keys(resolutions).length
  const totalConflicts = conflicts.length
  const autoResolvableCount = conflicts.filter(c => c.canAutoResolve).length

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card className="p-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                Merge Conflicts Detected
              </h2>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {totalConflicts} conflict{totalConflicts !== 1 ? 's' : ''} need to be resolved before saving
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                <span className="font-medium">Your version:</span>
                <span className="text-gray-600 dark:text-gray-400">v{yourVersion.version}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                {new Date(yourVersion.timestamp).toLocaleString()}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                <span className="font-medium">Their version:</span>
                <span className="text-gray-600 dark:text-gray-400">v{theirVersion.version} by {theirVersion.author}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                {new Date(theirVersion.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-blue-300 dark:border-blue-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 h-2">
                  <div 
                    className="bg-blue-600 h-2 transition-all"
                    style={{ width: `${(resolvedCount / totalConflicts) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {resolvedCount} / {totalConflicts} resolved
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {autoResolvableCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={autoResolve}
                  className="gap-2"
                >
                  <Merge className="w-4 h-4" />
                  Auto-resolve {autoResolvableCount} conflicts
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiff(!showDiff)}
                className="gap-2"
              >
                <GitBranch className="w-4 h-4" />
                {showDiff ? 'Hide' : 'Show'} Full Diff
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Full diff view */}
      {showDiff && (
        <DiffViewer
          oldContent={theirVersion.content}
          newContent={yourVersion.content}
          oldVersion={theirVersion.version}
          newVersion={yourVersion.version}
          oldAuthor={theirVersion.author}
          newAuthor={yourVersion.author}
          viewMode="split"
        />
      )}

      {/* Conflicts list */}
      <div className="space-y-4">
        {conflicts.map((conflict) => {
          const Icon = getConflictIcon(conflict.type)
          const isExpanded = expandedConflicts.has(conflict.id)
          const resolution = resolutions[conflict.id]

          return (
            <Card 
              key={conflict.id}
              className={cn(
                'p-4 border',
                getSeverityColor(conflict.severity),
                resolution && 'opacity-75'
              )}
            >
              <div className="space-y-3">
                {/* Conflict header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="w-5 h-5 mt-0.5" />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{conflict.field}</span>
                        <Badge variant="outline" className="text-xs">
                          {conflict.type}
                        </Badge>
                        {conflict.canAutoResolve && (
                          <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            Auto-resolvable
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm">{conflict.description}</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleConflictExpansion(conflict.id)}
                  >
                    {isExpanded ? 'Hide' : 'Show'} Details
                  </Button>
                </div>

                {/* Conflict details */}
                {isExpanded && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {baseVersion && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Original (v{baseVersion.version})
                          </div>
                          <div className="p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600">
                            <pre className="text-xs overflow-auto">
                              {JSON.stringify(conflict.baseValue, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          Your Change
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(conflict.yourChange, null, 2)}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          Their Change
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(conflict.theirChange, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Resolution options */}
                    <div className="flex items-center gap-2 pt-3">
                      <span className="text-sm font-medium">Resolution:</span>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant={resolution === 'yours' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setConflictResolution(conflict.id, 'yours')}
                          className="gap-2"
                        >
                          {resolution === 'yours' && <CheckCircle className="w-4 h-4" />}
                          Keep Yours
                        </Button>
                        
                        <Button
                          variant={resolution === 'theirs' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setConflictResolution(conflict.id, 'theirs')}
                          className="gap-2"
                        >
                          {resolution === 'theirs' && <CheckCircle className="w-4 h-4" />}
                          Keep Theirs
                        </Button>

                        {/* Custom resolution would need field-specific UI */}
                        {conflict.type === 'content' && (
                          <Button
                            variant={resolution === 'custom' ? 'default' : 'outline'}
                            size="sm"
                            disabled
                            className="gap-2"
                          >
                            Custom Merge
                          </Button>
                        )}
                      </div>

                      {resolution && (
                        <Badge className="ml-auto gap-1 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                          <CheckCircle className="w-3 h-3" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {resolvedCount < totalConflicts && (
              <span>
                Please resolve all conflicts before proceeding
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleResolve}
              disabled={resolvedCount < totalConflicts || isResolving}
              className="gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Apply Resolutions
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}