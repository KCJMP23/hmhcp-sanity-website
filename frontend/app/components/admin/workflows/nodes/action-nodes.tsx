'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { WorkflowNode } from '@/types/workflows/visual-builder';

// Database Action Node
export const DatabaseActionNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-purple-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Database Action</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Operation: {data.data.parameters?.operation || 'INSERT'}
      </div>
      <div className="text-xs text-gray-500">
        Table: {data.data.parameters?.table || 'workflows'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// API Call Node
export const APICallNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-purple-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">API Call</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        {data.data.parameters?.method || 'POST'} {data.data.parameters?.endpoint || '/api/data'}
      </div>
      <div className="text-xs text-gray-500">
        Timeout: {data.data.parameters?.timeout || '30s'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Notification Node
export const NotificationNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-purple-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Notification</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Type: {data.data.parameters?.type || 'Email'}
      </div>
      <div className="text-xs text-gray-500">
        To: {data.data.parameters?.recipient || 'admin@example.com'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// File Action Node
export const FileActionNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-purple-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">File Action</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Action: {data.data.parameters?.action || 'Upload'}
      </div>
      <div className="text-xs text-gray-500">
        Path: {data.data.parameters?.path || '/uploads/'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Email Node
export const EmailNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-purple-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Email</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Subject: {data.data.parameters?.subject || 'Workflow Notification'}
      </div>
      <div className="text-xs text-gray-500">
        Template: {data.data.parameters?.template || 'Default'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Slack Node
export const SlackNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-purple-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Slack</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Channel: {data.data.parameters?.channel || '#general'}
      </div>
      <div className="text-xs text-gray-500">
        Message: {data.data.parameters?.message || 'Workflow completed'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};
