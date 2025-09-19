/**
 * Notification System Components
 * Healthcare compliant admin interface notifications with HIPAA indicators
 */

// Core Components
export { default as AdminToast } from './AdminToast';
export { default as AdminAlert } from './AdminAlert';
export { default as AdminBanner } from './AdminBanner';
export { default as AdminBadge, HIPAABadge, AuditBadge, CriticalAlertBadge, SystemStatusBadge } from './AdminBadge';
export { default as NotificationQueue } from './NotificationQueue';
export { default as NotificationHistory } from './NotificationHistory';

// Types
export type * from './types';

// Utilities
export { notificationAudio } from './utils/audio';
export {
  getSeverityIcon,
  getCategoryIcon,
  getSeverityColors,
  HIPAAIndicator,
  getSeverityAriaLabel,
  getCategoryAriaLabel,
  PriorityIndicator,
  formatNotificationTime,
} from './utils/icons';

// Re-export commonly used types for convenience
export type {
  NotificationSeverity,
  NotificationCategory,
  BaseNotification,
  ToastNotification,
  AlertNotification,
  BannerNotification,
  BadgeNotification,
  NotificationQueueItem,
  NotificationHistoryItem,
  NotificationPreferences,
  NotificationContextValue,
  HIPAAIndicators,
  NotificationSound,
} from './types';