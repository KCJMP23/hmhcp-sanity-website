"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Types
export type ChartData = {
  name: string
  value: number
  [key: string]: any
}

export type ChartType = "bar" | "line" | "area" | "pie" | "donut"

interface AnimatedChartProps {
  data: ChartData[]
  type: ChartType
  title?: string
  description?: string
  height?: number
  width?: string
  colors?: string[]
  dataKeys?: string[]
  showGrid?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  className?: string
}

// Default colors with dark mode support
const defaultColors = [
  "#3b82f6", // blue-500
  "#3B82F6", // violet-500
  "#ec4899", // pink-500
  "#3B82F6", // emerald-500
  "#3B82F6", // amber-500
  "#ef4444", // red-500
  "#6366f1", // indigo-500
]

export function AnimatedChart({
  data,
  type,
  title,
  description,
  height = 300,
  width = "100%",
  colors = defaultColors,
  dataKeys = ["value"],
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  className = "",
}: AnimatedChartProps) {
  const [isClient, setIsClient] = useState(false)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Handle SSR
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Animate data when in view
  useEffect(() => {
    if (inView) {
      setChartData(data)
    } else {
      setChartData(data.map((item) => ({ ...item, value: 0 })))
    }
  }, [inView, data])

  if (!isClient) {
    return <div className={`h-[${height}px] w-full bg-gray-100 dark:bg-gray-800 animate-pulse `} />
  }

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width={width} height={height}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" />
              <YAxis />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width={width} height={height}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" />
              <YAxis />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width={width} height={height}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" />
              <YAxis />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  stroke={colors[index % colors.length]}
                  fillOpacity={0.3}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      case "pie":
      case "donut":
        return (
          <ResponsiveContainer width={width} height={height}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={type === "donut" ? 80 : 100}
                innerRadius={type === "donut" ? 60 : 0}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return <div>Unsupported chart type</div>
    }
  }

  return (
    <div ref={ref} className={`bg-white dark:bg-gray-800  p-6 shadow-lg ${className}`}>
      {title && <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>}
      {description && <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        {renderChart()}
      </motion.div>
    </div>
  )
}
