'use client';

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LogicNodeConfig, WorkflowStatus } from '@/types/workflows/visual-builder';
import { Settings, Play, Pause, Square, AlertCircle, CheckCircle, GitBranch, RotateCcw, Clock, AlertTriangle } from 'lucide-react';

interface LogicNodeProps extends NodeProps {
  data: {
    label: string;
    description?: string;
    category: 'logic';
    config: LogicNodeConfig;
    status: WorkflowStatus;
  };
}

export function LogicNode({ data, selected }: LogicNodeProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<LogicNodeConfig>(data.config);
  const [isEditing, setIsEditing] = useState(false);

  const handleConfigChange = (key: keyof LogicNodeConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    setIsConfigOpen(false);
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Square className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogicIcon = () => {
    switch (config.logicType) {
      case 'if-else':
        return <GitBranch className="w-4 h-4 text-blue-500" />;
      case 'loop':
        return <RotateCcw className="w-4 h-4 text-green-500" />;
      case 'switch':
        return <GitBranch className="w-4 h-4 text-purple-500" />;
      case 'delay':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'exception-handler':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'parallel':
        return <GitBranch className="w-4 h-4 text-indigo-500" />;
      case 'synchronize':
        return <GitBranch className="w-4 h-4 text-teal-500" />;
      default:
        return <GitBranch className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogicColor = () => {
    switch (config.logicType) {
      case 'if-else':
        return 'bg-blue-100 text-blue-800';
      case 'loop':
        return 'bg-green-100 text-green-800';
      case 'switch':
        return 'bg-purple-100 text-purple-800';
      case 'delay':
        return 'bg-orange-100 text-orange-800';
      case 'exception-handler':
        return 'bg-red-100 text-red-800';
      case 'parallel':
        return 'bg-indigo-100 text-indigo-800';
      case 'synchronize':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderConfigFields = () => {
    switch (config.logicType) {
      case 'if-else':
        return (
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Textarea
              id="condition"
              value={config.condition || ''}
              onChange={(e) => handleConfigChange('condition', e.target.value)}
              placeholder="Enter condition (e.g., data.age > 18)"
              disabled={!isEditing}
              className="min-h-[60px]"
            />
          </div>
        );

      case 'loop':
        return (
          <div className="space-y-2">
            <Label htmlFor="iterations">Max Iterations</Label>
            <Input
              id="iterations"
              type="number"
              value={config.iterations || 10}
              onChange={(e) => handleConfigChange('iterations', parseInt(e.target.value))}
              disabled={!isEditing}
              min="1"
              max="1000"
            />
            <Label htmlFor="condition">Loop Condition</Label>
            <Textarea
              id="condition"
              value={config.condition || ''}
              onChange={(e) => handleConfigChange('condition', e.target.value)}
              placeholder="Enter loop condition (e.g., data.items.length > 0)"
              disabled={!isEditing}
              className="min-h-[60px]"
            />
          </div>
        );

      case 'switch':
        return (
          <div className="space-y-2">
            <Label htmlFor="condition">Switch Expression</Label>
            <Input
              id="condition"
              value={config.condition || ''}
              onChange={(e) => handleConfigChange('condition', e.target.value)}
              placeholder="Enter switch expression (e.g., data.status)"
              disabled={!isEditing}
            />
            <Label htmlFor="cases">Cases (JSON)</Label>
            <Textarea
              id="cases"
              value={config.cases ? JSON.stringify(config.cases, null, 2) : ''}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleConfigChange('cases', parsed);
                } catch {
                  // Invalid JSON, keep the text for editing
                }
              }}
              placeholder='{"case1": "value1", "case2": "value2"}'
              disabled={!isEditing}
              className="min-h-[80px] font-mono text-xs"
            />
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-2">
            <Label htmlFor="delayMs">Delay (milliseconds)</Label>
            <Input
              id="delayMs"
              type="number"
              value={config.delayMs || 1000}
              onChange={(e) => handleConfigChange('delayMs', parseInt(e.target.value))}
              disabled={!isEditing}
              min="100"
              max="300000"
            />
          </div>
        );

      case 'exception-handler':
        return (
          <div className="space-y-2">
            <Label htmlFor="condition">Exception Types</Label>
            <Input
              id="condition"
              value={config.condition || ''}
              onChange={(e) => handleConfigChange('condition', e.target.value)}
              placeholder="Enter exception types (e.g., ValidationError, NetworkError)"
              disabled={!isEditing}
            />
          </div>
        );

      case 'parallel':
        return (
          <div className="space-y-2">
            <Label htmlFor="condition">Parallel Branches</Label>
            <Input
              id="condition"
              value={config.condition || ''}
              onChange={(e) => handleConfigChange('condition', e.target.value)}
              placeholder="Number of parallel branches"
              disabled={!isEditing}
              type="number"
              min="2"
              max="10"
            />
          </div>
        );

      case 'synchronize':
        return (
          <div className="space-y-2">
            <Label htmlFor="condition">Sync Points</Label>
            <Input
              id="condition"
              value={config.condition || ''}
              onChange={(e) => handleConfigChange('condition', e.target.value)}
              placeholder="Number of sync points"
              disabled={!isEditing}
              type="number"
              min="2"
              max="10"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`logic-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <Card className={`w-80 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getStatusIcon()}
              {getLogicIcon()}
              {data.label}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Badge className={`text-xs ${getLogicColor()}`}>
                {config.logicType}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="h-6 w-6 p-0"
              >
                <Settings className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {data.description && (
            <p className="text-xs text-gray-600">{data.description}</p>
          )}
        </CardHeader>

        {isConfigOpen && (
          <CardContent className="pt-0 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="logic-type">Logic Type</Label>
              <Select
                value={config.logicType}
                onValueChange={(value) => handleConfigChange('logicType', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select logic type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="if-else">If/Else</SelectItem>
                  <SelectItem value="loop">Loop</SelectItem>
                  <SelectItem value="switch">Switch/Case</SelectItem>
                  <SelectItem value="delay">Delay</SelectItem>
                  <SelectItem value="exception-handler">Exception Handler</SelectItem>
                  <SelectItem value="parallel">Parallel</SelectItem>
                  <SelectItem value="synchronize">Synchronize</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {renderConfigFields()}

            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setConfig(data.config);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
          </CardContent>
        )}

        <div className="px-4 pb-2">
          <div className="text-xs text-gray-500">
            <div>Type: {config.logicType}</div>
            {config.condition && (
              <div className="truncate" title={config.condition}>
                Condition: {config.condition.substring(0, 30)}...
              </div>
            )}
            {config.iterations && <div>Iterations: {config.iterations}</div>}
            {config.delayMs && <div>Delay: {config.delayMs}ms</div>}
          </div>
        </div>
      </Card>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
