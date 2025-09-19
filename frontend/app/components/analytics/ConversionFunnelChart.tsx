'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowDown, TrendingDown, TrendingUp } from 'lucide-react'

interface FunnelStep {
  name: string
  value: number
  percentage: number
  dropOff: number
  change: number
}

interface ConversionFunnelChartProps {
  data?: FunnelStep[]
  title?: string
  description?: string
}

export function ConversionFunnelChart({ 
  data,
  title = "Conversion Funnel",
  description = "Visualize user progression through conversion steps"
}: ConversionFunnelChartProps) {
  // Default data if none provided
  const defaultData: FunnelStep[] = [
    { name: 'Visitors', value: 10000, percentage: 100, dropOff: 0, change: 5 },
    { name: 'Engaged', value: 6500, percentage: 65, dropOff: 35, change: -2 },
    { name: 'Interested', value: 3200, percentage: 32, dropOff: 51, change: 8 },
    { name: 'Contacted', value: 1200, percentage: 12, dropOff: 63, change: 12 },
    { name: 'Converted', value: 480, percentage: 4.8, dropOff: 60, change: 15 }
  ]

  const funnelData = data || defaultData

  // Calculate the width of each funnel segment based on percentage
  const getSegmentWidth = (percentage: number) => {
    return `${percentage}%`
  }

  // Get color based on drop-off rate
  const getSegmentColor = (dropOff: number) => {
    if (dropOff > 60) return 'bg-red-500 dark:bg-blue-600'
    if (dropOff > 40) return 'bg-orange-500 dark:bg-blue-600'
    if (dropOff > 20) return 'bg-yellow-500 dark:bg-blue-600'
    return 'bg-blue-500 dark:bg-blue-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {funnelData.map((step, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium">{step.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {step.value.toLocaleString()} users ({step.percentage}%)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {index > 0 && (
                    <Badge variant="outline" className="text-xs">
                      -{step.dropOff}% drop-off
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    {step.change > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-xs ${step.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(step.change)}%
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Funnel segment */}
              <div className="relative">
                <div 
                  className="mx-auto transition-all duration-500"
                  style={{ width: getSegmentWidth(step.percentage) }}
                >
                  <div 
                    className={`h-12 ${getSegmentColor(step.dropOff)}  relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {step.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow between segments */}
              {index < funnelData.length - 1 && (
                <div className="flex justify-center my-2">
                  <ArrowDown className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary stats */}
        <div className="mt-8 pt-6 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Conversion</p>
              <p className="text-2xl font-bold">
                {funnelData[funnelData.length - 1].percentage}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Drop-off</p>
              <p className="text-2xl font-bold">
                {Math.round(
                  funnelData.slice(1).reduce((sum, step) => sum + step.dropOff, 0) / (funnelData.length - 1)
                )}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold">
                {funnelData[funnelData.length - 1].value}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}