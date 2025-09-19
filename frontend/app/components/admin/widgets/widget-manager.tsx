'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Settings,
  Calendar,
  FileText,
  User,
  Tag,
  Search,
  Image,
  MessageSquare,
  BarChart3,
  Mail,
  Clock,
  Link,
  GripVertical,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { ConsistentCard } from '@/components/design-system/consistency-wrapper'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface Widget {
  id: string
  type: string
  title: string
  config: Record<string, any>
  isActive: boolean
}

interface WidgetArea {
  id: string
  name: string
  description: string
  widgets: Widget[]
}

const availableWidgets = [
  { type: 'recent-posts', name: 'Recent Posts', icon: FileText, description: 'Display recent blog posts' },
  { type: 'categories', name: 'Categories', icon: Tag, description: 'List of post categories' },
  { type: 'search', name: 'Search', icon: Search, description: 'Search box for your site' },
  { type: 'recent-comments', name: 'Recent Comments', icon: MessageSquare, description: 'Latest comments' },
  { type: 'archives', name: 'Archives', icon: Calendar, description: 'Monthly post archives' },
  { type: 'text', name: 'Text', icon: FileText, description: 'Custom text or HTML' },
  { type: 'image', name: 'Image', icon: Image, description: 'Display an image' },
  { type: 'social-links', name: 'Social Links', icon: Link, description: 'Social media links' },
  { type: 'newsletter', name: 'Newsletter', icon: Mail, description: 'Newsletter signup form' },
  { type: 'stats', name: 'Site Stats', icon: BarChart3, description: 'Display site statistics' }
]

const defaultAreas: WidgetArea[] = [
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Main sidebar widgets',
    widgets: [
      { id: '1', type: 'search', title: 'Search', config: {}, isActive: true },
      { id: '2', type: 'recent-posts', title: 'Recent Posts', config: { count: 5 }, isActive: true },
      { id: '3', type: 'categories', title: 'Categories', config: { showCount: true }, isActive: true }
    ]
  },
  {
    id: 'footer-1',
    name: 'Footer Column 1',
    description: 'First footer column',
    widgets: [
      { id: '4', type: 'text', title: 'About Us', config: { content: 'Healthcare innovation...' }, isActive: true }
    ]
  },
  {
    id: 'footer-2',
    name: 'Footer Column 2',
    description: 'Second footer column',
    widgets: [
      { id: '5', type: 'recent-posts', title: 'Latest News', config: { count: 3 }, isActive: true }
    ]
  },
  {
    id: 'footer-3',
    name: 'Footer Column 3',
    description: 'Third footer column',
    widgets: [
      { id: '6', type: 'newsletter', title: 'Stay Updated', config: {}, isActive: true }
    ]
  }
]

function SortableWidget({ widget, onEdit, onDelete }: { 
  widget: Widget
  onEdit: () => void
  onDelete: () => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const WidgetIcon = availableWidgets.find(w => w.type === widget.type)?.icon || FileText

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4",
        isDragging && "opacity-50 shadow-2xl"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <WidgetIcon className="w-4 h-4 text-gray-500" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {widget.title}
              </h4>
              {!widget.isActive && (
                <span className="text-xs text-gray-500 dark:text-gray-400">(Inactive)</span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {availableWidgets.find(w => w.type === widget.type)?.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-red-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export function WidgetManager() {
  const [areas, setAreas] = useState<WidgetArea[]>(defaultAreas)
  const [selectedArea, setSelectedArea] = useState<string>('sidebar')
  const [showAddWidget, setShowAddWidget] = useState(false)
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null)
  const [collapsedAreas, setCollapsedAreas] = useState<string[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setAreas(prevAreas => {
        return prevAreas.map(area => {
          if (area.id === selectedArea) {
            const oldIndex = area.widgets.findIndex(w => w.id === active.id)
            const newIndex = area.widgets.findIndex(w => w.id === over.id)
            return {
              ...area,
              widgets: arrayMove(area.widgets, oldIndex, newIndex)
            }
          }
          return area
        })
      })
    }
  }

  const handleAddWidget = (widgetType: string) => {
    const widgetInfo = availableWidgets.find(w => w.type === widgetType)
    if (!widgetInfo) return

    const newWidget: Widget = {
      id: Date.now().toString(),
      type: widgetType,
      title: widgetInfo.name,
      config: {},
      isActive: true
    }

    setAreas(prevAreas => {
      return prevAreas.map(area => {
        if (area.id === selectedArea) {
          return {
            ...area,
            widgets: [...area.widgets, newWidget]
          }
        }
        return area
      })
    })

    setShowAddWidget(false)
    toast.success('Widget added successfully')
  }

  const handleDeleteWidget = (widgetId: string) => {
    setAreas(prevAreas => {
      return prevAreas.map(area => {
        return {
          ...area,
          widgets: area.widgets.filter(w => w.id !== widgetId)
        }
      })
    })
    toast.success('Widget removed')
  }

  const handleSaveWidget = (widget: Widget) => {
    setAreas(prevAreas => {
      return prevAreas.map(area => {
        return {
          ...area,
          widgets: area.widgets.map(w => 
            w.id === widget.id ? widget : w
          )
        }
      })
    })
    setEditingWidget(null)
    toast.success('Widget settings saved')
  }

  const toggleAreaCollapse = (areaId: string) => {
    setCollapsedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    )
  }

  const currentArea = areas.find(a => a.id === selectedArea)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-light tracking-tight text-gray-900 dark:text-white mb-2">
          Widget Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize widget areas across your site
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
        {/* Available Widgets */}
        <div>
          <ConsistentCard>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Available Widgets
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Drag widgets to add them to areas
              </p>
            </div>
            
            <div className="p-4 space-y-2">
              {availableWidgets.map(widget => {
                const Icon = widget.icon
                return (
                  <button
                    key={widget.type}
                    onClick={() => {
                      handleAddWidget(widget.type)
                    }}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <Icon className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {widget.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {widget.description}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </button>
                )
              })}
            </div>
          </ConsistentCard>
        </div>

        {/* Widget Areas */}
        <div className="space-y-6">
          {areas.map(area => {
            const isCollapsed = collapsedAreas.includes(area.id)
            const isSelected = area.id === selectedArea
            
            return (
              <ConsistentCard key={area.id}>
                <div 
                  className={cn(
                    "p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer",
                    isSelected && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                  onClick={() => setSelectedArea(area.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {area.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {area.description} • {area.widgets.length} widgets
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleAreaCollapse(area.id)
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronUp className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <AnimatePresence>
                  {!isCollapsed && isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-4"
                    >
                      {area.widgets.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <p className="mb-4">No widgets in this area</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddWidget(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Widget
                          </Button>
                        </div>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={area.widgets.map(w => w.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-3">
                              {area.widgets.map(widget => (
                                <SortableWidget
                                  key={widget.id}
                                  widget={widget}
                                  onEdit={() => setEditingWidget(widget)}
                                  onDelete={() => handleDeleteWidget(widget.id)}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </ConsistentCard>
            )
          })}
        </div>
      </div>

      {/* Edit Widget Dialog */}
      <Dialog open={!!editingWidget} onOpenChange={() => setEditingWidget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Widget</DialogTitle>
            <DialogDescription>
              Configure widget settings and appearance
            </DialogDescription>
          </DialogHeader>
          
          {editingWidget && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingWidget.title}
                  onChange={(e) => setEditingWidget({
                    ...editingWidget,
                    title: e.target.value
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={editingWidget.isActive}
                  onCheckedChange={(checked) => setEditingWidget({
                    ...editingWidget,
                    isActive: checked
                  })}
                />
              </div>
              
              {/* Widget-specific settings */}
              {editingWidget.type === 'recent-posts' && (
                <div className="space-y-2">
                  <Label>Number of posts</Label>
                  <Input
                    type="number"
                    value={editingWidget.config.count || 5}
                    onChange={(e) => setEditingWidget({
                      ...editingWidget,
                      config: {
                        ...editingWidget.config,
                        count: parseInt(e.target.value)
                      }
                    })}
                    min="1"
                    max="20"
                  />
                </div>
              )}
              
              {editingWidget.type === 'text' && (
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={editingWidget.config.content || ''}
                    onChange={(e) => setEditingWidget({
                      ...editingWidget,
                      config: {
                        ...editingWidget.config,
                        content: e.target.value
                      }
                    })}
                    rows={6}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingWidget(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => editingWidget && handleSaveWidget(editingWidget)}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}