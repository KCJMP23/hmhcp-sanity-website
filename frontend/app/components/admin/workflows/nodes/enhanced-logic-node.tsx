'use client';

import React, { useState, useCallback } from 'react';
import { WorkflowNode } from '@/types/workflows/visual-builder';
import { 
  ConditionalExpression, 
  LoopConfiguration, 
  SwitchConfiguration, 
  ExceptionHandling, 
  ParallelExecution 
} from '@/lib/workflows/conditional-logic-engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Settings, 
  Code, 
  GitBranch, 
  Repeat, 
  AlertTriangle,
  Zap,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedLogicNodeProps {
  node: WorkflowNode;
  onUpdate: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  onDelete: (nodeId: string) => void;
  onConnect: (nodeId: string, portType: 'input' | 'output') => void;
  isSelected?: boolean;
  isExecuting?: boolean;
  executionState?: 'idle' | 'running' | 'completed' | 'error' | 'paused';
  className?: string;
}

export function EnhancedLogicNode({
  node,
  onUpdate,
  onDelete,
  onConnect,
  isSelected = false,
  isExecuting = false,
  executionState = 'idle',
  className,
}: EnhancedLogicNodeProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('condition');

  const config = node.data.config as any;
  const logicType = config?.logicType || 'if-else';

  const getNodeIcon = () => {
    switch (logicType) {
      case 'if-else':
        return <GitBranch className="w-5 h-5" />;
      case 'loop':
        return <Repeat className="w-5 h-5" />;
      case 'switch':
        return <Code className="w-5 h-5" />;
      case 'delay':
        return <Pause className="w-5 h-5" />;
      case 'exception':
        return <AlertTriangle className="w-5 h-5" />;
      case 'parallel':
        return <Zap className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getNodeColor = () => {
    switch (logicType) {
      case 'if-else':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'loop':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'switch':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'delay':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'exception':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'parallel':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getExecutionColor = () => {
    switch (executionState) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const handleConfigUpdate = useCallback((updates: any) => {
    onUpdate(node.id, {
      data: {
        ...node.data,
        config: {
          ...config,
          ...updates,
        },
      },
    });
  }, [node.id, node.data, config, onUpdate]);

  const renderConditionBuilder = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="condition-type">Condition Type</Label>
        <Select
          value={config?.condition?.type || 'comparison'}
          onValueChange={(value) => handleConfigUpdate({
            condition: { ...config?.condition, type: value }
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="comparison">Comparison</SelectItem>
            <SelectItem value="logical">Logical</SelectItem>
            <SelectItem value="function">Function</SelectItem>
            <SelectItem value="variable">Variable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config?.condition?.type === 'comparison' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="left-operand">Left Operand</Label>
            <Input
              id="left-operand"
              value={config?.condition?.leftOperand || ''}
              onChange={(e) => handleConfigUpdate({
                condition: { ...config?.condition, leftOperand: e.target.value }
              })}
              placeholder="Variable or value"
            />
          </div>
          <div>
            <Label htmlFor="operator">Operator</Label>
            <Select
              value={config?.condition?.operator || 'eq'}
              onValueChange={(value) => handleConfigUpdate({
                condition: { ...config?.condition, operator: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eq">Equals</SelectItem>
                <SelectItem value="ne">Not Equals</SelectItem>
                <SelectItem value="gt">Greater Than</SelectItem>
                <SelectItem value="gte">Greater or Equal</SelectItem>
                <SelectItem value="lt">Less Than</SelectItem>
                <SelectItem value="lte">Less or Equal</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="startsWith">Starts With</SelectItem>
                <SelectItem value="endsWith">Ends With</SelectItem>
                <SelectItem value="regex">Regex Match</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="right-operand">Right Operand</Label>
            <Input
              id="right-operand"
              value={config?.condition?.rightOperand || ''}
              onChange={(e) => handleConfigUpdate({
                condition: { ...config?.condition, rightOperand: e.target.value }
              })}
              placeholder="Variable or value"
            />
          </div>
        </div>
      )}

      {config?.condition?.type === 'function' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="function-name">Function</Label>
            <Select
              value={config?.condition?.functionName || 'isEmpty'}
              onValueChange={(value) => handleConfigUpdate({
                condition: { ...config?.condition, functionName: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="isEmpty">Is Empty</SelectItem>
                <SelectItem value="isNotEmpty">Is Not Empty</SelectItem>
                <SelectItem value="isNull">Is Null</SelectItem>
                <SelectItem value="isNotNull">Is Not Null</SelectItem>
                <SelectItem value="isNumber">Is Number</SelectItem>
                <SelectItem value="isString">Is String</SelectItem>
                <SelectItem value="isArray">Is Array</SelectItem>
                <SelectItem value="isObject">Is Object</SelectItem>
                <SelectItem value="length">Length</SelectItem>
                <SelectItem value="matches">Matches Regex</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="function-param">Parameter</Label>
            <Input
              id="function-param"
              value={config?.condition?.parameters?.[0] || ''}
              onChange={(e) => handleConfigUpdate({
                condition: { 
                  ...config?.condition, 
                  parameters: [e.target.value]
                }
              })}
              placeholder="Parameter value"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderLoopConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="loop-type">Loop Type</Label>
        <Select
          value={config?.loopConfig?.type || 'for'}
          onValueChange={(value) => handleConfigUpdate({
            loopConfig: { ...config?.loopConfig, type: value }
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="for">For Loop</SelectItem>
            <SelectItem value="while">While Loop</SelectItem>
            <SelectItem value="foreach">For Each</SelectItem>
            <SelectItem value="do-while">Do While</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config?.loopConfig?.type === 'for' && (
        <div>
          <Label htmlFor="iterations">Iterations</Label>
          <Input
            id="iterations"
            type="number"
            value={config?.loopConfig?.iterations || 1}
            onChange={(e) => handleConfigUpdate({
              loopConfig: { ...config?.loopConfig, iterations: parseInt(e.target.value) || 1 }
            })}
            min="1"
            max="10000"
          />
        </div>
      )}

      {config?.loopConfig?.type === 'foreach' && (
        <div>
          <Label htmlFor="collection">Collection Variable</Label>
          <Input
            id="collection"
            value={config?.loopConfig?.collection || ''}
            onChange={(e) => handleConfigUpdate({
              loopConfig: { ...config?.loopConfig, collection: e.target.value }
            })}
            placeholder="array_variable"
          />
        </div>
      )}

      {(config?.loopConfig?.type === 'while' || config?.loopConfig?.type === 'do-while') && (
        <div>
          <Label htmlFor="while-condition">While Condition</Label>
          <Textarea
            id="while-condition"
            value={config?.loopConfig?.condition?.leftOperand || ''}
            onChange={(e) => handleConfigUpdate({
              loopConfig: { 
                ...config?.loopConfig, 
                condition: { 
                  type: 'comparison',
                  leftOperand: e.target.value,
                  operator: 'eq',
                  rightOperand: 'true'
                }
              }
            })}
            placeholder="condition_expression"
            rows={3}
          />
        </div>
      )}

      <div>
        <Label htmlFor="break-condition">Break Condition (Optional)</Label>
        <Textarea
          id="break-condition"
          value={config?.loopConfig?.breakCondition?.leftOperand || ''}
          onChange={(e) => handleConfigUpdate({
            loopConfig: { 
              ...config?.loopConfig, 
              breakCondition: { 
                type: 'comparison',
                leftOperand: e.target.value,
                operator: 'eq',
                rightOperand: 'true'
              }
            }
          })}
          placeholder="break_condition_expression"
          rows={2}
        />
      </div>
    </div>
  );

  const renderSwitchConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="switch-variable">Switch Variable</Label>
        <Input
          id="switch-variable"
          value={config?.switchConfig?.variable || ''}
          onChange={(e) => handleConfigUpdate({
            switchConfig: { ...config?.switchConfig, variable: e.target.value }
          })}
          placeholder="variable_name"
        />
      </div>

      <div>
        <Label>Cases</Label>
        <div className="space-y-2">
          {(config?.switchConfig?.cases || []).map((caseItem: any, index: number) => (
            <div key={index} className="flex gap-2 p-2 border rounded">
              <Input
                value={caseItem.value || ''}
                onChange={(e) => {
                  const newCases = [...(config?.switchConfig?.cases || [])];
                  newCases[index] = { ...caseItem, value: e.target.value };
                  handleConfigUpdate({
                    switchConfig: { ...config?.switchConfig, cases: newCases }
                  });
                }}
                placeholder="Case value"
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newCases = (config?.switchConfig?.cases || []).filter((_: any, i: number) => i !== index);
                  handleConfigUpdate({
                    switchConfig: { ...config?.switchConfig, cases: newCases }
                  });
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newCases = [...(config?.switchConfig?.cases || []), { value: '', actions: [] }];
              handleConfigUpdate({
                switchConfig: { ...config?.switchConfig, cases: newCases }
              });
            }}
          >
            Add Case
          </Button>
        </div>
      </div>
    </div>
  );

  const renderDelayConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="delay-ms">Delay (milliseconds)</Label>
        <Input
          id="delay-ms"
          type="number"
          value={config?.delayMs || 1000}
          onChange={(e) => handleConfigUpdate({
            delayMs: parseInt(e.target.value) || 1000
          })}
          min="0"
          max="300000"
        />
      </div>
      <div className="text-sm text-gray-600">
        Maximum delay: 5 minutes (300,000ms)
      </div>
    </div>
  );

  const renderExceptionConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="try-actions">Try Block Actions</Label>
        <Textarea
          id="try-actions"
          value={(config?.exceptionConfig?.tryBlock || []).join('\n')}
          onChange={(e) => handleConfigUpdate({
            exceptionConfig: { 
              ...config?.exceptionConfig, 
              tryBlock: e.target.value.split('\n').filter(line => line.trim())
            }
          })}
          placeholder="action1&#10;action2&#10;action3"
          rows={4}
        />
      </div>

      <div>
        <Label>Catch Blocks</Label>
        <div className="space-y-2">
          {(config?.exceptionConfig?.catchBlocks || []).map((catchBlock: any, index: number) => (
            <div key={index} className="p-3 border rounded space-y-2">
              <div className="flex gap-2">
                <Input
                  value={catchBlock.exceptionType || ''}
                  onChange={(e) => {
                    const newCatchBlocks = [...(config?.exceptionConfig?.catchBlocks || [])];
                    newCatchBlocks[index] = { ...catchBlock, exceptionType: e.target.value };
                    handleConfigUpdate({
                      exceptionConfig: { ...config?.exceptionConfig, catchBlocks: newCatchBlocks }
                    });
                  }}
                  placeholder="Exception Type"
                  className="flex-1"
                />
                <Input
                  value={catchBlock.variable || ''}
                  onChange={(e) => {
                    const newCatchBlocks = [...(config?.exceptionConfig?.catchBlocks || [])];
                    newCatchBlocks[index] = { ...catchBlock, variable: e.target.value };
                    handleConfigUpdate({
                      exceptionConfig: { ...config?.exceptionConfig, catchBlocks: newCatchBlocks }
                    });
                  }}
                  placeholder="Variable Name"
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newCatchBlocks = (config?.exceptionConfig?.catchBlocks || []).filter((_: any, i: number) => i !== index);
                    handleConfigUpdate({
                      exceptionConfig: { ...config?.exceptionConfig, catchBlocks: newCatchBlocks }
                    });
                  }}
                >
                  Remove
                </Button>
              </div>
              <Textarea
                value={(catchBlock.actions || []).join('\n')}
                onChange={(e) => {
                  const newCatchBlocks = [...(config?.exceptionConfig?.catchBlocks || [])];
                  newCatchBlocks[index] = { 
                    ...catchBlock, 
                    actions: e.target.value.split('\n').filter(line => line.trim())
                  };
                  handleConfigUpdate({
                    exceptionConfig: { ...config?.exceptionConfig, catchBlocks: newCatchBlocks }
                  });
                }}
                placeholder="catch_actions"
                rows={2}
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newCatchBlocks = [...(config?.exceptionConfig?.catchBlocks || []), { 
                exceptionType: '', 
                variable: '', 
                actions: [] 
              }];
              handleConfigUpdate({
                exceptionConfig: { ...config?.exceptionConfig, catchBlocks: newCatchBlocks }
              });
            }}
          >
            Add Catch Block
          </Button>
        </div>
      </div>
    </div>
  );

  const renderParallelConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="sync-type">Synchronization Type</Label>
        <Select
          value={config?.parallelConfig?.synchronization || 'wait-all'}
          onValueChange={(value) => handleConfigUpdate({
            parallelConfig: { ...config?.parallelConfig, synchronization: value }
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wait-all">Wait for All</SelectItem>
            <SelectItem value="wait-any">Wait for Any</SelectItem>
            <SelectItem value="race">Race (First to Complete)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="timeout">Timeout (milliseconds)</Label>
        <Input
          id="timeout"
          type="number"
          value={config?.parallelConfig?.timeout || 30000}
          onChange={(e) => handleConfigUpdate({
            parallelConfig: { ...config?.parallelConfig, timeout: parseInt(e.target.value) || 30000 }
          })}
          min="1000"
          max="300000"
        />
      </div>

      <div>
        <Label>Parallel Branches</Label>
        <div className="space-y-2">
          {(config?.parallelConfig?.branches || []).map((branch: any, index: number) => (
            <div key={index} className="p-3 border rounded space-y-2">
              <div className="flex gap-2">
                <Input
                  value={branch.id || ''}
                  onChange={(e) => {
                    const newBranches = [...(config?.parallelConfig?.branches || [])];
                    newBranches[index] = { ...branch, id: e.target.value };
                    handleConfigUpdate({
                      parallelConfig: { ...config?.parallelConfig, branches: newBranches }
                    });
                  }}
                  placeholder="Branch ID"
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newBranches = (config?.parallelConfig?.branches || []).filter((_: any, i: number) => i !== index);
                    handleConfigUpdate({
                      parallelConfig: { ...config?.parallelConfig, branches: newBranches }
                    });
                  }}
                >
                  Remove
                </Button>
              </div>
              <Textarea
                value={(branch.actions || []).join('\n')}
                onChange={(e) => {
                  const newBranches = [...(config?.parallelConfig?.branches || [])];
                  newBranches[index] = { 
                    ...branch, 
                    actions: e.target.value.split('\n').filter(line => line.trim())
                  };
                  handleConfigUpdate({
                    parallelConfig: { ...config?.parallelConfig, branches: newBranches }
                  });
                }}
                placeholder="branch_actions"
                rows={2}
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newBranches = [...(config?.parallelConfig?.branches || []), { 
                id: `branch_${Date.now()}`, 
                actions: [] 
              }];
              handleConfigUpdate({
                parallelConfig: { ...config?.parallelConfig, branches: newBranches }
              });
            }}
          >
            Add Branch
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        'relative bg-white border-2 rounded-lg shadow-lg min-w-[300px] max-w-[400px]',
        getNodeColor(),
        isSelected && 'ring-2 ring-blue-500',
        isExecuting && 'animate-pulse',
        className
      )}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          {getNodeIcon()}
          <span className="font-medium">{node.data.label || 'Logic Node'}</span>
          <Badge variant="outline" className="text-xs">
            {logicType}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <div className={cn('w-2 h-2 rounded-full', getExecutionColor())} />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="h-6 w-6 p-0"
          >
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Node Content */}
      <div className="p-3">
        <div className="text-sm text-gray-600 mb-2">
          {logicType === 'if-else' && 'Conditional branching logic'}
          {logicType === 'loop' && 'Iterative execution control'}
          {logicType === 'switch' && 'Multi-case decision logic'}
          {logicType === 'delay' && 'Timing control'}
          {logicType === 'exception' && 'Error handling logic'}
          {logicType === 'parallel' && 'Concurrent execution'}
        </div>

        {/* Input/Output Ports */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <div
              className="w-3 h-3 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600"
              onClick={() => onConnect(node.id, 'input')}
              title="Input"
            />
          </div>
          <div className="flex gap-2">
            <div
              className="w-3 h-3 bg-green-500 rounded-full cursor-pointer hover:bg-green-600"
              onClick={() => onConnect(node.id, 'output')}
              title="Output"
            />
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      {isConfigOpen && (
        <div className="border-t p-4 bg-gray-50">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="condition">Condition</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>
            
            <TabsContent value="condition" className="mt-4">
              {renderConditionBuilder()}
            </TabsContent>
            
            <TabsContent value="config" className="mt-4">
              {logicType === 'if-else' && renderConditionBuilder()}
              {logicType === 'loop' && renderLoopConfig()}
              {logicType === 'switch' && renderSwitchConfig()}
              {logicType === 'delay' && renderDelayConfig()}
              {logicType === 'exception' && renderExceptionConfig()}
              {logicType === 'parallel' && renderParallelConfig()}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Execution Controls */}
      {isExecuting && (
        <div className="border-t p-2 bg-gray-100 flex justify-center gap-1">
          <Button size="sm" variant="outline" className="h-6 px-2">
            <Pause className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-6 px-2">
            <Square className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-6 px-2">
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
