"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
}

export const Skeleton = ({ className, width, height }: SkeletonProps) => {
  return (
    <motion.div
      className={cn("bg-white/20 rounded", className)}
      style={{ width, height }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

interface SkeletonLineProps {
  className?: string
  width?: string | number
}

export const SkeletonLine = ({ className, width }: SkeletonLineProps) => {
  return (
    <Skeleton
      className={cn("h-4", className)}
      width={width}
    />
  )
}

interface SkeletonCircleProps {
  className?: string
  size?: string | number
}

export const SkeletonCircle = ({ className, size = "2rem" }: SkeletonCircleProps) => {
  return (
    <Skeleton
      className={cn("rounded-full", className)}
      width={size}
      height={size}
    />
  )
}

interface SkeletonButtonProps {
  className?: string
  width?: string | number
  height?: string | number
}

export const SkeletonButton = ({ className, width = "4rem", height = "2rem" }: SkeletonButtonProps) => {
  return (
    <Skeleton
      className={cn("rounded-lg", className)}
      width={width}
      height={height}
    />
  )
}