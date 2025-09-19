'use client';

import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import { useDashboard } from './dashboard-provider';
import { DashboardWidget } from '@/types/admin/dashboard';

interface DragItem {
  type: string;
  id: string;
  index: number;
}

interface DraggableWidgetProps {
  widget: DashboardWidget;
  index: number;
  isCustomizing: boolean;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
}

function DraggableWidget({ widget, index, isCustomizing, onMove, children }: DraggableWidgetProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | null }>({
    accept: 'widget',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: () => {
      return { id: widget.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <motion.div
      ref={ref}
      data-handler-id={handlerId}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: isDragging ? 0.5 : 1, 
        scale: isDragging ? 0.95 : 1 
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`${isCustomizing ? 'cursor-move' : ''} ${
        isDragging ? 'z-50' : ''
      }`}
      style={{
        gridColumn: `span ${widget.position.w}`,
        gridRow: `span ${widget.position.h}`
      }}
    >
      {children}
    </motion.div>
  );
}

export function DragDropGrid() {
  const { state, reorderWidgets } = useDashboard();
  const { widgets, customization } = state;

  const moveWidget = useCallback((dragIndex: number, hoverIndex: number) => {
    const draggedWidget = widgets[dragIndex];
    const newWidgets = [...widgets];
    newWidgets.splice(dragIndex, 1);
    newWidgets.splice(hoverIndex, 0, draggedWidget);
    reorderWidgets(newWidgets);
  }, [widgets, reorderWidgets]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="relative">
        {customization.showGrid && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="grid grid-cols-12 gap-4 h-full">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-dashed border-gray-300 rounded"
                />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-4">
          {widgets
            .filter(widget => widget.visible)
            .map((widget, index) => (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                index={index}
                isCustomizing={customization.isCustomizing}
                onMove={moveWidget}
              >
                {/* Widget content will be rendered here by the parent component */}
                <div className="h-full">
                  {/* This will be replaced by actual widget components */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {widget.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {widget.type} widget
                    </p>
                  </div>
                </div>
              </DraggableWidget>
            ))}
        </div>
      </div>
    </DndProvider>
  );
}
