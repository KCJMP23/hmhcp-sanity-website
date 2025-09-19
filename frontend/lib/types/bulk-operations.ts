/**
 * Bulk Operations Type Definitions
 * Comprehensive types for bulk content operations
 */

export type ContentType = 'pages' | 'posts' | 'services' | 'platforms' | 'team-members' | 'testimonials'

export type BulkActionType = 
  | 'delete' 
  | 'publish' 
  | 'unpublish' 
  | 'archive' 
  | 'duplicate' 
  | 'move' 
  | 'bulk-tag' 
  | 'seo-update' 
  | 'import' 
  | 'export'

export interface BulkOperation {
  action: BulkActionType
  type: ContentType
  selectedIds: string[]
  options?: Record<string, any>
}

export interface BulkOperationResult {
  success: boolean
  successCount: number
  errorCount: number
  processedIds: string[]
  failedIds: string[]
  errors: Array<{ id: string; error: string }>
  warnings: string[]
  metadata?: Record<string, any>
}

export interface ImportOperation extends Omit<BulkOperation, 'action' | 'selectedIds'> {
  action: 'import'
  selectedIds: []
  options: {
    records: ImportRecord[]
    skipDuplicates: boolean
    updateExisting: boolean
    validateOnly: boolean
    defaultStatus: 'draft' | 'published' | 'archived'
  }
}

export interface SEOUpdateOperation extends Omit<BulkOperation, 'action'> {
  action: 'seo-update'
  options: {
    seoTitle?: string
    seoDescription?: string
    metaKeywords?: string[]
    ogImage?: string
    canonicalUrl?: string
    noIndex?: boolean
  }
}

export interface BulkTagOperation extends Omit<BulkOperation, 'action'> {
  action: 'bulk-tag'
  options: {
    operation: 'add' | 'remove' | 'replace'
    tags: string[]
  }
}

export interface CategoryMoveOperation extends Omit<BulkOperation, 'action'> {
  action: 'move'
  options: {
    targetCategory: string
    preserveSlug: boolean
  }
}

export interface ImportRecord {
  id?: string
  title: string
  slug?: string
  content?: string | object
  status?: 'draft' | 'published' | 'archived'
  category?: string
  tags?: string[]
  author?: string
  publishedAt?: string
  seoTitle?: string
  seoDescription?: string
  [key: string]: any
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'xml' | 'xlsx'
  scope: 'selected' | 'filtered' | 'all'
  fields: string[]
  filters: {
    status?: string[]
    dateRange?: {
      from?: string
      to?: string
    }
    category?: string
    author?: string
    tags?: string[]
  }
  includeMetadata: boolean
  includeContent: boolean
  flattenStructure: boolean
}

export interface ValidationError {
  row: number
  field: string
  message: string
  severity: 'error' | 'warning'
  value?: any
}

export interface ImportPreview {
  records: ImportRecord[]
  validRecords: ImportRecord[]
  errors: ValidationError[]
  warnings: ValidationError[]
  duplicates: ImportRecord[]
  statistics: {
    total: number
    valid: number
    errors: number
    warnings: number
    duplicates: number
  }
}

export interface BulkSelectionState {
  selectedIds: Set<string>
  selectedCount: number
  isAllSelected: boolean
  isIndeterminate: boolean
  hasSelection: boolean
}

export interface BulkSelectionActions {
  selectItem: (id: string) => void
  deselectItem: (id: string) => void
  toggleItem: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  toggleAll: (ids: string[]) => void
  isItemSelected: (id: string) => boolean
  selectRange: (startId: string, endId: string, allIds: string[]) => void
  invertSelection: (allIds: string[]) => void
}

export interface BulkSelectionConfig {
  maxSelection?: number
  persistSelection?: boolean
  storageKey?: string
  onSelectionChange?: (state: BulkSelectionState) => void
  onMaxSelectionReached?: (maxSelection: number) => void
}

// Content field definitions for each content type
export interface ContentFieldDefinition {
  value: string
  label: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
}

export interface ContentSchema {
  required: string[]
  optional: string[]
  unique: string[]
  fields: ContentFieldDefinition[]
}

export const CONTENT_SCHEMAS: Record<ContentType, ContentSchema> = {
  pages: {
    required: ['title', 'slug'],
    optional: ['content', 'status', 'seoTitle', 'seoDescription', 'publishedAt'],
    unique: ['slug'],
    fields: [
      { value: 'id', label: 'ID', required: true },
      { value: 'title', label: 'Title', required: true },
      { value: 'slug', label: 'Slug', required: true },
      { value: 'content', label: 'Content', type: 'object' },
      { value: 'status', label: 'Status' },
      { value: 'seoTitle', label: 'SEO Title' },
      { value: 'seoDescription', label: 'SEO Description' },
      { value: 'publishedAt', label: 'Published Date', type: 'date' },
      { value: 'createdAt', label: 'Created Date', type: 'date' },
      { value: 'updatedAt', label: 'Updated Date', type: 'date' },
      { value: 'author', label: 'Author' }
    ]
  },
  posts: {
    required: ['title'],
    optional: ['slug', 'content', 'status', 'category', 'tags', 'author', 'publishedAt', 'seoTitle', 'seoDescription'],
    unique: ['slug'],
    fields: [
      { value: 'id', label: 'ID', required: true },
      { value: 'title', label: 'Title', required: true },
      { value: 'slug', label: 'Slug' },
      { value: 'content', label: 'Content', type: 'object' },
      { value: 'excerpt', label: 'Excerpt' },
      { value: 'status', label: 'Status' },
      { value: 'category', label: 'Category' },
      { value: 'tags', label: 'Tags', type: 'array' },
      { value: 'author', label: 'Author' },
      { value: 'publishedAt', label: 'Published Date', type: 'date' },
      { value: 'createdAt', label: 'Created Date', type: 'date' },
      { value: 'updatedAt', label: 'Updated Date', type: 'date' },
      { value: 'seoTitle', label: 'SEO Title' },
      { value: 'seoDescription', label: 'SEO Description' }
    ]
  },
  services: {
    required: ['title', 'description'],
    optional: ['slug', 'status', 'category', 'tags', 'publishedAt'],
    unique: ['slug'],
    fields: [
      { value: 'id', label: 'ID', required: true },
      { value: 'title', label: 'Title', required: true },
      { value: 'description', label: 'Description', required: true },
      { value: 'slug', label: 'Slug' },
      { value: 'status', label: 'Status' },
      { value: 'category', label: 'Category' },
      { value: 'features', label: 'Features', type: 'array' },
      { value: 'pricing', label: 'Pricing', type: 'object' },
      { value: 'publishedAt', label: 'Published Date', type: 'date' },
      { value: 'createdAt', label: 'Created Date', type: 'date' },
      { value: 'updatedAt', label: 'Updated Date', type: 'date' }
    ]
  },
  platforms: {
    required: ['title', 'description'],
    optional: ['slug', 'status', 'category', 'features', 'publishedAt'],
    unique: ['slug'],
    fields: [
      { value: 'id', label: 'ID', required: true },
      { value: 'title', label: 'Title', required: true },
      { value: 'description', label: 'Description', required: true },
      { value: 'slug', label: 'Slug' },
      { value: 'status', label: 'Status' },
      { value: 'category', label: 'Category' },
      { value: 'features', label: 'Features', type: 'array' },
      { value: 'technologies', label: 'Technologies', type: 'array' },
      { value: 'publishedAt', label: 'Published Date', type: 'date' },
      { value: 'createdAt', label: 'Created Date', type: 'date' },
      { value: 'updatedAt', label: 'Updated Date', type: 'date' }
    ]
  },
  'team-members': {
    required: ['name', 'role'],
    optional: ['bio', 'email', 'phone', 'department', 'status'],
    unique: ['email'],
    fields: [
      { value: 'id', label: 'ID', required: true },
      { value: 'name', label: 'Name', required: true },
      { value: 'role', label: 'Role', required: true },
      { value: 'department', label: 'Department' },
      { value: 'email', label: 'Email' },
      { value: 'phone', label: 'Phone' },
      { value: 'bio', label: 'Bio' },
      { value: 'skills', label: 'Skills', type: 'array' },
      { value: 'status', label: 'Status' },
      { value: 'joinedAt', label: 'Joined Date', type: 'date' },
      { value: 'createdAt', label: 'Created Date', type: 'date' },
      { value: 'updatedAt', label: 'Updated Date', type: 'date' }
    ]
  },
  testimonials: {
    required: ['content', 'author'],
    optional: ['authorRole', 'authorCompany', 'rating', 'status', 'publishedAt'],
    unique: [],
    fields: [
      { value: 'id', label: 'ID', required: true },
      { value: 'content', label: 'Content', required: true },
      { value: 'author', label: 'Author', required: true },
      { value: 'authorRole', label: 'Author Role' },
      { value: 'authorCompany', label: 'Author Company' },
      { value: 'rating', label: 'Rating', type: 'number' },
      { value: 'status', label: 'Status' },
      { value: 'publishedAt', label: 'Published Date', type: 'date' },
      { value: 'createdAt', label: 'Created Date', type: 'date' },
      { value: 'updatedAt', label: 'Updated Date', type: 'date' }
    ]
  }
}

// Export format configurations
export interface ExportFormatConfig {
  value: string
  label: string
  description: string
  maxSize: number
  extensions: string[]
  mimeType: string
}

export const EXPORT_FORMATS: Record<string, ExportFormatConfig> = {
  csv: {
    value: 'csv',
    label: 'CSV',
    description: 'Comma-separated values - Excel compatible',
    maxSize: 1000000,
    extensions: ['.csv'],
    mimeType: 'text/csv'
  },
  xlsx: {
    value: 'xlsx',
    label: 'Excel (XLSX)',
    description: 'Microsoft Excel format',
    maxSize: 100000,
    extensions: ['.xlsx'],
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  json: {
    value: 'json',
    label: 'JSON',
    description: 'JavaScript Object Notation',
    maxSize: 500000,
    extensions: ['.json'],
    mimeType: 'application/json'
  },
  xml: {
    value: 'xml',
    label: 'XML',
    description: 'Extensible Markup Language',
    maxSize: 100000,
    extensions: ['.xml'],
    mimeType: 'application/xml'
  }
}