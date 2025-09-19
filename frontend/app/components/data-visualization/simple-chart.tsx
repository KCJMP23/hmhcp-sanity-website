"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Typography } from "@/components/ui/apple-typography"

// Types
export type ChartData = {
  name: string
  value: number
  [key: string]: any
}

interface SimpleChartProps {
  data: ChartData[]
  title?: string
  description?: string
  height?: number
  className?: string
  color?: string
}

export function SimpleChart({
  data,
  title,
  description,
  height = 300,
  className = "",
  color = "#3b82f6",
}: SimpleChartProps) {
  const [isClient, setIsClient] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (inView) {
      setTimeout(() => setIsVisible(true), 200)
    }
  }, [inView])

  if (!isClient) {
    return (
      <div 
        className={`h-[${height}px] w-full bg-gray-100 dark:bg-gray-800 animate-pulse  ${className}`} 
      />
    )
  }

  const maxValue = Math.max(...data.map(item => item.value))

  return (
    <div ref={ref} className={`bg-white dark:bg-gray-800  p-6 shadow-lg ${className}`}>
      {title && (
        <Typography as="h3" variant="heading3" className="mb-2 text-gray-900 dark:text-white">
          {title}
        </Typography>
      )}
      {description && (
        <Typography as="p" variant="body" className="mb-6 text-gray-600 dark:text-gray-300">
          {description}
        </Typography>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        {data.map((item, index) => (
          <div key={item.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.name}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {item.value}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-3">
              <motion.div
                className="h-3"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={isVisible ? { width: `${(item.value / maxValue) * 100}%` } : { width: 0 }}
                transition={{ 
                  delay: index * 0.1, 
                  duration: 1.2, 
                  ease: "easeOut" 
                }}
              />
            </div>
          </div>
        ))}
      </motion.div>
      
      {/* Simple line chart visualization */}
      <div className="mt-8 h-32 relative">
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 400 120" 
          className="absolute inset-0"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path 
                d="M 40 0 L 0 0 0 20" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="0.5"
                className="text-gray-300 dark:text-gray-600"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Data line */}
          <motion.path
            d={`M ${data.map((item, index) => 
              `${(index / (data.length - 1)) * 380 + 10},${120 - (item.value / maxValue) * 100}`
            ).join(' L ')}`}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={isVisible ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          
          {/* Data points */}
          {data.map((item, index) => (
            <motion.circle
              key={item.name}
              cx={(index / (data.length - 1)) * 380 + 10}
              cy={120 - (item.value / maxValue) * 100}
              r="4"
              fill={color}
              initial={{ scale: 0 }}
              animate={isVisible ? { scale: 1 } : { scale: 0 }}
              transition={{ 
                delay: index * 0.1 + 1,
                duration: 0.3,
                ease: "easeOut"
              }}
            />
          ))}
        </svg>
      </div>
    </div>
  )
}