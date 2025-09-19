'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import type { UploadDialogProps } from './types'

export function UploadDialog({ 
  isOpen, 
  currentFolder, 
  onClose, 
  onUpload 
}: UploadDialogProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onUpload,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-text">Upload Media</DialogTitle>
          <DialogDescription>
            Drag and drop files or click to select. Maximum 10MB per file.
          </DialogDescription>
        </DialogHeader>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-blue-600">Drop files here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">Drag & drop files here, or click to select</p>
              <p className="text-sm text-gray-500">
                Supports: Images, PDFs, Documents (Max 10MB)
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}