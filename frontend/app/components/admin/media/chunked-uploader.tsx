'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  FileUp,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error'
  error?: string
  chunks: number
  uploadedChunks: number
  abortController?: AbortController
}

interface MediaData {
  id: string
  filename: string
  cdn_url: string
  mime_type: string
  file_size: number
  [key: string]: unknown
}

interface ChunkedUploaderProps {
  onUploadComplete?: (media: MediaData) => void
  maxFileSize?: number // in MB
  chunkSize?: number // in MB
}

export function ChunkedUploader({ 
  onUploadComplete,
  maxFileSize = 500, // 500MB default
  chunkSize = 5 // 5MB chunks
}: ChunkedUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const CHUNK_SIZE = chunkSize * 1024 * 1024
  const MAX_FILE_SIZE = maxFileSize * 1024 * 1024

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadFile[] = []
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} exceeds maximum size of ${maxFileSize}MB`)
        continue
      }

      const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
      
      newFiles.push({
        id: uuidv4(),
        file,
        progress: 0,
        status: 'pending',
        chunks: totalChunks,
        uploadedChunks: 0
      })
    }

    setFiles(prev => [...prev, ...newFiles])
  }

  const uploadChunk = async (
    file: File,
    chunkNumber: number,
    totalChunks: number,
    fileId: string,
    signal: AbortSignal
  ): Promise<any> => {
    const start = (chunkNumber - 1) * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)

    const reader = new FileReader()
    const chunkData = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(chunk)
    })

    const response = await fetch('/api/admin/media/upload-chunk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chunkNumber,
        totalChunks,
        fileName: file.name,
        fileId,
        chunkData
      }),
      signal
    })

    if (!response.ok) {
      throw new Error(`Failed to upload chunk ${chunkNumber}`)
    }

    return response.json()
  }

  const startUpload = async (uploadFile: UploadFile) => {
    const abortController = new AbortController()
    
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { ...f, status: 'uploading', abortController }
        : f
    ))

    try {
      for (let i = 1; i <= uploadFile.chunks; i++) {
        // Check if upload was paused or cancelled
        const currentFile = files.find(f => f.id === uploadFile.id)
        if (currentFile?.status === 'paused') {
          break
        }

        const result = await uploadChunk(
          uploadFile.file,
          i,
          uploadFile.chunks,
          uploadFile.id,
          abortController.signal
        )

        const progress = (i / uploadFile.chunks) * 100
        
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, progress, uploadedChunks: i }
            : f
        ))

        // If this was the last chunk, mark as completed
        if (i === uploadFile.chunks && result && (result as any).completed) {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'completed', progress: 100 }
              : f
          ))

          if (onUploadComplete && (result as any).media) {
            onUploadComplete((result as any).media)
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Upload was cancelled
        return
      }

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ))
    }
  }

  const pauseUpload = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file?.abortController) {
      file.abortController.abort()
    }
    
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'paused' }
        : f
    ))
  }

  const resumeUpload = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file) {
      startUpload(file)
    }
  }

  const retryUpload = (fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'pending', progress: 0, uploadedChunks: 0, error: undefined }
        : f
    ))
    
    const file = files.find(f => f.id === fileId)
    if (file) {
      startUpload(file)
    }
  }

  const removeFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    
    // Cancel upload if in progress
    if (file?.abortController) {
      file.abortController.abort()
    }

    // Clean up chunks on server
    if (file?.status === 'uploading' || file?.status === 'paused') {
      await fetch(`/api/admin/media/upload-chunk?fileId=${fileId}`, {
        method: 'DELETE'
      })
    }

    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <Upload className="h-4 w-4" />
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'paused':
        return <Pause className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Large File Upload</CardTitle>
          <CardDescription>
            Upload files up to {maxFileSize}MB using chunked upload for reliability.
            Perfect for high-resolution medical images and video content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Drop large files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports files up to {maxFileSize}MB • Automatic resume on failure
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Select Large Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Queue</CardTitle>
            <CardDescription>
              {files.filter(f => f.status === 'uploading').length} uploading,{' '}
              {files.filter(f => f.status === 'pending').length} pending,{' '}
              {files.filter(f => f.status === 'completed').length} completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map(file => (
              <div key={file.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(file.status)}
                      <span className="font-medium truncate">
                        {file.file.name}
                      </span>
                      <Badge variant="outline">
                        {formatFileSize(file.file.size)}
                      </Badge>
                    </div>
                    {file.status === 'uploading' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Chunk {file.uploadedChunks} of {file.chunks}
                      </p>
                    )}
                    {file.error && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertDescription>{file.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {file.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => startUpload(file)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {file.status === 'uploading' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pauseUpload(file.id)}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {file.status === 'paused' && (
                      <Button
                        size="sm"
                        onClick={() => resumeUpload(file.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {file.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryUpload(file.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {(file.status === 'uploading' || file.status === 'paused') && (
                  <Progress value={file.progress} className="h-2" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}