'use client';

import React, { useState, useEffect } from 'react';
import { ExecutionStep, ExecutionMetrics } from '@/types/workflows/execution';

interface ExecutionMonitorProps {
  executionId?: string;
}

export const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({ executionId }) => {
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [metrics, setMetrics] = useState<ExecutionMetrics | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Mock execution steps for demonstration
  useEffect(() => {
    const mockSteps: ExecutionStep[] = [
      {
        stepNumber: 1,
        nodeId: 'trigger-1',
        action: 'start',
        timestamp: new Date(),
        data: { triggerType: 'manual' }
      },
      {
        stepNumber: 2,
        nodeId: 'agent-1',
        action: 'start',
        timestamp: new Date(Date.now() + 1000),
        data: { agentType: 'research' }
      },
      {
        stepNumber: 3,
        nodeId: 'agent-1',
        action: 'complete',
        timestamp: new Date(Date.now() + 3000),
        data: { result: 'Research completed successfully' }
      }
    ];

    const mockMetrics: ExecutionMetrics = {
      totalNodes: 5,
      completedNodes: 3,
      failedNodes: 0,
      skippedNodes: 0,
      successRate: 100,
      averageNodeDuration: 1500,
      totalDuration: 4500,
      memoryUsage: 45.2,
      cpuUsage: 23.1
    };

    setSteps(mockSteps);
    setMetrics(mockMetrics);
    setIsRunning(true);
  }, [executionId]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Execution Monitor</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Execution Steps */}
        <div className="flex-1 p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Execution Steps</h4>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.action === 'start' ? 'bg-blue-100 text-blue-800' :
                    step.action === 'complete' ? 'bg-green-100 text-green-800' :
                    step.action === 'fail' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {step.stepNumber}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{step.nodeId}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      step.action === 'start' ? 'bg-blue-100 text-blue-800' :
                      step.action === 'complete' ? 'bg-green-100 text-green-800' :
                      step.action === 'fail' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {step.action}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {step.timestamp.toLocaleTimeString()}
                  </div>
                  {step.data && (
                    <div className="text-xs text-gray-600 mt-1">
                      {JSON.stringify(step.data, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="w-80 border-l border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Execution Metrics</h4>
          {metrics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">Total Nodes</div>
                  <div className="text-lg font-semibold text-gray-900">{metrics.totalNodes}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">Completed</div>
                  <div className="text-lg font-semibold text-green-600">{metrics.completedNodes}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">Failed</div>
                  <div className="text-lg font-semibold text-red-600">{metrics.failedNodes}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">Success Rate</div>
                  <div className="text-lg font-semibold text-gray-900">{metrics.successRate}%</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Total Duration</div>
                  <div className="text-sm font-medium text-gray-900">
                    {(metrics.totalDuration / 1000).toFixed(2)}s
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Avg Node Duration</div>
                  <div className="text-sm font-medium text-gray-900">
                    {(metrics.averageNodeDuration / 1000).toFixed(2)}s
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Memory Usage</div>
                  <div className="text-sm font-medium text-gray-900">
                    {metrics.memoryUsage}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">CPU Usage</div>
                  <div className="text-sm font-medium text-gray-900">
                    {metrics.cpuUsage}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};