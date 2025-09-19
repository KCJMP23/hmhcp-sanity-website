/**
 * NotificationHistory - Notification history component with persistence
 * Healthcare compliant with audit trails and long-term retention
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Archive, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  ArrowUpDown,
  FileText,
  Shield,
  Clock,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { 
  NotificationHistoryItem, 
  NotificationSeverity, 
  NotificationCategory 
} from './types';
import { 
  getSeverityIcon, 
  getSeverityColors, 
  getCategoryIcon,
  HIPAAIndicator, 
  formatNotificationTime 
} from './utils/icons';

interface NotificationHistoryProps {
  notifications: NotificationHistoryItem[];
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onBulkArchive: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onExport: (notifications: NotificationHistoryItem[]) => void;
  currentUserId?: string;
  retentionDays?: number;
  className?: string;
}

type SortField = 'timestamp' | 'readAt' | 'severity' | 'category' | 'title';
type SortDirection = 'asc' | 'desc';

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({
  notifications,
  onMarkAsRead,
  onArchive,
  onBulkArchive,
  onDelete,
  onBulkDelete,
  onExport,
  currentUserId,
  retentionDays = 90,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<NotificationSeverity | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');
  const [readStatusFilter, setReadStatusFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [archivedFilter, setArchivedFilter] = useState<'all' | 'archived' | 'active'>('active');
  const [hipaaFilter, setHipaaFilter] = useState<'all' | 'phi' | 'non-phi'>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Filter and sort notifications
  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = notifications.filter(notification => {
      const matchesSearch = searchTerm === '' || 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = severityFilter === 'all' || notification.severity === severityFilter;
      const matchesCategory = categoryFilter === 'all' || notification.category === categoryFilter;
      
      const matchesReadStatus = readStatusFilter === 'all' ||
        (readStatusFilter === 'read' && notification.readAt) ||
        (readStatusFilter === 'unread' && !notification.readAt);
      
      const matchesArchived = archivedFilter === 'all' ||
        (archivedFilter === 'archived' && notification.archivedAt) ||
        (archivedFilter === 'active' && !notification.archivedAt);
      
      const matchesHipaa = hipaaFilter === 'all' ||
        (hipaaFilter === 'phi' && notification.hipaa.containsPHI) ||
        (hipaaFilter === 'non-phi' && !notification.hipaa.containsPHI);
      
      const matchesDateRange = (!dateRange.from || notification.timestamp >= dateRange.from) &&
                              (!dateRange.to || notification.timestamp <= dateRange.to);

      return matchesSearch && matchesSeverity && matchesCategory && 
             matchesReadStatus && matchesArchived && matchesHipaa && matchesDateRange;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortField) {
        case 'timestamp':
          valueA = a.timestamp.getTime();
          valueB = b.timestamp.getTime();
          break;
        case 'readAt':
          valueA = a.readAt?.getTime() || 0;
          valueB = b.readAt?.getTime() || 0;
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
        case 'title':
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        default:
          valueA = a.timestamp.getTime();
          valueB = b.timestamp.getTime();
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    notifications, searchTerm, severityFilter, categoryFilter, 
    readStatusFilter, archivedFilter, hipaaFilter, dateRange, 
    sortField, sortDirection
  ]);

  // Statistics
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.readAt).length;
    const archived = notifications.filter(n => n.archivedAt).length;
    const critical = notifications.filter(n => n.severity === 'critical').length;
    const hipaaItems = notifications.filter(n => n.hipaa.containsPHI).length;
    const auditItems = notifications.filter(n => n.hipaa.auditRequired).length;
    
    // Items approaching retention limit
    const retentionCutoff = new Date();
    retentionCutoff.setDate(retentionCutoff.getDate() - retentionDays);
    const nearExpiry = notifications.filter(n => 
      n.timestamp < retentionCutoff && !n.archivedAt
    ).length;

    return { total, unread, archived, critical, hipaaItems, auditItems, nearExpiry };
  }, [notifications, retentionDays]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredAndSortedNotifications.map(n => n.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter(item => item !== id));
    }
  };

  const handleBulkAction = (action: 'archive' | 'delete' | 'read') => {
    if (selectedItems.length === 0) return;

    switch (action) {
      case 'archive':
        onBulkArchive(selectedItems);
        break;
      case 'delete':
        onBulkDelete(selectedItems);
        break;
      case 'read':
        selectedItems.forEach(id => onMarkAsRead(id));
        break;
    }
    setSelectedItems([]);
  };

  const handleExport = () => {
    const exportData = filteredAndSortedNotifications.map(notification => ({
      ...notification,
      actions: notification.actions.map(action => ({
        ...action,
        timestamp: action.timestamp.toISOString(),
      })),
      timestamp: notification.timestamp.toISOString(),
      readAt: notification.readAt?.toISOString(),
      archivedAt: notification.archivedAt?.toISOString(),
    }));
    onExport(exportData as any);
  };

  const getActionSummary = (notification: NotificationHistoryItem) => {
    const actionCounts = notification.actions.reduce((acc, action) => {
      acc[action.action] = (acc[action.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(actionCounts)
      .map(([action, count]) => `${action}: ${count}`)
      .join(', ');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Statistics */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Total: {stats.total}</Badge>
          <Badge variant="outline" className="text-blue-600">
            Unread: {stats.unread}
          </Badge>
          <Badge variant="outline" className="text-gray-600">
            Archived: {stats.archived}
          </Badge>
          {stats.critical > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              Critical: {stats.critical}
            </Badge>
          )}
          {stats.hipaaItems > 0 && (
            <Badge variant="outline" className="text-amber-600">
              <Shield className="w-3 h-3 mr-1" />
              PHI: {stats.hipaaItems}
            </Badge>
          )}
          {stats.auditItems > 0 && (
            <Badge variant="outline" className="text-purple-600">
              Audit Required: {stats.auditItems}
            </Badge>
          )}
          {stats.nearExpiry > 0 && (
            <Badge variant="outline" className="text-orange-600">
              <Clock className="w-3 h-3 mr-1" />
              Near Expiry: {stats.nearExpiry}
            </Badge>
          )}
        </div>

        <div className="flex gap-2 ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={filteredAndSortedNotifications.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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

        <Select value={readStatusFilter} onValueChange={(value: any) => setReadStatusFilter(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Read Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>

        <Select value={archivedFilter} onValueChange={(value: any) => setArchivedFilter(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Archive Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <Select value={hipaaFilter} onValueChange={(value: any) => setHipaaFilter(value)}>
          <SelectTrigger>
            <SelectValue placeholder="HIPAA Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="phi">Contains PHI</SelectItem>
            <SelectItem value="non-phi">No PHI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Picker */}
      <div className="flex items-center gap-4">
        <Calendar className="w-4 h-4 text-gray-400" />
        <DateRangePicker
          from={dateRange.from}
          to={dateRange.to}
          onSelect={(range) => setDateRange(range)}
        />
        {(dateRange.from || dateRange.to) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDateRange({ from: null, to: null })}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg"
        >
          <span className="text-sm font-medium">
            {selectedItems.length} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('read')}>
              Mark as Read
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}>
              Archive
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
              Delete
            </Button>
          </div>
        </motion.div>
      )}

      {/* Notifications Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedItems.length === filteredAndSortedNotifications.length && filteredAndSortedNotifications.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleSort('severity')}
              >
                <div className="flex items-center gap-1">
                  Severity
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Notification
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center gap-1">
                  Created
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredAndSortedNotifications.map((notification) => {
                const SeverityIcon = getSeverityIcon(notification.severity);
                const CategoryIcon = getCategoryIcon(notification.category);
                const colors = getSeverityColors(notification.severity);
                
                return (
                  <motion.tr
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`
                      hover:bg-gray-50/50 dark:hover:bg-gray-800/50
                      ${!notification.readAt ? 'bg-blue-50/30 dark:bg-blue-950/30' : ''}
                      ${notification.archivedAt ? 'opacity-60' : ''}
                    `}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(notification.id)}
                        onCheckedChange={(checked) => handleSelectItem(notification.id, checked as boolean)}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!notification.readAt ? (
                          <EyeOff className="w-4 h-4 text-blue-600" title="Unread" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" title="Read" />
                        )}
                        {notification.archivedAt && (
                          <Archive className="w-4 h-4 text-gray-400" title="Archived" />
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <SeverityIcon className={`w-4 h-4 ${colors.icon}`} />
                        <span className="text-xs capitalize">{notification.severity}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="max-w-md">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-3 h-3 text-gray-400" />
                          <span className={`font-medium text-sm ${!notification.readAt ? 'font-bold' : ''}`}>
                            {notification.title}
                          </span>
                          <HIPAAIndicator 
                            containsPHI={notification.hipaa.containsPHI}
                            auditRequired={notification.hipaa.auditRequired}
                          />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.userId && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            User: {notification.userId}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="space-y-1">
                      <div className="text-sm text-gray-600">
                        {formatNotificationTime(notification.timestamp)}
                      </div>
                      {notification.readAt && (
                        <div className="text-xs text-gray-500">
                          Read: {formatNotificationTime(notification.readAt)}
                        </div>
                      )}
                      {notification.archivedAt && (
                        <div className="text-xs text-gray-500">
                          Archived: {formatNotificationTime(notification.archivedAt)}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-xs text-gray-500">
                        {notification.actions.length > 0 ? getActionSummary(notification) : 'None'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!notification.readAt && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onMarkAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                            title="Mark as read"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                        
                        {!notification.archivedAt && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onArchive(notification.id)}
                            className="h-6 w-6 p-0"
                            title="Archive"
                          >
                            <Archive className="w-3 h-3" />
                          </Button>
                        )}
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              title="View details"
                            >
                              <FileText className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <SeverityIcon className={`w-5 h-5 ${colors.icon}`} />
                                {notification.title}
                              </DialogTitle>
                              <DialogDescription>
                                {notification.message}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Severity:</span> {notification.severity}
                                </div>
                                <div>
                                  <span className="font-medium">Category:</span> {notification.category}
                                </div>
                                <div>
                                  <span className="font-medium">Created:</span> {notification.timestamp.toLocaleString()}
                                </div>
                                <div>
                                  <span className="font-medium">User ID:</span> {notification.userId || 'N/A'}
                                </div>
                                {notification.readAt && (
                                  <div>
                                    <span className="font-medium">Read:</span> {notification.readAt.toLocaleString()}
                                  </div>
                                )}
                                {notification.archivedAt && (
                                  <div>
                                    <span className="font-medium">Archived:</span> {notification.archivedAt.toLocaleString()}
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">HIPAA Compliance</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="font-medium">Contains PHI:</span> {notification.hipaa.containsPHI ? 'Yes' : 'No'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Audit Required:</span> {notification.hipaa.auditRequired ? 'Yes' : 'No'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Retention Days:</span> {notification.hipaa.retentionPeriod}
                                  </div>
                                  <div>
                                    <span className="font-medium">Access Level:</span> {notification.hipaa.accessLevel}
                                  </div>
                                </div>
                              </div>
                              
                              {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Metadata</h4>
                                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto">
                                    {JSON.stringify(notification.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {notification.actions.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Action History</h4>
                                  <div className="space-y-2">
                                    {notification.actions.map((action) => (
                                      <div key={action.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                        <span className="capitalize">{action.action}</span>
                                        <div className="text-xs text-gray-500">
                                          {action.timestamp.toLocaleString()}
                                          {action.userId && ` by ${action.userId}`}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(notification.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          title="Delete"
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

        {filteredAndSortedNotifications.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notifications found</p>
            {(searchTerm || severityFilter !== 'all' || categoryFilter !== 'all' || 
              readStatusFilter !== 'all' || archivedFilter !== 'active' || 
              hipaaFilter !== 'all' || dateRange.from || dateRange.to) && (
              <p className="text-sm mt-1">Try adjusting your filters</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationHistory;