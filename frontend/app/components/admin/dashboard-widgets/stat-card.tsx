'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { StatCardProps } from './types'

export function StatCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color 
}: StatCardProps) {
  return (
    <Card className="rounded-xl hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-text text-sm font-medium text-muted-foreground tracking-body">{title}</p>
            <p className="font-display text-2xl font-light tracking-tight text-foreground">{value}</p>
            <div className="flex items-center mt-1">
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
              <span className={`text-sm ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                {change} this month
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-md ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}