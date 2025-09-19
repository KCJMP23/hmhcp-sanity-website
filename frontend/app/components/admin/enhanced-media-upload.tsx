'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  Upload, 
  X, 
  FileImage, 
  FileVideo, 
  FileAudio, 
  FileText,
  File,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Folder,
  Tag,
  Maximize2,
  Minimize2
} from 'lucide-react'

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'duplicate'
  error?: string
  result?: any
  preview?: string
  compressed?: boolean
  optimized?: boolean
  folder?: string
  tags?: string[]
}

interface UploadOptions {
  maxFileSize: number
  allowedTypes: string[]
  enableCompression: boolean
  enableWebPConversion: boolean
  quality: number
  maxWidth?: number
  maxHeight?: number
  folder?: string
  tags?: string[]
  enableDuplicateDetection: boolean
  enableChunkedUpload: boolean
  chunkSize: number
}

interface EnhancedMediaUploadProps {
  onUploadComplete?: (files: any[]) => void
  onUploadProgress?: (files: UploadFile[]) => void
  options?: Partial<UploadOptions>
  className?: string
  maxFiles?: number
  disabled?: boolean
}

const defaultOptions: UploadOptions = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/mpeg',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  enableCompression: true,
  enableWebPConversion: true,
  quality: 0.85,
  maxWidth: 2048,
  maxHeight: 2048,
  enableDuplicateDetection: true,
  enableChunkedUpload: true,
  chunkSize: 1024 * 1024 // 1MB chunks
}

export default function EnhancedMediaUpload({
  onUploadComplete,
  onUploadProgress,
  options: userOptions = {},
  className = '',
  maxFiles = 10,
  disabled = false
}: EnhancedMediaUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('batch')
  const [currentFolder, setCurrentFolder] = useState('')
  const [currentTags, setCurrentTags] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [existingFiles, setExistingFiles] = useState<string[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  
  const options: UploadOptions = { ...defaultOptions, ...userOptions }

  // Load existing files for duplicate detection
  useEffect(() => {
    if (options.enableDuplicateDetection) {
      loadExistingFiles()
    }
  }, [])

  const loadExistingFiles = async () => {
    try {
      const response = await fetch('/api/admin/media?limit=1000')
      if (response.ok) {
        const data = await response.json()
        const fileNames = data.items?.map((item: any) => item.original_filename) || []
        setExistingFiles(fileNames)
      }
    } catch (error) {
      console.error('Failed to load existing files:', error)
    }
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dropRef.current?.contains(e.relatedTarget as Node)) {
      setDragActive(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [disabled])

  // File handling and validation
  const handleFiles = useCallback((files: File[]) => {
    if (files.length === 0) return

    // Check max files limit
    if (uploadFiles.length + files.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed. You're trying to add ${files.length} more files.`,
        variant: 'destructive'
      })
      return
    }

    const validatedFiles: UploadFile[] = []

    for (const file of files) {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Validate file type
      if (!options.allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} - ${file.type} is not supported`,
          variant: 'destructive'
        })
        continue
      }

      // Validate file size
      if (file.size > options.maxFileSize) {
        toast({
          title: 'File too large',
          description: `${file.name} - Maximum size is ${formatFileSize(options.maxFileSize)}`,
          variant: 'destructive'
        })
        continue
      }

      // Check for duplicates
      let status: UploadFile['status'] = 'pending'
      if (options.enableDuplicateDetection && existingFiles.includes(file.name)) {
        status = 'duplicate'
      }

      const uploadFile: UploadFile = {
        id,
        file,
        progress: 0,
        status,
        folder: currentFolder,
        tags: [...currentTags]
      }

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setUploadFiles(prev => prev.map(f => 
            f.id === id ? { ...f, preview: e.target?.result as string } : f
          ))
        }
        reader.readAsDataURL(file)
      }

      validatedFiles.push(uploadFile)
    }

    setUploadFiles(prev => [...prev, ...validatedFiles])
  }, [uploadFiles.length, maxFiles, currentFolder, currentTags, existingFiles, options, toast])

  // File input handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
    e.target.value = '' // Reset input
  }, [handleFiles])

  // Remove file from upload queue
  const removeFile = useCallback((id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  // Client-side image compression/optimization
  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/') || !options.enableCompression) {
      return file
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        const maxWidth = options.maxWidth || 2048
        const maxHeight = options.maxHeight || 2048
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new (File as any)([blob], file.name, {
                type: options.enableWebPConversion ? 'image/webp' : file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          options.enableWebPConversion ? 'image/webp' : file.type,
          options.quality
        )
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Chunked upload for large files
  const uploadFileInChunks = async (uploadFile: UploadFile): Promise<any> => {
    const { file } = uploadFile
    
    if (file.size <= options.chunkSize || !options.enableChunkedUpload) {
      // Regular upload
      const processedFile = await compressImage(file)
      
      const formData = new FormData()
      formData.append('files', processedFile)
      
      if (uploadFile.folder) {
        formData.append('folder', uploadFile.folder)
      }
      
      if (uploadFile.tags && uploadFile.tags.length > 0) {
        formData.append('tags', JSON.stringify(uploadFile.tags))
      }
      
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`)
      
      return await response.json()
    } else {
      // Chunked upload
      const chunks = Math.ceil(file.size / options.chunkSize)
      let uploadedChunks = 0
      
      // Initialize chunked upload
      const initResponse = await fetch('/api/admin/media/chunked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type,
          chunks,
          folder: uploadFile.folder,
          tags: uploadFile.tags
        })
      })
      
      if (!initResponse.ok) throw new Error('Failed to initialize chunked upload')
      
      const { uploadId } = await initResponse.json()
      
      // Upload chunks
      for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
        const start = chunkIndex * options.chunkSize
        const end = Math.min(start + options.chunkSize, file.size)
        const chunk = file.slice(start, end)
        
        const chunkFormData = new FormData()
        chunkFormData.append('chunk', chunk)
        chunkFormData.append('uploadId', uploadId)
        chunkFormData.append('chunkIndex', chunkIndex.toString())
        
        const chunkResponse = await fetch('/api/admin/media/chunked', {
          method: 'PUT',
          body: chunkFormData
        })
        
        if (!chunkResponse.ok) throw new Error(`Chunk ${chunkIndex} upload failed`)
        
        uploadedChunks++
        const progress = (uploadedChunks / chunks) * 90 // Leave 10% for finalization
        
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress } : f
        ))
      }
      
      // Finalize upload
      const finalizeResponse = await fetch('/api/admin/media/chunked', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId })
      })
      
      if (!finalizeResponse.ok) throw new Error('Failed to finalize upload')
      
      return await finalizeResponse.json()
    }
  }

  // Upload single file
  const uploadSingleFile = async (uploadFile: UploadFile) => {
    try {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 10 } : f
      ))

      // Process and compress if needed
      if (options.enableCompression && uploadFile.file.type.startsWith('image/')) {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'processing', progress: 30 } : f
        ))
      }

      const result = await uploadFileInChunks(uploadFile)

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'completed', 
          progress: 100, 
          result,
          compressed: options.enableCompression && uploadFile.file.type.startsWith('image/'),
          optimized: options.enableWebPConversion && uploadFile.file.type.startsWith('image/')
        } : f
      ))

      return result
    } catch (error) {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : f
      ))
      throw error
    }
  }

  // Upload all files
  const uploadAllFiles = async () => {
    if (isUploading) return

    const filesToUpload = uploadFiles.filter(f => 
      f.status === 'pending' || f.status === 'duplicate'
    )
    
    if (filesToUpload.length === 0) return

    setIsUploading(true)

    try {
      const results: any[] = []
      const errors: string[] = []

      if (uploadMode === 'batch') {
        // Batch upload - upload all files in parallel
        const uploadPromises = filesToUpload.map(uploadSingleFile)
        const settledResults = await Promise.allSettled(uploadPromises)
        
        settledResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value)
          } else {
            errors.push(`${filesToUpload[index].file.name}: ${result.reason}`)
          }
        })
      } else {
        // Sequential upload
        for (const uploadFile of filesToUpload) {
          try {
            const result = await uploadSingleFile(uploadFile)
            results.push(result)
          } catch (error) {
            errors.push(`${uploadFile.file.name}: ${error instanceof Error ? error.message : 'Upload failed'}`)
          }
        }
      }

      // Show results
      if (results.length > 0) {
        toast({
          title: 'Upload Complete',
          description: `${results.length} file(s) uploaded successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`
        })
        
        onUploadComplete?.(results)
      }

      if (errors.length > 0 && results.length === 0) {
        toast({
          title: 'Upload Failed',
          description: 'All uploads failed. Check the files and try again.',
          variant: 'destructive'
        })
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Error',
        description: 'An unexpected error occurred during upload.',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
      
      // Clear completed files after delay
      setTimeout(() => {
        setUploadFiles(prev => prev.filter(f => 
          f.status !== 'completed' && f.status !== 'error'
        ))
      }, 3000)
    }
  }

  // Retry failed upload
  const retryFile = (id: string) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'pending', error: undefined, progress: 0 } : f
    ))
  }

  // Clear all files
  const clearAllFiles = () => {
    setUploadFiles([])
  }

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="h-5 w-5" />
    if (mimeType.startsWith('video/')) return <FileVideo className="h-5 w-5" />
    if (mimeType.startsWith('audio/')) return <FileAudio className="h-5 w-5" />
    if (mimeType.includes('text') || mimeType.includes('document')) return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get status color
  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'duplicate': return 'text-yellow-600'
      case 'uploading': 
      case 'processing': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  // Get status icon
  const getStatusIcon = (file: UploadFile) => {
    switch (file.status) {
      case 'completed': 
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error': 
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'duplicate': 
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'uploading':
      case 'processing': 
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      default: 
        return getFileIcon(file.file.type)
    }
  }

  // Effect for progress updates
  useEffect(() => {
    onUploadProgress?.(uploadFiles)
  }, [uploadFiles, onUploadProgress])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <motion.div
        ref={dropRef}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : disabled 
              ? 'border-gray-200 bg-gray-50' 
              : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        whileHover={disabled ? {} : { scale: 1.01 }}
        whileTap={disabled ? {} : { scale: 0.99 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={options.allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
            dragActive ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Upload className={`h-8 w-8 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          
          <div>
            <h3 className={`text-lg font-semibold font-display ${
              disabled ? 'text-gray-400' : 'text-gray-900'
            }`}>
              Drop files here or click to browse
            </h3>
            <p className={`text-sm mt-2 font-text ${
              disabled ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Support for {options.allowedTypes.length} file types • Max {formatFileSize(options.maxFileSize)} per file
            </p>
          </div>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            variant="outline"
            className="bg-white hover:bg-gray-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Choose Files
          </Button>
        </div>

        {/* Drag overlay */}
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center"
            >
              <div className="text-blue-600 font-medium font-text">
                Release to upload files
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Advanced Options */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-gray-600"
        >
          {showAdvanced ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </Button>
        
        {uploadFiles.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-text">
              {uploadFiles.length} file{uploadFiles.length === 1 ? '' : 's'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFiles}
              className="text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Advanced Options Panel */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-gray-50">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-text">Folder (Optional)</Label>
                    <div className="relative">
                      <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="e.g., blog-images, documents"
                        value={currentFolder}
                        onChange={(e) => setCurrentFolder(e.target.value)}
                        className="pl-10 font-text"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-text">Tags (Optional)</Label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="e.g., hero, banner, medical"
                        value={currentTags.join(', ')}
                        onChange={(e) => setCurrentTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                        className="pl-10 font-text"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-text">
                      <input
                        type="radio"
                        name="uploadMode"
                        value="batch"
                        checked={uploadMode === 'batch'}
                        onChange={(e) => setUploadMode(e.target.value as 'batch' | 'single')}
                      />
                      Batch Upload (Parallel)
                    </label>
                    <label className="flex items-center gap-2 text-sm font-text">
                      <input
                        type="radio"
                        name="uploadMode"
                        value="single"
                        checked={uploadMode === 'single'}
                        onChange={(e) => setUploadMode(e.target.value as 'batch' | 'single')}
                      />
                      Sequential Upload
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Queue */}
      <AnimatePresence>
        {uploadFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold font-display">Upload Queue</h3>
                  <Button
                    onClick={uploadAllFiles}
                    disabled={isUploading || uploadFiles.every(f => f.status === 'completed')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Uploading...' : 'Upload All'}
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {uploadFiles.map((uploadFile) => (
                    <motion.div
                      key={uploadFile.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`flex items-center gap-4 p-3 rounded-lg border ${
                        uploadFile.status === 'completed' ? 'bg-green-50 border-green-200' :
                        uploadFile.status === 'error' ? 'bg-red-50 border-red-200' :
                        uploadFile.status === 'duplicate' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {/* Preview/Icon */}
                      <div className="flex-shrink-0">
                        {uploadFile.preview ? (
                          <img 
                            src={uploadFile.preview} 
                            alt={uploadFile.file.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getFileIcon(uploadFile.file.type)}
                          </div>
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate font-text">
                            {uploadFile.file.name}
                          </p>
                          {getStatusIcon(uploadFile)}
                          {uploadFile.compressed && (
                            <Badge variant="outline" className="text-xs">Compressed</Badge>
                          )}
                          {uploadFile.optimized && (
                            <Badge variant="outline" className="text-xs">WebP</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-text">
                            {formatFileSize(uploadFile.file.size)} • {uploadFile.file.type}
                          </span>
                          <span className={`font-medium font-text ${getStatusColor(uploadFile.status)}`}>
                            {uploadFile.status === 'duplicate' ? 'File exists' :
                             uploadFile.status === 'processing' ? 'Processing...' :
                             uploadFile.status === 'uploading' ? `${uploadFile.progress}%` :
                             uploadFile.status.charAt(0).toUpperCase() + uploadFile.status.slice(1)}
                          </span>
                        </div>
                        
                        {(uploadFile.status === 'uploading' || uploadFile.status === 'processing') && (
                          <Progress value={uploadFile.progress} className="mt-2 h-1" />
                        )}
                        
                        {uploadFile.error && (
                          <p className="text-xs text-red-600 mt-1 font-text">{uploadFile.error}</p>
                        )}
                        
                        {uploadFile.folder && (
                          <div className="flex items-center gap-1 mt-1">
                            <Folder className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 font-text">{uploadFile.folder}</span>
                          </div>
                        )}
                        
                        {uploadFile.tags && uploadFile.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Tag className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 font-text">
                              {uploadFile.tags.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-1">
                        {uploadFile.status === 'error' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => retryFile(uploadFile.id)}
                            className="h-8 w-8 p-0"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(uploadFile.id)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}