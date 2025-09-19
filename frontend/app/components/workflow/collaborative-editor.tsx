'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  MessageCircle,
  Plus,
  Reply,
  Edit3,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  AtSign,
  Pin,
  Eye,
  EyeOff,
  Clock,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContentComment } from '@/lib/dal/workflow'

interface CollaborativeEditorProps {
  contentId: string
  content: any
  comments: ContentComment[]
  onContentChange?: (content: any) => void
  onAddComment?: (comment: Partial<ContentComment>) => Promise<ContentComment>
  onResolveComment?: (commentId: string) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
  currentUserId?: string
  readOnly?: boolean
  showSuggestionMode?: boolean
  className?: string
}

interface CommentPosition {
  section: string
  offset?: number
  selection?: { start: number; end: number }
}

const commentTypeIcons = {
  general: MessageCircle,
  suggestion: Lightbulb,
  question: AlertCircle,
  approval: CheckCircle,
  rejection: XCircle
}

const commentTypeColors = {
  general: 'text-blue-600 bg-blue-50 border-blue-200',
  suggestion: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  question: 'text-orange-600 bg-orange-50 border-orange-200',
  approval: 'text-green-600 bg-green-50 border-green-200',
  rejection: 'text-red-600 bg-red-50 border-red-200'
}

export function CollaborativeEditor({
  contentId,
  content,
  comments = [],
  onContentChange,
  onAddComment,
  onResolveComment,
  onDeleteComment,
  currentUserId,
  readOnly = false,
  showSuggestionMode = false,
  className
}: CollaborativeEditorProps) {
  const [activeComment, setActiveComment] = useState<string | null>(null)
  const [newCommentText, setNewCommentText] = useState('')
  const [newCommentType, setNewCommentType] = useState<ContentComment['comment_type']>('general')
  const [selectedPosition, setSelectedPosition] = useState<CommentPosition | null>(null)
  const [showResolved, setShowResolved] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  // Filter comments based on resolved status
  const visibleComments = comments.filter(comment => 
    showResolved || !comment.is_resolved
  )

  // Group comments by position/section
  const commentsBySection = visibleComments.reduce((acc, comment) => {
    const section = comment.position?.section || 'general'
    if (!acc[section]) acc[section] = []
    acc[section].push(comment)
    return acc
  }, {} as Record<string, ContentComment[]>)

  // Handle text selection for inline comments
  const handleTextSelection = useCallback(() => {
    if (readOnly) return
    
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setSelectedPosition(null)
      return
    }

    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer
    
    // Find the section this selection belongs to
    let sectionElement = container.nodeType === Node.TEXT_NODE ? 
      container.parentElement : container as HTMLElement
    
    while (sectionElement && !sectionElement.dataset?.section) {
      sectionElement = sectionElement.parentElement as HTMLElement
    }

    if (sectionElement?.dataset?.section) {
      setSelectedPosition({
        section: sectionElement.dataset.section,
        selection: {
          start: range.startOffset,
          end: range.endOffset
        }
      })
      setIsSelecting(true)
    }
  }, [readOnly])

  // Add new comment
  const handleAddComment = async () => {
    if (!onAddComment || !newCommentText.trim()) return

    try {
      const commentData: Partial<ContentComment> = {
        content_id: contentId,
        comment_text: newCommentText,
        comment_type: newCommentType,
        position: selectedPosition || undefined,
        mentions: [] // TODO: Extract mentions from text
      }

      await onAddComment(commentData)
      setNewCommentText('')
      setNewCommentType('general')
      setSelectedPosition(null)
      setIsSelecting(false)
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  // Handle comment resolution
  const handleResolveComment = async (commentId: string) => {
    if (!onResolveComment) return
    try {
      await onResolveComment(commentId)
    } catch (error) {
      console.error('Failed to resolve comment:', error)
    }
  }

  // Render inline comment indicators
  const renderInlineIndicators = (section: string) => {
    const sectionComments = commentsBySection[section] || []
    if (sectionComments.length === 0) return null

    return (
      <div className="absolute right-0 top-0 flex -translate-y-1/2 gap-1">
        {sectionComments.slice(0, 3).map((comment, index) => {
          const Icon = commentTypeIcons[comment.comment_type]
          return (
            <TooltipProvider key={comment.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    className={cn(
                      'h-6 w-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs',
                      comment.is_resolved ? 'bg-gray-100 text-gray-400' : commentTypeColors[comment.comment_type]
                    )}
                    onClick={() => setActiveComment(comment.id)}
                  >
                    <Icon className="h-3 w-3" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium text-xs">{comment.comment_type.toUpperCase()}</p>
                    <p className="text-sm">{comment.comment_text.substring(0, 50)}...</p>
                    <p className="text-xs text-gray-500">By {comment.author?.email}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
        {sectionComments.length > 3 && (
          <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-xs font-medium">
            +{sectionComments.length - 3}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-6">
        {/* Main Content Editor */}
        <div className="flex-1 space-y-6">
          {/* Title Section */}
          <div className="relative" data-section="title">
            <Input
              value={content.title || ''}
              onChange={(e) => onContentChange?.({ ...content, title: e.target.value })}
              placeholder="Content title..."
              className="text-2xl font-bold border-none p-0 shadow-none focus-visible:ring-0"
              readOnly={readOnly}
              onMouseUp={handleTextSelection}
            />
            {renderInlineIndicators('title')}
          </div>

          {/* Content Sections */}
          <div className="space-y-4">
            {content.sections?.map((section: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
                data-section={`section-${index}`}
              >
                <Textarea
                  value={section.content || ''}
                  onChange={(e) => {
                    const updatedSections = [...(content.sections || [])]
                    updatedSections[index] = { ...section, content: e.target.value }
                    onContentChange?.({ ...content, sections: updatedSections })
                  }}
                  placeholder={`Section ${index + 1} content...`}
                  className="min-h-32 resize-none border-gray-200 focus:border-blue-500"
                  readOnly={readOnly}
                  onMouseUp={handleTextSelection}
                />
                {renderInlineIndicators(`section-${index}`)}
              </motion.div>
            )) || (
              <div className="relative" data-section="content">
                <Textarea
                  value={content.text || ''}
                  onChange={(e) => onContentChange?.({ ...content, text: e.target.value })}
                  placeholder="Content text..."
                  className="min-h-64 resize-none border-gray-200 focus:border-blue-500"
                  readOnly={readOnly}
                  onMouseUp={handleTextSelection}
                />
                {renderInlineIndicators('content')}
              </div>
            )}
          </div>

          {/* Selection-based Comment Input */}
          <AnimatePresence>
            {isSelecting && selectedPosition && !readOnly && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Add Comment</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsSelecting(false)
                        setSelectedPosition(null)
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    {Object.entries(commentTypeIcons).map(([type, Icon]) => (
                      <Button
                        key={type}
                        variant={newCommentType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewCommentType(type as ContentComment['comment_type'])}
                      >
                        <Icon className="h-3 w-3" />
                      </Button>
                    ))}
                  </div>

                  <Textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Add your comment..."
                    className="min-h-20"
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsSelecting(false)
                        setSelectedPosition(null)
                        setNewCommentText('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddComment}>
                      Add Comment
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Comments Sidebar */}
        <div className="w-80 border-l border-gray-200 pl-6">
          <div className="sticky top-6">
            {/* Comments Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Comments ({visibleComments.length})
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResolved(!showResolved)}
                  className={cn(showResolved && 'bg-gray-100')}
                >
                  {showResolved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {visibleComments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  isActive={activeComment === comment.id}
                  onResolve={handleResolveComment}
                  onDelete={onDeleteComment}
                  currentUserId={currentUserId}
                  onClick={() => setActiveComment(activeComment === comment.id ? null : comment.id)}
                />
              ))}
              
              {visibleComments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm">Select text to add a comment</p>
                </div>
              )}
            </div>

            {/* Quick Add Comment */}
            {!readOnly && (
              <Card className="mt-4">
                <CardContent className="p-3">
                  <div className="space-y-3">
                    <Textarea
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Add a general comment..."
                      className="min-h-16 resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {Object.entries(commentTypeIcons).map(([type, Icon]) => (
                          <Button
                            key={type}
                            variant={newCommentType === type ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setNewCommentType(type as ContentComment['comment_type'])}
                          >
                            <Icon className="h-3 w-3" />
                          </Button>
                        ))}
                      </div>
                      <Button size="sm" onClick={handleAddComment} disabled={!newCommentText.trim()}>
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Individual Comment Card Component
function CommentCard({
  comment,
  isActive,
  onResolve,
  onDelete,
  currentUserId,
  onClick
}: {
  comment: ContentComment
  isActive: boolean
  onResolve?: (id: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  currentUserId?: string
  onClick: () => void
}) {
  const [isResolving, setIsResolving] = useState(false)
  const Icon = commentTypeIcons[comment.comment_type]
  const isOwner = comment.author_id === currentUserId

  const handleResolve = async () => {
    if (!onResolve || isResolving) return
    setIsResolving(true)
    try {
      await onResolve(comment.id)
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all duration-200',
        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300',
        comment.is_resolved && 'opacity-60'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            'p-1 rounded-full',
            commentTypeColors[comment.comment_type]
          )}>
            <Icon className="h-3 w-3" />
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {comment.author?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {comment.author?.email || 'Unknown'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {comment.position && (
            <Badge variant="outline" className="text-xs">
              <Pin className="h-2 w-2 mr-1" />
              {comment.position.section}
            </Badge>
          )}
          <span className="text-xs text-gray-500">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-2">{comment.comment_text}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {comment.comment_type !== 'general' && (
            <Badge variant="outline" className={cn('text-xs', commentTypeColors[comment.comment_type])}>
              {comment.comment_type}
            </Badge>
          )}
          {comment.is_resolved && (
            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 text-xs">
              <CheckCircle className="h-2 w-2 mr-1" />
              Resolved
            </Badge>
          )}
        </div>
        
        {!comment.is_resolved && onResolve && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleResolve()
            }}
            disabled={isResolving}
            className="h-6 px-2 text-xs"
          >
            {isResolving ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Clock className="h-3 w-3" />
              </motion.div>
            ) : (
              <CheckCircle className="h-3 w-3" />
            )}
            Resolve
          </Button>
        )}
      </div>
      
      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-xs">
                    {reply.author?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{reply.author?.email}</span>
                <span className="text-xs text-gray-500">
                  {new Date(reply.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700">{reply.comment_text}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}