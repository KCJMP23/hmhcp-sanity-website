'use client'

import { useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
// Simple interface for now - replace with proper type when available
interface MediaFile {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  width?: number
  height?: number
  title?: string
  alt_text?: string
  description?: string
  url?: string
  publicUrl?: string
  created_at?: string
}

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  result?: MediaFile
}

interface MediaUploaderProps {
  onUploadComplete?: (files: MediaFile[]) => void
  onUploadError?: (error: Error) => void
  maxFiles?: number
  maxFileSize?: number
  acceptedFileTypes?: string[]
  acceptedTypes?: string[]
  autoUpload?: boolean
  folderId?: string | null
  allowMultiple?: boolean
}

export function MediaUploader({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
  ],
  acceptedTypes,
  autoUpload = true,
  folderId,
  allowMultiple
}: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File): string | null => {
    if (!acceptedFileTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`
    }
    if (file.size > maxFileSize) {
      return `File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`
    }
    return null
  }

  const addFiles = (newFiles: File[]) => {
    const currentCount = files.filter(f => f.status !== 'error').length
    const availableSlots = maxFiles - currentCount
    const filesToAdd = newFiles.slice(0, availableSlots)

    const uploadFiles: UploadFile[] = filesToAdd.map(file => {
      const error = validateFile(file)
      return {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        error: error || undefined
      }
    })

    setFiles(prev => [...prev, ...uploadFiles])

    if (autoUpload) {
      uploadFiles
        .filter(f => f.status === 'pending')
        .forEach(f => uploadFile(f.id))
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [files.length, maxFiles])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const uploadFile = async (fileId: string) => {
    const uploadFile = files.find(f => f.id === fileId)
    if (!uploadFile) return

    const abortController = new AbortController()
    abortControllersRef.current.set(fileId, abortController)

    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, status: 'uploading' } : f
    ))

    try {
      const formData = new FormData()
      formData.append('file', uploadFile.file)

      const response = await fetch('/api/cms/media', {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      const result = await response.json()

      setFiles(prev => prev.map(f =>
        f.id === fileId
          ? { ...f, status: 'success', progress: 100, result }
          : f
      ))

      // Check if all files are uploaded
      const allUploaded = files
        .filter(f => f.id !== fileId && f.status !== 'error')
        .every(f => f.status === 'success')

      if (allUploaded) {
        const successfulFiles = files
          .filter(f => f.status === 'success' && f.result)
          .map(f => f.result!)
        
        if (result) successfulFiles.push(result)
        
        if (successfulFiles.length > 0) {
          onUploadComplete?.(successfulFiles)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setFiles(prev => prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'error', error: error.message }
            : f
        ))
        onUploadError?.(error)
      }
    } finally {
      abortControllersRef.current.delete(fileId)
    }
  }

  const cancelUpload = (fileId: string) => {
    const controller = abortControllersRef.current.get(fileId)
    if (controller) {
      controller.abort()
      abortControllersRef.current.delete(fileId)
    }
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const retryUpload = (fileId: string) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, status: 'pending', error: undefined } : f
    ))
    uploadFile(fileId)
  }

  const uploadAll = () => {
    files
      .filter(f => f.status === 'pending')
      .forEach(f => uploadFile(f.id))
  }

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'))
  }

  const hasFiles = files.length > 0
  const hasPendingFiles = files.some(f => f.status === 'pending')
  const hasUploadingFiles = files.some(f => f.status === 'uploading')
  const hasSuccessFiles = files.some(f => f.status === 'success')

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        className={cn(
          'relative border-2 border-dashed  p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileSelect}
          className="sr-only"
        />

        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">
          Drop files here or click to upload
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Support for {acceptedFileTypes.length} file types up to {maxFileSize / (1024 * 1024)}MB
        </p>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={files.filter(f => f.status !== 'error').length >= maxFiles}
        >
          Select Files
        </Button>
      </div>

      {/* File list */}
      {hasFiles && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Upload Queue ({files.length}/{maxFiles})
            </h4>
            <div className="flex items-center gap-2">
              {hasPendingFiles && !autoUpload && (
                <Button
                  size="sm"
                  onClick={uploadAll}
                  disabled={hasUploadingFiles}
                >
                  Upload All
                </Button>
              )}
              {hasSuccessFiles && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearCompleted}
                >
                  Clear Completed
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900"
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {file.status === 'pending' && (
                    <Loader2 className="w-5 h-5 text-gray-400" />
                  )}
                  {file.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                  {file.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / 1024).toFixed(1)} KB
                  </p>
                  {file.error && (
                    <p className="text-xs text-red-500 mt-1">{file.error}</p>
                  )}
                </div>

                {/* Progress */}
                {file.status === 'uploading' && (
                  <div className="w-24">
                    <Progress value={file.progress} className="h-2" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex-shrink-0">
                  {file.status === 'error' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => retryUpload(file.id)}
                    >
                      Retry
                    </Button>
                  )}
                  {(file.status === 'pending' || file.status === 'uploading') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => cancelUpload(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Accepted file types: JPEG, PNG, WebP, GIF, PDF. Maximum file size: {maxFileSize / (1024 * 1024)}MB
        </AlertDescription>
      </Alert>
    </div>
  )
}