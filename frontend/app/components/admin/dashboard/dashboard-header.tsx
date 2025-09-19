'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Plus, Grid, Bell, User } from 'lucide-react';

interface DashboardHeaderProps {
  onCustomizationToggle: () => void;
  onWidgetLibraryToggle: () => void;
  isCustomizing: boolean;
}

export function DashboardHeader({ 
  onCustomizationToggle, 
  onWidgetLibraryToggle, 
  isCustomizing 
}: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 px-6 py-4"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Healthcare Admin Dashboard
          </h1>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>System Operational</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onWidgetLibraryToggle}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Widget</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCustomizationToggle}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isCustomizing
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>{isCustomizing ? 'Exit Customize' : 'Customize'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <User className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
