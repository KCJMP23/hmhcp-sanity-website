'use client'

import { Card } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface StatCard {
  label: string
  value: string | number
  change?: string
}

interface DashboardOverviewStatsProps {
  data?: StatCard[]
}

export function DashboardOverviewStats({ data }: DashboardOverviewStatsProps) {
  if (!data) return null

  const getChangeIcon = (change?: string) => {
    if (!change) return null
    
    const value = parseFloat(change)
    if (value > 0) {
      return <ArrowUp className="h-4 w-4 text-green-600" />
    } else if (value < 0) {
      return <ArrowDown className="h-4 w-4 text-red-600" />
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getChangeColor = (change?: string) => {
    if (!change) return ''
    
    const value = parseFloat(change)
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-400'
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {data.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {stat.value}
              </span>
              {stat.change && (
                <div className={`flex items-center gap-1 text-sm ${getChangeColor(stat.change)}`}>
                  {getChangeIcon(stat.change)}
                  <span>{stat.change}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}