'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Target,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react'

interface ConversionStep {
  name: string
  visitors: number
  conversionRate: number
  dropOffRate: number
}

interface ConversionGoal {
  name: string
  target: number
  current: number
  trend: 'up' | 'down' | 'stable'
  completionRate: number
}

export function ConversionDashboard() {
  // Sample funnel data
  const funnelSteps: ConversionStep[] = [
    {
      name: 'Homepage Visit',
      visitors: 10000,
      conversionRate: 100,
      dropOffRate: 0
    },
    {
      name: 'Service Page View',
      visitors: 6500,
      conversionRate: 65,
      dropOffRate: 35
    },
    {
      name: 'Contact Form Start',
      visitors: 2800,
      conversionRate: 28,
      dropOffRate: 57
    },
    {
      name: 'Form Submission',
      visitors: 1200,
      conversionRate: 12,
      dropOffRate: 57
    },
    {
      name: 'Qualified Lead',
      visitors: 480,
      conversionRate: 4.8,
      dropOffRate: 60
    }
  ]

  // Sample goals data
  const conversionGoals: ConversionGoal[] = [
    {
      name: 'Contact Form Submissions',
      target: 1500,
      current: 1200,
      trend: 'up',
      completionRate: 80
    },
    {
      name: 'Demo Requests',
      target: 300,
      current: 245,
      trend: 'up',
      completionRate: 82
    },
    {
      name: 'Newsletter Signups',
      target: 2000,
      current: 1850,
      trend: 'stable',
      completionRate: 93
    },
    {
      name: 'Resource Downloads',
      target: 500,
      current: 380,
      trend: 'down',
      completionRate: 76
    }
  ]

  // Calculate overall conversion rate
  const overallConversionRate = (
    (funnelSteps[funnelSteps.length - 1].visitors / funnelSteps[0].visitors) * 100
  ).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallConversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.8%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,075</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Conversion Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,250</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goal Completion</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82%</div>
            <p className="text-xs text-muted-foreground">
              3 of 4 goals on track
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Tabs */}
      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="paths">User Paths</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel Analysis</CardTitle>
              <CardDescription>
                Track visitor progression through key conversion steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {funnelSteps.map((step, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{step.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {step.visitors.toLocaleString()} visitors
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={step.dropOffRate > 50 ? 'destructive' : 'default'}>
                          {step.conversionRate}% conversion
                        </Badge>
                        {index > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.dropOffRate}% drop-off
                          </p>
                        )}
                      </div>
                    </div>
                    <Progress value={step.conversionRate} className="h-2" />
                    {index < funnelSteps.length - 1 && (
                      <div className="flex justify-center my-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Goals Performance</CardTitle>
              <CardDescription>
                Monitor progress towards monthly conversion targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionGoals.map((goal, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{goal.name}</h4>
                        {goal.trend === 'up' && (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        )}
                        {goal.trend === 'down' && (
                          <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {goal.current} / {goal.target}
                        </span>
                        <Badge variant={goal.completionRate >= 80 ? 'default' : 'secondary'}>
                          {goal.completionRate}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={goal.completionRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Goals On Track
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {conversionGoals
                    .filter(g => g.completionRate >= 80)
                    .map((goal, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{goal.name}</span>
                        <Badge variant="outline" className="text-green-600">
                          {goal.completionRate}%
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Goals At Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {conversionGoals
                    .filter(g => g.completionRate < 80)
                    .map((goal, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{goal.name}</span>
                        <Badge variant="outline" className="text-orange-600">
                          {goal.completionRate}%
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="paths" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Conversion Paths</CardTitle>
              <CardDescription>
                Most common user journeys leading to conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Homepage → Services → Contact</h4>
                    <Badge>35% of conversions</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>420 conversions</span>
                    <span>•</span>
                    <span>3.2 pages/session</span>
                    <span>•</span>
                    <span>4:23 avg. duration</span>
                  </div>
                </div>

                <div className="p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Blog → Platform → Demo Request</h4>
                    <Badge>28% of conversions</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>336 conversions</span>
                    <span>•</span>
                    <span>4.5 pages/session</span>
                    <span>•</span>
                    <span>6:12 avg. duration</span>
                  </div>
                </div>

                <div className="p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Direct → Platform → Contact</h4>
                    <Badge>22% of conversions</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>264 conversions</span>
                    <span>•</span>
                    <span>2.8 pages/session</span>
                    <span>•</span>
                    <span>3:45 avg. duration</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Optimization Recommendations</CardTitle>
              <CardDescription>
                AI-powered suggestions to improve conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border bg-blue-50 dark:bg-blue-950">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">High Drop-off: Service to Contact Form</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        57% of visitors leave between viewing services and starting the contact form.
                        Consider adding more CTAs and trust signals on service pages.
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Potential +15% conversion gain
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 border bg-green-50 dark:bg-blue-950">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Optimize Blog to Platform Path</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Blog visitors who view platform pages convert at 8.2%. Add more platform
                        CTAs in high-traffic blog posts.
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Potential +20% conversion gain
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 border bg-orange-50 dark:bg-blue-950">
                  <div className="flex items-start gap-3">
                    <ShoppingCart className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Simplify Contact Form</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Form abandonment rate is 57%. Consider reducing required fields and
                        adding progress indicators.
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Potential +10% conversion gain
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}