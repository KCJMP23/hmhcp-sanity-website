"use client"

import { useState, useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Smartphone, Monitor, Tablet } from "lucide-react"
import { cn } from "@/lib/utils"

interface DeviceShowcaseProps {
  devices?: ("phone" | "tablet" | "desktop")[]
  className?: string
  children?: React.ReactNode
  autoRotate?: boolean
}

export function DeviceShowcase({ 
  devices = ["phone", "tablet"], 
  className,
  children,
  autoRotate = true 
}: DeviceShowcaseProps) {
  const [selectedDevice, setSelectedDevice] = useState<"phone" | "tablet" | "desktop">(devices[0])
  const constraintsRef = useRef<HTMLDivElement>(null)
  
  // Motion values for 3D rotation
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Spring animations for smooth rotation
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [15, -15]), {
    stiffness: 400,
    damping: 30
  })
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-15, 15]), {
    stiffness: 400,
    damping: 30
  })

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!autoRotate) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    mouseX.set(event.clientX - centerX)
    mouseY.set(event.clientY - centerY)
  }

  const handleMouseLeave = () => {
    if (!autoRotate) return
    
    mouseX.set(0)
    mouseY.set(0)
  }

  const deviceConfigs = {
    phone: {
      width: "w-64",
      height: "h-128",
      borderRadius: "rounded-[3rem]",
      padding: "p-2",
      innerRounded: "rounded-[2.5rem]",
      icon: <Smartphone className="h-5 w-5" />,
      label: "Mobile App"
    },
    tablet: {
      width: "w-80",
      height: "h-96", 
      borderRadius: "rounded-lg",
      padding: "p-3",
      innerRounded: "rounded-md",
      icon: <Tablet className="h-5 w-5" />,
      label: "Tablet Experience"
    },
    desktop: {
      width: "w-96",
      height: "h-64",
      borderRadius: "rounded-lg",
      padding: "p-4",
      innerRounded: "rounded-md",
      icon: <Monitor className="h-5 w-5" />,
      label: "Web Dashboard"
    }
  }

  const currentConfig = deviceConfigs[selectedDevice]

  return (
    <div className={cn("relative", className)}>
      {/* Device Selector */}
      {devices.length > 1 && (
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 p-1 shadow-lg border border-gray-200 dark:border-gray-700">
            {devices.map((device) => (
              <button
                key={device}
                onClick={() => setSelectedDevice(device)}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-all duration-200",
                  selectedDevice === device
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                {deviceConfigs[device].icon}
                <span className="ml-2 text-sm font-medium">
                  {deviceConfigs[device].label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3D Device Container */}
      <div 
        ref={constraintsRef}
        className="flex justify-center items-center min-h-[500px] perspective-1000"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          style={{
            rotateX: autoRotate ? rotateX : 0,
            rotateY: autoRotate ? rotateY : 0,
          }}
          className="relative transform-gpu"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-500/20 rounded-[3rem] blur-3xl scale-110" />
          
          {/* Device Frame */}
          <div className={cn(
            "relative bg-black shadow-2xl",
            currentConfig.width,
            currentConfig.height,
            currentConfig.borderRadius,
            currentConfig.padding
          )}>
            {/* Screen */}
            <div className={cn(
              "bg-white dark:bg-gray-900 overflow-hidden h-full w-full",
              currentConfig.innerRounded
            )}>
              {/* Status Bar (for mobile devices) */}
              {selectedDevice === "phone" && (
                <div className="h-8 bg-gray-50 dark:bg-gray-800 flex items-center justify-between px-6 text-xs border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">9:41</span>
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400"></div>
                      <div className="w-1 h-1 bg-gray-400"></div>
                      <div className="w-1 h-1 bg-gray-600"></div>
                    </div>
                    <div className="w-6 h-3 border border-gray-400 relative">
                      <div className="absolute inset-0.5 bg-blue-500 w-4/5"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div className="flex-1 relative">
                {children || (
                  <div className="p-8 h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        {currentConfig.icon}
                      </div>
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {currentConfig.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Interactive demo content goes here
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Floating Interaction Indicators */}
          {autoRotate && (
            <>
              <motion.div
                className="absolute -top-4 -left-4 w-3 h-3 bg-blue-500 shadow-lg"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -bottom-4 -right-4 w-2 h-2 bg-blue-500 shadow-lg"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
            </>
          )}
        </motion.div>
      </div>

      {/* Interaction Hint */}
      {autoRotate && (
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Move your mouse over the device to interact
          </p>
        </motion.div>
      )}
    </div>
  )
}

// Preset configurations for common use cases
export function PhoneShowcase({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <DeviceShowcase devices={["phone"]} className={className}>
      {children}
    </DeviceShowcase>
  )
}

export function TabletShowcase({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <DeviceShowcase devices={["tablet"]} className={className}>
      {children}
    </DeviceShowcase>
  )
}

export function MultiDeviceShowcase({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <DeviceShowcase devices={["phone", "tablet", "desktop"]} className={className}>
      {children}
    </DeviceShowcase>
  )
}