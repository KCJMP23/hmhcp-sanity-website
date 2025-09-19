"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { motion, useInView, useAnimation, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedHeadingProps {
  children: React.ReactNode
  className?: string
  as?: "h1" | "h2" | "h3" | "h4" | "span"
  animation?: "fade" | "reveal" | "highlight" | "slide" | "character"
  delay?: number
  duration?: number
}

export function AnimatedHeading({
  children,
  className,
  as = "h2",
  animation = "fade",
  delay = 0,
  duration = 0.5,
}: AnimatedHeadingProps) {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const Component = as

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [controls, isInView])

  const fadeVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        delay,
        ease: "easeOut",
      },
    },
  }

  const revealVariants: Variants = {
    hidden: { opacity: 0, y: 100 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1.0],
      },
    },
  }

  const slideVariants: Variants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration,
        delay,
        ease: "easeOut",
      },
    },
  }

  if (animation === "character") {
    return <CharacterAnimation text={children?.toString() || ""} className={cn(className)} as={as} delay={delay} />
  }

  if (animation === "highlight") {
    return <HighlightAnimation text={children?.toString() || ""} className={cn(className)} as={as} delay={delay} />
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={
        animation === "fade"
          ? fadeVariants
          : animation === "reveal"
            ? revealVariants
            : animation === "slide"
              ? slideVariants
              : fadeVariants
      }
    >
      <Component className={cn(className)}>{children}</Component>
    </motion.div>
  )
}

interface CharacterAnimationProps {
  text: string
  className?: string
  as?: "h1" | "h2" | "h3" | "h4" | "span"
  delay?: number
}

function CharacterAnimation({ text, className, as = "h2", delay = 0 }: CharacterAnimationProps) {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const Component = as

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [controls, isInView])

  const characterVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: delay,
      },
    },
  }

  const childVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  }

  return (
    <Component className={cn(className)}>
      <motion.span
        ref={ref}
        style={{ display: "inline-block" }}
        variants={characterVariants}
        initial="hidden"
        animate={controls}
      >
        {text.split("").map((char, index) => (
          <motion.span key={index} variants={childVariants} style={{ display: "inline-block" }}>
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  )
}

interface HighlightAnimationProps {
  text: string
  className?: string
  as?: "h1" | "h2" | "h3" | "h4" | "span"
  delay?: number
}

function HighlightAnimation({ text, className, as = "h2", delay = 0 }: HighlightAnimationProps) {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const Component = as
  const [isAnimated, setIsAnimated] = useState(false)

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
      const timer = setTimeout(
        () => {
          setIsAnimated(true)
        },
        delay * 1000 + 500,
      )
      return () => clearTimeout(timer)
    }
  }, [controls, isInView, delay])

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        delay,
        ease: "easeOut",
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      className="relative inline-block"
    >
      <Component className={cn(className)}>{text}</Component>
      <motion.div
        className="absolute bottom-0 left-0 h-[8px] bg-blue-500/20"
        initial={{ width: 0 }}
        animate={isAnimated ? { width: "100%" } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </motion.div>
  )
}

interface AnimatedParagraphProps {
  children: React.ReactNode
  className?: string
  animation?: "fade" | "lines"
  delay?: number
  duration?: number
}

export function AnimatedParagraph({
  children,
  className,
  animation = "fade",
  delay = 0,
  duration = 0.5,
}: AnimatedParagraphProps) {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [controls, isInView])

  const fadeVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        delay,
        ease: "easeOut",
      },
    },
  }

  if (animation === "lines") {
    return <LineByLineAnimation text={children?.toString() || ""} className={cn(className)} delay={delay} />
  }

  return (
    <motion.p ref={ref} initial="hidden" animate={controls} variants={fadeVariants} className={cn(className)}>
      {children}
    </motion.p>
  )
}

interface LineByLineAnimationProps {
  text: string
  className?: string
  delay?: number
}

function LineByLineAnimation({ text, className, delay = 0 }: LineByLineAnimationProps) {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [controls, isInView])

  const lines = text.split("\n")

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: delay,
      },
    },
  }

  const lineVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  return (
    <motion.div ref={ref} variants={containerVariants} initial="hidden" animate={controls} className={cn(className)}>
      {lines.map((line, index) => (
        <motion.p key={index} variants={lineVariants} className="mb-4 last:mb-0">
          {line}
        </motion.p>
      ))}
    </motion.div>
  )
}

export function GradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-gradient", className)}>{children}</span>
}
