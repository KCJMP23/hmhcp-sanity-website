'use client'

import type { MediaListViewProps } from './types'

export function MediaListView({ 
  mediaItems, 
  selectedItems, 
  onToggleSelection, 
  onEditItem 
}: MediaListViewProps) {
  // For now, returning a placeholder as the original had this as "coming soon"
  // This can be expanded later to include a full table view
  return (
    <div className="text-center py-8 text-gray-500">
      List view coming soon
    </div>
  )
}