/**
 * Notification Types for Admin Interface
 * Healthcare compliance with HIPAA indicators and audit trails
 */

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error' | 'critical';
export type NotificationCategory = 'system' | 'security' | 'data' | 'user' | 'compliance' | 'audit';

export interface HIPAAIndicators {
  containsPHI: boolean;
  auditRequired: boolean;
  retentionPeriod: number; // days
  accessLevel: 'public' | 'internal' | 'restricted' | 'confidential';
}

export interface NotificationSound {
  enabled: boolean;
  type: 'beep' | 'chime' | 'alert' | 'critical' | 'success' | 'error';
  volume: number; // 0-1
}

export interface BaseNotification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  category: NotificationCategory;
  timestamp: Date;
  userId?: string;
  hipaa: HIPAAIndicators;
  sound?: NotificationSound;
  metadata?: Record<string, any>;
}

export interface ToastNotification extends BaseNotification {
  duration: number; // milliseconds, 0 = permanent
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  actionable?: boolean;
  action?: {
    label: string;
    handler: () => void;
    destructive?: boolean;
  };
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
}

export interface AlertNotification extends BaseNotification {
  dismissible: boolean;
  persistent: boolean;
  icon?: string;
  actions?: Array<{
    id: string;
    label: string;
    handler: () => void;
    variant: 'primary' | 'secondary' | 'destructive';
    requiresConfirmation?: boolean;
  }>;
}

export interface BannerNotification extends BaseNotification {
  systemWide: boolean;
  priority: number; // 1-10, higher = more important
  startDate?: Date;
  endDate?: Date;
  targetRoles?: string[];
  dismissible: boolean;
  linkText?: string;
  linkUrl?: string;
}

export interface BadgeNotification {
  id: string;
  count: number;
  severity: NotificationSeverity;
  pulse: boolean;
  label?: string;
  ariaLabel: string;
}

export interface NotificationQueueItem extends BaseNotification {
  priority: number; // 1-10, higher = more important
  retryCount: number;
  maxRetries: number;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

export interface NotificationHistoryItem extends BaseNotification {
  readAt?: Date;
  archivedAt?: Date;
  actions: Array<{
    id: string;
    timestamp: Date;
    action: 'created' | 'read' | 'dismissed' | 'archived' | 'deleted';
    userId?: string;
  }>;
}

export interface NotificationPreferences {
  userId: string;
  sounds: {
    enabled: boolean;
    volume: number;
    criticalOnly: boolean;
  };
  categories: Record<NotificationCategory, {
    enabled: boolean;
    methods: ('toast' | 'email' | 'sms')[];
  }>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
    timezone: string;
    allowCritical: boolean;
  };
  retention: {
    days: number;
    autoArchive: boolean;
  };
}

export interface NotificationContextValue {
  notifications: NotificationHistoryItem[];
  queue: NotificationQueueItem[];
  preferences: NotificationPreferences;
  
  // Methods
  addNotification: (notification: Omit<ToastNotification, 'id' | 'timestamp'>) => string;
  dismissNotification: (id: string) => void;
  archiveNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  
  // Queue management
  processQueue: () => void;
  retryNotification: (id: string) => void;
  
  // Statistics
  getStats: () => {
    total: number;
    unread: number;
    bySeverity: Record<NotificationSeverity, number>;
    byCategory: Record<NotificationCategory, number>;
  };
}