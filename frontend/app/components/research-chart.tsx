"use client"

import { useState, useEffect } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { motion } from "framer-motion"
import { Typography } from "@/components/ui/apple-typography"

interface ResearchChartProps {
  data: any[]
  type?: "line" | "area"
  colors?: {
    primary: string
    secondary?: string
  }
  animated?: boolean
  height?: number
  title?: string
  description?: string
}

export function ResearchChart({
  data,
  type = "line",
  colors = { primary: "hsl(var(--chart-1))", secondary: "hsl(var(--chart-2))" },
  animated = true,
  height = 300,
  title,
  description,
}: ResearchChartProps) {
  const [chartData, setChartData] = useState(animated ? [] : data)

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setChartData(data)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [animated, data])

  return (
    <div className="w-full">
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Typography as="h3" variant="heading3" className="mb-2">
                {title}
              </Typography>
            </motion.div>
          )}
          {description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Typography as="p" variant="body">
                {description}
              </Typography>
            </motion.div>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 border border-white/20 dark:border-white/10 shadow-lg"
      >
        <ChartContainer
          config={{
            value: {
              label: "Value",
              color: colors.primary,
            },
            comparison: {
              label: "Comparison",
              color: colors.secondary || "transparent",
            },
          }}
          className={`h-[${height}px] w-full`}
        >
          <ResponsiveContainer width="100%" height={height}>
            {type === "line" ? (
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradientValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke="var(--chart-axis)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  tick={{ fill: "var(--chart-axis)" }}
                />
                <YAxis
                  stroke="var(--chart-axis)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  tick={{ fill: "var(--chart-axis)" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  isAnimationActive={animated}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
                {data[0]?.comparison !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="comparison"
                    stroke="var(--color-comparison)"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                    isAnimationActive={animated}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    animationBegin={300}
                  />
                )}
              </LineChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorComparison" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-comparison)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-comparison)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke="var(--chart-axis)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  tick={{ fill: "var(--chart-axis)" }}
                />
                <YAxis
                  stroke="var(--chart-axis)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  tick={{ fill: "var(--chart-axis)" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  isAnimationActive={animated}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
                {data[0]?.comparison !== undefined && (
                  <Area
                    type="monotone"
                    dataKey="comparison"
                    stroke="var(--color-comparison)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorComparison)"
                    isAnimationActive={animated}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    animationBegin={300}
                  />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </motion.div>
    </div>
  )
}
