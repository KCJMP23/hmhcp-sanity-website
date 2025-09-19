"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

type AnimationType = "fadeIn" | "fadeInUp" | "fadeInLeft" | "fadeInRight" | "zoom" | "bounce" | "pulse" | "flip"

interface ScrollAnimationProps {
  children: ReactNode
  type?: AnimationType
  delay?: number
  duration?: number
  threshold?: number
  className?: string
}

export function ScrollAnimation({
  children,
  type = "fadeInUp",
  delay = 0,
  duration = 0.5,
  threshold = 0.1,
  className = "",
}: ScrollAnimationProps) {
  // Define animation variants
  const variants: Record<AnimationType, { hidden: any; visible: any }> = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    fadeInUp: {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0 },
    },
    fadeInLeft: {
      hidden: { opacity: 0, x: -50 },
      visible: { opacity: 1, x: 0 },
    },
    fadeInRight: {
      hidden: { opacity: 0, x: 50 },
      visible: { opacity: 1, x: 0 },
    },
    zoom: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 },
    },
    bounce: {
      hidden: { opacity: 0, y: 50 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 10,
        },
      },
    },
    pulse: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: {
        opacity: 1,
        scale: [1, 1.05, 1],
        transition: {
          times: [0, 0.5, 1],
        },
      },
    },
    flip: {
      hidden: { opacity: 0, rotateX: 90 },
      visible: { opacity: 1, rotateX: 0 },
    },
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      variants={variants[type]}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
