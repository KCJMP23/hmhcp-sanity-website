'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Bell, 
  BellOff, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  XCircle,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Zap,
  Shield,
  Activity,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'workflow_status' | 'error_alert' | 'compliance_violation' | 'performance_alert' | 'approval_request' | 'system_maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  workflowId?: string;
  workflowName?: string;
  timestamp: string;
  read: boolean;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  actionRequired: boolean;
  actionUrl?: string;
  metadata: {
    healthcareTopic?: string;
    complianceFramework?: string;
    agentName?: string;
    errorCode?: string;
    performanceMetric?: string;
  };
}

interface NotificationPreferences {
  id: string;
  userId: string;
  workflowStatus: boolean;
  errorAlerts: boolean;
  complianceViolations: boolean;
  performanceAlerts: boolean;
  approvalRequests: boolean;
  systemMaintenance: boolean;
  deliveryMethods: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
    webhook: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  priorityFilter: string[];
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    loadNotificationData();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchTerm, typeFilter, priorityFilter, statusFilter]);

  const loadNotificationData = async () => {
    try {
      setIsLoading(true);
      const [notificationsResponse, preferencesResponse] = await Promise.all([
        fetch('/api/admin/ai-workflows/notifications'),
        fetch('/api/admin/ai-workflows/notifications/preferences')
      ]);

      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.notifications || []);
      }

      if (preferencesResponse.ok) {
        const preferencesData = await preferencesResponse.json();
        setPreferences(preferencesData.preferences || null);
      }
    } catch (error) {
      console.error('Failed to load notification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notification.workflowName && notification.workflowName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(notification => notification.type === typeFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(notification => notification.priority === priorityFilter);
    }

    // Status filter
    if (statusFilter === 'unread') {
      filtered = filtered.filter(notification => !notification.read);
    } else if (statusFilter === 'unacknowledged') {
      filtered = filtered.filter(notification => !notification.acknowledged);
    } else if (statusFilter === 'action_required') {
      filtered = filtered.filter(notification => notification.actionRequired);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredNotifications(filtered);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'workflow_status': return 'bg-blue-100 text-blue-800';
      case 'error_alert': return 'bg-red-100 text-red-800';
      case 'compliance_violation': return 'bg-orange-100 text-orange-800';
      case 'performance_alert': return 'bg-yellow-100 text-yellow-800';
      case 'approval_request': return 'bg-purple-100 text-purple-800';
      case 'system_maintenance': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'workflow_status': return <Activity className="h-4 w-4" />;
      case 'error_alert': return <XCircle className="h-4 w-4" />;
      case 'compliance_violation': return <Shield className="h-4 w-4" />;
      case 'performance_alert': return <Zap className="h-4 w-4" />;
      case 'approval_request': return <CheckCircle className="h-4 w-4" />;
      case 'system_maintenance': return <Settings className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/ai-workflows/notifications/${notificationId}/read`, {
        method: 'POST'
      });

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const acknowledgeNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/ai-workflows/notifications/${notificationId}/acknowledge`, {
        method: 'POST'
      });

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { 
            ...n, 
            acknowledged: true, 
            acknowledgedBy: 'Current User',
            acknowledgedAt: new Date().toISOString()
          } : n
        ));
      }
    } catch (error) {
      console.error('Failed to acknowledge notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/ai-workflows/notifications/read-all', {
        method: 'POST'
      });

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      const response = await fetch('/api/admin/ai-workflows/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      });

      if (response.ok) {
        setPreferences(newPreferences);
        alert('Notification preferences updated successfully');
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      alert('Failed to update notification preferences');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">
              All notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <BellOff className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notifications.filter(n => !n.read).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {notifications.filter(n => n.priority === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">
              High priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Required</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {notifications.filter(n => n.actionRequired).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="workflow_status">Workflow Status</SelectItem>
                <SelectItem value="error_alert">Error Alert</SelectItem>
                <SelectItem value="compliance_violation">Compliance Violation</SelectItem>
                <SelectItem value="performance_alert">Performance Alert</SelectItem>
                <SelectItem value="approval_request">Approval Request</SelectItem>
                <SelectItem value="system_maintenance">System Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
                <SelectItem value="action_required">Action Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </div>
            <div className="flex gap-2">
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
              <Button onClick={() => setShowPreferences(true)} variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </Button>
              <Button onClick={loadNotificationData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Real-time alerts and notifications for AI workflow management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notifications found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`border rounded-lg p-4 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{notification.title}</h3>
                          <Badge className={getTypeColor(notification.type)}>
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority.toUpperCase()}
                          </Badge>
                          {notification.actionRequired && (
                            <Badge variant="outline" className="border-orange-200 text-orange-800">
                              Action Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        {notification.workflowName && (
                          <div className="text-sm text-blue-600">
                            Workflow: {notification.workflowName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Read
                        </Button>
                      )}
                      {!notification.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeNotification(notification.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Timestamp</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{new Date(notification.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Status</div>
                      <div className="flex items-center gap-2">
                        {notification.read ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <BellOff className="h-4 w-4 text-red-600" />
                        )}
                        <span>{notification.read ? 'Read' : 'Unread'}</span>
                        {notification.acknowledged && (
                          <>
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span>Acknowledged</span>
                          </>
                        )}
                      </div>
                    </div>
                    {notification.metadata.healthcareTopic && (
                      <div>
                        <div className="text-gray-600">Healthcare Topic</div>
                        <div>{notification.metadata.healthcareTopic}</div>
                      </div>
                    )}
                    {notification.metadata.complianceFramework && (
                      <div>
                        <div className="text-gray-600">Compliance Framework</div>
                        <div>{notification.metadata.complianceFramework}</div>
                      </div>
                    )}
                  </div>

                  {notification.acknowledged && notification.acknowledgedBy && (
                    <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                      Acknowledged by {notification.acknowledgedBy} on{' '}
                      {new Date(notification.acknowledgedAt || '').toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences Modal */}
      {showPreferences && preferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notification Preferences</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowPreferences(false)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Workflow Status</div>
                      <div className="text-sm text-gray-600">Updates on workflow execution status</div>
                    </div>
                    <Checkbox
                      checked={preferences.workflowStatus}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, workflowStatus: !!checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Error Alerts</div>
                      <div className="text-sm text-gray-600">Notifications when workflows encounter errors</div>
                    </div>
                    <Checkbox
                      checked={preferences.errorAlerts}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, errorAlerts: !!checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Compliance Violations</div>
                      <div className="text-sm text-gray-600">Alerts for healthcare compliance issues</div>
                    </div>
                    <Checkbox
                      checked={preferences.complianceViolations}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, complianceViolations: !!checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Performance Alerts</div>
                      <div className="text-sm text-gray-600">Notifications about workflow performance issues</div>
                    </div>
                    <Checkbox
                      checked={preferences.performanceAlerts}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, performanceAlerts: !!checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Approval Requests</div>
                      <div className="text-sm text-gray-600">Requests for workflow intervention approval</div>
                    </div>
                    <Checkbox
                      checked={preferences.approvalRequests}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, approvalRequests: !!checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">System Maintenance</div>
                      <div className="text-sm text-gray-600">Notifications about system maintenance and updates</div>
                    </div>
                    <Checkbox
                      checked={preferences.systemMaintenance}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, systemMaintenance: !!checked})
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Delivery Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <Checkbox
                      checked={preferences.deliveryMethods.email}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences, 
                          deliveryMethods: {...preferences.deliveryMethods, email: !!checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span>In-App</span>
                    </div>
                    <Checkbox
                      checked={preferences.deliveryMethods.inApp}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences, 
                          deliveryMethods: {...preferences.deliveryMethods, inApp: !!checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>SMS</span>
                    </div>
                    <Checkbox
                      checked={preferences.deliveryMethods.sms}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences, 
                          deliveryMethods: {...preferences.deliveryMethods, sms: !!checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Webhook</span>
                    </div>
                    <Checkbox
                      checked={preferences.deliveryMethods.webhook}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences, 
                          deliveryMethods: {...preferences.deliveryMethods, webhook: !!checked}
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Frequency</h4>
                <Select 
                  value={preferences.frequency} 
                  onValueChange={(value) => 
                    setPreferences({...preferences, frequency: value as any})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="hourly">Hourly Digest</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowPreferences(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updatePreferences(preferences)}
                >
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
