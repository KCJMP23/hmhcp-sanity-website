'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
// import { useCMSStore } from '@/stores/cmsStore'
import { 
  Download, 
  Copy, 
  ExternalLink, 
  Calendar,
  User,
  FileText,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaFile {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  storage_path: string
  alt_text?: string
  title?: string
  description?: string
  width?: number
  height?: number
  uploaded_by: string
  created_at: string
  updated_at: string
  folder?: string
  tags?: string[]
  usage_count?: number
  publicUrl: string
  copyright?: string
  usage_rights?: string
}

interface MediaDetailsDialogProps {
  media: MediaFile
  open: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function MediaDetailsDialog({
  media,
  open,
  onClose,
  onUpdate
}: MediaDetailsDialogProps) {
  // Temporarily disabled due to missing dependencies
  return null
}