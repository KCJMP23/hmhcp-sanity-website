'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, BarChart3, Shield, Cpu, Activity, TrendingUp } from 'lucide-react';
import { useDashboard } from './dashboard-provider';

interface WidgetLibraryProps {
  onClose: () => void;
}

const availableWidgets = [
  {
    type: 'system-status',
    title: 'System Status',
    description: 'Monitor database, APIs, and AI agent health',
    icon: Cpu,
    color: 'bg-green-500'
  },
  {
    type: 'content-performance',
    title: 'Content Performance',
    description: 'Track blog post views, engagement, and metrics',
    icon: BarChart3,
    color: 'bg-blue-500'
  },
  {
    type: 'compliance',
    title: 'Healthcare Compliance',
    description: 'Monitor HIPAA, FDA compliance status',
    icon: Shield,
    color: 'bg-purple-500'
  },
  {
    type: 'ai-workflows',
    title: 'AI Workflows',
    description: 'Track AI agent workflows and execution status',
    icon: Activity,
    color: 'bg-orange-500'
  },
  {
    type: 'activity-feed',
    title: 'Activity Feed',
    description: 'Recent user actions and system events',
    icon: TrendingUp,
    color: 'bg-indigo-500'
  }
];

export function WidgetLibrary({ onClose }: WidgetLibraryProps) {
  const { addWidget } = useDashboard();

  const handleAddWidget = (widgetType: string) => {
    const widget = {
      type: widgetType as any,
      title: availableWidgets.find(w => w.type === widgetType)?.title || 'Widget',
      position: { x: 0, y: 0, w: 4, h: 3 },
      config: {},
      visible: true
    };

    addWidget(widget);
    onClose();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Widget Library</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableWidgets.map((widget) => {
          const Icon = widget.icon;
          return (
            <motion.div
              key={widget.type}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAddWidget(widget.type)}
              className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-lg ${widget.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {widget.title}
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                {widget.description}
              </p>
              <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                <span>Click to add</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
