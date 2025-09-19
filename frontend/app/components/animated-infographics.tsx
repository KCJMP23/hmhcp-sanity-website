"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useInView, useAnimation, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"
import { CircularProgress } from "@/components/circular-progress"

interface AnimatedStatProps {
  value: number
  label: string
  prefix?: string
  suffix?: string
  duration?: number
  delay?: number
  className?: string
}

export function AnimatedStat({
  value,
  label,
  prefix = "",
  suffix = "",
  duration = 2,
  delay = 0,
  className,
}: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  useEffect(() => {
    if (!isInView) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      const currentValue = Math.floor(progress * value)

      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    const timeoutId = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate)
    }, delay * 1000)

    return () => {
      clearTimeout(timeoutId)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isInView, value, duration, delay])

  return (
    <div ref={ref} className={cn("text-center", className)}>
      <div className="text-4xl font-bold mb-2">
        {prefix}
        {displayValue}
        {suffix}
      </div>
      <div className="text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  )
}

interface AnimatedBarProps {
  value: number
  maxValue?: number
  label: string
  color?: string
  height?: number
  duration?: number
  delay?: number
  showValue?: boolean
  className?: string
}

export function AnimatedBar({
  value,
  maxValue = 100,
  label,
  color = "#3b82f6",
  height = 12,
  duration = 1.5,
  delay = 0,
  showValue = true,
  className,
}: AnimatedBarProps) {
  const controls = useAnimation()
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const percentage = (value / maxValue) * 100

  useEffect(() => {
    if (isInView) {
      controls.start({
        width: `${percentage}%`,
        transition: { duration, delay, ease: "easeOut" },
      })
    }
  }, [controls, isInView, percentage, duration, delay])

  return (
    <div ref={ref} className={cn("mb-4", className)}>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {showValue && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {value}/{maxValue}
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 overflow-hidden" style={{ height }}>
        <motion.div className="h-full" style={{ backgroundColor: color, width: 0 }} animate={controls} />
      </div>
    </div>
  )
}

interface ComparisonChartProps {
  data: {
    category: string
    values: {
      label: string
      value: number
      color: string
    }[]
  }[]
  maxValue?: number
  barHeight?: number
  className?: string
}

export function ComparisonChart({ data, maxValue = 100, barHeight = 24, className }: ComparisonChartProps) {
  const controls = useAnimation()
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [controls, isInView])

  const barVariants: Variants = {
    hidden: { width: 0 },
    visible: (i: number) => ({
      width: "100%",
      transition: {
        duration: 1,
        delay: 0.3 + i * 0.1,
        ease: "easeOut",
      },
    }),
  }

  return (
    <div ref={ref} className={cn("space-y-8", className)}>
      {data.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-4">
          <h4 className="font-medium">{group.category}</h4>
          <div className="space-y-3">
            {group.values.map((item, itemIndex) => {
              const percentage = (item.value / maxValue) * 100

              return (
                <div key={itemIndex} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div
                    className="w-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
                    style={{ height: barHeight }}
                  >
                    <motion.div
                      className="h-full relative"
                      style={{ backgroundColor: item.color, width: `${percentage}%` }}
                      custom={groupIndex + itemIndex * 0.1}
                      variants={barVariants}
                      initial="hidden"
                      animate={controls}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

interface StatGridProps {
  stats: {
    value: number
    label: string
    prefix?: string
    suffix?: string
  }[]
  columns?: 2 | 3 | 4
  className?: string
}

export function StatGrid({ stats, columns = 3, className }: StatGridProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {stats.map((stat, index) => (
        <div key={index} className="premium-card p-6">
          <AnimatedStat
            value={stat.value}
            label={stat.label}
            prefix={stat.prefix}
            suffix={stat.suffix}
            delay={index * 0.1}
          />
        </div>
      ))}
    </div>
  )
}

interface ProgressCircleGridProps {
  items: {
    value: number
    label: string
    color?: string
  }[]
  columns?: 2 | 3 | 4
  size?: number
  className?: string
}

export function ProgressCircleGrid({ items, columns = 3, size = 80, className }: ProgressCircleGridProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item, index) => (
        <div key={index} className="premium-card p-6 flex flex-col items-center text-center">
          <CircularProgress value={item.value} size={size} color={item.color || "#3b82f6"} delay={index * 0.1} />
          <div className="mt-4 text-gray-700 dark:text-gray-300">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
