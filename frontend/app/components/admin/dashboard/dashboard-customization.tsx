'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Grid, Eye, EyeOff, Trash2, Settings } from 'lucide-react';
import { useDashboard } from './dashboard-provider';

export function DashboardCustomization() {
  const { state, dispatch, toggleWidgetVisibility, removeWidget } = useDashboard();
  const { widgets, customization } = state;

  const handleToggleGrid = () => {
    dispatch({ type: 'TOGGLE_GRID' });
  };

  const handleWidgetVisibilityToggle = (widgetId: string) => {
    toggleWidgetVisibility(widgetId);
  };

  const handleWidgetRemove = (widgetId: string) => {
    removeWidget(widgetId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Dashboard Customization
        </h3>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleGrid}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              customization.showGrid
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Show Grid</span>
          </motion.button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Configure Widgets
        </h4>
        
        {widgets.map((widget) => (
          <motion.div
            key={widget.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <h5 className="font-medium text-gray-900">{widget.title}</h5>
                <p className="text-sm text-gray-500">
                  {widget.position.w} × {widget.position.h} • {widget.type}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleWidgetVisibilityToggle(widget.id)}
                className={`p-2 rounded-lg transition-colors ${
                  widget.visible
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={widget.visible ? 'Hide widget' : 'Show widget'}
              >
                {widget.visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Widget settings"
              >
                <Settings className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleWidgetRemove(widget.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove widget"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        ))}

        {widgets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No widgets configured. Add widgets from the widget library.</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Dashboard configuration is automatically saved</span>
          <span>{widgets.length} widget{widgets.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </motion.div>
  );
}
