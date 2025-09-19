'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { WorkflowNode } from '@/types/workflows/visual-builder';

// Map Transform Node
export const MapTransformNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-orange-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Map Transform</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Field: {data.data.parameters?.field || 'title'}
      </div>
      <div className="text-xs text-gray-500">
        Function: {data.data.parameters?.function || 'toUpperCase()'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Filter Transform Node
export const FilterTransformNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-orange-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Filter Transform</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Condition: {data.data.parameters?.condition || 'status = "active"'}
      </div>
      <div className="text-xs text-gray-500">
        Operator: {data.data.parameters?.operator || 'equals'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Reduce Transform Node
export const ReduceTransformNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-orange-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Reduce Transform</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Function: {data.data.parameters?.function || 'sum'}
      </div>
      <div className="text-xs text-gray-500">
        Field: {data.data.parameters?.field || 'count'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Format Transform Node
export const FormatTransformNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-orange-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Format Transform</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Format: {data.data.parameters?.format || 'JSON'}
      </div>
      <div className="text-xs text-gray-500">
        Template: {data.data.parameters?.template || 'Default'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Split Transform Node
export const SplitTransformNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-orange-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Split Transform</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Delimiter: {data.data.parameters?.delimiter || ','}
      </div>
      <div className="text-xs text-gray-500">
        Field: {data.data.parameters?.field || 'tags'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Join Transform Node
export const JoinTransformNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-orange-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Join Transform</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Delimiter: {data.data.parameters?.delimiter || ' '}
      </div>
      <div className="text-xs text-gray-500">
        Fields: {data.data.parameters?.fields || 'firstName, lastName'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};
