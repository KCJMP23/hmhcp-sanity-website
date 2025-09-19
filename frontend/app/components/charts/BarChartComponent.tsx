import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const barChartData = [
  { category: "Cardiology", value: 400 },
  { category: "Neurology", value: 300 },
  { category: "Oncology", value: 500 },
  { category: "Pediatrics", value: 280 },
  { category: "Orthopedics", value: 350 },
]

export default function BarChartComponent() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          }}
        />
        <Legend />
        <Bar dataKey="value" fill="#0066cc" />
      </BarChart>
    </ResponsiveContainer>
  )
}