'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, AlertCircle, CheckCircle, Loader2, Cloud } from 'lucide-react'
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
}

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string | null
  result?: MediaFile
}

interface EnhancedMediaUploaderProps {
  onUploadComplete?: (files: MediaFile[]) => void
  onUploadError?: (error: Error) => void
  maxFiles?: number
  maxFileSize?: number
  acceptedFileTypes?: string[]
  autoUpload?: boolean
  folderId?: string | null
  allowMultiple?: boolean
}

export function EnhancedMediaUploader({
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
  autoUpload = true,
  folderId,
  allowMultiple = true
}: EnhancedMediaUploaderProps) {
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
    const filesToAdd = allowMultiple ? newFiles.slice(0, availableSlots) : newFiles.slice(0, 1)

    const uploadFiles: UploadFile[] = filesToAdd.map(file => {
      const error = validateFile(file)
      return {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        error
      }
    })

    setFiles(prev => allowMultiple ? [...prev, ...uploadFiles] : uploadFiles)

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
  }, [files.length, maxFiles, allowMultiple])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
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

      if (result) {
        onUploadComplete?.([result])
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

  const hasFiles = files.length > 0
  const hasPendingFiles = files.some(f => f.status === 'pending')
  const hasUploadingFiles = files.some(f => f.status === 'uploading')

  return (
    <div className="space-y-6">
      {/* Enhanced Apple-Style Dropzone */}
      <motion.div
        className={cn(
          'relative  border-2 border-dashed p-12 text-center transition-all duration-500 ease-in-out backdrop-blur-sm',
          'font-display', // Apple SF Pro Display
          isDragging
            ? 'border-blue-400 bg-gradient-to-br from-blue-50/50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/20 scale-[1.02] shadow-lg'
            : 'border-gray-300/60 dark:border-gray-600/60 bg-white/30 dark:bg-gray-900/30 hover:border-blue-300/80 dark:hover:border-blue-500/80 hover:bg-blue-50/30 dark:hover:bg-blue-900/20'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={allowMultiple}
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileSelect}
          className="sr-only"
        />

        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="space-y-4"
            >
              <Cloud className="w-16 h-16 mx-auto text-blue-500 animate-bounce" />
              <h3 className="text-xl font-light text-blue-600 dark:text-blue-400" style={{ letterSpacing: '-0.005em' }}>
                Drop your files here
              </h3>
            </motion.div>
          ) : (
            <motion.div
              key="normal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="space-y-6"
            >
              <Upload className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" />
              <div className="space-y-3">
                <h3 className="text-2xl font-light text-gray-700 dark:text-gray-200" style={{ letterSpacing: '-0.005em' }}>
                  Upload Media Files
                </h3>
                <p className="text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto" style={{ letterSpacing: '-0.01em' }}>
                  Drag and drop your files here, or click to browse. Support for {acceptedFileTypes.length} file types up to {maxFileSize / (1024 * 1024)}MB.
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={files.filter(f => f.status !== 'error').length >= maxFiles}
                className="bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white px-8 py-3 font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{ letterSpacing: '-0.005em' }}
              >
                Choose Files
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Enhanced File List */}
      <AnimatePresence>
        {hasFiles && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 font-display" style={{ letterSpacing: '-0.005em' }}>
                Upload Queue ({files.length}/{maxFiles})
              </h4>
              <div className="flex items-center gap-3">
                {hasPendingFiles && !autoUpload && (
                  <Button
                    size="sm"
                    onClick={() => files.filter(f => f.status === 'pending').forEach(f => uploadFile(f.id))}
                    disabled={hasUploadingFiles}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                  >
                    Upload All
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {file.status === 'pending' && (
                      <Loader2 className="w-5 h-5 text-gray-400" />
                    )}
                    {file.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                    {file.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate font-text" style={{ letterSpacing: '-0.01em' }}>
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        Retry
                      </Button>
                    )}
                    {(file.status === 'pending' || file.status === 'uploading') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => cancelUpload(file.id)}
                        className="text-red-500 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20 backdrop-blur-sm">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200 font-text" style={{ letterSpacing: '-0.01em' }}>
          Supported formats: {acceptedFileTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}. 
          Maximum file size: {maxFileSize / (1024 * 1024)}MB. 
          {allowMultiple ? `Up to ${maxFiles} files allowed.` : 'Single file upload.'}
        </AlertDescription>
      </Alert>
    </div>
  )
}