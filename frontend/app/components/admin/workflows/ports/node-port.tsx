'use client';

import React from 'react';
import { Handle, Position, HandleType } from 'reactflow';
import { Port } from '@/types/workflows/visual-builder';
import { Badge } from '@/components/ui/badge';

interface NodePortProps {
  port: Port;
  position: Position;
  type: HandleType;
  isConnectable?: boolean;
  isConnected?: boolean;
  className?: string;
}

export function NodePort({ 
  port, 
  position, 
  type, 
  isConnectable = true, 
  isConnected = false,
  className = '' 
}: NodePortProps) {
  const getPortColor = () => {
    if (!isConnectable) return 'bg-gray-300';
    if (isConnected) return 'bg-green-500';
    
    switch (port.dataType) {
      case 'string':
        return 'bg-blue-500';
      case 'number':
        return 'bg-green-500';
      case 'boolean':
        return 'bg-yellow-500';
      case 'object':
        return 'bg-purple-500';
      case 'array':
        return 'bg-pink-500';
      case 'any':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPortSize = () => {
    switch (port.required) {
      case true:
        return 'w-4 h-4';
      case false:
        return 'w-3 h-3';
      default:
        return 'w-3 h-3';
    }
  };

  return (
    <div className={`node-port ${className}`}>
      <Handle
        id={port.id}
        type={type}
        position={position}
        style={{
          background: getPortColor(),
          border: isConnected ? '2px solid #10b981' : '2px solid white',
          width: port.required ? '16px' : '12px',
          height: port.required ? '16px' : '12px',
        }}
        className={`${getPortSize()} rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform`}
        isConnectable={isConnectable}
      />
      <div className="port-label absolute text-xs font-medium text-gray-700 whitespace-nowrap">
        {port.label}
        {port.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
        {port.dataType && (
          <Badge variant="outline" className="ml-1 text-xs">
            {port.dataType}
          </Badge>
        )}
      </div>
    </div>
  );
}
