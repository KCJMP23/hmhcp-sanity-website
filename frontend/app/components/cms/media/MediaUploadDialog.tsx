'client'

import { useState, useCallback } from 'react'
// import { useDropzone } from 'react-dropzone'
import { X, Upload, Image, FileText, Video, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
// import { useCMSStore } from '@/stores/cmsStore'
import { toast } from '@/hooks/use-toast'

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error'
  error?: string
  result?: {
    id: string
    filename: string
    publicUrl: string
  }
}

interface MediaUploadDialogProps {
  open: boolean
  onClose: () => void
  onUploadComplete?: (files: Array<{ id: string; filename: string; publicUrl: string }>) => void
  acceptedTypes?: string[]
  maxFiles?: number
  maxSize?: number
  folder?: string
}

export function MediaUploadDialog({
  open,
  onClose,
  onUploadComplete,
  acceptedTypes = ['image/*', 'application/pdf', 'video/mp4'],
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  folder
}: MediaUploadDialogProps) {
  // Temporarily disabled due to missing dependencies
  return null
}