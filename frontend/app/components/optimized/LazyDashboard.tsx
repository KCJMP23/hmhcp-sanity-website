'use client';

import { Suspense, lazy, useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { BarChart3 } from 'lucide-react';

// Lazy load heavy dashboard components
const AnalyticsChart = lazy(() => 
  import('@/components/charts/LineChartComponent').then(module => ({
    default: module.default
  }))
);

const DataTable = lazy(() => 
  import('@/components/ui/table').then(module => ({
    default: module.Table
  }))
);

const StatCard = lazy(() => 
  import('@/components/admin/dashboard-widgets/stat-card').then(module => ({
    default: module.StatCard
  }))
);

// Loading skeletons for each component type
const ChartSkeleton = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full" />
);

const TableSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="animate-pulse bg-gray-200 rounded h-12 w-full" />
    ))}
  </div>
);

const StatCardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32 w-full" />
    ))}
  </div>
);

interface LazyDashboardProps {
  data?: any;
  variant?: 'analytics' | 'healthcare' | 'research';
}

export default function LazyDashboard({ data, variant = 'analytics' }: LazyDashboardProps) {
  // Use intersection observer for viewport-based loading
  const { ref: chartRef, inView: chartInView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const { ref: tableRef, inView: tableInView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Preload components on hover
  const handlePreload = () => {
    import('@/components/charts/LineChartComponent');
    import('@/components/ui/table');
    import('@/components/admin/dashboard-widgets/stat-card');
  };

  // Progressive enhancement - load critical components first
  const [criticalLoaded, setCriticalLoaded] = useState(false);

  useEffect(() => {
    // Load critical components after initial render
    const timer = setTimeout(() => {
      setCriticalLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="space-y-6 p-6"
      onMouseEnter={handlePreload}
    >
      {/* Critical content - Stats Cards */}
      {criticalLoaded && (
        <Suspense fallback={<StatCardSkeleton />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Sample Metric" 
              value="123" 
              change="+12%"
              trend="up"
              icon={() => <BarChart3 className="w-6 h-6 text-blue-600" />}
              color="bg-blue-500"
            />
          </div>
        </Suspense>
      )}

      {/* Analytics Chart - Load when in viewport */}
      <div ref={chartRef}>
        {chartInView && (
          <Suspense fallback={<ChartSkeleton />}>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                {variant === 'healthcare' ? 'Patient Metrics' : 'Analytics Overview'}
              </h2>
              <AnalyticsChart />
            </div>
          </Suspense>
        )}
      </div>

      {/* Data Table - Load when in viewport */}
      <div ref={tableRef}>
        {tableInView && (
          <Suspense fallback={<TableSkeleton />}>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                {variant === 'healthcare' ? 'Clinical Data' : 'Recent Activity'}
              </h2>
              <DataTable>
                <div>Sample table content</div>
              </DataTable>
            </div>
          </Suspense>
        )}
      </div>

      {/* Additional lazy-loaded sections based on variant */}
      {variant === 'healthcare' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Healthcare Features</h2>
          <p className="text-gray-600">Healthcare-specific components will be available soon.</p>
        </div>
      )}

      {variant === 'research' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Research Features</h2>
          <p className="text-gray-600">Research-specific components will be available soon.</p>
        </div>
      )}
    </div>
  );
}

