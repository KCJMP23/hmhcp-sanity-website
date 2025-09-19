'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, SkipForward, SkipBack, Eye, EyeOff, Zap, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflows/visual-builder';
import { ExecutionStep, ExecutionState } from '@/lib/workflows/execution-engine';
import { cn } from '@/lib/utils';

interface ExecutionVisualizerProps {
  workflow: WorkflowDefinition;
  executionSteps: ExecutionStep[];
  currentStepIndex: number;
  onStepChange?: (stepIndex: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  onStepForward?: () => void;
  onStepBackward?: () => void;
  className?: string;
}

export function ExecutionVisualizer({
  workflow,
  executionSteps,
  currentStepIndex,
  onStepChange,
  onPlay,
  onPause,
  onStop,
  onRestart,
  onStepForward,
  onStepBackward,
  className
}: ExecutionVisualizerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (currentStepIndex < executionSteps.length - 1) {
        onStepForward?.();
      } else {
        setIsPlaying(false);
      }
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, currentStepIndex, executionSteps.length, playbackSpeed, onStepForward]);

  // Update highlighted elements when step changes
  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex < executionSteps.length) {
      const currentStep = executionSteps[currentStepIndex];
      const nextStep = executionSteps[currentStepIndex + 1];
      
      // Highlight current node
      setHighlightedNodes(new Set([currentStep.nodeId]));
      
      // Highlight edge to next node
      if (nextStep) {
        const edge = workflow.edges.find(e => 
          e.source === currentStep.nodeId && e.target === nextStep.nodeId
        );
        if (edge) {
          setHighlightedEdges(new Set([edge.id]));
        }
      }
    }
  }, [currentStepIndex, executionSteps, workflow.edges]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    onStop?.();
  }, [onStop]);

  const handleRestart = useCallback(() => {
    setIsPlaying(false);
    onRestart?.();
  }, [onRestart]);

  const handleStepForward = useCallback(() => {
    if (currentStepIndex < executionSteps.length - 1) {
      onStepForward?.();
    }
  }, [currentStepIndex, executionSteps.length, onStepForward]);

  const handleStepBackward = useCallback(() => {
    if (currentStepIndex > 0) {
      onStepBackward?.();
    }
  }, [currentStepIndex, onStepBackward]);

  const handleSliderChange = useCallback((value: number[]) => {
    const newIndex = Math.floor((value[0] / 100) * (executionSteps.length - 1));
    onStepChange?.(newIndex);
  }, [executionSteps.length, onStepChange]);

  const getNodeStatus = (nodeId: string) => {
    const step = executionSteps.find(s => s.nodeId === nodeId);
    if (!step) return 'pending';
    return step.status;
  };

  const getNodeStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <SkipForward className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'border-blue-500 bg-blue-50';
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'failed':
        return 'border-red-500 bg-red-50';
      case 'skipped':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-muted-foreground bg-muted/50';
    }
  };

  const currentStep = executionSteps[currentStepIndex];
  const progress = executionSteps.length > 0 ? ((currentStepIndex + 1) / executionSteps.length) * 100 : 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Execution Visualizer</CardTitle>
          <CardDescription>
            Step-by-step workflow execution visualization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Step {currentStepIndex + 1} of {executionSteps.length}</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Slider */}
          <div className="space-y-2">
            <Label>Step Position</Label>
            <Slider
              value={[progress]}
              onValueChange={handleSliderChange}
              max={100}
              step={executionSteps.length > 0 ? 100 / executionSteps.length : 1}
              className="w-full"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestart}
              disabled={currentStepIndex === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStepBackward}
              disabled={currentStepIndex === 0}
            >
              <SkipBack className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {isPlaying ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlay}
                disabled={currentStepIndex >= executionSteps.length - 1}
              >
                <Play className="w-4 h-4 mr-2" />
                Play
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleStepForward}
              disabled={currentStepIndex >= executionSteps.length - 1}
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStop}
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </div>

          {/* Playback Speed */}
          <div className="flex items-center gap-4">
            <Label htmlFor="playback-speed">Playback Speed</Label>
            <Slider
              id="playback-speed"
              value={[playbackSpeed]}
              onValueChange={(value) => setPlaybackSpeed(value[0])}
              min={0.25}
              max={4}
              step={0.25}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">{playbackSpeed}x</span>
          </div>

          {/* Options */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-details"
                checked={showNodeDetails}
                onCheckedChange={setShowNodeDetails}
              />
              <Label htmlFor="show-details">Show Node Details</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow Execution</CardTitle>
          <CardDescription>
            Current execution state and node status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Node Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {workflow.nodes.map(node => {
                const status = getNodeStatus(node.id);
                const isHighlighted = highlightedNodes.has(node.id);
                
                return (
                  <div
                    key={node.id}
                    className={cn(
                      'p-3 border rounded-lg transition-all duration-200',
                      getNodeStatusColor(status),
                      isHighlighted && 'ring-2 ring-blue-500 ring-opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getNodeStatusIcon(status)}
                      <span className="font-medium text-sm">{node.data.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {node.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div>ID: {node.id}</div>
                      {status !== 'pending' && (
                        <div>Status: {status}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Step Details */}
            {currentStep && (
              <div className="mt-6">
                <Separator className="mb-4" />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Current Step Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Step Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <span className="text-sm font-medium">Node:</span>
                          <span className="ml-2 text-sm">{currentStep.nodeName}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Type:</span>
                          <span className="ml-2 text-sm">{currentStep.nodeType}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Status:</span>
                          <Badge 
                            variant={currentStep.status === 'completed' ? 'default' : 
                                    currentStep.status === 'failed' ? 'destructive' : 
                                    currentStep.status === 'running' ? 'secondary' : 'outline'}
                            className="ml-2"
                          >
                            {currentStep.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Duration:</span>
                          <span className="ml-2 text-sm">{currentStep.duration}ms</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <span className="text-sm font-medium">Execution Time:</span>
                          <span className="ml-2 text-sm">{currentStep.performance.executionTime}ms</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Memory Used:</span>
                          <span className="ml-2 text-sm">{currentStep.performance.memoryUsed}MB</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">API Calls:</span>
                          <span className="ml-2 text-sm">{currentStep.performance.apiCalls}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Cache Hits:</span>
                          <span className="ml-2 text-sm">{currentStep.performance.cacheHits}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Input/Output Data */}
                  {showNodeDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Input Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                            {JSON.stringify(currentStep.input, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Output Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                            {JSON.stringify(currentStep.output, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Warnings */}
                  {currentStep.warnings.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                          <AlertTriangle className="w-4 h-4" />
                          Warnings ({currentStep.warnings.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {currentStep.warnings.map(warning => (
                            <div key={warning.id} className="p-2 border border-yellow-200 rounded bg-yellow-50">
                              <p className="text-sm text-yellow-700">{warning.message}</p>
                              <p className="text-xs text-yellow-600">
                                {warning.type} • {warning.severity}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Error */}
                  {currentStep.error && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 text-red-600">
                          <XCircle className="w-4 h-4" />
                          Error
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="p-3 border border-red-200 rounded bg-red-50">
                          <p className="text-sm text-red-700 mb-2">{currentStep.error.message}</p>
                          <p className="text-xs text-red-600">
                            {currentStep.error.type} • {currentStep.error.severity}
                          </p>
                          {currentStep.error.suggestions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-red-600 mb-1">Suggestions:</p>
                              <ul className="text-xs text-red-600 list-disc list-inside">
                                {currentStep.error.suggestions.map((suggestion, index) => (
                                  <li key={index}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
