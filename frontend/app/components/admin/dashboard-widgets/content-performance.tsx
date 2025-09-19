'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'
import { DashboardWidget } from './dashboard-widget'
import type { ContentPerformanceProps, ContentPerformanceItem } from './types'

export function ContentPerformance({ contentPerformance }: ContentPerformanceProps) {
  // Default data fallback
  const defaultContentPerformance: ContentPerformanceItem[] = [
    { name: 'Clinical Studies', views: 1245, engagement: 92 },
    { name: 'Platform Overview', views: 987, engagement: 88 },
    { name: 'Research Publications', views: 756, engagement: 85 },
    { name: 'Patient Resources', views: 643, engagement: 90 },
    { name: 'About Us', views: 521, engagement: 94 }
  ]

  const currentContentPerformance = contentPerformance && contentPerformance.length > 0 
    ? contentPerformance 
    : defaultContentPerformance

  return (
    <DashboardWidget 
      title="Content Performance" 
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/analytics">View All</Link>
        </Button>
      }
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={currentContentPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="views" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardWidget>
  )
}