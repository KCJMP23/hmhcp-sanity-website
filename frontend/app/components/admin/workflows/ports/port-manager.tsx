'use client';

import React, { useState, useCallback } from 'react';
import { Handle, Position, Connection, Edge, useReactFlow } from 'reactflow';
import { Port, HandleType } from '@/types/workflows/visual-builder';
import { NodePort } from './node-port';

interface PortManagerProps {
  nodeId: string;
  inputPorts: Port[];
  outputPorts: Port[];
  onPortsChange?: (inputPorts: Port[], outputPorts: Port[]) => void;
  onConnectionCreate?: (connection: Connection) => void;
  onConnectionUpdate?: (edge: Edge) => void;
  onConnectionDelete?: (edgeId: string) => void;
}

export function PortManager({ 
  nodeId, 
  inputPorts, 
  outputPorts, 
  onPortsChange,
  onConnectionCreate,
  onConnectionUpdate,
  onConnectionDelete 
}: PortManagerProps) {
  const { getEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);

  const getConnectedEdges = useCallback((portId: string, type: HandleType) => {
    const edges = getEdges();
    return edges.filter(edge => {
      if (type === 'target') {
        return edge.target === nodeId && edge.targetHandle === portId;
      } else {
        return edge.source === nodeId && edge.sourceHandle === portId;
      }
    });
  }, [nodeId, getEdges]);

  const handlePortAdd = useCallback((type: HandleType) => {
    const newPort: Port = {
      id: `${type}-${Date.now()}`,
      label: `New ${type} port`,
      dataType: 'any',
      required: false,
      description: '',
    };

    if (type === 'target') {
      const newInputPorts = [...inputPorts, newPort];
      onPortsChange?.(newInputPorts, outputPorts);
    } else {
      const newOutputPorts = [...outputPorts, newPort];
      onPortsChange?.(inputPorts, newOutputPorts);
    }
  }, [inputPorts, outputPorts, onPortsChange]);

  const handlePortUpdate = useCallback((portId: string, updates: Partial<Port>, type: HandleType) => {
    const updatePorts = (ports: Port[]) => 
      ports.map(port => port.id === portId ? { ...port, ...updates } : port);

    if (type === 'target') {
      const newInputPorts = updatePorts(inputPorts);
      onPortsChange?.(newInputPorts, outputPorts);
    } else {
      const newOutputPorts = updatePorts(outputPorts);
      onPortsChange?.(inputPorts, newOutputPorts);
    }
  }, [inputPorts, outputPorts, onPortsChange]);

  const handlePortDelete = useCallback((portId: string, type: HandleType) => {
    // Check if port has connections
    const connectedEdges = getConnectedEdges(portId, type);
    if (connectedEdges.length > 0) {
      // Delete connected edges first
      connectedEdges.forEach(edge => {
        onConnectionDelete?.(edge.id);
      });
    }

    const filterPorts = (ports: Port[]) => ports.filter(port => port.id !== portId);

    if (type === 'target') {
      const newInputPorts = filterPorts(inputPorts);
      onPortsChange?.(newInputPorts, outputPorts);
    } else {
      const newOutputPorts = filterPorts(outputPorts);
      onPortsChange?.(inputPorts, newOutputPorts);
    }
  }, [inputPorts, outputPorts, onPortsChange, getConnectedEdges, onConnectionDelete]);

  const validateConnection = useCallback((connection: Connection) => {
    const sourcePort = outputPorts.find(port => port.id === connection.sourceHandle);
    const targetPort = inputPorts.find(port => port.id === connection.targetHandle);

    if (!sourcePort || !targetPort) {
      return { isValid: false, message: 'Port not found' };
    }

    // Check data type compatibility
    if (sourcePort.dataType !== 'any' && targetPort.dataType !== 'any' && 
        sourcePort.dataType !== targetPort.dataType) {
      return { 
        isValid: false, 
        message: `Data type mismatch: ${sourcePort.dataType} -> ${targetPort.dataType}` 
      };
    }

    return { isValid: true };
  }, [inputPorts, outputPorts]);

  const handleConnectionCreate = useCallback((connection: Connection) => {
    const validation = validateConnection(connection);
    if (!validation.isValid) {
      console.warn('Invalid connection:', validation.message);
      return;
    }

    onConnectionCreate?.(connection);
  }, [validateConnection, onConnectionCreate]);

  return (
    <div className="port-manager">
      {/* Input Ports */}
      <div className="input-ports space-y-1">
        {inputPorts.map((port, index) => {
          const connectedEdges = getConnectedEdges(port.id, 'target');
          const isConnected = connectedEdges.length > 0;

          return (
            <div key={port.id} className="relative">
              <NodePort
                port={port}
                position={Position.Top}
                type="target"
                isConnectable={true}
                isConnected={isConnected}
                className="left-0"
              />
              {isEditing && (
                <div className="port-controls absolute -right-8 top-0 flex flex-col gap-1">
                  <button
                    onClick={() => handlePortUpdate(port.id, { 
                      label: prompt('Enter new label:', port.label) || port.label 
                    }, 'target')}
                    className="w-6 h-6 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    title="Edit port"
                  >
                    E
                  </button>
                  <button
                    onClick={() => handlePortDelete(port.id, 'target')}
                    className="w-6 h-6 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    title="Delete port"
                  >
                    D
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {isEditing && (
          <button
            onClick={() => handlePortAdd('target')}
            className="w-full h-6 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            title="Add input port"
          >
            + Input
          </button>
        )}
      </div>

      {/* Output Ports */}
      <div className="output-ports space-y-1">
        {outputPorts.map((port, index) => {
          const connectedEdges = getConnectedEdges(port.id, 'source');
          const isConnected = connectedEdges.length > 0;

          return (
            <div key={port.id} className="relative">
              <NodePort
                port={port}
                position={Position.Bottom}
                type="source"
                isConnectable={true}
                isConnected={isConnected}
                className="right-0"
              />
              {isEditing && (
                <div className="port-controls absolute -left-8 top-0 flex flex-col gap-1">
                  <button
                    onClick={() => handlePortUpdate(port.id, { 
                      label: prompt('Enter new label:', port.label) || port.label 
                    }, 'source')}
                    className="w-6 h-6 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    title="Edit port"
                  >
                    E
                  </button>
                  <button
                    onClick={() => handlePortDelete(port.id, 'source')}
                    className="w-6 h-6 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    title="Delete port"
                  >
                    D
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {isEditing && (
          <button
            onClick={() => handlePortAdd('source')}
            className="w-full h-6 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            title="Add output port"
          >
            + Output
          </button>
        )}
      </div>

      {/* Edit Toggle */}
      <div className="port-manager-controls mt-2">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`w-full h-6 text-xs rounded ${
            isEditing 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-gray-500 text-white hover:bg-gray-600'
          }`}
        >
          {isEditing ? 'Done Editing' : 'Edit Ports'}
        </button>
      </div>
    </div>
  );
}
