/**
 * Admin Data Access Layer Types
 * TypeScript interfaces and Zod schemas for admin database operations
 * Healthcare platform admin system with type-safe database interactions
 */

import { z } from 'zod'

// ================================
// Base Types and Enums
// ================================

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author'
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  REVIEW = 'review'
}

export enum CategoryType {
  BLOG = 'blog',
  SERVICE = 'service',
  PLATFORM = 'platform',
  RESEARCH = 'research'
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PERMISSION_CHANGE = 'permission_change'
}

// ================================
// Database Table Interfaces
// ================================

/**
 * Admin Users Table
 */
export interface AdminUser {
  id: string
  email: string
  password_hash: string
  role: AdminRole
  name?: string
  avatar_url?: string
  is_active: boolean
  two_factor_enabled: boolean
  login_attempts: number
  locked_until?: string
  last_login?: string
  permissions?: string[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * Admin Sessions Table
 */
export interface AdminSession {
  id: string
  user_id: string
  token: string
  expires_at: string
  ip_address: string
  user_agent: string
  is_active: boolean
  last_activity: string
  created_at: string
}

/**
 * Pages Table (Managed Content)
 */
export interface Page {
  id: string
  slug: string
  title: string
  content: Record<string, any>
  meta_description?: string
  meta_keywords?: string[]
  status: ContentStatus
  template?: string
  featured_image?: string
  seo_config?: Record<string, any>
  published_at?: string
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
}

/**
 * Blog Posts Table
 */
export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image?: string
  author_id: string
  category_ids: string[]
  tags: string[]
  status: ContentStatus
  view_count: number
  read_time_minutes?: number
  meta_description?: string
  meta_keywords?: string[]
  seo_config?: Record<string, any>
  published_at?: string
  created_at: string
  updated_at: string
}

/**
 * Team Members Table
 */
export interface TeamMember {
  id: string
  name: string
  title: string
  bio?: string
  avatar_url?: string
  email?: string
  linkedin_url?: string
  twitter_url?: string
  expertise: string[]
  is_featured: boolean
  display_order: number
  status: ContentStatus
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Platforms Table
 */
export interface Platform {
  id: string
  name: string
  slug: string
  description: string
  detailed_description?: string
  features: string[]
  technologies: string[]
  status: ContentStatus
  featured_image?: string
  gallery_images?: string[]
  demo_url?: string
  documentation_url?: string
  display_order: number
  is_featured: boolean
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
}

/**
 * Services Table
 */
export interface Service {
  id: string
  name: string
  slug: string
  description: string
  detailed_description?: string
  icon?: string
  features: string[]
  pricing_model?: string
  status: ContentStatus
  category_id?: string
  display_order: number
  is_featured: boolean
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
}

/**
 * Categories Table
 */
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  type: CategoryType
  parent_id?: string
  color?: string
  icon?: string
  display_order: number
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Testimonials Table
 */
export interface Testimonial {
  id: string
  client_name: string
  client_title?: string
  client_company?: string
  content: string
  rating?: number
  avatar_url?: string
  is_featured: boolean
  display_order: number
  status: ContentStatus
  service_ids?: string[]
  platform_ids?: string[]
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Audit Logs Table
 */
export interface AuditLog {
  id: string
  user_id: string
  action: AuditAction
  resource_type: string
  resource_id?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// ================================
// Zod Validation Schemas
// ================================

/**
 * Admin User Schemas
 */
export const AdminUserCreateSchema = z.object({
  email: z.string().email().min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(AdminRole),
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  permissions: z.array(z.string()).optional()
})

export const AdminUserUpdateSchema = z.object({
  email: z.string().email().optional(),
  role: z.nativeEnum(AdminRole).optional(),
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  is_active: z.boolean().optional(),
  two_factor_enabled: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
})

/**
 * Page Schemas
 */
export const PageCreateSchema = z.object({
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  title: z.string().min(1, 'Title is required'),
  content: z.record(z.any()),
  meta_description: z.string().max(160).optional(),
  meta_keywords: z.array(z.string()).optional(),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  template: z.string().optional(),
  featured_image: z.string().url().optional(),
  seo_config: z.record(z.any()).optional()
})

export const PageUpdateSchema = PageCreateSchema.partial()

/**
 * Blog Post Schemas
 */
export const BlogPostCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(1, 'Content is required'),
  featured_image: z.string().url().optional(),
  author_id: z.string().uuid('Valid author ID required'),
  category_ids: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string()).default([]),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  read_time_minutes: z.number().int().min(1).optional(),
  meta_description: z.string().max(160).optional(),
  meta_keywords: z.array(z.string()).optional(),
  seo_config: z.record(z.any()).optional()
})

export const BlogPostUpdateSchema = BlogPostCreateSchema.partial().omit({ author_id: true })

/**
 * Team Member Schemas
 */
export const TeamMemberCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  bio: z.string().optional(),
  avatar_url: z.string().url().optional(),
  email: z.string().email().optional(),
  linkedin_url: z.string().url().optional(),
  twitter_url: z.string().url().optional(),
  expertise: z.array(z.string()).default([]),
  is_featured: z.boolean().default(false),
  display_order: z.number().int().min(0).default(0),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.PUBLISHED)
})

export const TeamMemberUpdateSchema = TeamMemberCreateSchema.partial()

/**
 * Platform Schemas
 */
export const PlatformCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().min(1, 'Description is required'),
  detailed_description: z.string().optional(),
  features: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  featured_image: z.string().url().optional(),
  gallery_images: z.array(z.string().url()).default([]),
  demo_url: z.string().url().optional(),
  documentation_url: z.string().url().optional(),
  display_order: z.number().int().min(0).default(0),
  is_featured: z.boolean().default(false)
})

export const PlatformUpdateSchema = PlatformCreateSchema.partial()

/**
 * Service Schemas
 */
export const ServiceCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().min(1, 'Description is required'),
  detailed_description: z.string().optional(),
  icon: z.string().optional(),
  features: z.array(z.string()).default([]),
  pricing_model: z.string().optional(),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  category_id: z.string().uuid().optional(),
  display_order: z.number().int().min(0).default(0),
  is_featured: z.boolean().default(false)
})

export const ServiceUpdateSchema = ServiceCreateSchema.partial()

/**
 * Category Schemas
 */
export const CategoryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().optional(),
  type: z.nativeEnum(CategoryType),
  parent_id: z.string().uuid().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex code').optional(),
  icon: z.string().optional(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true)
})

export const CategoryUpdateSchema = CategoryCreateSchema.partial()

/**
 * Testimonial Schemas
 */
export const TestimonialCreateSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  client_title: z.string().optional(),
  client_company: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  rating: z.number().int().min(1).max(5).optional(),
  avatar_url: z.string().url().optional(),
  is_featured: z.boolean().default(false),
  display_order: z.number().int().min(0).default(0),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.PUBLISHED),
  service_ids: z.array(z.string().uuid()).optional(),
  platform_ids: z.array(z.string().uuid()).optional()
})

export const TestimonialUpdateSchema = TestimonialCreateSchema.partial()

// ================================
// Query Result Types
// ================================

export interface QueryResult<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
  
  // Cursor-based pagination metadata
  cursors?: {
    before?: string
    after?: string
    current?: string
  }
  
  // Performance metadata
  queryTime?: number
  cacheHit?: boolean
  
  // Batch loading metadata
  batches?: {
    loaded: number
    total: number
    hasMore: boolean
  }
}

export interface CursorPaginationOptions {
  cursor?: string
  direction?: 'before' | 'after'
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PerformanceMetrics {
  queryTime: number
  rowCount: number
  indexUsed: boolean
  cacheHit: boolean
  memoryUsed?: number
}

export interface QueryOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
  search?: string
  
  // Cursor-based pagination for large datasets
  cursor?: string
  cursorDirection?: 'before' | 'after'
  
  // Performance optimization options
  selectFields?: string[]
  includeCount?: boolean
  useBatching?: boolean
  batchSize?: number
}

// ================================
// Healthcare-Specific Types
// ================================

/**
 * HIPAA Compliance Audit Context
 */
export interface HIPAAContext {
  isHealthcareData: boolean
  complianceLevel: 'none' | 'basic' | 'strict'
  auditRequired: boolean
  encryptionRequired: boolean
}

/**
 * Healthcare Data Classification
 */
export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  PHI = 'phi' // Protected Health Information
}

/**
 * Data Access Context for Healthcare Compliance
 */
export interface DataAccessContext {
  userId: string
  role: AdminRole
  permissions: string[]
  classification: DataClassification
  hipaaContext: HIPAAContext
  auditRequired: boolean
}

// ================================
// Transaction and Connection Types
// ================================

export interface TransactionOptions {
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE'
  timeout?: number
  retryCount?: number
}

export interface ConnectionPool {
  maxConnections: number
  minConnections: number
  acquireTimeoutMillis: number
  idleTimeoutMillis: number
}

// ================================
// Type Guards
// ================================

export function isAdminUser(obj: any): obj is AdminUser {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string' && typeof obj.role === 'string'
}

export function isValidAdminRole(role: string): role is AdminRole {
  return Object.values(AdminRole).includes(role as AdminRole)
}

export function isValidContentStatus(status: string): status is ContentStatus {
  return Object.values(ContentStatus).includes(status as ContentStatus)
}

export function isHealthcareData(data: any): boolean {
  // Basic heuristics for healthcare data detection
  if (!data || typeof data !== 'object') return false
  
  const healthcareKeywords = [
    'patient', 'medical', 'health', 'diagnosis', 'treatment',
    'medication', 'doctor', 'nurse', 'hospital', 'clinic',
    'phi', 'hipaa', 'ssn', 'dob', 'birthdate'
  ]
  
  const dataString = JSON.stringify(data).toLowerCase()
  return healthcareKeywords.some(keyword => dataString.includes(keyword))
}

// ================================
// Export Schema Types
// ================================

export type AdminUserCreate = z.infer<typeof AdminUserCreateSchema>
export type AdminUserUpdate = z.infer<typeof AdminUserUpdateSchema>
export type PageCreate = z.infer<typeof PageCreateSchema>
export type PageUpdate = z.infer<typeof PageUpdateSchema>
export type BlogPostCreate = z.infer<typeof BlogPostCreateSchema>
export type BlogPostUpdate = z.infer<typeof BlogPostUpdateSchema>
export type TeamMemberCreate = z.infer<typeof TeamMemberCreateSchema>
export type TeamMemberUpdate = z.infer<typeof TeamMemberUpdateSchema>
export type PlatformCreate = z.infer<typeof PlatformCreateSchema>
export type PlatformUpdate = z.infer<typeof PlatformUpdateSchema>
export type ServiceCreate = z.infer<typeof ServiceCreateSchema>
export type ServiceUpdate = z.infer<typeof ServiceUpdateSchema>
export type CategoryCreate = z.infer<typeof CategoryCreateSchema>
export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>
export type TestimonialCreate = z.infer<typeof TestimonialCreateSchema>
export type TestimonialUpdate = z.infer<typeof TestimonialUpdateSchema>

// ================================
// Content Versioning Types
// ================================

export enum VersionStatus {
  DRAFT = 'draft',
  CURRENT = 'current',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum AnnotationType {
  COMMENT = 'comment',
  SUGGESTION = 'suggestion',
  APPROVAL = 'approval',
  CONCERN = 'concern',
  CHANGE_REQUEST = 'change_request'
}

export enum DiffType {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified',
  MOVED = 'moved',
  UNCHANGED = 'unchanged'
}

/**
 * Content Version Table
 */
export interface ContentVersion {
  id: string
  content_type: string
  content_id: string
  version_number: number
  title: string
  content: Record<string, any>
  change_description?: string
  change_summary?: Record<string, any>
  diff_data?: Record<string, any>
  is_current: boolean
  is_published: boolean
  is_draft: boolean
  branch_name: string
  parent_version_id?: string
  merged_from_version_id?: string
  created_by: string
  created_at: string
  published_at?: string
  retention_expires_at?: string
  is_protected: boolean
}

/**
 * Version Comparison Table
 */
export interface VersionComparison {
  id: string
  content_type: string
  content_id: string
  from_version_id: string
  to_version_id: string
  diff_result: Record<string, any>
  diff_stats?: Record<string, any>
  created_by: string
  created_at: string
}

/**
 * Version Annotation Table
 */
export interface VersionAnnotation {
  id: string
  version_id: string
  content_path?: string
  annotation_type: AnnotationType
  content: string
  resolved: boolean
  parent_annotation_id?: string
  thread_depth: number
  created_by: string
  created_at: string
  updated_at: string
  resolved_by?: string
  resolved_at?: string
}

/**
 * Version Rollback Table
 */
export interface VersionRollback {
  id: string
  content_type: string
  content_id: string
  from_version_id: string
  to_version_id: string
  reason?: string
  confirmation_required: boolean
  confirmed_at?: string
  executed_by: string
  executed_at: string
  rollback_data?: Record<string, any>
}

/**
 * Version Retention Policy Table
 */
export interface VersionRetentionPolicy {
  id: string
  content_type: string
  policy_name: string
  max_versions_per_content?: number
  retention_days?: number
  keep_published_versions: boolean
  keep_protected_versions: boolean
  auto_cleanup_enabled: boolean
  cleanup_frequency: string
  last_cleanup_at?: string
  next_cleanup_at?: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Diff Item Structure
 */
export interface DiffItem {
  type: DiffType
  path: string
  oldValue?: any
  newValue?: any
  description?: string
}

/**
 * Version Diff Result
 */
export interface VersionDiff {
  summary: {
    totalChanges: number
    additions: number
    modifications: number
    deletions: number
    moved: number
  }
  changes: DiffItem[]
  metadata: {
    fromVersion: number
    toVersion: number
    contentType: string
    comparedAt: string
    comparedBy: string
  }
}

// ================================
// Version Management Schemas
// ================================

/**
 * Content Version Schemas
 */
export const ContentVersionCreateSchema = z.object({
  content_type: z.string().min(1, 'Content type is required'),
  content_id: z.string().uuid('Valid content ID required'),
  title: z.string().min(1, 'Title is required'),
  content: z.record(z.any()),
  change_description: z.string().optional(),
  branch_name: z.string().default('main'),
  parent_version_id: z.string().uuid().optional(),
  is_published: z.boolean().default(false),
  is_protected: z.boolean().default(false)
})

export const ContentVersionUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  change_description: z.string().optional(),
  is_published: z.boolean().optional(),
  is_protected: z.boolean().optional(),
  retention_expires_at: z.string().optional()
})

/**
 * Version Annotation Schemas
 */
export const VersionAnnotationCreateSchema = z.object({
  version_id: z.string().uuid('Valid version ID required'),
  content_path: z.string().optional(),
  annotation_type: z.nativeEnum(AnnotationType).default(AnnotationType.COMMENT),
  content: z.string().min(1, 'Annotation content is required'),
  parent_annotation_id: z.string().uuid().optional()
})

export const VersionAnnotationUpdateSchema = z.object({
  content: z.string().min(1).optional(),
  resolved: z.boolean().optional()
})

/**
 * Version Rollback Schemas
 */
export const VersionRollbackCreateSchema = z.object({
  content_type: z.string().min(1, 'Content type is required'),
  content_id: z.string().uuid('Valid content ID required'),
  to_version_id: z.string().uuid('Valid target version ID required'),
  reason: z.string().optional(),
  confirmation_required: z.boolean().default(true)
})

/**
 * Version Comparison Schemas
 */
export const VersionComparisonCreateSchema = z.object({
  content_type: z.string().min(1, 'Content type is required'),
  content_id: z.string().uuid('Valid content ID required'),
  from_version_id: z.string().uuid('Valid from version ID required'),
  to_version_id: z.string().uuid('Valid to version ID required')
})

/**
 * Retention Policy Schemas
 */
export const VersionRetentionPolicyCreateSchema = z.object({
  content_type: z.string().min(1, 'Content type is required'),
  policy_name: z.string().min(1, 'Policy name is required'),
  max_versions_per_content: z.number().int().min(1).optional(),
  retention_days: z.number().int().min(1).optional(),
  keep_published_versions: z.boolean().default(true),
  keep_protected_versions: z.boolean().default(true),
  auto_cleanup_enabled: z.boolean().default(true),
  cleanup_frequency: z.enum(['hourly', 'daily', 'weekly']).default('daily')
})

export const VersionRetentionPolicyUpdateSchema = VersionRetentionPolicyCreateSchema.partial()

// ================================
// Version Management Request Types
// ================================

export interface CreateVersionRequest {
  contentType: string
  contentId: string
  title: string
  content: Record<string, any>
  changeDescription?: string
  branchName?: string
  isPublished?: boolean
  isProtected?: boolean
}

export interface CompareVersionsRequest {
  contentType: string
  contentId: string
  fromVersionId: string
  toVersionId: string
}

export interface RollbackVersionRequest {
  contentType: string
  contentId: string
  toVersionId: string
  reason?: string
  confirmed?: boolean
}

export interface VersionListOptions extends QueryOptions {
  contentType?: string
  contentId?: string
  branchName?: string
  isPublished?: boolean
  isDraft?: boolean
  includeProtected?: boolean
}

// ================================
// Workflow Management Types - Story 1.4 Task 8
// ================================

export enum WorkflowState {
  DRAFT = 'draft',
  REVIEW = 'review', 
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum WorkflowAction {
  SUBMIT_FOR_REVIEW = 'submit_for_review',
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CHANGES = 'request_changes',
  PUBLISH = 'publish',
  ARCHIVE = 'archive',
  FORCE_APPROVE = 'force_approve'
}

export enum WorkflowRole {
  AUTHOR = 'author',
  REVIEWER = 'reviewer',
  APPROVER = 'approver',
  PUBLISHER = 'publisher',
  ADMIN = 'admin'
}

/**
 * Workflow Instances Table
 */
export interface WorkflowInstance {
  id: string
  workflow_definition_id: string
  content_type: string
  content_id: string
  current_state: WorkflowState
  previous_state?: WorkflowState
  assigned_to?: string
  assigned_to_role?: WorkflowRole
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  metadata: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Workflow Transition Logs Table
 */
export interface WorkflowTransitionLog {
  id: string
  workflow_instance_id: string
  from_state: WorkflowState
  to_state: WorkflowState
  action: WorkflowAction
  performed_by: string
  performed_by_role: WorkflowRole
  comment?: string
  metadata?: Record<string, any>
  timestamp: string
  duration_ms?: number
}

/**
 * Workflow Definitions Table
 */
export interface WorkflowDefinition {
  id: string
  name: string
  content_type: string
  definition: Record<string, any> // JSON workflow definition
  is_active: boolean
  version: string
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Workflow Notifications Table
 */
export interface WorkflowNotification {
  id: string
  workflow_instance_id: string
  recipient_id: string
  recipient_type: 'user' | 'role' | 'group'
  notification_type: 'email' | 'in_app' | 'slack'
  subject: string
  content: string
  is_read: boolean
  sent_at?: string
  read_at?: string
  created_at: string
}

// ================================
// Workflow Schemas
// ================================

/**
 * Workflow Instance Schemas
 */
export const WorkflowInstanceCreateSchema = z.object({
  workflow_definition_id: z.string().uuid('Valid workflow definition ID required'),
  content_type: z.string().min(1, 'Content type is required'),
  content_id: z.string().uuid('Valid content ID required'),
  current_state: z.nativeEnum(WorkflowState).default(WorkflowState.DRAFT),
  assigned_to: z.string().uuid().optional(),
  assigned_to_role: z.nativeEnum(WorkflowRole).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().optional(),
  metadata: z.record(z.any()).default({})
})

export const WorkflowInstanceUpdateSchema = z.object({
  current_state: z.nativeEnum(WorkflowState).optional(),
  previous_state: z.nativeEnum(WorkflowState).optional(),
  assigned_to: z.string().uuid().optional(),
  assigned_to_role: z.nativeEnum(WorkflowRole).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

/**
 * Workflow Transition Log Schemas
 */
export const WorkflowTransitionLogCreateSchema = z.object({
  workflow_instance_id: z.string().uuid('Valid workflow instance ID required'),
  from_state: z.nativeEnum(WorkflowState),
  to_state: z.nativeEnum(WorkflowState),
  action: z.nativeEnum(WorkflowAction),
  performed_by: z.string().uuid('Valid user ID required'),
  performed_by_role: z.nativeEnum(WorkflowRole),
  comment: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  duration_ms: z.number().int().min(0).optional()
})

/**
 * Workflow Definition Schemas
 */
export const WorkflowDefinitionCreateSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  content_type: z.string().min(1, 'Content type is required'),
  definition: z.record(z.any()),
  is_active: z.boolean().default(true),
  version: z.string().default('1.0.0')
})

export const WorkflowDefinitionUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  definition: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
  version: z.string().optional()
})

/**
 * Workflow Notification Schemas
 */
export const WorkflowNotificationCreateSchema = z.object({
  workflow_instance_id: z.string().uuid('Valid workflow instance ID required'),
  recipient_id: z.string().min(1, 'Recipient ID is required'),
  recipient_type: z.enum(['user', 'role', 'group']).default('user'),
  notification_type: z.enum(['email', 'in_app', 'slack']).default('in_app'),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Content is required')
})

export const WorkflowNotificationUpdateSchema = z.object({
  is_read: z.boolean().optional(),
  read_at: z.string().optional()
})

// ================================
// Export Version Schema Types
// ================================

export type ContentVersionCreate = z.infer<typeof ContentVersionCreateSchema>
export type ContentVersionUpdate = z.infer<typeof ContentVersionUpdateSchema>
export type VersionAnnotationCreate = z.infer<typeof VersionAnnotationCreateSchema>
export type VersionAnnotationUpdate = z.infer<typeof VersionAnnotationUpdateSchema>
export type VersionRollbackCreate = z.infer<typeof VersionRollbackCreateSchema>
export type VersionComparisonCreate = z.infer<typeof VersionComparisonCreateSchema>
export type VersionRetentionPolicyCreate = z.infer<typeof VersionRetentionPolicyCreateSchema>
export type VersionRetentionPolicyUpdate = z.infer<typeof VersionRetentionPolicyUpdateSchema>

// ================================
// Export Workflow Schema Types
// ================================

export type WorkflowInstanceCreate = z.infer<typeof WorkflowInstanceCreateSchema>
export type WorkflowInstanceUpdate = z.infer<typeof WorkflowInstanceUpdateSchema>
export type WorkflowTransitionLogCreate = z.infer<typeof WorkflowTransitionLogCreateSchema>
export type WorkflowDefinitionCreate = z.infer<typeof WorkflowDefinitionCreateSchema>
export type WorkflowDefinitionUpdate = z.infer<typeof WorkflowDefinitionUpdateSchema>
export type WorkflowNotificationCreate = z.infer<typeof WorkflowNotificationCreateSchema>
export type WorkflowNotificationUpdate = z.infer<typeof WorkflowNotificationUpdateSchema>