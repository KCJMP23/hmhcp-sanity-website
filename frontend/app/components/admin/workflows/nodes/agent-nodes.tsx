'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { WorkflowNode } from '@/types/workflows/visual-builder';

// Research Agent Node
export const ResearchAgentNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-blue-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Research Agent</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Topic: {data.data.parameters?.topic || 'Healthcare research'}
      </div>
      <div className="text-xs text-gray-500">
        Sources: {data.data.parameters?.sources || 'PubMed, Google Scholar'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Content Agent Node
export const ContentAgentNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-blue-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Content Agent</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Type: {data.data.parameters?.contentType || 'Blog post'}
      </div>
      <div className="text-xs text-gray-500">
        Style: {data.data.parameters?.style || 'Professional'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// SEO Agent Node
export const SEOAgentNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-blue-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">SEO Agent</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Keywords: {data.data.parameters?.keywords || 'healthcare, medical'}
      </div>
      <div className="text-xs text-gray-500">
        Target: {data.data.parameters?.targetAudience || 'Healthcare professionals'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Image Agent Node
export const ImageAgentNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-blue-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Image Agent</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Style: {data.data.parameters?.imageStyle || 'Medical illustration'}
      </div>
      <div className="text-xs text-gray-500">
        Size: {data.data.parameters?.imageSize || '1920x1080'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Publishing Agent Node
export const PublishingAgentNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-blue-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">Publishing Agent</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Platform: {data.data.parameters?.platform || 'WordPress'}
      </div>
      <div className="text-xs text-gray-500">
        Status: {data.data.parameters?.status || 'Draft'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// QA Agent Node
export const QAAgentNode: React.FC<NodeProps<WorkflowNode>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-blue-200'
    }`}>
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
        <div className="font-medium text-sm">QA Agent</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Checks: {data.data.parameters?.checks || 'Grammar, Fact-check, Compliance'}
      </div>
      <div className="text-xs text-gray-500">
        Level: {data.data.parameters?.qualityLevel || 'High'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};
