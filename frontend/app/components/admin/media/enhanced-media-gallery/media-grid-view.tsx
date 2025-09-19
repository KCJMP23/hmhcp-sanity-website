'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Edit, Eye } from 'lucide-react'
import type { MediaGridViewProps } from './types'
import { getFileIcon, formatFileSize, OPTIMIZATION_STATUS } from './types'

export function MediaGridView({ 
  mediaItems, 
  selectedItems, 
  onToggleSelection, 
  onEditItem 
}: MediaGridViewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {mediaItems.map((item) => {
        const FileIcon = getFileIcon(item.mime_type)
        const isSelected = selectedItems.includes(item.id)
        
        return (
          <div
            key={item.id}
            className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
              isSelected 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
            onClick={() => onToggleSelection(item.id)}
          >
            {/* Thumbnail */}
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {item.mime_type.startsWith('image/') ? (
                <img
                  src={item.url}
                  alt={item.alt_text || item.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <FileIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>

            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditItem(item)
                  }}
                  className="rounded-lg"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(item.url, '_blank')
                  }}
                  className="rounded-lg"
                >
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="p-2 bg-white dark:bg-gray-900">
              <div className="text-xs font-text text-gray-900 dark:text-white truncate">
                {item.filename}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {formatFileSize(item.size)}
                </span>
                <Badge 
                  className={`text-xs ${OPTIMIZATION_STATUS[item.optimization_status as keyof typeof OPTIMIZATION_STATUS]?.color || 'bg-gray-100 text-gray-800'} rounded-md`}
                >
                  {OPTIMIZATION_STATUS[item.optimization_status as keyof typeof OPTIMIZATION_STATUS]?.label || item.optimization_status}
                </Badge>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}