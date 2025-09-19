'use client';

import React, { useState, useMemo } from 'react';
import { Connection } from 'reactflow';
import { WorkflowEdge } from '@/types/workflows/visual-builder';
import { cn } from '@/lib/utils';

interface WorkflowConnectionEditorProps {
  sourceNodeId: string;
  targetNodeId: string;
  onClose: () => void;
  onConnect: (connection: Connection) => void;
  className?: string;
}

interface ConnectionType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  animated: boolean;
  style?: React.CSSProperties;
}

const CONNECTION_TYPES: ConnectionType[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard connection between nodes',
    icon: '→',
    color: 'bg-gray-500',
    animated: false,
  },
  {
    id: 'smoothstep',
    name: 'Smooth Step',
    description: 'Smooth curved connection with rounded corners',
    icon: '⌢',
    color: 'bg-blue-500',
    animated: false,
  },
  {
    id: 'straight',
    name: 'Straight',
    description: 'Direct straight line connection',
    icon: '│',
    color: 'bg-green-500',
    animated: false,
  },
  {
    id: 'step',
    name: 'Step',
    description: 'Step-like connection with right angles',
    icon: '└',
    color: 'bg-purple-500',
    animated: false,
  },
  {
    id: 'bezier',
    name: 'Bezier',
    description: 'Smooth bezier curve connection',
    icon: '⌣',
    color: 'bg-orange-500',
    animated: false,
  },
];

export const WorkflowConnectionEditor: React.FC<WorkflowConnectionEditorProps> = ({
  sourceNodeId,
  targetNodeId,
  onClose,
  onConnect,
  className,
}) => {
  const [selectedType, setSelectedType] = useState<string>('smoothstep');
  const [label, setLabel] = useState('');
  const [isAnimated, setIsAnimated] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [labelPosition, setLabelPosition] = useState<'top' | 'center' | 'bottom'>('center');

  const handleConnect = () => {
    const connection: Connection = {
      source: sourceNodeId,
      target: targetNodeId,
      type: selectedType as any,
      animated: isAnimated,
      label: showLabel ? label : undefined,
      labelStyle: showLabel ? {
        fontSize: 12,
        fontWeight: 500,
        fill: '#374151',
      } : undefined,
      labelBgStyle: showLabel ? {
        fill: '#f9fafb',
        fillOpacity: 0.8,
        stroke: '#d1d5db',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      } : undefined,
    };

    onConnect(connection);
  };

  const selectedConnectionType = useMemo(
    () => CONNECTION_TYPES.find((type) => type.id === selectedType),
    [selectedType]
  );

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center bg-black/50', className)}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Connection</h2>
            <p className="text-gray-600 text-sm">
              Connect {sourceNodeId} to {targetNodeId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Connection Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Connection Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {CONNECTION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    'p-3 border-2 rounded-lg text-left transition-all hover:shadow-md',
                    selectedType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded flex items-center justify-center text-white text-sm', type.color)}>
                      {type.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{type.name}</div>
                      <div className="text-xs text-gray-600">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Animation */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isAnimated}
                onChange={(e) => setIsAnimated(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Animate connection</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Show animated flow along the connection
            </p>
          </div>

          {/* Label */}
          <div>
            <label className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                checked={showLabel}
                onChange={(e) => setShowLabel(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Add label</span>
            </label>
            
            {showLabel && (
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Connection label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Label Position
                  </label>
                  <div className="flex gap-2">
                    {(['top', 'center', 'bottom'] as const).map((position) => (
                      <button
                        key={position}
                        onClick={() => setLabelPosition(position)}
                        className={cn(
                          'px-3 py-1 text-xs rounded-md transition-colors',
                          labelPosition === position
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        )}
                      >
                        {position.charAt(0).toUpperCase() + position.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preview
            </label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded text-white text-xs flex items-center justify-center">
                    A
                  </div>
                  <span className="text-sm text-gray-600">{sourceNodeId}</span>
                </div>
                
                <div className="flex-1 mx-4 relative">
                  <div className="h-0.5 bg-gray-300 relative">
                    <div className={cn(
                      'absolute top-0 left-0 h-full bg-blue-500',
                      isAnimated && 'animate-pulse'
                    )} />
                    {showLabel && label && (
                      <div className={cn(
                        'absolute -top-6 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-white border border-gray-300 rounded text-xs',
                        labelPosition === 'top' && '-top-6',
                        labelPosition === 'center' && '-top-6',
                        labelPosition === 'bottom' && 'top-2'
                      )}>
                        {label}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{targetNodeId}</span>
                  <div className="w-6 h-6 bg-green-500 rounded text-white text-xs flex items-center justify-center">
                    B
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Connection
          </button>
        </div>
      </div>
    </div>
  );
};
