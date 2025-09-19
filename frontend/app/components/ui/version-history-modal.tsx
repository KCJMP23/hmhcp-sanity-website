'use client'

import React, { useState, useEffect } from 'react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock as ClockIcon,
  RefreshCw as ArrowPathIcon,
  User as UserIcon,
  FileText as DocumentIcon,
  Eye as EyeIcon,
  Undo2 as ArrowUturnLeftIcon,
  AlertTriangle as ExclamationTriangleIcon,
  CheckCircle as CheckCircleIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import { useOfflineQueue, type VersionHistoryItem } from '@/lib/offline-queue'

interface VersionHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentType: 'post' | 'page' | 'media'
  contentId?: string
  currentData?: any
  onRestore: (versionData: any, version: number) => Promise<void>
  onPreview?: (versionData: any) => void
  loading?: boolean
}

export function VersionHistoryModal({
  open,
  onOpenChange,
  contentType,
  contentId,
  currentData,
  onRestore,
  onPreview,
  loading = false
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<VersionHistoryItem[]>([])
  const [selectedVersion, setSelectedVersion] = useState<VersionHistoryItem | null>(null)
  const [recoveryData, setRecoveryData] = useState<any>(null)
  const [loadingVersions, setLoadingVersions] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  
  const { getHistory, getRecoveryData, clearRecoveryData } = useOfflineQueue()

  // Load version history and recovery data
  useEffect(() => {
    if (open && contentId) {
      loadVersionHistory()
      loadRecoveryData()
    }
  }, [open, contentId, contentType])

  const loadVersionHistory = async () => {
    if (!contentId) return
    
    setLoadingVersions(true)
    try {
      const history = await getHistory(contentType, contentId, 20)
      setVersions(history)
    } catch (error) {
      console.error('Failed to load version history:', error)
    } finally {
      setLoadingVersions(false)
    }
  }

  const loadRecoveryData = async () => {
    try {
      const recovery = await getRecoveryData(contentType, contentId)
      setRecoveryData(recovery)
    } catch (error) {
      console.error('Failed to load recovery data:', error)
    }
  }

  const handleRestore = async (version: VersionHistoryItem) => {
    if (!version || restoring) return
    
    setRestoring(version.id)
    try {
      await onRestore(version.data, version.version)
      // Reload history after successful restore
      await loadVersionHistory()
    } catch (error) {
      console.error('Failed to restore version:', error)
    } finally {
      setRestoring(null)
    }
  }

  const handleRecoveryRestore = async () => {
    if (!recoveryData) return
    
    try {
      await onRestore(recoveryData.data, 0) // Version 0 indicates recovery
      await clearRecoveryData(contentType, contentId)
      setRecoveryData(null)
    } catch (error) {
      console.error('Failed to restore from recovery data:', error)
    }
  }

  const handleClearRecovery = async () => {
    if (!recoveryData) return
    
    try {
      await clearRecoveryData(contentType, contentId)
      setRecoveryData(null)
    } catch (error) {
      console.error('Failed to clear recovery data:', error)
    }
  }

  const formatVersionDetails = (version: VersionHistoryItem) => {
    const details = []
    
    if (version.operation === 'auto-save') {
      details.push('Auto-saved')
    } else if (version.operation === 'save') {
      details.push('Manually saved')
    } else if (version.operation === 'recovery') {
      details.push('Recovered')
    }
    
    if (version.userId) {
      details.push(`by ${version.userId}`)
    }
    
    return details.join(' ')
  }

  const getVersionIcon = (operation: string) => {
    switch (operation) {
      case 'auto-save':
        return ArrowPathIcon
      case 'save':
        return DocumentIcon
      case 'recovery':
        return ArrowUturnLeftIcon
      default:
        return ClockIcon
    }
  }

  const getVersionColor = (operation: string) => {
    switch (operation) {
      case 'auto-save':
        return 'text-blue-600 dark:text-blue-400'
      case 'save':
        return 'text-green-600 dark:text-green-400'
      case 'recovery':
        return 'text-amber-600 dark:text-amber-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  // Compare current data with selected version
  const getDifferences = () => {
    if (!selectedVersion || !currentData) return []
    
    const current = currentData
    const version = selectedVersion.data
    const differences: any[] = []

    const allFields = new Set([
      ...Object.keys(current || {}),
      ...Object.keys(version || {})
    ])

    allFields.forEach(field => {
      const currentValue = current?.[field]
      const versionValue = version?.[field]
      
      if (JSON.stringify(currentValue) !== JSON.stringify(versionValue)) {
        differences.push({
          field,
          currentValue,
          versionValue,
          type: currentValue === undefined ? 'removed' : 
                versionValue === undefined ? 'added' : 'changed'
        })
      }
    })

    return differences
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            Browse and restore previous versions of this {contentType}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="history" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history">Version History</TabsTrigger>
              <TabsTrigger value="recovery" disabled={!recoveryData}>
                Recovery {recoveryData && <Badge variant="outline" className="ml-2">Available</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="flex-1 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                {/* Version List */}
                <div className="flex flex-col">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    Versions ({versions.length})
                    {loadingVersions && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"
                      />
                    )}
                  </h3>
                  
                  <ScrollArea className="flex-1 border rounded-lg">
                    <div className="p-3 space-y-2">
                      {loadingVersions ? (
                        <div className="space-y-2">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                            </div>
                          ))}
                        </div>
                      ) : versions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No version history available</p>
                        </div>
                      ) : (
                        versions.map((version, index) => {
                          const Icon = getVersionIcon(version.operation)
                          const isSelected = selectedVersion?.id === version.id
                          
                          return (
                            <motion.div
                              key={version.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={cn(
                                "p-3 border rounded-lg cursor-pointer transition-all",
                                "hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600",
                                isSelected ? 
                                  "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30" : 
                                  "border-gray-200 dark:border-gray-700"
                              )}
                              onClick={() => setSelectedVersion(version)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Icon className={cn("h-4 w-4", getVersionColor(version.operation))} />
                                  <Badge variant="outline" className="text-xs">
                                    v{version.version}
                                  </Badge>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(version.timestamp, { addSuffix: true })}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {formatVersionDetails(version)}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {format(version.timestamp, 'MMM d, yyyy HH:mm')}
                                </span>
                                <div className="flex gap-1">
                                  {onPreview && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onPreview(version.data)
                                      }}
                                    >
                                      <EyeIcon className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRestore(version)
                                    }}
                                    disabled={restoring === version.id || loading}
                                  >
                                    {restoring === version.id ? (
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="h-3 w-3 border border-gray-400 border-t-transparent rounded-full"
                                      />
                                    ) : (
                                      <ArrowUturnLeftIcon className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Version Details */}
                <div className="flex flex-col">
                  <h3 className="font-semibold mb-3">
                    {selectedVersion ? `Version ${selectedVersion.version} Details` : 'Select a Version'}
                  </h3>
                  
                  {selectedVersion ? (
                    <div className="flex-1 border rounded-lg overflow-hidden">
                      <div className="p-4 border-b bg-gray-50 dark:bg-gray-900/50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                            <p className="text-gray-600 dark:text-gray-400">
                              {format(selectedVersion.timestamp, 'PPP p')}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Operation:</span>
                            <p className="text-gray-600 dark:text-gray-400 capitalize">
                              {selectedVersion.operation.replace('-', ' ')}
                            </p>
                          </div>
                          {selectedVersion.userId && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Author:</span>
                              <p className="text-gray-600 dark:text-gray-400">
                                {selectedVersion.userId}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <ScrollArea className="flex-1">
                        <div className="p-4">
                          {currentData ? (
                            <div className="space-y-4">
                              <h4 className="font-medium">Changes from Current Version:</h4>
                              {getDifferences().length === 0 ? (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <CheckCircleIcon className="h-4 w-4" />
                                  <span className="text-sm">No differences from current version</span>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {getDifferences().map((diff, index) => (
                                    <div key={index} className="border rounded-lg p-3 text-sm">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline">{diff.field}</Badge>
                                        <Badge variant={
                                          diff.type === 'added' ? 'default' :
                                          diff.type === 'removed' ? 'destructive' :
                                          'secondary'
                                        }>
                                          {diff.type}
                                        </Badge>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded border-l-2 border-red-500">
                                          <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                                            Current
                                          </div>
                                          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {JSON.stringify(diff.currentValue, null, 2)}
                                          </pre>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded border-l-2 border-green-500">
                                          <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                                            Version {selectedVersion.version}
                                          </div>
                                          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {JSON.stringify(diff.versionValue, null, 2)}
                                          </pre>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <h4 className="font-medium">Version Data:</h4>
                              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-auto">
                                {JSON.stringify(selectedVersion.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center border rounded-lg bg-gray-50 dark:bg-gray-900/50">
                      <div className="text-center text-gray-500">
                        <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Select a version to see details</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recovery" className="flex-1 mt-4">
              {recoveryData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <h3 className="font-medium text-amber-900 dark:text-amber-100">
                        Unsaved Changes Found
                      </h3>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Found unsaved changes from {format(new Date(recoveryData.timestamp), 'PPP p')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Recovery Actions:</h4>
                      <div className="flex gap-2">
                        <Button onClick={handleRecoveryRestore} className="flex-1">
                          <ArrowUturnLeftIcon className="h-4 w-4 mr-2" />
                          Restore Changes
                        </Button>
                        <Button variant="outline" onClick={handleClearRecovery}>
                          Discard
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Recovery Data Preview:</h4>
                      <ScrollArea className="h-48 border rounded-lg">
                        <pre className="text-xs p-3">
                          {JSON.stringify(recoveryData.data, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recovery data available</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {selectedVersion && (
              <Button 
                onClick={() => handleRestore(selectedVersion)}
                disabled={restoring === selectedVersion.id || loading}
                className="min-w-24"
              >
                {restoring === selectedVersion.id ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <ArrowUturnLeftIcon className="h-4 w-4 mr-2" />
                    Restore Version
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}