// Analytics Visualization Components for HMHCP Admin Interface
// Task 6 from Story 1.3 - Healthcare-compliant chart components with HIPAA support

// Chart Components
export { AdminLineChart, type AdminLineChartProps, type LineDataPoint, type LineSeriesConfig } from './AdminLineChart'
export { AdminBarChart, type AdminBarChartProps, type BarDataPoint, type BarSeriesConfig } from './AdminBarChart'
export { AdminPieChart, type AdminPieChartProps, type PieDataPoint } from './AdminPieChart'
export { AdminAreaChart, type AdminAreaChartProps, type AreaDataPoint, type AreaSeriesConfig } from './AdminAreaChart'
export { AdminHeatmap, type AdminHeatmapProps, type HeatmapDataPoint } from './AdminHeatmap'

// KPI Component
export { AdminKPICard, type AdminKPICardProps, type KPITarget, type KPITrend, HealthcareKPIPresets } from './AdminKPICard'

// Chart Enhancement Components
export { ChartTooltip, type ChartTooltipProps, HealthcareTooltipPresets } from './ChartTooltip'
export { ChartLegend, type ChartLegendProps, type LegendItem, HealthcareLegendPresets } from './ChartLegend'

// Default exports for convenience
export {
  AdminLineChart as LineChart,
  AdminBarChart as BarChart,
  AdminPieChart as PieChart,
  AdminAreaChart as AreaChart,
  AdminHeatmap as Heatmap,
  AdminKPICard as KPICard
}