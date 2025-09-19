/**
 * AdminBanner - System-wide messages banner
 * Healthcare compliant with scheduling and role-based targeting
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Calendar, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BannerNotification } from './types';
import { 
  getSeverityIcon, 
  getSeverityColors, 
  HIPAAIndicator, 
  formatNotificationTime, 
  PriorityIndicator 
} from './utils/icons';
import { notificationAudio } from './utils/audio';

interface AdminBannerProps {
  notification: BannerNotification;
  onDismiss?: (id: string) => void;
  onLinkClick?: (id: string, url: string) => void;
  userRoles?: string[];
  className?: string;
  position?: 'top' | 'bottom';
}

export const AdminBanner: React.FC<AdminBannerProps> = ({
  notification,
  onDismiss,
  onLinkClick,
  userRoles = [],
  className = '',
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const SeverityIcon = getSeverityIcon(notification.severity);
  const colors = getSeverityColors(notification.severity);

  // Check if banner should be visible
  useEffect(() => {
    const now = new Date();
    const isWithinSchedule = (!notification.startDate || now >= notification.startDate) &&
                            (!notification.endDate || now <= notification.endDate);
    
    const hasRequiredRole = !notification.targetRoles || 
                           notification.targetRoles.length === 0 ||
                           notification.targetRoles.some(role => userRoles.includes(role));
    
    setIsVisible(isWithinSchedule && hasRequiredRole);
  }, [notification.startDate, notification.endDate, notification.targetRoles, userRoles]);

  // Update time remaining
  useEffect(() => {
    if (!notification.endDate || !isVisible) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = notification.endDate!.getTime() - now.getTime();
      
      if (diff <= 0) {
        setIsVisible(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [notification.endDate, isVisible]);

  // Play sound for high priority banners
  useEffect(() => {
    if (isVisible && notification.priority >= 8 && notification.systemWide) {
      notificationAudio.playSound(notification.severity, 0.2);
    }
  }, [isVisible, notification.priority, notification.systemWide, notification.severity]);

  const handleDismiss = () => {
    if (!notification.dismissible) return;
    
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.(notification.id);
    }, 300);
  };

  const handleLinkClick = () => {
    if (notification.linkUrl) {
      onLinkClick?.(notification.id, notification.linkUrl);
      window.open(notification.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getPositionClasses = () => {
    return position === 'top' 
      ? 'top-0 left-0 right-0' 
      : 'bottom-0 left-0 right-0';
  };

  const getAnimationProps = () => {
    return position === 'top'
      ? {
          initial: { y: -100, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: -100, opacity: 0 },
        }
      : {
          initial: { y: 100, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: 100, opacity: 0 },
        };
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        {...getAnimationProps()}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`
          fixed ${getPositionClasses()} z-40 border-b shadow-lg backdrop-blur-sm
          ${colors.bg} ${colors.border}
          ${className}
        `}
        role="banner"
        aria-live={notification.severity === 'critical' ? 'assertive' : 'polite'}
        aria-atomic="true"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Left side - Icon and content */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <SeverityIcon className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
                <PriorityIndicator priority={notification.priority} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`text-sm font-semibold ${colors.text}`}>
                    {notification.title}
                  </h3>
                  
                  <HIPAAIndicator 
                    containsPHI={notification.hipaa.containsPHI}
                    auditRequired={notification.hipaa.auditRequired}
                  />
                  
                  {notification.systemWide && (
                    <Badge variant="secondary" className="text-xs">
                      System-wide
                    </Badge>
                  )}
                  
                  {notification.targetRoles && notification.targetRoles.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      {notification.targetRoles.join(', ')}
                    </Badge>
                  )}
                </div>
                
                <p className={`text-sm ${colors.text} mt-1 line-clamp-2`}>
                  {notification.message}
                </p>
              </div>
            </div>

            {/* Center - Time info */}
            {(timeRemaining || notification.startDate) && (
              <div className={`flex items-center gap-4 mx-4 text-xs ${colors.text} opacity-75`}>
                {notification.startDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Started {formatNotificationTime(notification.startDate)}</span>
                  </div>
                )}
                
                {timeRemaining && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{timeRemaining} remaining</span>
                  </div>
                )}
              </div>
            )}

            {/* Right side - Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {notification.linkText && notification.linkUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLinkClick}
                  className={`text-xs ${colors.text} border-current hover:bg-current/10`}
                >
                  {notification.linkText}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              )}
              
              {notification.dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className={`${colors.icon} hover:bg-black/5 h-6 w-6 p-0 rounded-md`}
                  aria-label="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar for scheduled banners */}
          {notification.startDate && notification.endDate && (
            <div className="pb-1">
              <div className="h-1 bg-black/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${colors.accent} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${Math.max(0, Math.min(100, 
                      ((new Date().getTime() - notification.startDate.getTime()) / 
                       (notification.endDate.getTime() - notification.startDate.getTime())) * 100
                    ))}%` 
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Priority pulse effect for critical banners */}
        {notification.priority >= 8 && (
          <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute inset-0 ${colors.accent} opacity-5 animate-pulse`} />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminBanner;