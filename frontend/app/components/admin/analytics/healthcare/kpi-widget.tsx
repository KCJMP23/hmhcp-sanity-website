'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { HealthcareKPI } from '@/types/analytics';

interface KPIMetric {
  value: number;
  target: number;
  previousValue?: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
}

interface KPIWidgetProps {
  title: string;
  description?: string;
  metric: KPIMetric;
  icon?: React.ReactNode;
  className?: string;
}

export function KPIWidget({ 
  title, 
  description, 
  metric, 
  icon, 
  className = '' 
}: KPIWidgetProps) {
  const { value, target, previousValue, unit, trend, trendPercentage } = metric;

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTargetStatus = () => {
    if (value >= target) {
      return { status: 'achieved', color: 'bg-green-100 text-green-800' };
    } else if (value >= target * 0.8) {
      return { status: 'on-track', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'behind', color: 'bg-red-100 text-red-800' };
    }
  };

  const targetStatus = getTargetStatus();

  return (
    <Card className={`${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Main Value */}
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              {value.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">
              {unit}
            </span>
          </div>

          {/* Target Status */}
          <div className="flex items-center space-x-2">
            <Badge className={targetStatus.color}>
              Target: {target.toLocaleString()} {unit}
            </Badge>
            <span className="text-xs text-gray-500">
              {Math.round((value / target) * 100)}% of target
            </span>
          </div>

          {/* Trend */}
          {trend && trendPercentage !== undefined && (
            <div className={`flex items-center space-x-1 text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>
                {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
                {Math.abs(trendPercentage)}%
              </span>
              <span className="text-gray-500">vs previous period</span>
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-xs text-gray-500 mt-2">
              {description}
            </p>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                targetStatus.status === 'achieved' ? 'bg-green-500' :
                targetStatus.status === 'on-track' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ 
                width: `${Math.min(100, (value / target) * 100)}%` 
              }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface KPIGridProps {
  kpis: Array<{
    title: string;
    description?: string;
    metric: KPIMetric;
    icon?: React.ReactNode;
  }>;
  className?: string;
}

export function KPIGrid({ kpis, className = '' }: KPIGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {kpis.map((kpi, index) => (
        <KPIWidget
          key={index}
          title={kpi.title}
          description={kpi.description}
          metric={kpi.metric}
          icon={kpi.icon}
        />
      ))}
    </div>
  );
}

// Specialized KPI components for healthcare metrics
export function ClinicalEngagementKPI({ 
  totalProfessionals, 
  activeProfessionals, 
  averageSessionDuration 
}: {
  totalProfessionals: number;
  activeProfessionals: number;
  averageSessionDuration: number;
}) {
  const engagementRate = totalProfessionals > 0 ? (activeProfessionals / totalProfessionals) * 100 : 0;

  return (
    <KPIWidget
      title="Clinical Engagement"
      description="Healthcare professional engagement metrics"
      metric={{
        value: Math.round(engagementRate),
        target: 70,
        unit: '%',
        trend: engagementRate > 70 ? 'up' : engagementRate < 50 ? 'down' : 'stable',
        trendPercentage: 5.2
      }}
      icon={<TrendingUp className="h-4 w-4" />}
    />
  );
}

export function ContentPerformanceKPI({ 
  totalInteractions, 
  targetInteractions 
}: {
  totalInteractions: number;
  targetInteractions: number;
}) {
  return (
    <KPIWidget
      title="Content Performance"
      description="Total content interactions"
      metric={{
        value: totalInteractions,
        target: targetInteractions,
        unit: 'interactions',
        trend: totalInteractions > targetInteractions ? 'up' : 'down',
        trendPercentage: 12.5
      }}
    />
  );
}

export function ComplianceKPI({ 
  complianceScore, 
  targetScore = 95 
}: {
  complianceScore: number;
  targetScore?: number;
}) {
  return (
    <KPIWidget
      title="Compliance Score"
      description="Overall compliance and security score"
      metric={{
        value: complianceScore,
        target: targetScore,
        unit: '%',
        trend: complianceScore >= targetScore ? 'up' : complianceScore < 80 ? 'down' : 'stable',
        trendPercentage: 2.1
      }}
    />
  );
}

export function PlatformUsageKPI({ 
  platformName, 
  activeUsers, 
  targetUsers 
}: {
  platformName: string;
  activeUsers: number;
  targetUsers: number;
}) {
  return (
    <KPIWidget
      title={`${platformName} Usage`}
      description="Active users on platform"
      metric={{
        value: activeUsers,
        target: targetUsers,
        unit: 'users',
        trend: activeUsers > targetUsers ? 'up' : activeUsers < targetUsers * 0.8 ? 'down' : 'stable',
        trendPercentage: 8.3
      }}
    />
  );
}
