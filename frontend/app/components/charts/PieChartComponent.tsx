import {
  Pie,
  PieChart,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const pieChartData = [
  { name: "Clinical Trials", value: 45 },
  { name: "Quality Studies", value: 30 },
  { name: "Publications", value: 25 },
]

const COLORS = ["#0066cc", "#5856d6", "#ff2d55"]

export default function PieChartComponent() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={pieChartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
        >
          {pieChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}