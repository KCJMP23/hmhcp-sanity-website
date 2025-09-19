/**
 * Upload utility functions for team member profile photos
 */

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  fileName?: string
  error?: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadOptions {
  bucket?: string
  folder?: string
  onProgress?: (progress: UploadProgress) => void
  maxSize?: number
}

/**
 * Upload a file to Supabase Storage via our API endpoint
 */
export async function uploadTeamAvatar(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const {
      bucket = 'team-avatars',
      folder = 'profile-photos',
      onProgress,
      maxSize = 10 * 1024 * 1024 // 10MB default
    } = options

    // Validate file size
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File too large. Maximum size is ${formatFileSize(maxSize)}`
      }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'
      }
    }

    // Create form data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', bucket)
    formData.append('folder', folder)

    // Create XMLHttpRequest for progress tracking
    return new Promise<UploadResult>((resolve) => {
      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          }
          onProgress(progress)
        }
      })

      // Handle response
      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText)
          
          if (xhr.status === 200 || xhr.status === 201) {
            resolve({
              success: true,
              url: response.url,
              path: response.path,
              fileName: response.fileName
            })
          } else {
            resolve({
              success: false,
              error: response.error || 'Upload failed'
            })
          }
        } catch (error) {
          resolve({
            success: false,
            error: 'Failed to parse upload response'
          })
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload'
        })
      })

      xhr.addEventListener('timeout', () => {
        resolve({
          success: false,
          error: 'Upload timeout'
        })
      })

      // Configure and send request
      xhr.open('POST', '/api/admin/team/upload')
      xhr.timeout = 60000 // 60 second timeout
      xhr.send(formData)
    })

  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Delete a file from Supabase Storage via our API endpoint
 */
export async function deleteTeamAvatar(
  path: string,
  bucket: string = 'team-avatars'
): Promise<UploadResult> {
  try {
    const response = await fetch('/api/admin/team/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path, bucket })
    })

    const result = await response.json()

    if (response.ok) {
      return {
        success: true,
        path: result.path
      }
    } else {
      return {
        success: false,
        error: result.error || 'Delete failed'
      }
    }

  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

/**
 * Get upload configuration from the API
 */
export async function getUploadConfig() {
  try {
    const response = await fetch('/api/admin/team/upload')
    if (response.ok) {
      return await response.json()
    }
    return null
  } catch (error) {
    console.error('Failed to get upload config:', error)
    return null
  }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(file.type)) {
    return 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'
  }

  if (file.size > maxSize) {
    return `File too large. Maximum size is ${formatFileSize(maxSize)}`
  }

  return null
}

/**
 * Create a preview URL for an image file
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to create preview'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Resize an image file to specified dimensions
 */
export function resizeImage(
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      // Calculate new dimensions
      let { width, height } = img
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to resize image'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}