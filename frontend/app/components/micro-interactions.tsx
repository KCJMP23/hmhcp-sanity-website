"use client"

import { motion, type Variants } from "framer-motion"
import type { ReactNode } from "react"

interface FadeInProps {
  children: ReactNode
  direction?: "up" | "down" | "left" | "right" | "none"
  delay?: number
  duration?: number
  className?: string
  once?: boolean
}

export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.5,
  className = "",
  once = true,
}: FadeInProps) {
  const directions = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 },
    none: { y: 0, x: 0 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once }}
      transition={{ duration, delay, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface HoverScaleProps {
  children: ReactNode
  scale?: number
  className?: string
}

export function HoverScale({ children, scale = 1.05, className = "" }: HoverScaleProps) {
  return (
    <motion.div whileHover={{ scale }} transition={{ duration: 0.2 }} className={className}>
      {children}
    </motion.div>
  )
}

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  delay?: number
  staggerDelay?: number
}

export function StaggerContainer({ children, className = "", delay = 0.1, staggerDelay = 0.1 }: StaggerContainerProps) {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
  }

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}

interface ScrollRevealProps {
  children: ReactNode
  threshold?: number
  className?: string
}

export function ScrollReveal({ children, threshold = 0.1, className = "" }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: threshold }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
