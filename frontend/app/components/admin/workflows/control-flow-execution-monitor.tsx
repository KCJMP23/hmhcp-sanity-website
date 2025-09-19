'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ControlFlowManager, ControlFlowState, ExecutionStep } from '@/lib/workflows/control-flow-manager';
import { WorkflowDefinition } from '@/types/workflows/visual-builder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  PlayCircle, 
  PauseCircle, 
  SquareCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  GitBranch,
  Repeat,
  Code,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlFlowExecutionMonitorProps {
  controlFlowManager: ControlFlowManager;
  workflow: WorkflowDefinition;
  onNodeFocus?: (nodeId: string) => void;
  className?: string;
}

export function ControlFlowExecutionMonitor({
  controlFlowManager,
  workflow,
  onNodeFocus,
  className,
}: ControlFlowExecutionMonitorProps) {
  const [state, setState] = useState<ControlFlowState>(controlFlowManager.getState());
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const unsubscribeExecutionStarted = controlFlowManager.subscribe('execution-started', (newState) => {
      setState(newState);
      setIsMonitoring(true);
    });

    const unsubscribeExecutionCompleted = controlFlowManager.subscribe('execution-completed', (newState) => {
      setState(newState);
      setIsMonitoring(false);
    });

    const unsubscribeExecutionError = controlFlowManager.subscribe('execution-error', (newState) => {
      setState(newState);
      setIsMonitoring(false);
    });

    const unsubscribeNodeCompleted = controlFlowManager.subscribe('node-completed', (newState) => {
      setState(newState);
    });

    const unsubscribeStepLogged = controlFlowManager.subscribe('step-logged', (newState) => {
      setState(newState);
    });

    return () => {
      unsubscribeExecutionStarted();
      unsubscribeExecutionCompleted();
      unsubscribeExecutionError();
      unsubscribeNodeCompleted();
      unsubscribeStepLogged();
    };
  }, [controlFlowManager]);

  const handleStartExecution = useCallback(async () => {
    try {
      await controlFlowManager.executeWorkflow(workflow);
    } catch (error) {
      console.error('Execution failed:', error);
    }
  }, [controlFlowManager, workflow]);

  const handlePauseExecution = useCallback(() => {
    controlFlowManager.pauseExecution();
  }, [controlFlowManager]);

  const handleResumeExecution = useCallback(() => {
    controlFlowManager.resumeExecution();
  }, [controlFlowManager]);

  const handleStopExecution = useCallback(() => {
    controlFlowManager.stopExecution();
  }, [controlFlowManager]);

  const getExecutionStatusIcon = () => {
    if (state.isStopped) return <SquareCircle className="w-5 h-5 text-red-500" />;
    if (state.isPaused) return <PauseCircle className="w-5 h-5 text-yellow-500" />;
    if (state.isExecuting) return <PlayCircle className="w-5 h-5 text-blue-500" />;
    return <PlayCircle className="w-5 h-5 text-gray-400" />;
  };

  const getExecutionStatusText = () => {
    if (state.isStopped) return 'Stopped';
    if (state.isPaused) return 'Paused';
    if (state.isExecuting) return 'Running';
    return 'Ready';
  };

  const getExecutionStatusColor = () => {
    if (state.isStopped) return 'bg-red-100 text-red-800 border-red-200';
    if (state.isPaused) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (state.isExecuting) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'workflow-start':
        return <Play className="w-4 h-4" />;
      case 'workflow-end':
        return <Square className="w-4 h-4" />;
      case 'logic-if-else':
        return <GitBranch className="w-4 h-4" />;
      case 'logic-loop':
        return <Repeat className="w-4 h-4" />;
      case 'logic-switch':
        return <Code className="w-4 h-4" />;
      case 'logic-delay':
        return <Clock className="w-4 h-4" />;
      case 'logic-parallel':
        return <Zap className="w-4 h-4" />;
      case 'ai-agent':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStepIcon = (action: string) => {
    switch (action) {
      case 'start':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'break':
        return <Square className="w-4 h-4 text-orange-500" />;
      case 'continue':
        return <RotateCcw className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStepColor = (action: string) => {
    switch (action) {
      case 'start':
        return 'bg-blue-50 border-blue-200';
      case 'complete':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'break':
        return 'bg-orange-50 border-orange-200';
      case 'continue':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const calculateProgress = () => {
    if (!state.isExecuting) return 0;
    
    const totalNodes = workflow.nodes.length;
    const completedSteps = state.executionHistory.filter(step => step.action === 'complete').length;
    
    return Math.min((completedSteps / totalNodes) * 100, 100);
  };

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Execution Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {getExecutionStatusIcon()}
            Execution Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={cn('px-3 py-2 rounded-lg border', getExecutionStatusColor())}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{getExecutionStatusText()}</span>
              <Badge variant="outline">
                {state.currentNode || 'None'}
              </Badge>
            </div>
          </div>

          {state.isExecuting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(calculateProgress())}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          )}

          {state.currentLoop && (
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                <span>
                  {state.currentLoop.type} loop - Iteration {state.currentLoop.iteration + 1} of {state.currentLoop.maxIterations}
                </span>
              </div>
            </div>
          )}

          {state.currentException && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{state.currentException.type}: {state.currentException.message}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Control Buttons */}
      <div className="flex gap-2">
        {!state.isExecuting ? (
          <Button onClick={handleStartExecution} className="flex-1">
            <Play className="w-4 h-4 mr-2" />
            Start Execution
          </Button>
        ) : (
          <>
            {state.isPaused ? (
              <Button onClick={handleResumeExecution} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            ) : (
              <Button onClick={handlePauseExecution} variant="outline" className="flex-1">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
            <Button onClick={handleStopExecution} variant="outline" className="flex-1">
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const renderExecutionLog = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Execution Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {state.executionHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No execution steps yet
                </div>
              ) : (
                state.executionHistory.map((step, index) => {
                  const node = workflow.nodes.find(n => n.id === step.nodeId);
                  return (
                    <div
                      key={index}
                      className={cn(
                        'p-3 rounded-lg border flex items-start gap-3',
                        getStepColor(step.action)
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getStepIcon(step.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {node?.data.label || step.nodeId}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {node?.type || 'unknown'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(step.timestamp)}
                          </span>
                        </div>
                        
                        {step.action === 'error' && step.error && (
                          <div className="text-sm text-red-600 mt-1">
                            {step.error.type}: {step.error.message}
                          </div>
                        )}

                        {step.variables && Object.keys(step.variables).length > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            Variables: {Object.keys(step.variables).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderVariables = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="w-4 h-4" />
            Variables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {Object.keys(state.variables).length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No variables set
                </div>
              ) : (
                Object.entries(state.variables).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-50 rounded border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{key}</span>
                      <Badge variant="outline" className="text-xs">
                        {typeof value}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 font-mono">
                      {typeof value === 'object' 
                        ? JSON.stringify(value, null, 2)
                        : String(value)
                      }
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderWorkflowGraph = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Workflow Nodes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {workflow.nodes.map((node) => {
                const isCurrent = node.id === state.currentNode;
                const isCompleted = state.executionHistory.some(
                  step => step.nodeId === node.id && step.action === 'complete'
                );
                const hasError = state.executionHistory.some(
                  step => step.nodeId === node.id && step.action === 'error'
                );

                return (
                  <div
                    key={node.id}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-colors',
                      isCurrent && 'bg-blue-100 border-blue-300',
                      isCompleted && !isCurrent && 'bg-green-50 border-green-200',
                      hasError && 'bg-red-50 border-red-200',
                      !isCurrent && !isCompleted && !hasError && 'bg-gray-50 border-gray-200'
                    )}
                    onClick={() => onNodeFocus?.(node.id)}
                  >
                    <div className="flex items-center gap-2">
                      {getNodeIcon(node.type)}
                      <span className="font-medium text-sm">
                        {node.data.label || node.id}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {node.type}
                      </Badge>
                      {isCurrent && (
                        <Badge className="bg-blue-500 text-white text-xs">
                          Current
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-green-500 text-white text-xs">
                          Completed
                        </Badge>
                      )}
                      {hasError && (
                        <Badge className="bg-red-500 text-white text-xs">
                          Error
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Control Flow Execution Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="log">Execution Log</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
              <TabsTrigger value="graph">Workflow</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
              {renderOverview()}
            </TabsContent>
            
            <TabsContent value="log" className="mt-4">
              {renderExecutionLog()}
            </TabsContent>
            
            <TabsContent value="variables" className="mt-4">
              {renderVariables()}
            </TabsContent>
            
            <TabsContent value="graph" className="mt-4">
              {renderWorkflowGraph()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
