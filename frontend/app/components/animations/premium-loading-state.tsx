"use client"

import { motion } from "framer-motion"
import { Activity, Zap } from "lucide-react"

interface PremiumLoadingStateProps {
  /** Loading message */
  message?: string
  /** Show premium background */
  premium?: boolean
  /** Loading type */
  type?: "spinner" | "pulse" | "dots" | "orb"
}

export function PremiumLoadingState({ 
  message = "Loading premium content...", 
  premium = true, 
  type = "orb" 
}: PremiumLoadingStateProps) {
  if (type === "orb") {
    return (
      <div className={`fixed inset-0 flex items-center justify-center z-50 ${
        premium 
          ? "bg-gradient-to-br from-white via-blue-50/30 to-white backdrop-blur-sm" 
          : "bg-white dark:bg-gray-950"
      }`}>
        {premium && (
          <>
            {/* Premium background elements */}
            <motion.div 
              className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-100/30 to-blue-200/30 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-blue-200/20 to-blue-300/20 rounded-full blur-3xl"
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.4, 0.7, 0.4],
                rotate: [360, 180, 0]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
          </>
        )}
        
        <div className="relative z-10 flex flex-col items-center">
          {/* Premium orb loader */}
          <div className="relative w-24 h-24 mb-8">
            {/* Outer rings */}
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="absolute inset-0 rounded-full border border-blue-300/40"
                style={{
                  background: `conic-gradient(from ${index * 120}deg, transparent 0deg, rgba(59, 130, 246, 0.3) 60deg, transparent 120deg)`,
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3 + index,
                  repeat: Infinity,
                  ease: "linear",
                  delay: index * 0.3,
                }}
              />
            ))}
            
            {/* Central orb */}
            <motion.div
              className="absolute inset-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-2xl"
              style={{
                boxShadow: '0 20px 60px rgba(59, 130, 246, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.3)'
              }}
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 20px 60px rgba(59, 130, 246, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.3)',
                  '0 25px 80px rgba(59, 130, 246, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.4)',
                  '0 20px 60px rgba(59, 130, 246, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.3)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Activity className="w-8 h-8 text-white drop-shadow-lg" />
            </motion.div>
            
            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-400/60 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transformOrigin: '50% 50%'
                }}
                animate={{
                  rotate: 360,
                  scale: [1, 0.5, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          
          {/* Premium loading text */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-blue-200/50 text-blue-700 text-sm font-medium mb-4 shadow-lg" style={{
              backdropFilter: 'blur(12px) saturate(180%)',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
            }}>
              <Zap className="w-4 h-4 mr-2" />
              H|M Healthcare Partners
            </div>
            <motion.div
              className="text-lg font-medium text-gray-700"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {message}
            </motion.div>
            <div className="text-sm text-gray-500 mt-2">
              Preparing your clinical research experience
            </div>
          </motion.div>
        </div>
      </div>
    )
  }
  
  // Fallback spinner type
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-950 z-50">
      <div className="flex flex-col items-center">
        <div className="relative w-16 h-16">
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              className="absolute top-0 left-0 w-full h-full border-2 border-blue-600 dark:border-blue-400 rounded-full"
              style={{
                borderTopColor: "transparent",
                borderRightColor: index % 2 === 0 ? "transparent" : undefined,
                borderLeftColor: index % 2 !== 0 ? "transparent" : undefined,
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
                delay: index * 0.2,
              }}
            />
          ))}
        </div>
        <motion.div
          className="mt-4 text-blue-600 dark:text-blue-400 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {message}
        </motion.div>
      </div>
    </div>
  )
}

// Quick loading indicator for smaller components
export function QuickLoader({ size = "md", message }: { size?: "sm" | "md" | "lg", message?: string }) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-3">
        <div className={`${sizes[size]} border-2 border-blue-600 border-t-transparent rounded-full animate-spin`} />
        {message && (
          <div className="text-sm text-gray-600 font-medium animate-pulse">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}