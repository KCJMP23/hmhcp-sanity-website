'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowStatus } from '@/types/workflows/visual-builder';
import { Play, CheckCircle } from 'lucide-react';

interface StartNodeProps extends NodeProps {
  data: {
    label: string;
    description?: string;
    category: 'start';
    config: {};
    status: WorkflowStatus;
  };
}

export function StartNode({ data, selected }: StartNodeProps) {
  const getStatusIcon = () => {
    switch (data.status) {
      case 'running':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Play className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={`start-node ${selected ? 'selected' : ''}`}>
      <Card className={`w-48 ${selected ? 'ring-2 ring-blue-500' : ''} bg-green-50 border-green-200`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getStatusIcon()}
              {data.label}
            </CardTitle>
            <Badge className="text-xs bg-green-100 text-green-800">
              START
            </Badge>
          </div>
          {data.description && (
            <p className="text-xs text-gray-600">{data.description}</p>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="text-xs text-gray-500">
            <div>Workflow Entry Point</div>
            <div>Status: {data.status}</div>
          </div>
        </CardContent>
      </Card>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
