/**
 * AdminAlert - Alert component with severity levels and actions
 * Healthcare compliant with HIPAA indicators and confirmation dialogs
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { AlertNotification } from './types';
import { getSeverityIcon, getSeverityColors, HIPAAIndicator, formatNotificationTime } from './utils/icons';
import { notificationAudio } from './utils/audio';

interface AdminAlertProps {
  notification: AlertNotification;
  onDismiss?: (id: string) => void;
  onAction?: (id: string, actionId: string) => void;
  className?: string;
  expanded?: boolean;
}

export const AdminAlert: React.FC<AdminAlertProps> = ({
  notification,
  onDismiss,
  onAction,
  className = '',
  expanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [confirmAction, setConfirmAction] = useState<{
    actionId: string;
    label: string;
    destructive?: boolean;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const SeverityIcon = getSeverityIcon(notification.severity);
  const colors = getSeverityColors(notification.severity);

  // Play sound for critical alerts
  useEffect(() => {
    if (notification.severity === 'critical' || notification.severity === 'error') {
      const soundType = notification.hipaa.containsPHI ? 'critical' : notification.severity;
      notificationAudio.playSound(soundType, 0.4);
    }
  }, [notification]);

  const handleDismiss = () => {
    if (!notification.dismissible) return;
    
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.(notification.id);
    }, 300);
  };

  const handleAction = (actionId: string) => {
    const action = notification.actions?.find(a => a.id === actionId);
    if (!action) return;

    if (action.requiresConfirmation) {
      setConfirmAction({
        actionId,
        label: action.label,
        destructive: action.variant === 'destructive',
      });
    } else {
      action.handler();
      onAction?.(notification.id, actionId);
    }
  };

  const handleConfirmedAction = () => {
    if (!confirmAction) return;

    const action = notification.actions?.find(a => a.id === confirmAction.actionId);
    if (action) {
      action.handler();
      onAction?.(notification.id, confirmAction.actionId);
    }
    setConfirmAction(null);
  };

  const getBorderStyle = () => {
    if (notification.severity === 'critical') {
      return `border-l-4 ${colors.accent.replace('bg-', 'border-')}`;
    }
    return `border ${colors.border}`;
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`
              ${colors.bg} ${getBorderStyle()} rounded-lg shadow-sm
              ${notification.severity === 'critical' ? 'animate-pulse' : ''}
              ${className}
            `}
            role="alert"
            aria-live={notification.severity === 'critical' ? 'assertive' : 'polite'}
            aria-atomic="true"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <SeverityIcon 
                  className={`
                    w-5 h-5 mt-0.5 flex-shrink-0 ${colors.icon}
                    ${notification.severity === 'critical' ? 'animate-pulse' : ''}
                  `} 
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-semibold ${colors.text}`}>
                        {notification.title}
                      </h3>
                      <HIPAAIndicator 
                        containsPHI={notification.hipaa.containsPHI}
                        auditRequired={notification.hipaa.auditRequired}
                      />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className={`text-xs ${colors.text} opacity-60`}>
                        {formatNotificationTime(notification.timestamp)}
                      </span>
                      
                      {notification.dismissible && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDismiss}
                          className={`${colors.icon} hover:bg-black/5 h-6 w-6 p-0 rounded-md ml-2`}
                          aria-label="Dismiss alert"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Message preview */}
                  <div className="mt-1">
                    <p className={`text-sm ${colors.text} leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                      {notification.message}
                    </p>
                  </div>

                  {/* Expandable content */}
                  <AnimatePresence>
                    {isExpanded && notification.metadata && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 pt-3 border-t border-current/10"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {Object.entries(notification.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className={`${colors.text} opacity-70 capitalize`}>
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <span className={`${colors.text} font-medium`}>
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      {notification.actions?.map((action) => (
                        <Button
                          key={action.id}
                          size="sm"
                          variant={action.variant}
                          onClick={() => handleAction(action.id)}
                          className="text-xs"
                        >
                          {action.label}
                          {action.requiresConfirmation && (
                            <AlertCircle className="w-3 h-3 ml-1" />
                          )}
                        </Button>
                      ))}
                    </div>

                    {/* Expand/Collapse button */}
                    {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`${colors.icon} hover:bg-black/5 text-xs p-1`}
                        aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3 mr-1" />
                            Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3 mr-1" />
                            More
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Critical alert indicator */}
              {notification.severity === 'critical' && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmAction?.label.toLowerCase()}? 
              {confirmAction?.destructive && (
                <span className="block mt-2 text-red-600 font-medium">
                  This action cannot be undone.
                </span>
              )}
              {notification.hipaa.containsPHI && (
                <span className="block mt-2 text-amber-600 font-medium">
                  This action involves Protected Health Information (PHI) and will be audited.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedAction}
              className={confirmAction?.destructive ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {confirmAction?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminAlert;