'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDashboard } from './dashboard-provider';
import { SystemStatusWidget } from './widgets/system-status-widget';
import { ContentPerformanceWidget } from './widgets/content-performance-widget';
import { ComplianceWidget } from './widgets/compliance-widget';
import { AIWorkflowsWidget } from './widgets/ai-workflows-widget';
import { ActivityFeedWidget } from './widgets/activity-feed-widget';
import { DraggableWidget } from './draggable-widget';

export function DashboardGrid() {
  const { state, reorderWidgets } = useDashboard();
  const { widgets, customization } = state;

  const moveWidget = (dragIndex: number, hoverIndex: number) => {
    const draggedWidget = widgets[dragIndex];
    const newWidgets = [...widgets];
    newWidgets.splice(dragIndex, 1);
    newWidgets.splice(hoverIndex, 0, draggedWidget);
    reorderWidgets(newWidgets);
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {widgets
            .filter(widget => widget.visible)
            .map((widget, index) => (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                index={index}
                isCustomizing={customization.isCustomizing}
                onMove={moveWidget}
              />
            ))}
        </div>

        {widgets.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No widgets configured
            </h3>
            <p className="text-gray-500 mb-4">
              Add widgets to start monitoring your healthcare platform
            </p>
          </motion.div>
        )}
      </div>
    </DndProvider>
  );
}
