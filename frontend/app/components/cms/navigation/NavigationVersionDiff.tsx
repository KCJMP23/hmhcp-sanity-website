'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { 
  Plus, 
  Minus, 
  Edit, 
  Move,
  ChevronRight,
  ChevronDown,
  ArrowRight
} from 'lucide-react'

// Helper function to get diff color classes
function getDiffColor(type: 'added' | 'removed' | 'modified' | 'moved') {
  switch (type) {
    case 'added':
      return 'bg-green-100 text-green-800 dark:bg-blue-900 dark:text-blue-200'
    case 'removed':
      return 'bg-red-100 text-red-800 dark:bg-blue-900 dark:text-blue-200'
    case 'modified':
      return 'bg-yellow-100 text-yellow-800 dark:bg-blue-900 dark:text-blue-200'
    case 'moved':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    default:
      return ''
  }
}

interface NavigationItem {
  id: string
  title: string
  url?: string
  children?: NavigationItem[]
  status?: string
  parent_id?: string | null
  position: number
}

interface DiffDetail {
  type: 'added' | 'removed' | 'modified' | 'moved'
  path: string[]
  item?: NavigationItem
  oldItem?: NavigationItem
  newItem?: NavigationItem
  changes?: Array<{
    field: string
    oldValue: any
    newValue: any
  }>
  oldPosition?: number
  newPosition?: number
  oldParent?: string
  newParent?: string
}

interface NavigationVersionDiffProps {
  navigationId: string
  fromVersionId: string
  toVersionId: string
  versions: any[]
}

export function NavigationVersionDiff({
  navigationId,
  fromVersionId,
  toVersionId,
  versions
}: NavigationVersionDiffProps) {
  const [diffDetails, setDiffDetails] = useState<DiffDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified')
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  const fromVersion = versions.find(v => v.id === fromVersionId)
  const toVersion = versions.find(v => v.id === toVersionId)

  useEffect(() => {
    if (fromVersion && toVersion) {
      calculateDiff()
    }
  }, [fromVersionId, toVersionId])

  const calculateDiff = () => {
    if (!fromVersion || !toVersion) return

    const fromItems = flattenTree(fromVersion.structure)
    const toItems = flattenTree(toVersion.structure)
    const details: DiffDetail[] = []

    // Find removed items
    fromItems.forEach(([path, item]) => {
      const toItem = toItems.find(([_, i]) => i.id === item.id)
      if (!toItem) {
        details.push({
          type: 'removed',
          path,
          item,
          oldItem: item
        })
      }
    })

    // Find added and modified items
    toItems.forEach(([path, item]) => {
      const fromItem = fromItems.find(([_, i]) => i.id === item.id)
      
      if (!fromItem) {
        // Added
        details.push({
          type: 'added',
          path,
          item,
          newItem: item
        })
      } else {
        // Check for modifications
        const [oldPath, oldItem] = fromItem
        const changes: DiffDetail['changes'] = []
        
        // Check field changes
        if (oldItem.title !== item.title) {
          changes.push({ field: 'title', oldValue: oldItem.title, newValue: item.title })
        }
        if (oldItem.url !== item.url) {
          changes.push({ field: 'url', oldValue: oldItem.url, newValue: item.url })
        }
        if (oldItem.status !== item.status) {
          changes.push({ field: 'status', oldValue: oldItem.status, newValue: item.status })
        }

        // Check for position or parent changes
        const moved = oldPath.join('/') !== path.join('/') || 
                     oldItem.position !== item.position ||
                     oldItem.parent_id !== item.parent_id

        if (changes.length > 0 || moved) {
          details.push({
            type: moved && changes.length === 0 ? 'moved' : 'modified',
            path,
            item,
            oldItem,
            newItem: item,
            changes: changes.length > 0 ? changes : undefined,
            oldPosition: oldItem.position,
            newPosition: item.position,
            oldParent: oldItem.parent_id || undefined,
            newParent: item.parent_id || undefined
          })
        }
      }
    })

    setDiffDetails(details)
    setLoading(false)
  }

  const flattenTree = (items: NavigationItem[], path: string[] = []): Array<[string[], NavigationItem]> => {
    const result: Array<[string[], NavigationItem]> = []
    
    items.forEach((item) => {
      const currentPath = [...path, item.title]
      result.push([currentPath, item])
      
      if (item.children && item.children.length > 0) {
        result.push(...flattenTree(item.children, currentPath))
      }
    })
    
    return result
  }

  const togglePath = (path: string) => {
    const newExpanded = new Set(expandedPaths)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedPaths(newExpanded)
  }

  const getDiffIcon = (type: DiffDetail['type']) => {
    switch (type) {
      case 'added': return <Plus className="h-4 w-4" />
      case 'removed': return <Minus className="h-4 w-4" />
      case 'modified': return <Edit className="h-4 w-4" />
      case 'moved': return <Move className="h-4 w-4" />
    }
  }

  const getDiffColor = (type: DiffDetail['type']) => {
    switch (type) {
      case 'added': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
      case 'removed': return 'text-red-600 dark:text-blue-400 bg-red-50 dark:bg-blue-950/30'
      case 'modified': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
      case 'moved': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
    }
  }

  const renderUnifiedDiff = () => {
    return (
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 p-4">
          {diffDetails.map((detail, index) => {
            const pathStr = detail.path.join(' / ')
            const isExpanded = expandedPaths.has(pathStr)

            return (
              <div
                key={index}
                className={cn(
                  " border p-3",
                  getDiffColor(detail.type)
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getDiffIcon(detail.type)}
                      <span className="font-medium">{pathStr}</span>
                      {detail.changes && detail.changes.length > 0 && (
                        <button
                          onClick={() => togglePath(pathStr)}
                          className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {detail.type === 'moved' && (
                      <div className="text-sm ml-6">
                        {detail.oldParent !== detail.newParent && (
                          <div className="flex items-center gap-2">
                            <span>Parent changed</span>
                            {detail.oldParent && <Badge variant="outline">{detail.oldParent}</Badge>}
                            <ArrowRight className="h-3 w-3" />
                            {detail.newParent && <Badge variant="outline">{detail.newParent}</Badge>}
                          </div>
                        )}
                        {detail.oldPosition !== detail.newPosition && (
                          <div className="flex items-center gap-2">
                            <span>Position</span>
                            <Badge variant="outline">{detail.oldPosition}</Badge>
                            <ArrowRight className="h-3 w-3" />
                            <Badge variant="outline">{detail.newPosition}</Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {isExpanded && detail.changes && (
                      <div className="mt-2 ml-6 space-y-1">
                        {detail.changes.map((change, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium">{change.field}:</span>
                            <span className="ml-2 line-through opacity-60">
                              {change.oldValue || '(empty)'}
                            </span>
                            <ArrowRight className="h-3 w-3 inline mx-1" />
                            <span className="font-medium">
                              {change.newValue || '(empty)'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Badge variant="outline" className="ml-2">
                    {detail.type}
                  </Badge>
                </div>
              </div>
            )
          })}

          {diffDetails.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No changes between these versions
            </p>
          )}
        </div>
      </ScrollArea>
    )
  }

  const renderSplitDiff = () => {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2 text-sm">
            Version {fromVersion?.versionNumber}
          </h4>
          <ScrollArea className="h-[400px] border">
            <div className="p-4">
              <TreeView 
                items={fromVersion?.structure || []} 
                highlights={diffDetails}
                side="from"
              />
            </div>
          </ScrollArea>
        </div>
        <div>
          <h4 className="font-medium mb-2 text-sm">
            Version {toVersion?.versionNumber}
          </h4>
          <ScrollArea className="h-[400px] border">
            <div className="p-4">
              <TreeView 
                items={toVersion?.structure || []} 
                highlights={diffDetails}
                side="to"
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    )
  }

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Calculating differences...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Comparing version {fromVersion?.versionNumber} → {toVersion?.versionNumber}
        </div>
        <div className="flex gap-2 text-sm">
          {Object.entries(
            diffDetails.reduce((acc, d) => {
              acc[d.type] = (acc[d.type] || 0) + 1
              return acc
            }, {} as Record<string, number>)
          ).map(([type, count]) => (
            <span key={type} className={cn("flex items-center gap-1", getDiffColor(type as any).split(' ')[0])}>
              {getDiffIcon(type as any)}
              {count}
            </span>
          ))}
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="unified">Unified</TabsTrigger>
          <TabsTrigger value="split">Side by Side</TabsTrigger>
        </TabsList>

        <TabsContent value="unified" className="mt-4">
          {renderUnifiedDiff()}
        </TabsContent>

        <TabsContent value="split" className="mt-4">
          {renderSplitDiff()}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper component for tree view in split mode
function TreeView({ 
  items, 
  highlights, 
  side,
  level = 0 
}: { 
  items: NavigationItem[]
  highlights: DiffDetail[]
  side: 'from' | 'to'
  level?: number 
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const highlight = highlights.find(h => {
          if (side === 'from') {
            return h.oldItem?.id === item.id
          } else {
            return h.newItem?.id === item.id || h.item?.id === item.id
          }
        })

        return (
          <div key={item.id}>
            <div
              className={cn(
                "px-2 py-1  text-sm",
                highlight && getDiffColor(highlight.type),
                !highlight && "hover:bg-accent"
              )}
              style={{ marginLeft: level * 20 }}
            >
              {item.title}
            </div>
            {item.children && item.children.length > 0 && (
              <TreeView 
                items={item.children} 
                highlights={highlights}
                side={side}
                level={level + 1}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}