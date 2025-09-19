'use client';

// Visual Workflow Builder Component
// Story: 6.3.visual-workflow-builder.md
// Created: 2025-01-06

import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowConnection, 
  WorkflowNodeLibrary,
  WorkflowCanvasState,
  WorkflowBuilderProps 
} from '@/types/workflow';
import { 
  Play, 
  Save, 
  Square, 
  Pause, 
  RotateCcw, 
  Settings, 
  Eye,
  EyeOff,
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  Share2
} from 'lucide-react';

interface VisualWorkflowBuilderProps extends WorkflowBuilderProps {
  className?: string;
}

const VisualWorkflowBuilder: React.FC<VisualWorkflowBuilderProps> = ({
  workflow,
  onSave,
  onExecute,
  onClose,
  isReadOnly = false,
  className = ''
}) => {
  const [canvasState, setCanvasState] = useState<WorkflowCanvasState>({
    nodes: workflow?.definition?.nodes || [],
    connections: workflow?.definition?.connections || [],
    selectedNodeId: undefined,
    selectedConnectionId: undefined,
    zoom: 1,
    pan: { x: 0, y: 0 },
    isExecuting: false,
    executionId: undefined
  });

  const [nodeLibrary, setNodeLibrary] = useState<WorkflowNodeLibrary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load node library on component mount
  useEffect(() => {
    loadNodeLibrary();
  }, []);

  const loadNodeLibrary = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/workflow-nodes');
      if (!response.ok) throw new Error('Failed to load node library');
      
      const data = await response.json();
      const allNodes = Object.values(data).flat() as WorkflowNodeLibrary[];
      setNodeLibrary(allNodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load node library');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = useCallback(() => {
    if (!workflow) return;
    
    const updatedWorkflow: Workflow = {
      ...workflow,
      definition: {
        nodes: canvasState.nodes,
        connections: canvasState.connections,
        settings: workflow.definition?.settings || {},
        metadata: {
          version: '1.0',
          createdBy: workflow.createdBy,
          lastModified: new Date().toISOString()
        }
      }
    };
    
    onSave(updatedWorkflow);
  }, [workflow, canvasState, onSave]);

  const handleExecute = useCallback(() => {
    if (!workflow || canvasState.isExecuting) return;
    
    setCanvasState(prev => ({ ...prev, isExecuting: true }));
    onExecute(workflow);
  }, [workflow, canvasState.isExecuting, onExecute]);

  const handleNodeAdd = useCallback((nodeTemplate: WorkflowNodeLibrary) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      name: nodeTemplate.name,
      type: nodeTemplate.type,
      category: nodeTemplate.category,
      description: nodeTemplate.description,
      icon: nodeTemplate.icon,
      color: nodeTemplate.color || '#3B82F6',
      position: { x: 100, y: 100 },
      configuration: { ...nodeTemplate.defaultConfiguration },
      isSystem: nodeTemplate.isSystem
    };

    setCanvasState(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setCanvasState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setCanvasState(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(conn => 
        conn.from !== nodeId && conn.to !== nodeId
      ),
      selectedNodeId: prev.selectedNodeId === nodeId ? undefined : prev.selectedNodeId
    }));
  }, []);

  const handleConnectionAdd = useCallback((fromNodeId: string, toNodeId: string) => {
    const newConnection: WorkflowConnection = {
      id: `conn_${Date.now()}`,
      from: fromNodeId,
      to: toNodeId
    };

    setCanvasState(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection]
    }));
  }, []);

  const handleConnectionDelete = useCallback((connectionId: string) => {
    setCanvasState(prev => ({
      ...prev,
      connections: prev.connections.filter(conn => conn.id !== connectionId),
      selectedConnectionId: prev.selectedConnectionId === connectionId ? undefined : prev.selectedConnectionId
    }));
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setCanvasState(prev => ({
        ...prev,
        selectedNodeId: undefined,
        selectedConnectionId: undefined
      }));
    }
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setCanvasState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(3, prev.zoom + delta))
    }));
  }, []);

  const handlePan = useCallback((deltaX: number, deltaY: number) => {
    setCanvasState(prev => ({
      ...prev,
      pan: {
        x: prev.pan.x + deltaX,
        y: prev.pan.y + deltaY
      }
    }));
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold">Error Loading Workflow Builder</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`flex h-full bg-gray-50 ${className}`}>
        {/* Node Library Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Workflow Nodes</h3>
            <p className="text-sm text-gray-600">Drag nodes to canvas</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <NodeLibrary 
              nodes={nodeLibrary} 
              onNodeAdd={handleNodeAdd}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {workflow?.name || 'New Workflow'}
              </h2>
              {workflow && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  workflow.status === 'active' ? 'bg-green-100 text-green-800' :
                  workflow.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {workflow.status}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                disabled={isReadOnly}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </button>
              
              <button
                onClick={handleExecute}
                disabled={isReadOnly || canvasState.isExecuting}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canvasState.isExecuting ? (
                  <Pause className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {canvasState.isExecuting ? 'Executing...' : 'Execute'}
              </button>
              
              <button
                onClick={onClose}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <WorkflowCanvas
              state={canvasState}
              onNodeUpdate={handleNodeUpdate}
              onNodeDelete={handleNodeDelete}
              onConnectionAdd={handleConnectionAdd}
              onConnectionDelete={handleConnectionDelete}
              onCanvasClick={handleCanvasClick}
              onZoom={handleZoom}
              onPan={handlePan}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

// Node Library Component
interface NodeLibraryProps {
  nodes: WorkflowNodeLibrary[];
  onNodeAdd: (node: WorkflowNodeLibrary) => void;
  isReadOnly: boolean;
}

const NodeLibrary: React.FC<NodeLibraryProps> = ({ nodes, onNodeAdd, isReadOnly }) => {
  const groupedNodes = nodes.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, WorkflowNodeLibrary[]>);

  const categoryLabels = {
    'patient-care': 'Patient Care',
    'research': 'Research',
    'compliance': 'Compliance',
    'administrative': 'Administrative'
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedNodes).map(([category, categoryNodes]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            {categoryLabels[category as keyof typeof categoryLabels] || category}
          </h4>
          <div className="space-y-2">
            {categoryNodes.map((node) => (
              <NodeLibraryItem
                key={node.id}
                node={node}
                onAdd={onNodeAdd}
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Node Library Item Component
interface NodeLibraryItemProps {
  node: WorkflowNodeLibrary;
  onAdd: (node: WorkflowNodeLibrary) => void;
  isReadOnly: boolean;
}

const NodeLibraryItem: React.FC<NodeLibraryItemProps> = ({ node, onAdd, isReadOnly }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'node',
    item: { node },
    canDrag: !isReadOnly,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  return (
    <div
      ref={drag}
      className={`p-3 border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:shadow-sm transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}
      onClick={() => !isReadOnly && onAdd(node)}
    >
      <div className="flex items-center space-x-3">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
          style={{ backgroundColor: node.color || '#3B82F6' }}
        >
          {node.icon ? (
            <span className="text-xs">{node.icon}</span>
          ) : (
            <Square className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {node.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {node.description}
          </p>
        </div>
      </div>
    </div>
  );
};

// Workflow Canvas Component
interface WorkflowCanvasProps {
  state: WorkflowCanvasState;
  onNodeUpdate: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  onNodeDelete: (nodeId: string) => void;
  onConnectionAdd: (fromNodeId: string, toNodeId: string) => void;
  onConnectionDelete: (connectionId: string) => void;
  onCanvasClick: (e: React.MouseEvent) => void;
  onZoom: (delta: number) => void;
  onPan: (deltaX: number, deltaY: number) => void;
  isReadOnly: boolean;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  state,
  onNodeUpdate,
  onNodeDelete,
  onConnectionAdd,
  onConnectionDelete,
  onCanvasClick,
  onZoom,
  onPan,
  isReadOnly
}) => {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      onPan(deltaX, deltaY);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    onZoom(delta);
  };

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-gray-100"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={onCanvasClick}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${state.zoom}) translate(${state.pan.x}px, ${state.pan.y}px)`,
          transformOrigin: '0 0'
        }}
      >
        {/* Render connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {state.connections.map((connection) => (
            <WorkflowConnection
              key={connection.id}
              connection={connection}
              nodes={state.nodes}
              onDelete={() => onConnectionDelete(connection.id)}
              isReadOnly={isReadOnly}
            />
          ))}
        </svg>

        {/* Render nodes */}
        {state.nodes.map((node) => (
          <WorkflowNodeComponent
            key={node.id}
            node={node}
            isSelected={state.selectedNodeId === node.id}
            onUpdate={(updates) => onNodeUpdate(node.id, updates)}
            onDelete={() => onNodeDelete(node.id)}
            onConnectionStart={(nodeId) => {
              // Handle connection start logic
            }}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <button
          onClick={() => onZoom(0.1)}
          className="w-8 h-8 bg-white border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => onZoom(-0.1)}
          className="w-8 h-8 bg-white border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Workflow Node Component
interface WorkflowNodeComponentProps {
  node: WorkflowNode;
  isSelected: boolean;
  onUpdate: (updates: Partial<WorkflowNode>) => void;
  onDelete: () => void;
  onConnectionStart: (nodeId: string) => void;
  isReadOnly: boolean;
}

const WorkflowNodeComponent: React.FC<WorkflowNodeComponentProps> = ({
  node,
  isSelected,
  onUpdate,
  onDelete,
  onConnectionStart,
  isReadOnly
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'node-move',
    item: { nodeId: node.id },
    canDrag: !isReadOnly,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'node',
    drop: (item: { node: WorkflowNodeLibrary }) => {
      // Handle node drop logic
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <div
      ref={(el) => {
        drag(el);
        drop(el);
      }}
      className={`absolute w-48 p-3 bg-white border-2 rounded-lg shadow-sm cursor-move ${
        isSelected ? 'border-blue-500 shadow-md' : 'border-gray-300'
      } ${isDragging ? 'opacity-50' : ''} ${isOver ? 'border-green-400' : ''}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: isDragging ? 'rotate(5deg)' : 'none'
      }}
    >
      <div className="flex items-center space-x-2 mb-2">
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
          style={{ backgroundColor: node.color }}
        >
          {node.icon ? (
            <span>{node.icon}</span>
          ) : (
            <Square className="w-3 h-3" />
          )}
        </div>
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {node.name}
        </h4>
        {!isReadOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="ml-auto text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      
      {node.description && (
        <p className="text-xs text-gray-600 mb-2">{node.description}</p>
      )}
      
      <div className="text-xs text-gray-500">
        {node.type} • {node.category}
      </div>
    </div>
  );
};

// Workflow Connection Component
interface WorkflowConnectionProps {
  connection: WorkflowConnection;
  nodes: WorkflowNode[];
  onDelete: () => void;
  isReadOnly: boolean;
}

const WorkflowConnection: React.FC<WorkflowConnectionProps> = ({
  connection,
  nodes,
  onDelete,
  isReadOnly
}) => {
  const fromNode = nodes.find(n => n.id === connection.from);
  const toNode = nodes.find(n => n.id === connection.to);

  if (!fromNode || !toNode) return null;

  const startX = fromNode.position.x + 96; // Half of node width
  const startY = fromNode.position.y + 24; // Half of node height
  const endX = toNode.position.x + 96;
  const endY = toNode.position.y + 24;

  return (
    <g>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="#6B7280"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
      {!isReadOnly && (
        <circle
          cx={(startX + endX) / 2}
          cy={(startY + endY) / 2}
          r="4"
          fill="#EF4444"
          className="cursor-pointer"
          onClick={onDelete}
        />
      )}
    </g>
  );
};

export default VisualWorkflowBuilder;
