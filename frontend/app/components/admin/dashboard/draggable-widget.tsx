'use client';

import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import { DashboardWidget } from '@/types/admin/dashboard';
import { SystemStatusWidget } from './widgets/system-status-widget';
import { ContentPerformanceWidget } from './widgets/content-performance-widget';
import { ComplianceWidget } from './widgets/compliance-widget';
import { AIWorkflowsWidget } from './widgets/ai-workflows-widget';
import { ActivityFeedWidget } from './widgets/activity-feed-widget';

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
}

export function DraggableWidget({ widget, index, isCustomizing, onMove }: DraggableWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

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

  const renderWidget = () => {
    const commonProps = {
      widget,
      isCustomizing,
      onUpdate: (updates: any) => {
        // Handle widget updates
      },
      onRemove: () => {
        // Handle widget removal
      }
    };

    switch (widget.type) {
      case 'system-status':
        return <SystemStatusWidget {...commonProps} />;
      case 'content-performance':
        return <ContentPerformanceWidget {...commonProps} />;
      case 'compliance':
        return <ComplianceWidget {...commonProps} />;
      case 'ai-workflows':
        return <AIWorkflowsWidget {...commonProps} />;
      case 'activity-feed':
        return <ActivityFeedWidget {...commonProps} />;
      default:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {widget.title}
            </h3>
            <p className="text-sm text-gray-500">
              {widget.type} widget
            </p>
          </div>
        );
    }
  };

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
      {renderWidget()}
    </motion.div>
  );
}
