"use client"

/**
 * Toast utility functions for common admin CRUD operations
 * Simplified version using basic toast functions
 */

// CRUD Operation Types
export type CRUDOperation = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'save' 
  | 'publish' 
  | 'unpublish'
  | 'archive'
  | 'restore'
  | 'import'
  | 'export'

// Common entity types in admin
export type EntityType = 
  | 'post' 
  | 'page' 
  | 'user' 
  | 'media' 
  | 'comment' 
  | 'menu' 
  | 'widget'
  | 'clinical trial'
  | 'publication'
  | 'quality study'
  | 'platform'
  | 'email template'
  | 'email campaign'
  | 'backup'
  | 'setting'

// Basic toast functions (will be properly implemented based on the toast system used)
const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
  if (typeof window !== 'undefined') {
    console.log(`[${type.toUpperCase()}] ${message}`)
  }
}

// Success Toast Helpers
export const toastSuccess = {
  crud: (operation: CRUDOperation, entity: EntityType, name?: string) => {
    const entityName = name ? `"${name}"` : `${entity}`
    const messages = {
      create: `${entityName} created successfully`,
      save: `${entityName} saved successfully`,
      update: `${entityName} updated successfully`,
      delete: `${entityName} deleted successfully`,
      publish: `${entityName} published successfully`,
      unpublish: `${entityName} unpublished successfully`,
      archive: `${entityName} archived successfully`,
      restore: `${entityName} restored successfully`,
      import: `${entityName} imported successfully`,
      export: `${entityName} exported successfully`,
      read: `${entityName} loaded successfully`
    }
    
    showToast('success', messages[operation] || `${operation} completed successfully`)
  },

  batch: (operation: CRUDOperation, count: number, entity: EntityType) => {
    showToast('success', `Successfully ${operation}d ${count} ${entity}${count !== 1 ? 's' : ''}`)
  },

  upload: (filename?: string) => {
    showToast('success', filename ? `"${filename}" uploaded successfully` : "File uploaded successfully")
  },

  auth: (action: 'login' | 'logout' | 'register' | 'password-reset') => {
    const messages = {
      login: "Successfully logged in",
      logout: "Successfully logged out", 
      register: "Account created successfully",
      'password-reset': "Password reset email sent"
    }
    
    showToast('success', messages[action])
  }
}

// Error Toast Helpers
export const toastError = {
  crud: (operation: CRUDOperation, entity: EntityType, error?: string) => {
    showToast('error', `Failed to ${operation} ${entity}: ${error || "Please try again"}`)
  },

  validation: (field?: string) => {
    showToast('error', field 
      ? `Please check the "${field}" field and try again`
      : "Please check your input and try again")
  },

  network: (action?: string) => {
    showToast('error', action 
      ? `Failed to ${action}. Please check your connection`
      : "Network error. Please check your connection")
  },

  auth: (action: 'login' | 'logout' | 'register' | 'unauthorized' | 'expired') => {
    const messages = {
      login: "Login failed. Please check your credentials",
      logout: "Logout failed. Please try again",
      register: "Registration failed. Please try again",
      unauthorized: "You are not authorized to perform this action",
      expired: "Your session has expired. Please log in again"
    }
    
    showToast('error', messages[action])
  },

  upload: (reason?: string) => {
    showToast('error', reason || "File upload failed. Please try again")
  },

  server: (message?: string) => {
    showToast('error', message || "An unexpected error occurred. Please try again later")
  }
}

// Warning Toast Helpers
export const toastWarning = {
  unsavedChanges: () => {
    showToast('warning', "You have unsaved changes that will be lost")
  },

  quota: (type: 'storage' | 'upload' | 'requests', limit?: string) => {
    const messages = {
      storage: `Storage quota ${limit ? `(${limit})` : ''} exceeded`,
      upload: `Upload limit ${limit ? `(${limit})` : ''} reached`,
      requests: `Request limit ${limit ? `(${limit})` : ''} reached`
    }
    
    showToast('warning', messages[type])
  },

  deprecation: (feature: string) => {
    showToast('warning', `${feature} is deprecated and will be removed in a future update`)
  }
}

// Info Toast Helpers
export const toastInfo = {
  loading: (action?: string) => {
    showToast('info', action ? `${action} in progress...` : "Processing your request...")
  },

  feature: (message: string) => {
    showToast('info', message)
  },

  update: (version?: string) => {
    showToast('info', version 
      ? `Version ${version} is available` 
      : "A new update is available")
  }
}

// Convenience wrapper for common admin operations
export const adminToast = {
  // Content Management
  postSaved: (title?: string) => toastSuccess.crud('save', 'post', title),
  postDeleted: (title?: string) => toastSuccess.crud('delete', 'post', title),
  postPublished: (title?: string) => toastSuccess.crud('publish', 'post', title),
  
  // User Management
  userCreated: (name?: string) => toastSuccess.crud('create', 'user', name),
  userUpdated: (name?: string) => toastSuccess.crud('update', 'user', name),
  userDeleted: (name?: string) => toastSuccess.crud('delete', 'user', name),
  
  // Media Management
  mediaUploaded: (filename?: string) => toastSuccess.upload(filename),
  mediaDeleted: (filename?: string) => toastSuccess.crud('delete', 'media', filename),
  
  // Healthcare-specific
  trialCreated: (name?: string) => toastSuccess.crud('create', 'clinical trial', name),
  trialUpdated: (name?: string) => toastSuccess.crud('update', 'clinical trial', name),
  publicationCreated: (title?: string) => toastSuccess.crud('create', 'publication', title),
  qualityStudyCreated: (name?: string) => toastSuccess.crud('create', 'quality study', name),
  
  // Settings
  settingsSaved: () => toastSuccess.crud('save', 'setting'),
  backupCreated: () => toastSuccess.crud('create', 'backup'),
  
  // Common errors
  unauthorized: () => toastError.auth('unauthorized'),
  networkError: () => toastError.network(),
  validationError: (field?: string) => toastError.validation(field),
  serverError: (message?: string) => toastError.server(message)
}

export default {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  admin: adminToast
}