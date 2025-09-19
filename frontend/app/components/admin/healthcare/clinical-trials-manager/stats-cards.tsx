'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  Activity,
  Users,
  CheckCircle,
  Stethoscope
} from 'lucide-react'
import type { StatsCardsProps } from './types'

export function StatsCards({ trials }: StatsCardsProps) {
  const activeTrials = trials.filter(t => t.status === 'active' || t.status === 'recruiting').length
  const totalEnrollment = trials.reduce((sum, trial) => sum + trial.enrollment_current, 0)
  const completedTrials = trials.filter(t => t.status === 'completed').length
  const phaseThreeTrials = trials.filter(t => t.phase === 'phase-3').length

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg dark:bg-blue-900/20">
              <Users className="w-6 h-6 text-green-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-text text-gray-600 dark:text-gray-400">Active Trials</p>
              <p className="text-2xl font-display text-gray-900 dark:text-white">
                {activeTrials}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900/20">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-text text-gray-600 dark:text-gray-400">Total Enrollment</p>
              <p className="text-2xl font-display text-gray-900 dark:text-white">
                {totalEnrollment}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-full dark:bg-blue-900/20">
              <CheckCircle className="w-6 h-6 text-purple-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-text text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-display text-gray-900 dark:text-white">
                {completedTrials}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg dark:bg-blue-900/20">
              <Stethoscope className="w-6 h-6 text-orange-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-text text-gray-600 dark:text-gray-400">Phase III</p>
              <p className="text-2xl font-display text-gray-900 dark:text-white">
                {phaseThreeTrials}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}