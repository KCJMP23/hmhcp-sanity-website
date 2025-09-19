'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { WorkflowStepConfig } from './workflow-step-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Save,
  Play,
  Download,
  Upload,
  Plus,
  Trash2,
  Settings,
  Copy,
  GitBranch,
  Clock,
  Repeat,
  Filter,
  Zap
} from 'lucide-react';
import type {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowDefinition,
  WorkflowTemplate,
  AgentType
} from '@/types/ai/workflows';

interface WorkflowBuilderProps {
  organizationId: string;
  workflowId?: string;
  templateId?: string;
}

const AGENT_NODES = [
  { type: 'research', label: 'Research Agent', color: 'bg-blue-500' },
  { type: 'content', label: 'Content Agent', color: 'bg-green-500' },
  { type: 'medical_accuracy', label: 'Medical Accuracy', color: 'bg-red-500' },
  { type: 'compliance', label: 'Compliance Agent', color: 'bg-yellow-500' },
  { type: 'seo', label: 'SEO Agent', color: 'bg-purple-500' },
  { type: 'image', label: 'Image Agent', color: 'bg-pink-500' },
  { type: 'social', label: 'Social Agent', color: 'bg-indigo-500' },
  { type: 'publishing', label: 'Publishing Agent', color: 'bg-gray-500' },
  { type: 'workflow', label: 'Workflow Agent', color: 'bg-orange-500' },
  { type: 'qa', label: 'QA Agent', color: 'bg-teal-500' }
];

const CONTROL_NODES = [
  { type: 'condition', label: 'Condition', icon: GitBranch },
  { type: 'parallel', label: 'Parallel', icon: Zap },
  { type: 'loop', label: 'Loop', icon: Repeat },
  { type: 'delay', label: 'Delay', icon: Clock }
];

export function WorkflowBuilder({ organizationId, workflowId, templateId }: WorkflowBuilderProps) {
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectionPreview, setConnectionPreview] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleDragStart = (nodeType: string, existingNode?: WorkflowNode) => {
    setIsDragging(true);
    if (existingNode) {
      setDraggedNode(existingNode);
    } else {
      setDraggedNodeType(nodeType);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedNodeType(null);
    setDraggedNode(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedNode) {
      // Moving existing node
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const y = (e.clientY - rect.top - canvasOffset.y) / zoom;

      setNodes(nodes.map(n => 
        n.id === draggedNode.id 
          ? { ...n, position: { x, y } }
          : n
      ));
    } else if (draggedNodeType) {
      // Adding new node
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const y = (e.clientY - rect.top - canvasOffset.y) / zoom;

      const nodeType = draggedNodeType.includes('agent') ? 'agent' : draggedNodeType;
      const agentType = draggedNodeType.includes('agent') ? draggedNodeType.replace('agent_', '') : undefined;
      
      const newNode: WorkflowNode = {
        id: `node_${Date.now()}`,
        type: nodeType as any,
        agent: agentType as AgentType,
        position: { x, y },
        data: {
          label: draggedNodeType.replace('agent_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          config: {}
        }
      };

      setNodes([...nodes, newNode]);
    }
    
    handleDragEnd();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const startConnection = (nodeId: string) => {
    setIsConnecting(true);
    setConnectingFrom(nodeId);
  };

  const completeConnection = (targetId: string) => {
    if (connectingFrom && connectingFrom !== targetId) {
      const newEdge: WorkflowEdge = {
        id: `edge_${Date.now()}`,
        source: connectingFrom,
        target: targetId,
        type: 'default'
      };
      setEdges([...edges, newEdge]);
    }
    setIsConnecting(false);
    setConnectingFrom(null);
    setConnectionPreview(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isConnecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setConnectionPreview({
        x: (e.clientX - rect.left - canvasOffset.x) / zoom,
        y: (e.clientY - rect.top - canvasOffset.y) / zoom
      });
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Click on canvas to cancel connection
    if (isConnecting && e.target === e.currentTarget) {
      setIsConnecting(false);
      setConnectingFrom(null);
      setConnectionPreview(null);
    }
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  // Calculate edge path for smoother curves
  const getEdgePath = (sourceNode: WorkflowNode, targetNode: WorkflowNode) => {
    const sx = sourceNode.position.x + 120;
    const sy = sourceNode.position.y + 30;
    const tx = targetNode.position.x;
    const ty = targetNode.position.y + 30;
    
    const midX = (sx + tx) / 2;
    
    return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
  };

  const saveWorkflow = async () => {
    const workflowDefinition: WorkflowDefinition = {
      nodes,
      edges,
      variables: {},
      settings: {
        maxRetries: 3,
        timeout: 300000,
        errorHandling: 'retry'
      }
    };

    try {
      const response = await fetch('/api/admin/ai/workflows', {
        method: workflowId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: workflowId,
          name: workflowName,
          description: workflowDescription,
          workflowDefinition,
          organizationId
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Workflow saved:', data);
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  };

  const testWorkflow = () => {
    // Validate workflow before testing
    const validation = validateWorkflow();
    if (!validation.isValid) {
      alert(`Workflow validation failed:\n${validation.errors.join('\n')}`);
      return;
    }
    setIsTestModalOpen(true);
  };

  const validateWorkflow = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check for workflow name
    if (!workflowName.trim()) {
      errors.push('Workflow name is required');
    }
    
    // Check for at least one node
    if (nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }
    
    // Check for start node
    const startNodes = nodes.filter(n => {
      const incomingEdges = edges.filter(e => e.target === n.id);
      return incomingEdges.length === 0;
    });
    
    if (startNodes.length === 0 && nodes.length > 0) {
      errors.push('Workflow must have at least one start node (node with no incoming connections)');
    }
    
    if (startNodes.length > 1) {
      errors.push('Workflow should have only one start node');
    }
    
    // Check for orphaned nodes (except start and end nodes)
    const orphanedNodes = nodes.filter(n => {
      const hasIncoming = edges.some(e => e.target === n.id);
      const hasOutgoing = edges.some(e => e.source === n.id);
      return !hasIncoming && !hasOutgoing && nodes.length > 1;
    });
    
    if (orphanedNodes.length > 0) {
      errors.push(`Found ${orphanedNodes.length} orphaned node(s) with no connections`);
    }
    
    // Check for cycles (simple detection)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const outgoingEdges = edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          if (hasCycle(edge.target)) return true;
        } else if (recursionStack.has(edge.target)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) {
          errors.push('Workflow contains a cycle, which may cause infinite loops');
          break;
        }
      }
    }
    
    // Validate node configurations
    for (const node of nodes) {
      if (node.type === 'condition' && !node.data.config?.expression) {
        errors.push(`Condition node "${node.data.label}" is missing an expression`);
      }
      
      if (node.type === 'delay' && !node.data.config?.delay) {
        errors.push(`Delay node "${node.data.label}" is missing delay duration`);
      }
      
      if (node.type === 'loop' && !node.data.config?.maxIterations) {
        errors.push(`Loop node "${node.data.label}" is missing max iterations`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Left Sidebar - Node Library */}
      <div className="w-64 border-r bg-background p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Workflow Details</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="workflow-name">Name</Label>
              <Input
                id="workflow-name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="My Healthcare Workflow"
              />
            </div>
            <div>
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea
                id="workflow-description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe your workflow..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">AI Agents</h3>
          <div className="space-y-2">
            {AGENT_NODES.map(agent => (
              <div
                key={agent.type}
                draggable
                onDragStart={() => handleDragStart(`agent_${agent.type}`)}
                onDragEnd={handleDragEnd}
                className={`p-2 rounded-md cursor-move hover:opacity-80 transition-opacity ${agent.color} text-white text-sm`}
              >
                {agent.label}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Control Nodes</h3>
          <div className="space-y-2">
            {CONTROL_NODES.map(node => (
              <div
                key={node.type}
                draggable
                onDragStart={() => handleDragStart(node.type)}
                onDragEnd={handleDragEnd}
                className="p-2 rounded-md cursor-move hover:bg-accent transition-colors border flex items-center gap-2"
              >
                <node.icon className="h-4 w-4" />
                <span className="text-sm">{node.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b p-4 flex items-center justify-between bg-background">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={saveWorkflow}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={testWorkflow}>
              <Play className="h-4 w-4 mr-1" />
              Test
            </Button>
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <div className="border-l pl-2 ml-2 flex items-center gap-1">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => handleZoom(-0.1)}
                disabled={zoom <= 0.5}
              >
                <span className="text-xs">-</span>
              </Button>
              <span className="text-xs font-mono min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => handleZoom(0.1)}
                disabled={zoom >= 2}
              >
                <span className="text-xs">+</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{nodes.length} nodes</Badge>
            <Badge variant="outline">{edges.length} connections</Badge>
            {isConnecting && (
              <Badge variant="secondary" className="animate-pulse">
                Connecting...
              </Badge>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div 
          ref={canvasRef}
          className="flex-1 relative bg-dot-pattern overflow-auto"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onMouseMove={handleCanvasMouseMove}
          onClick={handleCanvasClick}
          style={{
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            cursor: isConnecting ? 'crosshair' : isDragging ? 'grabbing' : 'default'
          }}
        >
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium mb-2">Drag agents here to start building</p>
                <p className="text-sm">Connect agents to create your workflow</p>
              </div>
            </div>
          )}

          {/* Render Nodes */}
          <div style={{ transform: `scale(${zoom}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)` }}>
            {nodes.map(node => {
              const agentNode = AGENT_NODES.find(a => `agent_${a.type}` === `agent_${node.agent}`);
              const bgColor = node.type === 'agent' && agentNode ? agentNode.color : 'bg-background';
              
              return (
                <div
                  key={node.id}
                  className="absolute"
                  style={{ left: node.position.x, top: node.position.y }}
                  draggable
                  onDragStart={() => handleDragStart('', node)}
                  onDragEnd={handleDragEnd}
                >
                  <Card 
                    className={`relative p-3 cursor-move hover:shadow-lg transition-all min-w-[120px] ${
                      selectedNode?.id === node.id ? 'ring-2 ring-primary shadow-lg' : ''
                    } ${node.type === 'agent' ? '' : 'border-2'}`}
                    onClick={(e) => {
                      if (!isConnecting) {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }
                    }}
                  >
                    {/* Connection Points */}
                    <div 
                      className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background cursor-crosshair hover:scale-125 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isConnecting) {
                          completeConnection(node.id);
                        }
                      }}
                    />
                    <div 
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background cursor-crosshair hover:scale-125 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        startConnection(node.id);
                      }}
                    />
                    
                    {/* Node Content */}
                    <div className={`${node.type === 'agent' ? `${bgColor} text-white rounded px-2 py-1 -m-1 mb-1` : ''}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{node.data.label}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-5 w-5 p-0 ${node.type === 'agent' ? 'hover:bg-white/20' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {node.data.description && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {node.data.description}
                      </p>
                    )}
                    
                    {/* Node Type Badge */}
                    {node.type !== 'agent' && (
                      <Badge variant="outline" className="absolute -top-2 -right-2 text-xs">
                        {node.type}
                      </Badge>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>

          {/* SVG for Edges */}
          <svg 
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `scale(${zoom}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)` }}
          >
            {/* Render existing edges */}
            {edges.map(edge => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              return (
                <g key={edge.id}>
                  <path
                    d={getEdgePath(sourceNode, targetNode)}
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    opacity={0.6}
                  />
                </g>
              );
            })}
            
            {/* Render connection preview */}
            {isConnecting && connectingFrom && connectionPreview && (() => {
              const sourceNode = nodes.find(n => n.id === connectingFrom);
              if (!sourceNode) return null;
              
              return (
                <line
                  x1={sourceNode.position.x + 120}
                  y1={sourceNode.position.y + 30}
                  x2={connectionPreview.x}
                  y2={connectionPreview.y}
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity={0.5}
                />
              );
            })()}
            
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="hsl(var(--primary))"
                />
              </marker>
            </defs>
          </svg>
        </div>
      </div>

      {/* Right Sidebar - Node Properties */}
      {selectedNode && (
        <div className="w-96 border-l bg-background overflow-y-auto">
          <WorkflowStepConfig
            node={selectedNode}
            onUpdate={(updatedNode) => {
              const updated = nodes.map(n => 
                n.id === updatedNode.id ? updatedNode : n
              );
              setNodes(updated);
              setSelectedNode(updatedNode);
            }}
            onDelete={(nodeId) => {
              deleteNode(nodeId);
              setSelectedNode(null);
            }}
            onDuplicate={(node) => {
              const newNode: WorkflowNode = {
                ...node,
                id: `node_${Date.now()}`,
                position: {
                  x: node.position.x + 50,
                  y: node.position.y + 50
                }
              };
              setNodes([...nodes, newNode]);
              setSelectedNode(newNode);
            }}
          />
        </div>
      )}

      {/* Test Modal */}
      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Workflow</DialogTitle>
            <DialogDescription>
              Configure test parameters for your workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Test Input Data</Label>
              <Textarea 
                placeholder='{"topic": "Healthcare AI", "keywords": ["medical", "technology"]}'
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTestModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Run test
                setIsTestModalOpen(false);
              }}>
                Run Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}