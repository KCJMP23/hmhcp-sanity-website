'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Layers } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableMenuItem } from './sortable-menu-item'
import type { MenuStructureProps } from './types'

export function MenuStructure({
  selectedMenu,
  updateMenuItem,
  deleteMenuItem,
  handleDragEnd
}: MenuStructureProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (!selectedMenu) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Menu Structure</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedMenu.items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Layers className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No menu items yet</p>
            <p className="text-sm">Add items from the sidebar</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedMenu.items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {selectedMenu.items.map((item) => (
                  <SortableMenuItem
                    key={item.id}
                    item={item}
                    onUpdate={updateMenuItem}
                    onDelete={deleteMenuItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  )
}