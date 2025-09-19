'use client'

import { useState, useRef } from 'react'
import { Upload, AlertTriangle, CheckCircle, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

interface MediaFile {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  width?: number
  height?: number
}

interface MediaReplaceModalProps {
  file: MediaFile
  isOpen: boolean
  onClose: () => void
  onReplacementComplete: () => void
}

interface ReplacementProgress {
  stage: 'upload' | 'processing' | 'updating' | 'complete'
  progress: number
  message: string
}

export function MediaReplaceModal({ 
  file, 
  isOpen, 
  onClose, 
  onReplacementComplete 
}: MediaReplaceModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [replacing, setReplacing] = useState(false)
  const [progress, setProgress] = useState<ReplacementProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileSelection = (newFile: File) => {
    setError(null)

    // Validate file type compatibility
    if (!isCompatibleType(file.mime_type, newFile.type)) {
      setError(`File type mismatch. Original file is ${file.mime_type}, but you're trying to upload ${newFile.type}. For safety, please use the same file type.`)
      return
    }

    // Validate file size (warn if significantly different)
    const sizeRatio = newFile.size / file.size_bytes
    if (sizeRatio > 10 || sizeRatio < 0.1) {
      setError(`File size differs significantly from original (${formatFileSize(file.size_bytes)} vs ${formatFileSize(newFile.size)}). Please verify this is the correct replacement file.`)
      return
    }

    setSelectedFile(newFile)
  }

  const isCompatibleType = (originalType: string, newType: string) => {
    // Allow exact matches
    if (originalType === newType) return true

    // Allow common image format conversions
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (imageTypes.includes(originalType) && imageTypes.includes(newType)) {
      return true
    }

    // Allow document format conversions
    const docTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (docTypes.includes(originalType) && docTypes.includes(newType)) {
      return true
    }

    return false
  }

  const performReplacement = async () => {
    if (!selectedFile) return

    setReplacing(true)
    setError(null)

    try {
      // Stage 1: Upload new file
      setProgress({
        stage: 'upload',
        progress: 0,
        message: 'Uploading replacement file...'
      })

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('replaceId', file.id)

      const token = localStorage.getItem('cms_token')
      const uploadResponse = await fetch('/api/cms/media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || 'Upload failed')
      }

      setProgress({
        stage: 'upload',
        progress: 100,
        message: 'File uploaded successfully'
      })

      // Stage 2: Process replacement
      setProgress({
        stage: 'processing',
        progress: 0,
        message: 'Processing replacement...'
      })

      const uploadResult = await uploadResponse.json()
      const newFileId = uploadResult.data.id

      // Stage 3: Update references
      setProgress({
        stage: 'updating',
        progress: 0,
        message: 'Updating content references...'
      })

      const replaceResponse = await fetch(`/api/cms/media/${file.id}/replace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newFileId: newFileId
        })
      })

      if (!replaceResponse.ok) {
        const error = await replaceResponse.json()
        throw new Error(error.error || 'Failed to update references')
      }

      setProgress({
        stage: 'updating',
        progress: 100,
        message: 'References updated successfully'
      })

      // Stage 4: Complete
      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Replacement completed successfully'
      })

      toast({
        title: 'Success',
        description: 'Media file replaced successfully. All references have been updated.'
      })

      setTimeout(() => {
        onReplacementComplete()
        onClose()
      }, 2000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setProgress(null)
    } finally {
      setReplacing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const resetModal = () => {
    setSelectedFile(null)
    setError(null)
    setProgress(null)
    setReplacing(false)
  }

  const handleClose = () => {
    if (!replacing) {
      resetModal()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Replace Media File
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current file info */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4">
            <h4 className="font-medium mb-2">Current File</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Name:</strong> {file.original_name}</p>
              <p><strong>Type:</strong> {file.mime_type}</p>
              <p><strong>Size:</strong> {formatFileSize(file.size_bytes)}</p>
              {file.width && file.height && (
                <p><strong>Dimensions:</strong> {file.width}×{file.height}</p>
              )}
            </div>
          </div>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This will replace the current file and update all references 
              in your content. This action cannot be undone. Make sure the replacement file is correct 
              before proceeding.
            </AlertDescription>
          </Alert>

          {/* File upload area */}
          {!progress && (
            <div
              className={`border-2 border-dashed  p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    ✓ Selected: {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedFile.type} • {formatFileSize(selectedFile.size)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Drop your replacement file here
                  </p>
                  <p className="text-xs text-gray-500">
                    or click to browse
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInput}
                accept={file.mime_type.startsWith('image/') ? 'image/*' : '*/*'}
              />
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {progress.stage === 'complete' ? (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                ) : (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent animate-spin" />
                )}
                <span className="font-medium">{progress.message}</span>
              </div>
              
              <Progress value={progress.progress} className="w-full" />
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Stage: {progress.stage.charAt(0).toUpperCase() + progress.stage.slice(1)}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={replacing}
            >
              Cancel
            </Button>
            <Button
              onClick={performReplacement}
              disabled={!selectedFile || replacing || !!error}
            >
              {replacing ? 'Replacing...' : 'Replace File'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}