'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardWidgetProps } from './types'

export function DashboardWidget({ 
  title, 
  children, 
  actions 
}: DashboardWidgetProps) {
  return (
    <Card className="rounded-xl h-full">
      <CardHeader className="rounded-xl flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-text rounded-xl text-sm font-medium tracking-body">{title}</CardTitle>
        {actions}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}