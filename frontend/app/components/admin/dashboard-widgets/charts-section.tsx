'use client'

import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { DashboardWidget } from './dashboard-widget'
import type { ChartsSectionProps, TrafficDataPoint, DeviceStat } from './types'

export function ChartsSection({ trafficData, deviceStats }: ChartsSectionProps) {
  // Do not use fallbacks; render only if data is present
  const currentTrafficData = Array.isArray(trafficData) ? trafficData : []
  const currentDeviceStats = Array.isArray(deviceStats) ? deviceStats : []

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {/* Traffic Overview */}
      <div className="lg:col-span-2">
        <DashboardWidget 
          title="Traffic Overview" 
          actions={
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentTrafficData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="visits" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="pageviews" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashboardWidget>
      </div>

      {/* Device Statistics */}
      <DashboardWidget title="Device Usage">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentDeviceStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {currentDeviceStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          {currentDeviceStats.length > 0 && (
            <div className="mt-4 space-y-2">
              {currentDeviceStats.map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: device.color }}
                    />
                    <span className="text-sm text-gray-600">{device.name}</span>
                  </div>
                  <span className="text-sm font-medium">{device.value}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardWidget>
    </div>
  )
}