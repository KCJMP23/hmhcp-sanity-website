import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const lineChartData = [
  { month: "Jan", patients: 65, outcomes: 78 },
  { month: "Feb", patients: 59, outcomes: 75 },
  { month: "Mar", patients: 80, outcomes: 83 },
  { month: "Apr", patients: 81, outcomes: 85 },
  { month: "May", patients: 56, outcomes: 70 },
  { month: "Jun", patients: 55, outcomes: 69 },
  { month: "Jul", patients: 40, outcomes: 60 },
  { month: "Aug", patients: 70, outcomes: 80 },
  { month: "Sep", patients: 90, outcomes: 92 },
  { month: "Oct", patients: 95, outcomes: 96 },
  { month: "Nov", patients: 100, outcomes: 98 },
  { month: "Dec", patients: 110, outcomes: 105 },
]

export default function LineChartComponent() {
  return (
    <ChartContainer
      config={{
        patients: {
          label: "Patient Volume",
          color: "hsl(var(--chart-1))",
        },
        outcomes: {
          label: "Positive Outcomes",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[300px] md:h-[400px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="patients"
            stroke="var(--color-patients)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="outcomes"
            stroke="var(--color-outcomes)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}