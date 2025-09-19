'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Pause,
  Play,
  Square,
  BarChart3,
  Users,
  Zap,
  Shield,
  DollarSign
} from 'lucide-react';

interface WorkflowExecution {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  agents: string[];
  startedAt: string;
  estimatedCompletion: string;
  cost: number;
  complianceScore: number;
  healthcareTopic: string;
}

interface AgentStatus {
  name: string;
  status: 'idle' | 'working' | 'error';
  currentTask: string;
  progress: number;
  lastActivity: string;
}

export function WorkflowDashboard() {
  const [workflows, setWorkflows] = useState<WorkflowExecution[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    // Set up real-time updates
    const interval = setInterval(loadDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [workflowsResponse, agentsResponse] = await Promise.all([
        fetch('/api/admin/ai-workflows/monitoring'),
        fetch('/api/admin/ai-workflows/agents/status')
      ]);

      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        setWorkflows(workflowsData.workflows || []);
      }

      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        setAgents(agentsData.agents || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'queued': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'queued': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleWorkflowAction = async (workflowId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/ai-workflows/${workflowId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error(`Failed to ${action} workflow:`, error);
    }
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
      {/* Active Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Active Workflows
          </CardTitle>
          <CardDescription>
            Real-time monitoring of AI workflow executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active workflows
            </div>
          ) : (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{workflow.name}</h3>
                      <Badge className={getStatusColor(workflow.status)}>
                        {getStatusIcon(workflow.status)}
                        <span className="ml-1 capitalize">{workflow.status}</span>
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {workflow.status === 'running' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWorkflowAction(workflow.id, 'pause')}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWorkflowAction(workflow.id, 'terminate')}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {workflow.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWorkflowAction(workflow.id, 'resume')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-gray-600">Progress</div>
                      <div className="flex items-center gap-2">
                        <Progress value={workflow.progress} className="flex-1" />
                        <span className="text-sm font-medium">{workflow.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Healthcare Topic</div>
                      <div className="font-medium">{workflow.healthcareTopic}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Compliance Score</div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{workflow.complianceScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Agents</div>
                      <div className="flex flex-wrap gap-1">
                        {workflow.agents.map((agent) => (
                          <Badge key={agent} variant="secondary" className="text-xs">
                            {agent}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Started</div>
                      <div>{new Date(workflow.startedAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Est. Completion</div>
                      <div>{new Date(workflow.estimatedCompletion).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost</div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{workflow.cost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Agent Status
          </CardTitle>
          <CardDescription>
            Current status of AI agents in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No agent data available
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <div key={agent.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{agent.name}</h3>
                    <Badge className={getStatusColor(agent.status)}>
                      {getStatusIcon(agent.status)}
                      <span className="ml-1 capitalize">{agent.status}</span>
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm text-gray-600">Current Task</div>
                      <div className="text-sm">{agent.currentTask || 'Idle'}</div>
                    </div>
                    {agent.status === 'working' && (
                      <div>
                        <div className="text-sm text-gray-600">Progress</div>
                        <div className="flex items-center gap-2">
                          <Progress value={agent.progress} className="flex-1" />
                          <span className="text-sm font-medium">{agent.progress}%</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-600">Last Activity</div>
                      <div className="text-sm">{new Date(agent.lastActivity).toLocaleString()}</div>
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
