'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SystemStatusProps, SystemService } from './types'

export function SystemStatus({ systemStatus }: SystemStatusProps) {
  // Default data fallback
  const defaultSystemStatus: SystemService[] = [
    { service: 'Supabase Database', status: 'operational', uptime: '99.9%' },
    { service: 'Sanity CMS', status: 'operational', uptime: '100%' },
    { service: 'Authentication', status: 'operational', uptime: '99.8%' },
    { service: 'CDN', status: 'operational', uptime: '99.7%' },
    { service: 'Email Service', status: 'operational', uptime: '99.5%' }
  ]

  const currentSystemStatus = systemStatus && systemStatus.length > 0 
    ? systemStatus 
    : defaultSystemStatus

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">System Status</CardTitle>
        <CardDescription className="text-sm">Monitor the health of your platform services</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {currentSystemStatus.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-sm ${
                  service.status === 'operational' ? 'bg-green-500' : 
                  service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div>
                  <span className="text-sm font-medium text-gray-900 block">{service.service}</span>
                  <span className="text-xs text-gray-500">{service.uptime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}