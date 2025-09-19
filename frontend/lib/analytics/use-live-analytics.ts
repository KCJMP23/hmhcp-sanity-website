'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface LiveAnalyticsData {
  type: string
  timestamp: string
  metrics?: {
    active_readers: number
    views_per_minute: number
    engagement_rate: number
    professional_percentage: number
  }
  recent_activity?: {
    total_events: number
    page_views: number
    scroll_events: number
    terminology_clicks: number
    healthcare_professional_events: number
    patient_events: number
    top_content: Array<{
      content_id: string
      event_count: number
    }>
  }
  trending_terms?: Array<{
    term: string
    clicks: number
    professional_clicks: number
    patient_clicks: number
  }>
  cache_data?: any
  message?: string
}

interface UseLiveAnalyticsOptions {
  enabled?: boolean
  reconnectDelay?: number
  maxReconnectAttempts?: number
}

interface LiveAnalyticsState {
  data: LiveAnalyticsData | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  reconnectAttempts: number
}

export function useLiveAnalytics({
  enabled = true,
  reconnectDelay = 3000,
  maxReconnectAttempts = 5,
}: UseLiveAnalyticsOptions = {}) {
  const [state, setState] = useState<LiveAnalyticsState>({
    data: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUnmountedRef = useRef(false)

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!enabled || isUnmountedRef.current || eventSourceRef.current) return

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const eventSource = new EventSource('/api/admin/analytics/live-stream')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        if (isUnmountedRef.current) return
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0,
        }))
      }

      eventSource.onmessage = (event) => {
        if (isUnmountedRef.current) return

        try {
          const data: LiveAnalyticsData = JSON.parse(event.data)
          setState(prev => ({
            ...prev,
            data,
            error: null,
          }))
        } catch (parseError) {
          console.error('Error parsing SSE data:', parseError)
          setState(prev => ({
            ...prev,
            error: 'Failed to parse analytics data',
          }))
        }
      }

      eventSource.onerror = (event) => {
        if (isUnmountedRef.current) return

        console.error('SSE error:', event)
        
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: 'Connection lost to analytics stream',
        }))

        // Attempt to reconnect
        if (state.reconnectAttempts < maxReconnectAttempts) {
          cleanup()
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmountedRef.current) {
              setState(prev => ({
                ...prev,
                reconnectAttempts: prev.reconnectAttempts + 1,
              }))
              connect()
            }
          }, reconnectDelay)
        } else {
          setState(prev => ({
            ...prev,
            error: 'Maximum reconnection attempts reached',
          }))
        }
      }

    } catch (error) {
      console.error('Error creating EventSource:', error)
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: 'Failed to connect to analytics stream',
      }))
    }
  }, [enabled, state.reconnectAttempts, maxReconnectAttempts, reconnectDelay, cleanup])

  const disconnect = useCallback(() => {
    cleanup()
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: null,
    }))
  }, [cleanup])

  const reconnect = useCallback(() => {
    setState(prev => ({ ...prev, reconnectAttempts: 0 }))
    disconnect()
    setTimeout(() => connect(), 100)
  }, [connect, disconnect])

  // Initialize connection
  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      cleanup()
    }

    return () => {
      isUnmountedRef.current = true
      cleanup()
    }
  }, [enabled, connect, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
      cleanup()
    }
  }, [cleanup])

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
    canReconnect: state.reconnectAttempts < maxReconnectAttempts,
  }
}

// Hook specifically for live metrics
export function useLiveMetrics(options?: UseLiveAnalyticsOptions) {
  const { data, isConnected, error } = useLiveAnalytics(options)
  
  return {
    metrics: data?.metrics || null,
    isConnected,
    error,
    lastUpdate: data?.timestamp ? new Date(data.timestamp) : null,
  }
}

// Hook for trending terms updates
export function useTrendingTerms(options?: UseLiveAnalyticsOptions) {
  const { data, isConnected, error } = useLiveAnalytics(options)
  
  return {
    trendingTerms: data?.trending_terms || [],
    isConnected,
    error,
    lastUpdate: data?.timestamp ? new Date(data.timestamp) : null,
  }
}

// Hook for recent activity feed
export function useRecentActivity(options?: UseLiveAnalyticsOptions) {
  const { data, isConnected, error } = useLiveAnalytics(options)
  
  return {
    activity: data?.recent_activity || null,
    isConnected,
    error,
    lastUpdate: data?.timestamp ? new Date(data.timestamp) : null,
  }
}

// Enhanced hook with historical data comparison
export function useAnalyticsComparison(options?: UseLiveAnalyticsOptions) {
  const [historicalData, setHistoricalData] = useState<LiveAnalyticsData[]>([])
  const { data, isConnected, error } = useLiveAnalytics(options)

  useEffect(() => {
    if (data && data.type === 'analytics_update') {
      setHistoricalData(prev => {
        const newData = [...prev, data].slice(-30) // Keep last 30 updates
        return newData
      })
    }
  }, [data])

  // Calculate trends
  const trends = historicalData.length >= 2 ? {
    activeReaders: {
      current: data?.metrics?.active_readers || 0,
      previous: historicalData[historicalData.length - 2]?.metrics?.active_readers || 0,
      trend: ((data?.metrics?.active_readers || 0) - (historicalData[historicalData.length - 2]?.metrics?.active_readers || 0)),
    },
    viewsPerMinute: {
      current: data?.metrics?.views_per_minute || 0,
      previous: historicalData[historicalData.length - 2]?.metrics?.views_per_minute || 0,
      trend: ((data?.metrics?.views_per_minute || 0) - (historicalData[historicalData.length - 2]?.metrics?.views_per_minute || 0)),
    },
    engagementRate: {
      current: data?.metrics?.engagement_rate || 0,
      previous: historicalData[historicalData.length - 2]?.metrics?.engagement_rate || 0,
      trend: ((data?.metrics?.engagement_rate || 0) - (historicalData[historicalData.length - 2]?.metrics?.engagement_rate || 0)),
    },
  } : null

  return {
    currentData: data,
    historicalData,
    trends,
    isConnected,
    error,
  }
}