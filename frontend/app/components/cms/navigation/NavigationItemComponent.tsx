'use client'

import React, { useState } from 'react'
// Removed @dnd-kit dependencies - functionality simplified
// import { NavigationItem, useNavigationEditorStore } from '@/stores/navigationEditorStore'
import { cn } from '@/lib/utils'
import { 
  GripVertical, 
  ChevronRight, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  Copy,
  ExternalLink,
  Link,
  File
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// Removed @dnd-kit/sortable dependency

// Simple interface for now - replace with proper type when available
interface NavigationItem {
  id: string
  label: string
  title?: string
  url?: string
  children?: NavigationItem[]
  icon?: string
  external?: boolean
  openInNewTab?: boolean
  order?: number
  parentId?: string
}

interface NavigationItemComponentProps {
  item: NavigationItem
  depth: number
  maxDepth: number
}

export function NavigationItemComponent({
  item,
  depth,
  maxDepth
}: NavigationItemComponentProps) {
  // Temporarily disabled due to missing dependencies
  return null
}