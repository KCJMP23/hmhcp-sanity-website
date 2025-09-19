'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitCommit, 
  GitBranch, 
  Tag, 
  User, 
  Clock, 
  Eye, 
  RotateCcw, 
  Download,
  Filter,
  Search,
  MoreVertical,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { WorkflowVersion, WorkflowBranch } from '@/lib/workflows/version-control';

interface VersionHistoryProps {
  versions: WorkflowVersion[];
  branches: WorkflowBranch[];
  activeVersionId?: string;
  onSelectVersion: (versionId: string) => void;
  onCompareVersions: (versionAId: string, versionBId: string) => void;
  onRollbackToVersion: (versionId: string) => void;
  onCreateBranch: (baseVersionId: string) => void;
  onExportVersion: (versionId: string) => void;
}

export function VersionHistory({
  versions,
  branches,
  activeVersionId,
  onSelectVersion,
  onCompareVersions,
  onRollbackToVersion,
  onCreateBranch,
  onExportVersion
}: VersionHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'main' | 'branches' | 'tags'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const filteredVersions = versions.filter(version => {
    const matchesFilter = filter === 'all' || 
      (filter === 'main' && version.branch === 'main') ||
      (filter === 'branches' && version.branch !== 'main') ||
      (filter === 'tags' && version.tags.length > 0);
    
    const matchesSearch = searchTerm === '' || 
      version.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      version.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      version.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      version.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
      version.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const getVersionIcon = (version: WorkflowVersion) => {
    if (version.tags.length > 0) {
      return <Tag className="h-4 w-4 text-purple-500" />;
    }
    if (version.branch !== 'main') {
      return <GitBranch className="h-4 w-4 text-blue-500" />;
    }
    return <GitCommit className="h-4 w-4 text-gray-500" />;
  };

  const getVersionColor = (version: WorkflowVersion) => {
    if (version.id === activeVersionId) {
      return 'bg-blue-50 border-blue-300 ring-2 ring-blue-200';
    }
    if (version.tags.length > 0) {
      return 'bg-purple-50 border-purple-200';
    }
    if (version.branch !== 'main') {
      return 'bg-blue-50 border-blue-200';
    }
    return 'bg-gray-50 border-gray-200';
  };

  const toggleVersionSelection = (versionId: string) => {
    const newSelected = new Set(selectedVersions);
    if (newSelected.has(versionId)) {
      newSelected.delete(versionId);
    } else {
      newSelected.add(versionId);
    }
    setSelectedVersions(newSelected);
  };

  const toggleVersionExpansion = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const handleCompareSelected = () => {
    const selectedArray = Array.from(selectedVersions);
    if (selectedArray.length === 2) {
      onCompareVersions(selectedArray[0], selectedArray[1]);
      setSelectedVersions(new Set());
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      return `${(ms / 60000).toFixed(1)}m`;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Version History</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {versions.length} versions
              </Badge>
              <Badge variant="outline" className="text-xs">
                {branches.length} branches
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Controls */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {selectedVersions.size === 2 && (
                  <Button
                    size="sm"
                    onClick={handleCompareSelected}
                    variant="default"
                  >
                    <GitCompare className="h-4 w-4 mr-1" />
                    Compare Selected
                  </Button>
                )}
                {selectedVersions.size > 0 && (
                  <Button
                    size="sm"
                    onClick={() => setSelectedVersions(new Set())}
                    variant="outline"
                  >
                    Clear Selection
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExpandedVersions(new Set(versions.map(v => v.id)))}
                >
                  Expand All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExpandedVersions(new Set())}
                >
                  Collapse All
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
                  <option value="all">All Versions</option>
                  <option value="main">Main Branch</option>
                  <option value="branches">Other Branches</option>
                  <option value="tags">Tagged Versions</option>
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search versions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-1 border rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Versions List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {filteredVersions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No versions match the current filter
                </div>
              ) : (
                filteredVersions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${getVersionColor(version)}`}
                    onClick={() => onSelectVersion(version.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedVersions.has(version.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleVersionSelection(version.id);
                          }}
                          className="rounded"
                        />
                        {getVersionIcon(version)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            v{version.version}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {version.branch}
                          </Badge>
                          {version.id === activeVersionId && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                          {version.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="text-lg font-semibold mb-1">
                          {version.name}
                        </div>
                        
                        {version.description && (
                          <div className="text-sm text-gray-600 mb-2">
                            {version.description}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {version.author}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTimestamp(version.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <GitBranch className="h-4 w-4" />
                            {version.metadata.nodeCount} nodes, {version.metadata.edgeCount} edges
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            Complexity: {version.metadata.complexity}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVersionExpansion(version.id);
                            }}
                          >
                            {expandedVersions.has(version.id) ? 'Hide' : 'Show'} Details
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCompareVersions(activeVersionId || '', version.id);
                            }}
                          >
                            <GitCompare className="h-4 w-4 mr-1" />
                            Compare
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRollbackToVersion(version.id);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Rollback
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateBranch(version.id);
                            }}
                          >
                            <GitBranch className="h-4 w-4 mr-1" />
                            Branch
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExportVersion(version.id);
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                        </div>

                        {expandedVersions.has(version.id) && (
                          <div className="mt-3 p-3 bg-white border rounded">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-semibold text-gray-600 mb-1">Metadata</div>
                                <div className="space-y-1">
                                  <div>Nodes: {version.metadata.nodeCount}</div>
                                  <div>Edges: {version.metadata.edgeCount}</div>
                                  <div>Complexity: {version.metadata.complexity}</div>
                                  <div>Est. Time: {formatDuration(version.metadata.estimatedExecutionTime)}</div>
                                </div>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-600 mb-1">Details</div>
                                <div className="space-y-1">
                                  <div>Created: {version.createdAt.toLocaleString()}</div>
                                  <div>Modified: {version.metadata.lastModified.toLocaleString()}</div>
                                  <div>Checksum: {version.metadata.checksum}</div>
                                  <div>Parent: {version.parentVersionId || 'None'}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
