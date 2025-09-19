'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import type { WorkflowExecution, ExecutionStatus } from '@/types/ai/workflows';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Loader2, 
  Pause, 
  Play, 
  XCircle,
  BarChart3,
  Users,
  Zap
} from 'lucide-react';

const statusColors: Record<ExecutionStatus, string> = {
  pending: 'bg-gray-500',
  queued: 'bg-yellow-500',
  running: 'bg-blue-500',
  paused: 'bg-orange-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-400'
};

const statusIcons: Record<ExecutionStatus, React.ElementType> = {
  pending: Clock,
  queued: Clock,
  running: Loader2,
  paused: Pause,
  completed: CheckCircle,
  failed: XCircle,
  cancelled: AlertCircle
};

export function WorkflowDashboard() {
  const { 
    activeExecutions, 
    connectWebSocket, 
    disconnectWebSocket,
    pauseExecution,
    resumeExecution,
    cancelExecution
  } = useWorkflowStore();

  const [stats, setStats] = useState({
    totalExecutions: 0,
    activeWorkflows: 0,
    successRate: 0,
    totalCost: 0
  });

  useEffect(() => {
    // Connect WebSocket for real-time updates
    connectWebSocket();
    
    // Load initial data
    loadDashboardData();

    return () => {
      disconnectWebSocket();
    };
  }, []);

  useEffect(() => {
    // Calculate stats from active executions
    const executions = Array.from(activeExecutions.values());
    const completed = executions.filter(e => e.status === 'completed');
    const failed = executions.filter(e => e.status === 'failed');
    const running = executions.filter(e => e.status === 'running');
    
    setStats({
      totalExecutions: executions.length,
      activeWorkflows: running.length,
      successRate: executions.length > 0 
        ? (completed.length / (completed.length + failed.length)) * 100 
        : 0,
      totalCost: executions.reduce((sum, e) => sum + (e.costUsd || 0), 0)
    });
  }, [activeExecutions]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/ai/workflows/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Process dashboard data
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleExecutionAction = async (
    executionId: string, 
    action: 'pause' | 'resume' | 'cancel'
  ) => {
    try {
      switch (action) {
        case 'pause':
          await pauseExecution(executionId);
          break;
        case 'resume':
          await resumeExecution(executionId);
          break;
        case 'cancel':
          await cancelExecution(executionId);
          break;
      }
    } catch (error) {
      console.error(`Error ${action}ing execution:`, error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Executions
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              All time workflow runs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Workflows
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Success Rate
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              AI processing costs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from(activeExecutions.values()).map((execution) => (
              <ExecutionCard
                key={execution.id}
                execution={execution}
                onAction={handleExecutionAction}
              />
            ))}
            
            {activeExecutions.size === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No active workflow executions
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agent Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              'research-agent',
              'content-agent',
              'medical-accuracy-agent',
              'compliance-agent',
              'seo-agent'
            ].map((agent) => (
              <div
                key={agent}
                className="flex flex-col items-center p-4 border rounded-lg"
              >
                <Users className="h-8 w-8 mb-2 text-muted-foreground" />
                <span className="text-xs text-center">
                  {agent.replace('-agent', '')}
                </span>
                <Badge variant="outline" className="mt-1">
                  Ready
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ExecutionCardProps {
  execution: WorkflowExecution;
  onAction: (id: string, action: 'pause' | 'resume' | 'cancel') => void;
}

function ExecutionCard({ execution, onAction }: ExecutionCardProps) {
  const StatusIcon = statusIcons[execution.status];
  const isRunning = execution.status === 'running';
  const isPaused = execution.status === 'paused';
  const canControl = isRunning || isPaused;
  
  const progress = execution.executionTimeMs && execution.metadata?.estimatedTime
    ? Math.min(100, (execution.executionTimeMs / execution.metadata.estimatedTime) * 100)
    : 0;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-full ${statusColors[execution.status]} bg-opacity-10`}>
          <StatusIcon 
            className={`h-5 w-5 ${statusColors[execution.status].replace('bg-', 'text-')}`}
            {...(isRunning && { className: 'h-5 w-5 animate-spin text-blue-500' })}
          />
        </div>
        
        <div>
          <div className="font-medium">{execution.metadata?.workflowName || 'Unnamed Workflow'}</div>
          <div className="text-sm text-muted-foreground">
            ID: {execution.id.slice(0, 8)}...
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {isRunning && (
          <div className="w-32">
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {execution.costUsd && (
          <Badge variant="outline">
            ${execution.costUsd.toFixed(4)}
          </Badge>
        )}
        
        <Badge 
          variant={execution.status === 'completed' ? 'default' : 'secondary'}
        >
          {execution.status}
        </Badge>
        
        {canControl && (
          <div className="flex gap-1">
            {isRunning && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onAction(execution.id, 'pause')}
              >
                <Pause className="h-4 w-4" />
              </Button>
            )}
            {isPaused && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onAction(execution.id, 'resume')}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onAction(execution.id, 'cancel')}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}