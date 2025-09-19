'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import {
  Webhook, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp
} from 'lucide-react';

interface WebhookStatsProps {
  refreshKey: number;
}

interface Stats {
  total_webhooks: number;
  active_webhooks: number;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  average_response_time_ms: number;
  delivery_rate: number;
}

export function WebhookStats({ refreshKey }: WebhookStatsProps) {
  const [stats, setStats] = useState<Stats>({
    total_webhooks: 0,
    active_webhooks: 0,
    total_deliveries: 0,
    successful_deliveries: 0,
    failed_deliveries: 0,
    average_response_time_ms: 0,
    delivery_rate: 0
  });

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/cms/webhooks/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      logger.error('Failed to load webhook stats:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    }
  };

  const statCards = [
    {
      label: 'Total Webhooks',
      value: stats.total_webhooks,
      icon: Webhook,
      color: 'blue'
    },
    {
      label: 'Active',
      value: stats.active_webhooks,
      icon: CheckCircle,
      color: 'green'
    },
    {
      label: 'Success Rate',
      value: `${stats.delivery_rate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'indigo'
    },
    {
      label: 'Avg Response Time',
      value: `${stats.average_response_time_ms.toFixed(0)}ms`,
      icon: Clock,
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3  bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}