'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, Info } from 'lucide-react';
import { WorkflowNodeType, WorkflowNodeCategory } from '@/types/workflows/visual-builder';
import { cn } from '@/lib/utils';

interface WorkflowNodeLibraryProps {
  onClose: () => void;
  onNodeSelect: (nodeType: WorkflowNodeType) => void;
  onNodeDrag?: (nodeType: WorkflowNodeType, event: React.DragEvent) => void;
  categories?: WorkflowNodeCategory[];
  searchQuery?: string;
  className?: string;
}

interface NodeDefinition {
  type: WorkflowNodeType;
  name: string;
  description: string;
  category: WorkflowNodeCategory;
  icon: string;
  color: string;
  isNew?: boolean;
  isPopular?: boolean;
}

const NODE_DEFINITIONS: NodeDefinition[] = [
  // AI Agents
  {
    type: 'ai-agent',
    name: 'AI Agent',
    description: 'Intelligent AI agent for healthcare content processing',
    category: 'ai-agents',
    icon: '🤖',
    color: 'bg-blue-500',
    isPopular: true,
  },
  
  // Logic Control
  {
    type: 'logic-conditional',
    name: 'Conditional',
    description: 'If/else logic branching based on conditions',
    category: 'logic-control',
    icon: '🔀',
    color: 'bg-green-500',
    isPopular: true,
  },
  {
    type: 'logic-loop',
    name: 'Loop',
    description: 'Repeat actions for a specified number of times',
    category: 'logic-control',
    icon: '🔄',
    color: 'bg-green-500',
  },
  {
    type: 'logic-switch',
    name: 'Switch',
    description: 'Multi-way branching based on input value',
    category: 'logic-control',
    icon: '🔀',
    color: 'bg-green-500',
  },
  {
    type: 'logic-delay',
    name: 'Delay',
    description: 'Wait for a specified amount of time',
    category: 'logic-control',
    icon: '⏱️',
    color: 'bg-green-500',
  },
  
  // Data Processing
  {
    type: 'data-transform',
    name: 'Transform',
    description: 'Transform data from one format to another',
    category: 'data-processing',
    icon: '🔄',
    color: 'bg-purple-500',
    isPopular: true,
  },
  {
    type: 'data-filter',
    name: 'Filter',
    description: 'Filter data based on specified criteria',
    category: 'data-processing',
    icon: '🔍',
    color: 'bg-purple-500',
  },
  {
    type: 'data-aggregate',
    name: 'Aggregate',
    description: 'Combine multiple data points into summaries',
    category: 'data-processing',
    icon: '📊',
    color: 'bg-purple-500',
  },
  {
    type: 'data-validate',
    name: 'Validate',
    description: 'Validate data against healthcare compliance rules',
    category: 'data-processing',
    icon: '✅',
    color: 'bg-purple-500',
    isPopular: true,
  },
  
  // Workflow Control
  {
    type: 'workflow-start',
    name: 'Start',
    description: 'Entry point for workflow execution',
    category: 'workflow-control',
    icon: '▶️',
    color: 'bg-emerald-500',
    isPopular: true,
  },
  {
    type: 'workflow-end',
    name: 'End',
    description: 'Termination point for workflow execution',
    category: 'workflow-control',
    icon: '🏁',
    color: 'bg-red-500',
    isPopular: true,
  },
  {
    type: 'workflow-trigger',
    name: 'Trigger',
    description: 'Event-based workflow activation',
    category: 'workflow-control',
    icon: '⚡',
    color: 'bg-orange-500',
  },
  {
    type: 'workflow-action',
    name: 'Action',
    description: 'Execute a specific action or operation',
    category: 'workflow-control',
    icon: '⚙️',
    color: 'bg-orange-500',
  },
  {
    type: 'workflow-condition',
    name: 'Condition',
    description: 'Evaluate conditions for workflow branching',
    category: 'workflow-control',
    icon: '❓',
    color: 'bg-orange-500',
  },
  {
    type: 'workflow-exception',
    name: 'Exception',
    description: 'Handle errors and exceptions in workflow',
    category: 'workflow-control',
    icon: '⚠️',
    color: 'bg-red-500',
  },
];

const CATEGORY_LABELS: Record<WorkflowNodeCategory, string> = {
  'ai-agents': 'AI Agents',
  'logic-control': 'Logic Control',
  'data-processing': 'Data Processing',
  'workflow-control': 'Workflow Control',
  'healthcare-specific': 'Healthcare Specific',
};

export const WorkflowNodeLibrary: React.FC<WorkflowNodeLibraryProps> = ({
  onClose,
  onNodeSelect,
  onNodeDrag,
  categories,
  searchQuery: initialSearchQuery = '',
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<WorkflowNodeCategory | 'all'>('all');
  const [showDescriptions, setShowDescriptions] = useState(false);

  const filteredNodes = useMemo(() => {
    let filtered = NODE_DEFINITIONS;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((node) => node.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (node) =>
          node.name.toLowerCase().includes(query) ||
          node.description.toLowerCase().includes(query) ||
          node.type.toLowerCase().includes(query)
      );
    }

    // Filter by provided categories
    if (categories && categories.length > 0) {
      filtered = filtered.filter((node) => categories.includes(node.category));
    }

    return filtered;
  }, [searchQuery, selectedCategory, categories]);

  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(NODE_DEFINITIONS.map((node) => node.category)));
    return cats.filter((cat) => !categories || categories.includes(cat));
  }, [categories]);

  const handleNodeClick = (nodeType: WorkflowNodeType) => {
    onNodeSelect(nodeType);
  };

  const handleNodeDragStart = (nodeType: WorkflowNodeType, event: React.DragEvent) => {
    if (onNodeDrag) {
      onNodeDrag(nodeType, event);
    }
  };

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center bg-black/50', className)}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workflow Node Library</h2>
            <p className="text-gray-600">Drag and drop nodes to build your workflow</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowDescriptions(!showDescriptions)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              {showDescriptions ? 'Hide' : 'Show'} Descriptions
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              All
            </button>
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                )}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
        </div>

        {/* Node Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNodes.map((node) => (
              <div
                key={node.type}
                draggable
                onDragStart={(e) => handleNodeDragStart(node.type, e)}
                onClick={() => handleNodeClick(node.type)}
                className={cn(
                  'p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-all hover:border-blue-500 hover:shadow-md group',
                  'hover:scale-105 active:scale-95'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg', node.color)}>
                    {node.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{node.name}</h3>
                      {node.isNew && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                          New
                        </span>
                      )}
                      {node.isPopular && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    {showDescriptions && (
                      <p className="text-sm text-gray-600 line-clamp-2">{node.description}</p>
                    )}
                    <div className="mt-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {CATEGORY_LABELS[node.category]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredNodes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No nodes found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredNodes.length} node{filteredNodes.length !== 1 ? 's' : ''} available
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
