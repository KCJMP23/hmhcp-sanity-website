'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Copy, 
  Download,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Variable {
  name: string;
  value: any;
  type: string;
  lastUpdated: Date;
  scope: 'global' | 'local' | 'parameter';
  isModified: boolean;
  isWatched: boolean;
}

interface VariableInspectorProps {
  variables: Map<string, any>;
  watchedVariables: Set<string>;
  onVariableChange: (name: string, value: any) => void;
  onAddWatch: (name: string) => void;
  onRemoveWatch: (name: string) => void;
  onExportVariables: () => void;
  onRefresh: () => void;
}

export function VariableInspector({
  variables,
  watchedVariables,
  onVariableChange,
  onAddWatch,
  onRemoveWatch,
  onExportVariables,
  onRefresh
}: VariableInspectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'watched' | 'modified' | 'recent'>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['global', 'local', 'parameters']));
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const variableList: Variable[] = Array.from(variables.entries()).map(([name, value]) => ({
    name,
    value,
    type: typeof value,
    lastUpdated: new Date(), // In real implementation, this would come from the debug session
    scope: name.startsWith('$') ? 'global' : name.includes('.') ? 'local' : 'parameter',
    isModified: false, // In real implementation, this would track modifications
    isWatched: watchedVariables.has(name)
  }));

  const filteredVariables = variableList.filter(variable => {
    const matchesSearch = searchTerm === '' || 
      variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variable.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'watched' && variable.isWatched) ||
      (filter === 'modified' && variable.isModified) ||
      (filter === 'recent' && (Date.now() - variable.lastUpdated.getTime()) < 60000); // Last minute
    
    return matchesSearch && matchesFilter;
  });

  const groupedVariables = filteredVariables.reduce((groups, variable) => {
    if (!groups[variable.scope]) {
      groups[variable.scope] = [];
    }
    groups[variable.scope].push(variable);
    return groups;
  }, {} as Record<string, Variable[]>);

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string':
        return 'text-green-600 bg-green-50';
      case 'number':
        return 'text-blue-600 bg-blue-50';
      case 'boolean':
        return 'text-purple-600 bg-purple-50';
      case 'object':
        return 'text-orange-600 bg-orange-50';
      case 'function':
        return 'text-pink-600 bg-pink-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'global':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'local':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'parameter':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const startEditing = (variable: Variable) => {
    setEditingVariable(variable.name);
    setEditValue(formatValue(variable.value));
  };

  const saveEdit = () => {
    if (editingVariable && editValue !== '') {
      try {
        // Try to parse the value based on its type
        let parsedValue = editValue;
        if (editValue === 'null') parsedValue = null;
        else if (editValue === 'undefined') parsedValue = undefined;
        else if (editValue === 'true') parsedValue = true;
        else if (editValue === 'false') parsedValue = false;
        else if (!isNaN(Number(editValue)) && editValue !== '') parsedValue = Number(editValue);
        else if (editValue.startsWith('"') && editValue.endsWith('"')) parsedValue = editValue.slice(1, -1);
        else if (editValue.startsWith('{') || editValue.startsWith('[')) parsedValue = JSON.parse(editValue);
        
        onVariableChange(editingVariable, parsedValue);
        setEditingVariable(null);
        setEditValue('');
      } catch (error) {
        console.error('Error parsing value:', error);
        // Keep editing mode open for user to fix
      }
    }
  };

  const cancelEdit = () => {
    setEditingVariable(null);
    setEditValue('');
  };

  const copyToClipboard = (value: any) => {
    navigator.clipboard.writeText(formatValue(value));
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Variable Inspector</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {variableList.length} variables
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Controls */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search variables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">All Variables</option>
                  <option value="watched">Watched</option>
                  <option value="modified">Modified</option>
                  <option value="recent">Recent</option>
                </select>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onExportVariables}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>

          {/* Variables List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {Object.keys(groupedVariables).length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No variables match the current filter
                </div>
              ) : (
                Object.entries(groupedVariables).map(([scope, variables]) => (
                  <div key={scope} className="space-y-2">
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      onClick={() => toggleSection(scope)}
                    >
                      {expandedSections.has(scope) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {getScopeIcon(scope)}
                      <span className="font-semibold capitalize">{scope} Variables</span>
                      <Badge variant="outline" className="text-xs">
                        {variables.length}
                      </Badge>
                    </div>

                    {expandedSections.has(scope) && (
                      <div className="ml-6 space-y-2">
                        {variables.map((variable) => (
                          <div
                            key={variable.name}
                            className="p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-blue-600">
                                  {variable.name}
                                </span>
                                <Badge className={`text-xs ${getTypeColor(variable.type)}`}>
                                  {variable.type}
                                </Badge>
                                {variable.isWatched && (
                                  <Badge variant="outline" className="text-xs">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Watched
                                  </Badge>
                                )}
                                {variable.isModified && (
                                  <Badge variant="outline" className="text-xs text-orange-600">
                                    Modified
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(variable.value)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditing(variable)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => 
                                    variable.isWatched 
                                      ? onRemoveWatch(variable.name)
                                      : onAddWatch(variable.name)
                                  }
                                >
                                  {variable.isWatched ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {editingVariable === variable.name ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full p-2 border rounded text-sm font-mono"
                                  rows={3}
                                />
                                <div className="flex items-center gap-2">
                                  <Button size="sm" onClick={saveEdit}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="text-sm font-mono bg-gray-100 p-2 rounded break-words">
                                  {formatValue(variable.value)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Updated: {formatTimestamp(variable.lastUpdated)}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
