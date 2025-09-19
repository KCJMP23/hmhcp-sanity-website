'use client'

import React from 'react'
import { Heart, Users, Clock, DollarSign, Activity } from 'lucide-react'
import {
  AdminLineChart,
  AdminBarChart,
  AdminPieChart,
  AdminAreaChart,
  AdminHeatmap,
  AdminKPICard,
  HealthcareKPIPresets
} from './index'

/**
 * Example usage of Analytics Visualization Components
 * This demonstrates how to implement healthcare-compliant analytics in the admin interface
 */

// Sample data for demonstrations
const lineChartData = [
  { month: '2024-01', patientVisits: 120, screenings: 45, satisfaction: 4.2 },
  { month: '2024-02', patientVisits: 135, screenings: 52, satisfaction: 4.3 },
  { month: '2024-03', patientVisits: 98, screenings: 38, satisfaction: 4.1 },
  { month: '2024-04', patientVisits: 142, screenings: 58, satisfaction: 4.5 },
  { month: '2024-05', patientVisits: 156, screenings: 62, satisfaction: 4.6 },
  { month: '2024-06', patientVisits: 189, screenings: 71, satisfaction: 4.7 },
]

const lineChartSeries = [
  { 
    dataKey: 'patientVisits', 
    name: 'Patient Visits', 
    color: '#0ea5e9', 
    hipaaCompliance: 'restricted' as const
  },
  { 
    dataKey: 'screenings', 
    name: 'Health Screenings', 
    color: '#10b981', 
    hipaaCompliance: 'phi' as const
  },
  { 
    dataKey: 'satisfaction', 
    name: 'Satisfaction Score', 
    color: '#f59e0b', 
    hipaaCompliance: 'public' as const
  },
]

const barChartData = [
  { department: 'Cardiology', patients: 120, revenue: 45000, satisfaction: 4.7 },
  { department: 'Oncology', patients: 98, revenue: 62000, satisfaction: 4.5 },
  { department: 'Emergency', patients: 187, revenue: 28000, satisfaction: 4.2 },
  { department: 'Pediatrics', patients: 156, revenue: 35000, satisfaction: 4.8 },
  { department: 'Orthopedics', patients: 89, revenue: 41000, satisfaction: 4.6 },
]

const barChartSeries = [
  { 
    dataKey: 'patients', 
    name: 'Patient Count', 
    color: '#0ea5e9', 
    hipaaCompliance: 'phi' as const
  },
  { 
    dataKey: 'satisfaction', 
    name: 'Satisfaction Score', 
    color: '#10b981', 
    hipaaCompliance: 'public' as const
  },
]

const pieChartData = [
  { name: 'Cardiology', value: 120, hipaaCompliance: 'restricted' as const },
  { name: 'Oncology', value: 98, hipaaCompliance: 'phi' as const },
  { name: 'Emergency', value: 187, hipaaCompliance: 'public' as const },
  { name: 'Pediatrics', value: 156, hipaaCompliance: 'phi' as const },
  { name: 'Orthopedics', value: 89, hipaaCompliance: 'restricted' as const },
]

const areaChartData = [
  { month: '2024-01', newPatients: 45, returningPatients: 75, totalRevenue: 120000 },
  { month: '2024-02', newPatients: 52, returningPatients: 83, totalRevenue: 135000 },
  { month: '2024-03', newPatients: 38, returningPatients: 60, totalRevenue: 98000 },
  { month: '2024-04', newPatients: 58, returningPatients: 84, totalRevenue: 142000 },
  { month: '2024-05', newPatients: 62, returningPatients: 94, totalRevenue: 156000 },
  { month: '2024-06', newPatients: 71, returningPatients: 118, totalRevenue: 189000 },
]

const areaChartSeries = [
  { 
    dataKey: 'newPatients', 
    name: 'New Patients', 
    fill: '#0ea5e9', 
    stackId: 'patients',
    hipaaCompliance: 'phi' as const
  },
  { 
    dataKey: 'returningPatients', 
    name: 'Returning Patients', 
    fill: '#10b981', 
    stackId: 'patients',
    hipaaCompliance: 'phi' as const
  },
]

const heatmapData = [
  { row: 'Monday', column: '9 AM', value: 23, hipaaCompliance: 'restricted' as const },
  { row: 'Monday', column: '10 AM', value: 45, hipaaCompliance: 'phi' as const },
  { row: 'Monday', column: '11 AM', value: 67, hipaaCompliance: 'phi' as const },
  { row: 'Monday', column: '2 PM', value: 34, hipaaCompliance: 'public' as const },
  { row: 'Tuesday', column: '9 AM', value: 12, hipaaCompliance: 'restricted' as const },
  { row: 'Tuesday', column: '10 AM', value: 28, hipaaCompliance: 'phi' as const },
  { row: 'Tuesday', column: '11 AM', value: 56, hipaaCompliance: 'phi' as const },
  { row: 'Tuesday', column: '2 PM', value: 41, hipaaCompliance: 'public' as const },
  { row: 'Wednesday', column: '9 AM', value: 18, hipaaCompliance: 'restricted' as const },
  { row: 'Wednesday', column: '10 AM', value: 39, hipaaCompliance: 'phi' as const },
  { row: 'Wednesday', column: '11 AM', value: 72, hipaaCompliance: 'phi' as const },
  { row: 'Wednesday', column: '2 PM', value: 29, hipaaCompliance: 'public' as const },
]

export function AnalyticsExamples() {
  return (
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Healthcare Analytics Dashboard</h1>
        <p className="text-gray-600">
          Comprehensive analytics visualization components with HIPAA compliance features
        </p>
      </div>

      {/* KPI Cards Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <HealthcareKPIPresets.PatientSatisfaction
            title="Patient Satisfaction"
            value={4.7}
            trend={{ current: 4.7, previous: 4.5, periodLabel: "vs last month" }}
            target={{ value: 4.5, type: "minimum" }}
            showProgress={true}
            hipaaMode={true}
            clickable={true}
            onClick={() => console.log('Drill down to satisfaction details')}
          />
          
          <HealthcareKPIPresets.PatientVolume
            title="Daily Patients"
            value={284}
            trend={{ current: 284, previous: 267 }}
            target={{ value: 300, type: "minimum" }}
            showProgress={true}
            status="warning"
          />
          
          <HealthcareKPIPresets.AverageWaitTime
            title="Avg Wait Time"
            value={18}
            trend={{ current: 18, previous: 22 }}
            target={{ value: 15, type: "maximum" }}
            showProgress={true}
            status="good"
          />
          
          <HealthcareKPIPresets.Revenue
            title="Monthly Revenue"
            value={1456789}
            trend={{ current: 1456789, previous: 1234567 }}
            status="good"
          />
        </div>
      </section>

      {/* Line Chart Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Trend Analysis</h2>
        <AdminLineChart 
          data={lineChartData} 
          series={lineChartSeries}
          title="Patient Care Metrics Over Time"
          description="Monthly trends for key healthcare metrics with HIPAA compliance"
          height={400}
          xAxisLabel="Month"
          yAxisLabel="Count / Score"
          showBrush={true}
          hipaaMode={true}
          showExport={true}
          referenceLines={[
            { value: 4.5, color: '#10b981', label: 'Target Satisfaction' }
          ]}
          onExport={(format) => console.log(`Exporting line chart as ${format}`)}
          onDataPointClick={(data) => console.log('Data point clicked:', data)}
        />
      </section>

      {/* Bar Chart Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Department Comparison</h2>
        <AdminBarChart 
          data={barChartData} 
          series={barChartSeries}
          title="Performance by Department"
          description="Comparison of patient volumes and satisfaction across departments"
          height={400}
          chartType="grouped"
          layout="vertical"
          sortBy="value"
          sortDirection="desc"
          hipaaMode={true}
          showExport={true}
          onBarClick={(data, seriesKey) => console.log('Bar clicked:', data, seriesKey)}
        />
      </section>

      {/* Pie Chart Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Distribution Analysis</h2>
        <AdminPieChart 
          data={pieChartData} 
          title="Patient Distribution by Department"
          description="Breakdown of patient visits across medical departments"
          height={400}
          chartType="donut"
          showPercentages={true}
          showValues={false}
          interactive={true}
          allowHide={true}
          hipaaMode={true}
          showExport={true}
          onSegmentClick={(data, index) => console.log('Pie segment clicked:', data, index)}
        />
      </section>

      {/* Area Chart Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Cumulative Analysis</h2>
        <AdminAreaChart 
          data={areaChartData} 
          series={areaChartSeries}
          title="Patient Growth Over Time"
          description="Stacked view of new vs returning patient growth"
          height={400}
          chartType="stacked"
          useGradients={true}
          showBrush={true}
          hipaaMode={true}
          showExport={true}
        />
      </section>

      {/* Heatmap Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Density Visualization</h2>
        <AdminHeatmap 
          data={heatmapData} 
          title="Appointment Density by Day and Time"
          description="Visual representation of appointment booking patterns"
          height={300}
          colorScheme="healthcare"
          showValues={true}
          interactive={true}
          cellSize={60}
          hipaaMode={true}
          showExport={true}
          onCellClick={(data) => console.log('Heatmap cell clicked:', data)}
        />
      </section>

      {/* HIPAA Compliance Notice */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <Heart className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">HIPAA Compliance Features</h3>
        </div>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Data Anonymization</strong>: PHI data is automatically rounded for compliance</p>
          <p>• <strong>Access Controls</strong>: Compliance badges indicate data sensitivity levels</p>
          <p>• <strong>Audit Trails</strong>: All interactions are logged for compliance reporting</p>
          <p>• <strong>Export Controls</strong>: Exported data includes compliance notices</p>
        </div>
      </section>
    </div>
  )
}

export default AnalyticsExamples