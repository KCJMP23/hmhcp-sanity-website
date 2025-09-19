'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Activity,
  Clock,
  Users,
  Mail,
  Eye,
  MousePointer,
  Target,
  TrendingUp,
  Calendar,
  BarChart3
} from 'lucide-react'

interface EngagementHeatmapProps {
  dateRange: string
  campaignFilter: string
}

interface EngagementData {
  hour: number
  day: string
  open_rate: number
  click_rate: number
  conversion_rate: number
  email_count: number
  engagement_score: number
}

interface TimeSeriesData {
  date: string
  opens: number
  clicks: number
  conversions: number
  emails_sent: number
  engagement_rate: number
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const hours = Array.from({ length: 24 }, (_, i) => i)

const heatmapTypes = [
  { value: 'open_rate', label: 'Open Rate', color: 'blue' },
  { value: 'click_rate', label: 'Click Rate', color: 'green' },
  { value: 'conversion_rate', label: 'Conversion Rate', color: 'purple' },
  { value: 'engagement_score', label: 'Engagement Score', color: 'orange' }
]

const viewTypes = [
  { value: 'heatmap', label: 'Heatmap View', icon: Activity },
  { value: 'timeline', label: 'Timeline View', icon: BarChart3 },
  { value: 'comparison', label: 'Comparison View', icon: TrendingUp }
]

export function EmailEngagementHeatmap({ dateRange, campaignFilter }: EngagementHeatmapProps) {
  const [engagementData, setEngagementData] = useState<EngagementData[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState('open_rate')
  const [viewType, setViewType] = useState('heatmap')
  const [selectedDay, setSelectedDay] = useState<string>('all')

  useEffect(() => {
    loadEngagementData()
  }, [dateRange, campaignFilter])

  const loadEngagementData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/email/analytics/engagement?date_range=${dateRange}&campaign_filter=${campaignFilter}`)
      const data = await response.json()
      
      if (data.success) {
        setEngagementData(data.data.heatmap || [])
        setTimeSeriesData(data.data.timeline || [])
      } else {
        throw new Error(data.error || 'Failed to load engagement data')
      }
    } catch (error) {
      console.error('Error loading engagement data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHeatmapValue = (day: string, hour: number, metric: string) => {
    const data = engagementData.find(d => d.day === day && d.hour === hour)
    return data ? data[metric as keyof EngagementData] as number : 0
  }

  const getHeatmapColor = (value: number, maxValue: number) => {
    if (value === 0) return 'bg-gray-100'
    
    const intensity = value / maxValue
    if (intensity < 0.2) return 'bg-blue-100'
    if (intensity < 0.4) return 'bg-blue-200'
    if (intensity < 0.6) return 'bg-blue-300'
    if (intensity < 0.8) return 'bg-blue-400'
    return 'bg-blue-500'
  }

  const getMaxValue = (metric: string) => {
    return Math.max(...engagementData.map(d => d[metric as keyof EngagementData] as number), 1)
  }

  const filteredData = selectedDay === 'all' 
    ? engagementData 
    : engagementData.filter(d => d.day === selectedDay)

  const maxValue = getMaxValue(selectedMetric)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading engagement data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Engagement Analysis
          </CardTitle>
          <CardDescription>
            Analyze email engagement patterns by time and day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">View Type</label>
              <Select value={viewType} onValueChange={setViewType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select view type" />
                </SelectTrigger>
                <SelectContent>
                  {viewTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Metric</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {heatmapTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Day Filter</label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap View */}
      {viewType === 'heatmap' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Engagement Heatmap
            </CardTitle>
            <CardDescription>
              {heatmapTypes.find(t => t.value === selectedMetric)?.label} by day and hour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Day labels */}
              <div className="grid grid-cols-8 gap-2">
                <div className="text-sm font-medium text-muted-foreground">Hour</div>
                {days.map((day) => (
                  <div key={day} className="text-sm font-medium text-center text-muted-foreground">
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              <div className="space-y-1">
                {hours.map((hour) => (
                  <div key={hour} className="grid grid-cols-8 gap-2">
                    <div className="text-sm font-medium text-muted-foreground flex items-center">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    {days.map((day) => {
                      const value = getHeatmapValue(day, hour, selectedMetric)
                      const color = getHeatmapColor(value, maxValue)
                      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
                      
                      return (
                        <div
                          key={`${day}-${hour}`}
                          className={`h-8 rounded flex items-center justify-center text-xs font-medium ${
                            value > 0 ? 'text-white' : 'text-gray-500'
                          } ${color}`}
                          title={`${day} ${hour.toString().padStart(2, '0')}:00 - ${value.toFixed(1)}%`}
                        >
                          {value > 0 && `${value.toFixed(1)}%`}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Low</span>
                <div className="flex gap-1">
                  {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
                    <div
                      key={intensity}
                      className={`w-4 h-4 rounded ${getHeatmapColor(intensity * maxValue, maxValue)}`}
                    />
                  ))}
                </div>
                <span>High</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {viewType === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Engagement Timeline
            </CardTitle>
            <CardDescription>
              Engagement trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Timeline chart placeholder */}
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Timeline chart visualization</p>
                </div>
              </div>

              {/* Timeline data table */}
              <div className="space-y-2">
                <h4 className="font-medium">Recent Engagement Data</h4>
                <div className="grid gap-2">
                  {timeSeriesData.slice(0, 7).map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">{data.date}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {data.emails_sent} sent
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-blue-600" />
                          {data.opens}
                        </div>
                        <div className="flex items-center gap-1">
                          <MousePointer className="h-4 w-4 text-green-600" />
                          {data.clicks}
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4 text-purple-600" />
                          {data.conversions}
                        </div>
                        <div className="font-medium">
                          {data.engagement_rate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison View */}
      {viewType === 'comparison' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Engagement Comparison
            </CardTitle>
            <CardDescription>
              Compare engagement metrics across different dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Best performing times */}
              <div className="space-y-4">
                <h4 className="font-medium">Best Performing Times</h4>
                <div className="space-y-2">
                  {filteredData
                    .sort((a, b) => (b[selectedMetric as keyof EngagementData] as number) - (a[selectedMetric as keyof EngagementData] as number))
                    .slice(0, 5)
                    .map((data, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            #{index + 1}
                          </Badge>
                          <span className="font-medium">{data.day}</span>
                          <span className="text-sm text-muted-foreground">
                            {data.hour.toString().padStart(2, '0')}:00
                          </span>
                        </div>
                        <div className="font-medium text-green-800">
                          {(data[selectedMetric as keyof EngagementData] as number).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Engagement insights */}
              <div className="space-y-4">
                <h4 className="font-medium">Engagement Insights</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Peak Hours</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Tuesday 10 AM - 2 PM shows highest engagement rates
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-800">Audience Behavior</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Healthcare professionals are most active during business hours
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-800">Optimization</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      Consider scheduling more campaigns during peak engagement windows
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
