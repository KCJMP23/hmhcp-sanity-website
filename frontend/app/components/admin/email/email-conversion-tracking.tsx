'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  MousePointer,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface ConversionTrackingProps {
  dateRange: string
  campaignFilter: string
}

interface ConversionData {
  id: string
  campaign_name: string
  campaign_type: string
  conversion_type: string
  conversion_value: number
  conversion_count: number
  total_clicks: number
  conversion_rate: number
  revenue: number
  cost: number
  roi: number
  created_at: string
  last_conversion: string
}

interface ConversionFunnel {
  stage: string
  count: number
  percentage: number
  dropoff_rate: number
}

interface ConversionGoal {
  id: string
  name: string
  type: 'appointment' | 'consultation' | 'download' | 'signup' | 'purchase'
  target_value: number
  current_value: number
  completion_rate: number
  status: 'active' | 'paused' | 'completed'
  created_at: string
  deadline: string
}

const conversionTypes = [
  { value: 'appointment', label: 'Appointment Booking', icon: Calendar, color: 'text-blue-600' },
  { value: 'consultation', label: 'Consultation Request', icon: Users, color: 'text-green-600' },
  { value: 'download', label: 'Resource Download', icon: BarChart3, color: 'text-purple-600' },
  { value: 'signup', label: 'Newsletter Signup', icon: CheckCircle, color: 'text-orange-600' },
  { value: 'purchase', label: 'Service Purchase', icon: DollarSign, color: 'text-red-600' }
]

const goalTypes = [
  { value: 'appointment', label: 'Appointment Bookings' },
  { value: 'consultation', label: 'Consultation Requests' },
  { value: 'download', label: 'Resource Downloads' },
  { value: 'signup', label: 'Newsletter Signups' },
  { value: 'purchase', label: 'Service Purchases' }
]

export function EmailConversionTracking({ dateRange, campaignFilter }: ConversionTrackingProps) {
  const [conversions, setConversions] = useState<ConversionData[]>([])
  const [funnel, setFunnel] = useState<ConversionFunnel[]>([])
  const [goals, setGoals] = useState<ConversionGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [viewMode, setViewMode] = useState('table')

  useEffect(() => {
    loadConversionData()
  }, [dateRange, campaignFilter])

  const loadConversionData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/email/analytics/conversions?date_range=${dateRange}&campaign_filter=${campaignFilter}`)
      const data = await response.json()
      
      if (data.success) {
        setConversions(data.data.conversions || [])
        setFunnel(data.data.funnel || [])
        setGoals(data.data.goals || [])
      } else {
        throw new Error(data.error || 'Failed to load conversion data')
      }
    } catch (error) {
      console.error('Error loading conversion data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConversionTypeInfo = (type: string) => {
    return conversionTypes.find(t => t.value === type) || conversionTypes[0]
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    } else {
      return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const filteredConversions = selectedType === 'all' 
    ? conversions 
    : conversions.filter(c => c.conversion_type === selectedType)

  const totalRevenue = conversions.reduce((sum, c) => sum + c.revenue, 0)
  const totalCost = conversions.reduce((sum, c) => sum + c.cost, 0)
  const totalROI = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading conversion data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversions.reduce((sum, c) => sum + c.conversion_count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(conversions.reduce((sum, c) => sum + c.conversion_rate, 0) / conversions.length || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+1.2%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15.3%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalROI.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.8%</span> from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Conversion Tracking
          </CardTitle>
          <CardDescription>
            Track and analyze email conversion performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Conversion Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select conversion type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {conversionTypes.map((type) => {
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
              <label className="text-sm font-medium">View Mode</label>
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select view mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table View</SelectItem>
                  <SelectItem value="funnel">Funnel View</SelectItem>
                  <SelectItem value="goals">Goals View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <PieChart className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Report
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      {viewMode === 'funnel' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Conversion Funnel
            </CardTitle>
            <CardDescription>
              Track user journey from email to conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnel.map((stage, index) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">{stage.stage}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {stage.count.toLocaleString()} users
                      </span>
                      <span className="font-medium">{stage.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                  {stage.dropoff_rate > 0 && (
                    <div className="text-sm text-red-600">
                      {stage.dropoff_rate.toFixed(1)}% dropoff rate
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Goals */}
      {viewMode === 'goals' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Conversion Goals
            </CardTitle>
            <CardDescription>
              Track progress towards conversion goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.map((goal) => {
                const progress = (goal.current_value / goal.target_value) * 100
                const goalTypeInfo = goalTypes.find(t => t.value === goal.type) || goalTypes[0]
                
                return (
                  <div key={goal.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{goal.name}</h4>
                        <p className="text-sm text-muted-foreground">{goalTypeInfo.label}</p>
                      </div>
                      {getStatusBadge(goal.status)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progress >= 100 ? 'bg-green-500' : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {progress.toFixed(1)}% complete
                        </span>
                        <span className="text-muted-foreground">
                          Due: {new Date(goal.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Table */}
      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Conversion Performance
            </CardTitle>
            <CardDescription>
              Detailed conversion metrics by campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead>Last Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversions.map((conversion) => {
                  const typeInfo = getConversionTypeInfo(conversion.conversion_type)
                  const Icon = typeInfo.icon
                  
                  return (
                    <TableRow key={conversion.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{conversion.campaign_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {conversion.campaign_type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                          <span className="text-sm">{typeInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{conversion.conversion_count.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{conversion.conversion_rate.toFixed(1)}%</span>
                          {getTrendIcon(conversion.conversion_rate, 3.0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${conversion.revenue.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${conversion.cost.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${conversion.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {conversion.roi > 0 ? '+' : ''}{conversion.roi.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(conversion.last_conversion).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
