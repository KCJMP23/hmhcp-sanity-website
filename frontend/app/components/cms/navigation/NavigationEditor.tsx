'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
// import { NavigationItem, useNavigationEditorStore } from '@/stores/navigationEditorStore'
import { NavigationItemComponent } from './NavigationItemComponent'
import { NavigationSidebar } from './NavigationSidebar'
import { useToast } from '@/components/ui/use-toast'

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

interface NavigationEditorProps {
  initialItems?: NavigationItem[]
  onSave?: (items: NavigationItem[]) => Promise<void>
  autoSave?: boolean
  readOnly?: boolean
}

export function NavigationEditor({
  initialItems = [],
  onSave,
  autoSave = true,
  readOnly = false
}: NavigationEditorProps) {
  // Temporarily disabled due to missing dependencies
  return null
}