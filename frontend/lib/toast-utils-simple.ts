/**
 * Simple Toast Messages - No Hook Dependencies
 * 
 * This file provides toast message templates without using React hooks.
 * Components should import useToast directly and use these message templates.
 */

export type CRUDOperation = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'save' 
  | 'publish' 
  | 'unpublish'

export type EntityType = 
  | 'post' 
  | 'page' 
  | 'user' 
  | 'media'
  | 'clinical trial'
  | 'publication'
  | 'quality study'
  | 'platform'
  | 'setting'

export const getSuccessMessage = (operation: CRUDOperation, entity: EntityType, name?: string) => {
  const entityName = name ? `"${name}"` : `${entity}`
  const messages = {
    create: `${entityName} created successfully`,
    save: `${entityName} saved successfully`,
    update: `${entityName} updated successfully`,
    delete: `${entityName} deleted successfully`,
    publish: `${entityName} published successfully`,
    unpublish: `${entityName} unpublished successfully`,
    read: `${entityName} loaded successfully`
  }
  
  return {
    title: "Success",
    description: messages[operation] || `${operation} completed successfully`,
    duration: 4000
  }
}

export const getErrorMessage = (operation: CRUDOperation, entity: EntityType, error?: string) => {
  return {
    title: `Failed to ${operation} ${entity}`,
    description: error || "Please try again or contact support if the problem persists",
    duration: 8000
  }
}

export const getAuthMessages = {
  loginSuccess: {
    title: "Authentication",
    description: "Successfully logged in",
    duration: 4000
  },
  loginError: {
    title: "Authentication Error", 
    description: "Login failed. Please check your credentials",
    duration: 8000
  },
  unauthorized: {
    title: "Authentication Error",
    description: "You are not authorized to perform this action",
    duration: 8000
  }
}