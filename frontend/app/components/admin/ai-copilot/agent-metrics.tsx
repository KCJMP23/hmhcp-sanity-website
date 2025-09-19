'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Brain,
  RefreshCw,
  Download,
  Calendar,
  Bell,
  Settings,
  Target,
  TrendingUpDown,
  Shield,
  Lightbulb,
  X
} from 'lucide-react';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import type { AgentType, AgentMetrics as AgentMetricsType } from '@/types/ai/workflows';

const AGENT_COLORS: Record<string, string> = {
  'research-agent': '#3B82F6',
  'content-agent': '#10B981',
  'medical-accuracy-agent': '#EF4444',
  'compliance-agent': '#F59E0B',
  'seo-agent': '#8B5CF6',
  'image-agent': '#EC4899',
  'social-agent': '#6366F1',
  'publishing-agent': '#6B7280',
  'workflow-agent': '#F97316',
  'qa-agent': '#14B8A6'
};

interface MetricCard {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  color?: string;
  alert?: {
    type: 'warning' | 'critical';
    message: string;
  };
}

interface BudgetAlert {
  id: string;
  type: 'budget_warning' | 'budget_critical' | 'usage_spike' | 'cost_prediction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  threshold: number;
  currentValue: number;
  predictedValue?: number;
  recommendations: string[];
  createdAt: Date;
  dismissed?: boolean;
}

interface CostPrediction {
  daily: number;
  weekly: number;
  monthly: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
}

export function AgentMetrics() {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [metrics, setMetrics] = useState<AgentMetricsType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [costPrediction, setCostPrediction] = useState<CostPrediction | null>(null);
  const [budgetThresholds, setBudgetThresholds] = useState({
    warning: 80,
    critical: 95,
    monthlyBudget: 2000
  });
  const [showAlerts, setShowAlerts] = useState(true);
  const { activeExecutions } = useWorkflowStore();

  // Calculate aggregate metrics
  const calculateMetrics = () => {
    const totalExecutions = activeExecutions.size;
    const completedExecutions = Array.from(activeExecutions.values()).filter(
      e => e.status === 'completed'
    ).length;
    const failedExecutions = Array.from(activeExecutions.values()).filter(
      e => e.status === 'failed'
    ).length;
    
    const totalCost = Array.from(activeExecutions.values()).reduce(
      (sum, e) => sum + (e.costUsd || 0), 0
    );
    
    const totalTokens = Array.from(activeExecutions.values()).reduce(
      (sum, e) => sum + (e.tokensUsed || 0), 0
    );
    
    const avgExecutionTime = totalExecutions > 0
      ? Array.from(activeExecutions.values()).reduce(
          (sum, e) => sum + (e.executionTimeMs || 0), 0
        ) / totalExecutions / 1000
      : 0;
    
    const successRate = totalExecutions > 0
      ? (completedExecutions / totalExecutions) * 100
      : 0;
    
    return {
      totalExecutions,
      completedExecutions,
      failedExecutions,
      totalCost,
      totalTokens,
      avgExecutionTime,
      successRate
    };
  };

  const stats = calculateMetrics();

  // Mock data for charts - in production, this would come from API
  const performanceData = [
    { time: '00:00', executions: 12, cost: 2.5, tokens: 5000, latency: 1200 },
    { time: '04:00', executions: 8, cost: 1.8, tokens: 3500, latency: 1100 },
    { time: '08:00', executions: 25, cost: 5.2, tokens: 12000, latency: 1500 },
    { time: '12:00', executions: 45, cost: 9.8, tokens: 22000, latency: 1800 },
    { time: '16:00', executions: 38, cost: 8.2, tokens: 18000, latency: 1600 },
    { time: '20:00', executions: 22, cost: 4.5, tokens: 10000, latency: 1300 },
    { time: '24:00', executions: 15, cost: 3.2, tokens: 7000, latency: 1250 }
  ];

  const agentUsageData = Object.entries(AGENT_COLORS).map(([agent, color]) => ({
    name: agent.replace('_', ' '),
    value: Math.floor(Math.random() * 100 + 20),
    color
  }));

  const costBreakdown = [
    { category: 'AI Processing', cost: 145.20, percentage: 45 },
    { category: 'Storage', cost: 32.50, percentage: 10 },
    { category: 'API Calls', cost: 64.80, percentage: 20 },
    { category: 'Data Transfer', cost: 48.60, percentage: 15 },
    { category: 'Other', cost: 32.40, percentage: 10 }
  ];

  const metricCards: MetricCard[] = [
    {
      label: 'Total Executions',
      value: stats.totalExecutions,
      change: 12.5,
      trend: 'up',
      icon: Activity,
      color: 'text-blue-600'
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate.toFixed(1)}%`,
      change: 3.2,
      trend: 'up',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      label: 'Total Cost',
      value: `$${stats.totalCost.toFixed(2)}`,
      change: -5.3,
      trend: 'down',
      icon: DollarSign,
      color: 'text-yellow-600'
    },
    {
      label: 'Avg Latency',
      value: `${stats.avgExecutionTime.toFixed(1)}s`,
      change: -8.1,
      trend: 'down',
      icon: Clock,
      color: 'text-purple-600'
    },
    {
      label: 'Tokens Used',
      value: stats.totalTokens.toLocaleString(),
      change: 15.7,
      trend: 'up',
      icon: Brain,
      color: 'text-indigo-600'
    },
    {
      label: 'Error Rate',
      value: `${((stats.failedExecutions / Math.max(stats.totalExecutions, 1)) * 100).toFixed(1)}%`,
      change: -2.1,
      trend: 'down',
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ];

  // Load budget alerts and predictions
  useEffect(() => {
    loadBudgetAlerts();
    loadCostPredictions();
  }, []);

  useEffect(() => {
    // Simulate loading metrics
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        // In production, fetch from API
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load metrics:', error);
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, [timeRange, selectedAgent]);
  
  const loadBudgetAlerts = async () => {
    // Mock budget alerts - in production, fetch from API
    const mockAlerts: BudgetAlert[] = [
      {
        id: '1',
        type: 'budget_warning',
        severity: 'medium',
        title: 'Budget Warning',
        message: 'Monthly budget usage has reached 82% of allocated funds',
        threshold: 80,
        currentValue: 82,
        recommendations: [
          'Consider reducing model complexity for non-critical workflows',
          'Implement request batching to reduce API calls',
          'Review and optimize prompt lengths'
        ],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: '2',
        type: 'usage_spike',
        severity: 'high',
        title: 'Usage Spike Detected',
        message: 'Token usage increased by 45% in the last 4 hours',
        threshold: 25,
        currentValue: 45,
        predictedValue: 52,
        recommendations: [
          'Investigate workflow anomalies',
          'Check for recursive executions',
          'Review recent workflow changes'
        ],
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];
    setBudgetAlerts(mockAlerts);
  };
  
  const loadCostPredictions = async () => {
    // Mock cost predictions - in production, use ML models
    const mockPrediction: CostPrediction = {
      daily: 67.50,
      weekly: 472.50,
      monthly: 2025.00,
      confidence: 87,
      trend: 'increasing',
      factors: [
        { name: 'Increased Workflow Volume', impact: 35, description: 'More workflows being executed daily' },
        { name: 'Model Upgrades', impact: 22, description: 'Using more expensive models for accuracy' },
        { name: 'Extended Context Windows', impact: 18, description: 'Longer prompts for better results' },
        { name: 'Additional Agent Types', impact: 15, description: 'New specialized agents deployed' },
        { name: 'Data Processing Volume', impact: 10, description: 'Increased data ingestion and processing' }
      ]
    };
    setCostPrediction(mockPrediction);
  };

  const exportMetrics = () => {
    // Export metrics as CSV
    const csv = performanceData.map(row => 
      `${row.time},${row.executions},${row.cost},${row.tokens},${row.latency}`
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-metrics-${new Date().toISOString()}.csv`;
    a.click();
  };

  const dismissAlert = (alertId: string) => {
    setBudgetAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
  };
  
  const activeBudgetAlerts = budgetAlerts.filter(alert => !alert.dismissed);

  return (
    <div className="space-y-6">
      {/* Budget Alerts */}
      {showAlerts && activeBudgetAlerts.length > 0 && (
        <div className="space-y-2">
          {activeBudgetAlerts.map(alert => (
            <Card key={alert.id} className={`border-l-4 ${
              alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
              alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
              alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${
                        alert.severity === 'critical' ? 'text-red-600' :
                        alert.severity === 'high' ? 'text-orange-600' :
                        alert.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <h3 className="font-semibold">{alert.title}</h3>
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    {alert.recommendations.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Recommendations:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {alert.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-500" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedAgent} onValueChange={(v) => setSelectedAgent(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {Object.keys(AGENT_COLORS).map(agent => (
                <SelectItem key={agent} value={agent}>
                  {agent.replace('-', ' ').replace('agent', '').trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showAlerts ? 'default' : 'outline'}
            onClick={() => setShowAlerts(!showAlerts)}
          >
            <Bell className="h-4 w-4 mr-1" />
            Alerts ({activeBudgetAlerts.length})
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={exportMetrics}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`h-4 w-4 ${card.color}`} />
                {card.trend && (
                  <div className="flex items-center gap-1">
                    {card.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : card.trend === 'down' ? (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : null}
                    <span className={`text-xs ${
                      card.trend === 'up' ? 'text-green-500' : 
                      card.trend === 'down' ? 'text-red-500' : ''
                    }`}>
                      {Math.abs(card.change || 0)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Agent Usage</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
          <TabsTrigger value="reliability">Reliability</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="executions" 
                    stroke="#3B82F6" 
                    name="Executions"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="latency" 
                    stroke="#F97316" 
                    name="Latency (ms)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="tokens" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Agent Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={agentUsageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {agentUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent Performance Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agentUsageData.slice(0, 5).map((agent, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="w-6 h-6 p-0 flex items-center justify-center"
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium">{agent.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={agent.value} className="w-20" />
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {agent.value}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cost" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {costPrediction && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUpDown className="h-5 w-5" />
                    Cost Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">${costPrediction.daily.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Daily</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">${costPrediction.weekly.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Weekly</div>
                    </div>
                  </div>
                  <div className="text-center border-t pt-4">
                    <div className="text-3xl font-bold ${costPrediction.monthly > budgetThresholds.monthlyBudget ? 'text-red-600' : 'text-green-600'}">
                      ${costPrediction.monthly.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">Monthly Prediction</div>
                    <Badge variant={costPrediction.trend === 'increasing' ? 'destructive' : 'secondary'}>
                      {costPrediction.confidence}% confidence • {costPrediction.trend}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Cost Drivers:</h4>
                    {costPrediction.factors.slice(0, 3).map((factor, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>{factor.name}</span>
                        <Badge variant="outline">+{factor.impact}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className={`text-2xl font-bold ${
                  (stats.totalCost / budgetThresholds.monthlyBudget) * 100 > budgetThresholds.critical
                    ? 'text-red-600'
                    : (stats.totalCost / budgetThresholds.monthlyBudget) * 100 > budgetThresholds.warning
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  ${budgetThresholds.monthlyBudget}
                </div>
                <div className="text-sm text-muted-foreground">Monthly Budget</div>
                <Progress 
                  value={(stats.totalCost / budgetThresholds.monthlyBudget) * 100} 
                  className="mt-2" 
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {((stats.totalCost / budgetThresholds.monthlyBudget) * 100).toFixed(1)}% used
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  ${stats.totalCost > 0 ? (stats.totalCost / stats.totalExecutions).toFixed(3) : '0.000'}
                </div>
                <div className="text-sm text-muted-foreground">Avg Cost per Execution</div>
                <Badge variant="outline" className="mt-2">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  12% from last week
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  ${costPrediction ? costPrediction.weekly.toFixed(2) : '0.00'}
                </div>
                <div className="text-sm text-muted-foreground">Projected Weekly</div>
                <Badge variant={costPrediction && costPrediction.weekly < (budgetThresholds.monthlyBudget / 4) ? 'secondary' : 'destructive'} className="mt-2">
                  {costPrediction && costPrediction.weekly < (budgetThresholds.monthlyBudget / 4) ? 'Under budget' : 'Over budget'}
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  ${(budgetThresholds.monthlyBudget - stats.totalCost).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Remaining Budget</div>
                <Badge variant="outline" className="mt-2">
                  <Target className="h-3 w-3 mr-1" />
                  {((budgetThresholds.monthlyBudget - stats.totalCost) / budgetThresholds.monthlyBudget * 100).toFixed(0)}% left
                </Badge>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Budget Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monthly Budget ($)</label>
                  <input
                    type="number"
                    value={budgetThresholds.monthlyBudget}
                    onChange={(e) => setBudgetThresholds(prev => ({ ...prev, monthlyBudget: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Warning Threshold (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={budgetThresholds.warning}
                    onChange={(e) => setBudgetThresholds(prev => ({ ...prev, warning: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Critical Threshold (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={budgetThresholds.critical}
                    onChange={(e) => setBudgetThresholds(prev => ({ ...prev, critical: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <Button size="sm" className="mt-4">
                <Shield className="h-4 w-4 mr-2" />
                Save Budget Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reliability" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Success Rate by Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.keys(AGENT_COLORS).slice(0, 5).map(agent => {
                    const successRate = Math.random() * 30 + 70;
                    return (
                      <div key={agent} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{agent.replace('_', ' ')}</span>
                          <span className="text-sm font-medium">
                            {successRate.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={successRate} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: 'Timeout', count: 23, color: 'text-yellow-600' },
                    { type: 'Rate Limit', count: 12, color: 'text-orange-600' },
                    { type: 'API Error', count: 8, color: 'text-red-600' },
                    { type: 'Validation', count: 5, color: 'text-purple-600' },
                    { type: 'Other', count: 3, color: 'text-gray-600' }
                  ].map(error => (
                    <div key={error.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className={`h-4 w-4 ${error.color}`} />
                        <span className="text-sm">{error.type}</span>
                      </div>
                      <Badge variant="outline">{error.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}