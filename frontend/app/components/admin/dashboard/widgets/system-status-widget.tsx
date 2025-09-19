'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Database, Server, Cpu, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { WidgetProps } from '@/types/admin/dashboard';
import { useDashboard } from '../dashboard-provider';

export function SystemStatusWidget({ widget, isCustomizing }: WidgetProps) {
  const { state } = useDashboard();
  const { systemStatus } = state.realTimeData;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
      case 'down':
      case 'inactive':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
      case 'active':
        return 'text-green-600';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600';
      case 'error':
      case 'down':
      case 'inactive':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <motion.div
      layout
      className={`bg-white rounded-lg border border-gray-200 p-6 h-full ${
        isCustomizing ? 'ring-2 ring-blue-500' : ''
      }`}
      role="region"
      aria-label="System Status Widget"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900" id="system-status-title">System Status</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-500" aria-live="polite">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></div>
          <span>Live</span>
        </div>
      </div>

      <div className="space-y-4" role="list" aria-labelledby="system-status-title">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" role="listitem">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-blue-500" aria-hidden="true" />
            <span className="font-medium text-gray-700">Database</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(systemStatus?.database || 'unknown')}
            <span 
              className={`font-medium ${getStatusColor(systemStatus?.database || 'unknown')}`}
              aria-label={`Database status: ${systemStatus?.database || 'Unknown'}`}
            >
              {systemStatus?.database || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Server className="w-5 h-5 text-green-500" />
            <span className="font-medium text-gray-700">APIs</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(systemStatus?.apis || 'unknown')}
            <span className={`font-medium ${getStatusColor(systemStatus?.apis || 'unknown')}`}>
              {systemStatus?.apis || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Cpu className="w-5 h-5 text-purple-500" />
            <span className="font-medium text-gray-700">AI Agents</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(systemStatus?.aiAgents || 'unknown')}
            <span className={`font-medium ${getStatusColor(systemStatus?.aiAgents || 'unknown')}`}>
              {systemStatus?.aiAgents || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {systemStatus?.lastChecked && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last checked: {new Date(systemStatus.lastChecked).toLocaleTimeString()}
          </p>
        </div>
      )}
    </motion.div>
  );
}
