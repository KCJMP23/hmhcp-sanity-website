'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  Settings,
  Filter,
  Search,
  RefreshCw,
  Trash2,
  Archive,
  MoreVertical
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { AppleButton } from '@/components/ui/apple-button';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'system' | 'user' | 'security' | 'content' | 'analytics';
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock notifications for demonstration
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'Content Published',
        message: 'New blog post "Healthcare Innovation Trends" has been published successfully.',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        read: false,
        category: 'content',
        priority: 'medium',
        actionUrl: '/admin/blog'
      },
      {
        id: '2',
        type: 'warning',
        title: 'High CPU Usage',
        message: 'Server CPU usage has reached 85%. Consider scaling resources.',
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        read: false,
        category: 'system',
        priority: 'high'
      },
      {
        id: '3',
        type: 'info',
        title: 'New User Registration',
        message: 'Dr. Sarah Johnson has completed the onboarding process.',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        read: true,
        category: 'user',
        priority: 'low',
        actionUrl: '/admin/users'
      },
      {
        id: '4',
        type: 'error',
        title: 'Database Connection Issue',
        message: 'Failed to connect to analytics database. Retrying...',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        read: false,
        category: 'system',
        priority: 'high'
      },
      {
        id: '5',
        type: 'success',
        title: 'Backup Completed',
        message: 'Daily backup has been completed successfully. Size: 2.4 GB',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        read: true,
        category: 'system',
        priority: 'low'
      },
      {
        id: '6',
        type: 'warning',
        title: 'Security Alert',
        message: 'Multiple failed login attempts detected from IP 203.0.113.1',
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
        read: false,
        category: 'security',
        priority: 'high',
        actionUrl: '/admin/security'
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="default">Low</Badge>;
      default:
        return <Badge variant="default">{priority}</Badge>;
    }
  };

  const getCategoryBadge = (category: Notification['category']) => {
    const colors = {
      system: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
      security: 'bg-red-100 text-red-800',
      content: 'bg-purple-100 text-purple-800',
      analytics: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[category]}`}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </span>
    );
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = activeFilter === 'all' || notification.category === activeFilter;
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const refreshNotifications = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white hover:shadow-lg transition-all duration-200"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 w-96 z-50"
          >
            <FrostedCard className="shadow-2xl border border-gray-200/50">
              {/* Header */}
              <div className="p-4 border-b border-gray-200/50">
                <div className="flex items-center justify-between mb-3">
                  <Typography variant="heading4" className="text-gray-900">
                    Notifications
                  </Typography>
                  <div className="flex items-center space-x-2">
                    <AppleButton
                      variant="ghost"
                      size="sm"
                      onClick={refreshNotifications}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </AppleButton>
                    <AppleButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </AppleButton>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Categories</option>
                      <option value="system">System</option>
                      <option value="user">User</option>
                      <option value="security">Security</option>
                      <option value="content">Content</option>
                      <option value="analytics">Analytics</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-3">
                  <AppleButton
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </AppleButton>
                  <AppleButton
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                  >
                    Clear all
                  </AppleButton>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <Typography variant="body" className="text-gray-500">
                      No notifications found
                    </Typography>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className={`p-3 rounded-xl mb-2 transition-all duration-200 ${
                          notification.read 
                            ? 'bg-gray-50/50' 
                            : 'bg-blue-50/50 border border-blue-200/50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <Typography variant="label" className="text-gray-900">
                                {notification.title}
                              </Typography>
                              <div className="flex items-center space-x-2">
                                {getPriorityBadge(notification.priority)}
                                {getCategoryBadge(notification.category)}
                              </div>
                            </div>
                            <Typography variant="small" className="text-gray-600 mb-2">
                              {notification.message}
                            </Typography>
                            <div className="flex items-center justify-between">
                              <Typography variant="small" className="text-gray-500">
                                {formatTimestamp(notification.timestamp)}
                              </Typography>
                              <div className="flex items-center space-x-1">
                                {notification.actionUrl && (
                                  <AppleButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      markAsRead(notification.id);
                                      // Navigate to action URL
                                      console.log('Navigate to:', notification.actionUrl);
                                    }}
                                  >
                                    View
                                  </AppleButton>
                                )}
                                <AppleButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  {notification.read ? 'Mark unread' : 'Mark read'}
                                </AppleButton>
                                <AppleButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </AppleButton>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-gray-200/50 bg-gray-50/30">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{filteredNotifications.length} notifications</span>
                  <span>{unreadCount} unread</span>
                </div>
              </div>
            </FrostedCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
