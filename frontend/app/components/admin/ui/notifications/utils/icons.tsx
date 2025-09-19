/**
 * Healthcare-compliant notification icons
 * Accessibility-focused with proper ARIA labels
 */

import { AlertTriangle, CheckCircle, Info, Shield, X, Clock, Users, Database, FileText, Lock } from 'lucide-react';
import type { NotificationSeverity, NotificationCategory } from '../types';

// Severity icon mapping
export const getSeverityIcon = (severity: NotificationSeverity) => {
  switch (severity) {
    case 'success':
      return CheckCircle;
    case 'info':
      return Info;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return X;
    case 'critical':
      return Shield;
    default:
      return Info;
  }
};

// Category icon mapping
export const getCategoryIcon = (category: NotificationCategory) => {
  switch (category) {
    case 'system':
      return Database;
    case 'security':
      return Shield;
    case 'data':
      return Database;
    case 'user':
      return Users;
    case 'compliance':
      return FileText;
    case 'audit':
      return Lock;
    default:
      return Info;
  }
};

// Severity colors (Tailwind-compatible)
export const getSeverityColors = (severity: NotificationSeverity) => {
  switch (severity) {
    case 'success':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-800 dark:text-emerald-200',
        icon: 'text-emerald-600 dark:text-emerald-400',
        accent: 'bg-emerald-500',
      };
    case 'info':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        icon: 'text-blue-600 dark:text-blue-400',
        accent: 'bg-blue-500',
      };
    case 'warning':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-800 dark:text-amber-200',
        icon: 'text-amber-600 dark:text-amber-400',
        accent: 'bg-amber-500',
      };
    case 'error':
      return {
        bg: 'bg-red-50 dark:bg-red-950',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        icon: 'text-red-600 dark:text-red-400',
        accent: 'bg-red-500',
      };
    case 'critical':
      return {
        bg: 'bg-red-100 dark:bg-red-900',
        border: 'border-red-300 dark:border-red-700',
        text: 'text-red-900 dark:text-red-100',
        icon: 'text-red-700 dark:text-red-300',
        accent: 'bg-red-600',
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-950',
        border: 'border-gray-200 dark:border-gray-800',
        text: 'text-gray-800 dark:text-gray-200',
        icon: 'text-gray-600 dark:text-gray-400',
        accent: 'bg-gray-500',
      };
  }
};

// HIPAA compliance indicators
export const HIPAAIndicator = ({ containsPHI, auditRequired }: { containsPHI: boolean; auditRequired: boolean }) => {
  if (!containsPHI && !auditRequired) return null;

  return (
    <div className="flex items-center gap-1 ml-2">
      {containsPHI && (
        <span 
          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          title="Contains Protected Health Information"
          aria-label="PHI Indicator"
        >
          PHI
        </span>
      )}
      {auditRequired && (
        <span 
          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
          title="Audit Trail Required"
          aria-label="Audit Required Indicator"
        >
          AUDIT
        </span>
      )}
    </div>
  );
};

// Accessibility helpers
export const getSeverityAriaLabel = (severity: NotificationSeverity): string => {
  switch (severity) {
    case 'success':
      return 'Success notification';
    case 'info':
      return 'Information notification';
    case 'warning':
      return 'Warning notification';
    case 'error':
      return 'Error notification';
    case 'critical':
      return 'Critical alert notification';
    default:
      return 'Notification';
  }
};

export const getCategoryAriaLabel = (category: NotificationCategory): string => {
  switch (category) {
    case 'system':
      return 'System notification';
    case 'security':
      return 'Security notification';
    case 'data':
      return 'Data notification';
    case 'user':
      return 'User notification';
    case 'compliance':
      return 'Compliance notification';
    case 'audit':
      return 'Audit notification';
    default:
      return 'General notification';
  }
};

// Priority indicators
export const PriorityIndicator = ({ priority }: { priority: number }) => {
  const getColor = () => {
    if (priority >= 8) return 'bg-red-500';
    if (priority >= 6) return 'bg-amber-500';
    if (priority >= 4) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getLabel = () => {
    if (priority >= 8) return 'High Priority';
    if (priority >= 6) return 'Medium Priority';
    if (priority >= 4) return 'Normal Priority';
    return 'Low Priority';
  };

  return (
    <div className="flex items-center gap-1">
      <div 
        className={`w-2 h-2 rounded-full ${getColor()}`}
        aria-label={getLabel()}
        title={getLabel()}
      />
      <span className="sr-only">{getLabel()}</span>
    </div>
  );
};

// Timestamp formatting for healthcare compliance
export const formatNotificationTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  // For healthcare compliance, show exact timestamp for older notifications
  return timestamp.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: timestamp.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};