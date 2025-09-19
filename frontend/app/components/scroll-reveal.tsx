"use client"

import React from "react"

import { useRef, useEffect } from "react"
import { motion, useInView, useAnimation, type Variants } from "framer-motion"

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  animation?: "fade" | "slide" | "zoom" | "flip" | "rotate" | "stagger"
  direction?: "up" | "down" | "left" | "right"
  distance?: number
  duration?: number
  delay?: number
  threshold?: number
  once?: boolean
}

export function ScrollReveal({
  children,
  className,
  animation = "fade",
  direction = "up",
  distance = 50,
  duration = 0.6,
  delay = 0,
  threshold = 0.1,
  once = true,
}: ScrollRevealProps) {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount: threshold })

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    } else if (!once) {
      controls.start("hidden")
    }
  }, [controls, isInView, once])

  const getDirectionOffset = () => {
    switch (direction) {
      case "up":
        return { y: distance }
      case "down":
        return { y: -distance }
      case "left":
        return { x: distance }
      case "right":
        return { x: -distance }
      default:
        return { y: distance }
    }
  }

  const getVariants = (): Variants => {
    switch (animation) {
      case "fade":
        return {
          hidden: { opacity: 0, ...getDirectionOffset() },
          visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: { duration, delay, ease: "easeOut" },
          },
        }
      case "zoom":
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: { duration, delay, ease: "easeOut" },
          },
        }
      case "flip":
        return {
          hidden: { opacity: 0, rotateX: 90 },
          visible: {
            opacity: 1,
            rotateX: 0,
            transition: { duration, delay, ease: "easeOut" },
          },
        }
      case "rotate":
        return {
          hidden: { opacity: 0, rotate: -15 },
          visible: {
            opacity: 1,
            rotate: 0,
            transition: { duration, delay, ease: "easeOut" },
          },
        }
      case "slide":
      default:
        return {
          hidden: { opacity: 0, ...getDirectionOffset() },
          visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: { duration, delay, ease: "easeOut" },
          },
        }
    }
  }

  if (animation === "stagger") {
    return (
      <StaggerReveal
        ref={ref}
        className={className}
        direction={direction}
        distance={distance}
        duration={duration}
        delay={delay}
        isInView={isInView}
      >
        {children}
      </StaggerReveal>
    )
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={getVariants()}
      className={`${className} dark:bg-gray-900 dark:text-gray-100`}
    >
      {children}
    </motion.div>
  )
}

interface StaggerRevealProps {
  children: React.ReactNode
  className?: string
  direction?: "up" | "down" | "left" | "right"
  distance?: number
  duration?: number
  delay?: number
  isInView: boolean
}

const StaggerReveal = React.forwardRef<HTMLDivElement, StaggerRevealProps>(
  ({ children, className, direction = "up", distance = 50, duration = 0.6, delay = 0, isInView }, ref) => {
    const controls = useAnimation()

    useEffect(() => {
      if (isInView) {
        controls.start("visible")
      } else {
        controls.start("hidden")
      }
    }, [controls, isInView])

    const getDirectionOffset = () => {
      switch (direction) {
        case "up":
          return { y: distance }
        case "down":
          return { y: -distance }
        case "left":
          return { x: distance }
        case "right":
          return { x: -distance }
        default:
          return { y: distance }
      }
    }

    const containerVariants: Variants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: delay,
        },
      },
    }

    const itemVariants: Variants = {
      hidden: { opacity: 0, ...getDirectionOffset() },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: { duration, ease: "easeOut" },
      },
    }

    // Clone children and wrap each in a motion.div with variants
    const staggeredChildren = React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child

      const childProps = child.props as any

      return (
        <motion.div variants={itemVariants} className={childProps.className}>
          {childProps.children}
        </motion.div>
      )
    })

    return (
      <motion.div ref={ref} initial="hidden" animate={controls} variants={containerVariants} className={className}>
        {staggeredChildren}
      </motion.div>
    )
  },
)

StaggerReveal.displayName = "StaggerReveal"

interface ScrollSequenceProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  threshold?: number
}

export function ScrollSequence({ children, className, staggerDelay = 0.1, threshold = 0.1 }: ScrollSequenceProps) {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: threshold })

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [controls, isInView])

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  }

  return (
    <motion.div ref={ref} initial="hidden" animate={controls} variants={containerVariants} className={className}>
      {children}
    </motion.div>
  )
}

interface ScrollSequenceItemProps {
  children: React.ReactNode
  className?: string
  animation?: "fade" | "slide" | "zoom"
  direction?: "up" | "down" | "left" | "right"
  distance?: number
  duration?: number
}

export function ScrollSequenceItem({
  children,
  className,
  animation = "fade",
  direction = "up",
  distance = 30,
  duration = 0.5,
}: ScrollSequenceItemProps) {
  const getDirectionOffset = () => {
    switch (direction) {
      case "up":
        return { y: distance }
      case "down":
        return { y: -distance }
      case "left":
        return { x: distance }
      case "right":
        return { x: -distance }
      default:
        return { y: distance }
    }
  }

  const getVariants = (): Variants => {
    switch (animation) {
      case "zoom":
        return {
          hidden: { opacity: 0, scale: 0.9 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: { duration, ease: "easeOut" },
          },
        }
      case "slide":
        return {
          hidden: { opacity: 0, ...getDirectionOffset() },
          visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: { duration, ease: "easeOut" },
          },
        }
      case "fade":
      default:
        return {
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { duration, ease: "easeOut" },
          },
        }
    }
  }

  return (
    <motion.div variants={getVariants()} className={className}>
      {children}
    </motion.div>
  )
}
