'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer } from '@/components/ui/chart';
import { LineChart, AreaChart, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';

interface PerformanceChartProps {
  timeRange?: '1h' | '6h' | '24h' | '7d';
}

export function PerformanceChart({ timeRange: initialTimeRange = '24h' }: PerformanceChartProps) {
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [metric, setMetric] = useState<'response' | 'vitals' | 'errors'>('response');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange, metric]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/monitoring/metrics?timeRange=${timeRange}&metric=${metric}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.data || []);
      }
    } catch (error) {
      logger.error('Failed to fetch performance data:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxisTick = (timestamp: string) => {
    const date = new Date(timestamp);
    switch (timeRange) {
      case '1h':
        return format(date, 'HH:mm');
      case '6h':
      case '24h':
        return format(date, 'HH:mm');
      case '7d':
        return format(date, 'MM/dd');
      default:
        return format(date, 'HH:mm');
    }
  };

  const formatTooltipLabel = (value: number, name: string) => {
    switch (name) {
      case 'Response Time':
      case 'LCP':
      case 'FID':
      case 'TTFB':
        return `${value}ms`;
      case 'CLS':
        return value.toFixed(3);
      case 'Error Rate':
        return `${value}%`;
      default:
        return value;
    }
  };

  const getChartData = () => {
    if (metric === 'response') {
      return data.map(item => ({
        timestamp: item.timestamp,
        'Response Time': item.avgResponseTime,
        'P95 Response': item.p95ResponseTime,
        'P99 Response': item.p99ResponseTime,
      }));
    } else if (metric === 'vitals') {
      return data.map(item => ({
        timestamp: item.timestamp,
        LCP: item.lcp,
        FID: item.fid,
        CLS: item.cls,
        TTFB: item.ttfb,
      }));
    } else {
      return data.map(item => ({
        timestamp: item.timestamp,
        'Error Rate': item.errorRate,
        'Total Errors': item.errorCount,
      }));
    }
  };

  const chartData = getChartData();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance Metrics</CardTitle>
          <div className="flex gap-2">
            <Select value={metric} onValueChange={(value: any) => setMetric(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="response">Response Times</SelectItem>
                <SelectItem value="vitals">Core Web Vitals</SelectItem>
                <SelectItem value="errors">Error Rates</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="6h">Last 6 Hours</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading performance data...</div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-96 flex items-center justify-center">
            <p className="text-muted-foreground">No data available for the selected time range</p>
          </div>
        ) : (
          <div className="h-96">
            <ChartContainer
              config={{
                primary: {
                  label: metric === 'response' ? 'Response Time' : metric === 'vitals' ? 'Web Vitals' : 'Error Rate',
                  color: '#3b82f6',
                },
              }}
              className="h-full w-full"
            >
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-blue-200 dark:border-gray-600">
                <div className="text-center p-8">
                  <div className="mb-4">
                    {metric === 'errors' ? (
                      <AreaChart className="mx-auto h-16 w-16 text-blue-500" />
                    ) : (
                      <LineChart className="mx-auto h-16 w-16 text-blue-500" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {metric === 'response' ? 'Response Time Metrics' : 
                     metric === 'vitals' ? 'Core Web Vitals' : 
                     'Error Rate Analysis'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                    Performance data for the last {timeRange} with {chartData.length} data points
                  </p>
                  <div className="mt-4 text-sm text-blue-600 dark:text-blue-400">
                    <Activity className="inline mr-1 h-4 w-4" />
                    Real-time monitoring dashboard
                  </div>
                </div>
              </div>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}