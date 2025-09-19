'use client';

import React, { useState } from 'react';
import { NodeType } from '@/types/workflows/visual-builder';

interface NodePaletteProps {
  onNodeAdd: (nodeType: string) => void;
}

const nodeTypes: NodeType[] = [
  // Trigger nodes
  {
    type: 'schedule-trigger',
    label: 'Schedule Trigger',
    description: 'Start workflow on schedule',
    icon: '⏰',
    category: 'trigger',
    inputs: [],
    outputs: [{ id: 'output', label: 'Output', type: 'control', required: true }],
    configSchema: { schedule: { type: 'string' }, timezone: { type: 'string' } }
  },
  {
    type: 'webhook-trigger',
    label: 'Webhook Trigger',
    description: 'Start workflow via HTTP webhook',
    icon: '🔗',
    category: 'trigger',
    inputs: [],
    outputs: [{ id: 'output', label: 'Output', type: 'control', required: true }],
    configSchema: { method: { type: 'select', options: ['GET', 'POST', 'PUT'] }, path: { type: 'string' } }
  },
  {
    type: 'event-trigger',
    label: 'Event Trigger',
    description: 'Start workflow on system event',
    icon: '📡',
    category: 'trigger',
    inputs: [],
    outputs: [{ id: 'output', label: 'Output', type: 'control', required: true }],
    configSchema: { event: { type: 'string' }, source: { type: 'string' } }
  },
  {
    type: 'manual-trigger',
    label: 'Manual Trigger',
    description: 'Start workflow manually',
    icon: '👆',
    category: 'trigger',
    inputs: [],
    outputs: [{ id: 'output', label: 'Output', type: 'control', required: true }],
    configSchema: { description: { type: 'string' }, enabled: { type: 'boolean' } }
  },

  // Agent nodes
  {
    type: 'research-agent',
    label: 'Research Agent',
    description: 'AI-powered research automation',
    icon: '🔬',
    category: 'agent',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { topic: { type: 'string' }, sources: { type: 'array' } }
  },
  {
    type: 'content-agent',
    label: 'Content Agent',
    description: 'AI-powered content generation',
    icon: '✍️',
    category: 'agent',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { contentType: { type: 'select', options: ['blog', 'article', 'report'] }, style: { type: 'string' } }
  },
  {
    type: 'seo-agent',
    label: 'SEO Agent',
    description: 'AI-powered SEO optimization',
    icon: '🔍',
    category: 'agent',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { keywords: { type: 'array' }, targetAudience: { type: 'string' } }
  },
  {
    type: 'image-agent',
    label: 'Image Agent',
    description: 'AI-powered image generation',
    icon: '🖼️',
    category: 'agent',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { imageStyle: { type: 'string' }, imageSize: { type: 'string' } }
  },
  {
    type: 'publishing-agent',
    label: 'Publishing Agent',
    description: 'AI-powered content publishing',
    icon: '📤',
    category: 'agent',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { platform: { type: 'select', options: ['wordpress', 'medium', 'linkedin'] }, status: { type: 'string' } }
  },
  {
    type: 'qa-agent',
    label: 'QA Agent',
    description: 'AI-powered quality assurance',
    icon: '✅',
    category: 'agent',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { checks: { type: 'array' }, qualityLevel: { type: 'select', options: ['low', 'medium', 'high'] } }
  },

  // Logic nodes
  {
    type: 'condition',
    label: 'Condition',
    description: 'Conditional branching logic',
    icon: '🔀',
    category: 'logic',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [
      { id: 'true', label: 'True', type: 'control', required: false },
      { id: 'false', label: 'False', type: 'control', required: false }
    ],
    configSchema: { condition: { type: 'string' }, operator: { type: 'select', options: ['equals', 'contains', 'greater_than', 'less_than'] } }
  },
  {
    type: 'loop',
    label: 'Loop',
    description: 'Iterate over data',
    icon: '🔄',
    category: 'logic',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'control', required: true }],
    configSchema: { loopType: { type: 'select', options: ['for_each', 'while', 'for'] }, maxIterations: { type: 'number' } }
  },
  {
    type: 'parallel',
    label: 'Parallel',
    description: 'Execute branches in parallel',
    icon: '⚡',
    category: 'logic',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [
      { id: 'branch1', label: 'Branch 1', type: 'control', required: false },
      { id: 'branch2', label: 'Branch 2', type: 'control', required: false }
    ],
    configSchema: { branches: { type: 'number' }, waitForAll: { type: 'boolean' } }
  },
  {
    type: 'merge',
    label: 'Merge',
    description: 'Combine multiple inputs',
    icon: '🔗',
    category: 'logic',
    inputs: [
      { id: 'input1', label: 'Input 1', type: 'data', required: true },
      { id: 'input2', label: 'Input 2', type: 'data', required: true }
    ],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { strategy: { type: 'select', options: ['combine_arrays', 'merge_objects', 'concatenate'] } }
  },
  {
    type: 'switch',
    label: 'Switch',
    description: 'Multi-way conditional branching',
    icon: '🔀',
    category: 'logic',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [
      { id: 'case1', label: 'Case 1', type: 'control', required: false },
      { id: 'case2', label: 'Case 2', type: 'control', required: false },
      { id: 'default', label: 'Default', type: 'control', required: false }
    ],
    configSchema: { field: { type: 'string' }, cases: { type: 'array' } }
  },

  // Action nodes
  {
    type: 'database-action',
    label: 'Database Action',
    description: 'Database operations',
    icon: '🗄️',
    category: 'action',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { operation: { type: 'select', options: ['INSERT', 'UPDATE', 'DELETE', 'SELECT'] }, table: { type: 'string' } }
  },
  {
    type: 'api-call',
    label: 'API Call',
    description: 'HTTP API requests',
    icon: '🌐',
    category: 'action',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { method: { type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'] }, endpoint: { type: 'string' } }
  },
  {
    type: 'notification',
    label: 'Notification',
    description: 'Send notifications',
    icon: '🔔',
    category: 'action',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { type: { type: 'select', options: ['email', 'sms', 'push'] }, recipient: { type: 'string' } }
  },
  {
    type: 'file-action',
    label: 'File Action',
    description: 'File operations',
    icon: '📁',
    category: 'action',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { action: { type: 'select', options: ['upload', 'download', 'delete', 'move'] }, path: { type: 'string' } }
  },
  {
    type: 'email',
    label: 'Email',
    description: 'Send email messages',
    icon: '📧',
    category: 'action',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { subject: { type: 'string' }, template: { type: 'string' } }
  },
  {
    type: 'slack',
    label: 'Slack',
    description: 'Send Slack messages',
    icon: '💬',
    category: 'action',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { channel: { type: 'string' }, message: { type: 'string' } }
  },

  // Transform nodes
  {
    type: 'map-transform',
    label: 'Map Transform',
    description: 'Transform data fields',
    icon: '🗺️',
    category: 'transform',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { field: { type: 'string' }, function: { type: 'string' } }
  },
  {
    type: 'filter-transform',
    label: 'Filter Transform',
    description: 'Filter data based on conditions',
    icon: '🔍',
    category: 'transform',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { condition: { type: 'string' }, operator: { type: 'select', options: ['equals', 'contains', 'greater_than', 'less_than'] } }
  },
  {
    type: 'reduce-transform',
    label: 'Reduce Transform',
    description: 'Aggregate data values',
    icon: '📊',
    category: 'transform',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { function: { type: 'select', options: ['sum', 'avg', 'min', 'max', 'count'] }, field: { type: 'string' } }
  },
  {
    type: 'format-transform',
    label: 'Format Transform',
    description: 'Format data output',
    icon: '📝',
    category: 'transform',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { format: { type: 'select', options: ['JSON', 'XML', 'CSV', 'HTML'] }, template: { type: 'string' } }
  },
  {
    type: 'split-transform',
    label: 'Split Transform',
    description: 'Split data into parts',
    icon: '✂️',
    category: 'transform',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { delimiter: { type: 'string' }, field: { type: 'string' } }
  },
  {
    type: 'join-transform',
    label: 'Join Transform',
    description: 'Join data fields',
    icon: '🔗',
    category: 'transform',
    inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
    outputs: [{ id: 'output', label: 'Output', type: 'data', required: true }],
    configSchema: { delimiter: { type: 'string' }, fields: { type: 'array' } }
  }
];

const categoryColors = {
  trigger: 'bg-green-50 border-green-200 text-green-800',
  agent: 'bg-blue-50 border-blue-200 text-blue-800',
  logic: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  action: 'bg-purple-50 border-purple-200 text-purple-800',
  transform: 'bg-orange-50 border-orange-200 text-orange-800'
};

export const NodePalette: React.FC<NodePaletteProps> = ({ onNodeAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredNodes = nodeTypes.filter(node => {
    const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || node.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(nodeTypes.map(node => node.category)));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Node Library</h2>
        <p className="text-sm text-gray-600">Drag nodes to canvas to build workflow</p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categories */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              !selectedCategory 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                selectedCategory === category 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredNodes.map(node => (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', node.type);
                e.dataTransfer.effectAllowed = 'move';
              }}
              className={`p-3 rounded-lg border-2 border-dashed cursor-move hover:shadow-md transition-shadow ${
                categoryColors[node.category as keyof typeof categoryColors]
              }`}
            >
              <div className="flex items-center">
                <span className="text-lg mr-2">{node.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{node.label}</div>
                  <div className="text-xs opacity-75">{node.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">Quick Tips:</div>
          <ul className="space-y-1">
            <li>• Drag nodes to canvas</li>
            <li>• Connect nodes with edges</li>
            <li>• Click nodes to configure</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
