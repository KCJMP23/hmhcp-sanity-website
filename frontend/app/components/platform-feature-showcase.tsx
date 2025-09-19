"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Typography } from "@/components/ui/apple-typography"
import { cn } from "@/lib/utils"

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  demo?: React.ReactNode
}

interface PlatformFeatureShowcaseProps {
  features: Feature[]
  className?: string
  autoPlay?: boolean
  interval?: number
}

export function PlatformFeatureShowcase({
  features,
  className,
  autoPlay = true,
  interval = 4000
}: PlatformFeatureShowcaseProps) {
  const [activeFeature, setActiveFeature] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)

  // Auto-advance features
  useEffect(() => {
    if (!isPlaying) return

    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, interval)

    return () => clearInterval(timer)
  }, [isPlaying, interval, features.length])

  const currentFeature = features[activeFeature]

  return (
    <div className={cn("relative", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Feature List */}
        <div className="space-y-4">
          {features.map((feature, index) => (
            <motion.button
              key={feature.id}
              onClick={() => {
                setActiveFeature(index)
                setIsPlaying(false)
              }}
              className={cn(
                "w-full text-left p-6  border-2 transition-all duration-300",
                activeFeature === index
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start space-x-4">
                <div className={cn(
                  "w-12 h-12  flex items-center justify-center flex-shrink-0",
                  activeFeature === index ? feature.color : "bg-gray-100 dark:bg-gray-700"
                )}>
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <Typography as="h3" variant="heading4" className={cn(
                    "mb-2",
                    activeFeature === index ? "text-blue-900 dark:text-blue-100" : ""
                  )}>
                    {feature.title}
                  </Typography>
                  <Typography as="p" variant="body" className={cn(
                    "text-sm",
                    activeFeature === index 
                      ? "text-blue-700 dark:text-blue-300" 
                      : "text-gray-600 dark:text-gray-400"
                  )}>
                    {feature.description}
                  </Typography>
                </div>
                
                {/* Active Indicator */}
                {activeFeature === index && (
                  <motion.div
                    className="w-2 h-8 bg-blue-500"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>

              {/* Progress Bar for Auto-play */}
              {activeFeature === index && isPlaying && (
                <motion.div
                  className="mt-4 h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: interval / 1000, ease: "linear" }}
                    key={`progress-${activeFeature}`}
                  />
                </motion.div>
              )}
            </motion.button>
          ))}

          {/* Playback Controls */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {isPlaying ? "Pause" : "Play"} Demo
            </button>
          </div>
        </div>

        {/* Feature Demo Area */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeature.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-500/10 blur-3xl scale-110" />
              
              {/* Demo Container */}
              <div className="relative bg-white dark:bg-gray-800 p-8 shadow-2xl border border-gray-200 dark:border-gray-700 min-h-[400px]">
                {currentFeature.demo || (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className={cn(
                        "w-24 h-24  flex items-center justify-center mx-auto mb-6 shadow-lg",
                        currentFeature.color
                      )}>
                        {React.isValidElement(currentFeature.icon) 
                          ? React.cloneElement(currentFeature.icon as React.ReactElement<any>, { 
                              className: "h-12 w-12 text-white" 
                            })
                          : currentFeature.icon
                        }
                      </div>
                      <Typography as="h3" variant="heading2" className="mb-4">
                        {currentFeature.title}
                      </Typography>
                      <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-400 max-w-md">
                        {currentFeature.description}
                      </Typography>
                    </div>
                  </div>
                )}
              </div>

              {/* Feature Title Overlay */}
              <motion.div
                className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 backdrop-blur-md"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Typography as="span" variant="small" className="font-medium text-white">
                  {currentFeature.title}
                </Typography>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveFeature(index)
                  setIsPlaying(false)
                }}
                className={cn(
                  "w-3 h-3  transition-all duration-200",
                  activeFeature === index
                    ? "bg-blue-500 scale-125"
                    : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo Content Components
export function StudyBuilderDemo() {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex items-center mb-3">
          <div className="w-3 h-3 bg-blue-500 mr-2"></div>
          <span className="text-sm font-medium">Drag & Drop Interface</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-gray-700 p-3 border-2 border-dashed border-blue-300">
            <div className="text-xs text-gray-600 dark:text-gray-400">Question Bank</div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400">Form Builder</div>
          </div>
        </div>
      </div>
      <motion.div
        className="bg-blue-50 dark:bg-blue-900/20 p-4"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          ✓ Study configured in 3 minutes
        </div>
      </motion.div>
    </div>
  )
}

export function AIInsightsDemo() {
  const [currentInsight, setCurrentInsight] = useState(0)
  const insights = [
    "Pattern detected: 85% medication adherence",
    "Risk alert: Patient showing concerning trend",
    "Recommendation: Adjust intervention timing"
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % insights.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [insights.length])

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-500 flex items-center justify-center mr-3">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <span className="text-sm font-medium">Live Analysis</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentInsight}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-gray-700 p-3"
          >
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {insights[currentInsight]}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export function MobileAppDemo() {
  const [taskCompleted, setTaskCompleted] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTaskCompleted(prev => !prev)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 p-4">
        <div className="text-sm font-medium mb-3">Today's Tasks</div>
        <motion.div
          className={cn(
            "flex items-center p-3  transition-colors",
            taskCompleted ? "bg-blue-100 dark:bg-blue-900/30" : "bg-white dark:bg-gray-700"
          )}
          animate={{ scale: taskCompleted ? [1, 1.05, 1] : 1 }}
        >
          <motion.div
            className={cn(
              "w-6 h-6  border-2 mr-3 flex items-center justify-center",
              taskCompleted 
                ? "bg-blue-500 border-blue-500" 
                : "border-gray-300 dark:border-gray-600"
            )}
            whileTap={{ scale: 0.95 }}
          >
            {taskCompleted && (
              <motion.svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            )}
          </motion.div>
          <div className="flex-1">
            <div className="text-sm">Daily Health Check-in</div>
            <div className={cn(
              "text-xs",
              taskCompleted ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
            )}>
              {taskCompleted ? "Completed! Great job" : "Tap to complete"}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}