'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Edit, Trash2, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface MediaFolder {
  id: string
  name: string
  parentId?: string
  description?: string
  mediaCount: number
  createdAt: string
  pathBreadcrumb: string[]
  children?: MediaFolder[]
}

interface FolderTreeProps {
  onFolderSelect?: (folderId: string | null) => void
  selectedFolderId?: string | null
  allowEdit?: boolean
}

export function FolderTree({ onFolderSelect, selectedFolderId, allowEdit = true }: FolderTreeProps) {
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createParentId, setCreateParentId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch('/api/cms/media/folders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load folders')

      const result = await response.json()
      const foldersData = result.data || []
      
      const folderTree = buildFolderTree(foldersData)
      setFolders(folderTree)
      
      if (folderTree.length > 0) {
        setExpandedFolders(new Set([folderTree[0].id]))
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load folders',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const buildFolderTree = (flatFolders: MediaFolder[]): MediaFolder[] => {
    const folderMap = new Map<string, MediaFolder>()
    const rootFolders: MediaFolder[] = []

    flatFolders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] })
    })

    folderMap.forEach(folder => {
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId)!.children!.push(folder)
      } else {
        rootFolders.push(folder)
      }
    })

    return rootFolders.sort((a, b) => a.name.localeCompare(b.name))
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (expandedFolders.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch('/api/cms/media/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: createParentId,
          description: newFolderDescription.trim() || undefined
        })
      })

      if (!response.ok) throw new Error('Failed to create folder')

      const result = await response.json()
      await loadFolders()
      
      setNewFolderName('')
      setNewFolderDescription('')
      setShowCreateDialog(false)
      setCreateParentId(null)

      if (createParentId) {
        setExpandedFolders(prev => new Set([...prev, createParentId]))
      }

      toast({
        title: 'Success',
        description: 'Folder created successfully'
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive'
      })
    }
  }

  const updateFolder = async (folderId: string, name: string, description: string) => {
    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch(`/api/cms/media/folders/${folderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined
        })
      })

      if (!response.ok) throw new Error('Failed to update folder')

      await loadFolders()
      setEditingFolder(null)

      toast({
        title: 'Success',
        description: 'Folder updated successfully'
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update folder',
        variant: 'destructive'
      })
    }
  }

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder?')) return

    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch(`/api/cms/media/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete folder')
      }

      await loadFolders()

      toast({
        title: 'Success',
        description: 'Folder deleted successfully'
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    }
  }

  const renderFolder = (folder: MediaFolder, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolderId === folder.id
    const hasChildren = folder.children && folder.children.length > 0

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 p-2  cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
            isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => onFolderSelect?.(folder.id)}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folder.id)
              }}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </Button>
          ) : (
            <div className="w-4" />
          )}

          {isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}

          <span className="flex-1 text-sm font-medium">{folder.name}</span>
          <span className="text-xs text-gray-500">({folder.mediaCount})</span>

          {allowEdit && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setCreateParentId(folder.id)
                  setShowCreateDialog(true)
                }}
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingFolder(folder.id)
                }}
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteFolder(folder.id)
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {folder.children!.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-2 border-b">
        <h3 className="font-semibold">Folders</h3>
        {allowEdit && (
          <Button
            size="sm"
            onClick={() => {
              setCreateParentId(null)
              setShowCreateDialog(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        )}
      </div>

      <div
        className={`p-2  cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
          selectedFolderId === null ? 'bg-blue-100 dark:bg-blue-900' : ''
        }`}
        onClick={() => onFolderSelect?.(null)}
      >
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4" />
          <span className="text-sm font-medium">All Media</span>
        </div>
      </div>

      <div className="space-y-1">
        {folders.map(folder => renderFolder(folder))}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={newFolderDescription}
              onChange={(e) => setNewFolderDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}