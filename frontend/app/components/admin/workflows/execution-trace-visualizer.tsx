'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { ExecutionTrace, StepResult } from '@/lib/workflows/debug-manager';

interface ExecutionTraceVisualizerProps {
  trace: ExecutionTrace | null;
  currentStep: number;
  onStepChange: (step: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onExportTrace: () => void;
  isPlaying: boolean;
}

export function ExecutionTraceVisualizer({
  trace,
  currentStep,
  onStepChange,
  onPlay,
  onPause,
  onStop,
  onReset,
  onStepBack,
  onStepForward,
  onExportTrace,
  isPlaying
}: ExecutionTraceVisualizerProps) {
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'warning'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showVariables, setShowVariables] = useState(false);

  const filteredSteps = trace?.steps.filter(step => {
    const matchesFilter = filter === 'all' || 
      (filter === 'success' && step.success) ||
      (filter === 'error' && !step.success) ||
      (filter === 'warning' && step.success && step.duration > 1000); // Consider slow steps as warnings
    
    const matchesSearch = searchTerm === '' || 
      step.nodeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.nodeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (step.error && step.error.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  }) || [];

  const getStepIcon = (step: StepResult) => {
    if (!step.success) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (step.duration > 1000) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStepColor = (step: StepResult, index: number) => {
    if (index === currentStep) {
      return 'bg-blue-50 border-blue-300 ring-2 ring-blue-200';
    }
    if (!step.success) {
      return 'bg-red-50 border-red-200';
    }
    if (step.duration > 1000) {
      return 'bg-yellow-50 border-yellow-200';
    }
    return 'bg-green-50 border-green-200';
  };

  const formatDuration = (duration: number) => {
    if (duration < 1000) {
      return `${duration}ms`;
    }
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getProgressPercentage = () => {
    if (!trace || trace.steps.length === 0) return 0;
    return Math.round((currentStep / trace.steps.length) * 100);
  };

  const getTotalDuration = () => {
    if (!trace) return 0;
    return trace.steps.reduce((total, step) => total + step.duration, 0);
  };

  const getAverageStepDuration = () => {
    if (!trace || trace.steps.length === 0) return 0;
    return getTotalDuration() / trace.steps.length;
  };

  const getSuccessRate = () => {
    if (!trace || trace.steps.length === 0) return 0;
    const successfulSteps = trace.steps.filter(step => step.success).length;
    return Math.round((successfulSteps / trace.steps.length) * 100);
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Execution Trace</CardTitle>
            <div className="flex items-center gap-2">
              {trace && (
                <>
                  <Badge variant="outline" className="text-xs">
                    {trace.steps.length} steps
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {formatDuration(getTotalDuration())}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getSuccessRate()}% success
                  </Badge>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Controls */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={onPlay}
                  disabled={!trace || isPlaying}
                  variant="default"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Play
                </Button>
                <Button
                  size="sm"
                  onClick={onPause}
                  disabled={!trace || !isPlaying}
                  variant="outline"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
                <Button
                  size="sm"
                  onClick={onStop}
                  disabled={!trace}
                  variant="outline"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
                <Button
                  size="sm"
                  onClick={onReset}
                  disabled={!trace}
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={onStepBack}
                  disabled={!trace || currentStep <= 0}
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-mono px-2">
                  {currentStep + 1} / {trace?.steps.length || 0}
                </span>
                <Button
                  size="sm"
                  onClick={onStepForward}
                  disabled={!trace || currentStep >= (trace?.steps.length || 0) - 1}
                  variant="outline"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            {trace && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{getProgressPercentage()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>
            )}

            {/* Statistics */}
            {trace && (
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{trace.steps.length}</div>
                  <div className="text-gray-500">Total Steps</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{formatDuration(getTotalDuration())}</div>
                  <div className="text-gray-500">Total Duration</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{formatDuration(getAverageStepDuration())}</div>
                  <div className="text-gray-500">Avg Step Time</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{getSuccessRate()}%</div>
                  <div className="text-gray-500">Success Rate</div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">All Steps</option>
                  <option value="success">Successful</option>
                  <option value="error">Failed</option>
                  <option value="warning">Slow (&gt;1s)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search steps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-1 border rounded-md text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowVariables(!showVariables)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showVariables ? 'Hide' : 'Show'} Variables
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onExportTrace}
                  disabled={!trace}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Steps List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {filteredSteps.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {trace ? 'No steps match the current filter' : 'No execution trace available'}
                </div>
              ) : (
                filteredSteps.map((step, index) => (
                  <div
                    key={`${step.nodeId}-${step.timestamp.getTime()}`}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${getStepColor(step, index)}`}
                    onClick={() => onStepChange(index)}
                  >
                    <div className="flex items-start gap-3">
                      {getStepIcon(step)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <Badge variant="secondary">{step.nodeType}</Badge>
                          <span className="font-semibold">{step.nodeName}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatDuration(step.duration)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          Node ID: {step.nodeId}
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          Timestamp: {formatTimestamp(step.timestamp)}
                        </div>

                        {step.error && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                            <strong>Error:</strong> {step.error}
                          </div>
                        )}

                        {step.output && (
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Output:</strong> {formatValue(step.output)}
                          </div>
                        )}

                        {showVariables && step.variables.size > 0 && (
                          <div className="mt-2">
                            <div className="text-sm font-semibold mb-1">Variables:</div>
                            <div className="space-y-1">
                              {Array.from(step.variables.entries()).map(([key, value]) => (
                                <div key={key} className="text-sm font-mono">
                                  <span className="text-blue-600">{key}</span>: {formatValue(value)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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
}
