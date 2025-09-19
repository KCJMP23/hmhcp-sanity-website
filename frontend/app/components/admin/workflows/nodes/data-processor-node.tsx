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
import { DataProcessorNodeConfig, WorkflowStatus } from '@/types/workflows/visual-builder';
import { Settings, Play, Pause, Square, AlertCircle, CheckCircle, Database, Filter, BarChart3, Shield } from 'lucide-react';

interface DataProcessorNodeProps extends NodeProps {
  data: {
    label: string;
    description?: string;
    category: 'data-processors';
    config: DataProcessorNodeConfig;
    status: WorkflowStatus;
  };
}

export function DataProcessorNode({ data, selected }: DataProcessorNodeProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<DataProcessorNodeConfig>(data.config);
  const [isEditing, setIsEditing] = useState(false);

  const handleConfigChange = (key: keyof DataProcessorNodeConfig, value: any) => {
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

  const getProcessorIcon = () => {
    switch (config.processorType) {
      case 'transform':
        return <Database className="w-4 h-4 text-blue-500" />;
      case 'filter':
        return <Filter className="w-4 h-4 text-green-500" />;
      case 'aggregate':
        return <BarChart3 className="w-4 h-4 text-purple-500" />;
      case 'validate':
        return <Shield className="w-4 h-4 text-red-500" />;
      default:
        return <Database className="w-4 h-4 text-gray-500" />;
    }
  };

  const getProcessorColor = () => {
    switch (config.processorType) {
      case 'transform':
        return 'bg-blue-100 text-blue-800';
      case 'filter':
        return 'bg-green-100 text-green-800';
      case 'aggregate':
        return 'bg-purple-100 text-purple-800';
      case 'validate':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderConfigFields = () => {
    switch (config.processorType) {
      case 'transform':
        return (
          <div className="space-y-2">
            <Label htmlFor="transformationScript">Transformation Script</Label>
            <Textarea
              id="transformationScript"
              value={config.transformationScript || ''}
              onChange={(e) => handleConfigChange('transformationScript', e.target.value)}
              placeholder="Enter JavaScript transformation function..."
              disabled={!isEditing}
              className="min-h-[100px] font-mono text-xs"
            />
            <Label htmlFor="schema">Output Schema (JSON)</Label>
            <Textarea
              id="schema"
              value={config.schema ? JSON.stringify(config.schema, null, 2) : ''}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleConfigChange('schema', parsed);
                } catch {
                  // Invalid JSON, keep the text for editing
                }
              }}
              placeholder='{"type": "object", "properties": {...}}'
              disabled={!isEditing}
              className="min-h-[80px] font-mono text-xs"
            />
          </div>
        );

      case 'filter':
        return (
          <div className="space-y-2">
            <Label htmlFor="transformationScript">Filter Expression</Label>
            <Textarea
              id="transformationScript"
              value={config.transformationScript || ''}
              onChange={(e) => handleConfigChange('transformationScript', e.target.value)}
              placeholder="Enter filter expression (e.g., data.age > 18 && data.status === 'active')"
              disabled={!isEditing}
              className="min-h-[60px] font-mono text-xs"
            />
            <Label htmlFor="schema">Input Schema (JSON)</Label>
            <Textarea
              id="schema"
              value={config.schema ? JSON.stringify(config.schema, null, 2) : ''}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleConfigChange('schema', parsed);
                } catch {
                  // Invalid JSON, keep the text for editing
                }
              }}
              placeholder='{"type": "object", "properties": {...}}'
              disabled={!isEditing}
              className="min-h-[80px] font-mono text-xs"
            />
          </div>
        );

      case 'aggregate':
        return (
          <div className="space-y-2">
            <Label htmlFor="transformationScript">Aggregation Function</Label>
            <Textarea
              id="transformationScript"
              value={config.transformationScript || ''}
              onChange={(e) => handleConfigChange('transformationScript', e.target.value)}
              placeholder="Enter aggregation function (e.g., data.reduce((sum, item) => sum + item.value, 0))"
              disabled={!isEditing}
              className="min-h-[80px] font-mono text-xs"
            />
            <Label htmlFor="schema">Group By Fields</Label>
            <Input
              id="schema"
              value={config.schema ? JSON.stringify(config.schema) : ''}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleConfigChange('schema', parsed);
                } catch {
                  // Invalid JSON, keep the text for editing
                }
              }}
              placeholder='["field1", "field2"]'
              disabled={!isEditing}
              className="font-mono text-xs"
            />
          </div>
        );

      case 'validate':
        return (
          <div className="space-y-2">
            <Label htmlFor="validationRules">Validation Rules (JSON)</Label>
            <Textarea
              id="validationRules"
              value={config.validationRules ? JSON.stringify(config.validationRules, null, 2) : ''}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleConfigChange('validationRules', parsed);
                } catch {
                  // Invalid JSON, keep the text for editing
                }
              }}
              placeholder='{"required": ["field1"], "type": "object", "properties": {...}}'
              disabled={!isEditing}
              className="min-h-[100px] font-mono text-xs"
            />
            <Label htmlFor="schema">Data Schema (JSON)</Label>
            <Textarea
              id="schema"
              value={config.schema ? JSON.stringify(config.schema, null, 2) : ''}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleConfigChange('schema', parsed);
                } catch {
                  // Invalid JSON, keep the text for editing
                }
              }}
              placeholder='{"type": "object", "properties": {...}}'
              disabled={!isEditing}
              className="min-h-[80px] font-mono text-xs"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`data-processor-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <Card className={`w-80 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getStatusIcon()}
              {getProcessorIcon()}
              {data.label}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Badge className={`text-xs ${getProcessorColor()}`}>
                {config.processorType}
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
              <Label htmlFor="processor-type">Processor Type</Label>
              <Select
                value={config.processorType}
                onValueChange={(value) => handleConfigChange('processorType', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select processor type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transform">Transform</SelectItem>
                  <SelectItem value="filter">Filter</SelectItem>
                  <SelectItem value="aggregate">Aggregate</SelectItem>
                  <SelectItem value="validate">Validate</SelectItem>
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
            <div>Type: {config.processorType}</div>
            {config.transformationScript && (
              <div className="truncate" title={config.transformationScript}>
                Script: {config.transformationScript.substring(0, 30)}...
              </div>
            )}
            {config.schema && (
              <div className="truncate" title={JSON.stringify(config.schema)}>
                Schema: {JSON.stringify(config.schema).substring(0, 30)}...
              </div>
            )}
            {config.validationRules && (
              <div className="truncate" title={JSON.stringify(config.validationRules)}>
                Rules: {JSON.stringify(config.validationRules).substring(0, 30)}...
              </div>
            )}
          </div>
        </div>
      </Card>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
