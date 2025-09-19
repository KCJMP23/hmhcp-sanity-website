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
import { AgentNodeConfig, WorkflowStatus, HealthcareComplianceLevel } from '@/types/workflows/visual-builder';
import { Settings, Play, Pause, Square, AlertCircle, CheckCircle } from 'lucide-react';

interface AIAgentNodeProps extends NodeProps {
  data: {
    label: string;
    description?: string;
    category: 'ai-agents';
    config: AgentNodeConfig;
    status: WorkflowStatus;
    healthcareCompliance?: {
      level: HealthcareComplianceLevel;
      details?: string;
    };
  };
}

export function AIAgentNode({ data, selected }: AIAgentNodeProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<AgentNodeConfig>(data.config);
  const [isEditing, setIsEditing] = useState(false);

  const handleConfigChange = (key: keyof AgentNodeConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // In a real implementation, this would update the node data
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

  const getComplianceColor = () => {
    switch (data.healthcareCompliance?.level) {
      case 'HIPAA':
        return 'bg-red-100 text-red-800';
      case 'GDPR':
        return 'bg-blue-100 text-blue-800';
      case 'FDA':
        return 'bg-purple-100 text-purple-800';
      case 'SOC2':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`ai-agent-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <Card className={`w-80 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getStatusIcon()}
              {data.label}
            </CardTitle>
            <div className="flex items-center gap-1">
              {data.healthcareCompliance && (
                <Badge className={`text-xs ${getComplianceColor()}`}>
                  {data.healthcareCompliance.level}
                </Badge>
              )}
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
              <Label htmlFor="agent-type">Agent Type</Label>
              <Select
                value={config.agentType}
                onValueChange={(value) => handleConfigChange('agentType', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="research">Research Agent</SelectItem>
                  <SelectItem value="content">Content Agent</SelectItem>
                  <SelectItem value="compliance">Compliance Agent</SelectItem>
                  <SelectItem value="analysis">Analysis Agent</SelectItem>
                  <SelectItem value="translation">Translation Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={config.model || 'gpt-4'}
                onValueChange={(value) => handleConfigChange('model', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3">Claude 3</SelectItem>
                  <SelectItem value="claude-2">Claude 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                value={config.prompt || ''}
                onChange={(e) => handleConfigChange('prompt', e.target.value)}
                placeholder="Enter the prompt for this agent..."
                disabled={!isEditing}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Input
                id="template"
                value={config.template || ''}
                onChange={(e) => handleConfigChange('template', e.target.value)}
                placeholder="Template name (optional)"
                disabled={!isEditing}
              />
            </div>

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
            <div>Type: {config.agentType}</div>
            {config.model && <div>Model: {config.model}</div>}
            {config.prompt && (
              <div className="truncate" title={config.prompt}>
                Prompt: {config.prompt.substring(0, 50)}...
              </div>
            )}
          </div>
        </div>
      </Card>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
