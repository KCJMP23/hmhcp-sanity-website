'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConnectionInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g'
  downlink: number
  rtt: number
}

interface LoadingStateProps {
  isLoading: boolean
  loadingText?: string
  className?: string
  showNetworkStatus?: boolean
  timeout?: number
  onTimeout?: () => void
}

export function EnhancedLoadingState({ 
  isLoading, 
  loadingText = "Loading...", 
  className,
  showNetworkStatus = true,
  timeout = 10000,
  onTimeout
}: LoadingStateProps) {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null)
  const [isSlowConnection, setIsSlowConnection] = useState(false)
  const [hasTimedOut, setHasTimedOut] = useState(false)
  const [loadingDuration, setLoadingDuration] = useState(0)

  useEffect(() => {
    // Monitor network connection
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      })
      
      setIsSlowConnection(
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g' ||
        connection.downlink < 1
      )
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      setHasTimedOut(false)
      setLoadingDuration(0)
      return
    }

    const startTime = Date.now()
    const durationInterval = setInterval(() => {
      setLoadingDuration(Date.now() - startTime)
    }, 100)

    const timeoutId = setTimeout(() => {
      setHasTimedOut(true)
      onTimeout?.()
    }, timeout)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(durationInterval)
    }
  }, [isLoading, timeout, onTimeout])

  const getLoadingMessage = () => {
    if (hasTimedOut) {
      return "This is taking longer than expected..."
    }
    
    if (isSlowConnection && loadingDuration > 3000) {
      return "Slow connection detected. Please wait..."
    }
    
    if (loadingDuration > 5000) {
      return "Still loading. This may take a moment..."
    }
    
    return loadingText
  }

  const getConnectionIcon = () => {
    if (!connectionInfo) return <Wifi className="w-4 h-4" />
    
    if (connectionInfo.effectiveType === 'slow-2g' || connectionInfo.effectiveType === '2g') {
      return <WifiOff className="w-4 h-4 text-red-500" />
    }
    
    return <Wifi className="w-4 h-4 text-blue-600" />
  }

  const getProgressEstimate = () => {
    if (hasTimedOut) return 100
    
    const baseProgress = Math.min((loadingDuration / timeout) * 100, 90)
    
    if (isSlowConnection) {
      return Math.min(baseProgress * 0.7, 70) // Slower progress for slow connections
    }
    
    return baseProgress
  }

  if (!isLoading) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center",
          className
        )}
      >
        <div className="text-center p-6 max-w-md mx-auto">
          {/* Main Loading Animation */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mb-6 mx-auto w-12 h-12 flex items-center justify-center"
          >
            <Loader2 className="w-8 h-8 text-blue-600" />
          </motion.div>

          {/* Loading Message */}
          <motion.h3 
            key={getLoadingMessage()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-medium text-gray-900 dark:text-white mb-4"
          >
            {getLoadingMessage()}
          </motion.h3>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 mb-4">
            <motion.div
              className="bg-blue-600 h-2"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressEstimate()}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Network Status */}
          {showNetworkStatus && connectionInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4"
            >
              {getConnectionIcon()}
              <span>
                {connectionInfo.effectiveType.toUpperCase()} connection
                {isSlowConnection && " (slow)"}
              </span>
            </motion.div>
          )}

          {/* Timeout Warning */}
          <AnimatePresence>
            {hasTimedOut && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-blue-400 bg-amber-50 dark:bg-blue-900/20 p-3"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Loading is taking longer than usual</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Additional Actions for Slow Connections */}
          {isSlowConnection && loadingDuration > 5000 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-xs text-gray-500 dark:text-gray-400"
            >
              <p>Tips for slow connections:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Try refreshing the page</li>
                <li>Check your internet connection</li>
                <li>Consider using a Wi-Fi connection</li>
              </ul>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Skeleton Loading Components for specific content types
export function PageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="h-16 bg-gray-200 dark:bg-gray-700 mb-8"></div>
      
      {/* Hero Section Skeleton */}
      <div className="h-96 bg-gray-200 dark:bg-gray-700 mb-8"></div>
      
      {/* Content Skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 w-4/6"></div>
      </div>
      
      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700"></div>
        ))}
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 w-1/4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 w-1/3"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 w-1/3"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 w-1/4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700"></div>
      </div>
      
      <div className="h-12 bg-gray-200 dark:bg-gray-700"></div>
    </div>
  )
}

// Hook for managing loading states with network awareness
export function useNetworkAwareLoading(initialLoading: boolean = false) {
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null)
  const [isSlowConnection, setIsSlowConnection] = useState(false)

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      const updateConnection = () => {
        setConnectionInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        })
        
        setIsSlowConnection(
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' ||
          connection.downlink < 1
        )
      }

      updateConnection()
      connection.addEventListener('change', updateConnection)
      
      return () => connection.removeEventListener('change', updateConnection)
    }
  }, [])

  const startLoading = () => setIsLoading(true)
  const stopLoading = () => setIsLoading(false)

  return {
    isLoading,
    startLoading,
    stopLoading,
    connectionInfo,
    isSlowConnection
  }
}