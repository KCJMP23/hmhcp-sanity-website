'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Play, CheckCircle, AlertCircle, Clock, Activity } from 'lucide-react';
import { WidgetProps } from '@/types/admin/dashboard';
import { useDashboard } from '../dashboard-provider';

export function AIWorkflowsWidget({ widget, isCustomizing }: WidgetProps) {
  const { state } = useDashboard();
  const { aiWorkflows } = state.realTimeData;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'running':
        return 'text-blue-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '< 1m';
    if (diffMins < 60) return `${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
  };

  return (
    <motion.div
      layout
      className={`bg-white rounded-lg border border-gray-200 p-6 h-full ${
        isCustomizing ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Workflows</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Cpu className="w-4 h-4" />
          <span>{aiWorkflows.length} Active</span>
        </div>
      </div>

      <div className="space-y-3">
        {aiWorkflows.length > 0 ? (
          aiWorkflows.map((workflow) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(workflow.status)}
                  <span className="font-medium text-gray-900">{workflow.name}</span>
                </div>
                <span className={`text-xs font-medium ${getStatusColor(workflow.status)}`}>
                  {workflow.status}
                </span>
              </div>
              
              {workflow.status === 'running' && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{workflow.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${workflow.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Duration: {formatDuration(workflow.startTime, workflow.endTime)}</span>
                <span>{new Date(workflow.startTime).toLocaleTimeString()}</span>
              </div>
              
              {workflow.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                  {workflow.error}
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No active workflows</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-green-50 rounded">
            <p className="text-green-600 font-semibold">
              {aiWorkflows.filter(w => w.status === 'completed').length}
            </p>
            <p className="text-gray-500">Completed</p>
          </div>
          <div className="p-2 bg-blue-50 rounded">
            <p className="text-blue-600 font-semibold">
              {aiWorkflows.filter(w => w.status === 'running').length}
            </p>
            <p className="text-gray-500">Running</p>
          </div>
          <div className="p-2 bg-yellow-50 rounded">
            <p className="text-yellow-600 font-semibold">
              {aiWorkflows.filter(w => w.status === 'pending').length}
            </p>
            <p className="text-gray-500">Pending</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
