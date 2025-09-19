"use client"

import type React from "react"
import { useState, lazy, Suspense } from "react"
import { motion } from "framer-motion"
import { ChevronRight, ChevronLeft, BarChart3, LineChart, PieChart } from "lucide-react"
import { FrostedCard } from "@/components/ui/frosted-card"
import { Typography } from "@/components/ui/apple-typography"
import { cn } from "@/lib/utils"

const LazyLineChart = lazy(() => import("@/components/charts/LineChartComponent"))
const LazyBarChart = lazy(() => import("@/components/charts/BarChartComponent"))
const LazyPieChart = lazy(() => import("@/components/charts/PieChartComponent"))

interface ResearchStatProps {
  value: string | number
  label: string
  icon?: React.ReactNode
  className?: string
}

const ResearchStat = ({ value, label, icon, className }: ResearchStatProps) => (
  <div className={cn("flex flex-col items-center p-4", className)}>
    {icon && <div className="mb-2 text-primary-500">{icon}</div>}
    <Typography variant="heading2" className="text-primary-500 mb-1">
      {value}
    </Typography>
    <Typography variant="caption" className="text-center">
      {label}
    </Typography>
  </div>
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

export function AppleStyleResearchSectionOptimized() {
  const [activeTab, setActiveTab] = useState(0)

  const nextTab = () => {
    setActiveTab((prev) => (prev === chartTabs.length - 1 ? 0 : prev + 1))
  }

  const prevTab = () => {
    setActiveTab((prev) => (prev === 0 ? chartTabs.length - 1 : prev - 1))
  }

  const renderChart = () => {
    const currentTab = chartTabs[activeTab]
    
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-pulse text-gray-400">Loading chart...</div>
        </div>
      }>
        {currentTab.chartType === "line" && <LazyLineChart />}
        {currentTab.chartType === "bar" && <LazyBarChart />}
        {currentTab.chartType === "pie" && <LazyPieChart />}
      </Suspense>
    )
  }

  return (
    <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Typography variant="heading1" className="mb-4">
            Research & Innovation
          </Typography>
          <Typography variant="body" className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
            Our commitment to advancing healthcare through rigorous research and innovative approaches has led to
            significant improvements in patient outcomes and care delivery.
          </Typography>
        </div>

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

        <FrostedCard className="p-6 md:p-8 mb-16">
          <div className="flex flex-col">
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

            <div className="min-h-[400px]">
              {renderChart()}
            </div>

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
            <FrostedCard key={index} className="h-full p-6">
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
          ))}
        </div>
      </div>
    </section>
  )
}