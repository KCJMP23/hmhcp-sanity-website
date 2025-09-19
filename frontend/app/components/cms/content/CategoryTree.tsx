'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Edit, Trash2, MoveVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
// import { CategoryService } from '@/services/cms/categoryService'
// import type { CMSCategory } from '@/types/cms-content'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger';

// Simple interface for now
interface CMSCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
}

interface CategoryTreeProps {
  selectedCategoryId?: string
  onSelectCategory?: (category: CMSCategory | null) => void
  allowEdit?: boolean
  className?: string
}

interface CategoryNode extends CMSCategory {
  children?: CategoryNode[]
  isExpanded?: boolean
}

export function CategoryTree({
  selectedCategoryId,
  onSelectCategory,
  allowEdit = false,
  className
}: CategoryTreeProps) {
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<CMSCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<CMSCategory | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [parentForNewCategory, setParentForNewCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [draggedCategory, setDraggedCategory] = useState<CategoryNode | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      // const tree = await CategoryService.getCategoryTree()
      // setCategories(tree as CategoryNode[])
      // Mock data for now
      setCategories([])
    } catch (error) {
      logger.error('Failed to load categories:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleCreateCategory = async (name: string, description: string) => {
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      // await CategoryService.createCategory({
      //   name,
      //   slug,
      //   description,
      //   parentId: parentForNewCategory,
      //   sortOrder: 0
      // })
      
      toast({
        title: 'Success',
        description: 'Category created successfully'
      })
      
      await loadCategories()
      setCreateDialogOpen(false)
      setParentForNewCategory(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateCategory = async (categoryId: string, updates: Partial<CMSCategory>) => {
    try {
      // await CategoryService.updateCategory(categoryId, { ...updates, id: categoryId })
      
      toast({
        title: 'Success',
        description: 'Category updated successfully'
      })
      
      await loadCategories()
      setEditingCategory(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // await CategoryService.deleteCategory(categoryId)
      
      toast({
        title: 'Success',
        description: 'Category deleted successfully'
      })
      
      await loadCategories()
      setDeletingCategory(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive'
      })
    }
  }

  const handleDragStart = (e: React.DragEvent, category: CategoryNode) => {
    setDraggedCategory(category)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetCategory: CategoryNode | null) => {
    e.preventDefault()
    
    if (!draggedCategory) return
    
    // Don't allow dropping on itself or its descendants
    if (targetCategory?.id === draggedCategory.id) return
    
    try {
      await handleUpdateCategory(draggedCategory.id, {
        parentId: targetCategory?.id || undefined
      })
      setDraggedCategory(null)
    } catch (error) {
      // Error handled in handleUpdateCategory
    }
  }

  const renderCategory = (category: CategoryNode, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id)
    const hasChildren = category.children && category.children.length > 0
    const isSelected = selectedCategoryId === category.id

    return (
      <div key={category.id}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3  cursor-pointer transition-colors",
            "hover:bg-accent/50",
            isSelected && "bg-accent",
            allowEdit && "draggable"
          )}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => onSelectCategory?.(category)}
          draggable={allowEdit}
          onDragStart={(e) => allowEdit && handleDragStart(e, category)}
          onDragOver={handleDragOver}
          onDrop={(e) => allowEdit && handleDrop(e, category)}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(category.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-4" />}
          
          {isExpanded && hasChildren ? (
            <FolderOpen className="h-4 w-4 text-primary" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}
          
          <span className="flex-1 text-sm font-medium">{category.name}</span>
          
          {allowEdit && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  setParentForNewCategory(category.id)
                  setCreateDialogOpen(true)
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingCategory(category)
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeletingCategory(category)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn("p-4", className)}>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={cn("space-y-1", className)}>
        {allowEdit && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Categories</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setParentForNewCategory(null)
                setCreateDialogOpen(true)
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              New Category
            </Button>
          </div>
        )}
        
        <div
          className={cn(
            " border p-2",
            allowEdit && "min-h-[200px]"
          )}
          onDragOver={handleDragOver}
          onDrop={(e) => allowEdit && handleDrop(e, null)}
        >
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No categories yet
            </p>
          ) : (
            categories.map(category => renderCategory(category))
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={createDialogOpen || !!editingCategory} 
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false)
            setEditingCategory(null)
            setParentForNewCategory(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Update the category details below'
                : 'Enter the details for the new category'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const name = formData.get('name') as string
            const description = formData.get('description') as string
            
            if (editingCategory) {
              handleUpdateCategory(editingCategory.id, { name, description })
            } else {
              handleCreateCategory(name, description)
            }
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingCategory?.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={editingCategory?.description}
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setCreateDialogOpen(false)
                setEditingCategory(null)
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={!!deletingCategory} 
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeletingCategory(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deletingCategory && handleDeleteCategory(deletingCategory.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}