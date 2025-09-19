'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowStatus } from '@/types/workflows/visual-builder';
import { Square, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface EndNodeProps extends NodeProps {
  data: {
    label: string;
    description?: string;
    category: 'end';
    config: {};
    status: WorkflowStatus;
  };
}

export function EndNode({ data, selected }: EndNodeProps) {
  const getStatusIcon = () => {
    switch (data.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Square className="w-4 h-4 text-blue-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getBadgeColor = () => {
    switch (data.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`end-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <Card className={`w-48 ${selected ? 'ring-2 ring-blue-500' : ''} ${getStatusColor()}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getStatusIcon()}
              {data.label}
            </CardTitle>
            <Badge className={`text-xs ${getBadgeColor()}`}>
              {data.status.toUpperCase()}
            </Badge>
          </div>
          {data.description && (
            <p className="text-xs text-gray-600">{data.description}</p>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="text-xs text-gray-500">
            <div>Workflow Exit Point</div>
            <div>Status: {data.status}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
