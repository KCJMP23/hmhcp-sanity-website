"use client"

import { motion, useAnimation, useInView, useScroll, useTransform } from "framer-motion"
import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

// Apple's easing curve
const appleEasing = [0.42, 0, 0.58, 1] as const

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right" | "none"
}

export function FadeIn({ children, className, delay = 0, duration = 0.5, direction = "up" }: FadeInProps) {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const directionVariants = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
    none: {},
  }

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [controls, isInView])

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, ...directionVariants[direction] },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: {
            duration,
            delay,
            ease: appleEasing,
          },
        },
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
}

export function StaggerContainer({ children, className, delay = 0, staggerDelay = 0.1 }: StaggerContainerProps) {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [controls, isInView])

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
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

  const yUp = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed])
  const yDown = useTransform(scrollYProgress, [0, 1], [-100 * speed, 100 * speed])
  const xLeft = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed])
  const xRight = useTransform(scrollYProgress, [0, 1], [-100 * speed, 100 * speed])

  let transformProp = {}

  switch (direction) {
    case "up":
      transformProp = { y: yUp }
      break
    case "down":
      transformProp = { y: yDown }
      break
    case "left":
      transformProp = { x: xLeft }
      break
    case "right":
      transformProp = { x: xRight }
      break
  }

  return (
    <motion.div
      ref={ref}
      style={transformProp}
      className={cn("transition-transform duration-300 ease-&lsqb;cubic-bezier(0.42,0,0.58,1)&rsqb;", className)}
    >
      {children}
    </motion.div>
  )
}
