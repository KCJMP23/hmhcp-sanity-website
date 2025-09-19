// Alerts Widget Component
// Story 4.5: Real-Time Analytics & Monitoring

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Shield, 
  Database, 
  User,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { AlertsWidgetProps, AlertType, AlertSeverity } from '@/types/monitoring';

export function AlertsWidget({ 
  alerts, 
  severity, 
  maxAlerts = 10 
}: AlertsWidgetProps) {
  const filteredAlerts = useMemo(() => {
    return alerts
      .filter(alert => !alert.resolved)
      .filter(alert => severity ? alert.severity === severity : true)
      .slice(0, maxAlerts);
  }, [alerts, severity, maxAlerts]);

  const alertStats = useMemo(() => {
    const total = alerts.length;
    const unresolved = alerts.filter(a => !a.resolved).length;
    const critical = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
    const high = alerts.filter(a => a.severity === 'high' && !a.resolved).length;
    const medium = alerts.filter(a => a.severity === 'medium' && !a.resolved).length;
    const low = alerts.filter(a => a.severity === 'low' && !a.resolved).length;

    return { total, unresolved, critical, high, medium, low };
  }, [alerts]);

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.HIPAA_VIOLATION:
        return <Shield className="w-4 h-4 text-red-500" />;
      case AlertType.DATA_BREACH:
        return <Database className="w-4 h-4 text-red-500" />;
      case AlertType.ACCESS_VIOLATION:
        return <User className="w-4 h-4 text-orange-500" />;
      case AlertType.PERFORMANCE_THRESHOLD:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case AlertType.SYSTEM_ERROR:
        return <XCircle className="w-4 h-4 text-red-500" />;
      case AlertType.COMPLIANCE_VIOLATION:
        return <Shield className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'bg-red-100 text-red-800 border-red-200';
      case AlertSeverity.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case AlertSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case AlertSeverity.LOW:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertTypeLabel = (type: AlertType) => {
    switch (type) {
      case AlertType.HIPAA_VIOLATION:
        return 'HIPAA Violation';
      case AlertType.DATA_BREACH:
        return 'Data Breach';
      case AlertType.ACCESS_VIOLATION:
        return 'Access Violation';
      case AlertType.PERFORMANCE_THRESHOLD:
        return 'Performance Threshold';
      case AlertType.SYSTEM_ERROR:
        return 'System Error';
      case AlertType.COMPLIANCE_VIOLATION:
        return 'Compliance Violation';
      default:
        return type.replace('_', ' ').toUpperCase();
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleResolveAlert = (alertId: string) => {
    // In a real implementation, this would call an API to resolve the alert
    console.log('Resolving alert:', alertId);
  };

  return (
    <div className="space-y-4">
      {/* Alert Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {alertStats.unresolved}
          </div>
          <div className="text-xs text-gray-500">Unresolved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {alertStats.critical}
          </div>
          <div className="text-xs text-gray-500">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {alertStats.high}
          </div>
          <div className="text-xs text-gray-500">High</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {alertStats.medium}
          </div>
          <div className="text-xs text-gray-500">Medium</div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-sm">No {severity ? severity : ''} alerts</div>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`border-l-4 ${
                alert.severity === 'critical' ? 'border-l-red-500' :
                alert.severity === 'high' ? 'border-l-orange-500' :
                alert.severity === 'medium' ? 'border-l-yellow-500' :
                'border-l-blue-500'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.alert_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {getAlertTypeLabel(alert.alert_type)}
                        </h4>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {alert.alert_data?.message && (
                        <p className="text-sm text-gray-600 mb-2">
                          {alert.alert_data.message}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(alert.created_at)}</span>
                        </div>
                        {alert.alert_data?.source && (
                          <div>Source: {alert.alert_data.source}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveAlert(alert.id)}
                      className="text-xs"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Resolve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {alertStats.unresolved > 0 && (
        <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-200">
          {alertStats.unresolved} unresolved alert{alertStats.unresolved !== 1 ? 's' : ''}
          {alertStats.critical > 0 && ` • ${alertStats.critical} critical`}
        </div>
      )}
    </div>
  );
}
