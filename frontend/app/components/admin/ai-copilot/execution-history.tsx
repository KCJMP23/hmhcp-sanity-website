'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import {
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Play,
  MoreHorizontal,
  Calendar,
  FileText,
  Image,
  Code,
  Database,
  TrendingUp,
  Activity,
  Zap,
  AlertTriangle,
  Info,
  Bug,
  BarChart3,
  Lightbulb,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerRange } from '@/components/ui/date-picker-range';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import type { 
  WorkflowExecution, 
  ExecutionStatus, 
  LogEntry, 
  Artifact, 
  AgentName 
} from '@/types/ai/workflows';

interface ExecutionHistoryFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  status?: ExecutionStatus[];
  workflowType?: string[];
  agent?: AgentName[];
  searchQuery?: string;
  logLevel?: ('debug' | 'info' | 'warn' | 'error')[];
}

interface ExportFormat {
  type: 'csv' | 'json' | 'markdown' | 'pdf';
  includeArtifacts: boolean;
  includeLogs: boolean;
  includeMetadata: boolean;
  includeTimestamps: boolean;
  logLevels: ('debug' | 'info' | 'warn' | 'error')[];
}

interface LogAnalysis {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  avgExecutionTime: number;
  commonErrors: { message: string; count: number; }[];
  performanceInsights: { type: string; description: string; impact: 'low' | 'medium' | 'high'; }[];
}

const statusConfig: Record<ExecutionStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'bg-gray-100 text-gray-800', label: 'Pending' },
  queued: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Queued' },
  running: { icon: Play, color: 'bg-yellow-100 text-yellow-800', label: 'Running' },
  paused: { icon: Pause, color: 'bg-orange-100 text-orange-800', label: 'Paused' },
  completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Completed' },
  failed: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Failed' },
  cancelled: { icon: AlertCircle, color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
};

const logLevelConfig = {
  debug: { icon: Bug, color: 'text-gray-500', bgColor: 'bg-gray-50' },
  info: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  warn: { icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  error: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50' }
};

const artifactTypeIcons: Record<string, React.ElementType> = {
  document: FileText,
  image: Image,
  code: Code,
  data: Database,
  report: TrendingUp,
  default: FileText
};

export function ExecutionHistory() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [workflows, setWorkflows] = useState<{ id: string; name: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ExecutionHistoryFilters>({});
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>({
    type: 'json',
    includeArtifacts: true,
    includeLogs: true,
    includeMetadata: true,
    includeTimestamps: true,
    logLevels: ['info', 'warn', 'error']
  });
  const [logAnalysis, setLogAnalysis] = useState<LogAnalysis | null>(null);
  const [showLogAnalysis, setShowLogAnalysis] = useState(false);

  // Load executions and workflows
  useEffect(() => {
    loadExecutions();
    loadWorkflows();
  }, []);

  const loadExecutions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/workflows/executions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load executions');
      
      const data = await response.json();
      setExecutions(data.executions || []);
    } catch (error) {
      console.error('Error loading executions:', error);
      // Mock data for development
      setExecutions(generateMockExecutions());
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/ai/workflows', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load workflows');
      
      const data = await response.json();
      setWorkflows(data.workflows?.map((w: any) => ({ id: w.id, name: w.name })) || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
      setWorkflows([
        { id: '1', name: 'Content Generation Pipeline' },
        { id: '2', name: 'Medical Research Analysis' },
        { id: '3', name: 'Compliance Review Workflow' }
      ]);
    }
  };

  // Filter executions based on current filters
  const filteredExecutions = useMemo(() => {
    let filtered = executions;

    // Date range filter
    if (filters.dateRange?.from && filters.dateRange?.to) {
      filtered = filtered.filter(execution => 
        isWithinInterval(execution.startedAt, {
          start: startOfDay(filters.dateRange!.from),
          end: endOfDay(filters.dateRange!.to)
        })
      );
    }

    // Status filter
    if (filters.status?.length) {
      filtered = filtered.filter(execution => 
        filters.status!.includes(execution.status)
      );
    }

    // Workflow type filter
    if (filters.workflowType?.length) {
      filtered = filtered.filter(execution => 
        filters.workflowType!.includes(execution.workflowId)
      );
    }

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(execution => {
        const workflowName = workflows.find(w => w.id === execution.workflowId)?.name?.toLowerCase() || '';
        const errorMessage = execution.errorMessage?.toLowerCase() || '';
        const logMessages = execution.executionLog?.map(log => log.message.toLowerCase()).join(' ') || '';
        const artifactNames = execution.artifacts?.map(artifact => artifact.name.toLowerCase()).join(' ') || '';
        
        return (
          workflowName.includes(query) ||
          errorMessage.includes(query) ||
          logMessages.includes(query) ||
          artifactNames.includes(query)
        );
      });
    }

    // Log level filter
    if (filters.logLevel?.length) {
      filtered = filtered.filter(execution => 
        execution.executionLog?.some(log => 
          filters.logLevel!.includes(log.level)
        )
      );
    }

    return filtered.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }, [executions, filters, workflows]);

  const handleExport = useCallback(async () => {
    try {
      const filteredLogs = exportFormat.includeLogs 
        ? filteredExecutions.map(execution => ({
            ...execution,
            executionLog: execution.executionLog?.filter(log => 
              exportFormat.logLevels.includes(log.level)
            )
          }))
        : filteredExecutions;

      const dataToExport = filteredLogs.map(execution => ({
        id: execution.id,
        workflowId: execution.workflowId,
        workflowName: workflows.find(w => w.id === execution.workflowId)?.name || 'Unknown',
        status: execution.status,
        ...(exportFormat.includeTimestamps && {
          startedAt: execution.startedAt,
          completedAt: execution.completedAt
        }),
        duration: execution.executionTimeMs,
        cost: execution.costUsd,
        tokensUsed: execution.tokensUsed,
        errorMessage: execution.errorMessage,
        ...(exportFormat.includeLogs && { logs: execution.executionLog }),
        ...(exportFormat.includeArtifacts && { artifacts: execution.artifacts }),
        ...(exportFormat.includeMetadata && { metadata: execution.metadata })
      }));

      if (exportFormat.type === 'json') {
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
          type: 'application/json'
        });
        downloadFile(blob, `workflow-executions-${new Date().toISOString().split('T')[0]}.json`);
      } else if (exportFormat.type === 'csv') {
        const csv = convertToCSV(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv' });
        downloadFile(blob, `workflow-executions-${new Date().toISOString().split('T')[0]}.csv`);
      } else if (exportFormat.type === 'markdown') {
        const markdown = convertToMarkdown(dataToExport);
        const blob = new Blob([markdown], { type: 'text/markdown' });
        downloadFile(blob, `workflow-executions-${new Date().toISOString().split('T')[0]}.md`);
      }

      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [filteredExecutions, workflows, exportFormat]);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[]): string => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).filter(key => 
      key !== 'logs' && key !== 'artifacts' && key !== 'metadata'
    );
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const convertToMarkdown = (data: any[]): string => {
    if (!data.length) return '# Workflow Execution Report\n\nNo executions found.';

    let markdown = `# Workflow Execution Report\n`;
    markdown += `Generated on ${new Date().toISOString()}\n\n`;
    markdown += `## Summary\n`;
    markdown += `- Total Executions: ${data.length}\n`;
    markdown += `- Successful: ${data.filter(d => d.status === 'completed').length}\n`;
    markdown += `- Failed: ${data.filter(d => d.status === 'failed').length}\n`;
    markdown += `- Total Cost: $${data.reduce((sum, d) => sum + (d.cost || 0), 0).toFixed(4)}\n\n`;

    markdown += `## Execution Details\n\n`;
    
    data.forEach((execution, index) => {
      markdown += `### ${index + 1}. ${execution.workflowName}\n`;
      markdown += `- **ID**: ${execution.id}\n`;
      markdown += `- **Status**: ${execution.status}\n`;
      if (exportFormat.includeTimestamps) {
        markdown += `- **Started**: ${execution.startedAt}\n`;
        if (execution.completedAt) {
          markdown += `- **Completed**: ${execution.completedAt}\n`;
        }
      }
      markdown += `- **Duration**: ${formatDuration(execution.duration)}\n`;
      markdown += `- **Cost**: ${formatCost(execution.cost)}\n`;
      if (execution.tokensUsed) {
        markdown += `- **Tokens**: ${execution.tokensUsed.toLocaleString()}\n`;
      }
      
      if (execution.errorMessage) {
        markdown += `- **Error**: ${execution.errorMessage}\n`;
      }
      
      if (exportFormat.includeArtifacts && execution.artifacts?.length) {
        markdown += `- **Artifacts**:\n`;
        execution.artifacts.forEach((artifact: any) => {
          markdown += `  - ${artifact.name} (${artifact.type})\n`;
        });
      }
      
      if (exportFormat.includeLogs && execution.logs?.length) {
        markdown += `\n#### Execution Logs\n\n`;
        markdown += '```\n';
        execution.logs.forEach((log: any) => {
          markdown += `[${log.level.toUpperCase()}] ${new Date(log.timestamp).toISOString()} - ${log.message}\n`;
        });
        markdown += '```\n';
      }
      
      markdown += `\n`;
    });

    return markdown;
  };

  const analyzeExecutionLogs = useCallback(() => {
    const analysis: LogAnalysis = {
      totalLogs: 0,
      errorCount: 0,
      warningCount: 0,
      avgExecutionTime: 0,
      commonErrors: [],
      performanceInsights: []
    };

    const errorMessages: { [key: string]: number } = {};
    let totalExecutionTime = 0;
    let completedExecutions = 0;

    filteredExecutions.forEach(execution => {
      if (execution.executionLog) {
        analysis.totalLogs += execution.executionLog.length;
        execution.executionLog.forEach(log => {
          if (log.level === 'error') analysis.errorCount++;
          if (log.level === 'warn') analysis.warningCount++;
          
          if (log.level === 'error' && log.message) {
            errorMessages[log.message] = (errorMessages[log.message] || 0) + 1;
          }
        });
      }
      
      if (execution.status === 'completed' && execution.executionTimeMs) {
        totalExecutionTime += execution.executionTimeMs;
        completedExecutions++;
      }
    });

    analysis.avgExecutionTime = completedExecutions > 0 ? totalExecutionTime / completedExecutions : 0;
    analysis.commonErrors = Object.entries(errorMessages)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate performance insights
    if (analysis.avgExecutionTime > 300000) { // > 5 minutes
      analysis.performanceInsights.push({
        type: 'Performance',
        description: 'Average execution time is high. Consider optimizing workflow steps.',
        impact: 'high'
      });
    }
    
    if (analysis.errorCount > analysis.totalLogs * 0.1) {
      analysis.performanceInsights.push({
        type: 'Reliability',
        description: 'High error rate detected. Review error patterns and implement better error handling.',
        impact: 'high'
      });
    }
    
    if (filteredExecutions.filter(e => e.status === 'failed').length > filteredExecutions.length * 0.05) {
      analysis.performanceInsights.push({
        type: 'Success Rate',
        description: 'Execution failure rate above 5%. Investigate common failure causes.',
        impact: 'medium'
      });
    }

    setLogAnalysis(analysis);
    setShowLogAnalysis(true);
  }, [filteredExecutions]);

  const formatDuration = (ms?: number): string => {
    if (!ms) return '--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatCost = (cost?: number): string => {
    if (!cost) return '$0.00';
    return `$${cost.toFixed(4)}`;
  };

  const toggleLogExpansion = (executionId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(executionId)) {
      newExpanded.delete(executionId);
    } else {
      newExpanded.add(executionId);
    }
    setExpandedLogs(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Execution History</h2>
          <p className="text-muted-foreground">
            View and analyze workflow execution logs, artifacts, and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeExecutionLogs}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analyze Logs
          </Button>
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Execution Data</DialogTitle>
                <DialogDescription>
                  Choose the format and data to include in your export
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Export Format</Label>
                  <Select 
                    value={exportFormat.type} 
                    onValueChange={(value: 'csv' | 'json' | 'pdf') => 
                      setExportFormat(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="markdown">Markdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Include Data</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeLogs"
                        checked={exportFormat.includeLogs}
                        onChange={(e) => 
                          setExportFormat(prev => ({ ...prev, includeLogs: e.target.checked }))
                        }
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="includeLogs" className="text-sm">Execution Logs</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeArtifacts"
                        checked={exportFormat.includeArtifacts}
                        onChange={(e) => 
                          setExportFormat(prev => ({ ...prev, includeArtifacts: e.target.checked }))
                        }
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="includeArtifacts" className="text-sm">Artifacts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeMetadata"
                        checked={exportFormat.includeMetadata}
                        onChange={(e) => 
                          setExportFormat(prev => ({ ...prev, includeMetadata: e.target.checked }))
                        }
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="includeMetadata" className="text-sm">Metadata</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeTimestamps"
                        checked={exportFormat.includeTimestamps}
                        onChange={(e) => 
                          setExportFormat(prev => ({ ...prev, includeTimestamps: e.target.checked }))
                        }
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="includeTimestamps" className="text-sm">Timestamps</Label>
                    </div>
                  </div>
                  
                  {exportFormat.includeLogs && (
                    <div className="space-y-2">
                      <Label className="text-sm">Log Levels</Label>
                      <div className="flex flex-wrap gap-2">
                        {(['debug', 'info', 'warn', 'error'] as const).map(level => (
                          <div key={level} className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              id={`log-${level}`}
                              checked={exportFormat.logLevels.includes(level)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setExportFormat(prev => ({
                                    ...prev,
                                    logLevels: [...prev.logLevels, level]
                                  }));
                                } else {
                                  setExportFormat(prev => ({
                                    ...prev,
                                    logLevels: prev.logLevels.filter(l => l !== level)
                                  }));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={`log-${level}`} className="text-xs capitalize">
                              {level}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleExport}>
                    Export ({filteredExecutions.length} records)
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search executions, logs, artifacts..."
                  value={filters.searchQuery || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Date Range</Label>
              <DatePickerRange
                value={filters.dateRange}
                onChange={(dateRange) => setFilters(prev => ({ ...prev, dateRange }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filters.status?.[0] || ''} 
                onValueChange={(value: ExecutionStatus) => 
                  setFilters(prev => ({ ...prev, status: value ? [value] : undefined }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Workflow</Label>
              <Select 
                value={filters.workflowType?.[0] || ''} 
                onValueChange={(value: string) => 
                  setFilters(prev => ({ ...prev, workflowType: value ? [value] : undefined }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All workflows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All workflows</SelectItem>
                  {workflows.map(workflow => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {Object.keys(filters).some(key => filters[key as keyof ExecutionHistoryFilters]) && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {filteredExecutions.length} of {executions.length} executions
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({})}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Executions ({filteredExecutions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredExecutions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No executions found</h3>
              <p className="text-muted-foreground">
                {filters ? 'Try adjusting your filters' : 'No workflow executions have been run yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExecutions.map((execution) => {
                const StatusIcon = statusConfig[execution.status].icon;
                const workflowName = workflows.find(w => w.id === execution.workflowId)?.name || 'Unknown Workflow';
                const isExpanded = expandedLogs.has(execution.id);

                return (
                  <Card key={execution.id} className="border-l-4" 
                        style={{ borderLeftColor: execution.status === 'completed' ? '#22c55e' : 
                                 execution.status === 'failed' ? '#ef4444' : '#6b7280' }}>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Execution Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <StatusIcon className="w-5 h-5 mt-0.5" />
                            <div>
                              <h3 className="font-semibold">{workflowName}</h3>
                              <p className="text-sm text-muted-foreground">
                                ID: {execution.id}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={statusConfig[execution.status].color}>
                              {statusConfig[execution.status].label}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedExecution(execution)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleLogExpansion(execution.id)}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  {isExpanded ? 'Hide' : 'Show'} Logs
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Execution Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Started:</span>
                            <p>{format(execution.startedAt, 'MMM d, yyyy HH:mm')}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <p>{formatDuration(execution.executionTimeMs)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost:</span>
                            <p>{formatCost(execution.costUsd)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Artifacts:</span>
                            <p>{execution.artifacts?.length || 0} generated</p>
                          </div>
                        </div>

                        {/* Error Message */}
                        {execution.errorMessage && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-red-800">Error</p>
                                <p className="text-sm text-red-700">{execution.errorMessage}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Artifacts */}
                        {execution.artifacts && execution.artifacts.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Artifacts ({execution.artifacts.length})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {execution.artifacts.map((artifact) => {
                                const IconComponent = artifactTypeIcons[artifact.type] || artifactTypeIcons.default;
                                return (
                                  <div key={artifact.id} className="flex items-center space-x-2 p-2 bg-muted rounded">
                                    <IconComponent className="w-4 h-4" />
                                    <span className="text-sm truncate">{artifact.name}</span>
                                    {artifact.url && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(artifact.url, '_blank')}
                                      >
                                        <Eye className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Expandable Logs */}
                        <Collapsible open={isExpanded} onOpenChange={() => toggleLogExpansion(execution.id)}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full">
                              <FileText className="w-4 h-4 mr-2" />
                              {isExpanded ? 'Hide' : 'Show'} Execution Logs ({execution.executionLog?.length || 0})
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                              {execution.executionLog?.length ? (
                                execution.executionLog.map((log, index) => {
                                  const LogIcon = logLevelConfig[log.level].icon;
                                  return (
                                    <div
                                      key={index}
                                      className={`p-3 rounded-lg border ${logLevelConfig[log.level].bgColor}`}
                                    >
                                      <div className="flex items-start space-x-2">
                                        <LogIcon className={`w-4 h-4 mt-0.5 ${logLevelConfig[log.level].color}`} />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <span className={`text-xs font-medium uppercase ${logLevelConfig[log.level].color}`}>
                                              {log.level}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                                            </span>
                                          </div>
                                          <p className="text-sm mt-1">{log.message}</p>
                                          {log.data && (
                                            <details className="mt-2">
                                              <summary className="text-xs text-muted-foreground cursor-pointer">
                                                Additional Data
                                              </summary>
                                              <pre className="text-xs bg-black/5 rounded p-2 mt-1 overflow-x-auto">
                                                {JSON.stringify(log.data, null, 2)}
                                              </pre>
                                            </details>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No logs available for this execution
                                </p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Details Modal */}
      {selectedExecution && (
        <Dialog open={!!selectedExecution} onOpenChange={() => setSelectedExecution(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Execution Details</DialogTitle>
              <DialogDescription>
                Complete execution information for {workflows.find(w => w.id === selectedExecution.workflowId)?.name}
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Execution ID</Label>
                    <p className="font-mono text-sm">{selectedExecution.id}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Workflow</Label>
                    <p>{workflows.find(w => w.id === selectedExecution.workflowId)?.name || 'Unknown'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Badge className={statusConfig[selectedExecution.status].color}>
                      {statusConfig[selectedExecution.status].label}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <p>{formatDuration(selectedExecution.executionTimeMs)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Cost</Label>
                    <p>{formatCost(selectedExecution.costUsd)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Tokens Used</Label>
                    <p>{selectedExecution.tokensUsed?.toLocaleString() || '--'}</p>
                  </div>
                </div>
                
                {selectedExecution.errorMessage && (
                  <div className="space-y-2">
                    <Label>Error Message</Label>
                    <Textarea 
                      value={selectedExecution.errorMessage} 
                      readOnly 
                      className="bg-red-50 border-red-200"
                    />
                  </div>
                )}

                {selectedExecution.metadata && Object.keys(selectedExecution.metadata).length > 0 && (
                  <div className="space-y-2">
                    <Label>Metadata</Label>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedExecution.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="logs">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {selectedExecution.executionLog?.map((log, index) => {
                      const LogIcon = logLevelConfig[log.level].icon;
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${logLevelConfig[log.level].bgColor}`}
                        >
                          <div className="flex items-start space-x-2">
                            <LogIcon className={`w-4 h-4 mt-0.5 ${logLevelConfig[log.level].color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium uppercase ${logLevelConfig[log.level].color}`}>
                                  {log.level}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss.SSS')}
                                </span>
                              </div>
                              <p className="text-sm mt-1">{log.message}</p>
                              {log.data && (
                                <details className="mt-2">
                                  <summary className="text-xs text-muted-foreground cursor-pointer">
                                    Additional Data
                                  </summary>
                                  <pre className="text-xs bg-black/5 rounded p-2 mt-1 overflow-x-auto">
                                    {JSON.stringify(log.data, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }) || (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No logs available for this execution
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="artifacts">
                <div className="space-y-4">
                  {selectedExecution.artifacts?.length ? (
                    selectedExecution.artifacts.map((artifact) => {
                      const IconComponent = artifactTypeIcons[artifact.type] || artifactTypeIcons.default;
                      return (
                        <Card key={artifact.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <IconComponent className="w-6 h-6 mt-1" />
                                <div>
                                  <h4 className="font-medium">{artifact.name}</h4>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {artifact.type} • Created {format(artifact.createdAt, 'MMM d, yyyy HH:mm')}
                                  </p>
                                </div>
                              </div>
                              {artifact.url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(artifact.url, '_blank')}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                              )}
                            </div>
                            {artifact.data && (
                              <details className="mt-3">
                                <summary className="text-sm text-muted-foreground cursor-pointer">
                                  Preview Data
                                </summary>
                                <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-x-auto">
                                  {JSON.stringify(artifact.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No Artifacts</h3>
                      <p className="text-muted-foreground">
                        This execution did not generate any artifacts
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Mock data generator for development
function generateMockExecutions(): WorkflowExecution[] {
  const statuses: ExecutionStatus[] = ['completed', 'failed', 'running', 'cancelled'];
  const workflowIds = ['1', '2', '3'];
  
  return Array.from({ length: 25 }, (_, i) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const duration = Math.floor(Math.random() * 300000) + 5000; // 5s to 5min
    const completedAt = status === 'running' ? undefined : new Date(startDate.getTime() + duration);
    
    return {
      id: `exec-${i + 1}`,
      workflowId: workflowIds[Math.floor(Math.random() * workflowIds.length)],
      status,
      startedAt: startDate,
      completedAt,
      executionTimeMs: duration,
      costUsd: Math.random() * 2.5,
      tokensUsed: Math.floor(Math.random() * 10000) + 1000,
      errorMessage: status === 'failed' ? `Sample error message for execution ${i + 1}` : undefined,
      executionLog: generateMockLogs(Math.floor(Math.random() * 10) + 5),
      artifacts: generateMockArtifacts(Math.floor(Math.random() * 5)),
      metadata: {
        userId: 'user-123',
        priority: 'normal',
        retryCount: 0
      }
    };
  });
}

function generateMockLogs(count: number): LogEntry[] {
  const levels: ('debug' | 'info' | 'warn' | 'error')[] = ['debug', 'info', 'warn', 'error'];
  const messages = [
    'Workflow execution started',
    'Loading agent configuration',
    'Processing input parameters',
    'Executing agent step',
    'Generating content artifacts',
    'Validating output quality',
    'Applying compliance checks',
    'Saving execution results',
    'Workflow execution completed'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    timestamp: Date.now() - (count - i) * 1000,
    level: levels[Math.floor(Math.random() * levels.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    data: Math.random() > 0.7 ? { stepId: `step-${i}`, duration: Math.random() * 1000 } : undefined
  }));
}

function generateMockArtifacts(count: number): Artifact[] {
  const types = ['document', 'image', 'code', 'data', 'report'];
  const names = [
    'Generated Content.docx',
    'Analysis Report.pdf',
    'Marketing Image.png',
    'Code Implementation.js',
    'Data Export.json'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `artifact-${i + 1}`,
    type: types[Math.floor(Math.random() * types.length)],
    name: names[Math.floor(Math.random() * names.length)],
    url: `https://example.com/artifacts/artifact-${i + 1}`,
    createdAt: new Date(),
    data: Math.random() > 0.5 ? { size: Math.floor(Math.random() * 1000000), format: 'text' } : undefined
  }));
}