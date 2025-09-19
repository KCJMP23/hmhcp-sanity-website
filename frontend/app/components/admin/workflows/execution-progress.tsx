'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Loader2, BarChart3, TrendingUp, Zap, Database, Globe, Cpu, MemoryStick, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExecutionState, PerformanceMetrics } from '@/lib/workflows/execution-engine';
import { cn } from '@/lib/utils';

interface ExecutionProgressProps {
  execution: ExecutionState;
  className?: string;
}

export function ExecutionProgress({ execution, className }: ExecutionProgressProps) {
  const [progressData, setProgressData] = useState<ProgressData>({
    overall: 0,
    byCategory: {},
    byNodeType: {},
    timeline: [],
    performance: execution.performanceMetrics
  });

  useEffect(() => {
    const data = calculateProgressData(execution);
    setProgressData(data);
  }, [execution]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'paused':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'stopped':
        return 'bg-gray-500';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(execution.status)}
              <div>
                <CardTitle className="text-lg">Execution Progress</CardTitle>
                <CardDescription>
                  {execution.completedNodes} of {execution.totalNodes} nodes completed
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={cn('text-white', getStatusColor(execution.status))}>
              {execution.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{execution.progress.toFixed(1)}%</span>
            </div>
            <Progress value={execution.progress} className="h-3" />
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-2xl font-bold">{execution.completedNodes}</span>
              </div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-2xl font-bold">{execution.failedNodes}</span>
              </div>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-2xl font-bold">{execution.skippedNodes}</span>
              </div>
              <p className="text-xs text-muted-foreground">Skipped</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-2xl font-bold">{execution.warnings.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Progress */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <ExecutionTimeline execution={execution} progressData={progressData} />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <PerformanceProgress metrics={progressData.performance} />
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <ResourceUsage metrics={progressData.performance} />
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <ExecutionMetrics execution={execution} progressData={progressData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ProgressData {
  overall: number;
  byCategory: Record<string, number>;
  byNodeType: Record<string, number>;
  timeline: TimelineEntry[];
  performance: PerformanceMetrics;
}

interface TimelineEntry {
  timestamp: Date;
  event: string;
  nodeId?: string;
  status: string;
  duration?: number;
}

function calculateProgressData(execution: ExecutionState): ProgressData {
  const totalNodes = execution.totalNodes;
  const completedNodes = execution.completedNodes;
  const overall = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

  // Calculate progress by category and node type
  const byCategory: Record<string, number> = {};
  const byNodeType: Record<string, number> = {};

  execution.executionPath.forEach(step => {
    // This would be calculated based on actual node categories and types
    // For now, we'll use mock data
    byCategory[step.nodeType] = (byCategory[step.nodeType] || 0) + 1;
    byNodeType[step.nodeType] = (byNodeType[step.nodeType] || 0) + 1;
  });

  // Create timeline entries
  const timeline: TimelineEntry[] = execution.executionPath.map(step => ({
    timestamp: step.startTime,
    event: `Step: ${step.nodeName}`,
    nodeId: step.nodeId,
    status: step.status,
    duration: step.duration
  }));

  return {
    overall,
    byCategory,
    byNodeType,
    timeline,
    performance: execution.performanceMetrics
  };
}

interface ExecutionTimelineProps {
  execution: ExecutionState;
  progressData: ProgressData;
}

function ExecutionTimeline({ execution, progressData }: ExecutionTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Execution Timeline
        </CardTitle>
        <CardDescription>
          Step-by-step execution progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {progressData.timeline.map((entry, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{entry.event}</span>
                    <Badge 
                      variant={entry.status === 'completed' ? 'default' : 
                              entry.status === 'failed' ? 'destructive' : 
                              entry.status === 'running' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {entry.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>{entry.timestamp.toLocaleString()}</div>
                    {entry.duration && (
                      <div>Duration: {entry.duration}ms</div>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {entry.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {entry.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                  {entry.status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                  {entry.status === 'pending' && <Clock className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface PerformanceProgressProps {
  metrics: PerformanceMetrics;
}

function PerformanceProgress({ metrics }: PerformanceProgressProps) {
  return (
    <div className="space-y-4">
      {/* Overall Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Execution Time</p>
              <p className="text-2xl font-bold">{metrics.totalExecutionTime.toFixed(0)}ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Step Time</p>
              <p className="text-2xl font-bold">{metrics.averageStepTime.toFixed(0)}ms</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Execution Speed</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.averageStepTime < 1000 ? 'Fast' : 
                   metrics.averageStepTime < 5000 ? 'Normal' : 'Slow'}
                </span>
              </div>
              <Progress 
                value={Math.min(100, (5000 - metrics.averageStepTime) / 50)} 
                className="h-2" 
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Efficiency</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.networkCalls.total > 0 
                    ? ((metrics.networkCalls.successful / metrics.networkCalls.total) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <Progress 
                value={metrics.networkCalls.total > 0 
                  ? (metrics.networkCalls.successful / metrics.networkCalls.total) * 100 
                  : 0} 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ResourceUsageProps {
  metrics: PerformanceMetrics;
}

function ResourceUsage({ metrics }: ResourceUsageProps) {
  return (
    <div className="space-y-4">
      {/* CPU Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            CPU Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current</span>
                <span className="text-sm text-muted-foreground">{metrics.cpuUsage.current.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.cpuUsage.current} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Peak</span>
                <span className="text-sm text-muted-foreground">{metrics.cpuUsage.peak.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.cpuUsage.peak} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Average</span>
                <span className="text-sm text-muted-foreground">{metrics.cpuUsage.average.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.cpuUsage.average} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MemoryStick className="w-4 h-4" />
            Memory Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current</span>
                <span className="text-sm text-muted-foreground">{metrics.memoryUsage.current.toFixed(1)}MB</span>
              </div>
              <Progress value={(metrics.memoryUsage.current / metrics.memoryUsage.peak) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Peak</span>
                <span className="text-sm text-muted-foreground">{metrics.memoryUsage.peak.toFixed(1)}MB</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Average</span>
                <span className="text-sm text-muted-foreground">{metrics.memoryUsage.average.toFixed(1)}MB</span>
              </div>
              <Progress value={(metrics.memoryUsage.average / metrics.memoryUsage.peak) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Network Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Calls</p>
              <p className="text-2xl font-bold">{metrics.networkCalls.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">
                {metrics.networkCalls.total > 0 
                  ? ((metrics.networkCalls.successful / metrics.networkCalls.total) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className="text-2xl font-bold">{metrics.networkCalls.averageResponseTime.toFixed(0)}ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed Calls</p>
              <p className="text-2xl font-bold text-red-500">{metrics.networkCalls.failed}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ExecutionMetricsProps {
  execution: ExecutionState;
  progressData: ProgressData;
}

function ExecutionMetrics({ execution, progressData }: ExecutionMetricsProps) {
  return (
    <div className="space-y-4">
      {/* Execution Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Execution Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Duration</p>
              <p className="text-2xl font-bold">{execution.duration}ms</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Steps Completed</p>
              <p className="text-2xl font-bold">{execution.completedNodes}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">
                {execution.totalNodes > 0 
                  ? ((execution.completedNodes / execution.totalNodes) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Error Rate</p>
              <p className="text-2xl font-bold text-red-500">
                {execution.totalNodes > 0 
                  ? ((execution.failedNodes / execution.totalNodes) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Slowest Step</span>
                <span className="text-sm text-muted-foreground">
                  {progressData.performance.slowestStep.duration}ms
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {progressData.performance.slowestStep.nodeId}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Fastest Step</span>
                <span className="text-sm text-muted-foreground">
                  {progressData.performance.fastestStep.duration}ms
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {progressData.performance.fastestStep.nodeId}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4" />
            Resource Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">CPU</span>
                <span className="text-sm text-muted-foreground">
                  {progressData.performance.resourceUtilization.cpu.toFixed(1)}%
                </span>
              </div>
              <Progress value={progressData.performance.resourceUtilization.cpu} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Memory</span>
                <span className="text-sm text-muted-foreground">
                  {progressData.performance.resourceUtilization.memory.toFixed(1)}%
                </span>
              </div>
              <Progress value={progressData.performance.resourceUtilization.memory} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Storage</span>
                <span className="text-sm text-muted-foreground">
                  {progressData.performance.resourceUtilization.storage.toFixed(1)}%
                </span>
              </div>
              <Progress value={progressData.performance.resourceUtilization.storage} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Network</span>
                <span className="text-sm text-muted-foreground">
                  {progressData.performance.resourceUtilization.network.toFixed(1)}%
                </span>
              </div>
              <Progress value={progressData.performance.resourceUtilization.network} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
