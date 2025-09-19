'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus,
  Play,
  Pause,
  Save,
  Settings,
  Trash2,
  Copy,
  GitBranch,
  Bot,
  FileText,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  MoreVertical
} from 'lucide-react'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'ai-agent'
  name: string
  description?: string
  position: { x: number; y: number }
  config: Record<string, any>
  connections: string[] // IDs of connected nodes
  status?: 'idle' | 'running' | 'completed' | 'failed'
}

interface Workflow {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused'
  nodes: WorkflowNode[]
  createdAt: string
  lastRun?: string
  runCount: number
  successRate: number
}

const nodeTypes = [
  {
    type: 'trigger',
    name: 'Content Request',
    icon: <Play className="h-4 w-4" />,
    color: 'bg-green-100 border-green-300 text-green-700',
    description: 'Triggers when new content is requested'
  },
  {
    type: 'ai-agent',
    name: 'AI Content Generator',
    icon: <Bot className="h-4 w-4" />,
    color: 'bg-blue-100 border-blue-300 text-blue-700',
    description: 'Generate content using AI models'
  },
  {
    type: 'action',
    name: 'Medical Review',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-purple-100 border-purple-300 text-purple-700',
    description: 'Medical accuracy and compliance check'
  },
  {
    type: 'condition',
    name: 'Quality Gate',
    icon: <GitBranch className="h-4 w-4" />,
    color: 'bg-yellow-100 border-yellow-300 text-yellow-700',
    description: 'Conditional logic based on quality metrics'
  },
  {
    type: 'action',
    name: 'Content Publishing',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-gray-100 border-gray-300 text-gray-700',
    description: 'Publish approved content'
  }
]

export default function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Healthcare Content Pipeline',
      description: 'Automated pipeline for healthcare content creation and validation',
      status: 'active',
      nodes: [
        {
          id: 'n1',
          type: 'trigger',
          name: 'Content Request',
          position: { x: 50, y: 100 },
          config: { source: 'cms' },
          connections: ['n2'],
          status: 'completed'
        },
        {
          id: 'n2',
          type: 'ai-agent',
          name: 'AI Content Generator',
          position: { x: 250, y: 100 },
          config: { model: 'gpt-4', temperature: 0.7 },
          connections: ['n3'],
          status: 'completed'
        },
        {
          id: 'n3',
          type: 'action',
          name: 'Medical Review',
          position: { x: 450, y: 100 },
          config: { reviewer: 'ai-moderator' },
          connections: ['n4'],
          status: 'running'
        },
        {
          id: 'n4',
          type: 'condition',
          name: 'Quality Gate',
          position: { x: 650, y: 100 },
          config: { threshold: 0.85 },
          connections: ['n5'],
          status: 'idle'
        },
        {
          id: 'n5',
          type: 'action',
          name: 'Content Publishing',
          position: { x: 850, y: 100 },
          config: { destination: 'website' },
          connections: [],
          status: 'idle'
        }
      ],
      createdAt: '2025-01-15T10:00:00Z',
      lastRun: '2025-01-20T10:30:00Z',
      runCount: 47,
      successRate: 98.5
    }
  ])
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(workflows[0])
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [isBuilderMode, setIsBuilderMode] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const getNodeIcon = (type: string, status?: string) => {
    const nodeType = nodeTypes.find(nt => nt.type === type)
    if (status === 'running') return <Clock className="h-4 w-4 animate-spin" />
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status === 'failed') return <AlertTriangle className="h-4 w-4 text-red-500" />
    return nodeType?.icon || <Settings className="h-4 w-4" />
  }

  const getNodeColor = (type: string, status?: string) => {
    if (status === 'running') return 'bg-blue-100 border-blue-300 text-blue-700 animate-pulse'
    if (status === 'completed') return 'bg-green-100 border-green-300 text-green-700'
    if (status === 'failed') return 'bg-red-100 border-red-300 text-red-700'
    
    const nodeType = nodeTypes.find(nt => nt.type === type)
    return nodeType?.color || 'bg-gray-100 border-gray-300 text-gray-700'
  }

  const handleNodeClick = (node: WorkflowNode) => {
    setSelectedNode(node)
  }

  const handleRunWorkflow = async (workflowId: string) => {
    // Simulate workflow execution
    console.log('Running workflow:', workflowId)
    // This would trigger the actual workflow execution via API
  }

  const handlePauseWorkflow = async (workflowId: string) => {
    console.log('Pausing workflow:', workflowId)
    // This would pause the workflow execution via API
  }

  const renderWorkflowCanvas = () => {
    if (!selectedWorkflow) return null

    return (
      <div 
        ref={canvasRef}
        className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden"
        style={{ height: '500px', width: '100%' }}
      >
        {/* Render connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {selectedWorkflow.nodes.map(node => 
            node.connections.map(connectionId => {
              const targetNode = selectedWorkflow.nodes.find(n => n.id === connectionId)
              if (!targetNode) return null
              
              return (
                <line
                  key={`${node.id}-${connectionId}`}
                  x1={node.position.x + 80}
                  y1={node.position.y + 25}
                  x2={targetNode.position.x}
                  y2={targetNode.position.y + 25}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )
            })
          )}
        </svg>

        {/* Render nodes */}
        {selectedWorkflow.nodes.map(node => (
          <div
            key={node.id}
            className={`absolute p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getNodeColor(node.type, node.status)} ${
              selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              left: node.position.x,
              top: node.position.y,
              width: '160px'
            }}
            onClick={() => handleNodeClick(node)}
          >
            <div className="flex items-center gap-2 mb-1">
              {getNodeIcon(node.type, node.status)}
              <span className="font-medium text-xs">{node.name}</span>
            </div>
            {node.status && (
              <Badge 
                variant="secondary" 
                className="text-xs capitalize"
              >
                {node.status}
              </Badge>
            )}
          </div>
        ))}

        {isBuilderMode && (
          <div className="absolute bottom-4 left-4">
            <LiquidGlassButton variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Node
            </LiquidGlassButton>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Workflow List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Workflows
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workflows.map(workflow => (
                <div
                  key={workflow.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedWorkflow?.id === workflow.id 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{workflow.name}</h3>
                    <Badge 
                      variant={workflow.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {workflow.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {workflow.description}
                  </p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{workflow.runCount} runs</span>
                    <span>{workflow.successRate}% success</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Workflow Canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  {selectedWorkflow?.name || 'Select a Workflow'}
                </CardTitle>
                {selectedWorkflow && (
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsBuilderMode(!isBuilderMode)}
                    >
                      {isBuilderMode ? 'View Mode' : 'Edit Mode'}
                    </Button>
                    <LiquidGlassButton 
                      variant="primary"
                      size="sm" 
                      onClick={() => handleRunWorkflow(selectedWorkflow.id)}
                      disabled={selectedWorkflow.status === 'active'}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run
                    </LiquidGlassButton>
                    {selectedWorkflow.status === 'active' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePauseWorkflow(selectedWorkflow.id)}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {selectedWorkflow && (
                <div className="text-sm text-muted-foreground flex items-center gap-4">
                  <span>Last run: {selectedWorkflow.lastRun ? new Date(selectedWorkflow.lastRun).toLocaleString() : 'Never'}</span>
                  <span>Success rate: {selectedWorkflow.successRate}%</span>
                  <Badge variant={selectedWorkflow.status === 'active' ? 'default' : 'secondary'}>
                    {selectedWorkflow.status}
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selectedWorkflow ? renderWorkflowCanvas() : (
                <div className="text-center py-12 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a workflow to view its diagram</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Node Configuration Panel */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getNodeIcon(selectedNode.type, selectedNode.status)}
                {selectedNode.name} Configuration
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedNode(null)}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="node-name">Node Name</Label>
                <Input 
                  id="node-name" 
                  value={selectedNode.name} 
                  readOnly={!isBuilderMode}
                />
              </div>
              <div>
                <Label htmlFor="node-type">Type</Label>
                <Select value={selectedNode.type} disabled={!isBuilderMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeTypes.map(type => (
                      <SelectItem key={type.type} value={type.type}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="node-description">Description</Label>
              <Textarea 
                id="node-description" 
                value={selectedNode.description || ''} 
                readOnly={!isBuilderMode}
                rows={2}
              />
            </div>

            {/* Configuration Options */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Configuration</h4>
              <div className="space-y-3">
                {Object.entries(selectedNode.config).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <Input 
                      value={String(value)} 
                      readOnly={!isBuilderMode}
                      className="w-48"
                    />
                  </div>
                ))}
              </div>
            </div>

            {isBuilderMode && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <LiquidGlassButton variant="primary" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </LiquidGlassButton>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Node Types */}
      {isBuilderMode && (
        <Card>
          <CardHeader>
            <CardTitle>Available Node Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {nodeTypes.map(nodeType => (
                <div
                  key={nodeType.type}
                  className={`p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors hover:bg-gray-50 ${nodeType.color}`}
                  draggable
                >
                  <div className="flex items-center gap-2 mb-2">
                    {nodeType.icon}
                    <span className="font-medium text-sm">{nodeType.name}</span>
                  </div>
                  <p className="text-xs opacity-75">{nodeType.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}