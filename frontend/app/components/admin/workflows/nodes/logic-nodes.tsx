'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { WorkflowNode } from '@/types/workflows/visual-builder';

// Condition Node
export const ConditionNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-yellow-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Condition</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        {data.data.parameters?.condition || 'If status equals "active"'}
      </div>
      <div className="text-xs text-gray-500">
        Operator: {data.data.parameters?.operator || 'equals'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Top} className="w-3 h-3" id="true" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" id="false" />
    </div>
  );
};

// Loop Node
export const LoopNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-yellow-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Loop</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Type: {data.data.parameters?.loopType || 'For each item'}
      </div>
      <div className="text-xs text-gray-500">
        Max: {data.data.parameters?.maxIterations || '100'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Parallel Node
export const ParallelNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-yellow-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Parallel</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Branches: {data.data.parameters?.branches || '2'}
      </div>
      <div className="text-xs text-gray-500">
        Wait: {data.data.parameters?.waitForAll ? 'All' : 'Any'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Top} className="w-3 h-3" id="branch1" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" id="branch2" />
    </div>
  );
};

// Merge Node
export const MergeNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-yellow-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Merge</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Strategy: {data.data.parameters?.strategy || 'Combine arrays'}
      </div>
      <div className="text-xs text-gray-500">
        Inputs: {data.data.parameters?.inputCount || '2'}
      </div>
      <Handle type="target" position={Position.Top} className="w-3 h-3" id="input1" />
      <Handle type="target" position={Position.Bottom} className="w-3 h-3" id="input2" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Switch Node
export const SwitchNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-yellow-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Switch</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Field: {data.data.parameters?.field || 'status'}
      </div>
      <div className="text-xs text-gray-500">
        Cases: {data.data.parameters?.cases || '3'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Top} className="w-3 h-3" id="case1" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" id="case2" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" id="default" />
    </div>
  );
};
