'use client'

import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/hooks'

export interface AuditLogEntry {
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  userId?: string
  timestamp?: string
}

export function useAuditLog() {
  const { user } = useAuth()

  const logAction = useCallback(async (entry: AuditLogEntry) => {
    try {
      const logEntry = {
        ...entry,
        userId: entry.userId || user?.id,
        timestamp: entry.timestamp || new Date().toISOString(),
        metadata: {
          userAgent: navigator.userAgent,
          ip: 'server-side', // This would be populated server-side
          sessionId: sessionStorage.getItem('sessionId'),
          ...entry.details
        }
      }

      // Send to audit log API
      const response = await fetch('/api/admin/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      })

      if (!response.ok) {
        console.error('Failed to log audit entry:', await response.text())
      }

      // Also log to Supabase for persistence
      const { error } = await supabase
        .from('audit_logs')
        .insert(logEntry)

      if (error) {
        console.error('Failed to persist audit log:', error)
      }
    } catch (error) {
      console.error('Audit logging error:', error)
      // Don't throw - audit logging should not break the app
    }
  }, [user])

  const queryLogs = useCallback(async (filters?: {
    resource?: string
    action?: string
    userId?: string
    startDate?: string
    endDate?: string
    limit?: number
  }) => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })

      if (filters?.resource) {
        query = query.eq('resource', filters.resource)
      }
      if (filters?.action) {
        query = query.eq('action', filters.action)
      }
      if (filters?.userId) {
        query = query.eq('userId', filters.userId)
      }
      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate)
      }
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to query audit logs:', error)
      return []
    }
  }, [])

  return {
    logAction,
    queryLogs
  }
}