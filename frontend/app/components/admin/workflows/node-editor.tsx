'use client';

import React, { useState, useEffect } from 'react';
import { WorkflowNode } from '@/types/workflows/visual-builder';

interface NodeEditorProps {
  node: WorkflowNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: WorkflowNode) => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ node, isOpen, onClose, onSave }) => {
  const [editedNode, setEditedNode] = useState<WorkflowNode | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (node) {
      setEditedNode(node);
      setFormData(node.data.parameters || {});
    }
  }, [node]);

  if (!isOpen || !editedNode) {
    return null;
  }

  const handleSave = () => {
    if (editedNode) {
      const updatedNode = {
        ...editedNode,
        data: {
          ...editedNode.data,
          parameters: formData
        }
      };
      onSave(updatedNode);
      onClose();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderFormField = (field: string, config: any) => {
    const value = formData[field] || '';

    switch (config.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={config.placeholder || `Enter ${field}`}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field, parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={config.placeholder || `Enter ${field}`}
          />
        );
      
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleInputChange(field, e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select {field}</option>
            {config.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      case 'array':
        return (
          <div className="space-y-2">
            {Array.isArray(value) ? value.map((item: any, index: number) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newArray = [...value];
                    newArray[index] = e.target.value;
                    handleInputChange(field, newArray);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newArray = value.filter((_: any, i: number) => i !== index);
                    handleInputChange(field, newArray);
                  }}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            )) : null}
            <button
              type="button"
              onClick={() => {
                const newArray = Array.isArray(value) ? [...value, ''] : [''];
                handleInputChange(field, newArray);
              }}
              className="px-3 py-2 text-blue-600 hover:text-blue-800"
            >
              Add Item
            </button>
          </div>
        );
      
      case 'object':
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleInputChange(field, parsed);
              } catch {
                handleInputChange(field, e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Enter JSON object"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  // Get node configuration schema based on node type
  const getNodeConfigSchema = (nodeType: string) => {
    const schemas: Record<string, Record<string, any>> = {
      'schedule-trigger': {
        schedule: { type: 'string', placeholder: '0 9 * * *' },
        timezone: { type: 'string', placeholder: 'UTC' }
      },
      'webhook-trigger': {
        method: { type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'] },
        path: { type: 'string', placeholder: '/webhook' }
      },
      'research-agent': {
        topic: { type: 'string', placeholder: 'Healthcare research topic' },
        sources: { type: 'array' }
      },
      'content-agent': {
        contentType: { type: 'select', options: ['blog', 'article', 'report'] },
        style: { type: 'string', placeholder: 'Professional' }
      },
      'condition': {
        condition: { type: 'string', placeholder: 'status equals "active"' },
        operator: { type: 'select', options: ['equals', 'contains', 'greater_than', 'less_than'] }
      },
      'database-action': {
        operation: { type: 'select', options: ['INSERT', 'UPDATE', 'DELETE', 'SELECT'] },
        table: { type: 'string', placeholder: 'table_name' }
      }
    };

    return schemas[nodeType] || {};
  };

  const configSchema = getNodeConfigSchema(editedNode.type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Configure {editedNode.data.label || editedNode.type}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label
            </label>
            <input
              type="text"
              value={editedNode.data.label || ''}
              onChange={(e) => setEditedNode(prev => prev ? {
                ...prev,
                data: { ...prev.data, label: e.target.value }
              } : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Node label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={editedNode.data.description || ''}
              onChange={(e) => setEditedNode(prev => prev ? {
                ...prev,
                data: { ...prev.data, description: e.target.value }
              } : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Node description"
            />
          </div>

          {/* Dynamic Configuration Fields */}
          {Object.entries(configSchema).map(([field, config]) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                {config.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderFormField(field, config)}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
