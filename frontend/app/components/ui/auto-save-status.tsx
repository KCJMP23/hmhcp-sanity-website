'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  CloudArrowUpIcon,
  WifiIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import type { SaveStatus, AutoSaveMetadata } from '@/hooks/useAutoSave'

interface AutoSaveStatusProps {
  status: SaveStatus
  metadata: AutoSaveMetadata
  className?: string
  showDetails?: boolean
  onRetry?: () => void
}

const STATUS_CONFIG = {
  idle: {
    icon: null,
    color: 'text-gray-400 dark:text-gray-500',
    bg: 'bg-gray-50/50 dark:bg-gray-800/50',
    border: 'border-gray-200/50 dark:border-gray-700/50',
    text: 'Ready'
  },
  saving: {
    icon: ArrowPathIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50/50 dark:bg-blue-950/50',
    border: 'border-blue-200/50 dark:border-blue-700/50',
    text: 'Saving...'
  },
  saved: {
    icon: CheckCircleIcon,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/50',
    border: 'border-emerald-200/50 dark:border-emerald-700/50',
    text: 'Saved'
  },
  error: {
    icon: ExclamationTriangleIcon,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50/50 dark:bg-red-950/50',
    border: 'border-red-200/50 dark:border-red-700/50',
    text: 'Save failed'
  },
  offline: {
    icon: WifiIcon,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50/50 dark:bg-amber-950/50',
    border: 'border-amber-200/50 dark:border-amber-700/50',
    text: 'Offline'
  }
}

export function AutoSaveStatus({ 
  status, 
  metadata, 
  className,
  showDetails = false,
  onRetry 
}: AutoSaveStatusProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return null
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (minutes === 0) {
      return `${seconds}s ago`
    } else if (minutes < 60) {
      return `${minutes}m ago`
    } else {
      const hours = Math.floor(minutes / 60)
      return `${hours}h ago`
    }
  }

  return (
    <div className={cn("relative", className)}>
      {/* Main Status Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ 
          duration: 0.2, 
          ease: [0.42, 0, 0.58, 1]
        }}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
          "backdrop-blur-md shadow-sm border",
          "font-text text-sm font-medium",
          "transition-all duration-300 ease-&lsqb;cubic-bezier(0.42,0,0.58,1)&rsqb;",
          config.bg,
          config.border,
          config.color,
          showDetails && "cursor-pointer hover:shadow-md"
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => showDetails && setShowTooltip(!showTooltip)}
      >
        {Icon && (
          <motion.div
            animate={{ 
              rotate: status === 'saving' ? 360 : 0 
            }}
            transition={{ 
              duration: status === 'saving' ? 1 : 0,
              ease: "linear",
              repeat: status === 'saving' ? Infinity : 0
            }}
          >
            <Icon className="h-4 w-4" />
          </motion.div>
        )}
        
        <span className="font-display tracking-tight">
          {config.text}
        </span>

        {/* Unsaved changes indicator */}
        {metadata.hasUnsavedChanges && status !== 'saving' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-1.5 h-1.5 rounded-full bg-current opacity-60"
          />
        )}

        {/* Conflict indicator */}
        {metadata.isConflicted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 rounded-full bg-yellow-500 dark:bg-yellow-400"
          />
        )}
      </motion.div>

      {/* Detailed Tooltip */}
      <AnimatePresence>
        {showTooltip && showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-full right-0 mt-2 p-4 min-w-64",
              "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md",
              "border border-gray-200/50 dark:border-gray-700/50",
              "rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20",
              "z-50"
            )}
          >
            <div className="space-y-3">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </span>
                <span className={cn("text-sm font-semibold", config.color)}>
                  {config.text}
                </span>
              </div>

              {/* Last Saved */}
              {metadata.lastSaved && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last saved
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatLastSaved(metadata.lastSaved)}
                  </span>
                </div>
              )}

              {/* Version */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Version
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  v{metadata.version}
                </span>
              </div>

              {/* Retry Count */}
              {metadata.retryCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Retry attempts
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {metadata.retryCount}/{metadata.maxRetries}
                  </span>
                </div>
              )}

              {/* Conflict Warning */}
              {metadata.isConflicted && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Conflict detected
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Another user has modified this content. Please resolve conflicts before saving.
                  </p>
                </div>
              )}

              {/* Retry Button */}
              {status === 'error' && onRetry && (
                <button
                  onClick={onRetry}
                  className={cn(
                    "w-full px-3 py-2 text-sm font-medium rounded-lg",
                    "bg-blue-600 hover:bg-blue-700 text-white",
                    "transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  )}
                >
                  Retry Save
                </button>
              )}
            </div>

            {/* Tooltip Arrow */}
            <div className="absolute -top-1 right-4 w-2 h-2 bg-white dark:bg-gray-900 border-l border-t border-gray-200 dark:border-gray-700 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* Enhanced Mini Status Indicator for tight spaces */
export function AutoSaveStatusMini({ 
  status, 
  metadata, 
  className 
}: Omit<AutoSaveStatusProps, 'showDetails' | 'onRetry'>) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded-full",
        "backdrop-blur-sm border",
        config.bg,
        config.border,
        config.color,
        className
      )}
      title={`${config.text}${metadata.hasUnsavedChanges ? ' - Unsaved changes' : ''}`}
    >
      {Icon ? (
        <motion.div
          animate={{ 
            rotate: status === 'saving' ? 360 : 0 
          }}
          transition={{ 
            duration: status === 'saving' ? 1 : 0,
            ease: "linear",
            repeat: status === 'saving' ? Infinity : 0
          }}
        >
          <Icon className="h-3 w-3" />
        </motion.div>
      ) : (
        <div className="w-2 h-2 rounded-full bg-current opacity-50" />
      )}

      {/* Unsaved indicator dot */}
      {metadata.hasUnsavedChanges && status !== 'saving' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 border border-white dark:border-gray-900"
        />
      )}
    </motion.div>
  )
}

/* Floating Action Button for manual save */
export function AutoSaveFloatingButton({ 
  onSave, 
  status, 
  disabled = false,
  className 
}: {
  onSave: () => void
  status: SaveStatus
  disabled?: boolean
  className?: string
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSave}
      disabled={disabled || status === 'saving'}
      className={cn(
        "fixed bottom-6 right-6 w-14 h-14 rounded-full",
        "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400",
        "text-white shadow-lg hover:shadow-xl",
        "transition-all duration-200 ease-&lsqb;cubic-bezier(0.42,0,0.58,1)&rsqb;",
        "focus:outline-none focus:ring-4 focus:ring-blue-500/30",
        "disabled:cursor-not-allowed",
        "backdrop-blur-md",
        className
      )}
      title="Save now"
    >
      {status === 'saving' ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, ease: "linear", repeat: Infinity }}
        >
          <ArrowPathIcon className="h-6 w-6" />
        </motion.div>
      ) : (
        <CloudArrowUpIcon className="h-6 w-6" />
      )}
    </motion.button>
  )
}