"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  delay?: number
}

export function CircularProgress({
  value,
  size = 60,
  strokeWidth = 6,
  color = "#3b82f6",
  backgroundColor = "rgba(0, 0, 0, 0.1)",
  delay = 0,
}: CircularProgressProps) {
  const [progress, setProgress] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(value)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [value, delay])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <rect cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={backgroundColor} strokeWidth={strokeWidth} />
        <motion.rect
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, delay: delay }}
          strokeLinecap="round"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400"
        style={{ fontSize: size / 4 }}
      >
        {progress}%
      </div>
    </div>
  )
}
