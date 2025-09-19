'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CollaborationManager } from '@/lib/collaboration/collaboration-manager'
import { AIContentAssistant } from '@/lib/collaboration/ai-content-assistant'
import { 
  UserPresence,
  Operation,
  Comment,
  Annotation,
  AIContentSuggestion,
  CollaborativeDocument,
  DocumentLock
} from '@/lib/collaboration/types'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  MessageSquare, 
  Highlighter, 
  Lock, 
  Unlock,
  Brain,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Activity,
  GitBranch,
  Sparkles,
  Type,
  Link2,
  BarChart3,
  Shield,
  Clock
} from 'lucide-react'

// User colors for presence
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#FFD93D', '#6BCB77', '#FF6B9D'
]

interface CollaborativeEditorProps {
  documentId: string
  documentType: 'clinical_trial' | 'publication' | 'study' | 'protocol' | 'report' | 'general'
  initialContent?: string
  readOnly?: boolean
  showPresence?: boolean
  showComments?: boolean
  showAnnotations?: boolean
  showAISuggestions?: boolean
  onSave?: (content: string) => void
}

export function CollaborativeEditor({
  documentId,
  documentType,
  initialContent = '',
  readOnly = false,
  showPresence = true,
  showComments = true,
  showAnnotations = true,
  showAISuggestions = true,
  onSave
}: CollaborativeEditorProps) {
  const { user } = useAuth()
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const [content, setContent] = useState(initialContent)
  const [presence, setPresence] = useState<UserPresence[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [suggestions, setSuggestions] = useState<AIContentSuggestion[]>([])
  const [selectedText, setSelectedText] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [activeLock, setActiveLock] = useState<DocumentLock | null>(null)
  const [showSuggestionPanel, setShowSuggestionPanel] = useState(false)
  const [showActivityPanel, setShowActivityPanel] = useState(false)
  const [collaborationManager, setCollaborationManager] = useState<CollaborationManager | null>(null)
  const [aiAssistant] = useState(() => new AIContentAssistant())
  const [sessionActive, setSessionActive] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')

  // Initialize collaboration manager
  useEffect(() => {
    if (!user) return

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const manager = new CollaborationManager(
      supabaseUrl,
      supabaseKey,
      user.id
    )

    // Set up event listeners
    manager.on('session_joined', () => {
      setSessionActive(true)
      setConnectionStatus('connected')
    })

    manager.on('session_left', () => {
      setSessionActive(false)
      setConnectionStatus('disconnected')
    })

    manager.on('presence_synced', (users: UserPresence[]) => {
      setPresence(users)
    })

    manager.on('user_joined', (user: UserPresence) => {
      setPresence(prev => [...prev.filter(u => u.userId !== user.userId), user])
    })

    manager.on('user_left', (user: UserPresence) => {
      setPresence(prev => prev.filter(u => u.userId !== user.userId))
    })

    manager.on('document_updated', (doc: CollaborativeDocument) => {
      setContent(doc.content)
    })

    manager.on('comment_added', (comment: Comment) => {
      setComments(prev => [...prev, comment])
    })

    manager.on('annotation_added', (annotation: Annotation) => {
      setAnnotations(prev => [...prev, annotation])
    })

    manager.on('lock_acquired', (lock: DocumentLock) => {
      setActiveLock(lock)
    })

    manager.on('lock_released', () => {
      setActiveLock(null)
    })

    setCollaborationManager(manager)

    // Join session
    setConnectionStatus('connecting')
    manager.joinSession(documentId).catch(error => {
      console.error('Failed to join session:', error)
      setConnectionStatus('disconnected')
    })

    return () => {
      manager.leaveSession()
    }
  }, [user, documentId])

  // Handle text changes
  const handleTextChange = useCallback(async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (readOnly || !collaborationManager) return

    const newContent = e.target.value
    const oldContent = content
    
    // Calculate the operation
    const operation: Operation = {
      id: `op-${Date.now()}`,
      type: newContent.length > oldContent.length ? 'insert' : 'delete',
      position: e.target.selectionStart,
      content: newContent.length > oldContent.length 
        ? newContent.slice(e.target.selectionStart, e.target.selectionStart + (newContent.length - oldContent.length))
        : undefined,
      length: newContent.length < oldContent.length 
        ? oldContent.length - newContent.length
        : undefined,
      userId: user!.id,
      timestamp: Date.now(),
      version: 0
    }

    // Send operation
    await collaborationManager.sendOperation(operation)
    
    setContent(newContent)
    setIsTyping(true)
    
    // Clear typing indicator after delay
    setTimeout(() => setIsTyping(false), 1000)

    // Generate AI suggestions if enabled
    if (showAISuggestions) {
      const suggestions = await aiAssistant.generateSuggestions(
        newContent,
        e.target.selectionStart,
        documentType
      )
      setSuggestions(suggestions)
    }
  }, [content, collaborationManager, user, readOnly, showAISuggestions, aiAssistant, documentType])

  // Handle cursor movement
  const handleCursorMove = useCallback(async (e: React.MouseEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!collaborationManager || !editorRef.current) return

    const textarea = editorRef.current
    const position = textarea.selectionStart
    const textBeforeCursor = content.substring(0, position)
    const lines = textBeforeCursor.split('\n')
    const line = lines.length
    const column = lines[lines.length - 1].length

    setCursorPosition(position)
    await collaborationManager.updateCursor(position, line, column)
  }, [collaborationManager, content])

  // Handle text selection
  const handleTextSelection = useCallback(async () => {
    if (!collaborationManager || !editorRef.current) return

    const textarea = editorRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    if (start !== end) {
      const selected = content.substring(start, end)
      setSelectedText(selected)
      await collaborationManager.updateSelection(start, end, selected)
    } else {
      setSelectedText('')
    }
  }, [collaborationManager, content])

  // Add comment to selected text
  const handleAddComment = useCallback(async (commentText: string) => {
    if (!collaborationManager || !selectedText) return

    const textarea = editorRef.current!
    await collaborationManager.addComment(
      commentText,
      textarea.selectionStart,
      selectedText
    )
  }, [collaborationManager, selectedText])

  // Add annotation to selected text
  const handleAddAnnotation = useCallback(async (type: Annotation['type'], annotationText: string) => {
    if (!collaborationManager || !editorRef.current) return

    const textarea = editorRef.current
    await collaborationManager.addAnnotation(
      type,
      annotationText,
      textarea.selectionStart,
      textarea.selectionEnd
    )
  }, [collaborationManager])

  // Acquire document lock
  const handleAcquireLock = useCallback(async () => {
    if (!collaborationManager) return

    try {
      await collaborationManager.acquireLock('exclusive')
    } catch (error) {
      console.error('Failed to acquire lock:', error)
    }
  }, [collaborationManager])

  // Release document lock
  const handleReleaseLock = useCallback(async () => {
    if (!collaborationManager || !activeLock) return

    try {
      await collaborationManager.releaseLock(activeLock.id)
    } catch (error) {
      console.error('Failed to release lock:', error)
    }
  }, [collaborationManager, activeLock])

  // Accept AI suggestion
  const handleAcceptSuggestion = useCallback(async (suggestion: AIContentSuggestion) => {
    if (!collaborationManager || !editorRef.current) return

    const textarea = editorRef.current
    const before = content.substring(0, suggestion.position)
    const after = content.substring(suggestion.position)
    const newContent = before + suggestion.suggestion + after

    setContent(newContent)
    
    // Send as operation
    const operation: Operation = {
      id: `op-${Date.now()}`,
      type: 'insert',
      position: suggestion.position,
      content: suggestion.suggestion,
      userId: user!.id,
      timestamp: Date.now(),
      version: 0
    }

    await collaborationManager.sendOperation(operation)
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
  }, [content, collaborationManager, user])

  // Render user cursor
  const renderUserCursor = (user: UserPresence) => {
    if (!user.cursor || user.userId === user?.id) return null

    const position = user.cursor.position
    const textBeforePosition = content.substring(0, position)
    const lines = textBeforePosition.split('\n')
    const top = lines.length * 20 // Approximate line height
    const left = lines[lines.length - 1].length * 8 // Approximate character width

    return (
      <motion.div
        key={user.userId}
        className="absolute pointer-events-none z-10"
        style={{ top, left }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div 
          className="w-0.5 h-5 animate-pulse"
          style={{ backgroundColor: user.color }}
        />
        <div 
          className="absolute -top-6 left-0 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
          style={{ backgroundColor: user.color }}
        >
          {user.user.name || user.user.email}
        </div>
      </motion.div>
    )
  }

  // Render user selection
  const renderUserSelection = (user: UserPresence) => {
    if (!user.selection || user.userId === user?.id) return null

    // Calculate selection overlay position
    // This is simplified - in production, you'd need more precise positioning
    return (
      <div
        className="absolute pointer-events-none opacity-30"
        style={{
          backgroundColor: user.color,
          // Position calculation would go here
        }}
      />
    )
  }

  return (
    <div className="flex h-full">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
              {connectionStatus === 'connecting' && <Clock className="w-3 h-3 mr-1 animate-spin" />}
              {connectionStatus === 'connected' && <CheckCircle className="w-3 h-3 mr-1" />}
              {connectionStatus === 'disconnected' && <XCircle className="w-3 h-3 mr-1" />}
              {connectionStatus}
            </Badge>
            
            {showPresence && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {presence.length} {presence.length === 1 ? 'user' : 'users'} editing
                </span>
                <div className="flex -space-x-2">
                  {presence.slice(0, 5).map(user => (
                    <Avatar key={user.userId} className="w-6 h-6 border-2 border-background">
                      <AvatarImage src={user.user.avatar} />
                      <AvatarFallback style={{ backgroundColor: user.color }}>
                        {user.user.name?.[0] || user.user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {presence.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      +{presence.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {activeLock ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleReleaseLock}
              >
                <Unlock className="w-4 h-4 mr-2" />
                Release Lock
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAcquireLock}
              >
                <Lock className="w-4 h-4 mr-2" />
                Lock Document
              </Button>
            )}

            {showAISuggestions && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSuggestionPanel(!showSuggestionPanel)}
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Assist
                {suggestions.length > 0 && (
                  <Badge className="ml-2" variant="secondary">
                    {suggestions.length}
                  </Badge>
                )}
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowActivityPanel(!showActivityPanel)}
            >
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </Button>

            {onSave && (
              <Button
                size="sm"
                onClick={() => onSave(content)}
              >
                Save
              </Button>
            )}
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 relative">
          {/* User cursors and selections */}
          <AnimatePresence>
            {showPresence && presence.map(user => (
              <React.Fragment key={user.userId}>
                {renderUserCursor(user)}
                {renderUserSelection(user)}
              </React.Fragment>
            ))}
          </AnimatePresence>

          {/* Text Editor */}
          <Textarea
            ref={editorRef}
            value={content}
            onChange={handleTextChange}
            onMouseUp={handleTextSelection}
            onKeyUp={(e) => {
              handleCursorMove(e)
              handleTextSelection()
            }}
            onMouseMove={handleCursorMove}
            readOnly={readOnly || Boolean(activeLock && activeLock.userId !== user?.id)}
            className={cn(
              "w-full h-full resize-none border-0 focus:ring-0 p-6",
              "font-mono text-sm leading-relaxed",
              readOnly && "bg-muted cursor-not-allowed"
            )}
            placeholder="Start typing your medical document..."
          />

          {/* Inline Annotations */}
          {showAnnotations && annotations.map(annotation => (
            <Popover key={annotation.id}>
              <PopoverTrigger asChild>
                <span
                  className="absolute cursor-pointer"
                  style={{
                    // Position calculation based on annotation position
                    backgroundColor: `${annotation.color}20`,
                    borderBottom: `2px solid ${annotation.color}`
                  }}
                >
                  {/* Annotation indicator */}
                </span>
              </PopoverTrigger>
              <PopoverContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{annotation.type}</Badge>
                    <Badge variant={
                      annotation.priority === 'critical' ? 'destructive' :
                      annotation.priority === 'high' ? 'default' :
                      'secondary'
                    }>
                      {annotation.priority}
                    </Badge>
                  </div>
                  <p className="text-sm">{annotation.content}</p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{new Date(annotation.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>

        {/* Editor Footer */}
        <div className="flex items-center justify-between p-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Line {Math.floor(cursorPosition / 80) + 1}</span>
            <span>Column {cursorPosition % 80}</span>
            <span>{content.length} characters</span>
            <span>{content.split(/\s+/).filter(w => w.length > 0).length} words</span>
          </div>
          <div className="flex items-center space-x-2">
            {isTyping && (
              <Badge variant="outline" className="animate-pulse">
                <Type className="w-3 h-3 mr-1" />
                Typing...
              </Badge>
            )}
            <Badge variant="outline">
              {documentType.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Side Panels */}
      <AnimatePresence>
        {showSuggestionPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l bg-background"
          >
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                AI Suggestions
              </h3>
            </div>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-4 space-y-4">
                {suggestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No suggestions available. Keep typing to get AI-powered assistance.
                  </p>
                ) : (
                  suggestions.map(suggestion => (
                    <Card key={suggestion.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <Badge variant="outline">
                            {suggestion.type === 'completion' && <Sparkles className="w-3 h-3 mr-1" />}
                            {suggestion.type === 'correction' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {suggestion.type === 'terminology' && <FileText className="w-3 h-3 mr-1" />}
                            {suggestion.type === 'citation' && <Link2 className="w-3 h-3 mr-1" />}
                            {suggestion.type === 'summary' && <BarChart3 className="w-3 h-3 mr-1" />}
                            {suggestion.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(suggestion.confidence * 100)}% confidence
                          </span>
                        </div>
                        
                        <p className="text-sm">{suggestion.suggestion}</p>
                        
                        {suggestion.explanation && (
                          <p className="text-xs text-muted-foreground">
                            {suggestion.explanation}
                          </p>
                        )}
                        
                        {suggestion.alternatives && suggestion.alternatives.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Alternatives:</p>
                            {suggestion.alternatives.map((alt, i) => (
                              <Button
                                key={i}
                                size="sm"
                                variant="ghost"
                                className="h-auto p-1 text-xs justify-start"
                                onClick={() => handleAcceptSuggestion({
                                  ...suggestion,
                                  suggestion: alt
                                })}
                              >
                                {alt}
                              </Button>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAcceptSuggestion(suggestion)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSuggestions(prev => 
                              prev.filter(s => s.id !== suggestion.id)
                            )}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}

        {showActivityPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 350, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l bg-background"
          >
            <Tabs defaultValue="comments" className="h-full">
              <TabsList className="w-full justify-start rounded-none border-b">
                <TabsTrigger value="comments">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Comments
                  {comments.length > 0 && (
                    <Badge className="ml-2" variant="secondary">
                      {comments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="activity">
                  <Activity className="w-4 h-4 mr-2" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="versions">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Versions
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="comments" className="h-[calc(100%-40px)]">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No comments yet. Select text to add a comment.
                      </p>
                    ) : (
                      comments.map(comment => (
                        <Card key={comment.id} className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-start space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback>
                                  {comment.user.email[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">
                                    {comment.user.name || comment.user.email}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.createdAt).toLocaleTimeString()}
                                  </span>
                                </div>
                                {comment.selection && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    "{comment.selection}"
                                  </p>
                                )}
                                <p className="text-sm mt-2">{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="activity" className="h-[calc(100%-40px)]">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {/* Activity feed would go here */}
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Activity tracking coming soon
                    </p>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="versions" className="h-[calc(100%-40px)]">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {/* Version history would go here */}
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Version history coming soon
                    </p>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}