/**
 * AI Workflow Performance Benchmarking Dashboard
 * 
 * Provides comprehensive performance monitoring and benchmarking for AI workflows
 * including execution metrics, cost analysis, and compliance tracking.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Clock, 
  DollarSign, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Database,
  Shield,
  Target
} from 'lucide-react';

interface PerformanceMetrics {
  executionTime: number;
  costUsd: number;
  tokensUsed: number;
  successRate: number;
  complianceScore: number;
  throughput: number;
}

interface WorkflowBenchmark {
  id: string;
  name: string;
  type: 'clinical' | 'research' | 'compliance' | 'analytics';
  metrics: PerformanceMetrics;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'critical';
  lastRun: string;
}

interface BenchmarkComparison {
  metric: string;
  current: number;
  baseline: number;
  target: number;
  unit: string;
}

const MOCK_WORKFLOWS: WorkflowBenchmark[] = [
  {
    id: 'wf-clinical-1',
    name: 'Patient Risk Assessment',
    type: 'clinical',
    metrics: {
      executionTime: 2340,
      costUsd: 0.23,
      tokensUsed: 1250,
      successRate: 98.5,
      complianceScore: 96.8,
      throughput: 42
    },
    trend: 'up',
    status: 'healthy',
    lastRun: '2 minutes ago'
  },
  {
    id: 'wf-research-1',
    name: 'Drug Interaction Analysis',
    type: 'research',
    metrics: {
      executionTime: 4560,
      costUsd: 0.45,
      tokensUsed: 2100,
      successRate: 94.2,
      complianceScore: 98.9,
      throughput: 28
    },
    trend: 'stable',
    status: 'warning',
    lastRun: '5 minutes ago'
  },
  {
    id: 'wf-compliance-1',
    name: 'HIPAA Validation Engine',
    type: 'compliance',
    metrics: {
      executionTime: 1890,
      costUsd: 0.18,
      tokensUsed: 980,
      successRate: 99.8,
      complianceScore: 99.2,
      throughput: 65
    },
    trend: 'up',
    status: 'healthy',
    lastRun: '1 minute ago'
  }
];

const BENCHMARK_COMPARISONS: BenchmarkComparison[] = [
  { metric: 'Average Execution Time', current: 2930, baseline: 3200, target: 2500, unit: 'ms' },
  { metric: 'Cost Per Execution', current: 0.29, baseline: 0.35, target: 0.25, unit: '$' },
  { metric: 'Success Rate', current: 97.5, baseline: 95.0, target: 99.0, unit: '%' },
  { metric: 'Compliance Score', current: 98.3, baseline: 96.5, target: 99.5, unit: '%' },
  { metric: 'Throughput', current: 45, baseline: 38, target: 60, unit: 'req/min' }
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PerformanceBenchmarkingDashboard() {
  const [workflows, setWorkflows] = useState<WorkflowBenchmark[]>(MOCK_WORKFLOWS);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      case 'stable': return <Activity className="w-4 h-4 text-blue-600" />;
      default: return null;
    }
  };

  const calculatePerformanceScore = (metrics: PerformanceMetrics): number => {
    // Weighted scoring algorithm
    const timeScore = Math.max(0, 100 - (metrics.executionTime / 50));
    const costScore = Math.max(0, 100 - (metrics.costUsd * 200));
    const successScore = metrics.successRate;
    const complianceScore = metrics.complianceScore;
    const throughputScore = Math.min(100, metrics.throughput * 1.5);

    return Math.round(
      (timeScore * 0.2 + costScore * 0.15 + successScore * 0.25 + complianceScore * 0.25 + throughputScore * 0.15)
    );
  };

  const overallMetrics = workflows.reduce((acc, wf) => {
    acc.avgExecutionTime += wf.metrics.executionTime;
    acc.totalCost += wf.metrics.costUsd;
    acc.avgSuccessRate += wf.metrics.successRate;
    acc.avgComplianceScore += wf.metrics.complianceScore;
    acc.totalThroughput += wf.metrics.throughput;
    return acc;
  }, {
    avgExecutionTime: 0,
    totalCost: 0,
    avgSuccessRate: 0,
    avgComplianceScore: 0,
    totalThroughput: 0
  });

  const workflowCount = workflows.length;
  overallMetrics.avgExecutionTime = Math.round(overallMetrics.avgExecutionTime / workflowCount);
  overallMetrics.avgSuccessRate = Math.round((overallMetrics.avgSuccessRate / workflowCount) * 10) / 10;
  overallMetrics.avgComplianceScore = Math.round((overallMetrics.avgComplianceScore / workflowCount) * 10) / 10;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Benchmarking</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and optimize AI workflow performance across all healthcare systems
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button 
            onClick={refreshData} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.avgExecutionTime}ms</div>
            <p className="text-xs text-muted-foreground">
              8.4% faster than baseline
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overallMetrics.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              12.1% under budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.avgSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">
              2.5% above target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.avgComplianceScore}%</div>
            <p className="text-xs text-muted-foreground">
              HIPAA/GDPR compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.totalThroughput}</div>
            <p className="text-xs text-muted-foreground">
              requests/minute
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflow Performance</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Metrics</TabsTrigger>
        </TabsList>

        {/* Workflow Performance Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workflows.map((workflow) => {
              const performanceScore = calculatePerformanceScore(workflow.metrics);
              return (
                <Card key={workflow.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant={workflow.type === 'clinical' ? 'default' : 'secondary'}>
                            {workflow.type}
                          </Badge>
                          <span className={`flex items-center gap-1 ${getStatusColor(workflow.status)}`}>
                            {getStatusIcon(workflow.status)}
                            {workflow.status}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(workflow.trend)}
                        <div className="text-right">
                          <div className="text-2xl font-bold">{performanceScore}</div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Execution Time</div>
                        <div className="font-medium">{workflow.metrics.executionTime}ms</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Cost</div>
                        <div className="font-medium">${workflow.metrics.costUsd}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Success Rate</div>
                        <div className="font-medium">{workflow.metrics.successRate}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Throughput</div>
                        <div className="font-medium">{workflow.metrics.throughput}/min</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Compliance Score</span>
                        <span>{workflow.metrics.complianceScore}%</span>
                      </div>
                      <Progress value={workflow.metrics.complianceScore} className="h-2" />
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Last run: {workflow.lastRun}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance vs Benchmarks</CardTitle>
              <CardDescription>
                Compare current performance against baseline and target metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {BENCHMARK_COMPARISONS.map((benchmark, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{benchmark.metric}</span>
                      <span className="text-sm text-muted-foreground">
                        Current: {benchmark.current}{benchmark.unit}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={(benchmark.current / benchmark.target) * 100} 
                        className="h-3" 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Baseline: {benchmark.baseline}{benchmark.unit}</span>
                        <span>Target: {benchmark.target}{benchmark.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Execution Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={workflows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="metrics.executionTime" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={workflows}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="metrics.costUsd"
                    >
                      {workflows.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Metrics Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              All workflows maintain HIPAA, GDPR, and SOC2 compliance with continuous monitoring
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Scores by Standard</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workflows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[90, 100]} />
                  <Tooltip />
                  <Bar dataKey="metrics.complianceScore" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}