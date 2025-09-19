'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  MoreVertical,
  Clock,
  Send,
  MessageSquare,
  Shield,
  Users,
  Activity,
  Zap,
  Calendar,
  Phone,
  Mail,
  ChevronDown,
  Eye,
  EyeOff,
  Download,
  Wifi,
  WifiOff,
  UserCheck,
  Lock,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Globe
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { 
  detectPHI,
  sanitizeContent,
  createComplianceAuditEvent,
  ComplianceStandard
} from '@/lib/validation/healthcare-compliance';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { AppleButton } from '@/components/ui/apple-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

// Slack icon component
const SlackIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
);

// Teams icon component
const TeamsIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.5 12.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5 1.5.672 1.5 1.5zm1.5 0c0-1.657-1.343-3-3-3s-3 1.343-3 3v5.5h6v-5.5zm-9 2.5v3h3v-3h-3zm-1.5-3c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5zm6 0c0-1.657-1.343-3-3-3s-3 1.343-3 3v6h6v-6z"/>
  </svg>
);

interface Notification {
  id: string;
  workflowId?: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'critical';
  category: 'workflow' | 'system' | 'compliance' | 'clinical' | 'integration';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  source: 'internal' | 'slack' | 'teams' | 'email' | 'sms' | 'webhook';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    patientId?: string;
    userId?: string;
    workflowName?: string;
    errorCode?: string;
    complianceType?: string;
    phiSanitized?: boolean;
  };
  requiresAction?: boolean;
  expiresAt?: Date;
}

interface IntegrationChannel {
  id: string;
  name: string;
  type: 'slack' | 'teams' | 'email' | 'sms' | 'webhook';
  status: 'connected' | 'disconnected' | 'error';
  config?: {
    webhookUrl?: string;
    channel?: string;
    recipients?: string[];
    apiKey?: string;
  };
  lastSync?: Date;
  messageCount?: number;
}

interface NotificationPreference {
  channel: IntegrationChannel['type'];
  enabled: boolean;
  categories: string[];
  priorities: string[];
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [channels, setChannels] = useState<IntegrationChannel[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [phiProtectionEnabled, setPHIProtectionEnabled] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Mock data generation
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: 'n1',
        workflowId: 'wf1',
        type: 'success',
        category: 'workflow',
        title: 'Workflow Completed',
        message: 'Patient risk stratification completed successfully for cohort A',
        timestamp: new Date(Date.now() - 300000),
        read: false,
        priority: 'normal',
        source: 'internal',
        metadata: {
          workflowName: 'Risk Stratification',
          phiSanitized: true
        }
      },
      {
        id: 'n2',
        type: 'critical',
        category: 'clinical',
        title: 'Critical Lab Result',
        message: 'Abnormal potassium level detected requiring immediate attention',
        timestamp: new Date(Date.now() - 600000),
        read: false,
        priority: 'critical',
        source: 'internal',
        requiresAction: true,
        actionUrl: '/admin/clinical/alerts',
        actionLabel: 'Review Now',
        metadata: {
          patientId: 'PT12345',
          phiSanitized: true
        }
      },
      {
        id: 'n3',
        type: 'warning',
        category: 'compliance',
        title: 'HIPAA Audit Required',
        message: 'Quarterly HIPAA compliance audit is due in 7 days',
        timestamp: new Date(Date.now() - 3600000),
        read: true,
        priority: 'high',
        source: 'slack',
        actionUrl: '/admin/compliance',
        actionLabel: 'Start Audit',
        metadata: {
          complianceType: 'HIPAA'
        },
        expiresAt: new Date(Date.now() + 604800000)
      },
      {
        id: 'n4',
        type: 'info',
        category: 'integration',
        title: 'Teams Integration Active',
        message: 'Microsoft Teams channel successfully connected',
        timestamp: new Date(Date.now() - 7200000),
        read: true,
        priority: 'low',
        source: 'teams'
      },
      {
        id: 'n5',
        workflowId: 'wf2',
        type: 'error',
        category: 'workflow',
        title: 'Workflow Failed',
        message: 'Claims processing workflow encountered an error and requires manual review',
        timestamp: new Date(Date.now() - 1800000),
        read: false,
        priority: 'urgent',
        source: 'internal',
        requiresAction: true,
        actionUrl: '/admin/workflows/wf2',
        actionLabel: 'Investigate',
        metadata: {
          workflowName: 'Claims Processing',
          errorCode: 'CLM_VAL_001'
        }
      }
    ];

    const mockChannels: IntegrationChannel[] = [
      {
        id: 'ch1',
        name: 'Slack Workspace',
        type: 'slack',
        status: 'connected',
        config: {
          webhookUrl: 'https://hooks.slack.com/...',
          channel: '#healthcare-alerts'
        },
        lastSync: new Date(Date.now() - 60000),
        messageCount: 156
      },
      {
        id: 'ch2',
        name: 'Microsoft Teams',
        type: 'teams',
        status: 'connected',
        config: {
          channel: 'Clinical Team'
        },
        lastSync: new Date(Date.now() - 120000),
        messageCount: 89
      },
      {
        id: 'ch3',
        name: 'Email Notifications',
        type: 'email',
        status: 'connected',
        config: {
          recipients: ['admin@healthcare.org', 'alerts@healthcare.org']
        },
        lastSync: new Date(),
        messageCount: 423
      },
      {
        id: 'ch4',
        name: 'SMS Alerts',
        type: 'sms',
        status: 'disconnected',
        config: {
          recipients: ['+1234567890']
        },
        messageCount: 0
      },
      {
        id: 'ch5',
        name: 'Webhook Integration',
        type: 'webhook',
        status: 'error',
        config: {
          webhookUrl: 'https://api.healthcare.org/webhooks/notifications'
        },
        lastSync: new Date(Date.now() - 86400000),
        messageCount: 12
      }
    ];

    const mockPreferences: NotificationPreference[] = [
      {
        channel: 'slack',
        enabled: true,
        categories: ['workflow', 'compliance', 'clinical'],
        priorities: ['high', 'urgent', 'critical'],
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '06:00'
        }
      },
      {
        channel: 'teams',
        enabled: true,
        categories: ['workflow', 'system'],
        priorities: ['urgent', 'critical']
      },
      {
        channel: 'email',
        enabled: true,
        categories: ['compliance', 'clinical'],
        priorities: ['normal', 'high', 'urgent', 'critical']
      },
      {
        channel: 'sms',
        enabled: false,
        categories: ['clinical'],
        priorities: ['critical']
      }
    ];

    setNotifications(mockNotifications);
    setChannels(mockChannels);
    setPreferences(mockPreferences);
  }, []);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    // Simulate WebSocket connection
    const connectWebSocket = () => {
      // In production, connect to actual WebSocket server
      console.log('Connecting to notification WebSocket...');
      setIsConnected(true);

      // Simulate receiving notifications
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          const newNotification: Notification = {
            id: `n${Date.now()}`,
            type: ['success', 'info', 'warning', 'error'][Math.floor(Math.random() * 4)] as Notification['type'],
            category: ['workflow', 'system', 'compliance', 'clinical', 'integration'][Math.floor(Math.random() * 5)] as Notification['category'],
            title: 'New Event',
            message: 'A new event has occurred in the system',
            timestamp: new Date(),
            read: false,
            priority: 'normal',
            source: 'internal'
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          
          if (soundEnabled) {
            // Play notification sound
            playNotificationSound();
          }
          
          if (desktopNotifications && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/icon.png'
            });
          }
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    };

    const cleanup = connectWebSocket();
    return cleanup;
  }, [soundEnabled, desktopNotifications]);

  // Request desktop notification permission
  useEffect(() => {
    if (desktopNotifications && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [desktopNotifications]);

  const playNotificationSound = () => {
    // In production, play actual sound
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {});
  };

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
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />;
    }
  };

  const getChannelIcon = (type: IntegrationChannel['type']) => {
    switch (type) {
      case 'slack':
        return <SlackIcon />;
      case 'teams':
        return <TeamsIcon />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'sms':
        return <Smartphone className="h-5 w-5" />;
      case 'webhook':
        return <Globe className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'urgent':
        return 'text-orange-600 bg-orange-50';
      case 'high':
        return 'text-yellow-600 bg-yellow-50';
      case 'normal':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
    }
  };

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

  const connectChannel = (channelId: string) => {
    setChannels(prev =>
      prev.map(ch =>
        ch.id === channelId
          ? { ...ch, status: 'connected' as const, lastSync: new Date() }
          : ch
      )
    );
  };

  const disconnectChannel = (channelId: string) => {
    setChannels(prev =>
      prev.map(ch =>
        ch.id === channelId
          ? { ...ch, status: 'disconnected' as const }
          : ch
      )
    );
  };

  const updatePreference = (channel: IntegrationChannel['type'], updates: Partial<NotificationPreference>) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.channel === channel
          ? { ...pref, ...updates }
          : pref
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.read).length;

  const filteredNotifications = notifications.filter(notification => {
    const matchesCategory = selectedCategory === 'all' || notification.category === selectedCategory;
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  // Healthcare-specific notification processing
  const processNotificationForChannel = (notification: Notification, channelType: IntegrationChannel['type']) => {
    let processedNotification = { ...notification };
    
    if (phiProtectionEnabled) {
      // Detect PHI in notification content
      const titlePHI = detectPHI(notification.title);
      const messagePHI = detectPHI(notification.message);
      
      if (titlePHI.hasPHI || messagePHI.hasPHI) {
        // Sanitize content for external channels
        if (['slack', 'teams', 'email', 'sms', 'webhook'].includes(channelType)) {
          const sanitizedTitle = sanitizeContent(notification.title);
          const sanitizedMessage = sanitizeContent(notification.message);
          
          processedNotification = {
            ...processedNotification,
            title: sanitizedTitle.sanitized,
            message: sanitizedMessage.sanitized,
            metadata: {
              ...processedNotification.metadata,
              phiSanitized: true,
              originalPHITypes: [...(titlePHI.phiTypes || []), ...(messagePHI.phiTypes || [])]
            }
          };

          // Create audit trail for PHI sanitization
          const auditEvent = createComplianceAuditEvent(
            'phi_sanitization',
            'notification',
            notification.id,
            'HIPAA',
            { passed: true, score: 100, violations: [], summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }, recommendations: [] },
            'system',
            {
              channel: channelType,
              phiTypes: [...(titlePHI.phiTypes || []), ...(messagePHI.phiTypes || [])],
              sanitized: true
            }
          );
        }
      }
    }
    
    return processedNotification;
  };

  const sendNotificationToChannel = async (notification: Notification, channel: IntegrationChannel) => {
    const processedNotification = processNotificationForChannel(notification, channel.type);
    
    // Channel-specific healthcare compliance rules
    const channelPrefs = preferences.find(p => p.channel === channel.type);
    if (!channelPrefs?.enabled) return;
    
    // Skip if category not enabled for this channel
    if (!channelPrefs.categories.includes(notification.category)) return;
    
    // Skip if priority not enabled for this channel
    if (!channelPrefs.priorities.includes(notification.priority)) return;
    
    // Check quiet hours for patient-related notifications
    if (channelPrefs.quietHours?.enabled && notification.metadata?.patientId) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const { start, end } = channelPrefs.quietHours;
      
      if (start <= end ? (currentTime >= start && currentTime <= end) : (currentTime >= start || currentTime <= end)) {
        // Only send critical notifications during quiet hours
        if (notification.priority !== 'critical') return;
      }
    }
    
    console.log(`Sending notification to ${channel.name}:`, processedNotification);
    
    // Simulate channel-specific sending
    switch (channel.type) {
      case 'slack':
        // Send to Slack webhook
        break;
      case 'teams':
        // Send to Teams webhook
        break;
      case 'email':
        // Send email
        break;
      case 'sms':
        // Send SMS (only for critical patient notifications)
        if (notification.category === 'clinical' && notification.priority === 'critical') {
          // Send SMS
        }
        break;
      case 'webhook':
        // Send to custom webhook
        break;
    }
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
            className={`absolute -top-1 -right-1 w-5 h-5 ${criticalCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'} text-white text-xs rounded-full flex items-center justify-center font-medium`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
        {!isConnected && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white" />
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
            className="absolute right-0 top-12 w-[480px] max-h-[600px] z-50"
          >
            <FrostedCard className="shadow-2xl border border-gray-200/50 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-200/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Typography variant="heading4" className="text-gray-900">
                      Notifications
                    </Typography>
                    <div className="flex items-center space-x-2">
                      {isConnected ? (
                        <Badge variant="secondary" className="text-xs">
                          <Wifi className="h-3 w-3 mr-1" />
                          Live
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <WifiOff className="h-3 w-3 mr-1" />
                          Offline
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AppleButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                    >
                      {soundEnabled ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
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

                {/* Quick Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AppleButton
                      variant="outline"
                      size="sm"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      Mark all read
                    </AppleButton>
                    <AppleButton
                      variant="outline"
                      size="sm"
                      onClick={clearAll}
                      disabled={notifications.length === 0}
                    >
                      Clear all
                    </AppleButton>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full bg-gray-50/50 rounded-none border-b border-gray-200/50">
                  <TabsTrigger value="notifications" className="flex-1">
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="channels" className="flex-1">
                    Channels
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex-1">
                    Preferences
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="notifications" className="p-0 max-h-[400px] overflow-y-auto">
                  {/* Filters */}
                  <div className="p-3 border-b border-gray-200/50 bg-gray-50/30">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search notifications..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All</option>
                        <option value="workflow">Workflow</option>
                        <option value="clinical">Clinical</option>
                        <option value="compliance">Compliance</option>
                        <option value="system">System</option>
                        <option value="integration">Integration</option>
                      </select>
                    </div>
                  </div>

                  {/* Notifications List */}
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
                          className={`p-3 rounded-lg mb-2 transition-all duration-200 ${
                            notification.read
                              ? 'bg-gray-50/50'
                              : notification.priority === 'critical'
                              ? 'bg-red-50/50 border border-red-200/50'
                              : 'bg-blue-50/50 border border-blue-200/50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <Typography variant="label" className="text-gray-900">
                                    {notification.title}
                                  </Typography>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {notification.category}
                                    </Badge>
                                    <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                      {notification.priority}
                                    </Badge>
                                    {notification.metadata?.phiSanitized && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Lock className="h-3 w-3 mr-1" />
                                        PHI Safe
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <AppleButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <X className="h-3 w-3" />
                                </AppleButton>
                              </div>
                              
                              <Typography variant="small" className="text-gray-600 mb-2">
                                {notification.message}
                              </Typography>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Typography variant="small" className="text-gray-500">
                                    {formatTimestamp(notification.timestamp)}
                                  </Typography>
                                  <div className="flex items-center space-x-1 text-gray-500">
                                    {notification.source === 'slack' && <SlackIcon />}
                                    {notification.source === 'teams' && <TeamsIcon />}
                                    {notification.source === 'email' && <Mail className="h-3 w-3" />}
                                    {notification.source === 'sms' && <Smartphone className="h-3 w-3" />}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {notification.actionUrl && (
                                    <AppleButton
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        markAsRead(notification.id);
                                        console.log('Navigate to:', notification.actionUrl);
                                      }}
                                    >
                                      {notification.actionLabel || 'View'}
                                    </AppleButton>
                                  )}
                                  {!notification.read && (
                                    <AppleButton
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notification.id)}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </AppleButton>
                                  )}
                                </div>
                              </div>

                              {notification.expiresAt && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="h-3 w-3 text-yellow-600" />
                                    <Typography variant="small" className="text-yellow-800">
                                      Expires {new Date(notification.expiresAt).toLocaleDateString()}
                                    </Typography>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="channels" className="p-4 space-y-4">
                  {/* Integration Channels */}
                  {channels.map(channel => (
                    <FrostedCard key={channel.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getChannelIcon(channel.type)}
                          <div>
                            <Typography variant="label" className="text-gray-900">
                              {channel.name}
                            </Typography>
                            <Typography variant="small" className="text-gray-600">
                              {channel.messageCount} messages sent
                            </Typography>
                          </div>
                        </div>
                        <Badge
                          variant={
                            channel.status === 'connected'
                              ? 'secondary'
                              : channel.status === 'error'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {channel.status}
                        </Badge>
                      </div>

                      {channel.config && (
                        <div className="space-y-2 mb-3">
                          {channel.config.channel && (
                            <div className="flex items-center space-x-2 text-sm">
                              <MessageSquare className="h-3 w-3 text-gray-400" />
                              <Typography variant="small" className="text-gray-600">
                                {channel.config.channel}
                              </Typography>
                            </div>
                          )}
                          {channel.config.recipients && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Users className="h-3 w-3 text-gray-400" />
                              <Typography variant="small" className="text-gray-600">
                                {channel.config.recipients.join(', ')}
                              </Typography>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {channel.lastSync && (
                          <Typography variant="small" className="text-gray-500">
                            Last sync: {formatTimestamp(channel.lastSync)}
                          </Typography>
                        )}
                        <div className="flex items-center space-x-2">
                          {channel.status === 'connected' ? (
                            <AppleButton
                              variant="outline"
                              size="sm"
                              onClick={() => disconnectChannel(channel.id)}
                            >
                              Disconnect
                            </AppleButton>
                          ) : (
                            <AppleButton
                              variant="primary"
                              size="sm"
                              onClick={() => connectChannel(channel.id)}
                            >
                              Connect
                            </AppleButton>
                          )}
                          <AppleButton variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </AppleButton>
                        </div>
                      </div>
                    </FrostedCard>
                  ))}

                  {/* Add Channel Button */}
                  <AppleButton variant="outline" className="w-full">
                    <Globe className="h-4 w-4 mr-2" />
                    Add Integration Channel
                  </AppleButton>
                </TabsContent>

                <TabsContent value="preferences" className="p-4 space-y-4">
                  {/* Notification Preferences */}
                  <div className="space-y-4">
                    {preferences.map(pref => {
                      const channel = channels.find(ch => ch.type === pref.channel);
                      return (
                        <FrostedCard key={pref.channel} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {channel && getChannelIcon(channel.type)}
                              <Typography variant="label" className="text-gray-900 capitalize">
                                {pref.channel} Notifications
                              </Typography>
                            </div>
                            <Switch
                              checked={pref.enabled}
                              onCheckedChange={(enabled) =>
                                updatePreference(pref.channel, { enabled })
                              }
                            />
                          </div>

                          {pref.enabled && (
                            <div className="space-y-3">
                              <div>
                                <Typography variant="small" className="text-gray-700 mb-2">
                                  Categories
                                </Typography>
                                <div className="flex flex-wrap gap-2">
                                  {['workflow', 'clinical', 'compliance', 'system', 'integration'].map(cat => (
                                    <Badge
                                      key={cat}
                                      variant={pref.categories.includes(cat) ? 'secondary' : 'outline'}
                                      className="cursor-pointer"
                                      onClick={() => {
                                        const categories = pref.categories.includes(cat)
                                          ? pref.categories.filter(c => c !== cat)
                                          : [...pref.categories, cat];
                                        updatePreference(pref.channel, { categories });
                                      }}
                                    >
                                      {cat}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Typography variant="small" className="text-gray-700 mb-2">
                                  Priority Levels
                                </Typography>
                                <div className="flex flex-wrap gap-2">
                                  {['low', 'normal', 'high', 'urgent', 'critical'].map(priority => (
                                    <Badge
                                      key={priority}
                                      variant={pref.priorities.includes(priority) ? 'secondary' : 'outline'}
                                      className="cursor-pointer"
                                      onClick={() => {
                                        const priorities = pref.priorities.includes(priority)
                                          ? pref.priorities.filter(p => p !== priority)
                                          : [...pref.priorities, priority];
                                        updatePreference(pref.channel, { priorities });
                                      }}
                                    >
                                      {priority}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {pref.quietHours && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Typography variant="small" className="text-gray-700">
                                      Quiet Hours
                                    </Typography>
                                    <Switch
                                      checked={pref.quietHours.enabled}
                                      onCheckedChange={(enabled) =>
                                        updatePreference(pref.channel, {
                                          quietHours: { ...pref.quietHours, enabled }
                                        })
                                      }
                                    />
                                  </div>
                                  {pref.quietHours.enabled && (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="time"
                                        value={pref.quietHours.start}
                                        className="px-2 py-1 border border-gray-200 rounded text-sm"
                                        onChange={(e) =>
                                          updatePreference(pref.channel, {
                                            quietHours: { ...pref.quietHours, start: e.target.value }
                                          })
                                        }
                                      />
                                      <span className="text-gray-500">to</span>
                                      <input
                                        type="time"
                                        value={pref.quietHours.end}
                                        className="px-2 py-1 border border-gray-200 rounded text-sm"
                                        onChange={(e) =>
                                          updatePreference(pref.channel, {
                                            quietHours: { ...pref.quietHours, end: e.target.value }
                                          })
                                        }
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </FrostedCard>
                      );
                    })}
                  </div>

                  {/* Global Settings */}
                  <FrostedCard className="p-4">
                    <Typography variant="label" className="text-gray-900 mb-3">
                      Global Settings
                    </Typography>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="desktop-notifications" className="text-sm">
                          Desktop Notifications
                        </Label>
                        <Switch
                          id="desktop-notifications"
                          checked={desktopNotifications}
                          onCheckedChange={setDesktopNotifications}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sound-enabled" className="text-sm">
                          Notification Sounds
                        </Label>
                        <Switch
                          id="sound-enabled"
                          checked={soundEnabled}
                          onCheckedChange={setSoundEnabled}
                        />
                      </div>
                    </div>
                  </FrostedCard>
                </TabsContent>
              </Tabs>

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