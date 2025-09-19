'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  AlertTriangle as ExclamationTriangleIcon,
  User as UserIcon,
  Clock as ClockIcon,
  FileText as DocumentTextIcon,
  Check as CheckIcon,
  X as XMarkIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export interface ConflictData {
  localVersion: {
    data: any
    timestamp: Date
    version: number
    userId: string
  }
  serverVersion: {
    data: any
    timestamp: Date
    version: number
    userId: string
    lastModified: Date
  }
  conflictFields: string[]
}

interface ConflictResolutionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conflictData: ConflictData | null
  onResolve: (resolvedData: any, strategy: 'local' | 'server' | 'merge') => Promise<void>
  loading?: boolean
  contentType?: 'post' | 'page' | 'media'
}

type DiffViewMode = 'side-by-side' | 'unified'

export function ConflictResolutionModal({
  open,
  onOpenChange,
  conflictData,
  onResolve,
  loading = false,
  contentType = 'post'
}: ConflictResolutionModalProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<'local' | 'server' | 'merge' | null>(null)
  const [mergedData, setMergedData] = useState<any>(null)
  const [diffViewMode, setDiffViewMode] = useState<DiffViewMode>('side-by-side')

  // Initialize merged data when conflict data changes
  React.useEffect(() => {
    if (conflictData) {
      setMergedData(conflictData.localVersion.data)
    }
  }, [conflictData])

  // Analyze differences between versions
  const differences = useMemo(() => {
    if (!conflictData) return []

    const local = conflictData.localVersion.data
    const server = conflictData.serverVersion.data
    const diffs: Array<{
      field: string
      localValue: any
      serverValue: any
      type: 'added' | 'deleted' | 'modified'
    }> = []

    // Compare all fields
    const allFields = new Set([
      ...Object.keys(local || {}),
      ...Object.keys(server || {})
    ])

    allFields.forEach(field => {
      const localValue = local?.[field]
      const serverValue = server?.[field]

      if (localValue !== serverValue) {
        let type: 'added' | 'deleted' | 'modified' = 'modified'
        
        if (localValue === undefined) type = 'added'
        else if (serverValue === undefined) type = 'deleted'

        diffs.push({
          field,
          localValue,
          serverValue,
          type
        })
      }
    })

    return diffs
  }, [conflictData])

  // Handle field-level merge decisions
  const handleFieldMerge = (field: string, useLocal: boolean) => {
    if (!conflictData || !mergedData) return

    const value = useLocal 
      ? conflictData.localVersion.data[field]
      : conflictData.serverVersion.data[field]

    setMergedData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle resolution
  const handleResolve = async () => {
    if (!conflictData || !selectedStrategy) return

    let resolvedData
    switch (selectedStrategy) {
      case 'local':
        resolvedData = conflictData.localVersion.data
        break
      case 'server':
        resolvedData = conflictData.serverVersion.data
        break
      case 'merge':
        resolvedData = mergedData
        break
    }

    await onResolve(resolvedData, selectedStrategy)
  }

  // Format field value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'string') return value
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  if (!conflictData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-display">
                Resolve Content Conflict
              </DialogTitle>
              <DialogDescription>
                Another user has modified this {contentType} while you were editing. 
                Choose how to resolve the conflicting changes.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="compare">Compare Changes</TabsTrigger>
              <TabsTrigger value="merge">Manual Merge</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 mt-4">
              <div className="grid grid-cols-2 gap-6 h-full">
                {/* Your Version */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border rounded-xl p-6 bg-blue-50/50 dark:bg-blue-950/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Your Version
                    </h3>
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      v{conflictData.localVersion.version}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <ClockIcon className="h-4 w-4" />
                      Modified {format(conflictData.localVersion.timestamp, 'PPp')}
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Conflicting fields:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {conflictData.conflictFields.map(field => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant={selectedStrategy === 'local' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setSelectedStrategy('local')}
                    >
                      Use Your Version
                    </Button>
                  </div>
                </motion.div>

                {/* Server Version */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border rounded-xl p-6 bg-green-50/50 dark:bg-green-950/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <UserIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      Server Version
                    </h3>
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      v{conflictData.serverVersion.version}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <ClockIcon className="h-4 w-4" />
                      Modified {format(conflictData.serverVersion.lastModified, 'PPp')}
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Modified by:</span> 
                      <span className="ml-2 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {conflictData.serverVersion.userId}
                      </span>
                    </div>

                    <Button
                      variant={selectedStrategy === 'server' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setSelectedStrategy('server')}
                    >
                      Use Server Version
                    </Button>
                  </div>
                </motion.div>
              </div>

              {/* Manual Merge Option */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 border rounded-xl p-6 bg-purple-50/50 dark:bg-purple-950/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                      Manual Merge
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose specific changes from each version to create a merged result
                    </p>
                  </div>
                  <Button
                    variant={selectedStrategy === 'merge' ? 'default' : 'outline'}
                    onClick={() => setSelectedStrategy('merge')}
                  >
                    Merge Manually
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="compare" className="flex-1 mt-4">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Field-by-field Comparison</h3>
                  <div className="flex gap-2">
                    <Button
                      variant={diffViewMode === 'side-by-side' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDiffViewMode('side-by-side')}
                    >
                      Side by Side
                    </Button>
                    <Button
                      variant={diffViewMode === 'unified' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDiffViewMode('unified')}
                    >
                      Unified
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="p-4 space-y-4">
                    {differences.map((diff, index) => (
                      <motion.div
                        key={diff.field}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {diff.field}
                          </Badge>
                          <Badge 
                            variant={
                              diff.type === 'added' ? 'default' :
                              diff.type === 'deleted' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {diff.type}
                          </Badge>
                        </div>

                        {diffViewMode === 'side-by-side' ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded border-l-4 border-blue-500">
                              <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                                Your Version
                              </div>
                              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {formatValue(diff.localValue)}
                              </pre>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded border-l-4 border-green-500">
                              <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                                Server Version
                              </div>
                              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {formatValue(diff.serverValue)}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded border-l-4 border-red-500">
                              <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                                - Your Version
                              </div>
                              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {formatValue(diff.localValue)}
                              </pre>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded border-l-4 border-green-500">
                              <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                                + Server Version
                              </div>
                              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {formatValue(diff.serverValue)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="merge" className="flex-1 mt-4">
              <div className="h-full flex flex-col">
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Choose values for each conflicting field</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select which version to use for each field, or edit values manually.
                  </p>
                </div>

                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="p-4 space-y-4">
                    {differences.map((diff, index) => (
                      <motion.div
                        key={diff.field}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline">{diff.field}</Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFieldMerge(diff.field, true)}
                              className="flex items-center gap-1"
                            >
                              <CheckIcon className="h-3 w-3" />
                              Use Yours
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFieldMerge(diff.field, false)}
                              className="flex items-center gap-1"
                            >
                              <CheckIcon className="h-3 w-3" />
                              Use Server
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded">
                            <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                              Your Version
                            </div>
                            <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {formatValue(diff.localValue)}
                            </pre>
                          </div>
                          <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded">
                            <div className="font-medium text-green-700 dark:text-green-300 mb-1">
                              Server Version
                            </div>
                            <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {formatValue(diff.serverValue)}
                            </pre>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded">
                            <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">
                              Merged Result
                            </div>
                            <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {formatValue(mergedData?.[diff.field])}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedStrategy && (
              <span>
                Strategy: <strong className="capitalize">{selectedStrategy}</strong>
                {selectedStrategy === 'merge' && ` (${differences.length} conflicts)`}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!selectedStrategy || loading}
              className="min-w-24"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                'Resolve Conflict'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}