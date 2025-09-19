/**
 * Real-Time Collaboration System Types
 * Healthcare Technology Platform
 */

import { User } from '@/lib/dal/types'

// Operational Transform Types
export interface Operation {
  id: string
  type: 'insert' | 'delete' | 'format' | 'replace'
  position: number
  content?: string
  length?: number
  attributes?: Record<string, any>
  userId: string
  timestamp: number
  version: number
}

export interface Transform {
  clientOp: Operation
  serverOp: Operation
  transformedClient: Operation
  transformedServer: Operation
}

// Presence and Awareness Types
export interface UserPresence {
  id?: string
  userId: string
  user: {
    id: string
    email: string
    name: string
    avatar?: string
    role: string
  }
  cursor?: {
    position: number
    line: number
    column: number
  }
  selection?: {
    start: number
    end: number
    text: string
  }
  color: string
  status: 'active' | 'idle' | 'away'
  lastActivity: number
  isTyping: boolean
  currentDocument?: string
  viewport?: {
    top: number
    bottom: number
  }
}

// Document and Collaboration Types
export interface CollaborativeDocument {
  id: string
  title: string
  content: string
  type: 'clinical_trial' | 'publication' | 'study' | 'protocol' | 'report' | 'general'
  version: number
  operations: Operation[]
  participants: UserPresence[]
  locks: DocumentLock[]
  comments: Comment[]
  annotations: Annotation[]
  metadata: DocumentMetadata
  createdAt: Date
  updatedAt: Date
  lastEditedBy: string
}

export interface DocumentMetadata {
  category: string
  tags: string[]
  compliance: ComplianceInfo
  medicalTerms: string[]
  references: Reference[]
  statistics?: StatisticalData
  clinicalPhase?: string
  fdaStatus?: string
  irbApproval?: boolean
}

export interface ComplianceInfo {
  hipaaCompliant: boolean
  fdaCompliant: boolean
  irbApproved: boolean
  gdprCompliant: boolean
  lastAudit?: Date
  auditTrail: AuditEntry[]
}

export interface AuditEntry {
  id: string
  userId: string
  action: string
  timestamp: Date
  details: Record<string, any>
  ipAddress?: string
}

// AI Content Assistance Types
export interface AIContentSuggestion {
  id: string
  type: 'completion' | 'correction' | 'terminology' | 'citation' | 'summary'
  suggestion: string
  confidence: number
  context: string
  position: number
  medicalAccuracy?: number
  references?: Reference[]
  alternatives?: string[]
  explanation?: string
}

export interface MedicalTermValidation {
  term: string
  isValid: boolean
  definition?: string
  category?: string
  synonyms?: string[]
  icd10Codes?: string[]
  snomedCodes?: string[]
  meshTerms?: string[]
}

export interface ContentAnalysis {
  readabilityScore: number
  medicalAccuracy: number
  complianceIssues: string[]
  suggestions: AIContentSuggestion[]
  keyPoints: string[]
  summary: string
  citations: Reference[]
  missingReferences: string[]
}

// Commenting and Annotation Types
export interface Comment {
  id: string
  documentId: string
  userId: string
  user: User
  content: string
  position?: number
  selection?: string
  parentId?: string
  replies: Comment[]
  resolved: boolean
  createdAt: Date
  updatedAt: Date
  mentions: string[]
  attachments?: Attachment[]
}

export interface Annotation {
  id: string
  documentId: string
  userId: string
  type: 'highlight' | 'note' | 'correction' | 'approval' | 'flag'
  content: string
  position: {
    start: number
    end: number
  }
  color: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'reviewed' | 'resolved'
  createdAt: Date
  tags: string[]
}

// Document Locking and Permissions
export interface DocumentLock {
  id: string
  documentId: string
  userId: string
  type: 'exclusive' | 'section' | 'read-only'
  section?: {
    start: number
    end: number
  }
  acquiredAt: Date
  expiresAt: Date
  reason?: string
}

export interface DocumentPermission {
  id: string
  documentId: string
  userId?: string
  groupId?: string
  permission: 'view' | 'comment' | 'edit' | 'admin'
  grantedBy: string
  grantedAt: Date
  expiresAt?: Date
}

// Conflict Resolution Types
export interface Conflict {
  id: string
  documentId: string
  type: 'concurrent_edit' | 'merge_conflict' | 'version_mismatch'
  operations: Operation[]
  users: string[]
  baseVersion: number
  conflictingVersions: number[]
  resolution?: ConflictResolution
  createdAt: Date
}

export interface ConflictResolution {
  id: string
  conflictId: string
  resolvedBy: string
  strategy: 'auto_merge' | 'manual_merge' | 'accept_theirs' | 'accept_mine' | 'custom'
  mergedContent: string
  mergedOperations: Operation[]
  resolvedAt: Date
}

// Activity and Analytics Types
export interface CollaborationActivity {
  id: string
  documentId: string
  userId: string
  action: CollaborationAction
  details: Record<string, any>
  timestamp: Date
  duration?: number
  characterChanges?: number
  wordsAdded?: number
  wordsDeleted?: number
}

export type CollaborationAction = 
  | 'document_created'
  | 'document_opened'
  | 'document_edited'
  | 'document_saved'
  | 'comment_added'
  | 'comment_resolved'
  | 'annotation_added'
  | 'user_joined'
  | 'user_left'
  | 'document_locked'
  | 'document_unlocked'
  | 'version_created'
  | 'conflict_resolved'
  | 'ai_suggestion_accepted'
  | 'ai_suggestion_rejected'

export interface CollaborationAnalytics {
  documentId: string
  totalEdits: number
  totalParticipants: number
  activeParticipants: number
  totalComments: number
  resolvedComments: number
  totalAnnotations: number
  editDuration: number
  averageSessionLength: number
  peakConcurrentUsers: number
  aiSuggestionsAccepted: number
  aiSuggestionsRejected: number
  conflictsResolved: number
  complianceScore: number
  qualityScore: number
}

// Reference and Citation Types
export interface Reference {
  id: string
  type: 'journal' | 'book' | 'website' | 'clinical_trial' | 'fda_document'
  title: string
  authors: string[]
  publication?: string
  year?: number
  doi?: string
  pmid?: string
  url?: string
  accessedDate?: Date
  citationStyle: 'apa' | 'mla' | 'chicago' | 'vancouver'
  citationText: string
}

export interface StatisticalData {
  sampleSize?: number
  pValue?: number
  confidenceInterval?: [number, number]
  effectSize?: number
  powerAnalysis?: number
  statisticalTest?: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedBy: string
  uploadedAt: Date
}

// WebSocket Message Types
export interface CollaborationMessage {
  type: CollaborationMessageType
  documentId: string
  userId: string
  data: any
  timestamp: number
  version?: number
}

export type CollaborationMessageType =
  | 'operation'
  | 'presence_update'
  | 'cursor_move'
  | 'selection_change'
  | 'typing_indicator'
  | 'comment_add'
  | 'comment_update'
  | 'annotation_add'
  | 'lock_acquire'
  | 'lock_release'
  | 'document_save'
  | 'conflict_detected'
  | 'ai_suggestion'
  | 'user_join'
  | 'user_leave'
  | 'heartbeat'

// Session Management
export interface CollaborationSession {
  id: string
  documentId: string
  participants: UserPresence[]
  startedAt: Date
  lastActivity: Date
  operations: Operation[]
  version: number
  isActive: boolean
}

// Healthcare-Specific Types
export interface ClinicalProtocolCollaboration {
  protocolId: string
  phase: 'draft' | 'review' | 'approval' | 'active' | 'completed'
  reviewers: ProtocolReviewer[]
  approvals: ProtocolApproval[]
  amendments: ProtocolAmendment[]
  complianceChecks: ComplianceCheck[]
}

export interface ProtocolReviewer {
  userId: string
  role: 'principal_investigator' | 'medical_reviewer' | 'statistician' | 'regulatory'
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
  comments: string[]
  reviewedAt?: Date
}

export interface ProtocolApproval {
  id: string
  approver: string
  role: string
  approved: boolean
  conditions?: string[]
  signature?: string
  approvedAt: Date
}

export interface ProtocolAmendment {
  id: string
  version: string
  description: string
  changes: string[]
  submittedBy: string
  submittedAt: Date
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
}

export interface ComplianceCheck {
  id: string
  type: 'hipaa' | 'fda' | 'irb' | 'gdpr' | 'ich_gcp'
  passed: boolean
  issues: string[]
  recommendations: string[]
  checkedAt: Date
  checkedBy: string
}

// Export all types
export type {
  User,
  CollaborationAction as Action,
  CollaborationMessageType as MessageType
}