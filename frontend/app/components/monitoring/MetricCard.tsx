'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  threshold?: number;
  format?: 'number' | 'percentage' | 'latency' | 'currency';
  severity?: 'normal' | 'warning' | 'high';
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  threshold,
  format = 'number',
  severity = 'normal',
  loading = false,
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percentage':
        return `${val}%`;
      case 'latency':
        return `${val}ms`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getValueColor = () => {
    if (severity === 'high') return 'text-red-600';
    if (severity === 'warning') return 'text-blue-600';
    
    if (threshold && typeof value === 'number') {
      return value > threshold ? 'text-red-600' : 'text-blue-600';
    }
    
    return '';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/2 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${getValueColor()}`}>
          {formatValue(value)}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {getTrendIcon()}
            <span className="text-xs text-muted-foreground">
              vs last period
            </span>
          </div>
        )}
        {threshold && (
          <p className="text-xs text-muted-foreground mt-1">
            Threshold: {formatValue(threshold)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}