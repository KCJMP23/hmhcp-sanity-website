// User Activity Widget Component
// Story 4.5: Real-Time Analytics & Monitoring

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Activity, 
  Clock,
  User,
  UserCheck,
  UserX
} from 'lucide-react';

import { UserActivityWidgetProps, UserType } from '@/types/monitoring';

export function UserActivityWidget({ 
  userType, 
  activityData, 
  timeRange 
}: UserActivityWidgetProps) {
  const activityStats = useMemo(() => {
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }[timeRange];

    const filteredData = activityData.filter(event => {
      const eventTime = new Date(event.created_at);
      return now.getTime() - eventTime.getTime() <= timeRangeMs;
    });

    const uniqueUsers = new Set(filteredData.map(e => e.user_id)).size;
    const uniqueSessions = new Set(filteredData.map(e => e.session_id)).size;
    const totalEvents = filteredData.length;

    // Group by event type
    const eventTypeCounts = filteredData.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by user type
    const userTypeCounts = filteredData.reduce((acc, event) => {
      acc[event.user_type] = (acc[event.user_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Most active pages
    const pageCounts = filteredData.reduce((acc, event) => {
      if (event.page_path) {
        acc[event.page_path] = (acc[event.page_path] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topPages = Object.entries(pageCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      uniqueUsers,
      uniqueSessions,
      totalEvents,
      eventTypeCounts,
      userTypeCounts,
      topPages
    };
  }, [activityData, timeRange]);

  const getUserTypeIcon = (type: UserType) => {
    switch (type) {
      case UserType.HEALTHCARE_PROFESSIONAL:
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      case UserType.ADMIN:
        return <User className="w-4 h-4 text-purple-500" />;
      case UserType.PATIENT:
        return <UserX className="w-4 h-4 text-green-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getUserTypeColor = (type: UserType) => {
    switch (type) {
      case UserType.HEALTHCARE_PROFESSIONAL:
        return 'bg-blue-100 text-blue-800';
      case UserType.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserType.PATIENT:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="w-4 h-4 text-gray-500 mr-1" />
            <span className="text-sm text-gray-600">Users</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {activityStats.uniqueUsers}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Activity className="w-4 h-4 text-gray-500 mr-1" />
            <span className="text-sm text-gray-600">Sessions</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {activityStats.uniqueSessions}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-gray-500 mr-1" />
            <span className="text-sm text-gray-600">Events</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {activityStats.totalEvents}
          </div>
        </div>
      </div>

      {/* User Type Distribution */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">User Types</h4>
        <div className="space-y-2">
          {Object.entries(activityStats.userTypeCounts).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getUserTypeIcon(type as UserType)}
                <span className="text-sm text-gray-600 capitalize">
                  {type.replace('_', ' ')}
                </span>
              </div>
              <Badge className={getUserTypeColor(type as UserType)}>
                {count}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Event Types */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Event Types</h4>
        <div className="space-y-1">
          {Object.entries(activityStats.eventTypeCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([eventType, count]) => (
              <div key={eventType} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 capitalize">
                  {eventType.replace('_', ' ')}
                </span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Top Pages */}
      {activityStats.topPages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Top Pages</h4>
          <div className="space-y-1">
            {activityStats.topPages.map(([page, count]) => (
              <div key={page} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate max-w-[200px]">
                  {page}
                </span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Range Info */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
        Showing data for last {timeRange === '1h' ? 'hour' : timeRange === '24h' ? '24 hours' : '7 days'}
      </div>
    </div>
  );
}
