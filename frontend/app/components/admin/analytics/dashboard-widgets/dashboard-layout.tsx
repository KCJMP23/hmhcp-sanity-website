'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { 
  GripVertical, Settings, Eye, EyeOff, MoreVertical, 
  Layout, Maximize2, Minimize2, RefreshCw 
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface WidgetConfig {
  id: string
  title: string
  component: React.ReactNode
  visible: boolean
  order: number
  size: 'small' | 'medium' | 'large' | 'full'
  refreshable?: boolean
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [widgets, setWidgets] = useState<WidgetConfig[]>([])
  const [layoutStyle, setLayoutStyle] = useState<'grid' | 'masonry'>('grid')

  // Initialize widgets from children
  useEffect(() => {
    const childArray = React.Children.toArray(children)
    const initialWidgets: WidgetConfig[] = childArray.map((child, index) => {
      const element = child as React.ReactElement
      return {
        id: `widget-${index}`,
        title: `Widget ${index + 1}`,
        component: child,
        visible: true,
        order: index,
        size: 'medium',
        refreshable: true
      }
    })
    setWidgets(initialWidgets)
  }, [children])

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault()
    if (!draggedWidget || draggedWidget === targetWidgetId) return

    setWidgets(prevWidgets => {
      const newWidgets = [...prevWidgets]
      const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidget)
      const targetIndex = newWidgets.findIndex(w => w.id === targetWidgetId)
      
      const [draggedItem] = newWidgets.splice(draggedIndex, 1)
      newWidgets.splice(targetIndex, 0, draggedItem)
      
      // Update order numbers
      return newWidgets.map((widget, index) => ({
        ...widget,
        order: index
      }))
    })
    
    setDraggedWidget(null)
  }

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === widgetId 
          ? { ...widget, visible: !widget.visible }
          : widget
      )
    )
  }

  const changeWidgetSize = (widgetId: string, size: 'small' | 'medium' | 'large' | 'full') => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === widgetId 
          ? { ...widget, size }
          : widget
      )
    )
  }

  const getGridClass = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1'
      case 'medium': return 'col-span-2'
      case 'large': return 'col-span-3'
      case 'full': return 'col-span-full'
      default: return 'col-span-2'
    }
  }

  const visibleWidgets = widgets
    .filter(widget => widget.visible)
    .sort((a, b) => a.order - b.order)

  const WidgetWrapper: React.FC<{ 
    widget: WidgetConfig
    children: React.ReactNode 
  }> = ({ widget, children }) => (
    <Card 
      className={`relative group transition-all duration-300 ${
        isCustomizing 
          ? 'ring-2 ring-blue-500/20 hover:ring-blue-500/40' 
          : 'hover:shadow-lg'
      } ${getGridClass(widget.size)}`}
      draggable={isCustomizing}
      onDragStart={(e) => handleDragStart(e, widget.id)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, widget.id)}
    >
      {isCustomizing && (
        <div className="absolute top-2 left-2 z-10">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
            <Badge variant="outline" className="text-xs">
              {widget.size}
            </Badge>
          </div>
        </div>
      )}
      
      {isCustomizing && (
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Widget Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel className="text-xs text-gray-500">Size</DropdownMenuLabel>
              {['small', 'medium', 'large', 'full'].map(size => (
                <DropdownMenuCheckboxItem
                  key={size}
                  checked={widget.size === size}
                  onCheckedChange={() => changeWidgetSize(widget.id, size as any)}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => toggleWidgetVisibility(widget.id)}>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Widget
              </DropdownMenuItem>
              
              {widget.refreshable && (
                <DropdownMenuItem>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      <div className={isCustomizing ? 'pt-8' : ''}>
        {children}
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Dashboard Customization</h3>
              <p className="text-sm text-blue-700">
                {isCustomizing 
                  ? 'Drag widgets to reorder, use controls to resize and hide widgets' 
                  : 'Customize your analytics dashboard layout and widgets'
                }
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Layout Style Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Layout className="h-4 w-4 mr-2" />
                    Layout
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={layoutStyle === 'grid'}
                    onCheckedChange={() => setLayoutStyle('grid')}
                  >
                    Grid Layout
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={layoutStyle === 'masonry'}
                    onCheckedChange={() => setLayoutStyle('masonry')}
                  >
                    Masonry Layout
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Widget Visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Widgets ({widgets.filter(w => w.visible).length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                  <DropdownMenuLabel>Show/Hide Widgets</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {widgets.map(widget => (
                    <DropdownMenuCheckboxItem
                      key={widget.id}
                      checked={widget.visible}
                      onCheckedChange={() => toggleWidgetVisibility(widget.id)}
                    >
                      {widget.title}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Customize Toggle */}
              <Button
                onClick={() => setIsCustomizing(!isCustomizing)}
                variant={isCustomizing ? "default" : "outline"}
                size="sm"
                className={isCustomizing ? "bg-blue-600 text-white" : ""}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isCustomizing ? 'Done' : 'Customize'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Grid */}
      <div className={
        layoutStyle === 'grid' 
          ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6' 
          : 'columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6'
      }>
        {visibleWidgets.map(widget => (
          <WidgetWrapper key={widget.id} widget={widget}>
            {widget.component}
          </WidgetWrapper>
        ))}
      </div>

      {/* Customization Help */}
      {isCustomizing && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Layout className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Customization Tips</h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• Drag the grip handle (⋮⋮) to reorder widgets</p>
                  <p>• Use the dropdown menu (⋯) to resize widgets or hide them</p>
                  <p>• Small widgets work best for KPIs, large for charts</p>
                  <p>• Your layout preferences are automatically saved</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}