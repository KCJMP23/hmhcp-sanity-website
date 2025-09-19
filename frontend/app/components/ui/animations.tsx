"use client"

import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

// Apple-style easing
const appleEasing: [number, number, number, number] = [0.42, 0, 0.58, 1]

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  threshold?: number
  once?: boolean
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
  direction = "up",
  threshold = 0.2,
  once = true,
}: FadeInProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount: threshold })

  const directionVariants = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
    none: {},
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directionVariants[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directionVariants[direction] }}
      transition={{
        duration,
        delay,
        ease: appleEasing,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  delay?: number
  staggerDelay?: number
  threshold?: number
  once?: boolean
}

export function StaggerContainer({
  children,
  className,
  delay = 0,
  staggerDelay = 0.1,
  threshold = 0.1,
  once = true,
}: StaggerContainerProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount: threshold })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
  index?: number
}

export function StaggerItem({ children, className, index = 0 }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: appleEasing,
          },
        },
      }}
      className={cn("h-full", className)}
    >
      {children}
    </motion.div>
  )
}

interface ParallaxProps {
  children: ReactNode
  className?: string
  speed?: number
  direction?: "up" | "down" | "left" | "right"
}

export function Parallax({ children, className, speed = 0.5, direction = "up" }: ParallaxProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  // Calculate transform values based on direction - all hooks must be called unconditionally
  const xUp = useTransform(scrollYProgress, [0, 1], [0, 0])
  const yUp = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed])
  const yDown = useTransform(scrollYProgress, [0, 1], [-100 * speed, 100 * speed])
  const xLeft = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed])
  const xRight = useTransform(scrollYProgress, [0, 1], [-100 * speed, 100 * speed])

  // Select the appropriate transform values based on direction
  const x = direction === "left" ? xLeft : direction === "right" ? xRight : xUp
  const y = direction === "up" ? yUp : direction === "down" ? yDown : 0

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className={cn("transition-transform duration-300 ease-&lsqb;cubic-bezier(0.42,0,0.58,1)&rsqb;", className)}
    >
      {children}
    </motion.div>
  )
}

interface HoverEffectProps {
  children: ReactNode
  className?: string
  scale?: number
  lift?: boolean
  rotate?: number
}

export function HoverEffect({ children, className, scale = 1.05, lift = true, rotate = 0 }: HoverEffectProps) {
  return (
    <motion.div
      whileHover={{
        scale: scale,
        y: lift ? -5 : 0,
        rotate: rotate,
        transition: { duration: 0.2, ease: appleEasing },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
