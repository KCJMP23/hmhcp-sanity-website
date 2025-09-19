'use client'

import type { SiteStats, DashboardStats } from './types'

// API Functions for fetching real data
export async function fetchDashboardStats(): Promise<SiteStats> {
  const response = await fetch('/api/admin/dashboard/stats', { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats')
  }
  const data = await response.json()
  return {
    totalPages: data.totalPages || 0,
    totalPosts: data.totalPosts || 0,
    totalUsers: data.totalUsers || 0,
    totalMedia: data.totalMedia || 0,
    recentPages: data.recentPages || [],
    recentPosts: data.recentPosts || [],
    recentMedia: data.recentMedia || []
  }
}

// Fetch comprehensive dashboard statistics including analytics
export async function fetchComprehensiveDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/admin/dashboard/stats', { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats')
  }
  const data = await response.json()
  return data
}

// Utility function for date formatting
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}