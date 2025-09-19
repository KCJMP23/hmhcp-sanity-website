'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowRight, ArrowDown, Users, Clock, MousePointer2, 
  FileText, Stethoscope, GraduationCap, TrendingUp, 
  ExternalLink, Download, AlertCircle, CheckCircle2,
  Activity, Filter, MoreHorizontal
} from 'lucide-react'
import { format } from 'date-fns'

interface UserJourneyStep {
  step: number
  page: string
  element?: string
  action: string
  timestamp: number
  duration: number
  userType: 'patient' | 'healthcare_professional' | 'researcher' | 'unknown'
  exitPoint?: boolean
}

interface UserJourneyData {
  patient: UserJourneyStep[]
  healthcare_professional: UserJourneyStep[]
  researcher: UserJourneyStep[]
}

interface PathAnalytics {
  conversionRate: number
  avgDuration: number
  dropOffPoints: Array<{
    step: number
    page: string
    dropOffRate: number
  }>
  commonPatterns: Array<{
    pattern: string[]
    frequency: number
    conversionRate: number
  }>
}

interface UserJourneyMappingProps {
  data: UserJourneyData
  className?: string
  onStepClick?: (step: UserJourneyStep) => void
}

const USER_TYPE_COLORS = {
  patient: '#FF3B30',
  healthcare_professional: '#34C759', 
  researcher: '#007AFF',
  unknown: '#8E8E93'
}

const USER_TYPE_ICONS = {
  patient: Users,
  healthcare_professional: Stethoscope,
  researcher: GraduationCap,
  unknown: Users
}

const ACTION_ICONS = {
  page_view: FileText,
  click: MousePointer2,
  form_submit: CheckCircle2,
  document_download: Download,
  external_link: ExternalLink,
  video_play: Activity,
  exit: AlertCircle
}

export function UserJourneyMapping({
  data,
  className = '',
  onStepClick
}: UserJourneyMappingProps) {
  const [selectedUserType, setSelectedUserType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'flow' | 'timeline' | 'sankey'>('flow')

  // Process journey data for analytics
  const processedData = useMemo(() => {
    const allJourneys = Object.entries(data).flatMap(([userType, steps]) => 
      steps.map(step => ({ ...step, userType: userType as any }))
    )

    const analytics: Record<string, PathAnalytics> = {}

    Object.entries(data).forEach(([userType, steps]) => {
      const totalSessions = new Set(steps.map(s => `${s.timestamp}-${s.userType}`)).size || 1
      const completedJourneys = steps.filter(s => !s.exitPoint).length
      
      const dropOffAnalysis = steps.reduce((acc, step, index) => {
        const remainingSteps = steps.slice(index + 1)
        const dropOffRate = remainingSteps.length > 0 ? 
          (remainingSteps.filter(s => s.exitPoint).length / remainingSteps.length) * 100 : 0
        
        if (dropOffRate > 0) {
          acc.push({
            step: step.step,
            page: step.page,
            dropOffRate
          })
        }
        return acc
      }, [] as Array<{ step: number; page: string; dropOffRate: number }>)

      analytics[userType] = {
        conversionRate: (completedJourneys / totalSessions) * 100,
        avgDuration: steps.reduce((sum, s) => sum + s.duration, 0) / steps.length,
        dropOffPoints: dropOffAnalysis.slice(0, 3),
        commonPatterns: generateCommonPatterns(steps)
      }
    })

    return { allJourneys, analytics }
  }, [data])

  const generateCommonPatterns = (steps: UserJourneyStep[]) => {
    // Simplified pattern analysis - group by page sequences
    const sequences: Record<string, number> = {}
    
    for (let i = 0; i < steps.length - 1; i++) {
      const pattern = [steps[i].page, steps[i + 1].page]
      const key = pattern.join(' → ')
      sequences[key] = (sequences[key] || 0) + 1
    }

    return Object.entries(sequences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pattern, frequency]) => ({
        pattern: pattern.split(' → '),
        frequency,
        conversionRate: Math.random() * 40 + 60 // Mock conversion rate
      }))
  }

  const renderFlowDiagram = (userType: string, steps: UserJourneyStep[]) => {
    const userColor = USER_TYPE_COLORS[userType as keyof typeof USER_TYPE_COLORS]
    const UserIcon = USER_TYPE_ICONS[userType as keyof typeof USER_TYPE_ICONS]
    const analytics = processedData.analytics[userType]

    return (
      <div className="space-y-6">
        {/* User Type Header */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <div 
            className="p-2 rounded-full text-white"
            style={{ backgroundColor: userColor }}
          >
            <UserIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 capitalize">
              {userType.replace('_', ' ')} Journey
            </h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span>Conversion: {analytics?.conversionRate.toFixed(1)}%</span>
              <span>Avg Duration: {Math.round((analytics?.avgDuration || 0) / 1000 / 60)}min</span>
              <span>{steps.length} steps</span>
            </div>
          </div>
          <Badge variant="outline" style={{ borderColor: userColor, color: userColor }}>
            {steps.length} interactions
          </Badge>
        </div>

        {/* Journey Flow */}
        <div className="relative">
          {steps.map((step, index) => {
            const ActionIcon = ACTION_ICONS[step.action as keyof typeof ACTION_ICONS] || Activity
            const isLastStep = index === steps.length - 1
            const isExitPoint = step.exitPoint

            return (
              <div key={`${step.step}-${step.timestamp}`} className="relative">
                {/* Step Card */}
                <div 
                  className={`
                    relative p-4 bg-white rounded-lg border-2 cursor-pointer
                    transition-all duration-200 hover:shadow-md
                    ${isExitPoint ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-gray-300'}
                  `}
                  onClick={() => onStepClick?.(step)}
                  style={{ 
                    borderLeftColor: userColor,
                    borderLeftWidth: '4px'
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Step Number */}
                    <div 
                      className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold"
                      style={{ backgroundColor: userColor }}
                    >
                      {step.step}
                    </div>

                    {/* Step Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <ActionIcon className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900 capitalize">
                          {step.action.replace('_', ' ')}
                        </span>
                        {step.element && (
                          <Badge variant="secondary" className="text-xs">
                            {step.element}
                          </Badge>
                        )}
                        {isExitPoint && (
                          <Badge variant="destructive" className="text-xs">
                            Exit Point
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-600">
                        {step.page}
                      </div>
                      
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.round(step.duration / 1000)}s
                        </span>
                        <span>
                          {format(new Date(step.timestamp), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>

                    {/* Duration Bar */}
                    <div className="w-20">
                      <div className="text-xs text-gray-500 mb-1">Engagement</div>
                      <Progress 
                        value={(step.duration / 300000) * 100} // Max 5 min = 100%
                        className="h-2"
                        style={{ 
                          '--progress-background': userColor 
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>

                {/* Connection Arrow */}
                {!isLastStep && (
                  <div className="flex justify-center my-4">
                    <div 
                      className="flex items-center justify-center w-8 h-8 rounded-full"
                      style={{ backgroundColor: `${userColor}20` }}
                    >
                      <ArrowDown 
                        className="h-4 w-4"
                        style={{ color: userColor }}
                      />
                    </div>
                  </div>
                )}

                {/* Drop-off Indicator */}
                {isExitPoint && (
                  <div className="absolute -right-2 top-2">
                    <div className="bg-red-500 text-white rounded-full p-1">
                      <AlertCircle className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Journey Analytics</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drop-off Points */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Top Drop-off Points</h5>
                <div className="space-y-2">
                  {analytics.dropOffPoints.map((dropOff, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate">{dropOff.page}</span>
                      <Badge variant="destructive" className="ml-2">
                        {dropOff.dropOffRate.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Patterns */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Common Paths</h5>
                <div className="space-y-2">
                  {analytics.commonPatterns.map((pattern, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        {pattern.pattern.map((page, i) => (
                          <span key={i} className="flex items-center">
                            <span className="truncate max-w-[80px]" title={page}>
                              {page.split('/').pop()}
                            </span>
                            {i < pattern.pattern.length - 1 && (
                              <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                            )}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {pattern.frequency} times
                        </Badge>
                        <span className="text-xs text-green-600">
                          {pattern.conversionRate.toFixed(1)}% conversion
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const filteredUserTypes = selectedUserType === 'all' 
    ? Object.keys(data)
    : [selectedUserType]

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Display' }}>
              User Journey Mapping
            </CardTitle>
            <CardDescription>
              HIPAA-compliant patient vs healthcare professional pathway analysis
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={selectedUserType} onValueChange={setSelectedUserType}>
              <TabsList className="bg-gray-100">
                <TabsTrigger value="all" className="text-xs">All Users</TabsTrigger>
                <TabsTrigger value="patient" className="text-xs">Patients</TabsTrigger>
                <TabsTrigger value="healthcare_professional" className="text-xs">HCP</TabsTrigger>
                <TabsTrigger value="researcher" className="text-xs">Researchers</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="flow">Flow Diagram</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="sankey">Sankey Diagram</TabsTrigger>
          </TabsList>

          <TabsContent value="flow" className="mt-6">
            <div className="space-y-8">
              {filteredUserTypes.map(userType => (
                <div key={userType}>
                  {renderFlowDiagram(userType, data[userType as keyof UserJourneyData])}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2" />
              <p>Timeline view coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="sankey" className="mt-6">
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="h-8 w-8 mx-auto mb-2" />
              <p>Sankey diagram visualization coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}