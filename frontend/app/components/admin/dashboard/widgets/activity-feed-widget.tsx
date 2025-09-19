'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, User, Clock, FileText, Workflow, AlertCircle } from 'lucide-react';
import { WidgetProps } from '@/types/admin/dashboard';
import { useDashboard } from '../dashboard-provider';

export function ActivityFeedWidget({ widget, isCustomizing }: WidgetProps) {
  const { state } = useDashboard();
  const { activityFeed } = state.realTimeData;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'content_created':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'workflow_completed':
        return <Workflow className="w-4 h-4 text-green-500" />;
      case 'user_action':
        return <User className="w-4 h-4 text-purple-500" />;
      case 'system_event':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'content_created':
        return 'bg-blue-50 border-blue-200';
      case 'workflow_completed':
        return 'bg-green-50 border-green-200';
      case 'user_action':
        return 'bg-purple-50 border-purple-200';
      case 'system_event':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <motion.div
      layout
      className={`bg-white rounded-lg border border-gray-200 p-6 h-full ${
        isCustomizing ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Activity className="w-4 h-4" />
          <span>{activityFeed.length} Events</span>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {activityFeed.length > 0 ? (
          activityFeed.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-lg border-l-4 ${getActivityColor(activity.type)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.user}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Real-time updates enabled</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
