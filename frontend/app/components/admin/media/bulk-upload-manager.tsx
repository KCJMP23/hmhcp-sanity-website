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
  Settings
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'paused'
  error?: string
  optimized?: boolean
}

interface BulkUploadManagerProps {
  onUploadComplete?: (files: Array<{ id: string; url: string }>) => void
  maxConcurrent?: number
  autoOptimize?: boolean
}

export function BulkUploadManager({ 
  onUploadComplete,
  maxConcurrent = 3,
  autoOptimize = true
}: BulkUploadManagerProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [concurrentUploads, setConcurrentUploads] = useState(maxConcurrent)
  const [showSettings, setShowSettings] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadQueueRef = useRef<Set<string>>(new Set())

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadFile[] = []
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        progress: 0,
        status: 'pending'
      })
    }

    setFiles(prev => [...prev, ...newFiles])
  }

  const uploadFile = async (uploadFile: UploadFile) => {
    if (uploadQueueRef.current.size >= concurrentUploads) {
      // Wait for a slot to open
      await new Promise(resolve => {
        const checkQueue = setInterval(() => {
          if (uploadQueueRef.current.size < concurrentUploads) {
            clearInterval(checkQueue)
            resolve(undefined)
          }
        }, 100)
      })
    }

    if (isPaused) return

    uploadQueueRef.current.add(uploadFile.id)
    
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { ...f, status: 'uploading' }
        : f
    ))

    try {
      const formData = new FormData()
      formData.append('file', uploadFile.file)
      formData.append('autoOptimize', String(autoOptimize))

      const xhr = new XMLHttpRequest()
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress }
              : f
          ))
        }
      }

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'completed', progress: 100, optimized: response.optimized }
                : f
            ))
            resolve(response)
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Upload failed'))
        
        xhr.open('POST', '/api/admin/media/upload')
        xhr.send(formData)
      })

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ))
    } finally {
      uploadQueueRef.current.delete(uploadFile.id)
    }
  }

  const startBulkUpload = async () => {
    setIsUploading(true)
    setIsPaused(false)

    const pendingFiles = files.filter(f => f.status === 'pending')
    
    // Process files with concurrency limit
    const uploadPromises = pendingFiles.map(file => uploadFile(file))
    
    await Promise.allSettled(uploadPromises)
    
    setIsUploading(false)
    
    // Notify completion
    const completed = files.filter(f => f.status === 'completed')
    if (onUploadComplete && completed.length > 0) {
      onUploadComplete(completed.map(f => ({ 
        id: f.id, 
        url: `/api/cms/media/${f.id}` 
      })))
    }
  }

  const pauseUpload = () => {
    setIsPaused(true)
  }

  const resumeUpload = () => {
    setIsPaused(false)
    startBulkUpload()
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'))
  }

  const retryFailed = () => {
    setFiles(prev => prev.map(f => 
      f.status === 'error' 
        ? { ...f, status: 'pending', progress: 0, error: undefined }
        : f
    ))
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

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <Upload className="h-4 w-4" />
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'paused':
        return <Pause className="h-4 w-4" />
    }
  }

  const stats = {
    total: files.length,
    pending: files.filter(f => f.status === 'pending').length,
    uploading: files.filter(f => f.status === 'uploading').length,
    completed: files.filter(f => f.status === 'completed').length,
    failed: files.filter(f => f.status === 'error').length
  }

  const overallProgress = files.length > 0
    ? files.reduce((acc, f) => acc + f.progress, 0) / files.length
    : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bulk Upload Manager</CardTitle>
              <CardDescription>
                Upload multiple files with concurrent processing and optimization
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
              Drop files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Upload multiple files with automatic optimization
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Select Files
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
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upload Progress</CardTitle>
                <div className="flex gap-2">
                  {stats.failed > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={retryFailed}
                    >
                      Retry Failed
                    </Button>
                  )}
                  {stats.completed > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearCompleted}
                    >
                      Clear Completed
                    </Button>
                  )}
                  {!isUploading && stats.pending > 0 && (
                    <Button
                      size="sm"
                      onClick={startBulkUpload}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Upload
                    </Button>
                  )}
                  {isUploading && !isPaused && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={pauseUpload}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  {isUploading && isPaused && (
                    <Button
                      size="sm"
                      onClick={resumeUpload}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 text-sm">
                <Badge variant="outline">Total: {stats.total}</Badge>
                <Badge variant="outline">Pending: {stats.pending}</Badge>
                <Badge variant="secondary">Uploading: {stats.uploading}</Badge>
                <Badge variant="default">Completed: {stats.completed}</Badge>
                {stats.failed > 0 && (
                  <Badge variant="destructive">Failed: {stats.failed}</Badge>
                )}
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {files.map(file => (
                  <div key={file.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    {getStatusIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                        {file.optimized && ' • Optimized'}
                      </p>
                    </div>
                    {file.status === 'uploading' && (
                      <div className="w-24">
                        <Progress value={file.progress} className="h-1" />
                      </div>
                    )}
                    {file.error && (
                      <span className="text-xs text-red-600">{file.error}</span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Settings</DialogTitle>
            <DialogDescription>
              Configure bulk upload behavior
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Concurrent Uploads: {concurrentUploads}</Label>
              <Slider
                value={[concurrentUploads]}
                onValueChange={(value) => setConcurrentUploads(value[0])}
                min={1}
                max={10}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of files to upload simultaneously
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}