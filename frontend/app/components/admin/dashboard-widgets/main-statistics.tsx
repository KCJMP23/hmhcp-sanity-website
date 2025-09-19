'use client'

import { FileText, BookOpen, Database, Users } from 'lucide-react'
import { StatCard } from './stat-card'
import type { MainStatisticsProps } from './types'

export function MainStatistics({ stats }: MainStatisticsProps) {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-x-hidden">
      <StatCard
        title="Total Pages"
        value={stats.totalPages}
        change="Active"
        trend="up"
        icon={FileText}
        color="bg-blue-500"
      />
      <StatCard
        title="Blog Posts"
        value={stats.totalPosts}
        change="Published"
        trend="up"
        icon={BookOpen}
        color="bg-green-500"
      />
      <StatCard
        title="Media Files"
        value={stats.totalMedia}
        change="Uploaded"
        trend="up"
        icon={Database}
        color="bg-purple-500"
      />
      <StatCard
        title="Total Users"
        value={stats.totalUsers}
        change="Registered"
        trend="up"
        icon={Users}
        color="bg-orange-500"
      />
    </div>
  )
}