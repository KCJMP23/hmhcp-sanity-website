/**
 * AdminBadge - Status indicator badges with notification counts
 * Healthcare compliant with ARIA labels and screen reader support
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import type { BadgeNotification } from './types';
import { getSeverityColors } from './utils/icons';

interface AdminBadgeProps {
  notification: BadgeNotification;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dot' | 'pill' | 'compact';
  showCount?: boolean;
  maxCount?: number;
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({
  notification,
  onClick,
  className = '',
  size = 'md',
  variant = 'default',
  showCount = true,
  maxCount = 99,
}) => {
  const colors = getSeverityColors(notification.severity);
  
  const formatCount = (count: number): string => {
    if (count <= maxCount) return count.toString();
    return `${maxCount}+`;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          badge: 'h-4 min-w-4 text-xs px-1',
          dot: 'w-2 h-2',
          text: 'text-xs',
        };
      case 'lg':
        return {
          badge: 'h-8 min-w-8 text-base px-3',
          dot: 'w-4 h-4',
          text: 'text-base',
        };
      default: // md
        return {
          badge: 'h-6 min-w-6 text-sm px-2',
          dot: 'w-3 h-3',
          text: 'text-sm',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && onClick) {
      event.preventDefault();
      onClick();
    }
  };

  // Don't render if count is 0 and not showing zero counts
  if (notification.count <= 0 && variant !== 'dot') {
    return null;
  }

  const badgeContent = () => {
    switch (variant) {
      case 'dot':
        return (
          <motion.div
            className={`
              rounded-full ${colors.accent} ${sizeClasses.dot}
              ${notification.pulse ? 'animate-pulse' : ''}
              ${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
            `}
            whileHover={onClick ? { scale: 1.1 } : {}}
            whileTap={onClick ? { scale: 0.95 } : {}}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={notification.ariaLabel}
            title={notification.label}
          />
        );

      case 'pill':
        return (
          <motion.div
            className={`
              inline-flex items-center gap-1 rounded-full px-2 py-1
              ${colors.bg} ${colors.border} border
              ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
            `}
            whileHover={onClick ? { scale: 1.02 } : {}}
            whileTap={onClick ? { scale: 0.98 } : {}}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={notification.ariaLabel}
          >
            <div className={`w-2 h-2 rounded-full ${colors.accent} ${notification.pulse ? 'animate-pulse' : ''}`} />
            {showCount && (
              <span className={`${colors.text} ${sizeClasses.text} font-medium`}>
                {formatCount(notification.count)}
              </span>
            )}
            {notification.label && (
              <span className={`${colors.text} ${sizeClasses.text}`}>
                {notification.label}
              </span>
            )}
          </motion.div>
        );

      case 'compact':
        return (
          <motion.div
            className={`
              inline-flex items-center justify-center rounded ${sizeClasses.badge}
              ${colors.accent} text-white font-semibold
              ${notification.pulse ? 'animate-pulse' : ''}
              ${onClick ? 'cursor-pointer hover:brightness-110 transition-all' : ''}
            `}
            whileHover={onClick ? { scale: 1.05 } : {}}
            whileTap={onClick ? { scale: 0.95 } : {}}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={notification.ariaLabel}
            title={notification.label}
          >
            {showCount ? formatCount(notification.count) : '•'}
          </motion.div>
        );

      default: // 'default'
        return (
          <motion.div
            className={`
              relative inline-flex items-center
              ${onClick ? 'cursor-pointer' : ''}
            `}
            whileHover={onClick ? { scale: 1.02 } : {}}
            whileTap={onClick ? { scale: 0.98 } : {}}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={notification.ariaLabel}
          >
            {notification.label && (
              <span className={`${colors.text} ${sizeClasses.text} mr-1`}>
                {notification.label}
              </span>
            )}
            
            <Badge 
              className={`
                ${sizeClasses.badge} ${colors.accent} text-white border-0
                ${notification.pulse ? 'animate-pulse' : ''}
                ${onClick ? 'hover:brightness-110 transition-all' : ''}
              `}
            >
              {showCount ? formatCount(notification.count) : ''}
            </Badge>

            {/* Pulse ring for critical notifications */}
            {notification.pulse && notification.severity === 'critical' && (
              <span className="absolute -inset-1 rounded-full border-2 border-red-400 animate-ping opacity-50" />
            )}
          </motion.div>
        );
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      {badgeContent()}
    </div>
  );
};

// Specialized badges for common healthcare scenarios
export const HIPAABadge: React.FC<{
  count: number;
  onClick?: () => void;
  className?: string;
}> = ({ count, onClick, className }) => (
  <AdminBadge
    notification={{
      id: 'hipaa-badge',
      count,
      severity: 'warning',
      pulse: count > 0,
      label: 'PHI',
      ariaLabel: `${count} notifications containing Protected Health Information`,
    }}
    onClick={onClick}
    className={className}
    variant="pill"
    size="sm"
  />
);

export const AuditBadge: React.FC<{
  count: number;
  onClick?: () => void;
  className?: string;
}> = ({ count, onClick, className }) => (
  <AdminBadge
    notification={{
      id: 'audit-badge',
      count,
      severity: 'info',
      pulse: count > 5,
      label: 'Audit',
      ariaLabel: `${count} notifications requiring audit trail`,
    }}
    onClick={onClick}
    className={className}
    variant="pill"
    size="sm"
  />
);

export const CriticalAlertBadge: React.FC<{
  count: number;
  onClick?: () => void;
  className?: string;
}> = ({ count, onClick, className }) => (
  <AdminBadge
    notification={{
      id: 'critical-badge',
      count,
      severity: 'critical',
      pulse: true,
      ariaLabel: `${count} critical alerts requiring immediate attention`,
    }}
    onClick={onClick}
    className={className}
    variant="compact"
    size="md"
  />
);

export const SystemStatusBadge: React.FC<{
  status: 'online' | 'warning' | 'error' | 'maintenance';
  onClick?: () => void;
  className?: string;
}> = ({ status, onClick, className }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return { severity: 'success' as const, pulse: false, label: 'Online' };
      case 'warning':
        return { severity: 'warning' as const, pulse: true, label: 'Warning' };
      case 'error':
        return { severity: 'error' as const, pulse: true, label: 'Error' };
      case 'maintenance':
        return { severity: 'info' as const, pulse: false, label: 'Maintenance' };
    }
  };

  const config = getStatusConfig();

  return (
    <AdminBadge
      notification={{
        id: 'system-status-badge',
        count: 1,
        severity: config.severity,
        pulse: config.pulse,
        label: config.label,
        ariaLabel: `System status: ${config.label}`,
      }}
      onClick={onClick}
      className={className}
      variant="dot"
      showCount={false}
    />
  );
};

export default AdminBadge;