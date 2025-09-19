'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { WorkflowNode } from '@/types/workflows/visual-builder';

// Schedule Trigger Node
export const ScheduleTriggerNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-green-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Schedule Trigger</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        {data.data.parameters?.schedule || 'Every day at 9:00 AM'}
      </div>
      <div className="text-xs text-gray-500">
        Next: {data.data.parameters?.nextRun || 'Tomorrow 9:00 AM'}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Webhook Trigger Node
export const WebhookTriggerNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-green-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Webhook Trigger</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        {data.data.parameters?.method || 'POST'} /{data.data.parameters?.path || 'webhook'}
      </div>
      <div className="text-xs text-gray-500">
        URL: {data.data.parameters?.url || 'https://api.example.com/webhook'}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Event Trigger Node
export const EventTriggerNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-green-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Event Trigger</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Event: {data.data.parameters?.event || 'user.created'}
      </div>
      <div className="text-xs text-gray-500">
        Source: {data.data.parameters?.source || 'system'}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Manual Trigger Node
export const ManualTriggerNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-green-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Manual Trigger</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        {data.data.parameters?.description || 'Click to start workflow'}
      </div>
      <div className="text-xs text-gray-500">
        Status: {data.data.parameters?.enabled ? 'Enabled' : 'Disabled'}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};
