/**
 * Real-Time Collaboration Manager
 * Manages collaborative sessions, presence, and synchronization
 */

import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { OperationalTransform } from './operational-transform'
import {
  CollaborativeDocument,
  UserPresence,
  Operation,
  CollaborationMessage,
  Comment,
  Annotation,
  DocumentLock,
  CollaborationSession,
  Conflict,
  ConflictResolution,
  CollaborationActivity
} from './types'

export class CollaborationManager {
  private supabase: SupabaseClient
  private channel: RealtimeChannel | null = null
  private session: CollaborationSession | null = null
  private localOperations: Operation[] = []
  private remoteOperations: Operation[] = []
  private presence: Map<string, UserPresence> = new Map()
  private document: CollaborativeDocument | null = null
  private userId: string
  private heartbeatInterval: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private callbacks: Map<string, Function[]> = new Map()

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    userId: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.userId = userId
  }

  /**
   * Join a collaborative session
   */
  async joinSession(documentId: string): Promise<CollaborationSession> {
    try {
      // Leave any existing session
      if (this.channel) {
        await this.leaveSession()
      }

      // Create or join session
      const { data: sessionData, error: sessionError } = await this.supabase
        .from('collaboration_sessions')
        .select('*')
        .eq('document_id', documentId)
        .eq('is_active', true)
        .single()

      if (sessionError && sessionError.code !== 'PGRST116') {
        throw sessionError
      }

      // Create new session if none exists
      if (!sessionData) {
        const { data: newSession, error: createError } = await this.supabase
          .from('collaboration_sessions')
          .insert({
            document_id: documentId,
            started_at: new Date().toISOString(),
            last_activity: new Date().toISOString(),
            version: 0,
            is_active: true
          })
          .select()
          .single()

        if (createError) throw createError
        this.session = newSession
      } else {
        this.session = sessionData
      }

      // Load document
      await this.loadDocument(documentId)

      // Setup real-time channel
      this.channel = this.supabase.channel(`collaboration:${documentId}`)

      // Handle presence
      this.channel.on('presence', { event: 'sync' }, () => {
        const state = this.channel!.presenceState()
        this.syncPresence(state)
      })

      // Handle presence updates
      this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.handleUserJoin(key, newPresences)
      })

      this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.handleUserLeave(key, leftPresences)
      })

      // Handle broadcast messages
      this.channel.on('broadcast', { event: 'operation' }, ({ payload }) => {
        this.handleRemoteOperation(payload)
      })

      this.channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
        this.handleCursorUpdate(payload)
      })

      this.channel.on('broadcast', { event: 'selection' }, ({ payload }) => {
        this.handleSelectionUpdate(payload)
      })

      this.channel.on('broadcast', { event: 'comment' }, ({ payload }) => {
        this.handleCommentUpdate(payload)
      })

      this.channel.on('broadcast', { event: 'annotation' }, ({ payload }) => {
        this.handleAnnotationUpdate(payload)
      })

      this.channel.on('broadcast', { event: 'lock' }, ({ payload }) => {
        this.handleLockUpdate(payload)
      })

      // Subscribe to channel
      await this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await this.channel!.track({
            userId: this.userId,
            status: 'active',
            documentId,
            joinedAt: new Date().toISOString()
          })

          // Start heartbeat
          this.startHeartbeat()

          // Notify callbacks
          this.emit('session_joined', this.session)
        }
      })

      // Record activity
      await this.recordActivity('user_joined', {
        sessionId: this.session!.id,
        documentId
      })

      return this.session!
    } catch (error) {
      console.error('Failed to join session:', error)
      throw error
    }
  }

  /**
   * Leave the current session
   */
  async leaveSession(): Promise<void> {
    try {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
        this.heartbeatInterval = null
      }

      if (this.channel) {
        await this.channel.untrack()
        await this.channel.unsubscribe()
        this.channel = null
      }

      if (this.session) {
        // Record activity
        await this.recordActivity('user_left', {
          sessionId: this.session.id,
          documentId: this.document?.id
        })

        // Update session activity
        await this.supabase
          .from('collaboration_sessions')
          .update({
            last_activity: new Date().toISOString()
          })
          .eq('id', this.session.id)
      }

      // Clear state
      this.session = null
      this.document = null
      this.localOperations = []
      this.remoteOperations = []
      this.presence.clear()

      this.emit('session_left', null)
    } catch (error) {
      console.error('Failed to leave session:', error)
    }
  }

  /**
   * Send a local operation
   */
  async sendOperation(operation: Operation): Promise<void> {
    if (!this.channel || !this.document) return

    try {
      // Add to local operations
      this.localOperations.push(operation)

      // Transform against remote operations
      let transformedOp = operation
      for (const remoteOp of this.remoteOperations) {
        const result = OperationalTransform.transform(transformedOp, remoteOp)
        transformedOp = result.transformedClient
      }

      // Apply to local document
      this.document.content = OperationalTransform.applyOperation(
        this.document.content,
        transformedOp
      )
      this.document.version++

      // Broadcast to other clients
      await this.channel.send({
        type: 'broadcast',
        event: 'operation',
        payload: {
          operation: transformedOp,
          version: this.document.version,
          userId: this.userId,
          timestamp: Date.now()
        }
      })

      // Save to database periodically
      await this.saveDocument()

      // Record activity
      await this.recordActivity('document_edited', {
        operation: transformedOp,
        characterChanges: transformedOp.content?.length || transformedOp.length || 0
      })

      this.emit('operation_sent', transformedOp)
    } catch (error) {
      console.error('Failed to send operation:', error)
      this.emit('operation_failed', { operation, error })
    }
  }

  /**
   * Handle remote operation
   */
  private async handleRemoteOperation(payload: any): Promise<void> {
    if (!this.document || payload.userId === this.userId) return

    try {
      const remoteOp: Operation = payload.operation

      // Add to remote operations
      this.remoteOperations.push(remoteOp)

      // Transform local operations against remote
      const transformedLocal: Operation[] = []
      for (const localOp of this.localOperations) {
        const result = OperationalTransform.transform(localOp, remoteOp)
        transformedLocal.push(result.transformedClient)
      }
      this.localOperations = transformedLocal

      // Apply remote operation
      this.document.content = OperationalTransform.applyOperation(
        this.document.content,
        remoteOp
      )
      this.document.version = payload.version

      this.emit('operation_received', remoteOp)
      this.emit('document_updated', this.document)
    } catch (error) {
      console.error('Failed to handle remote operation:', error)
      await this.handleConflict(payload.operation)
    }
  }

  /**
   * Update cursor position
   */
  async updateCursor(position: number, line: number, column: number): Promise<void> {
    if (!this.channel) return

    await this.channel.send({
      type: 'broadcast',
      event: 'cursor',
      payload: {
        userId: this.userId,
        cursor: { position, line, column },
        timestamp: Date.now()
      }
    })

    this.emit('cursor_updated', { position, line, column })
  }

  /**
   * Update selection
   */
  async updateSelection(start: number, end: number, text: string): Promise<void> {
    if (!this.channel) return

    await this.channel.send({
      type: 'broadcast',
      event: 'selection',
      payload: {
        userId: this.userId,
        selection: { start, end, text },
        timestamp: Date.now()
      }
    })

    this.emit('selection_updated', { start, end, text })
  }

  /**
   * Add comment
   */
  async addComment(
    content: string,
    position?: number,
    selection?: string,
    parentId?: string
  ): Promise<Comment> {
    if (!this.document) throw new Error('No document loaded')

    try {
      const { data: comment, error } = await this.supabase
        .from('collaboration_comments')
        .insert({
          document_id: this.document.id,
          user_id: this.userId,
          content,
          position,
          selection,
          parent_id: parentId,
          resolved: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Broadcast to other clients
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'comment',
          payload: {
            action: 'add',
            comment,
            userId: this.userId
          }
        })
      }

      // Record activity
      await this.recordActivity('comment_added', { commentId: comment.id })

      this.emit('comment_added', comment)
      return comment
    } catch (error) {
      console.error('Failed to add comment:', error)
      throw error
    }
  }

  /**
   * Add annotation
   */
  async addAnnotation(
    type: Annotation['type'],
    content: string,
    start: number,
    end: number,
    priority: Annotation['priority'] = 'medium'
  ): Promise<Annotation> {
    if (!this.document) throw new Error('No document loaded')

    try {
      const { data: annotation, error } = await this.supabase
        .from('collaboration_annotations')
        .insert({
          document_id: this.document.id,
          user_id: this.userId,
          type,
          content,
          position_start: start,
          position_end: end,
          priority,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Broadcast to other clients
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'annotation',
          payload: {
            action: 'add',
            annotation,
            userId: this.userId
          }
        })
      }

      // Record activity
      await this.recordActivity('annotation_added', { annotationId: annotation.id })

      this.emit('annotation_added', annotation)
      return annotation
    } catch (error) {
      console.error('Failed to add annotation:', error)
      throw error
    }
  }

  /**
   * Acquire document lock
   */
  async acquireLock(
    type: DocumentLock['type'],
    section?: { start: number; end: number },
    reason?: string
  ): Promise<DocumentLock> {
    if (!this.document) throw new Error('No document loaded')

    try {
      // Check for conflicting locks
      const { data: existingLocks, error: checkError } = await this.supabase
        .from('document_locks')
        .select('*')
        .eq('document_id', this.document.id)
        .gte('expires_at', new Date().toISOString())

      if (checkError) throw checkError

      // Check for conflicts
      if (existingLocks && existingLocks.length > 0) {
        for (const lock of existingLocks) {
          if (lock.type === 'exclusive') {
            throw new Error('Document is exclusively locked')
          }
          if (type === 'exclusive') {
            throw new Error('Cannot acquire exclusive lock while other locks exist')
          }
          if (section && lock.section) {
            // Check for overlapping sections
            const lockStart = lock.section.start
            const lockEnd = lock.section.end
            if (!(section.end <= lockStart || section.start >= lockEnd)) {
              throw new Error('Section is already locked')
            }
          }
        }
      }

      // Acquire lock
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 30) // 30-minute lock

      const { data: lock, error } = await this.supabase
        .from('document_locks')
        .insert({
          document_id: this.document.id,
          user_id: this.userId,
          type,
          section,
          acquired_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          reason
        })
        .select()
        .single()

      if (error) throw error

      // Broadcast to other clients
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'lock',
          payload: {
            action: 'acquire',
            lock,
            userId: this.userId
          }
        })
      }

      // Record activity
      await this.recordActivity('document_locked', { lockId: lock.id, type })

      this.emit('lock_acquired', lock)
      return lock
    } catch (error) {
      console.error('Failed to acquire lock:', error)
      throw error
    }
  }

  /**
   * Release document lock
   */
  async releaseLock(lockId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('document_locks')
        .delete()
        .eq('id', lockId)
        .eq('user_id', this.userId)

      if (error) throw error

      // Broadcast to other clients
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'lock',
          payload: {
            action: 'release',
            lockId,
            userId: this.userId
          }
        })
      }

      // Record activity
      await this.recordActivity('document_unlocked', { lockId })

      this.emit('lock_released', lockId)
    } catch (error) {
      console.error('Failed to release lock:', error)
      throw error
    }
  }

  /**
   * Handle conflicts
   */
  private async handleConflict(operation: Operation): Promise<void> {
    if (!this.document) return

    try {
      // Create conflict record
      const { data: conflict, error } = await this.supabase
        .from('collaboration_conflicts')
        .insert({
          document_id: this.document.id,
          type: 'concurrent_edit',
          operations: [operation],
          users: [this.userId, operation.userId],
          base_version: this.document.version,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      this.emit('conflict_detected', conflict)

      // Attempt auto-resolution
      const resolution = await this.autoResolveConflict(conflict)
      if (resolution) {
        this.emit('conflict_resolved', resolution)
      }
    } catch (error) {
      console.error('Failed to handle conflict:', error)
    }
  }

  /**
   * Auto-resolve conflicts when possible
   */
  private async autoResolveConflict(conflict: Conflict): Promise<ConflictResolution | null> {
    // Simple auto-resolution for non-overlapping edits
    // More complex resolution strategies can be implemented
    try {
      const { data: resolution, error } = await this.supabase
        .from('conflict_resolutions')
        .insert({
          conflict_id: conflict.id,
          resolved_by: 'system',
          strategy: 'auto_merge',
          resolved_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Record activity
      await this.recordActivity('conflict_resolved', {
        conflictId: conflict.id,
        strategy: 'auto_merge'
      })

      return resolution
    } catch (error) {
      console.error('Failed to auto-resolve conflict:', error)
      return null
    }
  }

  /**
   * Load document
   */
  private async loadDocument(documentId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('collaborative_documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error) throw error

      this.document = data
      this.emit('document_loaded', this.document)
    } catch (error) {
      console.error('Failed to load document:', error)
      throw error
    }
  }

  /**
   * Save document
   */
  private async saveDocument(): Promise<void> {
    if (!this.document) return

    try {
      const { error } = await this.supabase
        .from('collaborative_documents')
        .update({
          content: this.document.content,
          version: this.document.version,
          updated_at: new Date().toISOString(),
          last_edited_by: this.userId
        })
        .eq('id', this.document.id)

      if (error) throw error

      // Record activity
      await this.recordActivity('document_saved', {
        documentId: this.document.id,
        version: this.document.version
      })
    } catch (error) {
      console.error('Failed to save document:', error)
    }
  }

  /**
   * Record collaboration activity
   */
  private async recordActivity(
    action: CollaborationActivity['action'],
    details: Record<string, any>
  ): Promise<void> {
    try {
      await this.supabase.from('collaboration_activities').insert({
        document_id: this.document?.id,
        user_id: this.userId,
        action,
        details,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to record activity:', error)
    }
  }

  /**
   * Sync presence state
   */
  private syncPresence(state: any): void {
    this.presence.clear()
    
    for (const [key, presences] of Object.entries(state)) {
      if (Array.isArray(presences)) {
        for (const presence of presences) {
          this.presence.set(presence.userId, presence)
        }
      }
    }

    this.emit('presence_synced', Array.from(this.presence.values()))
  }

  /**
   * Handle user join
   */
  private handleUserJoin(key: string, newPresences: any[]): void {
    for (const presence of newPresences) {
      this.presence.set(presence.userId, presence)
      this.emit('user_joined', presence)
    }
  }

  /**
   * Handle user leave
   */
  private handleUserLeave(key: string, leftPresences: any[]): void {
    for (const presence of leftPresences) {
      this.presence.delete(presence.userId)
      this.emit('user_left', presence)
    }
  }

  /**
   * Handle cursor update
   */
  private handleCursorUpdate(payload: any): void {
    if (payload.userId === this.userId) return

    const presence = this.presence.get(payload.userId)
    if (presence) {
      presence.cursor = payload.cursor
      this.emit('cursor_moved', { userId: payload.userId, cursor: payload.cursor })
    }
  }

  /**
   * Handle selection update
   */
  private handleSelectionUpdate(payload: any): void {
    if (payload.userId === this.userId) return

    const presence = this.presence.get(payload.userId)
    if (presence) {
      presence.selection = payload.selection
      this.emit('selection_changed', { userId: payload.userId, selection: payload.selection })
    }
  }

  /**
   * Handle comment update
   */
  private handleCommentUpdate(payload: any): void {
    if (payload.userId === this.userId) return
    this.emit('comment_updated', payload)
  }

  /**
   * Handle annotation update
   */
  private handleAnnotationUpdate(payload: any): void {
    if (payload.userId === this.userId) return
    this.emit('annotation_updated', payload)
  }

  /**
   * Handle lock update
   */
  private handleLockUpdate(payload: any): void {
    if (payload.userId === this.userId) return
    this.emit('lock_updated', payload)
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: {
            userId: this.userId,
            timestamp: Date.now()
          }
        })
      }
    }, 30000) // 30 seconds
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event)!.push(callback)
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: Function): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  /**
   * Get current presence
   */
  getPresence(): UserPresence[] {
    return Array.from(this.presence.values())
  }

  /**
   * Get current document
   */
  getDocument(): CollaborativeDocument | null {
    return this.document
  }

  /**
   * Get session info
   */
  getSession(): CollaborationSession | null {
    return this.session
  }
}