"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, BarChart3, LineChart, PieChart } from "lucide-react"
import { FrostedCard } from "@/components/ui/frosted-card"
import { Typography } from "@/components/ui/apple-typography"
import { cn } from "@/lib/utils"

// Import chart components
import {
  Line,
  LineChart as RechartsLineChart,
  Bar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data for charts
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

const barChartData = [
  { category: "Cardiology", value: 400 },
  { category: "Neurology", value: 300 },
  { category: "Oncology", value: 500 },
  { category: "Pediatrics", value: 280 },
  { category: "Orthopedics", value: 350 },
]

const pieChartData = [
  { name: "Clinical Trials", value: 45 },
  { name: "Quality Studies", value: 30 },
  { name: "Publications", value: 25 },
]

const COLORS = ["#0066cc", "#5856d6", "#ff2d55", "#34c759", "#ff9500"]

interface ResearchStatProps {
  value: string | number
  label: string
  icon?: React.ReactNode
  className?: string
}

const ResearchStat = ({ value, label, icon, className }: ResearchStatProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, ease: [0.42, 0, 0.58, 1] }}
    className={cn("flex flex-col items-center p-4", className)}
  >
    {icon && <div className="mb-2 text-primary-500">{icon}</div>}
    <Typography variant="heading2" className="text-primary-500 mb-1">
      {value}
    </Typography>
    <Typography variant="caption" className="text-center">
      {label}
    </Typography>
  </motion.div>
)

interface ChartTabProps {
  title: string
  description: string
  icon: React.ReactNode
  chartType: "line" | "bar" | "pie"
}

const chartTabs: ChartTabProps[] = [
  {
    title: "Patient Outcomes",
    description: "Monthly tracking of patient volume and positive outcomes",
    icon: <LineChart className="w-5 h-5" />,
    chartType: "line",
  },
  {
    title: "Department Performance",
    description: "Performance metrics across medical departments",
    icon: <BarChart3 className="w-5 h-5" />,
    chartType: "bar",
  },
  {
    title: "Research Distribution",
    description: "Breakdown of our research initiatives by category",
    icon: <PieChart className="w-5 h-5" />,
    chartType: "pie",
  },
]

export function AppleStyleResearchSection() {
  const [activeTab, setActiveTab] = useState(0)

  const nextTab = () => {
    setActiveTab((prev) => (prev === chartTabs.length - 1 ? 0 : prev + 1))
  }

  const prevTab = () => {
    setActiveTab((prev) => (prev === 0 ? chartTabs.length - 1 : prev - 1))
  }

  const renderChart = () => {
    const currentTab = chartTabs[activeTab]

    switch (currentTab.chartType) {
      case "line":
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
              <RechartsLineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
              </RechartsLineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
            </RechartsBarChart>
          </ResponsiveContainer>
        )
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart>
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
            </RechartsPieChart>
          </ResponsiveContainer>
        )
      default:
        return null
    }
  }

  return (
    <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="heading1" className="mb-4">
              Research & Innovation
            </Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Typography variant="body" className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Our commitment to advancing healthcare through rigorous research and innovative approaches has led to
              significant improvements in patient outcomes and care delivery.
            </Typography>
          </motion.div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <FrostedCard className="p-6">
            <ResearchStat value="250+" label="Published Research Papers" />
          </FrostedCard>
          <FrostedCard className="p-6">
            <ResearchStat value="45" label="Active Clinical Trials" />
          </FrostedCard>
          <FrostedCard className="p-6">
            <ResearchStat value="$12M" label="Annual Research Funding" />
          </FrostedCard>
        </div>

        {/* Interactive Charts Section */}
        <FrostedCard className="p-6 md:p-8 mb-16">
          <div className="flex flex-col">
            {/* Chart Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <Typography variant="heading3" className="mb-1">
                  {chartTabs[activeTab].title}
                </Typography>
                <Typography variant="caption">{chartTabs[activeTab].description}</Typography>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={prevTab}
                  className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Previous chart"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextTab}
                  className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Next chart"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chart Display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: [0.42, 0, 0.58, 1] }}
              >
                {renderChart()}
              </motion.div>
            </AnimatePresence>

            {/* Chart Tabs */}
            <div className="flex flex-wrap gap-2 mt-6">
              {chartTabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={cn(
                    "flex items-center px-4 py-2  text-sm transition-colors",
                    activeTab === index
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
                  )}
                >
                  <span className="mr-2">{tab.icon}</span>
                  <span>{tab.title}</span>
                </button>
              ))}
            </div>
          </div>
        </FrostedCard>

        {/* Research Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Clinical Trials",
              description: "Pioneering new treatments and therapies through rigorous clinical trials",
              count: "45 Active Trials",
            },
            {
              title: "Quality Improvement",
              description: "Enhancing healthcare delivery through systematic quality improvement initiatives",
              count: "30 QI Projects",
            },
            {
              title: "Health Informatics",
              description: "Leveraging data and technology to improve healthcare decision-making",
              count: "15 Research Teams",
            },
          ].map((area, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <FrostedCard className="h-full p-6">
                <Typography variant="heading3" className="mb-2">
                  {area.title}
                </Typography>
                <Typography variant="caption" className="mb-4">
                  {area.description}
                </Typography>
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Typography variant="label" className="text-primary-500">
                    {area.count}
                  </Typography>
                </div>
              </FrostedCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
