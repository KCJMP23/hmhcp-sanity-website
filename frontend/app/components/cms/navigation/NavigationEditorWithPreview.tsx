'use client'

import React, { useState } from 'react'
import { NavigationEditor } from './NavigationEditor'
import { NavigationPreview } from './NavigationPreview'
// import { NavigationItem, useNavigationEditorStore } from '@/stores/navigationEditorStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Columns, Square } from 'lucide-react'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'

// Simple interface for now - replace with proper type when available
interface NavigationItem {
  id: string
  label: string
  url?: string
  children?: NavigationItem[]
  icon?: string
  external?: boolean
  openInNewTab?: boolean
  order?: number
  parentId?: string
}

interface NavigationEditorWithPreviewProps {
  navigationId: string
  initialItems?: NavigationItem[]
  onSave?: (items: NavigationItem[]) => Promise<void>
  autoSave?: boolean
  maxDepth?: number
}

export function NavigationEditorWithPreview({
  navigationId,
  initialItems = [],
  onSave,
  autoSave = true,
  maxDepth = 4
}: NavigationEditorWithPreviewProps) {
  // Temporarily disabled due to missing dependencies
  return null
}