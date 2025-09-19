"use client"

import { motion } from "framer-motion"

export function LoadingState() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-950 z-50">
      <div className="flex flex-col items-center">
        <div className="relative w-16 h-16">
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              className="absolute top-0 left-0 w-full h-full border-2 border-blue-600 dark:border-blue-400"
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
          Loading...
        </motion.div>
      </div>
    </div>
  )
}
