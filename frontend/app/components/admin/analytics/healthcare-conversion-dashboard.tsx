'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Stethoscope,
  HeartHandshake,
  FileText,
  Calendar as CalendarIcon,
  UserCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  Download,
  Mail,
  Phone,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
  Area,
  AreaChart
} from 'recharts'
import { format, subDays } from 'date-fns'

interface ConversionEvent {
  id: string
  event_type: string
  event_category: string
  event_value: number
  patient_persona: string
  healthcare_specialty: string
  device_type: string
  event_timestamp: string
  utm_campaign: string
  utm_source: string
}

interface FunnelStage {
  stage: string
  stage_order: number
  total_events: number
  unique_users: number
  conversion_rate: number
  drop_off_rate: number
  avg_time_to_next_stage: number
}

interface AttributionData {
  attribution_path: string
  first_touch_source: string
  last_touch_source: string
  conversion_count: number
  total_value: number
  avg_journey_length: number
  avg_time_to_convert_hours: number
  top_content_types: string[]
}

interface GoalData {
  goal_name: string
  goal_type: string
  target_value: number
  current_value: number
  completion_rate: number
  days_remaining: number
  trend_direction: 'up' | 'down' | 'stable'
  last_updated: string
}

interface PersonaInsight {
  patient_persona: string
  total_conversions: number
  consultation_requests: number
  content_downloads: number
  avg_event_value: number
  top_healthcare_specialty: string
  preferred_device: string
  avg_time_to_convert_hours: number
  conversion_rate: number
}

export function HealthcareConversionDashboard() {
  const { toast } = useToast()
  const [conversions, setConversions] = useState<ConversionEvent[]>([])
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([])
  const [attributionData, setAttributionData] = useState<AttributionData[]>([])
  const [goalData, setGoalData] = useState<GoalData[]>([])
  const [personaInsights, setPersonaInsights] = useState<PersonaInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [filters, setFilters] = useState({
    eventType: '',
    patientPersona: '',
    healthcareSpecialty: '',
    deviceType: '',
    utmCampaign: ''
  })

  useEffect(() => {
    loadConversionData()
  }, [dateRange, filters])

  const loadConversionData = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      })

      const response = await fetch(`/api/admin/analytics/conversions?${queryParams}`)
      if (!response.ok) throw new Error('Failed to load conversion data')
      
      const data = await response.json()
      
      if (data.success) {
        setConversions(data.data.conversions || [])
        setFunnelData(data.data.funnel || [])
        setAttributionData(data.data.attribution || [])
        
        // Load goal tracking data
        const goalResponse = await fetch(`/api/admin/analytics/conversions/goals?${queryParams}`)
        if (goalResponse.ok) {
          const goalData = await goalResponse.json()
          setGoalData(goalData.data || [])
        }
        
        // Load persona insights
        const personaResponse = await fetch(`/api/admin/analytics/conversions/personas?${queryParams}`)
        if (personaResponse.ok) {
          const personaData = await personaResponse.json()
          setPersonaInsights(personaData.data || [])
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load conversion data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const totalConversions = conversions.length
  const consultationRequests = conversions.filter(c => c.event_type === 'consultation_request').length
  const clinicalInquiries = conversions.filter(c => c.event_type === 'clinical_trial_inquiry').length
  const healthcareDownloads = conversions.filter(c => c.event_type === 'healthcare_download').length

  const overallConversionRate = funnelData.length > 0 
    ? funnelData[funnelData.length - 1]?.conversion_rate || 0 
    : 0

  const totalConversionValue = conversions.reduce((sum, c) => sum + c.event_value, 0)

  // Healthcare-specific color palette
  const healthcareColors = {
    primary: '#1e40af', // Medical blue
    secondary: '#7c3aed', // Purple
    success: '#059669', // Green
    warning: '#d97706', // Orange
    danger: '#dc2626', // Red
    patient: '#3b82f6',
    provider: '#8b5cf6',
    caregiver: '#06b6d4',
    administrator: '#10b981',
    researcher: '#f59e0b'
  }

  const COLORS = [
    healthcareColors.primary,
    healthcareColors.secondary,
    healthcareColors.success,
    healthcareColors.warning,
    healthcareColors.danger
  ]

  return (
    <div className="space-y-6">
      {/* Header with Date Range Picker and Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Healthcare Conversion Analytics</h2>
          <p className="text-muted-foreground">Track patient journey conversions and healthcare-specific goals</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to })
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Healthcare KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultation Requests</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{consultationRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Healthcare consultations initiated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clinical Trial Inquiries</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{clinicalInquiries}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Research participation interest
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthcare Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthcareDownloads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Medical resources downloaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Patient journey completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Patient Journey Funnel</TabsTrigger>
          <TabsTrigger value="attribution">Attribution Analysis</TabsTrigger>
          <TabsTrigger value="personas">Patient Personas</TabsTrigger>
          <TabsTrigger value="goals">Healthcare Goals</TabsTrigger>
        </TabsList>

        {/* Patient Journey Funnel */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Healthcare Patient Journey Funnel</CardTitle>
              <CardDescription>
                Track patient progression from awareness to healthcare advocacy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {funnelData.length > 0 ? (
                <div className="space-y-6">
                  {/* Funnel Visualization */}
                  <div className="flex flex-col space-y-4">
                    {funnelData.map((stage, index) => (
                      <div key={stage.stage} className="relative">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <div 
                              className="flex items-center justify-between p-6 rounded-lg border-2 transition-all hover:shadow-lg"
                              style={{
                                borderColor: COLORS[index % COLORS.length],
                                backgroundColor: `${COLORS[index % COLORS.length]}08`
                              }}
                            >
                              <div>
                                <h3 className="font-semibold capitalize text-lg">
                                  {stage.stage.replace('_', ' ')}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {stage.unique_users.toLocaleString()} users • {stage.total_events.toLocaleString()} events
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                                  {stage.conversion_rate.toFixed(1)}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {stage.drop_off_rate.toFixed(1)}% drop-off
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < funnelData.length - 1 && (
                          <div className="flex justify-center my-2">
                            <ArrowDown className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Stage Performance Metrics */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {funnelData.map((stage, index) => (
                      <Card key={stage.stage}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium capitalize">
                            {stage.stage.replace('_', ' ')} Stage
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-bold">
                            {stage.avg_time_to_next_stage.toFixed(1)}h
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Avg. time to next stage
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No funnel data available for the selected date range
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attribution Analysis */}
        <TabsContent value="attribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Touch Attribution Analysis</CardTitle>
              <CardDescription>
                Healthcare content journey mapping and attribution paths
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attributionData.length > 0 ? (
                <div className="space-y-6">
                  {/* Top Attribution Paths */}
                  <div className="space-y-4">
                    {attributionData.slice(0, 10).map((path, index) => (
                      <div key={path.attribution_path} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{path.attribution_path}</div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{path.avg_journey_length} touchpoints</span>
                            <span>{path.avg_time_to_convert_hours.toFixed(1)}h journey</span>
                            <div className="flex gap-1">
                              {path.top_content_types.slice(0, 3).map(type => (
                                <Badge key={type} variant="outline" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {path.conversion_count}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${path.total_value.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Attribution Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attributionData.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="first_touch_source" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80} 
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [value, name]}
                          labelFormatter={(label) => `Source: ${label}`}
                        />
                        <Bar 
                          dataKey="conversion_count" 
                          fill={healthcareColors.primary} 
                          name="Conversions"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No attribution data available for the selected date range
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patient Personas */}
        <TabsContent value="personas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Persona Conversion Analysis</CardTitle>
              <CardDescription>
                Conversion patterns and preferences by patient type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {personaInsights.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {personaInsights.map((persona) => {
                    const getPersonaColor = (personaType: string) => {
                      return healthcareColors[personaType as keyof typeof healthcareColors] || healthcareColors.primary
                    }
                    
                    const getPersonaIcon = (personaType: string) => {
                      switch (personaType) {
                        case 'patient': return <Users className="h-5 w-5" />
                        case 'provider': return <Stethoscope className="h-5 w-5" />
                        case 'caregiver': return <HeartHandshake className="h-5 w-5" />
                        case 'administrator': return <UserCheck className="h-5 w-5" />
                        case 'researcher': return <Activity className="h-5 w-5" />
                        default: return <Users className="h-5 w-5" />
                      }
                    }

                    return (
                      <Card key={persona.patient_persona} className="border-2" style={{borderColor: getPersonaColor(persona.patient_persona)}}>
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="p-2 rounded-md"
                              style={{ backgroundColor: `${getPersonaColor(persona.patient_persona)}20` }}
                            >
                              {getPersonaIcon(persona.patient_persona)}
                            </div>
                            <CardTitle className="capitalize">
                              {persona.patient_persona || 'Unknown'}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-lg font-bold" style={{color: getPersonaColor(persona.patient_persona)}}>
                                {persona.total_conversions}
                              </div>
                              <p className="text-xs text-muted-foreground">Total Conversions</p>
                            </div>
                            <div>
                              <div className="text-lg font-bold">
                                {persona.conversion_rate.toFixed(1)}%
                              </div>
                              <p className="text-xs text-muted-foreground">Conversion Rate</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Consultations:</span>
                              <span className="font-medium">{persona.consultation_requests}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Downloads:</span>
                              <span className="font-medium">{persona.content_downloads}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Avg. Value:</span>
                              <span className="font-medium">${persona.avg_event_value.toFixed(0)}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Top Specialty:</span>
                              <Badge variant="outline" className="text-xs">
                                {persona.top_healthcare_specialty}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-xs items-center">
                              <span className="text-muted-foreground">Preferred Device:</span>
                              <div className="flex items-center gap-1">
                                {persona.preferred_device === 'mobile' && <Smartphone className="h-3 w-3" />}
                                {persona.preferred_device === 'desktop' && <Monitor className="h-3 w-3" />}
                                {persona.preferred_device === 'tablet' && <Tablet className="h-3 w-3" />}
                                <span className="capitalize">{persona.preferred_device}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No persona data available for the selected date range
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Healthcare Goals */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Healthcare Conversion Goals</CardTitle>
              <CardDescription>
                Track progress towards healthcare-specific conversion targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {goalData.length > 0 ? (
                <div className="space-y-6">
                  {goalData.map((goal) => {
                    const progressPercentage = (goal.current_value / goal.target_value) * 100
                    const isOnTrack = progressPercentage >= 70
                    
                    return (
                      <div key={goal.goal_name} className="p-6 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md ${
                              isOnTrack ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                              {goal.goal_type === 'conversion' && <Target className="h-4 w-4 text-green-600" />}
                              {goal.goal_type === 'engagement' && <Activity className="h-4 w-4 text-blue-600" />}
                              {goal.goal_type === 'lead_generation' && <Mail className="h-4 w-4 text-purple-600" />}
                            </div>
                            <div>
                              <h3 className="font-semibold">{goal.goal_name}</h3>
                              <p className="text-sm text-muted-foreground capitalize">
                                {goal.goal_type.replace('_', ' ')} • {goal.days_remaining} days remaining
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {goal.trend_direction === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                            {goal.trend_direction === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                            <Badge variant={isOnTrack ? 'default' : 'secondary'}>
                              {progressPercentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress: {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}</span>
                            <span>{goal.completion_rate.toFixed(1)}% Complete</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                isOnTrack ? 'bg-green-600' : 'bg-orange-500'
                              }`}
                              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No goal data available for the selected date range
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}