/**
 * AdminToast - Toast notification component with auto-dismiss
 * Healthcare compliant with HIPAA indicators and sound notifications
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { ToastNotification } from './types';
import { getSeverityIcon, getSeverityColors, HIPAAIndicator, formatNotificationTime } from './utils/icons';
import { notificationAudio } from './utils/audio';

interface AdminToastProps {
  notification: ToastNotification;
  onDismiss: (id: string) => void;
  onAction?: (id: string) => void;
  className?: string;
}

export const AdminToast: React.FC<AdminToastProps> = ({
  notification,
  onDismiss,
  onAction,
  className = '',
}) => {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<NodeJS.Timeout>();
  const progressTimerRef = useRef<NodeJS.Timeout>();
  const toastRef = useRef<HTMLDivElement>(null);

  const SeverityIcon = getSeverityIcon(notification.severity);
  const colors = getSeverityColors(notification.severity);

  // Auto-dismiss timer
  useEffect(() => {
    if (notification.duration === 0) return; // Permanent toast

    const startTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      const duration = notification.duration;
      const interval = 100; // Update progress every 100ms
      const steps = duration / interval;
      let currentStep = 0;

      progressTimerRef.current = setInterval(() => {
        if (isHovered) return; // Pause when hovered

        currentStep++;
        const newProgress = ((steps - currentStep) / steps) * 100;
        setProgress(Math.max(0, newProgress));

        if (currentStep >= steps) {
          setIsVisible(false);
          setTimeout(() => onDismiss(notification.id), 300);
        }
      }, interval);
    };

    if (!isHovered) {
      startTimer();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [notification.duration, notification.id, onDismiss, isHovered]);

  // Play sound notification
  useEffect(() => {
    if (notification.sound?.enabled) {
      const soundType = notification.sound.type || notification.severity;
      const volume = notification.sound.volume || 0.3;
      
      // Special healthcare alert sounds
      if (notification.hipaa.containsPHI && notification.severity === 'critical') {
        notificationAudio.playHIPAAAlert();
      } else if (notification.category === 'security' && notification.severity === 'critical') {
        notificationAudio.playDataBreachAlert();
      } else if (notification.category === 'audit') {
        notificationAudio.playAuditAlert();
      } else {
        notificationAudio.playSound(soundType, volume);
      }
    }
  }, [notification]);

  // Announce to screen readers
  useEffect(() => {
    if (toastRef.current) {
      const announcement = `${notification.severity} notification: ${notification.title}. ${notification.message}`;
      const ariaLive = notification.severity === 'critical' ? 'assertive' : 'polite';
      
      // Create temporary announcement element
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', ariaLive);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.textContent = announcement;
      
      document.body.appendChild(announcer);
      setTimeout(() => document.body.removeChild(announcer), 1000);
    }
  }, [notification]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const handleAction = () => {
    if (notification.action?.handler) {
      notification.action.handler();
      onAction?.(notification.id);
    }
  };

  // Position classes
  const getPositionClasses = () => {
    switch (notification.position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={toastRef}
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed z-50 ${getPositionClasses()} max-w-md w-full sm:w-96 ${className}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          role="alert"
          aria-live={notification.severity === 'critical' ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          <div className={`
            relative rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-200
            ${colors.bg} ${colors.border}
            ${isHovered ? 'shadow-xl transform scale-105' : ''}
          `}>
            {/* Progress bar */}
            {notification.duration > 0 && (
              <div className={`absolute top-0 left-0 right-0 h-1 ${colors.accent} rounded-t-lg overflow-hidden`}>
                <div 
                  className="h-full bg-white/30 transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <SeverityIcon className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-semibold ${colors.text} truncate`}>
                        {notification.title}
                      </h4>
                      <HIPAAIndicator 
                        containsPHI={notification.hipaa.containsPHI}
                        auditRequired={notification.hipaa.auditRequired}
                      />
                    </div>
                    <p className={`text-xs ${colors.text} opacity-75 mt-0.5`}>
                      {formatNotificationTime(notification.timestamp)}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className={`${colors.icon} hover:bg-black/5 h-6 w-6 p-0 rounded-md`}
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Message */}
              <div className="mt-3">
                <p className={`text-sm ${colors.text} leading-relaxed`}>
                  {notification.message}
                </p>
              </div>

              {/* Progress indicator for actionable items */}
              {notification.progress && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={colors.text}>
                      {notification.progress.label || 'Progress'}
                    </span>
                    <span className={colors.text}>
                      {notification.progress.current}/{notification.progress.total}
                    </span>
                  </div>
                  <Progress 
                    value={(notification.progress.current / notification.progress.total) * 100}
                    className="h-1.5"
                  />
                </div>
              )}

              {/* Actions */}
              {notification.action && (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant={notification.action.destructive ? "destructive" : "default"}
                    onClick={handleAction}
                    className="text-xs"
                  >
                    {notification.action.label}
                    {notification.actionable && (
                      <ExternalLink className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Critical indicator */}
            {notification.severity === 'critical' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminToast;