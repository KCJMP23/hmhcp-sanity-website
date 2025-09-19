'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  Clock, 
  User, 
  RotateCcw, 
  Eye, 
  Code2, 
  FileText,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Revision {
  id: string
  version: number
  title: string
  content: string
  excerpt?: string
  author: {
    name: string
    email: string
    avatar?: string
  }
  timestamp: Date
  changes: {
    additions: number
    deletions: number
    modifications: number
  }
  status: 'published' | 'draft' | 'scheduled'
  message?: string
}

interface DiffLine {
  type: 'addition' | 'deletion' | 'unchanged'
  content: string
  lineNumber: {
    old?: number
    new?: number
  }
}

interface RevisionHistoryModalProps {
  contentId: string
  contentTitle: string
  isOpen: boolean
  onClose: () => void
  onRestore?: (revision: Revision) => void
}

export function RevisionHistoryModal({
  contentId,
  contentTitle,
  isOpen,
  onClose,
  onRestore
}: RevisionHistoryModalProps) {
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null)
  const [compareRevision, setCompareRevision] = useState<Revision | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual')
  const [expandedRevisions, setExpandedRevisions] = useState<Set<string>>(new Set())

  // Load revisions
  useEffect(() => {
    if (isOpen) {
      loadRevisions()
    }
  }, [isOpen, contentId])

  const loadRevisions = async () => {
    setIsLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockRevisions: Revision[] = Array.from({ length: 10 }, (_, i) => ({
        id: `rev-${i}`,
        version: 10 - i,
        title: contentTitle,
        content: generateMockContent(10 - i),
        excerpt: `This is version ${10 - i} of the content with some changes...`,
        author: {
          name: ['Admin User', 'Editor Smith', 'John Doe'][i % 3],
          email: ['admin@example.com', 'editor@example.com', 'john@example.com'][i % 3]
        },
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Each revision 1 day apart
        changes: {
          additions: Math.floor(Math.random() * 50),
          deletions: Math.floor(Math.random() * 30),
          modifications: Math.floor(Math.random() * 20)
        },
        status: i === 0 ? 'published' : i < 3 ? 'draft' : 'published' as const,
        message: i === 0 ? 'Current version' : `Updated ${['header', 'content', 'footer', 'sidebar'][i % 4]} section`
      }))
      
      setRevisions(mockRevisions)
      setSelectedRevision(mockRevisions[0])
      if (mockRevisions.length > 1) {
        setCompareRevision(mockRevisions[1])
      }
    } catch (error) {
      console.error('Failed to load revisions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockContent = (version: number) => {
    return `<h1>Healthcare Innovation Platform v${version}</h1>
<p>Welcome to our comprehensive healthcare technology platform. This version includes updates to our core features and enhanced user experience.</p>
<h2>Key Features</h2>
<ul>
  <li>Advanced clinical trial management</li>
  <li>Real-time data analytics ${version > 5 ? '(Enhanced)' : ''}</li>
  <li>Secure patient communication</li>
  ${version > 7 ? '<li>AI-powered insights dashboard</li>' : ''}
</ul>
<p>Our platform continues to evolve with cutting-edge technology to serve healthcare providers better.</p>`
  }

  const generateDiff = (oldContent: string, newContent: string): DiffLine[] => {
    // Simple diff implementation - in production, use a proper diff library
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    const diff: DiffLine[] = []
    
    let oldIndex = 0
    let newIndex = 0
    
    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      if (oldIndex >= oldLines.length) {
        // Remaining new lines
        diff.push({
          type: 'addition',
          content: newLines[newIndex],
          lineNumber: { new: newIndex + 1 }
        })
        newIndex++
      } else if (newIndex >= newLines.length) {
        // Remaining old lines
        diff.push({
          type: 'deletion',
          content: oldLines[oldIndex],
          lineNumber: { old: oldIndex + 1 }
        })
        oldIndex++
      } else if (oldLines[oldIndex] === newLines[newIndex]) {
        // Unchanged line
        diff.push({
          type: 'unchanged',
          content: oldLines[oldIndex],
          lineNumber: { old: oldIndex + 1, new: newIndex + 1 }
        })
        oldIndex++
        newIndex++
      } else {
        // Changed lines - simplified diff
        if (oldLines[oldIndex].includes(newLines[newIndex].substring(0, 10))) {
          // Modified line
          diff.push({
            type: 'deletion',
            content: oldLines[oldIndex],
            lineNumber: { old: oldIndex + 1 }
          })
          diff.push({
            type: 'addition',
            content: newLines[newIndex],
            lineNumber: { new: newIndex + 1 }
          })
          oldIndex++
          newIndex++
        } else {
          // Completely different
          diff.push({
            type: 'deletion',
            content: oldLines[oldIndex],
            lineNumber: { old: oldIndex + 1 }
          })
          oldIndex++
        }
      }
    }
    
    return diff
  }

  const toggleRevisionExpand = (revisionId: string) => {
    setExpandedRevisions(prev => {
      const next = new Set(prev)
      if (next.has(revisionId)) {
        next.delete(revisionId)
      } else {
        next.add(revisionId)
      }
      return next
    })
  }

  const handleRestore = (revision: Revision) => {
    if (onRestore) {
      onRestore(revision)
      onClose()
    }
  }

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'draft': return <FileText className="h-4 w-4 text-yellow-500" />
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-500" />
      default: return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Revision History: {contentTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[75vh]">
          {/* Revision List */}
          <div className="w-1/3 border-r">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {revisions.map((revision, index) => {
                  const isSelected = selectedRevision?.id === revision.id
                  const isCompare = compareRevision?.id === revision.id
                  const isExpanded = expandedRevisions.has(revision.id)
                  
                  return (
                    <div
                      key={revision.id}
                      className={cn(
                        "border rounded-lg transition-all duration-200",
                        isSelected && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                        isCompare && "border-green-500",
                        !isSelected && !isCompare && "hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      {/* Revision Header */}
                      <div
                        className="p-3 cursor-pointer"
                        onClick={() => toggleRevisionExpand(revision.id)}
                      >
                        <div className="flex items-start gap-3">
                          <button className="mt-1">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getAuthorInitials(revision.author.name)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                v{revision.version}
                              </span>
                              {getStatusIcon(revision.status)}
                              {index === 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {revision.author.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDistanceToNow(revision.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 mb-3">
                            {revision.message || 'No description provided'}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs mb-3">
                            <span className="text-green-600">
                              +{revision.changes.additions}
                            </span>
                            <span className="text-red-600">
                              -{revision.changes.deletions}
                            </span>
                            <span className="text-yellow-600">
                              ~{revision.changes.modifications}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedRevision(revision)
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            
                            <Button
                              size="sm"
                              variant={isCompare ? "default" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation()
                                setCompareRevision(revision)
                              }}
                              disabled={isSelected}
                            >
                              Compare
                            </Button>
                            
                            {index !== 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRestore(revision)
                                }}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Restore
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
          
          {/* Revision Content */}
          <div className="flex-1">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="h-full flex flex-col">
              <div className="px-6 py-3 border-b">
                <TabsList>
                  <TabsTrigger value="visual" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Visual
                  </TabsTrigger>
                  <TabsTrigger value="code" className="gap-2">
                    <Code2 className="h-4 w-4" />
                    Code Diff
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <ScrollArea className="flex-1">
                <TabsContent value="visual" className="p-6 m-0">
                  {selectedRevision && (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div dangerouslySetInnerHTML={{ __html: selectedRevision.content }} />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="code" className="p-6 m-0">
                  {selectedRevision && compareRevision && (
                    <div className="font-mono text-sm">
                      <div className="mb-4 flex items-center gap-4 text-xs">
                        <span className="text-gray-500">
                          Comparing v{compareRevision.version} → v{selectedRevision.version}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-100 border border-red-300" />
                            Removed
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-100 border border-green-300" />
                            Added
                          </span>
                        </div>
                      </div>
                      
                      {generateDiff(compareRevision.content, selectedRevision.content).map((line, index) => (
                        <div
                          key={index}
                          className={cn(
                            "px-2 py-1",
                            line.type === 'addition' && "bg-green-50 dark:bg-blue-900/20 text-green-700 dark:text-blue-300",
                            line.type === 'deletion' && "bg-red-50 dark:bg-blue-900/20 text-red-700 dark:text-blue-300",
                            line.type === 'unchanged' && "text-gray-600 dark:text-gray-400"
                          )}
                        >
                          <span className="inline-block w-12 text-right pr-4 text-xs text-gray-400">
                            {line.lineNumber.old || line.lineNumber.new}
                          </span>
                          <span className="pr-2">
                            {line.type === 'addition' && '+'}
                            {line.type === 'deletion' && '-'}
                            {line.type === 'unchanged' && ' '}
                          </span>
                          {line.content}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}