// components/admin/analytics/kpi-widget.tsx
import React from 'react';

interface KPIMetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const KPIMetricCard: React.FC<KPIMetricCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  className = ''
}) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {change && (
        <p className={`text-sm ${trendColors[trend]}`}>
          {change}
        </p>
      )}
    </div>
  );
};

export default KPIMetricCard;