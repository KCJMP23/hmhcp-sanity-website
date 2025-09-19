'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitBranch, 
  GitMerge, 
  Plus, 
  Trash2, 
  Eye, 
  Download,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  User
} from 'lucide-react';
import { WorkflowBranch, WorkflowVersion } from '@/lib/workflows/version-control';

interface BranchManagerProps {
  branches: WorkflowBranch[];
  versions: WorkflowVersion[];
  activeBranchId?: string;
  onCreateBranch: (name: string, baseVersionId: string, description?: string) => void;
  onDeleteBranch: (branchId: string) => void;
  onMergeBranch: (sourceBranchId: string, targetBranchId: string) => void;
  onSwitchBranch: (branchId: string) => void;
  onCompareBranches: (branchAId: string, branchBId: string) => void;
  onExportBranch: (branchId: string) => void;
}

export function BranchManager({
  branches,
  versions,
  activeBranchId,
  onCreateBranch,
  onDeleteBranch,
  onMergeBranch,
  onSwitchBranch,
  onCompareBranches,
  onExportBranch
}: BranchManagerProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchDescription, setNewBranchDescription] = useState('');
  const [selectedBaseVersion, setSelectedBaseVersion] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());

  const filteredBranches = branches.filter(branch => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && branch.isActive) ||
      (filter === 'inactive' && !branch.isActive);
    
    const matchesSearch = searchTerm === '' || 
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getBranchIcon = (branch: WorkflowBranch) => {
    if (branch.id === activeBranchId) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (branch.isActive) {
      return <GitBranch className="h-4 w-4 text-blue-500" />;
    }
    return <GitBranch className="h-4 w-4 text-gray-400" />;
  };

  const getBranchColor = (branch: WorkflowBranch) => {
    if (branch.id === activeBranchId) {
      return 'bg-green-50 border-green-300 ring-2 ring-green-200';
    }
    if (branch.isActive) {
      return 'bg-blue-50 border-blue-200';
    }
    return 'bg-gray-50 border-gray-200';
  };

  const toggleBranchSelection = (branchId: string) => {
    const newSelected = new Set(selectedBranches);
    if (newSelected.has(branchId)) {
      newSelected.delete(branchId);
    } else {
      newSelected.add(branchId);
    }
    setSelectedBranches(newSelected);
  };

  const handleCreateBranch = () => {
    if (newBranchName.trim() && selectedBaseVersion) {
      onCreateBranch(newBranchName.trim(), selectedBaseVersion, newBranchDescription.trim() || undefined);
      setNewBranchName('');
      setNewBranchDescription('');
      setSelectedBaseVersion('');
      setShowCreateForm(false);
    }
  };

  const handleMergeSelected = () => {
    const selectedArray = Array.from(selectedBranches);
    if (selectedArray.length === 2) {
      onMergeBranch(selectedArray[0], selectedArray[1]);
      setSelectedBranches(new Set());
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

  const getBranchVersions = (branch: WorkflowBranch) => {
    return versions.filter(v => v.branch === branch.name);
  };

  const getLatestVersion = (branch: WorkflowBranch) => {
    const branchVersions = getBranchVersions(branch);
    return branchVersions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Branch Manager</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {branches.length} branches
              </Badge>
              <Button
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
                variant="default"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Branch
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Create Branch Form */}
          {showCreateForm && (
            <div className="p-4 border-b bg-gray-50">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">
                      Branch Name
                    </label>
                    <Input
                      placeholder="feature/new-workflow"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">
                      Base Version
                    </label>
                    <select
                      value={selectedBaseVersion}
                      onChange={(e) => setSelectedBaseVersion(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">Select a version...</option>
                      {versions.map(version => (
                        <option key={version.id} value={version.id}>
                          v{version.version} - {version.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">
                    Description (Optional)
                  </label>
                  <Input
                    placeholder="Describe the purpose of this branch..."
                    value={newBranchDescription}
                    onChange={(e) => setNewBranchDescription(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button onClick={handleCreateBranch} disabled={!newBranchName.trim() || !selectedBaseVersion}>
                    Create Branch
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {selectedBranches.size === 2 && (
                  <Button
                    size="sm"
                    onClick={handleMergeSelected}
                    variant="default"
                  >
                    <GitMerge className="h-4 w-4 mr-1" />
                    Merge Selected
                  </Button>
                )}
                {selectedBranches.size > 0 && (
                  <Button
                    size="sm"
                    onClick={() => setSelectedBranches(new Set())}
                    variant="outline"
                  >
                    Clear Selection
                  </Button>
                )}
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
                  <option value="all">All Branches</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search branches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-1 border rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Branches List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {filteredBranches.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {showCreateForm ? 'Create your first branch' : 'No branches match the current filter'}
                </div>
              ) : (
                filteredBranches.map((branch) => {
                  const latestVersion = getLatestVersion(branch);
                  const branchVersions = getBranchVersions(branch);
                  
                  return (
                    <div
                      key={branch.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${getBranchColor(branch)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedBranches.has(branch.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleBranchSelection(branch.id);
                            }}
                            className="rounded"
                          />
                          {getBranchIcon(branch)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {branch.name}
                            </Badge>
                            {branch.id === activeBranchId && (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                            {!branch.isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {branchVersions.length} versions
                            </Badge>
                          </div>
                          
                          {branch.description && (
                            <div className="text-sm text-gray-600 mb-2">
                              {branch.description}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {branch.author}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Created {formatTimestamp(branch.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Last activity {formatTimestamp(branch.lastActivity)}
                            </div>
                          </div>

                          {latestVersion && (
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>Latest:</strong> v{latestVersion.version} - {latestVersion.name}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSwitchBranch(branch.id);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Switch
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompareBranches(activeBranchId || '', branch.id);
                              }}
                            >
                              <GitMerge className="h-4 w-4 mr-1" />
                              Compare
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onExportBranch(branch.id);
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Export
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteBranch(branch.id);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
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
