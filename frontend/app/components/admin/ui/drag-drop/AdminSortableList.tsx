'use client'

import React, { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { cn } from '@/lib/utils'
import AdminSortableItem from './AdminSortableItem'
import DragPreview from './DragPreview'

export interface SortableItemData {
  id: UniqueIdentifier
  content: React.ReactNode
  data?: Record<string, any>
  hipaaLevel?: 'phi' | 'medical' | 'administrative' | 'public'
  disabled?: boolean
}

export interface AdminSortableListProps {
  items: SortableItemData[]
  onReorder: (items: SortableItemData[]) => void
  className?: string
  itemClassName?: string
  /**
   * Restrict reordering based on HIPAA levels
   */
  hipaaReorderingRules?: boolean
  /**
   * Custom item renderer
   */
  renderItem?: (item: SortableItemData, index: number) => React.ReactNode
  /**
   * Accessibility label for the list
   */
  ariaLabel?: string
  /**
   * Called when drag starts - for HIPAA audit logging
   */
  onDragStart?: (item: SortableItemData) => void
  /**
   * Called when drag ends
   */
  onDragEnd?: (oldIndex: number, newIndex: number, item: SortableItemData) => void
  /**
   * Called when reordering is prevented due to HIPAA rules
   */
  onHipaaViolation?: (item: SortableItemData, targetIndex: number, reason: string) => void
  /**
   * Touch device support
   */
  touchEnabled?: boolean
  /**
   * Keyboard navigation support
   */
  keyboardEnabled?: boolean
  /**
   * Custom drag preview
   */
  dragPreview?: (item: SortableItemData) => React.ReactNode
}

/**
 * AdminSortableList - A HIPAA-compliant sortable list component
 * 
 * Features:
 * - Healthcare workflow support with HIPAA compliance
 * - Touch device compatibility with gesture recognition
 * - Full keyboard accessibility with arrow key navigation
 * - Medical data reordering restrictions based on security levels
 * - Comprehensive audit logging for compliance
 * - TypeScript-first with type safety
 */
export const AdminSortableList: React.FC<AdminSortableListProps> = ({
  items,
  onReorder,
  className,
  itemClassName,
  hipaaReorderingRules = true,
  renderItem,
  ariaLabel,
  onDragStart,
  onDragEnd,
  onHipaaViolation,
  touchEnabled = true,
  keyboardEnabled = true,
  dragPreview,
}) => {
  const [activeItem, setActiveItem] = useState<SortableItemData | null>(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null)

  // Configure sensors for different input methods
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Minimum distance before drag starts
      },
    }),
    ...(touchEnabled
      ? [
          useSensor(TouchSensor, {
            activationConstraint: {
              delay: 150, // Touch delay to prevent accidental drags
              tolerance: 5,
            },
          }),
        ]
      : []),
    ...(keyboardEnabled
      ? [
          useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
          }),
        ]
      : [])
  )

  /**
   * Validate HIPAA-compliant reordering
   */
  const validateHipaaReordering = (
    draggedItem: SortableItemData,
    targetIndex: number
  ): { allowed: boolean; reason?: string } => {
    if (!hipaaReorderingRules) return { allowed: true }

    const draggedLevel = draggedItem.hipaaLevel || 'public'
    const targetItem = items[targetIndex]
    const targetLevel = targetItem?.hipaaLevel || 'public'

    // Define HIPAA level hierarchy (higher number = more restricted)
    const hipaaLevels = {
      public: 0,
      administrative: 1,
      medical: 2,
      phi: 3,
    }

    // PHI data cannot be moved adjacent to public data
    if (draggedLevel === 'phi' && targetLevel === 'public') {
      return {
        allowed: false,
        reason: 'PHI data cannot be placed adjacent to public data for compliance reasons',
      }
    }

    // Medical data has limited reordering constraints
    if (draggedLevel === 'medical' && targetLevel === 'public') {
      // Allow but log the action
      console.log(
        `[HIPAA Audit] Medical data moved adjacent to public data: ${draggedItem.id} at ${new Date().toISOString()}`
      )
    }

    return { allowed: true }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const draggedItem = items.find((item) => item.id === event.active.id)
    if (draggedItem) {
      setActiveItem(draggedItem)
      onDragStart?.(draggedItem)

      // HIPAA audit logging
      if (draggedItem.hipaaLevel && draggedItem.hipaaLevel !== 'public') {
        console.log(
          `[HIPAA Audit] Started dragging ${draggedItem.hipaaLevel} data: ${draggedItem.id} at ${new Date().toISOString()}`
        )
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const overIndex = items.findIndex((item) => item.id === over.id)
      setDraggedOverIndex(overIndex)

      // Validate HIPAA compliance during drag over
      const draggedItem = items.find((item) => item.id === active.id)
      if (draggedItem) {
        const validation = validateHipaaReordering(draggedItem, overIndex)
        if (!validation.allowed) {
          // Visual feedback for invalid drop location
          setDraggedOverIndex(null)
        }
      }
    } else {
      setDraggedOverIndex(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveItem(null)
    setDraggedOverIndex(null)

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      const draggedItem = items[oldIndex]

      // Validate HIPAA compliance
      const validation = validateHipaaReordering(draggedItem, newIndex)
      
      if (!validation.allowed) {
        onHipaaViolation?.(draggedItem, newIndex, validation.reason || 'HIPAA compliance violation')
        return
      }

      // Perform the reorder
      const reorderedItems = arrayMove(items, oldIndex, newIndex)
      onReorder(reorderedItems)
      onDragEnd?.(oldIndex, newIndex, draggedItem)

      // HIPAA audit logging
      if (draggedItem.hipaaLevel && draggedItem.hipaaLevel !== 'public') {
        console.log(
          `[HIPAA Audit] Reordered ${draggedItem.hipaaLevel} data: ${draggedItem.id} from position ${oldIndex} to ${newIndex} at ${new Date().toISOString()}`
        )
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div
          className={cn(
            'space-y-2',
            className
          )}
          role="list"
          aria-label={ariaLabel || 'Sortable list'}
          data-testid="admin-sortable-list"
        >
          {items.map((item, index) => (
            <AdminSortableItem
              key={item.id}
              id={item.id}
              data={item.data}
              hipaaLevel={item.hipaaLevel}
              disabled={item.disabled}
              className={cn(
                itemClassName,
                draggedOverIndex === index && 'ring-2 ring-blue-300',
              )}
            >
              {renderItem ? renderItem(item, index) : item.content}
            </AdminSortableItem>
          ))}
        </div>
      </SortableContext>

      {/* Drag preview overlay */}
      <DragPreview
        activeItem={activeItem}
        customPreview={dragPreview}
      />

      {/* Accessibility announcement region */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        data-testid="sortable-list-announcements"
      >
        {activeItem && `Moving item ${activeItem.id}`}
        {draggedOverIndex !== null && `Over position ${draggedOverIndex + 1}`}
      </div>
    </DndContext>
  )
}

export default AdminSortableList