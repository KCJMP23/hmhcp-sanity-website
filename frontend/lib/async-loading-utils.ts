"use client"

import { useAdminToast } from "@/hooks/use-admin-toast"
import { useLoading, LoadingOperation, type LoadingState } from "@/hooks/use-loading"
import { EntityType, CRUDOperation } from "@/lib/toast-utils"

/**
 * Utility class for managing async operations with loading states and toast notifications
 */
export class AsyncLoadingManager {
  private loadingManager: ReturnType<typeof useLoading>
  private toastManager: ReturnType<typeof useAdminToast>

  constructor(
    loadingManager: ReturnType<typeof useLoading>,
    toastManager: ReturnType<typeof useAdminToast>
  ) {
    this.loadingManager = loadingManager
    this.toastManager = toastManager
  }

  /**
   * Check if a loading operation is also a valid CRUD operation
   */
  private isCRUDOperation(operation: LoadingOperation): boolean {
    const validCrudOperations: LoadingOperation[] = [
      'create', 'update', 'delete', 'save', 'import', 'export'
    ]
    return validCrudOperations.includes(operation)
  }

  /**
   * Execute an async operation with loading state and toast notifications
   */
  async executeOperation<T>(config: {
    operation: LoadingOperation
    entity?: EntityType
    entityName?: string
    loadingMessage?: string
    loadingDescription?: string
    successMessage?: string
    errorMessage?: string
    showProgress?: boolean
    asyncFn: () => Promise<T>
    onSuccess?: (result: T) => void
    onError?: (error: Error) => void
  }): Promise<T> {
    const loadingId = this.loadingManager.startLoading({
      operation: config.operation,
      entity: config.entity,
      message: config.loadingMessage || `${config.operation}ing ${config.entity || 'item'}...`,
      description: config.loadingDescription,
      progress: config.showProgress ? 0 : undefined
    })

    try {
      // Show loading toast if enabled
      if (config.loadingMessage) {
        this.toastManager.api.loading(config.loadingMessage)
      }

      const result = await config.asyncFn()

      // Update to completion
      if (config.showProgress) {
        this.loadingManager.updateLoading(loadingId, { progress: 100 })
        await new Promise(resolve => setTimeout(resolve, 500)) // Brief delay to show completion
      }

      this.loadingManager.stopLoading(loadingId)

      // Show success toast and notification
      if (config.successMessage) {
        this.toastManager.utils.customSuccess(config.successMessage)
      } else if (config.entity && config.operation) {
        this.toastManager.content.saved(config.entity, config.entityName)
      }

      config.onSuccess?.(result)
      return result
    } catch (error) {
      this.loadingManager.stopLoading(loadingId)
      
      const errorObj = error instanceof Error ? error : new Error(String(error))
      
      // Show error toast
      if (config.errorMessage) {
        this.toastManager.utils.customError("Operation Failed", config.errorMessage)
      } else if (config.entity && config.operation && this.isCRUDOperation(config.operation)) {
        this.toastManager.form.error(config.entity, config.operation as CRUDOperation, errorObj.message)
      } else {
        this.toastManager.api.serverError(errorObj.message)
      }

      config.onError?.(errorObj)
      throw errorObj
    }
  }

  /**
   * Execute a CRUD operation with standardized loading and notifications
   */
  async executeCRUD<T>(config: {
    operation: 'create' | 'update' | 'delete'
    entity: EntityType
    entityName?: string
    asyncFn: () => Promise<T>
    onSuccess?: (result: T) => void
    onError?: (error: Error) => void
  }): Promise<T> {
    const messages = {
      create: {
        loading: `Creating ${config.entity}...`,
        success: `${config.entityName || config.entity} created successfully`,
        error: `Failed to create ${config.entity}`
      },
      update: {
        loading: `Updating ${config.entity}...`,
        success: `${config.entityName || config.entity} updated successfully`,
        error: `Failed to update ${config.entity}`
      },
      delete: {
        loading: `Deleting ${config.entity}...`,
        success: `${config.entityName || config.entity} deleted successfully`,
        error: `Failed to delete ${config.entity}`
      }
    }

    const message = messages[config.operation]

    return this.executeOperation({
      operation: config.operation,
      entity: config.entity,
      entityName: config.entityName,
      loadingMessage: message.loading,
      successMessage: message.success,
      errorMessage: message.error,
      asyncFn: config.asyncFn,
      onSuccess: config.onSuccess,
      onError: config.onError
    })
  }

  /**
   * Execute file upload with progress tracking
   */
  async executeUpload<T>(config: {
    files: File[]
    uploadFn: (file: File, onProgress?: (progress: number) => void) => Promise<T>
    onFileComplete?: (file: File, result: T) => void
    onFileError?: (file: File, error: Error) => void
    onAllComplete?: (results: T[]) => void
    onAllError?: (errors: Error[]) => void
  }): Promise<T[]> {
    const results: T[] = []
    const errors: Error[] = []

    // Create loading operations for each file
    const fileOperations = config.files.map(file => ({
      file,
      loadingId: this.loadingManager.startLoading({
        operation: 'upload',
        entity: file.name,
        message: `Uploading ${file.name}...`,
        progress: 0
      })
    }))

    try {
      // Upload files sequentially (can be modified for parallel uploads)
      for (const { file, loadingId } of fileOperations) {
        try {
          const result = await config.uploadFn(file, (progress) => {
            this.loadingManager.updateLoading(loadingId, { progress })
          })

          // Complete this file upload
          this.loadingManager.updateLoading(loadingId, { 
            progress: 100, 
            message: `${file.name} uploaded successfully` 
          })
          
          setTimeout(() => this.loadingManager.stopLoading(loadingId), 1000)
          
          results.push(result)
          config.onFileComplete?.(file, result)
          this.toastManager.file.uploadSuccess(file.name)
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error))
          
          this.loadingManager.updateLoading(loadingId, {
            message: `Failed to upload ${file.name}: ${errorObj.message}`
          })
          
          setTimeout(() => this.loadingManager.stopLoading(loadingId), 2000)
          
          errors.push(errorObj)
          config.onFileError?.(file, errorObj)
          this.toastManager.file.uploadError(`${file.name}: ${errorObj.message}`)
        }
      }

      // Handle completion
      if (errors.length > 0 && results.length === 0) {
        // All failed
        config.onAllError?.(errors)
        throw new Error(`All uploads failed`)
      } else if (errors.length > 0) {
        // Partial success
        this.toastManager.utils.customWarning(
          "Upload Partially Complete",
          `${results.length} files uploaded successfully, ${errors.length} failed`
        )
      } else {
        // All succeeded
        config.onAllComplete?.(results)
        this.toastManager.utils.customSuccess(
          "Upload Complete",
          `Successfully uploaded ${results.length} file${results.length !== 1 ? 's' : ''}`
        )
      }

      return results
    } catch (error) {
      // Clean up any remaining loading states
      fileOperations.forEach(({ loadingId }) => {
        this.loadingManager.stopLoading(loadingId)
      })
      
      throw error
    }
  }

  /**
   * Execute batch operations with progress tracking
   */
  async executeBatch<T, R>(config: {
    items: T[]
    operation: LoadingOperation
    batchFn: (item: T, index: number) => Promise<R>
    batchSize?: number
    onItemComplete?: (item: T, result: R, index: number) => void
    onItemError?: (item: T, error: Error, index: number) => void
    onProgress?: (completed: number, total: number) => void
    onComplete?: (results: R[]) => void
  }): Promise<R[]> {
    const batchSize = config.batchSize || 5
    const results: R[] = []
    const errors: Error[] = []

    const loadingId = this.loadingManager.startLoading({
      operation: config.operation,
      message: `Processing ${config.items.length} items...`,
      progress: 0
    })

    try {
      // Process items in batches
      for (let i = 0; i < config.items.length; i += batchSize) {
        const batch = config.items.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (item, batchIndex) => {
          const globalIndex = i + batchIndex
          try {
            const result = await config.batchFn(item, globalIndex)
            results[globalIndex] = result
            config.onItemComplete?.(item, result, globalIndex)
            return result
          } catch (error) {
            const errorObj = error instanceof Error ? error : new Error(String(error))
            errors.push(errorObj)
            config.onItemError?.(item, errorObj, globalIndex)
            throw errorObj
          }
        })

        // Wait for batch to complete
        await Promise.allSettled(batchPromises)

        // Update progress
        const completed = Math.min(i + batchSize, config.items.length)
        const progress = (completed / config.items.length) * 100
        
        this.loadingManager.updateLoading(loadingId, {
          progress,
          message: `Processed ${completed} of ${config.items.length} items...`
        })

        config.onProgress?.(completed, config.items.length)
      }

      this.loadingManager.stopLoading(loadingId)

      // Show final results
      if (errors.length === 0) {
        this.toastManager.utils.customSuccess(
          "Batch Operation Complete",
          `Successfully processed all ${config.items.length} items`
        )
      } else {
        this.toastManager.utils.customWarning(
          "Batch Operation Completed with Errors",
          `${results.length} items processed successfully, ${errors.length} failed`
        )
      }

      config.onComplete?.(results)
      return results
    } catch (error) {
      this.loadingManager.stopLoading(loadingId)
      throw error
    }
  }
}

/**
 * Hook that provides an AsyncLoadingManager instance
 */
export function useAsyncLoading() {
  const loadingManager = useLoading()
  const toastManager = useAdminToast()

  return new AsyncLoadingManager(loadingManager, toastManager)
}

/**
 * Higher-order function that wraps an async function with loading state
 */
export function withLoading<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  config: {
    operation: LoadingOperation
    entity?: EntityType
    loadingMessage?: string
    successMessage?: string
    errorMessage?: string
  }
) {
  return function useWrappedAsync() {
    const asyncManager = useAsyncLoading()

    return async (...args: T): Promise<R> => {
      return asyncManager.executeOperation({
        ...config,
        asyncFn: () => asyncFn(...args)
      })
    }
  }
}

/**
 * Utility for creating loading states with automatic cleanup
 */
export function createLoadingTracker(loadingManager: ReturnType<typeof useLoading>) {
  const activeOperations = new Map<string, string>()

  return {
    start: (key: string, config: Parameters<typeof loadingManager.startLoading>[0]) => {
      // Stop existing operation with same key if exists
      const existingId = activeOperations.get(key)
      if (existingId) {
        loadingManager.stopLoading(existingId)
      }

      const id = loadingManager.startLoading(config)
      activeOperations.set(key, id)
      return id
    },

    update: (key: string, updates: Parameters<typeof loadingManager.updateLoading>[1]) => {
      const id = activeOperations.get(key)
      if (id) {
        loadingManager.updateLoading(id, updates)
      }
    },

    stop: (key: string) => {
      const id = activeOperations.get(key)
      if (id) {
        loadingManager.stopLoading(id)
        activeOperations.delete(key)
      }
    },

    stopAll: () => {
      activeOperations.forEach(id => loadingManager.stopLoading(id))
      activeOperations.clear()
    }
  }
}