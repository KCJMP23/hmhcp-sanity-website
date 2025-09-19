'use client'

// import { useNavigationEditorStore, type NavigationItem } from '@/stores/navigationEditorStore'
// import { NavigationEditorWithPreview } from './NavigationEditorWithPreview'
import { logger } from '@/lib/logger';

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

interface NavigationEditorClientWrapperProps {
  navigationId: string
  userId: string
}

export function NavigationEditorClientWrapper({
  navigationId,
  userId
}: NavigationEditorClientWrapperProps) {
  // Temporarily disabled due to missing dependencies
  return null
}