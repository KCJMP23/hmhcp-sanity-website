"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { cn } from "@/lib/utils"

interface CountUpProps {
  end: number
  start?: number
  duration?: number
  delay?: number
  prefix?: string
  suffix?: string
  decimals?: number
  separator?: string
  className?: string
}

export function CountUp({
  end,
  start = 0,
  duration = 2,
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  separator = ",",
  className,
}: CountUpProps) {
  const [count, setCount] = useState(start)
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    let startTime: number
    let animationFrame: number
    let currentCount = start

    if (inView) {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)

        currentCount = start + progress * (end - start)
        setCount(currentCount)

        if (progress < 1) {
          animationFrame = requestAnimationFrame(step)
        }
      }

      animationFrame = requestAnimationFrame(step)
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [inView, start, end, duration])

  const formatNumber = (num: number) => {
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  )
}

interface StatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  description?: string
  icon?: React.ReactNode
  color?: string
  className?: string
}

export function StatCard({
  title,
  value,
  prefix = "",
  suffix = "",
  description,
  icon,
  color = "blue",
  className,
}: StatCardProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const colorClasses =
    {
      blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      green: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      purple: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      red: "bg-red-50 text-red-600 dark:bg-blue-900/30 dark:text-blue-400",
      amber: "bg-amber-50 text-amber-600 dark:bg-blue-900/30 dark:text-blue-400",
      indigo: "bg-indigo-50 text-indigo-600 dark:bg-blue-900/30 dark:text-blue-400",
    }[color] || "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className={cn("bg-white dark:bg-gray-800  p-6 shadow-lg", className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
          <div className="text-3xl font-semibold text-gray-900 dark:text-white">
            <CountUp end={value} prefix={prefix} suffix={suffix} duration={2} />
          </div>
          {description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>}
        </div>
        {icon && <div className={cn("p-3 ", colorClasses)}>{icon}</div>}
      </div>
    </motion.div>
  )
}

interface StatGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[columns]

  return <div className={cn(`grid gap-6 ${columnClasses}`, className)}>{children}</div>
}
