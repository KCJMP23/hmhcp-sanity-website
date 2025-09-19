'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import {
  Heart, Stethoscope, Users, TrendingUp, Clock, Eye, Activity, FileDownload
} from 'lucide-react'
import { format } from 'date-fns'

interface PatientHCPSegmentationWidgetProps {
  data: {
    healthcare: {
      patientVisitors: number
      hcpVisitors: number
      clinicalTrialViews: number
      researchDownloads: number
      platformDemoRequests: number
      averageEngagementTime: number
      contentEngagementRate: number
    }
    timeSeries: Array<{
      date: string
      users: number
      sessions: number
      pageViews: number
      patientUsers: number
      hcpUsers: number
    }>
  }
}

export const PatientHCPSegmentationWidget: React.FC<PatientHCPSegmentationWidgetProps> = ({ data }) => {
  // Prepare pie chart data
  const audienceData = [
    {
      name: 'Patient Visitors',
      value: data.healthcare.patientVisitors,
      color: '#FF3B30',
      percentage: (data.healthcare.patientVisitors / (data.healthcare.patientVisitors + data.healthcare.hcpVisitors)) * 100
    },
    {
      name: 'Healthcare Professionals',
      value: data.healthcare.hcpVisitors,
      color: '#34C759',
      percentage: (data.healthcare.hcpVisitors / (data.healthcare.patientVisitors + data.healthcare.hcpVisitors)) * 100
    }
  ]

  // Prepare audience trends data
  const trendsData = data.timeSeries.slice(-14).map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    patients: item.patientUsers,
    hcp: item.hcpUsers,
    total: item.users
  }))

  // Mock behavioral data (in production, this would come from analytics)
  const behaviorData = [
    { 
      segment: 'Patients',
      avgSessionDuration: 145,
      pagesPerSession: 3.2,
      bounceRate: 42.3,
      conversionRate: 2.8,
      topContent: ['Patient Portal Guide', 'Symptom Checker', 'Appointment Booking']
    },
    {
      segment: 'Healthcare Professionals',
      avgSessionDuration: 285,
      pagesPerSession: 5.7,
      bounceRate: 28.1,
      conversionRate: 8.4,
      topContent: ['Clinical Research', 'EHR Documentation', 'Platform Demos']
    }
  ]

  // Engagement comparison data
  const engagementComparison = [
    { metric: 'Avg Session Duration', patients: 145, hcp: 285, unit: 'seconds' },
    { metric: 'Pages per Session', patients: 3.2, hcp: 5.7, unit: 'pages' },
    { metric: 'Bounce Rate', patients: 42.3, hcp: 28.1, unit: '%' },
    { metric: 'Conversion Rate', patients: 2.8, hcp: 8.4, unit: '%' }
  ]

  // Format value based on unit
  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case 'seconds':
        const mins = Math.floor(value / 60)
        const secs = Math.floor(value % 60)
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
      case '%':
        return `${value.toFixed(1)}%`
      default:
        return value.toString()
    }
  }

  return (
    <div className="space-y-6">
      {/* Audience Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Patient vs. Healthcare Professional Segmentation
          </CardTitle>
          <CardDescription>
            Visitor distribution and behavior patterns by user type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={audienceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {audienceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value.toLocaleString(), 'Visitors']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="space-y-3">
                {audienceData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-sm" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{item.value.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Insights */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Key Audience Insights</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800">Patient Visitors</span>
                    <Badge variant="secondary" className="ml-auto">65%</Badge>
                  </div>
                  <div className="text-sm text-red-700 space-y-1">
                    <p>• Primary focus on patient portal and appointment scheduling</p>
                    <p>• Higher mobile usage (68% mobile traffic)</p>
                    <p>• Preference for simplified, visual content</p>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Healthcare Professionals</span>
                    <Badge variant="secondary" className="ml-auto">35%</Badge>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>• Deep engagement with clinical research content</p>
                    <p>• Higher conversion rates for platform demos</p>
                    <p>• Preference for detailed technical documentation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audience Trends Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Audience Growth Trends (14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} users`,
                    name === 'patients' ? 'Patients' : 
                    name === 'hcp' ? 'Healthcare Professionals' : 'Total'
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="patients" 
                  stackId="1"
                  stroke="#FF3B30" 
                  fill="#FF3B30" 
                  fillOpacity={0.6}
                  name="Patient Visitors"
                />
                <Area 
                  type="monotone" 
                  dataKey="hcp" 
                  stackId="1"
                  stroke="#34C759" 
                  fill="#34C759" 
                  fillOpacity={0.6}
                  name="Healthcare Professionals"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Behavioral Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            Behavioral Analysis Comparison
          </CardTitle>
          <CardDescription>
            Engagement patterns and preferences by user segment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Engagement Metrics Comparison */}
            <div className="grid gap-4">
              {engagementComparison.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{item.metric}</h3>
                    <div className="text-sm text-gray-600">
                      Better: {item.metric === 'Bounce Rate' ? 
                        (item.patients < item.hcp ? 'Patients' : 'HCP') :
                        (item.patients > item.hcp ? 'Patients' : 'HCP')
                      }
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded-sm" />
                      <div>
                        <div className="text-sm text-gray-600">Patients</div>
                        <div className="font-bold">{formatValue(item.patients, item.unit)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded-sm" />
                      <div>
                        <div className="text-sm text-gray-600">Healthcare Professionals</div>
                        <div className="font-bold">{formatValue(item.hcp, item.unit)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Content by Segment */}
            <div className="grid md:grid-cols-2 gap-6">
              {behaviorData.map((segment, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    {segment.segment === 'Patients' ? (
                      <Heart className="h-4 w-4 text-red-500" />
                    ) : (
                      <Stethoscope className="h-4 w-4 text-green-500" />
                    )}
                    Top Content - {segment.segment}
                  </h3>
                  <div className="space-y-2">
                    {segment.topContent.map((content, contentIndex) => (
                      <div key={contentIndex} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{content}</span>
                        <Badge variant="outline" className="text-xs">
                          #{contentIndex + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Recommendations */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-800">Segment-Specific Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                <Heart className="h-4 w-4" />
                For Patient Visitors
              </h3>
              <div className="space-y-2 text-sm text-purple-700">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2" />
                  <div>Optimize mobile experience and loading speeds</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2" />
                  <div>Create more visual, simplified content formats</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2" />
                  <div>Improve patient portal onboarding flow</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                For Healthcare Professionals
              </h3>
              <div className="space-y-2 text-sm text-purple-700">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2" />
                  <div>Expand clinical research content library</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2" />
                  <div>Add advanced filtering for technical documentation</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2" />
                  <div>Create role-based content personalization</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}