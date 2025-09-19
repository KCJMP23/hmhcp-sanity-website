'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  MousePointer2, Target, TrendingUp, TrendingDown, ExternalLink,
  FileText, Download, Users, Activity, Filter, MoreHorizontal,
  Stethoscope, GraduationCap, Heart, BookOpen, AlertCircle
} from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

interface MedicalTermClick {
  term: string
  clicks: number
  page: string
  userType: 'patient' | 'healthcare_professional' | 'researcher' | 'unknown'
  conversionRate?: number
  category: 'clinical' | 'research' | 'educational' | 'technical'
  importance: 'high' | 'medium' | 'low'
}

interface CTAClick {
  element: string
  clicks: number
  conversions: number
  page: string
  userType: 'patient' | 'healthcare_professional' | 'researcher' | 'unknown'
  ctaType: 'primary' | 'secondary' | 'tertiary'
  action: 'download' | 'signup' | 'demo' | 'contact' | 'navigate'
  position: 'header' | 'hero' | 'content' | 'sidebar' | 'footer'
}

interface ClickTrackingData {
  medicalTerminology: MedicalTermClick[]
  ctaElements: CTAClick[]
}

interface ClickTrackingProps {
  data: ClickTrackingData
  timeRange?: '24h' | '7d' | '30d' | '90d'
  className?: string
}

const USER_TYPE_COLORS = {
  patient: '#FF3B30',
  healthcare_professional: '#34C759',
  researcher: '#007AFF',
  unknown: '#8E8E93'
}

const CTA_TYPE_COLORS = {
  primary: '#007AFF',
  secondary: '#34C759',
  tertiary: '#8E8E93'
}

const CATEGORY_COLORS = {
  clinical: '#FF3B30',
  research: '#007AFF',
  educational: '#34C759',
  technical: '#FF9500'
}

const IMPORTANCE_ICONS = {
  high: AlertCircle,
  medium: Target,
  low: Activity
}

export function ClickTracking({
  data,
  timeRange = '7d',
  className = ''
}: ClickTrackingProps) {
  const [activeTab, setActiveTab] = useState<'medical-terms' | 'cta-analysis' | 'heatmap'>('medical-terms')
  const [selectedUserType, setSelectedUserType] = useState<'all' | 'patient' | 'healthcare_professional' | 'researcher'>('all')
  const [sortBy, setSortBy] = useState<'clicks' | 'conversion' | 'importance'>('clicks')

  // Process and filter data
  const processedData = useMemo(() => {
    let medicalTerms = data.medicalTerminology
    let ctaElements = data.ctaElements

    // Filter by user type
    if (selectedUserType !== 'all') {
      medicalTerms = medicalTerms.filter(term => term.userType === selectedUserType)
      ctaElements = ctaElements.filter(cta => cta.userType === selectedUserType)
    }

    // Sort medical terms
    medicalTerms.sort((a, b) => {
      switch (sortBy) {
        case 'clicks':
          return b.clicks - a.clicks
        case 'conversion':
          return (b.conversionRate || 0) - (a.conversionRate || 0)
        case 'importance':
          const importanceOrder = { high: 3, medium: 2, low: 1 }
          return importanceOrder[b.importance] - importanceOrder[a.importance]
        default:
          return b.clicks - a.clicks
      }
    })

    // Sort CTA elements
    ctaElements.sort((a, b) => {
      const aConversionRate = (a.conversions / a.clicks) * 100
      const bConversionRate = (b.conversions / b.clicks) * 100
      return bConversionRate - aConversionRate
    })

    return { medicalTerms, ctaElements }
  }, [data, selectedUserType, sortBy])

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalMedicalClicks = processedData.medicalTerms.reduce((sum, term) => sum + term.clicks, 0)
    const totalCtaClicks = processedData.ctaElements.reduce((sum, cta) => sum + cta.clicks, 0)
    const totalConversions = processedData.ctaElements.reduce((sum, cta) => sum + cta.conversions, 0)
    
    const termsByCategory = processedData.medicalTerms.reduce((acc, term) => {
      acc[term.category] = (acc[term.category] || 0) + term.clicks
      return acc
    }, {} as Record<string, number>)

    const ctasByType = processedData.ctaElements.reduce((acc, cta) => {
      acc[cta.ctaType] = (acc[cta.ctaType] || 0) + cta.clicks
      return acc
    }, {} as Record<string, number>)

    const userEngagement = Object.keys(USER_TYPE_COLORS).map(userType => {
      const userTerms = data.medicalTerminology.filter(t => t.userType === userType)
      const userCtas = data.ctaElements.filter(c => c.userType === userType)
      return {
        userType,
        termClicks: userTerms.reduce((sum, t) => sum + t.clicks, 0),
        ctaClicks: userCtas.reduce((sum, c) => sum + c.clicks, 0),
        conversions: userCtas.reduce((sum, c) => sum + c.conversions, 0)
      }
    })

    return {
      totalMedicalClicks,
      totalCtaClicks,
      totalConversions,
      overallConversionRate: totalCtaClicks > 0 ? (totalConversions / totalCtaClicks) * 100 : 0,
      termsByCategory,
      ctasByType,
      userEngagement
    }
  }, [processedData, data])

  const renderMedicalTermsAnalysis = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalMedicalClicks.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Term Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{processedData.medicalTerms.length}</p>
                <p className="text-sm text-gray-600">Tracked Terms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Target className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {processedData.medicalTerms.filter(t => t.importance === 'high').length}
                </p>
                <p className="text-sm text-gray-600">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(analytics.totalMedicalClicks / processedData.medicalTerms.length)}
                </p>
                <p className="text-sm text-gray-600">Avg Clicks/Term</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Terminology by Category</CardTitle>
          <CardDescription>Click distribution across content categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(analytics.termsByCategory).map(([category, clicks]) => ({
                    category,
                    clicks,
                    fill: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="clicks"
                  label={({category, percent}) => `${category} ${(percent * 100).toFixed(0)}%`}
                >
                  {Object.entries(analytics.termsByCategory).map(([category], index) => (
                    <Cell key={index} fill={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              {Object.entries(analytics.termsByCategory).map(([category, clicks]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] }}
                    />
                    <span className="font-medium capitalize">{category}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{clicks.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">
                      {((clicks / analytics.totalMedicalClicks) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Medical Terms */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Medical Terms</CardTitle>
              <CardDescription>Most clicked medical terminology and concepts</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 rounded"
              >
                <option value="clicks">Sort by Clicks</option>
                <option value="conversion">Sort by Conversion</option>
                <option value="importance">Sort by Importance</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {processedData.medicalTerms.slice(0, 15).map((term, index) => {
              const ImportanceIcon = IMPORTANCE_ICONS[term.importance]
              return (
                <div key={`${term.term}-${term.page}`} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-lg font-bold text-gray-400 w-8">#{index + 1}</div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{term.term}</span>
                        <ImportanceIcon 
                          className={`h-4 w-4 ${
                            term.importance === 'high' ? 'text-red-500' :
                            term.importance === 'medium' ? 'text-yellow-500' : 'text-gray-500'
                          }`}
                        />
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: CATEGORY_COLORS[term.category],
                            color: CATEGORY_COLORS[term.category]
                          }}
                        >
                          {term.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{term.page}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{term.clicks.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Clicks</p>
                    </div>
                    
                    {term.conversionRate && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{term.conversionRate.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">Conversion</p>
                      </div>
                    )}

                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: USER_TYPE_COLORS[term.userType] }}
                      title={term.userType.replace('_', ' ')}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCTAAnalysis = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MousePointer2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalCtaClicks.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total CTA Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalConversions.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.overallConversionRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Activity className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{processedData.ctaElements.length}</p>
                <p className="text-sm text-gray-600">CTA Elements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Performance */}
      <Card>
        <CardHeader>
          <CardTitle>CTA Performance Analysis</CardTitle>
          <CardDescription>Click-through and conversion rates by call-to-action element</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {processedData.ctaElements.map((cta, index) => {
              const conversionRate = (cta.conversions / cta.clicks) * 100
              return (
                <div key={`${cta.element}-${cta.page}`} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-lg font-bold text-gray-400 w-8">#{index + 1}</div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{cta.element}</span>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: CTA_TYPE_COLORS[cta.ctaType],
                            color: CTA_TYPE_COLORS[cta.ctaType]
                          }}
                        >
                          {cta.ctaType}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {cta.action}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {cta.position}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{cta.page}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{cta.clicks.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Clicks</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{cta.conversions.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Conversions</p>
                    </div>

                    <div className="text-center min-w-[60px]">
                      <p className={`text-lg font-bold ${
                        conversionRate >= 10 ? 'text-green-600' :
                        conversionRate >= 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {conversionRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">Rate</p>
                    </div>

                    <div className="w-24">
                      <Progress value={Math.min(conversionRate, 100)} className="h-2" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Display' }}>
              Click Tracking Analytics
            </CardTitle>
            <CardDescription>
              Medical terminology and CTA performance analysis
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedUserType}
              onChange={(e) => setSelectedUserType(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="all">All Users</option>
              <option value="patient">Patients</option>
              <option value="healthcare_professional">Healthcare Professionals</option>
              <option value="researcher">Researchers</option>
            </select>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="medical-terms">Medical Terms</TabsTrigger>
            <TabsTrigger value="cta-analysis">CTA Analysis</TabsTrigger>
            <TabsTrigger value="heatmap">Click Heatmap</TabsTrigger>
          </TabsList>

          <TabsContent value="medical-terms" className="mt-6">
            {renderMedicalTermsAnalysis()}
          </TabsContent>

          <TabsContent value="cta-analysis" className="mt-6">
            {renderCTAAnalysis()}
          </TabsContent>

          <TabsContent value="heatmap" className="mt-6">
            <div className="text-center py-12 text-gray-500">
              <MousePointer2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Interactive click heatmap visualization</p>
              <p className="text-sm mt-1">Integrated with heatmap visualization component</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}