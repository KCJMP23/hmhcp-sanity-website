/**
 * NotificationQueue - Notification queue management with priority
 * Healthcare compliant with audit trails and retry mechanisms
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Filter,
  Search,
  ArrowUpDown,
} from 'lucide-react';
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
import type { NotificationQueueItem, NotificationSeverity, NotificationCategory } from './types';
import { 
  getSeverityIcon, 
  getSeverityColors, 
  getCategoryIcon,
  HIPAAIndicator, 
  formatNotificationTime, 
  PriorityIndicator 
} from './utils/icons';

interface NotificationQueueProps {
  queue: NotificationQueueItem[];
  isProcessing: boolean;
  onProcess: () => void;
  onPause: () => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onUpdatePriority: (id: string, priority: number) => void;
  className?: string;
}

type SortField = 'timestamp' | 'priority' | 'severity' | 'category' | 'retryCount';
type SortDirection = 'asc' | 'desc';

export const NotificationQueue: React.FC<NotificationQueueProps> = ({
  queue,
  isProcessing,
  onProcess,
  onPause,
  onRetry,
  onRemove,
  onClear,
  onUpdatePriority,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<NotificationSeverity | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'failed' | 'processed'>('all');
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter and sort queue items
  const filteredAndSortedQueue = useMemo(() => {
    let filtered = queue.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'pending' && !item.processed && item.retryCount < item.maxRetries) ||
        (statusFilter === 'failed' && item.retryCount >= item.maxRetries && !item.processed) ||
        (statusFilter === 'processed' && item.processed);

      return matchesSearch && matchesSeverity && matchesCategory && matchesStatus;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortField) {
        case 'timestamp':
          valueA = a.timestamp.getTime();
          valueB = b.timestamp.getTime();
          break;
        case 'priority':
          valueA = a.priority;
          valueB = b.priority;
          break;
        case 'severity':
          const severityOrder = { critical: 5, error: 4, warning: 3, info: 2, success: 1 };
          valueA = severityOrder[a.severity];
          valueB = severityOrder[b.severity];
          break;
        case 'category':
          valueA = a.category;
          valueB = b.category;
          break;
        case 'retryCount':
          valueA = a.retryCount;
          valueB = b.retryCount;
          break;
        default:
          valueA = a.priority;
          valueB = b.priority;
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [queue, searchTerm, severityFilter, categoryFilter, statusFilter, sortField, sortDirection]);

  // Queue statistics
  const stats = useMemo(() => {
    const total = queue.length;
    const pending = queue.filter(item => !item.processed && item.retryCount < item.maxRetries).length;
    const failed = queue.filter(item => item.retryCount >= item.maxRetries && !item.processed).length;
    const processed = queue.filter(item => item.processed).length;
    const critical = queue.filter(item => item.severity === 'critical').length;
    const hipaaItems = queue.filter(item => item.hipaa.containsPHI).length;

    return { total, pending, failed, processed, critical, hipaaItems };
  }, [queue]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusIcon = (item: NotificationQueueItem) => {
    if (item.processed) return CheckCircle2;
    if (item.retryCount >= item.maxRetries) return XCircle;
    if (item.error) return AlertTriangle;
    return Clock;
  };

  const getStatusColor = (item: NotificationQueueItem) => {
    if (item.processed) return 'text-emerald-600';
    if (item.retryCount >= item.maxRetries) return 'text-red-600';
    if (item.error) return 'text-amber-600';
    return 'text-blue-600';
  };

  const getStatusLabel = (item: NotificationQueueItem) => {
    if (item.processed) return 'Processed';
    if (item.retryCount >= item.maxRetries) return 'Failed';
    if (item.error) return 'Error';
    return 'Pending';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Queue Statistics */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            Total: {stats.total}
          </Badge>
          <Badge variant="outline" className="text-sm text-blue-600">
            Pending: {stats.pending}
          </Badge>
          <Badge variant="outline" className="text-sm text-red-600">
            Failed: {stats.failed}
          </Badge>
          <Badge variant="outline" className="text-sm text-emerald-600">
            Processed: {stats.processed}
          </Badge>
          {stats.critical > 0 && (
            <Badge variant="destructive" className="text-sm animate-pulse">
              Critical: {stats.critical}
            </Badge>
          )}
          {stats.hipaaItems > 0 && (
            <Badge variant="outline" className="text-sm text-amber-600">
              PHI: {stats.hipaaItems}
            </Badge>
          )}
        </div>

        {/* Queue Controls */}
        <div className="flex gap-2 ml-auto">
          <Button
            size="sm"
            onClick={isProcessing ? onPause : onProcess}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Process
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onClear}
            disabled={queue.length === 0}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={severityFilter} onValueChange={(value: any) => setSeverityFilter(value)}>
          <SelectTrigger>
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="success">Success</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
          <SelectTrigger>
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="data">Data</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="audit">Audit</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger>
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Queue Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1">
                  Priority
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleSort('severity')}
              >
                <div className="flex items-center gap-1">
                  Severity
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead>Notification</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center gap-1">
                  Created
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Retries</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredAndSortedQueue.map((item) => {
                const SeverityIcon = getSeverityIcon(item.severity);
                const CategoryIcon = getCategoryIcon(item.category);
                const StatusIcon = getStatusIcon(item);
                const colors = getSeverityColors(item.severity);
                
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                  >
                    <TableCell>
                      <PriorityIndicator priority={item.priority} />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <SeverityIcon className={`w-4 h-4 ${colors.icon}`} />
                        <span className="text-xs capitalize">{item.severity}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="max-w-md">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-3 h-3 text-gray-400" />
                          <span className="font-medium text-sm">{item.title}</span>
                          <HIPAAIndicator 
                            containsPHI={item.hipaa.containsPHI}
                            auditRequired={item.hipaa.auditRequired}
                          />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {item.message}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-sm text-gray-600">
                      {formatNotificationTime(item.timestamp)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${getStatusColor(item)}`} />
                        <span className={`text-xs ${getStatusColor(item)}`}>
                          {getStatusLabel(item)}
                        </span>
                      </div>
                      {item.error && (
                        <p className="text-xs text-red-600 mt-1 line-clamp-1" title={item.error}>
                          {item.error}
                        </p>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={item.retryCount >= item.maxRetries ? 'destructive' : 'outline'}>
                        {item.retryCount}/{item.maxRetries}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!item.processed && item.retryCount < item.maxRetries && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRetry(item.id)}
                            className="h-6 w-6 p-0"
                            title="Retry"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemove(item.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>

        {filteredAndSortedQueue.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notifications in queue</p>
            {(searchTerm || severityFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all') && (
              <p className="text-sm mt-1">Try adjusting your filters</p>
            )}
          </div>
        )}
      </div>

      {/* Processing Indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing queue...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationQueue;