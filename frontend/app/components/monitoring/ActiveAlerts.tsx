'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  XCircle,
  Clock,
  User
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { logger } from '@/lib/logger';

interface Alert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  triggered_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  acknowledged_by?: string;
  threshold_value?: number;
  current_value?: number;
  details?: any;
}

interface ActiveAlertsProps {
  limit?: number;
}

export function ActiveAlerts({ limit }: ActiveAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('active');

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const status = filter === 'all' ? undefined : filter;
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`/api/monitoring/alerts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      logger.error('Failed to fetch alerts:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    } finally {
      setLoading(false);
    }
  };

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve') => {
    try {
      const response = await fetch('/api/monitoring/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action }),
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      logger.error('Failed to update alert:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-blue-900 dark:text-blue-200';
      case 'high':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getStatusBadge = (alert: Alert) => {
    if (alert.status === 'resolved') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Resolved
        </Badge>
      );
    } else if (alert.status === 'acknowledged') {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <User className="h-3 w-3" />
          Acknowledged
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Alerts
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === 'active' ? 'default' : 'outline'}
              onClick={() => setFilter('active')}
            >
              Active
            </Button>
            <Button
              size="sm"
              variant={filter === 'acknowledged' ? 'default' : 'outline'}
              onClick={() => setFilter('acknowledged')}
            >
              Acknowledged
            </Button>
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading alerts...</div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <CheckCircle className="h-8 w-8 text-blue-600 mb-2" />
            <p className="text-sm text-muted-foreground">No {filter !== 'all' ? filter : ''} alerts</p>
          </div>
        ) : (
          <ScrollArea className={limit ? 'h-64' : 'h-96'}>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 border space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2  ${getSeverityColor(alert.severity)}`}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{alert.title}</h4>
                          {getStatusBadge(alert)}
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        {alert.threshold_value && alert.current_value && (
                          <p className="text-xs text-muted-foreground">
                            Current: {alert.current_value} / Threshold: {alert.threshold_value}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {alert.alert_type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
                      </span>
                      {alert.acknowledged_by && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {alert.acknowledged_by}
                        </span>
                      )}
                    </div>
                    
                    {alert.status === 'active' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                        >
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAlertAction(alert.id, 'resolve')}
                        >
                          Resolve
                        </Button>
                      </div>
                    )}
                    
                    {alert.status === 'acknowledged' && (
                      <Button
                        size="sm"
                        onClick={() => handleAlertAction(alert.id, 'resolve')}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}