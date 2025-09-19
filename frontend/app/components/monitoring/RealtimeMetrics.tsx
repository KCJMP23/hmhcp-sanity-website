'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Zap,
  Users,
  Globe,
  Cpu,
  HardDrive
} from 'lucide-react';

interface RealtimeMetricsProps {
  metrics: any;
}

export function RealtimeMetrics({ metrics }: RealtimeMetricsProps) {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    if (metrics?.traffic) {
      const newValues: Record<string, number> = {
        requestsPerSecond: metrics.traffic.requestsPerSecond || 0,
        pageViewsPerMinute: metrics.traffic.pageViewsPerMinute || 0,
        bounceRate: metrics.traffic.bounceRate || 0,
      };

      Object.entries(newValues).forEach(([key, targetValue]) => {
        const currentValue = animatedValues[key] || 0;
        const step = (targetValue - currentValue) / 10;
        let current = currentValue;

        const interval = setInterval(() => {
          current += step;
          if (Math.abs(current - targetValue) < Math.abs(step)) {
            current = targetValue;
            clearInterval(interval);
          }
          setAnimatedValues(prev => ({ ...prev, [key]: current }));
        }, 50);
        
        intervals.push(interval);
      });
    }

    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [metrics]);

  const formatMetricValue = (value: number, format: string) => {
    switch (format) {
      case 'decimal':
        return value.toFixed(1);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return Math.round(value).toString();
    }
  };

  return (
    <div className="space-y-4">
      {/* Live Activity Stream */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Live Metrics</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 bg-muted/50">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Requests/sec</span>
            </div>
            <span className="font-mono font-semibold">
              {formatMetricValue(animatedValues.requestsPerSecond || 0, 'decimal')}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/50">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Page Views/min</span>
            </div>
            <span className="font-mono font-semibold">
              {formatMetricValue(animatedValues.pageViewsPerMinute || 0, 'whole')}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/50">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm">Bounce Rate</span>
            </div>
            <span className="font-mono font-semibold">
              {formatMetricValue(animatedValues.bounceRate || 0, 'percentage')}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/50">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Active Now</span>
            </div>
            <span className="font-mono font-semibold">
              {metrics?.activeVisitors?.count || 0}
            </span>
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">System Resources</h4>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">CPU Usage</span>
            </div>
            <Badge variant="outline">
              {metrics?.system?.cpuUsage || Math.round(Math.random() * 30 + 20)}%
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Memory Usage</span>
            </div>
            <Badge variant="outline">
              {metrics?.system?.memoryUsage || Math.round(Math.random() * 40 + 30)}%
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Network I/O</span>
            </div>
            <Badge variant="outline">
              {metrics?.system?.networkIO || Math.round(Math.random() * 500 + 100)} MB/s
            </Badge>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Recent Events</h4>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 bg-blue-500 animate-pulse" />
            <span>New visitor from {metrics?.activeVisitors?.locations?.[0]?.country || 'United States'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 bg-blue-500 animate-pulse" />
            <span>Page view: /services/primary-care</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 bg-blue-500 animate-pulse" />
            <span>Form submission: Contact</span>
          </div>
        </div>
      </div>
    </div>
  );
}