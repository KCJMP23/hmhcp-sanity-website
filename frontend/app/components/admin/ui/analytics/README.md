# Analytics Visualization Components

Healthcare-compliant analytics visualization components for the HMHCP admin interface. Built with Recharts, TypeScript, and Tailwind CSS with HIPAA compliance features.

## Task Implementation

This implements **Task 6** from **Story 1.3**: Build analytics visualization components for the admin interface.

## Components Overview

### Chart Components

#### 📈 AdminLineChart
Displays trend data over time with interactive features.

**Features:**
- Multiple line series support
- HIPAA compliance mode for PHI data
- Interactive tooltips and legends  
- Export to PNG/SVG/CSV
- Zoom and brush controls
- Reference lines for benchmarks

```tsx
import { AdminLineChart } from '@/components/admin/ui/analytics'

const data = [
  { month: '2024-01', patientVisits: 120, screenings: 45 },
  { month: '2024-02', patientVisits: 135, screenings: 52 },
]

const series = [
  { dataKey: 'patientVisits', name: 'Patient Visits', color: '#0ea5e9', hipaaCompliance: 'restricted' },
  { dataKey: 'screenings', name: 'Health Screenings', color: '#10b981', hipaaCompliance: 'phi' },
]

<AdminLineChart 
  data={data} 
  series={series}
  title="Patient Care Metrics"
  hipaaMode={true}
  showExport={true}
/>
```

#### 📊 AdminBarChart
Displays comparison data with grouped, stacked, or percentage modes.

**Features:**
- Grouped, stacked, and percentage bar charts
- Horizontal and vertical orientations
- Sorting and filtering capabilities
- Interactive bar selection

```tsx
<AdminBarChart 
  data={departmentData} 
  series={series}
  title="Department Performance"
  chartType="grouped"
  layout="vertical"
  hipaaMode={true}
/>
```

#### 🥧 AdminPieChart
Shows distribution data with pie or donut chart variations.

**Features:**
- Pie and donut chart types
- Interactive segment highlighting
- Active shape animations
- Customizable legends and tooltips

```tsx
<AdminPieChart 
  data={distributionData} 
  title="Patient Distribution by Department"
  chartType="donut"
  showPercentages={true}
  interactive={true}
/>
```

#### 📈 AdminAreaChart  
Visualizes cumulative data with area fills and stacking.

**Features:**
- Standard, stacked, and percentage area charts
- Gradient fills for enhanced visualization
- Multiple area series support
- Smooth curve interpolation

```tsx
<AdminAreaChart 
  data={cumulativeData} 
  series={series}
  title="Patient Flow Analysis" 
  chartType="stacked"
  useGradients={true}
/>
```

#### 🔥 AdminHeatmap
Displays density data with customizable color schemes.

**Features:**
- Customizable cell sizes and colors
- Interactive cell selection
- Healthcare-specific color schemes
- Zoom and pan controls
- HIPAA compliance indicators

```tsx
<AdminHeatmap 
  data={densityData} 
  title="Appointment Density by Time"
  colorScheme="healthcare"
  interactive={true}
  showValues={true}
/>
```

### KPI Component

#### 📊 AdminKPICard
Displays key performance indicators with trends and targets.

**Features:**
- Trend indicators with period comparisons
- Target tracking with progress bars
- Status indicators for critical metrics
- Healthcare-specific formatting
- Interactive drill-down capabilities

```tsx
<AdminKPICard
  title="Patient Satisfaction"
  value={4.7}
  unit="/ 5.0"
  icon={Heart}
  trend={{ current: 4.7, previous: 4.5, periodLabel: "vs last month" }}
  target={{ value: 4.5, type: "minimum" }}
  colorScheme="healthcare"
  showProgress={true}
  hipaaMode={true}
/>
```

### Enhancement Components

#### 💬 ChartTooltip
Interactive tooltips for all chart components.

**Features:**
- HIPAA compliance indicators
- Healthcare-specific formatting
- Animated appearance
- Customizable content and styling

#### 🏷️ ChartLegend
Interactive legends with show/hide functionality.

**Features:**
- Interactive visibility toggles
- HIPAA compliance badges
- Multiple layout options
- Healthcare-specific styling

## HIPAA Compliance Features

All components include robust HIPAA compliance features:

### Data Anonymization
- **PHI Data**: Automatically rounds values to nearest 10 for anonymization
- **Restricted Data**: Adds compliance badges and warnings
- **Public Data**: No modifications needed

### Compliance Indicators
- **Shield Icons**: Indicate protected health information
- **Compliance Badges**: Show data sensitivity levels
- **Anonymization Warnings**: Alert users when data has been modified

### Usage Example with HIPAA
```tsx
const patientData = [
  { 
    date: '2024-01',
    patientCount: 127, // Will be rounded to 130 in HIPAA mode
    hipaaCompliance: 'phi' 
  }
]

<AdminLineChart
  data={patientData}
  series={[{ dataKey: 'patientCount', name: 'Patients', hipaaCompliance: 'phi' }]}
  hipaaMode={true} // Enables compliance features
  showExport={true}
/>
```

## Export Functionality

All chart components support multiple export formats:

- **CSV**: Raw data export for analysis
- **PNG**: High-quality image export
- **SVG**: Vector format for scalability

Export handlers automatically include HIPAA compliance notices when applicable.

## Color Schemes

### Healthcare (Default)
Professional blue-based palette suitable for medical applications:
- Primary: `#0369a1` (Deep Blue)
- Success: `#059669` (Medical Green)  
- Warning: `#dc2626` (Alert Red)

### Accessible
High-contrast grayscale palette for accessibility compliance:
- Ensures WCAG 2.1 AA compliance
- Works with screen readers
- Suitable for colorblind users

### Custom
Allows full customization of color palettes for brand compliance.

## Responsive Design

All components are fully responsive:
- **Mobile-first**: Optimized for small screens
- **Adaptive layouts**: Automatically adjust to container size
- **Touch-friendly**: Interactive elements sized for touch devices

## Performance Features

- **Lazy loading**: Components only render when visible
- **Memoization**: Prevents unnecessary re-renders
- **Virtual scrolling**: For large datasets
- **Optimized animations**: Smooth 60fps animations

## Accessibility Features

- **ARIA labels**: Comprehensive screen reader support
- **Keyboard navigation**: Full keyboard accessibility
- **High contrast support**: Works with accessibility preferences
- **Focus indicators**: Clear focus states for all interactive elements

## Installation & Dependencies

The components use the following dependencies:
- `recharts` (^3.0.2) - Chart rendering library
- `@radix-ui/*` - UI primitives
- `lucide-react` - Icon library
- `tailwindcss` - Styling framework

All dependencies are already included in the project.

## Example Dashboard Implementation

```tsx
import { 
  AdminLineChart, 
  AdminBarChart, 
  AdminKPICard, 
  HealthcareKPIPresets 
} from '@/components/admin/ui/analytics'

export function HealthcareDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* KPI Cards */}
      <HealthcareKPIPresets.PatientSatisfaction
        title="Patient Satisfaction"
        value={4.7}
        trend={{ current: 4.7, previous: 4.5 }}
        hipaaMode={true}
      />
      
      <HealthcareKPIPresets.PatientVolume
        title="Daily Patient Volume"
        value={284}
        target={{ value: 300, type: "minimum" }}
        showProgress={true}
      />
      
      {/* Charts */}
      <div className="md:col-span-2 lg:col-span-4">
        <AdminLineChart
          data={trendData}
          series={trendSeries}
          title="Patient Care Trends"
          height={400}
          hipaaMode={true}
        />
      </div>
      
      <div className="md:col-span-2">
        <AdminBarChart
          data={departmentData}
          series={departmentSeries}
          title="Department Performance"
          chartType="grouped"
        />
      </div>
    </div>
  )
}
```

## File Structure

```
components/admin/ui/analytics/
├── AdminLineChart.tsx      # Line chart component
├── AdminBarChart.tsx       # Bar chart component  
├── AdminPieChart.tsx       # Pie/donut chart component
├── AdminAreaChart.tsx      # Area chart component
├── AdminHeatmap.tsx        # Heatmap visualization
├── AdminKPICard.tsx        # KPI card component
├── ChartTooltip.tsx        # Interactive tooltips
├── ChartLegend.tsx         # Chart legends
├── index.ts                # Exports
└── README.md              # Documentation
```

## Best Practices

1. **Always use HIPAA mode** when displaying patient data
2. **Implement proper error boundaries** around chart components
3. **Use healthcare color scheme** for medical applications
4. **Provide export functionality** for data analysis
5. **Include accessibility features** for compliance
6. **Test with screen readers** to ensure accessibility
7. **Optimize for mobile devices** with responsive design

## Support

For questions or issues with these components, refer to:
- Component TypeScript interfaces for prop documentation
- Healthcare compliance guidelines in HIPAA documentation
- Accessibility standards in WCAG 2.1 documentation