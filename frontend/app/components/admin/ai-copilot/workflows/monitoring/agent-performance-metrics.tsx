'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Activity,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  Users,
  Target
} from 'lucide-react';

interface AgentMetrics {
  agentName: string;
  totalExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  totalCost: number;
  healthcareComplianceScore: number;
  medicalAccuracyScore: number;
  lastActivity: string;
  status: 'active' | 'idle' | 'error';
  currentTask?: string;
  performanceTrend: 'up' | 'down' | 'stable';
}

interface WorkflowMetrics {
  workflowId: string;
  workflowName: string;
  totalCost: number;
  executionTime: number;
  successRate: number;
  complianceScore: number;
  agentBreakdown: AgentMetrics[];
  completedAt: string;
}

export function AgentPerformanceMetrics() {
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetrics[]>([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPerformanceMetrics();
  }, [timeRange, selectedAgent]);

  const loadPerformanceMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/ai-workflows/performance?timeRange=${timeRange}&agent=${selectedAgent}`);
      if (response.ok) {
        const data = await response.json();
        setAgentMetrics(data.agentMetrics || []);
        setWorkflowMetrics(data.workflowMetrics || []);
      }
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'idle': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="h-4 w-4" />;
      case 'idle': return <Clock className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const calculateTotalCost = () => {
    return agentMetrics.reduce((total, agent) => total + agent.totalCost, 0);
  };

  const calculateAvgSuccessRate = () => {
    if (agentMetrics.length === 0) return 0;
    return agentMetrics.reduce((total, agent) => total + agent.successRate, 0) / agentMetrics.length;
  };

  const calculateAvgComplianceScore = () => {
    if (agentMetrics.length === 0) return 0;
    return agentMetrics.reduce((total, agent) => total + agent.healthcareComplianceScore, 0) / agentMetrics.length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agentMetrics.map((agent) => (
              <SelectItem key={agent.agentName} value={agent.agentName}>
                {agent.agentName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={loadPerformanceMetrics} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalCost())}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange} period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateAvgSuccessRate().toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateAvgComplianceScore().toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Healthcare compliance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agentMetrics.filter(agent => agent.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Agent Performance Metrics
          </CardTitle>
          <CardDescription>
            Detailed performance metrics for each AI agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentMetrics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No agent metrics available
            </div>
          ) : (
            <div className="space-y-4">
              {agentMetrics.map((agent) => (
                <div key={agent.agentName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{agent.agentName}</h3>
                      <Badge className={getStatusColor(agent.status)}>
                        {getStatusIcon(agent.status)}
                        <span className="ml-1 capitalize">{agent.status}</span>
                      </Badge>
                      {agent.performanceTrend && (
                        <div className="flex items-center gap-1">
                          {getTrendIcon(agent.performanceTrend)}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Last activity: {new Date(agent.lastActivity).toLocaleString()}
                    </div>
                  </div>

                  {agent.currentTask && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Current Task</div>
                      <div className="text-sm text-blue-700">{agent.currentTask}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                      <div className="flex items-center gap-2">
                        <Progress value={agent.successRate} className="flex-1" />
                        <span className="text-sm font-medium">{agent.successRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Avg Execution Time</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{formatDuration(agent.avgExecutionTime)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Cost</div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{formatCurrency(agent.totalCost)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Executions</div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{agent.totalExecutions}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-gray-600">Healthcare Compliance Score</div>
                      <div className="flex items-center gap-2">
                        <Progress value={agent.healthcareComplianceScore} className="flex-1" />
                        <span className="text-sm font-medium">{agent.healthcareComplianceScore.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Medical Accuracy Score</div>
                      <div className="flex items-center gap-2">
                        <Progress value={agent.medicalAccuracyScore} className="flex-1" />
                        <span className="text-sm font-medium">{agent.medicalAccuracyScore.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Workflow Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Recent Workflow Performance
          </CardTitle>
          <CardDescription>
            Performance metrics for recently completed workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflowMetrics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No workflow metrics available
            </div>
          ) : (
            <div className="space-y-4">
              {workflowMetrics.map((workflow) => (
                <div key={workflow.workflowId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{workflow.workflowName}</h3>
                    <div className="text-sm text-gray-500">
                      Completed: {new Date(workflow.completedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Total Cost</div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{formatCurrency(workflow.totalCost)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Execution Time</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{formatDuration(workflow.executionTime)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                      <div className="flex items-center gap-2">
                        <Progress value={workflow.successRate} className="flex-1" />
                        <span className="text-sm font-medium">{workflow.successRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Compliance Score</div>
                      <div className="flex items-center gap-2">
                        <Progress value={workflow.complianceScore} className="flex-1" />
                        <span className="text-sm font-medium">{workflow.complianceScore.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm text-gray-600 mb-2">Agent Breakdown</div>
                    <div className="flex flex-wrap gap-2">
                      {workflow.agentBreakdown.map((agent) => (
                        <Badge key={agent.agentName} variant="outline" className="text-xs">
                          {agent.agentName}: {formatCurrency(agent.totalCost)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
