'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  RefreshCw,
  Copy,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Calendar
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { WorkflowExecution, ExecutionStatus, WorkflowTask } from '@/types/ai/workflows';

interface WorkflowHistoryProps {
  organizationId: string;
}

export function WorkflowHistory({ organizationId }: WorkflowHistoryProps) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState('7d');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchExecutionHistory();
  }, [organizationId, statusFilter, dateRange]);

  const fetchExecutionHistory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        organizationId,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        dateRange
      });

      const response = await fetch(`/api/admin/ai/workflows/executions/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setExecutions(data);
      }
    } catch (error) {
      console.error('Failed to fetch execution history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'paused':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ExecutionStatus) => {
    const variants: Record<ExecutionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'secondary',
      failed: 'destructive',
      cancelled: 'outline',
      running: 'default',
      paused: 'outline',
      pending: 'outline'
    };

    return (
      <Badge variant={variants[status]}>
        {status}
      </Badge>
    );
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const viewExecutionDetails = (execution: WorkflowExecution) => {
    setSelectedExecution(execution);
    setIsDetailsModalOpen(true);
  };

  const retryExecution = async (executionId: string) => {
    try {
      const response = await fetch(`/api/admin/ai/workflows/executions/${executionId}/retry`, {
        method: 'POST'
      });
      if (response.ok) {
        fetchExecutionHistory();
      }
    } catch (error) {
      console.error('Failed to retry execution:', error);
    }
  };

  const exportHistory = () => {
    const csv = [
      ['ID', 'Workflow', 'Status', 'Started', 'Duration', 'Cost', 'Triggered By'],
      ...executions.map(e => [
        e.id,
        e.workflow?.name || 'Unknown',
        e.status,
        format(new Date(e.startedAt), 'yyyy-MM-dd HH:mm:ss'),
        formatDuration(e.durationMs),
        e.costEstimate?.toFixed(2) || '0.00',
        e.triggerType
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-history-${Date.now()}.csv`;
    a.click();
  };

  const filteredExecutions = executions.filter(e => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        e.id.toLowerCase().includes(query) ||
        e.workflow?.name?.toLowerCase().includes(query) ||
        e.triggerType.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search executions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={fetchExecutionHistory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button variant="outline" onClick={exportHistory}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      {/* Execution History Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredExecutions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No executions found
                </TableCell>
              </TableRow>
            ) : (
              filteredExecutions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      {getStatusBadge(execution.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{execution.workflow?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{execution.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{format(new Date(execution.startedAt), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(execution.startedAt), 'HH:mm:ss')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(execution.durationMs)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {execution.triggerType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {execution.costEstimate ? (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>${execution.costEstimate.toFixed(2)}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewExecutionDetails(execution)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {execution.status === 'failed' && (
                          <DropdownMenuItem onClick={() => retryExecution(execution.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy ID
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Execution Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Execution Details</DialogTitle>
            <DialogDescription>
              {selectedExecution?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExecution && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Workflow</p>
                  <p className="font-medium">{selectedExecution.workflow?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedExecution.status)}
                    {getStatusBadge(selectedExecution.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{formatDuration(selectedExecution.durationMs)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost</p>
                  <p className="font-medium">
                    ${selectedExecution.costEstimate?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              {/* Error Details */}
              {selectedExecution.errorMessage && (
                <Card className="p-4 border-red-200 bg-red-50">
                  <h4 className="font-medium text-red-900 mb-2">Error Details</h4>
                  <p className="text-sm text-red-800">{selectedExecution.errorMessage}</p>
                  {selectedExecution.errorDetails && (
                    <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedExecution.errorDetails, null, 2)}
                    </pre>
                  )}
                </Card>
              )}

              {/* Tasks */}
              {selectedExecution.tasks && selectedExecution.tasks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Task Execution</h4>
                  <div className="space-y-2">
                    {selectedExecution.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(task.status as ExecutionStatus)}
                          <div>
                            <p className="font-medium">{task.taskName}</p>
                            {task.agentType && (
                              <p className="text-xs text-muted-foreground">
                                {task.agentType} agent
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{formatDuration(task.durationMs)}</p>
                          {task.cost && (
                            <p className="text-xs text-muted-foreground">
                              ${task.cost.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input/Output Data */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Input Data</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedExecution.inputData, null, 2)}
                  </pre>
                </div>
                {selectedExecution.outputData && (
                  <div>
                    <h4 className="font-medium mb-2">Output Data</h4>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedExecution.outputData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}