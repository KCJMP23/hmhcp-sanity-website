'use client'

import { ChevronRight, Home, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BreadcrumbItem {
  id: string | null
  name: string
  path: string[]
}

interface FolderBreadcrumbProps {
  currentFolderId: string | null
  folderPath: BreadcrumbItem[]
  onNavigate: (folderId: string | null) => void
  className?: string
}

export function FolderBreadcrumb({ 
  currentFolderId, 
  folderPath, 
  onNavigate, 
  className 
}: FolderBreadcrumbProps) {
  const breadcrumbs = [
    { id: null, name: 'All Media', path: [] },
    ...folderPath
  ]

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      {breadcrumbs.map((item, index) => (
        <div key={item.id || 'root'} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 ${
              item.id === currentFolderId 
                ? 'text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <div className="flex items-center gap-1">
              {index === 0 ? (
                <Home className="w-3 h-3" />
              ) : (
                <Folder className="w-3 h-3" />
              )}
              <span className="truncate max-w-[120px]">{item.name}</span>
            </div>
          </Button>
        </div>
      ))}
    </nav>
  )
}