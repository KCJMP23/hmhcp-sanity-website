/**
 * @fileoverview AdminKanbanBoard Component - Healthcare-compliant Kanban board for workflow visualization
 * @module components/admin/ui/drag-drop/AdminKanbanBoard
 * @since 1.0.0
 */

import React, { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
  Active,
  Over,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'

/**
 * Interface for Kanban board item
 * @interface KanbanItem
 */
export interface KanbanItem {
  /** Unique identifier for the item */
  id: string
  /** Item title */
  title: string
  /** Optional item description */
  description?: string
  /** Priority level of the item */
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  /** Assignee information */
  assignee?: {
    /** Assignee ID */
    id: string
    /** Assignee display name */
    name: string
    /** Assignee avatar URL */
    avatar?: string
  }
  /** Due date for the item */
  dueDate?: Date
  /** Tags associated with the item */
  tags?: string[]
  /** Additional metadata for custom fields */
  metadata?: Record<string, any>
}

/**
 * Interface for Kanban board column
 * @interface KanbanColumn
 */
export interface KanbanColumn {
  /** Unique identifier for the column */
  id: string
  /** Column title */
  title: string
  /** Items in this column */
  items: KanbanItem[]
  /** Optional column color for visual distinction */
  color?: string
  /** WIP (Work In Progress) limit for the column */
  limit?: number
  /** Whether this column is locked (prevents items from being added) */
  locked?: boolean
}

/**
 * Props interface for AdminKanbanBoard component
 * @interface AdminKanbanBoardProps
 */
export interface AdminKanbanBoardProps {
  /** 
   * Kanban columns data
   * @required
   */
  columns: KanbanColumn[]
  /** 
   * Callback when items are moved between columns or reordered
   * @param itemId - ID of the moved item
   * @param fromColumn - Source column ID
   * @param toColumn - Destination column ID
   * @param newIndex - New position index in destination column
   */
  onItemMove?: (itemId: string, fromColumn: string, toColumn: string, newIndex: number) => void
  /** 
   * Callback when columns are reordered
   * @param columns - New column order
   */
  onColumnReorder?: (columns: KanbanColumn[]) => void
  /** 
   * Allow column reordering via drag and drop
   * @default false
   */
  allowColumnReorder?: boolean
  /** 
   * Show item count badge in column header
   * @default true
   */
  showItemCount?: boolean
  /** 
   * Show WIP (Work In Progress) limits in column header
   * @default false
   */
  showWipLimits?: boolean
  /** 
   * Custom render function for item content
   * @param item - Kanban item to render
   * @returns React node for custom item display
   */
  renderItem?: (item: KanbanItem) => React.ReactNode
  /** 
   * Custom render function for column header
   * @param column - Kanban column to render header for
   * @returns React node for custom column header
   */
  renderColumnHeader?: (column: KanbanColumn) => React.ReactNode
  /** 
   * Board height (CSS value or number in pixels)
   * @default '600px'
   */
  height?: string | number
  /** 
   * Card click handler
   * @param item - Clicked item
   */
  onItemClick?: (item: KanbanItem) => void
  /** 
   * Handler for adding new items to a column
   * @param columnId - Target column ID
   */
  onAddItem?: (columnId: string) => void
  /** 
   * Additional CSS class name
   */
  className?: string
}

/**
 * KanbanCard Component
 * 
 * Individual card component for Kanban items.
 * Handles display of item information with priority indicators.
 * 
 * @component
 * @private
 */
const KanbanCard: React.FC<{
  item: KanbanItem
  isDragging?: boolean
  renderItem?: (item: KanbanItem) => React.ReactNode
  onClick?: (item: KanbanItem) => void
}> = ({ item, isDragging, renderItem, onClick }) => {
  const priorityColors = {
    low: 'border-l-gray-400',
    medium: 'border-l-blue-400',
    high: 'border-l-yellow-400',
    urgent: 'border-l-red-400',
  }

  if (renderItem) {
    return (
      <div
        className={cn(
          'cursor-move rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md',
          isDragging && 'opacity-50',
          item.priority && `border-l-4 ${priorityColors[item.priority]}`
        )}
        onClick={() => onClick?.(item)}
      >
        {renderItem(item)}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'cursor-move rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md',
        isDragging && 'opacity-50',
        item.priority && `border-l-4 ${priorityColors[item.priority]}`
      )}
      onClick={() => onClick?.(item)}
    >
      <h4 className="mb-1 font-medium text-gray-900">{item.title}</h4>
      {item.description && (
        <p className="mb-2 text-sm text-gray-600 line-clamp-2">{item.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {item.assignee && (
            <div className="flex items-center gap-1">
              {item.assignee.avatar ? (
                <img
                  src={item.assignee.avatar}
                  alt={item.assignee.name}
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-white">
                  {item.assignee.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
          {item.dueDate && (
            <span className="text-xs text-gray-500">
              {new Date(item.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-1">
            {item.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 2 && (
              <span className="text-xs text-gray-500">+{item.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * SortableKanbanCard Component
 * 
 * Wrapper component that adds drag-and-drop capabilities to KanbanCard.
 * Uses @dnd-kit/sortable for smooth drag interactions.
 * 
 * @component
 * @private
 */
const SortableKanbanCard: React.FC<{
  item: KanbanItem
  renderItem?: (item: KanbanItem) => React.ReactNode
  onClick?: (item: KanbanItem) => void
}> = ({ item, renderItem, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard
        item={item}
        isDragging={isDragging}
        renderItem={renderItem}
        onClick={onClick}
      />
    </div>
  )
}

/**
 * KanbanColumnComponent
 * 
 * Individual column component that contains and manages Kanban items.
 * Handles WIP limits, item counts, and add item functionality.
 * 
 * @component
 * @private
 */
const KanbanColumnComponent: React.FC<{
  column: KanbanColumn
  showItemCount?: boolean
  showWipLimits?: boolean
  renderColumnHeader?: (column: KanbanColumn) => React.ReactNode
  renderItem?: (item: KanbanItem) => React.ReactNode
  onItemClick?: (item: KanbanItem) => void
  onAddItem?: (columnId: string) => void
}> = ({
  column,
  showItemCount,
  showWipLimits,
  renderColumnHeader,
  renderItem,
  onItemClick,
  onAddItem,
}) => {
  const isOverLimit = column.limit && column.items.length > column.limit

  return (
    <div className="flex h-full flex-col rounded-lg bg-gray-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        {renderColumnHeader ? (
          renderColumnHeader(column)
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{column.title}</h3>
              {showItemCount && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    isOverLimit
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {column.items.length}
                  {showWipLimits && column.limit && ` / ${column.limit}`}
                </span>
              )}
            </div>
            {onAddItem && !column.locked && (
              <button
                onClick={() => onAddItem(column.id)}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                aria-label={`Add item to ${column.title}`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {column.locked ? (
          <div className="space-y-2 opacity-60">
            {column.items.map((item) => (
              <KanbanCard
                key={item.id}
                item={item}
                renderItem={renderItem}
                onClick={onItemClick}
              />
            ))}
          </div>
        ) : (
          <SortableContext
            items={column.items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {column.items.map((item) => (
              <SortableKanbanCard
                key={item.id}
                item={item}
                renderItem={renderItem}
                onClick={onItemClick}
              />
            ))}
          </SortableContext>
        )}
        {column.items.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-sm text-gray-400">No items</p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * AdminKanbanBoard Component
 * 
 * A fully-featured Kanban board component for healthcare admin interfaces.
 * Provides drag-and-drop functionality for workflow visualization and task management.
 * Supports WIP limits, custom rendering, and locked columns.
 * 
 * @component
 * @param {AdminKanbanBoardProps} props - Component props
 * @returns {React.ReactElement} Rendered Kanban board
 * 
 * @example
 * // Basic Kanban board
 * const columns = [
 *   { id: 'todo', title: 'To Do', items: [] },
 *   { id: 'progress', title: 'In Progress', items: [] },
 *   { id: 'done', title: 'Done', items: [] }
 * ]
 * <AdminKanbanBoard columns={columns} />
 * 
 * @example
 * // With WIP limits
 * const columns = [
 *   { id: 'todo', title: 'To Do', items: [], limit: 10 },
 *   { id: 'progress', title: 'In Progress', items: [], limit: 3 },
 *   { id: 'done', title: 'Done', items: [] }
 * ]
 * <AdminKanbanBoard columns={columns} showWipLimits />
 * 
 * @example
 * // With custom item rendering
 * <AdminKanbanBoard 
 *   columns={columns}
 *   renderItem={(item) => (
 *     <CustomCard item={item} />
 *   )}
 *   onItemClick={handleItemClick}
 * />
 * 
 * @example
 * // With add item functionality
 * <AdminKanbanBoard 
 *   columns={columns}
 *   onAddItem={(columnId) => {
 *     openAddItemModal(columnId)
 *   }}
 * />
 * 
 * @example
 * // With locked column (no items can be added)
 * const columns = [
 *   { id: 'backlog', title: 'Backlog', items: [], locked: true },
 *   { id: 'active', title: 'Active', items: [] }
 * ]
 * <AdminKanbanBoard columns={columns} />
 * 
 * @since 1.0.0
 */
export const AdminKanbanBoard: React.FC<AdminKanbanBoardProps> = ({
  columns: initialColumns,
  onItemMove,
  onColumnReorder,
  allowColumnReorder = false,
  showItemCount = true,
  showWipLimits = false,
  renderItem,
  renderColumnHeader,
  height = '600px',
  onItemClick,
  onAddItem,
  className,
}) => {
  const [columns, setColumns] = useState(initialColumns)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  /**
   * Finds the container (column) that contains the given item or column ID
   * @private
   * @param {UniqueIdentifier} id - Item or column ID to search for
   * @returns {string | undefined} Column ID if found, undefined otherwise
   */
  const findContainer = (id: UniqueIdentifier): string | undefined => {
    if (columns.find((col) => col.id === id)) {
      return id as string
    }

    return columns.find((col) => col.items.some((item) => item.id === id))?.id
  }

  /**
   * Handles the start of a drag operation
   * @private
   * @param {DragStartEvent} event - Drag start event from dnd-kit
   */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  /**
   * Handles dragging over a droppable area
   * Manages moving items between columns during drag
   * @private
   * @param {DragOverEvent} event - Drag over event from dnd-kit
   */
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return
    }

    setColumns((prev) => {
      const activeColumn = prev.find((col) => col.id === activeContainer)
      const overColumn = prev.find((col) => col.id === overContainer)

      if (!activeColumn || !overColumn || overColumn.locked) {
        return prev
      }

      const activeItem = activeColumn.items.find((item) => item.id === active.id)
      if (!activeItem) return prev

      return prev.map((col) => {
        if (col.id === activeContainer) {
          return {
            ...col,
            items: col.items.filter((item) => item.id !== active.id),
          }
        }
        if (col.id === overContainer) {
          return {
            ...col,
            items: [...col.items, activeItem],
          }
        }
        return col
      })
    })
  }

  /**
   * Handles the end of a drag operation
   * Finalizes item placement and triggers callbacks
   * @private
   * @param {DragEndEvent} event - Drag end event from dnd-kit
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) {
      setActiveId(null)
      return
    }

    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)

    if (!activeContainer || !overContainer) {
      setActiveId(null)
      return
    }

    if (activeContainer === overContainer) {
      const column = columns.find((col) => col.id === activeContainer)
      if (!column || column.locked) {
        setActiveId(null)
        return
      }

      const oldIndex = column.items.findIndex((item) => item.id === active.id)
      const newIndex = column.items.findIndex((item) => item.id === over.id)

      if (oldIndex !== newIndex) {
        setColumns((prev) =>
          prev.map((col) => {
            if (col.id === activeContainer) {
              return {
                ...col,
                items: arrayMove(col.items, oldIndex, newIndex),
              }
            }
            return col
          })
        )

        onItemMove?.(
          active.id as string,
          activeContainer,
          activeContainer,
          newIndex
        )
      }
    } else {
      const overColumn = columns.find((col) => col.id === overContainer)
      if (overColumn?.locked) {
        setActiveId(null)
        return
      }

      const overIndex = overColumn?.items.findIndex((item) => item.id === over.id) ?? 0

      onItemMove?.(
        active.id as string,
        activeContainer,
        overContainer,
        overIndex
      )
    }

    setActiveId(null)
  }

  /**
   * Memoized computation of the currently dragged item
   * @private
   */
  const activeItem = useMemo(() => {
    if (!activeId) return null
    for (const column of columns) {
      const item = column.items.find((item) => item.id === activeId)
      if (item) return item
    }
    return null
  }, [activeId, columns])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn('flex gap-4 overflow-x-auto', className)}
        style={{ height }}
      >
        {columns.map((column) => (
          <div key={column.id} className="min-w-[300px] flex-1">
            <KanbanColumnComponent
              column={column}
              showItemCount={showItemCount}
              showWipLimits={showWipLimits}
              renderColumnHeader={renderColumnHeader}
              renderItem={renderItem}
              onItemClick={onItemClick}
              onAddItem={onAddItem}
            />
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeItem && (
          <KanbanCard
            item={activeItem}
            isDragging
            renderItem={renderItem}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}