'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitBranch, 
  GitCommit, 
  GitCompare, 
  Plus, 
  Minus, 
  Edit, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  RotateCcw,
  Filter,
  Search
} from 'lucide-react';
import { WorkflowDiff, WorkflowChange, ConflictInfo } from '@/lib/workflows/version-control';

interface DiffVisualizerProps {
  diff: WorkflowDiff | null;
  onResolveConflict: (conflictId: string, resolution: 'versionA' | 'versionB' | 'custom', customValue?: any) => void;
  onExportDiff: () => void;
  onApplyChanges: () => void;
  onRevertChanges: () => void;
}

export function DiffVisualizer({
  diff,
  onResolveConflict,
  onExportDiff,
  onApplyChanges,
  onRevertChanges
}: DiffVisualizerProps) {
  const [filter, setFilter] = useState<'all' | 'added' | 'removed' | 'modified' | 'conflicts'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());
  const [conflictResolutions, setConflictResolutions] = useState<Map<string, string>>(new Map());

  const filteredChanges = diff?.changes.filter(change => {
    const matchesFilter = filter === 'all' || 
      (filter === 'added' && change.type.includes('added')) ||
      (filter === 'removed' && change.type.includes('removed')) ||
      (filter === 'modified' && change.type.includes('modified')) ||
      (filter === 'conflicts' && diff.conflicts.some(c => 
        (c.nodeId && c.nodeId === change.nodeId) || 
        (c.edgeId && c.edgeId === change.edgeId)
      ));
    
    const matchesSearch = searchTerm === '' || 
      change.nodeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.edgeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }) || [];

  const getChangeIcon = (change: WorkflowChange) => {
    switch (change.type) {
      case 'node_added':
      case 'edge_added':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'node_removed':
      case 'edge_removed':
        return <Minus className="h-4 w-4 text-red-500" />;
      case 'node_modified':
      case 'edge_modified':
      case 'property_changed':
        return <Edit className="h-4 w-4 text-blue-500" />;
      default:
        return <Edit className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeColor = (change: WorkflowChange) => {
    switch (change.type) {
      case 'node_added':
      case 'edge_added':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'node_removed':
      case 'edge_removed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'node_modified':
      case 'edge_modified':
      case 'property_changed':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const toggleChangeExpansion = (changeId: string) => {
    const newExpanded = new Set(expandedChanges);
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId);
    } else {
      newExpanded.add(changeId);
    }
    setExpandedChanges(newExpanded);
  };

  const handleConflictResolution = (conflictId: string, resolution: string) => {
    setConflictResolutions(prev => new Map(prev.set(conflictId, resolution)));
    onResolveConflict(conflictId, resolution as any);
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConflictsForChange = (change: WorkflowChange): ConflictInfo[] => {
    if (!diff) return [];
    return diff.conflicts.filter(conflict => 
      (conflict.nodeId && conflict.nodeId === change.nodeId) ||
      (conflict.edgeId && conflict.edgeId === change.edgeId)
    );
  };

  const hasUnresolvedConflicts = () => {
    if (!diff) return false;
    return diff.conflicts.some(conflict => !conflict.resolution);
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Workflow Diff</CardTitle>
            <div className="flex items-center gap-2">
              {diff && (
                <>
                  <Badge variant="outline" className="text-xs">
                    {diff.changes.length} changes
                  </Badge>
                  {diff.conflicts.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {diff.conflicts.length} conflicts
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Controls */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={onApplyChanges}
                  disabled={!diff || hasUnresolvedConflicts()}
                  variant="default"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Apply Changes
                </Button>
                <Button
                  size="sm"
                  onClick={onRevertChanges}
                  disabled={!diff}
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Revert
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onExportDiff}
                  disabled={!diff}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">All Changes</option>
                  <option value="added">Added</option>
                  <option value="removed">Removed</option>
                  <option value="modified">Modified</option>
                  <option value="conflicts">Conflicts</option>
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search changes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-1 border rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Changes List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {filteredChanges.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {diff ? 'No changes match the current filter' : 'No diff available'}
                </div>
              ) : (
                filteredChanges.map((change) => {
                  const conflicts = getConflictsForChange(change);
                  const hasConflicts = conflicts.length > 0;
                  
                  return (
                    <div
                      key={change.id}
                      className={`p-4 border rounded-lg ${getChangeColor(change)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getChangeIcon(change)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {change.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {change.nodeId && (
                              <Badge variant="secondary" className="text-xs">
                                Node: {change.nodeId}
                              </Badge>
                            )}
                            {change.edgeId && (
                              <Badge variant="secondary" className="text-xs">
                                Edge: {change.edgeId}
                              </Badge>
                            )}
                            {hasConflicts && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Conflicts
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm mb-2">
                            <strong>Author:</strong> {change.author} • 
                            <strong> Time:</strong> {formatTimestamp(change.timestamp)}
                          </div>

                          {change.description && (
                            <div className="text-sm mb-2">
                              <strong>Description:</strong> {change.description}
                            </div>
                          )}

                          {/* Conflicts */}
                          {hasConflicts && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                              <div className="text-sm font-semibold text-red-800 mb-2">
                                Conflicts Detected:
                              </div>
                              {conflicts.map((conflict) => (
                                <div key={conflict.id} className="mb-3">
                                  <div className="text-sm text-red-700 mb-2">
                                    {conflict.type === 'node' ? 'Node' : 'Edge'} conflict: {conflict.nodeId || conflict.edgeId}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div className="p-2 bg-white border rounded">
                                      <div className="text-xs font-semibold text-gray-600 mb-1">Version A</div>
                                      <div className="text-xs font-mono">
                                        {formatValue(conflict.versionAValue)}
                                      </div>
                                    </div>
                                    <div className="p-2 bg-white border rounded">
                                      <div className="text-xs font-semibold text-gray-600 mb-1">Version B</div>
                                      <div className="text-xs font-mono">
                                        {formatValue(conflict.versionBValue)}
                                      </div>
                                    </div>
                                  </div>

                                  {!conflict.resolution && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleConflictResolution(conflict.id, 'versionA')}
                                      >
                                        Use Version A
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleConflictResolution(conflict.id, 'versionB')}
                                      >
                                        Use Version B
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleConflictResolution(conflict.id, 'custom')}
                                      >
                                        Custom
                                      </Button>
                                    </div>
                                  )}

                                  {conflict.resolution && (
                                    <div className="text-sm text-green-700">
                                      <CheckCircle className="h-4 w-4 inline mr-1" />
                                      Resolved: {conflict.resolution}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Change Details */}
                          <div className="mt-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleChangeExpansion(change.id)}
                            >
                              {expandedChanges.has(change.id) ? 'Hide' : 'Show'} Details
                            </Button>
                            
                            {expandedChanges.has(change.id) && (
                              <div className="mt-2 space-y-2">
                                {change.oldValue && (
                                  <div>
                                    <div className="text-sm font-semibold text-gray-600 mb-1">Old Value:</div>
                                    <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                                      {formatValue(change.oldValue)}
                                    </div>
                                  </div>
                                )}
                                
                                {change.newValue && (
                                  <div>
                                    <div className="text-sm font-semibold text-gray-600 mb-1">New Value:</div>
                                    <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                                      {formatValue(change.newValue)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
